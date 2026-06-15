# CrystalBio Bug Fix Workflow

This workflow explains how Bloom, Iris, and Periwinkle should handle bugs.

It is written in simple language so the process stays clear.

## Roles

Periwinkle is the lead.

Periwinkle reviews bug reports, decides priority, approves fixes, and gives final acceptance.

Bloom is the QA tester.

Bloom tests every user journey in multiple scenarios, finds bugs, records evidence, and retests fixes.

Iris is the bug fixer.

Iris fixes only approved bugs, runs checks, and records what changed.

## Standard flow

1. Bloom tests a journey.
2. Bloom records bugs with steps, expected result, actual result, severity, and evidence.
3. Periwinkle reviews Bloom's bugs.
4. Periwinkle marks each bug as one of these:
   - Fix now
   - Fix later
   - Needs more testing
   - Needs Rahul decision
   - Not a bug
5. Iris fixes only the bugs marked Fix now.
6. Iris runs checks and updates the fix log.
7. Bloom retests the exact journey and related edge cases.
8. Periwinkle accepts, rejects, or asks for another fix.

## Launch week night workflow

During launch week, routine fixing should happen at night because the real team uses the app during the day.

Recommended India-time rhythm:

1. 9:00 PM: Bloom runs heavy QA.
2. 11:00 PM: Periwinkle reviews Bloom's bugs and marks what is approved for Iris.
3. 11:30 PM to 2:00 AM: Iris fixes only approved bugs.
4. 2:30 AM: Bloom retests Iris's fixes.
5. 7:30 AM: Periwinkle gives a simple morning summary before users start work.

Use `docs/BUG_INTAKE_BOARD.md` as the simple queue between Bloom, Periwinkle, and Iris.

## Bug approval format

Before Iris starts, the bug should have:

- Bug title:
- Source report:
- Severity:
- Approved by:
- Exact journey to fix:
- What should happen after the fix:
- Any restrictions:

## Iris fix rules

Iris should:

- Make the smallest safe fix.
- Preserve the current CrystalBio design.
- Keep field-agent screens simple and phone-first.
- Add or update tests when possible.
- Run real checks before reporting completion.
- Update `docs/BUG_FIX_LOG.md`.

Iris should not:

- Fix bugs that are not approved.
- Redesign screens.
- Add new features unless asked.
- Change business rules unless asked.
- Give long technical explanations to Rahul unless asked.

## Bloom retest rules

After Iris reports a fix, Bloom should:

- Retest the original bug steps.
- Test at least one normal scenario.
- Test at least one edge scenario.
- Check mobile layout when relevant.
- Check console/API errors when relevant.
- Update Bloom's QA log with pass/fail.

## Final acceptance

Only Periwinkle or Rahul should treat a bug as fully accepted.

A fix is not fully complete until:

1. Iris made and checked the fix.
2. Bloom retested it.
3. Periwinkle or Rahul accepted it.
