import { describe, expect, it } from 'vitest';
import { createCrystalBioBackend, ValidationError } from './crystalBioBackend';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

describe('CrystalBio backend auth leave and admin reports', () => {
  it('creates login sessions and returns the logged-in user context', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    const session = backend.login(agent.id);

    expect(session.agentId).toBe(agent.id);
    expect(session.agentName).toBe('Rahul');
    expect(session.role).toBe('sales');
    expect(backend.getSession(session.token)).toEqual(session);
  });

  it('logs in with login code and passcode while rejecting wrong passcodes', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales', employeeId: 'CB-S-014', email: 'rahul.sales@crystalbio.in', password: 'pilot-test-password' });

    const session = backend.login({ email: 'rahul.sales@crystalbio.in', password: 'pilot-test-password' });

    expect(session.agentId).toBe(agent.id);
    expect(session.agentName).toBe('Rahul');
    expect(() => backend.login({ email: 'rahul.sales@crystalbio.in', password: 'wrong-password' })).toThrow(/Invalid email or password/);
  });

  it('lets logged-in agents submit leave requests and lets admin approve them', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Meera', role: 'service' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });

    const leave = backend.submitLeaveRequest(agent.id, {
      fromDate: '2026-06-09',
      toDate: '2026-06-10',
      reason: 'Family function',
    });

    expect(leave.agentName).toBe('Meera');
    expect(leave.status).toBe('pending');

    const approved = backend.reviewLeaveRequest(admin.id, leave.id, 'approved');

    expect(approved.status).toBe('approved');
    expect(approved.reviewedByAgentId).toBe(admin.id);
  });

  it('blocks non-admin users from reviewing leave requests', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Meera', role: 'service' });
    const otherAgent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const leave = backend.submitLeaveRequest(agent.id, {
      fromDate: '2026-06-09',
      toDate: '2026-06-10',
      reason: 'Family function',
    });

    expect(() => backend.reviewLeaveRequest(otherAgent.id, leave.id, 'rejected')).toThrow(ValidationError);
  });

  it('builds admin daily report across all agents', () => {
    const backend = createCrystalBioBackend();
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const rahul = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const meera = backend.createAgent({ name: 'Meera', role: 'service' });
    backend.checkIn(rahul.id, { timestamp: '2026-06-07T09:00:00.000Z', gps });
    backend.checkOut(rahul.id, { timestamp: '2026-06-07T18:00:00.000Z', gps });
    backend.checkIn(meera.id, { timestamp: '2026-06-07T09:30:00.000Z', gps });

    const opportunity = backend.createSalesOpportunity(rahul.id, { accountName: 'Apollo Diagnostics' });
    backend.addSalesVisitUpdate(rahul.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'follow_up_needed',
      followUpDate: '2026-06-08',
      photos: [],
    });
    const serviceRecord = backend.createServiceRecord(meera.id, { customerName: 'Metro Lab', equipmentName: 'Centrifuge' });
    backend.addServiceVisitUpdate(meera.id, serviceRecord.id, {
      visitDate: '2026-06-07',
      visitTime: '14:20',
      gps,
      serviceType: 'breakdown',
      workDone: 'Diagnosed bearing noise',
      supportRequired: true,
      nextAction: 'parts_required',
      nextVisitDate: '2026-06-09',
      photos: [],
    });

    const report = backend.getAdminReport(admin.id, { fromDate: '2026-06-07', toDate: '2026-06-07' });

    expect(report.agentSummaries).toHaveLength(3);
    expect(report.agentSummaries.find((summary) => summary.agentName === 'Admin User')?.salesVisitCount).toBe(0);
    expect(report.totals.salesVisits).toBe(1);
    expect(report.totals.serviceVisits).toBe(1);
    expect(report.totals.checkedInAgents).toBe(2);
    expect(report.totals.checkedOutAgents).toBe(1);
    expect(report.followUpsDue).toEqual([]);
  });

  it('blocks non-admin users from opening admin reports', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    expect(() => backend.getAdminReport(agent.id, { fromDate: '2026-06-07', toDate: '2026-06-07' })).toThrow(
      ValidationError,
    );
  });

  it('builds weekly and monthly reports using date ranges', () => {
    const backend = createCrystalBioBackend();
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const agent = backend.createAgent({ name: 'Rahul', role: 'both' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-03',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
      photos: [],
    });
    backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-20',
      visitTime: '15:18',
      gps,
      note: 'Quote reviewed',
      nextAction: 'closed',
      photos: [],
    });

    backend.submitLeaveRequest(agent.id, {
      fromDate: '2026-06-20',
      toDate: '2026-06-21',
      reason: 'Personal work',
    });

    const weekly = backend.getAdminReport(admin.id, { fromDate: '2026-06-01', toDate: '2026-06-07' });
    const monthly = backend.getAdminReport(admin.id, { fromDate: '2026-06-01', toDate: '2026-06-30' });

    expect(weekly.totals.salesVisits).toBe(1);
    expect(weekly.totals.pendingLeaveRequests).toBe(0);
    expect(monthly.totals.salesVisits).toBe(2);
    expect(monthly.totals.pendingLeaveRequests).toBe(1);
    expect(monthly.attendancePeriodSummaries?.find((summary) => summary.agentName === 'Rahul')).toMatchObject({
      totalDays: 30,
      workedDays: 0,
      leaveAppliedDays: 2,
      pendingLeaveDays: 2,
      noUpdateDays: 28,
    });
  });

  it('summarizes worked days and leave days for attendance date-range reports', () => {
    const backend = createCrystalBioBackend();
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const agent = backend.createAgent({ name: 'Girish', role: 'service' });

    backend.checkIn(agent.id, { timestamp: '2026-06-01T09:00:00.000Z', gps });
    backend.checkOut(agent.id, { timestamp: '2026-06-01T18:00:00.000Z', gps });
    backend.checkIn(agent.id, { timestamp: '2026-06-03T09:10:00.000Z', gps });
    backend.submitLeaveRequest(agent.id, {
      fromDate: '2026-06-04',
      toDate: '2026-06-05',
      reason: 'Family work',
    });

    const report = backend.getAdminReport(admin.id, { fromDate: '2026-06-01', toDate: '2026-06-07' });
    const girish = report.attendancePeriodSummaries?.find((summary) => summary.agentName === 'Girish');

    expect(girish).toMatchObject({
      totalDays: 7,
      workedDays: 2,
      checkedOutDays: 1,
      leaveAppliedDays: 2,
      pendingLeaveDays: 2,
      noUpdateDays: 3,
    });
  });
});
