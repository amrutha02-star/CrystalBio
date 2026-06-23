export type CrystalBioPersistenceMode = 'json' | 'postgres';

export type CrystalBioPersistenceConfig = {
  mode: CrystalBioPersistenceMode;
  jsonDatabasePath: string;
  postgresUrl?: string;
};

export const createCrystalBioPersistenceConfig = (env: NodeJS.ProcessEnv = process.env): CrystalBioPersistenceConfig => {
  const mode = (env.CRYSTALBIO_PERSISTENCE ?? env.CRYSTALBIO_STORE ?? 'json').toLowerCase();
  if (mode !== 'json' && mode !== 'postgres') {
    throw new Error("CRYSTALBIO_PERSISTENCE must be 'json' or 'postgres'.");
  }

  return {
    mode,
    jsonDatabasePath: env.CRYSTALBIO_DB_PATH ?? 'data/crystalbio-db.json',
    postgresUrl: env.CRYSTALBIO_POSTGRES_URL,
  };
};

export const assertPostgresRuntimeReady = (config: CrystalBioPersistenceConfig) => {
  if (config.mode !== 'postgres') return;
  if (!config.postgresUrl) {
    throw new Error('CRYSTALBIO_POSTGRES_URL is required when CRYSTALBIO_PERSISTENCE=postgres.');
  }

  throw new Error(
    'PostgreSQL persistence is scaffolded for staging migration, but the live runtime adapter is not enabled yet. Keep CRYSTALBIO_PERSISTENCE=json until the staging migration, count checks, and Bloom QA pass.',
  );
};
