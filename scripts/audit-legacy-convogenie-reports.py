#!/usr/bin/env python3
"""Audit legacy Convogenie CrystalBio daily report pages.

Reads authenticated report pages and separates rows into target CrystalBio import buckets.
Authentication: set CONVOGENIE_SESSION_COOKIE to the value of __Secure-better-auth.session_token.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup, Tag

BASE_URL = "https://console.convogenie.ai/reports/crystal-bio-{report_type}-daily-{day}"
REPORT_TYPES = ("sales", "service", "all")

TARGET_FIELD_MAP: dict[str, dict[str, str]] = {
    "sales_visit": {
        "Sales Executive Name": "sales_visit_updates.agentName + sales_opportunities.ownerAgentId after employee match",
        "Account": "sales_opportunities.accountName",
        "Account Name": "sales_opportunities.accountName",
        "Lead Source": "sales_opportunities.leadSource",
        "Product Type": "sales_opportunities.productType",
        "Brand": "sales_opportunities.brandName",
        "Brand Name": "sales_opportunities.brandName",
        "Equipment Name": "sales_opportunities.equipmentModel",
        "Customer": "sales_opportunities.contactPerson",
        "Customer Name": "sales_opportunities.contactPerson",
        "Customer Name And Designation": "sales_opportunities.contactPerson + designation if separable",
        "Customer Phone": "sales_opportunities.phone",
        "Customer Phone Number": "sales_opportunities.phone",
        "Customer Email": "sales_opportunities.email",
        "Customer Email Id": "sales_opportunities.email",
        "Customer Email I D": "sales_opportunities.email",
        "Email": "sales_opportunities.email",
        "Customer Department": "sales_opportunities.departmentAddress",
        "Customer Department Address": "sales_opportunities.departmentAddress",
        "Customer Department And Address": "sales_opportunities.departmentAddress",
        "Customer Location": "sales_opportunities.departmentAddress or raw_json",
        "Quote Submitted": "sales_opportunities.quoteSubmitted",
        "Project Quote Status": "sales_opportunities.quoteStatus",
        "Budgetary Proposal": "sales_opportunities.budgetaryProposal",
        "Fund Status": "sales_opportunities.fundStatus",
        "Probability": "sales_opportunities.probability",
        "Probability Of Closing": "sales_opportunities.probability",
        "Closing Date": "sales_opportunities.closingDate",
        "Is Support Required": "sales_opportunities.supportRequired",
        "Support Required": "sales_opportunities.supportRequired",
        "Remarks": "sales_opportunities.remarksTimeline and/or sales_visit_updates.note",
        "Remarks And Timeline": "sales_opportunities.remarksTimeline",
        "Timeline": "sales_opportunities.remarksTimeline",
        "Location Coordinates": "sales_visit_updates.gps.latitude/longitude",
        "Coordinates": "sales_visit_updates.gps.latitude/longitude",
        "Location Accuracy Meters": "sales_visit_updates.gps.accuracyMeters",
        "Location Address": "raw_json unless Rahul wants a visible location note",
        "Report Mode": "raw_json.legacyAudit",
        "Working Status": "raw_json.legacyAudit",
        "Approved By": "raw_json.legacyAudit",
        "Leave Reason": "raw_json.legacyAudit unless leave record",
    },
    "service_visit": {
        "Engineer Name": "service_visit_updates.agentName + service_records.ownerAgentId after employee match",
        "Customer Name": "service_records.customerName",
        "Customer Phone Number": "service_records.phone",
        "Customer Department And Address": "service_records.departmentAddress",
        "Brand Name": "service_records.brandName",
        "Equipment Name": "service_records.equipmentName",
        "Serial Number": "service_records.serialNumber",
        "Service Type": "service_visit_updates.serviceType",
        "Work Done": "service_visit_updates.workDone",
        "Support Required": "service_visit_updates.supportRequired",
        "Next Action": "service_visit_updates.nextAction",
        "Location Coordinates": "service_visit_updates.gps.latitude/longitude",
        "Coordinates": "service_visit_updates.gps.latitude/longitude",
        "Location Accuracy Meters": "service_visit_updates.gps.accuracyMeters",
        "Location": "raw_json or service_visit_updates.officeNotes after review",
        "Probability": "raw_json unless a visible service-priority field is approved",
        "Report Mode": "raw_json.legacyAudit",
        "Working Status": "raw_json.legacyAudit",
    },
    "attendance_login": {
        "Team Member Name": "attendance_records.agentName",
        "Sales Executive Name": "attendance_records.agentName when login row uses Sales naming",
        "Engineer Name": "attendance_records.agentName when login row uses Service naming",
        "Location Coordinates": "attendance_records.checkInGps.latitude/longitude",
        "Coordinates": "attendance_records.checkInGps.latitude/longitude",
        "Location Accuracy Meters": "attendance_records.checkInGps.accuracyMeters",
        "Remarks": "attendance_records.note",
        "Location": "attendance_records.note or raw_json",
        "Report Mode": "raw_json.legacyAudit",
        "Working Status": "attendance_records.status/raw_json",
        "Probability": "raw_json.legacyAudit",
    },
}

SERVICE_TYPE_MAP = {
    "installation": "installation",
    "pm": "preventive_maintenance",
    "preventive": "preventive_maintenance",
    "breakdown": "breakdown",
    "repair": "repair",
    "calibration": "calibration",
    "demo": "demo",
    "training": "training",
    "other": "other",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="from_date", required=True)
    parser.add_argument("--to", dest="to_date", required=True)
    parser.add_argument("--outdir", default="docs/legacy-convogenie-audit")
    return parser.parse_args()


def daterange(start: date, end: date) -> list[str]:
    days = []
    cur = start
    while cur <= end:
        days.append(cur.isoformat())
        cur += timedelta(days=1)
    return days


def clean_text(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", text.strip())


def parse_timestamp(text: str) -> str | None:
    match = re.search(r"(\d{2}/\d{2}/\d{4},\s*\d{2}:\d{2}\s*[ap]m)", text, re.I)
    if not match:
        return None
    raw = match.group(1)
    try:
        return datetime.strptime(raw, "%d/%m/%Y, %I:%M %p").isoformat(timespec="minutes")
    except ValueError:
        return raw


def record_type_from_heading(section: str | None, heading: str, details: dict[str, str] | None = None) -> str:
    """Classify a legacy report article into the new-app import bucket.

    The old console used more than one heading style over time:
    `Name - Sales`, `Name - Sales Report`, `Name - Service`, and
    `Name - Service Report`. Section and detail labels are used as a
    fallback so real visit rows are not mistaken for no-report rows.
    """
    details = details or {}
    normalized_heading = heading.lower()
    normalized_section = (section or "").lower()
    if "leave" in normalized_section or "holiday" in normalized_section:
        return "leave_holiday"
    if re.search(r" - sales( report)?$", normalized_heading):
        return "sales_visit"
    if re.search(r" - service( report)?$", normalized_heading):
        return "service_visit"
    if re.search(r" - login$", normalized_heading):
        return "attendance_login"
    if "sales reports" in normalized_section and (
        "Sales Executive Name" in details or "Lead Source" in details or "Project Quote Status" in details
    ):
        return "sales_visit"
    if "service reports" in normalized_section and (
        "Engineer Name" in details or "Service Type" in details or "Work Done" in details
    ):
        return "service_visit"
    if "attendance" in normalized_section and (
        "Team Member Name" in details or "Sales Executive Name" in details or "Engineer Name" in details
    ):
        return "attendance_login"
    return "pending_no_report"


def parse_page(session: requests.Session, report_type: str, day: str) -> list[dict[str, Any]]:
    url = BASE_URL.format(report_type=report_type, day=day)
    response = session.get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for element in soup(["script", "style"]):
        element.decompose()

    records = []
    current_section = None
    main = soup.select_one("main") or soup
    for element in main.descendants:
        if not isinstance(element, Tag):
            continue
        if element.name == "h2":
            current_section = element.get_text(" ", strip=True)
            continue
        if element.name != "article":
            continue

        heading_node = element.select_one("h3")
        heading = heading_node.get_text(" ", strip=True) if heading_node else ""
        text = clean_text(element.get_text("\n", strip=True))
        details = {}
        for dt in element.select("dt"):
            dd = dt.find_next_sibling("dd")
            if dd:
                details[dt.get_text(" ", strip=True)] = dd.get_text(" ", strip=True)

        records.append({
            "legacy_source_url": url,
            "legacy_source_report_type": report_type,
            "legacy_source_date": day,
            "legacy_section": current_section,
            "legacy_heading": heading,
            "target_bucket": record_type_from_heading(current_section, heading, details),
            "submitted_at": parse_timestamp(text),
            "details": details,
            "legacy_text_preview": text[:1000],
            "exact_hash": hashlib.sha256(json.dumps({"heading": heading, "submitted_at": parse_timestamp(text), "details": details}, sort_keys=True).encode()).hexdigest(),
            "text_hash": hashlib.sha256(text.encode()).hexdigest(),
        })
    return records


def exact_key(record: dict[str, Any]) -> tuple[Any, ...]:
    return (
        record["target_bucket"],
        record["legacy_source_date"],
        record["legacy_heading"],
        record.get("submitted_at"),
        json.dumps(record["details"], sort_keys=True, ensure_ascii=False),
    )


def main() -> int:
    args = parse_args()
    cookie = os.environ.get("CONVOGENIE_SESSION_COOKIE")
    if not cookie:
        print("Set CONVOGENIE_SESSION_COOKIE", file=sys.stderr)
        return 2

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    start = date.fromisoformat(args.from_date)
    end = date.fromisoformat(args.to_date)
    days = daterange(start, end)

    session = requests.Session()
    session.cookies.set("__Secure-better-auth.session_token", cookie, domain=".convogenie.ai", path="/")

    raw_records: list[dict[str, Any]] = []
    page_status = []
    for report_type in REPORT_TYPES:
        for day in days:
            try:
                records = parse_page(session, report_type, day)
                raw_records.extend(records)
                page_status.append({"report_type": report_type, "date": day, "status": "ok", "records": len(records)})
            except Exception as exc:  # noqa: BLE001 - audit should continue and report failures
                page_status.append({"report_type": report_type, "date": day, "status": "error", "error": str(exc)})

    import_source_records = []
    for record in raw_records:
        source_type = record["legacy_source_report_type"]
        bucket = record["target_bucket"]
        if bucket == "sales_visit" and source_type == "sales":
            import_source_records.append(record)
        elif bucket == "service_visit" and source_type == "service":
            import_source_records.append(record)
        elif bucket in {"attendance_login", "leave_holiday", "pending_no_report"} and source_type == "all":
            import_source_records.append(record)

    seen = set()
    unique_records = []
    duplicate_records = []
    for record in import_source_records:
        key = exact_key(record)
        if key in seen:
            duplicate_records.append(record)
        else:
            seen.add(key)
            unique_records.append(record)

    source_counts = Counter(record["target_bucket"] for record in import_source_records)
    unique_counts = Counter(record["target_bucket"] for record in unique_records)
    labels = defaultdict(set)
    names = defaultdict(Counter)
    by_date = defaultdict(Counter)
    by_agent_date = defaultdict(Counter)
    for record in unique_records:
        bucket = record["target_bucket"]
        labels[bucket].update(record["details"].keys())
        by_date[record["legacy_source_date"]][bucket] += 1
        details = record["details"]
        agent = details.get("Sales Executive Name") or details.get("Engineer Name") or details.get("Team Member Name") or "Unknown"
        names[bucket][agent] += 1
        by_agent_date[agent][bucket] += 1

    audit = {
        "date_range": {"from": args.from_date, "to": args.to_date},
        "page_status": page_status,
        "source_counts": dict(source_counts),
        "unique_counts": dict(unique_counts),
        "duplicates_removed": len(duplicate_records),
        "field_labels_by_bucket": {bucket: sorted(values) for bucket, values in labels.items()},
        "names_by_bucket": {bucket: counter.most_common() for bucket, counter in names.items()},
        "counts_by_date": {day: dict(counter) for day, counter in sorted(by_date.items())},
        "target_field_map": TARGET_FIELD_MAP,
        "import_source_records": import_source_records,
        "unique_records_after_exact_dedupe": unique_records,
        "duplicate_records": duplicate_records,
    }

    json_path = outdir / f"legacy_convogenie_audit_{args.from_date}_to_{args.to_date}.json"
    json_path.write_text(json.dumps(audit, indent=2, ensure_ascii=False))

    csv_path = outdir / f"legacy_convogenie_unique_rows_{args.from_date}_to_{args.to_date}.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["target_bucket", "date", "submitted_at", "agent_or_name", "heading", "source_report_type", "details_json", "source_url", "exact_hash"])
        writer.writeheader()
        for record in unique_records:
            details = record["details"]
            writer.writerow({
                "target_bucket": record["target_bucket"],
                "date": record["legacy_source_date"],
                "submitted_at": record.get("submitted_at"),
                "agent_or_name": details.get("Sales Executive Name") or details.get("Engineer Name") or details.get("Team Member Name") or record["legacy_heading"],
                "heading": record["legacy_heading"],
                "source_report_type": record["legacy_source_report_type"],
                "details_json": json.dumps(details, ensure_ascii=False, sort_keys=True),
                "source_url": record["legacy_source_url"],
                "exact_hash": record["exact_hash"],
            })

    md_path = outdir / f"legacy_convogenie_summary_{args.from_date}_to_{args.to_date}.md"
    lines = []
    lines.append(f"# Legacy Convogenie extraction summary: {args.from_date} to {args.to_date}\n\n")
    lines.append("## Import-source counts\n\n")
    for bucket in ["sales_visit", "service_visit", "attendance_login", "leave_holiday", "pending_no_report"]:
        lines.append(f"- {bucket}: {source_counts[bucket]} source rows; {unique_counts[bucket]} after exact duplicate removal\n")
    lines.append(f"- exact duplicates removed: {len(duplicate_records)}\n")
    lines.append("\n## Unique field labels by bucket\n\n")
    for bucket in sorted(labels):
        lines.append(f"### {bucket}\n\n")
        for label in sorted(labels[bucket]):
            mapped = TARGET_FIELD_MAP.get(bucket, {}).get(label, "raw_json / review")
            lines.append(f"- `{label}` → {mapped}\n")
        lines.append("\n")
    lines.append("## Names seen by bucket\n\n")
    for bucket in sorted(names):
        lines.append(f"### {bucket}\n\n")
        for name, count in names[bucket].most_common():
            lines.append(f"- {name}: {count}\n")
        lines.append("\n")
    lines.append("## Files\n\n")
    lines.append(f"- JSON audit: `{json_path}`\n")
    lines.append(f"- Unique rows CSV: `{csv_path}`\n")
    md_path.write_text("".join(lines))

    print(json.dumps({
        "date_range": {"from": args.from_date, "to": args.to_date},
        "source_counts": dict(source_counts),
        "unique_counts": dict(unique_counts),
        "duplicates_removed": len(duplicate_records),
        "files": [str(json_path), str(csv_path), str(md_path)],
        "page_errors": [row for row in page_status if row["status"] != "ok"][:10],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
