#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${CRYSTALBIO_STAGING_POSTGRES_URL:-}" ]]; then
  echo "Missing CRYSTALBIO_STAGING_POSTGRES_URL" >&2
  exit 2
fi

SOURCE="${1:-}"
if [[ -z "$SOURCE" ]]; then
  SOURCE="${CRYSTALBIO_STAGING_SOURCE_JSON:-}"
fi
if [[ -z "$SOURCE" || ! -f "$SOURCE" ]]; then
  echo "Usage: CRYSTALBIO_STAGING_POSTGRES_URL=... $0 /secure/copied-crystalbio-db.json" >&2
  exit 2
fi

WORKDIR="${CRYSTALBIO_STAGING_WORKDIR:-/tmp/crystalbio-managed-staging-$(date +%Y%m%d%H%M%S)}"
mkdir -p "$WORKDIR"
chmod 700 "$WORKDIR"

cp "$SOURCE" "$WORKDIR/source-copy.json"
chmod 600 "$WORKDIR/source-copy.json"

node scripts/inventory-crystalbio-db.mjs --json "$WORKDIR/source-inventory.json" >/dev/null
node scripts/stage-crystalbio-postgres-migration.mjs \
  --source "$WORKDIR/source-copy.json" \
  --summary-json "$WORKDIR/migration-summary.json" \
  --sql "$WORKDIR/migration.sql" \
  --allow-sensitive-sql >/dev/null

if grep -q 'data:image' "$WORKDIR/migration.sql"; then
  echo "Refusing managed migration: embedded image bytes found in SQL." >&2
  exit 1
fi

run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$CRYSTALBIO_STAGING_POSTGRES_URL" -v ON_ERROR_STOP=1 "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm -i postgres:16-alpine psql "$CRYSTALBIO_STAGING_POSTGRES_URL" -v ON_ERROR_STOP=1 "$@"
  else
    echo "Missing psql or Docker PostgreSQL client." >&2
    exit 2
  fi
}

run_psql -c "drop schema if exists public cascade; create schema public;" >/dev/null
run_psql < db/postgres/schema.sql >/dev/null
run_psql < "$WORKDIR/migration.sql" >/dev/null
run_psql -t -A -F, -c "select 'agents', count(*) from agents union all select 'sessions', count(*) from login_sessions union all select 'attendance', count(*) from attendance_records union all select 'sales', count(*) from sales_opportunities union all select 'salesVisits', count(*) from sales_visit_updates union all select 'service', count(*) from service_records union all select 'serviceVisits', count(*) from service_visit_updates union all select 'leaveRequests', count(*) from leave_requests union all select 'fileAttachments', count(*) from file_attachments order by 1;" > "$WORKDIR/postgres-counts.csv"

python3 - "$WORKDIR" <<'PY'
import csv,json,pathlib,sys
p=pathlib.Path(sys.argv[1])
summary=json.loads((p/'migration-summary.json').read_text())
source=summary['sourceCounts']
pg={k:int(v) for k,v in csv.reader((p/'postgres-counts.csv').read_text().splitlines())}
expected={
 'agents':source['agents'],
 'sessions':source['sessions'],
 'attendance':source['attendance'],
 'sales':source['sales'],
 'salesVisits':source['salesVisits'],
 'service':source['service'],
 'serviceVisits':source['serviceVisits'],
 'leaveRequests':source['leaveRequests'],
 'fileAttachments':source['photos']['totalVisitAttachments'],
}
missing={k:(expected[k],pg.get(k)) for k in expected if pg.get(k)!=expected[k]}
if missing:
    raise SystemExit(f'count_mismatch {missing}')
print('managed_staging_migration_counts_match', json.dumps(expected, sort_keys=True))
print('managed_staging_workdir', p)
PY
