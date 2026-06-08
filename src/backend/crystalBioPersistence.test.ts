import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCrystalBioBackend } from './crystalBioBackend';
import { JsonFileCrystalBioStore } from './crystalBioPersistence';

const gps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

describe('CrystalBio persistence layer', () => {
  it('saves backend records to disk and reloads them', () => {
    const dir = mkdtempSync(join(tmpdir(), 'crystalbio-'));
    const filePath = join(dir, 'db.json');

    try {
      const backend = createCrystalBioBackend();
      const admin = backend.createAgent({ name: 'Admin User', role: 'admin' });
      const agent = backend.createAgent({ name: 'Rahul', role: 'sales' });
      backend.login(agent.id);
      backend.checkIn(agent.id, { timestamp: '2026-06-07T09:00:00.000Z', gps });
      const opportunity = backend.createSalesOpportunity(agent.id, { accountName: 'Apollo Diagnostics' });
      backend.addSalesVisitUpdate(agent.id, opportunity.id, {
        visitDate: '2026-06-07',
        visitTime: '11:18',
        gps,
        note: 'Requirement confirmed',
        nextAction: 'no_follow_up',
        photos: [],
      });
      const leave = backend.submitLeaveRequest(agent.id, {
        fromDate: '2026-06-08',
        toDate: '2026-06-09',
        reason: 'Personal work',
        note: 'Family appointment',
      });

      const store = new JsonFileCrystalBioStore(filePath);
      store.save(backend.exportState());

      const reloadedBackend = createCrystalBioBackend(store.load());
      const report = reloadedBackend.getAdminReport(admin.id, { fromDate: '2026-06-07', toDate: '2026-06-07' });

      expect(report.totals.checkedInAgents).toBe(1);
      expect(report.totals.salesVisits).toBe(1);
      expect(report.agentSummaries.find((summary) => summary.agentName === 'Rahul')?.salesVisitCount).toBe(1);
      expect(reloadedBackend.exportState().leaveRequests.find((request) => request.id === leave.id)?.note).toBe('Family appointment');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates an empty database file when none exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'crystalbio-'));
    const filePath = join(dir, 'db.json');

    try {
      const store = new JsonFileCrystalBioStore(filePath);
      const state = store.load();
      store.save(state);

      expect(state.agents).toEqual([]);
      expect(JSON.parse(readFileSync(filePath, 'utf8')).agents).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps a valid backup and recovers the previous good state if the main JSON file is damaged', () => {
    const dir = mkdtempSync(join(tmpdir(), 'crystalbio-'));
    const filePath = join(dir, 'db.json');

    try {
      const store = new JsonFileCrystalBioStore(filePath);
      const firstBackend = createCrystalBioBackend();
      firstBackend.createAgent({ name: 'Admin User', role: 'admin' });
      store.save(firstBackend.exportState());

      const secondBackend = createCrystalBioBackend(store.load());
      secondBackend.createAgent({ name: 'Rahul Sales', role: 'sales' });
      store.save(secondBackend.exportState());

      expect(JSON.parse(readFileSync(`${filePath}.bak`, 'utf8')).agents.map((agent: { name: string }) => agent.name)).toEqual(['Admin User']);

      writeFileSync(filePath, '{ damaged json');

      const recoveredState = store.load();
      expect(recoveredState.agents.map((agent) => agent.name)).toEqual(['Admin User']);
      expect(readFileSync(`${filePath}.corrupt`, 'utf8')).toBe('{ damaged json');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
