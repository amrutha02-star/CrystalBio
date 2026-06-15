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

## 4. Clean test data before handover

Dry-run first:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data
```

Write the cleanup:

```bash
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data -- --write
```

The cleanup keeps user accounts and clears:

- sessions,
- attendance,
- Sales entries,
- Service entries,
- leave requests.

It also writes a `pre-clean` backup before changing the file.
