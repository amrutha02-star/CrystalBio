#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const quietIfNoChange = args.has('--quiet-if-no-change');
const dbPath = resolve(process.env.CRYSTALBIO_DB_PATH ?? '/var/lib/crystalbio/crystalbio-db.json');
const clientErrorLogPath = resolve(process.env.CRYSTALBIO_CLIENT_ERROR_LOG_PATH ?? '/var/lib/crystalbio/crystalbio-client-errors.jsonl');
const auditDir = resolve(process.env.CRYSTALBIO_AUDIT_DIR ?? 'docs/live-data-audits');
const today = process.env.CRYSTALBIO_TODAY ?? new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

if (!existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const state = readJson(dbPath);
const beforeText = JSON.stringify(state, null, 2);
const agents = state.agents ?? [];
const agentById = new Map(agents.map((agent) => [agent.id, agent]));
const bloomAgentIds = new Set(agents
  .filter((agent) => `${agent.name ?? ''} ${agent.email ?? ''}`.toLowerCase().includes('bloom'))
  .map((agent) => agent.id));

const clone = (value) => JSON.parse(JSON.stringify(value));
const nextAttendanceId = (records) => {
  const max = records.reduce((highest, record) => {
    const match = String(record.id ?? '').match(/^attendance_(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  let next = max + 1;
  return () => `attendance_${next++}`;
};
const isBloomRecord = (record = {}) => bloomAgentIds.has(record.agentId) || bloomAgentIds.has(record.ownerAgentId);
const withoutBloomVisits = (record, key) => ({
  ...record,
  [key]: (record[key] ?? []).filter((visit) => !bloomAgentIds.has(visit.agentId)),
});
const stableNonBloomBusinessData = (snapshot) => {
  const scrubSales = (snapshot.sales ?? [])
    .filter((record) => !isBloomRecord(record))
    .map((record) => withoutBloomVisits(record, 'visits'))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const scrubService = (snapshot.service ?? [])
    .filter((record) => !isBloomRecord(record))
    .map((record) => withoutBloomVisits(record, 'visits'))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const scrubLeave = (snapshot.leaveRequests ?? [])
    .filter((record) => !bloomAgentIds.has(record.agentId))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { agents: snapshot.agents ?? [], sales: scrubSales, service: scrubService, leaveRequests: scrubLeave };
};
const stableNonBloomAttendance = (snapshot) => (snapshot.attendance ?? [])
  .filter((record) => !bloomAgentIds.has(record.agentId))
  .map((record) => ({ ...record }))
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const beforeBusinessHash = hash(stableNonBloomBusinessData(state));
const beforeAttendanceHash = hash(stableNonBloomAttendance(state));

const cleaned = clone(state);
const beforeCounts = {
  agents: state.agents?.length ?? 0,
  sessions: state.sessions?.length ?? 0,
  attendance: state.attendance?.length ?? 0,
  sales: state.sales?.length ?? 0,
  service: state.service?.length ?? 0,
  leaveRequests: state.leaveRequests?.length ?? 0,
};

cleaned.sessions = (cleaned.sessions ?? []).filter((session) => !bloomAgentIds.has(session.agentId));
cleaned.attendance = (cleaned.attendance ?? []).filter((record) => !bloomAgentIds.has(record.agentId));
cleaned.sales = (cleaned.sales ?? [])
  .filter((record) => !isBloomRecord(record))
  .map((record) => withoutBloomVisits(record, 'visits'));
cleaned.service = (cleaned.service ?? [])
  .filter((record) => !isBloomRecord(record))
  .map((record) => withoutBloomVisits(record, 'visits'));
cleaned.leaveRequests = (cleaned.leaveRequests ?? []).filter((record) => !bloomAgentIds.has(record.agentId));

const removedBloom = {
  sessions: (state.sessions?.length ?? 0) - cleaned.sessions.length,
  attendance: (state.attendance?.length ?? 0) - cleaned.attendance.length,
  sales: (state.sales?.length ?? 0) - cleaned.sales.length,
  service: (state.service?.length ?? 0) - cleaned.service.length,
  leaveRequests: (state.leaveRequests?.length ?? 0) - cleaned.leaveRequests.length,
  salesVisits: (state.sales ?? []).reduce((sum, record) => sum + (record.visits?.length ?? 0), 0) - cleaned.sales.reduce((sum, record) => sum + (record.visits?.length ?? 0), 0),
  serviceVisits: (state.service ?? []).reduce((sum, record) => sum + (record.visits?.length ?? 0), 0) - cleaned.service.reduce((sum, record) => sum + (record.visits?.length ?? 0), 0),
};

const restored = [];
const latestFailedByAgentDate = new Map();
if (existsSync(clientErrorLogPath)) {
  for (const line of readFileSync(clientErrorLogPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const blob = JSON.stringify(event).toLowerCase();
      if (!blob.includes('/attendance/check-in') || !blob.includes('already checked in')) continue;
      if (!event.agentId || bloomAgentIds.has(event.agentId)) continue;
      const createdAt = event.createdAt ?? event.timestamp;
      if (!createdAt) continue;
      const date = String(createdAt).slice(0, 10);
      const key = `${event.agentId}|${date}`;
      const existing = latestFailedByAgentDate.get(key);
      if (!existing || String(createdAt) < String(existing.createdAt ?? existing.timestamp)) latestFailedByAgentDate.set(key, event);
    } catch {
      // ignore malformed log line
    }
  }
}

const makeAttendanceId = nextAttendanceId(cleaned.attendance ?? []);
for (const event of latestFailedByAgentDate.values()) {
  const agent = agentById.get(event.agentId);
  if (!agent) continue;
  const checkInAt = event.createdAt ?? event.timestamp;
  const date = String(checkInAt).slice(0, 10);
  const existsForDate = (cleaned.attendance ?? []).some((record) => record.agentId === event.agentId && record.date === date);
  if (existsForDate) continue;
  const previousOpen = (cleaned.attendance ?? []).find((record) => record.agentId === event.agentId && record.status === 'checked_in' && !record.checkOutAt && record.date < date);
  if (!previousOpen) continue;
  const record = {
    id: makeAttendanceId(),
    agentId: agent.id,
    agentName: agent.name,
    date,
    checkInAt,
    status: date < today ? 'checked_out' : 'checked_in',
    note: 'System restored from failed check-in blocked by previous attendance rule. Location was not stored.',
    systemRestored: true,
  };
  if (date < today) {
    record.checkOutAt = `${date}T18:29:00.000Z`;
    record.autoCheckedOut = true;
    record.autoCheckOutReason = 'missed_checkout_night_auto_close';
    record.note = `${record.note} Auto checked out by system at night.`;
  }
  cleaned.attendance.push(record);
  restored.push({ id: record.id, agentId: agent.id, agentName: agent.name, date, checkInAt, status: record.status, autoCheckedOut: Boolean(record.autoCheckedOut) });
}

const autoClosed = [];
for (const record of cleaned.attendance ?? []) {
  if (bloomAgentIds.has(record.agentId)) continue;
  if (record.status === 'checked_in' && !record.checkOutAt && record.date < today) {
    record.status = 'checked_out';
    record.checkOutAt = `${record.date}T18:29:00.000Z`;
    record.autoCheckedOut = true;
    record.autoCheckOutReason = 'missed_checkout_night_auto_close';
    record.note = record.note ? `${record.note} Auto checked out by system at night.` : 'Auto checked out by system at night after missed checkout.';
    autoClosed.push({ id: record.id, agentId: record.agentId, agentName: record.agentName, date: record.date, checkInAt: record.checkInAt, checkOutAt: record.checkOutAt });
  }
}

const afterCounts = {
  agents: cleaned.agents?.length ?? 0,
  sessions: cleaned.sessions?.length ?? 0,
  attendance: cleaned.attendance?.length ?? 0,
  sales: cleaned.sales?.length ?? 0,
  service: cleaned.service?.length ?? 0,
  leaveRequests: cleaned.leaveRequests?.length ?? 0,
};
const afterBusinessHash = hash(stableNonBloomBusinessData(cleaned));
const afterAttendanceHash = hash(stableNonBloomAttendance(cleaned));
const openAttendanceAfter = (cleaned.attendance ?? [])
  .filter((record) => record.status === 'checked_in' && !record.checkOutAt)
  .map((record) => ({ id: record.id, agentId: record.agentId, agentName: record.agentName, date: record.date }));
const bloomLeftAfter = {
  sessions: (cleaned.sessions ?? []).filter((record) => bloomAgentIds.has(record.agentId)).length,
  attendance: (cleaned.attendance ?? []).filter((record) => bloomAgentIds.has(record.agentId)).length,
  sales: (cleaned.sales ?? []).filter((record) => isBloomRecord(record) || (record.visits ?? []).some((visit) => bloomAgentIds.has(visit.agentId))).length,
  service: (cleaned.service ?? []).filter((record) => isBloomRecord(record) || (record.visits ?? []).some((visit) => bloomAgentIds.has(visit.agentId))).length,
  leaveRequests: (cleaned.leaveRequests ?? []).filter((record) => bloomAgentIds.has(record.agentId)).length,
};

mkdirSync(auditDir, { recursive: true });
const backupPath = `${dbPath}.pre-attendance-repair-${stamp}.bak`;
const audit = {
  mode: write ? 'written' : 'dry-run',
  checkedAt: new Date().toISOString(),
  dbPath,
  clientErrorLogPath,
  today,
  bloomAgentIds: [...bloomAgentIds],
  beforeCounts,
  afterCounts,
  removedBloom,
  restoredFailedCheckIns: restored,
  autoClosedMissedCheckouts: autoClosed,
  openAttendanceAfter,
  bloomLeftAfter,
  clientDataAudit: {
    scope: 'Non-Bloom client business data is audited separately from the approved attendance repair. Sales, Service, leave, and user profiles must stay hash-identical after Bloom cleanup filtering. Attendance may differ only by restored failed check-ins and auto-checkout fields on stale open sessions.',
    businessDataBeforeHash: beforeBusinessHash,
    businessDataAfterHash: afterBusinessHash,
    businessDataIntact: beforeBusinessHash === afterBusinessHash,
    attendanceBeforeHash: beforeAttendanceHash,
    attendanceAfterHash: afterAttendanceHash,
    attendanceChangeApproved: true,
    attendanceChangeSummary: {
      restoredFailedCheckIns: restored.length,
      autoClosedMissedCheckouts: autoClosed.length,
    },
  },
  backupPath: write ? backupPath : null,
};
const auditPath = join(auditDir, `attendance-auto-checkout-bloom-cleanup-${stamp}${write ? '' : '-dry-run'}.json`);
writeFileSync(auditPath, JSON.stringify(audit, null, 2));

if (write) {
  writeFileSync(backupPath, beforeText);
  writeFileSync(dbPath, JSON.stringify(cleaned, null, 2));
}

const output = {
  mode: audit.mode,
  auditPath,
  backupPath: audit.backupPath,
  beforeCounts,
  afterCounts,
  removedBloom,
  restoredFailedCheckIns: restored.length,
  autoClosedMissedCheckouts: autoClosed.length,
  openAttendanceAfter,
  bloomLeftAfter,
};
const changed = restored.length > 0
  || autoClosed.length > 0
  || Object.values(removedBloom).some((value) => value > 0);
if (!(quietIfNoChange && !changed)) {
  console.log(JSON.stringify(output, null, 2));
}
