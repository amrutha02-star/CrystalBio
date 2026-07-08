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
- Admin Field Entry is not enough to prove every entry is visible because the live list returns only 30 Sales/Service cards while the 2026 admin report has 125 Sales/Service visit records.
- This supports BUG-20260708-028 as an admin visibility/listing problem until fixed and retested.
