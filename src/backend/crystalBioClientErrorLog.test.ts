import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createCrystalBioApi } from './crystalBioApi';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioHttpServer } from './crystalBioHttpServer';

const servers: ReturnType<typeof createCrystalBioHttpServer>[] = [];
const password = 'pilot-test-password';

afterEach(async () => {
  await Promise.all(servers.map((server) => server.close()));
  servers.length = 0;
});

describe('CrystalBio live user error logging', () => {
  it('accepts sanitized client-side error reports and lets admins read them for Bloom monitoring', async () => {
    const backend = createCrystalBioBackend();
    const admin = backend.createAgent({ name: 'Admin User', role: 'admin', email: 'admin@crystalbio.in', password });
    const agent = backend.createAgent({ name: 'Field User', role: 'sales', email: 'field@crystalbio.in', password });
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend));
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const agentLoginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: agent.email, password }),
    });
    const agentLogin = await agentLoginResponse.json();

    const reportResponse = await fetch(`${baseUrl}/client-error-logs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${agentLogin.session.token}`,
      },
      body: JSON.stringify({
        type: 'api_error',
        severity: 'high',
        journey: 'Sales Step 1 save',
        message: 'Save failed with HTTP 500',
        path: '/sales-opportunities',
        status: 500,
        pageUrl: 'https://work.convogenie.ai/visits',
        userAgent: 'Mobile Safari',
        extraPrivateDataThatMustNotPersist: 'secret',
      }),
    });

    expect(reportResponse.status).toBe(201);
    const report = await reportResponse.json();
    expect(report.logged).toBe(true);
    expect(report.event.id).toMatch(/^client-error-/);
    expect(report.event.agentName).toBe('Field User');
    expect(report.event.extraPrivateDataThatMustNotPersist).toBeUndefined();

    const adminLogin = backend.login(admin.id);
    const listResponse = await fetch(`${baseUrl}/admin/client-error-logs?limit=5`, {
      headers: { authorization: `Bearer ${adminLogin.token}` },
    });
    const body = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toMatchObject({
      type: 'api_error',
      severity: 'high',
      journey: 'Sales Step 1 save',
      message: 'Save failed with HTTP 500',
      path: '/sales-opportunities',
      status: 500,
      agentName: 'Field User',
      role: 'sales',
    });
  });

  it('keeps live-user error logs private from non-admin users', async () => {
    const backend = createCrystalBioBackend();
    const agent = backend.createAgent({ name: 'Field User', role: 'sales', email: 'field@crystalbio.in', password });
    const server = createCrystalBioHttpServer(createCrystalBioApi(backend));
    servers.push(server);
    await server.listen(0);
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const login = backend.login(agent.id);

    const response = await fetch(`${baseUrl}/admin/client-error-logs`, {
      headers: { authorization: `Bearer ${login.token}` },
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Admin access is required');
  });
});
