# TCM Data Ingestion Pipeline

Standalone Python CLI scripts that ingest Traditional Chinese Medicine data from academic databases into the Verscienta Drupal 11 backend via JSON:API.

## Prerequisites

- Python 3.12+
- Drupal backend running (`docker compose up drupal postgres` or `ddev start`)
- TCM content types created (`bash setup-tcm-content-types.sh` from project root)

## Setup

```bash
cd scripts/tcm-ingest
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file (or set environment variables):

```bash
# Drupal connection
DRUPAL_BASE_URL=https://backend.ddev.site
DRUPAL_AUTH_USER=admin
DRUPAL_AUTH_PASS=admin
# Or use OAuth token:
# DRUPAL_AUTH_TOKEN=your-bearer-token

# Optional settings
INGEST_BATCH_SIZE=50
INGEST_RATE_LIMIT=5
```

## Data Download

1. Download HERB 2.0 data from http://herb.ac.cn/Download
2. Unzip into `data/` directory:
   ```
   data/
   ├── herbs.csv
   ├── ingredients.csv
   ├── herb_ingredient.csv
   ├── targets.csv (or ingredient_target.csv)
   ├── formulae.csv
   ├── clinical_trials.csv
   └── experiments.csv
   ```
3. (Optional) Download BATMAN-TCM 2.0 from http://bionet.ncpsb.org.cn/batman-tcm into `data/batman_tcm.csv`

## Usage

### HERB 2.0 Ingestion

```bash
# Full ingest
python ingest_herb2.py

# Dry run (preview without writing)
python ingest_herb2.py --dry-run

# Only herbs (skip ingredients, targets, evidence)
python ingest_herb2.py --herbs-only

# Delta mode (for re-runs — only new/changed rows)
python ingest_herb2.py --mode=delta
```

### BATMAN-TCM Ingestion

```bash
# Ingest predicted interactions
python ingest_batman.py

# Only high-confidence predictions
python ingest_batman.py --min-score=30

# Dry run
python ingest_batman.py --dry-run
```

### PubChem Enrichment

Run after initial ingestion to fill in molecular data:

```bash
# Enrich ingredients with PubChem data
python enrich_pubchem.py

# Also enrich herb nodes
python enrich_pubchem.py --herbs-too

# Limit to first 100 records
python enrich_pubchem.py --limit=100
```

## Validation

After ingestion, verify:

1. **Drupal admin**: Check content overview for new TCM content
2. **JSON:API**: `curl https://backend.ddev.site/jsonapi/node/herb?filter[field_herb2_id]=1`
3. **Ingredients**: `curl https://backend.ddev.site/jsonapi/node/tcm_ingredient?page[limit]=5`
4. **Import logs**: `curl https://backend.ddev.site/jsonapi/node/import_log?sort=-created`

## Architecture

```
config.py          — Environment variables and settings
drupal_client.py   — JSON:API client (search, create, update, upsert)
field_mapper.py    — CSV column → Drupal field mappings
utils.py           — Logging, CSV reader, rate limiter, stats tracker
ingest_herb2.py    — Main HERB 2.0 ingestion
ingest_batman.py   — BATMAN-TCM predicted interactions
enrich_pubchem.py  — PubChem molecular enrichment
```

## Logs

Logs are written to `logs/` directory with timestamps. Check import_log content type in Drupal for per-run statistics.
