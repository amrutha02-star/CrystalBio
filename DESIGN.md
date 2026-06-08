---
version: alpha
name: Crystal Bio Field Hub
description: Calm field-work companion for non-technical service and sales agents; soft sage/olive-led planner-inspired mobile UI with clean, professional restraint.
colors:
  primary: "#5F714F"
  secondary: "#E8EFDF"
  tertiary: "#F3DFA1"
  ink: "#263024"
  inkSoft: "#53604D"
  textMuted: "#7B8376"
  canvasWarm: "#FBF5DF"
  canvasCream: "#F3F7EF"
  surface: "#FFFEF8"
  surfaceSoft: "#F7FAF3"
  line: "#E3E8DC"
  sage: "#8FA17F"
  sageSoft: "#E8EFDF"
  mint: "#DFE8D4"
  peach: "#F4B39B"
  peachSoft: "#FFF0E8"
  sky: "#C8DDF1"
  skySoft: "#EEF6FC"
  warning: "#F3DFA1"
  danger: "#D95B46"
  success: "#5F714F"
typography:
  display:
    fontFamily: Google Sans
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Google Sans
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  h2:
    fontFamily: Google Sans
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  cardTitle:
    fontFamily: Google Sans
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: Google Sans
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  caption:
    fontFamily: Google Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
rounded:
  sm: 12px
  md: 18px
  lg: 24px
  xl: 32px
  phone: 42px
spacing:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 20px
  xl: 28px
components:
  screen-background:
    backgroundColor: "{colors.canvasCream}"
    textColor: "{colors.ink}"
  phone-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.phone}"
    padding: 18px
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-soft:
    backgroundColor: "{colors.surfaceSoft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 18px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 14px
  nav-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 10px
---

## Overview

Crystal Bio Field Hub must feel like a **calm daily work companion**, not an enterprise dashboard, PDF report, or complicated CRM.

The field agents are not tech-savvy, so the UI must reduce thinking. The product should feel friendly, soft, and trustworthy while staying professional enough for a healthcare/field-operations client.

The visual reference direction is:

- soft planner/task app
- sage/olive-led calm healthcare field-work palette
- warm yellow only as a small helper accent, not the main background
- white/off-white surfaces and calm cards
- olive primary actions instead of black buttons
- very limited pastel accents
- rounded cards with generous spacing
- simple line icons and optional hand-drawn illustrations

The most important design rule: **agent screens first, admin later**. Do not optimize for admin density until agent workflows are visually approved.

## Colors

### Core palette

- **Ink `#263024`**: main text, softer than pure black.
- **Deep olive `#5F714F`**: primary CTAs, selected nav, important active states.
- **Sage canvas `#F3F7EF`**: real mobile app background.
- **Off-white `#FFFEF8`**: main cards and form fields.
- **Soft sage `#E8EFDF`**: secondary buttons, calm status chips, light highlights.
- **Warm accent `#F3DFA1` / `#FFF7DC`**: only for warnings or tiny helper accents, not dominant backgrounds.

### Color rules

1. Do **not** make every action card a loud different color.
2. Use one primary visual area per screen.
3. Prefer white cards with small pastel accents over fully colored cards.
4. Olive should carry actions and selected states; color should guide, not decorate.
5. Avoid black primary buttons and yellow-heavy screens.
6. Avoid dull hospital green as the dominant background.
6. Avoid neon, saturated blue, bright orange, and corporate gradient overload.

## Typography

Use rounded, modern sans typography. Use Google Sans style typography for implementation with mostly regular/medium weights. If Google Sans is not available, fall back to Product Sans, Roboto, Arial, then sans-serif.

Typography should feel:

- clear, friendly, and not heavy
- highly readable on mobile
- short and plain-language
- never dense or document-like

### Copy rules

Use labels agents understand immediately:

- “Check in” instead of “Attendance submission”
- “Sales” instead of “Sales report form”
- “Service” instead of “Service report form”
- “Leave” instead of “Leave management”
- “My entries” instead of “Submission history”

Avoid long descriptions on the home screen. If explanation is needed, show it inside the form step, not on the dashboard.

## Layout

### Agent home layout

The agent home must be compact and glanceable.

Recommended structure:

1. Small greeting/header
2. One calm status card for today
3. Compact 2x2 quick-action area
4. Short “My entries” preview
5. Bottom navigation

### Scrolling rule

The initial agent home should not feel like a long scroll page. On a normal phone screen, the user should immediately see:

- greeting
- today status
- all 4 main actions
- at least part of recent entries or bottom nav

If the screen feels like a landing page, it is wrong.

### Grid rule

Use a 2x2 quick-action grid for primary field tasks:

- Check in
- Sales
- Service
- Leave

Cards should be compact, not oversized. Each card needs:

- icon
- short label
- optional 1–2 word hint

Do not include long paragraphs inside quick-action cards.

## Elevation & Depth

Use soft shadows only.

- Cards should feel lightly raised, not floating dramatically.
- Avoid hard borders unless the element is interactive or selected.
- Use shadow + rounded corners to separate content.
- Avoid heavy dashboard panels and table-like containers on agent screens.

Preferred shadow style:

- low opacity black
- large blur
- subtle vertical offset

## Shapes

The design language is very rounded.

- Phone frame: very rounded, 34–42px
- Main cards: 24–32px
- Buttons: 18–24px
- Chips: pill shape
- Icons: simple rounded line icons

Avoid sharp corporate corners.

## Components

### Phone frame / app canvas

The app preview should look like a real mobile app screen, not a web report.

Rules:

- white/cream app surface
- soft sage environment outside phone
- rounded black phone border only for preview/demo; real app should not need a phone border

### Today status card

Purpose: reassure the agent what to do next.

Good examples:

- “Ready for field work”
- “Check in first”
- “2 visits planned today”

Keep it calm and short.

### Quick action cards

Must be highly tappable.

Rules:

- 2x2 grid
- short labels
- icon first
- no long text
- use mostly white or very soft tinted backgrounds
- pastel accent may appear as an icon pill or small tag

### Bottom navigation

Bottom nav must clearly show selected state.

Required items:

- Home / Today
- Visits
- Attendance
- Reports

Rules:

- icons required above labels, matching the approved home screen nav style
- selected state must be obvious
- labels should remain visible for non-tech-savvy users
- do not use icon-only navigation for agents
- use “Attendance”, not “Leave”, because this section covers check-in/check-out logs, attendance history, leave requests, and leave status

### Forms

Forms must be split into steps. Avoid showing one long form.

Every form step should have:

- one clear question group
- large input/tap targets
- save draft support for sales/service
- clear next/back buttons
- simple progress indicator

### Sales visit / opportunity tracker flow

Sales should not start with a “New visit or existing?” decision, and should not use a biased “Find customer” heading. Use one open-ended Sales Visit entry screen where the agent can either search previous entries or create a new sales visit entry.

The preferred sales flow is two main screens:

1. Sales visit — search previous customer/opportunity or create a new sales visit entry from the same screen.
2. Sales opportunity — add today’s visit update, then optionally update customer details, requirement, quote/deal status, photos/notes, and visit history.

Avoid turning sales into 5–6 separate mobile screens. Use compact cards/expandable sections so the agent can update only what changed.

Sales opportunity backend/data rules:

- Current visit location/GPS is mandatory for every visit update.
- Sales executive/agent name is not asked inside each visit form; attach it automatically from the logged-in user in the backend.
- Every repeat visit must have a visible “New visit update” / “Add another visit update” entry point. Each saved update becomes one item in visit history with visit number, visit date, visit time, location/GPS, notes, next action, follow-up date if applicable, and photos.
- Any date shown or stored must have an input affordance: visit date, follow-up date, and expected closing date need a visible date selector/calendar field. Default visit date can be today, but it must still be changeable.
- Save must be visually available near the user’s current task. On mobile, prefer a sticky bottom save action above the nav for visit update and opportunity detail pages; do not bury save below a long section.
- Customer details fields need enough space for real names, phone numbers, emails, department, and address; avoid tiny two-column cards for long values.
- Follow-up must be explicit: “Follow-up needed”, “No follow-up”, or a closing/status option. Do not assume every visit needs follow-up.
- Do not show a separate “Save draft” button if every save can store incomplete data. Use one “Save visit update” action and treat incomplete entries as saved updates in the backend.
- Client-required sections such as Customer details, Requirement, Quote/deal status, and Photos should be collapsible cards, not status-labelled chips like “can update later”.
- Photo entry should be simple: Camera and Upload. Do not force category choices such as visiting card/site/equipment/other at the first photo action.

### Service visit tracker flow

Service reports should follow the same corrected journey logic as sales, but with service-specific records.

Service form field mapping:

- Engineer name comes from login/session; do not ask it inside the service form.
- Current service visit location/GPS is mandatory for every service visit update.
- Service visit date and next visit/follow-up date need visible calendar/date selectors.
- Customer details: customer name, phone, department/address.
- Equipment details: service type, brand name, equipment/model, serial number.
- Service update: work done, support required yes/no, next action, notes for office.
- Photos: Camera and Upload only as primary actions.
- Multiple visits are stored as service visit updates under the same customer/equipment service record.
- Save service update must be visible near the current task; prefer sticky bottom save above nav.

Service-specific statuses can include: Open, Pending parts, Revisit needed, Closed, No follow-up.

### Strict separation: attendance vs visit entries

Check-in/check-out is an attendance flow only. It must stay strictly separate from sales visit and service entry forms.

Rules:

- Check-in starts the field day; it does not collect customer visit details.
- Check-out ends the field day; it may summarize counts, but should not merge visit content into attendance.
- Sales visits are separate entries, one per customer/visit.
- Service visits are separate entries, one per issue/site/visit.
- A visit entry can be marked as Sales only, Service only, or Both when the field visit covers both sales and service work.
- For UI selection, do not show a separate “Both” option. Show two selectable fields/chips: “Sales visit” and “Service visit”. If both are selected, the visit/plan is both.
- Selected plan/type chips must turn soft green so non-technical users can clearly see what is selected.
- Even when both Sales visit and Service visit are selected, it remains one visit entry and must not merge into attendance check-in/check-out.
- Agents can add visit entries after check-in, but those entries remain independent records with their own drafts, photos, notes, and statuses.
- Daily reports can combine the data later in the backend/reporting layer, but the agent-facing forms must remain separate.

### My entries

Should show recent submissions in plain language:

- customer/site name
- type: Sales or Service
- status: Draft, Sent, Follow-up
- next action/date if available

Do not show spreadsheet/table UI on mobile.

### Admin screens

Admin screens are paused until the agent side is approved.

When resumed, admin must still live inside the same app with role-based access. It should not look like a PDF, static report, or document export.

### Monitoring screens

Monitoring is for project/internal team only. It must not be visible to field agents or normal client users.

## Do's and Don'ts

### Do

- Prioritize the agent’s first 5 seconds on the screen.
- Keep screens warm, clean, and calm.
- Use deep olive for hierarchy and CTAs; avoid black primary buttons.
- Use pastel colors carefully and consistently.
- Keep quick actions short and tappable.
- Show selected nav state clearly.
- Build and review agent screens before admin screens.

### Don’t

- Do not use a long scrolling dashboard for the agent home.
- Do not make the UI look like a PDF/report.
- Do not use too many bright colors at once.
- Do not make every card a different saturated color.
- Do not use dull green as the whole visual identity, but keep sage/olive as the clean primary direction.
- Do not expose monitoring/debugging UI to client users.
- Do not start admin polish before agent UX is approved.

## Implementation Checklist

Before any Crystal Bio UI change is accepted, verify:

- Does it follow the sage/olive-led palette above and avoid black primary buttons/yellow-heavy screens?
- Is the home screen compact?
- Are the 4 agent actions visible quickly?
- Are labels plain and non-technical?
- Is selected navigation obvious?
- Does it avoid PDF/report styling?
- Does it avoid excessive scrolling?
- Is monitoring hidden from client users?
- Has the screen been tested in a phone-width preview?


### Typography correction

The UI must not use overly heavy heading weights. Use Google Sans-style rounded typography with medium/semi-bold emphasis. Headings should feel polished and friendly, not chunky or poster-like.
