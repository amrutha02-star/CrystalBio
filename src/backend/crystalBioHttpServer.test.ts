import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createCrystalBioApi } from './crystalBioApi';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioHttpServer } from './crystalBioHttpServer';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

const servers: ReturnType<typeof createCrystalBioHttpServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.map((server) => server.close()));
  servers.length = 0;
});

describe('CrystalBio HTTP server adapter', () => {
  it('serves real HTTP requests for login and attendance', async () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend));
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId: agent.id }),
    });
    const login = await loginResponse.json();

    expect(loginResponse.status).toBe(200);
    expect(login.session.agentName).toBe('Rahul');

    const checkInResponse = await fetch(`${baseUrl}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${login.session.token}`,
      },
      body: JSON.stringify({ timestamp: '2026-06-07T09:00:00.000Z', gps }),
    });
    const checkIn = await checkInResponse.json();

    expect(checkInResponse.status).toBe(201);
    expect(checkIn.attendance.agentName).toBe('Rahul');

    const checkOutResponse = await fetch(`${baseUrl}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${login.session.token}`,
      },
      body: JSON.stringify({ timestamp: '2026-06-07T18:00:00.000Z', gps }),
    });
    const checkOut = await checkOutResponse.json();

    expect(checkOutResponse.status).toBe(200);
    expect(checkOut.attendance.status).toBe('checked_out');
  });

  it('returns clean JSON errors for malformed JSON', async () => {
    const backend = createCrystalBioBackend();
    backend.createAgent({ name: 'Rahul', role: 'sales' });
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend));
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${address.port}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Malformed JSON body');
  });

  it('handles browser CORS preflight requests', async () => {
    const backend = createCrystalBioBackend();
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend), {
      allowedOrigin: 'https://client.example.com',
    });
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${address.port}/attendance/check-in`, {
      method: 'OPTIONS',
      headers: { origin: 'https://client.example.com' },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://client.example.com');
    expect(response.headers.get('access-control-allow-headers')).toContain('authorization');
  });

  it('exposes a health check for hosting uptime monitors', async () => {
    const backend = createCrystalBioBackend();
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend));
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });
});
