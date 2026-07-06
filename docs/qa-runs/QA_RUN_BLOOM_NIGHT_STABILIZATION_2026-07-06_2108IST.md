# Bloom Night Stabilization QA — 2026-07-06 21:08 IST

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version checked: `20260703033332`  
Credentials: Bloom assigned QA admin/agent only. No real-user credentials used.

## Owner summary

- Live app and live API were up.
- Core API journeys passed: login/session, attendance check-in/out/re-check-in, Sales Step 1/2/3, Service Step 1/2/3, saved-entry visibility, Admin Field Entry, Agents, Reports/PDF, Approvals, and role guards.
- Live mobile/browser GPS capture is still failing: Attendance `Use current location` showed `Location could not be captured...`; console recorded one blank JavaScript exception. This keeps BUG-20260702-023 open.
- Backend GPS protection is still working: valid-GPS Sales/Service saves passed, and missing GPS was rejected for both Sales and Service.
- Bloom-created QA Sales/Service/attendance/leave records were cleaned after documented dry-run/backup/write/restart; live API verification showed Bloom marker rows removed.

## What was tested

| Journey | Scenario | Expected | Actual | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Live health | Open live API and frontend | API OK and app shell loads | API `/health` returned OK; frontend shell and version loaded | Pass | API evidence JSON below | Continue monitoring |
| Login/session | Bloom admin/agent login, wrong password, empty login, saved-session restore, invalid session | Valid Bloom sessions work; bad/empty login blocked; invalid session rejected | Passed | API steps 5-11 | Keep same-phone overnight real-device acceptance open under BUG-20260624-018 |
| Attendance | Current status → check-in → repeat check-in → refresh/current lookup → admin visibility → check-out | Check-in persists; repeat check-in blocked clearly; admin sees status; checkout closes current attendance | Passed through API; browser GPS capture failed when using visible `Use current location` | Mixed: API pass, GPS UI fail | API steps 12-16, 39-40; browser snapshot/console | Keep BUG-20260702-023 open |
| Sales | Step 1 with GPS, Step 2, Step 3, missing GPS edge | Valid save persists; missing GPS rejected | Passed | API steps 17-20 | No fix needed for backend save path |
| Service | Step 1 with GPS, Step 2, Step 3, missing GPS edge | Valid save persists; missing GPS rejected | Passed | API steps 21-24 | No fix needed for backend save path |
| Saved entries | Agent own entries and admin team Field Entry after save | Bloom Sales/Service rows visible with saved Step 2/3 details | Passed before cleanup | API steps 25-28; browser Field Entry showed rows | Cleaned Bloom rows after evidence |
| Agent UI | Mobile Visits list and saved Sales detail | Previous entries open saved details/status | Passed; saved Sales detail showed Step 1/2/3 saved | Browser snapshot | No fix needed |
| Admin UI | Overview, Field Entry, Agents, Reports | Admin sees live counts, Field Entry rows, Agents team status, Reports setup | Passed in browser; Field Entry detail and browser Back returned to list | Browser snapshots | No fix needed |
| Reports/PDF | Agent Attendance/Visit/Combined PDFs and Admin Combined PDF | PDF responses with `%PDF` and >1000 bytes | Passed | API steps 32-35 | Waiting only for Periwinkle/Rahul acceptance on existing PDF item |
| Approvals | Bloom leave create → admin sees → review | Leave request appears and can be reviewed | Product passed; runner marked one false failure because endpoint returned successful `201` instead of expected `200` | API steps 29-31 | Treat as test-harness note, not product bug |
| Mobile layout/back | Phone-size browser, Field Entry detail, native Back | Layout readable; admin Field Entry detail returns to list | Passed for admin Field Entry. Agent saved-detail Back returned Home rather than Visits list; noted as watch item, not escalated tonight. | Browser snapshots | Monitor; do not approve a fix without Periwinkle review |
| Console/API errors | Browser console after GPS path and admin navigation | No runtime errors | One blank JS exception appeared during GPS failure path; no console messages otherwise | Fail tied to open GPS bug | Browser console output | Keep BUG-20260702-023 open |

## Evidence files

- API run: `dogfood-output/bloom-night-stabilization-2026-07-06-api-2026-07-06T15-33-29-791Z.json`
- Cleanup dry-run before stop: `docs/live-data-audits/bloom-night-cleanup-dry-run-2026-07-06.json`
- Cleanup stopped dry-run: `docs/live-data-audits/bloom-night-cleanup-stopped-dry-run-2026-07-06.json`
- Cleanup write: `docs/live-data-audits/bloom-night-cleanup-write-2026-07-06.json`
- Post-clean dry-run: `docs/live-data-audits/bloom-night-cleanup-post-verify-dry-run-2026-07-06.json`
- Live cleanup verification: `dogfood-output/bloom-night-cleanup-live-verify-2026-07-06.json`

## Confirmed bugs / board updates

- Updated `docs/BUG_INTAKE_BOARD.md` under BUG-20260702-023 with tonight's live mobile GPS failure evidence.
- No new Critical/High bug was added beyond the already-open GPS capture bug.

## Cleanup status

- Bloom-only dry-run before cleanup: would remove 1 attendance, 1 Sales record/visit, 1 Service record/visit, and 1 leave request; no real-user cleanup.
- Backend was stopped briefly, Bloom-only cleanup write ran, backend restarted, and `/health` returned OK.
- Post-clean dry-run showed 0 Bloom cleanup targets remaining.
- Live API verification showed the Bloom run marker absent from team entries, agent own entries, reports, and leave requests; Bloom rows after cleanup were 0.

## Safe for daytime use?

Safe for normal daytime use with the known warning: GPS/location capture is still the active High issue and needs owner/Periwinkle decision before any fix. Core save/report/admin journeys remained up in this run.
