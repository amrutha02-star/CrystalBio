# CrystalBio Bug Intake Board

Purpose: one simple place where Bloom, Periwinkle, and Iris can track bugs during launch week.

This file is written in plain language so Rahul can read it without technical knowledge.

## Status meanings

- New from Bloom: Bloom found it, but Periwinkle has not reviewed it yet.
- Needs Periwinkle review: Bloom thinks it may matter and Periwinkle should decide.
- Approved for Iris: Periwinkle or Rahul approved Iris to fix it.
- Iris fixing: Iris is actively fixing it.
- Ready for Bloom retest: Iris says the fix is ready and Bloom must retest it.
- Verified by Bloom: Bloom retested and the fix works.
- Accepted by Periwinkle/Rahul: final approval is done.
- Not fixing now: known issue, but not part of the current launch-week fix list.

## Important rule

Bloom can add bugs here any time.

Iris must only fix bugs marked Approved for Iris by Periwinkle or Rahul, except for an emergency where Rahul explicitly says to fix immediately.

## Live user issue rule

If Bloom notices a live-user problem during the day, Bloom should record it here and notify Periwinkle/Rahul in simple language.

The app now has app-side logging for Bloom. It records serious user-facing app/API failures without saving passwords or form contents. Bloom’s watcher checks the server-side log and adds serious recent issues here.

Bloom also keeps `/root/workspace/.hermes/profiles/bloom/BLOOM_LIVE_USER_TRACKER.md` updated from server-side logs. That tracker shows:

- which accounts have logged in,
- failed login attempts by email,
- recent user-facing errors connected to the logged-in account when available.

For live-user problems, Bloom should include:

- Time noticed:
- User journey affected:
- What the user likely experienced:
- Severity:
- Evidence:
- Status: Needs Periwinkle review
- Recommended next step:

## Current bug queue

### BUG-20260717-029 — Admin Overview Total visits expanded card shows a smaller number

- Reported by: Amrutha
- Time noticed: 2026-07-17
- Screen/API: Admin Overview → Total visits card
- User journey affected: Admin checks today’s total field visits from the dashboard and expands the card for quick review.
- Actual behavior: The top Total visits count can show the true total for today, but the expanded `TOTAL VISITS` panel showed only the number of rows displayed in the compact preview. Example from Amrutha’s screenshot: card/header showed 6 field updates, expanded panel showed 4 because only the first four rows were listed.
- Expected behavior: The expanded card header must repeat the same total count as the Total visits card. If the dashboard preview shows only a few recent rows, it should clearly hand off to Field Entry for the full list.
- Severity: Medium for admin trust/clarity; this is a dashboard display mismatch, not evidence of data loss.
- Status: **Deployed live and Periwinkle live-checked on 2026-07-17 as frontend version `20260717153237`; waiting for Bloom/owner retest before acceptance.**
- Fix update: Admin Overview now uses the real metric count in the expanded header instead of the preview row count, and shows `Open all in Field Entry` when today has more visits than the compact dashboard preview.
- Verification: Pre-deploy `npm test -- --run` passed 116/116 and `npm run build` passed. Live `https://work.convogenie.ai` loaded, API health returned OK, live `version.json` returned `20260717153237`, live bundle contained the new version marker and `Open all in Field Entry`, and browser Admin Overview showed `11 Total visits` with expanded `TOTAL VISITS` also `11`; the handoff button opened Admin Field Entry. Frontend-only deploy; backend data/cleanup were not touched.
- Scope preserved: Field Entry remains the full submitted-form lookup owner; Admin Overview stays a compact snapshot and does not become a full submitted-work list.

### BUG-20260708-028 — Admin Field Entry does not show every recorded field entry

- Reported by: Amrutha / Periwinkle live check
- Time noticed: 2026-07-08 16:11 IST
- Screen/API: Admin Field Entry / `/field-visits?scope=team` compared with Admin Reports
- User journey affected: Admin wants to confirm every agent Sales/Service entry is recorded and visible in admin accounts.
- Actual behavior: Live Admin Reports API shows entries are being recorded in the backend: 2026 total is 90 Sales visits, 35 Service visits, and 110 attendance records; today shows 3 Sales visits and 3 attendance records. But Admin Field Entry `All entries` returns only 30 Sales/Service cards, starting from 30 Jun onward, while the full 2026 report has 125 Sales/Service visit records. The UI initially shows `10 of 30 shown`; clicking `Show all 30 entries` did not expand during Periwinkle's browser check.
- Expected behavior: Admin should have a clear way to see/search/export every saved Sales/Service entry for the selected period/account, not only the latest 30 cards. If the visible list is intentionally recent-only, the UI must say so and provide the full admin path.
- Severity: High for admin review confidence; current evidence points to a visibility/listing limitation, not confirmed data loss.
- Status: **Recording/admin API live-checked again on 2026-07-09 13:03 IST; waiting for Bloom retest/owner acceptance because the browser `Show all` control needs recheck.**
- Evidence before fix: Live health OK; Bloom QA Admin login OK; `/admin/reports?fromDate=2026-01-01&toDate=2026-12-31` returned 90 Sales / 35 Service visit details; `/field-visits?scope=team` returned 30 cards; browser screenshot showed Admin Field Entry `10 of 30 shown` with `Show all 30 entries` still visible after clicks. Agent-by-agent audit saved at `docs/live-data-audits/admin-agent-entry-visibility-audit-2026-07-08.md`.
- Fix update: `/field-visits?scope=team` now lets admin Field Entry fetch the full lightweight Sales/Service visit list instead of only the latest 30 cards. Photo/proof payloads stay excluded from the list response and are loaded only for a selected detail entry. Regular agent `/field-visits` remains scoped to that agent's own entries.
- Verification: `npm test -- --run src/backend/crystalBioApi.test.ts` passed 20/20; full `npm test -- --run` passed 116/116; `npm run build` passed; `npm run backend:build` passed. Live backend was restarted after backup `/var/lib/crystalbio/backups/crystalbio-db-20260708-bug028-pre-backend-restart.json`; live API health returned OK. Bloom QA Admin live API check returned Admin Reports 90 Sales + 35 Service for 2026 and `/field-visits?scope=team` returned 125 lightweight entries (90 Sales + 35 Service), with no photo/base64 payload in the list; `limit=30` still returns 30 when requested; detail fetch by `entryId` returned one selected detail. Live browser Field Entry showed `10 of 125 shown`, Show all expanded to `125 of 125 shown`, search for `Dr. Swati` showed 10 older entries, and console showed 0 errors.
- 2026-07-09 recheck for Amrutha: Live Reports now show 91 Sales + 35 Service = 126 forms after Sanjeev's 09/07/2026 Sales entry. Admin Field Entry `All entries` API also returns 91 Sales + 35 Service = 126, with 0 agent-by-agent mismatches. Browser All entries showed `10 of 126 shown`; search for `Dr. Swati` found all 10 older entries; console had 0 errors. In this Hermes browser run, tapping `Show all 126 entries` did not expand, so the remaining concern is admin list expansion UX, not recording/data loss. Evidence: `docs/live-data-audits/admin-agent-entry-visibility-recheck-2026-07-09.md`.
- Approved scope preserved: Field Entry remains the submitted-form lookup/review owner; no submitted rows were moved into Agents or Reports; no app redesign; no QA records were created.

### BUG-20260703-027 — Duplicate-save logic ignores visit time and may collapse real separate visits

- Reported by: Bloom
- Time noticed: 2026-07-03 10:24 IST
- Screen/API: Sales/Service visit save backend duplicate handling
- User journey affected: Field agent records two real visits to the same customer on the same day with similar notes/status but different times.
- Actual behavior: Local backend challenge showed a second Sales visit at a different time but same date/note/status returned the first visit ID instead of creating a second visit.
- Expected behavior: True accidental double-taps should be deduplicated, but a materially separate visit at a different time should be saved as a separate update.
- Severity: Medium
- Status: **Accepted by Periwinkle after Bloom live retest passed.**
- Evidence: `docs/qa-runs/BACKEND_LOGIC_STRATEGY_AUDIT_BLOOM_2026-07-03.md`; targeted local API output showed `firstValidVisit.id = sales_visit_11`, `sameContentDifferentTime.id = sales_visit_11`.
- Fix update: exact duplicate resubmits still return the existing visit, but same-day visits at a different time now create a separate update. Added Sales and Service regression tests.
- Verification: `npm test` passed 115/115; `npm run backend:build` passed; `npm run build` passed.
- Bloom source retest: Passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_SOURCE_RETEST_BLOOM_2026-07-03.md`.
- Live acceptance update: Bloom live retest passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_LIVE_RETEST_BLOOM_2026-07-03.md`. Periwinkle accepts this backend fix.

### BUG-20260703-026 — Password reset/setup can reactivate an old session token

- Reported by: Bloom
- Time noticed: 2026-07-03 10:24 IST
- Screen/API: Login/session backend, password setup/reset flow
- User journey affected: User resets password or receives setup link and expects old sessions to stay invalid.
- Actual behavior: Local backend challenge showed an old token was rejected while the user was pending reset, but became valid again after password setup completed.
- Expected behavior: Password reset/setup should permanently invalidate previous sessions; the user should login again with the new password.
- Severity: High
- Status: **Accepted by Periwinkle after Bloom live retest passed.**
- Evidence: `docs/qa-runs/BACKEND_LOGIC_STRATEGY_AUDIT_BLOOM_2026-07-03.md`; targeted output showed `oldSessionAfterRequestLink.status = 401`, then `oldSessionAfterNewPassword.status = 200`.
- Fix update: password reset/request and setup now clear existing sessions for that user, so old tokens stay invalid after the new password is set.
- Verification: `npm test` passed 115/115; `npm run backend:build` passed; `npm run build` passed.
- Bloom source retest: Passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_SOURCE_RETEST_BLOOM_2026-07-03.md`.
- Live acceptance update: Bloom live retest passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_LIVE_RETEST_BLOOM_2026-07-03.md`. Periwinkle accepts this backend fix.

### BUG-20260703-025 — GPS validation accepts impossible latitude/longitude values

- Reported by: Bloom
- Time noticed: 2026-07-03 10:24 IST
- Screen/API: Attendance/Sales/Service GPS validation backend
- User journey affected: Field visit and attendance saves require real current GPS.
- Actual behavior: Local backend challenge saved a Sales visit with GPS `{ latitude: 999, longitude: 999 }` and returned HTTP 201.
- Expected behavior: Backend should reject latitude outside `-90..90` and longitude outside `-180..180`.
- Severity: High
- Status: **Accepted by Periwinkle after Bloom live retest passed.**
- Evidence: `docs/qa-runs/BACKEND_LOGIC_STRATEGY_AUDIT_BLOOM_2026-07-03.md`; targeted output showed `invalidGpsVisit.status = 201`.
- Fix update: backend now rejects latitude outside `-90..90` and longitude outside `-180..180` for attendance, Sales visits, and Service visits.
- Verification: `npm test` passed 115/115; `npm run backend:build` passed; `npm run build` passed.
- Bloom source retest: Passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_SOURCE_RETEST_BLOOM_2026-07-03.md`.
- Live acceptance update: Bloom live retest passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_LIVE_RETEST_BLOOM_2026-07-03.md`. Periwinkle accepts this backend coordinate-bounds fix. This does not close the wider mobile GPS capture bug.

### BUG-20260703-024 — Backend allows service users to create Sales records and sales users to create Service records

- Reported by: Bloom
- Time noticed: 2026-07-03 10:24 IST
- Screen/API: Backend role access for Sales/Service create routes
- User journey affected: Role correctness and admin data trust.
- Actual behavior: Local API challenge showed a service-only user could create a Sales opportunity and a sales-only user could create a Service record, both returning HTTP 201.
- Expected behavior: Backend should enforce role boundaries, not rely only on frontend hiding. Service-only users should not create Sales records; sales-only users should not create Service records; `both` users can use both if approved.
- Severity: High
- Status: **Accepted by Periwinkle after Bloom live retest passed.**
- Evidence: `docs/qa-runs/BACKEND_LOGIC_STRATEGY_AUDIT_BLOOM_2026-07-03.md`; targeted output showed `serviceCreatesSales.status = 201` and `salesCreatesService.status = 201`.
- Fix update: backend now requires Sales/both/admin role for Sales create/visit routes and Service/both/admin role for Service create/visit routes.
- Verification: `npm test` passed 115/115; `npm run backend:build` passed; `npm run build` passed.
- Bloom source retest: Passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_SOURCE_RETEST_BLOOM_2026-07-03.md`.
- Live acceptance update: Bloom live retest passed on 2026-07-03. Evidence: `docs/qa-runs/BACKEND_AUDIT_HARDENING_LIVE_RETEST_BLOOM_2026-07-03.md`. Periwinkle accepts this backend fix.

### BUG-20260702-023 — Sales/location permission prevents field update save

- Reported by: Amrutha
- Time noticed: 2026-07-02 evening IST
- Screen: Sales/Service field update with GPS/location capture
- User journey affected: Field agent tries to add/save location while submitting field work.
- Actual behavior: User report says sales agent Meera cannot add location. Live client-error logs around 2026-07-02 12:21-12:22 UTC show repeated `Allow location permission to save this field update.` on Android Chrome; the identified logged-in sales account in those logs is Dr. Swati Priya (`agent_6`). Amrutha also reproduced the issue and corrected Periwinkle: this must not be treated as a Chrome-only problem because the office uses different phones/browsers, including iPhone/Safari.
- Expected behavior: If location is required, the app should capture a valid browser/phone location across supported mobile browsers, avoid repeated permission prompts after a valid grant, preserve typed form data, and show only minimal generic recovery copy if location cannot be captured. Do not add browser-specific instructions in the field form without owner approval.
- Severity: High, because Amrutha confirmed she tested the journey and location is still not reliably captured for the field save journey.
- Status: **Open / not accepted.** A generic source/live mitigation was deployed in version `20260703033332` after the bad Chrome-specific copy was removed, but this is not verified or accepted as the real fix. Further changes need Periwinkle/Rahul decision because recent-GPS reuse has compliance implications.
- Periwinkle current check: Live API is OK and backend intentionally requires GPS for attendance and Sales/Service visits. Logs show failures across Android Chrome, Samsung Browser, iPhone Chrome/WebKit-style agents, and test automation. Treat this as cross-phone/browser GPS capture failure, not user error and not Chrome-only.
- Required next step: diagnose/test the capture/save flow across Android Chrome, Samsung Browser, iPhone Safari, iPhone Chrome, and home-screen/PWA where possible. Preserve typed form data; do not save without valid latitude/longitude; do not add browser-specific field-form copy without owner approval. Bloom retest is required before acceptance.
- Bloom nightly update — 2026-07-03 21:23 IST: In the live browser QA check, Attendance → `Use current location` showed `Location could not be captured. Your typed details are still here...`. This supports keeping the GPS capture issue open; it is not accepted as fixed. Evidence: `docs/qa-runs/QA_RUN_BLOOM_NIGHT_STABILIZATION_2026-07-03_2123IST.md`.
- Bloom 2:30 AM retest update — 2026-07-04: **Failed / keep open.** Live Sales Step 1 still showed `Location could not be captured. Your typed details are still here...` in the mobile browser path; typed customer/note/requirement text was preserved and no Chrome-specific copy appeared. Live API checks passed for valid GPS Sales/Service saves and rejected missing/impossible GPS, so backend validation is good, but the cross-phone browser/PWA capture problem is not accepted as fixed. Bloom-created GPS retest records were cleaned after dry-run/backup/write/restart and live verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-04_230_RETEST.md`.
- User video evidence — 2026-07-04: Amrutha shared a phone recording showing the live Attendance screen for Dr. Swati Priya. The screen says `Add current location`, then `Location could not be captured. Your typed details are still here...`, and the toast says `Location needed`; `Check in now` remains available but location is not captured. Treat this as further real-phone evidence for the same open cross-phone GPS capture bug, not a separate UI polish issue.
- Periwinkle diagnosis — 2026-07-04: Live API is healthy, HTTPS headers do not show a server-side geolocation block, and Dr. Swati Priya had earlier successful GPS attendance saves. Named real-user logs show repeated browser-side GPS failures for Dr. Swati Priya on Android Chrome and Madhu on Android Chrome; Ajay AS has one older location-permission event. Amrutha clarified that unknown-user location rows should be treated as likely Bloom/QA unless a real user name/account is attached. Current frontend swallows the browser geolocation error code and records only a generic message, so the exact phone state is not visible yet. Likely failure area is browser/phone permission or location-provider capture state, not backend save validation. Next safe fix should add permission-state/error-code diagnostics and a clearer recovery flow while keeping GPS required.
- Bloom nightly update — 2026-07-04 21:01 IST: Core live QA passed for login/session, attendance API, Sales/Service Step 1/2/3 API, saved entries, Admin screens, PDFs, Profile/logout, browser back, and Bloom-only cleanup. The GPS/location bug remains open because recent live client-error logs still show repeated `Location could not be captured...`, including named Dr. Swati Priya Android Chrome evidence and additional Android/iPhone-style browser errors. Evidence: `docs/qa-runs/QA_RUN_BLOOM_NIGHT_STABILIZATION_2026-07-04_2101IST.md`.
- Bloom 2:30 AM retest update — 2026-07-05: **Failed / keep open.** Live mobile Sales Step 1 still showed `Location could not be captured. Your typed details are still here...`; typed customer/note/requirement text was preserved and no Chrome-only copy appeared. Live API checks passed for valid GPS Sales/Service saves and rejected missing/impossible GPS, so backend validation remains good, but the cross-phone browser/PWA capture problem is not accepted as fixed. Bloom-created GPS retest records were cleaned after dry-run/backup/write/restart and live verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-05_230_RETEST.md`.
- Bloom 2:30 AM retest update — 2026-07-06: **Failed / keep open.** Live mobile Sales Step 1 still showed `Location could not be captured. Your typed details are still here...` after `Use current location`; typed customer/note/requirement text stayed in place and no Chrome-only copy appeared. Backend valid-GPS Sales save still worked and missing GPS was rejected with `GPS location is required`. Browser console recorded one blank JS exception entry during the GPS failure path. Bloom-created GPS/admin-refresh retest records were cleaned after Bloom-only dry-run/backup/write/restart and live API verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-06_230_RETEST.md`.
- Bloom nightly stabilization update — 2026-07-06 21:08 IST: **Failed / keep open.** Live mobile Attendance `Use current location` again showed `Location could not be captured. Your typed details are still here...`; browser console again recorded one blank JS exception. Backend GPS guards still passed: valid-GPS Sales/Service saves worked and missing GPS was rejected for both Sales and Service. Bloom-only QA records from this run were cleaned after dry-run/backup/write/restart and live API verification showed the Bloom marker removed. Evidence: `docs/qa-runs/QA_RUN_BLOOM_NIGHT_STABILIZATION_2026-07-06_2108IST.md`.
- Bloom 2:30 AM retest update — 2026-07-07: **Failed / keep open.** Live mobile Sales Step 1 still showed `Location could not be captured. Your typed details are still here...` after `Use current location`; typed customer/note/requirement text stayed in place and no Chrome-only copy appeared. Backend valid-GPS Sales save still worked and missing GPS was rejected with `GPS location is required`. Browser console recorded one blank JS exception during the GPS failure path. Bloom-created retest records were cleaned after Bloom-only dry-run/backup/write/restart and live API verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-07_230_RETEST.md`.
- Bloom nightly stabilization update — 2026-07-07 21:03 IST: **Failed / keep open.** Live browser Sales Step 1 again showed `Location could not be captured. Your typed details are still here...` after `Use current location`; typed customer/note/requirement/contact/phone stayed in place and saving stayed blocked without location. Browser console again recorded one blank JS exception during the GPS path. Backend/API journey checks passed for valid-GPS Sales/Service saves and report downloads, so this remains a frontend/phone-browser capture issue, not a backend validation issue. Bloom-created QA records were cleaned after Bloom-only dry-run/backup/write/restart and live API verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_NIGHT_STABILIZATION_2026-07-07_2103IST.md`.

### BUG-20260701-022 — Admin Field Entry search still zooms on iPhone keyboard

- Reported by: Amrutha
- Time noticed: 2026-07-01 afternoon
- Screen: Admin Field Entry → search customer or agent
- User journey affected: Admin searches submitted entries on iPhone and expects the screen to stay stable while typing.
- Actual behavior: The page still zooms/crops when the Field Entry search box is focused and the iPhone keyboard opens.
- Expected behavior: Search boxes must use the same anti-zoom rule as forms: focused inputs should stay at 16px or larger on iPhone so Safari does not auto-zoom the page.
- Severity: Medium for admin usability; not a data-loss issue.
- Status: **Verified by Bloom on live app; waiting for Periwinkle/Rahul acceptance.**
- Periwinkle source review: the earlier anti-zoom fix covered Sales/Service form inputs globally, but `.visit-search-card input` overrode it back to `13px`. Admin Field Entry uses that search-card style, so iPhone Safari could still zoom.
- Fix update: `.visit-search-card input` now uses `16px`, so the Field Entry search input should no longer trigger iPhone focus zoom.
- Verification: source tests/build passed before deploy. Bloom 2026-07-03 2:30 AM retest passed on live app version `20260702164134`: Field Entry search input placeholder was `Search customer or agent` and focused input computed at `16px`; no JavaScript crash. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-03_230_RETEST.md`.

### BUG-20260701-021 — Admin submitted-form detail also shows Leave approval detail

- Reported by: Amrutha
- Time noticed: 2026-07-01 morning
- Screen: Admin overview / dashboard → Total visits → submitted Sales/Service form detail
- User journey affected: Admin opens any submitted form from the dashboard and expects only that submitted Sales/Service detail.
- Actual behavior: The Leave approval detail can appear at the same time as the submitted-form detail, making it look like the Leave page also opened.
- Expected behavior: Opening a submitted Sales/Service form must show only that submitted-form detail. Leave approvals should appear only when the admin opens the Leave/Approvals path.
- Severity: Medium for admin clarity; not a data-loss issue.
- Status: **Verified by Bloom on live app; waiting for Periwinkle/Rahul acceptance.** Fixed and deployed live as version `20260701023648` after Amrutha approved fixing it now.
- Periwinkle source review: Admin overview kept approvals renderable on the overview screen, and a previously selected pending leave approval could stay active while a submitted-form detail was opened. This was a state/rendering mix-up, not a backend/data problem.
- Fix update: Opening a submitted Sales/Service form now clears the active Leave approval detail and hides overview approvals while the submitted-form detail is open, so only the selected form is shown.
- Verification: `npm test -- --run src/App.test.tsx` passed 23/23, including the overlap regression path with a pending Leave approval and submitted dashboard form. `npm run build` passed. Live API health returned OK, live `version.json` returned `20260701023648`, and the served live bundle is `assets/index-Dp3ldM4Z.js`. Bloom QA Admin live login opened the admin overview; there were 0 live Bloom-visible visits/leaves, so no new QA form/leave records were created just to force the overlap. Bloom 2026-07-03 2:30 AM retest then created a pending Bloom leave and Sales entry, opened the dashboard Sales submitted form, and confirmed the Bloom leave reason text was absent. Cleanup removed only Bloom-owned rows after backup/restart/live verification. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-03_230_RETEST.md`.

### BUG-20260626-020 — Admin overview Checked in card shows checked-out people

- Reported by: Amrutha
- Time noticed: 2026-06-26 morning
- Screen: Admin overview → Checked in card
- User journey affected: Admin opens `Checked in` expecting only agents active right now.
- Actual behavior: The card count could show `0 Checked in`, but the expanded detail still listed people who had attendance today and were already checked out or auto checked out.
- Expected behavior: `Checked in` must show only currently active checked-in agents. If count is 0, the expanded detail should say `No agents currently checked in.` Checked-out/auto-checked-out people belong in attendance history/Agents, not this active-now card.
- Severity: Medium for admin clarity during live use
- Status: Verified by Bloom on live app in the 2026-06-30 night stabilization QA; waiting for Periwinkle/Rahul acceptance.
- Fix update: Admin overview now filters the `Checked in` expanded detail to `attendance === checked in` only, changes the expanded heading to `Checked in now`, and uses the clear empty state `No agents currently checked in.`
- Verification: `npm test -- --run src/App.test.tsx src/backend/crystalBioApi.test.ts src/backend/crystalBioHttpServer.test.ts` passed 47/47; `npm run build` passed; `npm run backend:build` passed; live `version.json` returned `20260627041940`; live bundle contains the session-cookie marker and matching app version.
- Bloom retest update — 2026-06-30 21:05 IST: Passed with assigned Bloom QA Admin. The expanded live Admin overview card says `Checked in now`, listed 7 active checked-in agents, showed check-in times and work-mode chips, and did not list checked-out Bloom QA attendance after cleanup. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-30_NIGHT_STABILIZATION.md` and `dogfood-output/bloom-nightly-stability-live-2026-06-30.json`.

### BUG-20260624-019 — Agent report download does not download a PDF

- Reported by: Amrutha
- Time noticed: 2026-06-24
- Screen: Agent My Reports / Reports
- User journey affected: Field agent taps `Download report` and expects an actual PDF file.
- Actual behavior: Agent-side report download is not downloading a PDF. Source check shows the agent report area still has frontend-only report summary text and a `Download report` button, while the existing real PDF endpoint is currently admin report PDF focused.
- Expected behavior: Agent `Download report` should produce a real PDF for the selected report type/period using saved backend data for that logged-in agent, or the button should not promise a download. Since Amrutha confirmed it needs fixing, implement the real PDF path.
- Severity: High for field-agent reporting usability
- Status: Verified by Bloom on live app in the 2026-07-02 2:30 AM fix retest sweep; waiting for Periwinkle/Rahul acceptance.
- Iris restrictions: Smallest safe fix only; do not redesign Agent Reports; preserve the existing one-flow report setup; do not change admin PDF behavior; use the logged-in agent session and saved backend data; add/update focused tests; verify actual PDF response/download, not only button text; deploy only in the approved night/safe window unless Amrutha says urgent.
- Bloom retest required: Agent login → Reports → choose Attendance / Visit / Combined and period → Download report; verify a PDF downloads/opens, data belongs to the logged-in Bloom agent, refresh/session still works, and no console/API errors.
- Source verification: `npm test -- --run src/backend/crystalBioHttpServer.test.ts` passed 7/7; full `npm test -- --run` passed 105/105; `npm run build` passed; `npm run backend:build` passed. Agent PDF endpoint now uses the logged-in agent report data and keeps admin PDF separate.
- Live verification: API health OK; live `version.json` returned `20260624031243`; live bundle contains `/agent/reports.pdf`, `Download report`, and `Downloads a real PDF from saved field entries`; Bloom agent `/agent/reports.pdf` returned `200 application/pdf` with `%PDF` content and file size > 1000 bytes. Backend restarted successfully. Backups: `/var/lib/crystalbio/backups/crystalbio-db-before-refresh-pdf-20260624031243.json` and `/var/www/crystalbio.backup-20260624031243-pre-refresh-pdf`.
- Bloom retest update — 2026-07-02 02:31 IST: Passed using assigned Bloom QA Agent/Admin only. Original steps passed for Attendance, Visit, and Combined downloads; each returned `200 application/pdf`, `%PDF`, and the expected dated filename. Nearby normal path passed: Agent report JSON was scoped to Bloom QA Agent and Admin combined PDF still downloaded. Edge path passed: invalid session returned `401` JSON, not a PDF. Mobile Agent Reports layout looked stable and browser console had 0 messages / 0 JavaScript errors. No QA records were created. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-02_230_RETEST.md` and `dogfood-output/bloom-230-retest-live-2026-07-02-2026-07-01T21-02-38-590Z.json`.
- Bloom 2:30 AM supporting retest — 2026-07-04: Passed again using assigned Bloom QA Agent/Admin only. Attendance, Visit, and Combined agent report downloads each returned `200 application/pdf`, `%PDF`, expected dated filenames, and file sizes over 1000 bytes. Invalid report session returned `401` JSON. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-04_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-05: Passed again using assigned Bloom QA Agent/Admin only. Attendance, Visit, and Combined agent report downloads each returned `200 application/pdf`, `%PDF`, expected dated filenames, and file sizes over 1000 bytes. Invalid report session returned `401` JSON. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-05_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-06: Passed again using assigned Bloom QA Agent/Admin only. Attendance, Visit, and Combined agent report downloads each returned `200 application/pdf` with `%PDF`; invalid report session returned `401` JSON, not a PDF. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-06_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-07: Passed again using assigned Bloom QA Agent/Admin only. Attendance, Visit, and Combined agent report downloads each returned `200 application/pdf` with `%PDF`, dated filenames, and file sizes over 1000 bytes; invalid report session returned `401` JSON, not a PDF. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-07_230_RETEST.md`.

### BUG-20260624-018 — Users are asked to log in again too often

- Reported by: Amrutha
- Time noticed: 2026-06-24
- Screen: Login / saved session restore
- User journey affected: Admins/agents expect the app to stay logged in on the same phone instead of asking for daily login.
- Actual behavior: Amrutha reports being logged out every day. Live monitor shows repeated `/auth/session` 401 entries, meaning the app opened with a missing/invalid saved session and returned to Login. Current backend code does not intentionally expire sessions daily, and the live DB currently still contains real user sessions, so this needs a focused root-cause check around deploy/restart/cleanup/browser storage behavior.
- Expected behavior: A valid saved login should survive normal reopen, refresh, nightly backend restart, and frontend deployment. Only explicit logout, inactive account, or approved full reset should force login.
- Severity: High for daily usability and trust
- Status: Reopened by Amrutha on 2026-06-27 because she is still being logged out daily. Earlier live fix in version `20260624031243` was incomplete. Live version `20260627041940` now has the additional first-party app-domain saved-session fallback; do not mark accepted until real overnight/same-phone persistence is verified.
- Recommended next step: Treat as an urgent reliability fix, not routine polish. Test saved login across live deploy/reopen/backend restart using Bloom accounts; inspect whether session cleanup or frontend validation is clearing valid real sessions; then fix the root cause without changing access rules.
- Source update 2026-06-24: Saved local session is now restored immediately while backend validation runs, instead of showing Login first during validation. Invalid/inactive sessions still clear safely. Verification: App tests/build/backend build passed.
- Live verification 2026-06-24: API health OK; live app version `20260624031243`; Bloom admin login and admin data endpoints returned 200 after backend restart.
- Root-cause evidence 2026-06-27: Live API health is OK and the live DB still contains real sessions, so the backend is not intentionally expiring everyone daily. Client-error logs show repeated 401 `Login session is required` bursts on admin refresh endpoints and `/auth/session`, meaning already-open phones/tabs are trying to refresh with a missing or invalid saved token. The earlier fix relied mainly on localStorage plus an API-domain cookie fallback; mobile/home-screen browsers can lose or not send that fallback reliably because the API is on `work-api.convogenie.ai` while the app is on `work.convogenie.ai`.
- Fix update 2026-06-27: Added a first-party app-domain saved-session cookie fallback in addition to localStorage. On login/session validation, the app now stores the session in both places; on reopen, it restores from the app cookie if mobile storage is missing; logout clears both. Verification: `npm test -- --run src/App.test.tsx src/backend/crystalBioApi.test.ts src/backend/crystalBioHttpServer.test.ts` passed 47/47; `npm run build` passed; `npm run backend:build` passed; live API health OK; live `version.json` returned `20260627041940`; live bundle contains `crystalbio_frontend_session`, `Checking saved login`, and matching app version. Bloom/same-phone overnight retest is still required before acceptance.
- Bloom 2:30 AM supporting retest — 2026-07-02 02:31 IST: In the cron/browser/API context, bearer saved-session restore returned Bloom Agent, session-cookie restore returned Bloom Agent, and an invalid saved session was safely rejected with `401`. Keep this bug open until real iPhone/Android same-phone overnight persistence is accepted. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-02_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-04 02:30 IST: In the cron/API context, bearer saved-session restore returned Bloom QA Agent, session-cookie restore returned Bloom QA Agent, and an invalid saved session returned `401 Login session is required`. This is supporting evidence only; keep the bug open until real same-phone overnight persistence is accepted. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-04_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-05 02:30 IST: In the cron/API context, bearer saved-session restore returned Bloom QA Agent, session-cookie restore returned Bloom QA Agent, and an invalid saved session returned `401 Login session is required`. This is supporting evidence only; keep the bug open until real same-phone overnight persistence is accepted. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-05_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-06 02:30 IST: In the cron/API context, bearer saved-session restore returned Bloom QA Agent and invalid saved session returned `401 Login session is required`. This is supporting evidence only; keep the bug open until real same-phone overnight persistence is accepted. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-06_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-07 02:30 IST: In the cron/API context, bearer saved-session restore returned Bloom QA Agent and invalid saved session returned `401 Login session is required`. This is supporting evidence only; keep the bug open until real same-phone overnight persistence is accepted. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-07_230_RETEST.md`.

### BUG-20260623-017 — Admin dashboard entry Back goes to wrong place and form inputs zoom on phone

- Reported by: Amrutha
- Time noticed: 2026-06-23
- Screen: Admin overview submitted-entry detail; Sales/Service form inputs on phone
- User journey affected: Admin opens an entry from the dashboard and expects Back to return to the dashboard. Field users/admins filling forms should not have the page unexpectedly zoom while typing.
- Actual behavior: Dashboard entry detail could behave like a Field Entry detail and send the user away from the dashboard context. Some form inputs used small mobile font sizes, which can trigger iPhone/browser focus zoom.
- Expected behavior: Entry opened from Admin dashboard returns to Admin dashboard. Entry opened from Field Entry returns to Field Entry. Form inputs stay stable while typing.
- Severity: High for admin navigation confidence and phone form usability
- Status: Deployed live by Periwinkle on 2026-06-23 22:32 IST as version `20260623170035`.
- Fix update: Dashboard entry detail now stays in dashboard context with `Back to dashboard`. Field Entry detail still uses `Back to field entries`. Sales/Service inputs, text areas, and selects now use 16px mobile sizing to prevent iPhone/browser focus zoom.
- Verification: `npm test -- --run src/App.test.tsx` passed 20/20; `npm run build` passed; `npm run backend:build` passed; built dist contained `Back to dashboard`, 16px input CSS, and no old `20260623020524` marker. Live API health returned OK; live `version.json` returned `20260623170035`; live JS/CSS markers confirmed `Back to dashboard`, 16px input CSS, new app build version, and no old app build version. Mobile-sized Chromium loaded the live login page with no runtime-error lines.
- Deploy note: Frontend-only deploy; backend was not restarted. Backup created at `/var/www/crystalbio.backup-20260623170035-pre-admin-back-zoom`. The monitor page file `public/periwinkle-live-monitor-a93f27.html` was not intentionally included in this deploy.
- Bloom follow-up: Full post-deploy user-journey QA remains scheduled for 2026-06-23 23:15 IST using only Bloom assigned credentials.
- Bloom post-deploy QA update — 2026-06-23 17:45 UTC: Passed with assigned Bloom QA admin/agent accounts. Live version/API health OK; Admin dashboard entry detail showed `Back to dashboard` and returned to Overview; Field Entry detail showed `Back to field entries` and returned to Field Entry; Sales form inputs/textareas/selects computed at 16px and Chromium focus did not zoom. Bloom also checked login/session, attendance, Sales/Service save/update/persistence, admin Field Entry/Agents/Approvals/Reports/PDF/Profile, mobile baseline, console errors, and Bloom-only cleanup. Cleanup removed only Bloom-created QA records after dry-run/backup/backend restart; live post-clean checks showed 0 Bloom post-deploy field rows, no current Bloom attendance, and 0 Bloom leave rows. Evidence: `docs/qa-runs/QA_RUN_BLOOM_POST_DEPLOY_BUG-20260623-017_2026-06-23.md` and `dogfood-output/bloom-postdeploy-20260623-api-e2e-20260623174734.json`. Final acceptance: Accepted by Periwinkle on 2026-06-25 morning after Bloom's live retest evidence; no further Iris work unless a regression is reported.

### BUG-20260623-016 — Admin data does not refresh live while screen stays open

- Reported by: Amrutha
- Time noticed: 2026-06-23 13:37 IST
- Screen: Admin overview / Field Entry / Reports
- User journey affected: Admin expects newly submitted field details to appear without closing/reopening or manually refreshing the app.
- Actual behavior: Live API has current data, but an already-open admin screen can stay stale because admin data refresh happens mainly on login, date/filter changes, or same-admin saves. Field Entry/Admin overview do not continuously poll for other agents' new submissions.
- Expected behavior: Admin operational screens should safely refresh recent team data while open and show clear freshness, without changing the approved mobile design.
- Severity: High for daily live review confidence
- Status: **Verified by Bloom on live app; waiting for Periwinkle/Rahul acceptance.** Deployed live by Periwinkle on 2026-06-24 as version `20260624031243`.
- Verification so far: Live API health OK; live app version `20260623020524` at first report, later `20260623170035` after unrelated Back/zoom deploy. Live backend data is present and API response is fast: on 2026-06-24, Bloom admin API checks returned admin report in ~29 ms, Field Entry team list in ~44 ms, agents in ~31 ms, and leave requests in ~30 ms. This points to frontend initial-load/refresh behavior, not backend slowness or data loss.
- Recommended next step: Fix admin screens so data appears immediately after saved-login validation, shows a clear loading/freshness state while fetching, and safely refreshes Overview / Field Entry / Reports while open; test with Bloom accounts and do not touch unrelated screens.
- Source update: Admin data now refreshes after saved-login validation and safely refreshes while Admin is open, on visibility/focus, and every 30 seconds while visible. Verification: App tests/build/backend build passed.
- Live verification: API health OK; live app version `20260624031243`; live bundle contains the visibility-refresh logic and agent PDF markers; Bloom admin `/admin/reports`, `/field-visits?scope=team`, and `/admin/agents` checks returned 200.
- Bloom 2:30 AM retest update — 2026-07-06: Passed on live app with assigned Bloom QA accounts. Admin Field Entry stayed open on `All entries`; Bloom agent created a Sales visit with valid GPS; the still-open admin screen refreshed and showed the Bloom row at the top. Nearby API path `/field-visits?scope=team` saw the new row. Mobile Field Entry layout stayed readable with no overlap, and browser console had 0 messages / 0 JS errors before the separate GPS failure test. Cleanup removed only Bloom-created Sales rows after Bloom-only dry-run/backup/write/restart; live API verification showed 0 Bloom rows. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-06_230_RETEST.md`.
- Bloom 2:30 AM supporting retest — 2026-07-07: Passed again with assigned Bloom QA accounts. Bloom agent created a Sales visit with valid GPS and Bloom admin `/field-visits?scope=team` saw the new Bloom row. Cleanup removed only Bloom-created Sales rows after Bloom-only dry-run/backup/write/restart; live API verification showed 0 Bloom rows. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-07-07_230_RETEST.md`.

### BUG-20260622-015 — Admin overview Total visits shows older submitted forms and rows do not open

- Reported by: Amrutha
- Time noticed: 2026-06-22 13:14 IST
- Screen: Admin overview → Total visits
- User journey affected: Admin wants today's submitted Sales/Service forms from the home dashboard.
- Actual behavior: The expanded Total visits list could show older forms from previous weeks. The listed rows looked like form entries but did not open the full submitted form. The separate `Open submitted work` button sent the admin to Agents instead of Field Entry. Follow-up saves could also make the same form appear more than once in Field Entry/Admin overview lists, and live data confirmed at least one exact repeated save for IISC plus repeated same-note saves for Dr.S.Rajan and Dr. Prathibha.
- Expected behavior: Total visits on Admin overview should show only today's submitted Sales/Service forms. Each row should directly open the submitted-form detail under Field Entry. The same saved form should appear once in the lookup list, using its latest update. Accidental repeat taps/same-content saves must not create new duplicate visit rows. The extra `Open submitted work` button is not needed.
- Severity: High for admin daily review usability
- Status: Deployed live by Periwinkle after Amrutha approved immediate daytime deploy.
- Fix update: Overview Total visits now filters to today's entries, renders each entry as a tappable row, opens the Field Entry detail directly, removes the `Open submitted work` button from the expanded visits card, de-duplicates Field Entry/Admin overview lists to one row per saved form, blocks repeat in-flight Sales/Service taps in the frontend, and makes the backend return the existing visit instead of creating another row for same-day same-content repeat saves.
- Verification: `npm test -- --run src/backend/crystalBioBackend.test.ts src/backend/crystalBioApi.test.ts src/App.test.tsx` passed 54/54; `npm run build` passed; `npm run backend:build` passed; deployed live as version `20260622111156`; live API health returned OK; live version endpoint returned `20260622111156`; live bundle contains the clickable overview row marker and no `Open submitted work` text. A pre-deploy DB backup was written to `/var/lib/crystalbio/backups/crystalbio-db-before-savefix-20260622111156.json`.
- Monitoring update: The normal monitor previously checked uptime/DB existence and optional client error logs, but it did not classify valid-looking repeated save rows as a fault. The 5-minute monitor now also baselines duplicate Sales/Service save signatures and will alert if a duplicate signature is new or worsens.
- Data note: No live submitted records were deleted or changed by this fix. Live read-only data check found 8 forms today but 11 visit rows; the deployed fix shows the 8 forms once each and prevents new same-content duplicate rows.
- Follow-up correction from Amrutha — 2026-06-22 16:54 IST: The first fix over-locked the whole saved Sales/Service form. Step 2 and Step 3 were using the Step 1 `Edit saved details` lock, so pending Step 2/3 sections could be open but not editable/savable, and Step 2 did not advance cleanly to Step 3. Corrected live in version `20260622112442`: Step 1 lock applies only to Step 1, Step 2 locks only after Step 2 is saved, Step 3 locks only after Step 3 is saved, pending Step 2/3 fields stay editable, saving Step 2 opens Step 3, and saved Step 2/3 have their own `Edit Step 2` / `Edit Step 3` controls. Verification: 54/54 targeted tests passed; frontend build passed; live version/API/bundle markers checked.
- Step 3 save delay correction — 2026-06-22 17:02 IST: Live Step 3 API PATCH itself was fast in a Bloom QA check (~0.06s), but the deployed bundle still had stale `appBuildVersion` (`20260619233205`) while `version.json` was newer. That mismatch could trigger the app's forced update reload while the user was in the form and make saving feel stuck. Corrected and deployed as version `20260622112950`; live bundle now contains matching `appBuildVersion`, no old version marker, and Step 2/Step 3 edit controls. Bloom QA latency test record was removed after backup; no real user records were changed.
- Follow-up status UX correction — 2026-06-22 17:14 IST: When a saved Sales/Service entry is changed to `No follow-up`, the continuation card no longer shows a follow-up note field and the action changes to `Save status`. The follow-up note field appears only when a true follow-up/action status is selected. Deployed as version `20260622114429`; tests/build/live version/API/bundle markers verified.
- Approved saved-entry layout correction — 2026-06-22 20:08 IST: After Amrutha approved the preview, deployed version `20260622143639`. Saved Sales/Service entries now show the saved-entry summary and top action card first, followed immediately by the full Step 1 / Step 2 / Step 3 form. Removed the extra follow-up timeline and saved-details divider from this position. Verified targeted app/API tests, production build, live version, API health, and live bundle markers.
- Date-format correction — 2026-06-23 06:50 IST: Amrutha flagged `Last update` showing ISO `yyyy-mm-dd` while `Next follow-up` showed `dd/mm/yyyy`. Fixed saved Sales/Service entry summary so `Last update` uses the same `dd/mm/yyyy • HH:mm` display. Deployed version `20260623011910`; app test/build/live version/API/bundle marker verified.

## Bloom nightly heavy QA run — 2026-06-21 15:31 UTC

- Scope: live API health, Bloom admin/agent login/session, empty/wrong login, direct admin without session, role access, `sales@crystalbio.in` profile/access identity, Attendance check-in/repeated tap/current/fresh-login/checkout/re-check-in, Sales/Service Step 1/2/3 saves and validation, agent/admin saved-entry visibility and persistence, Leave request/Admin Approvals, Admin Reports JSON/PDF, public monitor, mobile login/admin/agent smoke, console/API errors, and Bloom-only cleanup.
- Result: No new Critical or High launch-blocking bug confirmed. One Medium login usability regression was found and needs Periwinkle review.
- Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-21.md`, `dogfood-output/bloom-night-live-api-2026-06-21.json`, `dogfood-output/bloom-live-qa-cdp-results.json`, and `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`.
- Cleanup: Bloom-only cleanup dry-run/write removed 2 Bloom attendance rows, 1 Bloom Sales record/visit, 1 Bloom Service record/visit, and 1 Bloom leave request; backend restarted; API health OK; post-clean check found no `BLOOM QA NIGHT 20260621` records/leaves/current attendance remaining.
- Status: Reviewed by Periwinkle in the 2026-06-21 nightly triage below.
- Iris restriction: one small login fix is approved from this run: BUG-20260621-014 only. Iris must not fix or deploy any other routine change from this run.

## Periwinkle nightly triage — 2026-06-21

- Bloom's latest 2026-06-21 night QA found no Critical or High launch-blocking bug. Live API health, Bloom admin/agent button login/session, role access, Attendance, Sales, Service, Leave, Admin Field Entry, Admin Reports/PDF, public monitor, mobile smoke, and Bloom-only cleanup passed.
- Approved for Iris: BUG-20260621-014 password-field Enter/Go login submission regression. This is launch-relevant phone usability, previously verified, and should be a small safe login-screen fix because the visible Login button still works.
- Iris restrictions for BUG-20260621-014: smallest safe fix only; login screen only; do not redesign the screen; do not change passwords, sessions, role access, backend authentication rules, routing, admin screens, or field-entry flows; preserve the current mobile visual baseline; add/update a focused test if practical; run real tests/build before marking ready for Bloom retest.
- Needs more testing: real-device camera capture/upload, because Bloom did not test it tonight and no new user failure was reported.
- Needs more testing: missed previous-day checkout recreation with stale live data, because Bloom tested normal attendance/repeated tap/refresh/fresh-login/checkout/re-check-in and those passed, but did not create a stale previous-day row tonight.
- Not fixing now: the non-blocking PWA meta warning remains polish only and is not a launch blocker.
- Cleanup restriction: Bloom QA records were removed through the approved Bloom-only backup/dry-run/write path. Do not bulk-delete, hide, or guess-delete real user records.

### BUG-20260621-014 — Password-field Enter/Go does not submit login again

- Reported by: Bloom
- Time noticed: 2026-06-21 15:34 UTC
- Screen: Login
- User journey affected: Admin/field-agent login on phone keyboard.
- Scenario tested: Bloom filled registered email/password on the live login screen and pressed Enter/Go from the password field in mobile Chromium/CDP.
- Expected behavior: Pressing Enter/Go sends one normal `/auth/login` request and behaves the same as tapping the visible `Login` button.
- Actual behavior: No `/auth/login` request was sent, the login screen stayed visible, and the typed credentials remained in the fields. Tapping the visible `Login` button still logs in successfully, so there is a workaround.
- Severity: Medium
- Status: Verified by Bloom
- Periwinkle triage decision: Approved for Iris on 2026-06-21
- Approved by: Periwinkle
- Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-21.md`, `dogfood-output/bloom-live-qa-cdp-results.json`, and `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-enter-login-attempt.png`.
- Launch/pilot impact: Medium phone-login usability issue and apparent regression of previously verified BUG-20260615-001 behavior; not a full login outage because button login works.
- Exact journey to fix: Login screen only — pressing Enter/Go from the password field should submit the same login action as tapping the visible `Login` button, sending one normal `/auth/login` request.
- What should happen after the fix: Button login remains unchanged, empty/wrong-password handling remains unchanged, and keyboard Enter/Go works for both admin and field-agent users.
- Restrictions for Iris: smallest safe fix only; do not redesign the login screen; do not change passwords, sessions, role access, backend authentication rules, routing, admin screens, or field-entry flows; preserve the current mobile-first visual baseline; add/update a focused test if practical; run real tests/build before marking ready for Bloom retest.
- Iris fix update — 2026-06-21 18:03 UTC: Added a login-screen-only Enter/Go handler on the password field that prevents default keyboard ambiguity and calls the same login action as the existing submit form and visible Login button. No backend auth, password, session, role, routing, admin, or field-entry behavior was changed.
- Iris checks run: `npm test -- --run src/App.test.tsx` passed 20/20; focused retest of the long Sales/Service preview test passed after one full-suite timeout; `npm test -- --run` then passed 104/104; `npm run build` passed.
- Bloom retest required: Use live/mobile admin and field-agent login screens to confirm password-field Enter/Go sends exactly one normal `/auth/login` request and behaves like the Login button; also retest button login, empty login, wrong password, and direct admin URL without session.
- Bloom retest update — 2026-06-21 21:08 UTC: Passed on the live app at 390x844 mobile Chromium/Puppeteer using only Bloom assigned accounts. Admin password-field Enter/Go sent one `/auth/login` POST and opened Bloom QA Admin; field-agent password-field Enter/Go sent one `/auth/login` POST and opened Bloom QA Agent. Nearby normal path passed: visible Login button still opened Bloom QA Admin. Edge paths passed: empty Enter sent no auth request, wrong-password Enter sent one expected `/auth/login` POST with HTTP 400 and showed `Invalid email or password`, and direct `/admin` without a session stayed on Login. No runtime exceptions or failed requests were captured; the only HTTP 400 was the intentional wrong-password edge. Evidence: `dogfood-output/bloom-retest-login-enter-2026-06-21-summary.json`, raw run `dogfood-output/bloom-retest-login-enter-2026-06-21-puppeteer-v3.json`, screenshots `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-admin-enter-success-2026-06-21.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-agent-enter-success-2026-06-21.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-button-login-admin-2026-06-21.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-wrong-password-enter-2026-06-21.png`, and `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-014-direct-admin-no-session-2026-06-21.png`.
- Final acceptance: Accepted by Periwinkle on 2026-06-22 morning after Bloom's live retest. Rahul/Amrutha product sign-off remains optional if desired.

## Bloom 2:30 AM IST Iris-fix retest sweep — 2026-06-20 21:01 UTC / 2026-06-21 02:31 IST

- Scope requested: retest only items explicitly marked `Ready for Bloom retest`, plus one nearby normal and one edge scenario for each.
- Result: No current bug item in this board is explicitly marked `Ready for Bloom retest`, so Bloom did not change any item to `Verified by Bloom` in this pass.
- Live API health check: `https://work-api.convogenie.ai/health` returned HTTP 200 and `{"status":"ok"}`.
- Live frontend network check: `https://work.convogenie.ai` returned HTTP 200 and the app HTML was saved.
- Mobile/console check: repo CDP/Chromium loaded the live login page at 390x844 with title `Crystal Bio Field Hub`; no console messages, runtime exceptions, HTTP >=400 responses, or network failures were captured.
- Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-20.md`, `dogfood-output/bloom-retest-cdp-console-check-2026-06-20.json`, `dogfood-output/evidence/bloom-retest-app-home-2026-06-20.html`, and `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-login-mobile-2026-06-20.png`.
- Note: Hermes browser-tool navigation timed out twice in this cron environment, so no separate browser-tool UI pass is claimed.
- Next step: If Iris has a new fix ready, Periwinkle/Iris should mark that exact bug `Ready for Bloom retest`; Bloom can then retest the original path, one nearby normal path, and one edge path.

## Bloom nightly heavy QA run — 2026-06-20 15:31 UTC

- Scope: live API health, live frontend availability, Bloom admin/agent login/session, wrong/empty login, role access, Sales/Service Step 1/2/3 API save and persistence, agent saved-entry continuation on mobile, Attendance check-in/repeated tap/refresh/current/checkout/re-check-in, Leave request, Admin Field Entry, Admin Reports/PDF, mobile layout smoke, console/API errors, and Bloom-only cleanup.
- Result: No new Critical or High launch-blocking bug confirmed in this run.
- Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-20.md`, `dogfood-output/bloom-night-live-api-2026-06-20.json`, and `dogfood-output/bloom-night-ui-cdp-2026-06-20.json`.
- Cleanup: Bloom-only cleanup dry-run/write removed 2 Bloom attendance rows, 1 Bloom Sales record/visit, 1 Bloom Service record/visit, and 1 Bloom leave request; backend restarted; API health OK; post-clean check found no `BLOOM QA NIGHT 20260620` records/leaves remaining.
- Status: Reviewed by Periwinkle in the 2026-06-20 nightly triage below.
- Iris restriction: no new Iris fix is approved from this run. Iris must not fix or deploy routine changes until Periwinkle/Rahul explicitly approves a specific bug.

## Periwinkle nightly triage — 2026-06-20

- Bloom's latest 2026-06-20 night QA found no new Critical or High launch-blocking bug. Live API/frontend, Bloom admin/agent login/session, role checks, Attendance check-in/repeated tap/refresh/checkout/re-check-in, Sales/Service API saves and persistence, saved-entry continuation, Leave request, Admin Field Entry, Admin Reports/PDF, mobile smoke, and Bloom-only cleanup passed.
- Approved for Iris: none from this Bloom run. Iris must not start a new routine fix or deploy from the latest QA report.
- Live correction: report actions now use direct download wording. Admin Reports has one primary `Download PDF` action instead of `Generate report` + `Download PDF`; Agent My Reports uses `Download report` instead of `Generate report`. Deployed live as version `20260621023134`; targeted tests passed 40/40; frontend/backend builds passed; live API/version/asset/browser console check passed.
- Needs more testing: location-permission/no-user-path app-error entries. Bloom should keep monitoring only; Iris must not change GPS/location behavior until a real account/path/journey or repeatable user impact is confirmed.
- Needs more testing: historical attendance repeated `Agent is already checked in` logs under BUG-20260618-009. Tonight's Bloom attendance path passed, so keep monitoring for new real-user repeats after the attendance behavior and midnight auto-checkout correction; do not approve another attendance code change from historical repeats alone.
- Needs more testing: full manual browser typing through every visible Sales/Service field was not repeated tonight. API save/persistence plus mobile smoke passed, so no Iris fix is approved unless Bloom or a real user finds a specific failing field.
- Not fixing now: the non-blocking PWA meta warning from Bloom's browser notes. It remains launch-safe polish, not a launch blocker.
- Not fixing now: real-device camera/upload capture was not tested tonight and no new camera failure was reported. Keep BUG-20260616-005 parked unless Rahul asks for visual polish or a real user reports a capture problem.
- Cleanup restriction: any Bloom QA records must continue to be removed only by the approved Bloom-only backup/dry-run/write path. Do not bulk-delete, hide, or guess-delete real user records.

## Periwinkle nightly triage — 2026-06-19

- Bloom's latest 2026-06-19 night QA found no new Critical or High launch-blocking bug. Live API/login/session, agent Sales/Service API saves, admin Field Entry visibility, basic mobile pages, attendance check-in/checkout/re-check-in, and Bloom-only cleanup checks passed.
- Approved for Iris: none from this Bloom run. Iris must not start any new routine fix from the latest QA report.
- Accepted by Periwinkle: BUG-20260619-013 saved-entry detail/action styling. Bloom's 2026-06-19 21:08 UTC retest created Bloom-only Sales/Service records, verified agent previous-entry continuation plus admin Field Entry detail cleanup, then cleaned Bloom QA records after backup/write and backend restart. Rahul/Amrutha product sign-off remains optional if desired.
- Accepted by Periwinkle: BUG-20260619-012 Field Entry reload/list weight. Bloom's 2026-06-19 post-deploy retest confirmed fast lightweight list loading, 30 entries available, Show all behavior, selected detail opening, and no console/API errors. Rahul/Amrutha product sign-off remains optional if desired.
- Accepted by Periwinkle: BUG-20260619-011 Field Entry visible count/show-all. Bloom's 2026-06-19 post-deploy retest confirmed `10 of 30 shown`, `Show all 30 entries`, and `30 of 30 shown` after tapping. Rahul/Amrutha product sign-off remains optional if desired.
- Accepted by Periwinkle: BUG-20260619-010 downloaded report attendance section. Bloom's 2026-06-19 post-deploy retest confirmed the live PDF is summary-first with `Attendance exceptions and office action`. Rahul/Amrutha product sign-off remains optional if desired.
- Needs more testing: attendance repeated `Agent is already checked in` logs under BUG-20260618-009. Keep monitoring for new real-user repeats after the latest attendance behavior and data repair; do not approve another attendance code change from historical repeats alone.
- Live hotfix: Admin Agents top dashboard/filter correction — Amrutha approved early-morning deploy. Top Team today counts are clickable filters; Sales / Service / In office / Checked in / Not in / Checked out are explicit filters, not passive pills. Deployed live as version `20260619233205`; local tests/build passed; live API/version/bundle/login-page console check passed. One Bloom QA Sales test entry was created for Amrutha review: `BLOOM QA CHECK SALES 202606192335`.
- Live hotfix: App-wide IST date display correction — Amrutha asked to deploy now. User-facing app dates, report ranges, PDF report dates, report filenames, and client-side visit/attendance dates now use India/Kolkata handling with `dd/mm/yyyy` display and `ddmmyyyy` file tokens. Deployed live as version `20260620020839`; full test suite passed 103/103; frontend/backend builds passed; live API/version/bundle/login-page console check passed; live attendance PDF filename verified as `01062026-to-20062026`.
- Live correction: Sales/Service Step 1 copy cleanup — Amrutha's screenshot showed the approved cleanup was missing from the actual agent Sales visit screen. Removed the old `Save quickly first`, `Quick visit update`, `For use at client place...`, verbose location helper, and photo helper copy from Sales/Service Step 1. Deployed live as version `20260620025548`; targeted tests passed 40/40; frontend/backend builds passed; live API/version/asset check passed and old copy no longer appears in the served bundle.
- Live correction: Sales/Service saved-entry follow-up flow — Amrutha clarified the approved follow-up behavior was still missing. Opening/saving a previous entry now shows `Continue saved entry` first with customer summary, follow-up note, next status/date, and `Save follow-up`; saving creates a new visit update on the existing Sales/Service record instead of only relabeling Step 1. Original Step 1 / Step 2 / Step 3 remain below in the existing form flow. Deployed live as version `20260620034224`; targeted tests passed 40/40; frontend/backend builds passed; live API/version/asset/browser console check passed.
- Live correction: Saved original sections now lock by default — Amrutha corrected that the approved requirement also included locking saved Step 1 / Step 2 / Step 3 details and exposing an `Edit saved details` button only for corrections. Follow-up remains editable at the top. Deployed live as version `20260620034952`; targeted tests passed 40/40; frontend/backend builds passed; live API/version/asset/CSS/browser console check passed.
- Live correction: duplicate Step 3 photo controls removed from Sales and Service. Step 1 remains the only place to add photos; Step 3 now focuses on quote/parts and office details. Deployed live as version `20260620040734`; targeted tests passed 40/40; frontend/backend builds passed; live API/version/asset/browser console check passed.
- Live correction: Admin usability pass for Amrutha's 2026-06-21 screenshots. Reports `Today` now counts only entries inside the selected date range, not the full curated entry list; Field Entry has `All types / Sales / Service` filters; entry detail Back restores the same list scroll position; saved photos open in an in-app preview dialog with Close instead of requiring download/new tab. Deployed live as version `20260621084425`; targeted tests passed 40/40; frontend/backend builds passed; live API health OK; live Bloom QA Admin browser check verified Reports today count, Sales/Service filters, scroll-return Back, and photo preview on existing Ge vernova service record without creating QA data.
- Live correction: Admin detail navigation polish after Amrutha's screenshot feedback. Removed the competing top `Overview` back pill while viewing a submitted entry detail, made the in-detail `Back to field entries` control clearer and sticky, and added native browser-history support so Android/browser Back and iOS browser edge-swipe/back can return from detail to the list. Deployed live as version `20260621091241`; targeted tests passed 40/40; frontend/backend builds passed; live API health OK; served JS/CSS markers confirmed native history support and absence of old custom swipe markers/CSS; live browser detail check verified browser Back returns to Field Entry list, and console had 0 errors.
- Live correction: Selective admin detail back journeys after Amrutha's Sunday approval. The same native browser-history approach is now live for Approvals detail, Agents person detail, and Profile person detail, in addition to submitted-entry details from Field Entry/Reports. Forms, photo upload/preview, long Sales/Service entry screens, filters, and bottom navigation still do not have custom swipe gestures. Deployed live as version `20260621111338`; full test suite passed 103/103; frontend build passed; live API health OK; live version and served JS markers confirmed entry/approval/agent/profile history support; live admin browser console had 0 errors.
- Needs more testing: location-permission app-error entries. They still lack clear user/path/journey evidence and may be expected GPS-denial behavior or automation noise.
- Not fixing now: the non-blocking PWA meta warning from Bloom's browser notes. It is not a launch blocker.
- Cleanup restriction: any Bloom QA records must be removed only by the approved Bloom-only backup/dry-run/write path. Do not bulk-delete, hide, or guess-delete real user records.
- Bloom cleanup completed on 2026-06-20: dry-run first showed 1 Bloom-owned Sales record / 1 Sales visit eligible; backed-up write removed only that Bloom Sales test entry. Backup: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-06-20T12-44-35-543Z.bak`. Post-clean dry-run showed 0 remaining Bloom cleanup targets; API health OK.

## Bloom night heavy QA run — 2026-06-19 15:31 UTC

- Scope: live API health, Bloom admin/agent login/session, wrong/empty login, agent Attendance/Visits UI, Sales/Service API Step 1/2/3 save and persistence, Admin Overview/Field Entry/Reports UI, admin report API/PDF, console warnings, and Bloom-only cleanup.
- Result: No new Critical or High launch-blocking bug was confirmed in this run.
- Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19.md`, `dogfood-output/bloom-night-api-e2e-2026-06-19.json`, `dogfood-output/bloom-night-ui-cdp3-2026-06-19.json`.
- Cleanup: Bloom-only cleanup removed the Bloom QA attendance/Sales/Service records created during testing, backend was restarted, API health was OK, and admin team lookup showed 0 Bloom QA entries afterward.
- Status: Reviewed by Periwinkle in the 2026-06-19 nightly triage above.
- Iris restriction: no new Iris fix is approved from this run. Existing bugs below must remain under their current approval/status rules.

### BUG-20260619-013 — Saved-entry detail has confusing action placement and button/status styling

- Reported by: Amrutha
- Time noticed: 2026-06-19
- Screen: Agent saved Sales/Service entry detail and saved-entry rows
- User journey affected: Field agent opens a saved entry to add follow-up or complete remaining details.
- Current behavior to correct: Actions can be pushed below long saved details or shown as a separate action-card journey; some rows/buttons use different yellow/green/tinted styles for the same `View details` action; unnecessary saved/not-saved pills, progress/status chips, read-only text, and extra buttons add confusion.
- Expected behavior: Keep the original form flow. Top shows customer/lab, contact person, product/equipment, and Sales/Service agent. Immediately below, show inline follow-up fields: note, next date, next status, save. Then show Step 1 / Step 2 / Step 3 in the original order. Pending Step 2/3 fields appear directly inside their step, not behind a separate `Complete pending details` button. `View details` stays one neutral consistent style; follow-up state is plain text, not button colour.
- Severity: High for field-agent usability
- Periwinkle triage decision: Approved for Iris tonight
- Status: Accepted by Periwinkle after Bloom live retest; deployed live on 2026-06-19 as version `20260619170148`. Rahul/Amrutha product sign-off remains optional if desired.
- Iris fix update: Saved-entry copy/styling was cleaned in source. Read-only helper text and progress/status clutter were removed, `View details` uses one neutral style, follow-up statuses are plain text, repeated `No date set`/`Tap to continue` copy is reduced, and pending Step 2/3 sections open directly in the original form flow.
- Verification so far: targeted test suite passed 63/63; `npm run build` passed; live version/API/bundle were checked after deployment. Mobile browser check confirmed Field Entry `All entries` loads, `View details` opens as a neutral action, submitted detail opens without read-only helper text, and console had no errors.
- Bloom retest required: mobile saved Sales and Service previous-entry continuation, Field Entry `View details`, saved detail top copy, follow-up/status styling, and direct pending Step 2/3 form visibility.
- Current Periwinkle decision — 2026-06-20: Accepted after Bloom's live retest evidence. Rahul/Amrutha product sign-off remains optional if desired.
- Bloom post-deploy retest — 2026-06-19 17:55 UTC: Admin Field Entry detail cleanup passed with Bloom QA Admin: `View details` opened neutral submitted detail, no read-only helper text, no saved/not-saved pills, and no console errors. Agent saved Sales/Service previous-entry continuation was blocked because Bloom QA Agent has no saved visits after cleanup; Bloom did not create new QA records without a verified live cleanup path. Evidence: `docs/qa-runs/QA_RUN_BLOOM_POST_DEPLOY_2026-06-19.md`.
- Bloom night retest — 2026-06-19 21:08 UTC: Passed. Bloom created clearly named Bloom-only Sales and Service records, verified the Agent Previous entries list reopened the saved Sales entry with saved Step 2/3 status instead of a blank pending form, verified the Service edge/partial entry opened with Step 2 and Step 3 fields directly visible without a separate `Complete pending details` journey, verified Admin Field Entry All entries showed `30 of 30 shown` and a customer-first detail with no read-only/helper/status clutter, and found no browser console errors. Cleanup removed 5 Bloom Sales records/visits and 5 Bloom Service records/visits after Bloom-only dry-run/write; backend restarted; post-clean admin lookup showed 0 Bloom QA retest records. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19.md` and `dogfood-output/bloom-night-retest-after-iris-2026-06-19.json`.

### BUG-20260619-012 — Field Entry data loads slowly after app reload

- Reported by: Amrutha
- Time noticed: 2026-06-19
- Screen: Admin → Field Entry / saved field data after reload
- User journey affected: Admin opens the app and the shell appears, but submitted Sales/Service data appears much later.
- Current behavior: App shell loads quickly, but data can feel delayed on phone reloads.
- Expected behavior: Admin should see the list quickly. Heavy photo/proof data should not slow the first list load.
- Severity: High for live usability
- Bloom QA evidence: Live app shell/API were fast, but `/field-visits?scope=team` returned about 608 KB for 20 entries because some entries include embedded photo payloads, including one around 280 KB. This points to payload/rendering weight rather than an API outage.
- Periwinkle verification: API health OK; Bloom admin `/field-visits?scope=team` returned 20 rows in about 169 ms from server side but downloaded about 607 KB.
- Recommended fix: Make Field Entry list lightweight by excluding large photo/proof payloads from list responses and loading them only when a specific entry detail is opened. Keep the visible list text-first and fast.
- Status: Accepted by Periwinkle after Bloom live retest; deployed live on 2026-06-19 as version `20260619170148`. Rahul/Amrutha product sign-off remains optional if desired.
- Prepared fix: `/field-visits` list responses now exclude heavy `photoPayload` by default. The frontend opens the entry immediately and requests the selected entry’s full photo/proof payload only when the admin opens that detail.
- Verification so far: targeted tests passed 63/63; production frontend and backend builds passed; live API health OK. Live admin `/field-visits?scope=team` returned 30 entries in about 31 KB with 0 list `photoPayload` fields; selected-entry detail endpoint returned normally. Browser check confirmed Field Entry `All entries` showed 10 of 30 plus `Show all 30 entries`.
- Bloom retest required: Field Entry reload speed, All entries visibility, Show all entries, and detail/photo opening with assigned Bloom credentials only.
- Current Periwinkle decision — 2026-06-20: Accepted after Bloom's live retest evidence. No further Iris work unless a real user reports the live reload/list/detail path still fails.
- Bloom post-deploy retest — 2026-06-19 17:55 UTC: Passed. Live API health OK; `/field-visits?scope=team` returned 30 entries in about 31 KB with 0 list `photoPayload` fields; mobile Field Entry showed `10 of 30 shown`, then `Show all 30 entries` changed the list to `30 of 30 shown`; selected detail opened without console errors. Evidence: `docs/qa-runs/QA_RUN_BLOOM_POST_DEPLOY_2026-06-19.md`, `dogfood-output/bloom-postdeploy-live-api-2026-06-19.json`, and `dogfood-output/screenshots/bloom-postdeploy-admin-field-entry-all-2026-06-19.png`.

### BUG-20260619-011 — Field Entry total count shows more entries than visible

- Reported by: Amrutha
- Time noticed: 2026-06-19
- Screen: Admin → Field Entry → Field entries
- User journey affected: Admin lookup of submitted Sales/Service entries
- Current behavior: The count can show around 20 entries, but only 10 cards are visible because the UI was capped at the first 10 without a show-more control.
- Expected behavior: Admin should clearly see how many are shown out of the total and have a simple way to show all matching entries.
- Severity: Medium
- Root cause confirmed by Periwinkle: frontend display cap `slice(0, 10)` without pagination/show-all control. Live DB has more saved entries than the visible first 10.
- Status: Accepted by Periwinkle after Bloom live retest. Rahul/Amrutha product sign-off remains optional if desired.
- Live fix: Field Entry no longer silently stops at 10 visible rows. The served bundle has the 10-row cap removed while other pending source changes were not deployed.
- Verification so far: focused Field Entry test passed; live version marker checked; served bundle no longer contains the 10-row cap.
- Bloom night test: After live deploy, verify Field Entry with All entries shows the correct total, first 10, Show all button, and all entries visible after tapping it.
- Current Periwinkle decision — 2026-06-20: Accepted after Bloom's live mobile/admin retest evidence.
- Bloom post-deploy retest — 2026-06-19 17:55 UTC: Passed. Mobile Admin Field Entry showed `10 of 30 shown`; tapping `Show all 30 entries` changed the list to `30 of 30 shown` and displayed entries beyond the first 10. Evidence: `docs/qa-runs/QA_RUN_BLOOM_POST_DEPLOY_2026-06-19.md` and `dogfood-output/screenshots/bloom-postdeploy-admin-field-entry-all-2026-06-19.png`.

### BUG-20260619-010 — Downloaded report attendance section is overloaded

- Reported by: Amrutha
- Time noticed: 2026-06-19
- Screen: Admin Reports → downloaded report/PDF
- User journey affected: Office/admin review of attendance
- Current behavior: The attendance section downloads as a large table with too much low-value information and not enough useful summary.
- Expected behavior: Attendance in the downloaded report should be summary-first and business-useful: who checked in, who auto-checked out, who missed checkout, key times, and exceptions that need office action. Avoid a wide spreadsheet-style table unless it contains useful information.
- Severity: Medium
- Status: Accepted by Periwinkle after Bloom live retest; deployed live on 2026-06-19 as version `20260619170148`. Rahul/Amrutha product sign-off remains optional if desired.
- Bloom night test: Download the report before/after the fix, confirm the attendance section is readable and useful, and verify counts/details match live saved attendance data.
- Bloom evidence update — 2026-06-19 15:31 UTC: Live attendance PDF for 2026-06-01 to 2026-06-19 still shows `Person-wise attendance` as a wide table with Person, Role, Days, Worked, Checked out, Leave applied, Approved/Pending, and No update. It lists 17 people and 296 no-update days, but does not highlight auto-checkout/missed-checkout/office-action exceptions first. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19_NIGHT_ATTENDANCE.md`, `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.pdf`, and extracted text `dogfood-output/evidence/attendance-report-2026-06-01-to-2026-06-19.txt`.
- Iris restriction: Keep the fix limited to the downloaded report attendance section. Do not redesign the whole Reports screen, change attendance data, or touch Sales/Service report calculations.
- Periwinkle/Iris fix update — 2026-06-19: Downloaded attendance PDF now shows `Attendance exceptions and office action` first, then a compact `Person-wise attendance summary` with worked days, last check-in, last checkout, leave, no-update days, and office note (`Still checked in`, `Auto checked out`, `Leave pending`, `No update`, or `OK`). Live PDF check returned `%PDF`, `application/pdf`, and extracted text confirmed the new headings while the old wide-table heading was absent.
- Bloom retest required: download the attendance report for the same range, confirm the summary-first section is readable/useful, and compare counts/exceptions against live attendance data.
- Current Periwinkle decision — 2026-06-20: Accepted after Bloom's live downloaded-report retest evidence.
- Bloom post-deploy retest — 2026-06-19 17:55 UTC: Passed. Live PDF for 2026-06-01 to 2026-06-19 returned `%PDF`/`application/pdf`; extracted stream showed `Attendance exceptions and office action`, `Still checked in`, and `No update`, and the old wide-table-first `Person-wise attendance` heading was not found. Evidence: `docs/qa-runs/QA_RUN_BLOOM_POST_DEPLOY_2026-06-19.md` and `dogfood-output/evidence/bloom-postdeploy-attendance-report-2026-06-01-to-2026-06-19.pdf`.


## Bloom 2:30 AM retest sweep — 2026-06-18 21:01 UTC

- Scope requested: retest only items explicitly marked `Ready for Bloom retest`, plus one nearby normal and one edge scenario for each.
- Result: No current bug item in this board is explicitly marked `Ready for Bloom retest` at the time of the sweep, so Bloom did not change any item to `Verified by Bloom` in this pass.
- Live health check: `https://work-api.convogenie.ai/health` returned `{"status":"ok"}`.
- Live app availability check: frontend HTML returned HTTP 200 by network check. The Hermes browser session timed out before a fresh UI/console/mobile retest could load, so no browser-based pass/fail claim is made for this sweep.
- Next step: If Iris has a new fix ready, Periwinkle/Iris should mark the specific bug `Ready for Bloom retest`; Bloom can then retest that exact journey with evidence.

## Periwinkle nightly triage — 2026-06-18

- No new Bloom-confirmed product bugs from `docs/qa-runs/QA_RUN_BLOOM_2026-06-18.md`: login/session, role access, Sales/Service save and persistence, admin review/report visibility, PDF export, logout, mobile smoke checks, and Bloom-only cleanup passed.
- Needs Rahul decision: BUG-20260618-009 check-in confusion / previous-day missed checkout. It is launch-relevant and the source fix has local test/build/browser evidence, but it changes attendance business behavior, so live deployment should wait for Rahul approval or the approved night deployment window.
- Needs more testing: full deep manual UI filling of every Sales/Service Step 1/2/3 field, because Bloom completed API persistence plus mobile smoke checks but did not manually fill every visible field in this run.
- Not fixing now: camera/upload visual polish BUG-20260616-005 remains parked because no new launch-blocking evidence appeared tonight.
- No new Iris work approved tonight beyond BUG-20260618-009 if Rahul approves deployment. Iris must not redesign attendance, delete old open attendance rows, infer work mode, or touch unrelated Sales/Service/admin screens.

## Periwinkle nightly triage — 2026-06-17

- Approved for Iris: Admin checked-in detail/work-mode improvement, because it is launch-relevant and already requested by Amrutha. Iris may only complete the approved attendance-detail scope: show all checked-in people, check-in time, check-out/Still checked in, selected work-mode chip, and `Mode not recorded` for older records. Do not redesign Admin overview or infer mode from role.
- Needs more testing: BUG-20260617-007 after the live deploy. Bloom should retest on mobile/admin with assigned QA credentials before Periwinkle calls it accepted.
- Needs more testing: location-permission app-error entries from 2026-06-16. They still lack account/path/journey evidence and may be expected GPS-denial behavior or automation noise.
- Not fixing now: BUG-20260616-005 Camera/Upload visual polish. Keep it parked unless Rahul asks for polish after launch-critical checks are clear.
- No new Iris work: BUG-20260615-001, BUG-20260615-002, BUG-20260616-003, BUG-20260616-004, and BUG-20260616-006 are verified by Bloom; leave them verified unless a real user reports a regression.

### Enhancement request — Admin checked-in detail should show time and work type

- Requested by: Amrutha
- Time noticed: 2026-06-17
- Screen: Admin overview → Checked in expanded card
- Current behavior: The card shows the checked-in person and role only, e.g. `Surendra • Service agent`.
- Desired behavior: Show check-in time and selected work type from the agent check-in choices: Sales visit, Service visit, In office, or combined selections.
- Product reason: Admin should quickly know not only who is active, but when they started and whether they are in field visit mode, office mode, or both.
- Implementation note: This should store the selected check-in work type with the attendance record and then show it in Admin overview/attendance details. Do not infer it only from the agent role.
- Periwinkle triage decision: Approved for Iris
- Approved by: Periwinkle, based on Amrutha's launch-week admin attendance request and the approved night-deployment notes.
- Status: Deployed live; Bloom retest passed.
- Iris fix update: The selected check-in work type is now sent from the agent check-in screen, saved on the attendance record, and included in Admin overview attendance detail. Older attendance rows without saved mode show `Mode not recorded` instead of guessing from role.
- Deploy/check update: Deployed frontend/backend on 2026-06-18 morning after Amrutha approved immediate deployment. Live version is `20260618013516`; API health is OK; live bundle contains `Mode not recorded`, `workTypes`, and `Already checked in`, and no longer contains `Latest submitted work`. Browser login page loaded with no console errors.
- Bloom retest update: Passed with assigned Bloom QA agent/admin only; evidence recorded in `docs/qa-runs/QA_RUN_BLOOM_2026-06-18_ATTENDANCE_ADMIN.md`. Amrutha later caught that Bloom attendance still remained; Periwinkle rechecked the live DB, found 3 Bloom attendance rows, ran Bloom-only dry-run, created backup `crystalbio-db.json.2026-06-18T02-23-42-459Z.bak`, cleaned only Bloom-owned attendance rows, restarted backend, and verified 0 Bloom attendance/Sales/Service/leave rows remain.

### BUG-20260618-008 — Admin Field Entry saved rows are not clickable

- Reported by: Amrutha
- Time noticed: 2026-06-18
- Screen: Admin → Field entry → Field entries list
- Current behavior: Saved Sales/Service cards look like rows but do not open the read-only filled-form detail.
- Expected behavior: Tapping a Field Entry card should open the same read-only detail view used from Agents, with a clear Back to field entries action.
- Status: Fixed in source, tested, and deployed live as version `20260618023542`.
- Periwinkle fix: Converted Field Entry saved cards to tappable rows, added `View details`, and kept the detail view inside the Field Entry tab.
- Checks run: `npm test -- --run src/App.test.tsx` passed with 18 tests; `npm run build` passed. Live bundle verified with `Back to field entries` and `View details` markers; API health OK.
- Deploy note: Amrutha approved daytime deploy with “Deploy now.”
- Iris checks run: `npm test -- --run src/crystalBioFrontendApi.test.ts src/backend/crystalBioBackend.test.ts src/App.test.tsx` passed with 52 tests; `npm run build` and `npm run backend:build` passed on 2026-06-18.
- Restrictions for Iris: Do not treat the daytime partial attendance patch as the final approved design. Final implementation must match the approved preview: checked-in person, role, check-in time, check-out/Still checked in when available, and selected work-mode chip. If older records have no saved mode, show `Mode not recorded` rather than guessing. Do not redesign Admin overview, change unrelated attendance rules, or infer mode from agent role.

### BUG-20260618-009 — Check-in button confusion / repeated already-checked-in errors

- Reported by: Amrutha
- Time noticed: 2026-06-18
- Screen: Agent attendance/check-in
- User journey affected: Daily check-in/check-out
- Live behavior: Users are pressing Check in multiple times. The backend blocks duplicate same-day records, but the live monitor shows repeated `Agent is already checked in` errors from `/attendance/check-in`.
- Evidence: Live monitor and server-side client-error log showed 25 check-in/attendance-related entries, including repeated `Agent is already checked in` events. Live DB had 12 attendance records across 10 agents; multiple agents still had open checked-in sessions from previous days.
- Root cause found by Periwinkle: the backend checked for any open `checked_in` attendance record, not only today’s record. If an agent forgot to check out yesterday, today’s Check in attempt was blocked as “already checked in,” which felt confusing. Same-day double taps were also reported as API errors instead of a calmer on-screen state.
- Periwinkle triage decision: Approved for night/live deployment after Amrutha confirmed this was expected to ship.
- Status: deployed live as version `20260619034400` on 2026-06-19; live attendance data repair completed with backup and audit.
- Live behavior now:
  - Attendance is state-first: Not checked in / Checked in / Checked out.
  - After check-in, the home quick action and Attendance screen show Check out as the main action.
  - Saved work mode is locked after check-in and shown inside the main checked-in card, not as a separate confusing card.
  - After checkout, the app shows Check in again so agents can return after a break or second visit.
  - Previous-day forgotten checkout is auto-closed at night and shown as `Auto checked out` for admin review; records are preserved, not deleted.
- Verification: App/backend tests passed 34/34 for the targeted suite; production frontend build passed; backend build passed; production DB backup created; live DB repair audit created; backend restarted; API health OK; live version is `20260619034400`; live bundle contains `Auto checked out` and `20260619034400`; monitor page still shows the standalone `CrystalBio Live Monitor` layout.
- Bloom follow-up: retest live **check in → refresh/reopen app → still checked in → check out → check in again** with Bloom-assigned QA credentials only. This reload-persistence step was missed in the earlier Bloom check.
- Bloom night retest update — 2026-06-19 15:31 UTC: Passed for the Bloom QA Agent through the live API and browser reload check. Normal check-in created `attendance_383`; repeated same-day Check in attempts were blocked with `Agent is already checked in`; `/attendance/current` still returned the checked-in row after refresh/reopen; checkout changed `attendance_383` to checked out; check-in again created `attendance_384`; final checkout left Bloom QA Agent not currently checked in. Admin report data matched the Bloom records. Evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-19_NIGHT_ATTENDANCE.md` and `dogfood-output/evidence/bloom-night-attendance-qa-2026-06-19.json`.
- Monitoring note — 2026-06-19: Server-side app-error logs still contain repeated `Agent is already checked in` events, including Surendra twice at 02:12 UTC. Continue watching for new repeats after the latest attendance behavior; do not treat historical repeats alone as a new fix request.
- Live user follow-up — 2026-06-19: Amrutha reported Surendra was not showing as checked in in Admin. Periwinkle repaired the live attendance data after backup/audit: Surendra’s blocked 19 June check-in was restored as today’s active check-in, six other blocked real-user check-ins were restored for prior days, nine stale missed checkouts were auto-closed at night, and Bloom-owned QA attendance/Sales/Service/session rows were removed. Non-Bloom Sales/Service/Leave/user-profile data hash stayed unchanged in the dry-run audit.
- Product correction from Amrutha — 2026-06-19 03:34 UTC: if an agent forgets to check out, the system should automatically close the open attendance session at night instead of expecting the next-day agent to fix it manually. This is now the approved attendance rule: nightly auto-checkout for stale open sessions, with the record preserved and clearly marked as system-closed/missed checkout for admin review. This should not delete or hide attendance history.
- Live correction — 2026-06-20 04:45 IST: Amrutha reported the app still showed 2026-06-19 check-ins as today's logs and the nightly auto-checkout had not closed them. Root cause: the automation ran at 23:59 IST while using a `date < today` rule, so same-day 2026-06-19 open sessions were not eligible yet. Periwinkle ran a backup/write repair immediately: 6 real 2026-06-19 open sessions were marked `Auto checked out`, open attendance after repair is 0, non-Bloom Sales/Service/Leave/user-profile data hash stayed unchanged, backend restarted, API health OK. Audit: `docs/live-data-audits/attendance-auto-checkout-bloom-cleanup-2026-06-19T23-15-25-093Z.json`; backup: `/var/lib/crystalbio/crystalbio-db.json.pre-attendance-repair-2026-06-19T23-15-25-093Z.bak`.
- Automation correction — 2026-06-20: the repair script now computes the day in Asia/Kolkata time by default, and cron job `faeccaf5a2d2` now runs daily at 18:35 UTC / 00:05 IST so same-day missed checkouts are closed after midnight rather than before the day changes.

## Periwinkle nightly triage — 2026-06-16

- Verified by Bloom: BUG-20260616-006 saved-entry continuation now works after live deploy/retest.
- Needs more testing: the location-permission live app error entries from 2026-06-16, because the logs still show unknown user/path and may be Bloom automation or a normal permission denial rather than a product bug.
- Cleanup completed: Bloom QA cleanup was completed after backup/dry-run/write, limited to Bloom-owned QA rows and Bloom sessions only.
- Not fixing now: BUG-20260616-005 Camera/Upload polish, because it is visual polish and not blocking launch work.
- No new Iris work: BUG-20260615-001, BUG-20260615-002, BUG-20260616-003, BUG-20260616-004, and BUG-20260616-006 are already verified by Bloom; leave them as verified unless a real user reports a regression.

### BUG-20260615-001 — Password-field Enter/Go does not submit login

- Time noticed: 2026-06-15 15:40 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Medium
- User journey affected: Login/session
- What the user likely experienced: A phone user can type email/password and press the keyboard Go/Enter key, but nothing happens. The user must tap the visible Login button.
- Steps to reproduce:
  1. Open `https://work.convogenie.ai`.
  2. Type an email and password.
  3. Press Enter/Go from the password field.
- Expected result: Login submits, same as tapping the Login button.
- Actual result: No login request is sent and no login result appears.
- Evidence:
  - Screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/login-enter-key.png`
  - CDP/network result: `/root/workspace/CrystalBio/dogfood-output/login-enter-key.json` shows `auth responses 0`.
  - Browser log clue: `[DOM] Password field is not contained in a form`.
- Periwinkle triage decision: Approved for Iris
- Approved by: Periwinkle
- Status: Verified by Bloom
- Iris fix: Login inputs are now inside a real submit form, so phone Enter/Go from the password field submits the same login action as the Login button.
- Iris checks run: targeted App test, full `npm test`, and `npm run build` passed on 2026-06-15.
- Exact journey to fix: Login screen only — pressing Enter/Go from the password field should submit the same login action as tapping the visible Login button.
- What should happen after the fix: The login behavior remains unchanged for button taps, and keyboard Enter/Go also sends one normal login request and shows the same success/failure messages.
- Restrictions for Iris:
  - Make the smallest safe fix only.
  - Do not redesign the login screen.
  - Do not change login rules, passwords, sessions, role access, or backend authentication behavior.
  - Preserve the current mobile-first CrystalBio visual baseline.
  - Add/update a focused test if practical, then run real checks before marking ready for Bloom retest.
- Bloom retest request: Retest Enter/Go login behavior, normal button login behavior, empty login, wrong-password login, and direct admin URL without session.
- Bloom retest result: Failed on live app on 2026-06-15 18:22 UTC. Pressing Enter/Go still produced no `/auth/login` request in the live frontend CDP run.
- Bloom retest result: Failed again on live app on 2026-06-15 21:07 UTC. Mobile CDP retest still shows the password field is not inside a form, pressing Enter/Go sends no `/auth/login` request, while tapping the visible Login button does send the normal invalid-password request.
- Current Iris note: Rechecked after Bloom's failed live retest. The live frontend was still serving an older JavaScript build without the login form fix, while the local fixed build contains the real submit form and passes tests/build. Iris pushed the frontend fix on 2026-06-16 00:53 UTC so the live deploy can pick it up.
- Bloom retest result: Failed again on live app on 2026-06-16 01:46 UTC. The password field is still not inside a form, and pressing Enter/Go sent no `/auth/login` request. The visible Login button still sends the normal wrong-password request, so this is specific to keyboard Enter/Go submission.
- Morning status cleanup: Periwinkle confirmed on 2026-06-16 08:43 UTC that the live login screen now contains a real form and pressing Enter/Go from the password field sends one `/auth/login` request to the live API. Waiting for Bloom formal retest before final acceptance.
- Bloom night retest result: Verified fixed on live mobile browser on 2026-06-16 15:36 UTC. Pressing Enter/Go from the password field sent the login request and showed the normal `Invalid email or password` result for a wrong password. Empty login and direct admin URL without session were also safely blocked.
- Latest evidence:
  - Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`
  - CDP result: `/root/workspace/CrystalBio/dogfood-output/bloom-retest-login-enter-2026-06-15.json` (`checkedAtUtc`: `2026-06-16T01:46:08.951Z`)
  - Enter/Go screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-enter-wrong-password-2026-06-15.png`
  - Button wrong-password screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-click-wrong-password-2026-06-15.png`
  - Empty login screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-empty-login-2026-06-15.png`
  - Direct admin no-session screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-retest-direct-admin-no-session-2026-06-15.png`
  - Latest night retest result: `/root/workspace/CrystalBio/dogfood-output/bloom-night-heavy-qa-results.json`
  - Latest Enter/Go screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-enter-wrong-password.png`

### BUG-20260615-002 — New Bloom QA accounts cannot log in

- Time noticed: 2026-06-15 18:22 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: High
- User journey affected: Login/session and QA end-to-end testing
- What the user likely experienced: The dedicated Bloom QA admin and field-agent accounts cannot enter the live app. The login screen stays visible and the API says the credentials are invalid.
- Steps to reproduce:
  1. Open `https://work.convogenie.ai`.
  2. Try to log in with `bloom.admin@crystalbio.in` using the provided Bloom QA Admin password.
  3. Try to log in with `bloom.agent@crystalbio.in` using the provided Bloom QA Agent password.
- Expected result: Admin account opens admin screens; field-agent account opens field-agent screens with Sales + Service access.
- Actual result: Both accounts return `HTTP 400` / `Invalid email or password` from the live API.
- Evidence:
  - API evidence file: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-check.json`
  - Admin screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-admin-login-attempt.png`
  - Agent screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-agent-login-attempt.png`
  - CDP result file: `/root/workspace/CrystalBio/dogfood-output/bloom-live-qa-cdp-results.json`
- Status: Fixed by Periwinkle on live backend; waiting for Bloom full QA rerun
- Fix made: Created and activated the Bloom QA admin and Bloom QA field-agent accounts on the live backend.
- Verification: Direct login succeeded through `https://work-api.convogenie.ai` for both Bloom accounts with the expected roles: admin and Sales + Service.
- Bloom retest result: Verified fixed on 2026-06-15 20:15 UTC. Both Bloom QA accounts now log in successfully on the live API and live app.
- Bloom follow-up checks passed: Agent Sales/Service API save flow, admin report visibility, admin PDF report, and admin team field-visits visibility.
- Current status: Verified by Bloom
- Evidence:
  - QA account API recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-qa-account-login-api-recheck.json`
  - Full live API E2E result: `/root/workspace/CrystalBio/dogfood-output/bloom-live-e2e-api-recheck.json`
  - Admin team field-visits recheck: `/root/workspace/CrystalBio/dogfood-output/bloom-admin-team-field-visits-recheck.json`
- Recommended next step: Continue browser-level mobile UI QA for Sales/Service screens and retest BUG-20260615-001 after deploy confirmation.

### BUG-20260616-003 — Sales/Service Step 2 remains pending after saving on mobile

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: High
- User journey affected: Field-agent Sales/Service Step 2 completion and admin/report data correctness
- What the user likely experienced: The agent fills Step 2 details and taps Save Step 2, but the progress header and latest saved entry still say Step 2 is pending. This makes the form look incomplete even after the agent tried to finish that section.
- Steps to reproduce:
  1. Log in to `https://work.convogenie.ai` as `bloom.agent@crystalbio.in` on a mobile viewport.
  2. Open Visits, create a new Sales visit, allow location, fill Step 1, and save Step 1.
  3. Open Step 2, fill the visible fields, and tap Save Step 2.
  4. Repeat the same flow for a new Service visit.
- Expected result: After Save Step 2, the progress header and latest saved entry should show Step 2 as saved/completed for Sales and Service.
- Actual result: Sales and Service both continue to show `Step 2: Pending` after the Save Step 2 action. Step 3 can later show saved while Step 2 still remains pending.
- Evidence:
  - CDP result: `/root/workspace/CrystalBio/dogfood-output/bloom-mobile-ui-agent-cdp-v2-results.json`
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
  - Sales Step 3 after Step 2 attempt: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step3-saved.png`
  - Service Step 3 after Step 2 attempt: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step3-saved.png`
- Status: Verified by Bloom
- Approved by: Periwinkle, after Bloom evidence review
- Exact journey to fix: Field-agent Sales and Service Step 2 save completion/status on mobile and backend/admin visibility.
- What should happen after the fix: After Save Step 2, the progress header and latest saved entry should show Step 2 as saved/completed for Sales and Service, without changing the existing Step 1/2/3 route or visual direction.
- Restrictions: Smallest safe fix only. Do not redesign forms. Do not change Step 1 GPS behavior. Do not merge the bottom-nav or photo-control polish into this High bug unless required for the fix.
- Iris fix: Sales and Service Step 2 saves now persist an explicit saved/completed flag, and the progress header/latest saved entry read from that saved flag. Admin visit details also show Step 2/Step 3 status.
- Iris checks run: `npm test -- --run` passed with 10 files and 93 tests; `npm run build` completed on 2026-06-16.
- Bloom retest note: Latest live browser retest could not complete because current Bloom QA passwords were not available in the Periwinkle-run session.
- Bloom night retest result: Verified fixed on live mobile browser/API on 2026-06-16 15:36-15:39 UTC using assigned Bloom credentials. Sales and Service Step 2 saves now show `Step 2: Saved` in the progress header/latest saved entry, and backend/admin field-visits showed Step 2 status `Saved` and Step 3 status `Saved` for the earlier full Step 1/2/3 QA records.
- Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-heavy-qa-results.json`, `/root/workspace/CrystalBio/dogfood-output/bloom-night-service-attendance-results.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-sales-step2-saved-ui.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-service-step2-saved-ui.png`
- Recommended next step: Leave this as verified; handle saved-entry continuation separately under BUG-20260616-006.

### BUG-20260616-004 — Bottom navigation covers long Step 2 form fields on mobile

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Medium
- User journey affected: Field-agent Sales/Service long mobile forms
- What the user likely experienced: While filling long Step 2 forms, the fixed bottom navigation floats over form fields, making the lower fields harder to read and tap.
- Steps to reproduce:
  1. Log in as a field agent on mobile.
  2. Open a Sales or Service visit.
  3. Open Step 2 and scroll through the long form.
- Expected result: Bottom navigation should not hide active form content; there should be enough bottom padding or safe spacing.
- Actual result: The bottom navigation overlays form rows such as Email/Department on Sales Step 2 and Department on Service Step 2.
- Evidence:
  - Sales Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 2 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Periwinkle triage decision: Approved for Iris night fix
- Approved by: Periwinkle
- Status: Verified by Bloom
- Exact journey to fix: Long Sales/Service Step 2 mobile forms only.
- What should happen after the fix: Bottom navigation should not cover fields or save controls; users should be able to scroll to the end comfortably.
- Restrictions: Smallest safe spacing fix only. Do not redesign forms, navigation, Step 1/2/3 structure, or button styling.
- Bloom night retest result: Verified fixed on 2026-06-16 15:40 UTC. Sales and Service Step 2 forms could be scrolled to the bottom with the bottom navigation separated from the lower fields/actions.
- Evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-night-bottom-nav-retest.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-sales-step2-bottom-spacing.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-night-service-step2-bottom-spacing.png`
- Recommended next step: No Iris action needed unless a real user reports remaining overlap on a different device.

### BUG-20260616-005 — Photo Camera/Upload controls show squeezed native Choose File labels

- Time noticed: 2026-06-16 00:49 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-15.md`
- Severity: Low
- User journey affected: Field-agent Sales/Service photo/proof capture
- What the user likely experienced: The Camera and Upload controls are visible, but the browser's native `Choose File` text is squeezed into the custom buttons, making the polished mobile screen look unfinished.
- Steps to reproduce:
  1. Log in as a field agent on mobile.
  2. Open a Sales or Service visit.
  3. Scroll to the photo/proof area.
- Expected result: Camera and Upload controls should look like clean tappable mobile controls without overlapping native file-input text.
- Actual result: `Choose File` appears inside/over the Camera and Upload buttons.
- Evidence:
  - Sales Step 1 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-sales-step2-saved.png`
  - Service Step 1 screenshot: `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-mobile-v2-service-step2-saved.png`
- Periwinkle triage decision: Approved by Amrutha/Rahul for today’s polish pass on 2026-06-21.
- Status: Fixed and deployed live.
- Reason: The live app has been stable for one week with real employee usage and only minor issues, so this was handled as a focused polish item before moving into production-readiness/data work.
- Fix: Added proper hidden-file-input styling so the native file chooser text cannot appear inside the custom Camera/Upload labels; kept Sales/Service forms, photo flow, Step 1/2/3 structure, GPS rules, and saved-entry behavior unchanged.
- Verification: App tests passed 19/19; frontend build passed; backend build passed; live version `20260621025106` deployed; live API health OK; served CSS contains the hidden input rules; live Bloom QA agent browser check confirmed visible labels are only `Camera` and `Upload`, `Choose File` is absent, and browser console has 0 errors.
- Recommended next step: No Iris action needed unless a real user reports remaining photo-button overlap on a specific device.

### Testing/Bloom monitor failures — 2026-06-16 02:08 UTC

- Classification: Testing/Bloom failure, not confirmed real-user issue.
- Time noticed: 2026-06-16 01:52–01:57 UTC
- User journey affected: App screen error during test/automation run
- What happened: The app recorded “Allow location permission to save this field update.”
- Severity shown by app log: High
- Evidence: app-side error log showed HeadlessChrome/test automation user agent and unknown user.
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing; not approved for Iris.
- Reason: Evidence points to HeadlessChrome/test automation and unknown user, so this is not yet confirmed as a live-user product bug.
- Recommended next step: Bloom should keep it as monitoring evidence only unless a real account/path or repeatable user journey is found.



### Live user app error - 2026-06-16 10:08:39 UTC

- Time noticed: 2026-06-16 10:08:39 UTC
- User journey affected: App screen error
- What the user likely experienced: Allow location permission to save this field update.
- Severity: High
- Evidence: App-side user error log; user=unknown user, path=unknown path
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing
- Reason: The log does not identify the user or path, and the same message can come from a normal GPS-permission denial or Bloom automation. Do not approve a code fix until Bloom can reproduce it in a real user journey or the app logs show an affected account/path.
- Recommended next step: Bloom should continue watching live logs and try to attach account/path/journey evidence. Iris should not fix this entry yet.



### Live user app error - 2026-06-16 10:20:39 UTC

- Time noticed: 2026-06-16 10:20:39 UTC
- User journey affected: App screen error
- What the user likely experienced: Allow location permission to save this field update.
- Severity: High
- Evidence: App-side user error log; user=unknown user, path=unknown path
- Periwinkle triage decision: Needs more testing
- Status: Needs more testing
- Reason: Same as the 10:08 UTC entry: no confirmed user/path yet, and the message may be expected when location permission is denied.
- Recommended next step: Bloom should continue monitoring and add a new bug only if there is confirmed user impact or repeatable evidence.

### BUG-20260616-006 — Previous Sales entry opens as blank pending form instead of saved record

- Time noticed: 2026-06-16 15:35 UTC
- Source report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`
- Severity: High
- User journey affected: Agent Visits / saved Sales entry continuation
- What the user likely experienced: The previous entry list says the saved Sales record can be tapped to continue, but tapping it opens a blank pending Sales form. The user may think saved work disappeared or may create a duplicate visit.
- Steps to reproduce:
  1. Log in to `https://work.convogenie.ai` as `bloom.agent@crystalbio.in`.
  2. Open Visits.
  3. Tap saved previous entry `BLOOM-QA-NIGHT Sales 20260616-1781624021373`.
- Expected result: The saved Sales record opens with saved customer/details and Step 2/Step 3 completion status.
- Actual result: The Sales screen opens as a blank form with `Step 1: Pending • Step 2: Pending • Step 3: Pending` and empty fields.
- Evidence: Live mobile browser run on 2026-06-16; API/admin evidence confirms the record exists and has Step 2/Step 3 saved (`sales_189`, `sales_visit_194`). QA report: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16.md`.
- Periwinkle triage decision: Approved for Iris
- Approved by: Periwinkle
- Status: Verified by Bloom after deploy
- Iris fix: Previous Sales/Service entries now carry their saved record ID and reopen by filling the existing saved details/status into the Sales or Service form instead of opening a blank new form.
- Iris/Periwinkle checks run: full `npm test -- --run` passed with 11 files / 95 tests; `npm run build` and `npm run backend:build` passed on 2026-06-17 UTC.
- Deployment: deployed to live on 2026-06-17 00:27 UTC. Live frontend now serves version `20260616023405` and asset `index-DZSk2R0D.js`, which contains the saved-entry fix markers (`recordId`, `Step 2 status`, and the synced app version).
- Bloom post-deploy retest result: Passed on live mobile browser on 2026-06-17 00:30 UTC using only assigned Bloom QA credentials. A new Bloom-owned Sales saved entry and Service saved entry were created for the retest; tapping each previous-entry card reopened the saved record with Step 1/2/3 shown as saved instead of a blank pending form.
- Live pre-deploy/deployment-check evidence: `docs/qa-runs/QA_RUN_BLOOM_2026-06-16_BUG-20260616-006_RETEST.md`, `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-retest-evidence.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug-20260616-006-sales-retest-blank-pending.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug-20260616-006-service-regression-blank-pending.png`
- Exact journey to fix: Agent Visits / Previous entries continuation for saved Sales records. Tapping an existing saved Sales entry must reopen that saved record with its saved customer/details and Step 1/2/3 status, not a blank new pending form.
- What should happen after the fix: The saved Sales entry remains visible after refresh/re-login and opens as the same saved record for continuation. It must not create a duplicate record just because the user tapped an existing previous entry.
- Restrictions for Iris:
  - Make the smallest safe fix only.
  - Do not redesign the Visits page, Sales form, or Step 1/2/3 structure.
  - Do not change GPS rules, saved-status rules, admin reports, authentication, or role access unless strictly required for this bug.
  - Check whether Service previous-entry continuation has the same risk, but do not broaden the fix beyond saved-entry continuation.
  - Preserve the approved sage/olive mobile visual baseline.
  - Add/update a focused test if practical, then run real checks before marking ready for Bloom retest.
- Bloom retest request: Retest tapping saved Sales previous entries after refresh/re-login, verify the saved details/status are still shown, and do one quick Service previous-entry check for regression.
- Bloom night retest result: Failed on live mobile browser on 2026-06-16 21:06 UTC. Tapping the saved Sales previous entry still opened a blank pending Sales form instead of the saved record. Nearby Service regression also failed the same way, opening a blank pending Service form. Refresh returned to Home rather than preserving the opened saved record. No browser console errors were captured; live API health was OK, Bloom agent/admin logins worked, and admin `field-visits?scope=team` confirmed the same Sales/Service records exist with Step 2/Step 3 saved details.
- Latest evidence: `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260616-006-postdeploy-retest-live.json`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-postdeploy-sales-reopened.png`, `MEDIA:/root/workspace/CrystalBio/dogfood-output/screenshots/bloom-bug006-postdeploy-service-reopened.png`.
- Cleanup after retest: Bloom-owned QA Sales/Service/attendance rows were cleaned after dry-run/write backup; Bloom sessions were separately removed after dry-run/write backup. Post-clean live DB check: 0 Bloom Sales/Service rows and 0 Bloom sessions; API health OK.
- Bloom verdict: Verified fixed after deploy.

### Bloom cleanup — 2026-06-16/17

- Classification: QA cleanup task, not a product bug.
- What happened: Bloom created clearly named QA records for live save/visibility testing.
- Cleanup result: Completed after dry-run/write backup, limited to Bloom-owned QA Sales/Service/attendance rows and Bloom sessions only.
- Post-clean check: API health OK, 0 Bloom Sales/Service rows, 0 Bloom sessions.
- Status: Completed
- Recommended next step: Continue using the documented Bloom-only backup/dry-run/write path for any future QA cleanup. Do not guess-delete or hide real user records.

### BUG-20260617-007 — Admin checked-in card hid agents and lacked check-in/out times

- Time noticed: 2026-06-17 13:20 UTC
- Source report: Amrutha screenshot from Admin overview.
- Severity: High
- User journey affected: Admin overview attendance visibility and agent check-in communication.
- What the user experienced: The card said 7 checked in but the expanded list showed only 4 names, with no check-in/check-out times. This made attendance unclear and made repeated check-ins look possible/confusing.
- Root cause found: The Admin overview expanded metric was intentionally slicing details to the first 4 rows. It also showed only agent name/role, not the attendance timestamps already returned by the admin report.
- Fix: Admin overview now shows all attendance rows for the checked-in card, with each agent’s check-in time, check-out time or “Still checked in”, and a note when the same user has multiple sessions in the day. The agent check-in screen also now shows an “Already checked in” state and sends the user to Check out instead of presenting another check-in form.
- Verification: `npm test -- --run src/App.test.tsx src/crystalBioFrontendApi.test.ts` passed, `npm run build` passed, live frontend version `20260617132802` deployed, and live asset contains the attendance markers.
- Periwinkle triage decision: Approved for Iris; Iris completed approved work-mode persistence/display scope on 2026-06-17.
- Status: Deployed live; Bloom retest passed.
- Iris fix update: Check-in selected work modes now persist on attendance records and display in Admin overview attendance detail; older rows without mode show `Mode not recorded`.
- Verification: `npm test -- --run src/crystalBioFrontendApi.test.ts src/backend/crystalBioBackend.test.ts src/App.test.tsx`, full `npm test -- --run`, `npm run build`, and `npm run backend:build` passed on 2026-06-17. A follow-up live deployment/check on 2026-06-18 confirmed version `20260618013516`, API health OK, work-mode markers present, and `Latest submitted work` removed from Admin overview.
- Bloom retest request: Confirm the expanded checked-in card shows every checked-in agent, check-in time, check-out/Still checked in text, duplicate-session note when applicable, and the approved selected work-mode chip/`Mode not recorded` behavior. Also confirm the agent check-in screen does not encourage repeated check-ins.
- Previous Bloom retest result: Failed on live mobile/API on 2026-06-17 21:12-21:18 UTC before the follow-up live deploy. Admin names/times improved, but selected work modes did not persist/display, `Latest submitted work` was still visible, and the agent already-checked-in edge case still looked confusing.
- Latest Bloom retest result: Passed on live version `20260618013516` using assigned Bloom QA credentials. Admin expanded Checked in showed Bloom QA Agent, role, check-in time, `Still checked in`, and `Sales visit + Service visit + In office`; Admin overview no longer showed `Latest submitted work`; duplicate check-in was blocked with `Agent is already checked in`.
- Bloom evidence: latest passed report `docs/qa-runs/QA_RUN_BLOOM_2026-06-18_ATTENDANCE_ADMIN.md`; earlier failed evidence remains in `/root/workspace/CrystalBio/dogfood-output/bloom-bug-20260617-007-retest-live.json` and related screenshots.
- Console/API notes: Latest retest API health was OK. Bloom-created attendance rows were cleaned after dry-run/write backup path; post-clean check showed 0 Bloom attendance/Sales/Service rows.
