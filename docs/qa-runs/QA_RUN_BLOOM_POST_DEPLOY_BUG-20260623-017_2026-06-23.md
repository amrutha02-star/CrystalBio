# Bloom QA post-deploy run — BUG-20260623-017 — 2026-06-23

## Owner summary

Bloom tested the live post-deploy journey with only the assigned Bloom QA admin and Bloom QA agent accounts. Live version `20260623170035` is deployed, API health is OK, the dashboard-detail Back fix passed, and Sales/Service form fields use 16px mobile input sizing with no observed focus zoom in Chromium.

No new Critical or High launch-blocking bug was confirmed in this run. One existing monitoring item remains: a location-permission app-error log from earlier on 2026-06-23 still lacks user/path evidence, so it remains Needs more testing rather than an approved Iris fix.

## Live target checks

- App: `https://work.convogenie.ai`
- API health: `https://work-api.convogenie.ai/health` returned OK.
- Live version: `20260623170035`.
- Monitor command: `CRYSTALBIO_API_URL=https://work-api.convogenie.ai npm run monitor:api` passed.

## What Bloom tested

### Login and session

- Passed: Bloom admin login.
- Passed: Bloom agent login.
- Passed: wrong password returned normal invalid-login response.
- Passed: empty login returned validation.
- Passed: API session refresh stayed valid after login.
- Passed: direct `/admin` URL without an active session showed Login, not admin data.
- Passed: Profile logout returned to Login.

### Agent daily work

- Passed: Agent Home loaded with Bloom QA Agent and bottom navigation.
- Passed: attendance check-in created a Bloom QA attendance row.
- Passed: repeated check-in while already checked in was blocked with the expected already-checked-in message.
- Passed: `/attendance/current` still showed the checked-in row after refresh-style API check.
- Passed: checkout worked.
- Passed: checkout then re-check-in worked and was finally checked out for cleanup safety.
- Passed: Bloom leave request created and appeared for admin approval review before cleanup.
- Passed: Visits / Recent visits reopened Bloom-created Sales saved entry with saved customer/details and visible Step 1/2/3 form structure.

### Sales and Service flows

- Passed: Sales Step 1 save, Step 2 save, Step 3 save, follow-up update, repeated-tap duplicate protection, persistence in own/team field-visits, and admin detail API.
- Passed: Service Step 1 save, Step 2 save, Step 3 save, follow-up/update, repeated-tap duplicate protection, persistence in own/team field-visits, and admin detail API.
- Note: These records were deliberately named `BLOOM QA POSTDEPLOY 20260623 20260623174734 ...` and were removed after evidence was captured.

### Admin journeys

- Passed: Admin Overview loaded with live totals.
- Passed: Total visits expanded rows opened submitted-entry detail.
- Passed: entry opened from Admin dashboard showed `Back to dashboard`; tapping it returned to Overview.
- Passed: Field Entry All entries showed Bloom Sales/Service rows, search/filter controls, and current count.
- Passed: entry opened from Field Entry showed `Back to field entries`; tapping it returned to Field Entry.
- Passed: Agents screen loaded and showed Bloom QA Agent status/counts.
- Passed: Approvals showed the Bloom leave request before cleanup.
- Passed: Reports API returned today’s report and PDF returned `%PDF` / `application/pdf`.
- Passed: Profile/access loaded and logout worked.

### Mobile / visual QA

- Passed: phone-size Field Entry retained the full-screen sage/olive mobile baseline with bottom nav and no black primary button/heavy dashboard look.
- Passed: Sales form input/textarea/select computed font sizes were 16px; no enabled Sales form input was below 16px.
- Passed: focusing `Sales contact person` kept `visualViewport.scale` at `1` before and after focus in Chromium.
- Observation: Field Entry search input computed at 13px, but the requested fix area was Sales/Service form filling; no zoom was observed in the tested Sales form fields.

### Error checks

- Passed: browser console showed 0 console messages and 0 JavaScript errors during the tested UI path.
- Passed: public monitor endpoint was accessible.
- Monitor note: recent app-error logs included expected Bloom test invalid-login/session events and one earlier high location-permission message from 2026-06-23 without user/path evidence. This matches the existing Needs-more-testing location-permission monitoring item; Bloom did not confirm a new user-facing bug.

## Cleanup result

Cleanup completed safely using the documented Bloom-only path.

- Dry-run found only Bloom-created targets: 2 attendance rows, 1 Sales record / 2 Sales visits, 1 Service record / 2 Service visits, and 1 leave request.
- Backend was stopped before write, Bloom-only cleanup was run with `--write`, then backend was restarted.
- Backup created: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-06-23T17-51-15-017Z.bak`.
- API health after restart: OK.
- Post-clean verification: Bloom agent `/field-visits` showed 0 matching Bloom QA post-deploy rows; admin team `/field-visits?scope=team` showed 0; Bloom current attendance was null; Bloom leave requests matching the label were 0.

## Evidence

- API/user-journey evidence: `dogfood-output/bloom-postdeploy-20260623-api-e2e-20260623174734.json`
- Mobile Sales form screenshot: `dogfood-output/screenshots/bloom-postdeploy-sales-form-mobile-20260623.png`
- Live cleanup dry-run/write/health/post-clean verification: captured in this QA run’s terminal execution.

## Pass / Fail / Blocked

- Pass: live version/API health.
- Pass: BUG-20260623-017 dashboard Back path.
- Pass: BUG-20260623-017 Sales/Service form 16px input sizing / no Chromium focus zoom observed.
- Pass: login/session, direct admin-without-session, profile logout.
- Pass: attendance normal/repeat/refresh/current/checkout/re-check-in path.
- Pass: Sales/Service save/update/persistence/admin detail/report visibility.
- Pass: admin Overview, Field Entry, Agents, Approvals, Reports/PDF, Profile.
- Pass: Bloom-only cleanup and live post-clean verification.
- Blocked/not fully tested: real-device iPhone Safari keyboard behavior and real camera capture/upload; Chromium/mobile checks only.

## Next action for Periwinkle

Periwinkle can review this Bloom evidence and decide whether BUG-20260623-017 can move from deployed to Bloom-verified/accepted. No new Iris fix is approved by Bloom from this run.
