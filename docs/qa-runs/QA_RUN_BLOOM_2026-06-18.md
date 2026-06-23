# Bloom QA Run — 2026-06-18 Nightly launch-week heavy QA

## Plain-English summary

Bloom tested the live CrystalBio app and live API using only the assigned Bloom QA admin and Bloom QA field-agent accounts.

Result: no new Critical or High launch-blocking bugs were confirmed in this run. Login, role access, Sales/Service save + persistence, admin review/report visibility, PDF export, logout, mobile navigation smoke checks, and Bloom-only cleanup passed.

## Environment

- Live app: `https://work.convogenie.ai`
- Live API health: `https://work-api.convogenie.ai/health`
- Time: 2026-06-18 15:37–15:40 UTC
- Accounts used: `bloom.admin@crystalbio.in`, `bloom.agent@crystalbio.in`
- Evidence JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-night-qa-2026-06-18-v2-results.json`

## What was tested

### Login/session and role access

- API health endpoint.
- Empty login validation.
- Wrong-password validation.
- Bloom field-agent login.
- Bloom admin login.
- Direct admin URL access without session.
- Agent token blocked from admin report API.
- Mobile UI login for wrong password, field agent, and admin.
- Logout from the mobile UI.

### Agent daily work and persistence

- Attendance check-in with selected work modes: Sales visit + Service visit + In office.
- Repeated same-day check-in attempt.
- Check-out.
- Sales Step 1 opportunity create.
- Sales Step 2 and Step 3 data persistence through API.
- Sales visit update creation.
- Service record create with Step 2/Step 3 saved.
- Service visit update creation.
- Agent previous entries after save.
- Fresh agent login and previous-entry persistence.
- Mobile UI smoke: Home, Visits, Attendance.

### Admin review/reports

- Admin Field Entry team list shows Bloom-created Sales/Service entries before cleanup.
- Admin Reports API returns summary totals.
- Admin PDF export returns a real PDF.
- Admin mobile UI smoke: Overview, Field Entry, Agents, Reports, Approvals, Profile.
- Admin overview did not show the removed `Latest submitted work` section.
- Profile access list showed `sales@crystalbio.in` as `Raghavendra K` with Admin role in the captured text.

### Mobile/console

- Mobile viewport: 390×844, touch/mobile context.
- Console/page errors monitored during navigation and interactions.
- One expected browser console `400` appeared during wrong-password login; no unexpected page crash was recorded.

## What passed

- Live API health returned `200 {"status":"ok"}`.
- Empty login and wrong password were rejected safely.
- Bloom agent logged in as role `both`; Bloom admin logged in as role `admin`.
- Direct admin URL without session returned to the login experience.
- Agent access was blocked from admin reports with `403 Admin access is required`.
- Attendance check-in saved selected work modes and check-out worked.
- Repeated same-day check-in returned the expected `Agent is already checked in` message.
- Sales and Service save flows created records and visit updates successfully.
- Saved Bloom entries appeared in agent previous entries, remained after fresh login, and appeared to admin in Field Entry team data.
- Admin report API and PDF export worked.
- Main admin and agent mobile screens opened without confirmed layout-breaking or crash evidence.
- Bloom-created QA data was removed after evidence capture.

## Failed / confirmed bugs

No new confirmed Critical/High/Medium/Low product bugs were added from this run.

## Blocked / not fully tested

- A full real-user `sales@crystalbio.in` login was not tested because Bloom is restricted to assigned Bloom QA credentials only. Role visibility was checked from the admin Profile screen text instead.
- Deep manual UI filling of every Sales/Service Step 1/2/3 field was not completed in this run; API-level save/persistence plus mobile screen smoke were completed.
- The previous-day missed-checkout edge case from BUG-20260618-009 was not recreated because Bloom should not create stale attendance rows in live pilot data. Same-day repeated check-in and normal check-out were tested and passed.

## Evidence screenshots

- Direct admin without session: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-direct-admin-no-session.png`
- Wrong-password UI: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-ui-wrong-password.png`
- Agent home: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-ui-agent-home.png`
- Agent Visits: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-agent-visits.png`
- Agent Attendance: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-agent-attendance.png`
- Admin overview: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-ui-admin-overview.png`
- Admin Field Entry: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-admin-field-entry.png`
- Admin Agents: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-admin-agents.png`
- Admin Reports: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-admin-reports.png`
- Admin Approvals: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-admin-approvals.png`
- Admin Profile: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-v2-admin-profile.png`

## Cleanup

Bloom-created QA data was cleaned using the documented Bloom-only live DB cleanup path after evidence was captured.

Dry-run/write cleanup result:

- Removed Bloom attendance rows: 1
- Removed Bloom Sales records: 2
- Removed Bloom Service records: 2
- Removed Bloom Sales visits: 1
- Removed Bloom Service visits: 1
- Removed Bloom leave rows: 0
- Real user sessions/activity were not reset.
- Post-clean check showed 0 Bloom attendance/Sales/Service/leave rows.
- API health remained OK after cleanup.

## Next action for Periwinkle

- No new launch-blocking bug needs Iris approval from this run.
- Keep BUG-20260618-009 under Periwinkle/Rahul deployment review for the already-documented previous-day missed-checkout behavior; Iris must not do additional routine fixes unless approved.

---

## 2:30 AM IST Iris-fix retest sweep — 2026-06-18 21:01 UTC

### Plain-English summary

Bloom checked the current bug queue for items explicitly marked `Ready for Bloom retest`. No current item had that status, so Bloom did not retest or verify any Iris fix in this sweep.

### What was checked

- Read current `docs/BUG_INTAKE_BOARD.md` and searched repo docs for `Ready for Bloom retest` status.
- Confirmed live API health with `https://work-api.convogenie.ai/health`.
- Confirmed the live frontend returned HTTP 200 HTML by network check.

### Result

- No bugs were moved to `Verified by Bloom` because no bug was ready for Bloom retest.
- Live API health passed: `{"status":"ok"}`.
- Live frontend network availability passed: HTTP 200.

### Blocked / not tested

- The Hermes browser session timed out while loading the live app, so Bloom could not make any new UI/console/mobile-layout pass/fail claim in this sweep.
- Because no item was marked `Ready for Bloom retest`, Bloom did not run nearby normal/edge scenarios against already-verified or not-approved items.

### Evidence

- API health command output: `curl -sS -m 20 https://work-api.convogenie.ai/health` → `{"status":"ok"}`.
- Frontend network check: `https://work.convogenie.ai` → HTTP 200 `text/html; charset=utf-8`.
- Browser-tool blocker: `browser_navigate("https://work.convogenie.ai")` timed out after 60 seconds.

### Next action for Periwinkle/Iris

- If Iris has a fix ready tonight, mark the exact item `Ready for Bloom retest` in `docs/BUG_INTAKE_BOARD.md`; Bloom should then retest that exact journey with one nearby normal and one edge scenario.
