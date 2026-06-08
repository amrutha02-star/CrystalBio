export type AgentRole = 'sales' | 'service' | 'both' | 'admin';

export type GPSLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type PhotoAttachment = {
  source: 'camera' | 'upload';
  fileName: string;
};

export type Agent = {
  id: string;
  name: string;
  role: AgentRole;
  active: boolean;
};

export type AttendanceRecord = {
  id: string;
  agentId: string;
  agentName: string;
  date: string;
  checkInAt: string;
  checkInGps: GPSLocation;
  checkOutAt?: string;
  checkOutGps?: GPSLocation;
  status: 'checked_in' | 'checked_out';
  note?: string;
};

export type SalesNextAction = 'follow_up_needed' | 'no_follow_up' | 'closed';

export type SalesOpportunity = {
  id: string;
  ownerAgentId: string;
  accountName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  departmentAddress?: string;
  requirement?: string;
  status: 'open' | 'closed';
  visits: SalesVisitUpdate[];
};

export type SalesVisitInput = {
  visitDate: string;
  visitTime: string;
  gps?: GPSLocation;
  note: string;
  nextAction: SalesNextAction;
  followUpDate?: string;
  expectedClosingDate?: string;
  photos: PhotoAttachment[];
};

export type SalesVisitUpdate = SalesVisitInput & {
  id: string;
  opportunityId: string;
  agentId: string;
  agentName: string;
  visitNumber: number;
};

export type ServiceType =
  | 'installation'
  | 'preventive_maintenance'
  | 'breakdown'
  | 'repair'
  | 'calibration'
  | 'demo'
  | 'training'
  | 'other';

export type ServiceNextAction = 'parts_required' | 'next_visit_needed' | 'no_follow_up' | 'closed';

export type ServiceRecord = {
  id: string;
  ownerAgentId: string;
  customerName: string;
  phone?: string;
  departmentAddress?: string;
  brandName?: string;
  equipmentName?: string;
  serialNumber?: string;
  status: 'open' | 'pending_parts' | 'closed';
  visits: ServiceVisitUpdate[];
};

export type ServiceVisitInput = {
  visitDate: string;
  visitTime: string;
  gps?: GPSLocation;
  serviceType: ServiceType;
  workDone: string;
  supportRequired: boolean;
  nextAction: ServiceNextAction;
  nextVisitDate?: string;
  photos: PhotoAttachment[];
  officeNotes?: string;
};

export type ServiceVisitUpdate = ServiceVisitInput & {
  id: string;
  serviceRecordId: string;
  agentId: string;
  agentName: string;
  visitNumber: number;
};

export type DailyAgentReport = {
  agentId: string;
  agentName: string;
  date: string;
  attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
  salesVisitCount: number;
  serviceVisitCount: number;
  followUpsDue: string[];
};

export type LoginSession = {
  token: string;
  agentId: string;
  agentName: string;
  role: AgentRole;
};

export type LeaveRequest = {
  id: string;
  agentId: string;
  agentName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedByAgentId?: string;
};

export type AdminReport = {
  fromDate: string;
  toDate: string;
  totals: {
    checkedInAgents: number;
    checkedOutAgents: number;
    salesVisits: number;
    serviceVisits: number;
    pendingLeaveRequests: number;
  };
  agentSummaries: DailyAgentReport[];
  followUpsDue: string[];
};

export type CrystalBioBackendState = {
  nextId: number;
  agents: Agent[];
  sessions: LoginSession[];
  attendance: AttendanceRecord[];
  sales: SalesOpportunity[];
  service: ServiceRecord[];
  leaveRequests: LeaveRequest[];
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

type SalesOpportunityInput = Omit<Partial<SalesOpportunity>, 'id' | 'ownerAgentId' | 'visits' | 'status'> & {
  accountName: string;
};

type ServiceRecordInput = Omit<Partial<ServiceRecord>, 'id' | 'ownerAgentId' | 'visits' | 'status'> & {
  customerName: string;
};

const dateFromTimestamp = (timestamp: string) => timestamp.slice(0, 10);

const requireText = (value: string | undefined, message: string) => {
  if (!value || value.trim().length === 0) throw new ValidationError(message);
};

const requireGps = (gps: GPSLocation | undefined) => {
  if (!gps) throw new ValidationError('GPS location is required');
  if (!Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
    throw new ValidationError('Valid GPS latitude and longitude are required');
  }
};

const createIdFactory = () => {
  let next = 1;
  return (prefix: string) => `${prefix}_${next++}`;
};

export function createCrystalBioBackend(initialState?: CrystalBioBackendState) {
  let nextNumericId = initialState?.nextId ?? 1;
  const nextId = (prefix: string) => `${prefix}_${nextNumericId++}`;
  const agents = new Map<string, Agent>((initialState?.agents ?? []).map((agent) => [agent.id, agent]));
  const attendance = new Map<string, AttendanceRecord>(
    (initialState?.attendance ?? []).map((record) => [record.id, record]),
  );
  const sales = new Map<string, SalesOpportunity>((initialState?.sales ?? []).map((opportunity) => [opportunity.id, opportunity]));
  const service = new Map<string, ServiceRecord>((initialState?.service ?? []).map((record) => [record.id, record]));
  const sessions = new Map<string, LoginSession>((initialState?.sessions ?? []).map((session) => [session.token, session]));
  const leaveRequests = new Map<string, LeaveRequest>(
    (initialState?.leaveRequests ?? []).map((leaveRequest) => [leaveRequest.id, leaveRequest]),
  );

  const getAgent = (agentId: string) => {
    const agent = agents.get(agentId);
    if (!agent || !agent.active) throw new ValidationError('Active logged-in agent is required');
    return agent;
  };

  const activeAttendanceFor = (agentId: string) =>
    [...attendance.values()].find((record) => record.agentId === agentId && record.status === 'checked_in');

  const isInRange = (date: string, fromDate: string, toDate: string) => date >= fromDate && date <= toDate;

  const requireAdmin = (agentId: string) => {
    const agent = getAgent(agentId);
    if (agent.role !== 'admin') throw new ValidationError('Admin access is required');
    return agent;
  };

  return {
    exportState(): CrystalBioBackendState {
      return {
        nextId: nextNumericId,
        agents: [...agents.values()],
        sessions: [...sessions.values()],
        attendance: [...attendance.values()],
        sales: [...sales.values()],
        service: [...service.values()],
        leaveRequests: [...leaveRequests.values()],
      };
    },

    createAgent(input: { name: string; role: AgentRole }): Agent {
      requireText(input.name, 'Agent name is required');
      const agent: Agent = { id: nextId('agent'), name: input.name, role: input.role, active: true };
      agents.set(agent.id, agent);
      return agent;
    },

    login(agentId: string): LoginSession {
      const agent = getAgent(agentId);
      const session: LoginSession = {
        token: nextId('session'),
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
      };
      sessions.set(session.token, session);
      return session;
    },

    getSession(token: string): LoginSession {
      const session = sessions.get(token);
      if (!session) throw new ValidationError('Valid login session is required');
      return session;
    },

    checkIn(agentId: string, input: { timestamp: string; gps?: GPSLocation; note?: string }): AttendanceRecord {
      const agent = getAgent(agentId);
      requireText(input.timestamp, 'Check-in time is required');
      requireGps(input.gps);
      if (activeAttendanceFor(agentId)) throw new ValidationError('Agent is already checked in');

      const record: AttendanceRecord = {
        id: nextId('attendance'),
        agentId: agent.id,
        agentName: agent.name,
        date: dateFromTimestamp(input.timestamp),
        checkInAt: input.timestamp,
        checkInGps: input.gps as GPSLocation,
        status: 'checked_in',
        note: input.note,
      };
      attendance.set(record.id, record);
      return record;
    },

    checkOut(agentId: string, input: { timestamp: string; gps?: GPSLocation }): AttendanceRecord {
      getAgent(agentId);
      requireText(input.timestamp, 'Check-out time is required');
      requireGps(input.gps);
      const record = activeAttendanceFor(agentId);
      if (!record) throw new ValidationError('Agent must be checked in before checkout');
      record.checkOutAt = input.timestamp;
      record.checkOutGps = input.gps;
      record.status = 'checked_out';
      return record;
    },

    submitLeaveRequest(agentId: string, input: { fromDate: string; toDate: string; reason: string; note?: string }): LeaveRequest {
      const agent = getAgent(agentId);
      requireText(input.fromDate, 'Leave from date is required');
      requireText(input.toDate, 'Leave to date is required');
      requireText(input.reason, 'Leave reason is required');
      if (input.fromDate > input.toDate) throw new ValidationError('Leave from date must be before to date');
      const leave: LeaveRequest = {
        id: nextId('leave'),
        agentId: agent.id,
        agentName: agent.name,
        fromDate: input.fromDate,
        toDate: input.toDate,
        reason: input.reason,
        ...(input.note ? { note: input.note } : {}),
        status: 'pending',
      };
      leaveRequests.set(leave.id, leave);
      return leave;
    },

    reviewLeaveRequest(adminAgentId: string, leaveRequestId: string, status: 'approved' | 'rejected'): LeaveRequest {
      requireAdmin(adminAgentId);
      const leave = leaveRequests.get(leaveRequestId);
      if (!leave) throw new ValidationError('Leave request not found');
      leave.status = status;
      leave.reviewedByAgentId = adminAgentId;
      return leave;
    },

    createSalesOpportunity(agentId: string, input: SalesOpportunityInput): SalesOpportunity {
      getAgent(agentId);
      requireText(input.accountName, 'Account name is required');
      const opportunity: SalesOpportunity = {
        id: nextId('sales'),
        ownerAgentId: agentId,
        accountName: input.accountName,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        departmentAddress: input.departmentAddress,
        requirement: input.requirement,
        status: 'open',
        visits: [],
      };
      sales.set(opportunity.id, opportunity);
      return opportunity;
    },

    getSalesOpportunity(id: string): SalesOpportunity {
      const opportunity = sales.get(id);
      if (!opportunity) throw new ValidationError('Sales opportunity not found');
      return opportunity;
    },

    addSalesVisitUpdate(agentId: string, opportunityId: string, input: SalesVisitInput): SalesVisitUpdate {
      const agent = getAgent(agentId);
      const opportunity = sales.get(opportunityId);
      if (!opportunity) throw new ValidationError('Sales opportunity not found');
      requireText(input.visitDate, 'Visit date is required');
      requireText(input.visitTime, 'Visit time is required');
      requireGps(input.gps);
      requireText(input.note, 'Visit note is required');
      if (input.nextAction === 'follow_up_needed') {
        requireText(input.followUpDate, 'Follow-up date is required when follow-up is needed');
      }

      const update: SalesVisitUpdate = {
        ...input,
        gps: input.gps as GPSLocation,
        id: nextId('sales_visit'),
        opportunityId,
        agentId: agent.id,
        agentName: agent.name,
        visitNumber: opportunity.visits.length + 1,
      };
      opportunity.visits.push(update);
      if (input.nextAction === 'closed') opportunity.status = 'closed';
      return update;
    },

    createServiceRecord(agentId: string, input: ServiceRecordInput): ServiceRecord {
      getAgent(agentId);
      requireText(input.customerName, 'Customer name is required');
      const record: ServiceRecord = {
        id: nextId('service'),
        ownerAgentId: agentId,
        customerName: input.customerName,
        phone: input.phone,
        departmentAddress: input.departmentAddress,
        brandName: input.brandName,
        equipmentName: input.equipmentName,
        serialNumber: input.serialNumber,
        status: 'open',
        visits: [],
      };
      service.set(record.id, record);
      return record;
    },

    getServiceRecord(id: string): ServiceRecord {
      const record = service.get(id);
      if (!record) throw new ValidationError('Service record not found');
      return record;
    },

    addServiceVisitUpdate(agentId: string, serviceRecordId: string, input: ServiceVisitInput): ServiceVisitUpdate {
      const agent = getAgent(agentId);
      const record = service.get(serviceRecordId);
      if (!record) throw new ValidationError('Service record not found');
      requireText(input.visitDate, 'Service visit date is required');
      requireText(input.visitTime, 'Service visit time is required');
      requireGps(input.gps);
      requireText(input.workDone, 'Work done is required');
      if (input.nextAction === 'next_visit_needed' || input.nextAction === 'parts_required') {
        requireText(input.nextVisitDate, 'Next visit date is required when another service visit is needed');
      }

      const update: ServiceVisitUpdate = {
        ...input,
        gps: input.gps as GPSLocation,
        id: nextId('service_visit'),
        serviceRecordId,
        agentId: agent.id,
        agentName: agent.name,
        visitNumber: record.visits.length + 1,
      };
      record.visits.push(update);
      if (input.nextAction === 'closed') record.status = 'closed';
      if (input.nextAction === 'parts_required') record.status = 'pending_parts';
      return update;
    },

    getDailyAgentReport(agentId: string, date: string): DailyAgentReport {
      const agent = getAgent(agentId);
      const attendanceRecord = [...attendance.values()].find(
        (record) => record.agentId === agentId && record.date === date,
      );
      const salesVisits = [...sales.values()].flatMap((opportunity) => opportunity.visits).filter(
        (visit) => visit.agentId === agentId && visit.visitDate === date,
      );
      const serviceVisits = [...service.values()].flatMap((record) => record.visits).filter(
        (visit) => visit.agentId === agentId && visit.visitDate === date,
      );

      const followUpsDue = salesVisits
        .filter((visit) => visit.nextAction === 'follow_up_needed' && visit.followUpDate === date)
        .map((visit) => `Sales follow-up: ${sales.get(visit.opportunityId)?.accountName ?? visit.opportunityId}`);

      return {
        agentId,
        agentName: agent.name,
        date,
        attendanceStatus: attendanceRecord?.status ?? 'not_checked_in',
        salesVisitCount: salesVisits.length,
        serviceVisitCount: serviceVisits.length,
        followUpsDue,
      };
    },

    getAdminReport(adminAgentId: string, input: { fromDate: string; toDate: string }): AdminReport {
      requireAdmin(adminAgentId);
      requireText(input.fromDate, 'Report from date is required');
      requireText(input.toDate, 'Report to date is required');
      if (input.fromDate > input.toDate) throw new ValidationError('Report from date must be before to date');

      const nonAdminAgents = [...agents.values()].filter((agent) => agent.role !== 'admin');
      const attendanceInRange = [...attendance.values()].filter((record) =>
        isInRange(record.date, input.fromDate, input.toDate),
      );
      const salesVisits = [...sales.values()]
        .flatMap((opportunity) => opportunity.visits)
        .filter((visit) => isInRange(visit.visitDate, input.fromDate, input.toDate));
      const serviceVisits = [...service.values()]
        .flatMap((record) => record.visits)
        .filter((visit) => isInRange(visit.visitDate, input.fromDate, input.toDate));

      const agentSummaries = nonAdminAgents.map((agent) => {
        const agentAttendance = attendanceInRange.filter((record) => record.agentId === agent.id);
        const agentSalesVisits = salesVisits.filter((visit) => visit.agentId === agent.id);
        const agentServiceVisits = serviceVisits.filter((visit) => visit.agentId === agent.id);
        return {
          agentId: agent.id,
          agentName: agent.name,
          date: `${input.fromDate} to ${input.toDate}`,
          attendanceStatus: (agentAttendance[agentAttendance.length - 1]?.status ?? 'not_checked_in') as DailyAgentReport['attendanceStatus'],
          salesVisitCount: agentSalesVisits.length,
          serviceVisitCount: agentServiceVisits.length,
          followUpsDue: [],
        };
      });

      const followUpsDue = [...sales.values()].flatMap((opportunity) =>
        opportunity.visits
          .filter((visit) => visit.nextAction === 'follow_up_needed' && visit.followUpDate)
          .filter((visit) => isInRange(visit.followUpDate!, input.fromDate, input.toDate))
          .map((visit) => `Sales follow-up: ${opportunity.accountName} on ${visit.followUpDate}`),
      );

      return {
        fromDate: input.fromDate,
        toDate: input.toDate,
        totals: {
          checkedInAgents: new Set(attendanceInRange.map((record) => record.agentId)).size,
          checkedOutAgents: new Set(
            attendanceInRange.filter((record) => record.status === 'checked_out').map((record) => record.agentId),
          ).size,
          salesVisits: salesVisits.length,
          serviceVisits: serviceVisits.length,
          pendingLeaveRequests: [...leaveRequests.values()].filter((leave) => leave.status === 'pending').length,
        },
        agentSummaries,
        followUpsDue,
      };
    },
  };
}
