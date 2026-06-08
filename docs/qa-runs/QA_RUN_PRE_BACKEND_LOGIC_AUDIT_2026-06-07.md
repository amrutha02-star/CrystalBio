# QA Run - Pre-backend Logic Audit - 2026-06-07

## Scope

Reviewed current CrystalBio pages before backend build:

- Agent home app
- Check-in/check-out flow
- Sales entry flow
- Sales detail flow
- Service entry/detail flow
- Design/documentation rules

## Owner summary

Before backend build, several journey-logic gaps were found and fixed in the prototype/docs. The most important fixes were: attendance is now separated from visits, check-out captures location, sales visit dates/photos/GPS are clearer, service has a search/open-existing entry screen, and QA/testing-agent documentation is now in GitHub.

## Findings and actions

### Fixed before backend

1. **Home showed hardcoded agent name**
   - Problem: Home used `Rahul` directly.
   - Fix: changed to `{Agent Name}` to indicate login/session value.

2. **Home label “My entries” was unclear**
   - Problem: Could mix visits, attendance, leave, and reports.
   - Fix: changed to `Recent visits`.

3. **Check-in mixed attendance with visit planning**
   - Problem: Check-in asked for Sales/Service plan.
   - Fix: check-in now only handles attendance and location. Visits are added separately after check-in.

4. **Check-in had Save as draft**
   - Problem: Attendance should not have confusing draft state.
   - Fix: replaced with GPS retry state.

5. **Check-out did not capture checkout location**
   - Problem: End-of-day attendance also needs location.
   - Fix: added current checkout location/GPS field.

6. **Sales flow preview was missing explicit visit date/GPS logic**
   - Problem: Sales flow had current GPS buried under customer details and dates as plain text.
   - Fix: added Visit date, Visit time, mandatory GPS, follow-up date selector, closing date selector.

7. **Sales flow photo action was too vague**
   - Problem: Used `+ Add`.
   - Fix: changed to Camera / Upload.

8. **Service lacked a search/open-existing start screen**
   - Problem: Could create duplicate service records.
   - Fix: added `service-flow.html` with search customer/equipment/serial number and previous service records.

9. **Service visit photos were not clearly attached to visit update**
   - Problem: Photos were mainly under equipment details.
   - Fix: added Camera / Upload inside the current service visit update.

10. **Testing agent process was not fully documented**
    - Problem: QA and bug fix responsibility needed GitHub documentation.
    - Fix: added QA workflow, checklist, and GitHub issue template.

## Still to design before production build

These are not blockers for backend planning, but should be designed/tested when the interactive app is built:

- GPS success/failure states: capturing, captured, failed, retry.
- Closed/reopened sales opportunity logic.
- Closed/reopened service case logic.
- Admin reports visual page: daily, weekly, monthly, agent filters, follow-ups due, missing updates.
- Actual login screens and role-based routing.

## QA files added

- `docs/QA_WORKFLOW.md`
- `docs/QA_TEST_CHECKLIST.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`

## Recommended agent setup

- Testing Agent: required.
- Bug-Fixer Agent: recommended after backend starts.
- Testing Agent must verify fixes before bugs are closed.
