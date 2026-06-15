# CrystalBio Launch Week Night QA Schedule

This is the launch-week working rhythm for Bloom, Iris, and Periwinkle.

The reason for night work is simple: real team members use the app during the day, so we should avoid risky fixes and deployments while they are working.

## Daytime rule

During the day:

- Real team members use the app normally.
- Bloom may monitor for obvious problems and record issues.
- Iris should not make routine changes during working hours.
- Deployments should be avoided unless Rahul says it is urgent.
- Live-user problems should be written into `docs/BUG_INTAKE_BOARD.md`.

## Night workflow

Use this order:

1. Bloom does heavy QA testing.
2. Bloom writes a plain-English bug report.
3. Periwinkle reviews and decides what is safe to fix.
4. Iris fixes only approved bugs.
5. Iris updates the fix log.
6. Bloom retests Iris's fixes.
7. Periwinkle/Rahul gives final approval.

## Recommended India-time schedule

- 9:00 PM IST: Bloom full QA run starts.
- 10:30 PM IST: Bloom finishes QA report and updates Markdown records.
- 11:00 PM IST: Periwinkle reviews Bloom's report and marks approved fixes.
- 11:30 PM IST to 2:00 AM IST: Iris fixes only approved bugs.
- 2:30 AM IST: Bloom retests fixed journeys.
- 7:30 AM IST: Periwinkle gives a morning summary before team usage starts.

## Launch week heavy testing rule

During launch week, Bloom should test more heavily than normal:

- full login/session tests,
- field-agent daily work journeys,
- sales and service entry flows,
- admin review/report journeys,
- mobile layout,
- save/refresh/logout/login persistence,
- role access mistakes,
- console/API errors,
- repeated taps and edge cases.

## Real-time monitoring rule

Bloom should keep an eye on live health signals during the day.

Important limitation: Bloom can automatically detect app/API failures that are visible from monitoring checks. Bloom cannot magically know what a person is seeing unless the app records that problem somewhere or the user reports it.

So for now, real-time monitoring means:

- check the live API health regularly,
- record any outage or monitor failure,
- notify Rahul/Periwinkle when a live problem is detected,
- add the issue to `docs/BUG_INTAKE_BOARD.md`,
- leave it for Periwinkle/Rahul approval before Iris fixes it.

If the app later adds user activity/error logging, Bloom can watch that too.
