#!/usr/bin/env python3
"""Build a read-only customer-centric legacy Convogenie history webpage.

This is an archive/export artifact only. It does not edit, clean, import, or write
CrystalBio app data. It preserves every audited source row as captured, including
blank/missing fields shown as blanks in the page.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Any

AUDIT_PATH = Path("docs/legacy-convogenie-audit/legacy_convogenie_audit_2026-01-01_to_2026-06-16.json")
OUT_DIR = Path("docs/legacy-convogenie-audit/customer-history-page")
OUT_HTML = OUT_DIR / "index.html"
OUT_JSON = OUT_DIR / "legacy_customer_history_data.json"

CUSTOMER_FIELDS = [
    "Account",
    "Account Name",
    "Hospital/Lab Name",
    "Customer Name",
    "Customer",
    "Customer Name And Designation",
    "Customer Department And Address",
]

PERSON_FIELDS = [
    "Engineer Name",
    "Executive Name",
    "Sales Executive Name",
    "Team Member",
    "Name",
    "Sales Executive",
    "Service Engineer",
]

BUCKET_LABELS = {
    "sales_visit": "Sales",
    "service_visit": "Service",
    "attendance_login": "Attendance/Login",
    "leave_holiday": "Leave/Holiday",
    "pending_no_report": "No report / pending",
}


def first_value(details: dict[str, Any], fields: list[str]) -> str:
    for field in fields:
        value = details.get(field)
        if value not in (None, ""):
            return str(value)
    return ""


def strip_designation(value: str) -> str:
    # Display grouping only. Original value remains untouched in record.details.
    if not value:
        return ""
    first = value.split("|", 1)[0].strip()
    if "," in first:
        return first.split(",", 1)[0].strip()
    return first.strip()


def customer_group(record: dict[str, Any]) -> str:
    details = record.get("details") or {}
    bucket = record.get("target_bucket")
    value = first_value(details, CUSTOMER_FIELDS)
    if value:
        return strip_designation(value) or value
    if bucket in {"attendance_login", "leave_holiday", "pending_no_report"}:
        return "No customer recorded"
    return "Customer not filled"


def person_from_record(record: dict[str, Any]) -> str:
    details = record.get("details") or {}
    value = first_value(details, PERSON_FIELDS)
    if value:
        return value
    heading = str(record.get("legacy_heading") or "")
    if " - " in heading:
        return heading.split(" - ", 1)[0]
    return heading


def sort_key(record: dict[str, Any]) -> tuple[str, str, str, str]:
    date = str(record.get("legacy_source_date") or "9999-99-99")
    submitted = str(record.get("submitted_at") or f"{date}T00:00")
    bucket = str(record.get("target_bucket") or "")
    exact_hash = str(record.get("exact_hash") or "")
    return (date, submitted, bucket, exact_hash)


def bucket_fields(audit: dict[str, Any]) -> dict[str, list[str]]:
    fields = {bucket: list(labels) for bucket, labels in (audit.get("field_labels_by_bucket") or {}).items()}
    # Ensure fields seen in raw rows are included too, preserving captured names.
    for row in audit["import_source_records"]:
        bucket = row.get("target_bucket") or "unknown"
        fields.setdefault(bucket, [])
        for key in (row.get("details") or {}).keys():
            if key not in fields[bucket]:
                fields[bucket].append(key)
    return fields


def make_payload(audit: dict[str, Any]) -> dict[str, Any]:
    fields_by_bucket = bucket_fields(audit)
    source_rows = list(audit["import_source_records"])
    source_rows.sort(key=sort_key)

    records: list[dict[str, Any]] = []
    customers: dict[str, dict[str, Any]] = {}
    for idx, row in enumerate(source_rows, start=1):
        bucket = row.get("target_bucket") or "unknown"
        details = row.get("details") or {}
        customer = customer_group(row)
        person = person_from_record(row)
        expected_fields = fields_by_bucket.get(bucket, [])
        fields_for_display = [{"label": label, "value": str(details.get(label, ""))} for label in expected_fields]
        record = {
            "sequence": idx,
            "customerGroup": customer,
            "bucket": bucket,
            "bucketLabel": BUCKET_LABELS.get(bucket, bucket),
            "sourceDate": row.get("legacy_source_date"),
            "submittedAt": row.get("submitted_at"),
            "legacyHeading": row.get("legacy_heading"),
            "legacySection": row.get("legacy_section"),
            "legacySourceReportType": row.get("legacy_source_report_type"),
            "legacySourceUrl": row.get("legacy_source_url"),
            "personAsCaptured": person,
            "exactHash": row.get("exact_hash"),
            "textHash": row.get("text_hash"),
            "fieldsForDisplay": fields_for_display,
            "originalDetails": details,
            "originalRecord": row,
        }
        records.append(record)
        entry = customers.setdefault(customer, {"name": customer, "count": 0, "firstDate": row.get("legacy_source_date"), "lastDate": row.get("legacy_source_date"), "buckets": Counter()})
        entry["count"] += 1
        entry["firstDate"] = min(entry["firstDate"] or row.get("legacy_source_date"), row.get("legacy_source_date") or entry["firstDate"])
        entry["lastDate"] = max(entry["lastDate"] or row.get("legacy_source_date"), row.get("legacy_source_date") or entry["lastDate"])
        entry["buckets"][bucket] += 1

    customer_list = []
    for item in customers.values():
        customer_list.append({
            "name": item["name"],
            "count": item["count"],
            "firstDate": item["firstDate"],
            "lastDate": item["lastDate"],
            "buckets": dict(item["buckets"]),
        })
    customer_list.sort(key=lambda c: (c["firstDate"] or "9999-99-99", c["name"].lower()))

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceAudit": str(AUDIT_PATH),
        "dateRange": audit.get("date_range"),
        "rules": {
            "readOnlyArchive": True,
            "appDataChanged": False,
            "sourceDataEdited": False,
            "sourceRowsIncluded": "import_source_records, including exact duplicates captured by the audit",
            "sortOrder": "oldest_to_most_recent",
            "emptyFields": "shown as blank strings in fieldsForDisplay",
            "customerCentric": True,
        },
        "summary": {
            "sourceRowsIncluded": len(records),
            "customersOrGroups": len(customer_list),
            "bucketCounts": dict(Counter(r["bucket"] for r in records)),
            "firstDate": records[0]["sourceDate"] if records else None,
            "lastDate": records[-1]["sourceDate"] if records else None,
        },
        "customers": customer_list,
        "records": records,
    }


def build_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    summary = payload["summary"]
    html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CrystalBio Legacy Customer History</title>
  <style>
    :root { --bg:#f5f7ef; --panel:#fffffb; --ink:#213025; --muted:#657064; --olive:#526647; --sage:#dfe7d6; --line:#d8dfcf; --soft:#eef3e8; }
    * { box-sizing:border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--ink); }
    .shell { max-width:1240px; margin:0 auto; padding:24px; }
    header { display:flex; gap:18px; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
    h1 { margin:0; font-size:28px; line-height:1.12; letter-spacing:-0.03em; color:#263420; }
    .subtitle { margin:8px 0 0; color:var(--muted); max-width:760px; line-height:1.45; }
    .badge { display:inline-flex; padding:7px 10px; border-radius:999px; background:var(--sage); color:#314026; font-size:13px; white-space:nowrap; }
    .summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin:20px 0; }
    .stat { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:16px; box-shadow:0 10px 30px rgba(42,55,36,.05); }
    .stat b { display:block; font-size:24px; letter-spacing:-.03em; }
    .stat span { color:var(--muted); font-size:13px; }
    .toolbar { position:sticky; top:0; z-index:5; background:rgba(245,247,239,.92); backdrop-filter: blur(12px); border:1px solid var(--line); border-radius:20px; padding:12px; display:grid; grid-template-columns:1.4fr .7fr .7fr auto; gap:10px; margin-bottom:16px; }
    input, select, button { border:1px solid var(--line); border-radius:14px; padding:11px 12px; font:inherit; background:#fffef9; color:var(--ink); }
    button { background:var(--olive); color:white; cursor:pointer; border-color:var(--olive); }
    .layout { display:grid; grid-template-columns:320px 1fr; gap:16px; align-items:start; }
    .customers { position:sticky; top:86px; max-height:calc(100vh - 110px); overflow:auto; background:var(--panel); border:1px solid var(--line); border-radius:22px; padding:10px; }
    .customer { width:100%; text-align:left; background:#fffef9; color:var(--ink); border:1px solid transparent; margin:4px 0; padding:12px; border-radius:15px; display:block; }
    .customer.active { border-color:var(--olive); background:var(--soft); }
    .customer strong { display:block; font-size:14px; }
    .customer small { color:var(--muted); }
    .timeline { display:flex; flex-direction:column; gap:12px; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:22px; padding:16px; box-shadow:0 10px 30px rgba(42,55,36,.045); }
    .card-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; border-bottom:1px solid var(--line); padding-bottom:12px; margin-bottom:12px; }
    .card h2 { margin:0; font-size:18px; letter-spacing:-.02em; }
    .meta { color:var(--muted); font-size:13px; margin-top:4px; line-height:1.4; }
    .pill { display:inline-flex; padding:6px 9px; border-radius:999px; background:var(--soft); color:#394631; font-size:12px; margin-left:6px; }
    .date { text-align:right; color:#36422f; min-width:118px; }
    .date b { display:block; font-size:15px; }
    details { margin-top:10px; }
    summary { cursor:pointer; color:var(--olive); font-weight:650; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:12px; }
    .field { border:1px solid var(--line); border-radius:13px; padding:10px; background:#fffdf6; min-height:58px; }
    .field label { display:block; font-size:12px; color:var(--muted); margin-bottom:4px; }
    .field div { white-space:pre-wrap; overflow-wrap:anywhere; font-size:14px; }
    .blank { color:#a19885; font-style:italic; }
    .raw { white-space:pre-wrap; font:12px ui-monospace, SFMono-Regular, Menlo, monospace; background:#f8f4e8; border:1px solid #eadfca; border-radius:14px; padding:12px; overflow:auto; max-height:360px; }
    .empty { padding:28px; text-align:center; color:var(--muted); background:var(--panel); border:1px dashed var(--line); border-radius:22px; }
    footer { color:var(--muted); font-size:12px; margin-top:24px; }
    @media (max-width: 860px) { .shell { padding:14px; } header { display:block; } .summary { grid-template-columns:repeat(2,1fr); } .toolbar { grid-template-columns:1fr; position:static; } .layout { grid-template-columns:1fr; } .customers { position:static; max-height:260px; } .grid { grid-template-columns:1fr; } .date { text-align:left; } .card-head { display:block; } }
  </style>
</head>
<body>
  <div class="shell">
    <header><div><h1>Legacy Customer History</h1><p class="subtitle">Read-only Convogenie archive for owner review. Rows are grouped around customer/company where available, ordered oldest to most recent, and original captured fields are preserved. Blank fields stay blank.</p></div><span class="badge">Read-only archive</span></header>
    <section class="summary"><div class="stat"><b>@@ROWS@@</b><span>source rows included</span></div><div class="stat"><b>@@CUSTOMERS@@</b><span>customer/groups</span></div><div class="stat"><b>@@FIRST@@</b><span>oldest date</span></div><div class="stat"><b>@@LAST@@</b><span>most recent date</span></div></section>
    <section class="toolbar"><input id="search" placeholder="Search customer, company, original heading, person, or field value" /><select id="bucket"><option value="">All report types</option></select><select id="customerFilter"><option value="">All customers/groups</option></select><button id="reset">Reset</button></section>
    <main class="layout"><aside class="customers" id="customers"></aside><section class="timeline"><div class="meta" id="resultCount"></div><div id="timeline" class="timeline"></div><button id="more" type="button">Show more rows</button></section></main>
    <footer>Generated @@GENERATED@@. This page is a local archive artifact; it does not import or modify CrystalBio app data.</footer>
  </div>
  <script id="legacy-data" type="application/json">@@DATA@@</script>
  <script>
    const payload = JSON.parse(document.getElementById('legacy-data').textContent);
    const records = payload.records;
    const customers = payload.customers;
    const bucketLabels = {"sales_visit":"Sales","service_visit":"Service","attendance_login":"Attendance/Login","leave_holiday":"Leave/Holiday","pending_no_report":"No report / pending"};
    const state = { search:'', bucket:'', customer:'', visible:120 };
    const el = id => document.getElementById(id);
    const norm = value => String(value || '').toLowerCase();
    function escapeHtml(value) { return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch])); }
    function fieldText(record) { return [record.customerGroup, record.legacyHeading, record.personAsCaptured, record.bucketLabel, record.sourceDate, JSON.stringify(record.originalDetails)].join(' '); }
    function filtered() { const q = norm(state.search); return records.filter(r => (!state.bucket || r.bucket === state.bucket) && (!state.customer || r.customerGroup === state.customer) && (!q || norm(fieldText(r)).includes(q))); }
    function fillControls() {
      const buckets = [...new Set(records.map(r => r.bucket))];
      el('bucket').innerHTML = '<option value="">All report types</option>' + buckets.map(b => '<option value="' + escapeHtml(b) + '">' + escapeHtml(bucketLabels[b] || b) + '</option>').join('');
      el('customerFilter').innerHTML = '<option value="">All customers/groups</option>' + customers.map(c => '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + ' (' + c.count + ')</option>').join('');
    }
    function renderCustomers(list) {
      const visible = new Set(list.map(r => r.customerGroup));
      el('customers').innerHTML = customers.filter(c => visible.has(c.name)).map(c => '<button class="customer ' + (state.customer===c.name?'active':'') + '" data-customer="' + escapeHtml(c.name) + '"><strong>' + escapeHtml(c.name) + '</strong><small>' + c.count + ' rows · ' + escapeHtml(c.firstDate) + ' → ' + escapeHtml(c.lastDate) + '</small></button>').join('') || '<div class="empty">No customers found</div>';
      document.querySelectorAll('.customer').forEach(btn => btn.addEventListener('click', () => { state.customer = btn.dataset.customer; state.visible=120; el('customerFilter').value = state.customer; render(); }));
    }
    function renderTimeline(list) {
      const visible = list.slice(0, state.visible);
      el('resultCount').innerHTML = 'Showing ' + visible.length + ' of ' + list.length + ' rows · oldest to most recent';
      el('more').style.display = list.length > visible.length ? 'block' : 'none';
      el('timeline').innerHTML = visible.map(r => '<article class="card"><div class="card-head"><div><h2>' + escapeHtml(r.customerGroup) + ' <span class="pill">' + escapeHtml(r.bucketLabel) + '</span></h2><div class="meta">Original heading: ' + escapeHtml(r.legacyHeading || '') + '<br/>Captured person/name: ' + escapeHtml(r.personAsCaptured || '') + '<br/>Section: ' + escapeHtml(r.legacySection || '') + ' · Source: ' + escapeHtml(r.legacySourceReportType || '') + '</div></div><div class="date"><b>' + escapeHtml(r.sourceDate || '') + '</b><span>' + escapeHtml(r.submittedAt || 'No submitted time') + '</span><br/><small>#' + r.sequence + '</small></div></div><details open><summary>Original fields</summary><div class="grid">' + r.fieldsForDisplay.map(f => '<div class="field"><label>' + escapeHtml(f.label) + '</label><div class="' + (f.value ? '' : 'blank') + '">' + (f.value ? escapeHtml(f.value) : '') + '</div></div>').join('') + '</div></details><details><summary>Raw captured row</summary><pre class="raw">' + escapeHtml(JSON.stringify(r.originalRecord, null, 2)) + '</pre></details></article>').join('') || '<div class="empty">No rows match the filters.</div>';
    }
    function render() { const list = filtered(); renderCustomers(list); renderTimeline(list); }
    el('search').addEventListener('input', e => { state.search = e.target.value; state.visible=120; render(); });
    el('bucket').addEventListener('change', e => { state.bucket = e.target.value; state.visible=120; render(); });
    el('customerFilter').addEventListener('change', e => { state.customer = e.target.value; state.visible=120; render(); });
    el('reset').addEventListener('click', () => { state.search=''; state.bucket=''; state.customer=''; state.visible=120; el('search').value=''; el('bucket').value=''; el('customerFilter').value=''; render(); });
    el('more').addEventListener('click', () => { state.visible += 120; render(); });
    fillControls(); render();
  </script>
</body>
</html>
"""
    return (html
        .replace("@@DATA@@", data_json)
        .replace("@@ROWS@@", escape(str(summary["sourceRowsIncluded"])))
        .replace("@@CUSTOMERS@@", escape(str(summary["customersOrGroups"])))
        .replace("@@FIRST@@", escape(str(summary["firstDate"])))
        .replace("@@LAST@@", escape(str(summary["lastDate"])))
        .replace("@@GENERATED@@", escape(payload["generatedAt"])))


def main() -> int:
    audit = json.loads(AUDIT_PATH.read_text())
    payload = make_payload(audit)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    OUT_HTML.write_text(build_html(payload))
    print(json.dumps({
        "html": str(OUT_HTML),
        "json": str(OUT_JSON),
        "summary": payload["summary"],
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
