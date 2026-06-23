# Bloom QA Run — 2026-06-17

## Plain-English summary for Rahul / Periwinkle

Bloom retested the launch-week item marked Ready for Bloom retest: BUG-20260617-007, Admin checked-in attendance detail/work-mode display.

Result: **not verified fixed**. The admin checked-in list improved for names/times, but the selected work mode still does not show, and the agent checked-in guard did not behave correctly in the tested live scenario.

## Scope

Retest only:

- BUG-20260617-007 — Admin checked-in card should show all checked-in people, check-in time, check-out/Still checked in, duplicate-session note when applicable, and saved selected work-mode chip / `Mode not recorded` fallback.
- Nearby normal scenario: Admin overview should match tonight's deployment note and not show `Latest submitted work` on the overview.
- Edge scenario: Agent already checked in should not be encouraged to check in again.

Environment:

- Live app: `https://work.convogenie.ai`
- Live API: `https://work-api.convogenie.ai`
- Device style: mobile Chromium / iPhone 13 viewport through Playwright
- Accounts used: assigned Bloom QA admin and Bloom QA agent only
- Time: 2026-06-17 21:12-21:18 UTC

## What passed

- Live API health returned OK.
- Bloom QA admin login worked.
- Bloom QA agent login worked.
- Admin expanded Checked in card now shows a longer attendance list instead of only four people.
- Admin expanded Checked in card showed check-in time text such as `In 2:42 am`.
- Admin expanded Checked in card showed `Still checked in` and checked-out rows with `Out ...` where available.
- Admin expanded Checked in card showed duplicate-session text for Bloom: `2 sessions today`.
- No browser console errors were captured in this retest.

## What failed

### BUG-20260617-007 — Not Verified by Bloom

Severity: High

Journey and scenario:

- Agent check-in selected work mode → Admin overview Checked in expanded card.
- Bloom created a live check-in with selected work modes `Sales visit` + `In office`.

Steps retested:

1. Log in to the live API as `bloom.agent@crystalbio.in`.
2. Create/check a clean Bloom agent attendance state.
3. Check in with GPS and selected work modes: `Sales visit` + `In office`.
4. Log in as `bloom.admin@crystalbio.in`.
5. Open live Admin overview on mobile.
6. Expand the Checked in card.
7. Check the Bloom row and the admin report API evidence.

Expected result:

- The Admin expanded Checked in card should show the saved selected work modes, for example `Sales visit` and `In office`, as the approved work-mode chip/text.
- If an older attendance row has no mode, it should show `Mode not recorded` rather than guessing from the role.

Actual result:

- The live API/admin report returned Bloom's new attendance row without `workTypes`.
- The Admin overview Bloom row showed: `Bloom QA Agent • Sales + service agent • In 2:42 am • Still checked in • 2 sessions today`.
- No `Sales visit`, no `In office`, and no `Mode not recorded` text appeared for that row.

Evidence:

- API/UI result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260617-007-retest-live.json`
- Admin expanded screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug007-admin-checked-expanded-mobile.png`

Launch/pilot impact:

- Blocks acceptance of Amrutha's requested attendance-detail improvement because admin still cannot see the selected work type.

## Nearby normal scenario failure

Scenario:

- Admin overview should follow tonight's deployment note: submitted Sales/Service work remains under Agents and Field Entry, not Admin overview.

Expected:

- Admin overview should not show `Latest submitted work`.

Actual:

- Live Admin overview still showed `LATEST SUBMITTED WORK` with submitted forms.

Evidence:

- Same UI result JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260617-007-retest-live.json`
- Admin home screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug007-admin-home-mobile.png`

Impact:

- Medium launch polish/product-structure mismatch. It is part of tonight's deployment notes, but not the core work-mode bug.

## Edge scenario failure

Scenario:

- Agent already checked in should not be encouraged to check in again.

Steps retested:

1. Keep Bloom QA Agent checked in in the live API/admin attendance data.
2. Log in to live app as Bloom QA Agent on mobile.
3. View Home screen.

Expected:

- The agent Home/check-in area should show an already-checked-in state and a clear Check out path.

Actual:

- The agent Home screen said `Ready for field work` and `Logged in. Check in to start field work.`
- It showed `Check in`, not a checked-in/check-out state, even while Admin/API showed Bloom checked in.

Evidence:

- Agent edge JSON: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260617-007-agent-edge-live.json`
- Agent screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug007-agent-already-checked-in-edge.png`

Impact:

- High for attendance clarity because an already checked-in agent may be prompted to check in again.

## Console / API notes

- API health: OK.
- Browser console errors: none captured.
- Failed browser requests: one `version.json` navigation/version-check request aborted during the admin retest; no app crash followed.
- The Bloom-created active attendance record was checked out after evidence capture.
- Full Bloom-owned live DB row cleanup could not be run from this session because the local cleanup script requires a mounted live database path, and it is not available here.

## Final Bloom verdict

BUG-20260617-007 is **not Verified by Bloom**. Return to Periwinkle/Iris review. The fix should not be accepted until work modes persist/display on live, the agent checked-in guard is correct, and the Admin overview deployment note is confirmed if that item is still in tonight's scope.
