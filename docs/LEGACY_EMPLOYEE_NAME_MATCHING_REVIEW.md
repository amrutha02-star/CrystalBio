# Legacy employee name matching review

Purpose: match old Convogenie report names to new CrystalBio app users before importing legacy records.

Rule: **do not guess**. High-confidence rows still need final confirmation against the live app user list before production import. Blank/review rows must not be auto-assigned.

- Distinct legacy names found: 75
- High-confidence direct/variant matches: 21
- Needs review / possible external customer names: 54
- Draft CSV: `docs/legacy-convogenie-audit/legacy_employee_name_match_draft.csv`
- Focused Ajay phone-match review: `docs/legacy-convogenie-audit/legacy_ajay_phone_match_review.md`

## Rahul/team confirmation update — 2026-06-16

- Rahul/team confirmed the non-Ajay employee name variants listed below are the same employees as proposed.
- Ajay variants must be matched using employee phone number before import because there are two employees named Ajay; do not auto-assign Ajay rows by name alone.
- Customer/company-looking names remain unmatched/review-only unless separately confirmed.

Ajay phone-check status:

- Live profiles found: Ajay AS / Sales / `CB-S-006` / phone ending **5588**; Ajay / Service / `CB-SE-005` / phone ending **5825**.
- Legacy `Ajay` rows are confirmed to the Service Ajay profile by phone match from the old no-report archive.
- Legacy `Ajay s`, `A S AJAY`, and `Ajay, madhu` remain blocked because those field-activity rows do not carry employee phone numbers.

## High-confidence / obvious variants

- `Sanjeev P` → **Sanjeev P** (sales), rows: 99
- `Girish D` → **Girish D** (service), rows: 64
- `Deekshak` → **Deekshak** (sales), rows: 53
- `Dr. Swati Priya` → **Dr. Swati Priya** (sales), rows: 40
- `Surendra kumar m` → **Surendra Kumar M** (service), rows: 37
- `Ajay s` → blocked; rows: 34 — **phone/team confirmation still required**
- `Manjunath.N.M` → **Manjunath N M** (sales), rows: 27
- `Surendra Kumar m` → **Surendra Kumar M** (service), rows: 27
- `Padmakumar G` → **Padmakumar G** (sales), rows: 25
- `Prasanna Kumar mv` → **Prasanna Kumar M V** (service), rows: 25
- `G A Madhu` → **Madhu G A** (service), rows: 23
- `Prasanna Kumar M V` → **Prasanna Kumar M V** (service), rows: 17
- `A S AJAY` → blocked; rows: 13 — **phone/team confirmation still required**
- `Prasanna kumar mv` → **Prasanna Kumar M V** (service), rows: 9
- `Surendra Kumar M` → **Surendra Kumar M** (service), rows: 8
- `DEEKSHAK [CRYSTAL BIO]` → **Deekshak** (sales), rows: 7
- `Raghavendra K` → **Raghavendra K** (admin/sales), rows: 6
- `Madhu G A` → **Madhu G A** (service), rows: 5
- `Prasanna Kumar MV` → **Prasanna Kumar M V** (service), rows: 5
- `Manjunath N.M.` → **Manjunath N M** (sales), rows: 2
- `Manjunath.N.M.` → **Manjunath N M** (sales), rows: 1

## Needs Rahul/team confirmation

- `Girish` → Girish D; confidence: confirmed_by_rahul; rows: 28; buckets: attendance_login:15, service_visit:13
- `Manjunath` → Manjunath N M; confidence: confirmed_by_rahul; rows: 11; buckets: sales_visit:7, attendance_login:4
- `Surendra` → Surendra Kumar M; confidence: confirmed_by_rahul; rows: 10; buckets: service_visit:5, attendance_login:5
- `Ajay` → Ajay / Service / CB-SE-005; confidence: confirmed_by_phone; rows: 7; buckets: service_visit:4, attendance_login:3
- `Sanjeev` → Sanjeev P; confidence: confirmed_by_rahul; rows: 7; buckets: attendance_login:4, sales_visit:3
- `Padmakumar` → Padmakumar G; confidence: confirmed_by_rahul; rows: 5; buckets: sales_visit:3, attendance_login:2
- `Veolia` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 5; buckets: attendance_login:3, service_visit:2
- `Harish` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 4; buckets: service_visit:4
- `Akshay` → Akshay; confidence: review; rows: 3; buckets: service_visit:2, attendance_login:1
- `Garden City` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 3; buckets: attendance_login:2, sales_visit:1
- `Sabil` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 3; buckets: service_visit:3
- `Arvind` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 2; buckets: service_visit:2
- `Clitus` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 2; buckets: service_visit:2
- `Prasanna Kumar` → Prasanna Kumar M V; confidence: confirmed_by_rahul; rows: 2; buckets: service_visit:2
- `SPCBE` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 2; buckets: attendance_login:2
- `Surendra Kumar` → Surendra Kumar M; confidence: confirmed_by_rahul; rows: 2; buckets: service_visit:1, attendance_login:1
- `Abhilash msmf` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Ajay, madhu` → UNMATCHED / review; confidence: phone_check_required; rows: 1; buckets: attendance_login:1
- `Biocon` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Deepika and Khushi` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1
- `Dr Dippayan` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1
- `Dr Himanshu` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Dr m sreepriya` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Dr Ravi sundaresan` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Dr Vijay yenagi` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Dr. Madhusudhan K.N.` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: attendance_login:1
- `Dr.Bebsis Roy` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: attendance_login:1
- `Kashish` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: attendance_login:1
- `Kavya` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Khushi` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: attendance_login:1
- `Kiran` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Koushili das` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Madhu` → Madhu G A; confidence: confirmed_by_rahul; rows: 1; buckets: attendance_login:1
- `Manjuanth.N.M` → Manjunath N M; confidence: confirmed_by_rahul; rows: 1; buckets: sales_visit:1
- `ManjuanthN.M` → Manjunath N M; confidence: confirmed_by_rahul; rows: 1; buckets: attendance_login:1
- `Manjunath.N..M` → Manjunath N M; confidence: confirmed_by_rahul; rows: 1; buckets: attendance_login:1
- `Manjunath.N.?` → Manjunath N M; confidence: confirmed_by_rahul; rows: 1; buckets: attendance_login:1
- `Mitalli` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: attendance_login:1
- `Mithun` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Mr. Suresh` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1
- `Naveen kumar` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Navya` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1
- `Raghavendra Gunnaih` → Raghavendra K; confidence: confirmed_by_rahul; rows: 1; buckets: sales_visit:1
- `Sandeep` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Shiva kumar` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Shivakumar` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Smiriti sundar` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Sudhakar` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Sudhakar (zenfold)` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `Swati Crystal Bio` → Dr. Swati Priya; confidence: confirmed_by_rahul; rows: 1; buckets: attendance_login:1
- `Swati Priya` → Dr. Swati Priya; confidence: confirmed_by_rahul; rows: 1; buckets: sales_visit:1
- `Teena` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: service_visit:1
- `TEST Codex` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1
- `Veena Sridharan` → UNMATCHED / review; confidence: likely_customer_or_external_review; rows: 1; buckets: sales_visit:1

## Import handling rule

- Confirmed matches can be assigned to the corresponding new app user.
- Ajay-name rows must be checked against employee phone number before assignment because there are two employees named Ajay.
- Review/blank matches should import with the original legacy name preserved and `unmatched_legacy_agent=true`, or be held back until confirmed.
- Customer/company-looking names should not be assigned to employees without human review.
