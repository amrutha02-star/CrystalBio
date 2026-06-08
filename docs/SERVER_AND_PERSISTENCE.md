# CrystalBio HTTP Server and Persistence

## Status

A runnable local backend server and JSON persistence layer have been added.

This means the backend can now be exercised through real HTTP requests, and successful changes can be saved to a database file.

## What was added

### JSON database store

File:

- `src/backend/crystalBioPersistence.ts`

Purpose:

- Saves backend state to a JSON file.
- Loads backend state from a JSON file.
- Creates an empty state when the file does not exist.

### HTTP server adapter

File:

- `src/backend/crystalBioHttpServer.ts`

Purpose:

- Wraps the tested API layer in a real Node HTTP server.
- Accepts real HTTP requests.
- Returns JSON responses.
- Handles malformed JSON with a clean `400` response.

### Persistent HTTP app

File:

- `src/backend/crystalBioPersistentHttpApp.ts`

Purpose:

- Loads backend state from database file.
- Runs API through HTTP server.
- Automatically saves after successful `POST` and `PATCH` requests.

### Runnable local server

File:

- `src/backend/server.ts`

Command:

```bash
npm run backend:dev
```

Default local URL:

```text
http://127.0.0.1:8787
```

Default database file:

```text
data/crystalbio-db.json
```

Custom port/database:

```bash
PORT=8797 CRYSTALBIO_DB_PATH=/tmp/crystalbio-live-test.json npm run backend:dev
```

## Demo users

For local testing, the server seeds demo users if the database is empty:

- Admin User
- Rahul Sales
- Meera Service

Disable demo seeding:

```bash
CRYSTALBIO_SEED_DEMO=false npm run backend:dev
```

## Verified manually

Started local backend server with:

```bash
PORT=8797 CRYSTALBIO_DB_PATH=/tmp/crystalbio-live-test.json npm run backend:dev
```

Verified through real HTTP:

1. `POST /auth/login`
2. `POST /attendance/check-in`
3. Database file updated with attendance record

Result:

- Login returned `200`
- Check-in returned `201`
- JSON database contained one attendance record

## Automated tests

Added tests:

- `src/backend/crystalBioPersistence.test.ts`
- `src/backend/crystalBioHttpServer.test.ts`
- `src/backend/crystalBioPersistentHttpApp.test.ts`

Current verification:

- Test files: 8 passed
- Tests: 35 passed
- Build: passed

## Important limitations before production

This is a real local server and persistence layer, but it is not yet a full production backend.

Before client production use, still needed:

- cloud deployment configuration
- HTTPS
- proper database such as Postgres/Supabase/Firebase/etc.
- real password/OTP authentication
- file/object storage for photos
- backup/recovery strategy
- request size limits
- CORS policy
- server logs and monitoring
- atomic database writes or migration to a real database

## Security/audit note

`npm audit --audit-level=moderate` reports Vite/Vitest/esbuild development-tooling vulnerabilities.

The suggested fix requires a breaking upgrade. This was not force-applied in this step because it could break the current prototype stack.

Track before production/CI hardening:

- upgrade Vite/Vitest safely
- rerun full test suite
- rerun build
