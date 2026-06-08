import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ApiRequest, ApiResponse } from './crystalBioApi';

export type CrystalBioApiHandler = {
  handle(request: ApiRequest): ApiResponse;
};

const readJsonBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Malformed JSON body');
  }
};

const writeJson = (response: ServerResponse, status: number, body: Record<string, unknown>) => {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
};

export function createCrystalBioHttpServer(api: CrystalBioApiHandler) {
  const server: Server = createServer(async (request, response) => {
    try {
      const body = await readJsonBody(request);
      const apiResponse = api.handle({
        method: (request.method ?? 'GET') as ApiRequest['method'],
        path: request.url ?? '/',
        headers: {
          authorization: request.headers.authorization ?? '',
        },
        body,
      });
      writeJson(response, apiResponse.status, apiResponse.body);
    } catch (error) {
      if (error instanceof Error && error.message === 'Malformed JSON body') {
        writeJson(response, 400, { error: 'Malformed JSON body' });
        return;
      }
      writeJson(response, 500, { error: 'Unexpected server error' });
    }
  });

  return {
    listen(port: number) {
      return new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
    address(): AddressInfo | string | null {
      return server.address();
    },
  };
}
