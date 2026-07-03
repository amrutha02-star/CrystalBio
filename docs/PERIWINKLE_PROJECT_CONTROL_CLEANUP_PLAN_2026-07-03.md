# Periwinkle Project-Control Cleanup Plan — 2026-07-03

Purpose: fix the messy project trail called out in the full-history audit, without pretending old work was cleaner than it was.

This plan is about project control, status truth, and safer future work. It is not a redesign plan and not a broad feature-fix approval.

## Current truth

- Live app is up and currently serves version `20260703033332`.
- GitHub is synced through the full-history audit commit.
- Daily backups and live monitoring are active.
- The GPS/location issue remains open and not accepted.
- Some status docs are stale or contradictory and need cleanup.
- `src/App.tsx` is too large, so future fixes need narrower scope and stronger verification.

## Cleanup principles

1. Do not work from Telegram memory. Start from `AGENTS.md`, README live notes, DESIGN baseline, `BOT_COORDINATION_STATUS.md`, `BUG_INTAKE_BOARD.md`, and relevant docs.
2. Separate states clearly: source-fixed, built/tested locally, deployed live, live checked, Bloom retested, accepted.
3. Do not call any bug accepted unless the bug board and evidence both support it.
4. Do not deploy routine fixes during live-use/daytime unless Amrutha/Rahul explicitly approve.
5. Keep GitHub clean after each approved work batch: status check, focused commit, push, verify `main...origin/main` is clean.
6. Do not add browser-specific wording or assume Chrome-only behavior for GPS/location issues.

## Phase 1 — Status truth cleanup

Owner: Periwinkle  
Outcome: one reliable owner-facing status trail.

Tasks:

- Reconcile `docs/BOT_COORDINATION_STATUS.md` against the latest bug board and QA reports.
- Reconcile `docs/BUG_INTAKE_BOARD.md` for active/current items only.
- Mark stale entries clearly as historical/accepted/not current rather than leaving them mixed with active work.
- Fix contradictions already identified:
  - Field Entry search iPhone anti-zoom: bug board says not live/not verified, but Bloom 2026-07-03 retest says it passed live.
  - GPS/location: source/live has retry/fallback markers, but the issue is not accepted because real cross-device capture is not verified.
  - July 2 E2E report: rows marked failed where evidence shows successful create responses need Periwinkle classification.

Verification:

- Read latest QA reports and bug board together.
- Produce one short business-facing summary: live/verified, waiting for Bloom retest, waiting for acceptance, blocked/user decision.
- Commit and push docs.

## Phase 2 — Evidence cleanup

Owner: Periwinkle + Bloom when retest evidence is needed  
Outcome: QA reports become usable evidence, not noisy logs.

Tasks:

- Review July 2 E2E report failed/needs-review rows.
- Convert contradictory rows into plain labels: pass, needs-review, blocked, or confirmed bug.
- Ensure Bloom-only QA cleanup evidence is linked from the relevant QA run.
- Keep raw logs/screenshots as evidence, but owner-facing table must stay compact.

Verification:

- Each active QA conclusion points to a specific evidence file or live check.
- No raw API-only success is presented as full UI acceptance unless the UI journey was actually tested.

## Phase 3 — GPS/location recovery work

Owner: Periwinkle review, Iris only if exact fix remains approved  
Outcome: location bug is handled as a real cross-phone/browser capture issue.

Tasks:

- Keep GPS required; do not save Sales/Service/Attendance without valid latitude/longitude.
- Review current retry/fallback behavior and whether 30-minute recent GPS reuse is acceptable for field compliance.
- If not acceptable, adjust before any acceptance.
- Test the journey on/for:
  - Android Chrome,
  - Samsung Browser,
  - iPhone Safari,
  - iPhone Chrome,
  - home-screen/PWA where possible.
- Confirm typed Sales/Service form data remains after location failure.
- Confirm no browser-specific field-form copy is introduced without owner approval.

Verification:

- Tests/build pass.
- Live check only after approved deploy.
- Bloom retest records allowed, denied, retry, and typed-data-preserved paths.
- Periwinkle/Rahul acceptance required before closure.

## Phase 4 — Maintainability containment

Owner: Periwinkle review before Iris implementation  
Outcome: reduce risk from the large frontend file gradually, not through risky redesign.

Tasks:

- Do not begin broad refactor during live-use hours.
- First identify safe extraction boundaries from `src/App.tsx`:
  - location/GPS helper,
  - report helpers,
  - admin submitted-entry detail helpers,
  - form state helpers.
- Extract only behind existing tests and visual checks.
- Avoid changing routes, visual baseline, or business behavior during cleanup.

Verification:

- Tests/build after each extraction.
- Browser check for the affected screen.
- GitHub clean after each small batch.

## Phase 5 — Operating discipline going forward

Owner: Periwinkle

For every new CrystalBio work batch:

1. Start: `git status --short --branch`.
2. Read current docs, not memory.
3. Classify work: status-only, Bloom test, Periwinkle review, Rahul/Amrutha decision, approved Iris fix, or accepted.
4. Make the smallest approved change only.
5. Verify with real tests/build/browser/live check as appropriate.
6. Update status docs immediately if the truth changed.
7. Commit and push before saying GitHub is current.
8. End: `git status --short --branch` and report exact state.

## Immediate next action

Periwinkle should start with Phase 1 and reconcile the two main status files before any more routine fixing:

- `docs/BOT_COORDINATION_STATUS.md`
- `docs/BUG_INTAKE_BOARD.md`

No new live app changes should be made just to tidy historical status.
