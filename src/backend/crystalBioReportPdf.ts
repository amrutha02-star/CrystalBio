import PDFDocument from 'pdfkit';
import type { AdminReport } from './crystalBioBackend';

const olive = '#31452f';
const sage = '#edf4e9';
const pale = '#f8faf5';
const border = '#d9e3d2';
const text = '#222b24';
const muted = '#687468';
const amber = '#b17816';
const red = '#9a3d2e';

type Doc = InstanceType<typeof PDFDocument>;
type AgentSummary = AdminReport['agentSummaries'][number];
type SalesDetail = NonNullable<AdminReport['salesVisitDetails']>[number];
type ServiceDetail = NonNullable<AdminReport['serviceVisitDetails']>[number];

const safe = (value: unknown, fallback = '-') => {
  const clean = String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || fallback;
};

const titleCase = (value: string | undefined) => safe(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const istTimeZone = 'Asia/Kolkata';
const formatDate = (value?: string) => {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (year && month && day) return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safe(value);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: istTimeZone }).format(date);
};
const timeOnly = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(11, 16) || '-';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: istTimeZone }).format(date);
};
const yesNo = (value: boolean | undefined) => (value ? 'Yes' : 'No');
const dateTimeShort = (value?: string) => (value ? `${formatDate(value)} ${timeOnly(value)}` : '-');

const addHeader = (doc: Doc, report: AdminReport, title = 'Field Operations Report') => {
  doc.rect(0, 0, 595, 86).fill(pale);
  doc.roundedRect(40, 24, 38, 38, 10).fill(olive);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff').text('CB', 48, 36);
  doc.font('Helvetica-Bold').fontSize(19).fillColor(text).text('Crystal Bio', 92, 22);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(olive).text(title, 92, 45);
  doc.font('Helvetica').fontSize(9).fillColor(muted).text(`Period: ${formatDate(report.fromDate)} to ${formatDate(report.toDate)}`, 92, 62);
  doc.font('Helvetica').fontSize(8).fillColor(muted).text(`Generated: ${dateTimeShort(new Date().toISOString())} IST`, 405, 34, { width: 150, align: 'right' });
};

const ensureSpace = (doc: Doc, height: number, report: AdminReport) => {
  if (doc.y + height > 760) {
    doc.addPage();
    addHeader(doc, report);
    doc.y = 108;
  }
};

const section = (doc: Doc, report: AdminReport, label: string, helper?: string) => {
  ensureSpace(doc, helper ? 44 : 30, report);
  doc.moveDown(0.35);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(text).text(label, 40, doc.y, { width: 515 });
  if (helper) doc.font('Helvetica').fontSize(8.5).fillColor(muted).text(helper, 40, doc.y + 2, { width: 515 });
  doc.moveDown(0.35);
};

const metric = (doc: Doc, x: number, y: number, w: number, label: string, value: string | number, hint?: string, accent = olive) => {
  doc.roundedRect(x, y, w, 62, 8).fillAndStroke('#ffffff', border);
  doc.roundedRect(x, y, 4, 62, 2).fill(accent);
  doc.font('Helvetica-Bold').fontSize(17).fillColor(text).text(String(value), x + 13, y + 10, { width: w - 20 });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(olive).text(label.toUpperCase(), x + 13, y + 32, { width: w - 20 });
  if (hint) doc.font('Helvetica').fontSize(7.5).fillColor(muted).text(hint, x + 13, y + 44, { width: w - 20 });
};

const tableHeader = (doc: Doc, y: number, columns: Array<{ label: string; x: number; w: number }>) => {
  doc.roundedRect(40, y, 515, 22, 5).fill(sage);
  columns.forEach((col) => doc.font('Helvetica-Bold').fontSize(7.5).fillColor(olive).text(col.label.toUpperCase(), col.x, y + 7, { width: col.w }));
};

const tableRow = (doc: Doc, report: AdminReport, columns: Array<{ text: string; x: number; w: number }>, height = 28) => {
  ensureSpace(doc, height + 4, report);
  const y = doc.y;
  doc.rect(40, y, 515, height).fillAndStroke('#ffffff', '#edf1e9');
  columns.forEach((col) => doc.font('Helvetica').fontSize(8).fillColor(text).text(safe(col.text), col.x, y + 7, { width: col.w, lineGap: 1 }));
  doc.y = y + height;
};

const bullet = (doc: Doc, report: AdminReport, value: string, tone: 'normal' | 'warning' = 'normal') => {
  ensureSpace(doc, 18, report);
  doc.font('Helvetica').fontSize(8.7).fillColor(tone === 'warning' ? red : text).text(`• ${safe(value)}`, 52, doc.y, { width: 485 });
};

const activeAgents = (report: AdminReport) => report.agentSummaries.filter((agent) => agent.attendanceStatus !== 'not_checked_in' || agent.salesVisitCount > 0 || agent.serviceVisitCount > 0 || agent.followUpsDue.length > 0);
const missingAgents = (report: AdminReport) => report.agentSummaries.filter((agent) => agent.attendanceStatus === 'not_checked_in' && agent.salesVisitCount === 0 && agent.serviceVisitCount === 0);

const drawExecutiveSummary = (doc: Doc, report: AdminReport) => {
  const totalVisits = report.totals.salesVisits + report.totals.serviceVisits;
  const agentCount = report.agentSummaries.length;
  const missingCount = missingAgents(report).length;
  metric(doc, 40, doc.y, 92, 'Agents', agentCount, 'listed');
  metric(doc, 142, doc.y, 92, 'Present', report.totals.checkedInAgents + report.totals.checkedOutAgents, 'checked in');
  metric(doc, 244, doc.y, 92, 'Visits', totalVisits, 'sales + service');
  metric(doc, 346, doc.y, 92, 'Follow-ups', report.followUpsDue.length, 'open');
  metric(doc, 448, doc.y, 107, 'Missing', missingCount, 'no update', missingCount ? red : olive);
  doc.y += 82;
};

const drawActionRequired = (doc: Doc, report: AdminReport) => {
  section(doc, report, 'Action required first', 'Items an owner or office team should review before reading details.');
  const y = doc.y;
  doc.roundedRect(40, y, 515, 86, 8).fillAndStroke('#fffdf7', '#ead8aa');
  doc.y = y + 13;
  const items: Array<{ value: string; tone?: 'warning' }> = [];
  if (missingAgents(report).length) items.push({ value: `${missingAgents(report).length} agent(s) have no check-in or visit update in this period.`, tone: 'warning' });
  if (report.followUpsDue.length) report.followUpsDue.slice(0, 3).forEach((item) => items.push({ value: item, tone: 'warning' }));
  if (report.totals.pendingLeaveRequests) items.push({ value: `${report.totals.pendingLeaveRequests} leave request(s) pending decision.`, tone: 'warning' });
  if (!items.length) items.push({ value: 'No urgent office action found for this period.' });
  items.slice(0, 4).forEach((item) => bullet(doc, report, item.value, item.tone ? 'warning' : 'normal'));
  doc.y = y + 100;
};

const drawAttendanceOverview = (doc: Doc, report: AdminReport) => {
  section(doc, report, 'Attendance report', 'Worked days and leave days for the selected period.');
  const rows = report.attendancePeriodSummaries ?? [];
  const totals = rows.reduce((sum, row) => ({
    workedDays: sum.workedDays + row.workedDays,
    leaveAppliedDays: sum.leaveAppliedDays + row.leaveAppliedDays,
    pendingLeaveDays: sum.pendingLeaveDays + row.pendingLeaveDays,
    noUpdateDays: sum.noUpdateDays + row.noUpdateDays,
  }), { workedDays: 0, leaveAppliedDays: 0, pendingLeaveDays: 0, noUpdateDays: 0 });

  const y = doc.y;
  const cards = [
    { label: 'People', value: rows.length, hint: 'listed' },
    { label: 'Worked days', value: totals.workedDays, hint: 'checked in' },
    { label: 'Leave applied', value: totals.leaveAppliedDays, hint: 'days' },
    { label: 'No update', value: totals.noUpdateDays, hint: 'days', accent: totals.noUpdateDays ? red : olive },
  ];
  cards.forEach((card, index) => metric(doc, 40 + (index * 129), y, 118, card.label, card.value, card.hint, card.accent ?? olive));
  doc.y = y + 78;
};

const drawAttendance = (doc: Doc, report: AdminReport) => {
  const details = report.attendancePeriodSummaries ?? [];
  const attendanceRecords = report.attendanceDetails ?? [];
  const latestByAgent = new Map<string, NonNullable<AdminReport['attendanceDetails']>[number]>();
  attendanceRecords.forEach((record) => {
    const previous = latestByAgent.get(record.agentId);
    if (!previous || record.checkInAt > previous.checkInAt) latestByAgent.set(record.agentId, record);
  });
  const activeRecords = attendanceRecords.filter((record) => record.status === 'checked_in');
  const autoClosedRecords = attendanceRecords.filter((record) => record.autoCheckedOut);
  const noUpdateRows = details.filter((row) => row.noUpdateDays > 0 && row.workedDays === 0 && row.leaveAppliedDays === 0);

  section(doc, report, 'Attendance exceptions and office action', 'Summary-first view of check-ins, missed checkouts, auto-closed rows, leave, and no-update days.');
  const y = doc.y;
  const cards = [
    { label: 'Checked in', value: new Set(attendanceRecords.map((record) => record.agentId)).size, hint: 'people with attendance' },
    { label: 'Still open', value: new Set(activeRecords.map((record) => record.agentId)).size, hint: 'needs checkout check', accent: activeRecords.length ? amber : olive },
    { label: 'Auto checkout', value: autoClosedRecords.length, hint: 'system closed', accent: autoClosedRecords.length ? amber : olive },
    { label: 'No update', value: noUpdateRows.length, hint: 'people', accent: noUpdateRows.length ? red : olive },
  ];
  cards.forEach((card, index) => metric(doc, 40 + (index * 129), y, 118, card.label, card.value, card.hint, card.accent ?? olive));
  doc.y = y + 78;

  const actionItems: string[] = [];
  if (activeRecords.length) actionItems.push(`Still checked in: ${activeRecords.map((record) => record.agentName).join(', ')}`);
  if (autoClosedRecords.length) actionItems.push(`Auto checked out: ${autoClosedRecords.map((record) => `${record.agentName} (${formatDate(record.date)})`).join(', ')}`);
  const pendingLeavePeople = details.filter((row) => row.pendingLeaveDays > 0).map((row) => `${row.agentName} (${row.pendingLeaveDays})`);
  if (pendingLeavePeople.length) actionItems.push(`Pending leave days: ${pendingLeavePeople.join(', ')}`);
  if (noUpdateRows.length) actionItems.push(`No update in this period: ${noUpdateRows.map((row) => row.agentName).join(', ')}`);
  if (!actionItems.length) actionItems.push('No attendance exception found for this period.');
  actionItems.slice(0, 5).forEach((item) => bullet(doc, report, item, item.startsWith('No attendance') ? 'normal' : 'warning'));
  doc.moveDown(0.4);

  section(doc, report, 'Person-wise attendance summary', 'Compact business view; detailed raw attendance rows remain in the saved system data.');
  const cols = [
    { label: 'Person', x: 48, w: 108 },
    { label: 'Worked', x: 158, w: 44 },
    { label: 'Last check-in', x: 204, w: 80 },
    { label: 'Last checkout', x: 286, w: 82 },
    { label: 'Leave', x: 370, w: 52 },
    { label: 'No update', x: 424, w: 54 },
    { label: 'Office note', x: 480, w: 64 },
  ];
  tableHeader(doc, doc.y, cols);
  doc.y += 22;
  if (!details.length) {
    tableRow(doc, report, [{ text: 'No people found for this period', x: 48, w: 480 }], 30);
    return;
  }
  details.forEach((row) => {
    const latest = latestByAgent.get(row.agentId);
    const note = latest?.autoCheckedOut
      ? 'Auto checked out'
      : latest?.status === 'checked_in'
        ? 'Still checked in'
        : row.pendingLeaveDays > 0
          ? 'Leave pending'
          : row.noUpdateDays > 0
            ? 'No update'
            : 'OK';
    tableRow(doc, report, [
      { text: row.agentName, x: 48, w: 108 },
      { text: `${row.workedDays}/${row.totalDays}`, x: 158, w: 44 },
      { text: dateTimeShort(latest?.checkInAt), x: 204, w: 80 },
      { text: latest?.autoCheckedOut ? `Auto ${timeOnly(latest.checkOutAt)}` : dateTimeShort(latest?.checkOutAt), x: 286, w: 82 },
      { text: `${row.leaveAppliedDays} (${row.approvedLeaveDays}/${row.pendingLeaveDays})`, x: 370, w: 52 },
      { text: String(row.noUpdateDays), x: 424, w: 54 },
      { text: note, x: 480, w: 64 },
    ], 34);
  });
};

const drawSales = (doc: Doc, report: AdminReport) => {
  section(doc, report, 'Sales visit details');
  const cols = [
    { label: 'Agent', x: 48, w: 75 },
    { label: 'Customer', x: 126, w: 112 },
    { label: 'Contact', x: 240, w: 78 },
    { label: 'Requirement / product', x: 320, w: 116 },
    { label: 'Outcome / next action', x: 438, w: 106 },
  ];
  tableHeader(doc, doc.y, cols);
  doc.y += 22;
  const details = report.salesVisitDetails ?? [];
  if (!details.length) {
    tableRow(doc, report, [{ text: 'No sales visits recorded in this period', x: 48, w: 480 }], 30);
    return;
  }
  details.forEach(({ opportunity, visit }) => tableRow(doc, report, [
    { text: visit.agentName, x: 48, w: 75 },
    { text: opportunity.accountName, x: 126, w: 112 },
    { text: opportunity.contactPerson || opportunity.phone || opportunity.email || '-', x: 240, w: 78 },
    { text: opportunity.requirement || opportunity.productType || opportunity.brandName || '-', x: 320, w: 116 },
    { text: `${titleCase(visit.nextAction)}${visit.followUpDate ? ` • ${formatDate(visit.followUpDate)}` : ''}`, x: 438, w: 106 },
  ], 38));
};

const drawService = (doc: Doc, report: AdminReport) => {
  section(doc, report, 'Service visit details');
  const cols = [
    { label: 'Agent', x: 48, w: 72 },
    { label: 'Customer', x: 122, w: 102 },
    { label: 'Equipment', x: 226, w: 92 },
    { label: 'Issue / work done', x: 320, w: 126 },
    { label: 'Status / support', x: 448, w: 96 },
  ];
  tableHeader(doc, doc.y, cols);
  doc.y += 22;
  const details = report.serviceVisitDetails ?? [];
  if (!details.length) {
    tableRow(doc, report, [{ text: 'No service visits recorded in this period', x: 48, w: 480 }], 30);
    return;
  }
  details.forEach(({ record, visit }) => tableRow(doc, report, [
    { text: visit.agentName, x: 48, w: 72 },
    { text: record.customerName, x: 122, w: 102 },
    { text: [record.equipmentName, record.modelName, record.serialNumber].filter(Boolean).join(' / '), x: 226, w: 92 },
    { text: visit.workDone || record.issueDescription || record.issueCategory || '-', x: 320, w: 126 },
    { text: `${titleCase(record.status)} • Support: ${yesNo(visit.supportRequired)}`, x: 448, w: 96 },
  ], 42));
};

const drawAgentSummary = (doc: Doc, report: AdminReport) => {
  section(doc, report, 'Agent-wise summary', 'Only active/reporting rows first; missing/no-update users are grouped separately.');
  const cols = [
    { label: 'Agent', x: 48, w: 150 },
    { label: 'Role', x: 200, w: 66 },
    { label: 'Attendance', x: 268, w: 92 },
    { label: 'Sales', x: 362, w: 46 },
    { label: 'Service', x: 410, w: 56 },
    { label: 'Follow-up', x: 468, w: 76 },
  ];
  tableHeader(doc, doc.y, cols);
  doc.y += 22;
  const rows = activeAgents(report);
  if (!rows.length) tableRow(doc, report, [{ text: 'No active field updates in this period', x: 48, w: 480 }], 30);
  rows.forEach((agent: AgentSummary) => tableRow(doc, report, [
    { text: agent.agentName, x: 48, w: 150 },
    { text: titleCase(agent.role), x: 200, w: 66 },
    { text: titleCase(agent.attendanceStatus), x: 268, w: 92 },
    { text: String(agent.salesVisitCount), x: 362, w: 46 },
    { text: String(agent.serviceVisitCount), x: 410, w: 56 },
    { text: agent.followUpsDue.length ? 'Yes' : 'No', x: 468, w: 76 },
  ], 30));

  const missing = missingAgents(report);
  if (missing.length) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(red).text(`No update / missing: ${missing.map((agent) => agent.agentName).join(', ')}`, 40, doc.y, { width: 515 });
  }
};

const drawLeave = (doc: Doc, report: AdminReport) => {
  const leave = report.leaveRequestDetails ?? [];
  if (!leave.length) return;
  section(doc, report, 'Leave / approval status');
  leave.forEach((item) => tableRow(doc, report, [
    { text: item.agentName, x: 48, w: 130 },
    { text: `${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`, x: 182, w: 130 },
    { text: item.reason, x: 316, w: 118 },
    { text: titleCase(item.status), x: 438, w: 90 },
  ], 30));
};

const drawFooter = (doc: Doc, title = 'Crystal Bio Report') => {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor('#8a948b').text(`${title} • Page ${i + 1} of ${range.count}`, 40, 790, { width: 515, align: 'center' });
  }
};

export type ReportPdfKind = 'attendance' | 'visits' | 'combined';

type ReportPdfOptions = {
  kind?: ReportPdfKind;
};

export function renderAdminReportPdf(report: AdminReport, options: ReportPdfOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addHeader(doc, report, options.kind === 'attendance' ? 'Attendance Report' : options.kind === 'visits' ? 'Visit Report' : 'Attendance & Field Report');
    doc.y = 108;
    drawAttendanceOverview(doc, report);
    drawAttendance(doc, report);
    drawLeave(doc, report);
    if (options.kind !== 'attendance') {
      drawSales(doc, report);
      drawService(doc, report);
      drawAgentSummary(doc, report);
    }

    drawFooter(doc, options.kind === 'attendance' ? 'Crystal Bio Attendance Report' : options.kind === 'visits' ? 'Crystal Bio Visit Report' : 'Crystal Bio Field Report');
    doc.end();
  });
}
