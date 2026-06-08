export type FrontendSession = {
  token: string;
  agentId: string;
  agentName: string;
  role: 'sales' | 'service' | 'both' | 'admin';
};

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
  checkInGps: FrontendGps;
  status: 'checked_in' | 'checked_out';
  checkOutTime?: string;
  checkOutGps?: FrontendGps;
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

const trimSlash = (value: string) => value.replace(/\/$/, '');

const parseJson = async <T>(response: Response): Promise<T> => {
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error ?? 'Backend request failed');
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
  const gpsProvider = options.gpsProvider ?? (async () => demoGps);
  let demoCheckedIn = false;

  const post = async <T>(path: string, body: unknown, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return parseJson<T>(response);
  };

  return {
    isBackendConfigured() {
      return Boolean(baseUrl);
    },

    async login(agentId = 'agent_2'): Promise<FrontendSession> {
      if (!baseUrl) {
        return { token: 'demo-token', agentId, agentName: 'Rahul Sales', role: 'sales' };
      }
      const result = await post<{ session: FrontendSession }>('/auth/login', { agentId });
      return result.session;
    },

    async checkIn(session: FrontendSession): Promise<FrontendAttendance> {
      const gps = await gpsProvider();
      if (!baseUrl) {
        demoCheckedIn = true;
        return {
          id: 'demo-attendance-1',
          agentId: session.agentId,
          agentName: session.agentName,
          date: now().toISOString().slice(0, 10),
          checkInTime: now().toISOString(),
          checkInGps: gps,
          status: 'checked_in',
        };
      }
      const result = await post<{ attendance: BackendAttendance }>(
        '/attendance/check-in',
        { timestamp: now().toISOString(), gps },
        session.token,
      );
      return normalizeAttendance(result.attendance);
    },

    async checkOut(session: FrontendSession): Promise<FrontendAttendance> {
      const gps = await gpsProvider();
      if (!baseUrl) {
        demoCheckedIn = false;
        return {
          id: 'demo-attendance-1',
          agentId: session.agentId,
          agentName: session.agentName,
          date: now().toISOString().slice(0, 10),
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
          id: `demo-leave-${now().getTime()}`,
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

    isDemoCheckedIn() {
      return demoCheckedIn;
    },
  };
}

const envBaseUrl = (import.meta as unknown as { env?: { VITE_CRYSTALBIO_API_URL?: string } }).env?.VITE_CRYSTALBIO_API_URL;

export const crystalBioFrontendApi = createCrystalBioFrontendApi({ baseUrl: envBaseUrl });
