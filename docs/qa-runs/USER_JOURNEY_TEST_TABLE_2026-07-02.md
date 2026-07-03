# CrystalBio Real User-Journey Test Table — 2026-07-02

Source evidence: Bloom live E2E run, visible browser UI screenshots, Periwinkle review.  
Live app: https://work.convogenie.ai  
Live API: https://work-api.convogenie.ai  
Credentials used: Bloom QA only. No real employee/admin credentials used.

## Correct testing standard

This is not a screen checklist. Each row below follows a real business flow: user intent → action → save/submit → refresh/reopen or admin visibility → result → next action.

| # | User journey | Scenario tested | Expected result | Actual result from evidence | Status | Evidence | Next action |
|---:|---|---|---|---|---|---|---|
| 1 | Agent starts the day | Bloom Agent logs in, checks in with Sales/Service work mode, refreshes, then checks out | Agent should stay checked-in after refresh; repeat check-in should be blocked clearly; admin should see current attendance | Check-in saved with work modes, repeated check-in was blocked, refresh still showed checked-in, admin report saw Bloom checked-in, checkout closed the session | PASS | `attendance_965`; QA report steps 13-16, 37-38; screenshots `16-agent-home.png`, `18-agent-attendance-screen.png`, `20-agent-checkin-refresh.png` | Cleanup Bloom attendance only after backup/dry-run |
| 2 | Agent cannot accidentally double check-in | Agent taps check-in again while already checked in | App should not create duplicate attendance; message/state should make it clear | API returned “Agent is already checked in”; no duplicate current attendance was accepted | PASS | QA report step 14 | Keep monitoring real-user repeated taps as UX signal |
| 3 | Agent records a Sales visit | Agent creates Sales customer, saves Step 1, fills Step 2 customer/requirement, fills Step 3 quote/office details | Sales work should save across all steps, reopen with saved details, and appear to admin | Sales opportunity and visit saved; Step 2 and Step 3 saved; saved Sales detail reopened with full submitted rows; admin All entries saw the Bloom Sales row | PASS | `sales_966`, `sales_visit_967`; QA report steps 17-20, 24-27; screenshots `21-sales-visits-screen.png`, `22-sales-step1-filled.png`, `23...sales-step-2-filled.png`, `24...sales-step-3-filled.png` | Cleanup Bloom Sales records only after backup/dry-run |
| 4 | Agent records a Service visit | Agent creates Service customer/equipment, saves Step 1, fills Step 2 equipment/customer, fills Step 3 parts/status/office details | Service work should save across all steps, reopen with saved details, and appear to admin | Service record and visit saved; Step 2 and Step 3 saved; saved Service detail reopened with full submitted rows; admin All entries saw the Bloom Service row | PASS | `service_968`, `service_visit_969`; QA report steps 21-27; screenshots `26-service-visits-screen.png`, `27-service-step1-filled.png`, `28...service-step-2-filled.png`, `29...service-step-3-filled.png` | Cleanup Bloom Service records only after backup/dry-run |
| 5 | Agent finds previous work | After saving Sales/Service, agent opens Visits/My Entries and searches/reopens previous entries | Saved entries should not disappear after save, refresh, or login; user should be able to continue/review | Agent own entries returned the saved Sales and Service rows; detail rows showed Step 2 and Step 3 saved | PASS | QA report steps 24-26; screenshots `25-sales-previous-entry-list.png`, `30-service-previous-entry-list.png` | None beyond QA cleanup |
| 6 | Admin reviews submitted field work | Admin logs in, opens Field Entry, switches My/All, searches Bloom QA entry, opens detail, uses Back | Admin should find submitted Sales/Service under Field Entry, not Agents/Reports; detail should open and Back should return to list | Field Entry, All entries/search, and detail path were visible; Bloom QA Sales row opened into submitted form detail; browser Back returned to Field Entry list | PASS | Browser subagent observation; screenshots `07-admin-field-entry.png`, `12-admin-field-entry-search-filter.png` | None |
| 7 | Admin sees team/agent status | Admin opens Agents screen after Bloom activity | Agents should show team/person status, attendance/work mode/visit counts, not duplicate submitted forms | Agents screen loaded with team counts, filters, attendance/work mode and visit-count details visible | PASS | Screenshot `08-admin-agents.png`; QA report step 35 confirms agents API contains expected admin seat | None |
| 8 | Leave request and approval loop | Agent submits leave request; Admin sees it in Approvals; Admin rejects Bloom leave for cleanup safety | Pending leave should appear to admin; decision should update the request | Leave request was created as pending, admin approvals saw it, admin rejected it | PASS | `leave_970`; QA report steps 28-30; screenshot `09-admin-approvals.png` | Cleanup Bloom leave record only if needed through approved path |
| 9 | Agent downloads own reports | Agent opens Reports and downloads Attendance, Visit, Combined PDFs | Downloads should be real PDFs scoped to logged-in agent | Attendance, Visit, Combined each returned `200 application/pdf` with `%PDF` content | PASS | QA report steps 31-33; screenshot `31-agent-reports.png`; 2:30 retest report confirms no console errors | Ready for Periwinkle/Rahul acceptance |
| 10 | Admin downloads business report | Admin opens Reports and downloads combined PDF | Admin report should download real saved backend data | Admin combined PDF returned `200 application/pdf` with `%PDF` content | PASS | QA report step 34; screenshot `10-admin-reports.png`; file `admin-report-2026-07-01-to-2026-07-02.pdf` | None |
| 11 | Login/session access safety | Empty login, wrong password, correct admin/agent login, saved session restore, bad session, agent opening admin API | Invalid access should be blocked; valid Bloom users should enter correct role; saved session should restore in test context | Empty/wrong login rejected; Bloom Admin and Agent login worked; saved agent bearer session restored; bad session rejected; agent admin API blocked | PASS for automated context | QA report steps 5-11; screenshots `01-visible-login-page.png`, `02-empty-login.png`, `03-wrong-login.png` | Real iPhone/Android overnight saved-login acceptance still open |
| 12 | Same-phone daily login reliability | Real field/admin user opens same phone next day after normal night/backend/deploy cycle | Should stay logged in unless explicit logout/inactive/reset | Automated bearer/session-cookie restore passed, but real same-phone overnight acceptance is not closed | WAITING | BUG-20260624-018; 2:30 retest report | Needs real phone overnight acceptance before final closure |
| 13 | iPhone Field Entry search keyboard behavior | Admin taps Field Entry search on iPhone/mobile viewport | Page should not zoom/crop when keyboard opens | Bloom 2026-07-03 live retest confirmed the focused Field Entry search input computed at `16px` on the mobile viewport | PASS / waiting acceptance | BUG-20260701-022; `QA_RUN_BLOOM_2026-07-03_230_RETEST.md` | Periwinkle/Rahul acceptance |

## Business conclusion

| Question | Answer |
|---|---|
| Did Bloom/Periwinkle test real user journeys, not just screens? | Evidence exists for the main end-to-end flows, but the earlier owner report was wrongly presented as a screen checklist. This table is the corrected user-journey view. |
| Is there a confirmed Critical/High live-user outage from this run? | No confirmed Critical/High outage in the evidence reviewed. |
| Is the app broadly usable today? | Yes, with cleanup and two waiting acceptance items separated. |
| What is not closed? | Real same-phone overnight login persistence and GPS/location capture across real phone browsers. Field Entry search live retest and Bloom-only cleanup have since passed in the 2026-07-03 retest/cleanup evidence. |
| Should Iris fix anything right now? | No. No new fix is approved from this table. |
| Should we deploy in daytime? | No routine daytime deploy. |

## Bloom-only cleanup list

These are QA records, not real field work. They must be removed only through Bloom-only backup/dry-run/write verification.

| Type | ID |
|---|---|
| Attendance | `attendance_965` |
| Sales opportunity | `sales_966` |
| Sales visit | `sales_visit_967` |
| Service record | `service_968` |
| Service visit | `service_visit_969` |
| Leave request | `leave_970` |
