#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const dbPath = resolve(process.env.CRYSTALBIO_DB_PATH ?? 'data/crystalbio-db.json');
const backupDir = resolve(process.env.CRYSTALBIO_BACKUP_DIR ?? `${dbPath}.backups`);
const retentionDays = Number(process.env.CRYSTALBIO_BACKUP_RETENTION_DAYS ?? 14);

if (!existsSync(dbPath)) {
  console.error(`CrystalBio backup failed: database file not found at ${dbPath}`);
  process.exit(1);
}

mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = join(backupDir, `${basename(dbPath)}.${stamp}.bak`);
copyFileSync(dbPath, target);

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
let removed = 0;
for (const name of readdirSync(backupDir)) {
  const path = join(backupDir, name);
  if (!name.endsWith('.bak')) continue;
  if (statSync(path).mtimeMs < cutoff) {
    unlinkSync(path);
    removed += 1;
  }
}

console.log(`CrystalBio backup complete: ${target}${removed ? ` (${removed} old backups removed)` : ''}`);
