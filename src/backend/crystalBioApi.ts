import { ValidationError, type LoginInput, type createCrystalBioBackend } from './crystalBioBackend';

type Backend = ReturnType<typeof createCrystalBioBackend>;

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

export function createCrystalBioApi(backend: Backend) {
  const sessionFor = (request: ApiRequest) => {
    const token = parseBearerToken(request.headers);
    if (!token) throw new ValidationError('Login session is required');
    return backend.getSession(token);
  };

  const ok = (body: Record<string, any>, status = 200): ApiResponse => ({ status, body });

  const fail = (error: unknown): ApiResponse => {
    if (error instanceof ValidationError) {
      if (error.message === 'Login session is required' || error.message === 'Valid login session is required') {
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
          const session = backend.login(loginInput);
          return ok({ session });
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
          return ok({ agent: publicAgent(agent, true), emailDelivery: 'not_configured' }, 201);
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
          return ok({ agent: publicAgent(agent, true), emailDelivery: 'not_configured' });
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

        return { status: 404, body: { error: 'Route not found' } };
      } catch (error) {
        return fail(error);
      }
    },
  };
}
