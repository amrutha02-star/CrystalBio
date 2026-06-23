# Bloom post-deploy QA retest — 2026-06-19

## Plain-English summary

- Live API was healthy during the retest.
- Field Entry is much lighter now: the team list returned 30 entries in about 31 KB, with no heavy photo/proof payloads in the list.
- Admin Field Entry mobile view showed `10 of 30 shown`, then `Show all 30 entries` successfully changed the list to `30 of 30 shown`.
- Field Entry `View details` opened a selected real submitted detail without console errors and without the old read-only helper text.
- Downloaded attendance PDF now starts with `Attendance exceptions and office action`, followed by a person-wise summary. The old wide-table-first heading was not seen in the extracted PDF stream.
- Saved Sales/Service previous-entry continuation for the Bloom QA Agent was **not fully retested**, because Bloom currently has no saved visits after cleanup. I did not create new Bloom QA records because this scheduled run does not have a verified live cleanup path available.

## Scope requested

1. BUG-20260619-012 Field Entry performance/list/detail/photo payload behavior.
2. BUG-20260619-013 saved-entry UX/text cleanup on mobile saved Sales/Service continuation and Field Entry detail.
3. BUG-20260619-010 downloaded report attendance section, if deployed.

## Credentials and environment

- Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`.
- Credentials used: Bloom QA Admin and Bloom QA Agent only, from `/root/workspace/crystalbio-credentials/bloom-assigned/BLOOM_ASSIGNED_CREDENTIALS.txt`.
- No real employee/admin credentials used.
- No QA Sales/Service/attendance records were created in this run.
- Checked at: 2026-06-19 17:45–17:55 UTC.

## What passed

### BUG-20260619-012 — Field Entry performance and all-entry visibility

Result: **Verified by Bloom for this retest; ready for Periwinkle/Rahul review.**

Evidence:

- API health returned OK.
- `/field-visits?scope=team` returned:
  - 30 entries,
  - about 31 KB,
  - 0 list `photoPayload` fields,
  - about 30 ms in the direct API check.
- Browser resource timing showed live Field Entry calls around 202–258 ms.
- Mobile admin Field Entry showed `10 of 30 shown` with a visible `Show all 30 entries` control.
- After tapping Show all, the list showed `30 of 30 shown`, including entries beyond the first 10.
- Selected Field Entry detail opened in the live browser without console errors.

Evidence files:

- `dogfood-output/bloom-postdeploy-live-api-2026-06-19.json`
- `dogfood-output/bloom-postdeploy-field-detail-2026-06-19.json`
- `dogfood-output/screenshots/bloom-postdeploy-admin-field-entry-all-2026-06-19.png`

### BUG-20260619-010 — Downloaded attendance report summary-first output

Result: **Verified by Bloom for this retest; ready for Periwinkle/Rahul review.**

Evidence:

- Attendance PDF download for 2026-06-01 to 2026-06-19 returned HTTP 200, `application/pdf`, `%PDF`, 6309 bytes.
- Extracted PDF stream contained:
  - `Attendance exceptions and office action`,
  - `Still checked in`,
  - `No update`,
  - footer `Crystal Bio Attendance Report`.
- The old `Person-wise attendance` wide-table-first heading was not found in the extracted stream.
- Admin report JSON for the same range returned totals: 10 checked-in, 10 checked-out, 24 sales visits, 8 service visits, 0 pending leave requests, 17 agent summaries. These support the report being generated from live saved data.

Evidence files:

- `dogfood-output/evidence/bloom-postdeploy-attendance-report-2026-06-01-to-2026-06-19.pdf`
- `dogfood-output/evidence/bloom-postdeploy-attendance-report-2026-06-01-to-2026-06-19-qdf.pdf`
- `dogfood-output/evidence/bloom-postdeploy-admin-report-json-2026-06-01-to-2026-06-19.json`

### BUG-20260619-013 — Field Entry detail copy/styling part

Result: **Partially passed.**

Evidence:

- Admin Field Entry `View details` opened a neutral detail page.
- Detail showed the customer-first information: customer/site, contact person, equipment/work, service agent, next action, next visit date, service type.
- No `read-only` instruction text was visible.
- No saved/not-saved pills or progress/status clutter were visible in the Field Entry submitted detail.
- Console had no JavaScript errors during this journey.

## What was blocked / not fully tested

### BUG-20260619-013 — Agent saved Sales/Service previous-entry continuation

Result: **Blocked for this scheduled retest, not accepted yet.**

Reason:

- Bloom QA Agent currently has no saved visits after the prior cleanup, so the live Visits screen showed `No saved visits yet`.
- I did not create new Bloom QA Sales/Service records because the run did not have a verified live backup/dry-run/write cleanup path available from this environment, and the launch-week rule says not to leave QA records mixed into real reports.

Next safe retest path:

1. Run this specific retest in a window where Bloom-only live cleanup is available.
2. Create clearly Bloom-owned Sales and Service QA entries.
3. Reopen them from Previous entries on mobile.
4. Confirm direct follow-up fields are near the top, Step 1 / Step 2 / Step 3 are preserved, pending Step 2/3 are directly visible, and no repeated `Tap to continue` / `No date set` clutter remains.
5. Back up, dry-run cleanup, clean only Bloom-owned QA records, then verify 0 Bloom QA records remain mixed into reports.

## Console / API notes

- Browser console had no JavaScript errors during tested admin Field Entry interactions.
- API health was OK.
- No new Critical or High launch-blocking bug was found in the completed parts of this retest.

## Bloom status recommendation

- BUG-20260619-012: mark **Verified by Bloom**, pending Periwinkle/Rahul acceptance.
- BUG-20260619-010: mark **Verified by Bloom**, pending Periwinkle/Rahul acceptance.
- BUG-20260619-013: keep **Needs more testing** because the Agent saved Sales/Service continuation part was blocked, though Field Entry detail cleanup passed.
