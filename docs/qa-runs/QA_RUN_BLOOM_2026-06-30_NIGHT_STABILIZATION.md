# Bloom nightly stabilization QA — 2026-06-30

## Owner summary

Bloom tested the live CrystalBio app/API at the 9 PM IST stabilization slot using only the assigned Bloom QA admin and Bloom QA agent accounts.

Live app/API are up. No new Critical or High launch-blocking issue was confirmed in this run. Bloom-created Sales, Service, and attendance QA records were cleaned using the documented Bloom-only backup/dry-run/write path, and live API verification shows the Bloom rows from this run are removed.

## Live target checks

- App: `https://work.convogenie.ai`
- API health: `https://work-api.convogenie.ai/health`
- Run time: 2026-06-30 21:03–21:05 IST / 2026-06-30 15:33–15:35 UTC
- Live frontend version: `20260627041940`
- Evidence files:
  - `dogfood-output/bloom-nightly-stability-live-2026-06-30.json`
  - `dogfood-output/bloom-nightly-cleanup-verify-2026-06-30.json`

## What Bloom tested

### Login and session

- Passed: live app HTML reachable.
- Passed: API health returned `status: ok`.
- Passed: Bloom admin login.
- Passed: Bloom agent login.
- Passed: wrong password showed normal invalid-login response.
- Passed: empty login showed validation.
- Passed: no-session `/auth/session` was blocked with 401.
- Passed: saved-login restore/session validation for Bloom admin and Bloom agent through `/auth/session`.
- Passed: browser opened directly into the saved Bloom admin session, confirming saved-login restore in this browser context.

### Attendance

- Passed: Bloom agent check-in created attendance `attendance_893`.
- Passed: repeated check-in while already checked in was blocked clearly with `Agent is already checked in`.
- Passed: `/attendance/current` still showed the checked-in row after refresh-style validation.
- Passed: checkout worked.
- Passed: checkout then re-check-in worked (`attendance_894`).
- Passed: final checkout completed before cleanup safety verification.

### Sales flow

- Passed: Sales Step 1 saved with a clearly named Bloom QA customer.
- Passed: Sales Step 2 saved and marked `step2Saved: true`.
- Passed: Sales Step 3 saved and marked `step3Saved: true`.
- Passed: Sales saved-entry follow-up/update was added.
- Passed: saved Sales entry appeared in agent entries and Admin Field Entry.
- Passed: Admin Field Entry Sales detail opened and showed detail rows.

### Service flow

- Passed: Service Step 1 saved with a clearly named Bloom QA customer.
- Passed: Service Step 2 saved and marked `step2Saved: true`.
- Passed: Service Step 3 saved and marked `step3Saved: true`.
- Passed: Service saved-entry follow-up/update was added.
- Passed: saved Service entry appeared in agent entries and Admin Field Entry.
- Passed: Admin Field Entry Service detail opened and showed detail rows.

### Admin journeys

- Passed: Admin overview/report API returned live totals quickly.
- Passed: second Admin report fetch returned consistent totals, covering the live-refresh API path.
- Passed: Admin overview `Checked in` expanded view showed `Checked in now`, active checked-in people only, check-in times, and work-mode chips.
- Passed: Field Entry All entries showed Bloom-created Sales/Service rows before cleanup, with search/type filters and detail opening.
- Passed: browser Back returned from Field Entry submitted-form detail to the Field Entry list.
- Passed: Admin Agents endpoint showed Bloom QA Agent.
- Passed: Admin Approvals/leave endpoint was reachable.
- Passed: Admin Reports PDF downloaded as `application/pdf`.
- Passed: Agent report PDFs downloaded for Attendance, Visit, and Combined report types.
- Passed: Admin Profile loaded, access list was visible, and Logout control was present.

### Mobile layout / browser checks

- Passed: mobile-sized browser showed the approved sage/olive full-screen app style with bottom navigation visible.
- Passed: no JavaScript console errors were captured during the admin Overview → Field Entry → detail → browser Back → Profile path.
- Observation: the floating bottom navigation can visually sit over long expanded content while scrolling, but the tested navigation/detail paths remained usable. No new blocking mobile layout bug is filed from this run.

## Cleanup result

Cleanup completed safely using the documented Bloom-only sequence.

1. Dry-run with `--bloom-only` found only Bloom-owned targets from this run:
   - 2 attendance rows
   - 1 Sales record / 2 Sales visits
   - 1 Service record / 2 Service visits
   - 0 leave requests
   - 0 sessions
2. Backend was stopped briefly.
3. Bloom-only cleanup was run with `--bloom-only --write`.
4. Backend was restarted.
5. Live `/health` returned OK.
6. Post-clean live API verification passed:
   - Bloom agent field-visits matching this run: 0
   - Admin team field-visits matching this run: 0
   - Bloom current attendance: null
   - leave requests matching this run: 0

## Confirmed bugs

No new Critical or High bug was confirmed in this run.

No `docs/BUG_INTAKE_BOARD.md` update was made because the only mobile note was an observation, not a confirmed blocking defect.

## Blocked / not fully tested

- Real iPhone/Android home-screen overnight persistence cannot be fully proven from this cron browser session. BUG-20260624-018 still needs the same-phone/overnight Bloom or user acceptance path before final acceptance.
- Real camera capture/upload was not exercised with a physical camera in this cron run.

## Next action for Periwinkle

- Keep BUG-20260624-018 saved-login/session restore in “waiting for same-phone/overnight retest.”
- Keep BUG-20260624-019 Agent report PDF ready for acceptance review: Bloom confirmed live Agent PDFs downloaded for Attendance, Visit, and Combined in this run.
- Keep BUG-20260626-020 admin checked-in card ready for acceptance review: Bloom confirmed the expanded live card now lists active checked-in agents with `Checked in now` behavior.
- No new Iris fix is approved from this Bloom run.
