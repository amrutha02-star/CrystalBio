import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createCrystalBioPersistentHttpApp } from './crystalBioPersistentHttpApp';
import { JsonFileCrystalBioStore } from './crystalBioPersistence';

const main = async () => {
  const port = Number(process.env.PORT ?? 8787);
  const databasePath = resolve(process.env.CRYSTALBIO_DB_PATH ?? 'data/crystalbio-db.json');
  const seedDemoUsers = process.env.CRYSTALBIO_SEED_DEMO !== 'false';

  mkdirSync(dirname(databasePath), { recursive: true });

  const store = new JsonFileCrystalBioStore(databasePath);
  const app = createCrystalBioPersistentHttpApp(store);

  if (seedDemoUsers && app.backend.exportState().agents.length === 0) {
    app.backend.createAgent({ name: 'Admin User', role: 'admin' });
    app.backend.createAgent({ name: 'Rahul Sales', role: 'sales' });
    app.backend.createAgent({ name: 'Meera Service', role: 'service' });
    app.save();
    console.log('Seeded demo users: Admin User, Rahul Sales, Meera Service');
  }

  await app.listen(port);
  console.log(`CrystalBio backend listening on http://127.0.0.1:${port}`);
  console.log(`Database file: ${databasePath}`);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
