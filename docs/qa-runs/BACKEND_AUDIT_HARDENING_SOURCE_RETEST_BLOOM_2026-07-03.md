# Backend Audit Hardening Source Retest — Bloom QA — 2026-07-03

- **Requested by:** Amrutha / Periwinkle update
- **Tester:** Bloom QA
- **Time:** 2026-07-03 06:09 UTC / 11:39 IST
- **Commit checked:** `23d4126 docs: resolve re-audit follow-up items`, containing backend hardening commit `0b9a16f Fix backend audit hardening findings`
- **Scope:** Source-level retest of Bloom backend audit findings BUG-20260703-024 through BUG-20260703-027, plus dependency audit and build/test gates.
- **Boundary:** Source retest only. Bloom did not deploy live and did not write production data.

## Short verdict

Bloom confirms the backend hardening findings are **fixed in source and passing local/source verification**.

Update from 2026-07-03 09:35 UTC / 15:05 IST: Bloom rechecked after Amrutha reported that GitHub and backend were fixed. GitHub is now clean and synced with `origin/main` at `253f5f9 docs: record Bloom backend hardening source retest`; the backend source checks still pass.

This is not live acceptance yet. The live app/API are still up, but Bloom has not confirmed a live deploy of these backend hardening code paths through production user journeys. These items should stay as: **source-fixed + Bloom source-retested, GitHub synced, waiting for safe deploy/live retest before acceptance.**

## Verification summary

| Check | Result |
|---|---:|
| GitHub sync | Passed — local and `origin/main` at `23d4126` |
| Claimed hardening commit present | Passed — `0b9a16f Fix backend audit hardening findings` is in history |
| Targeted backend/API tests | Passed — 40/40 |
| Full test suite | Passed — 115/115 |
| Backend build | Passed |
| Frontend build | Passed |
| Production dependency audit | Passed — 0 vulnerabilities |
| Live API health | Passed — HTTP 200 / `{ "status": "ok" }` |
| Live app version | Still `20260703033332` |

Note: full tests still show existing React `act(...)` warning noise. Tests pass, but the warning cleanup remains a separate low/medium quality item.

## Bloom targeted probe results

Bloom ran a direct backend/API challenge script against the current source.

### BUG-20260703-024 — Wrong-role Sales/Service backend saves

| Scenario | Expected | Actual |
|---|---|---|
| Service-only user creates Sales record | Block | `400 Sales access is required` |
| Sales-only user creates Service record | Block | `400 Service access is required` |
| Both-role user creates Sales | Allow | `201`, created Sales record |
| Both-role user creates Service | Allow | `201`, created Service record |

**Bloom retest verdict:** Source fix passed.

### BUG-20260703-025 — Impossible GPS values

| Scenario | Expected | Actual |
|---|---|---|
| Attendance check-in with `{999,999}` | Block | `400 Valid GPS latitude and longitude are required` |
| Sales visit with `{999,999}` | Block | `400 Valid GPS latitude and longitude are required` |
| Service visit with `{999,999}` | Block | `400 Valid GPS latitude and longitude are required` |

**Bloom retest verdict:** Source fix passed.

Important: this validates coordinate bounds only. It does **not** close the wider live mobile GPS capture issue BUG-20260702-023.

### BUG-20260703-026 — Old session after password reset/setup

| Scenario | Expected | Actual |
|---|---|---|
| Old token before reset | Valid | `200 Reset User` |
| Old token immediately after reset invite | Invalid | `401 Login session is required` |
| Old token after new password setup | Still invalid | `401 Login session is required` |
| New password login | Works | `200 Reset User` |

**Bloom retest verdict:** Source fix passed.

### BUG-20260703-027 — Duplicate visit matching

| Scenario | Expected | Actual |
|---|---|---|
| First Sales visit | Create | `sales_visit_11` |
| Exact duplicate resubmit | Dedupe | returned same `sales_visit_11` |
| Same day / same note / different time | Separate real visit | created `sales_visit_12` |
| Final visit count | 2 | 2 |

**Bloom retest verdict:** Source fix passed.

### Token hardening

Session token shape now matched crypto-random pattern:

`session_2fxwkWnYBSaDpUPnZwkgCdA5PmWP0Lqu`

**Bloom retest verdict:** Source check passed.

## Dependency/security audit

`npm audit --audit-level=moderate --omit=dev` now reports:

`found 0 vulnerabilities`

Nodemailer is now:

- `package.json`: `^9.0.3`
- `package-lock.json`: `9.0.3`

**Bloom retest verdict:** Passed.

## Status classification

| Bug | Bloom source retest status | Live/acceptance status |
|---|---|---|
| BUG-20260703-024 role enforcement | Passed | Not live-accepted yet |
| BUG-20260703-025 GPS coordinate bounds | Passed | Not live-accepted yet |
| BUG-20260703-026 reset/session invalidation | Passed | Not live-accepted yet |
| BUG-20260703-027 duplicate visit matching | Passed | Not live-accepted yet |

## What remains open

1. These backend audit fixes still need a safe deploy/live retest before final acceptance.
2. Wider mobile GPS capture issue BUG-20260702-023 remains open and is not closed by coordinate validation.
3. Real same-phone overnight login persistence BUG-20260624-018 remains open until real-device acceptance.
4. React test warning noise remains.

## Owner-facing answer

Periwinkle's backend hardening fixes are **real and correctly targeted in source**. Bloom re-ran the challenge checks and they now pass.

But because Periwinkle did not deploy them live yet, the correct business status is:

> **Source-fixed and Bloom source-retested. Waiting for safe deploy and live retest before acceptance.**
