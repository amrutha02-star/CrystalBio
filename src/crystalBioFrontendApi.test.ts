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
});
