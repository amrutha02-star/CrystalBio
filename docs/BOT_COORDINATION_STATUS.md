# CrystalBio Bot Coordination Status

Last refreshed: 2026-06-16 07:22 IST / 2026-06-16 01:52 UTC

Purpose: one simple dashboard so Rahul can see what Periwinkle, Bloom, and Iris are doing without reading logs.

## Simple summary right now

- Periwinkle, Bloom, and Iris services are all running.
- Night automation is scheduled for launch week.
- Bloom is testing and monitoring.
- Periwinkle is supposed to review Bloom findings and approve what Iris can fix.
- Iris is supposed to fix only approved bugs, then hand them back to Bloom for retesting.
- The main confusion right now is that the work exists across several files, but there was no single plain-English dashboard until this file.

## Who owns what

### Periwinkle — lead/reviewer

- Reviews Bloom's QA findings.
- Decides which bugs are safe and important enough for Iris.
- Gives final acceptance after Bloom retests.
- Produces the morning summary.

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
- 9:00 PM IST: Bloom heavy QA starts.
- 11:00 PM IST: Periwinkle triage/review starts.
- 11:30 PM IST: Iris approved night fixes start.
- 2:30 AM IST: Bloom retests Iris fixes.
- 7:30 AM IST: Periwinkle morning summary.

## Current bug/fix status

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

- Owner now: deploy decision, then Bloom retest after deployment.
- Status: source fix exists locally and builds; it is not visible on the live site yet.
- Periwinkle check: live is serving version `20260616020715` and asset `index-B9qABPPT.js`; that asset does not contain the saved-entry fix markers. Local build version `20260616023405` does contain them and passed test/build.
- Next: deploy the current build during a safe window, confirm the live asset/version changed, then Bloom retests Sales and Service previous-entry reopening.

## Source files

- `docs/BUG_INTAKE_BOARD.md` — current bug queue.
- `docs/BUG_FIX_LOG.md` — Iris fix history.
- `docs/qa-runs/` — Bloom QA reports.
- `docs/LAUNCH_WEEK_NIGHT_QA_SCHEDULE.md` — night workflow and schedule.

## Current monitor split

- Real-user issues: no confirmed high/critical real-user app error from the latest location-permission alert.
- Testing/Bloom failures: the location-permission save errors came from HeadlessChrome/test automation, so they are separated as testing failures.
- Rule: Periwinkle should report both categories in Telegram, but Iris should only fix after Amrutha/Rahul approval.

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
