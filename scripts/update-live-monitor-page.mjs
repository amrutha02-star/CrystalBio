import fs from 'node:fs/promises';

const API_URL = 'https://work-api.convogenie.ai/public/monitor?loginLimit=500&errorLimit=500';
const LOGIN_LOG_PATH = process.env.CRYSTALBIO_LOGIN_ACTIVITY_LOG_PATH ?? '/var/lib/crystalbio/crystalbio-login-activity.jsonl';
const CLIENT_ERROR_LOG_PATH = process.env.CRYSTALBIO_CLIENT_ERROR_LOG_PATH ?? '/var/lib/crystalbio/crystalbio-client-errors.jsonl';
const OUTPUT = 'public/periwinkle-live-monitor-a93f27.html';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatWhen = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

const readJsonl = async (path) => {
  const text = await fs.readFile(path, 'utf8');
  return text.split(/\n+/).filter(Boolean).map((line) => JSON.parse(line));
};

let generatedAt = new Date().toISOString();
let loginActivity = [];
let clientErrors = [];
try {
  // Prefer server-side JSONL logs for the static monitor page so internal email IDs stay complete.
  [loginActivity, clientErrors] = await Promise.all([
    readJsonl(LOGIN_LOG_PATH),
    readJsonl(CLIENT_ERROR_LOG_PATH),
  ]);
  loginActivity = loginActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 500);
  clientErrors = clientErrors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 500);
} catch (error) {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Monitor API failed: ${response.status}`);
  const snapshot = await response.json();
  generatedAt = snapshot.generatedAt ?? generatedAt;
  loginActivity = Array.isArray(snapshot.loginActivity) ? snapshot.loginActivity : [];
  clientErrors = Array.isArray(snapshot.clientErrors) ? snapshot.clientErrors : [];
}

const testingFailures = clientErrors.filter((event) => {
  const text = `${event.journey ?? ''} ${event.message ?? ''} ${event.email ?? ''} ${event.agentName ?? ''} ${event.userAgent ?? ''}`.toLowerCase();
  return text.includes('bloom') || text.includes('headless') || text.includes('allow location permission');
});
const testingIds = new Set(testingFailures.map((event) => event.id));
const needsClassification = clientErrors.filter((event) => !testingIds.has(event.id));
const realUserIssues = [];
const failedLogins = loginActivity.filter((event) => !event.success);
const successfulLogins = loginActivity.filter((event) => event.success);

const latest = (items, count = 4) => items.slice(0, count);
const more = (items, count = 4) => items.length > count ? `<div class='more'>+${items.length - count} older item(s) hidden to keep this page short.</div>` : '';

const errorRow = (event, tone = 'warn') => `<article class='row ${tone}'><span class='pill ${tone}'>${escapeHtml(event.severity || 'check')}</span><div><strong>${escapeHtml(event.journey || 'App issue')}</strong><p>${escapeHtml(event.agentName || event.email || 'Unknown user')} • ${escapeHtml(formatWhen(event.createdAt))}</p><small>${escapeHtml(event.message || 'Needs review')}${event.status ? ` • ${escapeHtml(event.status)}` : ''}</small></div></article>`;

const failedByEmail = [...failedLogins.reduce((map, event) => {
  const email = event.email || 'Unknown email';
  map.set(email, (map.get(email) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => b[1] - a[1]);

const successByEmail = [...successfulLogins.reduce((map, event) => {
  const email = event.email || event.agentName || 'Account';
  const current = map.get(email) || { count: 0, last: event, role: event.role };
  current.count += 1;
  if (new Date(event.createdAt) > new Date(current.last.createdAt)) current.last = event;
  current.role = event.role || current.role;
  map.set(email, current);
  return map;
}, new Map()).entries()].sort((a, b) => new Date(b[1].last.createdAt) - new Date(a[1].last.createdAt));

const failedRows = failedByEmail.slice(0, 10).map(([email, count]) => `<article class='row warn'><span class='pill warn'>check</span><div><strong>${escapeHtml(email)}</strong><p>${count} failed attempt(s)</p><small>Usually wrong password, wrong email, or testing credentials.</small></div></article>`).join('') || `<div class='empty'>No failed login attempts recorded.</div>`;
const successRows = successByEmail.slice(0, 10).map(([email, info]) => `<article class='row ok'><span class='pill ok'>login</span><div><strong>${escapeHtml(info.last.agentName || email)}</strong><p>${escapeHtml(email)}${info.role ? ` • ${escapeHtml(info.role)}` : ''}</p><small>Last: ${escapeHtml(formatWhen(info.last.createdAt))} • successful ${info.count}</small></div></article>`).join('') || `<div class='empty'>No successful logins recorded.</div>`;

const generated = new Date(generatedAt);
const generatedText = generated.toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', timeZoneName: 'short',
});

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<meta http-equiv="refresh" content="120" />
<title>CrystalBio Live Monitor</title>
<style>
:root { --ink:#243022; --muted:#697463; --sage:#607350; --line:#dce4d6; --surface:#fffef8; --soft:#f4f8ef; --warn:#fff3c7; --danger:#ffe2dc; --test:#e9efff; --ok:#eaf3e4; }
* { box-sizing:border-box; } body { margin:0; font-family:"Google Sans", Roboto, Arial, sans-serif; color:var(--ink); background:linear-gradient(135deg,#e4edde,#fffaf0); }
main { width:min(980px,100%); margin:0 auto; padding:16px 12px 28px; }
.hero { padding:16px; border-radius:24px; background:rgba(255,254,248,.95); border:1px solid rgba(96,115,80,.18); box-shadow:0 14px 34px rgba(40,55,36,.08); }
.top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
.eyebrow { margin:0 0 4px; color:var(--sage); font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
h1 { margin:0; font-size:clamp(28px,6vw,46px); font-weight:560; letter-spacing:-.035em; }
.hero p { margin:7px 0 0; color:var(--muted); line-height:1.35; max-width:680px; }
.status { padding:10px 12px; border-radius:16px; font-weight:800; white-space:nowrap; }
.status.ok { background:var(--ok); color:#4f6d58; } .status.warn { background:var(--warn); color:#75580d; } .status.danger { background:var(--danger); color:#963827; } .status.test { background:var(--test); color:#314f9a; }
.action { margin-top:12px; padding:12px; border-radius:18px; background:var(--soft); border:1px solid var(--line); font-weight:650; }
.metrics { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin:12px 0; }
.metric { padding:12px; border-radius:18px; background:rgba(255,254,248,.92); border:1px solid rgba(96,115,80,.14); min-height:76px; }
.metric strong { display:block; font-size:28px; line-height:1; } .metric span { display:block; margin-top:6px; color:var(--muted); font-size:12px; line-height:1.2; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
section { padding:13px; border-radius:22px; background:rgba(255,254,248,.94); border:1px solid rgba(96,115,80,.16); box-shadow:0 8px 22px rgba(40,55,36,.045); }
.real { border-top:5px solid #d65a45; } .review { border-top:5px solid #d8aa2c; } .testing { border-top:5px solid #6f8ee8; } .login { border-top:5px solid #78906a; }
.head { display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:8px; }
.head h2 { margin:0; font-size:16px; font-weight:680; } .head span { color:var(--muted); font-size:12px; }
.list { display:grid; gap:7px; max-height:320px; overflow:auto; padding-right:2px; }
.row { display:grid; grid-template-columns:auto 1fr; gap:9px; padding:10px; border-radius:15px; background:#f8fbf5; border:1px solid rgba(96,115,80,.12); }
.row.warn { background:var(--warn); } .row.danger { background:var(--danger); } .row.test { background:var(--test); } .row.ok { background:var(--ok); }
.row strong,.row p,.row small { display:block; margin:0; overflow-wrap:anywhere; } .row strong { font-size:13px; } .row p { margin-top:3px; color:var(--sage); font-size:12px; } .row small { margin-top:3px; color:var(--muted); font-size:12px; line-height:1.3; }
.pill { align-self:start; padding:5px 7px; border-radius:999px; font-size:10px; font-weight:800; text-transform:lowercase; } .pill.ok { background:#dcebd3; color:#4f6d58; } .pill.warn { background:#f1d479; color:#75580d; } .pill.danger { background:#f0a092; color:#7e2d20; } .pill.test { background:#cfdcff; color:#314f9a; }
.empty,.more { padding:11px; border-radius:14px; background:#f7faf3; color:var(--muted); font-size:12.5px; }
footer { margin-top:12px; color:var(--muted); font-size:12px; text-align:center; }
@media (max-width:760px) { .top { flex-direction:column; } .metrics { grid-template-columns:repeat(2,1fr); } .grid { grid-template-columns:1fr; } .list { max-height:260px; } }
</style>
</head>
<body>
<main>
  <header class="hero">
    <div class="top"><div><p class="eyebrow">CrystalBio internal</p><h1>Live Monitor</h1><p>Separated dashboard: real-user issues, needs-classification items, Bloom/testing failures, and login activity are not mixed together.</p></div><div class="status test">Testing/Bloom review</div></div>
    <div class="action">Next action: Keep separate from real-user issues. Fix only if approved.</div>
  </header>
  <div class="metrics">
    <div class="metric"><strong>${realUserIssues.length}</strong><span>real-user app errors</span></div>
    <div class="metric"><strong>${needsClassification.length}</strong><span>unknown / classify</span></div>
    <div class="metric"><strong>${testingFailures.length}</strong><span>testing/Bloom failures</span></div>
    <div class="metric"><strong>${failedLogins.length}</strong><span>failed login attempts</span></div>
    <div class="metric"><strong>${successfulLogins.length}</strong><span>successful logins</span></div>
  </div>
  <div class="grid">
    <section class="real"><div class="head"><h2>Real-user issues</h2><span>${realUserIssues.length}</span></div><div class="list"><div class='empty'>No confirmed real-user app errors.</div></div></section>
    <section class="review"><div class="head"><h2>Needs classification</h2><span>${needsClassification.length}</span></div><div class="list">${latest(needsClassification).map((event) => errorRow(event, 'warn')).join('') || `<div class='empty'>No items waiting for classification.</div>`}${more(needsClassification)}</div></section>
    <section class="testing"><div class="head"><h2>Testing / Bloom failures</h2><span>${testingFailures.length}</span></div><div class="list">${latest(testingFailures).map((event) => errorRow(event, 'test')).join('') || `<div class='empty'>No Testing/Bloom failures separated right now.</div>`}${more(testingFailures)}</div></section>
    <section class="login"><div class="head"><h2>Failed login attempts</h2><span>${failedLogins.length}</span></div><div class="list">${failedRows}</div></section>
    <section class="login"><div class="head"><h2>Recent successful logins</h2><span>${successByEmail.length} accounts</span></div><div class="list">${successRows}</div></section>
  </div>
  <footer>Last updated ${escapeHtml(generatedText)}. Shows the newest items only; older rows are hidden to prevent endless scrolling. Auto-refreshes every 2 minutes.</footer>
</main>
</body>
</html>`;

await fs.writeFile(OUTPUT, html);
console.log(`Updated ${OUTPUT}`);
console.log(`Metrics: real=${realUserIssues.length}, classify=${needsClassification.length}, testing=${testingFailures.length}, failed=${failedLogins.length}, success=${successfulLogins.length}`);
