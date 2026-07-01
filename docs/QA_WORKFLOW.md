# CrystalBio QA Workflow

This is the working QA process for CrystalBio once backend/app development starts.

## Short version

Use three separate responsibilities:

1. **Bloom / Testing Agent** — checks the app like a real user, finds bugs, collects evidence, writes QA reports, updates its Bloom QA log, and records live-user problems in `docs/BUG_INTAKE_BOARD.md`.
2. **Periwinkle / Lead Agent** — reviews Bloom's bugs, separates real-user issues from QA/testing failures, decides what matters, asks Rahul/Amrutha for approval when needed, approves exactly what Iris may fix, and gives final acceptance only after evidence.
3. **Iris / Bug-Fixer Agent** — fixes confirmed bugs only after Periwinkle or Rahul approves them.

A bug is only considered fixed after Iris fixes the approved item, Bloom retests the exact journey, and Periwinkle/Rahul accepts it. Source-fixed, deployed, retested, and accepted are different states and must not be collapsed.

During launch week, routine QA/fixing should happen at night because real team members use the app during the day. See `docs/LAUNCH_WEEK_NIGHT_QA_SCHEDULE.md`.

---

## Testing Agent — required

The Testing Agent must check every journey, button, field, validation rule, save action, report, and mobile layout.

### Testing Agent responsibilities

- Test agent login and admin login.
- Test attendance check-in/check-out.
- Test leave request and leave status.
- Test sales search, new entry, opportunity fields, repeated visit updates, dates, GPS, photos, and save.
- Test service search, new entry, equipment/customer fields, repeated service updates, dates, GPS, photos, and save.
- Test admin daily/weekly/monthly reports.
- Test mobile usability at phone size.
- Create GitHub issues for confirmed bugs.
- Attach screenshots/logs/test data where possible.
- Retest bugs after fixes.
- Mark issues as verified only after retesting.

### Testing Agent must not

- Claim a journey works without testing it.
- Close bugs because a developer says they are fixed.
- Combine unrelated bugs into one issue.
- Use vague titles like “form not working”.

---

## Bug-Fixer Agent — recommended

Yes, CrystalBio should have a Bug-Fixer Agent once backend starts.

The Bug-Fixer Agent is useful because the Testing Agent will find detailed bugs. If the same agent both tests and fixes, it may miss mistakes in its own fix.

### Bug-Fixer Agent responsibilities

- Pick one GitHub issue at a time.
- Work only on issues labelled `status: ready-for-fix`.
- Create a branch for the issue.
- Fix the reported bug only.
- Add/update tests when possible.
- Open a pull request or commit with clear notes.
- Move the issue to `status: ready-for-retest`.

### Bug-Fixer Agent must not

- Verify its own fix.
- Close the bug issue by itself.
- Fix unrelated bugs in the same change.
- Rewrite flows without approval.

---

## GitHub bug lifecycle

1. Testing Agent finds a bug.
2. Testing Agent creates a GitHub issue.
3. Issue is labelled `status: needs-triage`.
4. Issue is confirmed and labelled `status: ready-for-fix`.
5. Bug-Fixer Agent fixes it in a focused branch/commit.
6. Issue is labelled `status: ready-for-retest`.
7. Testing Agent retests the exact journey.
8. If fixed, Testing Agent labels it `status: verified-fixed` and adds evidence.
9. Issue is closed after verified fixed.

---

## Required GitHub labels

### Type

- `type: bug`
- `type: qa-finding`
- `type: missing-requirement`
- `type: improvement`
- `type: documentation`

### Priority

- `priority: critical`
- `priority: high`
- `priority: medium`
- `priority: low`

### Area

- `area: login`
- `area: attendance`
- `area: sales`
- `area: service`
- `area: admin`
- `area: reports`
- `area: mobile-ui`
- `area: backend`
- `area: database`
- `area: file-upload`
- `area: gps-location`

### Status

- `status: needs-triage`
- `status: confirmed`
- `status: ready-for-fix`
- `status: in-progress`
- `status: ready-for-retest`
- `status: verified-fixed`
- `status: cannot-reproduce`
- `status: blocked`

### Evidence

- `evidence: screenshot`
- `evidence: console-log`
- `evidence: api-log`
- `evidence: test-case`

### Agent

- `agent: testing`
- `agent: bug-fixer`
- `agent: human-review-needed`

---

## QA run report rule

After every QA round, the Testing Agent must create either:

- a GitHub issue titled `QA Run - CrystalBio - YYYY-MM-DD`, or
- a file under `docs/qa-runs/QA_RUN_YYYY-MM-DD.md`

Each QA run report must include:

- app version/commit tested
- backend version/commit tested
- environment tested
- total tests run
- passed count
- failed count
- blocked count
- GitHub issue numbers created
- bugs verified fixed
- plain-English owner summary

---

## Fixed bug documentation rule

Every fixed bug must have:

- original GitHub issue
- fix commit/PR
- retest date
- retest result
- evidence from Testing Agent

No issue should be closed as “fixed” without retest evidence.
