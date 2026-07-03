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

### 2026-07-03 — Backend audit hardening: roles, GPS, reset sessions, duplicate visits

- Fixed by: Periwinkle source pass after Bloom backend audit
- Approved by: Amrutha asked Periwinkle to work on the backend audit findings
- Source bug report: `docs/qa-runs/BACKEND_LOGIC_STRATEGY_AUDIT_BLOOM_2026-07-03.md`; BUG-20260703-024, BUG-20260703-025, BUG-20260703-026, BUG-20260703-027
- Severity: High for role boundary, GPS validation, reset/session safety; Medium for duplicate-visit matching
- Journey: Backend role access, GPS compliance, password reset/session safety, repeated Sales/Service visit saves
- Problem: Backend challenge found wrong-role Sales/Service creates succeeded, impossible GPS coordinates were accepted, old reset-session tokens could become valid again, different-time same-day visits could be collapsed as duplicates, and production dependency audit flagged vulnerable Nodemailer.
- Fix made: Added backend role guards for Sales/Service create and visit update paths; added GPS coordinate bounds; cleared existing sessions when reset/setup links are issued/completed; included visit time in Sales/Service duplicate matching so exact resubmits dedupe but different-time visits are saved separately; upgraded Nodemailer to `^9.0.3`; replaced predictable setup/session token generation with crypto-random tokens.
- Checks run: `npm test -- --run src/backend/crystalBioBackend.test.ts src/backend/crystalBioApi.test.ts`; full `npm test`; `npm run backend:build`; `npm run build`; `npm audit --audit-level=moderate --omit=dev`.
- Result: Targeted backend/API tests passed 40/40 before dependency upgrade; full suite passed 115/115; backend and frontend builds passed; production audit now reports 0 vulnerabilities.
- Bloom retest: Needed before live acceptance.
- Final acceptance: Not accepted yet.
- Notes: Source/test/docs only so far. No live deploy was done in this batch. Wider mobile GPS capture bug remains open and is not closed by coordinate validation alone.

### 2026-06-21 — Login Enter/Go submits from password field again

- Fixed by: Iris
- Approved by: Periwinkle
- Source bug report: `docs/BUG_INTAKE_BOARD.md`, BUG-20260621-014
- Severity: Medium
- Journey: Login/session on phone keyboard for admin and field-agent users
- Problem: Bloom's live mobile/CDP check showed pressing Enter/Go from the password field did not send `/auth/login`, although tapping the visible Login button still worked.
- Fix made: Kept the existing real submit form and added a password-field Enter/Go key handler that prevents default keyboard ambiguity and calls the same login action as the Login button.
- Checks run: `npm test -- --run src/App.test.tsx`; focused rerun of `shows feedback for second-level preview buttons instead of doing nothing` after one full-suite timeout; `npm test -- --run`; `npm run build`.
- Result: Passed. Targeted App test passed 20/20; focused rerun passed; full suite passed 104/104 on rerun; frontend build completed.
- Bloom retest: Passed on live at 2026-06-21 21:08 UTC. Bloom verified admin and field-agent password-field Enter/Go each sent one `/auth/login` POST and opened the right home screen; visible Login button, empty login, wrong password, and direct admin no-session checks also passed. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-21.md`, `dogfood-output/bloom-retest-login-enter-2026-06-21-summary.json`, and `dogfood-output/bloom-retest-login-enter-2026-06-21-puppeteer-v3.json`.
- Final acceptance: Waiting for Periwinkle/Rahul acceptance after Bloom verification.
- Notes: Login-screen-only fix. No redesign, backend authentication, password, session, role access, routing, admin, field-entry, or live data changes.

### 2026-06-19 — Night deploy: Field Entry performance and attendance PDF cleanup

- Fixed by: Iris/Periwinkle
- Approved by: Rahul/Amrutha night scope
- Source bug report: `docs/BUG_INTAKE_BOARD.md`, BUG-20260619-012 and BUG-20260619-010
- Severity: High for Field Entry usability; Medium for downloaded attendance report usefulness
- Journey: Admin Field Entry reload/list/detail and Admin Reports attendance PDF download
- Problem: Field Entry list responses were too heavy because list rows could include photo/proof payloads; downloaded attendance PDF was a wide person table without office-action-first attendance exceptions.
- Fix made: Field Entry list API now omits heavy `photoPayload` by default and loads selected-entry detail on demand. Downloaded attendance PDF now starts with `Attendance exceptions and office action`, then shows a compact `Person-wise attendance summary` with worked days, last check-in, last checkout, leave, no-update, and office note.
- Checks run: `npm test -- --run src/backend/crystalBioHttpServer.test.ts src/backend/crystalBioBackend.test.ts src/crystalBioFrontendApi.test.ts src/App.test.tsx`; `npm run build`; `npm run backend:build`; local generated attendance PDF text extraction; live API/version/bundle checks; live Field Entry API payload check; live attendance PDF download/text check; mobile browser Field Entry detail check.
- Result: Targeted tests passed 63/63; frontend/backend builds passed; live version is `20260619170148`; API health is OK; `/field-visits?scope=team` returned 30 rows in about 31 KB with 0 list `photoPayload` fields; live attendance PDF returned `%PDF` and includes the new summary-first headings.
- Bloom retest: Passed on live at 2026-06-19 21:08 UTC. Bloom verified Field Entry reload/list weight, All entries `30 of 30 shown`, selected detail opening, and downloaded attendance PDF summary-first exception/office-action content. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19.md` and `dogfood-output/bloom-night-retest-after-iris-2026-06-19.json`.
- Final acceptance: Waiting for Periwinkle/Rahul acceptance.
- Notes: No live data cleanup/delete/hide was performed. Production frontend was backed up at `/var/www/crystalbio.backup-20260619170148-pre-night-fixes` before deployment.

### 2026-06-19 — Saved-entry text and action cleanup

- Fixed by: Iris
- Approved by: Amrutha/Rahul via Periwinkle for tonight
- Source bug report: `docs/BUG_INTAKE_BOARD.md`, BUG-20260619-013
- Severity: High for field-agent usability
- Journey: Agent saved Sales/Service continuation and Field Entry saved-detail review
- Problem: Saved entries showed low-value progress/read-only helper text, coloured follow-up/status pills, and raw admin/status rows before useful customer details.
- Fix made: Removed the read-only explanation text, made `View details` neutral, changed follow-up statuses in saved-entry rows to plain text, hid repeated `Next: No date set` / `Tap to continue` copy, removed Sales/Service progress and step-open status pills, opened pending Step 2/3 directly when continuing a saved entry, and reordered saved-detail rows to show customer/contact/product-or-equipment/agent context first.
- Checks run: `npm test -- --run src/App.test.tsx`; `npm test -- --run src/backend/crystalBioHttpServer.test.ts src/backend/crystalBioBackend.test.ts src/crystalBioFrontendApi.test.ts src/App.test.tsx`; `npm run build`; live browser Field Entry detail check.
- Result: Passed. App test suite passed 19/19 earlier; combined targeted suite passed 63/63 before deploy. Production frontend build completed. Live version is `20260619170148`; Field Entry `View details` opened a saved detail with customer/contact/equipment/agent-first copy and no read-only helper text; browser console had no errors.
- Bloom retest: Passed on live at 2026-06-19 21:08 UTC. Bloom verified saved Sales and Service previous-entry rows/continuation on mobile, admin Field Entry `View details`, customer/contact/product/agent-first saved detail copy, plain follow-up/status styling, and direct pending Step 2/3 visibility. Bloom-only QA records were cleaned afterward. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19.md` and `dogfood-output/bloom-night-retest-after-iris-2026-06-19.json`.
- Final acceptance: Waiting for Periwinkle/Rahul acceptance.
- Notes: Deployed in the approved night window with the Field Entry performance and attendance PDF fixes. No live data cleanup/delete/hide was performed.

### 2026-06-17 — Admin checked-in work mode is saved and shown

- Fixed by: Iris
- Approved by: Periwinkle, based on Amrutha's launch-week admin attendance request
- Source bug report: `docs/BUG_INTAKE_BOARD.md`, BUG-20260617-007 / Admin checked-in detail request
- Severity: High
- Journey: Agent check-in and Admin overview → Checked in expanded card
- Problem: The Admin checked-in detail scope needed the selected work mode saved with attendance and shown to admin, without guessing from the agent role. Older records also needed a clear fallback.
- Fix made: Agent check-in now sends the selected work types and optional note to the attendance API. The backend saves `workTypes` on the attendance record. Admin overview attendance detail reads the saved mode and shows `Mode not recorded` for older attendance rows without saved mode.
- Checks run: `npm test -- --run src/crystalBioFrontendApi.test.ts src/backend/crystalBioBackend.test.ts src/App.test.tsx`; `npm run build`; `npm run backend:build`; live API health; live version/asset marker check.
- Result: Passed. Targeted tests: 52 passed. Frontend and backend builds completed. Live version is `20260618013516`; live bundle contains `Mode not recorded` / `workTypes` and no longer contains `Latest submitted work`.
- Bloom retest: Passed on live using assigned Bloom QA agent/admin. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-18_ATTENDANCE_ADMIN.md`. Admin expanded Checked in card showed Bloom QA Agent, role, check-in time, Still checked in, and `Sales visit + Service visit + In office`. Admin home no longer showed `Latest submitted work`.
- Final acceptance: Periwinkle accepts this fix after live deploy + Bloom retest; waiting only for Rahul/Amrutha product sign-off if desired.
- Notes: Small persistence/display fix only. No redesign, route change, attendance-rule change, role inference, or real-user data cleanup. Deployed live on 2026-06-18 morning after Amrutha approved immediate deployment. Bloom-created attendance rows were cleaned after dry-run/write backup path; post-clean check shows 0 Bloom attendance/Sales/Service rows.

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
