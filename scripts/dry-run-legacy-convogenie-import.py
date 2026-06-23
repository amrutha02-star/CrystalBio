#!/usr/bin/env python3
"""Dry-run CrystalBio legacy Convogenie import.

This script creates a local preview only. It does not call the live app/API and does not
modify any database. It reads the audited legacy JSON and the conservative employee
name matching CSV, then writes importable vs blocked/skip reports for review.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_AUDIT = Path("docs/legacy-convogenie-audit/legacy_convogenie_audit_2026-01-01_to_2026-06-16.json")
DEFAULT_MATCHING = Path("docs/legacy-convogenie-audit/legacy_employee_name_match_draft.csv")
DEFAULT_OUTDIR = Path("docs/legacy-convogenie-audit/dry-run-import")
CONFIRMED_CONFIDENCES = {"high", "confirmed_by_rahul", "confirmed_by_phone"}
EXCLUDED_FOR_NOW_CONFIDENCES = {
    "phone_check_required",
    "likely_customer_or_external_review",
    "review",
}
IMPORTABLE_BUCKETS = {"sales_visit", "service_visit", "attendance_login", "leave_holiday"}
SKIPPED_BUCKETS = {"pending_no_report"}


def norm_name(value: str) -> str:
    value = re.sub(r"\[.*?\]", " ", value or "")
    value = re.sub(r"\s+", " ", value.replace(".", " ").replace(",", " ")).strip().lower()
    return value


def legacy_name_from_record(record: dict[str, Any]) -> str:
    details = record.get("details") or {}
    for key in (
        "Engineer Name",
        "Executive Name",
        "Sales Executive Name",
        "Team Member",
        "Name",
        "Sales Executive",
        "Service Engineer",
    ):
        value = str(details.get(key) or "").strip()
        if value:
            return value

    heading = str(record.get("legacy_heading") or "").strip()
    if " - " in heading:
        return heading.split(" - ", 1)[0].strip()
    return heading.strip()


def read_matching(path: Path) -> dict[str, dict[str, str]]:
    with path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    return {norm_name(row["legacy_name"]): row for row in rows}


def detail(record: dict[str, Any], *names: str) -> str:
    details = record.get("details") or {}
    for name in names:
        value = details.get(name)
        if value not in (None, ""):
            return str(value).strip()
    return ""


def gps(record: dict[str, Any]) -> dict[str, Any] | None:
    raw = detail(record, "Location Coordinates", "Coordinates", "GPS Coordinates")
    if not raw:
        return None
    match = re.search(r"(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)", raw)
    if not match:
        return {"raw": raw}
    result: dict[str, Any] = {"latitude": float(match.group(1)), "longitude": float(match.group(2))}
    accuracy = detail(record, "Location Accuracy Meters", "Accuracy", "Location Accuracy")
    if accuracy:
        try:
            result["accuracyMeters"] = float(re.sub(r"[^0-9.]", "", accuracy))
        except ValueError:
            result["accuracyRaw"] = accuracy
    return result


def split_customer_designation(value: str) -> tuple[str, str]:
    if not value:
        return "", ""
    if "," in value:
        first, rest = value.split(",", 1)
        return first.strip(), rest.strip()
    return value.strip(), ""


def base_metadata(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    return {
        "legacySource": "convogenie",
        "legacySourceUrl": record.get("legacy_source_url"),
        "legacySourceDate": record.get("legacy_source_date"),
        "legacyReportType": record.get("legacy_source_report_type"),
        "legacySection": record.get("legacy_section"),
        "legacyHeading": record.get("legacy_heading"),
        "legacySubmittedAt": record.get("submitted_at"),
        "legacyExactHash": record.get("exact_hash"),
        "legacyOriginalName": legacy_name,
        "matchedAgentName": matched.get("proposed_new_app_name"),
        "matchedAgentRole": matched.get("proposed_role"),
        "matchingConfidence": matched.get("confidence"),
        "isLegacyImport": True,
        "rawJson": record,
    }


def map_sales(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    contact, designation = split_customer_designation(detail(record, "Customer Name And Designation", "Customer Name"))
    return {
        "targetTable": "sales_opportunities/sales_visit_updates",
        "ownerAgentName": matched.get("proposed_new_app_name"),
        "accountName": detail(record, "Account", "Account Name", "Hospital/Lab Name") or contact or "Legacy sales account not specified",
        "contactPerson": contact,
        "designation": designation,
        "phone": detail(record, "Customer Phone Number", "Customer Phone", "Phone"),
        "email": detail(record, "Customer Email Id", "Customer Email", "Email", "Customer Email I D"),
        "departmentAddress": detail(record, "Customer Department And Address", "Customer Address", "Address", "Location"),
        "leadSource": detail(record, "Lead Source"),
        "productType": detail(record, "Product Type"),
        "brandName": detail(record, "Brand Name", "Brand"),
        "equipmentModel": detail(record, "Equipment Name", "Equipment", "Model"),
        "quoteSubmitted": detail(record, "Quote Submitted"),
        "budgetaryProposal": detail(record, "Budgetary Proposal", "Budget/Fund Status", "Budget Status"),
        "quoteStatus": detail(record, "Project Quote Status", "Quote Status"),
        "fundStatus": detail(record, "Fund Status"),
        "probability": detail(record, "Probability", "Probability Of Closing", "Win Probability"),
        "closingDate": detail(record, "Closing Date"),
        "supportRequired": detail(record, "Support Required"),
        "remarksTimeline": detail(record, "Remarks And Timeline", "Remarks", "Timeline"),
        "visit": {
            "visitDate": str(record.get("legacy_source_date") or ""),
            "visitTime": str(record.get("submitted_at") or "")[-5:] if record.get("submitted_at") else "",
            "gps": gps(record),
            "note": detail(record, "Remarks And Timeline", "Remarks", "Timeline"),
            "nextAction": "follow_up_needed",
        },
        "legacy": base_metadata(record, legacy_name, matched),
    }


def map_service(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    return {
        "targetTable": "service_records/service_visit_updates",
        "ownerAgentName": matched.get("proposed_new_app_name"),
        "customerName": detail(record, "Customer Name", "Customer", "Account") or "Legacy service customer not specified",
        "phone": detail(record, "Customer Phone Number", "Customer Phone", "Phone"),
        "departmentAddress": detail(record, "Customer Department And Address", "Customer Address", "Address", "Location"),
        "brandName": detail(record, "Brand Name", "Brand"),
        "equipmentName": detail(record, "Equipment Name", "Equipment"),
        "modelName": detail(record, "Model Name", "Model"),
        "serialNumber": detail(record, "Serial Number", "Serial No"),
        "serviceType": detail(record, "Service Type", "Type") or "other",
        "issueDescription": detail(record, "Issue Description", "Problem", "Status"),
        "actionTaken": detail(record, "Action Taken", "Work Done", "Admin Work Details"),
        "supportRequired": detail(record, "Support Required"),
        "nextAction": detail(record, "Next Action", "Status") or "next_visit_needed",
        "visit": {
            "visitDate": str(record.get("legacy_source_date") or ""),
            "visitTime": str(record.get("submitted_at") or "")[-5:] if record.get("submitted_at") else "",
            "gps": gps(record),
            "note": detail(record, "Action Taken", "Work Done", "Remarks", "Admin Work Details"),
        },
        "legacy": base_metadata(record, legacy_name, matched),
    }


def map_attendance(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    return {
        "targetTable": "attendance_records",
        "agentName": matched.get("proposed_new_app_name"),
        "date": record.get("legacy_source_date"),
        "checkInAt": record.get("submitted_at"),
        "checkInGps": gps(record),
        "status": "checked_in",
        "note": detail(record, "Remarks", "Reason", "Working Status"),
        "legacy": base_metadata(record, legacy_name, matched),
    }


def map_leave(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    return {
        "targetTable": "leave_requests",
        "agentName": matched.get("proposed_new_app_name"),
        "date": record.get("legacy_source_date"),
        "reason": detail(record, "Reason", "Remarks", "Leave Reason"),
        "legacy": base_metadata(record, legacy_name, matched),
    }


def map_record(record: dict[str, Any], legacy_name: str, matched: dict[str, str]) -> dict[str, Any]:
    bucket = record.get("target_bucket")
    if bucket == "sales_visit":
        return map_sales(record, legacy_name, matched)
    if bucket == "service_visit":
        return map_service(record, legacy_name, matched)
    if bucket == "attendance_login":
        return map_attendance(record, legacy_name, matched)
    if bucket == "leave_holiday":
        return map_leave(record, legacy_name, matched)
    raise ValueError(f"Unsupported import bucket: {bucket}")


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run legacy Convogenie import preview. No live writes.")
    parser.add_argument("--audit", type=Path, default=DEFAULT_AUDIT)
    parser.add_argument("--matching", type=Path, default=DEFAULT_MATCHING)
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR)
    args = parser.parse_args()

    audit = json.loads(args.audit.read_text())
    records = audit["unique_records_after_exact_dedupe"]
    matching = read_matching(args.matching)
    args.outdir.mkdir(parents=True, exist_ok=True)

    importable: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []
    excluded_for_now: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    unmatched_names: Counter[str] = Counter()
    import_counts = Counter()
    blocked_counts = Counter()
    skipped_counts = Counter()
    confidence_counts = Counter()

    for record in records:
        bucket = record.get("target_bucket")
        legacy_name = legacy_name_from_record(record)
        matched = matching.get(norm_name(legacy_name))

        if bucket in SKIPPED_BUCKETS:
            skipped_counts[bucket] += 1
            skipped.append({
                "target_bucket": bucket,
                "legacy_name": legacy_name,
                "reason": "pending/no-report accountability row; not field activity",
                "legacy_source_date": record.get("legacy_source_date"),
                "legacy_heading": record.get("legacy_heading"),
                "legacyExactHash": record.get("exact_hash"),
            })
            continue

        if bucket not in IMPORTABLE_BUCKETS:
            blocked_counts[f"unsupported:{bucket}"] += 1
            blocked.append({
                "target_bucket": bucket,
                "legacy_name": legacy_name,
                "reason": f"unsupported bucket {bucket}",
                "record": record,
            })
            continue

        if not matched:
            skipped_counts[f"excluded_for_now:{bucket}"] += 1
            excluded_for_now.append({
                "target_bucket": bucket,
                "legacy_name": legacy_name,
                "proposed_new_app_name": "",
                "confidence": "no_mapping_row",
                "reason": "excluded from current import scope; no employee-name mapping row",
                "legacy_source_date": record.get("legacy_source_date"),
                "legacy_heading": record.get("legacy_heading"),
                "legacyExactHash": record.get("exact_hash"),
            })
            continue

        confidence = matched.get("confidence", "")
        confidence_counts[confidence] += 1
        if confidence not in CONFIRMED_CONFIDENCES or not matched.get("proposed_new_app_name"):
            excluded_row = {
                "target_bucket": bucket,
                "legacy_name": legacy_name,
                "proposed_new_app_name": matched.get("proposed_new_app_name"),
                "confidence": confidence,
                "reason": matched.get("review_notes") or "excluded from current import scope",
                "legacy_source_date": record.get("legacy_source_date"),
                "legacy_heading": record.get("legacy_heading"),
                "legacyExactHash": record.get("exact_hash"),
            }
            if confidence in EXCLUDED_FOR_NOW_CONFIDENCES:
                skipped_counts[f"excluded_for_now:{bucket}"] += 1
                excluded_for_now.append(excluded_row)
                continue

            unmatched_names[legacy_name or "<blank>"] += 1
            blocked_counts[bucket] += 1
            blocked.append(excluded_row)
            continue

        mapped = map_record(record, legacy_name, matched)
        importable.append(mapped)
        import_counts[bucket] += 1

    batch = {
        "dryRunOnly": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceAudit": str(args.audit),
        "matchingCsv": str(args.matching),
        "rules": {
            "liveWrites": False,
            "pendingNoReportImported": False,
            "confirmedConfidencesImported": sorted(CONFIRMED_CONFIDENCES),
            "rawLegacyPreserved": True,
        },
        "summary": {
            "sourceUniqueRows": len(records),
            "importableRows": len(importable),
            "blockedRows": len(blocked),
            "excludedForNowRows": len(excluded_for_now),
            "skippedRows": len(skipped) + len(excluded_for_now),
            "importableByBucket": dict(import_counts),
            "blockedByBucket": dict(blocked_counts),
            "skippedByBucket": dict(skipped_counts),
            "mappingConfidenceObserved": dict(confidence_counts),
            "topBlockedLegacyNames": dict(unmatched_names.most_common(20)),
            "topExcludedForNowLegacyNames": dict(Counter(row["legacy_name"] for row in excluded_for_now).most_common(20)),
        },
        "importableRecords": importable,
        "blockedRecords": blocked,
        "excludedForNowRecords": excluded_for_now,
        "skippedRecordsSample": skipped[:50],
    }

    write_json(args.outdir / "legacy_import_dry_run.json", batch)

    # Compact CSVs for human review.
    with (args.outdir / "legacy_import_blocked_rows.csv").open("w", newline="") as handle:
        fieldnames = ["target_bucket", "legacy_name", "proposed_new_app_name", "confidence", "reason", "legacy_source_date", "legacy_heading", "legacyExactHash"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(blocked)

    with (args.outdir / "legacy_import_importable_rows.csv").open("w", newline="") as handle:
        fieldnames = ["targetTable", "ownerAgentName", "agentName", "accountName", "customerName", "date", "legacyName", "legacySourceDate", "legacyExactHash"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for item in importable:
            legacy = item.get("legacy") or {}
            writer.writerow({
                "targetTable": item.get("targetTable"),
                "ownerAgentName": item.get("ownerAgentName"),
                "agentName": item.get("agentName"),
                "accountName": item.get("accountName"),
                "customerName": item.get("customerName"),
                "date": item.get("date") or (item.get("visit") or {}).get("visitDate"),
                "legacyName": legacy.get("legacyOriginalName"),
                "legacySourceDate": legacy.get("legacySourceDate"),
                "legacyExactHash": legacy.get("legacyExactHash"),
            })

    with (args.outdir / "legacy_import_excluded_for_now_rows.csv").open("w", newline="") as handle:
        fieldnames = ["target_bucket", "legacy_name", "proposed_new_app_name", "confidence", "reason", "legacy_source_date", "legacy_heading", "legacyExactHash"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(excluded_for_now)

    md_lines = [
        "# Legacy Convogenie import dry-run result",
        "",
        f"Generated: `{batch['generatedAt']}`",
        "",
        "No live app data was changed. This dry run only reads the audited legacy export and matching table.",
        "",
        "## Summary",
        "",
        f"- Source unique rows reviewed: {len(records)}",
        f"- Importable rows: {len(importable)}",
        f"- Blocked rows needing review: {len(blocked)}",
        f"- Excluded for now by Rahul/team decision: {len(excluded_for_now)}",
        f"- Skipped pending/no-report rows: {len(skipped)}",
        "",
        "## Importable by bucket",
        "",
    ]
    for bucket in ("sales_visit", "service_visit", "attendance_login", "leave_holiday"):
        md_lines.append(f"- {bucket}: {import_counts.get(bucket, 0)}")
    md_lines.extend(["", "## Blocked by bucket", ""])
    for bucket, count in blocked_counts.most_common():
        md_lines.append(f"- {bucket}: {count}")
    md_lines.extend(["", "## Excluded for now", ""])
    excluded_counter = Counter(row["legacy_name"] for row in excluded_for_now)
    for name, count in excluded_counter.most_common(20):
        md_lines.append(f"- `{name}`: {count}")
    md_lines.extend(["", "## Top blocked names", ""])
    for name, count in unmatched_names.most_common(20):
        md_lines.append(f"- `{name}`: {count}")
    md_lines.extend([
        "",
        "## Output files",
        "",
        "- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_dry_run.json`",
        "- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_importable_rows.csv`",
        "- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_blocked_rows.csv`",
        "- `docs/legacy-convogenie-audit/dry-run-import/legacy_import_excluded_for_now_rows.csv`",
        "",
        "## Current safety decision",
        "",
        "Rahul/team decided to skip currently blocked names for now and treat customer/company-looking names as customer/company data, not employees. Do not run a live import; the next step is backup/staging rehearsal of the 572 importable rows only.",
    ])
    (args.outdir / "legacy_import_dry_run_summary.md").write_text("\n".join(md_lines) + "\n")

    print(json.dumps(batch["summary"], indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
