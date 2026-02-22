#!/usr/bin/env python3
"""
HERB 2.0 data ingestion script.

Reads HERB 2.0 CSV files from data/ directory and upserts into Drupal via JSON:API.

Usage:
    python ingest_herb2.py                  # Full ingest
    python ingest_herb2.py --dry-run        # Preview without writing
    python ingest_herb2.py --mode=delta     # Only process new/changed rows
    python ingest_herb2.py --herbs-only     # Only process herbs.csv
"""

import argparse
import os
import sys

from tqdm import tqdm

from config import BATCH_SIZE, DATA_DIR, DRY_RUN
from drupal_client import DrupalClient
from field_mapper import (
    map_clinical_evidence,
    map_herb,
    map_ingredient,
    map_target_interaction,
)
from utils import IngestStats, read_csv, safe_int, setup_logging

logger = setup_logging("ingest-herb2")


def ingest_herbs(client: DrupalClient, stats: IngestStats):
    """Ingest herbs.csv into Drupal herb content type."""
    filepath = os.path.join(DATA_DIR, "herbs.csv")
    if not os.path.exists(filepath):
        logger.warning("herbs.csv not found at %s — skipping", filepath)
        return {}

    rows = read_csv(filepath)
    logger.info("Processing %d herbs from herbs.csv", len(rows))

    herb_id_map: dict[int, str] = {}  # herb2_id -> drupal UUID

    for row in tqdm(rows, desc="Herbs", disable=None):
        stats.processed += 1
        try:
            attrs = map_herb(row)
            herb2_id = attrs.get("field_herb2_id")
            if herb2_id is None:
                stats.skipped += 1
                continue

            result, action = client.upsert(
                "herb", "field_herb2_id", herb2_id, attrs
            )
            if action == "created":
                stats.created += 1
            elif action == "updated":
                stats.updated += 1
            else:
                stats.skipped += 1

            if result:
                herb_id_map[herb2_id] = result["id"]

        except Exception as e:
            stats.errors.append(f"Herb row {stats.processed}: {e}")
            logger.error("Error processing herb row %d: %s", stats.processed, e)

    logger.info("Herbs: %d created, %d updated", stats.created, stats.updated)
    return herb_id_map


def ingest_ingredients(client: DrupalClient, herb_id_map: dict[int, str], stats: IngestStats):
    """Ingest ingredients.csv into Drupal tcm_ingredient content type."""
    filepath = os.path.join(DATA_DIR, "ingredients.csv")
    if not os.path.exists(filepath):
        logger.warning("ingredients.csv not found — skipping")
        return {}

    rows = read_csv(filepath)
    logger.info("Processing %d ingredients", len(rows))

    ingredient_id_map: dict[int, str] = {}  # ingredient_id -> drupal UUID

    for row in tqdm(rows, desc="Ingredients", disable=None):
        stats.processed += 1
        try:
            attrs = map_ingredient(row)
            ingredient_id = attrs.get("field_ingredient_id")
            if ingredient_id is None:
                stats.skipped += 1
                continue

            result, action = client.upsert(
                "tcm_ingredient", "field_ingredient_id", ingredient_id, attrs
            )
            if action == "created":
                stats.created += 1
            elif action == "updated":
                stats.updated += 1
            else:
                stats.skipped += 1

            if result:
                ingredient_id_map[ingredient_id] = result["id"]

        except Exception as e:
            stats.errors.append(f"Ingredient row {stats.processed}: {e}")
            logger.error("Error processing ingredient: %s", e)

    return ingredient_id_map


def ingest_herb_ingredient_links(
    client: DrupalClient,
    herb_id_map: dict[int, str],
    ingredient_id_map: dict[int, str],
    stats: IngestStats,
):
    """Link herbs to ingredients using herb_ingredient.csv mapping."""
    filepath = os.path.join(DATA_DIR, "herb_ingredient.csv")
    if not os.path.exists(filepath):
        logger.warning("herb_ingredient.csv not found — skipping links")
        return

    rows = read_csv(filepath)
    logger.info("Processing %d herb-ingredient links", len(rows))

    # Group by ingredient to batch-update herb_sources
    ingredient_herbs: dict[int, list[str]] = {}
    for row in rows:
        herb_id = safe_int(row.get("herb_id"))
        ingredient_id = safe_int(row.get("ingredient_id"))
        if herb_id and ingredient_id:
            herb_uuid = herb_id_map.get(herb_id)
            if herb_uuid:
                ingredient_herbs.setdefault(ingredient_id, []).append(herb_uuid)

    for ingredient_id, herb_uuids in tqdm(ingredient_herbs.items(), desc="Links", disable=None):
        stats.processed += 1
        drupal_id = ingredient_id_map.get(ingredient_id)
        if not drupal_id:
            stats.skipped += 1
            continue

        try:
            relationships = client.build_multi_relationship("field_herb_sources", "herb", herb_uuids)
            client.update("tcm_ingredient", drupal_id, {}, relationships)
            stats.updated += 1
        except Exception as e:
            stats.errors.append(f"Link ingredient {ingredient_id}: {e}")
            logger.error("Error linking ingredient %d: %s", ingredient_id, e)


def ingest_targets(
    client: DrupalClient,
    herb_id_map: dict[int, str],
    ingredient_id_map: dict[int, str],
    stats: IngestStats,
):
    """Ingest target interactions from ingredient_target.csv."""
    filepath = os.path.join(DATA_DIR, "ingredient_target.csv")
    if not os.path.exists(filepath):
        # Try alternate filename
        filepath = os.path.join(DATA_DIR, "targets.csv")
    if not os.path.exists(filepath):
        logger.warning("No target CSV found — skipping")
        return

    rows = read_csv(filepath)
    logger.info("Processing %d target interactions", len(rows))

    for row in tqdm(rows, desc="Targets", disable=None):
        stats.processed += 1
        try:
            attrs = map_target_interaction(row)

            # Build relationships
            relationships = {}
            ingredient_id = safe_int(row.get("ingredient_id"))
            if ingredient_id and ingredient_id in ingredient_id_map:
                relationships.update(
                    client.build_relationship("field_ingredient_ref", "tcm_ingredient", ingredient_id_map[ingredient_id])
                )

            herb_id = safe_int(row.get("herb_id"))
            if herb_id and herb_id in herb_id_map:
                relationships.update(
                    client.build_relationship("field_herb_ref", "herb", herb_id_map[herb_id])
                )

            result = client.create("tcm_target_interaction", attrs, relationships or None)
            if result:
                stats.created += 1
            else:
                stats.skipped += 1

        except Exception as e:
            stats.errors.append(f"Target row {stats.processed}: {e}")
            logger.error("Error processing target: %s", e)


def ingest_clinical_evidence(client: DrupalClient, herb_id_map: dict[int, str], stats: IngestStats):
    """Ingest clinical trials/experiments."""
    for filename in ("clinical_trials.csv", "experiments.csv"):
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            logger.info("%s not found — skipping", filename)
            continue

        rows = read_csv(filepath)
        logger.info("Processing %d rows from %s", len(rows), filename)

        for row in tqdm(rows, desc=filename, disable=None):
            stats.processed += 1
            try:
                attrs = map_clinical_evidence(row)

                # Link to herbs if we can
                relationships = {}
                herb_id = safe_int(row.get("herb_id"))
                if herb_id and herb_id in herb_id_map:
                    relationships.update(
                        client.build_multi_relationship("field_herb_refs", "herb", [herb_id_map[herb_id]])
                    )

                result = client.create("tcm_clinical_evidence", attrs, relationships or None)
                if result:
                    stats.created += 1
                else:
                    stats.skipped += 1

            except Exception as e:
                stats.errors.append(f"{filename} row {stats.processed}: {e}")
                logger.error("Error processing %s: %s", filename, e)


def main():
    parser = argparse.ArgumentParser(description="Ingest HERB 2.0 data into Drupal")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing to Drupal")
    parser.add_argument("--mode", choices=["full", "delta"], default="full", help="Ingestion mode")
    parser.add_argument("--herbs-only", action="store_true", help="Only process herbs.csv")
    args = parser.parse_args()

    dry_run = args.dry_run or DRY_RUN
    if dry_run:
        logger.info("DRY RUN mode — no changes will be written")

    logger.info("Starting HERB 2.0 ingestion (mode=%s)", args.mode)
    logger.info("Data directory: %s", DATA_DIR)

    stats = IngestStats()

    with DrupalClient(dry_run=dry_run) as client:
        # Step 1: Herbs
        herb_id_map = ingest_herbs(client, stats)

        if not args.herbs_only:
            # Step 2: Ingredients
            ingredient_id_map = ingest_ingredients(client, herb_id_map, stats)

            # Step 3: Herb-ingredient links
            ingest_herb_ingredient_links(client, herb_id_map, ingredient_id_map, stats)

            # Step 4: Target interactions
            ingest_targets(client, herb_id_map, ingredient_id_map, stats)

            # Step 5: Clinical evidence
            ingest_clinical_evidence(client, herb_id_map, stats)

        # Write import log
        stats.log_summary(logger)
        error_text = "\n".join(stats.errors) if stats.errors else ""
        client.create_import_log(
            source_db="HERB 2.0",
            records_processed=stats.processed,
            records_created=stats.created,
            records_updated=stats.updated,
            records_skipped=stats.skipped,
            errors=error_text,
            duration_seconds=stats.duration_seconds,
        )

    logger.info("Done.")
    return 0 if not stats.errors else 1


if __name__ == "__main__":
    sys.exit(main())
