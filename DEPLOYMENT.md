# CrystalBio Free Pilot Hosting

This is the approved short path for a free/low-cost pilot link. It is for a controlled client pilot, not final production.

## Recommended free split

1. **Frontend/mobile app:** Vercel, Netlify, or Cloudflare Pages.
2. **Backend/API:** Render free web service or another free Node host.
3. **Storage:** JSON database file outside the repo via `CRYSTALBIO_DB_PATH`.

## Required backend environment variables

- `HOST=0.0.0.0`
- `PORT` — usually provided by the host.
- `CRYSTALBIO_DB_PATH=/opt/render/project/src/data/crystalbio-db.json` or another private persistent path.
- `CRYSTALBIO_ALLOWED_ORIGIN=https://your-frontend-domain`
- `CRYSTALBIO_SEED_DEMO=false` for real client use.
- `CRYSTALBIO_DEMO_PASSWORD=<temporary pilot password>` only for a controlled demo seed, never a public/default password.

## Required frontend environment variable

- `VITE_CRYSTALBIO_API_URL=https://your-backend-domain`

## Launch safety rules

- Do not publish demo credentials in a public README or client message.
- Use invite-created accounts for real users.
- Keep mobile numbers as profile/contact details, not as the login method.
- Login is registered email + password. Email OTP backup can be added later.
- During the first pilot days, monitor: login failures, failed saves, form errors, sync/network issues, crashes, and report/PDF generation failures.

## What is intentionally deferred

- Excel export is skipped for now.
- Regular owner email/Telegram summaries are deferred until the end-of-June 2026 reporting phase. Reports can be generated/downloaded from the app in the meantime.
