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
