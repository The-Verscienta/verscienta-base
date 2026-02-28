#!/usr/bin/env bash
# Verscienta Health — backup script
#
# Backs up:
#   1. MariaDB database  (daily gzip SQL dump)
#   2. Drupal files      (weekly tar.gz of sites/default/files + private/)
#
# Usage (cron):
#   0 2 * * *   /opt/verscienta/scripts/backup.sh          # daily at 02:00
#   0 3 * * 0   /opt/verscienta/scripts/backup.sh --full   # weekly full backup
#
# Environment variables (set in cron or sourced from .env.prod):
#   BACKUP_DIR          Where to store backups (default: /var/backups/verscienta)
#   S3_BUCKET           Optional: s3://bucket/path for offsite upload
#   DB_CONTAINER        MariaDB container name (default: verscienta_db)
#   DRUPAL_CONTAINER    Drupal container name  (default: verscienta_drupal)
#   MYSQL_ROOT_PASSWORD MariaDB root password
#   DRUPAL_DATABASE_NAME Database name         (default: verscienta_drupal)
#   RETENTION_DAYS      Days to keep local backups (default: 14)
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/verscienta}"
DB_CONTAINER="${DB_CONTAINER:-verscienta_db}"
DRUPAL_CONTAINER="${DRUPAL_CONTAINER:-verscienta_drupal}"
DB_NAME="${DRUPAL_DATABASE_NAME:-verscienta_drupal}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FULL_BACKUP="${1:-}"   # pass --full for file backup too

mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/files" "${BACKUP_DIR}/logs"
LOG="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG}"; }

# ─── Database backup ──────────────────────────────────────────────────────────
log "Starting database backup..."
DB_FILE="${BACKUP_DIR}/db/db_${TIMESTAMP}.sql.gz"

docker exec "${DB_CONTAINER}" \
    mysqldump \
    --user=root \
    --password="${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --no-tablespaces \
    "${DB_NAME}" \
  | gzip -9 > "${DB_FILE}"

DB_SIZE=$(du -sh "${DB_FILE}" | cut -f1)
log "Database backup complete: ${DB_FILE} (${DB_SIZE})"

# ─── Files backup (weekly or --full) ─────────────────────────────────────────
if [ "${FULL_BACKUP}" = "--full" ]; then
    log "Starting Drupal files backup..."
    FILES_FILE="${BACKUP_DIR}/files/files_${TIMESTAMP}.tar.gz"

    docker exec "${DRUPAL_CONTAINER}" \
        tar -czf - \
            /var/www/html/web/sites/default/files \
            /var/www/html/private \
            2>/dev/null \
      > "${FILES_FILE}"

    FILES_SIZE=$(du -sh "${FILES_FILE}" | cut -f1)
    log "Files backup complete: ${FILES_FILE} (${FILES_SIZE})"
fi

# ─── Upload to S3 (optional) ─────────────────────────────────────────────────
if [ -n "${S3_BUCKET:-}" ]; then
    log "Uploading to ${S3_BUCKET}..."
    aws s3 cp "${DB_FILE}" "${S3_BUCKET}/db/" \
        --storage-class STANDARD_IA \
        --quiet \
        && log "Database uploaded to S3."

    if [ "${FULL_BACKUP}" = "--full" ] && [ -n "${FILES_FILE:-}" ]; then
        aws s3 cp "${FILES_FILE}" "${S3_BUCKET}/files/" \
            --storage-class STANDARD_IA \
            --quiet \
            && log "Files uploaded to S3."
    fi
fi

# ─── Prune old local backups ──────────────────────────────────────────────────
log "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}/db"    -name "db_*.sql.gz"   -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/files" -name "files_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}/logs"  -name "backup_*.log"   -mtime "+${RETENTION_DAYS}" -delete

log "Backup finished."

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Backup Summary ==="
echo "  Timestamp : ${TIMESTAMP}"
echo "  DB file   : ${DB_FILE} (${DB_SIZE})"
if [ "${FULL_BACKUP}" = "--full" ] && [ -n "${FILES_FILE:-}" ]; then
echo "  Files     : ${FILES_FILE} (${FILES_SIZE})"
fi
echo "  Log       : ${LOG}"
echo "===================="
