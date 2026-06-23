# Legacy Convogenie data separation for the new CrystalBio app
Audit window: 2026-05-01 through 2026-05-21.

## Import buckets
- sales_visit: 65 source rows, 48 after exact duplicate removal
- service_visit: 69 source rows, 48 after exact duplicate removal
- attendance_login: 168 source rows, 126 after exact duplicate removal
- leave_holiday: 1 source rows, 1 after exact duplicate removal
- pending_no_report: 295 source rows, 295 after exact duplicate removal

Exact duplicate rows in the selected import sources: 80.

## How old data should be separated

### 1. Sales visit history
Import from Sales daily pages only. Create/patch `sales_opportunities` and related `sales_visit_updates`. Keep the full old row in `raw_json`.

Fields seen: Account, Brand Name, Coordinates, Customer Department And Address, Customer Email Id, Customer Name And Designation, Customer Phone Number, Equipment Name, Lead Source, Location Accuracy Meters, Location Address, Location Coordinates, Probability, Product Type, Project Quote Status, Quote Submitted, Remarks And Timeline, Report Mode, Sales Executive Name, Working Status

Key mapping:
- `Account` → sales_opportunities.accountName
- `Account Name` → sales_opportunities.accountName
- `Approved By` → raw_json.auditField
- `Brand` → sales_opportunities.brandName
- `Brand Name` → sales_opportunities.brandName
- `Budgetary Proposal` → sales_opportunities.budgetaryProposal
- `Closing Date` → sales_opportunities.closingDate
- `Coordinates` → sales_visit_updates.gps
- `Customer` → sales_opportunities.contactPerson
- `Customer Department` → sales_opportunities.departmentAddress
- `Customer Department Address` → sales_opportunities.departmentAddress
- `Customer Department And Address` → sales_opportunities.departmentAddress
- `Customer Email` → sales_opportunities.email
- `Customer Email I D` → sales_opportunities.email
- `Customer Email Id` → sales_opportunities.email
- `Customer Location` → sales_opportunities.departmentAddress or raw_json
- `Customer Name` → sales_opportunities.contactPerson
- `Customer Name And Designation` → sales_opportunities.contactPerson + designation review
- `Customer Phone` → sales_opportunities.phone
- `Customer Phone Number` → sales_opportunities.phone
- `Email` → sales_opportunities.email
- `Equipment Name` → sales_opportunities.equipmentModel
- `Fund Status` → sales_opportunities.fundStatus
- `Is Support Required` → sales_opportunities.supportRequired
- `Lead Source` → sales_opportunities.leadSource
- `Leave Reason` → leave_requests.reason if leave record else raw_json
- `Location Accuracy Meters` → sales_visit_updates.gps.accuracyMeters
- `Location Address` → sales_visit_updates.note or raw_json
- `Location Coordinates` → sales_visit_updates.gps
- `Probability` → sales_opportunities.probability
- `Probability Of Closing` → sales_opportunities.probability
- `Product Type` → sales_opportunities.productType
- `Project Quote Status` → sales_opportunities.quoteStatus
- `Quote Submitted` → sales_opportunities.quoteSubmitted
- `Remarks` → sales_opportunities.remarksTimeline / sales_visit_updates.note
- `Remarks And Timeline` → sales_opportunities.remarksTimeline
- `Report Mode` → raw_json.auditField
- `Sales Executive Name` → sales_opportunity.ownerAgentId / sales_visit_updates.agentName (match by employee name)
- `Support Required` → sales_opportunities.supportRequired
- `Team Member Name` → attendance_records.agentName (for login rows only)
- `Timeline` → sales_opportunities.remarksTimeline
- `Working Status` → raw_json.auditField

### 2. Service visit history
Import from Service daily pages only. Create/patch `service_records` and related `service_visit_updates`. Keep the full old row in `raw_json`.

Fields seen: Brand Name, Coordinates, Customer Department And Address, Customer Name, Customer Phone Number, Engineer Name, Equipment Name, Location Accuracy Meters, Location Coordinates, Next Action, Probability, Report Mode, Serial Number, Service Type, Support Required, Work Done, Working Status

Key mapping:
- `Brand Name` → service_records.brandName
- `Coordinates` → service_visit_updates.gps
- `Customer Department And Address` → service_records.departmentAddress
- `Customer Name` → service_records.customerName
- `Customer Phone Number` → service_records.phone
- `Engineer Name` → service_records.ownerAgentId / service_visit_updates.agentName (match by employee name)
- `Equipment Name` → service_records.equipmentName
- `Location` → service_visit_updates.note or raw_json
- `Location Accuracy Meters` → service_visit_updates.gps.accuracyMeters
- `Location Coordinates` → service_visit_updates.gps
- `Next Action` → service_visit_updates.nextAction
- `Probability` → service_records.raw_json unless Rahul wants visible service probability
- `Report Mode` → raw_json.auditField
- `Serial Number` → service_records.serialNumber
- `Service Type` → service_visit_updates.serviceType
- `Support Required` → service_visit_updates.supportRequired
- `Work Done` → service_visit_updates.workDone
- `Working Status` → raw_json.auditField

### 3. Attendance/login history
Import login rows from All daily pages to `attendance_records`. Treat them as check-in/login history, not Sales/Service visits.

Fields seen: Coordinates, Engineer Name, Location, Location Accuracy Meters, Location Coordinates, Probability, Remarks, Report Mode, Sales Executive Name, Team Member Name, Working Status

Key mapping:
- `Coordinates` → attendance_records.checkInGps
- `Location Accuracy Meters` → attendance_records.checkInGps.accuracyMeters
- `Location Coordinates` → attendance_records.checkInGps
- `Probability` → raw_json.auditField
- `Remarks` → attendance_records.note
- `Report Mode` → raw_json.auditField
- `Team Member Name` → attendance_records.agentName
- `Working Status` → attendance_records.status/raw_json

### 4. Pending/no-report rows
Do not import these as field records. They are daily accountability gaps. Keep only if CrystalBio wants a historical “no report submitted” audit view.

### 5. Leave/holiday rows
Map only real leave/holiday articles to `leave_requests`. In the audited sample, leave/holiday detail rows were not prominent; keep parser support but review broader date range before import.

## Platform readiness decision
Possible: yes. Recommended import style: legacy/history mode first, with exact duplicate removal, employee-name matching, and raw original row preservation. Do not use All daily pages as an import source for Sales/Service because they duplicate the separate Sales and Service daily pages.

## Local audit artifact
Structured extracted records for this audit window are saved at `docs/legacy-convogenie-audit/legacy_records_2026-05-01_to_2026-05-21.sampled.json`. This file contains old customer/contact details and should be treated as sensitive project data.
