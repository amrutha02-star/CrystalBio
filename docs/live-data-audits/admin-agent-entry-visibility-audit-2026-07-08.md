# Admin Agent Entry Visibility Audit — 2026-07-08
Live audit using Bloom QA Admin credentials only. No real-user credentials used. No records changed.
## Summary
- API health status: `200`
- Active admin/agent seats: `17`
- Today admin report totals: `{'checkedInAgents': 3, 'checkedOutAgents': 0, 'salesVisits': 3, 'serviceVisits': 0, 'pendingLeaveRequests': 0}`
- 2026 admin report totals: `{'checkedInAgents': 12, 'checkedOutAgents': 12, 'salesVisits': 90, 'serviceVisits': 35, 'pendingLeaveRequests': 0}`
- Admin Field Entry `/field-visits?scope=team` returned `30` cards: `23` Sales and `7` Service.

## Agent-by-agent counts
| Agent | Role | Today Sales | Today Service | Today Attendance | 2026 Sales | 2026 Service | 2026 Attendance | Field Entry visible cards |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ajay | service | 0 | 0 | 1 | 0 | 1 | 6 | 0 |
| Ajay AS | sales | 0 | 0 | 0 | 3 | 5 | 10 | 1 |
| Bloom QA Admin | admin | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Bloom QA Agent | both | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Deekshak | sales | 0 | 0 | 0 | 21 | 0 | 12 | 8 |
| Dr. Swati Priya | sales | 0 | 0 | 0 | 10 | 0 | 6 | 0 |
| Girish | service | 0 | 0 | 0 | 0 | 16 | 15 | 3 |
| Lalchandran | sales | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Madhu | service | 0 | 0 | 0 | 0 | 5 | 11 | 0 |
| Manjunath | sales | 1 | 0 | 0 | 9 | 0 | 3 | 2 |
| Padmakumar | sales | 1 | 0 | 1 | 15 | 0 | 15 | 5 |
| Prasanna | service | 0 | 0 | 0 | 0 | 0 | 7 | 0 |
| Praveen Kumar Shetty | admin | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Raghavendra K | admin | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Raja | service | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| Sanjeev | sales | 1 | 0 | 0 | 31 | 0 | 6 | 8 |
| Surendra | service | 0 | 0 | 1 | 0 | 8 | 18 | 3 |

## Preliminary conclusion
- Backend/admin reports are recording entries and attendance by agent.
- Admin Field Entry was not enough to prove every entry was visible before the fix because the live list returned only 30 Sales/Service cards while the 2026 admin report had 125 Sales/Service visit records.
- This supported BUG-20260708-028 as an admin visibility/listing problem, not data loss.

## Post-fix live check — 2026-07-08 21:40 IST
- Source fix: `/field-visits?scope=team` now returns all matching lightweight Sales/Service visit entries for admin Field Entry up to the guarded admin limit, instead of slicing the sorted team list to 30. Detail fetch by `entryId` still loads the selected payload; list responses do not include photo/base64 payloads.
- Local verification: `npm test -- --run src/backend/crystalBioApi.test.ts` passed 20/20; full `npm test -- --run` passed 116/116; `npm run build` passed; `npm run backend:build` passed.
- Live deploy/backup: backend restarted after backup `/var/lib/crystalbio/backups/crystalbio-db-20260708-bug028-pre-backend-restart.json`; live API health returned OK. Frontend version remains `20260703033332` because this was a backend-only fix.
- Live API verification with Bloom QA Admin: Admin Reports for 2026 still returned 90 Sales + 35 Service visit details; `/field-visits?scope=team` returned 125 entries: 90 Sales + 35 Service. The list response had no photo/base64 payload; `/field-visits?scope=team&limit=30` still returned 30 when explicitly requested; selected `entryId` detail returned one entry.
- Live browser verification with Bloom QA Admin: Admin Field Entry `All entries` showed `10 of 125 shown`; Show all expanded to `125 of 125 shown`; searching `Dr. Swati` showed 10 older entries; console had 0 messages / 0 JavaScript errors.
- No real-user records were changed and no QA records were created.
- Status: deployed live and Periwinkle live-checked; waiting for Bloom retest / owner acceptance.
