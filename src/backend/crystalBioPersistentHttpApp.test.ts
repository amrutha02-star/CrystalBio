import { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonFileCrystalBioStore } from './crystalBioPersistence';
import { createCrystalBioPersistentHttpApp } from './crystalBioPersistentHttpApp';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };
const apps: ReturnType<typeof createCrystalBioPersistentHttpApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.map((app) => app.close()));
  apps.length = 0;
});

describe('CrystalBio persistent HTTP app', () => {
  it('automatically saves successful HTTP mutations and reloads them', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'crystalbio-'));
    const filePath = join(dir, 'db.json');

    try {
      const store = new JsonFileCrystalBioStore(filePath);
      const app = createCrystalBioPersistentHttpApp(store);
      apps.push(app);
      const admin = app.backend.createAgent({ name: 'Admin User', role: 'admin' });
      const agent = app.backend.createAgent({ name: 'Rahul', role: 'sales' });
      app.save();
      await app.listen(0);
      const address = app.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });
      const login = await loginResponse.json();

      await fetch(`${baseUrl}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${login.session.token}`,
        },
        body: JSON.stringify({ timestamp: '2026-06-07T09:00:00.000Z', gps }),
      });

      await app.close();
      apps.length = 0;

      const reloadedApp = createCrystalBioPersistentHttpApp(store);
      const report = reloadedApp.backend.getAdminReport(admin.id, { fromDate: '2026-06-07', toDate: '2026-06-07' });

      expect(report.totals.checkedInAgents).toBe(1);
      expect(report.agentSummaries.find((summary) => summary.agentName === 'Rahul')?.attendanceStatus).toBe('checked_in');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
