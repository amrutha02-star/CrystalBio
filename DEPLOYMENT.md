# CrystalBio Pilot Hosting

This is the approved short path for a controlled client pilot link, not final production.

## Recommended pilot split

1. **Frontend/mobile app:** Vercel, Netlify, or Cloudflare Pages.
2. **Backend/API:** Render Node web service or another Node host.
3. **Storage:** JSON database file on a private persistent disk via `CRYSTALBIO_DB_PATH`.

For real pilot data, do **not** rely on a fully free backend filesystem that resets. A free frontend is fine; the backend needs persistent storage so invites, attendance, forms, approvals, and reports survive restarts.

## Required backend environment variables

- `HOST=0.0.0.0`
- `PORT` — usually provided by the host.
- `CRYSTALBIO_DB_PATH=/opt/render/project/src/data/crystalbio-db.json` or another private persistent path.
- `CRYSTALBIO_ALLOWED_ORIGIN=https://your-frontend-domain`
- `CRYSTALBIO_SEED_DEMO=false` for real client use. If temporarily set to `true`, the seed creates one account per listed email with a unique password.
- `CRYSTALBIO_DEMO_PASSWORD=<private-prefix>` optionally controls the prefix for generated pilot passwords; each seeded user still gets a unique password suffix based on employee ID.
- `CRYSTALBIO_SEEDED_CREDENTIALS_PATH=/private/path/crystalbio-credentials.json` writes the first-seed credential list to a private server file; never commit or publish this file.
- `CRYSTALBIO_REQUEST_LIMIT_BYTES=1048576` keeps browser/API request bodies capped for pilot safety; increase only after photo upload/object storage is designed.

## Required frontend environment variable

- `VITE_CRYSTALBIO_API_URL=https://your-backend-domain`

## Render backend blueprint

`render.yaml` is included for the pilot API service:

- builds the backend with `npm run backend:build`
- starts the API with `npm run backend:start`
- exposes `/health` for host checks
- mounts a small persistent disk at `/var/data`
- keeps client-specific frontend origin and demo password as private Render environment values

## Frontend host settings

Use the normal static build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Set the frontend environment variable before building/deploying:

```text
VITE_CRYSTALBIO_API_URL=https://your-crystalbio-api-domain
```

## Launch safety rules

Use `PILOT_LAUNCH_CHECKLIST.md` as the step-by-step launch runbook before sharing the client link.

- Do not publish demo credentials in a public README or client message.
- Use invite-created accounts for real users.
- Keep mobile numbers as profile/contact details, not as the login method.
- Login is registered email + password. Email OTP backup can be added later.
- During the first pilot days, monitor: login failures, failed saves, form errors, sync/network issues, crashes, and report/PDF generation failures.

## PostgreSQL + Cloudflare production direction

For the production-ready path, use [`docs/POSTGRES_CLOUDFLARE_MIGRATION.md`](./docs/POSTGRES_CLOUDFLARE_MIGRATION.md).

Short version: keep Cloudflare for the app/domain/security layer, move business data from JSON-file storage to PostgreSQL, keep photos/files in object storage such as Cloudflare R2 later, and do the live cutover only after staging migration + Bloom QA.

## What is intentionally deferred

- Excel export is skipped for now.
- Regular owner email/Telegram summaries are deferred until the end-of-June 2026 reporting phase. Reports can be generated/downloaded from the app in the meantime.
