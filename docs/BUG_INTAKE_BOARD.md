# CrystalBio Bug Intake Board

Purpose: one simple place where Bloom, Periwinkle, and Iris can track bugs during launch week.

This file is written in plain language so Rahul can read it without technical knowledge.

## Status meanings

- New from Bloom: Bloom found it, but Periwinkle has not reviewed it yet.
- Needs Periwinkle review: Bloom thinks it may matter and Periwinkle should decide.
- Approved for Iris: Periwinkle or Rahul approved Iris to fix it.
- Iris fixing: Iris is actively fixing it.
- Ready for Bloom retest: Iris says the fix is ready and Bloom must retest it.
- Verified by Bloom: Bloom retested and the fix works.
- Accepted by Periwinkle/Rahul: final approval is done.
- Not fixing now: known issue, but not part of the current launch-week fix list.

## Important rule

Bloom can add bugs here any time.

Iris must only fix bugs marked Approved for Iris by Periwinkle or Rahul, except for an emergency where Rahul explicitly says to fix immediately.

## Live user issue rule

If Bloom notices a live-user problem during the day, Bloom should record it here and notify Periwinkle/Rahul in simple language.

The app now has app-side logging for Bloom. It records serious user-facing app/API failures without saving passwords or form contents. Bloom’s watcher checks the server-side log and adds serious recent issues here.

Bloom also keeps `/root/workspace/.hermes/profiles/bloom/BLOOM_LIVE_USER_TRACKER.md` updated from server-side logs. That tracker shows:

- which accounts have logged in,
- failed login attempts by email,
- recent user-facing errors connected to the logged-in account when available.

For live-user problems, Bloom should include:

- Time noticed:
- User journey affected:
- What the user likely experienced:
- Severity:
- Evidence:
- Status: Needs Periwinkle review
- Recommended next step:

## Current bug queue

## Periwinkle nightly triage — 2026-06-16

- Approved for Iris: BUG-20260616-006, because saved-entry continuation is launch-relevant and could make agents think their saved Sales work disappeared.
- Needs more testing: the location-permission live app error entries from 2026-06-16, because the logs still show unknown user/path and may be Bloom automation or a normal permission denial rather than a product bug.
- Needs Rahul decision: Bloom QA cleanup, because it touches live pilot data and must use the documented backup/dry-run/write path only for Bloom-created records.
- Not fixing now: BUG-20260616-005 Camera/Upload polish, because it is visual polish and not blocking launch work.
- No new Iris work: BUG-20260615-001, BUG-20260615-002, BUG-20260616-003, and BUG-20260616-004 are already verified by Bloom; leave them as verified unless a real user reports a regression.

### BUG-20260615-001 — Password-field Enter/Go does not submit login

- Time noticed: 2026-06-15 15:40 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Medium
- User journey affected: Login/session
- What the user likely experienced: A phone user can type email/password and press the keyboard Go/Enter key, but nothing happens. The user must tap the visible Login button.
- Steps to reproduce:
  1. Open `https://work.convogenie.ai`.
  2. Type an email and password.
  3. Press Enter/Go from the password field.
- Expected result: Login submits, same as tapping the Login button.
- Actual result: No login request is sent and no login result appears.
- Evidence:
  - Screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/login-enter-key.png`
  - CDP/network result: `/root/workspace/CrystalBio/dogfood-output/login-enter-key.json` shows `auth responses 0`.
  - Browser log clue: `[DOM] Password field is not contained in a form`.
- Periwinkle triage decision: Approved for Iris
- Approved by: Periwinkle
- Status: Verified by Bloom
- Iris fix: Login inputs are now inside a real submit form, so phone Enter/Go from the password field submits the same login action as the Login button.
- Iris checks run: targeted App test, full `npm test`, and `npm run build` passed on 2026-06-15.
- Exact journey to fix: Login screen only — pressing Enter/Go from the password field should submit the same login action as tapping the visible Login button.
- What should happen after the fix: The login behavior remains unchanged for button taps, and keyboard Enter/Go also sends one normal login request and shows the same success/failure messages.
- Restrictions for Iris:
  - Make the smallest safe fix only.
  - Do not redesign the login screen.
  - Do not change login rules, passwords, sessions, role access, or backend authentication behavior.
  - Preserve the current mobile-first CrystalBio visual baseline.
  - Add/update a focused test if practical, then run real checks before marking ready for Bloom retest.
- Bloom retest request: Retest Enter/Go login behavior, normal button login behavior, empty login, wrong-password login, and direct admin URL without session.
- Bloom retest result: Failed on live app on 2026-06-15 18:22 UTC. Pressing Enter/Go still produced no `/auth/login` request in the live frontend CDP run.
- Bloom retest result: Failed again on live app on 2026-06-15 21:07 UTC. Mobile CDP retest still shows the password field is not inside a form, pressing Enter/Go sends no `/auth/login` request, while tapping the visible Login button does send the normal invalid-password request.
- Current Iris note: Rechecked after Bloom's failed live retest. The live frontend was still serving an older JavaScript build without the login form fix, while the local fixed build contains the real submit form and passes tests/build. Iris pushed the frontend fix on 2026-06-16 00:53 UTC so the live deploy can pick it up.
- Bloom retest result: Failed again on live app on 2026-06-16 01:46 UTC. The password field is still not inside a form, and pressing Enter/Go sent no `/auth/login` request. The visible Login button still sends the normal wrong-password request, so this is specific to keyboard Enter/Go submission.
- Morning status cleanup: Periwinkle confirmed on 2026-06-16 08:43 UTC that the live login screen now contains a real form and pressing Enter/Go from the password field sends one `/auth/login` request to the live API. Waiting for Bloom formal retest before final acceptance.
- Bloom night retest result: Verified fixed on live mobile browser on 2026-06-16 15:36 UTC. Pressing Enter/Go from the password field sent the login request and showed the normal `Invalid email or password` result for a wrong password. Empty login and direct admin URL without session were also safely blocked.
- Latest evidence:
  - Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`
  - CDP result: `/root/workspace/CrystalBio/dogfood-output/bloom-retest-login-enter-2026-06-15.json` (`checkedAtUtc`: `2026-06-16T01:46:08.951Z`)
  - Enter/Go screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-enter-wrong-password-2026-06-15.png`
  - Button wrong-password screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-click-wrong-password-2026-06-15.png`
  - Empty login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-empty-login-2026-06-15.png`
  - Direct admin no-session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-direct-admin-no-session-2026-06-15.png`
  - Latest night retest result: `/root/workspace/CrystalBio/dogfood-output/bloom-night-heavy-qa-results.json`
  - Latest Enter/Go screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-enter-wrong-password.png`

### BUG-20260615-002 — New Bloom QA accounts cannot log in

- Time noticed: 2026-06-15 18:22 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: High
- User journey affected: Login/session and QA end-to-end testing
- What the user likely experienced: The dedicated Bloom QA admin and field-agent accounts cannot enter the live app. The login screen stays visible and the API says the credentials are invalid.
- Steps to reproduce:
  1. Open `https://work.convogenie.ai`.
  2. Try to log in with `bloom.admin@crystalbio.in` using the provided Bloom QA Admin password.
  3. Try to log in with `bloom.agent@crystalbio.in` using the provided Bloom QA Agent password.
- Expected result: Admin account opens admin screens; field-agent account opens field-agent screens with Sales + Service access.
- Actual result: Both accounts return `HTTP 400` / `Invalid email or password` from the live API.
- Evidence:
  - API evidence file: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-check.json`
  - Admin screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
  - Agent screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`
  - CDP result file: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- Status: Fixed by Periwinkle on live backend; waiting for Bloom full QA rerun
- Fix made: Created and activated the Bloom QA admin and Bloom QA field-agent accounts on the live backend.
- Verification: Direct login succeeded through `https://work-api.convogenie.ai` for both Bloom accounts with the expected roles: admin and Sales + Service.
- Bloom retest result: Verified fixed on 2026-06-15 20:15 UTC. Both Bloom QA accounts now log in successfully on the live API and live app.
- Bloom follow-up checks passed: Agent Sales/Service API save flow, admin report visibility, admin PDF report, and admin team field-visits visibility.
- Current status: Verified by Bloom
- Evidence:
  - QA account API recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-recheck.json`
  - Full live API E2E result: `/root/workspace/CrystalBio/dogfood-output/bloom-live-e2e-api-recheck.json`
  - Admin team field-visits recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-admin-team-field-visits-recheck.json`
- Recommended next step: Continue browser-level mobile UI QA for Sales/Service screens and retest BUG-20260615-001 after deploy confirmation.

### BUG-20260616-003 — Sales/Service Step 2 remains pending after saving on mobile

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: High
- User journey affected: Field-agent Sales/Service Step 2 completion and admin/report data correctness
- What the user likely experienced: The agent fills Step 2 details and taps Save Step 2, but the progress header and latest saved entry still say Step 2 is pending. This makes the form look incomplete even after the agent tried to finish that section.
- Steps to reproduce:
  1. Log in to `https://work.convogenie.ai` as `bloom.agent@crystalbio.in` on a mobile viewport.
  2. Open Visits, create a new Sales visit, allow location, fill Step 1, and save Step 1.
  3. Open Step 2, fill the visible fields, and tap Save Step 2.
  4. Repeat the same flow for a new Service visit.
- Expected result: After Save Step 2, the progress header and latest saved entry should show Step 2 as saved/completed for Sales and Service.
- Actual result: Sales and Service both continue to show `Step 2: Pending` after the Save Step 2 action. Step 3 can later show saved while Step 2 still remains pending.
- Evidence:
  - CDP result: `/root/workspace/CrystalBio/dogfood-output/bloom-mobile-ui-agent-cdp-v2-results.json`
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
  - Sales Step 3 after Step 2 attempt: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step3-saved.png`
  - Service Step 3 after Step 2 attempt: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step3-saved.png`
- Status: Verified by Bloom
- Approved by: Periwinkle, after Bloom evidence review
- Exact journey to fix: Field-agent Sales and Service Step 2 save completion/status on mobile and backend/admin visibility.
- What should happen after the fix: After Save Step 2, the progress header and latest saved entry should show Step 2 as saved/completed for Sales and Service, without changing the existing Step 1/2/3 route or visual direction.
- Restrictions: Smallest safe fix only. Do not redesign forms. Do not change Step 1 GPS behavior. Do not merge the bottom-nav or photo-control polish into this High bug unless required for the fix.
- Iris fix: Sales and Service Step 2 saves now persist an explicit saved/completed flag, and the progress header/latest saved entry read from that saved flag. Admin visit details also show Step 2/Step 3 status.
- Iris checks run: `npm test -- --run` passed with 10 files and 93 tests; `npm run build` completed on 2026-06-16.
- Bloom retest note: Latest live browser retest could not complete because current Bloom QA passwords were not available in the Periwinkle-run session.
- Bloom night retest result: Verified fixed on live mobile browser/API on 2026-06-16 15:36-15:39 UTC using assigned Bloom credentials. Sales and Service Step 2 saves now show `Step 2: Saved` in the progress header/latest saved entry, and backend/admin field-visits showed Step 2 status `Saved` and Step 3 status `Saved` for the earlier full Step 1/2/3 QA records.
- Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-heavy-qa-results.json`, `/root/workspace/CrystalBio/dogfood-output/bloom-night-service-attendance-results.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-sales-step2-saved-ui.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-service-step2-saved-ui.png`
- Recommended next step: Leave this as verified; handle saved-entry continuation separately under BUG-20260616-006.

### BUG-20260616-004 — Bottom navigation covers long Step 2 form fields on mobile

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Medium
- User journey affected: Field-agent Sales/Service long mobile forms
- What the user likely experienced: While filling long Step 2 forms, the fixed bottom navigation floats over form fields, making the lower fields harder to read and tap.
- Steps to reproduce:
  1. Log in as a field agent on mobile.
  2. Open a Sales or Service visit.
  3. Open Step 2 and scroll through the long form.
- Expected result: Bottom navigation should not hide active form content; there should be enough bottom padding or safe spacing.
- Actual result: The bottom navigation overlays form rows such as Email/Department on Sales Step 2 and Department on Service Step 2.
- Evidence:
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Periwinkle triage decision: Approved for Iris night fix
- Approved by: Periwinkle
- Status: Verified by Bloom
- Exact journey to fix: Long Sales/Service Step 2 mobile forms only.
- What should happen after the fix: Bottom navigation should not cover fields or save controls; users should be able to scroll to the end comfortably.
- Restrictions: Smallest safe spacing fix only. Do not redesign forms, navigation, Step 1/2/3 structure, or button styling.
- Bloom night retest result: Verified fixed on 2026-06-16 15:40 UTC. Sales and Service Step 2 forms could be scrolled to the bottom with the bottom navigation separated from the lower fields/actions.
- Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-bottom-nav-retest.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-sales-step2-bottom-spacing.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-service-step2-bottom-spacing.png`
- Recommended next step: No Iris action needed unless a real user reports remaining overlap on a different device.

### BUG-20260616-005 — Photo Camera/Upload controls show squeezed native Choose File labels

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Low
- User journey affected: Field-agent Sales/Service photo/proof capture
- What the user likely experienced: The Camera and Upload controls are visible, but the browser's native `Choose File` text is squeezed into the custom buttons, making the polished mobile screen look unfinished.
- Steps to reproduce:
  1. Log in as a field agent on mobile.
  2. Open a Sales or Service visit.
  3. Scroll to the photo/proof area.
- Expected result: Camera and Upload controls should look like clean tappable mobile controls without overlapping native file-input text.
- Actual result: `Choose File` appears inside/over the Camera and Upload buttons.
- Evidence:
  - Sales Step 1 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 1 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Periwinkle triage decision: Defer unless Rahul wants polish tonight
- Status: Not fixing now
- Reason: It is visual polish and lower risk than the nav-covering-fields issue. Keep it in the queue, but do not mix it into the Step 2/nav spacing fix.
- Recommended next step: Revisit after the login and Step 2 retests pass, or approve as a separate small polish fix if tonight has capacity.

### Testing/Bloom monitor failures — 2026-06-16 02:08 UTC

- Classification: Testing/Bloom failure, not confirmed real-user issue.
- Time noticed: 2026-06-16 01:52–01:57 UTC
- User journey affected: App screen error during test/automation run
- What happened: The app recorded “Allow location permission to save this field update.”
- Severity shown by app log: High
- Evidence: app-side error log showed HeadlessChrome/test automation user agent and unknown user.
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing; not approved for Iris.
- Reason: Evidence points to HeadlessChrome/test automation and unknown user, so this is not yet confirmed as a live-user product bug.
- Recommended next step: Bloom should keep it as monitoring evidence only unless a real account/path or repeatable user journey is found.



### Live user app error - 2026-06-16 10:08:39 UTC

- Time noticed: 2026-06-16 10:08:39 UTC
- User journey affected: App screen error
- What the user likely experienced: Allow location permission to save this field update.
- Severity: High
- Evidence: App-side user error log; user=unknown user, path=unknown path
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing
- Reason: The log does not identify the user or path, and the same message can come from a normal GPS-permission denial or Bloom automation. Do not approve a code fix until Bloom can reproduce it in a real user journey or the app logs show an affected account/path.
- Recommended next step: Bloom should continue watching live logs and try to attach account/path/journey evidence. Iris should not fix this entry yet.



### Live user app error - 2026-06-16 10:20:39 UTC

- Time noticed: 2026-06-16 10:20:39 UTC
- User journey affected: App screen error
- What the user likely experienced: Allow location permission to save this field update.
- Severity: High
- Evidence: App-side user error log; user=unknown user, path=unknown path
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing
- Reason: Same as the 10:08 UTC entry: no confirmed user/path yet, and the message may be expected when location permission is denied.
- Recommended next step: Bloom should continue monitoring and add a new bug only if there is confirmed user impact or repeatable evidence.

### BUG-20260616-006 — Previous Sales entry opens as blank pending form instead of saved record

- Time noticed: 2026-06-16 15:35 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`
- Severity: High
- User journey affected: Agent Visits / saved Sales entry continuation
- What the user likely experienced: The previous entry list says the saved Sales record can be tapped to continue, but tapping it opens a blank pending Sales form. The user may think saved work disappeared or may create a duplicate visit.
- Steps to reproduce:
  1. Log in to `https://work.convogenie.ai` as `bloom.agent@crystalbio.in`.
  2. Open Visits.
  3. Tap saved previous entry `BLOOM-QA-NIGHT Sales 20260616-1781624021373`.
- Expected result: The saved Sales record opens with saved customer/details and Step 2/Step 3 completion status.
- Actual result: The Sales screen opens as a blank form with `Step 1: Pending • Step 2: Pending • Step 3: Pending` and empty fields.
- Evidence: Live mobile browser run on 2026-06-16; API/admin evidence confirms the record exists and has Step 2/Step 3 saved (`sales_189`, `sales_visit_194`). QA report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`.
- Periwinkle triage decision: Approved for Iris
- Approved by: Periwinkle
- Status: Source fix exists locally and builds, but it is not visible on the live site yet.
- Iris fix: Previous Sales/Service entries now carry their saved record ID and reopen by filling the existing saved details/status into the Sales or Service form instead of opening a blank new form.
- Iris/Periwinkle checks run: targeted API test passed on 2026-06-17 UTC (`src/backend/crystalBioApi.test.ts`, 15 tests); `npm run build` passed and generated a bundle containing `recordId`, `Step 2 status`, and local version `20260616023405`.
- Deployment root cause found by Periwinkle: the live site is still serving version `20260616020715` and asset `index-B9qABPPT.js`. That live asset does **not** contain the saved-entry fix markers (`recordId`, `Step 2 status`, or `openSavedVisitEntry`). The local built bundle does contain them.
- Current interpretation: Bloom's live failures are expected because the saved-entry fix has not reached the live frontend bundle yet. This is a deploy/visibility gap before any further product-code conclusion.
- Live pre-deploy/deployment-check evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16_BUG-20260616-006_RETEST.md`, `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-retest-evidence.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug-20260616-006-sales-retest-blank-pending.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug-20260616-006-service-regression-blank-pending.png`
- Exact journey to fix: Agent Visits / Previous entries continuation for saved Sales records. Tapping an existing saved Sales entry must reopen that saved record with its saved customer/details and Step 1/2/3 status, not a blank new pending form.
- What should happen after the fix: The saved Sales entry remains visible after refresh/re-login and opens as the same saved record for continuation. It must not create a duplicate record just because the user tapped an existing previous entry.
- Restrictions for Iris:
  - Make the smallest safe fix only.
  - Do not redesign the Visits page, Sales form, or Step 1/2/3 structure.
  - Do not change GPS rules, saved-status rules, admin reports, authentication, or role access unless strictly required for this bug.
  - Check whether Service previous-entry continuation has the same risk, but do not broaden the fix beyond saved-entry continuation.
  - Preserve the approved sage/olive mobile visual baseline.
  - Add/update a focused test if practical, then run real checks before marking ready for Bloom retest.
- Bloom retest request: Retest tapping saved Sales previous entries after refresh/re-login, verify the saved details/status are still shown, and do one quick Service previous-entry check for regression.
- Bloom night retest result: Failed on live mobile browser on 2026-06-16 21:06 UTC. Tapping the saved Sales previous entry still opened a blank pending Sales form instead of the saved record. Nearby Service regression also failed the same way, opening a blank pending Service form. Refresh returned to Home rather than preserving the opened saved record. No browser console errors were captured; live API health was OK, Bloom agent/admin logins worked, and admin `field-visits?scope=team` confirmed the same Sales/Service records exist with Step 2/Step 3 saved details.
- Latest evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-night-retest-live.json`, `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-api-admin-field-visits-live.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-sales-reopen-after-login.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-service-reopen-regression.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-sales-reopen-after-refresh.png`.
- Bloom verdict: Do not mark Verified by Bloom. The live app still has the original saved-entry continuation failure and now Service shows the same visible regression in the checked path.

### Bloom cleanup blocked — 2026-06-16 15:36 UTC

- Classification: QA cleanup task blocked, not a product bug.
- What happened: Bloom created clearly named QA records for live save/visibility testing but could not safely clean them because this QA session has no safe live DB backup/cleanup command access and no narrow cleanup API.
- Records left for Periwinkle-approved cleanup include prior and current Bloom QA records: `attendance_193`, `sales_189`, `sales_visit_194`, `service_190`, `service_visit_195`, `sales_visit_200`, `sales_visit_206`, `service_211`, `service_visit_212`.
- Periwinkle triage decision: Needs Rahul decision
- Status: Needs Rahul decision
- Reason: This is live pilot data cleanup, not an Iris product bug. It should happen only with a backup, dry-run, and Bloom-only cleanup scope.
- Recommended next step: Rahul/Periwinkle should approve the documented Bloom-only cleanup path before any write cleanup. Do not guess-delete or hide real user records.
