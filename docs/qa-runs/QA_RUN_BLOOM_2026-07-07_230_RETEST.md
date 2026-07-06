# Bloom 2:30 AM IST Fix Retest Sweep — 2026-07-07

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version: `20260703033332`  
Run time: 2026-07-07 02:30–02:53 IST  
Credential scope: only assigned Bloom QA accounts from `/root/workspace/crystalbio-credentials/bloom-assigned/BLOOM_ASSIGNED_CREDENTIALS.txt`.

## Scope

Retested only items marked ready/deployed needing Bloom verification:

- BUG-20260623-016 — Admin data refresh while screen stays open.
- BUG-20260624-019 — Agent report PDF download, supporting acceptance check.
- BUG-20260624-018 — saved-login/session restore, supporting cron/API check only.
- BUG-20260702-023 — Sales/GPS capture mitigation, still open and not accepted.

## Result summary

| Bug | Original steps | Nearby normal path | Edge path | Mobile/layout | Console/API errors | Status |
|---|---|---|---|---|---|---|
| BUG-20260623-016 Admin data refresh | Bloom agent created a live Sales visit with valid GPS and Bloom admin Field Entry team API saw the new Bloom row. | Admin `/field-visits?scope=team` returned the new row with Bloom QA Agent and the retest customer marker. | Cleanup removed Bloom-created Sales rows only. | Field Entry was not visually rechecked this run because this was a fix-retest sweep; API path stayed healthy. | API responses clean in the final run. | **Passed again / remains ready for Periwinkle/Rahul acceptance** |
| BUG-20260624-019 Agent report PDF download | Attendance, Visit, and Combined agent PDFs downloaded from live API with `200 application/pdf`, `%PDF`, dated filenames, and file sizes over 1000 bytes. | Bloom agent session was scoped to Bloom QA Agent. | Bad token returned `401` JSON, not a PDF. | Existing Agent Reports UI was not redesigned in this retest. | API responses clean. | **Passed again / ready for Periwinkle/Rahul acceptance** |
| BUG-20260624-018 Saved-login/session restore | Bearer saved-session restore returned Bloom QA Agent. | Bloom admin and agent logins worked after backend restart. | Invalid saved session returned `401 Login session is required`. | Cron/API context only; not a real same-phone overnight proof. | API responses clean. | **Supporting pass only; keep open for real same-phone overnight acceptance** |
| BUG-20260702-023 GPS/location capture | Live mobile Sales Step 1 still showed `Location could not be captured...` after `Use current location`. | Typed customer, note, and requirement stayed in place; no Chrome-only copy appeared. Backend valid-GPS Sales save still worked. | Missing GPS was rejected with `GPS location is required`. | Sales form stayed readable/full-screen mobile; typed text remained visible. Bottom navigation overlays part of the photo area but Save Step 1 stayed visible/tappable. | Browser recorded one blank JS exception during the GPS failure path; API GPS validation behaved correctly. | **Failed / keep open** |

## Evidence

- Raw final API evidence: `dogfood-output/bloom-230-retest-live-2026-07-07-2026-07-06T21-10-05-933Z.json`.
- Browser evidence: live Sales Step 1 snapshot showed GPS failure copy and preserved typed fields (`BLOOM GPS UI RETEST 20260707`, note, requirement). Browser console had 0 console messages and 1 blank JavaScript exception.
- Cleanup dry-run: `dogfood-output/bloom-230-cleanup-dry-run-2026-07-07.json`.
- Cleanup write: `dogfood-output/bloom-230-cleanup-write-2026-07-07.json`.
- Cleanup verification: `dogfood-output/bloom-230-cleanup-verify-2026-07-07.json`.

## Cleanup

Bloom-created QA Sales records from this retest and prior visible Bloom retest rows were cleaned after Bloom-only dry-run and backup/write path. Live verification after backend restart showed:

- API health OK.
- Admin login OK with Bloom QA Admin.
- Admin Field Entry API returned 30 entries and **0 Bloom rows**.

No real-user records were cleaned or modified by guess.
