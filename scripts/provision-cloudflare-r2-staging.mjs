#!/usr/bin/env node
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const bucket = process.env.CRYSTALBIO_R2_BUCKET;

if (!accountId || !token || !bucket) {
  console.error('Missing Cloudflare R2 staging values. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CRYSTALBIO_R2_BUCKET.');
  process.exit(2);
}

const api = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const safeJson = (value) => JSON.stringify(value, null, 2);

try {
  const create = await fetch(api, { method: 'PUT', headers });
  const createBody = await create.json().catch(() => ({}));
  if (!create.ok && create.status !== 409) {
    console.error(safeJson({ ok: false, step: 'create_bucket', status: create.status, error: createBody.errors?.map((e) => e.message) ?? ['request_failed'] }));
    process.exit(1);
  }

  const read = await fetch(api, { headers });
  const readBody = await read.json().catch(() => ({}));
  if (!read.ok || !readBody.success) {
    console.error(safeJson({ ok: false, step: 'verify_bucket', status: read.status, error: readBody.errors?.map((e) => e.message) ?? ['request_failed'] }));
    process.exit(1);
  }

  console.log(safeJson({ ok: true, bucket, privateByDefault: true, note: 'Bucket exists. Keep public access disabled; app should use backend-authorized access or signed URLs.' }));
} catch (error) {
  console.error(safeJson({ ok: false, step: 'exception', error: 'cloudflare_r2_provision_failed' }));
  process.exit(1);
}
