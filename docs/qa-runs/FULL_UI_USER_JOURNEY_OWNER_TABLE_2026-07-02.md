# CrystalBio UI Check — Simple Owner Table — 2026-07-02

## Simple answer

| Area | Status | What it means | Action needed |
|---|---|---|---|
| Live app/API | OK | App and backend are running. | None. |
| Admin login | OK | Bloom admin could log in and see admin screens. | None. |
| Agent login | OK | Bloom agent could log in and see agent screens. | None. |
| Admin Overview | OK | Main admin status cards are visible and usable. | None. |
| Field Entry | OK | Saved entries, filters, search, and detail view are visible. | Cleanup Bloom test rows only. |
| Agents screen | OK | Team/agent list, attendance/work mode, and counts are visible. | None. |
| Approvals | OK | No pending decision issue found; old Bloom rejected leave visible. | Cleanup Bloom test data only. |
| Reports | OK | Agent/Admin PDF report download works in Bloom evidence. | None. |
| Attendance | OK | Check-in, refresh, repeat check-in block, and checkout worked. | Same-phone overnight login still needs acceptance. |
| Sales form | OK | Step 1/2/3 save and reopen worked in Bloom evidence. | Remove Bloom QA Sales record after backup/dry-run. |
| Service form | OK | Step 1/2/3 save and reopen worked in Bloom evidence. | Remove Bloom QA Service record after backup/dry-run. |
| iPhone Field Entry search zoom | Waiting | Source fix exists, but live phone retest is not accepted yet. | Bloom/user retest needed. |
| Daily logout issue | Waiting | Automated restore checks passed, but real-phone overnight acceptance is still open. | Real iPhone/Android acceptance needed. |

## Bottom line

| Question | Answer |
|---|---|
| Is the app broadly usable today? | Yes. |
| Any confirmed Critical/High outage? | No. |
| Should Iris fix anything right now? | No, not without approval. |
| Should we deploy in daytime? | No routine deploys. |
| Main next step | Clean Bloom-only QA records safely, then retest the two waiting items. |

## Bloom-only QA records to clean safely

| Type | ID |
|---|---|
| Attendance | attendance_965 |
| Sales opportunity | sales_966 |
| Sales visit | sales_visit_967 |
| Service record | service_968 |
| Service visit | service_visit_969 |
| Leave request | leave_970 |
