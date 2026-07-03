# Bloom 2:30 AM IST Fix Retest Sweep — 2026-07-03

Run time: 2026-07-02 21:01–21:06 UTC / 2026-07-03 02:31–02:36 IST  
Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version: `20260702164134`  
Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.

## Plain-English summary

- Live app and API were up.
- BUG-20260701-022 Field Entry search iPhone anti-zoom fix passed Bloom retest on live: the focused search input computed at `16px` on the mobile viewport.
- BUG-20260701-021 Admin submitted-form / Leave approval overlap passed Bloom retest on live: after a pending Bloom leave detail existed, opening a dashboard Sales submitted form showed only the Sales detail and did not also show the Leave approval detail.
- BUG-20260624-018 saved-login restore passed another Bloom cron/API supporting check, but still needs real same-phone overnight acceptance before final closure.
- BUG-20260702-023 location recovery was not marked as a ready Bloom retest item in the board. Bloom did only a nearby smoke check with browser GPS allowed: the Sales screen showed `Location added` after tapping `Use current location`.

## What was tested

### BUG-20260701-022 — Admin Field Entry search still zooms on iPhone keyboard

- Original bug steps: Bloom Admin login → Field Entry → focus the customer/agent search input on a phone-sized viewport.
- Expected: search input should use at least 16px font size so iPhone Safari does not auto-zoom.
- Actual: input placeholder `Search customer or agent`, focused input computed at `16px`.
- Nearby normal path: Admin UI login and Field Entry navigation passed.
- Edge path: focus state remained on the input without a visible crop/zoom break in mobile Chromium.
- Console/API: only expected saved-session 401s from cleared-session setup and a browser meta warning; no JavaScript crash.

### BUG-20260701-021 — Admin submitted-form detail also shows Leave approval detail

- Original bug steps: create/select a pending Leave approval, then Admin Overview → Total visits → open a submitted Sales form.
- Expected: submitted-form detail should show only the Sales/Service detail; Leave approval detail should not remain visible.
- Actual: detail showed `Back to dashboard`, `Sales`, and the Bloom QA Sales customer/note; the Bloom leave reason text was absent.
- Nearby normal path: Admin overview and Field Entry navigation passed.
- Edge path: pending Bloom leave existed at the same time as a dashboard submitted-form detail.
- Console/API: no JavaScript crash.

### BUG-20260624-018 — saved-login/session restore supporting retest

- Normal path: saved bearer session restore returned Bloom QA Agent.
- Edge path: invalid saved session returned `401 Login session is required`.
- Note: this remains supporting cron/API evidence only, not final real-phone overnight acceptance.

## What passed

- Live API health returned `200` / `{ "status": "ok" }`.
- Live app `version.json` returned `20260702164134`.
- Bloom Admin and Bloom Agent API login worked.
- BUG-20260701-022 passed.
- BUG-20260701-021 passed.
- BUG-20260624-018 supporting session checks passed.
- Nearby Sales GPS-with-permission smoke passed; no form was saved for this GPS smoke.

## What failed

- No ready-for-Bloom retest item failed in this sweep.

## Blocked / not accepted yet

- BUG-20260624-018 remains open until real iPhone/Android same-phone overnight persistence is accepted.
- BUG-20260702-023 was not marked ready for Bloom retest in the bug board, so Bloom did not mark it verified.

## Cleanup status

- Bloom-created QA records for the overlap retest were: `leave_1007`, `sales_1008`, `sales_visit_1009`.
- Dry-run confirmed only Bloom-owned rows would be removed: 1 Sales opportunity, 1 Sales visit, 1 Leave request; 0 real-user rows/sessions.
- Cleanup completed with backend stop → Bloom-only write cleanup → backend start → live health OK.
- Backup created: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-02T21-05-50-902Z.bak`.
- Live API post-clean verification showed 0 Bloom marker entries, 0 Bloom leave requests, and no current Bloom attendance.
- No real-user data was touched.

## Evidence

- Main retest evidence: `dogfood-output/bloom-230-retest-live-2026-07-03-2026-07-02T21-03-36-819Z.json`
- Focused GPS smoke evidence: `dogfood-output/bloom-230-gps-focused-2026-07-03-2026-07-02T21-05-11-879Z.json`
- Cleanup log: `dogfood-output/bloom-230-cleanup-2026-07-03.log`
- Cleanup verification: `dogfood-output/bloom-230-cleanup-verify-2026-07-03.json`
- Screenshots: `dogfood-output/screenshots/bloom-230-field-entry-search-focused-2026-07-02T21-03-36-819Z.png`, `dogfood-output/screenshots/bloom-230-dashboard-sales-detail-after-leave-2026-07-02T21-03-36-819Z.png`, `dogfood-output/screenshots/bloom-230-gps-focused-2026-07-02T21-05-11-879Z.png`

## Next action for Periwinkle

- Move BUG-20260701-022 and BUG-20260701-021 to Periwinkle/Rahul acceptance.
- Keep BUG-20260624-018 open for real same-phone overnight acceptance.
- Do not accept BUG-20260702-023 from this smoke check; retest it only after Iris/Periwinkle marks the exact location fix ready/deployed for Bloom verification.
