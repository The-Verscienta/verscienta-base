#!/usr/bin/env python3
"""
PubChem enrichment script.

Queries PubChem via PubChemPy for molecular data and patches Drupal nodes.

Usage:
    python enrich_pubchem.py                    # Enrich all ingredients with CIDs
    python enrich_pubchem.py --dry-run
    python enrich_pubchem.py --limit=100        # Process first 100
    python enrich_pubchem.py --herbs-too        # Also enrich herb nodes
"""

import argparse
import sys
import time

import pubchempy as pcp
from tqdm import tqdm

from config import DRY_RUN, PUBCHEM_RATE_LIMIT
from drupal_client import DrupalClient
from utils import IngestStats, RateLimiter, setup_logging

logger = setup_logging("enrich-pubchem")


def fetch_pubchem_data(cid: int) -> dict | None:
    """Query PubChem by CID and return enrichment data."""
    try:
        compounds = pcp.get_compounds(cid, "cid")
        if not compounds:
            return None
        c = compounds[0]
        return {
            "canonical_smiles": c.canonical_smiles,
            "molecular_weight": c.molecular_weight,
            "molecular_formula": c.molecular_formula,
            "iupac_name": c.iupac_name,
            "xlogp": c.xlogp,
        }
    except Exception as e:
        logger.warning("PubChem query failed for CID %d: %s", cid, e)
        return None


def enrich_ingredients(client: DrupalClient, rate_limiter: RateLimiter, stats: IngestStats, limit: int | None):
    """Enrich tcm_ingredient nodes that have pubchem_cid but missing SMILES/MW."""
    logger.info("Fetching tcm_ingredient nodes with PubChem CIDs...")

    # Fetch ingredients page by page
    page = 0
    page_size = 50
    enriched = 0

    while True:
        if limit and enriched >= limit:
            break

        results = client.search(
            "tcm_ingredient",
            {"field_pubchem_cid[condition][operator]": "IS NOT NULL"},
            page_limit=page_size,
        )

        if not results:
            break

        for node in results:
            if limit and enriched >= limit:
                break

            stats.processed += 1
            attrs = node.get("attributes", {})
            cid = attrs.get("field_pubchem_cid")
            existing_smiles = attrs.get("field_smiles")
            existing_mw = attrs.get("field_molecular_weight")

            # Skip if already enriched
            if existing_smiles and existing_mw:
                stats.skipped += 1
                continue

            if not cid:
                stats.skipped += 1
                continue

            rate_limiter.wait()
            pubchem_data = fetch_pubchem_data(int(cid))
            if not pubchem_data:
                stats.skipped += 1
                continue

            # Build patch attributes
            patch_attrs: dict = {}
            if not existing_smiles and pubchem_data.get("canonical_smiles"):
                patch_attrs["field_smiles"] = pubchem_data["canonical_smiles"]
            if not existing_mw and pubchem_data.get("molecular_weight"):
                patch_attrs["field_molecular_weight"] = pubchem_data["molecular_weight"]

            if patch_attrs:
                try:
                    client.update("tcm_ingredient", node["id"], patch_attrs)
                    stats.updated += 1
                    enriched += 1
                except Exception as e:
                    stats.errors.append(f"Ingredient {node['id']}: {e}")
                    logger.error("Error enriching ingredient: %s", e)
            else:
                stats.skipped += 1

        page += 1
        if len(results) < page_size:
            break


def enrich_herbs(client: DrupalClient, rate_limiter: RateLimiter, stats: IngestStats, limit: int | None):
    """Enrich herb nodes that have pubchem_cid."""
    logger.info("Fetching herb nodes with PubChem CIDs...")

    results = client.search(
        "herb",
        {"field_pubchem_cid[condition][operator]": "IS NOT NULL"},
        page_limit=100,
    )

    enriched = 0
    for node in tqdm(results, desc="Herbs (PubChem)", disable=None):
        if limit and enriched >= limit:
            break

        stats.processed += 1
        attrs = node.get("attributes", {})
        cid = attrs.get("field_pubchem_cid")
        if not cid:
            stats.skipped += 1
            continue

        existing_smiles = attrs.get("field_smiles")
        existing_mw = attrs.get("field_molecular_weight")
        if existing_smiles and existing_mw:
            stats.skipped += 1
            continue

        rate_limiter.wait()
        pubchem_data = fetch_pubchem_data(int(cid))
        if not pubchem_data:
            stats.skipped += 1
            continue

        patch_attrs: dict = {}
        if not existing_smiles and pubchem_data.get("canonical_smiles"):
            patch_attrs["field_smiles"] = pubchem_data["canonical_smiles"]
        if not existing_mw and pubchem_data.get("molecular_weight"):
            patch_attrs["field_molecular_weight"] = pubchem_data["molecular_weight"]

        if patch_attrs:
            try:
                client.update("herb", node["id"], patch_attrs)
                stats.updated += 1
                enriched += 1
            except Exception as e:
                stats.errors.append(f"Herb {node['id']}: {e}")
        else:
            stats.skipped += 1


def main():
    parser = argparse.ArgumentParser(description="Enrich TCM data with PubChem molecular info")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--limit", type=int, default=None, help="Max records to enrich")
    parser.add_argument("--herbs-too", action="store_true", help="Also enrich herb nodes")
    args = parser.parse_args()

    dry_run = args.dry_run or DRY_RUN
    if dry_run:
        logger.info("DRY RUN mode")

    logger.info("Starting PubChem enrichment")
    stats = IngestStats()
    rate_limiter = RateLimiter(PUBCHEM_RATE_LIMIT)

    with DrupalClient(dry_run=dry_run) as client:
        enrich_ingredients(client, rate_limiter, stats, args.limit)

        if args.herbs_too:
            enrich_herbs(client, rate_limiter, stats, args.limit)

        stats.log_summary(logger)
        error_text = "\n".join(stats.errors) if stats.errors else ""
        client.create_import_log(
            source_db="PubChem",
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
