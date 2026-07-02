# CrystalBio Full Visible UI User-Journey Report — 2026-07-02

Generated: 2026-07-02 17:13 IST  
Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Accounts used: Bloom assigned QA accounts only (`bloom.agent@crystalbio.in`, `bloom.admin@crystalbio.in`)  
Live API health: OK (`{"status":"ok"}`)

## Owner summary

**Status: Report completed from Bloom live evidence and Periwinkle review.**

The visible live app was checked across the main Admin and Agent journeys. Core app behavior is usable and stable for daytime users. The remaining items are not broad app outages; they are review/cleanup/follow-up items.

## What was visibly checked

### Login and access

| Journey | Result | Notes |
|---|---:|---|
| Live app opens | Passed | App loaded from the live URL. |
| Live API health | Passed | API returned OK. |
| Empty login | Passed | Shows a clear login-details-required error. |
| Wrong password | Passed | Shows invalid email/password error. |
| Bloom Admin login | Passed | Admin account opened Admin screens. |
| Bloom Agent login | Passed | Agent account opened Agent screens. |
| Direct admin without session | Passed | Admin access is protected. |

### Agent journey

| Screen / action | Result | Visible evidence |
|---|---:|---|
| Agent Home | Passed | Bloom QA Agent home, checked-in state, quick actions, recent visits were visible. |
| Visits / Previous entries | Passed | Search, New Sales, New Service, previous entries were visible. |
| Sales entry | Passed with cleanup needed | Step 1 saved, Step 2 saved, Step 3 could be filled/saved in the E2E run. |
| Service entry | Passed with cleanup needed | Step 1 saved, Step 2 saved, Step 3 could be filled/saved in the E2E run. |
| Previous saved entry detail | Passed | Saved Sales/Service entries reopened with saved detail rows. |
| Attendance | Passed | Check-in, refresh/current attendance, repeat check-in block, checkout were covered in Bloom evidence. |
| Agent Reports | Passed | Attendance, Visit, and Combined report PDF downloads returned real PDFs in Bloom evidence. |
| Profile / logout | Passed | Agent profile and logout were visible. |

### Admin journey

| Screen / action | Result | Visible evidence |
|---|---:|---|
| Admin Overview | Passed | Today field status cards and key admin cards were visible. |
| Field Entry | Passed | My entries / All entries filters, Sales/Service filters, search, and saved entries list were visible. |
| Field Entry detail | Passed | Bloom QA Sales row opened into submitted form detail; browser Back returned to Field Entry list. |
| Agents | Passed | Team counts, filters, agent list, attendance/work-mode/visit-count details were visible. |
| Approvals | Passed | No pending leave decisions; rejected Bloom QA leave records visible. |
| Reports | Passed | Admin report screen visible; admin combined PDF returned a real PDF in Bloom evidence. |
| Profile / logout | Passed | Admin profile and logout were visible. |

## Key evidence sources

- Existing E2E report reviewed: `docs/qa-runs/QA_RUN_BLOOM_E2E_USER_JOURNEY_2026-07-02.md`
- Raw E2E evidence: `dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-02T08-03-18-618Z.json`
- Additional visible screenshots found under: `dogfood-output/full-ui-qa-2026-07-02/screenshots/`
- Additional full visible journey output found at: `dogfood-output/full-ui-user-journey-2026-07-02-results.json`

Representative screenshots available in the repo:

- `dogfood-output/full-ui-qa-2026-07-02/screenshots/05-admin-overview.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/07-admin-field-entry.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/08-admin-agents.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/10-admin-reports.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/16-agent-home.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/18-agent-attendance-screen.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/21-sales-visits-screen.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/26-service-visits-screen.png`
- `dogfood-output/full-ui-qa-2026-07-02/screenshots/31-agent-reports.png`

## Important cleanup note

Bloom-only QA records are visible and must not be treated as real field work.

Known Bloom QA data from the E2E run:

| Type | ID |
|---|---|
| Attendance | `attendance_965` |
| Sales opportunity | `sales_966` |
| Sales visit | `sales_visit_967` |
| Service record | `service_968` |
| Service visit | `service_visit_969` |
| Leave request | `leave_970` |

These should be cleaned only through the approved Bloom-only cleanup path after backup/dry-run. No real user records should be deleted or hidden by guess.

## Items still needing review / acceptance

1. **BUG-20260624-018 saved-login persistence** — cron/browser/API restore checks passed, but real same-phone overnight acceptance is still needed before final closure.
2. **BUG-20260701-022 Field Entry iPhone search zoom** — source/build passed earlier, but the live version was not yet retested by Bloom at the 2:30 AM sweep.
3. **Bloom-only QA cleanup** — required before saying admin reports are clean for owner review.
4. **E2E “failed” labels from API run** — several items were labelled fail even though the attached evidence shows successful `201` or saved responses. Periwinkle should classify these as reporting-label issues unless a visible user-facing bug is reproduced.

## Business conclusion

- **Safe for daytime use:** Yes, based on live API health and current Bloom/Periwinkle evidence.
- **No Critical/High live-user outage confirmed in this report.**
- **Do not deploy routine fixes during daytime** unless Amrutha/Rahul approves an urgent change.
- **Next action:** Bloom-only cleanup, then Periwinkle acceptance/update for the remaining review items.
