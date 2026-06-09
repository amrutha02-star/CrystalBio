import { createCrystalBioApi, type ApiRequest } from './crystalBioApi';
import { createCrystalBioBackend } from './crystalBioBackend';
import { createCrystalBioHttpServer, type CrystalBioHttpServerOptions } from './crystalBioHttpServer';
import type { JsonFileCrystalBioStore } from './crystalBioPersistence';

const mutatesState = (request: ApiRequest) => request.method === 'POST' || request.method === 'PATCH';

export function createCrystalBioPersistentHttpApp(store: JsonFileCrystalBioStore, options: CrystalBioHttpServerOptions = {}) {
  const backend = createCrystalBioBackend(store.load());
  const api = createCrystalBioApi(backend);
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
