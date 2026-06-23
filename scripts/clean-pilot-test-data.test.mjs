import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/clean-pilot-test-data.mjs');

const runCleaner = (state, args = []) => {
  const dir = mkdtempSync(join(tmpdir(), 'crystalbio-clean-test-'));
  const dbPath = join(dir, 'db.json');
  writeFileSync(dbPath, JSON.stringify(state, null, 2));
  try {
    const output = execFileSync('node', [scriptPath, dbPath, ...args], { encoding: 'utf8' });
    return { dbPath, output: JSON.parse(output), state: JSON.parse(readFileSync(dbPath, 'utf8')) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe('pilot data cleanup script', () => {
  it('refuses write full reset unless session clearing is explicitly approved', () => {
    const state = {
      nextId: 10,
      agents: [{ id: 'agent_real', name: 'Deekshak', role: 'sales', active: true, email: 'deekshak@crystalbio.in' }],
      sessions: [{ token: 'session_real', agentId: 'agent_real', agentName: 'Deekshak', role: 'sales' }],
      attendance: [],
      sales: [],
      service: [],
      leaveRequests: [],
    };
    const dir = mkdtempSync(join(tmpdir(), 'crystalbio-clean-test-'));
    const dbPath = join(dir, 'db.json');
    writeFileSync(dbPath, JSON.stringify(state, null, 2));
    try {
      expect(() => execFileSync('node', [scriptPath, dbPath, '--write'], { encoding: 'utf8', stdio: 'pipe' })).toThrow();
      expect(JSON.parse(readFileSync(dbPath, 'utf8')).sessions).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('dry-runs Bloom-only cleanup without deleting real-agent records', () => {
    const state = {
      nextId: 10,
      agents: [
        { id: 'agent_bloom', name: 'Bloom QA Agent', role: 'both', active: true, email: 'bloom.agent@crystalbio.in' },
        { id: 'agent_real', name: 'Deekshak', role: 'sales', active: true, email: 'deekshak@crystalbio.in' },
      ],
      sessions: [],
      attendance: [
        { id: 'att_bloom', agentId: 'agent_bloom', agentName: 'Bloom QA Agent', date: '2026-06-16', checkInAt: '2026-06-16T01:00:00Z', checkInGps: { latitude: 1, longitude: 2 }, status: 'checked_in' },
        { id: 'att_real', agentId: 'agent_real', agentName: 'Deekshak', date: '2026-06-16', checkInAt: '2026-06-16T01:00:00Z', checkInGps: { latitude: 1, longitude: 2 }, status: 'checked_in' },
      ],
      sales: [
        { id: 'sales_bloom', ownerAgentId: 'agent_bloom', accountName: 'Bloom QA Sales', status: 'open', visits: [] },
        { id: 'sales_real', ownerAgentId: 'agent_real', accountName: 'Real hospital', status: 'open', visits: [
          { id: 'visit_bloom', opportunityId: 'sales_real', agentId: 'agent_bloom', agentName: 'Bloom QA Agent', visitNumber: 1, visitDate: '2026-06-16', visitTime: '10:00', gps: { latitude: 1, longitude: 2 }, note: 'QA check', nextAction: 'no_follow_up', photos: [] },
          { id: 'visit_real', opportunityId: 'sales_real', agentId: 'agent_real', agentName: 'Deekshak', visitNumber: 2, visitDate: '2026-06-16', visitTime: '11:00', gps: { latitude: 1, longitude: 2 }, note: 'Real work', nextAction: 'no_follow_up', photos: [] },
        ] },
      ],
      service: [
        { id: 'service_bloom', ownerAgentId: 'agent_bloom', customerName: 'Bloom QA Service', status: 'open', visits: [] },
        { id: 'service_real', ownerAgentId: 'agent_real', customerName: 'Real service', status: 'open', visits: [] },
      ],
      leaveRequests: [],
    };

    const result = runCleaner(state, ['--bloom-only']);

    expect(result.output.mode).toBe('dry-run');
    expect(result.output.bloomOnly).toBe(true);
    expect(result.output.after.attendance).toBe(1);
    expect(result.output.after.sales).toBe(1);
    expect(result.output.after.service).toBe(1);
    expect(result.state.sales).toHaveLength(2);
  });
});
