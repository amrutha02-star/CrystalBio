# Bloom Night Stabilization QA — 2026-07-07 21:03 IST

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`, live version `20260703033332`.

Bloom credentials used: Bloom QA Admin and Bloom QA Agent only. No real-user credentials were used.

## Owner summary

- Live app and API were up.
- API/user-journey checks passed for login/session, wrong/empty login, saved-session restore, attendance check-in/repeated tap/refresh/check-out, Sales Step 1/2/3, Service Step 1/2/3, saved entries after re-query, Admin Field Entry/Agents/Approvals/Reports/PDF, Agent report PDFs, Profile/logout, and role guard checks.
- The API runner labels five saves as `FAIL` because the older script expected HTTP 200, but the live API correctly returned HTTP 201 Created with saved IDs. These are treated as pass evidence, not new product bugs.
- Browser UI retest still failed the known GPS/location capture path: Sales Step 1 `Use current location` showed `Location could not be captured...`; typed form values stayed in place; saving stayed blocked. Browser console recorded one blank JavaScript exception in that GPS path.
- Admin Field Entry browser check after cleanup showed `All entries` 10 of 30, and search for the Bloom marker showed 0 rows.
- Bloom-created QA data was cleaned with the documented Bloom-only dry-run/stop-backend/write/start-backend/health/live-verification sequence.

## What was tested

| Journey | Scenario | Expected | Actual | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Live health | Open API health and app shell | API OK and app loads | `/health` returned OK; app shell loaded; version `20260703033332` | Pass | `dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-07T15-31-40-410Z.json` | Continue monitoring |
| Login/session | Bloom admin/agent login, wrong password, empty login, saved session, invalid session | Valid accounts enter; invalid sessions rejected | Passed for both Bloom accounts; invalid token returned 401 | Pass | Same JSON, steps 5-11 | Keep same-phone overnight bug open until real-phone accepted |
| Attendance | Check-in, repeated check-in, refresh/current, admin visibility, check-out | Status persists and duplicate check-in is blocked | Live API created attendance, duplicate check-in was blocked, current state persisted, checkout closed it | Pass | Same JSON, steps 12-16 and 37-38 | No new attendance bug |
| Sales Step 1/2/3 | Save Sales with valid GPS, details, quote/office fields, repeated same-content save | Saves and reopens | API returned saved IDs and detail rows; script's `201` expectation mismatch is not a product failure | Pass | Same JSON, steps 17-20 and 24-27 | No new Sales API bug |
| Service Step 1/2/3 | Save Service with valid GPS, details, parts/status fields | Saves and reopens | API returned saved IDs and detail rows; script's `201` expectation mismatch is not a product failure | Pass | Same JSON, steps 21-27 | No new Service API bug |
| Saved entries | Agent own entries and Admin All entries after save | Bloom rows visible before cleanup | Agent and Admin API lists showed Bloom Sales/Service rows before cleanup | Pass | Same JSON, steps 24-27 | Cleaned after evidence |
| Approvals | Bloom leave request and admin review | Leave visible to admin and reviewable | Leave was created and rejected by Bloom admin | Pass | Same JSON, steps 28-30; `201` expectation mismatch only | Cleaned after evidence |
| Reports/PDF | Agent attendance/visit/combined PDFs and Admin combined PDF | Real PDFs return | All returned `application/pdf` with `%PDF` header | Pass | Same JSON, steps 31-34 | Ready for Periwinkle/Rahul acceptance remains |
| Admin screens | Overview, Field Entry, Reports visible browser check | Admin screens open on mobile layout | Admin overview opened; Field Entry All entries showed 10 of 30; Reports showed date/type/scope and Download PDF controls | Pass | Browser snapshots during run | Continue daytime use |
| GPS/location UI | Sales Step 1 `Use current location` in browser | Location captured or clear failure without data loss | Still showed `Location could not be captured...`; typed customer/note/requirement/contact/phone remained; console recorded one blank JS exception | Fail — existing BUG-20260702-023 | Browser snapshot and console check, 2026-07-07 21:03 IST | Keep open; needs Periwinkle/Rahul decision and real-phone diagnostics |
| Cleanup | Remove only Bloom-created records | Bloom records removed; real rows untouched | Bloom-only cleanup removed 1 attendance, 1 Sales, 1 Service, 1 leave, 1 Sales visit, 1 Service visit; live verification showed 0 Bloom marker rows/current attendance/leave rows | Pass | `docs/live-data-audits/bloom-night-cleanup-stopped-dry-run-2026-07-07.json`, `docs/live-data-audits/bloom-night-cleanup-write-2026-07-07.json` | Complete |

## Confirmed bugs

No new Critical/High bug was added from this run.

Existing confirmed issue remains open:

- `BUG-20260702-023` — GPS/location capture still fails in the live browser Sales path. This is not accepted as fixed.

## Cleanup evidence

- Pre-clean backup created by the cleanup script: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-07T15-32-47-319Z.bak`.
- Dry-run/write audit files:
  - `docs/live-data-audits/bloom-night-cleanup-stopped-dry-run-2026-07-07.json`
  - `docs/live-data-audits/bloom-night-cleanup-write-2026-07-07.json`
- Live post-clean verification: API health OK; Bloom marker rows in agent own entries = 0; Bloom marker rows in Admin team entries = 0; current Bloom attendance = none; Bloom QA leave rows = 0.

## Raw evidence

- API/user-journey evidence: `dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-07T15-31-40-410Z.json`
- Browser evidence: live browser snapshots/console from this run showed Admin Field Entry cleanup state and GPS failure path.
