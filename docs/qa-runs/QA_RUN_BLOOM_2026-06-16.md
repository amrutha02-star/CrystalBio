# Bloom QA Run — 2026-06-16

## Plain-English summary

Bloom completed a live launch-week heavy QA pass with only Bloom assigned accounts. The live API is healthy, Bloom admin/agent login works, Enter/Go login now submits correctly, Sales/Service Step 2 status now saves correctly, bottom-nav spacing is improved, admin reports/PDF work, and saved records are visible in admin/API. One High launch issue remains for Periwinkle review: tapping an existing previous Sales entry can reopen a blank pending form instead of the saved record.

## What was tested

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`, 390x844 mobile emulation.

- API health.
- Bloom admin login, session refresh, admin overview, Field Entry, Agents details, Reports/PDF, Approvals empty state, Profile/logout.
- Bloom agent login, session refresh, Home, Visits / previous entries, saved visibility after refresh/re-login.
- Sales Step 1/2/3 and Service Step 1/2/3 persistence through live API using clearly named `BLOOM-QA-NIGHT` records.
- Admin and agent visibility for saved Sales/Service entries.
- Wrong password, empty login, direct admin URL without session.
- Mobile layout, console errors, and known photo/upload/bottom-nav polish.
- `sales@crystalbio.in` was not logged into; Bloom only verified the admin Profile list labels it as Raghavendra K/admin. Full identity verification remains blocked for Bloom without real-user credentials.

## What passed

- API health returned healthy.
- Bloom admin login succeeded as `Bloom QA Admin` with admin role.
- Bloom agent login succeeded as `Bloom QA Agent` with both-role access.
- Empty login and wrong password are rejected safely.
- Direct `?screen=admin` without a session stays on Login and does not expose admin content.
- Admin overview showed the two Bloom QA visits after refresh.
- Admin Field Entry showed the two Bloom QA visits under `All entries`.
- Agents screen showed the two Bloom QA visits, and read-only details showed Step 2 and Step 3 as `Saved`.
- Reports showed today’s visit summary and PDF endpoint returned `application/pdf`.
- Agent Home/Visits showed the saved Bloom QA Sales/Service entries after login.
- Browser console showed no JavaScript errors during the checked journeys.

## Confirmed bugs / failed checks

### BUG-20260616-006 — Previous Sales entry opens as blank pending form instead of saved record

- Severity: High
- Journey tested: Agent Visits / saved entry continuation.
- Scenario tested: Bloom agent tapped the saved `BLOOM-QA-NIGHT Sales 20260616-1781624021373` entry from Previous entries.
- Expected result: saved Sales record reopens with customer/details and Step 2/Step 3 shown as saved, so the agent can continue updates.
- Actual result: the Sales form opened as a blank new form with `Step 1: Pending • Step 2: Pending • Step 3: Pending` and empty fields.
- Evidence: live mobile browser screenshot captured during this run; admin/API evidence shows the same record exists and has Step 2/Step 3 saved (`sales_189`, `sales_visit_194`).
- Status: Needs Periwinkle review in `docs/BUG_INTAKE_BOARD.md`.
- Impact: agents may lose trust in “Tap to continue” and may create duplicate visits instead of continuing saved work.

## Existing bugs retested

- BUG-20260615-001 — Login Enter/Go: verified fixed on live mobile browser at `2026-06-16T15:36Z`; Enter from password field sent the login request and showed the normal wrong-password message. Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-heavy-qa-results.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-enter-wrong-password.png`.
- BUG-20260616-003 — Sales/Service Step 2 status: verified fixed on live mobile browser/API. Sales and Service Step 2 showed `Saved` in progress/latest entry, and admin/API showed Step 2/Step 3 saved for earlier full records. Evidence: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-sales-step2-saved-ui.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-service-step2-saved-ui.png`.
- BUG-20260616-004 — bottom navigation spacing: verified fixed in mobile retest; Step 2 bottom fields/actions could be reached without bottom nav covering them. Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-bottom-nav-retest.json`.
- BUG-20260616-005 — Camera/Upload controls: still visible; native `Choose File` labels appear squeezed inside the custom controls.

## Bloom QA records created and not cleaned

Cleanup was **not completed** because this QA session does not have a safe live cleanup path: no live cleanup API is exposed, and the live DB path/backup command is not safely available through the permitted tools. Bloom did not clear sessions or touch real users.

- Records needing Periwinkle-approved cleanup include:

- Attendance: `attendance_193` — Bloom QA Agent, checked in/out.
- Sales opportunity: `sales_189` — `BLOOM-QA-NIGHT Sales 20260616-1781624021373`.
- Sales visit: `sales_visit_194`.
- Service record: `service_190` — `BLOOM-QA-NIGHT Service 20260616-1781624021373`.
- Service visit: `service_visit_195`.
- Sales visits from this retest: `sales_visit_200`, `sales_visit_206`.
- Service record/visit from this retest: `service_211`, `service_visit_212`.

Because cleanup did not run, admin overview/reports may still show Bloom QA entries. This is expected and should be cleaned only with the documented Bloom-only backup/dry-run/write path.

## Blocked / not tested

- Raghavendra/admin login for `sales@crystalbio.in` remains blocked for Bloom by the strict credential rule. Bloom did not use or request real credentials.
- Safe live cleanup after backup is blocked until Periwinkle has live DB command access or a narrow Bloom-only cleanup endpoint.

## Clear next action for Periwinkle

1. Review BUG-20260616-006 and approve Iris only if agreed.
2. Run documented Bloom-only cleanup with backup/dry-run/write, then verify admin overview is clean.
3. Retest agent previous-entry continuation if Periwinkle approves a fix.

## 2:30 AM IST Iris-fix retest addendum — 2026-06-16 21:06 UTC

- Retested only BUG-20260616-006 plus nearby normal/edge checks on the live app.
- Result: **Still failing / not Verified by Bloom**.
- Sales saved-entry continuation: tapping `BLOOM-QA-NIGHT Sales 20260616-1781624021373` still opened a blank pending Sales form instead of saved details/status.
- Nearby Service regression check: tapping `BLOOM-QA-NIGHT Service 20260616-1781624021373` also opened a blank pending Service form.
- Edge check: refresh after opening the saved Sales record returned to Home instead of preserving the saved record continuation state.
- Console/API: no browser console errors captured; API health OK; Bloom logins OK; admin `field-visits?scope=team` confirmed the saved records and Step 2/Step 3 saved details still exist in backend/admin data.
- Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-night-retest-live.json`, `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-api-admin-field-visits-live.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-sales-reopen-after-login.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-service-reopen-regression.png`.
- Data impact: no new QA records created.
- Next action: BUG-20260616-006 should stay open and go back to Periwinkle/Iris for deployment/fix review.
