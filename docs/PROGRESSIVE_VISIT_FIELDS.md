# CrystalBio Progressive Visit Field Model

## Approved direction

Sales and service agents cannot fill every client-sheet field while standing at the customer site.

The app should keep all client-required fields, but split them into **Step 1 / Step 2 / Step 3 input sections** that can be saved separately.

This is not a project phase split. It is the actual agent-facing form model.

## Product rule

- Do not skip fields from the client sheet.
- Do not force every field to be completed in one sitting.
- Step 1 must be quick enough to complete during/immediately after the visit.
- Step 2 and Step 3 can be updated later, when the agent has time or after leaving the client place.
- Each step has its own Save button.
- Admin reports should show completion status: Step 1 saved, Step 2 pending/saved, Step 3 pending/saved.
- Backend records should support partial updates without losing previously saved details.
- Agent/engineer name comes from login and is never typed manually in the visit form.
- GPS/current location is mandatory for the actual visit update in Step 1.

## Sales visit steps

### Step 1 — Quick visit update

Purpose: capture the visit before details are forgotten.

Save timing: during the visit or immediately after coming out of the client place.

Fields:

- Current visit GPS/location
- Visit date/time, auto-captured
- Sales executive, from login
- Customer/lab/hospital/account name
- Short visit note: what happened today
- Rough requirement, if known
- Next action:
  - Follow-up needed
  - No follow-up
  - Closed
- Follow-up date, required only when follow-up is needed

Current implementation status: mostly implemented.

### Step 2 — Customer and requirement details

Purpose: complete customer identity and technical requirement details when the agent has more time.

Fields:

- Lead source
- Customer name
- Customer designation
- Customer phone number
- Customer email ID
- Customer department
- Customer address
- Product type
- Brand name
- Equipment name/model
- Requirement details

Current implementation status: implemented in the frontend progressive screen and covered by frontend/backend patch tests. Continue QA for mobile usability and backend persistence.

### Step 3 — Quote, commercial, proof, and office details

Purpose: capture deal/commercial status and supporting proof after the first visit or during follow-up.

Fields:

- Quote submitted: Yes/No
- Budgetary proposal
- Quote / deal status
- Fund status
- Probability
- Closing date
- Support required
- Remarks and timeline
- Photos:
  - Site photo
  - Equipment plate photo
  - Installation photo
  - Issue photo
  - Visiting card photo
- Notes for office team

Current implementation status: implemented in the frontend progressive screen and covered by frontend/backend patch tests. Continue QA for photo/proof usability and admin visibility.

## Service visit steps

The client service form has already been shared and translated into the prototype direction. Continue treating this as the approved progressive service model, then validate the created screens/backend paths against the implemented form fields during QA.

### Step 1 — Quick service visit update

Purpose: capture the actual service visit quickly.

Fields:

- Current visit GPS/location
- Visit date/time, auto-captured
- Service engineer, from login
- Customer/lab/hospital name
- Today’s work done / issue checked
- Service type
- Next action:
  - Parts required
  - Next visit needed
  - No follow-up
  - Closed
- Next visit date, required only when parts/next visit are needed

Current implementation status: mostly implemented.

### Step 2 — Customer, equipment, and issue details

Purpose: complete customer/equipment context after the visit.

Fields to reconcile with client sheet:

- Contact person
- Customer phone
- Customer email
- Department/address
- Equipment/instrument name
- Brand/model
- Serial number
- Complaint/issue category
- Detailed issue description
- Warranty/AMC status, if present in client sheet

Current implementation status: implemented in the frontend progressive screen and covered by frontend/backend patch tests. Continue QA for mobile usability and backend persistence.

### Step 3 — Parts, proof, status, and office details

Purpose: finish service/operations details and supporting proof.

Fields to reconcile with client sheet:

- Parts required details
- Parts used details
- Machine status
- Support required
- Office notes
- Customer confirmation/signature, if present
- Photos:
  - Equipment photo
  - Serial plate photo
  - Issue photo
  - Installation/site photo
- Final remarks

Current implementation status: implemented in the frontend progressive screen and covered by frontend/backend patch tests. Continue QA for photo/proof usability and admin visibility.

## Admin/reporting implications

Admin reports must not only show saved visits. They should show whether the form is complete.

For each sales/service entry, admin should see:

- Agent name
- Visit date/time
- Customer/lab
- Step 1 status
- Step 2 status
- Step 3 status
- Missing important fields
- Follow-up/next visit due date
- Sales/service status

This lets the business get visibility immediately without blocking agents from saving incomplete but useful visit updates.

## Implementation plan

1. Keep current Sales/Service save flows as Step 1.
2. Refactor UI labels to make Step 1 explicit.
3. Add Step 2 sections with separate Save Step 2 action.
4. Add Step 3 sections with separate Save Step 3 action.
5. Extend backend models so Step 2/3 updates patch the same opportunity/service record rather than creating duplicate visits.
6. Add completion status and missing-field summary.
7. Update admin reports to show Step 1/2/3 completion.
8. Run Testing Agent field-by-field against the client sheet.
