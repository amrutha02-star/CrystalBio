import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ApiRequest, ApiResponse } from './crystalBioApi';
import { renderAdminReportPdf } from './crystalBioReportPdf';

export type CrystalBioApiHandler = {
  handle(request: ApiRequest): ApiResponse;
};

export const dateFileToken = (value: string) => value.slice(0, 10).split('-').reverse().join('');

export type CrystalBioHttpServerOptions = {
  allowedOrigin?: string;
  host?: string;
  requestLimitBytes?: number;
};

const DEFAULT_REQUEST_LIMIT_BYTES = 1024 * 1024;

class RequestBodyError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const readJsonBody = async (request: IncomingMessage, limitBytes: number) => {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > limitBytes) {
      throw new RequestBodyError('Request body is too large', 413);
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestBodyError('Malformed JSON body', 400);
  }
};

const writeCorsHeaders = (response: ServerResponse, allowedOrigin: string) => {
  response.setHeader('access-control-allow-origin', allowedOrigin);
  response.setHeader('access-control-allow-credentials', 'true');
  response.setHeader('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type,authorization');
};

const writeJson = (
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
  allowedOrigin: string,
  headers: Record<string, string | string[]> = {},
) => {
  response.statusCode = status;
  writeCorsHeaders(response, allowedOrigin);
  response.setHeader('content-type', 'application/json');
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  response.end(JSON.stringify(body));
};

const buildSessionCookie = (token: string, maxAgeSeconds = 60 * 60 * 24 * 90) => [
  `crystalbio_session=${encodeURIComponent(token)}`,
  'Path=/',
  `Max-Age=${maxAgeSeconds}`,
  'HttpOnly',
  'Secure',
  'SameSite=None',
].join('; ');

const clearSessionCookie = () => buildSessionCookie('', 0);

const readCookieSession = (request: IncomingMessage) => {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return '';
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('crystalbio_session='));
  return cookie ? decodeURIComponent(cookie.slice('crystalbio_session='.length)) : '';
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
  const requestLimitBytes = options.requestLimitBytes ?? DEFAULT_REQUEST_LIMIT_BYTES;
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
      if (request.method === 'GET' && (request.url ?? '').startsWith('/agent/reports.pdf')) {
        const reportUrl = new URL(request.url ?? '/agent/reports.pdf', 'http://127.0.0.1');
        const requestedKind = reportUrl.searchParams.get('kind');
        const pdfKind = requestedKind === 'attendance' ? 'attendance' : requestedKind === 'visits' ? 'visits' : 'combined';
        const apiResponse = api.handle({
          method: 'GET',
          path: (request.url ?? '').replace('/agent/reports.pdf', '/agent/reports'),
          headers: {
            authorization: request.headers.authorization ?? (readCookieSession(request) ? `Bearer ${readCookieSession(request)}` : ''),
            cookie: request.headers.cookie ?? '',
          },
        });
        if (apiResponse.status !== 200) {
          writeJson(response, apiResponse.status, apiResponse.body, allowedOrigin);
          return;
        }
        const report = apiResponse.body.report;
        const pdf = await renderAdminReportPdf(report, { kind: pdfKind });
        const reportName = pdfKind === 'attendance' ? 'my-attendance-report' : pdfKind === 'visits' ? 'my-visit-report' : 'my-field-report';
        writePdf(response, `crystalbio-${reportName}-${dateFileToken(report.fromDate)}-to-${dateFileToken(report.toDate)}.pdf`, pdf, allowedOrigin);
        return;
      }
      if (request.method === 'GET' && (request.url ?? '').startsWith('/admin/reports.pdf')) {
        const reportUrl = new URL(request.url ?? '/admin/reports.pdf', 'http://127.0.0.1');
        const requestedKind = reportUrl.searchParams.get('kind');
        const pdfKind = requestedKind === 'attendance' ? 'attendance' : requestedKind === 'visits' ? 'visits' : 'combined';
        const apiResponse = api.handle({
          method: 'GET',
          path: (request.url ?? '').replace('/admin/reports.pdf', '/admin/reports'),
          headers: {
            authorization: request.headers.authorization ?? (readCookieSession(request) ? `Bearer ${readCookieSession(request)}` : ''),
            cookie: request.headers.cookie ?? '',
          },
        });
        if (apiResponse.status !== 200) {
          writeJson(response, apiResponse.status, apiResponse.body, allowedOrigin);
          return;
        }
        const report = apiResponse.body.report;
        const pdf = await renderAdminReportPdf(report, { kind: pdfKind });
        const reportName = pdfKind === 'attendance' ? 'attendance-report' : pdfKind === 'visits' ? 'visit-report' : 'field-report';
        writePdf(response, `crystalbio-${reportName}-${dateFileToken(report.fromDate)}-to-${dateFileToken(report.toDate)}.pdf`, pdf, allowedOrigin);
        return;
      }
      const body = await readJsonBody(request, requestLimitBytes);
      const cookieToken = readCookieSession(request);
      const apiResponse = api.handle({
        method: (request.method ?? 'GET') as ApiRequest['method'],
        path: request.url ?? '/',
        headers: {
          authorization: request.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : ''),
          cookie: request.headers.cookie ?? '',
        },
        body,
      });
      const responseHeaders: Record<string, string | string[]> = {};
      if (request.method === 'POST' && request.url === '/auth/login' && apiResponse.status === 200 && apiResponse.body.session?.token) {
        responseHeaders['set-cookie'] = buildSessionCookie(apiResponse.body.session.token);
      }
      if (request.method === 'GET' && request.url === '/auth/session' && apiResponse.status === 401 && cookieToken) {
        responseHeaders['set-cookie'] = clearSessionCookie();
      }
      writeJson(response, apiResponse.status, apiResponse.body, allowedOrigin, responseHeaders);
    } catch (error) {
      if (error instanceof RequestBodyError) {
        writeJson(response, error.status, { error: error.message }, allowedOrigin);
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
