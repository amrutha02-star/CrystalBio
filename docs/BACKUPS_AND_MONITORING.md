# CrystalBio Backups and Monitoring

This is the high-priority pilot safety setup for the live backend.

## 1. Daily database backups

The backend stores pilot data in the file pointed to by `CRYSTALBIO_DB_PATH`.

Run a daily backup on the server:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json \
CRYSTALBIO_BACKUP_DIR=/var/data/backups \
npm run backup:db
```

Recommended cron entry:

```cron
15 2 * * * cd /path/to/CrystalBio && CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json CRYSTALBIO_BACKUP_DIR=/var/data/backups npm run backup:db >> /var/log/crystalbio-backup.log 2>&1
```

What it does:

- copies the live database to a timestamped `.bak` file,
- keeps backups outside the app bundle,
- removes old backups after 14 days by default,
- exits with an error if the database file is missing.

Retention can be changed with:

```bash
CRYSTALBIO_BACKUP_RETENTION_DAYS=30
```

## 2. Monitoring

The monitor checks:

- API uptime via `/health`,
- optional real login smoke test if monitor credentials are provided,
- optional app-side live-user error logs when `CRYSTALBIO_MONITOR_CLIENT_ERRORS=true` is enabled.

Basic uptime check:

```bash
CRYSTALBIO_API_URL=https://work-api.convogenie.ai npm run monitor:api
```

Uptime + login smoke test:

```bash
CRYSTALBIO_API_URL=https://work-api.convogenie.ai \
CRYSTALBIO_MONITOR_EMAIL=monitor@crystalbio.in \
CRYSTALBIO_MONITOR_PASSWORD='private-password' \
npm run monitor:api
```

Uptime + login + live-user error monitoring for Bloom:

```bash
CRYSTALBIO_API_URL=https://work-api.convogenie.ai \
CRYSTALBIO_MONITOR_EMAIL=monitor@crystalbio.in \
CRYSTALBIO_MONITOR_PASSWORD='private-password' \
CRYSTALBIO_MONITOR_CLIENT_ERRORS=true \
npm run monitor:api
```

App-side live-user errors are written by the backend to `CRYSTALBIO_CLIENT_ERROR_LOG_PATH` or, by default, `data/crystalbio-client-errors.jsonl`. On the live server, keep this outside the app bundle, for example `/var/lib/crystalbio/crystalbio-client-errors.jsonl`. Bloom’s daytime watcher can read this file directly on the server and add serious recent issues to `docs/BUG_INTAKE_BOARD.md`.

Recommended cron entry every 5 minutes:

```cron
*/5 * * * * cd /path/to/CrystalBio && CRYSTALBIO_API_URL=https://work-api.convogenie.ai CRYSTALBIO_MONITOR_EMAIL=monitor@crystalbio.in CRYSTALBIO_MONITOR_PASSWORD='private-password' npm run monitor:api >> /var/log/crystalbio-monitor.log 2>&1
```

For Telegram/email alerts, wire the cron failure output to the server’s alerting method. For the first pilot days, check this log frequently:

```bash
tail -f /var/log/crystalbio-monitor.log
```

## 3. User-action failures to watch manually during pilot days 1–3

Until the next monitoring version adds a full alert dashboard, actively watch for:

- repeated login failures,
- check-in/check-out save errors,
- Sales/Service form save errors,
- leave approval failures,
- PDF report failures,
- blank screens/crashes,
- weak-network retry complaints from agents.

## 4. Clean test data safely

Important launch-week rule: do **not** bulk-delete all submitted field data while real team members are using the app. QA/test Sales, Service, and attendance submissions must not remain mixed with real field work, but cleanup must be narrow and backed up.

Safe approach:

1. Identify only Bloom-created QA records, such as:
   - records owned by Bloom QA accounts,
   - records with obvious Bloom/QA/test names,
   - records whose evidence is already captured in `docs/qa-runs/`.
2. Create a backup before any change.
3. Prefer a soft-hide/quarantine flag from real admin reports before permanent deletion.
4. Bloom may clean up only Bloom-created QA records. Periwinkle/Iris must not delete real-user records or guess based on vague text.

Full pre-handover cleanup is still available when the pilot data must be reset and the team approves it.

Bloom-only dry-run for normal launch-week QA cleanup:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data -- --bloom-only
```

Bloom-only write, only after checking the dry-run output:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data -- --bloom-only --write
```

Full reset dry-run, only for approved handover/reset:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data
```

Full reset write, only for explicitly approved handover/reset. This is intentionally guarded because it logs users out:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data -- --write --reset-all-sessions-and-activity
```

The full reset keeps user accounts and clears:

- login sessions,
- attendance,
- Sales entries,
- Service entries,
- leave requests.

Normal Bloom QA cleanup must use `--bloom-only`; it must not clear real users' login sessions.

It also writes a `pre-clean` backup before changing the file.

Live-backend verification rule learned on 2026-06-23: the backend keeps data in memory while running. For Bloom cleanup on the live JSON backend, do not claim cleanup is complete after only editing/checking the file. Safe sequence is: dry-run, stop backend briefly, run `--bloom-only --write`, restart backend, verify `/health`, then verify the same live user path/API list (for example Bloom agent `/field-visits`) shows zero Bloom rows. This prevents the running backend from writing old in-memory Bloom records back to disk.
