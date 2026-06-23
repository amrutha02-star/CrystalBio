#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dbPath = resolve(process.env.CRYSTALBIO_DB_PATH ?? process.argv[2] ?? 'data/crystalbio-db.json');
const write = process.argv.includes('--write');
const bloomOnly = process.argv.includes('--bloom-only');
const resetAllSessionsAndActivity = process.argv.includes('--reset-all-sessions-and-activity');

if (write && !bloomOnly && !resetAllSessionsAndActivity) {
  console.error('Refusing to clear live user sessions. Use --bloom-only for normal QA cleanup. Full reset requires explicit --reset-all-sessions-and-activity approval.');
  process.exit(2);
}

if (!existsSync(dbPath)) {
  console.error(`CrystalBio data reset failed: database file not found at ${dbPath}`);
  process.exit(1);
}

const state = JSON.parse(readFileSync(dbPath, 'utf8'));
const before = {
  agents: state.agents?.length ?? 0,
  sessions: state.sessions?.length ?? 0,
  attendance: state.attendance?.length ?? 0,
  sales: state.sales?.length ?? 0,
  service: state.service?.length ?? 0,
  leaveRequests: state.leaveRequests?.length ?? 0,
};

const isBloomQaAgent = (agent = {}) => {
  const label = `${agent.name ?? ''} ${agent.email ?? ''}`.toLowerCase();
  return label.includes('bloom') || label.includes('bloom.') || label.includes('bloom_');
};

const bloomAgentIds = new Set((state.agents ?? []).filter(isBloomQaAgent).map((agent) => agent.id));
const isBloomOwned = (record = {}) => bloomAgentIds.has(record.ownerAgentId) || bloomAgentIds.has(record.agentId);
const withoutBloomVisits = (record, visitKey) => ({
  ...record,
  [visitKey]: (record[visitKey] ?? []).filter((visit) => !bloomAgentIds.has(visit.agentId)),
});

const cleaned = bloomOnly
  ? {
      ...state,
      attendance: (state.attendance ?? []).filter((record) => !bloomAgentIds.has(record.agentId)),
      sales: (state.sales ?? [])
        .filter((opportunity) => !isBloomOwned(opportunity))
        .map((opportunity) => withoutBloomVisits(opportunity, 'visits')),
      service: (state.service ?? [])
        .filter((record) => !isBloomOwned(record))
        .map((record) => withoutBloomVisits(record, 'visits')),
      leaveRequests: (state.leaveRequests ?? []).filter((request) => !bloomAgentIds.has(request.agentId)),
    }
  : {
      ...state,
      sessions: [],
      attendance: [],
      sales: [],
      service: [],
      leaveRequests: [],
    };

const after = {
  agents: cleaned.agents?.length ?? 0,
  sessions: cleaned.sessions?.length ?? 0,
  attendance: cleaned.attendance?.length ?? 0,
  sales: cleaned.sales?.length ?? 0,
  service: cleaned.service?.length ?? 0,
  leaveRequests: cleaned.leaveRequests?.length ?? 0,
};

const removed = {
  sessions: before.sessions - after.sessions,
  attendance: before.attendance - after.attendance,
  sales: before.sales - after.sales,
  service: before.service - after.service,
  leaveRequests: before.leaveRequests - after.leaveRequests,
  salesVisits: (state.sales ?? []).reduce((sum, opportunity) => sum + (opportunity.visits?.length ?? 0), 0)
    - (cleaned.sales ?? []).reduce((sum, opportunity) => sum + (opportunity.visits?.length ?? 0), 0),
  serviceVisits: (state.service ?? []).reduce((sum, record) => sum + (record.visits?.length ?? 0), 0)
    - (cleaned.service ?? []).reduce((sum, record) => sum + (record.visits?.length ?? 0), 0),
};

if (write) {
  writeFileSync(`${dbPath}.pre-clean-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`, JSON.stringify(state, null, 2));
  writeFileSync(dbPath, JSON.stringify(cleaned, null, 2));
}

console.log(JSON.stringify({ mode: write ? 'written' : 'dry-run', bloomOnly, dbPath, bloomAgentIds: [...bloomAgentIds], before, after, removed }, null, 2));
