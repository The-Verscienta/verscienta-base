#!/bin/bash
#
# Monthly TCM data refresh
#
# Cron schedule: 0 5 1 * * (1st of month, 5 AM)
# Example crontab entry:
#   0 5 1 * * /path/to/scripts/tcm-ingest/cron-update.sh
#
# HERB 2.0 does not offer a change API, so this re-runs the idempotent
# ingest script which will skip unchanged records and only create/update
# new or modified entries.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/cron-$(date +%Y%m).log"

echo "========================================" | tee -a "$LOG_FILE"
echo "TCM data refresh: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$SCRIPT_DIR"

# Activate venv if present
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

# Run HERB 2.0 ingest in delta mode
echo "Running HERB 2.0 delta ingest..." | tee -a "$LOG_FILE"
python ingest_herb2.py --mode=delta 2>&1 | tee -a "$LOG_FILE"

# Run PubChem enrichment for any new ingredients
echo "Running PubChem enrichment..." | tee -a "$LOG_FILE"
python enrich_pubchem.py --limit=500 2>&1 | tee -a "$LOG_FILE"

echo "Done: $(date)" | tee -a "$LOG_FILE"
