# CrystalBio Managed Staging Setup Gate

Status: ready to run after external managed infrastructure credentials are supplied. No live app or live database is changed by this document.

## Goal

Move the already-passed local rehearsal into real managed staging:

1. Managed PostgreSQL staging database.
2. Private Cloudflare R2 bucket for photo/file storage.
3. Copied-backup migration rehearsal with count comparison.
4. Staging app QA before any live cutover.

## What is already ready in the repo

- `db/postgres/schema.sql` — PostgreSQL staging schema.
- `scripts/stage-crystalbio-postgres-migration.mjs` — copied-backup JSON → SQL generator.
- `scripts/rehearse-crystalbio-photo-migration.mjs` — local photo extraction rehearsal.
- `scripts/check-managed-staging-env.mjs` — redacted environment readiness check.
- `scripts/provision-cloudflare-r2-staging.mjs` — creates/verifies the R2 bucket when Cloudflare credentials are available.
- `scripts/run-managed-postgres-staging-rehearsal.sh` — applies schema + migration to managed PostgreSQL and compares counts.

## Required external values

Do not commit these values to git or paste them into docs/chats.

### PostgreSQL

- `CRYSTALBIO_STAGING_POSTGRES_URL`
  - A managed PostgreSQL connection string for staging only.
  - Must not point to live production.

### Cloudflare R2

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
  - Token should be scoped only to R2 bucket management for the staging account where possible.
- `CRYSTALBIO_R2_BUCKET`
  - Suggested: `crystalbio-staging-photos`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `CRYSTALBIO_R2_ENDPOINT`
  - Example shape only: `https://<account-id>.r2.cloudflarestorage.com`

## Safe command sequence

From `/root/workspace/CrystalBio`, after setting environment values in the shell/session only:

```bash
npm run stage:check-managed
npm run stage:provision-r2
npm run stage:migrate:managed-postgres -- /secure/copied-crystalbio-db.json
```

Safety expectations:

- The source must be a copied JSON backup, not the actively written live JSON file.
- The managed PostgreSQL URL must be staging-only.
- The script resets the staging database schema; never use it with live production credentials.
- The SQL generator refuses to write SQL unless explicit staging mode is used.
- Embedded image bytes are not allowed in the SQL output.

## Passing result expected

The managed PostgreSQL count check should match the current copied-source counts:

- agents
- sessions
- attendance records
- sales records
- sales visit updates
- service records
- service visit updates
- leave requests
- file attachments

After this passes, the next gate is a staging backend/app URL for Bloom QA.
