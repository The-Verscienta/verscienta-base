#!/usr/bin/env python3
"""
BATMAN-TCM 2.0 data ingestion script.

Reads BATMAN-TCM predicted interaction data and creates tcm_target_interaction
nodes in Drupal with evidence_type='predicted'.

Usage:
    python ingest_batman.py
    python ingest_batman.py --dry-run
    python ingest_batman.py --min-score=20
"""

import argparse
import os
import sys

from tqdm import tqdm

from config import DATA_DIR, DRY_RUN
from drupal_client import DrupalClient
from field_mapper import map_batman_interaction
from utils import IngestStats, read_csv, safe_float, setup_logging

logger = setup_logging("ingest-batman")


def find_batman_csv() -> str | None:
    """Locate the BATMAN-TCM data file."""
    candidates = [
        "batman_tcm.csv",
        "batman-tcm.csv",
        "BATMAN_TCM.csv",
        "batman_interactions.csv",
    ]
    for name in candidates:
        path = os.path.join(DATA_DIR, name)
        if os.path.exists(path):
            return path
    return None


def ingest_batman(client: DrupalClient, min_score: float, stats: IngestStats):
    """Ingest BATMAN-TCM predicted interactions."""
    filepath = find_batman_csv()
    if not filepath:
        logger.error("No BATMAN-TCM CSV found in %s", DATA_DIR)
        logger.info("Expected filenames: batman_tcm.csv, batman-tcm.csv, etc.")
        return

    rows = read_csv(filepath)
    logger.info("Processing %d BATMAN-TCM interactions (min_score=%.1f)", len(rows), min_score)

    for row in tqdm(rows, desc="BATMAN-TCM", disable=None):
        stats.processed += 1
        try:
            # Filter by score
            score = safe_float(row.get("score"))
            if score is not None and score < min_score:
                stats.skipped += 1
                continue

            attrs = map_batman_interaction(row)

            # Try to link to existing herb by name
            relationships = {}
            herb_name = row.get("herb_name", "").strip()
            if herb_name:
                existing_herb = client.find_by_field("herb", "title", herb_name)
                if existing_herb:
                    relationships.update(
                        client.build_relationship("field_herb_ref", "herb", existing_herb["id"])
                    )

            # Try to link to existing ingredient by name
            ingredient_name = row.get("ingredient_name", "").strip()
            if ingredient_name:
                existing_ingredient = client.find_by_field("tcm_ingredient", "title", ingredient_name)
                if existing_ingredient:
                    relationships.update(
                        client.build_relationship("field_ingredient_ref", "tcm_ingredient", existing_ingredient["id"])
                    )

            result = client.create("tcm_target_interaction", attrs, relationships or None)
            if result:
                stats.created += 1
            else:
                stats.skipped += 1

        except Exception as e:
            stats.errors.append(f"BATMAN row {stats.processed}: {e}")
            logger.error("Error: %s", e)

    stats.log_summary(logger)


def main():
    parser = argparse.ArgumentParser(description="Ingest BATMAN-TCM 2.0 interactions")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--min-score", type=float, default=20.0, help="Minimum confidence score (default: 20)")
    args = parser.parse_args()

    dry_run = args.dry_run or DRY_RUN
    if dry_run:
        logger.info("DRY RUN mode")

    logger.info("Starting BATMAN-TCM ingestion")
    stats = IngestStats()

    with DrupalClient(dry_run=dry_run) as client:
        ingest_batman(client, args.min_score, stats)

        error_text = "\n".join(stats.errors) if stats.errors else ""
        client.create_import_log(
            source_db="BATMAN-TCM",
            records_processed=stats.processed,
            records_created=stats.created,
            records_updated=stats.updated,
            records_skipped=stats.skipped,
            errors=error_text,
            duration_seconds=stats.duration_seconds,
        )

    return 0 if not stats.errors else 1


if __name__ == "__main__":
    sys.exit(main())
