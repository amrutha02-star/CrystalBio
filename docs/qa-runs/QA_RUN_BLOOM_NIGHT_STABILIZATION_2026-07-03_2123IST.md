# Bloom Nightly Stabilization QA — 2026-07-03 21:23 IST

Environment: live app `https://work.convogenie.ai`, live API `https://work-api.convogenie.ai`  
Live version checked: `20260703033332`  
Tester: Bloom QA only, using `bloom.admin@crystalbio.in` and `bloom.agent@crystalbio.in` from the assigned credential file.

## Owner summary

- Live app and live API are up.
- Login, wrong/empty login validation, saved-session restore after refresh, role guard, Sales/Service API Step 1/2/3 save, saved entries after refresh/re-login, Admin Field Entry/Agents/Approvals/Reports/Profile, and Agent/Admin PDFs passed.
- No new Critical/High launch-blocking bug was confirmed tonight.
- The existing GPS/location issue is still not accepted: in the live browser check, tapping `Use current location` on attendance showed `Location could not be captured...`, while typed details stayed preserved.
- Bloom-created Sales/Service/attendance/leave records were removed through the documented Bloom-only dry-run/backup/write/restart/verification sequence. No real-user records were cleaned.

## Evidence

- API journey JSON: `dogfood-output/bloom-e2e-user-journey-2026-07-02-2026-07-03T15-34-49-674Z.json`
- Cleanup backup: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-03T15-45-23-520Z.bak`
- Live API health after backend restart: `{"status":"ok"}`
- Post-clean live verification: Bloom own field visits `0`, Bloom team rows `0`, Bloom leave rows `0`, Bloom current attendance `null`.

## Scope covered

| Journey | Scenario | Expected | Actual | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Live availability | Open API health and live app shell | API OK and app loads | API returned OK; app shell loaded; version `20260703033332` | Pass | API run steps 2-4 | Continue monitoring |
| Login/session | Admin/agent login, wrong password, empty login, bearer session restore, bad session rejection | Correct users enter; invalid logins blocked; saved session restores | Passed. Browser refresh restored Bloom agent session; direct invalid session returned 401 | Pass | API steps 5-11; browser refresh check | Same-phone overnight acceptance remains open under BUG-20260624-018 |
| Attendance | Current status, check-in, repeated check-in, refresh/current, admin visibility, checkout/re-check | Attendance persists and duplicate check-in is blocked clearly | API flow passed. Browser attendance location capture failed in this environment before visible UI check-in | Pass for API / Known issue for GPS UI | API steps 12-16, 37-38; browser attendance snapshot | Keep BUG-20260702-023 open for real phone/browser GPS capture |
| Sales Step 1/2/3 | Create Sales visit with GPS, save Step 2 and Step 3, reopen saved entry | Save persists and reopens with completed steps | Passed. API returned created records with HTTP 201/200; saved detail reopened with Step 2/3 saved. Earlier script labels expecting only 200 were treated as harness mismatch, not product failure | Pass | API steps 17-20, 24-27; browser saved-entry reopen | None |
| Service Step 1/2/3 | Create Service visit with GPS, save Step 2 and Step 3, reopen saved entry | Save persists and reopens with completed steps | Passed. API returned created records with HTTP 201/200; saved detail reopened with Step 2/3 saved | Pass | API steps 21-27; browser Visits list | None |
| Saved entries after refresh/re-login | Agent own entries and Admin All entries after save | Bloom Sales/Service rows visible before cleanup; not visible after cleanup | Passed before cleanup; post-clean verification shows 0 Bloom rows | Pass | API steps 24-29; post-clean verification command | None |
| Agent report PDF | Attendance, Visit, Combined PDFs | Real PDF response scoped to Bloom agent | Passed; each response was `application/pdf` and started with `%PDF` | Pass | API steps 31-33; browser Reports screen | Waiting Periwinkle/Rahul acceptance from existing queue |
| Admin overview/live refresh | Admin overview after login and after saved data | Admin can see current counts and Bloom test rows before cleanup | Passed in browser; Overview showed live counts and Bloom rows before cleanup | Pass | Browser admin overview snapshot | None |
| Admin Field Entry | My entries, All entries, search/list, saved detail | Field Entry loads, All entries show saved rows, search control visible | Passed; All entries showed 10 of 30 and Bloom test Sales/Service before cleanup | Pass | Browser Field Entry snapshot | None |
| Agents | Team status list and profile/access basics | People/team visibility loads separately from submitted forms | Passed; Agents list showed attendance/work-mode status and profile list opened | Pass | Browser Agents/Profile snapshots | None |
| Approvals | Leave request creation/review | Bloom leave appears and can be reviewed | Passed before cleanup; Bloom leave rejected for evidence then cleaned | Pass | API steps 28-30; browser Approvals snapshot | None |
| Reports/PDF | Admin Reports screen and admin PDF | Download endpoint returns real PDF | Passed via API; browser Reports screen showed compact controls and Download PDF | Pass | API step 34; browser Reports snapshot | None |
| Profile/logout | Admin profile and logout | Profile owns logout and access list | Passed; logout returned to Login | Pass | Browser Profile/logout snapshots | None |
| Mobile layout/back behavior | Phone-sized browser, Visit saved-entry detail, browser Back | Layout stayed phone-first. Browser Back from an agent saved-entry detail returned to the login screen in this test history, but refresh immediately restored the saved Bloom session | Needs review / not filed as new bug tonight | Browser back/reload check | Retest on clean real-phone history before filing |
| Console/API errors | Check browser console and failed actions | No runtime crash during normal admin/agent navigation | No console messages during admin navigation. After GPS failure, one blank JS exception was recorded without visible crash | Known GPS-area signal | Browser console checks | Track under BUG-20260702-023 unless repeated outside GPS path |

## Cleanup record

1. Dry-run command: `CRYSTALBIO_DB_PATH=/var/lib/crystalbio/crystalbio-db.json npm run clean:pilot-data -- --bloom-only`
2. Dry-run matched only Bloom-owned rows: 1 attendance, 1 Sales record/visit, 1 Service record/visit, 1 leave request; 0 sessions.
3. Safe write sequence used: stopped `crystalbio-backend.service`, ran Bloom-only `--write`, restarted `crystalbio-backend.service`.
4. Backup created: `/var/lib/crystalbio/crystalbio-db.json.pre-clean-2026-07-03T15-45-23-520Z.bak`.
5. Live API health recovered to OK after restart.
6. Post-clean live API check: Bloom own field visits `0`, Bloom team rows `0`, Bloom leave rows `0`, Bloom current attendance `null`.

## Bugs / next action

- No new Critical/High bug added from this run.
- Keep BUG-20260702-023 open: location capture still needs real Android Chrome, Samsung Browser, iPhone Safari, iPhone Chrome, and home-screen/PWA verification before acceptance.
- Keep BUG-20260624-018 open for real same-phone overnight login acceptance, even though this run’s refresh/session restore passed.
