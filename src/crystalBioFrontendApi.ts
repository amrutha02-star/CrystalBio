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
    date: string;
    attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
    salesVisitCount: number;
    serviceVisitCount: number;
    followUpsDue: string[];
  }>;
  followUpsDue: string[];
};

export type FrontendSalesNextAction = 'follow_up_needed' | 'no_follow_up' | 'closed';
export type FrontendServiceType = 'installation' | 'preventive_maintenance' | 'breakdown' | 'repair' | 'calibration' | 'demo' | 'training' | 'other';
export type FrontendServiceNextAction = 'parts_required' | 'next_visit_needed' | 'no_follow_up' | 'closed';

export type FrontendSalesVisitInput = {
  accountName: string;
  contactPerson?: string;
  phone?: string;
  requirement?: string;
  note: string;
  nextAction: FrontendSalesNextAction;
  followUpDate?: string;
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
    status: 'open' | 'closed';
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
    status: 'open' | 'pending_parts' | 'closed';
  };
  visit: FrontendServiceVisit;
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
  const gpsProvider = options.gpsProvider ?? (baseUrl ? browserGpsProvider : async () => demoGps);
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

  const patch = async <T>(path: string, body: unknown, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return parseJson<T>(response);
  };

  const get = async <T>(path: string, token?: string) => {
    if (!baseUrl) throw new Error('Backend URL is not configured');
    const response = await fetcher(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    return parseJson<T>(response);
  };

  return {
    isBackendConfigured() {
      return Boolean(baseUrl);
    },

    async login(input: FrontendLoginInput = 'agent_2'): Promise<FrontendSession> {
      const agentId = typeof input === 'string' ? input : 'agent_2';
      if (!baseUrl) {
        return agentId === 'agent_3'
          ? { token: 'demo-token-service', agentId, agentName: 'Meera Service', role: 'service', phone: '+91 98765 43211', email: 'meera.service@crystalbio.in' }
          : { token: 'demo-token', agentId, agentName: 'Rahul Sales', role: 'sales', phone: '+91 98765 43210', email: 'rahul.sales@crystalbio.in' };
      }
      const body = typeof input === 'string' ? { agentId: input } : input;
      const result = await post<{ session: FrontendSession }>('/auth/login', body);
      return result.session;
    },

    async downloadAdminReportPdf(session: FrontendSession, input: { fromDate: string; toDate: string }): Promise<string> {
      if (!baseUrl) return '#demo-pdf-preview';
      const query = new URLSearchParams({ fromDate: input.fromDate, toDate: input.toDate }).toString();
      const response = await fetcher(`${baseUrl}/admin/reports.pdf?${query}`, {
        method: 'GET',
        headers: { authorization: `Bearer ${session.token}` },
      });
      if (!response.ok) {
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

    async submitSalesVisit(session: FrontendSession, input: FrontendSalesVisitInput): Promise<FrontendSalesSaveResult> {
      const gps = await gpsProvider();
      const visitTimestamp = now();
      const visitDate = visitTimestamp.toISOString().slice(0, 10);
      const visitTime = visitTimestamp.toTimeString().slice(0, 5);
      if (!baseUrl) {
        return {
          opportunity: {
            id: `demo-sales-${visitTimestamp.getTime()}`,
            ownerAgentId: session.agentId,
            accountName: input.accountName,
            ...(input.contactPerson ? { contactPerson: input.contactPerson } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
            ...(input.requirement ? { requirement: input.requirement } : {}),
            status: input.nextAction === 'closed' ? 'closed' : 'open',
          },
          visit: {
            id: `demo-sales-visit-${visitTimestamp.getTime()}`,
            opportunityId: `demo-sales-${visitTimestamp.getTime()}`,
            agentId: session.agentId,
            agentName: session.agentName,
            visitNumber: 1,
            visitDate,
            visitTime,
            gps,
            note: input.note,
            nextAction: input.nextAction,
            ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
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
          photos: [],
        },
        session.token,
      );
      return { opportunity: opportunityResult.opportunity, visit: visitResult.visit };
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
      const gps = await gpsProvider();
      const visitTimestamp = now();
      const visitDate = visitTimestamp.toISOString().slice(0, 10);
      const visitTime = visitTimestamp.toTimeString().slice(0, 5);
      if (!baseUrl) {
        return {
          serviceRecord: {
            id: `demo-service-${visitTimestamp.getTime()}`,
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
            id: `demo-service-visit-${visitTimestamp.getTime()}`,
            serviceRecordId: `demo-service-${visitTimestamp.getTime()}`,
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
          photos: [],
          ...(input.officeNotes ? { officeNotes: input.officeNotes } : {}),
        },
        session.token,
      );
      return { serviceRecord: recordResult.serviceRecord, visit: visitResult.visit };
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

export const crystalBioFrontendApi = createCrystalBioFrontendApi({ baseUrl: envBaseUrl });
