# Bloom 2:30 AM IST fix retest sweep — 2026-07-04

## Plain-English summary

- Live app/API were up: frontend version `20260703033332`, API health OK.
- Retested only live/deployed items needing Bloom verification or acceptance support: GPS/location save reliability, same-phone saved-login support, and agent PDF report downloads.
- GPS/location is **not accepted**: valid GPS saves work through the API, but the live mobile browser path still showed `Location could not be captured...`; typed Sales form details were preserved and no bad Chrome-only copy appeared.
- Saved-login support passed in this cron context: bearer and cookie session restore returned Bloom QA Agent; invalid session returned 401.
- Agent report PDFs passed again for Attendance, Visit, and Combined downloads.
- Cleanup removed only Bloom-created Sales/Service GPS retest records after dry-run/backup/write and backend restart; live verification shows 0 matching Bloom retest entries remain.

## Scope and credentials

- Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`.
- Credentials used: assigned Bloom QA Admin and Bloom QA Agent only.
- Real-user credentials/data: not used; no real-user cleanup done.

## Retest table

| Bug/item | Original path | Nearby normal path | Edge path | Mobile/layout + console/API | Result | Evidence |
|---|---|---|---|---|---|---|
| BUG-20260702-023 GPS/location save reliability | Agent Sales Step 1 → Use current location showed `Location could not be captured. Your typed details are still here...`; customer/note/requirement text stayed in fields. | Live API Sales valid GPS save returned `201`; Service valid GPS save returned `201`; Admin Field Entry API saw both Bloom-created records before cleanup. | Sales missing GPS returned `400 GPS location is required`; Sales impossible GPS returned `400 Valid GPS latitude and longitude are required`; Service missing GPS returned `400 GPS location is required`. | Mobile Sales Step 1 remained full-screen, sage/olive, 16px fields, bottom nav visible. Browser console had no console messages, but one empty JS exception was recorded after geolocation failure. | **Fail / keep open** — backend GPS validation is good, but browser location capture is still not proven across phones/browsers. | `dogfood-output/bloom-230-retest-2026-07-04-live-api.json`; browser snapshot/vision in this run. |
| BUG-20260624-018 saved login/session restore | Agent login then `/auth/session` with bearer token returned Bloom QA Agent. | `/auth/session` using the live Set-Cookie session also returned Bloom QA Agent. | Invalid token returned `401 Login session is required`. | No UI crash seen during login/session path. | **Pass as supporting cron evidence; keep open for real same-phone overnight acceptance.** | `dogfood-output/bloom-230-retest-2026-07-04-live-api.json`. |
| BUG-20260624-019 agent report PDF download | Agent Attendance / Visit / Combined report PDF endpoint returned PDFs. | Report downloads were scoped to Bloom QA Agent date range. | Invalid report session returned `401` JSON. | API content type `application/pdf`, `%PDF` header, file sizes > 1000 bytes. | **Pass.** | `dogfood-output/bloom-230-retest-2026-07-04-live-api.json`. |

## Cleanup

- Dry-run: `docs/live-data-audits/bloom-230-retest-cleanup-dry-run-2026-07-04.json` showed 1 Bloom Sales record/visit and 1 Bloom Service record/visit eligible.
- Write cleanup: `docs/live-data-audits/bloom-230-retest-cleanup-write-2026-07-04.json` removed only those Bloom-owned records and wrote a live DB backup.
- Backend restart completed; API health returned `200 {"status":"ok"}`.
- Post-clean live Admin Field Entry API check found `0` entries containing `BLOOM QA 230 GPS`.
- Final Bloom-only dry-run showed 0 Bloom Sales/Service/attendance/leave records remaining for cleanup.

## Next action for Periwinkle/Rahul

- Keep BUG-20260702-023 open; approve/decide the real cross-phone GPS capture plan before calling it fixed.
- Saved-login still needs real iPhone/Android same-phone overnight acceptance, not just cron API evidence.
- Agent PDF report download can remain waiting for Periwinkle/Rahul acceptance if not already accepted.
