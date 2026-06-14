#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${CRYSTALBIO_DB_PATH:-/var/lib/crystalbio/crystalbio-db.json}"
BACKUP_DIR="${CRYSTALBIO_BACKUP_DIR:-/var/backups/crystalbio}"
RETENTION_DAYS="${CRYSTALBIO_BACKUP_RETENTION_DAYS:-14}"

if [[ ! -f "$DB_PATH" ]]; then
  echo "CrystalBio backup failed: DB not found at $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/crystalbio-db-$stamp.json.gz"
gzip -c "$DB_PATH" > "$out"
chmod 600 "$out"
find "$BACKUP_DIR" -type f -name 'crystalbio-db-*.json.gz' -mtime +"$RETENTION_DAYS" -delete
printf 'CrystalBio backup OK: %s\n' "$out"
