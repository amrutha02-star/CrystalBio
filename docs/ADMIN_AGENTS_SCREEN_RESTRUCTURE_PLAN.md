# Admin Agents Screen Restructure Plan

Status: built in source/local and verified — do not deploy during daytime.

## Source-only implementation status

- Implemented in source only; live app is unchanged.
- Live version checked after build: `20260618023542`.
- Agents now shows people/team status instead of submitted form rows.
- Field Entry remains the submitted Sales/Service form lookup/review owner.
- Tests passed: `src/App.test.tsx` 18/18.
- Production build passed.
- Local browser preview passed with no console errors.
- Deployment target: night window only, after approval/retest.

Requested by: Amrutha
Date: 2026-06-18

## Problem

The Admin → Agents screen currently repeats the same submitted Sales/Service form rows that already exist under Admin → Field Entry.

This creates unnecessary duplication:

- Field Entry already has My entries / All entries, search, and saved-form detail opening.
- Agents currently shows the same submitted form list again.
- The Agents screen should instead explain what is happening with people/agents: attendance, check-in, work mode, status, and agent details.

## Proposed ownership

### Field Entry owns submitted forms

Field Entry should remain the single place for:

- Sales/Service submitted entry lookup.
- My entries / All entries.
- Search by customer or agent.
- Opening filled form details.
- Quick office/admin field entry.

### Agents owns team/agent visibility

Agents should become the people/team operations screen for:

- Agent list.
- Attendance status.
- Check-in/check-out time.
- Selected work mode.
- Last active / today activity.
- Agent detail view.
- Light summary of each agent’s field work, without repeating form rows.

## Proposed Agents screen structure

### 1. Top summary card: Team today

Simple compact metrics. These are not decorative dashboard tiles: each metric must be tappable and must apply the matching Agents filter/view.

- Checked in → opens/filters to checked-in agents
- Not checked in → opens/filters to not-checked-in agents
- Checked out → opens/filters to checked-out agents
- On leave / leave pending if available → opens/filters to leave/pending-leave agents

Purpose: quick team status without dumping submitted forms.

### 2. Filters / view controls

Keep filters people-focused, not form-focused. Do not show these as vague status pills detached from the screen purpose; they are explicit filters for the agent list.

- All agents
- Sales
- Service
- In office
- Checked in
- Not in
- Checked out

Optional search:

- Search agent name

Avoid:

- Entry type filter
- Submitted-form filter
- Recent 5 entries label
- View all entries button
- Non-clickable top dashboard cards
- Ambiguous pills that look like status decoration instead of filters

### 3. Agent cards

Each agent card should show:

- Agent name
- Role: Sales / Service / Sales + Service / Admin
- Attendance status: Checked in / Checked out / Not checked in / On leave
- Check-in time if available
- Check-out time if available
- Work mode chip: Sales visit / Service visit / In office / combined / Mode not recorded
- Small activity counters: Visits today, follow-ups pending, service pending if available
- Last active / latest activity time if available

Primary action:

- Tap card → Agent detail

Secondary action if needed:

- View entries → opens Field Entry filtered to that agent, not a duplicate list inside Agents

### 4. Agent detail view

When opening an agent card, show:

- Basic profile: name, role, email/phone if appropriate for admin
- Today attendance:
  - current status
  - check-in time
  - check-out time
  - work mode
  - number of check-in sessions today if repeated
- Activity summary:
  - Sales visits today
  - Service visits today
  - Follow-ups pending
  - Last submitted work time
- Attendance history preview:
  - last few days or latest sessions, not full report table
- Action button:
  - View this agent’s entries → opens Field Entry with that agent filter/search

Avoid in detail:

- Repeating all form rows by default
- Report-generation controls
- Dense tables
- Raw audit IDs as primary text

## Copy / labels

Recommended labels:

- Screen title: `Agents`
- Summary heading: `Team today`
- Agent list heading: `Agents`
- Empty state: `No agents match this filter.`
- Detail action: `View this agent’s entries`
- Filter labels: `All agents`, `Sales`, `Service`, `In office`, `Checked in`, `Not in`, `Checked out`

Avoid labels:

- `Submitted entries`
- `Recent 5 entries`
- `View all entries`
- `Review submitted Sales and Service forms` on Agents
- Blank/ghost filter pills
- Top cards that look tappable but do nothing

## Implementation notes for night deployment

1. Remove submitted-entry list from Admin → Agents.
2. Keep submitted-entry list under Admin → Field Entry only.
3. Reuse the existing adminRows/attendance data for agent cards.
4. Add agent detail view inside Agents.
5. Add a Field Entry handoff action for a selected agent, if practical.
6. Update README UX rule after approval so future agents do not re-add submitted forms to Agents.
7. Run targeted App tests and production build.
8. Verify on live only during night deployment window unless Amrutha/Rahul explicitly approve daytime deploy.

## Acceptance checklist

- Admin → Agents no longer repeats the submitted Sales/Service rows.
- Admin → Field Entry still shows entries/forms and opens form detail.
- Agents shows people/team status clearly.
- Top Team today counts are clickable and apply the matching filter/detail view.
- Sales / Service / In office / Checked in / Not in / Checked out controls behave as filters, not passive pills.
- Agent card opens a detail screen.
- Check-in time, check-out time, and work mode remain visible where available.
- Older attendance rows without work mode show `Mode not recorded`.
- No report-style dense table or duplicate form list appears in Agents.
