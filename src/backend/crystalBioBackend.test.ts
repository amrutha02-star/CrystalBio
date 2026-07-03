import { describe, expect, it } from 'vitest';
import { createCrystalBioBackend, ValidationError } from './crystalBioBackend';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

describe('CrystalBio backend core', () => {
  it('attaches the logged-in agent to attendance instead of accepting typed names', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    const attendance = backend.checkIn(agent.id, {
      timestamp: '2026-06-07T09:30:00.000Z',
      gps,
      note: 'Starting route',
    });

    expect(attendance.agentId).toBe(agent.id);
    expect(attendance.agentName).toBe('Rahul');
    expect(attendance.checkInGps).toEqual(gps);
  });

  it('stores the selected check-in work type for admin attendance detail', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'both' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });

    const attendance = backend.checkIn(agent.id, {
      timestamp: '2026-06-07T09:30:00.000Z',
      gps,
      workTypes: ['Sales visit', 'In office'],
    });
    const report = backend.getAdminReport(admin.id, { fromDate: '2026-06-07', toDate: '2026-06-07' });

    expect(attendance.workTypes).toEqual(['Sales visit', 'In office']);
    expect(report.attendanceDetails?.find((record) => record.id === attendance.id)?.workTypes).toEqual(['Sales visit', 'In office']);
  });

  it('requires checkout GPS before closing attendance', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Meera', role: 'service' });
    backend.checkIn(agent.id, { timestamp: '2026-06-07T09:00:00.000Z', gps });

    expect(() =>
      backend.checkOut(agent.id, {
        timestamp: '2026-06-07T18:00:00.000Z',
        gps: undefined,
      }),
    ).toThrow(ValidationError);
  });

  it('blocks same-day repeated check-in but allows next-day check-in after missed checkout', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    const firstDay = backend.checkIn(agent.id, { timestamp: '2026-06-17T09:00:00.000Z', gps });
    expect(() => backend.checkIn(agent.id, { timestamp: '2026-06-17T09:05:00.000Z', gps })).toThrow(ValidationError);

    const nextDay = backend.checkIn(agent.id, { timestamp: '2026-06-18T09:00:00.000Z', gps });

    expect(firstDay.status).toBe('checked_in');
    expect(nextDay.date).toBe('2026-06-18');
    expect(nextDay.status).toBe('checked_in');
  });

  it('allows a new same-day check-in after checkout for breaks or return visits', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    const morning = backend.checkIn(agent.id, { timestamp: '2026-06-18T09:00:00.000Z', gps });
    const morningOut = backend.checkOut(agent.id, { timestamp: '2026-06-18T12:00:00.000Z', gps });
    const afternoon = backend.checkIn(agent.id, { timestamp: '2026-06-18T14:00:00.000Z', gps });

    expect(morningOut.id).toBe(morning.id);
    expect(morningOut.status).toBe('checked_out');
    expect(afternoon.id).not.toBe(morning.id);
    expect(afternoon.status).toBe('checked_in');
    expect(afternoon.date).toBe('2026-06-18');
  });

  it('checks out today’s active session before an older missed-checkout session', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });

    const missedYesterday = backend.checkIn(agent.id, { timestamp: '2026-06-17T09:00:00.000Z', gps });
    const today = backend.checkIn(agent.id, { timestamp: '2026-06-18T09:00:00.000Z', gps });
    const checkedOut = backend.checkOut(agent.id, { timestamp: '2026-06-18T18:00:00.000Z', gps });

    expect(checkedOut.id).toBe(today.id);
    expect(checkedOut.status).toBe('checked_out');
    expect(missedYesterday.status).toBe('checked_in');
  });

  it('saves repeated sales visits as separate visit updates under one opportunity', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, {
      accountName: 'Apollo Diagnostics',
      contactPerson: 'Lab manager',
      phone: '9999999999',
      requirement: 'Centrifuge quote',
    });

    const visit1 = backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'follow_up_needed',
      followUpDate: '2026-06-10',
      photos: [{ source: 'camera', fileName: 'quote-board.jpg' }],
    });
    const visit2 = backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-12',
      visitTime: '15:05',
      gps,
      note: 'Quote discussed',
      nextAction: 'no_follow_up',
      photos: [{ source: 'upload', fileName: 'quote.pdf' }],
    });

    expect(visit1.visitNumber).toBe(1);
    expect(visit2.visitNumber).toBe(2);
    expect(backend.getSalesOpportunity(opportunity.id).visits).toHaveLength(2);
  });

  it('returns the existing sales visit when the exact same save is submitted again', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    const input = {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'follow_up_needed' as const,
      followUpDate: '2026-06-10',
      photos: [],
    };

    const visit1 = backend.addSalesVisitUpdate(agent.id, opportunity.id, input);
    const visit2 = backend.addSalesVisitUpdate(agent.id, opportunity.id, { ...input });

    expect(visit2.id).toBe(visit1.id);
    expect(backend.getSalesOpportunity(opportunity.id).visits).toHaveLength(1);
  });

  it('saves same-day sales visits at different times as separate real updates', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    const input = {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up' as const,
      photos: [],
    };

    const visit1 = backend.addSalesVisitUpdate(agent.id, opportunity.id, input);
    const visit2 = backend.addSalesVisitUpdate(agent.id, opportunity.id, { ...input, visitTime: '15:00' });

    expect(visit2.id).not.toBe(visit1.id);
    expect(backend.getSalesOpportunity(opportunity.id).visits).toHaveLength(2);
  });

  it('updates sales opportunity details without creating another visit', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
      photos: [],
    });

    const updated = backend.updateSalesOpportunity(agent.id, opportunity.id, {
      email: 'lab@example.com',
      leadSource: 'Field visit',
      productType: 'Laboratory equipment',
      quoteSubmitted: 'yes',
      quoteStatus: 'Quote pending',
      officeNotes: 'Prepare quote',
    });

    expect(updated.email).toBe('lab@example.com');
    expect(updated.quoteStatus).toBe('Quote pending');
    expect(backend.getSalesOpportunity(opportunity.id).visits).toHaveLength(1);
  });

  it('ignores protected sales fields during opportunity detail updates', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
      photos: [],
    });

    const updated = backend.updateSalesOpportunity(agent.id, opportunity.id, {
      email: 'safe@example.com',
      id: 'hacked',
      ownerAgentId: 'agent_999',
      visits: [],
      status: 'closed',
    } as any);

    expect(updated.id).toBe(opportunity.id);
    expect(updated.ownerAgentId).toBe(agent.id);
    expect(updated.status).toBe('open');
    expect(updated.email).toBe('safe@example.com');
    expect(updated.visits).toHaveLength(1);
  });

  it('blocks another agent from updating or adding visits to someone else’s sales opportunity', () => {
    const backend = createCrystalBioBackend();
    const owner = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const otherSales = backend.createAgent({ name: 'Priya', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(owner.id, { accountName: 'Metro Lab' });

    expect(() =>
      backend.updateSalesOpportunity(otherSales.id, opportunity.id, {
        quoteStatus: 'Changed by wrong user',
      }),
    ).toThrow(/Only the owning agent or admin can update this sales opportunity/);

    expect(() =>
      backend.addSalesVisitUpdate(otherSales.id, opportunity.id, {
        visitDate: '2026-06-07',
        visitTime: '12:00',
        gps,
        note: 'Wrong user visit',
        nextAction: 'no_follow_up',
        photos: [],
      }),
    ).toThrow(/Only the owning agent or admin can add sales visits to this opportunity/);

    expect(backend.getSalesOpportunity(opportunity.id).quoteStatus).toBeUndefined();
    expect(backend.getSalesOpportunity(opportunity.id).visits).toHaveLength(0);
  });

  it('allows admin to correct sales opportunity details without changing ownership', () => {
    const backend = createCrystalBioBackend();
    const owner = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const opportunity = backend.createSalesOpportunity(owner.id, { accountName: 'Metro Lab' });

    const updated = backend.updateSalesOpportunity(admin.id, opportunity.id, {
      quoteStatus: 'Office reviewed',
      ownerAgentId: admin.id,
      visits: [],
    } as any);

    expect(updated.quoteStatus).toBe('Office reviewed');
    expect(updated.ownerAgentId).toBe(owner.id);
    expect(updated.visits).toHaveLength(0);
  });

  it('rejects impossible GPS coordinates for attendance and field visits', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'both' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Metro Lab' });
    const serviceRecord = backend.createServiceRecord(agent.id, { customerName: 'Metro Lab' });
    const invalidGps = { latitude: 999, longitude: 999, accuracyMeters: 10 };

    expect(() => backend.checkIn(agent.id, { timestamp: '2026-06-07T09:00:00.000Z', gps: invalidGps })).toThrow(/Valid GPS latitude and longitude are required/);
    expect(() => backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '12:00',
      gps: invalidGps,
      note: 'Met customer',
      nextAction: 'no_follow_up',
      photos: [],
    })).toThrow(/Valid GPS latitude and longitude are required/);
    expect(() => backend.addServiceVisitUpdate(agent.id, serviceRecord.id, {
      visitDate: '2026-06-07',
      visitTime: '12:30',
      gps: invalidGps,
      serviceType: 'breakdown',
      workDone: 'Checked machine',
      supportRequired: false,
      nextAction: 'no_follow_up',
      photos: [],
    })).toThrow(/Valid GPS latitude and longitude are required/);
  });

  it('enforces Sales/Service backend role boundaries', () => {
    const backend = createCrystalBioBackend();
    const salesAgent = backend.createAgent({ name: 'Sales User', role: 'sales' });
    const serviceAgent = backend.createAgent({ name: 'Service User', role: 'service' });
    const bothAgent = backend.createAgent({ name: 'Both User', role: 'both' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });

    expect(() => backend.createSalesOpportunity(serviceAgent.id, { accountName: 'Wrong Sales' })).toThrow(/Sales access is required/);
    expect(() => backend.createServiceRecord(salesAgent.id, { customerName: 'Wrong Service' })).toThrow(/Service access is required/);
    expect(backend.createSalesOpportunity(salesAgent.id, { accountName: 'Sales Customer' }).ownerAgentId).toBe(salesAgent.id);
    expect(backend.createServiceRecord(serviceAgent.id, { customerName: 'Service Customer' }).ownerAgentId).toBe(serviceAgent.id);
    expect(backend.createSalesOpportunity(bothAgent.id, { accountName: 'Both Sales' }).ownerAgentId).toBe(bothAgent.id);
    expect(backend.createServiceRecord(bothAgent.id, { customerName: 'Both Service' }).ownerAgentId).toBe(bothAgent.id);
    expect(backend.createSalesOpportunity(admin.id, { accountName: 'Admin Sales' }).ownerAgentId).toBe(admin.id);
    expect(backend.createServiceRecord(admin.id, { customerName: 'Admin Service' }).ownerAgentId).toBe(admin.id);
  });

  it('blocks sales visit save when required date or GPS logic is missing', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Metro Lab' });

    expect(() =>
      backend.addSalesVisitUpdate(agent.id, opportunity.id, {
        visitDate: '',
        visitTime: '12:00',
        gps,
        note: 'Met customer',
        nextAction: 'follow_up_needed',
        photos: [],
      }),
    ).toThrow(/Visit date is required/);

    expect(() =>
      backend.addSalesVisitUpdate(agent.id, opportunity.id, {
        visitDate: '2026-06-07',
        visitTime: '12:00',
        gps: undefined,
        note: 'Met customer',
        nextAction: 'follow_up_needed',
        photos: [],
      }),
    ).toThrow(/GPS location is required/);

    expect(() =>
      backend.addSalesVisitUpdate(agent.id, opportunity.id, {
        visitDate: '2026-06-07',
        visitTime: '12:00',
        gps,
        note: 'Met customer',
        nextAction: 'follow_up_needed',
        photos: [],
      }),
    ).toThrow(/Follow-up date is required/);
  });

  it('saves repeated service visits as separate service updates under one service record', () => {
    const backend = createCrystalBioBackend();
    const engineer = backend.createAgent({ name: 'Meera', role: 'service' });
    const record = backend.createServiceRecord(engineer.id, {
      customerName: 'Apollo Diagnostics',
      phone: '8888888888',
      equipmentName: 'HPLC',
      serialNumber: 'HPLC-01',
    });

    const first = backend.addServiceVisitUpdate(engineer.id, record.id, {
      visitDate: '2026-06-07',
      visitTime: '10:00',
      gps,
      serviceType: 'breakdown',
      workDone: 'Diagnosed pump issue',
      supportRequired: true,
      nextAction: 'parts_required',
      nextVisitDate: '2026-06-11',
      photos: [{ source: 'camera', fileName: 'pump.jpg' }],
    });
    const second = backend.addServiceVisitUpdate(engineer.id, record.id, {
      visitDate: '2026-06-11',
      visitTime: '14:15',
      gps,
      serviceType: 'repair',
      workDone: 'Replaced part and tested',
      supportRequired: false,
      nextAction: 'closed',
      photos: [{ source: 'upload', fileName: 'service-report.pdf' }],
    });

    expect(first.visitNumber).toBe(1);
    expect(second.visitNumber).toBe(2);
    expect(backend.getServiceRecord(record.id).visits).toHaveLength(2);
  });

  it('deduplicates exact service visit resubmits but keeps different-time visits separate', () => {
    const backend = createCrystalBioBackend();
    const engineer = backend.createAgent({ name: 'Meera', role: 'service' });
    const record = backend.createServiceRecord(engineer.id, { customerName: 'Apollo Diagnostics' });
    const input = {
      visitDate: '2026-06-07',
      visitTime: '10:00',
      gps,
      serviceType: 'breakdown' as const,
      workDone: 'Diagnosed pump issue',
      supportRequired: false,
      nextAction: 'no_follow_up' as const,
      photos: [],
    };

    const first = backend.addServiceVisitUpdate(engineer.id, record.id, input);
    const exactDuplicate = backend.addServiceVisitUpdate(engineer.id, record.id, { ...input });
    const laterVisit = backend.addServiceVisitUpdate(engineer.id, record.id, { ...input, visitTime: '15:00' });

    expect(exactDuplicate.id).toBe(first.id);
    expect(laterVisit.id).not.toBe(first.id);
    expect(backend.getServiceRecord(record.id).visits).toHaveLength(2);
  });

  it('blocks another agent from editing or adding visits to someone else’s service record', () => {
    const backend = createCrystalBioBackend();
    const owner = backend.createAgent({ name: 'Meera', role: 'service' });
    const otherEngineer = backend.createAgent({ name: 'Sanjay', role: 'service' });
    const record = backend.createServiceRecord(owner.id, {
      customerName: 'Apollo Diagnostics',
      equipmentName: 'HPLC',
    });

    expect(() =>
      backend.updateServiceRecord(otherEngineer.id, record.id, {
        serialNumber: 'HACKED-01',
      }),
    ).toThrow(/Only the owning agent or admin can update this service record/);

    expect(() =>
      backend.addServiceVisitUpdate(otherEngineer.id, record.id, {
        visitDate: '2026-06-11',
        visitTime: '14:15',
        gps,
        serviceType: 'repair',
        workDone: 'Changed someone else record',
        supportRequired: false,
        nextAction: 'closed',
        photos: [],
      }),
    ).toThrow(/Only the owning agent or admin can add service visits to this record/);

    expect(backend.getServiceRecord(record.id).serialNumber).toBeUndefined();
    expect(backend.getServiceRecord(record.id).visits).toHaveLength(0);
  });

  it('allows admin to correct service record details without changing ownership', () => {
    const backend = createCrystalBioBackend();
    const owner = backend.createAgent({ name: 'Meera', role: 'service' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const record = backend.createServiceRecord(owner.id, {
      customerName: 'Apollo Diagnostics',
      equipmentName: 'HPLC',
    });

    const updated = backend.updateServiceRecord(admin.id, record.id, {
      serialNumber: 'HPLC-01',
      ownerAgentId: admin.id,
      visits: [],
    } as any);

    expect(updated.serialNumber).toBe('HPLC-01');
    expect(updated.ownerAgentId).toBe(owner.id);
    expect(updated.visits).toHaveLength(0);
  });

  it('generates daily report counts per agent across attendance sales and service', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'both' });
    backend.checkIn(agent.id, { timestamp: '2026-06-07T09:00:00.000Z', gps });
    backend.checkOut(agent.id, { timestamp: '2026-06-07T18:00:00.000Z', gps });
    const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
    backend.addSalesVisitUpdate(agent.id, opportunity.id, {
      visitDate: '2026-06-07',
      visitTime: '11:18',
      gps,
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
      photos: [],
    });
    const serviceRecord = backend.createServiceRecord(agent.id, { customerName: 'Apollo Diagnostics', equipmentName: 'HPLC' });
    backend.addServiceVisitUpdate(agent.id, serviceRecord.id, {
      visitDate: '2026-06-07',
      visitTime: '14:20',
      gps,
      serviceType: 'preventive_maintenance',
      workDone: 'PM completed',
      supportRequired: false,
      nextAction: 'closed',
      photos: [],
    });

    const report = backend.getDailyAgentReport(agent.id, '2026-06-07');

    expect(report.agentName).toBe('Rahul');
    expect(report.role).toBe('both');
    expect(report.attendanceStatus).toBe('checked_out');
    expect(report.salesVisitCount).toBe(1);
    expect(report.serviceVisitCount).toBe(1);
    expect(report.followUpsDue).toEqual([]);

    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const adminReport = backend.getAdminReport(admin.id, { fromDate: '2026-06-07', toDate: '2026-06-07' });
    expect(adminReport.agentSummaries.find((summary) => summary.agentId === agent.id)?.role).toBe('both');
  });
});
