# Bloom QA retest — Attendance work mode and Admin home

Date: 2026-06-18
Live version: `20260618013516`
Tester: Bloom QA via Periwinkle
Credentials used: assigned Bloom QA agent/admin only. No real employee credentials used.

## Scope

- Agent check-in work type selection.
- Attendance record saves selected work types.
- Admin overview checked-in expanded card shows name, role, check-in time, still checked in/check-out, and selected work mode.
- Admin home no longer shows `Latest submitted work`.
- Bloom QA cleanup after evidence.

## Evidence checked

- Live app loaded at `https://work.convogenie.ai/?v=20260618013516`.
- Bloom QA Agent login succeeded.
- Check-in screen showed work type chips: `Sales visit`, `Service visit`, `In office`.
- Live backend check-in created Bloom QA attendance with `workTypes`: `Sales visit`, `Service visit`, `In office`.
- Duplicate check-in was blocked with `Agent is already checked in`.
- Bloom QA Admin login succeeded.
- Admin overview did not show `Latest submitted work`.
- Admin overview Checked in card expanded and showed:
  - `Bloom QA Agent`
  - `Sales + service agent`
  - check-in time
  - `Still checked in`
  - `Sales visit + Service visit + In office`

## Cleanup

- Bloom-only cleanup dry-run was checked first.
- Bloom-only cleanup write removed Bloom-created attendance rows only.
- Post-clean check: 0 Bloom attendance rows, 0 Bloom Sales rows, 0 Bloom Service rows.
- API health remained OK after cleanup.

## Result

Passed for the approved fix scope.

## Still watch

- If a real phone denies location permission, check-in should ask for permission before saving. That is expected GPS behavior, not part of this admin work-mode fix.
