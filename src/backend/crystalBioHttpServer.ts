import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ApiRequest, ApiResponse } from './crystalBioApi';
import { renderAdminReportPdf } from './crystalBioReportPdf';

export type CrystalBioApiHandler = {
  handle(request: ApiRequest): ApiResponse;
};

export type CrystalBioHttpServerOptions = {
  allowedOrigin?: string;
  host?: string;
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

const writeCorsHeaders = (response: ServerResponse, allowedOrigin: string) => {
  response.setHeader('access-control-allow-origin', allowedOrigin);
  response.setHeader('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type,authorization');
};

const writeJson = (response: ServerResponse, status: number, body: Record<string, unknown>, allowedOrigin: string) => {
  response.statusCode = status;
  writeCorsHeaders(response, allowedOrigin);
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
};

const writePdf = (response: ServerResponse, fileName: string, body: Buffer, allowedOrigin: string) => {
  response.statusCode = 200;
  writeCorsHeaders(response, allowedOrigin);
  response.setHeader('content-type', 'application/pdf');
  response.setHeader('content-disposition', `attachment; filename="${fileName}"`);
  response.end(body);
};

const writeCorsPreflight = (response: ServerResponse, allowedOrigin: string) => {
  response.statusCode = 204;
  writeCorsHeaders(response, allowedOrigin);
  response.end();
};

export function createCrystalBioHttpServer(api: CrystalBioApiHandler, options: CrystalBioHttpServerOptions = {}) {
  const allowedOrigin = options.allowedOrigin ?? '*';
  const host = options.host ?? '127.0.0.1';
  const server: Server = createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        writeCorsPreflight(response, allowedOrigin);
        return;
      }
      if (request.method === 'GET' && request.url === '/health') {
        writeJson(response, 200, { status: 'ok' }, allowedOrigin);
        return;
      }
      if (request.method === 'GET' && (request.url ?? '').startsWith('/admin/reports.pdf')) {
        const apiResponse = api.handle({
          method: 'GET',
          path: (request.url ?? '').replace('/admin/reports.pdf', '/admin/reports'),
          headers: {
            authorization: request.headers.authorization ?? '',
          },
        });
        if (apiResponse.status !== 200) {
          writeJson(response, apiResponse.status, apiResponse.body, allowedOrigin);
          return;
        }
        const report = apiResponse.body.report;
        const pdf = await renderAdminReportPdf(report);
        writePdf(response, `crystalbio-report-${report.fromDate}-to-${report.toDate}.pdf`, pdf, allowedOrigin);
        return;
      }
      const body = await readJsonBody(request);
      const apiResponse = api.handle({
        method: (request.method ?? 'GET') as ApiRequest['method'],
        path: request.url ?? '/',
        headers: {
          authorization: request.headers.authorization ?? '',
        },
        body,
      });
      writeJson(response, apiResponse.status, apiResponse.body, allowedOrigin);
    } catch (error) {
      if (error instanceof Error && error.message === 'Malformed JSON body') {
        writeJson(response, 400, { error: 'Malformed JSON body' }, allowedOrigin);
        return;
      }
      writeJson(response, 500, { error: 'Unexpected server error' }, allowedOrigin);
    }
  });

  return {
    listen(port: number) {
      return new Promise<void>((resolve) => server.listen(port, host, resolve));
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
