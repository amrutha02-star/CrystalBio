# CrystalBio Bot Coordination Status

Last refreshed: 2026-07-02 07:31 IST / 2026-07-02 02:01 UTC

Purpose: one simple dashboard so Rahul can see what Periwinkle, Bloom, and Iris are doing without reading logs.

## Simple summary right now

- Live API health is up (`/health` returned `{"status":"ok"}` during the 2026-07-02 morning stability check).
- Latest Bloom fix retest report is `docs/qa-runs/QA_RUN_BLOOM_2026-07-02_230_RETEST.md`: live app/API were up, BUG-20260624-019 Agent report PDFs passed, no new failure was confirmed, and no QA records were created in that retest.
- Full visible UI user-journey owner report was generated on 2026-07-02: `docs/qa-runs/FULL_UI_USER_JOURNEY_REPORT_2026-07-02.md` and `/root/workspace/documents/crystalbio/crystalbio-full-ui-user-journey-2026-07-02.pdf`. It reports live Admin/Agent visible journeys usable, with Bloom-only QA cleanup and pending acceptance items still separated.
- Latest overnight user-journey report is `docs/qa-runs/QA_RUN_BLOOM_E2E_USER_JOURNEY_2026-07-02.md`: core login/session, attendance refresh/checkout, Sales/Service save/detail reopen, admin visibility, approvals, and PDFs mostly passed. Five steps are marked needs-review, but their attached evidence shows successful create/201 responses, so Periwinkle has not classified them as confirmed product bugs yet.
- Bloom's 2026-07-02 E2E run created Bloom-only QA records (`attendance_936`, `sales_937`/`sales_visit_938`, `service_939`/`service_visit_940`, `leave_941`). Bloom cleanup/verification is needed before saying reports are clean for admin review.
- BUG-20260624-018 saved-login/session restore remains the main open reliability item. Bloom's 2026-07-02 2:30 AM cron/browser/API retest again passed bearer/session-cookie restore, but real iPhone/Android same-phone overnight persistence still needs Bloom/user acceptance before final acceptance.
- Ready for Periwinkle/Rahul acceptance after Bloom live retest: BUG-20260624-019 Agent report PDF download for Attendance / Visit / Combined, and BUG-20260626-020 admin `Checked in` card clarity.
- BUG-20260623-016 admin refresh has supporting Bloom evidence from repeated live admin/report API checks, but keep it under Periwinkle review unless Rahul/Amrutha want a real open-screen phone retest.
- BUG-20260623-017 remains accepted by Periwinkle after Bloom's live post-deploy QA passed: Admin dashboard entry detail returns to dashboard, and Sales/Service phone form inputs use 16px anti-zoom sizing.
- One-week live usage update from Amrutha remains positive: employees are using the app well; only one or two minor issues were seen; no big outage occurred.
- No current Critical or High launch-blocking bug is approved for Iris.
- Admin clarity fix from Amrutha is live: BUG-20260701-021 — opening a submitted dashboard form no longer also shows a pending Leave approval detail. It was a UI state overlap, not data loss. Verified by app regression test/build and live version/API check.
- BUG-20260701-022 Field Entry search anti-zoom fix is not Bloom-verified live yet: at the 2026-07-02 2:30 AM sweep, live `version.json` was still `20260701023648`, so Bloom did not retest or accept the scheduled search-input fix.
- Live verified/reporting basics remain stable: Admin uses direct `Download PDF`; Agent report PDFs download; camera/upload controls are clean; key admin usability corrections are live.
- Iris should not start routine fixes unless Periwinkle/Rahul approves a specific bug.
- CrystalBio remains on the 14-night stabilization rhythm: Bloom full QA at 9:00 PM IST, Bloom fix retest sweep at 2:30 AM IST, and Periwinkle morning stability summary at 7:30 AM IST. Daytime stays monitor/review only unless Amrutha/Rahul approves an urgent live change.

## Who owns what

### Periwinkle — lead/reviewer

- Reviews Bloom's QA findings.
- Separates real-user issues, needs-classification items, and Bloom/testing failures before asking Iris to act.
- Decides which bugs are safe and important enough for Iris, or asks Rahul/Amrutha for a decision when the change is risky/product-facing.
- Approves only exact fixes, not broad nearby cleanup.
- Gives final acceptance after Bloom retests and evidence is recorded.
- Produces short owner-facing summaries that list live/verified, waiting for Bloom retest, waiting for acceptance, approved Iris queue, and user decisions.
- Maintains `docs/agents/PERIWINKLE_LEAD_BOT.md` and must update durable docs when Rahul/Amrutha has to repeat an instruction.

### Bloom — QA/testing/monitoring

- Runs heavy mobile QA at night.
- Watches live API health during the day.
- Adds problems to `docs/BUG_INTAKE_BOARD.md`.
- Retests Iris fixes before anything is called fixed.

### Iris — bug fixer

- Fixes only bugs approved by Periwinkle or Rahul.
- Records fixes in `docs/BUG_FIX_LOG.md`.
- Runs tests/build before handing work back to Bloom.

## Scheduled work

- Every 5 minutes: live API monitor checks CrystalBio health.
- 9:00 PM IST for 14 nights from 2026-06-24: Bloom full stability QA using only Bloom assigned credentials; no fixing/deploying.
- 2:30 AM IST for 14 nights: Bloom retests only fixes marked ready/deployed for verification.
- 3:10 AM IST for 14 nights: post-retest cleanup removes only Bloom-owned QA activity after backup/dry-run and live verification, so retest records do not remain visible in Admin the next morning.
- 7:30 AM IST for 14 mornings: Periwinkle sends a short stability summary before daytime use.
- 00:05 AM IST: nightly attendance auto-checkout and early Bloom QA cleanup/audit runs after the calendar day changes (`faeccaf5a2d2`).

## Current bug/fix status

### BUG-20260617-007 — Admin checked-in card / attendance work mode

- Owner now: Periwinkle/Rahul acceptance.
- Status: **deployed live and Bloom retest passed**. Live app is version `20260618013516`; the live bundle contains `Mode not recorded` / `workTypes` markers.
- What changed in source/live: selected check-in work mode is saved with attendance and shown in Admin overview attendance detail. Older records show `Mode not recorded`. The earlier 4-row display problem and “Already checked in” communication remain covered.
- Checks passed: targeted App/API/backend tests, frontend build, backend build, live API health, live version check, live bundle marker check, Bloom QA agent/admin live retest.
- Bloom retest evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-18_ATTENDANCE_ADMIN.md`.
- Cleanup: Amrutha caught that Bloom attendance was still visible after the first cleanup report. Periwinkle rechecked the live DB, found 3 Bloom attendance rows, ran Bloom-only dry-run, created backup `crystalbio-db.json.2026-06-18T02-23-42-459Z.bak`, cleaned only Bloom-owned attendance rows, restarted backend, and verified 0 Bloom attendance/Sales/Service/leave rows remain.

### BUG-20260618-008 — Field Entry saved cards are not clickable

- Owner now: Periwinkle/Rahul acceptance.
- Status: deployed live as version `20260618023542` after Amrutha approved daytime deploy.
- What changed in source/live: Admin Field Entry saved Sales/Service rows now open the read-only filled-form detail view and show a clear Back to field entries action.
- Checks passed: `src/App.test.tsx` 18/18, production build, live bundle marker check, and API health.

### 2026-06-19 night fixes — Field Entry performance, saved-entry UX, attendance PDF

- Owner now: Bloom retest, then Periwinkle/Rahul acceptance.
- Status: deployed live as version `20260619170148`.
- What changed live: Field Entry list payload is lightweight, saved-entry detail/actions are cleaner and neutral, and downloaded attendance PDF is summary-first with office-action exceptions.
- Checks passed: targeted tests 63/63, frontend build, backend build, live API health, live version/bundle, Field Entry payload, live attendance PDF, and mobile browser Field Entry detail check.
- Bloom retest needed: Field Entry reload/detail/photo, saved Sales/Service continuation, and downloaded attendance PDF counts/exceptions.

### Admin Agents restructure — not part of tonight acceptance

- Owner now: Amrutha review, then night deployment only.
- Status: deployed live as version `20260619233205` after Amrutha approved early-morning fix.
- What changed live: Agents now shows team/people status, attendance, check-in/out, work mode, follow-ups, agent detail, and a link into Field Entry filtered for that agent. The top Team today counts are clickable filters, and Sales / Service / In office / Checked in / Not in / Checked out behave as clear filters, not passive pills.
- What stayed intact: submitted Sales/Service rows remain owned by Field Entry; other admin pages were not intentionally changed.
- Checks passed: `src/App.test.tsx` 19/19, production build, local browser preview, live API/version/bundle check, and live login-page console check. One Bloom QA Sales test entry was created for Amrutha review: `BLOOM QA CHECK SALES 202606192335`.
- Plan doc: `docs/ADMIN_AGENTS_SCREEN_RESTRUCTURE_PLAN.md`.

### App-wide IST date format hotfix — deployed now

- Owner now: Periwinkle acceptance.
- Status: deployed live as version `20260620020839` after Amrutha asked to fix and deploy immediately.
- What changed live: User-facing app dates, report ranges, PDF report dates, report filenames, and client-side visit/attendance date handling now use India/Kolkata rules. Display format is `dd/mm/yyyy`; downloaded report file tokens use `ddmmyyyy`.
- Checks passed: full test suite 103/103, frontend build, backend build, live API health, live version/bundle check, live login-page console check, and live attendance PDF filename check.

### BUG-20260618-009 — Check-in confusion / repeated already-checked-in errors

- Owner now: Periwinkle; Bloom live retest passed for the check-in/reload/check-out/re-check-in journey, but live-user overnight auto-checkout needed a follow-up correction.
- Status: live data corrected after Amrutha reported 2026-06-19 logs still appearing today; 6 open 2026-06-19 sessions were auto-closed with backup/audit and backend restart.
- What changed live: Attendance now clearly shows Not checked in / Checked in / Checked out; after check-in the app asks the backend for current attendance on reload, so the home dashboard stays checked-in after refresh; the main action becomes Check out; selected work mode sits inside the main checked-in card; Check out uses a warmer action colour; after checkout the app shows Check in again for agents returning from a break/second visit; missed checkouts are auto-closed at night and shown as `Auto checked out` for admin review.
- Evidence before fix: live client-error log had 25 check-in/attendance-related entries, including repeated `/attendance/check-in` `Agent is already checked in` errors.
- Verification: targeted API/app tests passed 34/34, production frontend build, backend build, production DB backup, live DB repair audit, backend restart, API health OK, live version `20260619034400`, live bundle contains `Auto checked out`, and monitor page still shows the standalone `CrystalBio Live Monitor` layout.
- Latest live correction: at 2026-06-20 04:45 IST, Periwinkle found the 23:59 IST auto-checkout had run before the date changed, so 2026-06-19 sessions were not eligible. Manual backup/write repair closed Surendra, Deekshak, Madhu, Dr. Swati Priya, Sanjeev, and Ajay AS as `Auto checked out`; open attendance is now 0; API health OK; non-Bloom business data hash stayed unchanged.
- Night automation: cron job `faeccaf5a2d2` now runs daily at 18:35 UTC / 00:05 IST and the script uses Asia/Kolkata date logic by default, so same-day missed checkouts are handled after midnight.

### Admin home — remove Latest submitted work

- Owner now: Periwinkle/Rahul acceptance.
- Status: **deployed live and Bloom check passed**. Live bundle no longer contains `Latest submitted work`.
- Intended result: Admin home keeps the four action cards and office-action needs; submitted Sales/Service work remains under Field Entry, not Admin home or Agents.
- Bloom evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-18_ATTENDANCE_ADMIN.md`.

### Live monitor page

- Owner now: Periwinkle/Bloom monitoring.
- Status: refreshed and working.
- Latest verified monitor page: `17 Jun 2026, 07:53 pm IST`; counts were 0 real-user errors, 78 needs-classification, 18 Bloom/testing failures, 95 failed logins, 80 successful logins.
- Automation: static monitor page now refreshes every 5 minutes from server-side logs, while the API monitor cron continues separately.

### BUG-20260615-001 — Login keyboard Enter/Go does not submit

- Owner now: Bloom retest.
- Status: Periwinkle confirmed the live login screen now contains a real form, and pressing Enter/Go from the password field sends the login request. Waiting for Bloom's formal retest before final acceptance.
- What this means: the live deploy appears updated; this should no longer block phone users who press keyboard Go/Enter.
- Latest note: Periwinkle checked the live app on 2026-06-16 08:43 UTC with a wrong-password login attempt; Enter/Go sent one `/auth/login` request to the live API.

### BUG-20260615-002 — Bloom QA accounts could not log in

- Owner now: none, unless it regresses.
- Status: verified fixed by Bloom.
- What this means: Bloom QA accounts were created/activated and login checks passed.

### BUG-20260616-003 — Sales/Service Step 2 stays pending after save

- Owner now: Bloom retest.
- Status: Iris fixed locally and ran tests/build; waiting for Bloom to retest on the live/mobile journey.
- What this means: after saving Step 2, the app should now show Step 2 as saved/completed instead of pending.

### BUG-20260616-004 — Bottom navigation covers long mobile Step 2 fields

- Owner now: Iris night fix, then Bloom retest.
- Status: approved for a small night fix.
- What this means: long Sales/Service Step 2 forms need safe bottom spacing so the bottom navigation does not cover fields or save controls.

### BUG-20260616-005 — Camera/Upload controls look squeezed

- Owner now: backlog/defer unless Rahul wants polish tonight.
- Status: not fixing now.
- What this means: the upload controls look less polished, but this is lower risk and should not be mixed into the Step 2/nav fix.

## What needs to happen next

1. Bloom should formally retest the login Enter/Go bug now that Periwinkle confirmed the live frontend sends the login request.
2. Bloom should retest the Sales/Service Step 2 fix on mobile.
3. Iris should take only BUG-20260616-004 during the night fix window: add safe bottom spacing for long Step 2 forms.
4. Keep BUG-20260616-005 deferred unless Rahul wants that polish included tonight as a separate small fix.
5. Morning summaries should point to this file plus `docs/BUG_INTAKE_BOARD.md`, so the user can see the current state quickly.

### BUG-20260616-006 — Previous saved entry opens as blank form

- Owner now: none unless regression is reported.
- Status: deployed and Bloom-verified after deploy.
- Periwinkle check: live now serves version `20260616023405` and asset `index-DZSk2R0D.js`; the live asset contains the saved-entry fix markers. Backend was rebuilt/restarted and API health is OK.
- Bloom retest: passed on live mobile browser using only assigned Bloom QA credentials. Sales and Service previous entries reopened with saved details/status instead of blank pending forms.
- Cleanup: Bloom-created retest Sales/Service/attendance rows and Bloom sessions were removed after backup/dry-run/write cleanup; post-clean check shows 0 Bloom Sales/Service rows and 0 Bloom sessions.

## Source files

- `docs/BUG_INTAKE_BOARD.md` — current bug queue.
- `docs/BUG_FIX_LOG.md` — Iris fix history.
- `docs/qa-runs/` — Bloom QA reports.
- `docs/LAUNCH_WEEK_NIGHT_QA_SCHEDULE.md` — night workflow and schedule.

## Current monitor split

- Real-user issues: no confirmed high/critical real-user app error from the latest location-permission alert.
- Testing/Bloom failures: the location-permission save errors came from HeadlessChrome/test automation, so they are separated as testing failures.
- Rule: Periwinkle should report both categories in Telegram, but Iris should only fix after Amrutha/Rahul approval.

## Live monitor page route guard — 2026-06-17

- Amrutha clarified that the preferred monitor is the 2026-06-16 separated CrystalBio Live Monitor page, not the newer wide redesigned dashboard and not the inactive-link page.
- Current approved behavior for `https://work.convogenie.ai/periwinkle-live-monitor-a93f27.html`: show the standalone `CrystalBio Live Monitor` page with separated sections for real-user issues, needs classification, Testing/Bloom failures, failed login attempts, and recent successful logins.
- The monitor-named URL must not show the CrystalBio phone-app/admin interface and must not be redesigned again unless Amrutha/Rahul explicitly ask for that.
- Verification after restoring the 2026-06-16 monitor style: source file restored from the live backup, build passed, live HTML returned HTTP 200 with `CrystalBio Live Monitor`, and browser verification showed the separated monitoring sections.
- Amrutha later clarified that monitor email IDs should be shown completely, not masked. The static monitor page now reads the server-side monitor logs for full email IDs while keeping the same separated layout.

## QA test-submission cleanup rule

- Bloom test Sales/Service/attendance submissions are temporary evidence only.
- Bloom must not leave test form submissions mixed into real field work or admin reports.
- Cleanup must be narrow: Bloom may remove or hide only records clearly created by Bloom/Bloom QA accounts, after backup and dry-run.
- Periwinkle should enforce this boundary during review. Iris must not delete or alter real-user submitted field records unless Amrutha/Rahul explicitly approves it.


## Legacy import dry-run status — 2026-06-16

- Direction changed: old Convogenie data will stay out of active app records for now.
- Periwinkle generated a separate read-only customer-history webpage.
- Source rows included in the archive page: 3,008 captured rows, including exact duplicates as captured.
- Customer/groups shown: 242.
- Order: oldest to most recent, 2026-01-01 through 2026-06-16.
- Empty old fields stay blank; data is not cleaned, edited, or auto-filled.
- Customer/company-looking names are treated as customer/company data, not employees.
- Local archive page verified over HTTP; no live CrystalBio or Convogenie data changed.
