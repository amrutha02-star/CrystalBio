# CrystalBio API Layer

## Status

Initial route-style API layer is implemented on top of the tested backend foundation.

This is still not a deployed public server. It is the tested API contract/handler layer that can be connected to an HTTP server, database, and frontend.

## Implemented routes

### Auth

`POST /auth/login`

Purpose:

- Creates a login session for an agent/admin.
- Returns token, agent ID, agent name, and role.

### Attendance

`POST /attendance/check-in`

Purpose:

- Requires bearer token.
- Saves attendance check-in using logged-in agent identity.
- Requires timestamp and GPS.

`POST /attendance/check-out`

Purpose:

- Requires bearer token.
- Saves attendance check-out using logged-in agent identity.
- Requires timestamp and GPS.

### Leave requests

`POST /leave-requests`

Purpose:

- Requires bearer token.
- Lets logged-in agent submit leave request.
- Saves from date, to date, reason, and pending status.

`PATCH /leave-requests/:id/review`

Purpose:

- Requires bearer token.
- Requires admin role through backend access control.
- Accepts only `approved` or `rejected`.
- Rejects invalid status values.

### Sales

`POST /sales-opportunities`

Purpose:

- Requires bearer token.
- Creates customer/opportunity record using logged-in sales agent identity.

`POST /sales-opportunities/:id/visits`

Purpose:

- Requires bearer token.
- Adds one sales visit update under the selected opportunity.
- Requires visit date, visit time, GPS, note, next action.
- Requires follow-up date when follow-up is needed.

`PATCH /sales-opportunities/:id`

Purpose:

- Requires bearer token.
- Saves progressive Sales Step 2 and Step 3 details against the same opportunity.
- Prevents Step 2/3 updates from creating duplicate visit records.

### Service

`POST /service-records`

Purpose:

- Requires bearer token.
- Creates customer/equipment service record using logged-in engineer identity.

`POST /service-records/:id/visits`

Purpose:

- Requires bearer token.
- Adds one service visit update under the selected service record.
- Requires visit date, visit time, GPS, service type, work done, support required, next action.
- Requires next visit date when parts or next visit are needed.

`PATCH /service-records/:id`

Purpose:

- Requires bearer token.
- Saves progressive Service Step 2 and Step 3 details against the same service record.
- Prevents equipment/parts/proof updates from creating duplicate service cases.

### Admin reports

`GET /admin/reports?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`

Purpose:

- Requires bearer token.
- Requires admin role.
- Returns date-range report for daily/weekly/monthly use.

Includes:

- checked-in agents
- checked-out agents
- sales visit count
- service visit count
- pending leave requests
- agent summaries
- follow-ups due inside the selected range

## API safeguards added

- Protected routes require a bearer token.
- Missing or invalid token returns `401`.
- Non-admin admin-report access returns `403`.
- Invalid leave review status returns `400`.
- Missing request body returns `400`, not server error.
- Unknown route returns `404`.

## Tests

API tests added:

- `src/backend/crystalBioApi.test.ts`

Current verification:

- Test files: 9 passed
- Tests: 60 passed
- Build: passed

## Testing Agent result

Testing Agent reviewed the API layer and found two issues:

1. Invalid leave review statuses were accepted.
2. Missing request body returned server error instead of validation error.

Both were fixed before commit.

## Next step

The API contract is now connected to a local HTTP server and JSON persistence layer.

Recommended next build step:

1. Keep running Testing Agent against complete frontend + backend journeys.
2. Replace demo/fixed frontend report values with backend-derived report data.
3. Add production-ready database or hosted backend storage.
4. Add real auth/password/OTP.
5. Add object storage for photos.
