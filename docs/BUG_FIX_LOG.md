# CrystalBio Bug Fix Log

This is the repo-level record of bug fixes handled by Iris.

Use this file to keep a simple history of what was fixed, how it was checked, and what Bloom needs to retest.

## Log format

### YYYY-MM-DD — Short fix title

- Fixed by: Iris
- Approved by:
- Source bug report:
- Severity:
- Journey:
- Problem:
- Fix made:
- Checks run:
- Result:
- Bloom retest:
- Final acceptance:
- Notes:

## Fixes

### 2026-06-16 — Previous visit entries reopen saved records

- Fixed by: Iris
- Approved by: Periwinkle
- Source bug report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`, BUG-20260616-006
- Severity: High
- Journey: Agent Visits / Previous entries continuation for saved Sales records, with a quick Service regression check path.
- Problem: Tapping a saved previous Sales entry could open a blank pending Sales form, making saved work look missing.
- Fix made: Previous Sales/Service entries now include their saved record ID and use the saved detail rows to refill the existing Sales or Service form/status when tapped.
- Checks run: Full `npm test -- --run`; `npm run build`.
- Result: Passed. Full test suite reports 11 files and 95 tests passed; production build completed.
- Bloom retest: Retest tapping saved Sales previous entries after refresh/re-login, verify saved customer/details and Step 1/2/3 status, and do one quick Service previous-entry check.
- Final acceptance: Waiting for Bloom retest and Periwinkle/Rahul acceptance.
- Notes: Small continuation fix only; no redesign, GPS-rule, auth, admin-report, or saved-status business-rule changes.

### 2026-06-16 — Sales/Service Step 2 status saves correctly

- Fixed by: Iris
- Approved by: Periwinkle
- Source bug report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`, BUG-20260616-003
- Severity: High
- Journey: Field-agent Sales and Service Step 2 save completion/status on mobile and backend/admin visibility
- Problem: After saving Step 2 on mobile, Sales and Service still showed Step 2 as pending in the progress header and latest saved entry.
- Fix made: Step 2 and Step 3 saves now store explicit completion flags on the saved Sales/Service record, and the agent progress/header cards read from those saved flags. Admin field-visit details also show Step 2/Step 3 status.
- Checks run: Full `npm test -- --run`; `npm run build`.
- Result: Passed. Full test suite reports 10 files and 93 tests passed; production build completed.
- Bloom retest: Retest mobile Sales Step 2 save and mobile Service Step 2 save, including the progress header and latest saved entry after Step 2 and after Step 3.
- Final acceptance: Waiting for Bloom retest and Periwinkle/Rahul acceptance.
- Notes: No route, navigation, form layout, Step 1 GPS behavior, bottom-nav spacing, or photo-control styling was changed.

### 2026-06-15 — Login Enter/Go submits from password field

- Fixed by: Iris
- Approved by: Periwinkle
- Source bug report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`, BUG-20260615-001
- Severity: Medium
- Journey: Login/session
- Problem: Pressing Enter/Go from the password field did not submit login because the login inputs were not inside a real form.
- Fix made: Wrapped the existing registered-email and password inputs in a real submit form, changed the Login button to submit that form, and kept the same login handler and visual layout.
- Checks run: Targeted App test for login form behavior; full `npm test`; `npm run build`.
- Result: Passed. Full test suite reports 10 files and 93 tests passed; production build completed.
- Bloom retest: Retest Enter/Go login behavior, normal button login, empty login, wrong-password login, and direct admin URL without session.
- Final acceptance: Waiting for Bloom retest and Periwinkle/Rahul acceptance.
- Notes: No login rules, sessions, roles, passwords, or backend authentication behavior were changed. After Bloom's failed live retest, Iris confirmed the live frontend was still serving an older JS bundle without the login form fix; this fix was prepared for frontend deployment on 2026-06-16.
