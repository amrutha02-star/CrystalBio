# QA Run - Frontend Backend Connection - 2026-06-08

## Scope

Testing Agent reviewed the first frontend/backend connection step:

- `src/App.tsx`
- `src/crystalBioFrontendApi.ts`
- `src/crystalBioFrontendApi.test.ts`
- `src/backend/crystalBioHttpServer.ts`
- `src/backend/crystalBioHttpServer.test.ts`
- `src/appData.ts`
- `src/styles.css`

## What was verified

- Agent home logs in through frontend API client.
- Agent name displays from session.
- Check in sends attendance request and changes UI state.
- Check out sends attendance request and changes UI state back.
- Demo fallback keeps GitHub Pages preview usable.
- CORS support allows browser frontend to call backend.
- Old `Draft` and `My Entries` wording removed from active home UI.
- Frontend normalizes backend timestamp field names.

## Initial Testing Agent findings

### Finding 1: Check-out path needed stronger coverage

Severity: Medium

Fix:

- Added frontend API check-out test.
- Added app check-in -> check-out interaction test.
- Added real HTTP check-out assertion.

### Finding 2: Attendance timestamp field mismatch risk

Severity: Medium

Problem:

- frontend expected `checkInTime` / `checkOutTime`
- backend uses `checkInAt` / `checkOutAt`

Fix:

- Added frontend normalization layer.
- Frontend now accepts backend timestamp names and maps them to UI-friendly names.

### Finding 3: Demo mode copy could mislead reviewers

Severity: Low

Problem:

- GitHub Pages fallback showed `Backend connected` even without backend URL.

Fix:

- Demo build now says `Demo preview`.
- Backend-configured build says `Backend connected`.

## Manual verification

Local backend:

```bash
PORT=8798 CRYSTALBIO_DB_PATH=/tmp/crystalbio-frontend-connect.json npm run backend:dev
```

Frontend built with:

```bash
VITE_CRYSTALBIO_API_URL=http://127.0.0.1:8798 npm run build
```

Verified:

- HTTP login returned agent `Rahul Sales`.
- HTTP check-in returned `201 checked_in`.
- JSON database contained attendance record.
- Screenshot captured.

## Final verification

- Test files: 9 passed
- Tests: 42 passed
- Build: passed

## QA status

Pass.

Ready to connect the next frontend flow, recommended: Leave request first.
