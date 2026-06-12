import PDFDocument from 'pdfkit';
import type { AdminReport } from './crystalBioBackend';

const olive = '#31452f';
const sage = '#e8f0e4';
const paleSage = '#f6f8f2';
const border = '#d7e1d1';
const text = '#263128';
const muted = '#687468';
const amber = '#c8942f';
const review = '#7a5b17';

const safeText = (value: unknown) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
const prettyStatus = (value: string) => value.replace(/_/g, ' ');

type Doc = InstanceType<typeof PDFDocument>;

const drawRoundedFill = (doc: Doc, x: number, y: number, w: number, h: number, color: string, stroke = border) => {
  doc.roundedRect(x, y, w, h, 12).fillAndStroke(color, stroke);
};

const drawMetricCard = (doc: Doc, x: number, y: number, w: number, label: string, value: string | number, hint: string, accent = olive) => {
  drawRoundedFill(doc, x, y, w, 74, '#ffffff');
  doc.roundedRect(x, y, 5, 74, 3).fill(accent);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(text).text(String(value), x + 16, y + 12, { width: w - 28 });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(olive).text(label.toUpperCase(), x + 16, y + 38, { width: w - 28 });
  doc.font('Helvetica').fontSize(8).fillColor(muted).text(hint, x + 16, y + 51, { width: w - 28 });
};

const drawChip = (doc: Doc, x: number, y: number, label: string, kind: 'ready' | 'review' | 'missing') => {
  const colors = {
    ready: { fill: '#e5f1df', stroke: '#b8d5a9', text: olive },
    review: { fill: '#fff4d8', stroke: '#e6c979', text: review },
    missing: { fill: '#f8e4df', stroke: '#dfa99c', text: '#8c3e2e' },
  }[kind];
  const width = Math.max(58, doc.widthOfString(label) + 18);
  doc.roundedRect(x, y, width, 20, 10).fillAndStroke(colors.fill, colors.stroke);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.text).text(label.toUpperCase(), x, y + 6, { width, align: 'center' });
  return width;
};

const drawBar = (doc: Doc, x: number, y: number, width: number, height: number, value: number, total: number, color: string) => {
  doc.roundedRect(x, y, width, height, height / 2).fill('#eef3eb');
  const fillWidth = total > 0 ? Math.max(8, (value / total) * width) : 0;
  if (fillWidth > 0) doc.roundedRect(x, y, Math.min(width, fillWidth), height, height / 2).fill(color);
};

const drawHeader = (doc: Doc, report: AdminReport) => {
  doc.rect(0, 0, 595, 96).fill(paleSage);
  doc.roundedRect(40, 26, 44, 44, 14).fill(olive);
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text('CB', 48, 40);
  doc.font('Helvetica-Bold').fontSize(21).fillColor(text).text('Crystal Bio Field Report', 100, 28);
  doc.font('Helvetica').fontSize(10).fillColor(muted).text(`Summary period: ${report.fromDate} to ${report.toDate}`, 100, 56);
  doc.roundedRect(430, 32, 104, 28, 14).fillAndStroke('#ffffff', border);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(olive).text('OWNER READY PDF', 430, 42, { width: 104, align: 'center' });
};

const drawSectionTitle = (doc: Doc, title: string, subtitle?: string) => {
  doc.x = 40;
  doc.moveDown(0.45);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(text).text(title, 40, doc.y, { width: 515 });
  if (subtitle) doc.font('Helvetica').fontSize(9).fillColor(muted).text(subtitle, 40, doc.y + 2, { width: 515 });
  doc.moveDown(0.25);
};

const reportHealthFor = (agent: AdminReport['agentSummaries'][number]): 'ready' | 'review' | 'missing' => {
  if (agent.attendanceStatus === 'not_checked_in' && agent.salesVisitCount + agent.serviceVisitCount === 0) return 'missing';
  if (agent.followUpsDue.length > 0 || agent.attendanceStatus === 'checked_in') return 'review';
  return 'ready';
};

const drawPersonCard = (doc: Doc, agent: AdminReport['agentSummaries'][number], index: number) => {
  if (doc.y > 720) doc.addPage();
  const y = doc.y;
  drawRoundedFill(doc, 40, y, 515, 66, '#ffffff');
  const health = reportHealthFor(agent);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(text).text(`${index + 1}. ${safeText(agent.agentName)}`, 56, y + 12, { width: 240 });
  drawChip(doc, 438, y + 10, health, health);
  doc.font('Helvetica').fontSize(8.2).fillColor(muted).text(`Attendance: ${prettyStatus(agent.attendanceStatus)}`, 56, y + 31, { width: 200 });
  doc.font('Helvetica-Bold').fontSize(14).fillColor(olive).text(String(agent.salesVisitCount), 260, y + 21, { width: 40, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(muted).text('Sales', 260, y + 39, { width: 40, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(14).fillColor(olive).text(String(agent.serviceVisitCount), 320, y + 21, { width: 50, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(muted).text('Service', 320, y + 39, { width: 50, align: 'center' });
  const followUps = agent.followUpsDue.length ? agent.followUpsDue.join(', ') : 'No follow-up due';
  doc.font('Helvetica').fontSize(8).fillColor(agent.followUpsDue.length ? review : muted).text(`Office note: ${safeText(followUps)}`, 56, y + 49, { width: 450 });
  doc.y = y + 76;
};

const drawFooter = (doc: Doc) => {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor('#8a948b').text(`Crystal Bio Field Hub • Page ${i + 1} of ${range.count}`, 40, 790, {
      align: 'center',
      width: 515,
    });
  }
};

export function renderAdminReportPdf(report: AdminReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, report);
    doc.y = 118;

    const totalVisits = report.totals.salesVisits + report.totals.serviceVisits;
    const agentCount = report.agentSummaries.length;
    const reviewedAgents = report.agentSummaries.filter((agent) => reportHealthFor(agent) !== 'missing').length;
    drawMetricCard(doc, 40, doc.y, 98, 'Present', report.totals.checkedInAgents + report.totals.checkedOutAgents, `${agentCount} agents listed`);
    drawMetricCard(doc, 148, doc.y, 98, 'Total visits', totalVisits, 'Sales + service', '#4e7049');
    drawMetricCard(doc, 256, doc.y, 98, 'Sales', report.totals.salesVisits, 'Visit updates', '#5f7f58');
    drawMetricCard(doc, 364, doc.y, 98, 'Service', report.totals.serviceVisits, 'Service updates', '#6d8b63');
    drawMetricCard(doc, 472, doc.y, 83, 'Leave', report.totals.pendingLeaveRequests, 'Pending', amber);
    doc.y += 96;

    drawSectionTitle(doc, 'Quick visual summary');
    const chartY = doc.y;
    drawRoundedFill(doc, 40, chartY, 515, 96, '#ffffff');
    doc.font('Helvetica-Bold').fontSize(9).fillColor(text).text('Sales vs Service split', 58, chartY + 16);
    drawBar(doc, 58, chartY + 35, 210, 13, report.totals.salesVisits, Math.max(totalVisits, 1), olive);
    drawBar(doc, 58, chartY + 58, 210, 13, report.totals.serviceVisits, Math.max(totalVisits, 1), '#8fab82');
    doc.font('Helvetica').fontSize(8).fillColor(muted).text(`Sales ${report.totals.salesVisits}`, 278, chartY + 34);
    doc.text(`Service ${report.totals.serviceVisits}`, 278, chartY + 57);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(text).text('Report health', 368, chartY + 16);
    drawBar(doc, 368, chartY + 35, 140, 13, reviewedAgents, Math.max(agentCount, 1), '#7fa16f');
    doc.font('Helvetica').fontSize(8).fillColor(muted).text(`${reviewedAgents}/${agentCount} agents have activity or review items`, 368, chartY + 56, { width: 150 });
    doc.y = chartY + 112;

    drawSectionTitle(doc, 'Person-wise summary cards', 'Clean owner view, not a spreadsheet table.');
    report.agentSummaries.forEach((agent, index) => drawPersonCard(doc, agent, index));

    drawSectionTitle(doc, 'Needs office action', 'What the office/admin should look at first.');
    const actionY = doc.y;
    drawRoundedFill(doc, 40, actionY, 515, 70, '#fffdf7', '#ead8aa');
    const actions: string[] = [];
    if (report.totals.pendingLeaveRequests > 0) actions.push(`${report.totals.pendingLeaveRequests} leave request(s) pending approval/rejection.`);
    report.followUpsDue.forEach((item) => actions.push(safeText(item)));
    if (actions.length === 0) actions.push('No urgent office action found for this report period.');
    actions.slice(0, 3).forEach((item, idx) => {
      doc.font('Helvetica').fontSize(8.5).fillColor(idx === 0 && actions.length > 0 ? text : muted).text(`• ${item}`, 58, actionY + 13 + idx * 13, { width: 470 });
    });
    doc.y = actionY + 84;

    doc.addPage();
    drawHeader(doc, report);
    doc.y = 118;
    drawSectionTitle(doc, 'Detailed appendix', 'Agent-wise details for office review after the summary page.');
    report.agentSummaries.forEach((agent, index) => {
      if (doc.y > 705) doc.addPage();
      const y = doc.y;
      drawRoundedFill(doc, 40, y, 515, 102, '#ffffff');
      doc.font('Helvetica-Bold').fontSize(11).fillColor(text).text(`${index + 1}. ${safeText(agent.agentName)}`, 58, y + 14);
      doc.font('Helvetica').fontSize(9).fillColor(muted).text(`Attendance: ${prettyStatus(agent.attendanceStatus)}`, 58, y + 34);
      doc.text(`Sales visits: ${agent.salesVisitCount}`, 58, y + 50);
      doc.text(`Service visits: ${agent.serviceVisitCount}`, 200, y + 50);
      doc.text(`Follow-ups / review notes: ${agent.followUpsDue.length ? safeText(agent.followUpsDue.join(', ')) : 'None'}`, 58, y + 68, { width: 460 });
      doc.y = y + 118;
    });

    drawFooter(doc);
    doc.end();
  });
}
