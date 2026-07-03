# Backend Logic and Strategy Challenge Audit — Bloom QA

- **Date:** 2026-07-03
- **Time:** 04:54 UTC / 10:24 IST
- **Tester:** Bloom QA bot
- **Scope:** CrystalBio backend source, API contract, persistence layer, backend tests, full test/build result, and live read-only health/version checks.
- **Environment:** Local repo `/root/workspace/CrystalBio`, live API health `https://work-api.convogenie.ai/health`, live app version `https://work.convogenie.ai/version.json`.
- **Boundary:** Audit/challenge only. Bloom did not fix backend code and did not write to live production data.

## Executive verdict

Periwinkle has done a lot of useful backend work: the backend has real route handling, session validation, admin checks, JSON persistence, PDF report generation, monitoring logs, backup scripts, and a passing automated test suite. The current code is not careless or empty.

But if I challenge it as a production/pilot backend, I would **not call it fully well-built yet**. It is a strong prototype/pilot backend with several important business-rule and hardening gaps that Periwinkle should address before treating it as a robust long-term backend.

## What I verified

| Check | Result | Evidence |
|---|---:|---|
| Backend-focused test suite | Passed | 7 files / 55 tests passed |
| Full project test suite | Passed | 11 files / 109 tests passed |
| Backend TypeScript build | Passed | `npm run backend:build` exit 0 |
| Frontend production build | Passed | `npm run build` exit 0 |
| Live API health | Passed | `{"status":"ok"}`, HTTP 200 |
| Live app version | Passed | `20260703033332`, HTTP 200 |
| Production dependency audit | Failed | `nodemailer <=9.0.0` high severity advisory |

## Backend map

| Area | Current implementation |
|---|---|
| Core business model | `src/backend/crystalBioBackend.ts` contains users/sessions, attendance, sales, service, leave, reports |
| API contract | `src/backend/crystalBioApi.ts` routes auth, attendance, leave, sales, service, admin agents, admin reports, field visits, monitoring logs |
| HTTP server | `src/backend/crystalBioHttpServer.ts` wraps API, CORS, JSON body limit, health endpoint, report PDF downloads, session cookie |
| Persistence | `src/backend/crystalBioPersistence.ts` stores state in a JSON file with temp-file rename and `.bak` backup |
| Persistent app | `src/backend/crystalBioPersistentHttpApp.ts` saves after successful POST/PATCH |
| Live logs | `src/backend/crystalBioClientErrorLogStore.ts` stores client-error and login-activity logs as JSONL |
| Scripts | Backup, monitoring, cleanup, inventory, attendance repair, staging/migration rehearsal scripts exist |
| Test coverage | 109 full tests; backend route/core tests cover many normal and edge paths |

## Good work found

1. **Real route/auth boundaries exist.** Public API blocks agent-id login and requires email/password at `/auth/login`.
2. **Admin-only routes are protected.** Non-admin admin report/leave review paths are blocked.
3. **Saved-session validation is not just frontend trust.** `/auth/session` checks the live backend session and active user.
4. **Field entries are scoped.** `/field-visits?scope=team` is admin-wide; agents only see own/owned entries.
5. **Large Field Entry photo payloads were reduced.** List responses exclude heavy photo payload by default.
6. **Reports/PDFs are real backend responses.** Admin and agent PDF endpoints exist and are tested.
7. **JSON writes are safer than simple overwrite.** Save uses temp file + rename and creates `.bak` backup.
8. **Live monitoring hooks exist.** Client errors and login activity are captured without storing form contents/passwords.

## Confirmed backend findings

### BUG-20260703-024 — Backend allows service users to create Sales records and sales users to create Service records

- **Severity:** High
- **Journey and scenario:** Role correctness / backend API authorization. A service-only user should not create Sales opportunities, and a sales-only user should not create Service records.
- **Steps to reproduce:**
  1. Create/login a service-only user.
  2. Call `POST /sales-opportunities` with that service user's token.
  3. Create/login a sales-only user.
  4. Call `POST /service-records` with that sales user's token.
- **Expected result:** Backend rejects wrong-role create attempts, ideally `403` or clear role validation error.
- **Actual result:** Both wrong-role creates succeeded with HTTP `201`.
- **Evidence:** Targeted local API challenge output:
  - `serviceCreatesSales.status = 201`, created `sales_7`
  - `salesCreatesService.status = 201`, created `service_8`
- **Launch/pilot impact:** Does not prove the UI currently exposes the wrong buttons, but backend should not rely only on UI hiding. This can cause incorrect business data if a session/account role is wrong or a request is sent directly.
- **Blocks launch/pilot:** Not a full outage, but **High** for role correctness and data trust.

### BUG-20260703-025 — GPS validation accepts impossible latitude/longitude values

- **Severity:** High
- **Journey and scenario:** Attendance / Sales / Service location correctness. Field visit saves require current GPS.
- **Steps to reproduce:**
  1. Create a Sales opportunity.
  2. Save a Sales visit with GPS `{ latitude: 999, longitude: 999 }`.
- **Expected result:** Backend rejects invalid GPS outside real-world ranges: latitude must be between `-90` and `90`; longitude between `-180` and `180`.
- **Actual result:** Save succeeded with HTTP `201`.
- **Evidence:** Targeted local API challenge output: `invalidGpsVisit.status = 201`, created `sales_visit_10`.
- **Launch/pilot impact:** High because GPS is a core compliance/business rule. The backend currently checks only “finite number,” not “real coordinate.”
- **Blocks launch/pilot:** Should be fixed before GPS/location bug is accepted as truly solved.

### BUG-20260703-026 — Password reset/setup can reactivate an old session token

- **Severity:** High
- **Journey and scenario:** Login/session security. A user requests a new password link, old session is rejected while pending, then after setting the new password the old token becomes valid again.
- **Steps to reproduce:**
  1. Login as a user and keep the old token.
  2. Request a password setup/reset link.
  3. Verify old token is rejected while user is inactive/pending.
  4. Complete password setup.
  5. Try the old token again.
- **Expected result:** Old token should stay invalid after reset/setup. Password reset should invalidate previous sessions.
- **Actual result:** Old token became valid again after setup.
- **Evidence:** Targeted local API challenge output:
  - `oldSessionAfterRequestLink.status = 401`
  - `setupPassword.status = 200`
  - `oldSessionAfterNewPassword.status = 200`, returned `Reset User`
- **Launch/pilot impact:** High security/session hygiene risk, especially if a phone is lost or a password reset is used to regain control.
- **Blocks launch/pilot:** Not a current user-visible outage, but should be treated as security hardening before broader rollout.

### BUG-20260703-027 — Duplicate-save logic ignores visit time and may collapse real separate visits

- **Severity:** Medium
- **Journey and scenario:** Sales/Service repeated field visits. A field agent can visit the same customer twice in one day with similar notes/status at different times.
- **Steps to reproduce:**
  1. Save a Sales visit with date `2026-07-03`, time `11:00`, note `Same content`, next action `No follow-up`.
  2. Save another Sales visit to the same opportunity with date `2026-07-03`, time `15:00`, same note, same next action.
- **Expected result:** Backend records two visit updates because the time is different.
- **Actual result:** The second save returned the first visit ID and did not create a second visit.
- **Evidence:** Targeted local API challenge output:
  - `firstValidVisit.id = sales_visit_11`
  - `sameContentDifferentTime.id = sales_visit_11`
  - The created visit count did not increase for the second different-time save.
- **Launch/pilot impact:** Medium. This prevents accidental double-tap duplicates, which is good, but the matching rule is too broad and can hide real repeated visits.
- **Blocks launch/pilot:** No, but needs business-rule refinement.

## Strategic risks / not necessarily immediate bugs

### 1. JSON file persistence is still a pilot backend, not a durable production database

The docs already admit this, and the code confirms it. JSON persistence has temp-file rename and `.bak`, which is good, but it still has no database transactions, row-level locking, migration history, indexed queries, or multi-process concurrency safety.

**Risk:** As real data/photo volume grows, this can become fragile. Postgres/Supabase/Firebase or another managed DB should remain the strategic path.

### 2. Passwords are stored as plain strings in backend state

The backend compares `candidate.password === credentials.password`, and the JSON state includes password/passcode fields.

**Risk:** Acceptable only as temporary pilot mechanics. For real production, passwords must be hashed and session tokens should be more secure/random.

### 3. Invite tokens use `Math.random()`

`createInviteToken` uses `Math.random().toString(36)`. This is not cryptographically strong.

**Risk:** Invite/setup links should use `crypto.randomBytes` or equivalent before broader rollout.

### 4. Multiple open attendance rows can exist by design after missed checkout

The backend allows a next-day check-in even if yesterday remains `checked_in`; separate repair/cron is expected to auto-close missed checkout rows. That matches the approved business direction, but it means attendance correctness depends on the nightly repair automation working.

**Risk:** If cron fails, admin “checked in” and attendance reports can drift again.

### 5. Production dependency audit currently flags Nodemailer

`npm audit --audit-level=moderate --omit=dev` returned one high-severity issue:

- `nodemailer <=9.0.0`
- Advisory: message-level raw option can bypass `disableFileAccess/disableUrlAccess`, enabling arbitrary file read / SSRF in delivered message.
- Fix: `npm audit fix --force` would install `nodemailer@9.0.3`, marked as breaking.

**Risk:** This needs a planned safe upgrade, not a blind force fix during live use.

## Test gaps I would add

1. Wrong-role API tests:
   - service-only user cannot create Sales opportunity/visit.
   - sales-only user cannot create Service record/visit.
   - `both` can access both if that is the approved rule.
2. GPS boundary tests:
   - reject latitude > 90 / < -90.
   - reject longitude > 180 / < -180.
   - reject unrealistic accuracy if CrystalBio wants accuracy limits.
3. Password reset/session invalidation tests:
   - old tokens remain invalid after setup/reset completion.
4. Duplicate visit tests:
   - same exact double-tap within a small window returns existing row.
   - different time / materially different visit creates a new row.
5. Attendance cron dependency tests:
   - stale open attendance is closed by repair script after midnight IST.
   - admin active-now count ignores old still-open rows if cron fails.
6. Persistence race/recovery tests:
   - concurrent writes or two app instances cannot silently lose records.
   - corrupt JSON fallback emits loud monitoring alert, not only `.corrupt` file.
7. Security hardening tests:
   - setup/invite tokens are not exposed except in explicitly admin-only setup response.
   - inactive users' old sessions are removed, not only temporarily rejected.

## Plain-English answer to Amrutha's question

Periwinkle has done real backend work and much of it is correct. The app is not fake: tests pass, live health is OK, and backend routes/persistence/reports exist.

But the backend is still too prototype-like in some important places. The biggest issues are role enforcement, GPS validation, password-reset session safety, and the fact that the live backend still depends on JSON-file persistence plus repair scripts instead of a proper database.

My QA verdict: **Periwinkle has done a useful foundation, but should not claim the backend is fully production-strong yet. It needs a focused hardening pass before CrystalBio depends on it long-term.**

## Recommended next steps for Periwinkle/Iris

1. Periwinkle should review and classify BUG-20260703-024 through BUG-20260703-027.
2. Iris should not fix until Periwinkle/Rahul approves the specific items.
3. If approved, fix in this order:
   1. GPS bounds validation.
   2. Password reset/session invalidation.
   3. Role-specific backend enforcement.
   4. Duplicate visit matching rule refinement.
4. Keep Postgres/managed database migration as a strategic priority after pilot stability.
5. Upgrade Nodemailer safely with tests/build, not as an unreviewed force fix.
