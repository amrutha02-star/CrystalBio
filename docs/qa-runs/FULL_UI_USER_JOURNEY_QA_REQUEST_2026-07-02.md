# CrystalBio Full UI User-Journey QA Request — 2026-07-02

## Corrected scope from Amrutha

Amrutha asked for **everything**: the whole user journey starting from the visible login page. A generic API/status report is not acceptable.

## Required output

Create a plain-English owner-facing report and downloadable PDF that shows the full UI journey step by step.

The report must include:

1. Visible login page journey
   - admin login
   - agent login
   - wrong/empty login
   - refresh/reopen where possible
   - logout path

2. Agent journey
   - home screen
   - attendance check-in/check-out/repeated tap/refresh
   - Visits / My Entries
   - Sales Step 1, Step 2, Step 3
   - Service Step 1, Step 2, Step 3
   - previous-entry reopen/continue
   - Agent Reports / PDF download
   - mobile layout issues

3. Admin journey
   - admin overview
   - Field Entry: My entries / All entries / search / detail reopen
   - Agents screen and person/status visibility
   - Approvals and leave flow if testable with Bloom accounts
   - Reports and PDF download
   - Profile/access/logout

4. Data checks
   - saved records visible after refresh/reopen
   - saved records visible in correct admin place
   - no wrong-user leakage
   - QA data list and cleanup/verification status

5. Clear result labels
   - PASS
   - FAIL
   - BLOCKED
   - NEEDS REVIEW

6. Evidence
   - screenshots where useful
   - console/API error notes
   - report path and PDF path

## Boundaries

- Use only Bloom assigned QA credentials from `/root/workspace/crystalbio-credentials/bloom-assigned/BLOOM_ASSIGNED_CREDENTIALS.txt`.
- Do not use real employee/admin credentials.
- Do not fix code during this QA.
- Do not delete or alter real-user records.
- Bloom-created QA records may be cleaned only after backup/dry-run/write verification.
- Daytime: test/review only unless Amrutha/Rahul approves live changes.
