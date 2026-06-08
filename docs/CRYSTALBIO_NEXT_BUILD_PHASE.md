# CrystalBio Next Build Phase

## Goal

Move the prototype from a polished preview into a reliable operating app for 12–13 daily field users and roughly 20 visit reports per day.

The product success target is simple: within 30 days of rollout, the business should stop depending on manual weekly report gathering and start depending on the app for field visibility, attendance, leave, and follow-up tracking.

---

## Phase 1 — Lock the field-agent workflow

### Agent login

- Agent signs in with assigned login.
- Agent name is taken from login and never typed manually in visit forms.
- Admin can disable access when a person leaves.

### Daily attendance

- Agent checks in at the start of work.
- GPS/location is saved with check-in.
- Agent checks out at the end of work.
- Admin can see attendance history and missing check-ins.

### Leave request

- Agent can request leave from the Attendance screen.
- Leave request includes from date, to date, reason, and optional note.
- Admin can approve or reject.
- Agent can see leave status.

---

## Phase 2 — Lock sales and service visit forms

### Sales visit model

Use progressive saves so agents are not forced to complete everything while standing at the customer site.

- Step 1: quick visit update with GPS, customer name, visit note, requirement, next action, follow-up date if needed.
- Step 2: customer and requirement details.
- Step 3: quote, commercial status, photos, and office notes.

### Service visit model

Use the same progressive save model.

- Step 1: quick service update with GPS, customer name, work done, service type, next action, next visit date if needed.
- Step 2: customer, equipment, brand/model, serial number, and issue details.
- Step 3: parts, machine status, proof/photos, support required, and final remarks.

### Important rule

The uploaded client form must be audited field-by-field before final backend locking. No required business field should be silently skipped.

---

## Phase 3 — Admin access and reporting

### Admin dashboard

Admin should see:

- Today’s visits.
- Pending follow-ups.
- Overdue follow-ups.
- Attendance summary.
- Leave requests.
- Missing or incomplete visit details.
- Agent-wise activity.

### Automatic reports

Reports should be generated automatically by:

- Daily view.
- Weekly view.
- Monthly view.
- Individual agent.
- Sales/service type.
- Pending/completed/follow-up status.

Reports should reduce the weekly manual follow-up burden.

---

## Phase 4 — Reliability safeguards

For this business, scale is not the main risk. Reliability is the main risk.

The app must prevent:

- Lost visit reports.
- Duplicate submissions.
- Confusing follow-up records.
- Broken reports.
- Missing GPS for actual field visits.
- Admin not knowing when data is incomplete.

Required safeguards:

- Save each step separately.
- Preserve previous customer/opportunity information across repeat visits.
- Use proper database records, not temporary form-only storage.
- Show clear saved/error messages.
- Keep audit trail: who submitted what and when.
- Add backend tests for login, attendance, leave, sales, service, admin reports, and persistence.
- Keep QA checklist updated before client review.

---

## Immediate next actions

The client forms have already been shared and the frontend form screens have already been created. The next work is not to ask for forms again; it is to harden the existing product flow.

1. Re-test every already-created sales, service, attendance, leave, and admin screen as a complete mobile journey.
2. Confirm every button is connected to either demo-state behavior or the backend API path, with no dead buttons.
3. Verify sales/service Step 1, Step 2, and Step 3 saves patch the same customer/opportunity/service record instead of creating confusing duplicate work.
4. Verify admin can see daily, weekly, and monthly report views for each person.
5. Stress-test with realistic sample data for 12–13 users and about 20 reports/day.
6. Fix any UI friction before client demo: unclear buttons, cramped cards, missing active states, or confusing disabled states.
7. Prepare the next client-facing demo with agent view and admin view.

---

## Current verified status

As of this note, the existing prototype build is healthy:

- Automated tests pass.
- Production build passes.
- Frontend/backend connection foundation exists.
- Progressive sales/service visit direction is documented.
- Admin/reporting direction is documented.

Next priority: client form mapping and backend/report hardening.
