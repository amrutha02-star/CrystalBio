# Field Agent Reporting Platform

## Prototype App Status

**Design rule:** all Crystal Bio UI work must follow [`DESIGN.md`](./DESIGN.md). Agent-side screens must be visually approved before admin-side polish continues.

A first mobile-first React/Vite prototype has been started in this repository.

Current app includes:

- Mobile-first agent home
- Real login-code/PIN backend support for pilot users
- Daily check-in/check-out action with GPS requirement
- Sales Visit action with saved visit updates
- Service Visit action with saved service updates
- Leave Request action with admin-review status
- My Entries / recent visits preview
- Agent My Reports page with compact Daily / Weekly / Monthly report generation
- Admin overview, approvals, agents, field entry, profiles, and reports screens
- Backend admin report API generated from saved field activity
- JSON-file backend persistence with backup recovery for pilot use
- Bottom navigation with icons and selected state
- Phased build plan

Current UX corrections to preserve:

- **Agents** is an operational visibility screen: who checked in, who updated visits, missing reports, and Sales/Service filtering. Do not convert it into profile creation or onboarding.
- **Field entry** is separate from Agents. It is the admin path for entering a Sales or Service report when admin/back office needs to submit one.
- **Profile** owns controlled user/profile creation, invites, password setup, resend/reset/deactivate, and access rules.
- Report date controls must be compact. Do not use a large date-range card by default. Show visible From/To fields only when a custom date selection is actually needed.
- Agent My Reports should be a visual-first, approval-pending screen until the user approves it. For now it must show one simple report setup flow: choose report type (Attendance / Visit / Combined), choose period including Custom dates with visible From/To fields, then tap one Generate report button. Do not build/connect backend logic for this page until visual approval.
- Agent My Reports must not use numbered 1/2/3 cards, duplicate Daily/Weekly/Monthly controls, large non-clickable stat tiles, or repeated report-summary boxes. Attendance must be a real selectable report type if the page says reports include attendance.
- Admin Reports should follow the same one-flow rule: choose report date range, choose who the report is for, then tap one Generate report button. Admin must support Whole office, role-wise, and individual agent report generation without duplicate period/generate controls.
- Font sizes should follow the design scale in `DESIGN.md`; avoid oversized report cards, heavy labels, and mixed typography hierarchy.

Local commands:

```bash
npm install
npm test
npm run build
npm run dev
npm run backend:dev
```

Backend pilot accounts seeded by `npm run backend:dev` when the database is empty:

- Admin: login code `admin`, PIN `admin1234`
- Sales agent: login code `sales1`, PIN `1234`
- Service agent: login code `service1`, PIN `1234`

To connect the web app to the backend, build/run it with `VITE_CRYSTALBIO_API_URL` pointing to the backend URL.

---

## Backend in Plain Language

Think of the app as two parts:

1. **Frontend / mobile screen** — what the agent sees on the phone.
2. **Backend / storage room** — the private place where submitted data is kept.

When an agent logs in and saves a visit, the phone screen sends that entry to the backend. The backend writes it into a database/file, then the admin screen reads from the same saved data to show reports.

For a pilot, this repository now supports a simple open-source/self-hostable backend:

- A Node.js backend server receives login, attendance, visit, leave, and report requests.
- Data is saved into a JSON database file on the server.
- A backup file is kept so the previous good data can be recovered if the main file is damaged.
- This avoids Supabase lock-in for the first pilot.

For production, we have three practical options:

- **Option A: Current self-hosted Node backend + JSON file** — fastest pilot, low cost, okay for controlled testing with 12–13 users.
- **Option B: Self-hosted open-source database** such as PostgreSQL or PocketBase — better once real daily usage starts.
- **Option C: Managed backend** such as Supabase — less server maintenance, but uses a third-party hosted service.

My recommendation: use the current self-hosted backend for the controlled pilot, then move the same data model to PostgreSQL/PocketBase if the client starts using it daily.

---

## Purpose

This platform is designed for companies with service and sales agents who work on the field, where the owner/admin currently has limited visibility into what actually happens during visits.

The goal is to replace unreliable WhatsApp/form-based reporting with a simple mobile-first app where agents can submit field updates, continue follow-ups, request leave, and view their own work history. Admins and owners get live visibility, automatic reports, and issue alerts.

---

## Core Users

### 1. Field Agents

Agents are service/sales staff working outside the office.

They should be able to:

- Log in using their assigned email ID.
- Submit field visit reports.
- Save incomplete work as draft.
- Continue the same entry during second/third visits.
- Mark work as follow-up needed, pending, or completed.
- Apply for leave.
- View their own reports and previous entries.
- Receive their own reports by email.

### 2. Admin / Manager

Admins should be able to:

- View all agent reports.
- Filter by date, agent, status, area/branch, customer/site, and visit type.
- View pending follow-ups and overdue items.
- Approve or reject leave requests.
- See missing submissions.
- Download PDF/Excel reports.
- View platform issues and user difficulties.

### 3. Owner / Client

The owner should receive:

- Immediate Telegram alerts for important field updates.
- Weekly email report every Saturday.
- Monthly email report on the 1st day of every month for the previous month.
- Critical platform issue alerts in plain language.

---

## Product Direction

This should not feel like a complex enterprise tool. The users are not very tech-savvy, so the app must feel simple, forgiving, and easy to trust.

The platform should be:

- Mobile-first.
- Clean and spacious.
- Simple enough for non-technical field agents.
- Professional enough for the owner/admin.
- Reliable even when internet is weak.
- Transparent, so agents can see what they submitted.
- Monitored, so issues are detected before users become frustrated.

---

## Recommended Build Approach

Start as a mobile-friendly web app rather than a full native mobile app.

Reasons:

- Faster to build.
- Easier to update.
- Works on most phones through a browser.
- No Play Store/App Store approval needed at the first stage.
- Can later be converted into Android/iOS apps if required.

---

## Agent App Features

### 1. Login

Agents log in using their assigned email ID.

Email-based login helps:

- Link every report to the correct person.
- Track who submitted or edited each entry.
- Send each agent their own reports.
- Remove access when an employee leaves.
- Track login and usage issues.

### 2. Home Screen

The agent home screen should show only the most important actions.

Recommended sections:

- Greeting: “Good morning, Rahul”
- Quick attention summary:
  - Pending follow-ups
  - Reports submitted today
  - Leave status
- Main actions:
  - New Field Entry
  - Continue Follow-up
  - Apply for Leave
- Recent entries

### 3. Field Entry / Visit Report

Agents should be able to submit visit reports using a simple step-by-step form.

The actual fields will be finalized after reviewing the client’s form, but the app should support:

- Customer/site name
- Visit type
- Visit status
- Work/sales/service update
- Notes/remarks
- Follow-up required: yes/no
- Next follow-up date
- Photos if required
- Location if required
- Auto-filled date/time
- Auto-filled agent name

### 4. Drafts and Incomplete Submissions

If an agent starts an entry but cannot complete it, the app should save it as a draft.

This prevents data loss and frustration.

Examples:

- Poor internet connection.
- Photo upload failed.
- Agent had to leave midway.
- Customer was unavailable.
- Second visit is required.

### 5. Status-Based Work Tracking

Each field entry should have a clear status.

Recommended statuses:

- Draft
- Submitted
- Follow-up Needed
- Pending
- Completed
- Cancelled / Not Possible
- Overdue

This allows one customer/site/job to stay open across multiple visits instead of creating confusing separate forms.

### 6. Follow-Up Timeline

Each entry should have a timeline/history.

Example:

- 7 June, 4:20 PM — First visit submitted. Customer requested revised pricing.
- 10 June, 11:30 AM — Follow-up visit completed. Demo done.
- 12 June, 3:00 PM — Final update added. Awaiting confirmation.

This helps admin/owner understand what actually happened in the field.

### 7. My Entries

Agents must be able to see all their own entries.

They should be able to filter by:

- All
- Drafts
- Follow-up
- Completed
- Overdue

Each entry card should show:

- Customer/site name
- Visit type
- Status
- Last updated time
- Next follow-up date if applicable

### 8. Leave Request

Agents should be able to:

- Apply for leave.
- Select date or date range.
- Select leave reason.
- Add a note if needed.
- View leave status.

Leave statuses:

- Pending
- Approved
- Rejected

---

## Recommended Screen List

### Agent Screens

The first version should include these agent-facing screens:

1. Login
2. Agent Home
3. New Field Entry
4. Save Draft / Review Entry
5. Follow-Up Timeline
6. My Entries
7. Entry Detail
8. Apply for Leave
9. Leave Status
10. My Reports
11. Profile / Logout

### Admin Screens

The first version should include these admin-facing screens:

1. Admin Login
2. Admin Dashboard
3. All Reports
4. Agent-Wise Reports
5. Agent Detail Page
6. Pending Follow-Ups
7. Missing Submissions
8. Leave Approval
9. Report Downloads
10. Notification Settings
11. Issue Command Center

---

## Admin App Features

### 1. Admin Dashboard

Admin dashboard should show:

- Reports submitted today
- Active agents
- Agents on leave
- Missing submissions
- Pending follow-ups
- Overdue follow-ups
- Pending leave requests
- Recent field updates
- Issues needing attention

### 2. Agent-Wise View

Admin should be able to open each agent profile and see:

- Total entries
- Completed entries
- Pending follow-ups
- Missed submissions
- Leave history
- Recent activity
- Open issues for that agent

### 3. Reports View

Admin should be able to filter and download reports by:

- Date range
- Agent
- Status
- Visit type
- Area/branch
- Customer/site
- Completed/pending/follow-up
- Leave status

### 4. Leave Approval

Admin should be able to:

- View pending leave requests.
- Approve or reject them.
- Add comments if needed.
- See leave history.

### 5. Issue Command Center

Admin should be able to see platform issues in a simple format:

- Open issues
- Resolved issues
- Affected agents
- What went wrong
- Recommended action
- Fix status
- Whether owner/client was notified

Simple statuses:

- Watching
- Needs Action
- Fix in Progress
- Fixed
- Needs Decision

### 6. Notification Settings

Admin should be able to control reporting and alert rules without needing a developer.

Settings should include:

- Owner Telegram alert recipient(s)
- Which events trigger Telegram alerts
- Weekly report email recipients
- Monthly report email recipients
- Agent report email rules
- Whether reports include PDF, Excel, or both
- Whether missed submissions should alert owner/admin
- Whether leave requests should alert owner/admin
- Quiet hours, if the owner does not want late-night alerts

Default recommendation:

- Owner gets only important Telegram alerts, not every small action.
- Admin dashboard stores all activity.
- Weekly and monthly emails are always sent automatically.
- Agents receive only their own reports.

---

## Reporting System

Reports should not be only raw data. They should help the owner quickly understand:

- Who worked?
- What did they do?
- What is pending?
- What needs attention?
- Who did not update?
- What progress happened in sales/service?

### Report Layers

Each report should have three layers:

1. Quick summary
2. Agent-wise breakdown
3. Detailed entry list

---

## Immediate Telegram Alerts

Whenever an important form is submitted or progress is updated, the owner can receive a Telegram alert.

Example:

**Field Update Submitted**

- Agent: Rahul Sharma
- Customer/Site: ABC Traders
- Type: Sales Visit
- Status: Follow-up Needed
- Visit Date: 7 June, 4:30 PM
- Next Follow-up: 10 June
- Note: Customer asked for revised pricing
- View full details: Admin Dashboard

Recommended Telegram alert events:

- New important field report
- Progress update
- Follow-up required
- Case completed
- Missed submission
- Leave request submitted
- Report/email failure
- Critical platform issue

Recommendation: Start with important updates only, not every tiny action, so Telegram does not become noisy.

---

## Daily Report

Purpose: daily visibility.

Daily reports should be generated automatically for each agent and for the admin/owner view.

Default recommendation:

- Keep daily reports available inside the admin dashboard.
- Send immediate Telegram alerts for important updates.
- Send a daily email only if the client specifically wants it, because daily emails can become noisy.

Daily report should include:

- Total agents
- Active agents
- Agents on leave
- Agents with no update
- Total field entries
- Completed cases
- Follow-up required
- Pending cases
- Overdue follow-ups
- Important updates

Example sections:

- Overall Summary
- Needs Attention
- Agent-wise Summary
- Pending Follow-ups
- Leave Summary
- Missed Submissions

---

## Weekly Report

Weekly report should be sent every Saturday.

Owner/admin receives the all-agent weekly report by email.

Each agent receives only their own weekly report by email.

Weekly owner/admin report should include:

- Total agents
- Total reports submitted
- Completed cases
- Follow-up cases
- Pending cases
- Leave days taken
- Missed submissions
- Overdue follow-ups
- Agent-wise performance summary
- Key attention items

Example subject:

**Weekly Field Team Report — 1 June to 7 June**

---

## Monthly Report

Monthly report should be sent on the 1st day of every month for the previous month.

Example: On 1 July, the system sends the report for 1 June–30 June.

Monthly report should include:

- Total monthly visits
- New cases created
- Cases completed
- Cases still pending
- Follow-ups completed
- Leave summary
- Missed submissions
- Agent-wise comparison
- Month-end pending follow-ups
- Business insights
- PDF and Excel attachment/download link

Example subject:

**Monthly Field Report — June 2026**

---

## Email and Telegram Delivery Rules

### Owner / Admin Delivery

- Immediate Telegram alerts when forms are submitted or meaningful progress is updated.
- Weekly all-agent report email every Saturday.
- Monthly all-agent report email on the 1st day of every month for the previous month.
- Critical platform issue alerts in plain English.

### Agent Delivery

- Each agent receives reports only for their own work.
- Each agent’s report should go to their registered email ID.
- Agents should not receive other agents’ data.

### Delivery Tracking

The system should track whether each Telegram alert and email was successfully sent.

If delivery fails, the system should:

1. Retry automatically.
2. Log the failure.
3. Alert admin if it still fails.
4. Keep the report available inside the dashboard.

---

## Agent Personal Reports

Agents should receive only their own reports.

Agent report should include:

- Their total visits
- Completed cases
- Pending follow-ups
- Overdue follow-ups
- Missed updates
- Leave summary
- Upcoming follow-ups

Agents must not see other agents’ data.

---

## Report Formats

### PDF

Best for owner/client reading.

Should include:

- Clean title and date range
- Summary cards
- Agent-wise sections
- Needs attention section
- Pending follow-ups
- Leave summary
- Professional layout

### Excel

Best for operations/admin.

Should include detailed rows:

- Date
- Agent name
- Customer/site
- Visit type
- Status
- Remarks
- Follow-up date
- Leave status
- Completion status
- Last updated time

---

## UI / UX Direction

The app should feel like a soft professional field-work dashboard.

Visual direction:

- Clean
- Friendly
- Spacious
- Modern
- Mobile-first
- Not too corporate
- Not too playful
- Easy for non-technical users

### Colour Scheme

Recommended colours:

- Background: soft off-white or very light mint
- Primary: muted green or teal
- Secondary: soft blue
- Warning: soft amber/yellow
- Danger: soft coral/red
- Cards: white
- Text: dark navy/black

Use red only for genuinely urgent items.

### Typography

Use a clean, readable font style such as:

- Inter
- Manrope
- Plus Jakarta Sans
- SF Pro style

Typography rules:

- Large clear headings
- Medium-bold card titles
- Readable form labels
- Avoid thin text
- Avoid very small font sizes

### Spacing

The app should use generous spacing.

Rules:

- Big touch-friendly buttons
- Clear gaps between cards
- Not too many options on one screen
- Forms split into smaller steps
- One main action per screen

### Buttons

Primary buttons:

- Full width
- Rounded corners
- Green/teal
- Clear text

Secondary buttons:

- White background
- Soft border
- Dark text

Avoid tiny icon-only buttons for agents.

### Cards

Each entry should appear as a clean card.

Example card content:

- Customer/site name
- Visit type
- Status chip
- Last updated time
- Next follow-up date
- Open button

Status chips:

- Completed: green
- Follow-up: yellow
- Pending: blue
- Overdue: red
- Draft: grey

---

## Monitoring and Support System

Because the previous WhatsApp + AI form flow failed and frustrated agents, the new platform must include monitoring from day one.

The system should not wait for users to complain. It should detect issues early.

### Monitoring Agent

A monitoring layer should watch:

- App errors
- Failed form submissions
- Drafts not submitted
- Agents stuck on a screen
- Login failures
- Slow loading screens
- Failed photo uploads
- Failed Telegram alerts
- Failed emails
- Scheduled report failures
- Missing daily submissions
- Overdue follow-ups

### Report Agent

The reporting layer should handle:

- Immediate Telegram alerts
- Weekly Saturday emails
- Monthly reports on the 1st
- Agent-wise personal reports
- Owner/admin summaries

### Support Agent

The support layer should detect frustration signals, such as:

- Same agent failing multiple times
- Too many drafts
- Repeated upload failures
- Form opened but not submitted
- Login failures

It should alert admin in simple language.

### Fixing Workflow

Fixing live issues should be controlled.

Safe automatic actions:

- Retry failed email.
- Retry failed Telegram alert.
- Save failed submission as draft.
- Restore unsent data.
- Notify agent that report is saved as draft.
- Log the issue.
- Alert admin.

Actions that need approval/testing:

- Changing app logic.
- Changing form fields.
- Changing report calculations.
- Changing permissions.
- Changing database structure.
- Updating production code.

AI/dev agents can help investigate and prepare fixes, but live production fixes should be reviewed/tested before release.

---

## Plain-English Live Issue Notifications

If a live issue happens, notifications should be sent in plain English, not technical language.

Example:

**Live Issue Alert**

- Problem: Agents are unable to submit reports with photos.
- Affected: 4 agents today.
- Data safety: Their entries are saved as drafts. Nothing is lost.
- Client impact: Admin may not see these reports until submitted.
- Likely cause: Photo upload is failing.
- Recommended fix: Allow report submission first, upload photo later.
- Suggested action: Apply temporary fix now and repair photo upload in the background.
- Decision needed: Should owner be notified, or should this be fixed quietly first?

The system should apply technical judgment and ask the business owner only for decisions that affect client communication, workflow, or user experience.

---

## What Is Possible vs Not Recommended

### Possible and Recommended

- Track agent logins and report submissions.
- Track forms started but not submitted.
- Save partial entries as drafts.
- Detect failed photo uploads and failed submissions.
- Detect missed daily updates.
- Detect failed Telegram/email delivery.
- Notify owner/admin in plain English.
- Generate daily, weekly, and monthly reports automatically.
- Create issue reports for developers.
- Prepare fixes and test them before release.

### Not Recommended

- Letting AI directly change the live production app without testing.
- Relying only on AI chat/forms instead of structured buttons and saved entries.
- Monitoring agents in a way that feels like personal surveillance.
- Sending the owner every small event if it creates too much Telegram noise.
- Making photos/location mandatory everywhere unless the business truly needs it.

### Important Note About Email Sign-In

Email sign-in helps identify users and connect reports to the right agent, but it does not automatically solve all tracking issues by itself.

The app still needs proper monitoring, draft saving, error logging, and admin visibility.

---

## Data Storage and Visibility

All data should be stored in a secure online database connected to the app.

Data flow:

**Agent App → Database → Admin Dashboard → Reports/Notifications**

Agent visibility:

- Agents see only their own entries, leave requests, and reports.

Admin visibility:

- Admin sees all agent data.

Manager visibility, if needed:

- Managers see only their assigned team.

Owner visibility:

- Owner gets Telegram alerts, email reports, and dashboard access if required.

Data saved may include:

- Agent name
- Email ID
- Date/time
- Customer/site name
- Visit details
- Sales/service status
- Notes
- Photos
- Location if required
- Follow-up date
- Leave requests
- Admin approval status
- Edit history

---

## Edit History and Accountability

Agents should be allowed to update entries that are:

- Draft
- Follow-up Needed
- Pending

For completed entries, the recommended approach is to allow edits but keep history.

Admin should be able to see:

- What was entered first
- What was changed later
- Who changed it
- When it was changed

This protects transparency without making the app frustrating.

---

## Reliability Requirements

To avoid repeating the WhatsApp form failure, the app must include:

- Auto-save drafts
- Clear success messages
- Clear error messages
- Simple forms
- Low typing wherever possible
- Ability to continue old entries
- Agent access to their own submitted entries
- Admin visibility into incomplete submissions
- Monitoring for repeated errors
- Telegram/email delivery tracking
- Fallback if internet or upload fails

Bad error message:

“Validation failed: server error 422.”

Good error message:

“Photo did not upload. Your report is saved as draft. Please try again.”

---

## Open Items To Finalize After Receiving Client Forms

Once the actual forms are shared, the following must be finalized:

- Exact form fields.
- Which fields are mandatory.
- Which fields should be dropdowns instead of free typing.
- Which fields should be auto-filled.
- Which fields trigger Telegram alerts.
- Which fields appear in daily, weekly, and monthly reports.
- Which fields are visible to agents.
- Which fields are visible only to admin/owner.
- Whether photos are required or optional.
- Whether GPS/location is required or optional.
- Whether agents can edit completed entries or only add progress updates.
- Report wording and layout for the client’s business type.

---

## Current Convogenie Forms Reviewed

The existing forms shared for Crystal Bio are:

- Attendance/Login: `https://console.convogenie.ai/forms/crystal-bio-login`
- Sales Report: `https://console.convogenie.ai/forms/crystal-bio-sales`
- Service Report: `https://console.convogenie.ai/forms/crystal-bio-service`
- Leave Request: `https://console.convogenie.ai/forms/crystal-bio-leave`

These forms should be treated as the starting data structure, not copied exactly as long forms. The app should convert them into cleaner mobile pages with saved entries, follow-ups, reporting, and admin visibility.

---

## Form Field Mapping

### 1. Attendance / Login Form

Current fields identified:

- Team member name
- Visit location
- GPS/location support
- Login note / notes

Recommended app handling:

- This becomes the agent’s daily attendance/check-in screen.
- Agent name should be auto-filled after login.
- Date and time should be auto-captured.
- Location can be captured if permission is given.
- Notes should be optional.
- Admin should see who checked in, who did not check in, and where/when they checked in.

Suggested app page name:

**Daily Check-in**

---

### 2. Sales Report Form

Current fields identified:

- Sales executive name
- Visit location
- GPS/location support
- Account name
- Lead source
  - Existing customer
  - Referral
  - IndiaMART
  - Website
  - Phone call
  - Field visit
  - Other
- Customer name and designation
- Customer phone number
- Customer email ID
- Customer department and address
- Product type
  - Laboratory equipment
  - Hospital equipment
  - Biotech instrument
  - Consumables
  - Maintenance / service
  - Installation support
  - Other requirement
- Brand name
- Equipment name
- Quote submitted: yes/no
- Budgetary proposal: yes/no
- Project quote status
  - New inquiry
  - Quote pending
  - Quote submitted
  - Budgetary quote
  - Negotiation
  - Closed won
  - Closed lost
  - Follow up later
- Fund status
  - Available
  - Pending approval
  - Budget requested
  - Tender / procurement
  - Unknown
  - Not applicable
- Closing date
- Support required: yes/no
- Probability percentage
- Remarks and timeline
- Photos
- Notes for office team

Recommended app handling:

- This should become a multi-step sales entry, not one long form.
- Existing customers/accounts should become searchable over time.
- A sales entry should remain open if it needs follow-up.
- Quote status, fund status, closing date, and probability should feed sales pipeline reports.
- Photos should be optional unless the client confirms they are mandatory.
- Support required should create an internal attention item for admin/office team.

Suggested app page name:

**New Sales Visit** / **Sales Follow-up**

---

### 3. Service Report Form

Current fields identified:

- Engineer name
- Visit location
- GPS/location support
- Customer name
- Customer phone number
- Customer department and address
- Service type
  - Installation
  - Preventive maintenance
  - Breakdown
  - Repair
  - Calibration
  - Demo
  - Training
  - Other
- Brand name
- Equipment name
- Serial number
- Work done
- Support required: yes/no
- Next action
- Photos
- Notes for office team

Recommended app handling:

- This should become a service job entry.
- Serial number and equipment name are important for future service history.
- Work done and next action should form the service timeline.
- If support is required, admin/office should see it as an action item.
- The same service case should be updateable across multiple visits.

Suggested app page name:

**New Service Visit** / **Service Follow-up**

---

### 4. Leave Request Form

Current fields identified:

- Team member name
- Leave reason
- Approved by
- Attendance note
- Notes

Recommended app handling:

- Team member name should be auto-filled.
- Leave request should include date/date range, because this is required for proper reporting.
- “Approved by” should not be filled by the agent in the final app. It should be assigned when admin approves/rejects the request.
- Agent should see status: Pending, Approved, Rejected.
- Admin should see pending leave requests and approve/reject them.

Suggested app page name:

**Apply for Leave**

---

## Recommended App Page Breakdown

Because this is a large system, it should not be built as one huge form. It should be broken into clear pages.

### Agent Pages

#### 1. Login Page

Purpose:

- Let agents sign in using their email ID.
- Identify whether the person is sales, service, admin, or manager.

Fields/actions:

- Email ID
- OTP/password/magic link depending on final auth choice
- Continue button

---

#### 2. Agent Home Page

Purpose:

- Give agents one simple place to start their day.

Main cards/actions:

- Daily Check-in
- New Sales Visit
- New Service Visit
- Continue Follow-up
- Apply for Leave
- My Entries

Summary cards:

- Reports submitted today
- Pending follow-ups
- Drafts
- Leave status

---

#### 3. Daily Check-in Page

Purpose:

- Replace the current attendance/login form.

Fields:

- Agent name: auto-filled
- Date/time: auto-filled
- Location: optional/permission-based
- Notes: optional

Admin use:

- See who checked in today.
- See who did not check in.
- Connect attendance with field reporting.

---

#### 4. Sales Entry Page

Purpose:

- Capture sales visit details in a clean step-by-step flow.

Recommended steps:

1. Customer/account details
2. Requirement/product details
3. Quote and fund status
4. Probability and closing date
5. Remarks, support required, photos
6. Review and submit/save draft

Important statuses:

- New inquiry
- Quote pending
- Quote submitted
- Negotiation
- Follow-up later
- Closed won
- Closed lost

---

#### 5. Service Entry Page

Purpose:

- Capture service/engineering visit details.

Recommended steps:

1. Customer details
2. Equipment details
3. Service type
4. Work done
5. Next action/support required
6. Photos and notes
7. Review and submit/save draft

Important statuses:

- Installation
- Preventive maintenance
- Breakdown
- Repair
- Calibration
- Demo
- Training
- Completed
- Follow-up required

---

#### 6. Follow-Up Timeline Page

Purpose:

- Allow second/third visits to continue the same case instead of creating confusing duplicate entries.

This page should show:

- Customer/site name
- Current status
- Previous updates
- Last visit date
- Next follow-up date
- Add progress update button

---

#### 7. My Entries Page

Purpose:

- Let agents see all their submitted and draft entries.

Filters:

- All
- Sales
- Service
- Drafts
- Follow-up
- Completed
- Overdue

Each card should show:

- Customer/site name
- Sales/service label
- Status
- Last updated
- Next follow-up date

---

#### 8. Leave Request Page

Purpose:

- Replace the current leave form with a proper approval flow.

Fields:

- Agent name: auto-filled
- Leave date/date range
- Leave reason
- Note
- Submit request

Agent sees:

- Pending
- Approved
- Rejected

---

#### 9. My Reports Page

Purpose:

- Let agents see their own daily/weekly/monthly performance.

Includes:

- Sales visits
- Service visits
- Follow-ups
- Completed work
- Pending work
- Leave summary
- Missed submissions

---

### Admin Pages

#### 1. Admin Dashboard

Purpose:

- Owner/admin gets complete visibility.

Shows:

- Active agents today
- Check-ins today
- Sales reports today
- Service reports today
- Pending follow-ups
- Overdue follow-ups
- Leave requests pending
- Missing submissions
- Support required items

---

#### 2. Sales Reports Page

Purpose:

- View and filter all sales activity.

Filters:

- Date
- Agent
- Account/customer
- Lead source
- Product type
- Quote status
- Fund status
- Probability
- Closing date
- Follow-up status

---

#### 3. Service Reports Page

Purpose:

- View and filter all service activity.

Filters:

- Date
- Engineer
- Customer
- Service type
- Equipment
- Serial number
- Support required
- Completed/follow-up status

---

#### 4. Agent Detail Page

Purpose:

- See one person’s full activity.

Shows:

- Check-ins
- Sales visits
- Service visits
- Leave history
- Drafts
- Missed reports
- Follow-ups
- Error/support issues

---

#### 5. Leave Approval Page

Purpose:

- Admin approves/rejects leave.

Shows:

- Agent name
- Dates requested
- Reason
- Notes
- Approve/reject buttons
- Admin comment

---

#### 6. Reports and Exports Page

Purpose:

- Generate/download daily, weekly, and monthly reports.

Report types:

- Daily summary
- Weekly Saturday report
- Monthly 1st-day report
- Agent-wise report
- Sales pipeline report
- Service work report
- Leave/attendance report

Formats:

- PDF for owner/client
- Excel for operations/admin

---

#### 7. Notification Settings Page

Purpose:

- Control Telegram and email alerts.

Settings:

- Owner Telegram recipient
- Which events trigger Telegram alerts
- Weekly email recipients
- Monthly email recipients
- Agent report emails
- Failed delivery alerts

---

#### 8. Issue Command Center

Purpose:

- Monitor app problems and agent frustration.

Tracks:

- Failed submissions
- Photo upload failures
- Emails not sent
- Telegram alerts not sent
- Agents stuck with drafts
- Login failures
- Missing check-ins
- Report generation failures

---

## Build Phase Plan

### Phase 0: Final Requirements and Form Cleanup

Goal:

- Confirm the exact fields from current forms and clean them into app-friendly flows.

Tasks:

- Review all forms with client.
- Decide required vs optional fields.
- Decide dropdowns vs typing fields.
- Decide if GPS/photos are mandatory or optional.
- Confirm owner Telegram alert rules.
- Confirm weekly/monthly email recipients.
- Confirm agent email list.

Outcome:

- Final field map and screen flow ready.

---

### Phase 1: Core Agent App

Goal:

- Build the simplest usable version for field agents.

Includes:

- Login
- Agent home
- Daily check-in
- Sales entry
- Service entry
- Leave request
- Save draft
- Submit confirmation
- My Entries

Why this comes first:

- The biggest risk is agent frustration. The first build must prove the boys can actually use it comfortably.

---

### Phase 2: Admin Dashboard

Goal:

- Give owner/admin visibility into all submitted data.

Includes:

- Admin login
- Dashboard summary
- All sales reports
- All service reports
- Agent-wise view
- Leave approval
- Filters
- Basic export

Why this comes second:

- Once agents can submit properly, admin needs to see and manage the data.

---

### Phase 3: Follow-Up and Case Timeline

Goal:

- Handle second/third visits cleanly.

Includes:

- Open case status
- Add progress update
- Timeline view
- Next follow-up date
- Pending/overdue follow-up tracking
- Completed/closed status

Why this is separate:

- Follow-up logic is important and should not be rushed into the first form build.

---

### Phase 4: Telegram and Email Reporting

Goal:

- Automate owner and agent reporting.

Includes:

- Immediate owner Telegram alerts
- Weekly Saturday owner/admin email
- Monthly 1st-day owner/admin email
- Agent personal email reports
- Report delivery tracking
- Failed email/Telegram retry

Why this comes after core data:

- Reports are only useful after the data structure is stable.

---

### Phase 5: Monitoring and Issue Command Center

Goal:

- Avoid another failed rollout like the WhatsApp form system.

Includes:

- Track failed submissions
- Track drafts not completed
- Track photo upload issues
- Track login failures
- Track report/email/Telegram failures
- Plain-English issue alerts
- Admin issue dashboard

Why this matters:

- The system must catch problems before agents become frustrated.

---

### Phase 6: Polish, Testing, and Rollout

Goal:

- Make the app feel reliable and easy for non-technical users.

Includes:

- Mobile UI polish
- Spacing and typography cleanup
- Button size and readability checks
- Real-agent test run
- Fix confusing fields
- Add help text
- Final client demo
- Rollout plan

---

## Recommended First MVP Scope

The first MVP should not try to include every advanced feature.

Must include:

- Email login
- Daily check-in
- Sales report
- Service report
- Leave request
- Save draft
- My Entries
- Admin dashboard
- Leave approval
- Basic reports

Should include if time allows:

- Follow-up timeline
- Telegram alerts
- Weekly email

Can wait until next phase:

- Advanced analytics
- Route planning
- Complex AI summaries
- Deep monitoring automation
- Fully offline mode

---

## Key Product Decision

The current forms are useful for knowing what data must be collected, but the final app should not feel like four separate long forms.

The final app should feel like:

**A simple daily work app where agents check in, submit sales/service work, continue follow-ups, request leave, and always see what they submitted.**

---

## Recommended Version Plan

### Version 1

- Agent login
- Field report submission
- Draft saving
- Follow-up timeline
- My Entries
- Leave request
- Admin dashboard
- Agent-wise report view
- Owner Telegram alerts
- Weekly Saturday email report
- Monthly report on the 1st
- Agent personal email reports
- Basic issue monitoring

### Version 2

- Photo upload improvements
- Optional GPS/location
- Manager role
- Better notification settings
- More detailed error tracking
- Offline-friendly improvements
- Advanced report filters

### Version 3

- Analytics
- Performance trends
- Customer/site history
- Route planning
- Advanced attendance insights
- Deeper AI-assisted summaries

---

## Final Product Principle

This platform should not be positioned as “AI will magically fix everything.”

It should be positioned as:

**A reliable field reporting platform with built-in monitoring and intelligent support, so problems are caught early and field agents are not left frustrated.**

Primary promise:

- Better field visibility
- Faster reporting
- Fewer lost updates
- Easier follow-ups
- Clear admin control
- Immediate owner alerts
- Less frustration for agents
- Safe, monitored improvement process
