# CrystalBio Frontend Backend Connection

## Status

The CrystalBio prototype now has frontend/backend coverage for the core demo journeys: login, attendance check-in/check-out, leave request submission, sales/service visit save flows, progressive Step 2/Step 3 patches, and admin reports.

The remaining work is demo-readiness QA, UI polish, production-grade storage/auth/photo upload, and hosted deployment — not collecting forms again.

## What was connected

### Agent login

On app load, the frontend calls the API client login flow.

When backend URL is configured:

- frontend calls `POST /auth/login`
- backend returns agent session
- app displays logged-in agent name

When backend URL is not configured:

- GitHub Pages preview uses demo data
- app displays clear `Demo preview` copy

### Attendance check-in

The home screen Check in action now:

- requires logged-in session
- gets GPS from frontend API provider
- calls `POST /attendance/check-in` when backend URL is configured
- updates UI to checked-in state
- changes action to Check out

### Attendance check-out

The home screen Check out action now:

- calls `POST /attendance/check-out` when backend URL is configured
- saves checkout GPS
- updates UI back to ready/check-in state

## Backend browser support

Added CORS/preflight support to the local backend server:

- `OPTIONS` returns `204`
- allows `GET, POST, PATCH, OPTIONS`
- allows `content-type` and `authorization` headers

This lets browser frontend builds call the backend server.

## Demo preview behavior

The live GitHub Pages preview does not have a hosted backend yet.

So the preview uses demo data and clearly says:

- `Demo preview`

Once a backend URL is configured during build/deploy, the same screen uses real API calls.

Build variable:

```bash
VITE_CRYSTALBIO_API_URL=http://127.0.0.1:8787 npm run build
```

## Verified manually

Started backend:

```bash
PORT=8798 CRYSTALBIO_DB_PATH=/tmp/crystalbio-frontend-connect.json npm run backend:dev
```

Built frontend with backend URL:

```bash
VITE_CRYSTALBIO_API_URL=http://127.0.0.1:8798 npm run build
```

Verified:

- backend login works
- backend check-in works
- database JSON file receives attendance record
- home screen screenshot captured

Screenshot:

- `/root/workspace/crystalbio-screenshots/frontend-connected-home-final.png`

## Automated verification

Current result:

- Test files: 9 passed
- Tests: 60 passed
- Build: passed

## Testing Agent findings fixed

Testing Agent found:

1. Check-out path needed stronger frontend/backend coverage.
2. Frontend/backend attendance timestamp names could diverge.
3. Demo preview copy should not say backend connected.

Fixes added:

- frontend API check-out test
- app click-through check-in/check-out test
- real HTTP check-out test
- attendance timestamp normalization layer
- demo-vs-backend copy

## Current next work

Recommended order:

1. Run full client-demo readiness QA across agent and admin journeys.
2. Fix UI friction or unclear states found in QA.
3. Replace demo/fixed report values with backend-derived report data in the UI.
4. Add production-grade database/auth/photo storage before live rollout.
5. Re-test with realistic 12–13 user sample data and around 20 visit reports/day.

See also: `docs/PROGRESSIVE_VISIT_FIELDS.md`
