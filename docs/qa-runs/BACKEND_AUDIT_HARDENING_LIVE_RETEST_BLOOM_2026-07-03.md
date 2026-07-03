# Backend Audit Hardening Live Retest — Bloom QA — 2026-07-03

- **Tester:** Bloom QA under Periwinkle
- **Environment:** live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`
- **Scope:** Live retest after Periwinkle deployed backend hardening fixes for BUG-20260703-024 through BUG-20260703-027.
- **Credentials:** Bloom assigned credentials only. No real employee/admin credentials used.

## Short verdict

Bloom live retest passed for all four backend hardening fixes.

Correct status after Periwinkle review: **deployed live, Bloom live-retested, accepted by Periwinkle.**

This does **not** close the wider real-phone GPS/location capture issue BUG-20260702-023.

## Live checks

| Check | Result |
|---|---:|
| Live API health | PASS — `{ "status": "ok" }` |
| Live frontend version | `20260703033332` |
| Backend service | Restored to `crystalbio-backend.service`, active/running after cleanup |

## Bug retest result

| Bug | Live result | Status |
|---|---|---:|
| BUG-20260703-024 role enforcement | Service-only Sales create blocked with `400 Sales access is required`; Sales-only Service create blocked with `400 Service access is required`; Bloom both-role account could create both. | PASS |
| BUG-20260703-025 GPS coordinate bounds | Attendance, Sales visit, and Service visit with `{999,999}` rejected with `400 Valid GPS latitude and longitude are required`. | PASS |
| BUG-20260703-026 password reset/session invalidation | Old temp-user token became `401` after reset and stayed `401` after setup; new password login worked. | PASS |
| BUG-20260703-027 duplicate visit matching | Exact duplicate Sales visit returned same ID `sales_visit_1040`; same-day different-time visit created separate ID `sales_visit_1041`. | PASS |

## Cleanup

- Bloom-created QA data only was cleaned.
- Bloom-only cleanup removed: 3 Sales records, 2 Service records, 2 Sales visits, 0 attendance, 0 leave.
- Temporary QA profiles remain only as deactivated obvious Bloom QA temp accounts.
- Backend was restarted after cleanup and public health returned OK.
- Periwinkle corrected the backend process back under `crystalbio-backend.service` after Bloom cleanup had started a manual backend process.

## Evidence

- Raw live retest evidence: `dogfood-output/bloom-backend-live-retest-2026-07-03.json`
- Cleanup dry-run: `dogfood-output/bloom-backend-live-retest-cleanup-dryrun-2026-07-03.json`
- Cleanup write log: `dogfood-output/bloom-backend-live-retest-cleanup-write-2026-07-03.log`

## Remaining open items

- BUG-20260702-023 real-phone/browser GPS capture remains open and not accepted.
- BUG-20260624-018 same-phone overnight login persistence remains open until real-device acceptance.
- React test warning cleanup remains a separate quality item.
