# Bloom QA Run — 2026-07-01 Night Stabilization

Run time: 2026-07-01 15:33–15:36 UTC / 21:03–21:06 IST  
Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.

## Plain-English summary

- Live app and API were up.
- No new Critical or High launch blocker was confirmed in this run.
- Login, saved-session restore, attendance, Sales, Service, saved-entry visibility, admin data, and PDFs passed through live API checks.
- Mobile admin browser smoke passed: overview, Field Entry, submitted-form detail, browser Back, bottom navigation, and console check had no visible breakage or runtime errors.
- Bloom-created QA rows were cleaned after dry-run/write, backend restart, health check, and live API verification.

## What was tested

- Live API health and live frontend availability.
- Empty login, wrong password, Bloom Admin login, Bloom Agent login.
- Direct admin API without session.
- Saved login/session restore through bearer session and session cookie.
- Attendance: check-in, repeated check-in while already checked in, current attendance after refresh/session call, check-out, re-check-in after checkout, final checkout.
- Sales Step 1 / Step 2 / Step 3 and Sales visit update.
- Service Step 1 / Step 2 / Step 3 and Service visit update.
- Saved entries after session/API refresh for agent and admin Field Entry / All entries.
- Admin overview/report API refresh, Admin Agents, Approvals/leave API, client-error log API, login-activity API.
- Agent report PDF downloads for Attendance, Visit, and Combined.
- Admin combined report PDF download.
- Mobile browser smoke: admin overview layout, Total visits expansion, submitted-form detail, browser Back to dashboard, Field Entry All entries, bottom navigation, and console errors.

## What passed

- 37/37 live API checks passed.
- API health returned `200` with `{ "status": "ok" }`.
- Bloom Admin login returned role `admin`; Bloom Agent login returned role `both`.
- Empty/wrong login paths were safely blocked.
- Saved-session restore worked with both bearer session and session cookie.
- Attendance created `attendance_922`, blocked a repeated same-day check-in with the expected message, remained checked in after refresh/session call, checked out, re-checked-in as `attendance_923`, and checked out again.
- Sales QA record `sales_924` / visit `sales_visit_925` saved through Step 1/2/3 and appeared in agent/admin field-entry data before cleanup.
- Service QA record `service_926` / visit `service_visit_927` saved through Step 1/2/3 and appeared in agent/admin field-entry data before cleanup.
- Agent PDFs downloaded as real PDFs:
  - Attendance: 3991 bytes, `%PDF`
  - Visits: 5065 bytes, `%PDF`
  - Combined: 5066 bytes, `%PDF`
- Admin combined PDF downloaded as a real PDF: 9118 bytes, `%PDF`.
- Mobile browser console after admin navigation had 0 console messages and 0 JavaScript errors.

## What failed

- No new confirmed failures in tonight's live QA run.

## Blocked / not fully tested

- Real iPhone Safari keyboard zoom for BUG-20260701-022 was not accepted as fixed tonight because that fix is documented as built locally and scheduled for night deploy, not live at the time of this run.
- Real-device camera capture/upload was not physically tested; no new camera/upload failure was reported in this run.
- True overnight same-phone persistence for BUG-20260624-018 still needs real overnight/device acceptance, although the live session-cookie restore path passed in this cron/browser/API context.

## Confirmed bugs

- No new Critical/High/Medium/Low bug was added from this run.
- `docs/BUG_INTAKE_BOARD.md` was not changed because no new confirmed bug was found.

## Cleanup evidence

Bloom-created QA records from this run:

- Attendance: `attendance_922`, `attendance_923`
- Sales: `sales_924`, visit `sales_visit_925`
- Service: `service_926`, visit `service_visit_927`

Safe cleanup sequence completed:

1. Bloom-only dry-run on `/var/lib/crystalbio/crystalbio-db.json`.
2. Backend stopped briefly.
3. Bloom-only write cleanup ran with `--bloom-only --write`.
4. Backup created: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-01T15-35-29-315Z.bak`.
5. Backend restarted.
6. Live `/health` returned `200` / `{ "status": "ok" }`.
7. Live API verification after cleanup showed:
   - Bloom team field-entry rows: `0`
   - Bloom agent field-entry rows: `0`
   - Bloom current attendance: `null`

Cleanup removed only Bloom-owned records:

- Attendance: 2
- Sales records: 1
- Service records: 1
- Sales visits: 1
- Service visits: 1
- Leave requests: 0
- Sessions: 0

## Evidence files

- API run result: `dogfood-output/bloom-nightly-stabilization-live-2026-07-01-2026-07-01T15-33-39-178Z.json`
- Cleanup/restart helper used for this run: `dogfood-output/bloom-cleanup-restart-2026-07-01.py`
- QA script used for this run: `dogfood-output/bloom-nightly-stabilization-2026-07-01.mjs`

## Next action for Periwinkle

- App is safe for daytime use based on this run.
- Keep BUG-20260624-018 open until real same-phone overnight persistence is accepted.
- Retest BUG-20260701-022 after the approved 9:00 PM IST deploy is live.
