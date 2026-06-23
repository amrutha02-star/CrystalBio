import { describe, expect, it } from 'vitest';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioApi } from './crystalBioApi';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };
const password = 'pilot-test-password';
const createLoginAgent = (backend: ReturnType<typeof createCrystalBioBackend>, input: Parameters<ReturnType<typeof createCrystalBioBackend>['createAgent']>[0]) =>
  backend.createAgent({ ...input, email: input.email ?? `${input.name.toLowerCase().replace(/\s+/g, '.')}@crystalbio.in`, password });
const loginToken = (api: ReturnType<typeof createCrystalBioApi>, email: string) =>
  api.handle({ method: 'POST', path: '/auth/login', body: { email, password } }).body.session.token;

describe('CrystalBio API layer', () => {
  it('logs in an agent and uses session identity for attendance', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul@crystalbio.in' });
    const api = createCrystalBioApi(backend);

    const login = api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password } });
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

  it('returns current checked-in attendance for saved-session reloads', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul.current@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const token = loginToken(api, agent.email!);

    api.handle({
      method: 'POST',
      path: '/attendance/check-in',
      headers: { authorization: `Bearer ${token}` },
      body: { timestamp: new Date().toISOString(), gps, workTypes: ['Sales visit'] },
    });

    const current = api.handle({
      method: 'GET',
      path: '/attendance/current',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(current.status).toBe(200);
    expect(current.body.attendance.status).toBe('checked_in');
    expect(current.body.attendance.agentId).toBe(agent.id);
  });

  it('accepts credential login and rejects bad credential login through auth API', () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales', employeeId: 'CB-S-014', email: 'rahul.sales@crystalbio.in', password });
    const api = createCrystalBioApi(backend);

    const login = api.handle({ method: 'POST', path: '/auth/login', body: { email: 'rahul.sales@crystalbio.in', password } });
    const failed = api.handle({ method: 'POST', path: '/auth/login', body: { email: 'rahul.sales@crystalbio.in', password: 'wrong-password' } });

    expect(login.status).toBe(200);
    expect(login.body.session.agentId).toBe(agent.id);
    expect(failed.status).toBe(400);
    expect(failed.body.error).toBe('Invalid email or password');
  });

  it('records login activity for Bloom without storing passwords', () => {
    const backend = createCrystalBioBackend();
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin.loginlog@crystalbio.in' });
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul.loginlog@crystalbio.in' });
    const events: any[] = [];
    const api = createCrystalBioApi(backend, {
      loginActivityLogStore: {
        add(event) { events.push(event); },
        list(limit = 100) { return events.slice(-limit).reverse(); },
      },
    });

    const success = api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password } });
    const failed = api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password: 'wrong-password' } });
    const adminToken = api.handle({ method: 'POST', path: '/auth/login', body: { email: admin.email, password } }).body.session.token;
    const activity = api.handle({ method: 'GET', path: '/admin/login-activity?limit=10', headers: { authorization: `Bearer ${adminToken}` } });

    expect(success.status).toBe(200);
    expect(failed.status).toBe(400);
    expect(activity.status).toBe(200);
    expect(activity.body.events.some((event: any) => event.success && event.agentName === 'Rahul')).toBe(true);
    expect(activity.body.events.some((event: any) => !event.success && event.email === agent.email)).toBe(true);
    expect(JSON.stringify(activity.body.events)).not.toContain('wrong-password');
  });

  it('serves a no-credentials monitor snapshot with masked login emails', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul.publicmonitor@crystalbio.in' });
    const errors: any[] = [];
    const logins: any[] = [];
    const api = createCrystalBioApi(backend, {
      loginActivityLogStore: {
        add(event) { logins.push(event); },
        list(limit = 100) { return logins.slice(-limit).reverse(); },
      },
      clientErrorLogStore: {
        add(event) { errors.push(event); },
        list(limit = 50) { return errors.slice(-limit).reverse(); },
      },
    });

    api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password } });
    api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password: 'wrong-password' } });
    api.handle({ method: 'POST', path: '/client-error-logs', body: { severity: 'high', journey: 'App screen error', message: 'Save failed', path: '/sales' } });

    const monitor = api.handle({ method: 'GET', path: '/public/monitor' });

    expect(monitor.status).toBe(200);
    expect(monitor.body.loginActivity).toHaveLength(2);
    expect(monitor.body.clientErrors).toHaveLength(1);
    expect(JSON.stringify(monitor.body)).toContain('ra…r@crystalbio.in');
    expect(JSON.stringify(monitor.body)).not.toContain('rahul.publicmonitor@crystalbio.in');
    expect(JSON.stringify(monitor.body)).not.toContain('Rahul');
    expect(JSON.stringify(monitor.body)).not.toContain('wrong-password');
  });

  it('validates saved sessions against the live backend before trusting stored profile data', () => {
    const backend = createCrystalBioBackend();
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin.session@crystalbio.in' });
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul.session@crystalbio.in' });
    const api = createCrystalBioApi(backend);

    const agentToken = loginToken(api, agent.email!);
    const validated = api.handle({ method: 'GET', path: '/auth/session', headers: { authorization: `Bearer ${agentToken}` } });
    expect(validated.status).toBe(200);
    expect(validated.body.session.agentName).toBe('Rahul');
    expect(validated.body.session.email).toBe('rahul.session@crystalbio.in');

    const adminToken = loginToken(api, admin.email!);
    const deactivated = api.handle({
      method: 'PATCH',
      path: `/admin/agents/${agent.id}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { active: false },
    });
    expect(deactivated.status).toBe(200);

    const rejected = api.handle({ method: 'GET', path: '/auth/session', headers: { authorization: `Bearer ${agentToken}` } });
    expect(rejected.status).toBe(401);
    expect(rejected.body.error).toBe('Login session is required');
  });


  it('rejects public agent-id login and requires credentials at the API boundary', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul.secure@crystalbio.in' });
    const api = createCrystalBioApi(backend);

    const blocked = api.handle({ method: 'POST', path: '/auth/login', body: { agentId: agent.id } });
    const allowed = api.handle({ method: 'POST', path: '/auth/login', body: { email: agent.email, password } });

    expect(blocked.status).toBe(400);
    expect(blocked.body.error).toBe('Email and password login is required');
    expect(allowed.status).toBe(200);
  });

  it('lets admin create an invite and activates the profile only after password setup', () => {
    const backend = createCrystalBioBackend();
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin.invite@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const adminToken = loginToken(api, admin.email!);

    const invite = api.handle({
      method: 'POST',
      path: '/admin/agents',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'New Sales', role: 'sales', employeeId: 'CB-S-099', email: 'new.sales@crystalbio.in', mobile: '+91 99999 99999' },
    });
    expect(invite.status).toBe(201);
    expect(invite.body.agent.active).toBe(false);
    expect(invite.body.agent.inviteStatus).toBe('pending');

    const beforeSetup = api.handle({ method: 'POST', path: '/auth/login', body: { email: 'new.sales@crystalbio.in', password: 'NewPassword123' } });
    expect(beforeSetup.status).toBe(400);

    const setup = api.handle({ method: 'POST', path: '/auth/setup-password', body: { inviteToken: invite.body.agent.inviteToken, password: 'NewPassword123' } });
    expect(setup.status).toBe(200);
    expect(setup.body.agent.active).toBe(true);

    const login = api.handle({ method: 'POST', path: '/auth/login', body: { email: 'new.sales@crystalbio.in', password: 'NewPassword123' } });
    expect(login.status).toBe(200);
    expect(login.body.session.agentName).toBe('New Sales');
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
    const agent = createLoginAgent(backend, { name: 'Meera', role: 'service', email: 'meera@crystalbio.in' });
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const agentToken = loginToken(api, agent.email!);
    const adminToken = loginToken(api, admin.email!);

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

    const approvals = api.handle({
      method: 'GET',
      path: '/admin/leave-requests',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(approvals.status).toBe(200);
    expect(approvals.body.leaveRequests).toHaveLength(1);
    expect(approvals.body.leaveRequests[0].status).toBe('approved');
  });

  it('rejects invalid leave review status values', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Meera', role: 'service', email: 'meera@crystalbio.in' });
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const agentToken = loginToken(api, agent.email!);
    const adminToken = loginToken(api, admin.email!);
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
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const token = loginToken(api, agent.email!);

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
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const token = loginToken(api, agent.email!);

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

    const step2 = api.handle({
      method: 'PATCH',
      path: `/sales-opportunities/${opportunity.body.opportunity.id}`,
      headers: { authorization: `Bearer ${token}` },
      body: { email: 'lab@example.com', leadSource: 'Field visit', productType: 'Laboratory equipment', step2Saved: true },
    });
    expect(step2.status).toBe(200);
    expect(step2.body.opportunity.email).toBe('lab@example.com');
    expect(step2.body.opportunity.step2Saved).toBe(true);

    const step3 = api.handle({
      method: 'PATCH',
      path: `/sales-opportunities/${opportunity.body.opportunity.id}`,
      headers: { authorization: `Bearer ${token}` },
      body: { quoteSubmitted: 'yes', quoteStatus: 'Quote pending', officeNotes: 'Prepare quote', step3Saved: true },
    });
    expect(step3.status).toBe(200);
    expect(step3.body.opportunity.quoteStatus).toBe('Quote pending');
    expect(step3.body.opportunity.step3Saved).toBe(true);
    expect(backend.getSalesOpportunity(opportunity.body.opportunity.id).visits).toHaveLength(1);
  });

  it('creates service record and visit update using logged-in engineer identity', () => {
    const backend = createCrystalBioBackend();
    const engineer = createLoginAgent(backend, { name: 'Meera', role: 'service', email: 'meera@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const token = loginToken(api, engineer.email!);

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

    const step2 = api.handle({
      method: 'PATCH',
      path: `/service-records/${record.body.serviceRecord.id}`,
      headers: { authorization: `Bearer ${token}` },
      body: { issueDescription: 'Noise during spin cycle', step2Saved: true },
    });
    expect(step2.status).toBe(200);
    expect(step2.body.serviceRecord.issueDescription).toBe('Noise during spin cycle');
    expect(step2.body.serviceRecord.step2Saved).toBe(true);
  });

  it('requires logged-in owner or admin identity to patch service record details', () => {
    const backend = createCrystalBioBackend();
    const owner = createLoginAgent(backend, { name: 'Meera', role: 'service', email: 'meera@crystalbio.in' });
    const otherEngineer = createLoginAgent(backend, { name: 'Sanjay', role: 'service', email: 'sanjay@crystalbio.in' });
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const ownerToken = loginToken(api, owner.email!);
    const otherToken = loginToken(api, otherEngineer.email!);
    const adminToken = loginToken(api, admin.email!);
    const record = api.handle({
      method: 'POST',
      path: '/service-records',
      headers: { authorization: `Bearer ${ownerToken}` },
      body: { customerName: 'Metro Lab', equipmentName: 'Centrifuge' },
    });

    const unauthenticated = api.handle({
      method: 'PATCH',
      path: `/service-records/${record.body.serviceRecord.id}`,
      body: { serialNumber: 'OPEN-ACCESS' },
    });
    expect(unauthenticated.status).toBe(401);

    const blocked = api.handle({
      method: 'PATCH',
      path: `/service-records/${record.body.serviceRecord.id}`,
      headers: { authorization: `Bearer ${otherToken}` },
      body: { serialNumber: 'OTHER-USER' },
    });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error).toBe('Only the owning agent or admin can update this service record');

    const ownerPatch = api.handle({
      method: 'PATCH',
      path: `/service-records/${record.body.serviceRecord.id}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      body: { serialNumber: 'CB-01' },
    });
    expect(ownerPatch.status).toBe(200);
    expect(ownerPatch.body.serviceRecord.serialNumber).toBe('CB-01');

    const adminPatch = api.handle({
      method: 'PATCH',
      path: `/service-records/${record.body.serviceRecord.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { machineStatus: 'Office reviewed' },
    });
    expect(adminPatch.status).toBe(200);
    expect(adminPatch.body.serviceRecord.machineStatus).toBe('Office reviewed');
  });

  it('returns admin report only for admin sessions', () => {
    const backend = createCrystalBioBackend();
    const agent = createLoginAgent(backend, { name: 'Rahul', role: 'sales', email: 'rahul@crystalbio.in' });
    const admin = createLoginAgent(backend, { name: 'Admin User', role: 'admin', email: 'admin@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const agentToken = loginToken(api, agent.email!);
    const adminToken = loginToken(api, admin.email!);

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

  it('keeps admin-submitted field visits visible after refresh', () => {
    const backend = createCrystalBioBackend();
    const admin = createLoginAgent(backend, { name: 'Raghavendra', role: 'admin', email: 'raghavendra@crystalbio.in' });
    const salesAgent = createLoginAgent(backend, { name: 'Manjunath', role: 'sales', email: 'manjunath@crystalbio.in' });
    const api = createCrystalBioApi(backend);
    const adminToken = loginToken(api, admin.email!);
    const salesToken = loginToken(api, salesAgent.email!);

    const agentOpportunity = api.handle({
      method: 'POST',
      path: '/sales-opportunities',
      headers: { authorization: `Bearer ${salesToken}` },
      body: { accountName: 'Agent Field Customer' },
    });
    api.handle({
      method: 'POST',
      path: `/sales-opportunities/${agentOpportunity.body.opportunity.id}/visits`,
      headers: { authorization: `Bearer ${salesToken}` },
      body: {
        visitDate: '2026-06-07',
        visitTime: '10:20',
        gps,
        note: 'Agent did field visit',
        nextAction: 'follow_up_needed',
        followUpDate: '2026-06-09',
        photos: [],
      },
    });

    const opportunity = api.handle({
      method: 'POST',
      path: '/sales-opportunities',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { accountName: 'Admin Field Customer' },
    });
    const visit = api.handle({
      method: 'POST',
      path: `/sales-opportunities/${opportunity.body.opportunity.id}/visits`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        visitDate: '2026-06-07',
        visitTime: '16:10',
        gps,
        note: 'Admin did field visit',
        nextAction: 'no_follow_up',
        photos: [{ source: 'upload', fileName: 'field-proof.jpg', contentType: 'image/jpeg', sizeBytes: 280000, dataUrl: 'data:image/jpeg;base64,large-proof-payload' }],
      },
    });
    expect(visit.status).toBe(201);
    const followUpVisit = api.handle({
      method: 'POST',
      path: `/sales-opportunities/${opportunity.body.opportunity.id}/visits`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        visitDate: '2026-06-07',
        visitTime: '17:10',
        gps,
        note: 'Follow-up on same saved form',
        nextAction: 'follow_up_needed',
        followUpDate: '2026-06-08',
        photos: [],
      },
    });
    expect(followUpVisit.status).toBe(201);

    const recentVisits = api.handle({
      method: 'GET',
      path: '/field-visits',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(recentVisits.status).toBe(200);
    expect(recentVisits.body.entries).toHaveLength(1);
    expect(recentVisits.body.entries[0]).toMatchObject({
      recordId: opportunity.body.opportunity.id,
      customer: 'Admin Field Customer',
      type: 'Sales',
      agentId: admin.id,
      agentName: 'Raghavendra',
      visitDate: '2026-06-07',
      visitTime: '17:10',
    });
    expect(recentVisits.body.entries.filter((entry: { recordId: string }) => entry.recordId === opportunity.body.opportunity.id)).toHaveLength(1);
    expect(recentVisits.body.entries[0].detailRows).toEqual(expect.arrayContaining([
      { label: 'Submitted by', value: 'Raghavendra' },
      { label: 'Customer', value: 'Admin Field Customer' },
      { label: 'Visit note', value: 'Follow-up on same saved form' },
      { label: 'Next action', value: 'Follow-up needed' },
    ]));
    expect(recentVisits.body.entries[0].photoPayload).toBeUndefined();

    const recentVisitDetail = api.handle({
      method: 'GET',
      path: `/field-visits?entryId=${visit.body.visit.id}&includePayload=true`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(recentVisitDetail.status).toBe(200);
    expect(recentVisitDetail.body.entries).toHaveLength(1);
    expect(recentVisitDetail.body.entries[0].photoPayload).toContain('field-proof.jpg');
    expect(recentVisitDetail.body.entries[0].photoPayload).toContain('large-proof-payload');

    const teamRecentVisits = api.handle({
      method: 'GET',
      path: '/field-visits?scope=team',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(teamRecentVisits.status).toBe(200);
    expect(teamRecentVisits.body.entries.some((entry: { agentName: string; customer: string }) => entry.agentName === 'Raghavendra' && entry.customer === 'Admin Field Customer')).toBe(true);
    expect(teamRecentVisits.body.entries.some((entry: { agentName: string; customer: string }) => entry.agentName === 'Manjunath' && entry.customer === 'Agent Field Customer')).toBe(true);

    const report = api.handle({
      method: 'GET',
      path: '/admin/reports?fromDate=2026-06-07&toDate=2026-06-07',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(report.body.report.agentSummaries.find((summary: { agentName: string }) => summary.agentName === 'Raghavendra').salesVisitCount).toBe(2);
  });
});
