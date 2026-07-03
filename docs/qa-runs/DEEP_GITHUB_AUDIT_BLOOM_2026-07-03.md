# Bloom Deep GitHub Audit — CrystalBio / Periwinkle Work — 2026-07-03

Run time: 2026-07-03 03:55–04:08 UTC / 09:25–09:38 IST  
Auditor: Bloom QA  
Scope: GitHub `origin/main`, latest Periwinkle commits after `1a96f38`, live app/API state, source diffs, tests/build, QA reports, bug board, and bot coordination docs.  
Important: This is an audit only. Bloom did not fix product code.

## Owner-facing verdict

Periwinkle did **some important work correctly**, but I would **not call the work fully clean or finished**.

The app/source side is in a good basic state: live app is up, live version matches GitHub source, tests pass, and the latest location-related code is deployed. However, the management around the work is weak in three important places:

1. The bug board does not clearly match what is live.
2. A QA report incorrectly labels several successful saves as `FAIL`.
3. The location fix has not been deeply verified on the real location-failure journey and may still have a GPS trust risk.

## Audit evidence

| Area | Evidence | Result |
|---|---|---|
| GitHub remote | `origin/main` = `0922c9b2e9bc479aab8687c850066fb720f1ed2c` | Source is now on GitHub |
| Local repo | local has one extra Bloom audit commit/report not pushed because GitHub HTTPS credentials are unavailable | Audit-report push blocked, not product source |
| Live API | `https://work-api.convogenie.ai/health` returned `200` / `{ "status": "ok" }` | Passed |
| Live app version | `https://work.convogenie.ai/version.json` returned `20260703033332` | Passed |
| GitHub version file | `origin/main:public/version.json` = `20260703033332` | Matches live |
| Live bundle | contains `20260703033332`, `Location could not be captured`, `crystalbio.last-good-gps.v1` | Latest location code appears live |
| Tests | `npm test -- --run` passed: 11 files / 109 tests | Passed, with warnings |
| Frontend build | `npm run build` passed | Passed |
| Backend build | `npm run backend:build` passed | Passed |
| Security scan of added lines | 0 simple secret/injection/eval findings | Passed basic scan |

## What Periwinkle did right

### 1. Latest source is now on GitHub and live version matches it

The earlier surface audit caught the repo temporarily ahead of GitHub. In this deeper audit, GitHub remote now points to the same source commit Periwinkle had locally:

`0922c9b Record location correction and QA artifacts`

The live app version and GitHub source version both show:

`20260703033332`

This is good. It means GitHub is no longer behind the live source for the latest product code.

### 2. Build and automated tests pass

- `npm test -- --run`: 109/109 tests passed.
- `npm run build`: passed.
- `npm run backend:build`: passed.

This does not prove the app is perfect, but it means Periwinkle did not leave the repo in a broken build/test state.

### 3. The location code change is small and targeted

The latest product code change is not a broad redesign. It changes the GPS capture behavior in `src/crystalBioFrontendApi.ts` and a small UI line in `src/App.tsx`.

What changed:

- first GPS request: high accuracy, 12s timeout
- second fallback request: lower accuracy, 8s timeout
- stores a recent successful GPS locally for 30 minutes
- shows a clearer generic message: typed details are still preserved
- avoids Chrome-only wording
- keeps the backend GPS requirement

This is directionally aligned with Amrutha’s instruction not to treat this as Chrome-only.

## Confirmed problems / risks

## Finding 1 — Bug board does not match the live location-fix state

Severity: **High process / communication risk**  
Blocks calling the location issue “done”: **Yes**

`docs/BUG_INTAKE_BOARD.md` currently says for `BUG-20260702-023`:

> `Status: Approved for Iris source fix; no live deploy until Amrutha/Rahul approval or an explicitly urgent live-fix instruction.`

But the live app is already on version `20260703033332`, and the live bundle contains the location-fix markers.

### Expected

The bug board should clearly say one of:

- source-fixed only,
- deployed live,
- waiting for Bloom retest,
- verified by Bloom,
- or accepted by Periwinkle/Rahul.

### Actual

The docs read like the fix should not yet be live, while the live app appears to contain it.

### Why this matters

For a live pilot app, Rahul/Amrutha need a reliable status trail. If the board says “no live deploy” while live has changed, we cannot tell whether the deploy was approved, urgent, accidental, or simply not documented.

### Required action

Periwinkle must immediately update `BUG-20260702-023` to the true state and mark it for Bloom retest if it is live.

---

## Finding 2 — The July 2 E2E QA report mislabels successful saves as FAIL

Severity: **High QA-reporting risk**  
Blocks trusting the report without review: **Yes**

In `docs/qa-runs/QA_RUN_BLOOM_E2E_USER_JOURNEY_2026-07-02.md`, several rows are marked `FAIL`, but their evidence is successful:

| Step | Label | Evidence shown | Correct interpretation |
|---:|---|---|---|
| 14 | Agent checks in with selected work mode | `status:201`, `attendanceStatus:"checked_in"` | Should be PASS unless another hidden condition failed |
| 18 | Sales Step 1 saves quick visit | `visitStatus:201`, IDs created | Should be PASS unless duplicate/detail rule failed elsewhere |
| 21 | Repeated Sales same-content save | `status:201`, `returnedVisitId:"sales_visit_998"` | Looks like backend returned existing visit, which is expected duplicate prevention |
| 22 | Service Step 1 saves quick service visit | record/visit IDs created | Should be PASS |
| 29 | Agent submits leave request | `status:201`, `requestStatus:"pending"` | Should be PASS |

A later owner-facing table corrected the business result to PASS for those journeys, but the raw QA report remains contradictory.

### Expected

QA reports should not mark a step failed when the evidence shows a successful save. If the script’s predicate is wrong, the report must say “script classification bug,” not product bug.

### Actual

The raw report says `Failed: 5`, `Needs review: 5`, but the evidence strongly suggests these are script/reporting mistakes, not app failures.

### Why this matters

This can make Rahul/Amrutha think the app failed five core journeys when it actually passed them. That is exactly the kind of confusing status reporting the new instructions were meant to stop.

### Required action

Periwinkle/Bloom should either:

1. correct the report with an explicit amendment, or
2. replace the report status with a clear “script misclassified successful saves” note.

---

## Finding 3 — Field Entry search bug status is stale

Severity: **Medium process risk**

`BUG-20260701-022` still says:

- built/tested locally,
- scheduled for deploy,
- not deployed live yet,
- Bloom could not retest because live was still old.

But a later Bloom 2:30 retest report on 2026-07-03 says Field Entry search anti-zoom passed on live version `20260702164134`.

### Expected

Bug board should now say this passed Bloom retest and is waiting for Periwinkle/Rahul acceptance.

### Actual

The board still reads like it is not live / not retested.

### Why this matters

This makes the current bug queue look worse and more confusing than the actual evidence.

### Required action

Update `BUG-20260701-022` with the 2026-07-03 Bloom retest result.

---

## Finding 4 — Location fix has a GPS trust risk: cached location may be used after capture failure

Severity: **Medium to High functional risk**  
Blocks accepting the location fix: **Yes, until retested and product-approved**

The new GPS client stores the last good GPS in browser local storage for 30 minutes:

- key: `crystalbio.last-good-gps.v1`
- max age: 30 minutes

If fresh GPS capture fails, the app may use that cached GPS.

### Why this may be a problem

The business rule says field updates require GPS. For attendance and field visits, the office may expect the current client/site location. A cached location from up to 30 minutes earlier could be from a previous place.

### Expected

If cached GPS is allowed, the UI and report should make it clear it used a recently captured location, not a fresh location. If cached GPS is not acceptable for compliance, the fallback should not silently submit it.

### Actual

From code review, the fallback can return cached GPS after two failed browser GPS attempts. The UI message says “Location added” and shows coordinates, but does not clearly distinguish fresh vs cached capture.

### Required action

Before acceptance, Bloom must retest and Periwinkle/Rahul should decide whether a 30-minute cached GPS fallback is acceptable. If acceptable, the user message should probably say “recent location reused” instead of implying a fresh capture.

---

## Finding 5 — Location fix has not been deeply verified on the real failing journey

Severity: **High verification gap**  
Blocks calling the location issue fixed: **Yes**

Bloom’s 2026-07-03 retest report says the location issue was not ready for Bloom retest and only a nearby smoke check was done:

> Sales screen showed `Location added` after tapping `Use current location`.

That is useful, but it is not enough.

### What still needs testing

Bloom needs to test, or get real-device proof for:

- Android Chrome permission already allowed but location still not captured.
- Android Chrome permission denied, then allowed, then retry.
- Samsung Browser path if supported by the users.
- iPhone Safari path.
- iPhone Chrome path.
- Home-screen/PWA path.
- Typed Sales/Service details preserved after location failure.
- Save succeeds only when valid acceptable GPS is attached.
- Admin/report saved entry shows correct GPS-backed visit.

### Required action

Do not accept `BUG-20260702-023` until the actual location failure/retry/save journey is retested.

---

## Finding 6 — Test suite passes but still prints React `act(...)` warnings

Severity: **Low/Medium test-quality risk**

`npm test -- --run` passes, but `src/App.test.tsx` repeatedly prints React `act(...)` warnings.

This is not a live app failure, but it creates noise in the test output and can hide more important warnings.

### Required action

Not urgent for pilot use, but Periwinkle should clean this test noise later.

---

## Finding 7 — Local Bloom audit report is not pushed to GitHub

Severity: **Low for product, Medium for audit traceability**

I created and committed a prior audit report locally, but push failed because this machine cannot authenticate to GitHub over HTTPS:

`fatal: could not read Username for 'https://github.com': No such device or address`

Current local state is ahead of GitHub by one Bloom audit-report commit. This is not Periwinkle product code, but it means my audit report is not yet visible on GitHub.

### Required action

Someone with GitHub credentials should push Bloom’s audit report commits, or Periwinkle should copy the audit report into GitHub through its authenticated environment.

## Deep conclusion

| Question | Answer |
|---|---|
| Did Periwinkle keep the app buildable? | Yes |
| Did Periwinkle push latest product source to GitHub? | Yes, by the final check |
| Is live app/API up? | Yes |
| Are tests/build passing? | Yes |
| Is the latest location fix proven by real QA? | No |
| Is the bug/status documentation clean? | No |
| Can Rahul/Amrutha safely rely on the bug board as current truth? | Not yet |
| Should this be called “done rightly”? | Not fully |

## Required next actions for Periwinkle

1. Update `BUG-20260702-023` to the true live/source/retest status.
2. Mark `BUG-20260702-023` as waiting for Bloom live retest if the fix is deployed.
3. Correct the July 2 E2E report contradiction where successful saves were marked `FAIL`.
4. Update `BUG-20260701-022` with the July 3 Bloom retest result.
5. Decide whether cached GPS fallback is acceptable for field compliance; if yes, make the UI/status explicit.
6. Ask Bloom to run a real location retest across the actual failing paths before calling the location issue fixed.
7. Clean up React `act(...)` warnings later.

## Final Bloom QA judgment

Periwinkle has not failed the technical basics: the app is live, builds pass, tests pass, and GitHub now has the latest product source.

But Periwinkle has **not managed the work cleanly enough**. The biggest issue is not broken code; it is unreliable status discipline around what is live, what is merely source-fixed, and what Bloom has actually verified.
