# PostgreSQL + Cloudflare migration plan

This plan moves CrystalBio from JSON-file pilot storage to a production-ready PostgreSQL-backed setup with Cloudflare in front of the app.

## Goal

Use Cloudflare for the public app/domain/security layer and PostgreSQL for durable business data: users, sessions, attendance, Sales visits, Service visits, leave approvals, and reports.

## Current state checked

- Frontend/mobile app can be hosted as a static build.
- Backend is a Node API.
- Current live persistence is JSON-file based through `CRYSTALBIO_DB_PATH`.
- Current main data groups are:
  - `agents`
  - `sessions`
  - `attendance`
  - `sales` with nested visit updates
  - `service` with nested visit updates
  - `leaveRequests`
- Photos should not be stored directly in PostgreSQL. PostgreSQL should store photo metadata/references; actual files should use object storage such as Cloudflare R2 later.

## Non-negotiable data safety rule

Every saved record is important. The migration must preserve all existing live data, including users, sessions, attendance, Sales visits, Service visits, leave requests, report inputs, timestamps, IDs, notes, follow-ups, and any unknown/extra fields found in the JSON file.

No live data should be deleted, overwritten, hidden, renamed, or discarded during migration. If a field does not yet have a final PostgreSQL column, keep it in a safe `raw_json`/metadata field until it is reviewed.

## First step

Create the PostgreSQL migration blueprint before touching the live app:

1. Map the current JSON data shape into PostgreSQL tables.
2. Record every field in the current JSON file, including unknown or rarely used fields.
3. Define a no-loss fallback for extra fields using `raw_json`/metadata columns.
4. Add a database connection layer beside the existing JSON store.
5. Add migration/export scripts that can read the current JSON file and insert into PostgreSQL.
6. Test the migration locally using a copied database file, not the live data file.
7. Compare source JSON counts with PostgreSQL counts before any staging/live cutover.
8. Keep the current JSON backend as rollback until PostgreSQL is verified.

Current Stage 1–2 planning artifacts:

- [`docs/PRODUCTION_STAGE_1_2_PLAN.md`](./PRODUCTION_STAGE_1_2_PLAN.md) — plain-English safe sequence for PostgreSQL and object storage.
- [`docs/POSTGRES_SCHEMA_DRAFT.md`](./POSTGRES_SCHEMA_DRAFT.md) — first draft table map for staging implementation.
- [`scripts/inventory-crystalbio-db.mjs`](../scripts/inventory-crystalbio-db.mjs) — read-only inventory script that counts records/fields/photos without printing secrets, customer names, GPS values, passwords, or tokens.

## Field inventory and PostgreSQL mapping

This is the first no-loss inventory from the current backend state shape. Before live migration, verify it against a copied live JSON file and add any unexpected fields to `raw_json` instead of dropping them.

### Root JSON state

- `nextId` → keep in a migration metadata table so new IDs do not collide after cutover.
- `agents[]` → `agents`
- `sessions[]` → `login_sessions`
- `attendance[]` → `attendance_records`
- `sales[]` → `sales_opportunities` plus nested `sales[].visits[]` → `sales_visit_updates`
- `service[]` → `service_records` plus nested `service[].visits[]` → `service_visit_updates`
- `leaveRequests[]` → `leave_requests`

### `agents` fields

Preserve: `id`, `name`, `role`, `active`, `employeeId`, `email`, `mobile`, `loginCode`, `passcode`, `password`, `inviteToken`, `inviteStatus`.

Safety note: password/passcode fields are sensitive. Migrate exactly as-is first for continuity, then plan credential hardening separately after the app is stable.

### `login_sessions` fields

Preserve: `token`, `agentId`, `agentName`, `role`, `employeeId`, `phone`, `email`.

Safety note: session preservation affects whether users remain logged in. Decide before cutover whether to preserve active sessions or force one fresh login; either choice must be backed by the copied JSON data.

### `attendance_records` fields

Preserve: `id`, `agentId`, `agentName`, `date`, `checkInAt`, `checkInGps.latitude`, `checkInGps.longitude`, `checkInGps.accuracyMeters`, `checkOutAt`, `checkOutGps.latitude`, `checkOutGps.longitude`, `checkOutGps.accuracyMeters`, `status`, `note`, `workTypes`, `autoCheckedOut`, `autoCheckOutReason`, `systemRestored`.

### `sales_opportunities` fields

Preserve: `id`, `ownerAgentId`, `accountName`, `contactPerson`, `designation`, `phone`, `email`, `departmentAddress`, `leadSource`, `productType`, `brandName`, `equipmentModel`, `requirement`, `quoteSubmitted`, `budgetaryProposal`, `quoteStatus`, `fundStatus`, `probability`, `closingDate`, `supportRequired`, `remarksTimeline`, `officeNotes`, `sitePhoto`, `equipmentPlatePhoto`, `installationPhoto`, `issuePhoto`, `visitingCardPhoto`, `step2Saved`, `step3Saved`, `status`.

Nested `visits[]` must move to `sales_visit_updates` without changing order or visit numbers.

### `sales_visit_updates` fields

Preserve: `id`, `opportunityId`, `agentId`, `agentName`, `visitNumber`, `visitDate`, `visitTime`, `gps.latitude`, `gps.longitude`, `gps.accuracyMeters`, `note`, `nextAction`, `followUpDate`, `expectedClosingDate`, `photos[]`.

For `photos[]`, preserve each photo object: `source`, `fileName`, `contentType`, `sizeBytes`, `dataUrl`. Later production storage can move actual photo files to object storage, but migration must not drop existing photo data.

### `service_records` fields

Preserve: `id`, `ownerAgentId`, `customerName`, `phone`, `departmentAddress`, `brandName`, `equipmentName`, `modelName`, `serialNumber`, `contactPerson`, `email`, `issueCategory`, `issueDescription`, `warrantyAmc`, `partsRequired`, `partsUsed`, `machineStatus`, `supportRequiredNote`, `finalRemarks`, `photoNote`, `step2Saved`, `step3Saved`, `status`.

Nested `visits[]` must move to `service_visit_updates` without changing order or visit numbers.

### `service_visit_updates` fields

Preserve: `id`, `serviceRecordId`, `agentId`, `agentName`, `visitNumber`, `visitDate`, `visitTime`, `gps.latitude`, `gps.longitude`, `gps.accuracyMeters`, `serviceType`, `workDone`, `supportRequired`, `nextAction`, `nextVisitDate`, `photos[]`, `officeNotes`.

For `photos[]`, preserve each photo object: `source`, `fileName`, `contentType`, `sizeBytes`, `dataUrl`.

### `leave_requests` fields

Preserve: `id`, `agentId`, `agentName`, `fromDate`, `toDate`, `reason`, `note`, `status`, `reviewedByAgentId`.

### Extra-field rule

Every migrated table should include a `raw_json` column during the first PostgreSQL version. If copied live JSON contains a field not listed above, keep that full source object in `raw_json` and add the field to this inventory before cutover.

## Proposed PostgreSQL tables

- `agents`
- `login_sessions`
- `attendance_records`
- `sales_opportunities`
- `sales_visit_updates`
- `service_records`
- `service_visit_updates`
- `leave_requests`
- `migration_metadata`
- Later, when photos are enabled:
  - `file_attachments`

## Cloudflare role

- Host frontend on Cloudflare Pages or keep current frontend host behind Cloudflare DNS.
- Use Cloudflare DNS/SSL/WAF for `work.convogenie.ai`.
- Consider Cloudflare R2 for future photo/proof uploads.
- Backend can remain on a Node host as long as it connects safely to PostgreSQL.

## Safe cutover order

1. Build PostgreSQL support locally.
2. Run tests and local migration dry-run.
3. Create staging database and migrate a copy of data.
4. Run Bloom QA on staging only.
5. Schedule night/off-hours live cutover.
6. Back up JSON live DB immediately before cutover.
7. Point backend to PostgreSQL.
8. Verify login, attendance, Sales save, Service save, admin reports, and PDF report.
9. Keep rollback path ready until the first real-user checks pass.

## Launch-week rule

Do not perform live database cutover during active daytime usage. Prepare and test in advance; cut over only during an approved night/off-hours window.
