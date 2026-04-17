#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Verscienta Health — Backup Script (Directus + MeiliSearch)
#
# Replaces scripts/backup.sh for the new Directus stack.
#
# Usage:
#   ./scripts/backup-new.sh          # Daily incremental
#   ./scripts/backup-new.sh --full   # Weekly full backup
#
# Cron:
#   0 2 * * *   /opt/verscienta/scripts/backup-new.sh
#   0 3 * * 0   /opt/verscienta/scripts/backup-new.sh --full
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/verscienta/backups}"
S3_BUCKET="${S3_BUCKET:-}"
DB_CONTAINER="${DB_CONTAINER:-verscienta_db}"
DIRECTUS_CONTAINER="${DIRECTUS_CONTAINER:-verscienta_directus}"
MEILI_CONTAINER="${MEILI_CONTAINER:-verscienta_meilisearch}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

DATE=$(date +%Y-%m-%d_%H%M%S)
FULL="${1:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/files" "${BACKUP_DIR}/meili"

# ── Database backup ──────────────────────────────────────────────────────────
log "Backing up MariaDB database..."
docker exec "${DB_CONTAINER}" mysqldump \
    -u root -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    verscienta_directus \
    | gzip > "${BACKUP_DIR}/db/directus_${DATE}.sql.gz"

DB_SIZE=$(du -sh "${BACKUP_DIR}/db/directus_${DATE}.sql.gz" | cut -f1)
log "Database backup: ${DB_SIZE}"

# ── Directus uploads backup (weekly only or --full) ──────────────────────────
if [ "${FULL}" = "--full" ]; then
    log "Backing up Directus uploads..."
    docker exec "${DIRECTUS_CONTAINER}" tar -czf - /directus/uploads \
        > "${BACKUP_DIR}/files/uploads_${DATE}.tar.gz" 2>/dev/null || {
        log "Warning: Could not backup uploads (container may not have tar)"
        # Fallback: copy from volume
        docker cp "${DIRECTUS_CONTAINER}:/directus/uploads" "/tmp/verscienta_uploads_${DATE}" 2>/dev/null || true
        if [ -d "/tmp/verscienta_uploads_${DATE}" ]; then
            tar -czf "${BACKUP_DIR}/files/uploads_${DATE}.tar.gz" -C /tmp "verscienta_uploads_${DATE}"
            rm -rf "/tmp/verscienta_uploads_${DATE}"
        fi
    }

    FILES_SIZE=$(du -sh "${BACKUP_DIR}/files/uploads_${DATE}.tar.gz" 2>/dev/null | cut -f1 || echo "0")
    log "Uploads backup: ${FILES_SIZE}"

    # MeiliSearch data backup
    log "Backing up MeiliSearch data..."
    docker exec "${MEILI_CONTAINER}" tar -czf - /meili_data \
        > "${BACKUP_DIR}/meili/meili_${DATE}.tar.gz" 2>/dev/null || {
        log "Warning: MeiliSearch backup skipped"
    }
fi

# ── Upload to S3 (optional) ─────────────────────────────────────────────────
if [ -n "${S3_BUCKET}" ]; then
    log "Uploading to S3: ${S3_BUCKET}..."
    aws s3 cp "${BACKUP_DIR}/db/directus_${DATE}.sql.gz" \
        "s3://${S3_BUCKET}/db/directus_${DATE}.sql.gz" \
        --storage-class STANDARD_IA 2>/dev/null || log "Warning: S3 upload failed for DB"

    if [ "${FULL}" = "--full" ]; then
        aws s3 cp "${BACKUP_DIR}/files/uploads_${DATE}.tar.gz" \
            "s3://${S3_BUCKET}/files/uploads_${DATE}.tar.gz" \
            --storage-class STANDARD_IA 2>/dev/null || log "Warning: S3 upload failed for files"
    fi
fi

# ── Retention cleanup ───────────────────────────────────────────────────────
log "Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# ── Summary ─────────────────────────────────────────────────────────────────
TOTAL=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "Backup complete. Total backup dir size: ${TOTAL}"
