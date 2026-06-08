import { describe, expect, it, vi } from 'vitest';
import { createCrystalBioFrontendApi } from './crystalBioFrontendApi';

describe('CrystalBio frontend API client', () => {
  it('logs in and checks in against configured backend URL', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        attendance: {
          id: 'attendance_1',
          agentId: 'agent_2',
          agentName: 'Rahul Sales',
          date: '2026-06-08',
          checkInTime: '2026-06-08T09:00:00.000Z',
          checkInGps: { latitude: 12.9716, longitude: 77.5946 },
          status: 'checked_in',
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const api = createCrystalBioFrontendApi({
      baseUrl: 'http://127.0.0.1:8787/',
      fetcher,
      now: () => new Date('2026-06-08T09:00:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login('agent_2');
    const attendance = await api.checkIn(session);

    expect(session.agentName).toBe('Rahul Sales');
    expect(attendance.status).toBe('checked_in');
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8787/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/attendance/check-in',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
      }),
    );
  });

  it('checks out against configured backend URL and normalizes backend timestamp fields', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        attendance: {
          id: 'attendance_1',
          agentId: 'agent_2',
          agentName: 'Rahul Sales',
          date: '2026-06-08',
          checkInAt: '2026-06-08T09:00:00.000Z',
          checkInGps: { latitude: 12.9716, longitude: 77.5946 },
          checkOutAt: '2026-06-08T18:00:00.000Z',
          checkOutGps: { latitude: 12.9716, longitude: 77.5946 },
          status: 'checked_out',
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const api = createCrystalBioFrontendApi({
      baseUrl: 'http://127.0.0.1:8787',
      fetcher,
      now: () => new Date('2026-06-08T18:00:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login('agent_2');
    const attendance = await api.checkOut(session);

    expect(attendance.status).toBe('checked_out');
    expect(attendance.checkInTime).toBe('2026-06-08T09:00:00.000Z');
    expect(attendance.checkOutTime).toBe('2026-06-08T18:00:00.000Z');
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/attendance/check-out',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps GitHub Pages preview usable with demo fallback when no backend URL is configured', async () => {
    const api = createCrystalBioFrontendApi({
      now: () => new Date('2026-06-08T09:00:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login();
    const attendance = await api.checkIn(session);

    expect(session.agentName).toBe('Rahul Sales');
    expect(attendance.status).toBe('checked_in');
    expect(api.isDemoCheckedIn()).toBe(true);
  });

  it('surfaces backend validation errors clearly', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'GPS location is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({ baseUrl: 'http://127.0.0.1:8787', fetcher });

    await expect(api.login('bad-agent')).rejects.toThrow('GPS location is required');
  });

  it('submits leave requests to the configured backend with session authorization', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        leaveRequest: {
          id: 'leave_1',
          agentId: 'agent_2',
          agentName: 'Rahul Sales',
          fromDate: '2026-06-10',
          toDate: '2026-06-11',
          reason: 'Personal work',
          note: 'Family appointment',
          status: 'pending',
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({ baseUrl: 'http://127.0.0.1:8787', fetcher });

    const session = await api.login('agent_2');
    const leaveRequest = await api.submitLeaveRequest(session, {
      fromDate: '2026-06-10',
      toDate: '2026-06-11',
      reason: 'Personal work',
      note: 'Family appointment',
    });

    expect(leaveRequest.status).toBe('pending');
    expect(leaveRequest.note).toBe('Family appointment');
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/leave-requests',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({
          fromDate: '2026-06-10',
          toDate: '2026-06-11',
          reason: 'Personal work',
          note: 'Family appointment',
        }),
      }),
    );
  });

  it('creates a stable demo leave request when no backend URL is configured', async () => {
    const api = createCrystalBioFrontendApi({ now: () => new Date('2026-06-08T09:00:00.000Z') });

    const session = await api.login();
    const leaveRequest = await api.submitLeaveRequest(session, {
      fromDate: '2026-06-12',
      toDate: '2026-06-12',
      reason: 'Sick leave',
    });

    expect(leaveRequest).toMatchObject({
      id: 'demo-leave-1780909200000',
      agentName: 'Rahul Sales',
      fromDate: '2026-06-12',
      toDate: '2026-06-12',
      reason: 'Sick leave',
      status: 'pending',
    });
  });

  it('creates sales opportunity and visit through configured backend with session authorization', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (String(url).endsWith('/sales-opportunities')) {
        return new Response(JSON.stringify({
          opportunity: { id: 'sales_1', ownerAgentId: 'agent_2', accountName: 'Apollo Diagnostics', status: 'open' },
        }), { status: 201, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        visit: {
          id: 'sales_visit_1',
          opportunityId: 'sales_1',
          agentId: 'agent_2',
          agentName: 'Rahul Sales',
          visitNumber: 1,
          visitDate: '2026-06-08',
          visitTime: '11:18',
          gps: { latitude: 12.9716, longitude: 77.5946 },
          note: 'Requirement confirmed',
          nextAction: 'follow_up_needed',
          followUpDate: '2026-06-10',
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({
      baseUrl: 'http://127.0.0.1:8787',
      fetcher,
      now: () => new Date('2026-06-08T11:18:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login('agent_2');
    const saved = await api.submitSalesVisit(session, {
      accountName: 'Apollo Diagnostics',
      contactPerson: 'Lab manager',
      phone: '9876543210',
      requirement: 'Biochemistry analyzer requirement',
      note: 'Requirement confirmed',
      nextAction: 'follow_up_needed',
      followUpDate: '2026-06-10',
    });

    expect(saved.visit.agentName).toBe('Rahul Sales');
    expect(saved.visit.visitNumber).toBe(1);
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/sales-opportunities',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({
          accountName: 'Apollo Diagnostics',
          contactPerson: 'Lab manager',
          phone: '9876543210',
          requirement: 'Biochemistry analyzer requirement',
        }),
      }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/sales-opportunities/sales_1/visits',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({
          visitDate: '2026-06-08',
          visitTime: '11:18',
          gps: { latitude: 12.9716, longitude: 77.5946 },
          note: 'Requirement confirmed',
          nextAction: 'follow_up_needed',
          followUpDate: '2026-06-10',
          photos: [],
        }),
      }),
    );
  });

  it('patches Sales Step 2 and Step 3 through configured backend with session authorization', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (String(url).endsWith('/sales-opportunities/sales_1')) {
        return new Response(JSON.stringify({
          opportunity: { id: 'sales_1', ownerAgentId: 'agent_2', accountName: 'Apollo Diagnostics', email: 'lab@example.com', quoteSubmitted: 'yes', status: 'open' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      throw new Error(`unexpected ${String(url)} ${init?.method}`);
    }) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({ baseUrl: 'http://127.0.0.1:8787', fetcher });
    const session = await api.login('agent_2');

    await api.submitSalesStep2(session, 'sales_1', { accountName: 'Apollo Diagnostics', email: 'lab@example.com', productType: 'Laboratory equipment' });
    await api.submitSalesStep3(session, 'sales_1', { quoteSubmitted: 'yes', officeNotes: 'Prepare quote' });

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/sales-opportunities/sales_1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({ accountName: 'Apollo Diagnostics', email: 'lab@example.com', productType: 'Laboratory equipment' }),
      }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/sales-opportunities/sales_1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({ quoteSubmitted: 'yes', officeNotes: 'Prepare quote' }),
      }),
    );
  });

  it('creates a stable demo sales visit when no backend URL is configured', async () => {
    const api = createCrystalBioFrontendApi({
      now: () => new Date('2026-06-08T11:18:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login();
    const saved = await api.submitSalesVisit(session, {
      accountName: 'Apollo Diagnostics',
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
    });

    expect(saved.opportunity.accountName).toBe('Apollo Diagnostics');
    expect(saved.visit).toMatchObject({
      id: 'demo-sales-visit-1780917480000',
      agentName: 'Rahul Sales',
      visitNumber: 1,
      visitDate: '2026-06-08',
      visitTime: '11:18',
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
    });
  });

  it('requires real browser location in configured backend mode when no GPS provider is injected', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      session: { token: 'token-1', agentId: 'agent_2', agentName: 'Rahul Sales', role: 'sales' },
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({ baseUrl: 'http://127.0.0.1:8787', fetcher });

    const session = await api.login('agent_2');
    await expect(api.submitSalesVisit(session, {
      accountName: 'Apollo Diagnostics',
      note: 'Requirement confirmed',
      nextAction: 'no_follow_up',
    })).rejects.toThrow(/Location permission|Allow location permission/);
  });

  it('creates service record and visit through configured backend with session authorization', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/auth/login')) {
        return new Response(JSON.stringify({
          session: { token: 'token-1', agentId: 'agent_3', agentName: 'Meera Service', role: 'service' },
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (String(url).endsWith('/service-records')) {
        return new Response(JSON.stringify({
          serviceRecord: { id: 'service_1', ownerAgentId: 'agent_3', customerName: 'Metro Lab', equipmentName: 'Centrifuge', serialNumber: 'CB-01', status: 'open' },
        }), { status: 201, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        visit: {
          id: 'service_visit_1',
          serviceRecordId: 'service_1',
          agentId: 'agent_3',
          agentName: 'Meera Service',
          visitNumber: 1,
          visitDate: '2026-06-08',
          visitTime: '14:20',
          gps: { latitude: 12.9716, longitude: 77.5946 },
          serviceType: 'breakdown',
          workDone: 'Diagnosed issue',
          supportRequired: true,
          nextAction: 'parts_required',
          nextVisitDate: '2026-06-09',
          officeNotes: 'Share parts availability with office.',
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const api = createCrystalBioFrontendApi({
      baseUrl: 'http://127.0.0.1:8787',
      fetcher,
      now: () => new Date('2026-06-08T14:20:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login('agent_3');
    const saved = await api.submitServiceVisit(session, {
      customerName: 'Metro Lab',
      phone: '9876543210',
      equipmentName: 'Centrifuge',
      serialNumber: 'CB-01',
      serviceType: 'breakdown',
      workDone: 'Diagnosed issue',
      supportRequired: true,
      nextAction: 'parts_required',
      nextVisitDate: '2026-06-09',
      officeNotes: 'Share parts availability with office.',
    });

    expect(saved.visit.agentName).toBe('Meera Service');
    expect(saved.visit.visitNumber).toBe(1);
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/service-records',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({
          customerName: 'Metro Lab',
          phone: '9876543210',
          equipmentName: 'Centrifuge',
          serialNumber: 'CB-01',
        }),
      }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/service-records/service_1/visits',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-1' }),
        body: JSON.stringify({
          visitDate: '2026-06-08',
          visitTime: '14:20',
          gps: { latitude: 12.9716, longitude: 77.5946 },
          serviceType: 'breakdown',
          workDone: 'Diagnosed issue',
          supportRequired: true,
          nextAction: 'parts_required',
          nextVisitDate: '2026-06-09',
          photos: [],
          officeNotes: 'Share parts availability with office.',
        }),
      }),
    );
  });

  it('creates a stable demo service visit when no backend URL is configured', async () => {
    const api = createCrystalBioFrontendApi({
      now: () => new Date('2026-06-08T14:20:00.000Z'),
      gpsProvider: async () => ({ latitude: 12.9716, longitude: 77.5946 }),
    });

    const session = await api.login('agent_3');
    const saved = await api.submitServiceVisit(session, {
      customerName: 'Metro Lab',
      equipmentName: 'Centrifuge',
      serialNumber: 'CB-01',
      serviceType: 'breakdown',
      workDone: 'Diagnosed issue',
      supportRequired: true,
      nextAction: 'parts_required',
      nextVisitDate: '2026-06-09',
    });

    expect(saved.serviceRecord.customerName).toBe('Metro Lab');
    expect(saved.visit).toMatchObject({
      id: 'demo-service-visit-1780928400000',
      agentName: 'Meera Service',
      visitNumber: 1,
      visitDate: '2026-06-08',
      visitTime: '14:20',
      serviceType: 'breakdown',
      workDone: 'Diagnosed issue',
      nextAction: 'parts_required',
    });
  });
});
