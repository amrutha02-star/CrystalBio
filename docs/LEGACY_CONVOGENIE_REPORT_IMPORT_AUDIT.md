# Legacy Convogenie report import audit

Date checked: 2026-06-16

Source report URLs checked after login:

- `https://console.convogenie.ai/reports/crystal-bio-sales-daily-YYYY-MM-DD`
- `https://console.convogenie.ai/reports/crystal-bio-service-daily-YYYY-MM-DD`
- `https://console.convogenie.ai/reports/crystal-bio-all-daily-YYYY-MM-DD`

Sample window audited: 2026-05-01 through 2026-05-21.

## Short answer

The old Convogenie records can be brought into the new CrystalBio app, but the safest first version should import them as **historical Sales/Service/Attendance records with original raw data preserved**.

They should not be treated as perfectly clean new-app records without a review pass, because the old reports contain duplicates, mixed status labels, missing fields on some entries, and some fields that are named differently across days.

## Counts from audited window

From 2026-05-01 through 2026-05-21:

- Sales report rows found: 65
- Service report rows found: 69
- Combined Sales + Service visit rows found: 134
- Login/attendance rows visible in combined daily reports: 168

These are report-page row counts, not yet de-duplicated final import counts.

## Old Sales fields seen

Fields seen across Sales daily reports:

- Report Mode
- Working Status
- Sales Executive Name
- Team Member Name
- Location Coordinates
- Location Accuracy Meters
- Coordinates
- Location Address
- Customer Location
- Account / Account Name
- Lead Source
- Product Type
- Brand / Brand Name
- Equipment Name
- Quote Submitted
- Project Quote Status
- Budgetary Proposal
- Fund Status
- Probability / Probability Of Closing
- Closing Date
- Is Support Required / Support Required
- Remarks / Remarks And Timeline / Timeline
- Customer / Customer Name
- Customer Name And Designation
- Customer Phone / Customer Phone Number
- Customer Email / Customer Email Id / Customer Email I D / Email
- Customer Department / Customer Department Address / Customer Department And Address
- Leave Reason
- Approved By

## Old Service fields seen

Fields seen across Service daily reports:

- Report Mode
- Working Status
- Engineer Name
- Location Coordinates
- Location Accuracy Meters
- Coordinates
- Location
- Customer Name
- Customer Phone Number
- Customer Department And Address
- Brand Name
- Equipment Name
- Serial Number
- Service Type
- Work Done
- Support Required
- Next Action
- Probability

## Fit with the new app

### Strong fit

Most old Sales records map well into the new app’s Sales progressive model:

- Sales Executive Name → agent/executive
- Account / Account Name → account name
- Customer Name / Customer Name And Designation → customer/contact details
- Phone/email/address → customer contact fields
- Lead Source → lead source
- Product Type / Brand / Equipment → product/equipment fields
- Quote Submitted / Quote Status / Budget / Fund / Probability / Closing Date → commercial Step 3 fields
- Remarks / Timeline → remarks and timeline
- Location Coordinates / Accuracy → visit GPS

Most old Service records also map well:

- Engineer Name → service engineer
- Customer Name / phone / address → customer fields
- Brand / Equipment / Serial Number → equipment fields
- Service Type / Work Done → service visit update
- Support Required / Next Action → follow-up/action fields
- Location Coordinates / Accuracy → visit GPS

### Gaps / caution areas

- Some Sales fields are named differently across dates, for example `Customer Email`, `Customer Email Id`, `Customer Email I D`, and `Email`.
- Some entries have only partial details.
- Some Sales rows appear duplicated, especially where the same agent/customer/time/details repeat.
- Old reports show `Working Status: login` even inside Sales/Service rows, so that field should not be trusted as the visit type.
- Service has a `Probability` field in the old reports, but the new service model does not currently treat probability as a normal service field. Preserve it in raw data or add a service-status/probability field only if Rahul wants it visible.
- Pending/no-report rows are not visit records. They should not be imported as Sales or Service entries.
- Login rows should be treated as attendance records, separate from Sales/Service visits.
- Old combined reports are useful for cross-checking but should not be imported in addition to Sales/Service pages, or records may be duplicated.

## Recommended import approach

1. Export/fetch old daily report pages for the approved date range.
2. Parse Sales daily pages for Sales records.
3. Parse Service daily pages for Service records.
4. Use All daily pages only for verification/count comparison, not as the main import source.
5. Normalize field-name variants into one internal shape.
6. Match old employee names to new app users.
7. De-duplicate obvious repeated rows before import.
8. Insert into the new app as historical records with:
   - original report date/time,
   - agent/engineer name,
   - mapped app fields,
   - `legacy_source_url`,
   - `legacy_report_type`,
   - `raw_json` containing the full original row.
9. Keep imported legacy records clearly marked as legacy/historical in admin review.
10. Run a post-import count check by date, type, and agent.

## Import decision

Possible: yes.

Recommended first import type: historical Sales/Service/Attendance archive records, with mapped fields plus raw original row preserved.

Not recommended: direct blind import as clean live editable records without de-duplication and employee-name matching.
