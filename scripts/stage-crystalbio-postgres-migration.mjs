#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const has = (flag) => args.includes(flag);

const sourcePath = valueAfter('--source') ?? process.env.CRYSTALBIO_DB_PATH;
const summaryPath = valueAfter('--summary-json');
const sqlPath = valueAfter('--sql');
const allowSensitiveSql = has('--allow-sensitive-sql');

if (!sourcePath) {
  console.error('Usage: node scripts/stage-crystalbio-postgres-migration.mjs --source <copied-json-backup> [--summary-json out.json] [--sql out.sql --allow-sensitive-sql]');
  process.exit(2);
}

if (sqlPath && !allowSensitiveSql) {
  console.error('Refusing to write SQL without --allow-sensitive-sql. SQL migration files contain customer/business values and must only be written for staging/secure use.');
  process.exit(2);
}

const state = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const list = (key) => Array.isArray(state[key]) ? state[key] : [];
const visits = (key) => list(key).flatMap((record) => Array.isArray(record.visits) ? record.visits : []);

const scrubJsonForSql = (value) => {
  if (Array.isArray(value)) return value.map(scrubJsonForSql);
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.startsWith('data:image')) return '[MIGRATE_TO_OBJECT_STORAGE]';
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === 'dataUrl' || (typeof item === 'string' && item.startsWith('data:image')) ? '[MIGRATE_TO_OBJECT_STORAGE]' : scrubJsonForSql(item),
    ]),
  );
};

const scrubPhotoRaw = (photo) => scrubJsonForSql(photo ?? {});

const countPhotos = () => {
  let salesVisitAttachments = 0;
  let serviceVisitAttachments = 0;
  let withDataUrl = 0;
  for (const visit of visits('sales')) {
    for (const photo of Array.isArray(visit.photos) ? visit.photos : []) {
      salesVisitAttachments += 1;
      if (photo?.dataUrl) withDataUrl += 1;
    }
  }
  for (const visit of visits('service')) {
    for (const photo of Array.isArray(visit.photos) ? visit.photos : []) {
      serviceVisitAttachments += 1;
      if (photo?.dataUrl) withDataUrl += 1;
    }
  }
  return { salesVisitAttachments, serviceVisitAttachments, totalVisitAttachments: salesVisitAttachments + serviceVisitAttachments, withDataUrl };
};

const sourceCounts = {
  agents: list('agents').length,
  sessions: list('sessions').length,
  attendance: list('attendance').length,
  sales: list('sales').length,
  salesVisits: visits('sales').length,
  service: list('service').length,
  serviceVisits: visits('service').length,
  leaveRequests: list('leaveRequests').length,
  nextId: state.nextId ?? null,
  photos: countPhotos(),
};

const q = (value) => value === undefined || value === null || value === '' ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const qBool = (value) => value === undefined || value === null ? 'null' : (value ? 'true' : 'false');
const qJson = (value) => `${q(JSON.stringify(scrubJsonForSql(value ?? {})))}::jsonb`;
const qArray = (value) => Array.isArray(value) ? `array[${value.map(q).join(', ')}]::text[]` : `array[]::text[]`;
const lat = (gps) => typeof gps?.latitude === 'number' ? String(gps.latitude) : 'null';
const lng = (gps) => typeof gps?.longitude === 'number' ? String(gps.longitude) : 'null';
const acc = (gps) => typeof gps?.accuracyMeters === 'number' ? String(gps.accuracyMeters) : 'null';

const lines = [];
const insert = (sql) => lines.push(sql);

insert('begin;');
insert("insert into migration_metadata (key, value, raw_json) values ('source_next_id', " + q(String(state.nextId ?? '')) + ", '{}'::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now();");
insert("insert into migration_metadata (key, value, raw_json) values ('source_json_file', '[REDACTED_SOURCE_PATH]', '{}'::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now();");

for (const a of list('agents')) {
  insert(`insert into agents (id, name, role, active, employee_id, email, mobile, login_code, passcode, password, invite_token, invite_status, raw_json) values (${q(a.id)}, ${q(a.name)}, ${q(a.role)}, ${qBool(a.active ?? true)}, ${q(a.employeeId)}, ${q(a.email)}, ${q(a.mobile)}, ${q(a.loginCode)}, ${q(a.passcode)}, ${q(a.password)}, ${q(a.inviteToken)}, ${q(a.inviteStatus)}, ${qJson(a)}) on conflict (id) do nothing;`);
}

for (const s of list('sessions')) {
  insert(`insert into login_sessions (token, agent_id, agent_name, role, employee_id, phone, email, raw_json) values (${q(s.token)}, ${q(s.agentId)}, ${q(s.agentName)}, ${q(s.role)}, ${q(s.employeeId)}, ${q(s.phone)}, ${q(s.email)}, ${qJson(s)}) on conflict (token) do nothing;`);
}

for (const r of list('attendance')) {
  insert(`insert into attendance_records (id, agent_id, agent_name, attendance_date, check_in_at, check_in_latitude, check_in_longitude, check_in_accuracy_meters, check_out_at, check_out_latitude, check_out_longitude, check_out_accuracy_meters, status, note, work_types, auto_checked_out, auto_check_out_reason, system_restored, raw_json) values (${q(r.id)}, ${q(r.agentId)}, ${q(r.agentName)}, ${q(r.date)}, ${q(r.checkInAt)}, ${lat(r.checkInGps)}, ${lng(r.checkInGps)}, ${acc(r.checkInGps)}, ${q(r.checkOutAt)}, ${lat(r.checkOutGps)}, ${lng(r.checkOutGps)}, ${acc(r.checkOutGps)}, ${q(r.status)}, ${q(r.note)}, ${qArray(r.workTypes)}, ${qBool(r.autoCheckedOut)}, ${q(r.autoCheckOutReason)}, ${qBool(r.systemRestored)}, ${qJson(r)}) on conflict (id) do nothing;`);
}

for (const r of list('sales')) {
  const { visits: _visits, ...rawWithoutVisits } = r;
  insert(`insert into sales_opportunities (id, owner_agent_id, account_name, contact_person, designation, phone, email, department_address, lead_source, product_type, brand_name, equipment_model, requirement, quote_submitted, budgetary_proposal, quote_status, fund_status, probability, closing_date, support_required, remarks_timeline, office_notes, step2_saved, step3_saved, status, raw_json) values (${q(r.id)}, ${q(r.ownerAgentId)}, ${q(r.accountName)}, ${q(r.contactPerson)}, ${q(r.designation)}, ${q(r.phone)}, ${q(r.email)}, ${q(r.departmentAddress)}, ${q(r.leadSource)}, ${q(r.productType)}, ${q(r.brandName)}, ${q(r.equipmentModel)}, ${q(r.requirement)}, ${q(r.quoteSubmitted)}, ${q(r.budgetaryProposal)}, ${q(r.quoteStatus)}, ${q(r.fundStatus)}, ${q(r.probability)}, ${q(r.closingDate)}, ${q(r.supportRequired)}, ${q(r.remarksTimeline)}, ${q(r.officeNotes)}, ${qBool(r.step2Saved)}, ${qBool(r.step3Saved)}, ${q(r.status ?? 'open')}, ${qJson(rawWithoutVisits)}) on conflict (id) do nothing;`);
  for (const v of Array.isArray(r.visits) ? r.visits : []) {
    const { photos: _photos, ...rawVisit } = v;
    insert(`insert into sales_visit_updates (id, opportunity_id, agent_id, agent_name, visit_number, visit_date, visit_time, gps_latitude, gps_longitude, gps_accuracy_meters, note, next_action, follow_up_date, expected_closing_date, raw_json) values (${q(v.id)}, ${q(v.opportunityId ?? r.id)}, ${q(v.agentId)}, ${q(v.agentName)}, ${Number(v.visitNumber ?? 0)}, ${q(v.visitDate)}, ${q(v.visitTime)}, ${lat(v.gps)}, ${lng(v.gps)}, ${acc(v.gps)}, ${q(v.note)}, ${q(v.nextAction)}, ${q(v.followUpDate)}, ${q(v.expectedClosingDate)}, ${qJson(rawVisit)}) on conflict (id) do nothing;`);
    (Array.isArray(v.photos) ? v.photos : []).forEach((photo, index) => {
      insert(`insert into file_attachments (id, related_type, related_id, purpose, storage_provider, storage_bucket, storage_key, original_file_name, content_type, size_bytes, uploaded_by_agent_id, migrated_from_json, raw_json) values (${q(`file-sales-${v.id}-${index + 1}`)}, 'sales_visit', ${q(v.id)}, 'sales_visit_photo', 'local_migration_placeholder', 'staging-placeholder', ${q(`pending-object-storage/sales_visit/${v.id}/${index + 1}`)}, ${q(photo?.fileName)}, ${q(photo?.contentType)}, ${photo?.sizeBytes ?? 'null'}, ${q(v.agentId)}, true, ${qJson(scrubPhotoRaw(photo))}) on conflict (id) do nothing;`);
    });
  }
}

for (const r of list('service')) {
  const { visits: _visits, ...rawWithoutVisits } = r;
  insert(`insert into service_records (id, owner_agent_id, customer_name, phone, department_address, brand_name, equipment_name, model_name, serial_number, contact_person, email, issue_category, issue_description, warranty_amc, parts_required, parts_used, machine_status, support_required_note, final_remarks, photo_note, step2_saved, step3_saved, status, raw_json) values (${q(r.id)}, ${q(r.ownerAgentId)}, ${q(r.customerName)}, ${q(r.phone)}, ${q(r.departmentAddress)}, ${q(r.brandName)}, ${q(r.equipmentName)}, ${q(r.modelName)}, ${q(r.serialNumber)}, ${q(r.contactPerson)}, ${q(r.email)}, ${q(r.issueCategory)}, ${q(r.issueDescription)}, ${q(r.warrantyAmc)}, ${q(r.partsRequired)}, ${q(r.partsUsed)}, ${q(r.machineStatus)}, ${q(r.supportRequiredNote)}, ${q(r.finalRemarks)}, ${q(r.photoNote)}, ${qBool(r.step2Saved)}, ${qBool(r.step3Saved)}, ${q(r.status ?? 'open')}, ${qJson(rawWithoutVisits)}) on conflict (id) do nothing;`);
  for (const v of Array.isArray(r.visits) ? r.visits : []) {
    const { photos: _photos, ...rawVisit } = v;
    insert(`insert into service_visit_updates (id, service_record_id, agent_id, agent_name, visit_number, visit_date, visit_time, gps_latitude, gps_longitude, gps_accuracy_meters, service_type, work_done, support_required, next_action, next_visit_date, office_notes, raw_json) values (${q(v.id)}, ${q(v.serviceRecordId ?? r.id)}, ${q(v.agentId)}, ${q(v.agentName)}, ${Number(v.visitNumber ?? 0)}, ${q(v.visitDate)}, ${q(v.visitTime)}, ${lat(v.gps)}, ${lng(v.gps)}, ${acc(v.gps)}, ${q(v.serviceType)}, ${q(v.workDone)}, ${qBool(v.supportRequired)}, ${q(v.nextAction)}, ${q(v.nextVisitDate)}, ${q(v.officeNotes)}, ${qJson(rawVisit)}) on conflict (id) do nothing;`);
    (Array.isArray(v.photos) ? v.photos : []).forEach((photo, index) => {
      insert(`insert into file_attachments (id, related_type, related_id, purpose, storage_provider, storage_bucket, storage_key, original_file_name, content_type, size_bytes, uploaded_by_agent_id, migrated_from_json, raw_json) values (${q(`file-service-${v.id}-${index + 1}`)}, 'service_visit', ${q(v.id)}, 'service_visit_photo', 'local_migration_placeholder', 'staging-placeholder', ${q(`pending-object-storage/service_visit/${v.id}/${index + 1}`)}, ${q(photo?.fileName)}, ${q(photo?.contentType)}, ${photo?.sizeBytes ?? 'null'}, ${q(v.agentId)}, true, ${qJson(scrubPhotoRaw(photo))}) on conflict (id) do nothing;`);
    });
  }
}

for (const r of list('leaveRequests')) {
  insert(`insert into leave_requests (id, agent_id, agent_name, from_date, to_date, reason, note, status, reviewed_by_agent_id, raw_json) values (${q(r.id)}, ${q(r.agentId)}, ${q(r.agentName)}, ${q(r.fromDate)}, ${q(r.toDate)}, ${q(r.reason)}, ${q(r.note)}, ${q(r.status)}, ${q(r.reviewedByAgentId)}, ${qJson(r)}) on conflict (id) do nothing;`);
}
insert('commit;');

const summary = {
  checkedAt: new Date().toISOString(),
  sourcePath: '[REDACTED_SOURCE_PATH]',
  mode: sqlPath ? 'sql_written_for_staging' : 'dry_run_summary_only',
  sourceCounts,
  generatedSqlStatements: lines.length,
  warnings: [
    'Use only with a copied JSON backup, never the actively written live file.',
    'Generated SQL contains sensitive business values when --sql is used; keep it outside Git and secure it.',
    'Photo dataUrl bytes are not written into SQL; migrate image bytes to private object storage before final cutover.',
  ],
};

if (summaryPath) {
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
}
const sqlText = lines.join('\n').replace(/data:image[^"'\\s,}]*/g, '[MIGRATE_TO_OBJECT_STORAGE]');
if (sqlPath) {
  fs.mkdirSync(path.dirname(sqlPath), { recursive: true });
  fs.writeFileSync(sqlPath, `${sqlText}\n`);
}
console.log(JSON.stringify(summary, null, 2));
