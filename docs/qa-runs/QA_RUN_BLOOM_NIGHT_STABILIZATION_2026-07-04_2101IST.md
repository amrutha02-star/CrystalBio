# Bloom nightly stabilization QA — 2026-07-04 21:01 IST

## Plain-English summary for Amrutha/Rahul

- Live app and live API were up. API health returned `{"status":"ok"}` and live frontend version was `20260703033332`.
- No new Critical/High launch-blocking bug was confirmed in this run.
- Login, saved-login restore, Sales Step 1/2/3, Service Step 1/2/3, saved entries, Admin overview/Field Entry/Agents/Reports/PDF, Profile/logout, mobile layout/back behavior, and console checks passed with Bloom credentials.
- Attendance check-in → repeated check-in block → refresh/current restore → checkout → re-check-in → final checkout passed after using the same live payload shape as the frontend (`timestamp` + GPS).
- Existing GPS/location capture bug remains open: recent live client-error logs still show repeated `Location could not be captured...`, including named real-user evidence for Dr. Swati Priya and additional Android/iPhone-style browser errors.
- Bloom-created Sales/Service/attendance records were removed only through the Bloom-only dry-run/write cleanup path, with backend stop/start and live API verification afterward.

## What was tested

| Journey | Scenario | Expected | Actual | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Live availability | Open app/API | App and API respond | Health OK; frontend version `20260703033332` | PASS | `dogfood-output/bloom-night-stabilization-2026-07-04-live-api.json` | Continue monitoring |
| Login/session | Wrong/empty login, Bloom admin login, Bloom agent login | Bad login blocked; Bloom credentials work | Wrong and empty login blocked; both Bloom accounts logged in | PASS | same evidence file; browser login with Enter opened Admin | None |
| Saved-login restore | Bearer restore, session-cookie restore, invalid session | Valid sessions restore; invalid session rejected | Bearer and cookie restore returned Bloom QA Agent; invalid token returned 401 | PASS | same evidence file | Keep BUG-20260624-018 open for real same-phone overnight acceptance |
| Attendance | Check in, repeat tap, refresh/current, checkout, re-check-in, final checkout | State persists and duplicate same-day check-in is blocked | Passed with attendance IDs `attendance_1060` and `attendance_1061`; repeat returned `Agent is already checked in` | PASS | `dogfood-output/bloom-night-attendance-2026-07-04.json` | None from this run |
| Sales Step 1/2/3 | Create Bloom Sales entry, add visit with GPS, save Step 2 and Step 3 | All saves persist and show as saved | Sales record `sales_1056` and visit `sales_visit_1057` saved; Step 2/3 saved true | PASS | API evidence + browser reopened saved Sales detail | Cleanup completed |
| Service Step 1/2/3 | Create Bloom Service entry, add visit with GPS, save Step 2 and Step 3 | All saves persist and show as saved | Service record `service_1058` and visit `service_visit_1059` saved; Step 2/3 saved true | PASS | API evidence + Admin Field Entry evidence | Cleanup completed |
| GPS backend guard | Missing Sales GPS and impossible Service GPS | Backend rejects invalid/missing GPS | Missing Sales GPS returned `GPS location is required`; impossible Service GPS returned `Valid GPS latitude and longitude are required` | PASS | API evidence | Does not close browser/phone GPS capture bug |
| Saved entries after refresh | Reopen saved Sales entry and refresh browser | Saved details remain visible, not blank | Sales saved detail stayed visible after refresh, with Step 1/2/3 saved status | PASS | Browser live snapshot during run | None |
| Agent report PDF | Download combined agent PDF | Real PDF downloads | `200 application/pdf`, `%PDF`, 5,235 bytes, dated filename | PASS | API evidence | None |
| Admin overview/refresh | Admin sees today’s saved Bloom records during run | Admin data updates from live backend | Overview showed 2 Total visits while Bloom QA records existed | PASS | Browser live snapshot; API report totals | Cleanup completed |
| Admin Field Entry | All entries, search, detail, browser back | Entries searchable; detail opens; back returns to list | Search filtered to 2 Bloom entries; detail opened; browser Back returned to Field Entry list | PASS | Browser live snapshots | None |
| Admin Agents | Team status screen | Agents visible with attendance/work-mode summary | Agents screen loaded; Bloom QA Agent showed checked-out and 2 visits during run | PASS | Browser live snapshot | Cleanup completed |
| Admin Reports/PDF | Admin report screen and PDF endpoint | Screen stable; real PDF downloads | Reports screen loaded; admin PDF returned `200 application/pdf`, `%PDF`, 9,164 bytes | PASS | Browser + API evidence | None |
| Profile/logout | Agent profile logout, admin login with Enter | Logout returns to Login; admin can log in | Agent logout returned to Login; admin password Enter opened Admin | PASS | Browser live run | None |
| Mobile layout/back/console | Phone-sized browser, navigation, console | Layout remains phone-first; no JS errors | Navigation and Field Entry detail/back worked; console had 0 messages/errors after agent/admin UI passes | PASS | Browser console output | None |
| Live client-error monitoring | Review recent high errors | Serious recent errors recorded | Recent logs still include `Location could not be captured...` plus one iPhone-style `Script error.` row | EXISTING BUG OPEN | API evidence in `Admin client-error log available` section | Keep BUG-20260702-023 open; Periwinkle/Iris need approved diagnostic/recovery fix |

## Confirmed bugs

No new separate product bug was confirmed tonight.

Existing open issue reinforced:

- **BUG-20260702-023 — Sales/location permission prevents field update save** remains open. The backend GPS requirement and validation are working, but live browser/phone capture still logs recent failures. This run found more supporting log evidence, not an accepted fix.

## Cleanup

- Dry-run evidence: `docs/live-data-audits/bloom-night-cleanup-dry-run-2026-07-04.json`
- Write evidence: `docs/live-data-audits/bloom-night-cleanup-write-2026-07-04.json`
- Safe sequence used: dry-run → stop `crystalbio-backend.service` → Bloom-only write → restart backend → live `/health` check → live API verification.
- Removed only Bloom-owned QA activity: 2 attendance rows, 1 Sales record/visit, 1 Service record/visit, 0 leave requests, 0 sessions.
- Live post-clean verification: `dogfood-output/bloom-night-cleanup-verify-2026-07-04.json` showed 0 Bloom field rows, 0 Bloom attendance rows, 0 Bloom leave rows; today’s Sales/Service totals returned to 0 for Bloom-created run data.

## Blocked / not fully tested

- Real Android Chrome / Samsung Browser / iPhone Safari / iPhone Chrome / home-screen PWA GPS capture cannot be fully proven from this cron browser. Existing live phone/user logs keep BUG-20260702-023 open.
- Real same-phone overnight saved-login acceptance remains open under BUG-20260624-018; automated bearer/session-cookie restore passed again.

## Clear next action for Periwinkle

- Do not approve a routine daytime deploy from this run.
- Keep app daytime use allowed with caution: core save/report paths passed, but the GPS/location capture issue remains the main active risk for field users.
- Periwinkle should review BUG-20260702-023 for an approved diagnostic/recovery fix path that keeps GPS required and preserves typed form data.
