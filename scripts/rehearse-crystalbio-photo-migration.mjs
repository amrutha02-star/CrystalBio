#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const valueAfter = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const sourcePath = valueAfter('--source') ?? process.env.CRYSTALBIO_DB_PATH;
const outputDir = valueAfter('--out-dir') ?? '/tmp/crystalbio-photo-migration-rehearsal';
const manifestPath = valueAfter('--manifest') ?? path.join(outputDir, 'manifest.json');

if (!sourcePath) {
  console.error('Usage: node scripts/rehearse-crystalbio-photo-migration.mjs --source <copied-json-backup> --out-dir <private-temp-dir> [--manifest manifest.json]');
  process.exit(2);
}

const state = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const list = (key) => Array.isArray(state[key]) ? state[key] : [];
const safeSegment = (value) => String(value ?? 'unknown').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string') return undefined;
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return undefined;
  const contentType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const bytes = isBase64 ? Buffer.from(match[3], 'base64') : Buffer.from(decodeURIComponent(match[3]), 'utf8');
  return { contentType, bytes };
};

const records = [];
const writeAttachment = ({ rootType, relatedType, relatedId, visitId, agentId, index, photo }) => {
  const parsed = parseDataUrl(photo?.dataUrl);
  if (!parsed) return;
  const ext = parsed.contentType.split('/')[1]?.replace(/[^A-Za-z0-9]/g, '') || 'bin';
  const storageKey = [
    'crystalbio-photo-rehearsal',
    safeSegment(relatedType),
    safeSegment(relatedId),
    `${safeSegment(visitId)}-${index + 1}.${ext}`,
  ].join('/');
  const outputPath = path.join(outputDir, storageKey);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(outputPath, parsed.bytes, { mode: 0o600 });
  records.push({
    rootType,
    relatedType,
    relatedId,
    visitId,
    agentId,
    storageProvider: 'local_migration_placeholder',
    storageBucket: 'local-rehearsal',
    storageKey,
    originalFileName: photo?.fileName,
    contentType: photo?.contentType || parsed.contentType,
    sizeBytes: photo?.sizeBytes ?? parsed.bytes.length,
    sha256: crypto.createHash('sha256').update(parsed.bytes).digest('hex'),
    migratedFromJson: true,
  });
};

for (const record of list('sales')) {
  for (const visit of Array.isArray(record.visits) ? record.visits : []) {
    (Array.isArray(visit.photos) ? visit.photos : []).forEach((photo, index) => writeAttachment({
      rootType: 'sales',
      relatedType: 'sales_visit',
      relatedId: visit.id,
      visitId: visit.id,
      agentId: visit.agentId,
      index,
      photo,
    }));
  }
}

for (const record of list('service')) {
  for (const visit of Array.isArray(record.visits) ? record.visits : []) {
    (Array.isArray(visit.photos) ? visit.photos : []).forEach((photo, index) => writeAttachment({
      rootType: 'service',
      relatedType: 'service_visit',
      relatedId: visit.id,
      visitId: visit.id,
      agentId: visit.agentId,
      index,
      photo,
    }));
  }
}

const manifest = {
  checkedAt: new Date().toISOString(),
  sourcePath: '[REDACTED_SOURCE_PATH]',
  outputDir: '[PRIVATE_LOCAL_REHEARSAL_DIR]',
  attachmentCount: records.length,
  records,
};
fs.mkdirSync(path.dirname(manifestPath), { recursive: true, mode: 0o700 });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ attachmentCount: records.length, manifestPath, outputDir }, null, 2));
