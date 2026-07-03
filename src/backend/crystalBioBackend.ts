import { randomBytes } from 'node:crypto';

export type AgentRole = 'sales' | 'service' | 'both' | 'admin';

export type GPSLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type PhotoAttachment = {
  source: 'camera' | 'upload';
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  dataUrl?: string;
};

export type Agent = {
  id: string;
  name: string;
  role: AgentRole;
  active: boolean;
  employeeId?: string;
  email?: string;
  mobile?: string;
  loginCode?: string;
  passcode?: string;
  password?: string;
  inviteToken?: string;
  inviteStatus?: 'pending' | 'accepted';
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
  workTypes?: string[];
  autoCheckedOut?: boolean;
  autoCheckOutReason?: 'missed_checkout_night_auto_close' | string;
  systemRestored?: boolean;
};

export type SalesNextAction = 'follow_up_needed' | 'no_follow_up' | 'closed';

export type SalesOpportunity = {
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
  modelName?: string;
  serialNumber?: string;
  contactPerson?: string;
  email?: string;
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
  role: AgentRole;
  date: string;
  attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
  salesVisitCount: number;
  serviceVisitCount: number;
  followUpsDue: string[];
};

export type AttendancePeriodSummary = {
  agentId: string;
  agentName: string;
  role: AgentRole;
  totalDays: number;
  workedDays: number;
  checkedOutDays: number;
  leaveAppliedDays: number;
  approvedLeaveDays: number;
  pendingLeaveDays: number;
  rejectedLeaveDays: number;
  noUpdateDays: number;
};

export type LoginSession = {
  token: string;
  agentId: string;
  agentName: string;
  role: AgentRole;
  employeeId?: string;
  phone?: string;
  email?: string;
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
  attendancePeriodSummaries?: AttendancePeriodSummary[];
  followUpsDue: string[];
  attendanceDetails?: AttendanceRecord[];
  salesVisitDetails?: Array<{
    opportunity: SalesOpportunity;
    visit: SalesVisitUpdate;
  }>;
  serviceVisitDetails?: Array<{
    record: ServiceRecord;
    visit: ServiceVisitUpdate;
  }>;
  leaveRequestDetails?: LeaveRequest[];
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

export type LoginInput = string | { agentId?: string; email?: string; password?: string; loginCode?: string; passcode?: string };

const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
const dateFromTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp.slice(0, 10);
  return istDateFormatter.format(date);
};

const requireText = (value: string | undefined, message: string) => {
  if (!value || value.trim().length === 0) throw new ValidationError(message);
};

const requireGps = (gps: GPSLocation | undefined) => {
  if (!gps) throw new ValidationError('GPS location is required');
  if (!Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
    throw new ValidationError('Valid GPS latitude and longitude are required');
  }
  if (gps.latitude < -90 || gps.latitude > 90 || gps.longitude < -180 || gps.longitude > 180) {
    throw new ValidationError('Valid GPS latitude and longitude are required');
  }
};

const requireRole = (agent: Agent, allowedRoles: AgentRole[], message: string) => {
  if (!allowedRoles.includes(agent.role)) throw new ValidationError(message);
};

const createIdFactory = () => {
  let next = 1;
  return (prefix: string) => `${prefix}_${next++}`;
};

const createSecureToken = (prefix: string) => `${prefix}_${randomBytes(24).toString('base64url')}`;
const createInviteToken = (agentId: string) => `invite_${agentId}_${createSecureToken('setup')}`;

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

  const activeAttendanceFor = (agentId: string, date?: string) =>
    [...attendance.values()]
      .filter((record) => record.agentId === agentId && record.status === 'checked_in' && (!date || record.date === date))
      .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt))[0];

  const isInRange = (date: string, fromDate: string, toDate: string) => date >= fromDate && date <= toDate;

  const toUtcDay = (date: string) => new Date(`${date}T00:00:00.000Z`).getTime();

  const daysInclusive = (fromDate: string, toDate: string) => Math.floor((toUtcDay(toDate) - toUtcDay(fromDate)) / 86_400_000) + 1;

  const overlappingDays = (fromDate: string, toDate: string, rangeFrom: string, rangeTo: string) => {
    const start = fromDate > rangeFrom ? fromDate : rangeFrom;
    const end = toDate < rangeTo ? toDate : rangeTo;
    return start <= end ? daysInclusive(start, end) : 0;
  };

  const requireAdmin = (agentId: string) => {
    const agent = getAgent(agentId);
    if (agent.role !== 'admin') throw new ValidationError('Admin access is required');
    return agent;
  };

  const clearSessionsForAgent = (agentId: string) => {
    [...sessions.entries()].forEach(([token, session]) => {
      if (session.agentId === agentId) sessions.delete(token);
    });
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

    createAgent(input: { name: string; role: AgentRole; employeeId?: string; email?: string; mobile?: string; loginCode?: string; passcode?: string; password?: string }): Agent {
      requireText(input.name, 'Agent name is required');
      const id = nextId('agent');
      const email = input.email?.trim().toLowerCase();
      const employeeId = input.employeeId?.trim() ?? input.loginCode;
      const agent: Agent = {
        id,
        name: input.name.trim(),
        role: input.role,
        active: true,
        employeeId,
        email,
        mobile: input.mobile?.trim(),
        loginCode: input.loginCode ?? employeeId ?? id,
        passcode: input.passcode ?? input.password,
        password: input.password ?? input.passcode,
        inviteStatus: input.password || input.passcode ? 'accepted' : undefined,
      };
      agents.set(agent.id, agent);
      return agent;
    },

    listAdminAgents(adminAgentId: string): Agent[] {
      requireAdmin(adminAgentId);
      return [...agents.values()];
    },

    createAdminInvite(adminAgentId: string, input: { name: string; role: AgentRole; employeeId: string; email: string; mobile?: string }): Agent {
      requireAdmin(adminAgentId);
      requireText(input.name, 'Agent name is required');
      requireText(input.employeeId, 'Employee ID is required');
      requireText(input.email, 'Email is required');
      const duplicateEmail = [...agents.values()].find((candidate) => candidate.email?.toLowerCase() === input.email.trim().toLowerCase());
      if (duplicateEmail) throw new ValidationError('Email is already registered');
      const id = nextId('agent');
      const agent: Agent = {
        id,
        name: input.name.trim(),
        role: input.role,
        active: false,
        employeeId: input.employeeId.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile?.trim(),
        loginCode: input.employeeId.trim(),
        inviteToken: createInviteToken(id),
        inviteStatus: 'pending',
      };
      agents.set(agent.id, agent);
      return agent;
    },

    resetAdminInvite(adminAgentId: string, agentId: string): Agent {
      requireAdmin(adminAgentId);
      const agent = agents.get(agentId);
      if (!agent) throw new ValidationError('Agent profile not found');
      if (agent.role === 'admin' && agent.id === adminAgentId) throw new ValidationError('Admins cannot reset their own access from this screen');
      clearSessionsForAgent(agent.id);
      agent.active = false;
      delete agent.password;
      delete agent.passcode;
      agent.inviteToken = createInviteToken(agent.id);
      agent.inviteStatus = 'pending';
      return agent;
    },

    requestPasswordSetupLink(email: string): Agent | null {
      requireText(email, 'Registered email is required');
      const agent = [...agents.values()].find((candidate) => candidate.email?.toLowerCase() === email.trim().toLowerCase());
      if (!agent) return null;
      clearSessionsForAgent(agent.id);
      agent.active = false;
      delete agent.password;
      delete agent.passcode;
      agent.inviteToken = createInviteToken(agent.id);
      agent.inviteStatus = 'pending';
      return agent;
    },

    updateAdminAgentStatus(adminAgentId: string, agentId: string, input: { active: boolean }): Agent {
      requireAdmin(adminAgentId);
      const agent = agents.get(agentId);
      if (!agent) throw new ValidationError('Agent profile not found');
      if (agent.id === adminAgentId && input.active === false) throw new ValidationError('Admins cannot deactivate their own profile');
      if (agent.inviteStatus === 'pending' && input.active) throw new ValidationError('Pending invite users must set a password before activation');
      agent.active = input.active;
      return agent;
    },

    setupPassword(input: { inviteToken: string; password: string }): Agent {
      requireText(input.inviteToken, 'Invite token is required');
      requireText(input.password, 'Password is required');
      if (input.password.trim().length < 8) throw new ValidationError('Password must be at least 8 characters');
      const agent = [...agents.values()].find((candidate) => candidate.inviteToken === input.inviteToken && candidate.inviteStatus === 'pending');
      if (!agent) throw new ValidationError('Valid invite token is required');
      clearSessionsForAgent(agent.id);
      agent.password = input.password;
      agent.passcode = input.password;
      agent.active = true;
      agent.inviteStatus = 'accepted';
      delete agent.inviteToken;
      return agent;
    },

    login(input: LoginInput): LoginSession {
      const credentials = typeof input === 'string' ? { agentId: input } : input;
      let agent: Agent | undefined;
      if (credentials.agentId) {
        agent = getAgent(credentials.agentId);
      } else if (credentials.email || credentials.password) {
        requireText(credentials.email, 'Email is required');
        requireText(credentials.password, 'Password is required');
        const requestedEmail = credentials.email?.trim().toLowerCase();
        agent = [...agents.values()].find(
          (candidate) => candidate.active && candidate.email?.toLowerCase() === requestedEmail && candidate.password === credentials.password,
        );
        if (!agent) throw new ValidationError('Invalid email or password');
      } else {
        requireText(credentials.loginCode, 'Login code is required');
        requireText(credentials.passcode, 'Passcode is required');
        agent = [...agents.values()].find(
          (candidate) => candidate.active && candidate.loginCode === credentials.loginCode && candidate.passcode === credentials.passcode,
        );
        if (!agent) throw new ValidationError('Invalid login code or passcode');
      }
      const session: LoginSession = {
        token: createSecureToken('session'),
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        employeeId: agent.employeeId,
        phone: agent.mobile,
        email: agent.email,
      };
      sessions.set(session.token, session);
      return session;
    },

    getSession(token: string): LoginSession {
      const session = sessions.get(token);
      if (!session) throw new ValidationError('Valid login session is required');
      const agent = getAgent(session.agentId);
      return {
        ...session,
        agentName: agent.name,
        role: agent.role,
        employeeId: agent.employeeId,
        phone: agent.mobile,
        email: agent.email,
      };
    },

    checkIn(agentId: string, input: { timestamp: string; gps?: GPSLocation; note?: string; workTypes?: string[] }): AttendanceRecord {
      const agent = getAgent(agentId);
      requireText(input.timestamp, 'Check-in time is required');
      requireGps(input.gps);
      const checkInDate = dateFromTimestamp(input.timestamp);
      if (activeAttendanceFor(agentId, checkInDate)) throw new ValidationError('Agent is already checked in');
      const selectedWorkTypes = Array.isArray(input.workTypes) ? input.workTypes.filter(Boolean) : [];

      const record: AttendanceRecord = {
        id: nextId('attendance'),
        agentId: agent.id,
        agentName: agent.name,
        date: checkInDate,
        checkInAt: input.timestamp,
        checkInGps: input.gps as GPSLocation,
        status: 'checked_in',
        note: input.note,
        ...(selectedWorkTypes.length ? { workTypes: selectedWorkTypes } : {}),
      };
      attendance.set(record.id, record);
      return record;
    },

    getCurrentAttendance(agentId: string, input: { timestamp: string }): AttendanceRecord | null {
      getAgent(agentId);
      requireText(input.timestamp, 'Current time is required');
      const currentDate = dateFromTimestamp(input.timestamp);
      return activeAttendanceFor(agentId, currentDate) ?? null;
    },

    checkOut(agentId: string, input: { timestamp: string; gps?: GPSLocation }): AttendanceRecord {
      getAgent(agentId);
      requireText(input.timestamp, 'Check-out time is required');
      requireGps(input.gps);
      const checkOutDate = dateFromTimestamp(input.timestamp);
      const record = activeAttendanceFor(agentId, checkOutDate) ?? activeAttendanceFor(agentId);
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
      const agent = getAgent(agentId);
      requireRole(agent, ['sales', 'both', 'admin'], 'Sales access is required');
      requireText(input.accountName, 'Account name is required');
      const opportunity: SalesOpportunity = {
        id: nextId('sales'),
        ownerAgentId: agentId,
        accountName: input.accountName,
        contactPerson: input.contactPerson,
        designation: input.designation,
        phone: input.phone,
        email: input.email,
        departmentAddress: input.departmentAddress,
        leadSource: input.leadSource,
        productType: input.productType,
        brandName: input.brandName,
        equipmentModel: input.equipmentModel,
        requirement: input.requirement,
        quoteSubmitted: input.quoteSubmitted,
        budgetaryProposal: input.budgetaryProposal,
        quoteStatus: input.quoteStatus,
        fundStatus: input.fundStatus,
        probability: input.probability,
        closingDate: input.closingDate,
        supportRequired: input.supportRequired,
        remarksTimeline: input.remarksTimeline,
        officeNotes: input.officeNotes,
        sitePhoto: input.sitePhoto,
        equipmentPlatePhoto: input.equipmentPlatePhoto,
        installationPhoto: input.installationPhoto,
        issuePhoto: input.issuePhoto,
        visitingCardPhoto: input.visitingCardPhoto,
        step2Saved: input.step2Saved ?? false,
        step3Saved: input.step3Saved ?? false,
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

    updateSalesOpportunity(agentId: string, id: string, input: Partial<SalesOpportunityInput>): SalesOpportunity {
      const agent = getAgent(agentId);
      const opportunity = sales.get(id);
      if (!opportunity) throw new ValidationError('Sales opportunity not found');
      if (opportunity.ownerAgentId !== agentId && agent.role !== 'admin') {
        throw new ValidationError('Only the owning agent or admin can update this sales opportunity');
      }
      const nextAccountName = input.accountName ?? opportunity.accountName;
      requireText(nextAccountName, 'Account name is required');
      const allowedUpdates: Partial<SalesOpportunityInput> = {
        accountName: nextAccountName,
        contactPerson: input.contactPerson,
        designation: input.designation,
        phone: input.phone,
        email: input.email,
        departmentAddress: input.departmentAddress,
        leadSource: input.leadSource,
        productType: input.productType,
        brandName: input.brandName,
        equipmentModel: input.equipmentModel,
        requirement: input.requirement,
        quoteSubmitted: input.quoteSubmitted,
        budgetaryProposal: input.budgetaryProposal,
        quoteStatus: input.quoteStatus,
        fundStatus: input.fundStatus,
        probability: input.probability,
        closingDate: input.closingDate,
        supportRequired: input.supportRequired,
        remarksTimeline: input.remarksTimeline,
        officeNotes: input.officeNotes,
        sitePhoto: input.sitePhoto,
        equipmentPlatePhoto: input.equipmentPlatePhoto,
        installationPhoto: input.installationPhoto,
        issuePhoto: input.issuePhoto,
        visitingCardPhoto: input.visitingCardPhoto,
        step2Saved: input.step2Saved,
        step3Saved: input.step3Saved,
      };
      Object.entries(allowedUpdates).forEach(([key, value]) => {
        if (value !== undefined) {
          (opportunity as unknown as Record<string, unknown>)[key] = value;
        }
      });
      return opportunity;
    },

    addSalesVisitUpdate(agentId: string, opportunityId: string, input: SalesVisitInput): SalesVisitUpdate {
      const agent = getAgent(agentId);
      requireRole(agent, ['sales', 'both', 'admin'], 'Sales access is required');
      const opportunity = sales.get(opportunityId);
      if (!opportunity) throw new ValidationError('Sales opportunity not found');
      if (opportunity.ownerAgentId !== agentId && agent.role !== 'admin') {
        throw new ValidationError('Only the owning agent or admin can add sales visits to this opportunity');
      }
      requireText(input.visitDate, 'Visit date is required');
      requireText(input.visitTime, 'Visit time is required');
      requireGps(input.gps);
      requireText(input.note, 'Visit note is required');
      if (input.nextAction === 'follow_up_needed') {
        requireText(input.followUpDate, 'Follow-up date is required when follow-up is needed');
      }

      const duplicateVisit = opportunity.visits.find((visit) =>
        visit.agentId === agent.id
        && visit.visitDate === input.visitDate
        && visit.visitTime === input.visitTime
        && visit.note.trim() === input.note.trim()
        && visit.nextAction === input.nextAction
        && (visit.followUpDate ?? '') === (input.followUpDate ?? '')
      );
      if (duplicateVisit) return duplicateVisit;

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
      const agent = getAgent(agentId);
      requireRole(agent, ['service', 'both', 'admin'], 'Service access is required');
      requireText(input.customerName, 'Customer name is required');
      const record: ServiceRecord = {
        id: nextId('service'),
        ownerAgentId: agentId,
        customerName: input.customerName,
        phone: input.phone,
        departmentAddress: input.departmentAddress,
        brandName: input.brandName,
        equipmentName: input.equipmentName,
        modelName: (input as ServiceRecord).modelName,
        serialNumber: input.serialNumber,
        contactPerson: (input as ServiceRecord).contactPerson,
        email: (input as ServiceRecord).email,
        issueCategory: (input as ServiceRecord).issueCategory,
        issueDescription: (input as ServiceRecord).issueDescription,
        warrantyAmc: (input as ServiceRecord).warrantyAmc,
        step2Saved: input.step2Saved ?? false,
        step3Saved: input.step3Saved ?? false,
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

    updateServiceRecord(agentId: string, serviceRecordId: string, input: Partial<ServiceRecordInput>): ServiceRecord {
      const agent = getAgent(agentId);
      const record = service.get(serviceRecordId);
      if (!record) throw new ValidationError('Service record not found');
      if (record.ownerAgentId !== agentId && agent.role !== 'admin') {
        throw new ValidationError('Only the owning agent or admin can update this service record');
      }
      const allowedFields: Array<keyof ServiceRecordInput> = [
        'customerName',
        'phone',
        'departmentAddress',
        'brandName',
        'equipmentName',
        'modelName',
        'serialNumber',
        'contactPerson',
        'email',
        'issueCategory',
        'issueDescription',
        'warrantyAmc',
        'partsRequired',
        'partsUsed',
        'machineStatus',
        'supportRequiredNote',
        'finalRemarks',
        'photoNote',
        'step2Saved',
        'step3Saved',
      ];
      allowedFields.forEach((field) => {
        if (field in input) {
          (record as unknown as Record<string, unknown>)[field] = input[field];
        }
      });
      return record;
    },

    addServiceVisitUpdate(agentId: string, serviceRecordId: string, input: ServiceVisitInput): ServiceVisitUpdate {
      const agent = getAgent(agentId);
      requireRole(agent, ['service', 'both', 'admin'], 'Service access is required');
      const record = service.get(serviceRecordId);
      if (!record) throw new ValidationError('Service record not found');
      if (record.ownerAgentId !== agentId && agent.role !== 'admin') {
        throw new ValidationError('Only the owning agent or admin can add service visits to this record');
      }
      requireText(input.visitDate, 'Service visit date is required');
      requireText(input.visitTime, 'Service visit time is required');
      requireGps(input.gps);
      requireText(input.workDone, 'Work done is required');
      if (input.nextAction === 'next_visit_needed' || input.nextAction === 'parts_required') {
        requireText(input.nextVisitDate, 'Next visit date is required when another service visit is needed');
      }

      const duplicateVisit = record.visits.find((visit) =>
        visit.agentId === agent.id
        && visit.visitDate === input.visitDate
        && visit.visitTime === input.visitTime
        && visit.serviceType === input.serviceType
        && visit.workDone.trim() === input.workDone.trim()
        && visit.supportRequired === input.supportRequired
        && visit.nextAction === input.nextAction
        && (visit.nextVisitDate ?? '') === (input.nextVisitDate ?? '')
        && (visit.officeNotes ?? '').trim() === (input.officeNotes ?? '').trim()
      );
      if (duplicateVisit) return duplicateVisit;

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
        role: agent.role,
        date,
        attendanceStatus: attendanceRecord?.status ?? 'not_checked_in',
        salesVisitCount: salesVisits.length,
        serviceVisitCount: serviceVisits.length,
        followUpsDue,
      };
    },

    getAgentReport(agentId: string, input: { fromDate: string; toDate: string }): AdminReport {
      const agent = getAgent(agentId);
      requireText(input.fromDate, 'Report from date is required');
      requireText(input.toDate, 'Report to date is required');
      if (input.fromDate > input.toDate) throw new ValidationError('Report from date must be before to date');

      const reportAgents = [agent];
      const attendanceInRange = [...attendance.values()].filter((record) =>
        record.agentId === agent.id && isInRange(record.date, input.fromDate, input.toDate),
      );
      const salesVisits = [...sales.values()]
        .filter((opportunity) => opportunity.ownerAgentId === agent.id || opportunity.visits.some((visit) => visit.agentId === agent.id))
        .flatMap((opportunity) => opportunity.visits.map((visit) => ({ opportunity, visit })))
        .filter(({ visit }) => visit.agentId === agent.id && isInRange(visit.visitDate, input.fromDate, input.toDate));
      const serviceVisits = [...service.values()]
        .filter((record) => record.ownerAgentId === agent.id || record.visits.some((visit) => visit.agentId === agent.id))
        .flatMap((record) => record.visits.map((visit) => ({ record, visit })))
        .filter(({ visit }) => visit.agentId === agent.id && isInRange(visit.visitDate, input.fromDate, input.toDate));
      const salesVisitUpdates = salesVisits.map(({ visit }) => visit);
      const serviceVisitUpdates = serviceVisits.map(({ visit }) => visit);
      const leaveRequestDetails = [...leaveRequests.values()].filter((leave) => leave.agentId === agent.id && leave.fromDate <= input.toDate && leave.toDate >= input.fromDate);
      const pendingLeaveRequestCount = leaveRequestDetails.filter((leave) => leave.status === 'pending').length;
      const totalDays = daysInclusive(input.fromDate, input.toDate);

      const attendancePeriodSummaries = reportAgents.map((reportAgent) => {
        const agentAttendance = attendanceInRange.filter((record) => record.agentId === reportAgent.id);
        const workedDays = new Set(agentAttendance.map((record) => record.date)).size;
        const checkedOutDays = new Set(agentAttendance.filter((record) => record.status === 'checked_out').map((record) => record.date)).size;
        const agentLeave = leaveRequestDetails.filter((leave) => leave.agentId === reportAgent.id);
        const leaveDaysByStatus = (status: LeaveRequest['status']) => agentLeave
          .filter((leave) => leave.status === status)
          .reduce((sum, leave) => sum + overlappingDays(leave.fromDate, leave.toDate, input.fromDate, input.toDate), 0);
        const leaveAppliedDays = agentLeave.reduce((sum, leave) => sum + overlappingDays(leave.fromDate, leave.toDate, input.fromDate, input.toDate), 0);
        return {
          agentId: reportAgent.id,
          agentName: reportAgent.name,
          role: reportAgent.role,
          totalDays,
          workedDays,
          checkedOutDays,
          leaveAppliedDays,
          approvedLeaveDays: leaveDaysByStatus('approved'),
          pendingLeaveDays: leaveDaysByStatus('pending'),
          rejectedLeaveDays: leaveDaysByStatus('rejected'),
          noUpdateDays: Math.max(0, totalDays - workedDays - leaveAppliedDays),
        };
      });

      const agentSummaries = reportAgents.map((reportAgent) => {
        const agentAttendance = attendanceInRange.filter((record) => record.agentId === reportAgent.id);
        const agentSalesVisits = salesVisitUpdates.filter((visit) => visit.agentId === reportAgent.id);
        const agentServiceVisits = serviceVisitUpdates.filter((visit) => visit.agentId === reportAgent.id);
        return {
          agentId: reportAgent.id,
          agentName: reportAgent.name,
          role: reportAgent.role,
          date: `${input.fromDate} to ${input.toDate}`,
          attendanceStatus: (agentAttendance[agentAttendance.length - 1]?.status ?? 'not_checked_in') as DailyAgentReport['attendanceStatus'],
          salesVisitCount: agentSalesVisits.length,
          serviceVisitCount: agentServiceVisits.length,
          followUpsDue: [],
        };
      });

      const followUpsDue = salesVisits
        .filter(({ visit }) => visit.nextAction === 'follow_up_needed' && visit.followUpDate && isInRange(visit.followUpDate, input.fromDate, input.toDate))
        .map(({ opportunity, visit }) => `Sales follow-up: ${opportunity.accountName} on ${visit.followUpDate}`);

      return {
        fromDate: input.fromDate,
        toDate: input.toDate,
        totals: {
          checkedInAgents: new Set(attendanceInRange.map((record) => record.agentId)).size,
          checkedOutAgents: new Set(
            attendanceInRange.filter((record) => record.status === 'checked_out').map((record) => record.agentId),
          ).size,
          salesVisits: salesVisitUpdates.length,
          serviceVisits: serviceVisitUpdates.length,
          pendingLeaveRequests: pendingLeaveRequestCount,
        },
        agentSummaries,
        attendancePeriodSummaries,
        followUpsDue,
        attendanceDetails: attendanceInRange,
        salesVisitDetails: salesVisits,
        serviceVisitDetails: serviceVisits,
        leaveRequestDetails,
      };
    },

    getAdminReport(adminAgentId: string, input: { fromDate: string; toDate: string }): AdminReport {
      requireAdmin(adminAgentId);
      requireText(input.fromDate, 'Report from date is required');
      requireText(input.toDate, 'Report to date is required');
      if (input.fromDate > input.toDate) throw new ValidationError('Report from date must be before to date');

      const reportAgents = [...agents.values()];
      const attendanceInRange = [...attendance.values()].filter((record) =>
        isInRange(record.date, input.fromDate, input.toDate),
      );
      const salesVisits = [...sales.values()]
        .flatMap((opportunity) => opportunity.visits.map((visit) => ({ opportunity, visit })))
        .filter(({ visit }) => isInRange(visit.visitDate, input.fromDate, input.toDate));
      const serviceVisits = [...service.values()]
        .flatMap((record) => record.visits.map((visit) => ({ record, visit })))
        .filter(({ visit }) => isInRange(visit.visitDate, input.fromDate, input.toDate));
      const salesVisitUpdates = salesVisits.map(({ visit }) => visit);
      const serviceVisitUpdates = serviceVisits.map(({ visit }) => visit);
      const leaveRequestDetails = [...leaveRequests.values()].filter((leave) => leave.fromDate <= input.toDate && leave.toDate >= input.fromDate);
      const pendingLeaveRequestCount = leaveRequestDetails.filter((leave) => leave.status === 'pending').length;
      const totalDays = daysInclusive(input.fromDate, input.toDate);

      const attendancePeriodSummaries = reportAgents.map((agent) => {
        const agentAttendance = attendanceInRange.filter((record) => record.agentId === agent.id);
        const workedDays = new Set(agentAttendance.map((record) => record.date)).size;
        const checkedOutDays = new Set(agentAttendance.filter((record) => record.status === 'checked_out').map((record) => record.date)).size;
        const agentLeave = leaveRequestDetails.filter((leave) => leave.agentId === agent.id);
        const leaveDaysByStatus = (status: LeaveRequest['status']) => agentLeave
          .filter((leave) => leave.status === status)
          .reduce((sum, leave) => sum + overlappingDays(leave.fromDate, leave.toDate, input.fromDate, input.toDate), 0);
        const leaveAppliedDays = agentLeave.reduce((sum, leave) => sum + overlappingDays(leave.fromDate, leave.toDate, input.fromDate, input.toDate), 0);
        return {
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
          totalDays,
          workedDays,
          checkedOutDays,
          leaveAppliedDays,
          approvedLeaveDays: leaveDaysByStatus('approved'),
          pendingLeaveDays: leaveDaysByStatus('pending'),
          rejectedLeaveDays: leaveDaysByStatus('rejected'),
          noUpdateDays: Math.max(0, totalDays - workedDays - leaveAppliedDays),
        };
      });

      const agentSummaries = reportAgents.map((agent) => {
        const agentAttendance = attendanceInRange.filter((record) => record.agentId === agent.id);
        const agentSalesVisits = salesVisitUpdates.filter((visit) => visit.agentId === agent.id);
        const agentServiceVisits = serviceVisitUpdates.filter((visit) => visit.agentId === agent.id);
        return {
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
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
          salesVisits: salesVisitUpdates.length,
          serviceVisits: serviceVisitUpdates.length,
          pendingLeaveRequests: pendingLeaveRequestCount,
        },
        agentSummaries,
        attendancePeriodSummaries,
        followUpsDue,
        attendanceDetails: attendanceInRange,
        salesVisitDetails: salesVisits,
        serviceVisitDetails: serviceVisits,
        leaveRequestDetails,
      };
    },
  };
}
