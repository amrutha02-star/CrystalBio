# Bloom Nightly Stabilization QA — 2026-07-05

Run time: 2026-07-05 21:00–21:15 IST  
Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version: `20260703033332`  
Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.

## Owner summary

- Live app and API were up.
- No new Critical/High launch-blocking bug was confirmed tonight.
- Login/session restore, Attendance check-in/out/re-check-in, Sales Step 1/2/3, Service Step 1/2/3, saved-entry visibility, Admin Field Entry, Agents, Reports/PDF, Profile/logout, and API role guards passed in the live QA path.
- Existing GPS/location issue remains open: backend saves with valid GPS and rejects bad/missing GPS, but real-phone cross-browser location capture is still not accepted as fixed under BUG-20260702-023.
- Bloom-created QA rows were cleaned after dry-run/write/restart/health check, and live API verification shows 0 rows remaining for this run marker.

## Journey results

| Journey | Scenario | Expected | Actual | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Live app/API | Health + frontend version | App/API available | API `/health` returned `200 {status: ok}`; frontend `version.json` returned `20260703033332` | PASS | Raw JSON: `dogfood-output/bloom-nightly-2026-07-05-2026-07-05T15-34-05-069Z/summary.json` | None |
| Credential safety | Assigned Bloom accounts only | No real-user credentials | Used `bloom.admin@crystalbio.in` and `bloom.agent@crystalbio.in` from assigned file only | PASS | Credential file path read only | None |
| Login/session | Admin + agent login, wrong/empty login, saved-session restore | Correct logins work; bad logins fail; saved session validates | Admin and agent logins returned 200; wrong/empty logins returned expected 400; bearer restore returned Bloom QA Agent; bad token returned 401 | PASS | Summary steps 4–10 | Keep real same-phone overnight login BUG-20260624-018 open until accepted by owner |
| Attendance | Check-in, repeated tap, refresh, checkout/re-check-in | Check-in persists; repeat check-in blocked; checkout/re-check-in works | Check-in returned 201 with work modes; repeat check-in returned expected 400; current attendance stayed checked-in; checkout/re-check-in/final checkout passed | PASS | Summary steps 11–15 and 32. Note: the runner initially marked 201 create responses as FAIL, but the returned data confirms success. | None |
| Sales Step 1/2/3 | Create Sales, save Step 1 GPS visit, save Step 2 and Step 3 | Sales journey saves and persists | Opportunity/visit created with valid GPS; Step 2 and Step 3 saved; saved detail reopened with Step 2/3 status | PASS | Summary steps 16–18 and 23. Note: 201 create responses were corrected as pass. | None |
| Service Step 1/2/3 | Create Service, save Step 1 GPS visit, save Step 2 and Step 3 | Service journey saves and persists | Service record/visit created with valid GPS; Step 2 and Step 3 saved; saved detail reopened with Step 2/3 status | PASS | Summary steps 19–21 and 24. Note: 201 create responses were corrected as pass. | None |
| Saved entries | Agent My Entries + Admin Field Entry | Saved Sales/Service visible after refresh/re-login style API load and visible to admin | Agent own entries and Admin team Field Entry both showed the Bloom Sales/Service rows before cleanup | PASS | Summary steps 22–25; browser Field Entry All entries showed 10 of 30 rows and Bloom rows | Cleanup completed |
| Approvals | Agent leave request + Admin review | Leave appears for admin and can be reviewed | Leave request created, appeared in Admin list, and was rejected for cleanup safety | PASS | Summary step 26. Note: 201 create response was corrected as pass. | Cleanup completed |
| Reports/PDF | Agent Attendance/Visit/Combined PDF; Admin combined PDF | PDFs return real PDF bytes | Agent PDFs returned `%PDF` with 4012/5079/5080 bytes; Admin combined PDF returned `%PDF` with 8962 bytes | PASS | Summary steps 27–30 | None |
| Admin screens | Overview, Field Entry, Agents, Reports, Profile/logout | Admin screens open on mobile and keep responsibilities separate | Browser checks opened Admin overview, Field Entry All entries/search/filter, Agents team list, Reports PDF controls, and Profile/logout without console errors | PASS | Hermes browser snapshots + screenshots/vision in run context | None |
| Agent screens | Home, Reports, Profile/logout, bottom navigation | Phone-first agent screens remain usable | Browser checks opened Agent home, Reports download setup, Profile/logout; mobile layout stayed full-screen sage/olive with bottom nav visible | PASS | Hermes browser snapshots + vision check | None |
| Mobile layout/back/console | Phone layout, nav, console/API errors | No crash or unexpected console errors | Mobile visual checks passed; browser console reported 0 JS errors during checked screens | PASS | Browser console output: 0 messages / 0 errors | None |
| Direct/role guard | Agent blocked from admin data | Role boundaries hold | API blocked agent from admin reports with 403; browser direct admin route did not expose owner data in the checked state | PASS | Summary step 10 + browser route smoke | None |

## Confirmed bugs from this run

- No new Critical/High product bug was confirmed.
- No `docs/BUG_INTAKE_BOARD.md` update was needed from this run.
- Existing open bugs remain as already tracked, especially BUG-20260702-023 GPS/location capture and BUG-20260624-018 real same-phone overnight saved-login acceptance.

## Bloom QA cleanup

Bloom-created data from this run:

- Sales: `sales_1068`, visit `sales_visit_1069`
- Service: `service_1070`, visit `service_visit_1071`
- Leave: `leave_1072`
- Attendance: `attendance_1067` plus re-check-in row

Safe cleanup sequence completed:

1. Dry-run: `docs/live-data-audits/bloom-night-cleanup-dry-run-2026-07-05.json`
2. Stopped live backend briefly.
3. Bloom-only write cleanup: `docs/live-data-audits/bloom-night-cleanup-write-2026-07-05.json`
4. Restarted backend and verified `https://work-api.convogenie.ai/health` returned OK.
5. Live API verification after cleanup showed:
   - 0 Bloom marker rows in Bloom Agent My Entries
   - 0 Bloom marker rows in Admin team Field Entry
   - 0 Bloom current attendance rows
   - 0 Bloom marker leave rows

Cleanup removed only Bloom-owned records reported by the dry-run: 2 attendance rows, 1 Sales row/visit, 1 Service row/visit, and 1 leave request. No real-user cleanup was done.
