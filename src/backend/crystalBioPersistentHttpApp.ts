import { createCrystalBioApi, type ApiRequest } from './crystalBioApi';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioHttpServer, type CrystalBioHttpServerOptions } from './crystalBioHttpServer';
import type { CrystalBioMailer } from './crystalBioMailer';
import type { JsonFileCrystalBioStore } from './crystalBioPersistence';

const mutatesState = (request: ApiRequest) => request.method === 'POST' || request.method === 'PATCH';

export function createCrystalBioPersistentHttpApp(store: JsonFileCrystalBioStore, options: CrystalBioHttpServerOptions & { mailer?: CrystalBioMailer; appBaseUrl?: string } = {}) {
  const backend = createCrystalBioBackend(store.load());
  const api = createCrystalBioApi(backend, { mailer: options.mailer, appBaseUrl: options.appBaseUrl });
  const persistentApi = {
    handle(request: ApiRequest) {
      const response = api.handle(request);
      if (mutatesState(request) && response.status >= 200 && response.status < 400) {
        store.save(backend.exportState());
      }
      return response;
    },
  };
  const server = createCrystalBioHttpServer(persistentApi, options);

  return {
    backend,
    save() {
      store.save(backend.exportState());
    },
    listen: server.listen,
    close: server.close,
    address: server.address,
  };
}
