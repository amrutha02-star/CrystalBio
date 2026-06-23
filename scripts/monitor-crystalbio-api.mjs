#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const apiUrl = (process.env.CRYSTALBIO_API_URL ?? 'https://work-api.convogenie.ai').replace(/\/$/, '');
const email = process.env.CRYSTALBIO_MONITOR_EMAIL;
const password = process.env.CRYSTALBIO_MONITOR_PASSWORD;
const monitorClientErrors = process.env.CRYSTALBIO_MONITOR_CLIENT_ERRORS === 'true';
const monitorDuplicateSaves = process.env.CRYSTALBIO_MONITOR_DUPLICATE_SAVES === 'true';
const databasePath = process.env.CRYSTALBIO_DB_PATH ?? '/var/lib/crystalbio/crystalbio-db.json';
const duplicateStatePath = process.env.CRYSTALBIO_DUPLICATE_MONITOR_STATE_PATH ?? '/var/lib/crystalbio/monitor-duplicate-save-state.json';

const timeoutFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.CRYSTALBIO_MONITOR_TIMEOUT_MS ?? 10000));
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const alerts = [];
const check = async (name, fn) => {
  try {
    await fn();
  } catch (error) {
    alerts.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

await check('API health', async () => {
  const response = await timeoutFetch(`${apiUrl}/health`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  if (body.status !== 'ok') throw new Error(`unexpected body ${JSON.stringify(body)}`);
});

let loginSession;

if (email && password) {
  await check('Login smoke test', async () => {
    const response = await timeoutFetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const body = await response.json();
    if (!body.session?.token) throw new Error(`missing session token: ${JSON.stringify(body)}`);
    loginSession = body.session;
  });
}

if (monitorClientErrors) {
  await check('Live user error log', async () => {
    if (!loginSession?.token) throw new Error('admin monitor credentials are required to read live-user errors');
    const response = await timeoutFetch(`${apiUrl}/admin/client-error-logs?limit=20`, {
      headers: { authorization: `Bearer ${loginSession.token}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const body = await response.json();
    const recentWindowMs = Number(process.env.CRYSTALBIO_MONITOR_CLIENT_ERROR_WINDOW_MS ?? 10 * 60 * 1000);
    const since = Date.now() - recentWindowMs;
    const serious = (body.events ?? []).filter((event) => {
      const createdAt = Date.parse(event.createdAt ?? '');
      return createdAt >= since && (event.severity === 'critical' || event.severity === 'high');
    });
    if (serious.length) {
      throw new Error(serious.slice(0, 5).map((event) => `${event.severity}: ${event.journey} - ${event.message} (${event.agentName ?? 'unknown user'})`).join(' | '));
    }
  });
}

const normalized = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const duplicateKey = (kind, record, visit) => {
  if (kind === 'sales') {
    return [
      kind,
      visit.agentId,
      visit.visitDate,
      normalized(record.accountName),
      normalized(visit.note),
      normalized(visit.nextAction),
      visit.followUpDate ?? '',
    ].join('|');
  }
  return [
    kind,
    visit.agentId,
    visit.visitDate,
    normalized(record.customerName),
    normalized(visit.serviceType),
    normalized(visit.workDone),
    normalized(visit.supportRequired),
    normalized(visit.nextAction),
    visit.nextVisitDate ?? '',
  ].join('|');
};

if (monitorDuplicateSaves) {
  await check('Duplicate Sales/Service save monitor', async () => {
    if (!existsSync(databasePath)) throw new Error(`DB missing: ${databasePath}`);
    const database = JSON.parse(readFileSync(databasePath, 'utf8'));
    const counts = new Map();
    const examples = new Map();
    for (const [kind, records] of [['sales', database.sales ?? []], ['service', database.service ?? []]]) {
      for (const record of records) {
        for (const visit of record.visits ?? []) {
          const key = duplicateKey(kind, record, visit);
          counts.set(key, (counts.get(key) ?? 0) + 1);
          if (!examples.has(key)) {
            examples.set(key, `${kind}: ${record.accountName ?? record.customerName ?? 'Unknown customer'} / ${visit.agentName ?? visit.agentId ?? 'Unknown agent'} / ${visit.visitDate}`);
          }
        }
      }
    }
    const currentDuplicates = {};
    for (const [key, count] of counts.entries()) {
      if (count > 1) currentDuplicates[key] = count;
    }
    let previous = {};
    const hasPreviousState = existsSync(duplicateStatePath);
    if (hasPreviousState) {
      previous = JSON.parse(readFileSync(duplicateStatePath, 'utf8'));
    }
    mkdirSync(dirname(duplicateStatePath), { recursive: true });
    writeFileSync(duplicateStatePath, JSON.stringify(currentDuplicates, null, 2));
    if (!hasPreviousState) return;
    const newOrWorse = Object.entries(currentDuplicates).filter(([key, count]) => count > (previous[key] ?? 0));
    if (newOrWorse.length) {
      throw new Error(newOrWorse.slice(0, 5).map(([key, count]) => `${examples.get(key)} repeated ${count} times`).join(' | '));
    }
  });
}

if (alerts.length) {
  console.error(`CrystalBio monitor alert for ${apiUrl}\n- ${alerts.join('\n- ')}`);
  process.exit(2);
}

console.log(`CrystalBio monitor OK: ${apiUrl}${email ? ' + login smoke test' : ''}`);
