# CrystalBio Production Stage 1–2 Plan: PostgreSQL + Photo Storage

Status: planning/staging preparation only. No live app data is changed by this document.

Last updated: 2026-06-21

## Plain-English goal

Move CrystalBio from a strong private pilot setup to a safer production foundation:

1. Store business data in PostgreSQL instead of a single JSON file.
2. Store real photos/files in private object storage instead of keeping image data inside app records.

The production rule is **no saved live record is deleted, hidden, renamed, overwritten, or discarded** during this work.

## Current live pilot data inventory checked on 2026-06-21

Read-only inventory was taken from the active backend JSON file. No records were printed with customer names, GPS values, passwords, or tokens.

- agents: 17
- sessions: 48
- attendance records: 26
- sales records: 25
- sales visit updates: 24
- service records: 8
- service visit updates: 8
- leave requests: 0
- nextId: 479

Photo-related current state:

- Sales top-level photo fields present: `sitePhoto` appears on 1 record.
- Sales visit photo attachments: 1 attachment, stored with `source`, `fileName`, `contentType`, `sizeBytes`, `dataUrl`.
- Service top-level photo note field: `photoNote` appears on 5 records.
- Service visit photo attachments: 4 attachments, stored with `source`, `fileName`, `contentType`, `sizeBytes`, `dataUrl`.

Attendance fields currently include newer live fields that must be preserved:

- `workTypes`
- `autoCheckedOut`
- `autoCheckOutReason`
- `systemRestored`

## Stage 1 — PostgreSQL migration, safe order

### 1. Freeze the data map before coding

Create a table map for every current JSON group:

- `agents`
- `login_sessions`
- `attendance_records`
- `sales_opportunities`
- `sales_visit_updates`
- `service_records`
- `service_visit_updates`
- `leave_requests`
- `file_attachments`
- `migration_metadata`

Every table gets a `raw_json`/metadata fallback column in the first version so unexpected fields are preserved.

### 2. Build locally beside the current JSON store

Do not replace the live backend first. Add PostgreSQL support beside the JSON backend:

- connection/config layer
- PostgreSQL repository methods matching current backend behavior
- migration script from JSON copy to PostgreSQL
- count/field comparison script
- rollback plan to JSON backend

### 3. Test only with a copied live backup

The first migration runs against a copied JSON file, not the active live file.

Validation must compare:

- root counts
- nested visit counts
- attendance open/closed status counts
- photo attachment counts
- `nextId`/ID continuity
- unknown fields preserved in `raw_json`

### 4. Staging cutover before live cutover

Create a staging database and point a staging backend to it. Bloom QA must verify:

- admin login
- agent login
- attendance check-in/check-out
- Sales save and reopen
- Service save and reopen
- leave request/approval
- Field Entry lookup/detail
- reports/PDF download
- existing photos still viewable

### 5. Live cutover only after staging is clean

Off-hours live cutover sequence:

1. Put live app in a short maintenance window if needed.
2. Take a fresh JSON backup.
3. Run final JSON → PostgreSQL migration.
4. Start backend against PostgreSQL.
5. Verify API health.
6. Verify live app journeys.
7. Keep JSON backup and old backend path as rollback until first real-user checks pass.

## Stage 2 — Photo/file storage, safe order

### 1. Use private object storage

Preferred production approach:

- Cloudflare R2 if Cloudflare is the main domain/security layer.
- AWS S3 is also acceptable if that is easier operationally.

Actual image bytes should live in object storage. PostgreSQL stores only metadata and references.

### 2. Create a `file_attachments` model

Each file attachment should store:

- attachment id
- related record type: sales, sales_visit, service, service_visit, attendance if needed later
- related record id
- purpose: site photo, equipment plate, installation, issue, visiting card, service proof, sales proof, etc.
- storage provider: r2 or s3
- storage bucket
- storage key
- original file name
- content type
- size bytes
- uploaded by agent/admin id
- created timestamp
- migrated-from-JSON flag if applicable
- raw_json fallback

### 3. Keep current app screens stable

Do not redesign Sales/Service flows for storage work.

- Existing camera/upload controls stay in the current Step 1 flow.
- Existing admin photo preview stays in Field Entry/detail screens.
- The backend changes where the file is saved, not how the agent thinks about the task.

### 4. Migration for existing embedded photos

Existing `dataUrl` photo attachments should be migrated carefully:

1. Read copied JSON backup.
2. Decode each `dataUrl` into a file object.
3. Upload it to private R2/S3.
4. Create a `file_attachments` row linked to the original Sales/Service visit.
5. Preserve the original JSON source in `raw_json` until verified.
6. Compare original embedded photo count with uploaded attachment count.

### 5. App viewing/security

Photos should not become public links.

- Logged-in backend checks permission.
- Admin can view team photos.
- Agents view their own relevant records.
- Backend returns a short-lived signed view URL or streams the file through an authorized endpoint.

## What is not changing now

- No live database cutover now.
- No live file/photo move now.
- No deletion or reset of real records.
- No broad UI redesign.
- No forced user logout.

## Next concrete implementation tasks

1. Add `docs/POSTGRES_SCHEMA_DRAFT.md` with draft table definitions. ✅
2. Add a read-only migration inventory script that outputs counts/unknown fields without secrets. ✅
3. Add PostgreSQL connection/config scaffolding behind an environment flag. ✅ Source scaffold added; runtime remains locked to JSON until staging QA.
4. Add a staging JSON → PostgreSQL migration SQL generator and count summary script. ✅ First version added for copied backups only.
5. Add object-storage adapter interface and local fake adapter tests/scaffold. ✅ Interface and local migration placeholder added; R2/S3 remain blocked until private bucket credentials are configured.
6. Add R2/S3 environment variable placeholders to `.env.example` or deployment docs. ✅ Placeholders added with JSON as default persistence.
7. Run staging migration and Bloom QA before any live cutover. ✅ Local PostgreSQL/photo rehearsal passed with copied backup counts; managed staging database/bucket runner is prepared in `docs/MANAGED_STAGING_SETUP.md`, but real managed credentials are still needed before the managed rehearsal can run.
