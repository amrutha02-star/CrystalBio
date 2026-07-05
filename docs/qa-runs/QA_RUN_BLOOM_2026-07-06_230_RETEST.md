# Bloom 2:30 AM IST Fix Retest Sweep — 2026-07-06

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version: `20260703033332`  
Run time: 2026-07-06 02:30–02:38 IST  
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
| BUG-20260623-016 Admin data refresh | Admin Field Entry stayed open on `All entries`; Bloom agent created a live Sales visit with valid GPS; the open admin screen refreshed and showed the new Bloom row at the top. | Admin `/field-visits?scope=team` also saw the new row. | Cleanup removed Bloom-created Sales rows only. | Field Entry remained readable, full-screen mobile, sage/olive baseline, no visible overlap. | Browser console had 0 console messages and 0 JS errors before GPS test. | **Passed / verified by Bloom** |
| BUG-20260624-019 Agent report PDF download | Attendance, Visit, and Combined agent PDFs downloaded from live API with `200 application/pdf` and `%PDF`. | Bloom agent session was scoped to Bloom agent. | Bad token returned `401` JSON, not a PDF. | Existing Agent Reports UI not redesigned in this retest. | API responses clean. | **Passed again; ready for Periwinkle/Rahul acceptance** |
| BUG-20260624-018 Saved-login/session restore | Bearer saved-session restore returned Bloom QA Agent. | App stayed usable after Bloom login in live browser. | Invalid saved session returned `401 Login session is required`. | Cron/API context only; not a real same-phone overnight proof. | API responses clean. | **Supporting pass only; keep open for real same-phone overnight acceptance** |
| BUG-20260702-023 GPS/location capture | Live mobile Sales Step 1 still showed `Location could not be captured...` after `Use current location`. | Typed customer/note/requirement stayed in place; no Chrome-only copy appeared. Backend valid-GPS Sales save still works. | Missing GPS was rejected with `GPS location is required`. | Sales form stayed usable and preserved typed text. | Browser recorded one blank JS exception entry during the GPS failure path; no console messages. | **Failed / keep open** |

## Evidence

- Raw API evidence: `dogfood-output/bloom-230-retest-live-2026-07-06.json`.
- Cleanup dry-run: `dogfood-output/bloom-230-cleanup-dry-run-2026-07-06.json`.
- Cleanup write: `dogfood-output/bloom-230-cleanup-write-2026-07-06.json`.
- Cleanup verification: `dogfood-output/bloom-230-cleanup-verify-2026-07-06.json`.
- Browser evidence: live Field Entry browser snapshot/visual check showed the Bloom retest row at the top after live refresh; Sales Step 1 browser snapshot showed the GPS failure copy and preserved typed text.

## Cleanup

Bloom-created QA Sales records from this retest were cleaned after Bloom-only dry-run and backup/write path. Live verification after backend restart/API check showed:

- API health OK.
- Admin login OK with Bloom QA Admin.
- Admin Field Entry API returned 30 entries and **0 Bloom rows**.

No real-user records were cleaned or modified by guess.
