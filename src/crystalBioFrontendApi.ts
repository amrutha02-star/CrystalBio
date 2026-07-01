export type FrontendSession = {
  token: string;
  agentId: string;
  agentName: string;
  role: 'sales' | 'service' | 'both' | 'admin';
  phone?: string;
  email?: string;
};

export type FrontendLoginInput = string | { email?: string; password?: string; loginCode?: string; passcode?: string };

export type FrontendGps = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type FrontendAttendance = {
  id: string;
  agentId: string;
  agentName: string;
  date: string;
  checkInTime: string;
  checkInGps?: FrontendGps;
  status: 'checked_in' | 'checked_out';
  checkOutTime?: string;
  checkOutGps?: FrontendGps;
  workTypes?: string[];
  autoCheckedOut?: boolean;
  autoCheckOutReason?: string;
  systemRestored?: boolean;
};

export type FrontendLeaveRequest = {
  id: string;
  agentId: string;
  agentName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type FrontendLeaveRequestInput = {
  fromDate: string;
  toDate: string;
  reason: string;
  note?: string;
};

export type FrontendAdminSeatInput = {
  name: string;
  role: 'sales' | 'service' | 'both' | 'admin';
  employeeId: string;
  email: string;
  mobile?: string;
};

export type FrontendAdminSeatInvite = FrontendAdminSeatInput & {
  id: string;
  active: boolean;
  inviteStatus?: 'pending' | 'accepted';
  inviteToken?: string;
  setupLink?: string;
  emailDelivery?: 'queued' | 'not_configured';
};

export type FrontendAdminAttendanceDetail = FrontendAttendance & {
  checkInAt?: string;
  checkOutAt?: string;
};

export type FrontendAdminReport = {
  fromDate: string;
  toDate: string;
  totals: {
    checkedInAgents: number;
    checkedOutAgents: number;
    salesVisits: number;
    serviceVisits: number;
    pendingLeaveRequests: number;
  };
  agentSummaries: Array<{
    agentId: string;
    agentName: string;
    role?: 'sales' | 'service' | 'both' | 'admin';
    date: string;
    attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
    salesVisitCount: number;
    serviceVisitCount: number;
    followUpsDue: string[];
  }>;
  attendanceDetails?: FrontendAdminAttendanceDetail[];
  followUpsDue: string[];
};

export type FrontendLoginActivityEvent = {
  id: string;
  createdAt: string;
  email?: string;
  success: boolean;
  message: string;
  agentId?: string;
  agentName?: string;
  role?: 'sales' | 'service' | 'both' | 'admin';
};

export type FrontendClientErrorEvent = {
  id: string;
  createdAt: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  journey: string;
  message: string;
  path?: string;
  status?: number;
  pageUrl?: string;
  agentId?: string;
  agentName?: string;
  role?: 'sales' | 'service' | 'both' | 'admin';
};

export type FrontendPublicMonitorSnapshot = {
  generatedAt: string;
  loginActivity: FrontendLoginActivityEvent[];
  clientErrors: FrontendClientErrorEvent[];
};

export type FrontendSalesNextAction = 'follow_up_needed' | 'no_follow_up' | 'closed';
export type FrontendServiceType = 'installation' | 'preventive_maintenance' | 'breakdown' | 'repair' | 'calibration' | 'demo' | 'training' | 'other';
export type FrontendServiceNextAction = 'parts_required' | 'next_visit_needed' | 'no_follow_up' | 'closed';

export type FrontendPhotoAttachment = {
  source: 'camera' | 'upload';
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  dataUrl?: string;
};

export type FrontendSalesVisitInput = {
  accountName: string;
  contactPerson?: string;
  phone?: string;
  requirement?: string;
  note: string;
  nextAction: FrontendSalesNextAction;
  followUpDate?: string;
  gps?: FrontendGps;
  photos?: FrontendPhotoAttachment[];
};

export type FrontendSalesStep2Input = {
  accountName: string;
  contactPerson?: string;
  designation?: string;
  phone?: string;
  email?: string;
  departmentAddress?: string;
  leadSource?: string;
  productType?: string;
  brandName?: string;
  equipmentModel?: string;
  requirement?: string;
  step2Saved?: boolean;
};

export type FrontendSalesStep3Input = {
  quoteSubmitted?: 'yes' | 'no' | '';
  budgetaryProposal?: string;
  quoteStatus?: string;
  fundStatus?: string;
  probability?: string;
  closingDate?: string;
  supportRequired?: string;
  remarksTimeline?: string;
  officeNotes?: string;
  sitePhoto?: string;
  equipmentPlatePhoto?: string;
  installationPhoto?: string;
  issuePhoto?: string;
  visitingCardPhoto?: string;
  step3Saved?: boolean;
};

export type FrontendSalesVisit = {
  id: string;
  opportunityId: string;
  agentId: string;
  agentName: string;
  visitNumber: number;
  visitDate: string;
  visitTime: string;
  gps: FrontendGps;
  note: string;
  nextAction: FrontendSalesNextAction;
  followUpDate?: string;
  photos?: FrontendPhotoAttachment[];
};

export type FrontendSalesSaveResult = {
  opportunity: {
    id: string;
    ownerAgentId: string;
    accountName: string;
    contactPerson?: string;
    designation?: string;
    phone?: string;
    email?: string;
    departmentAddress?: string;
    leadSource?: string;
    productType?: string;
    brandName?: string;
    equipmentModel?: string;
    requirement?: string;
    quoteSubmitted?: 'yes' | 'no' | '';
    budgetaryProposal?: string;
    quoteStatus?: string;
    fundStatus?: string;
    probability?: string;
    closingDate?: string;
    supportRequired?: string;
    remarksTimeline?: string;
    officeNotes?: string;
    sitePhoto?: string;
    equipmentPlatePhoto?: string;
    installationPhoto?: string;
    issuePhoto?: string;
    visitingCardPhoto?: string;
    step2Saved?: boolean;
    step3Saved?: boolean;
    status: 'open' | 'closed';
    visits?: FrontendSalesVisit[];
  };
  visit: FrontendSalesVisit;
};

export type FrontendServiceVisitInput = {
  customerName: string;
  phone?: string;
  contactPerson?: string;
  email?: string;
  departmentAddress?: string;
  equipmentName?: string;
  brandName?: string;
  modelName?: string;
  serialNumber?: string;
  issueCategory?: string;
  issueDescription?: string;
  warrantyAmc?: string;
  serviceType: FrontendServiceType;
  workDone: string;
  supportRequired: boolean;
  nextAction: FrontendServiceNextAction;
  nextVisitDate?: string;
  officeNotes?: string;
  partsRequired?: string;
  partsUsed?: string;
  machineStatus?: string;
  supportRequiredNote?: string;
  finalRemarks?: string;
  photoNote?: string;
  step2Saved?: boolean;
  step3Saved?: boolean;
  gps?: FrontendGps;
  photos?: FrontendPhotoAttachment[];
};

export type FrontendServiceVisit = {
  id: string;
  serviceRecordId: string;
  agentId: string;
  agentName: string;
  visitNumber: number;
  visitDate: string;
  visitTime: string;
  gps: FrontendGps;
  serviceType: FrontendServiceType;
  workDone: string;
  supportRequired: boolean;
  nextAction: FrontendServiceNextAction;
  nextVisitDate?: string;
  officeNotes?: string;
  photos?: FrontendPhotoAttachment[];
};

export type FrontendServiceSaveResult = {
  serviceRecord: {
    id: string;
    ownerAgentId: string;
    customerName: string;
    phone?: string;
    contactPerson?: string;
    email?: string;
    departmentAddress?: string;
    equipmentName?: string;
    brandName?: string;
    modelName?: string;
    serialNumber?: string;
    issueCategory?: string;
    issueDescription?: string;
    warrantyAmc?: string;
    partsRequired?: string;
    partsUsed?: string;
    machineStatus?: string;
    supportRequiredNote?: string;
    finalRemarks?: string;
    photoNote?: string;
    step2Saved?: boolean;
    step3Saved?: boolean;
    status: 'open' | 'pending_parts' | 'closed';
    visits?: FrontendServiceVisit[];
  };
  visit: FrontendServiceVisit;
};

export type FrontendVisitDetailRow = { label: string; value: string };

export type FrontendRecentVisitEntry = {
  id: string;
  recordId?: string;
  agentId?: string;
  customer: string;
  type: 'Sales' | 'Service';
  status: string;
  next: string;
  tone: 'warning' | 'info' | 'soft';
  agentName: string;
  visitDate?: string;
  visitTime?: string;
  photoPayload?: string;
  detailRows?: FrontendVisitDetailRow[];
};

type BackendAttendance = Omit<FrontendAttendance, 'checkInTime' | 'checkOutTime'> & {
  checkInAt?: string;
  checkInTime?: string;
  checkOutAt?: string;
  checkOutTime?: string;
};

type ApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  gpsProvider?: () => Promise<FrontendGps>;
};

const demoGps: FrontendGps = { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 18 };

const browserGpsProvider = async (): Promise<FrontendGps> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Location permission is required before saving field updates.');
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      }),
      () => reject(new Error('Allow location permission to save this field update.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
};

const trimSlash = (value: string) => value.replace(/\/$/, '');

type ApiFailureContext = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  token?: string;
  journey?: string;
  report?: (input: { method: string; path: string; status: number; message: string; token?: string; journey?: string }) => Promise<void>;
};

const parseJson = async <T>(response: Response, context?: ApiFailureContext): Promise<T> => {
  const body = await response.json();
  if (!response.ok) {
    const message = body?.error ?? 'Backend request failed';
    await context?.report?.({
      method: context.method,
      path: context.path,
      status: response.status,
      message,
      token: context.token,
      journey: context.journey,
    });
    throw new Error(message);
  }
  return body as T;
};

const normalizeAttendance = (attendance: BackendAttendance): FrontendAttendance => ({
  ...attendance,
  checkInTime: attendance.checkInTime ?? attendance.checkInAt ?? '',
  checkOutTime: attendance.checkOutTime ?? attendance.checkOutAt,
});

export function createCrystalBioFrontendApi(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ? trimSlash(options.baseUrl) : undefined;
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const formatIstDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const formatIstTime = (date: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  const gpsProvider = options.gpsProvider ?? (baseUrl ? browserGpsProvider : async () => demoGps);
  let demoCheckedIn = false;

  const reportClientError = async (input: { method: string; path: string; status: number; message: string; token?: string; journey?: string }) => {
    if (!baseUrl || input.path === '/client-error-logs') return;
    try {
      const pageUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
      await fetcher(`${baseUrl}/client-error-logs`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...(input.token ? { authorization: `Bearer ${input.token}` } : {}),
        },
        body: JSON.stringify({
          type: 'api_error',
          severity: input.status >= 500 ? 'high' : 'medium',
          journey: input.journey ?? `${input.method} ${input.path}`,
          message: input.message,
          path: input.path,
          status: input.status,
          ...(pageUrl ? { pageUrl } : {}),
          ...(userAgent ? { userAgent } : {}),
        }),
      });
    } catch {
      // Never block the real user because the monitoring log failed.
    }
  };

  const journeyForPath = (path: string) => {
    if (path === '/attendance/check-in') return 'Attendance check-in';
    if (path === '/attendance/check-out') return 'Attendance check-out';
    if (path === '/leave-requests') return 'Leave request save';
    if (path === '/sales-opportunities' || path.includes('/sales-opportunities/')) return 'Sales visit save';
    if (path === '/service-records' || path.includes('/service-records/')) return 'Service visit save';
    if (path.includes('/admin/reports')) return 'Admin reports';
    if (path.includes('/admin/agents')) return 'Admin profile/access';
    if (path === '/auth/login') return 'Login';
    return undefined;
  };

  const post = async <T>(path: string, body: unknown, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return parseJson<T>(response, { method: 'POST', path, token, journey: journeyForPath(path), report: reportClientError });
  };

  const patch = async <T>(path: string, body: unknown, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return parseJson<T>(response, { method: 'PATCH', path, token, journey: journeyForPath(path), report: reportClientError });
  };

  const get = async <T>(path: string, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    return parseJson<T>(response, { method: 'GET', path, token, journey: journeyForPath(path), report: reportClientError });
  };

  return {
    async reportClientIssue(input: { type?: string; severity?: 'critical' | 'high' | 'medium' | 'low'; journey?: string; message: string; path?: string; status?: number }) {
      if (!baseUrl) return;
      try {
        const pageUrl = typeof window !== 'undefined' ? window.location.href : undefined;
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
        await fetcher(`${baseUrl}/client-error-logs`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: input.type ?? 'client_error',
            severity: input.severity ?? 'high',
            journey: input.journey ?? 'App screen error',
            message: input.message,
            path: input.path,
            status: input.status,
            ...(pageUrl ? { pageUrl } : {}),
            ...(userAgent ? { userAgent } : {}),
          }),
        });
      } catch {
        // Monitoring should never interrupt the user.
      }
    },

    isBackendConfigured() {
      return Boolean(baseUrl);
    },

    async login(input: FrontendLoginInput = 'agent_2'): Promise<FrontendSession> {
      const agentId = typeof input === 'string' ? input : 'agent_2';
      if (!baseUrl) {
        return agentId === 'agent_3'
          ? { token: 'local-token-service', agentId, agentName: 'Service Agent', role: 'service', phone: 'Registered mobile', email: 'service.agent@crystalbio.in' }
          : { token: 'local-token', agentId, agentName: 'QA Test Agent', role: 'both', phone: 'Registered mobile', email: 'qa.agent@crystalbio.in' };
      }
      const body = typeof input === 'string' ? { agentId: input } : input;
      const result = await post<{ session: FrontendSession }>('/auth/login', body);
      return result.session;
    },

    async validateSession(session?: FrontendSession): Promise<FrontendSession> {
      if (!baseUrl) {
        if (!session) throw new Error('Saved login is not available');
        return session;
      }
      const result = await get<{ session: FrontendSession }>('/auth/session', session?.token);
      return result.session;
    },

    async requestSignInLink(email: string): Promise<{ emailDelivery: 'queued' | 'not_configured'; message: string }> {
      if (!baseUrl) return { emailDelivery: 'not_configured', message: 'Demo mode only.' };
      return post<{ emailDelivery: 'queued' | 'not_configured'; message: string }>('/auth/request-link', { email });
    },

    async setupPassword(input: { inviteToken: string; password: string }): Promise<FrontendAdminSeatInvite> {
      if (!baseUrl) {
        return { id: 'local-setup', name: 'Demo Agent', role: 'both', employeeId: 'LOCAL', email: 'demo@crystalbio.in', active: true, inviteStatus: 'accepted' };
      }
      const result = await post<{ agent: FrontendAdminSeatInvite }>('/auth/setup-password', input);
      return result.agent;
    },

    async downloadAgentReportPdf(session: FrontendSession, input: { fromDate: string; toDate: string; kind?: 'attendance' | 'visits' | 'combined' }): Promise<string> {
      if (!baseUrl) return '#demo-pdf-preview';
      const query = new URLSearchParams({ fromDate: input.fromDate, toDate: input.toDate, kind: input.kind ?? 'combined' }).toString();
      const response = await fetcher(`${baseUrl}/agent/reports.pdf?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: { authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const body = await response.json() as { error?: string };
          throw new Error(body.error || 'PDF download failed');
        }
        const text = await response.text();
        throw new Error(text || 'PDF download failed');
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },

    async downloadAdminReportPdf(session: FrontendSession, input: { fromDate: string; toDate: string; kind?: 'attendance' | 'visits' | 'combined' }): Promise<string> {
      if (!baseUrl) return '#demo-pdf-preview';
      const query = new URLSearchParams({ fromDate: input.fromDate, toDate: input.toDate, kind: input.kind ?? 'combined' }).toString();
      const response = await fetcher(`${baseUrl}/admin/reports.pdf?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: { authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const body = await response.json() as { error?: string };
          throw new Error(body.error || 'PDF download failed');
        }
        const text = await response.text();
        throw new Error(text || 'PDF download failed');
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },

    async getAdminReport(session: FrontendSession, input: { fromDate: string; toDate: string }): Promise<FrontendAdminReport> {
      if (!baseUrl) {
        return {
          fromDate: input.fromDate,
          toDate: input.toDate,
          totals: { checkedInAgents: 0, checkedOutAgents: 0, salesVisits: 0, serviceVisits: 0, pendingLeaveRequests: 0 },
          agentSummaries: [],
          followUpsDue: [],
        };
      }
      const query = new URLSearchParams({ fromDate: input.fromDate, toDate: input.toDate }).toString();
      const result = await get<{ report: FrontendAdminReport }>(`/admin/reports?${query}`, session.token);
      return result.report;
    },

    async getRecentVisits(session: FrontendSession, input?: { scope?: 'own' | 'team' }): Promise<FrontendRecentVisitEntry[]> {
      if (!baseUrl) return [];
      const query = input?.scope === 'team' ? '?scope=team' : '';
      const result = await get<{ entries: FrontendRecentVisitEntry[] }>(`/field-visits${query}`, session.token);
      return result.entries;
    },

    async getRecentVisitDetail(session: FrontendSession, input: { id: string; scope?: 'own' | 'team' }): Promise<FrontendRecentVisitEntry | null> {
      if (!baseUrl) return null;
      const query = new URLSearchParams({ entryId: input.id, includePayload: 'true' });
      if (input.scope === 'team') query.set('scope', 'team');
      const result = await get<{ entries: FrontendRecentVisitEntry[] }>(`/field-visits?${query.toString()}`, session.token);
      return result.entries[0] ?? null;
    },

    async getAdminLeaveRequests(session: FrontendSession): Promise<FrontendLeaveRequest[]> {
      if (!baseUrl) return [];
      const result = await get<{ leaveRequests: FrontendLeaveRequest[] }>('/admin/leave-requests', session.token);
      return result.leaveRequests;
    },

    async getAdminLoginActivity(session: FrontendSession): Promise<FrontendLoginActivityEvent[]> {
      if (!baseUrl) return [];
      const result = await get<{ events: FrontendLoginActivityEvent[] }>('/admin/login-activity?limit=120', session.token);
      return result.events;
    },

    async getAdminClientErrors(session: FrontendSession): Promise<FrontendClientErrorEvent[]> {
      if (!baseUrl) return [];
      const result = await get<{ events: FrontendClientErrorEvent[] }>('/admin/client-error-logs?limit=80', session.token);
      return result.events;
    },

    async getPublicMonitorSnapshot(): Promise<FrontendPublicMonitorSnapshot> {
      if (!baseUrl) return { generatedAt: now().toISOString(), loginActivity: [], clientErrors: [] };
      return get<FrontendPublicMonitorSnapshot>('/public/monitor?loginLimit=120&errorLimit=80');
    },

    async reviewLeaveRequest(session: FrontendSession, leaveRequestId: string, status: 'approved' | 'rejected'): Promise<FrontendLeaveRequest> {
      if (!baseUrl) {
        return {
          id: leaveRequestId,
          agentId: 'agent_3',
          agentName: 'Service Agent',
          fromDate: '2026-06-12',
          toDate: '2026-06-13',
          reason: 'Leave request',
          status,
        };
      }
      const result = await patch<{ leaveRequest: FrontendLeaveRequest }>(
        `/leave-requests/${leaveRequestId}/review`,
        { status },
        session.token,
      );
      return result.leaveRequest;
    },

    async createAdminInvite(session: FrontendSession, input: FrontendAdminSeatInput): Promise<FrontendAdminSeatInvite> {
      if (!baseUrl) {
        return {
          id: `local-seat-${now().getTime()}`,
          ...input,
          active: false,
          inviteStatus: 'pending',
        };
      }
      const result = await post<{ agent: FrontendAdminSeatInvite; setupLink?: string; emailDelivery?: 'queued' | 'not_configured' }>('/admin/agents', input, session.token);
      return { ...result.agent, setupLink: result.setupLink, emailDelivery: result.emailDelivery };
    },

    async getAdminAgents(session: FrontendSession): Promise<FrontendAdminSeatInvite[]> {
      if (!baseUrl) return [];
      const result = await get<{ agents: FrontendAdminSeatInvite[] }>('/admin/agents', session.token);
      return result.agents;
    },

    async resetAdminInvite(session: FrontendSession, agentId: string): Promise<FrontendAdminSeatInvite> {
      if (!baseUrl) throw new Error('Backend URL is not configured');
      const result = await post<{ agent: FrontendAdminSeatInvite; setupLink?: string; emailDelivery?: 'queued' | 'not_configured' }>(`/admin/agents/${agentId}/reset-invite`, {}, session.token);
      return { ...result.agent, setupLink: result.setupLink, emailDelivery: result.emailDelivery };
    },

    async updateAdminAgentStatus(session: FrontendSession, agentId: string, active: boolean): Promise<FrontendAdminSeatInvite> {
      if (!baseUrl) throw new Error('Backend URL is not configured');
      const result = await patch<{ agent: FrontendAdminSeatInvite }>(`/admin/agents/${agentId}/status`, { active }, session.token);
      return result.agent;
    },

    async getCurrentLocation(): Promise<FrontendGps> {
      return gpsProvider();
    },

    async getCurrentAttendance(session: FrontendSession): Promise<FrontendAttendance | null> {
      if (!baseUrl) return demoCheckedIn ? {
        id: 'local-attendance-1',
        agentId: session.agentId,
        agentName: session.agentName,
        date: formatIstDate(now()),
        checkInTime: now().toISOString(),
        checkInGps: { latitude: 12.9716, longitude: 77.5946 },
        status: 'checked_in',
        workTypes: ['Sales visit'],
      } : null;
      const result = await get<{ attendance: BackendAttendance | null }>('/attendance/current', session.token);
      return result.attendance ? normalizeAttendance(result.attendance) : null;
    },

    async checkIn(session: FrontendSession, gpsOverride?: FrontendGps, workTypes?: string[], note?: string): Promise<FrontendAttendance> {
      const gps = gpsOverride ?? await gpsProvider();
      const selectedWorkTypes = workTypes?.filter(Boolean) ?? [];
      if (!baseUrl) {
        demoCheckedIn = true;
        return {
          id: 'local-attendance-1',
          agentId: session.agentId,
          agentName: session.agentName,
          date: formatIstDate(now()),
          checkInTime: now().toISOString(),
          checkInGps: gps,
          status: 'checked_in',
          ...(selectedWorkTypes.length ? { workTypes: selectedWorkTypes } : {}),
        };
      }
      const result = await post<{ attendance: BackendAttendance }>(
        '/attendance/check-in',
        { timestamp: now().toISOString(), gps, workTypes: selectedWorkTypes, note },
        session.token,
      );
      return normalizeAttendance(result.attendance);
    },

    async checkOut(session: FrontendSession, gpsOverride?: FrontendGps): Promise<FrontendAttendance> {
      const gps = gpsOverride ?? await gpsProvider();
      if (!baseUrl) {
        demoCheckedIn = false;
        return {
          id: 'local-attendance-1',
          agentId: session.agentId,
          agentName: session.agentName,
          date: formatIstDate(now()),
          checkInTime: now().toISOString(),
          checkInGps: gps,
          checkOutTime: now().toISOString(),
          checkOutGps: gps,
          status: 'checked_out',
        };
      }
      const result = await post<{ attendance: BackendAttendance }>(
        '/attendance/check-out',
        { timestamp: now().toISOString(), gps },
        session.token,
      );
      return normalizeAttendance(result.attendance);
    },

    async submitLeaveRequest(session: FrontendSession, input: FrontendLeaveRequestInput): Promise<FrontendLeaveRequest> {
      if (!baseUrl) {
        return {
          id: `local-leave-${now().getTime()}`,
          agentId: session.agentId,
          agentName: session.agentName,
          fromDate: input.fromDate,
          toDate: input.toDate,
          reason: input.reason,
          ...(input.note ? { note: input.note } : {}),
          status: 'pending',
        };
      }
      const result = await post<{ leaveRequest: FrontendLeaveRequest }>(
        '/leave-requests',
        input,
        session.token,
      );
      return result.leaveRequest;
    },

    async submitSalesVisit(session: FrontendSession, input: FrontendSalesVisitInput): Promise<FrontendSalesSaveResult> {
      const gps = input.gps ?? await gpsProvider();
      const visitTimestamp = now();
      const visitDate = formatIstDate(visitTimestamp);
      const visitTime = formatIstTime(visitTimestamp);
      if (!baseUrl) {
        return {
          opportunity: {
            id: `local-sales-${visitTimestamp.getTime()}`,
            ownerAgentId: session.agentId,
            accountName: input.accountName,
            ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
            ...(input.requirement ? { requirement: input.requirement } : {}),
            status: input.nextAction === 'closed' ? 'closed' : 'open',
          },
          visit: {
            id: `local-sales-visit-${visitTimestamp.getTime()}`,
            opportunityId: `local-sales-${visitTimestamp.getTime()}`,
            agentId: session.agentId,
            agentName: session.agentName,
            visitNumber: 1,
            visitDate,
            visitTime,
            gps,
            note: input.note,
            nextAction: input.nextAction,
            ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
            photos: input.photos ?? [],
          },
        };
      }

      const opportunityResult = await post<{ opportunity: FrontendSalesSaveResult['opportunity'] }>(
        '/sales-opportunities',
        {
          accountName: input.accountName,
          ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.requirement ? { requirement: input.requirement } : {}),
        },
        session.token,
      );
      const visitResult = await post<{ visit: FrontendSalesVisit }>(
        `/sales-opportunities/${opportunityResult.opportunity.id}/visits`,
        {
          visitDate,
          visitTime,
          gps,
          note: input.note,
          nextAction: input.nextAction,
          ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
          photos: input.photos ?? [],
        },
        session.token,
      );
      return { opportunity: opportunityResult.opportunity, visit: visitResult.visit };
    },

    async addSalesVisitUpdate(session: FrontendSession, opportunityId: string, input: Omit<FrontendSalesVisitInput, 'accountName'>): Promise<FrontendSalesVisit> {
      const gps = input.gps ?? await gpsProvider();
      const visitTimestamp = now();
      const visitDate = formatIstDate(visitTimestamp);
      const visitTime = formatIstTime(visitTimestamp);
      if (!baseUrl) {
        return {
          id: `local-sales-visit-${visitTimestamp.getTime()}`,
          opportunityId,
          agentId: session.agentId,
          agentName: session.agentName,
          visitNumber: 1,
          visitDate,
          visitTime,
          gps,
          note: input.note,
          nextAction: input.nextAction,
          ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
          photos: input.photos ?? [],
        };
      }
      const visitResult = await post<{ visit: FrontendSalesVisit }>(
        `/sales-opportunities/${opportunityId}/visits`,
        {
          visitDate,
          visitTime,
          gps,
          note: input.note,
          nextAction: input.nextAction,
          ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
          photos: input.photos ?? [],
        },
        session.token,
      );
      return visitResult.visit;
    },

    async submitSalesStep2(session: FrontendSession, opportunityId: string, input: FrontendSalesStep2Input): Promise<FrontendSalesSaveResult['opportunity']> {
      if (!baseUrl) {
        return {
          id: opportunityId,
          ownerAgentId: session.agentId,
          status: 'open',
          ...input,
        };
      }
      const result = await patch<{ opportunity: FrontendSalesSaveResult['opportunity'] }>(
        `/sales-opportunities/${opportunityId}`,
        input,
        session.token,
      );
      return result.opportunity;
    },

    async submitSalesStep3(session: FrontendSession, opportunityId: string, input: FrontendSalesStep3Input): Promise<FrontendSalesSaveResult['opportunity']> {
      if (!baseUrl) {
        return {
          id: opportunityId,
          ownerAgentId: session.agentId,
          accountName: 'Demo sales opportunity',
          status: input.quoteStatus === 'Closed won' || input.quoteStatus === 'Closed lost' ? 'closed' : 'open',
          ...input,
        };
      }
      const result = await patch<{ opportunity: FrontendSalesSaveResult['opportunity'] }>(
        `/sales-opportunities/${opportunityId}`,
        input,
        session.token,
      );
      return result.opportunity;
    },

    async submitServiceVisit(session: FrontendSession, input: FrontendServiceVisitInput): Promise<FrontendServiceSaveResult> {
      const gps = input.gps ?? await gpsProvider();
      const visitTimestamp = now();
      const visitDate = formatIstDate(visitTimestamp);
      const visitTime = formatIstTime(visitTimestamp);
      if (!baseUrl) {
        return {
          serviceRecord: {
            id: `local-service-${visitTimestamp.getTime()}`,
            ownerAgentId: session.agentId,
            customerName: input.customerName,
            ...(input.phone ? { phone: input.phone } : {}),
            ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
            ...(input.email ? { email: input.email } : {}),
            ...(input.departmentAddress ? { departmentAddress: input.departmentAddress } : {}),
            ...(input.equipmentName ? { equipmentName: input.equipmentName } : {}),
            ...(input.brandName ? { brandName: input.brandName } : {}),
            ...(input.modelName ? { modelName: input.modelName } : {}),
            ...(input.serialNumber ? { serialNumber: input.serialNumber } : {}),
            ...(input.issueCategory ? { issueCategory: input.issueCategory } : {}),
            ...(input.issueDescription ? { issueDescription: input.issueDescription } : {}),
            ...(input.warrantyAmc ? { warrantyAmc: input.warrantyAmc } : {}),
            status: input.nextAction === 'closed' ? 'closed' : input.nextAction === 'parts_required' ? 'pending_parts' : 'open',
          },
          visit: {
            id: `local-service-visit-${visitTimestamp.getTime()}`,
            serviceRecordId: `local-service-${visitTimestamp.getTime()}`,
            agentId: session.agentId,
            agentName: session.agentName,
            visitNumber: 1,
            visitDate,
            visitTime,
            gps,
            serviceType: input.serviceType,
            workDone: input.workDone,
            supportRequired: input.supportRequired,
            nextAction: input.nextAction,
            ...(input.nextVisitDate ? { nextVisitDate: input.nextVisitDate } : {}),
            photos: input.photos ?? [],
            ...(input.officeNotes ? { officeNotes: input.officeNotes } : {}),
          },
        };
      }

      const recordResult = await post<{ serviceRecord: FrontendServiceSaveResult['serviceRecord'] }>(
        '/service-records',
        {
          customerName: input.customerName,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
          ...(input.email ? { email: input.email } : {}),
          ...(input.departmentAddress ? { departmentAddress: input.departmentAddress } : {}),
          ...(input.equipmentName ? { equipmentName: input.equipmentName } : {}),
          ...(input.brandName ? { brandName: input.brandName } : {}),
          ...(input.modelName ? { modelName: input.modelName } : {}),
          ...(input.serialNumber ? { serialNumber: input.serialNumber } : {}),
          ...(input.issueCategory ? { issueCategory: input.issueCategory } : {}),
          ...(input.issueDescription ? { issueDescription: input.issueDescription } : {}),
          ...(input.warrantyAmc ? { warrantyAmc: input.warrantyAmc } : {}),
        },
        session.token,
      );
      const visitResult = await post<{ visit: FrontendServiceVisit }>(
        `/service-records/${recordResult.serviceRecord.id}/visits`,
        {
          visitDate,
          visitTime,
          gps,
          serviceType: input.serviceType,
          workDone: input.workDone,
          supportRequired: input.supportRequired,
          nextAction: input.nextAction,
          ...(input.nextVisitDate ? { nextVisitDate: input.nextVisitDate } : {}),
          photos: input.photos ?? [],
          ...(input.officeNotes ? { officeNotes: input.officeNotes } : {}),
        },
        session.token,
      );
      return { serviceRecord: recordResult.serviceRecord, visit: visitResult.visit };
    },

    async addServiceVisitUpdate(session: FrontendSession, serviceRecordId: string, input: Omit<FrontendServiceVisitInput, 'customerName'>): Promise<FrontendServiceVisit> {
      const gps = input.gps ?? await gpsProvider();
      const visitTimestamp = now();
      const visitDate = formatIstDate(visitTimestamp);
      const visitTime = formatIstTime(visitTimestamp);
      if (!baseUrl) {
        return {
          id: `local-service-visit-${visitTimestamp.getTime()}`,
          serviceRecordId,
          agentId: session.agentId,
          agentName: session.agentName,
          visitNumber: 1,
          visitDate,
          visitTime,
          gps,
          serviceType: input.serviceType,
          workDone: input.workDone,
          supportRequired: input.supportRequired,
          nextAction: input.nextAction,
          ...(input.nextVisitDate ? { nextVisitDate: input.nextVisitDate } : {}),
          photos: input.photos ?? [],
          ...(input.officeNotes ? { officeNotes: input.officeNotes } : {}),
        };
      }
      const visitResult = await post<{ visit: FrontendServiceVisit }>(
        `/service-records/${serviceRecordId}/visits`,
        {
          visitDate,
          visitTime,
          gps,
          serviceType: input.serviceType,
          workDone: input.workDone,
          supportRequired: input.supportRequired,
          nextAction: input.nextAction,
          ...(input.nextVisitDate ? { nextVisitDate: input.nextVisitDate } : {}),
          photos: input.photos ?? [],
          ...(input.officeNotes ? { officeNotes: input.officeNotes } : {}),
        },
        session.token,
      );
      return visitResult.visit;
    },

    async submitServiceStep2(session: FrontendSession, serviceRecordId: string, input: Partial<FrontendServiceVisitInput>): Promise<FrontendServiceSaveResult['serviceRecord']> {
      if (!baseUrl) {
        return {
          id: serviceRecordId,
          ownerAgentId: session.agentId,
          customerName: input.customerName ?? 'Demo service customer',
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
          ...(input.email ? { email: input.email } : {}),
          ...(input.departmentAddress ? { departmentAddress: input.departmentAddress } : {}),
          ...(input.equipmentName ? { equipmentName: input.equipmentName } : {}),
          ...(input.brandName ? { brandName: input.brandName } : {}),
          ...(input.modelName ? { modelName: input.modelName } : {}),
          ...(input.serialNumber ? { serialNumber: input.serialNumber } : {}),
          ...(input.issueCategory ? { issueCategory: input.issueCategory } : {}),
          ...(input.issueDescription ? { issueDescription: input.issueDescription } : {}),
          ...(input.warrantyAmc ? { warrantyAmc: input.warrantyAmc } : {}),
          status: 'open',
        };
      }
      const result = await patch<{ serviceRecord: FrontendServiceSaveResult['serviceRecord'] }>(`/service-records/${serviceRecordId}`, input, session.token);
      return result.serviceRecord;
    },

    async submitServiceStep3(session: FrontendSession, serviceRecordId: string, input: Partial<FrontendServiceVisitInput>): Promise<FrontendServiceSaveResult['serviceRecord']> {
      if (!baseUrl) {
        return {
          id: serviceRecordId,
          ownerAgentId: session.agentId,
          customerName: input.customerName ?? 'Demo service customer',
          ...(input.partsRequired ? { partsRequired: input.partsRequired } : {}),
          ...(input.partsUsed ? { partsUsed: input.partsUsed } : {}),
          ...(input.machineStatus ? { machineStatus: input.machineStatus } : {}),
          ...(input.supportRequiredNote ? { supportRequiredNote: input.supportRequiredNote } : {}),
          ...(input.finalRemarks ? { finalRemarks: input.finalRemarks } : {}),
          ...(input.photoNote ? { photoNote: input.photoNote } : {}),
          status: 'open',
        };
      }
      const result = await patch<{ serviceRecord: FrontendServiceSaveResult['serviceRecord'] }>(`/service-records/${serviceRecordId}`, input, session.token);
      return result.serviceRecord;
    },

    isDemoCheckedIn() {
      return demoCheckedIn;
    },
  };
}

const envBaseUrl = (import.meta as unknown as { env?: { VITE_CRYSTALBIO_API_URL?: string } }).env?.VITE_CRYSTALBIO_API_URL;
const liveHostBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'work.convogenie.ai'
  ? 'https://work-api.convogenie.ai'
  : undefined;

export const crystalBioFrontendApi = createCrystalBioFrontendApi({ baseUrl: envBaseUrl || liveHostBaseUrl });
