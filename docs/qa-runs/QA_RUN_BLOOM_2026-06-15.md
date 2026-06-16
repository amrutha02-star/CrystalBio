# Bloom QA Run — 2026-06-15 Heavy End-to-End QA

## Plain-English owner summary

Bloom started a heavy end-to-end QA run on the live CrystalBio app after receiving dedicated QA admin and field-agent test accounts.

Important result: the live app and API are online, but both new QA accounts are currently rejected by the live backend as invalid login credentials. Because of that, Bloom could not enter the admin or field-agent areas and could not complete true end-to-end save / refresh / logout-login / admin-visibility testing yet.

What this means in simple terms: the test accounts appear not to be active on the live backend yet, or the live backend has different passwords than the ones provided.

## Environment tested

- Live app: https://work.convogenie.ai
- Live API: https://work-api.convogenie.ai/health
- Time checked: 2026-06-15 18:22 UTC
- Viewport used for UI checks: phone-sized headless Chromium
- Build/test check: local repo `/root/workspace/CrystalBio`
- QA admin email tested: `bloom.admin@crystalbio.in`
- QA field-agent email tested: `bloom.agent@crystalbio.in`

## What was tested

### Live health and access control

- API health endpoint.
- Frontend HTTP load.
- Unauthenticated protected API routes:
  - `/auth/session`
  - `/admin/agents`
  - `/admin/reports`
  - `/admin/leave-requests`
  - `/field-visits`
  - POST `/attendance/check-in`
  - POST `/sales-opportunities`
  - POST `/service-records`
  - POST `/leave-requests`

### Login/session

- Live login screen load.
- QA admin login using the provided admin account.
- QA field-agent login using the provided agent account.
- Password-field Enter/Go behavior retest.
- Direct admin URL without a logged-in session: `https://work.convogenie.ai/?screen=admin`.

### Automated repo checks

- `npm test -- --run`
- `npm run build`

## What passed

- API health returned OK: `{"status":"ok"}`.
- Frontend returned HTTP 200 and loaded the CrystalBio login screen.
- Protected API routes correctly rejected unauthenticated access with `HTTP 401` and `Login session is required`.
- Direct admin URL without a session stayed on the login screen instead of exposing admin content.
- Local automated tests passed: 10 test files, 93 tests passed.
- Local production build passed.

## What failed / blocked

### BUG-20260615-001 — Password-field Enter/Go does not submit login on live app

- Severity: Medium
- Category: Login/session usability
- Status: **Bloom retest failed on live / not verified fixed**
- Environment: Live app
- Journey tested: Login/session
- Scenario tested: user types email and password, then presses Enter/Go on keyboard instead of tapping the Login button.
- Expected result: Login submits, same as tapping the Login button.
- Actual result: No `/auth/login` request was observed from the Enter/Go action in the live app retest.
- Evidence:
  - Screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`
  - CDP result file: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- Launch/pilot impact: Phone users may press keyboard Go and think login is broken. Tapping Login remains the workaround.
- Next action for Periwinkle: Confirm whether Iris's fix has been deployed to the live frontend. If it has not been deployed, deploy/retest. If it has been deployed, Iris should re-check the live build.

### BUG-20260615-002 — New Bloom QA admin and field-agent accounts cannot log in

- Severity: High
- Category: Login/session / QA blocker
- Status: Needs Periwinkle review
- Environment: Live API and live app
- Journey tested: Admin login and field-agent login
- Scenario tested: login with the provided Bloom QA Admin and Bloom QA Agent accounts.
- Expected result:
  - `bloom.admin@crystalbio.in` logs in as admin.
  - `bloom.agent@crystalbio.in` logs in as a field user with Sales + Service access.
- Actual result:
  - Both accounts returned `HTTP 400` with `Invalid email or password` from the live API.
  - The live app stayed on the login screen.
- Evidence:
  - Direct API login check returned invalid credentials for both QA emails.
  - API evidence file: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-check.json`
  - Admin screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
  - Agent screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`
  - CDP result file: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- Launch/pilot impact: Bloom cannot complete live end-to-end testing until these test accounts are active. This blocks admin/agent persistence testing, role testing, reports/PDF checks, and admin visibility checks.
- Next action for Periwinkle: Create/activate these two accounts on the live backend, or confirm the correct live passwords. After that, Bloom should immediately rerun the full end-to-end suite.

## What was blocked/not fully tested

Blocked because the provided QA accounts could not log in:

- Successful admin login.
- Successful field-agent login.
- Admin overview, Agents, Field Entry, Approvals, Reports, Profile.
- Agent home, check-in/check-out, Attendance, Leave, Visits/My Entries.
- Sales Step 1 / Step 2 / Step 3 save and reopen.
- Service Step 1 / Step 2 / Step 3 save and reopen.
- Save, refresh, logout/login persistence.
- Admin visibility of newly saved field-agent entries.
- PDF report download behind admin login.
- Role-specific access after login.

## Evidence files

- Login start screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-live-login-start.png`
- Admin login attempt screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
- Admin Enter/Go attempt screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`
- Agent login attempt screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`
- Direct admin no-session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-direct-admin-no-session.png`
- CDP result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- QA account API check JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-check.json`

## Periwinkle next action

1. Activate or correct the two Bloom QA test accounts on the live backend.
2. Confirm whether the Enter/Go login fix has actually been deployed to the live app.
3. Once login works, Bloom should continue the heavy run immediately: admin journey, agent journey, Sales/Service saves, refresh persistence, logout/login persistence, admin visibility, and reports/PDF.

---

## Retest update — 2026-06-15 20:15 UTC

Bloom rechecked after the QA accounts were updated.

### What now passes

- Bloom QA Admin login now works on the live API and live app.
  - User: `Bloom QA Admin`
  - Role: `admin`
  - Employee ID: `QA-BLOOM-ADMIN`
- Bloom QA Agent login now works on the live API and live app.
  - User: `Bloom QA Agent`
  - Role: `both` / Sales + Service
  - Employee ID: `QA-BLOOM-AGENT`
- Fresh direct admin URL without session still returns to Login instead of exposing admin content.
- Agent API end-to-end save flow passed:
  - login/session refresh,
  - check-in,
  - Sales opportunity create,
  - Sales Step 1 visit save,
  - Sales Step 2 patch,
  - Sales Step 3 patch,
  - Service record create,
  - Service Step 1 visit save,
  - Service Step 2 patch,
  - Service Step 3 patch,
  - check-out.
- Agent field-visits API shows the newly saved Bloom QA Sales and Service entries.
- Admin report API shows the newly saved Bloom QA Sales and Service entries.
- Admin PDF report download works: HTTP 200, `application/pdf`, valid PDF bytes.
- Admin team field-visits API with `scope=team` shows the newly saved Bloom QA Sales and Service entries.

### Still failing / still needs deployment check

- BUG-20260615-001 remains not verified fixed on the live app: pressing Enter/Go from the password field still did not submit login in the fresh CDP retest. Tapping the visible Login button works.

### Evidence from this retest

- QA account API recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-recheck.json`
- Live app CDP recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- Full live API E2E result: `/root/workspace/CrystalBio/dogfood-output/bloom-live-e2e-api-recheck.json`
- Admin team field-visits recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-admin-team-field-visits-recheck.json`
- Admin login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
- Agent login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`

### Updated Periwinkle next action

1. Treat BUG-20260615-002 as verified fixed by Bloom.
2. Confirm/deploy the login Enter/Go fix, then ask Bloom to retest BUG-20260615-001 again.
3. Continue browser-level mobile UI QA for the actual Sales/Service screens, because the API E2E save path now passes.
---

## Retest update — 2026-06-15 21:07 UTC

Bloom retested the one item that was marked ready for retest: **BUG-20260615-001 — Password-field Enter/Go does not submit login**.

### Result

- **Not verified fixed on live.** The live app still shows the old behavior.
- Mobile CDP check still reports the password field is not inside a form.
- Pressing Enter/Go from the password field sent **no** `/auth/login` request.
- Tapping the visible Login button still works as the nearby normal scenario: it sent `/auth/login` and showed the normal `Invalid email or password` message for the intentionally wrong password.
- Empty login edge scenario stayed on Login and showed `Login details required` without exposing the app.
- Direct admin URL without session stayed on Login and did not expose admin content.
- API health was OK: `{"status":"ok"}`.

### Evidence from this retest

- CDP result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-retest-login-enter-2026-06-15.json`
- Login start screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-login-start-2026-06-15.png`
- Enter/Go failed retest screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-enter-wrong-password-2026-06-15.png`
- Normal button wrong-password screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-click-wrong-password-2026-06-15.png`
- Empty login edge screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-empty-login-2026-06-15.png`
- Direct admin no-session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-direct-admin-no-session-2026-06-15.png`

### Periwinkle next action

Please confirm whether Iris's form fix has actually been deployed to `https://work.convogenie.ai`. If it has been deployed, Iris should re-check the live build because Bloom still sees the old no-form/no-Enter-submit behavior on live.

---

## Mobile browser QA update — 2026-06-16 00:49 UTC

Bloom continued with browser-level mobile UI testing for the live field-agent Sales/Service screens using the Bloom QA Agent account.

### What was tested

- Live app at `https://work.convogenie.ai`
- Mobile viewport: 390 x 844
- Agent Home and Visits screen
- New Sales visit:
  - empty Step 1 save attempt,
  - location permission,
  - Step 1 save,
  - Step 2 filled save,
  - Step 3 filled save,
  - refresh persistence.
- New Service visit:
  - empty Step 1 save attempt,
  - location permission,
  - Step 1 save,
  - Step 2 filled save,
  - Step 3 filled save,
  - refresh persistence.
- Console/network errors during the run.

### What passed

- Agent login opened the correct Bloom QA Agent field-agent home.
- Visits screen opened and showed the Sales and Service new-entry choices.
- Sales Step 1 saved successfully after location was allowed.
- Service Step 1 saved successfully after location was allowed.
- Sales Step 3 and Service Step 3 could be saved after Step 1.
- After refresh, the newly saved Sales and Service entries appeared in Recent visits / Previous entries.
- No blocking JavaScript console error was captured during this run.

### New bugs found

#### BUG-20260616-003 — Sales/Service Step 2 remains pending after saving on mobile

- Severity: High
- Journey and scenario: Field-agent Sales/Service Step 2 completion on mobile
- Steps to reproduce:
  1. Log in as `bloom.agent@crystalbio.in`.
  2. Open Visits and create a new Sales visit.
  3. Allow location, fill Step 1, and save Step 1.
  4. Open Step 2, fill visible Step 2 fields, and tap Save Step 2.
  5. Repeat the same path for Service.
- Expected result: Step 2 should show saved/completed after Save Step 2.
- Actual result: Sales and Service continue to show `Step 2: Pending` after Save Step 2. The latest saved entry also says Step 2 is pending. Step 3 can show saved while Step 2 remains pending.
- Evidence:
  - Result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-mobile-ui-agent-cdp-v2-results.json`
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
  - Sales Step 3 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step3-saved.png`
  - Service Step 3 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step3-saved.png`
- Launch/pilot impact: High. Admin/report completion status may be misleading and agents may think their Step 2 work did not save.

#### BUG-20260616-004 — Bottom navigation covers long Step 2 form fields on mobile

- Severity: Medium
- Journey and scenario: Long Sales/Service Step 2 forms on mobile
- Expected result: Bottom nav should not cover form fields or save controls.
- Actual result: The fixed bottom nav overlays lower Step 2 fields while scrolling.
- Evidence:
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Launch/pilot impact: Medium usability issue for field agents filling long forms.

#### BUG-20260616-005 — Photo Camera/Upload controls show squeezed native Choose File labels

- Severity: Low
- Journey and scenario: Sales/Service photo/proof capture controls on mobile
- Expected result: Camera and Upload controls should look like clean mobile buttons.
- Actual result: Native `Choose File` text is squeezed inside/over the custom Camera and Upload labels.
- Evidence:
  - Sales screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Launch/pilot impact: Low polish issue, but visible in the photo/proof area.

### Evidence files

- Main CDP result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-mobile-ui-agent-cdp-v2-results.json`
- Visits final screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-visits-final.png`
- Sales Step 1 saved screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step1-saved.png`
- Service Step 1 saved screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step1-saved.png`

### Periwinkle next action

1. Review BUG-20260616-003 first because it affects completion/status correctness.
2. If approved, ask Iris to fix the Step 2 saved/pending status issue for both Sales and Service.
3. Also polish bottom-nav safe spacing and photo input presentation when safe.
4. Bloom should retest these after Iris marks them ready.

