# CrystalBio QA Test Checklist

Use this checklist for the Testing Agent. Each item should be marked:

- Passed
- Failed
- Blocked
- Not tested
- Needs retest
- Verified fixed

## 1. Login

- Agent can log in.
- Admin can log in.
- Wrong password shows clear error.
- Inactive user cannot log in.
- User can log out.
- Logged-in agent name is attached automatically to records.
- Agent/engineer name is not manually typed inside sales/service visit forms.

## 2. Attendance

- Check-in button works.
- Check-in captures current GPS/location.
- Check-in blocks or warns clearly if GPS fails.
- After check-in, home state changes to checked-in.
- Check-out button appears after check-in.
- Check-out captures current GPS/location.
- Check-out completes the day.
- Attendance history shows correct date/time.
- Leave request can be submitted.
- Leave status can be viewed.

## 3. Sales visit

- Sales button opens sales flow.
- Agent can search previous customer/account/phone.
- Agent can create new sales visit entry.
- Sales form is split into Step 1 / Step 2 / Step 3 sections.
- Step 1 quick visit update saves separately.
- Step 2 customer/requirement details save separately.
- Step 3 quote/photos/office details save separately.
- Customer details save.
- Requirement details save.
- Quote/deal status saves.
- New visit update creates a separate visit record.
- Visit date/time is auto-captured for Step 1.
- Step 1 current visit GPS is mandatory.
- Visit note saves.
- Next action saves.
- Follow-up date appears when follow-up is needed.
- Follow-up date has date selector.
- Expected closing date has date selector.
- Camera action works.
- Upload action works.
- Save buttons are visible and work for each step.
- Partial records can be reopened and completed later.
- Admin/reporting shows Step 1/2/3 completion and missing fields.
- Multiple sales visits appear in history.
- Old visit history is read-only unless deliberately opened.
- Closed opportunity can be reopened or new visit after closed is handled clearly.

## 4. Service visit

- Service button opens service flow.
- Agent can search customer/equipment/serial number/phone.
- Agent can create new service visit entry.
- Service form is split into Step 1 / Step 2 / Step 3 sections.
- Step 1 quick service update saves separately.
- Step 2 customer/equipment/issue details save separately.
- Step 3 parts/photos/office details save separately.
- Customer fields save.
- Equipment fields save.
- Brand name saves.
- Equipment/model saves.
- Serial number saves.
- Service type saves.
- Work done saves.
- Support required yes/no saves.
- Next action saves.
- Next visit date appears when needed.
- Next visit date has date selector.
- Step 1 current service visit GPS is mandatory.
- Camera action works.
- Upload action works.
- Save buttons are visible and work for each step.
- Partial service records can be reopened and completed later.
- Admin/reporting shows Step 1/2/3 completion and missing fields.
- Multiple service visits appear in history.
- Closed service case can be reopened or new visit after closed is handled clearly.

## 5. Admin reports

- Admin can see all agents.
- Admin can filter by agent.
- Admin can filter by date range.
- Admin sees daily reports.
- Admin sees weekly reports.
- Admin sees monthly reports.
- Sales visits appear in reports.
- Service visits appear in reports.
- Attendance appears in reports.
- Leave requests/status appear in reports.
- Missing GPS or missing required data is flagged.
- Follow-ups due are visible.
- Export/share works if included.

## 6. Mobile usability

- Works at 390px phone width.
- Buttons are large enough to tap.
- Save button is not hidden.
- Bottom nav is aligned and readable.
- Form sections are not overcrowded.
- Error messages are readable.
- Keyboard does not cover critical save actions.
- Long names/addresses do not break layout.

## 7. Backend/API

- Data saves correctly.
- Saved data can be reopened.
- Required fields cannot be skipped.
- Wrong data shows clear error.
- Agent ID is saved from login/session.
- GPS is stored with each visit update.
- Photos are linked to correct visit record.
- Reports match submitted data.
