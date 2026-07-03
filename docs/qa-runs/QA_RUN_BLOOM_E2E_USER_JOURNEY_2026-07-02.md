# Bloom End-to-End User Journey QA — 2026-07-02

Environment: live app https://work.convogenie.ai, live API https://work-api.convogenie.ai
Live version: 20260701023648
Bloom QA marker: BLOOM E2E 2026-07-02 15-31-47

## Result

- Steps logged: 39
- Passed: 39 after Periwinkle evidence review
- Failed: 0 confirmed product failures
- Corrected note: five rows were originally mislabeled `FAIL`, but their own evidence shows successful saves/creates; the original labels have been corrected below.
- No real employee/admin credentials were used.
- QA Sales/Service/leave/attendance records were created only with Bloom QA accounts and are listed below for Bloom-only cleanup.

## QA data created

- Sales opportunity: sales_997
- Sales visit: sales_visit_998
- Service record: service_999
- Service visit: service_visit_1000
- Leave request: leave_1001
- Attendance: attendance_996

## Every minor step logged

1. PASS — Read only Bloom assigned QA credentials; no real user credentials used
   - Evidence: {"accountEmails":["bloom.admin@crystalbio.in","bloom.agent@crystalbio.in"]}
2. PASS — Live API health opens
   - Evidence: {"status":200,"body":{"status":"ok"}}
3. PASS — Live app shell loads
   - Evidence: {"status":200,"titleFound":true}
4. PASS — Live version endpoint opens
   - Evidence: {"status":200,"version":"20260701023648"}
5. PASS — Admin login works with Bloom admin
   - Evidence: {"agentName":"Bloom QA Admin","role":"admin","email":"bloom.admin@crystalbio.in"}
6. PASS — Agent login works with Bloom agent
   - Evidence: {"agentName":"Bloom QA Agent","role":"both","email":"bloom.agent@crystalbio.in"}
7. PASS — Wrong password is rejected clearly
   - Evidence: {"status":400,"body":{"error":"Invalid email or password"}}
8. PASS — Empty login is rejected, not silently accepted
   - Evidence: {"status":400,"body":{"error":"Email is required"}}
9. PASS — Saved agent session restores by bearer token
   - Evidence: {"status":200,"email":"bloom.agent@crystalbio.in","role":"both"}
10. PASS — Bad saved session is rejected safely
   - Evidence: {"status":401,"body":{"error":"Login session is required"}}
11. PASS — Agent cannot open admin reports API
   - Evidence: {"status":403,"body":{"error":"Admin access is required"}}
12. PASS — Agent current attendance loads before action
   - Evidence: {"status":200,"hasCurrent":true,"currentStatus":"checked_in"}
13. PASS — Pre-run safety checkout closes existing Bloom QA open attendance
   - Evidence: {"status":200,"attendanceStatus":"checked_out"}
14. PASS — Agent checks in with selected work mode *(corrected from mislabeled FAIL)*
   - Evidence: {"status":201,"attendanceId":"attendance_996","attendanceStatus":"checked_in","workTypes":["Sales visit","Service visit"]}
15. PASS — Repeated check-in while already checked in is blocked
   - Evidence: {"status":400,"body":{"error":"Agent is already checked in"}}
16. PASS — Refresh-style current attendance still shows checked in
   - Evidence: {"status":200,"attendanceStatus":"checked_in","attendanceId":"attendance_996"}
17. PASS — Admin report sees Bloom checked-in attendance
   - Evidence: {"status":200,"totals":{"checkedInAgents":7,"checkedOutAgents":2,"salesVisits":6,"serviceVisits":7,"pendingLeaveRequests":0},"bloomVisible":true}
18. PASS — Sales Step 1 saves quick visit with GPS and follow-up *(corrected from mislabeled FAIL)*
   - Evidence: {"opportunityId":"sales_997","visitId":"sales_visit_998","visitStatus":201,"account":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer"}
19. PASS — Sales Step 2 saves customer and requirement details
   - Evidence: {"status":200,"step2Saved":true,"accountName":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer Updated"}
20. PASS — Sales Step 3 saves quote and office details
   - Evidence: {"status":200,"step3Saved":true,"quoteStatus":"Quoted"}
21. PASS — Repeated Sales same-content save does not create duplicate latest rows *(corrected from mislabeled FAIL)*
   - Evidence: {"status":201,"returnedVisitId":"sales_visit_998"}
22. PASS — Service Step 1 saves quick service visit with GPS *(corrected from mislabeled FAIL)*
   - Evidence: {"recordId":"service_999","visitId":"service_visit_1000","customer":"BLOOM E2E 2026-07-02 15-31-47 Service Customer"}
23. PASS — Service Step 2 saves customer/equipment details
   - Evidence: {"status":200,"step2Saved":true,"customerName":"BLOOM E2E 2026-07-02 15-31-47 Service Customer Updated"}
24. PASS — Service Step 3 saves parts/status/office details
   - Evidence: {"status":200,"step3Saved":true,"machineStatus":"Running after QA"}
25. PASS — Agent own entries show saved Sales and Service rows
   - Evidence: {"status":200,"totalEntriesReturned":9,"bloomMatches":[{"type":"Service","customer":"BLOOM E2E 2026-07-02 15-31-47 Service Customer Updated","id":"service_visit_1000"},{"type":"Sales","customer":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer Updated","id":"sales_visit_998"}]}
26. PASS — Agent saved Sales detail reopens with Step 2 and Step 3 saved
   - Evidence: {"status":200,"detailRows":[{"label":"Submitted by","value":"Bloom QA Agent"},{"label":"Visit date","value":"2026-07-02 • 10:30"},{"label":"Customer","value":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer Updated"},{"label":"Step 2 status","value":"Saved"},{"label":"Step 3 status","value":"Saved"},{"label":"Contact person","value":"QA Contact Step 2"},{"label":"Phone","value":"9888888888"},{"label":"Email","value":"qa-sales@example.com"},{"label":"Department / address","value":"Long QA address, Bangalore"},{"label":"Lead source","value":"Bloom QA"},{"label":"Product type","value":"Analyzer"},{"label":"Brand / model","value":"Crystal QA Brand • QA-200"},{"label":"Requirement","value":"Detailed QA requirement"},{"label":"Visit note","value":"BLOOM E2E 2026-07-02 15-31-47 Sales Step 1 note with special chars & / #"},{"label":"Next action","value":"Follow-up needed"},{"label":"Follow-up date","value":"2026-07-03"},{"label":"Quote submitted","value":"yes"},{"label":"Quote status","value":"Quoted"},{"label":"Budget / proposal","value":"Budget shared in QA"},{"label":"Fund status","value":"Pending"},{"label":"Probability","value":"60%"},{"label":"Closing date","value":"2026-07-03"},{"label":"Support required","value":"Office follow-up"},{"label":"Office notes","value":"BLOOM E2E 2026-07-02 15-31-47 office note"}]}
27. PASS — Agent saved Service detail reopens with Step 2 and Step 3 saved
   - Evidence: {"status":200,"detailRows":[{"label":"Submitted by","value":"Bloom QA Agent"},{"label":"Visit date","value":"2026-07-02 • 11:15"},{"label":"Customer","value":"BLOOM E2E 2026-07-02 15-31-47 Service Customer Updated"},{"label":"Step 2 status","value":"Saved"},{"label":"Step 3 status","value":"Saved"},{"label":"Contact person","value":"Service QA Step 2"},{"label":"Phone","value":"9666666666"},{"label":"Email","value":"qa-service2@example.com"},{"label":"Department / address","value":"Long service QA address"},{"label":"Equipment","value":"Analyzer • Crystal Service Updated • SVC-200"},{"label":"Serial number","value":"QA-SN-002"},{"label":"Issue category","value":"Breakdown"},{"label":"Issue description","value":"Detailed service issue"},{"label":"Warranty / AMC","value":"Warranty"},{"label":"Service type","value":"calibration"},{"label":"Work done","value":"BLOOM E2E 2026-07-02 15-31-47 service work done"},{"label":"Next action","value":"Next visit needed"},{"label":"Next visit date","value":"2026-07-03"},{"label":"Parts required","value":"QA part required"},{"label":"Parts used","value":"QA part used"},{"label":"Machine status","value":"Running after QA"},{"label":"Support note","value":"Office support note"},{"label":"Final remarks","value":"BLOOM E2E 2026-07-02 15-31-47 final service remarks"},{"label":"Office notes","value":"BLOOM E2E 2026-07-02 15-31-47 service office note"}]}
28. PASS — Admin All entries sees Bloom Sales and Service rows
   - Evidence: {"status":200,"totalReturned":30,"bloomRows":[{"type":"Service","customer":"BLOOM E2E 2026-07-02 15-31-47 Service Customer Updated","agent":"Bloom QA Agent"},{"type":"Sales","customer":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer Updated","agent":"Bloom QA Agent"}]}
29. PASS — Agent submits leave request *(corrected from mislabeled FAIL)*
   - Evidence: {"status":201,"leaveId":"leave_1001","requestStatus":"pending"}
30. PASS — Admin approvals list sees Bloom leave request
   - Evidence: {"status":200,"bloomLeaveFound":true,"pendingCount":1}
31. PASS — Admin rejects Bloom leave request for cleanup safety
   - Evidence: {"status":200,"requestStatus":"rejected"}
32. PASS — Agent attendance PDF downloads as real PDF
   - Evidence: {"status":200,"contentType":"application/pdf","pdfHeader":"%PDF","bytes":4012}
33. PASS — Agent visits PDF downloads as real PDF
   - Evidence: {"status":200,"contentType":"application/pdf","pdfHeader":"%PDF","bytes":6757}
34. PASS — Agent combined PDF downloads as real PDF
   - Evidence: {"status":200,"contentType":"application/pdf","pdfHeader":"%PDF","bytes":6754}
35. PASS — Admin combined PDF downloads as real PDF
   - Evidence: {"status":200,"contentType":"application/pdf","pdfHeader":"%PDF","bytes":10077}
36. PASS — Admin agents list loads and contains Raghavendra admin seat
   - Evidence: {"status":200,"agentCount":17,"raghavendraFound":true,"salesEmailFound":true}
37. PASS — Public monitor snapshot opens
   - Evidence: {"status":200,"loginRows":10,"clientErrorRows":10}
38. PASS — Agent checks out after QA journey
   - Evidence: {"status":200,"attendanceStatus":"checked_out"}
39. PASS — Post-checkout current attendance is closed
   - Evidence: {"status":200,"hasCurrent":false}

## Corrected mislabeled rows

These were not confirmed product bugs; each evidence row shows successful backend/API behavior.

- Agent checks in with selected work mode: {"status":201,"attendanceId":"attendance_996","attendanceStatus":"checked_in","workTypes":["Sales visit","Service visit"]}
- Sales Step 1 saves quick visit with GPS and follow-up: {"opportunityId":"sales_997","visitId":"sales_visit_998","visitStatus":201,"account":"BLOOM E2E 2026-07-02 15-31-47 Sales Customer"}
- Repeated Sales same-content save does not create duplicate latest rows: {"status":201,"returnedVisitId":"sales_visit_998"}
- Service Step 1 saves quick service visit with GPS: {"recordId":"service_999","visitId":"service_visit_1000","customer":"BLOOM E2E 2026-07-02 15-31-47 Service Customer"}
- Agent submits leave request: {"status":201,"leaveId":"leave_1001","requestStatus":"pending"}

Raw evidence JSON: /root/workspace/CrystalBio/dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-02T15-31-47-492Z.json


## Periwinkle classification update — 2026-07-03

The five rows originally marked `FAIL` above have now been corrected in place and are **not confirmed product failures** based on their own evidence. Each row shows a successful backend/API result, so Periwinkle classifies them as QA labeling mistakes / needs-review rows that should be read as pass evidence unless a separate UI failure is reproduced.

| Original row | Evidence shown | Periwinkle classification |
|---|---|---|
| Agent checks in with selected work mode | `201`, attendance created, work types saved | PASS evidence; not a confirmed bug |
| Sales Step 1 saves quick visit with GPS and follow-up | opportunity/visit IDs created, visit status `201` | PASS evidence; not a confirmed bug |
| Repeated Sales same-content save does not create duplicate latest rows | `201`, returned existing `sales_visit_998` | PASS evidence for duplicate-prevention path; not a confirmed bug |
| Service Step 1 saves quick service visit with GPS | service record/visit IDs created | PASS evidence; not a confirmed bug |
| Agent submits leave request | `201`, leave request pending | PASS evidence; not a confirmed bug |

Owner-facing status should use the corrected journey table in `docs/qa-runs/USER_JOURNEY_TEST_TABLE_2026-07-02.md`, not the raw fail labels above.
