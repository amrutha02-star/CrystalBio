# Periwinkle Fix Re-audit — Bloom QA — 2026-07-03

- **Requested by:** Amrutha
- **Auditor:** Bloom QA
- **Time:** 2026-07-03 05:03 UTC / 10:33 IST
- **Question:** Periwinkle says she fixed the GitHub/project-control issues from the full-history audit. Re-audit whether that is true.
- **Scope:** GitHub `origin/main`, status docs, bug board, corrected QA tables/reports, live version/API, tests/build.
- **Boundary:** This is a re-audit of Periwinkle's fixes to the project trail. It is not a full fresh live UI journey retest and not a code fix.

## Short verdict

Periwinkle **did fix several of the project-control problems** from the full-history audit. The most important status contradictions are now much clearer, and GitHub is synced through the cleanup commit.

But it is **not fully fixed**. Some items are corrected only by adding clarifying notes, not by removing the original misleading lines. Some real product risks remain open: GPS/location is not accepted, real same-phone login persistence is still waiting, frontend maintainability is unchanged, React test warnings remain, and `npm audit` still reports a high-severity Nodemailer advisory.

## Current objective checks

| Check | Result | Evidence |
|---|---:|---|
| GitHub remote sync | Passed for Periwinkle cleanup | `origin/main` and local HEAD both at `0cdb56f docs: reconcile CrystalBio status truth` before Bloom's new local QA artifacts |
| Live API health | Passed | `{"status":"ok"}`, HTTP 200 |
| Live app version | Passed | `20260703033332`, HTTP 200 |
| GitHub source version | Passed | `origin/main:public/version.json` is `20260703033332` |
| Source/live version match | Passed | both `20260703033332` |
| Full tests | Passed | 11 files / 109 tests passed |
| Frontend build | Passed | `npm run build` exit 0 |
| Backend build | Passed | `npm run backend:build` exit 0 |
| Dependency audit | Failed | `nodemailer <=9.0.0` high severity advisory remains |
| Test warning noise | Still present | React `act(...)` warnings still appear during `src/App.test.tsx` |

## What Periwinkle fixed well

### 1. GitHub is no longer behind for the full-history audit/status cleanup

The previous full-history audit noted that Bloom's audit artifact was local/ahead because push was blocked. Current GitHub now includes:

- `670cc88 docs: add Bloom full-history GitHub audit`
- `75ce6e7 docs: add Periwinkle project-control cleanup plan`
- `0cdb56f docs: reconcile CrystalBio status truth`

**Verdict:** Fixed for the Periwinkle project-control cleanup batch.

### 2. Coordination status is much clearer

`docs/BOT_COORDINATION_STATUS.md` now gives a short, owner-facing truth summary:

- live app/API are up,
- current version is `20260703033332`,
- latest Bloom retest passed Field Entry search anti-zoom and admin detail/leave overlap,
- July 2 raw FAIL labels are classified as QA labeling errors,
- Bloom-created records were cleaned safely,
- GPS/location remains open/not accepted,
- same-phone login persistence remains open,
- no Critical/High routine daytime deploy is approved.

**Verdict:** Mostly fixed. This is much closer to what Amrutha asked for.

### 3. Bug board now tells the truer state for GPS/location

The prior contradiction was: the board said no live deploy, but the live app had location mitigation markers. Now `BUG-20260702-023` says:

- generic mitigation is deployed live in `20260703033332`,
- bad Chrome-specific copy was removed,
- issue is **Open / not accepted**,
- cross-browser/cross-phone testing is still required,
- recent-GPS reuse needs owner review.

**Verdict:** Fixed as a status-truth correction. Not fixed as a product issue.

### 4. Field Entry search anti-zoom status is corrected

`BUG-20260701-022` now says Bloom verified it live and it is waiting for Periwinkle/Rahul acceptance. The corrected journey table also marks it `PASS / waiting acceptance`.

**Verdict:** Fixed as a status-truth issue.

### 5. Admin submitted-form / Leave overlap status is corrected

`BUG-20260701-021` now includes the July 3 Bloom retest evidence and says it is verified by Bloom, waiting for acceptance.

**Verdict:** Fixed as a status-truth issue.

### 6. July 2 E2E false FAIL labels are explained

The corrected journey table now marks the relevant user journeys as pass evidence. The raw report also has a new `Periwinkle classification update` explaining that the five `FAIL` rows show successful API/backend evidence and should not be treated as confirmed product failures.

**Verdict:** Partly fixed. The owner-facing table is now correct, but the raw report still visually contains `FAIL` lines, so a reader can still be confused unless they read the later correction section.

### 7. A project-control cleanup plan now exists

New file added:

`docs/PERIWINKLE_PROJECT_CONTROL_CLEANUP_PLAN_2026-07-03.md`

It directly addresses:

- status truth cleanup,
- evidence cleanup,
- GPS/location recovery,
- maintainability containment,
- GitHub clean/push discipline.

**Verdict:** Good corrective plan. It prevents repeat mistakes if Periwinkle actually follows it.

## What is still not fixed

### 1. GPS/location is still open and not accepted

The docs now correctly say this, but the actual product risk remains. The fix/mitigation is not accepted until cross-device/cross-browser capture is tested and the business approves any recent-GPS reuse behavior.

**Status:** Not fixed, only clarified.

### 2. Real same-phone login persistence is still open

Automated bearer/session-cookie checks pass, but the real user problem is overnight/same-phone persistence on actual phones. The docs correctly keep this open.

**Status:** Not fixed/accepted yet.

### 3. Raw July 2 E2E report still contains misleading `FAIL` lines

Periwinkle added a correction section, which helps. But the raw report summary still says:

- Passed: 34
- Failed: 5

and the body still shows lines like `FAIL — Agent checks in...` even though the evidence is successful.

**Status:** Partly fixed. Better than before, but not fully owner-safe.

### 4. Frontend maintainability risk is unchanged

`origin/main:src/App.tsx` is still 4,149 lines and `src/styles.css` is about 2,900 lines. Periwinkle added a containment plan but did not reduce the risk yet.

**Status:** Not fixed; planned.

### 5. React test warnings remain

Full tests pass, but `src/App.test.tsx` still emits repeated React `act(...)` warnings.

**Status:** Not fixed. Not a launch blocker, but still noise.

### 6. Production dependency audit still fails

`npm audit --audit-level=moderate --omit=dev` reports:

- `nodemailer <=9.0.0`
- high severity advisory
- fix available via `npm audit fix --force`, but it is a breaking upgrade.

**Status:** Not fixed. Needs planned safe upgrade, not blind force fix.

### 7. Some older audit files are now historical but still contain stale findings

Files like `docs/qa-runs/GITHUB_AUDIT_BLOOM_2026-07-03.md` and `docs/qa-runs/DEEP_GITHUB_AUDIT_BLOOM_2026-07-03.md` still contain the earlier findings. That is acceptable as historical evidence, but the owner must read the newer coordination status/current table for the present truth.

**Status:** Acceptable if clearly treated as historical; still potentially confusing for a non-technical owner.

## Re-audit scorecard

| Original audit concern | Current status | Bloom judgment |
|---|---|---|
| GitHub audit/status artifacts not pushed | Fixed | GitHub has cleanup commits through `0cdb56f` |
| Bug board said GPS not deployed while live had mitigation | Fixed as status | Now says deployed mitigation, open/not accepted |
| Field Entry search bug stale | Fixed | Now verified by Bloom, waiting acceptance |
| Admin submitted-form/Leave overlap lacked Bloom retest status | Fixed | Now verified by Bloom, waiting acceptance |
| July 2 E2E false FAIL labels | Partly fixed | Corrected table + note added, but raw FAIL lines remain |
| One simple current owner-facing truth | Mostly fixed | Coordination status is much better |
| GPS/location product risk | Not fixed | Still open/not accepted |
| Same-phone login persistence | Not fixed | Still waiting real phone acceptance |
| Frontend monolith | Not fixed | Plan only |
| React test warning noise | Not fixed | Warnings still appear |
| Dependency/security advisory | Not fixed | Nodemailer high advisory remains |

## Final owner-facing answer

Periwinkle **did fix the messy status trail much better than before**. GitHub is now synced, the bug board is more truthful, the corrected journey table is better, and there is now a clear project-control cleanup plan.

But I would not say “all fixed.” I would say:

> **Periwinkle fixed the documentation/status-control part mostly, but the real product-risk items are still open. GPS/location and real same-phone login persistence still need proper verification/acceptance.**

## Recommended next action

1. Do not approve another broad fix yet.
2. Ask Periwinkle to keep the current coordination status as the owner-facing truth.
3. Have Bloom do the next live GPS/location retest path before accepting BUG-20260702-023.
4. Keep same-phone login persistence open until a real iPhone/Android overnight check is accepted.
5. Later, schedule a safe backend/security hardening pass for Nodemailer and the backend findings from Bloom's backend strategy audit.


## Periwinkle follow-up update — after backend hardening commit

This re-audit was accurate when Bloom wrote it, but part of it is now historical because Periwinkle completed the next backend hardening batch afterward.

Current updates:

| Re-audit finding | Current status after Periwinkle follow-up |
|---|---|
| Dependency audit / Nodemailer high advisory | **Source-fixed and pushed** in commit `0b9a16f`; `npm audit --audit-level=moderate --omit=dev` now reports 0 vulnerabilities. |
| Backend strategy audit findings | **Source-fixed and locally verified** for role boundary, GPS coordinate bounds, reset/session invalidation, duplicate visit matching, and secure setup/session token generation. Not live-deployed or Bloom-accepted yet. |
| Raw July 2 report still contains misleading `FAIL` lines | **Corrected in place**: the five mislabeled rows now read `PASS` with correction notes, and the summary says 0 confirmed product failures. |
| GPS/location real phone capture | Still open / not accepted. Backend coordinate bounds are fixed in source, but this does not close the phone/browser capture issue. |
| Same-phone daily login persistence | Still open until real iPhone/Android overnight acceptance. |
| Frontend maintainability / React test warnings | Still open; not part of the backend hardening fix. |

Verification after follow-up:

- Targeted backend/API tests: 40/40 passed.
- Full test suite: 115/115 passed.
- Backend build: passed.
- Frontend build: passed.
- Production dependency audit: 0 vulnerabilities.
- Live API remains up and live app version remains `20260703033332`.

Current truthful label: **backend audit items are source-fixed and pushed, but not live-deployed or accepted. GPS phone capture and same-phone overnight login remain open.**
