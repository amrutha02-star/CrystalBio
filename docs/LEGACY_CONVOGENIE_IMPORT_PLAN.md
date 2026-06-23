# Legacy Convogenie import audit and plan

Date prepared: 2026-06-16

Scope audited:

- Date scan: `2026-01-01` through `2026-06-16`
- Active legacy data found from: `2026-04-20` through `2026-06-16`
- Sources:
  - Sales daily pages: `crystal-bio-sales-daily-YYYY-MM-DD`
  - Service daily pages: `crystal-bio-service-daily-YYYY-MM-DD`
  - Combined daily pages: `crystal-bio-all-daily-YYYY-MM-DD`

No data was changed in either Convogenie or the new CrystalBio app. This is an audit/import plan only.

## Executive answer

Yes, the previous Convogenie records can be brought into the new CrystalBio app.

The right approach is not a blind copy. The data should be separated into the new app’s business buckets, cleaned for exact duplicates, matched to the right employees, and imported as clearly marked **legacy history** with the original row preserved in `raw_json`/legacy metadata.

## What was found

From the selected import sources:

- Sales visit rows: 234 old rows, 194 after exact duplicate removal
- Service visit rows: 207 old rows, 176 after exact duplicate removal
- Attendance/login rows: 372 old rows, 309 after exact duplicate removal
- Leave/holiday rows: 3 old rows, 3 after exact duplicate removal
- Pending/no-report rows: 2,192 rows, not field activity records
- Exact duplicates removed: 134 total

Duplicate split:

- Sales duplicate rows: 40
- Service duplicate rows: 31
- Attendance/login duplicate rows: 63

## How data should be separated into the new platform

### 1. Sales visit history

Source: Sales daily report pages only.

Target in new app:

- `sales_opportunities`
- nested/linked `sales_visit_updates`

What maps well:

- Sales executive name
- Account/lab/hospital name
- Customer/contact name
- Phone/email/address
- Lead source
- Product type
- Brand/equipment
- Quote submitted
- Quote/project status
- Budget/fund status
- Probability
- Closing date
- Support required
- Remarks/timeline
- GPS coordinates and accuracy

Fields that need careful handling:

- `Customer Name And Designation` may contain both person name and designation in one field.
- `Remarks` can be either visit note or opportunity timeline, depending on entry quality.
- Old `Working Status` often says `login` even inside Sales rows, so it should go to raw legacy metadata, not drive the new app status.
- Some old rows have missing account/contact fields and should still be imported, but marked incomplete.

### 2. Service visit history

Source: Service daily report pages only.

Target in new app:

- `service_records`
- nested/linked `service_visit_updates`

What maps well:

- Engineer name
- Customer name
- Customer phone/address
- Brand
- Equipment name
- Serial number
- Service type
- Work done
- Support required
- Next action
- GPS coordinates and accuracy

Fields that need careful handling:

- Old `Probability` appears on service rows but is not a normal new Service form field. Preserve it in raw legacy metadata unless Rahul wants a visible service priority/probability field.
- Some rows use partial equipment information.
- Some rows describe delivery/admin work rather than a technical service job; import them as service history but mark the original source.

### 3. Attendance/login history

Source: Combined daily pages.

Target in new app:

- `attendance_records`

What maps well:

- Team member / executive / engineer name
- Login timestamp
- GPS coordinates
- Location accuracy
- Remarks/reason

Important limitation:

- These are login/check-in style rows. They do not always contain a clean checkout. Import as legacy check-in attendance unless the old data later exposes checkout separately.

### 4. Leave/holiday history

Source: Combined daily pages, Leave/Holiday section.

Target in new app:

- `leave_requests`

Finding:

- Only 3 leave/holiday rows were found in the full scan.
- These need manual review because old rows may use Sales/Service-style name fields.

### 5. Pending/no-report rows

Source: Combined daily pages, No Report Submitted section.

Target recommendation:

- Do not import as Sales, Service, Attendance, or Leave.
- Optional: keep as a separate legacy accountability archive if CrystalBio wants historical “who did not submit” visibility.

Reason:

- These rows are daily accountability gaps, not saved customer work.
- Importing them into field activity would pollute reports.

## Source choice to avoid duplicates

Use these import sources:

- Sales rows: Sales daily pages
- Service rows: Service daily pages
- Attendance, leave, pending/no-report: Combined daily pages

Do not import Sales/Service rows from Combined daily pages because those duplicate the separate Sales and Service pages.

## New-app data model adjustments recommended before import

The current new app data model already covers most fields, but legacy import needs a safe preservation layer.

Recommended additions:

- Add legacy metadata/raw JSON preservation to imported records:
  - `legacySource?: 'convogenie'`
  - `legacySourceUrl?: string`
  - `legacySourceDate?: string`
  - `legacyReportType?: 'sales' | 'service' | 'all'`
  - `legacyImportedAt?: string`
  - `legacyExactHash?: string`
  - `rawJson?: object`
- Allow imported records to be marked as historical:
  - `isLegacyImport?: boolean`
  - `legacyImportBatchId?: string`
- Add an admin-only filter/label so reports can show or hide legacy rows intentionally.

Do not expose technical raw JSON to agents.

## Employee-name matching needed

The old data uses inconsistent employee names. Examples seen:

- `Sanjeev P` and `Sanjeev`
- `Girish D` and `Girish`
- `Surendra kumar m`, `Surendra Kumar m`, `Surendra Kumar M`, and `Surendra`
- `Prasanna Kumar mv`, `Prasanna Kumar M V`, and `Prasanna`
- `Ajay s`, `A S AJAY`, and `Ajay`
- `Manjunath.N.M`, `Manjunath`, and typo variants
- `DEEKSHAK [CRYSTAL BIO]` and `Deekshak`

Before import, create a manual name-matching table from old report names to new app users. Any unmatched names should import with the old name preserved and an `unmatched_legacy_agent` flag, not be guessed into the wrong employee.

Rahul/team confirmation update on 2026-06-16:

- Non-Ajay employee variants in the matching review are confirmed as the same employees as proposed.
- Ajay variants must be matched using employee phone number before import because there are two employees named Ajay; do not assign Ajay rows by name alone.
- Customer/company-looking names remain unmatched/review-only unless separately confirmed.

Ajay phone-match review result:

- Live app has two active Ajay profiles: Ajay AS / Sales / `CB-S-006` / phone ending **5588**, and Ajay / Service / `CB-SE-005` / phone ending **5825**.
- Legacy `Ajay` rows match the Service Ajay profile by phone in the old no-report archive.
- Legacy `Ajay s`, `A S AJAY`, and `Ajay, madhu` remain blocked until Rahul/team confirms the correct employee.

## Data quality findings

### Duplicates

There are real duplicate rows. Exact duplicate removal reduced:

- Sales: 234 → 194
- Service: 207 → 176
- Attendance: 372 → 309

A second “near duplicate” review is still needed because some duplicate-looking rows may differ only slightly in timestamp/name spelling.

### Mixed labels

Old records use multiple label styles for the same thing, for example:

- `Customer Email`, `Customer Email Id`, `Customer Email I D`, `Email`
- `Brand`, `Brand Name`
- `Probability`, `Probability Of Closing`, `Win Probability`
- `Remarks`, `Remarks And Timeline`, `Timeline`

The importer must normalize these before saving to the new app.

### Incomplete rows

Some old rows have missing customer, contact, or equipment fields. These should still be imported as incomplete legacy records instead of dropped.

### Service probability

Service rows sometimes contain `Probability`. This does not belong cleanly in the current Service form. Preserve it in raw metadata unless the business wants it visible.

### Pending/no-report rows

These are not customer activity. Keep separate.

## Import plan

### Phase 1 — Freeze the audit range

Decision needed from Rahul:

- Import all active legacy records found from `2026-04-20` through cutover date, or
- Import only a chosen historical range.

Current audit scanned through `2026-06-16`.

### Phase 2 — Create the employee name-match table

Prepare a simple reviewed mapping:

- old report name
- new app user/agent id
- role: Sales / Service / Both / Admin
- confidence: confirmed / needs review

No old record should be assigned to a user by guess.

### Phase 3 — Build importer in dry-run mode

Importer should:

1. Fetch/export old report pages for the approved date range.
2. Parse rows into buckets.
3. Normalize field names.
4. Remove exact duplicates using a stable hash.
5. Flag near duplicates for review.
6. Match employee names using the approved table.
7. Produce a dry-run summary:
   - rows by date
   - rows by employee
   - rows by type
   - duplicates skipped
   - unmatched employees
   - fields preserved only in raw JSON

### Phase 4 — Add legacy support to the new app backend

Small backend-only changes first:

- Add optional legacy metadata/raw JSON support.
- Add import batch tracking.
- Add admin/report filtering rules for legacy records.
- Ensure imported records appear in admin review/report views only where intended.

No agent-facing UI redesign is needed.

### Phase 5 — Local import rehearsal

Use a copied local database only.

Checks:

- Import completes without data loss.
- Counts match the dry run.
- Sales records open under Sales history.
- Service records open under Service history.
- Attendance rows appear as historical check-ins.
- Pending/no-report rows do not pollute Sales/Service/Attendance.
- Original raw row is still available for admin audit.

### Phase 6 — Bloom QA

Bloom should test with Bloom accounts and local/staging data only:

- Admin can view imported legacy Sales rows.
- Admin can view imported legacy Service rows.
- Reports can include/exclude legacy rows as intended.
- New live form submissions still work normally.
- Legacy rows do not appear as editable active work unless explicitly allowed.

### Phase 7 — Rahul approval

Rahul should approve:

- import date range,
- whether pending/no-report rows are kept or ignored,
- employee name-match table,
- whether legacy rows appear in normal reports or only in an archive filter.

### Phase 8 — Production import, only after backup

Production steps:

1. Take a fresh backup of the new app database.
2. Export/fetch the old Convogenie reports for the final approved range.
3. Run importer dry-run against the production backup copy.
4. Review counts.
5. Run import during a quiet window.
6. Verify admin screens and reports.
7. Keep rollback backup.

## Recommended product behavior after import

- Admin Field Entry / Agents: show legacy records with a small `Legacy` label.
- Reports: default can include legacy records if the date range is historical, but there should be a clear admin filter later if needed.
- Agents: do not clutter active agent workflows with old imported history unless necessary.
- Raw old fields: admin-only, not shown to field agents.
- Pending/no-report: separate archive only, not mixed with visits.

## Artifacts created

Sensitive local audit files:

- `docs/legacy-convogenie-audit/legacy_convogenie_audit_2026-01-01_to_2026-06-16.json`
- `docs/legacy-convogenie-audit/legacy_convogenie_unique_rows_2026-01-01_to_2026-06-16.csv`
- `docs/legacy-convogenie-audit/legacy_convogenie_summary_2026-01-01_to_2026-06-16.md`

Reusable audit script:

- `scripts/audit-legacy-convogenie-reports.py`

These files contain old customer/contact report data and should be treated as sensitive project data.

## Final recommendation

Proceed, but in this order:

1. Approve the date range.
2. Review employee-name matching.
3. Build importer with dry-run only.
4. Add legacy metadata support in the new app.
5. Rehearse locally.
6. Bloom QA.
7. Import to production only after backup and approval.

This is feasible and safer than leaving the old records outside the new platform, but it must be treated as a controlled legacy-data import, not a simple copy-paste migration.


## Dry-run import preview — 2026-06-16

A local dry-run importer was built and run from the audited legacy export and the current employee matching CSV. It did **not** call the live app/API and did **not** write to any database.

Dry-run result:

- Source unique rows reviewed: 2,874
- Ready/importable after current matching rules: 572
  - Sales visit history: 178
  - Service visit history: 119
  - Attendance/login history: 272
  - Leave/holiday history: 3
- Blocked rows needing review before the current rehearsal: 0
- Excluded for now by Rahul/team decision: 110
  - Service: 57
  - Attendance/login: 37
  - Sales: 16
- Skipped pending/no-report accountability rows: 2,192

Excluded-for-now names:

- `Ajay s`: 34 rows
- `A S AJAY`: 13 rows
- `Ajay, madhu`: excluded until the team wants to resolve it later
- customer/company names such as `Veolia`, `Garden City`, `Harish`, `Sabil`, `SPCBE`, and one-off doctor/customer names are treated as customer/company data, not employees

Dry-run files:

- `scripts/dry-run-legacy-convogenie-import.py`
- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_dry_run_summary.md`
- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_dry_run.json`
- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_importable_rows.csv`
- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_blocked_rows.csv`
- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_excluded_for_now_rows.csv`

Current decision: Rahul/team decided to skip the 110 previously blocked rows for now and treat customer/company-looking names as customer/company data, not employees. Do not import into live production. The next safe import step is to run the 572-row importer against a backup/staging copy only.

## Customer-history webpage direction — 2026-06-16

Rahul/team changed the preferred direction: do **not** put the old Convogenie rows into the active app records for now. Instead, keep them together in a separate read-only customer-history webpage.

Rules for this archive page:

- Customer/company-centric first, not agent-centric.
- Oldest rows appear first and most recent rows last.
- Do not edit, clean, rewrite, or auto-fill old data.
- Empty fields stay blank so the owner can see what agents left empty.
- Customer/company-looking names remain customer/company data, not employees.
- The page is a local/archive artifact only; it does not import or modify CrystalBio app data.

Generated artifacts:

- `scripts/build-legacy-customer-history-page.py`
- `docs/legacy-convogenie-audit/customer-history-page/index.html`
- `docs/legacy-convogenie-audit/customer-history-page/legacy_customer_history_data.json`

Verified archive output:

- Source rows included: 3,008 captured rows, including exact duplicates as captured by the audit.
- Customer/groups: 242.
- Date order: 2026-01-01 through 2026-06-16, oldest to most recent.
- Report buckets included together: pending/no-report, attendance/login, sales, service, leave/holiday.
- Local HTTP check returned the archive page successfully.
