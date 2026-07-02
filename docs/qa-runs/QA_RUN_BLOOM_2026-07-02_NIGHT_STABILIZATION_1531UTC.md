# Bloom Night Stabilization QA — 2026-07-02 15:31 UTC

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`

Live version checked: `20260701023648`

Bloom credentials used only: `bloom.admin@crystalbio.in`, `bloom.agent@crystalbio.in`

## Owner summary

- Live app and API were up.
- No new confirmed Critical or High launch-blocking product bug was found in this run.
- Core API journeys passed: Bloom admin/agent login, wrong/empty login blocking, saved-session bearer restore, role guard, attendance current/check-in/repeated-check-in/refresh/checkout, Sales Step 1/2/3, Service Step 1/2/3, saved-entry reopen, admin visibility, Agents list, monitor snapshot, and agent/admin PDFs.
- Browser/mobile smoke passed for login, admin overview/Field Entry/Agents/Approvals/Reports/Profile, agent login/home/session refresh, attendance refresh, profile/logout, and direct admin guard.
- UI automation could not reliably complete visible Sales/Service form saves because the helper did not find the current save controls; the API journey for those same Sales/Service saves passed and admin/agent visibility was verified.
- Bloom-created QA data was cleaned after backup/dry-run/write with live API verification.

## Scope tested

| Journey | Result | Evidence / note |
|---|---:|---|
| API health and live app shell | Pass | `/health` returned `{"status":"ok"}`; app shell loaded. |
| Bloom-only credential rule | Pass | Only assigned Bloom admin/agent credentials were used. |
| Admin login/session | Pass | Admin login worked; browser refresh stayed inside app. |
| Agent login/session | Pass | Agent login worked; browser refresh stayed inside app; bearer `/auth/session` restored Bloom agent. |
| Wrong/empty login | Pass | Wrong password and empty login were rejected safely. |
| Direct admin/role guard | Pass | Agent token was blocked from admin reports; direct `/admin` without session stayed guarded. |
| Attendance check-in/out/re-check-in | Pass | API check-in created `attendance_996`, repeated check-in blocked clearly, refresh/current still showed checked in, checkout closed it. Browser smoke also showed checked-in state after refresh. |
| Sales Step 1/2/3 | Pass by API; UI needs manual real-device follow-up | API created `sales_997` / `sales_visit_998`, Step 2 and Step 3 saved, saved detail reopened with Step 2/3 saved. UI helper could not click current save controls reliably. |
| Service Step 1/2/3 | Pass by API; UI needs manual real-device follow-up | API created `service_999` / `service_visit_1000`, Step 2 and Step 3 saved, saved detail reopened with Step 2/3 saved. UI helper could not click current save controls reliably. |
| Saved entries after refresh/re-login | Pass by API | Agent own entries and admin All entries showed Bloom Sales/Service rows before cleanup; saved detail reopened correctly. |
| Agent report PDF | Pass by API | Attendance, Visits, and Combined agent PDF endpoints returned `200 application/pdf` and `%PDF`. Browser helper’s direct token extraction returned 401, so API evidence is the reliable PDF evidence. |
| Admin Reports/PDF | Pass by API | Admin combined PDF endpoint returned `200 application/pdf` and `%PDF`; admin Reports screen opened in mobile smoke. |
| Admin Overview / Field Entry / Agents / Approvals / Profile | Pass for screen smoke | Browser mobile screenshots captured each screen; no owner data exposed after logout/direct-admin check. |
| Mobile layout/back/console | Pass with notes | Phone-size smoke screenshots captured. Console showed only expected wrong-login/session 400/401 during negative tests and the known non-blocking PWA meta warning. |

## Confirmed bugs

No new confirmed Critical or High bug was added from this run.

Runner notes that should **not** be treated as product bugs:

- Several API steps returned HTTP `201 Created` instead of the runner’s older `200` expectation. The records were actually created and later verified, so these are script expectation issues, not product failures.
- Browser form-save helper did not locate the current visible Sales/Service save buttons; API save/persistence/admin visibility covered the business data path, but real-device manual form tapping is still useful.
- Browser helper direct PDF fetch used the wrong token source and returned 401; authenticated API PDF tests passed.

## Existing issues still waiting outside this run

- BUG-20260702-023 location capture / permission recovery remains the main High item under Periwinkle/Iris review.
- BUG-20260624-018 saved-login restore has supporting Bloom cron/browser/API evidence, but still needs real iPhone/Android same-phone overnight acceptance.
- BUG-20260701-022 Field Entry iPhone search anti-zoom fix was still not live in this run because live version remains `20260701023648`.

## QA data created and cleanup

Created during testing:

- Attendance: `attendance_996`
- Sales opportunity / visit: `sales_997` / `sales_visit_998`
- Service record / visit: `service_999` / `service_visit_1000`
- Leave request: `leave_1001`

Cleanup sequence completed:

1. Bloom-only dry-run completed against `/var/lib/crystalbio/crystalbio-db.json`.
2. Backend was stopped briefly.
3. Bloom-only write cleanup ran and created backup `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-02T15-34-42-903Z.bak`.
4. Backend was restarted and active.
5. Live `/health` returned OK.
6. Live API verification showed no Bloom field visits, no current Bloom attendance, no Bloom leave requests, and admin team visits contained no Bloom marker.

Dry-run/write cleanup removed only Bloom-owned rows:

- Attendance: 5
- Sales records: 5
- Service records: 4
- Leave requests: 3
- Sessions removed: 0

## Raw evidence

- API E2E JSON: `dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-02T15-31-47-492Z.json`
- Browser/mobile summary: `dogfood-output/full-ui-qa-2026-07-02/summary.json`
- Browser screenshots: `dogfood-output/full-ui-qa-2026-07-02/screenshots/`
