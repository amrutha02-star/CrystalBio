#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dbPath = resolve(process.env.CRYSTALBIO_DB_PATH ?? process.argv[2] ?? 'data/crystalbio-db.json');
const write = process.argv.includes('--write');

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

const cleaned = {
  ...state,
  sessions: [],
  attendance: [],
  sales: [],
  service: [],
  leaveRequests: [],
};

const after = {
  agents: cleaned.agents?.length ?? 0,
  sessions: 0,
  attendance: 0,
  sales: 0,
  service: 0,
  leaveRequests: 0,
};

if (write) {
  writeFileSync(`${dbPath}.pre-clean-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`, JSON.stringify(state, null, 2));
  writeFileSync(dbPath, JSON.stringify(cleaned, null, 2));
}

console.log(JSON.stringify({ mode: write ? 'written' : 'dry-run', dbPath, before, after }, null, 2));
