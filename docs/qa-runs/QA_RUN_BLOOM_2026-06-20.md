# Bloom nightly launch-week QA run — 2026-06-20

- Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`.
- Tester accounts: Bloom QA Admin and Bloom QA Agent only, from the assigned Bloom credential file.
- Result: **No new Critical or High launch-blocking bug confirmed in this run.**

## What was tested

- Live API health and live frontend availability.
- Login/session: empty login, wrong password, Bloom admin login, Bloom agent login, session validation, direct admin API access blocked for agent role.
- Role correctness: admin users list still shows `sales@crystalbio.in` as Raghavendra/admin.
- Agent attendance: clean start, check-in with Sales + Service + In office work modes, repeated Check in blocked, refresh/session current attendance persisted, checkout, check-in again after break, final checkout.
- Agent Sales and Service API flows: Step 1, Step 2, Step 3 saves with long/special-character field values.
- Persistence/data visibility: saved Bloom Sales/Service records reappeared in agent own entries and admin Field Entry team entries.
- Admin review/reporting: Field Entry team list, selected detail endpoint, admin reports API, attendance PDF endpoint.
- Leave request save and admin approvals visibility.
- Mobile UI smoke with headless Chromium at 390x844: wrong login error, agent Home, Visits/My Entries, saved-entry continuation, admin Overview, Field Entry All entries, Field Entry detail, Reports.
- Console/log check during UI smoke.
- Bloom-only cleanup after evidence capture.

## What passed

- API health returned `{"status":"ok"}`.
- API E2E passed **23/23** checks.
- Mobile UI smoke passed **8/8** checks after using assigned Bloom credentials.
- Saved Sales/Service records persisted through API/session checks and were visible to both agent and admin before cleanup.
- Saved-entry continuation opened a Bloom saved Service entry with `CONTINUE SAVED ENTRY`, follow-up controls, and Step 1/2/3 sections, not a blank pending form.
- Admin Field Entry All entries loaded on mobile and could open Bloom saved detail while the test record existed.
- Attendance PDF endpoint returned `application/pdf`.
- Agent role was blocked from admin agents API with 403.
- `sales@crystalbio.in` appeared as Raghavendra/admin in admin profile data.

## What failed

- No new Critical/High launch-blocking bug was confirmed.
- Console notes only:
  - Expected `400` login request during wrong-password test.
  - Existing non-blocking PWA meta warning: deprecated `apple-mobile-web-app-capable` message.

## Cleanup

- Bloom-created QA records were removed using the documented Bloom-only cleanup path after dry-run and write.
- Dry-run/write removal count: 2 Bloom attendance rows, 1 Bloom Sales record/visit, 1 Bloom Service record/visit, and 1 Bloom leave request.
- Backend was restarted after file cleanup and API health returned OK.
- Post-clean check: admin login OK, 30 team entries still visible, no `BLOOM QA NIGHT 20260620` text remaining, no Bloom QA leave request remaining.

## Evidence

- API E2E result: `dogfood-output/bloom-night-live-api-2026-06-20.json`.
- UI smoke result: `dogfood-output/bloom-night-ui-cdp-2026-06-20.json`.
- API health: `dogfood-output/evidence/bloom-health-2026-06-20.json`.
- Live frontend HTTP check: `dogfood-output/evidence/bloom-app-home-2026-06-20.html`.
- Cleanup dry-run: `dogfood-output/bloom-night-cleanup-dry-run-2026-06-20.json`.
- Cleanup write: `dogfood-output/bloom-night-cleanup-write-2026-06-20.json`.
- Post-clean check: `dogfood-output/bloom-night-post-clean-check-2026-06-20.json`.
- Screenshots:
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-agent-home-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-agent-visits-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-agent-saved-entry-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-admin-overview-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-admin-field-entry-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-admin-field-detail-2026-06-20.png`
  - `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-ui-admin-reports-2026-06-20.png`

## Blocked / not deeply tested

- Bloom did not log in as `sales@crystalbio.in` because Bloom must not use real employee credentials. Role correctness was checked from the admin profile list only.
- Full manual typing through every visible Sales/Service field in browser UI was not repeated tonight; API save/persistence plus mobile UI smoke were tested.
- Camera/upload capture was not tested with real device camera.

## Next action for Periwinkle

- No new Iris fix should be started from this run.
- Keep monitoring the existing location-permission/no-user-path log item and attendance repeat-error item, but do not approve routine fixes from historical/no-context logs alone.

---

# Bloom 2:30 AM IST Iris-fix retest sweep — 2026-06-20 / 2026-06-21 IST

- Time checked: 2026-06-20 21:01 UTC / 2026-06-21 02:31 IST.
- Scope requested: retest only items marked `Ready for Bloom retest`, plus one nearby normal scenario and one edge scenario for each.
- Result: **No current bug item in `docs/BUG_INTAKE_BOARD.md` is explicitly marked `Ready for Bloom retest`.** Bloom did not move any bug to `Verified by Bloom` in this sweep.

## Live checks performed

- API health check passed: `https://work-api.convogenie.ai/health` returned HTTP 200 and `{"status":"ok"}`.
- Frontend network check passed: `https://work.convogenie.ai` returned HTTP 200 and saved the app HTML.
- Mobile CDP login-page smoke passed at 390x844: page title `Crystal Bio Field Hub`, visible login text loaded, and there were no captured browser console messages, runtime exceptions, HTTP >=400 responses, or network failures.
- Hermes browser-tool navigation timed out twice on the live app in this cron environment, so Bloom used the repo CDP/Chromium path for the mobile/console evidence instead of claiming a browser-tool pass.

## Evidence

- Frontend HTML: `dogfood-output/evidence/bloom-retest-app-home-2026-06-20.html`.
- Mobile/console CDP result: `dogfood-output/bloom-retest-cdp-console-check-2026-06-20.json`.
- Mobile screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-login-mobile-2026-06-20.png`.
- Browser-tool blocker: `browser_navigate` timed out for `https://work.convogenie.ai` and `https://work.convogenie.ai/?bloomRetest=20260620T2101`.

## Next action

- No Iris retest is pending until Periwinkle/Iris marks a specific item `Ready for Bloom retest`.
- Continue normal live monitoring only; do not start a new fix from this sweep.
