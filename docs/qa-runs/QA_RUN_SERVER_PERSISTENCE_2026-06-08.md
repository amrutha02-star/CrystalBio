# QA Run - Server and Persistence - 2026-06-08

## Scope

Testing Agent reviewed the new real-server and persistence step:

- `src/backend/crystalBioPersistence.ts`
- `src/backend/crystalBioHttpServer.ts`
- `src/backend/crystalBioPersistentHttpApp.ts`
- `src/backend/server.ts`
- related tests

## What was verified

### Automated

- JSON database store saves and reloads backend state.
- HTTP server handles real `fetch` requests.
- Login works over HTTP.
- Attendance check-in works over HTTP.
- Malformed JSON returns clean `400` response.
- Persistent HTTP app automatically saves successful mutations.

### Manual real-server test

Started server:

```bash
PORT=8797 CRYSTALBIO_DB_PATH=/tmp/crystalbio-live-test.json npm run backend:dev
```

Verified:

- `POST /auth/login` returned `200`.
- `POST /attendance/check-in` returned `201`.
- JSON database file contained the attendance record.

## Issues found and fixed

### 1. Server entrypoint failed due to top-level await

Problem:

- `tsx` failed because top-level await was not supported with the current module output.

Fix:

- Wrapped server startup in `main()`.

Verification:

- Server started successfully.
- Real HTTP login/check-in worked.

### 2. Persistence was not automatically wired to HTTP mutations

Problem:

- JSON persistence existed, but the HTTP app did not automatically save after successful API changes.

Fix:

- Added `createCrystalBioPersistentHttpApp()`.
- It saves after successful `POST` and `PATCH` requests.

Verification:

- Test confirms data saved through HTTP reloads from the JSON database.

## Final verification

- Test files: 8 passed
- Tests: 35 passed
- Build: passed
- Local server startup: passed
- Real HTTP login/check-in: passed
- Database file update: passed

## Open hardening notes

Before production/cloud deployment:

- replace JSON file with production database or add atomic writes/backup/recovery
- add HTTPS/deployment config
- add request size limits and CORS
- add real authentication/password/OTP
- add photo/object storage
- review dev-tool dependency audit warnings
