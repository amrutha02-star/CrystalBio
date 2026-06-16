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
- Status: Ready for Bloom retest after frontend deploy
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
- Latest evidence:
  - CDP result: `/root/workspace/CrystalBio/dogfood-output/bloom-retest-login-enter-2026-06-15.json`
  - Enter/Go screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-enter-wrong-password-2026-06-15.png`
  - Button wrong-password screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-click-wrong-password-2026-06-15.png`
  - Empty login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-empty-login-2026-06-15.png`
  - Direct admin no-session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-direct-admin-no-session-2026-06-15.png`

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
- Status: New from Bloom
- Recommended next step: Periwinkle should review whether this is a frontend status bug or backend completion-status bug, then decide whether to approve Iris to fix it before pilot handover.

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
- Status: New from Bloom
- Recommended next step: Add mobile safe-bottom spacing to long visit forms so the fixed bottom nav does not cover fields or save controls.

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
- Status: New from Bloom
- Recommended next step: Periwinkle/Iris should polish the file-input presentation without changing the underlying photo upload behavior.
