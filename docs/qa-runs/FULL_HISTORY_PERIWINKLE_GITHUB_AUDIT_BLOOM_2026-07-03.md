# Full-History Periwinkle / CrystalBio GitHub Audit — 2026-07-03

Auditor: Bloom QA  
User request: audit whether Periwinkle has done CrystalBio GitHub work rightly, from the beginning until today.  
Period audited: first tracked commit on 2026-06-07 through 2026-07-03.  
Repository: `/root/workspace/CrystalBio` / `https://github.com/amrutha02-star/CrystalBio`  
Live app: `https://work.convogenie.ai`  
Live API: `https://work-api.convogenie.ai`

## Scope actually covered

This is the full historical audit Amrutha asked for, not only the latest location fix.

I checked:

- 236 commits from first commit `8ee521c` through current local audit commit.
- 153 tracked files in the current GitHub tree.
- 75 docs files.
- 31 QA reports under `docs/qa-runs` on GitHub, plus the local Bloom audit reports created today.
- 53 current source/script/public files.
- Source-of-truth instructions: `AGENTS.md`, README live notes, DESIGN baseline, Bloom/Periwinkle/bug-board docs.
- Main app source: `src/App.tsx`, `src/crystalBioFrontendApi.ts`, backend API/server/persistence/report code, scripts, monitoring/cleanup scripts.
- Current build/test/live state.

This was a repo/history/docs/source audit. It was not a fresh manual retest of every phone journey on real devices.

## Executive verdict

Periwinkle has done **a large amount of useful work**, and the current app is not in a broken technical state. But Periwinkle has **not done the work cleanly enough across the whole project**.

The strongest pattern is:

- fast building/fixing/deploying happened,
- many issues were later verified and documented,
- but status discipline, QA clarity, and release-control hygiene lagged behind the speed of changes.

So my final answer is:

**Periwinkle did the technical build mostly right, but did not manage the project trail fully right.**

## Current objective checks

| Check | Result |
|---|---|
| Live API health | Passed: `/health` returned `{ "status": "ok" }` |
| Live app version | Passed: `20260703033332` |
| GitHub source version | Passed: `origin/main:public/version.json` is `20260703033332` |
| Source/live version match | Passed |
| Automated tests | Passed: 11 test files / 109 tests |
| Frontend build | Passed |
| Backend build | Passed |
| Basic added-line security scan | No obvious hardcoded secret / injection / eval finding in recent diff |
| Current local state | One local Bloom audit commit is ahead of GitHub because push is blocked by missing GitHub HTTPS credentials |

## Historical timeline and judgment

### Phase 1 — Requirements and prototype foundation, 2026-06-07

Evidence:

- First commit: `8ee521c docs: add field agent platform requirements`.
- Early docs for field-agent requirements, design system, QA workflow, and pre-backend QA.
- Prototype included mobile-first home, check-in/out preview, Sales visit, Service visit, and initial backend foundation.

Judgment: **Mostly good.**

Periwinkle started with requirements and design docs instead of only code. This was right. The design baseline was also captured early in `DESIGN.md`, which later helped stop redesign drift.

Risk / weakness:

- Early product was demo/prototype-heavy, which is normal for start, but later needed stronger production discipline.

### Phase 2 — Heavy rapid UI/admin/report iteration, 2026-06-08 to 2026-06-09

Evidence:

- 98 commits on 2026-06-08 and 42 commits on 2026-06-09.
- Many `deploy:` commits for mobile UI, progressive forms, admin screens, reports, profiles, and visual polish.
- QA reports from 2026-06-08: API layer, server persistence, frontend/backend connection, client demo readiness, testing hardening.

Judgment: **Productive, but too fast/risky for long-term maintainability.**

Good:

- Core app journeys were rapidly built.
- Backend layer and persistence were introduced early.
- Admin/report concepts were added.
- QA reports existed from early phases.

Not good:

- There were many deploy commits in a short time, suggesting churn.
- Several historical reports still mention demo/fixed/future-hardening limitations.
- The UI accumulated into a very large `src/App.tsx` file, now over 4,100 lines.

### Phase 3 — Pilot hardening and live backend readiness, 2026-06-10 to 2026-06-14

Evidence:

- Monitoring docs added.
- Admin report PDF endpoint added.
- Production auth/hardening commits.
- Email sign-in/setup links, persistence, backups, photo handling, saved visits, home-screen install, pilot docs.
- README says backend persistence, backup recovery, real login, admin reports, PDF download, and production settings exist.

Judgment: **Good direction, with complexity risk.**

Good:

- Periwinkle added real backend authentication and protected admin access.
- Backup and monitor docs/scripts exist.
- PDF reporting became real rather than only visual.
- Saved field entries visibility was improved.

Not good:

- The codebase started concentrating too much logic in a small number of large files.
- Some demo/static artifacts remain tracked at repo root: `check-in-flow.html`, `sales-flow.html`, `service-flow.html`, `admin-reports-one-flow.png`, etc. These are not necessarily harmful, but they make repo hygiene less clean.

### Phase 4 — Bloom/launch-week QA and bug process, 2026-06-15 to 2026-06-21

Evidence:

- Bloom/QA monitoring workflow added.
- Bug board grew into the main launch-week record.
- Multiple Bloom QA reports from 2026-06-15 through 2026-06-21.
- Issues found and retested: login Enter/Go, saved visit continuation, attendance/work mode, Field Entry clickable rows, report/PDF improvements, cleanup safety.
- `docs/BUG_INTAKE_BOARD.md` records approval gates and many fixes/retests.

Judgment: **Much better QA discipline, but it came after several misses.**

Good:

- Bloom started finding real bugs.
- Many bugs were not accepted until retested.
- The board distinguishes Bloom, Periwinkle, Iris, and approval gates.
- QA cleanup rules became stricter after mistakes.

Not good:

- Several bugs had to be retested multiple times because live deploy/source state did not match claimed fixes.
- Some QA cleanup lessons were learned after Bloom test data remained visible.
- The bug board is now very large and sometimes stale, making it hard for a non-technical owner to know current status.

### Phase 5 — Post-launch stabilization and live-user corrections, 2026-06-23 to 2026-06-24

Evidence:

- Admin back/navigation and mobile zoom fix.
- Admin refresh and agent report PDF fix.
- Bloom post-deploy QA reports.
- Refresh/PDF live deploy docs.

Judgment: **Good fixes, but still reactive.**

Good:

- Real live app issues were being corrected.
- Bloom post-deploy QA was done.
- Build/test/live version checks were recorded.

Not good:

- The need for repeated live checks shows earlier “done” claims were not always enough.
- Periwinkle had to add stricter repo hygiene rules later, indicating earlier GitHub/deploy discipline was insufficient.

### Phase 6 — July status, user-journey correction, and location issue, 2026-07-01 to 2026-07-03

Evidence:

- GitHub hygiene rule added to `AGENTS.md` and Periwinkle instructions.
- Field Entry search input zoom fix.
- Admin submitted-form / Leave overlap fix.
- Bloom 2:30 retests and night stabilization reports.
- Amrutha corrected the QA standard: she wanted real user journeys, not screen inventory / long PDF.
- Location issue added as `BUG-20260702-023`.
- Latest live source version: `20260703033332`.

Judgment: **The strongest current weakness is status discipline.**

Good:

- The user’s correction about real journey QA was written into durable docs.
- GitHub hygiene rules were added.
- Current tests/build pass.
- Current live app/API are up.

Not good:

- The July 2 E2E report incorrectly marks successful saves as `FAIL`.
- The corrected journey table exists, but the raw contradiction remains.
- `BUG-20260701-022` still reads stale in the bug board even though a later retest says it passed.
- `BUG-20260702-023` says no live deploy until approval, but the live app already contains location-fix markers.

## Full-file / repo-level observations

### Current codebase shape

| File/area | Observation | Risk |
|---|---|---|
| `src/App.tsx` | 4,149 lines | High maintainability risk; too much UI/state/flow logic in one file |
| `src/styles.css` | about 2,989 lines from current diff stat | Medium maintainability risk; visual regressions can be hard to isolate |
| Backend files | API/backend/persistence/report code is split better than frontend | Lower risk than frontend monolith |
| QA docs | Many detailed reports exist | Good evidence, but hard to read and sometimes contradictory |
| Bug board | 719 lines / about 100 KB | Useful history but not clean as current-status source |
| Scripts | Backup, monitor, cleanup, migration rehearsal scripts exist | Good operational coverage, but scripts must remain credential-safe and audited |

### Current tracked artifacts

There are root-level visual/static artifacts such as:

- `admin-reports-one-flow.png`
- `live-reports-visual.png`
- `check-in-flow.html`
- `sales-flow.html`
- `service-flow.html`
- `design-preview.html`

These may be useful reference artifacts, but they make the repo feel less clean. If they are historical/reference, they should be moved under `docs/assets/` or clearly documented.

## Major confirmed concerns

### 1. Status trail is unreliable in places

Severity: **High**

Examples:

- Location bug says no live deploy, but live app contains location-fix markers.
- Field Entry search bug still says not live/not verified, but later Bloom retest says it passed.
- July 2 raw E2E report says 5 failures where evidence shows successful saves.

Impact:

The owner cannot safely rely on one status file to know what is live, verified, waiting, or accepted.

### 2. Periwinkle repeatedly improved rules only after being corrected

Severity: **High process concern**

Examples:

- User-journey report standard had to be corrected by Amrutha on July 2.
- GitHub hygiene rules were added after repo sync issues became visible.
- Location/GPS instruction had to be strengthened after Periwinkle treated it too narrowly.

Impact:

Periwinkle is learning, but not consistently preventing repeat mistakes before the user catches them.

### 3. QA evidence exists, but it is too fragmented

Severity: **Medium/High**

There are 31 QA reports plus bug-board notes plus coordination docs. This is good for traceability, but not good for quick owner truth because some reports are old, blocked, contradicted, or superseded.

Impact:

A non-technical owner can easily read the wrong stale line.

### 4. Location/GPS issue is not accepted and remains a real risk

Severity: **High until real retest**

Current code tries high-accuracy GPS, then lower-accuracy GPS, then cached GPS. This may be reasonable, but not yet proven on real devices and not yet clearly approved as a business rule.

Impact:

Field users may still be blocked, or the app may reuse recent location in a way the business does not expect.

### 5. Frontend maintainability risk is high

Severity: **Medium**

`src/App.tsx` is a large monolith. The app has many screens and admin states in one file. That does not mean it is broken, but it raises regression risk when Periwinkle/Iris makes small fixes.

Impact:

Future fixes can accidentally affect unrelated screens, exactly the type of issue already seen with admin detail / leave overlap.

### 6. Test quality warnings remain

Severity: **Low/Medium**

Tests pass, but React `act(...)` warnings appear repeatedly.

Impact:

Not a pilot blocker, but warning noise can hide real future problems.

## What Periwinkle did well across the whole history

- Built a working mobile-first app from requirements.
- Added real backend support rather than leaving only static mockups.
- Added persistence, backups, monitoring, login, admin access controls, reports, and PDFs.
- Added Bloom QA process and bug board.
- Recorded many fixes with tests/build/live checks.
- Preserved the approved sage/olive visual direction in docs.
- Added cleanup safeguards after QA-data issues.
- Current live app/API are up and current tests/build pass.

## What Periwinkle did poorly across the whole history

- Moved too fast with many deploys before strict status discipline existed.
- Allowed stale or contradictory status lines to remain in the bug board and reports.
- Let user corrections become necessary for reporting format, GitHub hygiene, and GPS issue handling.
- Did not keep a simple current owner-facing truth separate enough from historical bug-board detail.
- Created/kept a frontend structure that is now hard to safely maintain.
- Did not always prove live deployment/retest state before status wording implied progress.

## Current launch/pilot risk list

| Risk | Severity | Why it matters | Required action |
|---|---|---|---|
| Location/GPS save issue not fully retested | High | Field agents may still be blocked from saving work | Bloom real-device/failure-path retest before acceptance |
| Bug board live/source/retest status stale | High | Owner cannot know true state | Periwinkle must update current statuses immediately |
| July 2 E2E report false FAILs | Medium/High | Misleads owner into thinking successful saves failed | Add correction/amendment to report |
| Real same-phone overnight login persistence still open | High | Daily logout hurts trust | Keep open until real device acceptance |
| Frontend monolith | Medium | Future small fixes can regress unrelated screens | Refactor later, not during active pilot unless planned |
| React test warnings | Low/Medium | Can hide useful test warnings | Clean later |
| Audit report push blocked | Low/Medium | Bloom’s latest audit is local only | Push from authenticated Periwinkle/GitHub environment |

## Final answer to Amrutha’s question

If the question is: **“Did Periwinkle build useful CrystalBio work?”**  
Answer: **Yes.** A lot of useful work was built, tested, and deployed.

If the question is: **“Did Periwinkle do the work rightly from start to today?”**  
Answer: **Not fully.** The technical work is mostly there, but the project-control side is inconsistent.

The biggest correction Periwinkle needs is not another feature. It is disciplined truthkeeping:

- one current status,
- no stale bug-board lines,
- no misleading QA labels,
- no “done” before Bloom/live retest,
- no live/source mismatch without clear approval trail.

## Required next actions

1. Periwinkle must update the bug board for `BUG-20260702-023` to show the exact true state.
2. Periwinkle must update `BUG-20260701-022` with the July 3 Bloom retest result.
3. Bloom/Periwinkle must amend the July 2 E2E report where successful saves were marked `FAIL`.
4. Bloom must run a real location/GPS retest before anyone accepts the location fix.
5. Periwinkle must keep one simple current owner-facing status separate from historical details.
6. Periwinkle should push this audit report from an authenticated GitHub environment if needed, because Bloom’s current environment cannot push over HTTPS.
