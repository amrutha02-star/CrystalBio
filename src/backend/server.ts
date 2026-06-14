import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createCrystalBioPersistentHttpApp } from './crystalBioPersistentHttpApp';
import { createCrystalBioMailerFromEnv } from './crystalBioMailer';
import { JsonFileCrystalBioStore } from './crystalBioPersistence';

const main = async () => {
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? '127.0.0.1';
  const allowedOrigin = process.env.CRYSTALBIO_ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const databasePath = resolve(process.env.CRYSTALBIO_DB_PATH ?? 'data/crystalbio-db.json');
  const seedDemoUsers = process.env.CRYSTALBIO_SEED_DEMO === 'true';
  const requestLimitBytes = Number(process.env.CRYSTALBIO_REQUEST_LIMIT_BYTES ?? 1024 * 1024);
  const pilotPasswordPrefix = process.env.CRYSTALBIO_DEMO_PASSWORD;
  const credentialsPath = process.env.CRYSTALBIO_SEEDED_CREDENTIALS_PATH;
  const appBaseUrl = process.env.CRYSTALBIO_APP_BASE_URL ?? 'https://work.convogenie.ai';
  const mailer = createCrystalBioMailerFromEnv(process.env);

  mkdirSync(dirname(databasePath), { recursive: true });

  const store = new JsonFileCrystalBioStore(databasePath);
  const app = createCrystalBioPersistentHttpApp(store, { allowedOrigin, host, requestLimitBytes, mailer, appBaseUrl });

  if (seedDemoUsers && app.backend.exportState().agents.length === 0) {
    const seededCredentials: Array<{ name: string; email: string; password: string }> = [];
    const createPilotPassword = (employeeId: string) => {
      const safeEmployee = employeeId.replace(/[^A-Za-z0-9]/g, '').slice(-6) || 'user';
      const uniquePart = randomBytes(4).toString('hex');
      return pilotPasswordPrefix ? `${pilotPasswordPrefix}-${safeEmployee}` : `Pilot-${safeEmployee}-${uniquePart}!`;
    };
    [
      ['Admin User', 'admin', 'CB-ADM-001', 'admin@crystalbio.in', '+91 98765 43000'],
      ['Rahul Sales', 'sales', 'CB-S-014', 'rahul.sales@crystalbio.in', '+91 98765 43210'],
      ['Anil Sales', 'sales', 'CB-S-021', 'anil.sales@crystalbio.in', '+91 98765 43009'],
      ['Priya Sales', 'sales', 'CB-S-026', 'priya.sales@crystalbio.in', '+91 98765 43026'],
      ['Vikram Sales', 'sales', 'CB-S-031', 'vikram.sales@crystalbio.in', '+91 98765 43031'],
      ['Meera Service', 'service', 'CB-SE-008', 'meera.service@crystalbio.in', '+91 98765 43111'],
      ['Arun Service', 'service', 'CB-SE-011', 'arun.service@crystalbio.in', '+91 98765 43112'],
      ['Nisha Service', 'service', 'CB-SE-017', 'nisha.service@crystalbio.in', '+91 98765 43117'],
      ['Deepak Service', 'service', 'CB-SE-022', 'deepak.service@crystalbio.in', '+91 98765 43122'],
      ['Kiran Field', 'both', 'CB-F-005', 'kiran.field@crystalbio.in', '+91 98765 43205'],
      ['Sana Field', 'both', 'CB-F-006', 'sana.field@crystalbio.in', '+91 98765 43206'],
      ['Office Coordinator', 'admin', 'CB-ADM-002', 'office@crystalbio.in', '+91 98765 43002'],
    ].forEach(([name, role, employeeId, email, mobile]) => {
      const password = createPilotPassword(employeeId);
      app.backend.createAgent({ name, role: role as any, employeeId, email, mobile, password });
      seededCredentials.push({ name, email, password });
    });
    app.save();
    if (credentialsPath) {
      writeFileSync(resolve(credentialsPath), JSON.stringify(seededCredentials, null, 2));
      console.log(`Seeded pilot users with unique email/password credentials at ${resolve(credentialsPath)}.`);
    } else {
      console.log('Seeded pilot users with unique email/password credentials. Set CRYSTALBIO_SEEDED_CREDENTIALS_PATH to write the private password list on first seed.');
    }
  }

  await app.listen(port);
  console.log(`CrystalBio backend listening on http://${host}:${port}`);
  console.log(`Allowed frontend origin: ${allowedOrigin}`);
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
