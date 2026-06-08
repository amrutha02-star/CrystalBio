# CrystalBio Frontend Backend Connection

## Status

The agent home screen is now connected to the CrystalBio backend API client for login and attendance.

This is the first frontend-to-backend connection step. Sales, service, leave, and admin reports are next.

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
- Tests: 42 passed
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

## Next screens to connect

Recommended order:

1. Complete Sales/Service progressive fields
   - keep current quick save as Step 1
   - add Step 2 customer/requirement/equipment details
   - add Step 3 quote/parts/photos/office details
   - each step must save separately
2. Admin reports
   - include daily/weekly/monthly reports
   - show Step 1/2/3 completion and missing fields

Reason:

- leave request, sales Step 1, and service Step 1 are already workable
- client sheet fields should not be skipped
- field agents cannot fill every field while standing at the client place
- progressive saves preserve usability while still collecting all required details

See also: `docs/PROGRESSIVE_VISIT_FIELDS.md`
