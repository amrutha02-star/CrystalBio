# Bloom QA Run — 2026-06-19 Night Attendance Deep Test

## Plain-English summary

Bloom tested the live app and live API using only the assigned Bloom QA admin/agent accounts.

- Live API health passed.
- Attendance check-in, refresh/reopen persistence, checkout, and check-in again after checkout passed for the Bloom QA agent.
- Agent and admin data matched for the Bloom attendance records created during the test.
- Same-day repeated Check in attempts are blocked by the backend as expected; the live app now shows Check out after check-in, so the normal user path is less confusing.
- The downloaded attendance PDF is still not fixed: it remains a person-wise table with many low-value columns and no exception-first view. Keep BUG-20260619-010 open.
- Recent error logs still show repeated `Agent is already checked in` events from real users, especially Surendra at 02:12 UTC. Treat this as monitoring evidence for the attendance confusion already tracked under BUG-20260618-009/attendance follow-up.
- Bloom-created attendance rows are still present in real reports and must be cleaned only through the approved Bloom-only backup/dry-run/audit path. Bloom was not left currently checked in.

## Scope tested

Requested focus:

1. Attendance deep scenarios:
   - normal check-in,
   - repeated Check in taps,
   - refresh/reopen after check-in,
   - checkout then check-in again,
   - previous-day missed checkout / `Auto checked out` visibility,
   - agent/admin matching,
   - Bloom QA data not left active in real reports.
2. Monitor/error patterns for repeated same error/user action.
3. Downloaded attendance report evidence for BUG-20260619-010.

## Environment

- Live app: `https://work.convogenie.ai`
- Live API: `https://work-api.convogenie.ai`
- Accounts used: assigned Bloom QA admin and assigned Bloom QA agent only.
- No real employee credentials were used.
- Evidence JSON: `dogfood-output/evidence/bloom-night-attendance-qa-2026-06-19.json`
- Downloaded PDF: `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.pdf`
- Extracted PDF text: `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.txt`
- Admin report screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-reports-attendance-2026-06-19.png`
- Agent post-clean screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-home-after-attendance-clean-2026-06-19.png`

## What passed

### Attendance state flow

- Initial Bloom current attendance was clear before the API test.
- Normal check-in succeeded:
  - Created `attendance_383`
  - Status: `checked_in`
  - Work type saved: `Sales visit` + `In office`
- Refresh/reopen persistence passed by API:
  - `/attendance/current` returned the same active `attendance_383` after check-in.
- Admin view matched the agent state:
  - Admin report showed Bloom QA Agent as checked in with the same `attendance_383` record.
- Checkout passed:
  - `attendance_383` changed to `checked_out`.
- Check-in again after checkout passed:
  - Created `attendance_384`
  - Status: `checked_in`
  - Work type saved: `Service visit`
- Final cleanup-state check passed:
  - Bloom QA Agent `/attendance/current` returned `null` after final checkout.
  - The agent home reloaded to `Ready for field work` with `Check in`, so Bloom was not left active.

### Previous-day missed checkout / Auto checked out visibility

- Month-to-date admin report returned 15 attendance records containing auto-checkout/system-closed evidence.
- This confirms previous-day missed checkout history is visible in backend report data and preserved rather than deleted.
- Browser-level visual review of the specific admin wording still needs a focused retest if Rahul wants confirmation on exact `Auto checked out` display text in the admin UI.

### API health and console

- API health returned OK.
- Browser console on admin overview/reports had no JavaScript errors during this run.

## What failed / confirmed issues

### BUG-20260619-010 — Downloaded report attendance section is still overloaded

- Severity: Medium
- Status: Still failing on live / not ready to verify fixed.
- Evidence:
  - PDF file: `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.pdf`
  - Text extraction: `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.txt`
- What Bloom saw:
  - The PDF has a useful top metric row, but the main attendance section is still titled `Person-wise attendance` and shows a wide table: Person, Role, Days, Worked, Checked out, Leave applied, Approved/Pending, No update.
  - For this period it lists 17 people, 296 no-update days, and many rows with repeated low-value zeros.
  - It does not clearly prioritize who needs office action, who was auto-checked-out, who missed checkout, or key exceptions.
- Business impact:
  - Admin still gets a spreadsheet-style attendance section instead of a quick owner-friendly attendance review.
- Next action:
  - Keep BUG-20260619-010 open for Iris/night fix. Retest after the downloaded PDF is changed to summary-first and exception-first.

## Monitor/error pattern review

Recent server-side app error log patterns from the admin API:

- `Login | Invalid email or password | /auth/login`: 40 entries.
  - Likely mixed real mistypes / testing noise; no new bug unless a named user reports being blocked.
- `Attendance check-in | Agent is already checked in | /attendance/check-in`: 28 entries.
  - Still the strongest product-signal pattern.
  - Recent real-user examples include Surendra twice on 2026-06-19 at 02:12 UTC.
  - This is consistent with the attendance confusion already tracked and repaired under BUG-20260618-009, but the log should be watched for new repeats after the latest deployed behavior.
- `Allow location permission to save this field update.`: 4 entries.
  - Still lacks reliable user/path evidence in this run; keep monitoring, do not approve a code fix from this alone.

## Bloom QA records created / changed and not cleaned

Bloom did not delete or hide any records. These Bloom-owned rows are currently visible in today’s attendance/report data and need the approved Bloom-only cleanup path with backup/dry-run/audit:

- `attendance_383` — Bloom QA Agent — checked out — normal check-in test.
- `attendance_384` — Bloom QA Agent — checked out — check-in again after checkout test.
- `attendance_387` — Bloom QA Agent — checked out — Bloom nightly QA check-in observed in report data.
- `attendance_392` — Bloom QA Agent — checked out — Bloom QA second check-in after break; Bloom explicitly checked this out at `2026-06-19T15:33:36.957Z` so the agent is not left active.

Final verification: `/attendance/current` for Bloom QA Agent returned `null` after cleanup-state checkout.

## Blocked / not fully tested

- Bloom did not use real employee credentials, so no direct real-user login/session was tested.
- Bloom did not delete QA rows because cleanup requires the approved backup/dry-run/audit path.
- Exact admin UI wording for older `Auto checked out` rows was not fully visually retested; backend report data confirms auto-checkout records exist.

## Next action for Periwinkle/Iris

1. Keep BUG-20260619-010 open and fix/retest the downloaded attendance PDF only.
2. Continue watching repeated `Agent is already checked in` logs after the latest attendance deployment; if new repeats continue from the same real user, treat it as a product clarity follow-up.
3. Run approved Bloom-only cleanup for the listed Bloom attendance rows after backup/dry-run/audit, and confirm real Sales/Service/Leave/user-profile data stays intact.
