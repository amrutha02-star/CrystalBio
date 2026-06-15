# CrystalBio Bug Intake Board

Purpose: one simple place where Bloom, Periwinkle, and Iris can track bugs during launch week.

This file is written in plain language so Rahul can read it without technical knowledge.

## Status meanings

- New from Bloom: Bloom found it, but Periwinkle has not reviewed it yet.
- Needs Periwinkle review: Bloom thinks it may matter and Periwinkle should decide.
- Approved for Iris: Periwinkle or Rahul approved Iris to fix it.
- Iris fixing: Iris is actively fixing it.
- Ready for Bloom retest: Iris says the fix is ready and Bloom must retest it.
- Verified by Bloom: Bloom retested and the fix works.
- Accepted by Periwinkle/Rahul: final approval is done.
- Not fixing now: known issue, but not part of the current launch-week fix list.

## Important rule

Bloom can add bugs here any time.

Iris must only fix bugs marked Approved for Iris by Periwinkle or Rahul, except for an emergency where Rahul explicitly says to fix immediately.

## Live user issue rule

If Bloom notices a live-user problem during the day, Bloom should record it here and notify Periwinkle/Rahul in simple language.

The app now has app-side logging for Bloom. It records serious user-facing app/API failures without saving passwords or form contents. Bloom’s watcher checks the server-side log and adds serious recent issues here.

For live-user problems, Bloom should include:

- Time noticed:
- User journey affected:
- What the user likely experienced:
- Severity:
- Evidence:
- Status: Needs Periwinkle review
- Recommended next step:

## Current bug queue

_No active bugs recorded yet._
