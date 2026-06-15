#!/usr/bin/env node
const apiUrl = (process.env.CRYSTALBIO_API_URL ?? 'https://work-api.convogenie.ai').replace(/\/$/, '');
const email = process.env.CRYSTALBIO_MONITOR_EMAIL;
const password = process.env.CRYSTALBIO_MONITOR_PASSWORD;
const monitorClientErrors = process.env.CRYSTALBIO_MONITOR_CLIENT_ERRORS === 'true';

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

if (alerts.length) {
  console.error(`CrystalBio monitor alert for ${apiUrl}\n- ${alerts.join('\n- ')}`);
  process.exit(2);
}

console.log(`CrystalBio monitor OK: ${apiUrl}${email ? ' + login smoke test' : ''}`);
