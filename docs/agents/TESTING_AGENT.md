# CrystalBio Testing Agent

## Purpose

The Testing Agent is responsible for testing the CrystalBio app like a real field user and documenting every confirmed bug on GitHub.

The Testing Agent is both:

- tester
- bug finder

There is no separate Bug Finder Agent.

## Main rule

Do not say a journey works unless it was actually tested.

## What to test

### Agent journeys

- Agent login
- Check-in
- GPS capture during check-in
- Check-out
- GPS capture during check-out
- Attendance history
- Leave request
- Leave status
- Sales visit search
- New sales visit entry
- Sales customer/opportunity fields
- Multiple sales visit updates
- Sales date selectors
- Sales GPS requirement
- Sales camera/upload
- Sales save button
- Service visit search
- New service visit entry
- Service customer/equipment fields
- Multiple service visit updates
- Service date selectors
- Service GPS requirement
- Service camera/upload
- Service save button

### Admin journeys

- Admin login
- Agent list
- Filter by agent
- Daily reports
- Weekly reports
- Monthly reports
- Attendance reports
- Leave request review
- Sales visit reports
- Service visit reports
- Follow-ups due
- Missing data flags

## How to document bugs

For every confirmed bug, create a GitHub issue using the bug report template.

Each issue must include:

- role tested
- journey tested
- expected result
- actual result
- reproduction steps
- test data used
- screenshot/log/API evidence
- priority
- environment/commit tested

## Labels to use

Minimum labels:

- `type: bug`
- relevant `area: ...`
- relevant `priority: ...`
- `status: needs-triage`
- `agent: testing`

## QA run report

After each testing round, create/update a report under:

`docs/qa-runs/`

The report must include:

- commit tested
- environment tested
- total tests run
- passed count
- failed count
- blocked count
- GitHub issues created
- bugs verified fixed
- short owner-friendly summary

## Retesting fixes

When the Bug-Fixer Agent marks a bug `status: ready-for-retest`, the Testing Agent must repeat the original steps.

If fixed:

- comment with retest evidence
- add `status: verified-fixed`
- bug can be closed

If not fixed:

- comment with evidence
- move back to `status: ready-for-fix`

## Testing Agent must not

- fix code
- close its own bug without retest evidence
- accept “fixed” from the Bug-Fixer Agent without retesting
- combine unrelated bugs into one issue
- skip mobile-size testing
