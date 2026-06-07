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
    expect(report.attendanceStatus).toBe('checked_out');
    expect(report.salesVisitCount).toBe(1);
    expect(report.serviceVisitCount).toBe(1);
    expect(report.followUpsDue).toEqual([]);
  });
});
