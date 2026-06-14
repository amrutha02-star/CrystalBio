# CrystalBio Tomorrow Pilot Handover

Use this for the first client-use day.

## Current status

- Live app: https://work.convogenie.ai
- API health: https://work-api.convogenie.ai/health
- Stage: controlled pilot launch, not full production rollout.
- Login model: registered email + unique password.
- Automatic setup/reset emails: deferred to next version. For tomorrow, share login details manually.

## Before sharing with users

### 1. Backup live data

Run this on the live backend server before cleanup:

```bash
cd /path/to/CrystalBio
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json \
CRYSTALBIO_BACKUP_DIR=/var/data/backups \
npm run backup:db
```

Confirm a timestamped backup file was created before continuing.

### 2. Clean test/QA activity

Dry-run first:

```bash
cd /path/to/CrystalBio
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data
```

Then write cleanup:

```bash
cd /path/to/CrystalBio
CRYSTALBIO_DB_PATH=/var/data/crystalbio-db.json npm run clean:pilot-data -- --write
```

This keeps user accounts and clears sessions, attendance, sales entries, service entries, and leave requests. It also writes a pre-clean backup.

### 3. Confirm tomorrow user list

Create/share a private sheet with:

- Name
- Email ID
- Role: admin / sales / service / both
- Field access: yes/no
- Temporary unique password
- Shared with user: yes/no
- First login confirmed: yes/no

Do not put passwords in GitHub, public docs, or client-visible README files.

### 4. Admin smoke test

One admin should confirm:

- Login works.
- Admin Overview opens.
- Agents page opens.
- Profiles/users are visible.
- Approvals page opens.
- Reports page opens.
- PDF report downloads.
- Admin Field Entry can save and remains visible after refresh.

### 5. Field-agent smoke test

Use one sales/service test account after cleanup:

- Login works.
- Home screen opens.
- Location permission appears.
- Check-in saves.
- Sales entry saves.
- Service entry saves.
- Leave request saves.
- My Entries shows saved entries after refresh/re-login.

### 6. Phone install test

Test one iPhone and one Android before wider rollout.

- iPhone: Safari → open app link → Share → Add to Home Screen.
- Android: Chrome → open app link → three-dot menu → Add to Home screen / Install app.
- Open from Home Screen icon.
- Allow Location and Camera/Photos.
- Login and try one basic action.

## Message to send users

```text
Hi, please install the CrystalBio Field App on your phone:
https://work.convogenie.ai

iPhone: Open in Safari → Share button → Add to Home Screen.
Android: Open in Chrome → three-dot menu → Add to Home screen / Install app.

Please allow Location and Camera/Photos when asked. Location is required for check-in and field visit GPS.
Login using your registered email ID and the password shared with you.
```

## Monitoring for first 3 days

A Hermes watchdog has been scheduled to check the public app and API every 5 minutes for the first 3 days. It stays silent if healthy and alerts this chat if the app/API fails.

Manual items to watch:

- login failures,
- check-in/check-out save errors,
- Sales/Service form save errors,
- leave approval failures,
- PDF report failures,
- blank screens/crashes,
- weak-network complaints from agents.

## Emergency plan

If multiple users report the same issue:

1. Pause wider rollout.
2. Check API health: https://work-api.convogenie.ai/health
3. Check whether the issue is login, save, report, or phone permission related.
4. Preserve screenshots/error messages from the user.
5. Restore from latest backup only if live data is corrupted or missing.
