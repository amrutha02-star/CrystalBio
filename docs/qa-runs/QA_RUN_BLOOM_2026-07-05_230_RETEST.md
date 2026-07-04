# Bloom 2:30 AM IST fix retest sweep — 2026-07-05

## Plain-English summary

- Live app/API were up: frontend version `20260703033332`, API health OK.
- Retested only live/deployed items needing Bloom verification or acceptance support: GPS/location reliability, same-phone saved-login support, and agent PDF report downloads.
- GPS/location is **still not accepted**: the live mobile Sales path still showed `Location could not be captured...`; typed customer/note/requirement text stayed in the form and no Chrome-only wording appeared.
- Backend GPS guards still work: valid Sales/Service GPS saves returned `201`, missing GPS returned `400`, and impossible GPS returned `400`.
- Saved-login support passed in this cron/API context: bearer and cookie session restore returned Bloom QA Agent; invalid session returned 401.
- Agent report PDFs passed again for Attendance, Visit, and Combined downloads.
- Cleanup removed only Bloom-created Sales/Service GPS retest records after dry-run/backup/write and backend restart; live verification found 0 matching Bloom 2:30 GPS retest rows.

## Scope and credentials

- Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`.
- Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.
- Real-user credentials/data: not used; no real-user cleanup done.

## Retest table

| Bug/item | Original path | Nearby normal path | Edge path | Mobile/layout + console/API | Result | Evidence |
|---|---|---|---|---|---|---|
| BUG-20260702-023 GPS/location save reliability | Agent Sales Step 1 → `Use current location` showed `Location could not be captured. Your typed details are still here...`; customer/note/requirement text stayed in fields. | Live API Sales valid GPS save returned `201`; Service valid GPS save returned `201`. | Sales missing GPS returned `400 GPS location is required`; Sales impossible GPS returned `400 Valid GPS latitude and longitude are required`; Service missing GPS returned `400 GPS location is required`. | Mobile Sales Step 1 remained full-screen sage/olive; browser console had 0 console messages and 1 blank JS exception after geolocation failure. | **Fail / keep open** — backend validation is good, but live browser/phone location capture is still not proven. | `dogfood-output/bloom-230-retest-2026-07-05-live-api.json`; live browser snapshot/console during this run. |
| BUG-20260624-018 saved login/session restore | Agent login then `/auth/session` with bearer token returned Bloom QA Agent. | `/auth/session` using the live Set-Cookie session also returned Bloom QA Agent. | Invalid token returned `401 Login session is required`. | No UI crash seen during login/session path. | **Pass as supporting cron evidence; keep open for real same-phone overnight acceptance.** | `dogfood-output/bloom-230-retest-2026-07-05-live-api.json`. |
| BUG-20260624-019 agent report PDF download | Agent Attendance / Visit / Combined report PDF endpoints returned PDFs. | Report downloads were scoped to Bloom QA Agent date range. | Invalid report session returned `401` JSON, not a PDF. | API content type `application/pdf`, `%PDF` header, file sizes > 1000 bytes. | **Pass.** | `dogfood-output/bloom-230-retest-2026-07-05-live-api.json`. |

## Cleanup

- Dry-run: `docs/live-data-audits/bloom-230-retest-cleanup-dry-run-2026-07-05.json` showed 1 Bloom Sales record/visit and 1 Bloom Service record/visit eligible.
- Write cleanup: `docs/live-data-audits/bloom-230-retest-cleanup-write-2026-07-05.json` removed only those Bloom-owned records and wrote a live DB backup.
- Backend restart completed; live API health returned `200 {"status":"ok"}`.
- Post-clean live Admin Field Entry API check found `0` entries containing `BLOOM QA 230 GPS 2026-07-05`.

## Next action for Periwinkle/Rahul

- Keep BUG-20260702-023 open; approve/decide the cross-phone GPS diagnostic/recovery fix path before calling it fixed.
- Saved-login still needs real iPhone/Android same-phone overnight acceptance, not only cron API evidence.
- Agent PDF report download remains ready for Periwinkle/Rahul acceptance if not already accepted.
