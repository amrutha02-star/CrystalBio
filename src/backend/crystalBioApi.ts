import { ValidationError, type Agent, type LoginInput, type createCrystalBioBackend } from './crystalBioBackend';
import type { CrystalBioMailer } from './crystalBioMailer';

type Backend = ReturnType<typeof createCrystalBioBackend>;

type ClientErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

type ClientErrorEvent = {
  id: string;
  createdAt: string;
  type: string;
  severity: ClientErrorSeverity;
  journey: string;
  message: string;
  path?: string;
  status?: number;
  pageUrl?: string;
  userAgent?: string;
  agentId?: string;
  agentName?: string;
  role?: Agent['role'];
};

type LoginActivityEvent = {
  id: string;
  createdAt: string;
  email?: string;
  success: boolean;
  message: string;
  agentId?: string;
  agentName?: string;
  role?: Agent['role'];
};

export type ClientErrorLogStore = {
  add(event: ClientErrorEvent): void;
  list(limit?: number): ClientErrorEvent[];
};

export type LoginActivityLogStore = {
  add(event: LoginActivityEvent): void;
  list(limit?: number): LoginActivityEvent[];
};

const createMemoryClientErrorLogStore = (): ClientErrorLogStore => {
  const events: ClientErrorEvent[] = [];
  return {
    add(event) {
      events.push(event);
    },
    list(limit = 50) {
      return events.slice(-limit).reverse();
    },
  };
};

const createMemoryLoginActivityLogStore = (): LoginActivityLogStore => {
  const events: LoginActivityEvent[] = [];
  return {
    add(event) {
      events.push(event);
    },
    list(limit = 100) {
      return events.slice(-limit).reverse();
    },
  };
};

export type ApiRequest = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

export type ApiResponse = {
  status: number;
  body: Record<string, any>;
};

const parseBearerToken = (headers?: Record<string, string>) => {
  const header = headers?.authorization ?? headers?.Authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length);
};

const splitPath = (pathWithQuery: string) => {
  const [pathname, queryString = ''] = pathWithQuery.split('?');
  return {
    pathname,
    query: Object.fromEntries(new URLSearchParams(queryString).entries()),
  };
};

const isAdminAccessError = (error: unknown) => error instanceof ValidationError && error.message === 'Admin access is required';

const publicAgent = (agent: any, includeInviteToken = false) => {
  const safeAgent: Record<string, any> = {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    employeeId: agent.employeeId,
    email: agent.email,
    mobile: agent.mobile,
    active: agent.active,
    inviteStatus: agent.inviteStatus,
  };
  if (includeInviteToken && agent.inviteToken) safeAgent.inviteToken = agent.inviteToken;
  return safeAgent;
};

const requireBody = (body: ApiRequest['body']) => {
  if (!body) throw new ValidationError('Request body is required');
  return body;
};

const requireLeaveReviewStatus = (status: unknown) => {
  if (status !== 'approved' && status !== 'rejected') {
    throw new ValidationError('Leave review status must be approved or rejected');
  }
  return status;
};

const asText = (value: unknown, fallback = '') => (typeof value === 'string' ? value.trim().slice(0, 500) : fallback);

const asSeverity = (value: unknown): ClientErrorSeverity => (
  value === 'critical' || value === 'high' || value === 'medium' || value === 'low' ? value : 'medium'
);

const asStatus = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(599, Math.trunc(value)));
};

const buildClientErrorEvent = (body: Record<string, unknown>, session?: ReturnType<Backend['getSession']>): ClientErrorEvent => ({
  id: `client-error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  type: asText(body.type, 'client_error') || 'client_error',
  severity: asSeverity(body.severity),
  journey: asText(body.journey, 'Unknown journey') || 'Unknown journey',
  message: asText(body.message, 'User-facing app error') || 'User-facing app error',
  ...(asText(body.path) ? { path: asText(body.path, '').slice(0, 200) } : {}),
  ...(asStatus(body.status) !== undefined ? { status: asStatus(body.status) } : {}),
  ...(asText(body.pageUrl) ? { pageUrl: asText(body.pageUrl, '').slice(0, 300) } : {}),
  ...(asText(body.userAgent) ? { userAgent: asText(body.userAgent, '').slice(0, 300) } : {}),
  ...(session ? { agentId: session.agentId, agentName: session.agentName, role: session.role } : {}),
});

const buildLoginActivityEvent = (input: { email?: string; success: boolean; message: string; session?: ReturnType<Backend['getSession']> }): LoginActivityEvent => ({
  id: `login-activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  ...(input.email ? { email: input.email.trim().toLowerCase().slice(0, 200) } : {}),
  success: input.success,
  message: input.message.slice(0, 300),
  ...(input.session ? { agentId: input.session.agentId, agentName: input.session.agentName, role: input.session.role } : {}),
});

const shortDateLabel = (value?: string) => value || 'No date set';

const compactDetailRows = (rows: Array<[string, unknown]>) => rows
  .map(([label, value]) => ({ label, value: typeof value === 'string' ? value.trim() : String(value ?? '').trim() }))
  .filter((row) => row.value && row.value !== 'undefined' && row.value !== 'null');

const photoPayloadFromVisit = (photos?: Array<{ source: 'camera' | 'upload'; fileName: string; contentType?: string; sizeBytes?: number; dataUrl?: string }>) => {
  const photo = photos?.[0];
  return photo ? JSON.stringify({ note: 'Photo saved with visit update', photo }) : undefined;
};

const salesVisitStatus = (nextAction: string) => {
  if (nextAction === 'closed') return 'Closed';
  if (nextAction === 'no_follow_up') return 'No follow-up';
  return 'Follow-up needed';
};

const serviceVisitStatus = (nextAction: string) => {
  if (nextAction === 'closed') return 'Closed';
  if (nextAction === 'no_follow_up') return 'No follow-up';
  if (nextAction === 'parts_required') return 'Parts required';
  return 'Next visit needed';
};

export function createCrystalBioApi(backend: Backend, options: { mailer?: CrystalBioMailer; appBaseUrl?: string; clientErrorLogStore?: ClientErrorLogStore; loginActivityLogStore?: LoginActivityLogStore } = {}) {
  const mailer = options.mailer;
  const clientErrorLogStore = options.clientErrorLogStore ?? createMemoryClientErrorLogStore();
  const loginActivityLogStore = options.loginActivityLogStore ?? createMemoryLoginActivityLogStore();
  const appBaseUrl = options.appBaseUrl ?? 'https://work.convogenie.ai';
  const setupLinkFor = (agent: Agent) => agent.inviteToken ? `${appBaseUrl}/?setupToken=${encodeURIComponent(agent.inviteToken)}` : appBaseUrl;
  const sendSetupEmail = (agent: Agent, reason: 'invite' | 'reset' | 'login') => {
    if (!mailer?.isConfigured || !agent.email) return 'not_configured';
    const setupLink = setupLinkFor(agent);
    const subject = reason === 'invite' ? 'Set up your CrystalBio Field App account' : reason === 'reset' ? 'Reset your CrystalBio Field App password' : 'Your CrystalBio Field App sign-in link';
    const text = `Hello ${agent.name},\n\nOpen this secure link to set your CrystalBio Field App password and sign in:\n${setupLink}\n\nIf you did not request this, please ignore this message.`;
    void mailer.send({
      to: agent.email,
      subject,
      text,
      html: `<p>Hello ${agent.name},</p><p>Open this secure link to set your CrystalBio Field App password and sign in:</p><p><a href="${setupLink}">${setupLink}</a></p><p>If you did not request this, please ignore this message.</p>`,
    }).catch((error) => console.error('CrystalBio email failed:', error));
    return 'queued';
  };
  const sessionFor = (request: ApiRequest) => {
    const token = parseBearerToken(request.headers);
    if (!token) throw new ValidationError('Login session is required');
    return backend.getSession(token);
  };

  const ok = (body: Record<string, any>, status = 200): ApiResponse => ({ status, body });

  const fail = (error: unknown): ApiResponse => {
    if (error instanceof ValidationError) {
      if (error.message === 'Login session is required' || error.message === 'Valid login session is required' || error.message === 'Active logged-in agent is required') {
        return { status: 401, body: { error: 'Login session is required' } };
      }
      if (isAdminAccessError(error)) return { status: 403, body: { error: error.message } };
      return { status: 400, body: { error: error.message } };
    }
    return { status: 500, body: { error: 'Unexpected server error' } };
  };

  return {
    handle(request: ApiRequest): ApiResponse {
      try {
        const { pathname, query } = splitPath(request.path);

        if (request.method === 'POST' && pathname === '/auth/login') {
          const body = requireBody(request.body);
          if (body.agentId || body.loginCode || body.passcode) throw new ValidationError('Email and password login is required');
          if (!body.email || !String(body.email).trim()) throw new ValidationError('Email is required');
          if (!body.password || !String(body.password).trim()) throw new ValidationError('Password is required');
          const loginInput: LoginInput = { email: String(body.email), password: String(body.password) };
          const requestedEmail = String(body.email).trim().toLowerCase();
          try {
            const session = backend.login(loginInput);
            loginActivityLogStore.add(buildLoginActivityEvent({ email: requestedEmail, success: true, message: 'Login successful', session }));
            return ok({ session });
          } catch (error) {
            loginActivityLogStore.add(buildLoginActivityEvent({ email: requestedEmail, success: false, message: error instanceof Error ? error.message : 'Login failed' }));
            throw error;
          }
        }

        if (request.method === 'GET' && pathname === '/auth/session') {
          const session = sessionFor(request);
          return ok({ session });
        }

        if (request.method === 'POST' && pathname === '/client-error-logs') {
          const body = requireBody(request.body);
          let session;
          try {
            const token = parseBearerToken(request.headers);
            if (token) session = backend.getSession(token);
          } catch {
            session = undefined;
          }
          const event = buildClientErrorEvent(body, session);
          clientErrorLogStore.add(event);
          return ok({ logged: true, event }, 201);
        }

        if (request.method === 'GET' && pathname === '/admin/client-error-logs') {
          const session = sessionFor(request);
          backend.getAdminReport(session.agentId, { fromDate: '1900-01-01', toDate: '2999-12-31' });
          const limit = Number.parseInt(query.limit ?? '50', 10);
          return ok({ events: clientErrorLogStore.list(Number.isFinite(limit) ? limit : 50) });
        }

        if (request.method === 'GET' && pathname === '/admin/login-activity') {
          const session = sessionFor(request);
          backend.getAdminReport(session.agentId, { fromDate: '1900-01-01', toDate: '2999-12-31' });
          const limit = Number.parseInt(query.limit ?? '100', 10);
          return ok({ events: loginActivityLogStore.list(Number.isFinite(limit) ? limit : 100) });
        }

        if (request.method === 'POST' && pathname === '/auth/request-link') {
          const body = requireBody(request.body);
          if (!body.email || !String(body.email).trim()) throw new ValidationError('Registered email is required');
          const agent = backend.requestPasswordSetupLink(String(body.email));
          const emailDelivery = agent ? sendSetupEmail(agent, 'login') : (mailer?.isConfigured ? 'queued' : 'not_configured');
          return ok({ emailDelivery, message: 'If this email is registered, a sign-in/setup link will be sent.' });
        }

        if (request.method === 'POST' && pathname === '/auth/setup-password') {
          const agent = backend.setupPassword(requireBody(request.body) as any);
          return ok({ agent: { id: agent.id, name: agent.name, role: agent.role, employeeId: agent.employeeId, email: agent.email, mobile: agent.mobile, active: agent.active, inviteStatus: agent.inviteStatus } });
        }

        if (request.method === 'POST' && pathname === '/attendance/check-in') {
          const session = sessionFor(request);
          const attendance = backend.checkIn(session.agentId, requireBody(request.body) as any);
          return ok({ attendance }, 201);
        }

        if (request.method === 'POST' && pathname === '/attendance/check-out') {
          const session = sessionFor(request);
          const attendance = backend.checkOut(session.agentId, requireBody(request.body) as any);
          return ok({ attendance }, 200);
        }

        if (request.method === 'POST' && pathname === '/leave-requests') {
          const session = sessionFor(request);
          const leaveRequest = backend.submitLeaveRequest(session.agentId, requireBody(request.body) as any);
          return ok({ leaveRequest }, 201);
        }

        const leaveReviewMatch = pathname.match(/^\/leave-requests\/([^/]+)\/review$/);
        if (request.method === 'PATCH' && leaveReviewMatch) {
          const session = sessionFor(request);
          const body = requireBody(request.body);
          const leaveRequest = backend.reviewLeaveRequest(
            session.agentId,
            leaveReviewMatch[1],
            requireLeaveReviewStatus(body.status),
          );
          return ok({ leaveRequest });
        }

        if (request.method === 'POST' && pathname === '/sales-opportunities') {
          const session = sessionFor(request);
          const opportunity = backend.createSalesOpportunity(session.agentId, requireBody(request.body) as any);
          return ok({ opportunity }, 201);
        }

        const salesOpportunityMatch = pathname.match(/^\/sales-opportunities\/([^/]+)$/);
        if (request.method === 'PATCH' && salesOpportunityMatch) {
          const session = sessionFor(request);
          const opportunity = backend.updateSalesOpportunity(session.agentId, salesOpportunityMatch[1], requireBody(request.body) as any);
          return ok({ opportunity });
        }

        const salesVisitMatch = pathname.match(/^\/sales-opportunities\/([^/]+)\/visits$/);
        if (request.method === 'POST' && salesVisitMatch) {
          const session = sessionFor(request);
          const visit = backend.addSalesVisitUpdate(session.agentId, salesVisitMatch[1], requireBody(request.body) as any);
          return ok({ visit }, 201);
        }

        if (request.method === 'POST' && pathname === '/service-records') {
          const session = sessionFor(request);
          const serviceRecord = backend.createServiceRecord(session.agentId, requireBody(request.body) as any);
          return ok({ serviceRecord }, 201);
        }

        const serviceRecordMatch = pathname.match(/^\/service-records\/([^/]+)$/);
        if (request.method === 'PATCH' && serviceRecordMatch) {
          const session = sessionFor(request);
          const serviceRecord = backend.updateServiceRecord(session.agentId, serviceRecordMatch[1], requireBody(request.body) as any);
          return ok({ serviceRecord });
        }

        const serviceVisitMatch = pathname.match(/^\/service-records\/([^/]+)\/visits$/);
        if (request.method === 'POST' && serviceVisitMatch) {
          const session = sessionFor(request);
          const visit = backend.addServiceVisitUpdate(session.agentId, serviceVisitMatch[1], requireBody(request.body) as any);
          return ok({ visit }, 201);
        }

        if (request.method === 'GET' && pathname === '/admin/agents') {
          const session = sessionFor(request);
          const agents = backend.listAdminAgents(session.agentId).map((agent) => publicAgent(agent));
          return ok({ agents });
        }

        if (request.method === 'POST' && pathname === '/admin/agents') {
          const session = sessionFor(request);
          const agent = backend.createAdminInvite(session.agentId, requireBody(request.body) as any);
          return ok({ agent: publicAgent(agent, true), setupLink: setupLinkFor(agent), emailDelivery: sendSetupEmail(agent, 'invite') }, 201);
        }

        const adminAgentStatusMatch = pathname.match(/^\/admin\/agents\/([^/]+)\/status$/);
        if (request.method === 'PATCH' && adminAgentStatusMatch) {
          const session = sessionFor(request);
          const body = requireBody(request.body);
          if (typeof body.active !== 'boolean') throw new ValidationError('Active status is required');
          const agent = backend.updateAdminAgentStatus(session.agentId, adminAgentStatusMatch[1], { active: body.active });
          return ok({ agent: publicAgent(agent) });
        }

        const adminAgentInviteMatch = pathname.match(/^\/admin\/agents\/([^/]+)\/reset-invite$/);
        if (request.method === 'POST' && adminAgentInviteMatch) {
          const session = sessionFor(request);
          const agent = backend.resetAdminInvite(session.agentId, adminAgentInviteMatch[1]);
          return ok({ agent: publicAgent(agent, true), setupLink: setupLinkFor(agent), emailDelivery: sendSetupEmail(agent, 'reset') });
        }

        if (request.method === 'GET' && pathname === '/admin/leave-requests') {
          const session = sessionFor(request);
          backend.getAdminReport(session.agentId, { fromDate: '1900-01-01', toDate: '2999-12-31' });
          return ok({ leaveRequests: backend.exportState().leaveRequests });
        }

        if (request.method === 'GET' && pathname === '/admin/reports') {
          const session = sessionFor(request);
          const report = backend.getAdminReport(session.agentId, {
            fromDate: query.fromDate ?? '',
            toDate: query.toDate ?? '',
          });
          return ok({ report });
        }

        if (request.method === 'GET' && pathname === '/field-visits') {
          const session = sessionFor(request);
          const state = backend.exportState();
          const canSeeAll = session.role === 'admin' && query.scope === 'team';
          const entries = [
            ...state.sales.flatMap((opportunity) => opportunity.visits
              .filter((visit) => canSeeAll || visit.agentId === session.agentId || opportunity.ownerAgentId === session.agentId)
              .map((visit) => ({
                id: visit.id,
                customer: opportunity.accountName,
                type: 'Sales' as const,
                status: salesVisitStatus(visit.nextAction),
                next: shortDateLabel(visit.followUpDate),
                tone: visit.nextAction === 'follow_up_needed' ? 'warning' as const : 'soft' as const,
                agentId: visit.agentId,
                agentName: visit.agentName,
                visitDate: visit.visitDate,
                visitTime: visit.visitTime,
                photoPayload: opportunity.sitePhoto ?? photoPayloadFromVisit(visit.photos),
                detailRows: compactDetailRows([
                  ['Submitted by', visit.agentName],
                  ['Visit date', visit.visitTime ? `${visit.visitDate} • ${visit.visitTime}` : visit.visitDate],
                  ['Customer', opportunity.accountName],
                  ['Contact person', opportunity.contactPerson],
                  ['Phone', opportunity.phone],
                  ['Email', opportunity.email],
                  ['Department / address', opportunity.departmentAddress],
                  ['Lead source', opportunity.leadSource],
                  ['Product type', opportunity.productType],
                  ['Brand / model', [opportunity.brandName, opportunity.equipmentModel].filter(Boolean).join(' • ')],
                  ['Requirement', opportunity.requirement],
                  ['Visit note', visit.note],
                  ['Next action', salesVisitStatus(visit.nextAction)],
                  ['Follow-up date', visit.followUpDate],
                  ['Quote submitted', opportunity.quoteSubmitted],
                  ['Quote status', opportunity.quoteStatus],
                  ['Budget / proposal', opportunity.budgetaryProposal],
                  ['Fund status', opportunity.fundStatus],
                  ['Probability', opportunity.probability],
                  ['Closing date', opportunity.closingDate],
                  ['Support required', opportunity.supportRequired],
                  ['Office notes', opportunity.officeNotes],
                ]),
                sortDate: `${visit.visitDate}T${visit.visitTime}`,
              }))),
            ...state.service.flatMap((record) => record.visits
              .filter((visit) => canSeeAll || visit.agentId === session.agentId || record.ownerAgentId === session.agentId)
              .map((visit) => ({
                id: visit.id,
                customer: record.customerName,
                type: 'Service' as const,
                status: serviceVisitStatus(visit.nextAction),
                next: shortDateLabel(visit.nextVisitDate),
                tone: visit.nextAction === 'closed' ? 'soft' as const : 'info' as const,
                agentId: visit.agentId,
                agentName: visit.agentName,
                visitDate: visit.visitDate,
                visitTime: visit.visitTime,
                photoPayload: record.photoNote ?? photoPayloadFromVisit(visit.photos),
                detailRows: compactDetailRows([
                  ['Submitted by', visit.agentName],
                  ['Visit date', visit.visitTime ? `${visit.visitDate} • ${visit.visitTime}` : visit.visitDate],
                  ['Customer', record.customerName],
                  ['Contact person', record.contactPerson],
                  ['Phone', record.phone],
                  ['Email', record.email],
                  ['Department / address', record.departmentAddress],
                  ['Equipment', [record.equipmentName, record.brandName, record.modelName].filter(Boolean).join(' • ')],
                  ['Serial number', record.serialNumber],
                  ['Issue category', record.issueCategory],
                  ['Issue description', record.issueDescription],
                  ['Warranty / AMC', record.warrantyAmc],
                  ['Service type', visit.serviceType],
                  ['Work done', visit.workDone],
                  ['Next action', serviceVisitStatus(visit.nextAction)],
                  ['Next visit date', visit.nextVisitDate],
                  ['Parts required', record.partsRequired],
                  ['Parts used', record.partsUsed],
                  ['Machine status', record.machineStatus],
                  ['Support note', record.supportRequiredNote],
                  ['Final remarks', record.finalRemarks],
                  ['Office notes', visit.officeNotes],
                ]),
                sortDate: `${visit.visitDate}T${visit.visitTime}`,
              }))),
          ]
            .sort((first, second) => second.sortDate.localeCompare(first.sortDate))
            .slice(0, 30)
            .map(({ sortDate, ...entry }) => entry);
          return ok({ entries });
        }

        return { status: 404, body: { error: 'Route not found' } };
      } catch (error) {
        return fail(error);
      }
    },
  };
}
