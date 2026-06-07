# Field Agent Reporting Platform

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
