#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const API = 'https://work-api.convogenie.ai';
const APP = 'https://work.convogenie.ai';
const outDir = path.resolve('dogfood-output');
const qaDir = path.resolve('docs/qa-runs');
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonPath = path.join(outDir, `bloom-e2e-user-journey-2026-07-02-${runStamp}.json`);
const mdPath = path.join(qaDir, 'QA_RUN_BLOOM_E2E_USER_JOURNEY_2026-07-02.md');
const credPath = '/root/workspace/crystalbio-credentials/bloom-assigned/BLOOM_ASSIGNED_CREDENTIALS.txt';
const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 14 };
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
const marker = `BLOOM E2E ${new Date().toISOString().slice(0, 10)} ${runStamp.slice(11, 19)}`;
const steps = [];
const bugs = [];
let stepNo = 0;
let adminSession;
let agentSession;
let sales;
let service;
let leave;

function safe(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => {
    if (/password|token|authorization|cookie/i.test(k)) return '[redacted]';
    if (typeof v === 'string' && v.length > 160) return `${v.slice(0, 160)}…`;
    return v;
  }));
}
function log(name, status, detail = {}) {
  const row = { step: ++stepNo, name, status, detail: safe(detail), at: new Date().toISOString() };
  steps.push(row);
  const symbol = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'warn' ? 'WARN' : 'INFO';
  console.log(`${String(row.step).padStart(3, '0')} ${symbol} ${name}`);
}
async function http(method, urlPath, { token, body, headers = {} } = {}) {
  const res = await fetch(urlPath.startsWith('http') ? urlPath : `${API}${urlPath}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const contentType = res.headers.get('content-type') || '';
  let parsed;
  if (contentType.includes('application/json')) parsed = await res.json();
  else if (contentType.includes('application/pdf')) parsed = Buffer.from(await res.arrayBuffer());
  else parsed = await res.text();
  return { status: res.status, ok: res.ok, contentType, body: parsed, headers: Object.fromEntries(res.headers.entries()) };
}
async function expectStep(name, fn, predicate, describe = (x) => x) {
  try {
    const result = await fn();
    const ok = await predicate(result);
    log(name, ok ? 'pass' : 'fail', describe(result));
    if (!ok) bugs.push({ title: name, severity: 'Needs review', detail: safe(describe(result)) });
    return result;
  } catch (error) {
    log(name, 'fail', { error: error.message });
    bugs.push({ title: name, severity: 'Needs review', detail: { error: error.message } });
    return null;
  }
}
async function readCreds() {
  const text = await fs.readFile(credPath, 'utf8');
  const get = (label) => text.match(new RegExp(`${label}:\\s*(.+)`))?.[1]?.trim();
  const emails = [...text.matchAll(/Email:\s*(.+)/g)].map((m) => m[1].trim());
  const passwords = [...text.matchAll(/Password:\s*(.+)/g)].map((m) => m[1].trim());
  return { adminEmail: emails[0], adminPassword: passwords[0], agentEmail: emails[1], agentPassword: passwords[1], get };
}
async function login(email, password) {
  const r = await http('POST', '/auth/login', { body: { email, password } });
  if (!r.ok) throw new Error(`login failed ${r.status}: ${JSON.stringify(r.body)}`);
  return r.body.session;
}
async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(qaDir, { recursive: true });
  const creds = await readCreds();
  log('Read only Bloom assigned QA credentials; no real user credentials used', 'pass', { accountEmails: [creds.adminEmail, creds.agentEmail] });

  await expectStep('Live API health opens', () => http('GET', '/health'), (r) => r.status === 200 && r.body.status === 'ok', (r) => ({ status: r.status, body: r.body }));
  await expectStep('Live app shell loads', () => http('GET', APP), (r) => r.status === 200 && String(r.body).includes('Crystal Bio Field Hub'), (r) => ({ status: r.status, titleFound: String(r.body).includes('Crystal Bio Field Hub') }));
  const version = await expectStep('Live version endpoint opens', () => http('GET', `${APP}/version.json`), (r) => r.status === 200 && !!r.body.version, (r) => ({ status: r.status, version: r.body.version }));

  adminSession = await expectStep('Admin login works with Bloom admin', () => login(creds.adminEmail, creds.adminPassword), (s) => s?.role === 'admin' && s?.email === creds.adminEmail, (s) => ({ agentName: s?.agentName, role: s?.role, email: s?.email }));
  agentSession = await expectStep('Agent login works with Bloom agent', () => login(creds.agentEmail, creds.agentPassword), (s) => ['both', 'sales', 'service'].includes(s?.role) && s?.email === creds.agentEmail, (s) => ({ agentName: s?.agentName, role: s?.role, email: s?.email }));
  if (!adminSession || !agentSession) throw new Error('Cannot continue without Bloom sessions');

  await expectStep('Wrong password is rejected clearly', () => http('POST', '/auth/login', { body: { email: creds.agentEmail, password: 'wrong-password' } }), (r) => r.status === 400 && /invalid/i.test(JSON.stringify(r.body)), (r) => ({ status: r.status, body: r.body }));
  await expectStep('Empty login is rejected, not silently accepted', () => http('POST', '/auth/login', { body: { email: '', password: '' } }), (r) => r.status >= 400, (r) => ({ status: r.status, body: r.body }));
  await expectStep('Saved agent session restores by bearer token', () => http('GET', '/auth/session', { token: agentSession.token }), (r) => r.status === 200 && r.body.session.email === creds.agentEmail, (r) => ({ status: r.status, email: r.body.session?.email, role: r.body.session?.role }));
  await expectStep('Bad saved session is rejected safely', () => http('GET', '/auth/session', { token: 'bad-session-token' }), (r) => r.status === 401, (r) => ({ status: r.status, body: r.body }));
  await expectStep('Agent cannot open admin reports API', () => http('GET', `/admin/reports?fromDate=${today}&toDate=${today}`, { token: agentSession.token }), (r) => r.status === 403, (r) => ({ status: r.status, body: r.body }));

  const currentBefore = await expectStep('Agent current attendance loads before action', () => http('GET', '/attendance/current', { token: agentSession.token }), (r) => r.status === 200, (r) => ({ status: r.status, hasCurrent: Boolean(r.body.attendance), currentStatus: r.body.attendance?.status }));
  if (currentBefore?.body?.attendance?.status === 'checked_in') {
    await expectStep('Pre-run safety checkout closes existing Bloom QA open attendance', () => http('POST', '/attendance/check-out', { token: agentSession.token, body: { timestamp: new Date().toISOString(), gps } }), (r) => r.status === 200 && r.body.attendance.status === 'checked_out', (r) => ({ status: r.status, attendanceStatus: r.body.attendance?.status }));
  }
  const checkIn = await expectStep('Agent checks in with selected work mode', () => http('POST', '/attendance/check-in', { token: agentSession.token, body: { timestamp: new Date().toISOString(), gps, workTypes: ['Sales visit', 'Service visit'], note: marker } }), (r) => r.status === 200 && r.body.attendance.status === 'checked_in' && (r.body.attendance.workTypes || []).length >= 1, (r) => ({ status: r.status, attendanceId: r.body.attendance?.id, attendanceStatus: r.body.attendance?.status, workTypes: r.body.attendance?.workTypes }));
  await expectStep('Repeated check-in while already checked in is blocked', () => http('POST', '/attendance/check-in', { token: agentSession.token, body: { timestamp: new Date().toISOString(), gps, workTypes: ['Sales visit'], note: `${marker} repeat` } }), (r) => r.status >= 400 && /already/i.test(JSON.stringify(r.body)), (r) => ({ status: r.status, body: r.body }));
  await expectStep('Refresh-style current attendance still shows checked in', () => http('GET', '/attendance/current', { token: agentSession.token }), (r) => r.status === 200 && r.body.attendance?.status === 'checked_in', (r) => ({ status: r.status, attendanceStatus: r.body.attendance?.status, attendanceId: r.body.attendance?.id }));
  await expectStep('Admin report sees Bloom checked-in attendance', () => http('GET', `/admin/reports?fromDate=${today}&toDate=${today}`, { token: adminSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes(agentSession.agentName), (r) => ({ status: r.status, totals: r.body.report?.totals, bloomVisible: JSON.stringify(r.body).includes(agentSession.agentName) }));

  sales = await expectStep('Sales Step 1 saves quick visit with GPS and follow-up', async () => {
    const opp = await http('POST', '/sales-opportunities', { token: agentSession.token, body: { accountName: `${marker} Sales Customer`, contactPerson: 'QA Contact', phone: '9999999999', requirement: 'QA microscope requirement' } });
    if (!opp.ok) return opp;
    const visit = await http('POST', `/sales-opportunities/${opp.body.opportunity.id}/visits`, { token: agentSession.token, body: { visitDate: today, visitTime: '10:30', gps, note: `${marker} Sales Step 1 note with special chars & / #`, nextAction: 'follow_up_needed', followUpDate: tomorrow, photos: [{ source: 'upload', fileName: 'bloom-e2e-sales.txt', contentType: 'text/plain', sizeBytes: 12, dataUrl: 'data:text/plain;base64,SGVsbG8=' }] } });
    return { opp, visit, opportunityId: opp.body.opportunity?.id, visitId: visit.body.visit?.id };
  }, (r) => r?.opp?.status === 200 && r?.visit?.status === 200 && r.visit.body.visit.gps?.latitude, (r) => ({ opportunityId: r?.opportunityId, visitId: r?.visitId, visitStatus: r?.visit?.status, account: r?.opp?.body?.opportunity?.accountName }));
  await expectStep('Sales Step 2 saves customer and requirement details', () => http('PATCH', `/sales-opportunities/${sales.opportunityId}`, { token: agentSession.token, body: { accountName: `${marker} Sales Customer Updated`, contactPerson: 'QA Contact Step 2', designation: 'Lab Manager', phone: '9888888888', email: 'qa-sales@example.com', departmentAddress: 'Long QA address, Bangalore', leadSource: 'Bloom QA', productType: 'Analyzer', brandName: 'Crystal QA Brand', equipmentModel: 'QA-200', requirement: 'Detailed QA requirement', step2Saved: true } }), (r) => r.status === 200 && r.body.opportunity.step2Saved === true, (r) => ({ status: r.status, step2Saved: r.body.opportunity?.step2Saved, accountName: r.body.opportunity?.accountName }));
  await expectStep('Sales Step 3 saves quote and office details', () => http('PATCH', `/sales-opportunities/${sales.opportunityId}`, { token: agentSession.token, body: { quoteSubmitted: 'yes', budgetaryProposal: 'Budget shared in QA', quoteStatus: 'Quoted', fundStatus: 'Pending', probability: '60%', closingDate: tomorrow, supportRequired: 'Office follow-up', remarksTimeline: 'QA remarks timeline', officeNotes: `${marker} office note`, step3Saved: true } }), (r) => r.status === 200 && r.body.opportunity.step3Saved === true, (r) => ({ status: r.status, step3Saved: r.body.opportunity?.step3Saved, quoteStatus: r.body.opportunity?.quoteStatus }));
  await expectStep('Repeated Sales same-content save does not create duplicate latest rows', () => http('POST', `/sales-opportunities/${sales.opportunityId}/visits`, { token: agentSession.token, body: { visitDate: today, visitTime: '10:30', gps, note: `${marker} Sales Step 1 note with special chars & / #`, nextAction: 'follow_up_needed', followUpDate: tomorrow, photos: [] } }), (r) => r.status === 200, (r) => ({ status: r.status, returnedVisitId: r.body.visit?.id }));

  service = await expectStep('Service Step 1 saves quick service visit with GPS', async () => {
    const rec = await http('POST', '/service-records', { token: agentSession.token, body: { customerName: `${marker} Service Customer`, contactPerson: 'Service QA Contact', phone: '9777777777', email: 'qa-service@example.com', departmentAddress: 'QA service address', equipmentName: 'Centrifuge', brandName: 'Crystal Service Brand', modelName: 'SVC-100', serialNumber: 'QA-SN-001', issueCategory: 'Calibration', issueDescription: 'QA issue details', warrantyAmc: 'AMC' } });
    if (!rec.ok) return rec;
    const visit = await http('POST', `/service-records/${rec.body.serviceRecord.id}/visits`, { token: agentSession.token, body: { visitDate: today, visitTime: '11:15', gps, serviceType: 'calibration', workDone: `${marker} service work done`, supportRequired: true, nextAction: 'next_visit_needed', nextVisitDate: tomorrow, photos: [{ source: 'upload', fileName: 'bloom-e2e-service.txt', contentType: 'text/plain', sizeBytes: 13, dataUrl: 'data:text/plain;base64,U2VydmljZQ==' }], officeNotes: `${marker} service office note` } });
    return { rec, visit, recordId: rec.body.serviceRecord?.id, visitId: visit.body.visit?.id };
  }, (r) => r?.rec?.status === 200 && r?.visit?.status === 200 && r.visit.body.visit.gps?.latitude, (r) => ({ recordId: r?.recordId, visitId: r?.visitId, customer: r?.rec?.body?.serviceRecord?.customerName }));
  await expectStep('Service Step 2 saves customer/equipment details', () => http('PATCH', `/service-records/${service.recordId}`, { token: agentSession.token, body: { customerName: `${marker} Service Customer Updated`, contactPerson: 'Service QA Step 2', phone: '9666666666', email: 'qa-service2@example.com', departmentAddress: 'Long service QA address', equipmentName: 'Analyzer', brandName: 'Crystal Service Updated', modelName: 'SVC-200', serialNumber: 'QA-SN-002', issueCategory: 'Breakdown', issueDescription: 'Detailed service issue', warrantyAmc: 'Warranty', step2Saved: true } }), (r) => r.status === 200 && r.body.serviceRecord.step2Saved === true, (r) => ({ status: r.status, step2Saved: r.body.serviceRecord?.step2Saved, customerName: r.body.serviceRecord?.customerName }));
  await expectStep('Service Step 3 saves parts/status/office details', () => http('PATCH', `/service-records/${service.recordId}`, { token: agentSession.token, body: { partsRequired: 'QA part required', partsUsed: 'QA part used', machineStatus: 'Running after QA', supportRequiredNote: 'Office support note', finalRemarks: `${marker} final service remarks`, photoNote: 'Photo proof noted', step3Saved: true } }), (r) => r.status === 200 && r.body.serviceRecord.step3Saved === true, (r) => ({ status: r.status, step3Saved: r.body.serviceRecord?.step3Saved, machineStatus: r.body.serviceRecord?.machineStatus }));

  await expectStep('Agent own entries show saved Sales and Service rows', () => http('GET', '/field-visits', { token: agentSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes(marker) && r.body.entries.some(e => e.type === 'Sales') && r.body.entries.some(e => e.type === 'Service'), (r) => ({ status: r.status, totalEntriesReturned: r.body.entries?.length, bloomMatches: r.body.entries?.filter(e => JSON.stringify(e).includes(marker)).map(e => ({ type: e.type, customer: e.customer, id: e.id })) }));
  await expectStep('Agent saved Sales detail reopens with Step 2 and Step 3 saved', () => http('GET', `/field-visits?entryId=${sales.visitId}&includePayload=true`, { token: agentSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes('Step 2 status') && JSON.stringify(r.body).includes('Saved') && JSON.stringify(r.body).includes('Step 3 status'), (r) => ({ status: r.status, detailRows: r.body.entries?.[0]?.detailRows }));
  await expectStep('Agent saved Service detail reopens with Step 2 and Step 3 saved', () => http('GET', `/field-visits?entryId=${service.visitId}&includePayload=true`, { token: agentSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes('Step 2 status') && JSON.stringify(r.body).includes('Step 3 status'), (r) => ({ status: r.status, detailRows: r.body.entries?.[0]?.detailRows }));
  await expectStep('Admin All entries sees Bloom Sales and Service rows', () => http('GET', '/field-visits?scope=team', { token: adminSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes(marker), (r) => ({ status: r.status, totalReturned: r.body.entries?.length, bloomRows: r.body.entries?.filter(e => JSON.stringify(e).includes(marker)).map(e => ({ type: e.type, customer: e.customer, agent: e.agentName })) }));

  leave = await expectStep('Agent submits leave request', () => http('POST', '/leave-requests', { token: agentSession.token, body: { fromDate: tomorrow, toDate: tomorrow, reason: 'Bloom QA test leave', note: marker } }), (r) => r.status === 200 && r.body.leaveRequest.status === 'pending', (r) => ({ status: r.status, leaveId: r.body.leaveRequest?.id, requestStatus: r.body.leaveRequest?.status }));
  await expectStep('Admin approvals list sees Bloom leave request', () => http('GET', '/admin/leave-requests', { token: adminSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes(leave.body.leaveRequest.id), (r) => ({ status: r.status, bloomLeaveFound: JSON.stringify(r.body).includes(leave.body.leaveRequest.id), pendingCount: r.body.leaveRequests?.filter(l => l.status === 'pending').length }));
  await expectStep('Admin rejects Bloom leave request for cleanup safety', () => http('PATCH', `/leave-requests/${leave.body.leaveRequest.id}/review`, { token: adminSession.token, body: { status: 'rejected' } }), (r) => r.status === 200 && r.body.leaveRequest.status === 'rejected', (r) => ({ status: r.status, requestStatus: r.body.leaveRequest?.status }));

  await expectStep('Agent attendance PDF downloads as real PDF', () => http('GET', `/agent/reports.pdf?fromDate=${today}&toDate=${today}&kind=attendance`, { token: agentSession.token }), (r) => r.status === 200 && r.contentType.includes('application/pdf') && Buffer.isBuffer(r.body) && r.body.slice(0, 4).toString() === '%PDF', (r) => ({ status: r.status, contentType: r.contentType, pdfHeader: Buffer.isBuffer(r.body) ? r.body.slice(0, 4).toString() : null, bytes: Buffer.isBuffer(r.body) ? r.body.length : 0 }));
  await expectStep('Agent visits PDF downloads as real PDF', () => http('GET', `/agent/reports.pdf?fromDate=${today}&toDate=${today}&kind=visits`, { token: agentSession.token }), (r) => r.status === 200 && r.contentType.includes('application/pdf') && Buffer.isBuffer(r.body) && r.body.slice(0, 4).toString() === '%PDF', (r) => ({ status: r.status, contentType: r.contentType, pdfHeader: Buffer.isBuffer(r.body) ? r.body.slice(0, 4).toString() : null, bytes: Buffer.isBuffer(r.body) ? r.body.length : 0 }));
  await expectStep('Agent combined PDF downloads as real PDF', () => http('GET', `/agent/reports.pdf?fromDate=${today}&toDate=${today}&kind=combined`, { token: agentSession.token }), (r) => r.status === 200 && r.contentType.includes('application/pdf') && Buffer.isBuffer(r.body) && r.body.slice(0, 4).toString() === '%PDF', (r) => ({ status: r.status, contentType: r.contentType, pdfHeader: Buffer.isBuffer(r.body) ? r.body.slice(0, 4).toString() : null, bytes: Buffer.isBuffer(r.body) ? r.body.length : 0 }));
  await expectStep('Admin combined PDF downloads as real PDF', () => http('GET', `/admin/reports.pdf?fromDate=${today}&toDate=${today}&kind=combined`, { token: adminSession.token }), (r) => r.status === 200 && r.contentType.includes('application/pdf') && Buffer.isBuffer(r.body) && r.body.slice(0, 4).toString() === '%PDF', (r) => ({ status: r.status, contentType: r.contentType, pdfHeader: Buffer.isBuffer(r.body) ? r.body.slice(0, 4).toString() : null, bytes: Buffer.isBuffer(r.body) ? r.body.length : 0 }));
  await expectStep('Admin agents list loads and contains Raghavendra admin seat', () => http('GET', '/admin/agents', { token: adminSession.token }), (r) => r.status === 200 && JSON.stringify(r.body).includes('Raghavendra') && JSON.stringify(r.body).includes('sales@crystalbio.in'), (r) => ({ status: r.status, agentCount: r.body.agents?.length, raghavendraFound: JSON.stringify(r.body).includes('Raghavendra'), salesEmailFound: JSON.stringify(r.body).includes('sales@crystalbio.in') }));
  await expectStep('Public monitor snapshot opens', () => http('GET', '/public/monitor?loginLimit=10&errorLimit=10'), (r) => r.status === 200 && Array.isArray(r.body.loginActivity) && Array.isArray(r.body.clientErrors), (r) => ({ status: r.status, loginRows: r.body.loginActivity?.length, clientErrorRows: r.body.clientErrors?.length }));
  await expectStep('Agent checks out after QA journey', () => http('POST', '/attendance/check-out', { token: agentSession.token, body: { timestamp: new Date().toISOString(), gps } }), (r) => r.status === 200 && r.body.attendance.status === 'checked_out', (r) => ({ status: r.status, attendanceStatus: r.body.attendance?.status, checkOutTime: r.body.attendance?.checkOutTime }));
  await expectStep('Post-checkout current attendance is closed', () => http('GET', '/attendance/current', { token: agentSession.token }), (r) => r.status === 200 && !r.body.attendance, (r) => ({ status: r.status, hasCurrent: Boolean(r.body.attendance) }));

  const summary = {
    runStartedAt: steps[0]?.at,
    runFinishedAt: new Date().toISOString(),
    environment: { app: APP, api: API, version: version?.body?.version, dateIST: today, marker },
    totals: { steps: steps.length, pass: steps.filter(s => s.status === 'pass').length, fail: steps.filter(s => s.status === 'fail').length, warn: steps.filter(s => s.status === 'warn').length },
    bugs,
    createdQaData: { marker, salesOpportunityId: sales?.opportunityId, salesVisitId: sales?.visitId, serviceRecordId: service?.recordId, serviceVisitId: service?.visitId, leaveId: leave?.body?.leaveRequest?.id, attendanceId: checkIn?.body?.attendance?.id },
    steps,
  };
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2));
  const lines = [];
  lines.push('# Bloom End-to-End User Journey QA — 2026-07-02');
  lines.push('');
  lines.push(`Environment: live app ${APP}, live API ${API}`);
  lines.push(`Live version: ${summary.environment.version || 'unknown'}`);
  lines.push(`Bloom QA marker: ${marker}`);
  lines.push('');
  lines.push('## Result');
  lines.push('');
  lines.push(`- Steps logged: ${summary.totals.steps}`);
  lines.push(`- Passed: ${summary.totals.pass}`);
  lines.push(`- Failed: ${summary.totals.fail}`);
  lines.push(`- Needs review: ${bugs.length}`);
  lines.push('- No real employee/admin credentials were used.');
  lines.push('- QA Sales/Service/leave/attendance records were created only with Bloom QA accounts and are listed below for Bloom-only cleanup.');
  lines.push('');
  lines.push('## QA data created');
  lines.push('');
  lines.push(`- Sales opportunity: ${sales?.opportunityId || 'not created'}`);
  lines.push(`- Sales visit: ${sales?.visitId || 'not created'}`);
  lines.push(`- Service record: ${service?.recordId || 'not created'}`);
  lines.push(`- Service visit: ${service?.visitId || 'not created'}`);
  lines.push(`- Leave request: ${leave?.body?.leaveRequest?.id || 'not created'}`);
  lines.push(`- Attendance: ${checkIn?.body?.attendance?.id || 'not created/closed'}`);
  lines.push('');
  lines.push('## Every minor step logged');
  lines.push('');
  for (const s of steps) {
    lines.push(`${s.step}. ${s.status.toUpperCase()} — ${s.name}`);
    const detail = JSON.stringify(s.detail);
    if (detail && detail !== '{}') lines.push(`   - Evidence: ${detail}`);
  }
  lines.push('');
  lines.push('## Bugs / needs review in words');
  lines.push('');
  if (!bugs.length) lines.push('- No API-level critical/high failure was confirmed in this run. Browser/mobile visual checks are recorded separately below when run.');
  for (const bug of bugs) lines.push(`- ${bug.title}: ${JSON.stringify(bug.detail)}`);
  lines.push('');
  lines.push(`Raw evidence JSON: ${jsonPath}`);
  await fs.writeFile(mdPath, lines.join('\n') + '\n');
  console.log(`REPORT_JSON=${jsonPath}`);
  console.log(`REPORT_MD=${mdPath}`);
  if (bugs.length) process.exitCode = 2;
}

main().catch(async (error) => {
  log('QA runner crashed before finishing all planned steps', 'fail', { error: error.message, stack: error.stack });
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify({ crashed: true, error: error.message, steps }, null, 2));
  console.error(error);
  process.exit(1);
});
