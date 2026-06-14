# CrystalBio Pilot Launch Checklist

Use this after backend/frontend fixes are merged and before sharing a client pilot link.

## 1. Backend host first

- Deploy the API service from `render.yaml` or equivalent Node host.
- Confirm persistent database storage is mounted and `CRYSTALBIO_DB_PATH` points to it.
- Set `CRYSTALBIO_ALLOWED_ORIGIN` to the final frontend URL.
- Keep `CRYSTALBIO_SEED_DEMO=false` for real client data.
- Keep `CRYSTALBIO_DEMO_PASSWORD` private if a controlled demo seed is temporarily used.
- Open `/health` and confirm it returns OK.

## 2. Frontend host second

- Set `VITE_CRYSTALBIO_API_URL` to the hosted backend URL.
- Build and deploy the frontend static app.
- Confirm direct admin URLs open the login screen unless a real admin is logged in.

## 3. Live pilot journey checks

- Admin login with registered email + password.
- Admin creates an agent profile/invite.
- Invited user sets password from the invite flow.
- Invited user logs in.
- Agent check-in/check-out saves GPS.
- Agent submits Sales and Service entries.
- Agent submits a leave request.
- Admin approves/rejects leave and status is recorded.
- Admin generates/downloads owner PDF report.

## 4. First-days monitoring

Watch for these during pilot days 1–3:

- Login failures.
- Invite/password setup failures.
- Check-in/check-out save errors.
- Sales/Service form save errors.
- Leave approval failures.
- Report/PDF download failures.
- App crashes or blank screens.
- Network/sync errors from weak mobile connectivity.

## 5. Pilot limitations to explain plainly

- This is a controlled private pilot, not full production.
- Excel export is intentionally skipped for now.
- Scheduled email/Telegram owner summaries are deferred to end-June 2026 reporting phase.
- Photo/file storage is not production-grade yet; request body size is capped until object storage is designed.
- Backups/monitoring should be upgraded before full company-wide rollout.
