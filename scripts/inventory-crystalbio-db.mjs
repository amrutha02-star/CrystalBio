#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.CRYSTALBIO_DB_PATH ?? '/var/lib/crystalbio/crystalbio-db.json';
const outputPath = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : undefined;

const state = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const list = (key) => Array.isArray(state[key]) ? state[key] : [];
const countFields = (items) => {
  const counts = {};
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    for (const key of Object.keys(item)) counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
};

const nestedVisits = (rootKey) => list(rootKey).flatMap((record) => Array.isArray(record.visits) ? record.visits : []);
const photoInventory = (rootKey) => {
  const topPhotoFields = {};
  const photoFields = {};
  let attachmentCount = 0;
  let attachmentWithDataUrlCount = 0;

  for (const record of list(rootKey)) {
    for (const field of ['sitePhoto', 'equipmentPlatePhoto', 'installationPhoto', 'issuePhoto', 'visitingCardPhoto', 'photoNote']) {
      if (record?.[field]) topPhotoFields[field] = (topPhotoFields[field] ?? 0) + 1;
    }
    for (const visit of Array.isArray(record?.visits) ? record.visits : []) {
      for (const photo of Array.isArray(visit?.photos) ? visit.photos : []) {
        if (!photo || typeof photo !== 'object') continue;
        attachmentCount += 1;
        if (photo.dataUrl) attachmentWithDataUrlCount += 1;
        for (const key of Object.keys(photo)) photoFields[key] = (photoFields[key] ?? 0) + 1;
      }
    }
  }

  return {
    topPhotoFields: Object.fromEntries(Object.entries(topPhotoFields).sort(([a], [b]) => a.localeCompare(b))),
    attachmentCount,
    attachmentWithDataUrlCount,
    attachmentFields: Object.fromEntries(Object.entries(photoFields).sort(([a], [b]) => a.localeCompare(b))),
  };
};

const inventory = {
  checkedAt: new Date().toISOString(),
  dbPath,
  rootKeys: Object.keys(state).sort(),
  counts: {
    agents: list('agents').length,
    sessions: list('sessions').length,
    attendance: list('attendance').length,
    sales: list('sales').length,
    salesVisits: nestedVisits('sales').length,
    service: list('service').length,
    serviceVisits: nestedVisits('service').length,
    leaveRequests: list('leaveRequests').length,
    nextId: state.nextId,
  },
  fields: {
    agents: countFields(list('agents')),
    sessions: countFields(list('sessions')),
    attendance: countFields(list('attendance')),
    sales: countFields(list('sales')),
    salesVisits: countFields(nestedVisits('sales')),
    service: countFields(list('service')),
    serviceVisits: countFields(nestedVisits('service')),
    leaveRequests: countFields(list('leaveRequests')),
  },
  photos: {
    sales: photoInventory('sales'),
    service: photoInventory('service'),
  },
};

const text = JSON.stringify(inventory, null, 2);
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${text}\n`);
  console.log(`wrote ${outputPath}`);
} else {
  console.log(text);
}
