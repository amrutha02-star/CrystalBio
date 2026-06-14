#!/usr/bin/env bash
set -euo pipefail

API_URL="${CRYSTALBIO_API_URL:-https://work-api.convogenie.ai/health}"
DB_PATH="${CRYSTALBIO_DB_PATH:-/var/lib/crystalbio/crystalbio-db.json}"

health="$(curl -fsS --max-time 10 "$API_URL")"
python3 - <<'PY' "$health" "$DB_PATH"
import json, os, sys, time
health_raw, db_path = sys.argv[1], sys.argv[2]
health = json.loads(health_raw)
if health.get('status') != 'ok':
    raise SystemExit(f"API unhealthy: {health_raw}")
if not os.path.exists(db_path):
    raise SystemExit(f"DB missing: {db_path}")
size = os.path.getsize(db_path)
if size <= 0:
    raise SystemExit(f"DB empty: {db_path}")
with open(db_path) as f:
    data = json.load(f)
print(f"CrystalBio monitor OK: api=ok db_bytes={size} agents={len(data.get('agents', []))} sales={len(data.get('sales', []))} service={len(data.get('service', []))}")
PY
