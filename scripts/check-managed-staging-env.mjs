#!/usr/bin/env node
const required = [
  'CRYSTALBIO_STAGING_POSTGRES_URL',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CRYSTALBIO_R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
];

const optional = [
  'CRYSTALBIO_R2_ENDPOINT',
  'CRYSTALBIO_R2_PUBLIC_BASE_URL',
];

const present = (key) => Boolean(process.env[key]);
const report = {
  ok: required.every(present),
  required: Object.fromEntries(required.map((key) => [key, present(key) ? 'present' : 'missing'])),
  optional: Object.fromEntries(optional.map((key) => [key, present(key) ? 'present' : 'missing'])),
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(2);
