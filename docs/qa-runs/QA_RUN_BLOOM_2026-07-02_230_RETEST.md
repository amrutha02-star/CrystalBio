# Bloom 2:30 AM IST Fix Retest Sweep — 2026-07-02

Run time: 2026-07-01 21:01–21:05 UTC / 2026-07-02 02:31–02:35 IST  
Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.

## Plain-English summary

- Live app and API were up.
- BUG-20260624-019 Agent report PDF download passed Bloom retest on live.
- BUG-20260624-018 saved-login restore again passed in Bloom's cron/browser/API context, but still needs real same-phone overnight acceptance before final closure.
- BUG-20260701-022 iPhone Field Entry search zoom was not retested because live `version.json` is still `20260701023648`; the documented 16px search fix is not live yet.
- No Bloom Sales/Service/attendance/leave QA records were created in this retest, so no data cleanup was needed.

## What was tested

### BUG-20260624-019 — Agent report PDF download

- Original bug steps: Bloom Agent login → Agent Reports → Attendance / Visit / Combined report → Download report.
- Nearby normal path: Agent report JSON for the same date range belongs to Bloom QA Agent only; Admin combined PDF still downloads.
- Edge path: invalid session cannot download Agent PDF.
- Mobile/layout path: live Agent Reports page at phone size showed the approved full-screen sage/olive layout, selectable report cards, visible `Download report`, and no obvious crop/zoom break.
- Console/API errors: browser console after Agent Reports navigation/download actions had 0 console messages and 0 JavaScript errors.

### BUG-20260624-018 — saved-login/session restore supporting retest

- Normal path: bearer saved-session restore returned Bloom Agent session.
- Edge path: session-cookie restore returned Bloom Agent session; invalid session was safely rejected.
- Note: this is supporting evidence only. Real iPhone/Android same-phone overnight persistence still needs user/Bloom device acceptance.

## What passed

- Live API health returned `200` / `{ "status": "ok" }`.
- Live app HTML loaded and live `version.json` returned `20260701023648`.
- Bloom Admin and Bloom Agent login both worked.
- BUG-20260624-019 passed:
  - Attendance PDF: `200 application/pdf`, `%PDF`, 4020 bytes, filename `crystalbio-my-attendance-report-29062026-to-02072026.pdf`.
  - Visit PDF: `200 application/pdf`, `%PDF`, 4821 bytes, filename `crystalbio-my-visit-report-29062026-to-02072026.pdf`.
  - Combined PDF: `200 application/pdf`, `%PDF`, 4820 bytes, filename `crystalbio-my-field-report-29062026-to-02072026.pdf`.
  - Invalid-session PDF edge returned `401` JSON, not a PDF.
  - Nearby Admin combined PDF still returned `%PDF`.
- BUG-20260624-018 supporting checks passed in the cron context:
  - bearer session restore: `200`, `bloom.agent@crystalbio.in`.
  - session-cookie restore: `200`, `bloom.agent@crystalbio.in`.
  - invalid session rejected: `401 Login session is required`.

## What failed

- No failed retest was confirmed in this sweep.

## Blocked / not retested

- BUG-20260701-022 Field Entry search iPhone zoom: blocked/not retested live because the live version is still `20260701023648`, while the board says the fix is built locally and scheduled for deploy. Bloom did not mark it verified.
- True overnight same-phone persistence for BUG-20260624-018: not fully proven by this cron browser/API check.

## Cleanup status

- No Bloom QA field/attendance/leave records were created.
- No cleanup was required.
- No real-user data was touched.

## Evidence

- API evidence: `dogfood-output/bloom-230-retest-live-2026-07-02-2026-07-01T21-02-38-590Z.json`
- Retest helper script: `dogfood-output/bloom-230-retet-2026-07-02.mjs`
- Browser evidence: live Agent Reports page opened with Bloom Agent, report type switching and download actions were clicked, and browser console reported 0 messages / 0 JavaScript errors.

## Next action for Periwinkle

- Move BUG-20260624-019 to Periwinkle/Rahul acceptance.
- Keep BUG-20260624-018 open until real same-phone overnight persistence is accepted.
- Retest BUG-20260701-022 only after the 16px Field Entry search fix is live.
