# Bloom nightly heavy QA run — 2026-06-21

## Plain-English summary

Bloom tested the live CrystalBio app and API for the launch-week nightly run using only the assigned Bloom QA admin and agent accounts.

- Live API health passed.
- Bloom admin and Bloom field-agent login by tapping `Login` passed.
- Save/refresh/fresh-login persistence passed at API level for Attendance, Sales, Service, Leave, Admin Field Entry, Admin Reports, and PDF download.
- Role access passed: Bloom field-agent was blocked from admin reports, Bloom admin could load admin review/report data, and `sales@crystalbio.in` was visible in Profile/access as Raghavendra with admin role.
- Bloom-created Sales/Service/Attendance/Leave test records were removed after evidence capture with the approved Bloom-only cleanup path, backup, backend restart, and post-clean verification.
- One Medium login usability regression was found: pressing Enter/Go from the password field does not submit login, although tapping `Login` still works.

## Environment and accounts

- Live app: `https://work.convogenie.ai`
- API health: `https://work-api.convogenie.ai/health`
- Time: 2026-06-21 15:31–15:38 UTC
- Accounts used: `bloom.admin@crystalbio.in`, `bloom.agent@crystalbio.in`
- Mobile UI viewport: 390x844 Chromium/CDP
- Hermes browser tool note: direct browser-tool navigation to the live app timed out in this cron environment, so CDP/Chromium plus live API checks are the UI evidence for this run.

## Evidence files

- API E2E evidence: `dogfood-output/bloom-night-live-api-2026-06-21.json`
- API E2E runner: `dogfood-output/bloom-night-heavy-api-2026-06-21.mjs`
- Mobile UI/CDP evidence: `dogfood-output/bloom-live-qa-cdp-results.json`
- Login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-live-login-start.png`
- Admin login success screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
- Agent login success screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`
- Enter/Go failure screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`
- Direct admin without session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-direct-admin-no-session.png`

## What was tested

### Login and session

Passed:

- API health returned HTTP 200 / `{"status":"ok"}`.
- Empty login was blocked.
- Wrong password was blocked.
- Bloom admin login by tapping `Login` passed and opened Admin overview.
- Bloom agent login by tapping `Login` passed and opened Agent home.
- Admin and agent session validation passed through `/auth/session`.
- Direct admin URL without a session stayed on Login.

Failed:

- Pressing Enter/Go from the password field did not send an `/auth/login` request and stayed on Login.

### Role access and profile/access

Passed:

- Bloom agent token was blocked from `/admin/reports` with HTTP 403.
- Bloom admin loaded `/admin/agents` successfully.
- `sales@crystalbio.in` was visible in the admin agents/profile data as Raghavendra with admin role.

### Attendance

Passed:

- Bloom agent current attendance loaded.
- If a previous Bloom check-in was open, Bloom checked out before starting this run.
- Check-in with GPS and selected work mode passed.
- Repeated same-day check-in was blocked by backend validation.
- `/attendance/current` still showed the active check-in after refresh-style API reload and fresh login.
- Check-out passed.
- Check-in again after checkout/break passed.
- Final checkout passed before cleanup.

### Sales flow

Passed:

- Empty Sales Step 1 was blocked.
- Sales Step 1 save passed with long/special-character Bloom QA customer text.
- Sales visit update passed with follow-up date.
- Sales Step 2 save passed.
- Sales Step 3 save passed.
- Invalid follow-up edge case was blocked.
- Saved Sales entry appeared in agent My Entries and admin Field Entry All entries, then persisted after fresh admin login.

### Service flow

Passed:

- Empty Service Step 1 was blocked.
- Service Step 1 save passed with long/special-character Bloom QA customer text.
- Service visit update passed with next visit date.
- Service Step 2 save passed.
- Service Step 3 save passed.
- Invalid next-visit-date edge case was blocked.
- Saved Service entry appeared in agent My Entries and admin Field Entry All entries, then persisted after fresh admin login.

### Admin review/reports

Passed:

- Admin Field Entry team list loaded.
- Admin Field Entry selected detail loaded for the Bloom-created saved entry.
- Admin leave/Approvals list loaded.
- Admin Reports JSON loaded with a totals object.
- Admin Reports PDF download returned HTTP 200 and `application/pdf`.
- Admin client-error log list loaded.
- Public monitor snapshot loaded.

### Mobile layout and console/API errors

Passed/observed:

- Login, admin overview, and agent home rendered at 390x844 mobile size.
- Agent home kept the full-screen mobile pattern and showed recent visits in readable customer-first cards.
- Admin overview loaded without visible blank-screen failure.
- No runtime exception was captured in the CDP run.
- Known non-blocking PWA warning appeared again: `apple-mobile-web-app-capable` deprecation. This remains polish only and is not a launch blocker.

## Confirmed bug from this run

### BUG-20260621-014 — Password-field Enter/Go does not submit login again

- Severity: Medium
- Category: UX / Functional
- Status: Needs Periwinkle review
- Journey tested: Login/session on live mobile Chromium/CDP
- Scenario tested: User fills registered email and password, then presses keyboard Enter/Go from the password field.
- Steps to reproduce:
  1. Open `https://work.convogenie.ai`.
  2. Enter Bloom admin email and password on the login screen.
  3. Focus the password field.
  4. Press Enter/Go.
- Expected result: The app sends one `/auth/login` request and logs in, same as tapping the visible `Login` button.
- Actual result: No `/auth/login` request was sent, the login screen remained visible, and the typed email/password stayed in the fields.
- Nearby normal path: tapping the visible `Login` button logs in successfully for both Bloom admin and Bloom agent.
- Evidence: `dogfood-output/bloom-live-qa-cdp-results.json`, screenshot `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`.
- Launch/pilot impact: Medium; users can still tap `Login`, but phone keyboard Go/Enter may feel broken and this appears to regress previously verified behavior.
- Suggested owner: Periwinkle review first. Iris must not fix until Periwinkle/Rahul approves this specific bug.

## 2:30 AM Iris-fix retest update — 2026-06-21 21:08 UTC

### Plain-English retest result

Bloom retested the only item marked `Ready for Bloom retest`: BUG-20260621-014 password-field Enter/Go login. The fix passed on the live app.

- Live app/API: `https://work.convogenie.ai`, `https://work-api.convogenie.ai/health`
- Live frontend version observed: `20260621111338`
- Device/viewport: 390x844 mobile Chromium/Puppeteer
- Accounts used: assigned Bloom QA Admin and Bloom QA Agent only
- No Sales/Service/Attendance/Leave data was created in this retest, so no cleanup was needed.

### What was retested

Passed:

- Original admin bug path: filled Bloom QA Admin email/password, pressed Enter/Go from the password field, saw one normal `/auth/login` POST, and landed on Bloom QA Admin overview.
- Original field-agent path: filled Bloom QA Agent email/password, pressed Enter/Go from the password field, saw one normal `/auth/login` POST, and landed on Bloom QA Agent home.
- Nearby normal scenario: tapping the visible `Login` button still logs in Bloom QA Admin normally.
- Edge scenario 1: pressing Enter on an empty login screen sent no auth request and stayed safely on Login.
- Edge scenario 2: wrong password + Enter/Go sent one expected `/auth/login` POST with HTTP 400 and showed `Invalid email or password`.
- Edge scenario 3: direct `/admin` without a session stayed on the Login screen.

### Console/API and mobile notes

- No page runtime exceptions were captured.
- No failed requests were captured in the passing/safe scenarios.
- The only API HTTP error was the intentional wrong-password HTTP 400 edge case.
- Login, Admin overview, and Agent home rendered in the mobile viewport with the existing sage/olive full-screen baseline preserved.

### Retest evidence

- Summary JSON: `dogfood-output/bloom-retest-login-enter-2026-06-21-summary.json`
- Raw network/console/UI run: `dogfood-output/bloom-retest-login-enter-2026-06-21-puppeteer-v3.json`
- Admin Enter/Go success: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-admin-enter-success-2026-06-21.png`
- Agent Enter/Go success: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-agent-enter-success-2026-06-21.png`
- Nearby button-login success: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-button-login-admin-2026-06-21.png`
- Empty login edge: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-empty-login-2026-06-21.png`
- Wrong-password edge: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-wrong-password-enter-2026-06-21.png`
- Direct admin without session: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-direct-admin-no-session-2026-06-21.png`

### Status after retest

- BUG-20260621-014 is now **Verified by Bloom**.
- Final acceptance still belongs to Periwinkle/Rahul.

## Cleanup

Bloom cleanup was completed after evidence capture:

- Dry-run/write path: `npm run clean:pilot-data -- --bloom-only` followed by `--write`.
- Backup created: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-06-21T15-35-34-717Z.bak`.
- Live DB path used: `/var/lib/crystalbio/crystalbio-db.json`.
- Bloom-only records removed: 2 attendance rows, 1 Sales record / 1 Sales visit, 1 Service record / 1 Service visit, and 1 leave request.
- Backend restarted: `crystalbio-backend.service`.
- Post-clean check: API health OK, Bloom current attendance is `null`, and the run marker `BLOOM QA NIGHT 20260621` was no longer visible in agent/admin field entries or leave data.

## Blocked / not fully tested

- Real employee credentials were not used; Bloom is restricted to assigned QA accounts only.
- Real-device camera capture/upload was not tested in this cron run.
- The missed-previous-day checkout edge case was not recreated by creating stale live data; normal check-in/repeated tap/refresh/fresh-login/checkout/re-check-in passed.
- Hermes browser-tool navigation timed out, so mobile UI evidence comes from Chromium/CDP screenshots and network/console capture.

## Next action for Periwinkle

- Review BUG-20260621-014 and decide whether to approve a small Iris fix for login Enter/Go submission.
- No Critical or High launch-blocking bug was confirmed tonight.
- Iris must not fix or deploy anything from this run unless Periwinkle/Rahul explicitly approves BUG-20260621-014 or another specific item.
