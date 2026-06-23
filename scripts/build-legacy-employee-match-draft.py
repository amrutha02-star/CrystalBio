#!/usr/bin/env python3
"""Create a first-pass legacy employee-name matching table from the audit output.

This is deliberately conservative: obvious spelling/case variants are grouped;
customer/company-looking names stay marked for review instead of being guessed.
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

AUDIT = Path('docs/legacy-convogenie-audit/legacy_convogenie_audit_2026-01-01_to_2026-06-16.json')
OUT_CSV = Path('docs/legacy-convogenie-audit/legacy_employee_name_match_draft.csv')
OUT_MD = Path('docs/LEGACY_EMPLOYEE_NAME_MATCHING_REVIEW.md')

CANONICAL = {
    'sanjeev p': ('Sanjeev P', 'sales', 'high'),
    'sanjeev': ('Sanjeev P', 'sales', 'review'),
    'deekshak': ('Deekshak', 'sales', 'high'),
    'deekshak [crystal bio]': ('Deekshak', 'sales', 'high'),
    'padmakumar g': ('Padmakumar G', 'sales', 'high'),
    'padmakumar': ('Padmakumar G', 'sales', 'review'),
    'manjunath.n.m': ('Manjunath N M', 'sales', 'high'),
    'manjunath.n.m.': ('Manjunath N M', 'sales', 'high'),
    'manjunath n.m.': ('Manjunath N M', 'sales', 'high'),
    'manjuanth.n.m': ('Manjunath N M', 'sales', 'review_typo'),
    'manjuanthn.m': ('Manjunath N M', 'sales', 'review_typo'),
    'manjunath.n.?': ('Manjunath N M', 'sales', 'review_typo'),
    'manjunath.n..m': ('Manjunath N M', 'sales', 'review_typo'),
    'manjunath': ('Manjunath N M', 'sales', 'review'),
    'dr. swati priya': ('Dr. Swati Priya', 'sales', 'high'),
    'swati priya': ('Dr. Swati Priya', 'sales', 'review'),
    'swati crystal bio': ('Dr. Swati Priya', 'sales', 'review'),
    'raghavendra k': ('Raghavendra K', 'admin/sales', 'high'),
    'raghavendra gunnaih': ('Raghavendra K', 'admin/sales', 'review'),
    'girish d': ('Girish D', 'service', 'high'),
    'girish': ('Girish D', 'service', 'review'),
    'surendra kumar m': ('Surendra Kumar M', 'service', 'high'),
    'surendra kumar m': ('Surendra Kumar M', 'service', 'high'),
    'surendra kumar': ('Surendra Kumar M', 'service', 'review'),
    'surendra': ('Surendra Kumar M', 'service', 'review'),
    'surendra kumar m': ('Surendra Kumar M', 'service', 'high'),
    'ajay s': ('Ajay S', 'service', 'high'),
    'a s ajay': ('Ajay S', 'service', 'high'),
    'ajay': ('Ajay S', 'service', 'review'),
    'prasanna kumar mv': ('Prasanna Kumar M V', 'service', 'high'),
    'prasanna kumar m v': ('Prasanna Kumar M V', 'service', 'high'),
    'prasanna kumar': ('Prasanna Kumar M V', 'service', 'review'),
    'prasanna': ('Prasanna Kumar M V', 'service', 'review'),
    'prasanna kumar mv': ('Prasanna Kumar M V', 'service', 'high'),
    'g a madhu': ('Madhu G A', 'service', 'high'),
    'madhu g a': ('Madhu G A', 'service', 'high'),
    'madhu': ('Madhu G A', 'service', 'review'),
    'akshay': ('Akshay', 'service', 'review'),
}

CUSTOMER_OR_EXTERNAL_HINTS = [
    'dr ', 'dr.', 'garden city', 'veolia', 'spcbe', 'biocon', 'zenfold', 'hospital', 'college', 'khushi',
    'kashish', 'mitalli', 'navya', 'deepika', 'veena', 'suresh', 'ravi', 'sreepriya', 'vijay', 'himanshu',
    'smiriti', 'koushili', 'abhilash', 'kiran', 'mithun', 'kavya', 'teena', 'sabil', 'harish', 'arvind',
    'clitus', 'naveen', 'sudhakar', 'shivakumar', 'shiva kumar', 'sandeep', 'bebsis', 'madhusudhan',
    'dippayan', 'codex', 'test', 'unknown'
]


def norm(name: str) -> str:
    return ' '.join(name.strip().replace('[CRYSTAL BIO]', '[crystal bio]').lower().split())


def main() -> None:
    data = json.loads(AUDIT.read_text())
    rows = []
    aggregate = defaultdict(lambda: {'total': 0, 'buckets': Counter()})
    for bucket, items in data['names_by_bucket'].items():
        for name, count in items:
            if name == 'Unknown':
                continue
            aggregate[name]['total'] += count
            aggregate[name]['buckets'][bucket] += count

    for legacy_name, info in sorted(aggregate.items(), key=lambda kv: (-kv[1]['total'], kv[0].lower())):
        key = norm(legacy_name)
        proposed, role, confidence = CANONICAL.get(key, ('', '', 'needs_review'))
        if not proposed and any(hint in key for hint in CUSTOMER_OR_EXTERNAL_HINTS):
            confidence = 'likely_customer_or_external_review'
        buckets = ', '.join(f'{bucket}:{count}' for bucket, count in info['buckets'].most_common())
        rows.append({
            'legacy_name': legacy_name,
            'proposed_new_app_name': proposed,
            'proposed_role': role,
            'confidence': confidence,
            'total_rows': info['total'],
            'bucket_counts': buckets,
            'review_notes': 'Confirm before import; do not auto-assign if blank or review confidence.' if confidence != 'high' else 'Likely direct match; still confirm against live user list.',
        })

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    high = sum(1 for r in rows if r['confidence'] == 'high')
    review = len(rows) - high
    md = []
    md.append('# Legacy employee name matching review\n\n')
    md.append('Purpose: match old Convogenie report names to new CrystalBio app users before importing legacy records.\n\n')
    md.append('Rule: **do not guess**. High-confidence rows still need final confirmation against the live app user list before production import. Blank/review rows must not be auto-assigned.\n\n')
    md.append(f'- Distinct legacy names found: {len(rows)}\n')
    md.append(f'- High-confidence direct/variant matches: {high}\n')
    md.append(f'- Needs review / possible external customer names: {review}\n')
    md.append(f'- Draft CSV: `{OUT_CSV}`\n\n')
    md.append('## High-confidence / obvious variants\n\n')
    for r in rows:
        if r['confidence'] == 'high':
            md.append(f"- `{r['legacy_name']}` → **{r['proposed_new_app_name']}** ({r['proposed_role']}), rows: {r['total_rows']}\n")
    md.append('\n## Needs Rahul/team confirmation\n\n')
    for r in rows:
        if r['confidence'] != 'high':
            target = r['proposed_new_app_name'] or 'UNMATCHED / review'
            md.append(f"- `{r['legacy_name']}` → {target}; confidence: {r['confidence']}; rows: {r['total_rows']}; buckets: {r['bucket_counts']}\n")
    md.append('\n## Import handling rule\n\n')
    md.append('- Confirmed matches can be assigned to the corresponding new app user.\n')
    md.append('- Review/blank matches should import with the original legacy name preserved and `unmatched_legacy_agent=true`, or be held back until confirmed.\n')
    md.append('- Customer/company-looking names should not be assigned to employees without human review.\n')
    OUT_MD.write_text(''.join(md))
    print({'rows': len(rows), 'high': high, 'review': review, 'csv': str(OUT_CSV), 'md': str(OUT_MD)})

if __name__ == '__main__':
    main()
