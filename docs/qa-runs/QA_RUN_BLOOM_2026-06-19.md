# Bloom Night Heavy QA Run — 2026-06-19

## Scope

Live app: `https://work.convogenie.ai`
Live API: `https://work-api.convogenie.ai`

This was the launch-week nightly heavy QA run using only the assigned Bloom QA accounts:

- `bloom.admin@crystalbio.in`
- `bloom.agent@crystalbio.in`

## Evidence files

- API E2E result: `dogfood-output/bloom-night-api-e2e-2026-06-19.json`
- UI CDP result: `dogfood-output/bloom-night-ui-cdp3-2026-06-19.json`
- Attendance UI result: `dogfood-output/bloom-night-attendance-ui-2026-06-19.json`
- Downloaded attendance PDF: `dogfood-output/bloom-night-attendance-report-2026-06-19.pdf`
- Screenshots:
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-login.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-wrong-password.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-agent-home.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-agent-refresh.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-agent-attendance.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-agent-visits.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-admin-overview.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-admin-field-entry.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night3-admin-reports.png`

## What passed

- API health returned `{"status":"ok"}`.
- Login validation behaved safely:
  - empty login returned `Email is required`,
  - wrong password returned `Invalid email or password`,
  - Bloom QA Admin logged in as `Bloom QA Admin` with role `admin`,
  - Bloom QA Agent logged in as `Bloom QA Agent` with role `both`.
- Agent session persisted after browser refresh.
- Agent mobile pages loaded: Home, Attendance, Visits / My Entries.
- Admin mobile pages loaded: Overview, Field Entry, Reports.
- Sales API journey passed end-to-end for Bloom QA Agent:
  - Step 1 opportunity save: `201`,
  - visit save: `201`,
  - Step 2 update: `200`,
  - Step 3 update: `200`.
- Service API journey passed end-to-end for Bloom QA Agent:
  - Step 1 service record save: `201`,
  - visit save: `201`,
  - Step 2 update: `200`,
  - Step 3 update: `200`.
- Saved Bloom Sales/Service entries appeared under the agent's own entries and Admin Field Entry team lookup before cleanup.
- Sales and Service detail rows showed `Step 2 status: Saved` and `Step 3 status: Saved`.
- Admin report API loaded real saved backend data.
- Attendance PDF endpoint returned HTTP `200` with `application/pdf`.
- Approved sage/olive full-screen mobile direction was visible on tested login, agent, and admin pages.

## Attendance checks

- Normal check-in API with GPS and work types succeeded (`201`).
- Same-session repeated raw API check-in returned `400 Agent is already checked in`.
- Check-out after check-in succeeded (`200`).
- Check-in again after checkout succeeded (`201`).
- Final cleanup verified Bloom QA attendance no longer appears in admin report counts after cleanup.

Note: the repeated raw API `400` is recorded as watch evidence only, not a new launch bug in this run, because the visible app state is designed to move users to Check out after a successful check-in. Periwinkle should continue watching real-user repeated-tap logs under existing attendance bug history.

## Console / browser notes

No product-breaking JavaScript crash was captured in the headless UI run.

Observed non-blocking browser warnings:

- Deprecated PWA meta warning: `<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. Please include <meta name="mobile-web-app-capable" content="yes">`
- Expected network console error after wrong-password test: `Failed to load resource: the server responded with a status of 400 ()`

The Hermes browser tool timed out on this live site twice, so Bloom used headless Chromium/CDP as the browser evidence path for UI checks and screenshots.

## Cleanup

Bloom-created QA data was cleaned from the live DB using the Bloom-only cleanup path with backup creation:

- Command: `CRYSTALBIO_DB_PATH=/var/lib/crystalbio/crystalbio-db.json npm run clean:pilot-data -- --bloom-only --write`
- Removed in first cleanup: 4 Bloom attendance records, 1 Bloom Sales record/visit, 1 Bloom Service record/visit.
- Backend was restarted after cleanup.
- Post-clean verification: API health OK; Admin Field Entry team lookup had `0` Bloom QA entries; Bloom report summaries showed 0 Sales, 0 Service, and not checked in.
- Second cleanup removed 0 records, confirming no new Bloom QA records remained from the later UI smoke attempt.

## Bugs found

No new Critical or High launch-blocking bugs were confirmed in this run.

## Items for Periwinkle review

1. BUG-20260619-010, BUG-20260619-012, and BUG-20260619-013 are now verified by Bloom on live; they still need Periwinkle/Rahul final acceptance.
2. Keep watching real-user repeated check-in logs under the existing attendance issue history. Raw duplicate check-in still returns a backend 400, while the intended UI should prevent normal users from needing that path.
3. Bloom's QA records were cleaned; do not bulk-delete or touch real-user records.

## 2:30 AM IST Iris-fix retest addendum — 2026-06-19 21:08 UTC

### Scope

Retested Iris night fixes that still needed Bloom evidence:

- BUG-20260619-010 downloaded attendance PDF report.
- BUG-20260619-012 Admin Field Entry list weight / all-entry visibility / detail loading.
- BUG-20260619-013 saved-entry detail/action cleanup, including the previously blocked agent Sales/Service continuation path.

### Result

- Overall: **Passed** for the tested live journeys.
- No new Critical or High launch-blocking bug was found.
- Browser console errors during tested mobile journeys: **0**.
- Live API health after cleanup/restart: `{"status":"ok"}`.

### Evidence

- Main retest result: `dogfood-output/bloom-night-retest-after-iris-2026-06-19.json`
- Attendance PDF: `dogfood-output/evidence/bloom-night-retest-attendance-report-2026-06-01-to-2026-06-19.pdf`
- PDF extracted text/QDF: `dogfood-output/evidence/bloom-night-retest-attendance-report-2026-06-01-to-2026-06-19.txt`
- Screenshots:
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-retest-agent-visits-1781903391492.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-retest-agent-sales-detail-1781903391492.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-retest-agent-service-detail-1781903391492.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-retest-admin-field-entry-1781903391492.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-retest-admin-detail-1781903391492.png`

### What passed

- BUG-20260619-010: live attendance PDF returned HTTP 200, `application/pdf`, `%PDF`, and the extracted PDF stream contains the summary-first attendance exception/office-action content (`Attendance exceptions and office action`, `Still checked in`, `No update`). The old wide-table-first `Person-wise attendance` heading was not found.
- BUG-20260619-012: `/field-visits?scope=team` returned 30 entries in about 32 KB with 0 list `photoPayload` fields; Admin Field Entry mobile All entries showed `30 of 30 shown`; detail opened without console errors.
- BUG-20260619-013: Agent Previous entries reopened a Bloom Sales saved entry with saved Step 2/3 status instead of a blank pending form; a partial/edge Service entry opened with Step 2 and Step 3 fields directly visible, without a separate `Complete pending details` journey; Admin Field Entry detail showed customer/contact/product/agent-first copy and no read-only/helper/status clutter.

### Normal and edge scenarios covered

- Normal: saved Sales entry with Step 2 and Step 3 completed, reopened from Agent Previous entries and Admin Field Entry.
- Edge: long/special-character Service customer name with only Step 1 saved; pending Step 2/3 fields were visible directly in the original form flow.

### Cleanup

- Bloom-only dry run showed 5 Bloom Sales records/visits and 5 Bloom Service records/visits to remove.
- Bloom-only write cleanup removed those records and created a pre-clean backup automatically.
- Backend restarted after cleanup.
- Post-clean verification: Admin team Field Entry lookup returned 30 entries with `0` `BLOOM-QA-RETEST-013` mentions and `0` Bloom QA Agent mentions; API health OK.
