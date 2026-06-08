import { describe, expect, it } from 'vitest';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioApi } from './crystalBioApi';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

describe('CrystalBio API layer', () => {
  it('logs in an agent and uses session identity for attendance', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const api = createCrystalBioApi(backend);

    const login = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } });
    expect(login.status).toBe(200);
    const token = login.body.session.token;

    const checkIn = api.handle({
      method: 'POST',
      path: '/attendance/check-in',
      headers: { authorization: `Bearer ${token}` },
      body: { timestamp: '2026-06-07T09:00:00.000Z', gps },
    });

    expect(checkIn.status).toBe(201);
    expect(checkIn.body.attendance.agentName).toBe('Rahul');
    expect(checkIn.body.attendance.agentId).toBe(agent.id);
  });

  it('blocks protected routes without a valid session token', () => {
    const api = createCrystalBioApi(createCrystalBioBackend());

    const response = api.handle({
      method: 'POST',
      path: '/attendance/check-in',
      body: { timestamp: '2026-06-07T09:00:00.000Z', gps },
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Login session is required');
  });

  it('submits and admin-reviews leave requests through API routes', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Meera', role: 'service' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const api = createCrystalBioApi(backend);
    const agentToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } }).body.session.token;
    const adminToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: admin.id } }).body.session.token;

    const leave = api.handle({
      method: 'POST',
      path: '/leave-requests',
      headers: { authorization: `Bearer ${agentToken}` },
      body: { fromDate: '2026-06-09', toDate: '2026-06-10', reason: 'Family function', note: 'Out of station' },
    });

    expect(leave.status).toBe(201);
    expect(leave.body.leaveRequest.status).toBe('pending');
    expect(leave.body.leaveRequest.note).toBe('Out of station');

    const reviewed = api.handle({
      method: 'PATCH',
      path: `/leave-requests/${leave.body.leaveRequest.id}/review`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { status: 'approved' },
    });

    expect(reviewed.status).toBe(200);
    expect(reviewed.body.leaveRequest.status).toBe('approved');
  });

  it('rejects invalid leave review status values', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Meera', role: 'service' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const api = createCrystalBioApi(backend);
    const agentToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } }).body.session.token;
    const adminToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: admin.id } }).body.session.token;
    const leave = api.handle({
      method: 'POST',
      path: '/leave-requests',
      headers: { authorization: `Bearer ${agentToken}` },
      body: { fromDate: '2026-06-09', toDate: '2026-06-10', reason: 'Family function' },
    });

    const reviewed = api.handle({
      method: 'PATCH',
      path: `/leave-requests/${leave.body.leaveRequest.id}/review`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { status: 'pending' },
    });

    expect(reviewed.status).toBe(400);
    expect(reviewed.body.error).toBe('Leave review status must be approved or rejected');
  });

  it('returns validation errors instead of 500 when request body is missing', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const api = createCrystalBioApi(backend);
    const token = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } }).body.session.token;

    const response = api.handle({
      method: 'POST',
      path: '/attendance/check-in',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Request body is required');
  });

  it('creates sales opportunity and visit update using logged-in agent identity', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const api = createCrystalBioApi(backend);
    const token = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } }).body.session.token;

    const opportunity = api.handle({
      method: 'POST',
      path: '/sales-opportunities',
      headers: { authorization: `Bearer ${token}` },
      body: { accountName: 'Apollo Diagnostics', contactPerson: 'Lab manager' },
    });
    expect(opportunity.status).toBe(201);

    const visit = api.handle({
      method: 'POST',
      path: `/sales-opportunities/${opportunity.body.opportunity.id}/visits`,
      headers: { authorization: `Bearer ${token}` },
      body: {
        visitDate: '2026-06-07',
        visitTime: '11:18',
        gps,
        note: 'Requirement confirmed',
        nextAction: 'follow_up_needed',
        followUpDate: '2026-06-10',
        photos: [{ source: 'camera', fileName: 'quote-board.jpg' }],
      },
    });

    expect(visit.status).toBe(201);
    expect(visit.body.visit.agentName).toBe('Rahul');
    expect(visit.body.visit.visitNumber).toBe(1);
  });

  it('creates service record and visit update using logged-in engineer identity', () => {
    const backend = createCrystalBioBackend();
    const engineer = backend.createAgent({ name: 'Meera', role: 'service' });
    const api = createCrystalBioApi(backend);
    const token = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: engineer.id } }).body.session.token;

    const record = api.handle({
      method: 'POST',
      path: '/service-records',
      headers: { authorization: `Bearer ${token}` },
      body: { customerName: 'Metro Lab', equipmentName: 'Centrifuge', serialNumber: 'CB-01' },
    });
    expect(record.status).toBe(201);

    const visit = api.handle({
      method: 'POST',
      path: `/service-records/${record.body.serviceRecord.id}/visits`,
      headers: { authorization: `Bearer ${token}` },
      body: {
        visitDate: '2026-06-07',
        visitTime: '14:20',
        gps,
        serviceType: 'breakdown',
        workDone: 'Diagnosed issue',
        supportRequired: true,
        nextAction: 'parts_required',
        nextVisitDate: '2026-06-09',
        photos: [{ source: 'camera', fileName: 'machine.jpg' }],
      },
    });

    expect(visit.status).toBe(201);
    expect(visit.body.visit.agentName).toBe('Meera');
    expect(visit.body.visit.visitNumber).toBe(1);
  });

  it('returns admin report only for admin sessions', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
    const api = createCrystalBioApi(backend);
    const agentToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } }).body.session.token;
    const adminToken = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: admin.id } }).body.session.token;

    const blocked = api.handle({
      method: 'GET',
      path: '/admin/reports?fromDate=2026-06-01&toDate=2026-06-30',
      headers: { authorization: `Bearer ${agentToken}` },
    });
    expect(blocked.status).toBe(403);

    const allowed = api.handle({
      method: 'GET',
      path: '/admin/reports?fromDate=2026-06-01&toDate=2026-06-30',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(allowed.status).toBe(200);
    expect(allowed.body.report.totals.salesVisits).toBe(0);
  });
});
