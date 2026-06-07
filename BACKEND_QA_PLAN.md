# Crystal Bio Backend + Testing Agent Plan

## Build order

Backend starts only after the Service Visit flow is visually approved. The first backend milestone should support real testing, not final polish.

## Backend modules

1. Authentication and roles
   - Agent login
   - Admin login
   - Agent profile: name, role, team, active/inactive
   - Agent name is attached from login/session, never typed inside visit forms

2. Attendance
   - Check-in
   - Check-out
   - Current GPS/location for attendance events
   - Attendance history
   - Leave request
   - Leave status

3. Customer/account records
   - Customer/account name
   - Contact person
   - Phone
   - Email where applicable
   - Department/address
   - Stored customer location/address

4. Sales opportunity records
   - Customer/account link
   - Product type
   - Brand/equipment/model
   - Requirement details
   - Quote/deal status
   - Fund status
   - Probability
   - Closing date
   - Office notes

5. Sales visit updates
   - Opportunity link
   - Agent ID from login
   - Visit number
   - Visit date
   - Visit time
   - Current visit GPS/location — mandatory
   - Visit note
   - Next action: follow-up needed / no follow-up / closed
   - Follow-up date if required
   - Photos/files

6. Service equipment/service records
   - Customer/account link
   - Equipment name/model
   - Brand name
   - Serial number
   - Current service status: open / pending parts / revisit needed / closed

7. Service visit updates
   - Service record link
   - Agent/engineer ID from login
   - Service visit number
   - Service visit date
   - Visit time
   - Current visit GPS/location — mandatory
   - Service type: installation / preventive maintenance / breakdown / repair / calibration / demo / training / other
   - Work done
   - Support required: yes/no
   - Next action: revisit needed / parts needed / closed / no follow-up
   - Next visit/follow-up date if required
   - Photos/files
   - Notes for office team

8. Reports
   - Daily report by agent
   - Weekly report by agent
   - Monthly report by agent
   - Admin all-agent report
   - Missing data/follow-up due list

## Testing agent scope

Create an automated QA/testing agent that runs after backend and screens are connected.

The testing agent must check:

### Authentication
- Agent can login
- Admin can login
- Wrong password fails clearly
- Logged-in agent name is attached to records without asking in form

### Attendance journey
- Check-in works
- Check-out works
- GPS required behavior works
- Attendance log displays correctly
- Leave request can be submitted
- Leave status appears

### Sales journey
- Search previous entry works
- New sales visit entry works
- Customer fields save
- Opportunity fields save
- New visit update saves
- Visit date selector works
- Follow-up date selector works only when follow-up is needed
- Closing date selector works
- Current visit GPS is mandatory
- Camera button works
- Upload button works
- Save button works and stays visible
- Multiple sales visits appear in visit history
- No sales executive name field is shown

### Service journey
- Search previous customer/equipment works
- New service visit entry works
- Customer/equipment fields save
- Service type saves
- Work done saves
- Support required yes/no saves
- Next action saves
- Next visit date selector works
- Current visit GPS is mandatory
- Camera button works
- Upload button works
- Save service update works and stays visible
- Multiple service visits appear in service history
- No engineer name field is shown

### Admin/report journey
- Admin sees all agents
- Admin sees daily/weekly/monthly reports
- Admin can filter by agent and date range
- Sales and service visits appear in reports
- Attendance and leave appear in reports
- Missing GPS or missing required fields are flagged
- Follow-ups due are visible

## Testing output

Each QA run should produce and document on GitHub:

- pass/fail checklist
- screenshot evidence for failed journeys
- console/API error logs
- GitHub issues for confirmed bugs
- fix/retest history for bugs that were corrected
- plain-English issue summary
- priority recommendation

## Agent roles

- Testing Agent: required. Tests journeys, creates GitHub issues, records evidence, and retests fixes.
- Bug-Fixer Agent: recommended once backend starts. Fixes only confirmed issues and moves them back to Testing Agent for retest.
- The Bug-Fixer Agent must not close or verify its own bugs.

## Non-negotiable logic checks

- Any displayed date must have a way to select/change it.
- Every long form must have a visible save action.
- Every visit update must store agent ID from login.
- Every visit update must store current visit location/GPS.
- Photos must start with Camera and Upload.
- No Save Draft if Save accepts partial records.
