# CrystalBio Client Testing Hardening — 2026-06-08

## Purpose

Move the app away from a demo-only handoff and closer to a client-testing/pilot build that can be given to the client for hands-on review.

## What changed

### Backend reliability hardening

- Added atomic JSON persistence writes using a temporary file and rename.
- Added automatic `.bak` backup before replacing an existing database file.
- Added corrupted-main-file recovery path:
  - damaged JSON is copied to `.corrupt`
  - previous valid `.bak` state is loaded instead of silently wiping data
- Added regression test for backup/recovery behavior.

### UI/UX polish for client testing

- Reworded visible copy from demo-preview language to client-testing/pilot language.
- Report screen now labels report output as `Client testing data` instead of fixed demo values.
- Removed user-facing message saying report numbers are fixed demo values.
- Admin report messages now explain they are generated from saved field activity for client testing.
- Leave approval feedback now says `Approved` / `Rejected`, not `Approved in demo`.
- Disabled buttons now use a clearer disabled cursor instead of a waiting cursor.
- Tap/active feedback added for enabled buttons.

## Verification

Command run:

```bash
npm test -- --run && npm run build
```

Result:

- Test files: 9 passed
- Tests: 61 passed
- Production build: passed

## Remaining before real field rollout

This is stronger than demo mode, but for real staff usage the next required milestone is still hosted pilot setup:

1. Deploy hosted backend with persistent storage.
2. Set frontend backend URL for the hosted testing app.
3. Configure real login credentials or OTP/password policy.
4. Add real photo/file storage for Camera and Upload.
5. Run a seeded multi-user pilot test with 12–13 agents and around 20 reports/day.
6. Give client a small testing script: check in, save sales visit, save service visit, request leave, admin review.

## Current verdict

Better than demo-only. Suitable for controlled client testing once hosted backend URL/storage is configured. Not yet final production rollout.
