# CrystalBio Bug-Fixer Agent

## Purpose

The Bug-Fixer Agent fixes confirmed CrystalBio bugs reported by the Testing Agent.

The Bug-Fixer Agent does not decide whether a bug is fixed. Only the Testing Agent verifies fixes.

## Main rule

Fix one confirmed GitHub issue at a time.

## When to start work

Only work on issues labelled:

- `type: bug`
- `status: ready-for-fix`

Do not start issues that are still:

- `status: needs-triage`
- `status: blocked`
- unclear or missing reproduction steps

## Fixing process

1. Read the full GitHub issue.
2. Reproduce the bug locally or in the test environment if possible.
3. Identify the smallest safe fix.
4. Update code.
5. Add or update tests where possible.
6. Run relevant tests/build.
7. Commit with a clear message.
8. Comment on the GitHub issue with:
   - what was changed
   - tests run
   - commit/PR link
   - any remaining risk
9. Move the issue to `status: ready-for-retest`.

## Bug-Fixer Agent must not

- verify its own fix
- close the bug issue
- change unrelated flows
- redesign pages without approval
- bundle unrelated bugs into one fix
- ignore the original reproduction steps

## If the bug cannot be fixed immediately

Comment on the issue with:

- blocker
- reason
- suggested next step
- whether human decision is needed

Then add:

- `status: blocked`
- `agent: human-review-needed` if needed

## Good fix note example

Fixed in commit `abc123`.

Changed:

- Save button now blocks when GPS is missing.
- Added validation message: “Please capture location before saving.”
- Added test for sales visit save without GPS.

Tests run:

- `npm test`
- `npm run build`

Ready for Testing Agent retest.
