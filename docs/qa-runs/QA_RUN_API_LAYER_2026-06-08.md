# QA Run - API Layer - 2026-06-08

## Scope

Testing Agent reviewed the new route-style API layer:

- `src/backend/crystalBioApi.ts`
- `src/backend/crystalBioApi.test.ts`
- related backend core tests

## Routes reviewed

- `POST /auth/login`
- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `POST /leave-requests`
- `PATCH /leave-requests/:id/review`
- `POST /sales-opportunities`
- `POST /sales-opportunities/:id/visits`
- `POST /service-records`
- `POST /service-records/:id/visits`
- `GET /admin/reports`

## Initial automated result

- API tests: passed
- Full test suite: passed
- Build: passed

## Testing Agent findings

### Finding 1: Invalid leave review status accepted

Problem:

- `PATCH /leave-requests/:id/review` accepted values other than `approved` or `rejected`.
- Risk: leave request could remain in invalid/reviewed state.

Fix:

- Added runtime validation.
- Only `approved` and `rejected` are accepted.
- Invalid value now returns `400`.

### Finding 2: Missing request body returned server error

Problem:

- Missing JSON body on protected POST routes caused unexpected server error.
- Risk: malformed mobile requests would show as server bugs.

Fix:

- Added request-body guard.
- Missing body now returns `400` with `Request body is required`.

## Final verification after fixes

- Test files: 5 passed
- Tests: 30 passed
- Build: passed

## QA status

API layer is ready for the next backend step: real HTTP server adapter and persistent database connection.
