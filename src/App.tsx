import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, ChevronLeft, ClipboardList, Clock3, FileText, Home, MapPin, Plus, Search, UserRound, UsersRound, X } from 'lucide-react';
import { crystalBioFrontendApi, type FrontendAdminReport, type FrontendAdminSeatInvite, type FrontendAttendance, type FrontendClientErrorEvent, type FrontendGps, type FrontendLeaveRequest, type FrontendLoginActivityEvent, type FrontendLoginInput, type FrontendRecentVisitEntry, type FrontendSalesSaveResult, type FrontendSalesNextAction, type FrontendServiceSaveResult, type FrontendServiceNextAction, type FrontendServiceType, type FrontendSession } from './crystalBioFrontendApi';

type AppScreen = 'login' | 'home' | 'visits' | 'sales' | 'service' | 'checkin' | 'attendance' | 'leave' | 'reports' | 'profile' | 'admin';
type ReportPeriod = 'today' | 'week' | 'month' | 'custom';
type AgentReportKind = 'attendance' | 'visits' | 'combined';
type AdminReportKind = 'attendance' | 'visits' | 'combined';
type AdminAgentFilter = 'all' | 'sales' | 'service';
type AdminVisitTypeFilter = 'all' | 'Sales' | 'Service';
type AdminFieldEntryScope = 'mine' | 'all';
type AdminReportScope = 'office' | 'sales' | 'service' | 'agent';
type AdminTab = 'overview' | 'fieldEntry' | 'agents' | 'approvals' | 'adminReports' | 'monitoring' | 'profiles';
type AdminApprovalId = string;
type AdminAgentsView = 'list' | 'add' | 'profile' | 'invite';
type AdminSeatStatus = 'invited' | 'active' | 'inactive' | 'expired';
type AdminOverviewMetric = 'visits' | 'checkedIn' | 'leave' | 'followUps';
type AdminSeat = {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  mobile: string;
  role: 'sales' | 'service' | 'both' | 'admin';
  territory: string;
  status: AdminSeatStatus;
  lastActive: string;
  setupLink?: string;
  emailDelivery?: 'queued' | 'not_configured';
};

type AdminActivityRow = {
  id: string;
  name: string;
  role: string;
  roleKey: 'sales' | 'service' | 'both' | 'admin';
  attendance: string;
  visits: string;
  status: string;
  chipClass: string;
  salesVisitCount: number;
  serviceVisitCount: number;
  followUpsDue: string[];
};
type ToastNotice = { title: string; message: string; tone?: 'success' | 'info' | 'warning' | 'error' };
type LaunchIssue = { area: string; message: string; when: string };
type StoredPhoto = { source: 'camera' | 'upload'; fileName: string; contentType: string; sizeBytes: number; dataUrl: string };

const toneClass: Record<string, string> = {
  warning: 'chip chip-warning',
  info: 'chip chip-info',
  soft: 'chip chip-soft',
};

const navItems: Array<{ screen: AppScreen; label: string; icon: typeof Home }> = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'visits', label: 'Visits', icon: ClipboardList },
  { screen: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { screen: 'reports', label: 'Reports', icon: FileText },
];


const initialAdminSeats: AdminSeat[] = [];

const sampleAttendanceLogs = [
  { date: 'Today', status: 'Ready to check in', detail: 'GPS will be saved when the agent taps Check in.' },
];

const screenOptions: AppScreen[] = ['login', 'home', 'visits', 'sales', 'service', 'checkin', 'attendance', 'leave', 'reports', 'profile', 'admin'];
const sessionStorageKey = 'crystalbio.session.v1';
const screenStorageKey = 'crystalbio.screen.v1';
const appBuildVersion = '20260615092000';

const isFrontendSession = (value: unknown): value is FrontendSession => {
  const candidate = value as Partial<FrontendSession> | null;
  return Boolean(
    candidate
      && typeof candidate.token === 'string'
      && typeof candidate.agentId === 'string'
      && typeof candidate.agentName === 'string'
      && ['sales', 'service', 'both', 'admin'].includes(String(candidate.role)),
  );
};

const readStoredSession = (): FrontendSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const rawSession = window.localStorage.getItem(sessionStorageKey);
    if (!rawSession) return null;
    const parsed = JSON.parse(rawSession) as unknown;
    if (!isFrontendSession(parsed)) return null;
    const liveBackendUrl = (import.meta as unknown as { env?: { VITE_CRYSTALBIO_API_URL?: string } }).env?.VITE_CRYSTALBIO_API_URL;
    const isLiveCrystalBioHost = window.location.hostname === 'work.convogenie.ai';
    if ((liveBackendUrl || isLiveCrystalBioHost) && (parsed.email === 'qa.agent@crystalbio.in' || parsed.agentName === 'QA Test Agent')) {
      forgetSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const rememberSession = (nextSession: FrontendSession) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
};

const forgetSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(screenStorageKey);
};

const isExpiredSessionError = (error: unknown) => error instanceof Error && /login session|required|valid login session/i.test(error.message);

const rememberScreen = (nextScreen: AppScreen) => {
  if (typeof window === 'undefined' || nextScreen === 'login') return;
  window.localStorage.setItem(screenStorageKey, nextScreen);
};

const agentIdForScreen = (nextScreen: AppScreen) => (nextScreen === 'service' ? 'agent_3' : 'agent_2');
const loginInputForScreen = (nextScreen: AppScreen): FrontendLoginInput => {
  if (nextScreen === 'admin') return { email: 'admin@crystalbio.in', password: '' };
  if (nextScreen === 'service') return { email: 'meera.service@crystalbio.in', password: '' };
  return { email: 'rahul.sales@crystalbio.in', password: '' };
};

const getInitialScreen = (storedSession: FrontendSession | null = readStoredSession()): AppScreen => {
  if (typeof window === 'undefined') return 'login';
  const requestedScreen = new URLSearchParams(window.location.search).get('screen') as AppScreen | null;
  if (requestedScreen && screenOptions.includes(requestedScreen)) return requestedScreen;
  const storedScreen = window.localStorage.getItem(screenStorageKey) as AppScreen | null;
  if (storedSession && storedScreen && screenOptions.includes(storedScreen) && storedScreen !== 'login') return storedScreen;
  if (storedSession) return storedSession.role === 'admin' ? 'admin' : 'home';
  return 'login';
};

const getInitialAdminTab = (): AdminTab => {
  if (typeof window === 'undefined') return 'overview';
  const requestedTab = new URLSearchParams(window.location.search).get('adminTab') as AdminTab | null;
  return requestedTab && ['overview', 'fieldEntry', 'agents', 'approvals', 'adminReports', 'monitoring', 'profiles'].includes(requestedTab) ? requestedTab : 'overview';
};

const getInitialAdminApproval = (): AdminApprovalId | null => {
  if (typeof window === 'undefined') return null;
  const requestedApproval = new URLSearchParams(window.location.search).get('approval') as AdminApprovalId | null;
  return requestedApproval || null;
};

const formatShortDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(Date.UTC(year, month - 1, day)));
};

const formatMonitorWhen = (value?: string) => {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
};

const roleLabel = (role?: FrontendSession['role']) => {
  if (role === 'admin') return 'Admin';
  if (role === 'sales') return 'Sales';
  if (role === 'service') return 'Service';
  if (role === 'both') return 'Sales + service';
  return 'User';
};

const formatVisitWhen = (entry: Pick<FrontendRecentVisitEntry, 'visitDate' | 'visitTime'>) => {
  if (!entry.visitDate && !entry.visitTime) return 'Time not recorded';
  const dateLabel = entry.visitDate ? formatShortDate(entry.visitDate) : 'Date not recorded';
  return entry.visitTime ? `${dateLabel} • ${entry.visitTime}` : dateLabel;
};

const displayCustomerName = (value: string) => {
  const cleaned = value
    .replace(/^PERIWINKLE(?:-[A-Z]+)*-AUDIT-\d{8}-\d{6}\s+/i, '')
    .replace(/^PERIWINKLE-[A-Z-]+-AUDIT-\d{8}-\d{6}\s+/i, '')
    .trim();
  return cleaned || value;
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const startOfCurrentMonthInput = () => {
  const now = new Date();
  return formatDateInput(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
};

const todayInput = () => formatDateInput(new Date());

const daysAgoInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateInput(date);
};

const timeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const adminRoleKeyForSummary = (summary: { role?: FrontendSession['role']; salesVisitCount: number; serviceVisitCount: number }): AdminActivityRow['roleKey'] => {
  if (summary.role === 'admin') return 'admin';
  if (summary.role === 'sales' || summary.role === 'service' || summary.role === 'both') return summary.role;
  if (summary.salesVisitCount > 0 && summary.serviceVisitCount > 0) return 'both';
  if (summary.salesVisitCount > 0) return 'sales';
  if (summary.serviceVisitCount > 0) return 'service';
  return 'both';
};

const adminRoleLabel = (roleKey: AdminActivityRow['roleKey']) => {
  if (roleKey === 'admin') return 'Admin';
  if (roleKey === 'sales') return 'Sales agent';
  if (roleKey === 'service') return 'Service agent';
  return 'Sales + service agent';
};

const matchesAdminAgentFilter = (row: Pick<AdminActivityRow, 'roleKey' | 'salesVisitCount' | 'serviceVisitCount'>, filter: AdminAgentFilter) => {
  if (filter === 'all') return true;
  if (filter === 'sales') return row.roleKey === 'sales' || row.roleKey === 'both';
  return row.roleKey === 'service' || row.roleKey === 'both';
};

function App() {
  const initialStoredSession = readStoredSession();
  const initialScreen = getInitialScreen(initialStoredSession);
  const hasConfiguredBackend = crystalBioFrontendApi.isBackendConfigured();
  const mustValidateStoredSession = Boolean(hasConfiguredBackend && initialStoredSession);
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (hasConfiguredBackend && !initialStoredSession) return 'login';
    if (mustValidateStoredSession) return 'login';
    return hasConfiguredBackend && initialScreen === 'admin' && initialStoredSession?.role !== 'admin' ? 'login' : initialScreen;
  });
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(() => !mustValidateStoredSession && (initialStoredSession?.role === 'admin' || (!hasConfiguredBackend && initialScreen === 'admin')));
  const [session, setSession] = useState<FrontendSession | null>(() => mustValidateStoredSession ? null : initialStoredSession);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [currentGps, setCurrentGps] = useState<FrontendGps | null>(null);
  const [currentGpsCapturedAt, setCurrentGpsCapturedAt] = useState<string | null>(null);
  const [isLocationCapturing, setIsLocationCapturing] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Tap Use current location before check-in or saving a visit.');
  const [statusMessage, setStatusMessage] = useState('Loading logged-in agent…');
  const [screenNotice, setScreenNotice] = useState<ToastNotice | string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('setupToken') ?? '');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [isPasswordSetupSubmitting, setIsPasswordSetupSubmitting] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('week');
  const [reportKind, setReportKind] = useState<AgentReportKind>('combined');
  const [reportFromDate, setReportFromDate] = useState(startOfCurrentMonthInput);
  const [reportToDate, setReportToDate] = useState(todayInput);
  const [adminPeriod, setAdminPeriod] = useState<ReportPeriod>('today');
  const [adminReportFromDate, setAdminReportFromDate] = useState(todayInput);
  const [adminReportToDate, setAdminReportToDate] = useState(todayInput);
  const [adminReportKind, setAdminReportKind] = useState<AdminReportKind>('attendance');
  const [adminReportScope, setAdminReportScope] = useState<AdminReportScope>('office');
  const [adminReport, setAdminReport] = useState<FrontendAdminReport | null>(null);
  const [expandedAdminReportId, setExpandedAdminReportId] = useState<string | null>(null);
  const [showAdminAttendanceList, setShowAdminAttendanceList] = useState(false);
  const [expandedAgentActivityId, setExpandedAgentActivityId] = useState<string | null>(null);
  const [selectedAdminEntryId, setSelectedAdminEntryId] = useState<string | null>(null);
  const [selectedAdminEntryReturnTab, setSelectedAdminEntryReturnTab] = useState<AdminTab>('agents');
  const [showAllAdminEntries, setShowAllAdminEntries] = useState(false);
  const [showAdminTeamStatus, setShowAdminTeamStatus] = useState(false);
  const [expandedAdminMetric, setExpandedAdminMetric] = useState<AdminOverviewMetric | null>(null);
  const [adminEntryAgentFilter, setAdminEntryAgentFilter] = useState('all');
  const [adminEntryTypeFilter, setAdminEntryTypeFilter] = useState<AdminVisitTypeFilter>('all');
  const [adminFieldEntryScope, setAdminFieldEntryScope] = useState<AdminFieldEntryScope>('mine');
  const [adminFieldEntrySearch, setAdminFieldEntrySearch] = useState('');
  const [adminAgentFilter, setAdminAgentFilter] = useState<AdminAgentFilter>('all');
  const [adminTab, setAdminTab] = useState<AdminTab>(getInitialAdminTab);
  const [selectedAdminApproval, setSelectedAdminApproval] = useState<AdminApprovalId | null>(getInitialAdminApproval);
  const [adminAgentsView, setAdminAgentsView] = useState<AdminAgentsView>('list');
  const [selectedAdminSeatId, setSelectedAdminSeatId] = useState(initialAdminSeats[0]?.id ?? '');
  const [adminSeats, setAdminSeats] = useState<AdminSeat[]>(initialAdminSeats);
  const [newSeatName, setNewSeatName] = useState('Priya Service');
  const [newSeatEmployeeId, setNewSeatEmployeeId] = useState('CB-SE-022');
  const [newSeatEmail, setNewSeatEmail] = useState('priya.service@crystalbio.in');
  const [newSeatMobile, setNewSeatMobile] = useState('+91 98765 43022');
  const [newSeatRole, setNewSeatRole] = useState<AdminSeat['role']>('service');
  const [newSeatTerritory, setNewSeatTerritory] = useState('Kozhikode');
  const [leaveFromDate, setLeaveFromDate] = useState('2026-06-12');
  const [leaveToDate, setLeaveToDate] = useState('2026-06-12');
  const [leaveReason, setLeaveReason] = useState('Sick leave');
  const [leaveNote, setLeaveNote] = useState('');
  const [leaveRequest, setLeaveRequest] = useState<FrontendLeaveRequest | null>(null);
  const [adminLeaveRequests, setAdminLeaveRequests] = useState<FrontendLeaveRequest[]>([]);
  const [adminLoginActivity, setAdminLoginActivity] = useState<FrontendLoginActivityEvent[]>([]);
  const [adminClientErrors, setAdminClientErrors] = useState<FrontendClientErrorEvent[]>([]);
  const [isAdminMonitorRefreshing, setIsAdminMonitorRefreshing] = useState(false);
  const [reviewedAdminLeaveRequests, setReviewedAdminLeaveRequests] = useState<FrontendLeaveRequest[]>([]);
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
  const [visitSearch, setVisitSearch] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>(['Sales visit']);
  const [checkInNote, setCheckInNote] = useState('');
  const [salesAccountName, setSalesAccountName] = useState('');
  const [salesContactPerson, setSalesContactPerson] = useState('');
  const [salesDesignation, setSalesDesignation] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [salesDepartmentAddress, setSalesDepartmentAddress] = useState('');
  const [salesLeadSource, setSalesLeadSource] = useState('Field visit');
  const [salesProductType, setSalesProductType] = useState('Laboratory equipment');
  const [salesBrandName, setSalesBrandName] = useState('');
  const [salesEquipmentModel, setSalesEquipmentModel] = useState('');
  const [salesRequirement, setSalesRequirement] = useState('');
  const [salesVisitNote, setSalesVisitNote] = useState('');
  const [salesNextAction, setSalesNextAction] = useState<FrontendSalesNextAction>('follow_up_needed');
  const [salesFollowUpDate, setSalesFollowUpDate] = useState('');
  const [salesQuoteSubmitted, setSalesQuoteSubmitted] = useState<'yes' | 'no' | ''>('');
  const [salesBudgetaryProposal, setSalesBudgetaryProposal] = useState('');
  const [salesQuoteStatus, setSalesQuoteStatus] = useState('New inquiry');
  const [salesFundStatus, setSalesFundStatus] = useState('Unknown');
  const [salesProbability, setSalesProbability] = useState('');
  const [salesClosingDate, setSalesClosingDate] = useState('');
  const [salesSupportRequired, setSalesSupportRequired] = useState('');
  const [salesRemarksTimeline, setSalesRemarksTimeline] = useState('');
  const [salesOfficeNotes, setSalesOfficeNotes] = useState('');
  const [salesPhotoNote, setSalesPhotoNote] = useState('');
  const [salesPhotoAttachment, setSalesPhotoAttachment] = useState<StoredPhoto | null>(null);
  const [salesStep2Saved, setSalesStep2Saved] = useState(false);
  const [salesStep3Saved, setSalesStep3Saved] = useState(false);
  const [isSalesStep2Open, setIsSalesStep2Open] = useState(false);
  const [isSalesStep3Open, setIsSalesStep3Open] = useState(false);
  const [salesSaveResult, setSalesSaveResult] = useState<FrontendSalesSaveResult | null>(null);
  const [isSalesSubmitting, setIsSalesSubmitting] = useState(false);
  const [isSalesStep2Submitting, setIsSalesStep2Submitting] = useState(false);
  const [isSalesStep3Submitting, setIsSalesStep3Submitting] = useState(false);
  const [serviceCustomerName, setServiceCustomerName] = useState('');
  const [serviceContactPerson, setServiceContactPerson] = useState('');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceEmail, setServiceEmail] = useState('');
  const [serviceDepartmentAddress, setServiceDepartmentAddress] = useState('');
  const [serviceEquipmentName, setServiceEquipmentName] = useState('');
  const [serviceBrandName, setServiceBrandName] = useState('');
  const [serviceModelName, setServiceModelName] = useState('');
  const [serviceSerialNumber, setServiceSerialNumber] = useState('');
  const [serviceIssueCategory, setServiceIssueCategory] = useState('');
  const [serviceIssueDescription, setServiceIssueDescription] = useState('');
  const [serviceWarrantyAmc, setServiceWarrantyAmc] = useState('');
  const [serviceType, setServiceType] = useState<FrontendServiceType>('breakdown');
  const [serviceWorkDone, setServiceWorkDone] = useState('');
  const [serviceSupportRequired, setServiceSupportRequired] = useState(true);
  const [serviceNextAction, setServiceNextAction] = useState<FrontendServiceNextAction>('parts_required');
  const [serviceNextVisitDate, setServiceNextVisitDate] = useState('');
  const [servicePartsRequired, setServicePartsRequired] = useState('');
  const [servicePartsUsed, setServicePartsUsed] = useState('');
  const [serviceMachineStatus, setServiceMachineStatus] = useState('');
  const [serviceSupportRequiredNote, setServiceSupportRequiredNote] = useState('');
  const [serviceFinalRemarks, setServiceFinalRemarks] = useState('');
  const [servicePhotoNote, setServicePhotoNote] = useState('');
  const [servicePhotoAttachment, setServicePhotoAttachment] = useState<StoredPhoto | null>(null);
  const [serviceOfficeNotes, setServiceOfficeNotes] = useState('');
  const [serviceStep2Saved, setServiceStep2Saved] = useState(false);
  const [serviceStep3Saved, setServiceStep3Saved] = useState(false);
  const [isServiceStep2Open, setIsServiceStep2Open] = useState(false);
  const [isServiceStep3Open, setIsServiceStep3Open] = useState(false);
  const [serviceSaveResult, setServiceSaveResult] = useState<FrontendServiceSaveResult | null>(null);
  const [backendRecentVisitEntries, setBackendRecentVisitEntries] = useState<FrontendRecentVisitEntry[]>([]);
  const [adminTeamRecentVisitEntries, setAdminTeamRecentVisitEntries] = useState<FrontendRecentVisitEntry[]>([]);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [isServiceStep2Submitting, setIsServiceStep2Submitting] = useState(false);
  const [isServiceStep3Submitting, setIsServiceStep3Submitting] = useState(false);
  const [launchIssues, setLaunchIssues] = useState<LaunchIssue[]>([]);
  const isBackendConfigured = crystalBioFrontendApi.isBackendConfigured();

  const rememberLaunchIssue = (area: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || 'Unknown issue');
    setLaunchIssues((current) => [{ area, message, when: 'Just now' }, ...current].slice(0, 5));
  };

  useEffect(() => {
    if (!mustValidateStoredSession || !initialStoredSession) return undefined;
    let isMounted = true;
    setStatusMessage('Checking saved login…');
    crystalBioFrontendApi.validateSession(initialStoredSession)
      .then((validatedSession) => {
        if (!isMounted) return;
        setSession(validatedSession);
        rememberSession(validatedSession);
        if (validatedSession.role === 'admin') {
          setIsAdminSignedIn(true);
          setAdminTab('overview');
          setScreen('admin');
          rememberScreen('admin');
          setStatusMessage('Admin logged in.');
          void refreshAdminData(validatedSession);
          return;
        }
        setIsAdminSignedIn(false);
        setScreen('home');
        rememberScreen('home');
        setStatusMessage('Logged in. Check in to start field work.');
      })
      .catch((error) => {
        if (!isMounted) return;
        rememberLaunchIssue('Saved login validation', error);
        forgetSession();
        setSession(null);
        setIsAdminSignedIn(false);
        setScreen('login');
        setStatusMessage('Please log in again.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let cancelled = false;
    const checkForUpdate = async () => {
      try {
        const response = await fetch(`./version.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const version = await response.json() as { version?: string };
        if (!cancelled && version.version && version.version !== appBuildVersion) {
          window.location.reload();
        }
      } catch {
        // Home-screen app can continue working if the update check is offline.
      }
    };
    void checkForUpdate();
    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, []);

  const refreshAdminData = async (adminSession = session) => {
    if (!adminSession || adminSession.role !== 'admin') return;
    try {
      const [requests, report, agents, teamVisits, loginActivity, clientErrors] = await Promise.all([
        crystalBioFrontendApi.getAdminLeaveRequests(adminSession),
        crystalBioFrontendApi.getAdminReport(adminSession, { fromDate: adminReportFromDate, toDate: adminReportToDate }),
        crystalBioFrontendApi.getAdminAgents(adminSession),
        crystalBioFrontendApi.getRecentVisits(adminSession, { scope: 'team' }),
        crystalBioFrontendApi.getAdminLoginActivity(adminSession),
        crystalBioFrontendApi.getAdminClientErrors(adminSession),
      ]);
      setAdminLeaveRequests(requests);
      setAdminReport(report);
      setAdminTeamRecentVisitEntries(teamVisits);
      setAdminLoginActivity(loginActivity);
      setAdminClientErrors(clientErrors);
      const activityByAgentId = new Map(report.agentSummaries.map((summary) => [summary.agentId, summary]));
      setAdminSeats(agents.map((agent) => {
        const summary = activityByAgentId.get(agent.id);
        return {
          id: agent.id,
          name: agent.name,
          employeeId: agent.employeeId || agent.id,
          email: agent.email || 'Email not added',
          mobile: agent.mobile || 'Not added',
          role: agent.role,
          territory: 'CrystalBio team',
          status: agent.active ? 'active' : agent.inviteStatus === 'pending' ? 'invited' : 'inactive',
          lastActive: summary ? (summary.attendanceStatus === 'not_checked_in' ? 'Not checked in today' : summary.attendanceStatus.replace(/_/g, ' ')) : 'No field activity yet',
          setupLink: agent.setupLink,
          emailDelivery: agent.emailDelivery,
        };
      }));
    } catch (error) {
      rememberLaunchIssue('Admin data refresh', error);
      if (isExpiredSessionError(error)) {
        forgetSession();
        setSession(null);
        setIsAdminSignedIn(false);
        setAdminSeats([]);
        setAdminTeamRecentVisitEntries([]);
        setAdminLeaveRequests([]);
        setAdminLoginActivity([]);
        setAdminClientErrors([]);
        setScreen('login');
        setStatusMessage('Please log in again to refresh admin profiles.');
        setScreenNotice({ title: 'Login refreshed', message: 'Please log in again. The latest user profiles will load after login.', tone: 'warning' });
      }
    }
  };

  useEffect(() => {
    if (session) {
      setStatusMessage(session.role === 'admin' ? 'Admin logged in.' : 'Logged in. Check in to start field work.');
      return undefined;
    }
    if (isBackendConfigured) {
      setStatusMessage('Use the registered email and password from the admin invite.');
      return undefined;
    }
    let isMounted = true;
    crystalBioFrontendApi
      .login(isBackendConfigured ? loginInputForScreen(screen) : agentIdForScreen(screen))
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        rememberSession(nextSession);
        setStatusMessage('Logged in. Check in to start field work.');
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setStatusMessage(error.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (session?.role !== 'admin') return;
    void refreshAdminData(session);
  }, [session?.token, session?.role, adminReportFromDate, adminReportToDate]);

  useEffect(() => {
    if (!session || !isBackendConfigured) return;
    let isMounted = true;
    crystalBioFrontendApi.getRecentVisits(session)
      .then((entries) => {
        if (isMounted) setBackendRecentVisitEntries(entries);
      })
      .catch((error) => rememberLaunchIssue('Recent visits refresh', error));
    return () => {
      isMounted = false;
    };
  }, [session?.token, isBackendConfigured]);

  useEffect(() => {
    if (!screenNotice) return undefined;
    const timer = window.setTimeout(() => setScreenNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [screenNotice]);

  const isCheckedIn = attendance?.status === 'checked_in';
  const attendanceAction = isCheckedIn ? 'Check out' : 'Check in';
  const attendanceHint = isCheckedIn ? 'End day' : 'Start day';

  const actionMeta = useMemo(
    () => [
      { label: attendanceAction, hint: attendanceHint, className: 'action-mint', icon: MapPin, onClick: 'attendance-action' as const },
      { label: 'Sales', hint: 'New visit update', className: 'action-peach', icon: Plus, onClick: 'sales' as const },
      { label: 'Service', hint: 'New service update', className: 'action-sky', icon: ClipboardList, onClick: 'service' as const },
      { label: 'Attendance', hint: 'Logs & leave', className: 'action-attendance', icon: CalendarCheck, onClick: 'attendance' as const },
    ],
    [attendanceAction, attendanceHint],
  );

  const latestVisitEntries: FrontendRecentVisitEntry[] = [
    ...(salesSaveResult ? [{
      id: salesSaveResult.visit.id,
      customer: salesSaveResult.opportunity.accountName,
      type: 'Sales' as const,
      status: salesSaveResult.visit.nextAction === 'closed' ? 'Closed' : salesSaveResult.visit.nextAction === 'no_follow_up' ? 'No follow-up' : 'Follow-up needed',
      next: salesSaveResult.visit.followUpDate ? formatShortDate(salesSaveResult.visit.followUpDate) : 'No date set',
      tone: salesSaveResult.visit.nextAction === 'follow_up_needed' ? 'warning' as const : 'soft' as const,
      agentId: salesSaveResult.visit.agentId,
      agentName: salesSaveResult.visit.agentName,
      visitDate: salesSaveResult.visit.visitDate,
      visitTime: salesSaveResult.visit.visitTime,
      photoPayload: salesSaveResult.opportunity.sitePhoto,
    }] : []),
    ...(serviceSaveResult ? [{
      id: serviceSaveResult.visit.id,
      customer: serviceSaveResult.serviceRecord.customerName,
      type: 'Service' as const,
      status: serviceSaveResult.visit.nextAction === 'closed' ? 'Closed' : serviceSaveResult.visit.nextAction === 'no_follow_up' ? 'No follow-up' : 'Follow-up needed',
      next: serviceSaveResult.visit.nextVisitDate ? formatShortDate(serviceSaveResult.visit.nextVisitDate) : 'No date set',
      tone: serviceSaveResult.visit.nextAction === 'closed' ? 'soft' as const : 'info' as const,
      agentId: serviceSaveResult.visit.agentId,
      agentName: serviceSaveResult.visit.agentName,
      visitDate: serviceSaveResult.visit.visitDate,
      visitTime: serviceSaveResult.visit.visitTime,
      photoPayload: serviceSaveResult.serviceRecord.photoNote,
    }] : []),
  ];
  const recentVisitEntries = [...latestVisitEntries, ...backendRecentVisitEntries]
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index);
  const teamVisitEntries = [...latestVisitEntries, ...adminTeamRecentVisitEntries, ...backendRecentVisitEntries]
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index);

  const toggleWorkType = (type: string) => {
    setWorkTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  };

  const currentLocationSummary = currentGps
    ? `Location added • ${currentGps.latitude.toFixed(5)}, ${currentGps.longitude.toFixed(5)}${currentGps.accuracyMeters ? ` • accuracy ${Math.round(currentGps.accuracyMeters)}m` : ''}${currentGpsCapturedAt ? ` • ${currentGpsCapturedAt}` : ''}`
    : locationMessage;

  const captureCurrentLocation = async (purpose: 'check-in' | 'sales' | 'service' | 'attendance' = 'attendance') => {
    setIsLocationCapturing(true);
    const actionLabel = purpose === 'check-in' ? 'check-in' : purpose === 'sales' ? 'sales visit' : purpose === 'service' ? 'service visit' : 'attendance';
    setLocationMessage(`Asking phone GPS for ${actionLabel}…`);
    try {
      const gps = await crystalBioFrontendApi.getCurrentLocation();
      setCurrentGps(gps);
      const capturedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentGpsCapturedAt(capturedAt);
      const message = `Current location added for ${actionLabel}.`;
      setLocationMessage(message);
      setScreenNotice({ title: 'Location added', message: `${message} Save now to attach it to this update.`, tone: 'success' });
      return gps;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Location could not be captured. Please allow GPS permission and try again.';
      setLocationMessage(message);
      setScreenNotice({ title: 'Location needed', message, tone: 'warning' });
      throw error;
    } finally {
      setIsLocationCapturing(false);
    }
  };

  const LocationCaptureCard = ({ purpose }: { purpose: 'check-in' | 'sales' | 'service' }) => (
    <div className="form-card highlighted-card location-capture-card">
      <label>Current location</label>
      <p>{currentLocationSummary}</p>
      <button type="button" className="secondary-action location-capture-action" disabled={isLocationCapturing} onClick={() => void captureCurrentLocation(purpose)}>
        {isLocationCapturing ? 'Getting location…' : currentGps ? 'Refresh current location' : 'Use current location'}
      </button>
    </div>
  );

  const gpsForSave = async (purpose: 'check-in' | 'sales' | 'service' | 'attendance') => currentGps ?? await captureCurrentLocation(purpose);

  const handleAttendanceAction = async () => {
    if (!session) return;
    setIsAttendanceBusy(true);
    setStatusMessage(isCheckedIn ? 'Capturing check-out location…' : 'Capturing check-in location…');
    try {
      const gps = await gpsForSave('attendance');
      const nextAttendance = isCheckedIn
        ? await crystalBioFrontendApi.checkOut(session, gps)
        : await crystalBioFrontendApi.checkIn(session, gps);
      setAttendance(nextAttendance);
      setStatusMessage(
        nextAttendance.status === 'checked_in'
          ? 'Checked in. GPS saved for today.'
          : 'Checked out. End location saved.',
      );
    } catch (error) {
      rememberLaunchIssue('Attendance save', error);
      setStatusMessage(error instanceof Error ? error.message : 'Attendance action failed');
    } finally {
      setIsAttendanceBusy(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!session) return;
    if (!workTypes.length) {
      setScreenNotice({ title: 'Choose work type', message: 'Select Sales visit, Service visit, or In office before check-in.', tone: 'warning' });
      return;
    }
    setIsAttendanceBusy(true);
    setScreenNotice('Capturing check-in location…');
    setStatusMessage('Capturing check-in location…');
    try {
      const gps = await gpsForSave('check-in');
      const nextAttendance = await crystalBioFrontendApi.checkIn(session, gps);
      setAttendance(nextAttendance);
      setStatusMessage(`Checked in. ${workTypes.join(' + ')} saved with GPS.`);
      setScreenNotice({
        title: 'Checked in',
        message: checkInNote.trim()
          ? `${workTypes.join(' + ')} saved with GPS. Opening note added.`
          : `${workTypes.join(' + ')} saved with GPS.`,
        tone: 'success',
      });
      setScreen('home');
    } catch (error) {
      rememberLaunchIssue('Check-in save', error);
      setScreenNotice(error instanceof Error ? error.message : 'Check-in failed');
      setStatusMessage(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsAttendanceBusy(false);
    }
  };

  const resetSalesFormForNewVisit = () => {
    setSalesAccountName('');
    setSalesContactPerson('');
    setSalesDesignation('');
    setSalesPhone('');
    setSalesEmail('');
    setSalesDepartmentAddress('');
    setSalesLeadSource('Field visit');
    setSalesProductType('Laboratory equipment');
    setSalesBrandName('');
    setSalesEquipmentModel('');
    setSalesRequirement('');
    setSalesVisitNote('');
    setSalesNextAction('follow_up_needed');
    setSalesFollowUpDate('');
    setSalesQuoteSubmitted('');
    setSalesBudgetaryProposal('');
    setSalesQuoteStatus('New inquiry');
    setSalesFundStatus('Unknown');
    setSalesProbability('');
    setSalesClosingDate('');
    setSalesSupportRequired('');
    setSalesRemarksTimeline('');
    setSalesOfficeNotes('');
    setSalesPhotoNote('');
    setSalesPhotoAttachment(null);
    setSalesStep2Saved(false);
    setSalesStep3Saved(false);
    setIsSalesStep2Open(false);
    setIsSalesStep3Open(false);
    setSalesSaveResult(null);
  };

  const resetServiceFormForNewVisit = () => {
    setServiceCustomerName('');
    setServiceContactPerson('');
    setServicePhone('');
    setServiceEmail('');
    setServiceDepartmentAddress('');
    setServiceEquipmentName('');
    setServiceBrandName('');
    setServiceModelName('');
    setServiceSerialNumber('');
    setServiceIssueCategory('');
    setServiceIssueDescription('');
    setServiceWarrantyAmc('');
    setServiceType('breakdown');
    setServiceWorkDone('');
    setServiceSupportRequired(true);
    setServiceNextAction('parts_required');
    setServiceNextVisitDate('');
    setServicePartsRequired('');
    setServicePartsUsed('');
    setServiceMachineStatus('');
    setServiceSupportRequiredNote('');
    setServiceFinalRemarks('');
    setServicePhotoNote('');
    setServicePhotoAttachment(null);
    setServiceOfficeNotes('');
    setServiceStep2Saved(false);
    setServiceStep3Saved(false);
    setIsServiceStep2Open(false);
    setIsServiceStep3Open(false);
    setServiceSaveResult(null);
  };

  const goToScreen = (nextScreen: AppScreen, options?: { newSalesVisit?: boolean; newServiceVisit?: boolean }) => {
    setScreenNotice(null);
    if (options?.newSalesVisit) resetSalesFormForNewVisit();
    if (options?.newServiceVisit) resetServiceFormForNewVisit();
    if (nextScreen === 'sales' || nextScreen === 'service') {
      if (isBackendConfigured || session?.role === 'admin' || isAdminSignedIn) {
        setStatusMessage(session ? 'Logged in. Check in to start field work.' : 'Login is required before field work.');
      } else {
        setStatusMessage('Loading logged-in agent…');
        crystalBioFrontendApi.login(agentIdForScreen(nextScreen)).then((nextSession) => {
          setSession(nextSession);
          setStatusMessage('Logged in. Check in to start field work.');
        }).catch((error: Error) => {
          setStatusMessage(error.message);
        });
      }
    }
    setScreen(nextScreen);
    rememberScreen(nextScreen);
  };

  const openAdminTab = (nextTab: AdminTab) => {
    setAdminTab(nextTab);
    setSelectedAdminEntryId(null);
    setSelectedAdminEntryReturnTab(nextTab);
    if (nextTab !== 'agents') setShowAdminTeamStatus(false);
    if (nextTab !== 'approvals') setSelectedAdminApproval(null);
    if (nextTab !== 'agents' && nextTab !== 'profiles') setAdminAgentsView('list');
    setScreenNotice(null);
  };

  const returnToAdminFieldEntry = () => {
    setScreen('admin');
    setAdminTab('fieldEntry');
    rememberScreen('admin');
    setScreenNotice(null);
  };

  const readPhotoFile = (file: File, source: StoredPhoto['source']) => new Promise<StoredPhoto>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose a photo/image file.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxEdge = 1280;
        const targetBytes = 420_000;
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const ratio = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
        canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not prepare selected photo.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let dataUrl = '';
        for (const quality of [0.72, 0.62, 0.52, 0.42]) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length * 0.75 <= targetBytes) break;
        }

        URL.revokeObjectURL(objectUrl);
        const compressedBytes = Math.round(dataUrl.length * 0.75);
        resolve({
          source,
          fileName: file.name.replace(/\.[^.]+$/, '') + '-field-photo.jpg',
          contentType: 'image/jpeg',
          sizeBytes: compressedBytes,
          dataUrl,
        });
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error instanceof Error ? error : new Error('Could not compress selected photo.'));
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read selected photo.'));
    };
    image.src = objectUrl;
  });

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>, source: StoredPhoto['source'], area: 'sales' | 'service') => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const storedPhoto = await readPhotoFile(file, source);
      const note = `Photo attached: ${storedPhoto.fileName} (${Math.ceil(storedPhoto.sizeBytes / 1024)} KB)`;
      if (area === 'sales') {
        setSalesPhotoAttachment(storedPhoto);
        setSalesPhotoNote((current) => current.trim() || note);
      } else {
        setServicePhotoAttachment(storedPhoto);
        setServicePhotoNote((current) => current.trim() || note);
      }
      setScreenNotice({ title: 'Photo attached', message: `${storedPhoto.fileName} will be saved with this record.`, tone: 'success' });
    } catch (error) {
      rememberLaunchIssue(`${area} photo`, error);
      setScreenNotice({ title: 'Photo not attached', message: error instanceof Error ? error.message : 'Could not attach selected photo.', tone: 'error' });
    } finally {
      event.target.value = '';
    }
  };

  const storedPhotoPayload = (note: string, photo: StoredPhoto | null) => {
    if (!photo && !note.trim()) return undefined;
    return JSON.stringify({ note: note.trim(), photo });
  };

  const parseStoredPhotoPayload = (payload?: string): { note: string; photo: StoredPhoto | null } => {
    if (!payload) return { note: '', photo: null };
    try {
      const parsed = JSON.parse(payload) as { note?: string; photo?: StoredPhoto | null };
      return { note: parsed.note ?? '', photo: parsed.photo ?? null };
    } catch {
      return { note: payload, photo: null };
    }
  };

  const PhotoViewer = ({ payload, label }: { payload?: string; label: string }) => {
    const { note, photo } = parseStoredPhotoPayload(payload);
    if (!photo?.dataUrl) {
      if (!note) return null;
      return <small>{note}</small>;
    }
    return (
      <div className="saved-photo-viewer">
        <button type="button" className="photo-preview-button" onClick={() => window.open(photo.dataUrl, '_blank')} aria-label={`View ${label} photo`}>
          <img src={photo.dataUrl} alt={`${label}: ${photo.fileName}`} />
        </button>
        <div>
          <strong>{photo.fileName}</strong>
          <span>{Math.ceil(photo.sizeBytes / 1024)} KB{note ? ` • ${note}` : ''}</span>
          <a href={photo.dataUrl} target="_blank" rel="noreferrer" download={photo.fileName}>Open full photo</a>
        </div>
      </div>
    );
  };

  const PhotoCaptureCard = ({
    area,
    title,
    helpText,
    note,
    setNote,
    photo,
  }: {
    area: 'sales' | 'service';
    title: string;
    helpText: string;
    note: string;
    setNote: (value: string) => void;
    photo: StoredPhoto | null;
  }) => (
    <div className="field-card photo-action-card">
      <div>
        <span>{title}</span>
        <small>{helpText}</small>
      </div>
      <div className="photo-actions">
        <label className="secondary-action photo-button">Camera<input className="visually-hidden" aria-label={`${area === 'sales' ? 'Sales' : 'Service'} camera photo`} type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhotoSelection(event, 'camera', area)} /></label>
        <label className="secondary-action photo-button">Upload<input className="visually-hidden" aria-label={`${area === 'sales' ? 'Sales' : 'Service'} upload photo`} type="file" accept="image/*" onChange={(event) => void handlePhotoSelection(event, 'upload', area)} /></label>
      </div>
      <textarea aria-label={`${area === 'sales' ? 'Sales' : 'Service'} photo note`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional photo note" rows={2} />
      {photo && (
        <div className="selected-photo-preview">
          <small>Ready to save: {photo.fileName} • {Math.ceil(photo.sizeBytes / 1024)} KB</small>
          <img src={photo.dataUrl} alt={`Selected ${area} photo ${photo.fileName}`} />
        </div>
      )}
    </div>
  );

  const handleAgentLogin = async () => {
    setIsAdminSignedIn(false);
    setScreenNotice(null);
    if (isBackendConfigured && (!loginEmail.trim() || !password.trim())) {
      const message = 'Enter registered email and password before logging in.';
      setStatusMessage(message);
      setScreenNotice({ title: 'Login details required', message, tone: 'warning' });
      return;
    }
    setStatusMessage('Checking login…');
    try {
      const nextSession = await crystalBioFrontendApi.login(
        isBackendConfigured ? { email: loginEmail.trim(), password } : 'agent_2',
      );
      setSession(nextSession);
      rememberSession(nextSession);
      if (nextSession.role === 'admin') {
        setIsAdminSignedIn(true);
        setAdminTab('overview');
        setSelectedAdminApproval(null);
        setStatusMessage('Admin logged in.');
        setScreen('admin');
        rememberScreen('admin');
        void refreshAdminData(nextSession);
        return;
      }
      setStatusMessage('Logged in. Check in to start field work.');
      setScreen('home');
      rememberScreen('home');
    } catch (error) {
      rememberLaunchIssue('Login', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      setStatusMessage(message);
      setScreenNotice({ title: 'Login failed', message, tone: 'error' });
    }
  };

  const handleForgotPassword = () => {
    setScreenNotice({
      title: 'Forgot password',
      message: loginEmail.trim()
        ? `Password reset for ${loginEmail.trim()} will be handled manually for this pilot. Ask admin/operator for the fresh password or reset link.`
        : 'Enter your registered email, then ask admin/operator for the fresh password or reset link.',
      tone: 'info',
    });
  };

  const handleSetupPasswordSubmit = async () => {
    if (!setupToken.trim()) {
      setScreenNotice({ title: 'Setup link missing', message: 'Open the setup link from your email, or ask admin for a fresh link.', tone: 'warning' });
      return;
    }
    if (setupPassword.length < 8) {
      setScreenNotice({ title: 'Password too short', message: 'Use at least 8 characters.', tone: 'warning' });
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setScreenNotice({ title: 'Passwords do not match', message: 'Re-enter the same password in both boxes.', tone: 'warning' });
      return;
    }
    setIsPasswordSetupSubmitting(true);
    try {
      const agent = await crystalBioFrontendApi.setupPassword({ inviteToken: setupToken.trim(), password: setupPassword });
      setLoginEmail(agent.email);
      setPassword('');
      setSetupToken('');
      setSetupPassword('');
      setSetupConfirmPassword('');
      if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);
      setScreenNotice({ title: 'Password set', message: 'You can now sign in with your registered email and new password.', tone: 'success' });
    } catch (error) {
      rememberLaunchIssue('Password setup', error);
      setScreenNotice({ title: 'Setup failed', message: error instanceof Error ? error.message : 'Ask admin for a fresh setup link.', tone: 'error' });
    } finally {
      setIsPasswordSetupSubmitting(false);
    }
  };


  const handleLeaveSubmit = async () => {
    if (!session) {
      setScreenNotice('Please wait for login before sending leave request.');
      return;
    }
    if (!leaveFromDate || !leaveToDate || !leaveReason) {
      setScreenNotice('Select leave dates and reason before submitting.');
      return;
    }
    if (leaveFromDate > leaveToDate) {
      setScreenNotice('From date cannot be after to date.');
      return;
    }
    setIsLeaveSubmitting(true);
    setScreenNotice('Sending leave request…');
    try {
      const savedLeave = await crystalBioFrontendApi.submitLeaveRequest(session, {
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        reason: leaveReason,
        ...(leaveNote.trim() ? { note: leaveNote.trim() } : {}),
      });
      setLeaveRequest(savedLeave);
      setScreenNotice({
        title: 'Leave request sent',
        message: isBackendConfigured
          ? 'Admin will review it. You can see the status in Leave and Reports.'
          : 'Request saved. Admin can approve or reject it.',
        tone: 'success',
      });
    } catch (error) {
      rememberLaunchIssue('Leave request', error);
      setScreenNotice(error instanceof Error ? error.message : 'Leave request failed');
    } finally {
      setIsLeaveSubmitting(false);
    }
  };

  const salesAnySubmitting = isSalesSubmitting || isSalesStep2Submitting || isSalesStep3Submitting;

  const handleSalesSubmit = async () => {
    if (!session) {
      setScreenNotice('Please wait for login before saving the sales visit.');
      return;
    }
    if (!salesAccountName.trim() || !salesVisitNote.trim()) {
      setScreenNotice('Add customer name and today’s visit note before saving Step 1.');
      return;
    }
    if (salesNextAction === 'follow_up_needed' && !salesFollowUpDate) {
      setScreenNotice('Select follow-up date or choose no follow-up.');
      return;
    }
    setIsSalesSubmitting(true);
    setScreenNotice(salesSaveResult ? 'Updating Sales Step 1 details…' : 'Saving Sales Step 1 with location…');
    try {
      if (salesSaveResult) {
        let opportunity = await crystalBioFrontendApi.submitSalesStep2(session, salesSaveResult.opportunity.id, {
          accountName: salesAccountName.trim(),
          ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
          ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
          ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
        });
        const salesPhotoPayload = storedPhotoPayload(salesPhotoNote, salesPhotoAttachment);
        if (salesPhotoPayload) {
          opportunity = await crystalBioFrontendApi.submitSalesStep3(session, salesSaveResult.opportunity.id, { sitePhoto: salesPhotoPayload });
          setSalesStep3Saved(true);
        }
        setSalesSaveResult({
          opportunity: { ...salesSaveResult.opportunity, ...opportunity },
          visit: {
            ...salesSaveResult.visit,
            note: salesVisitNote.trim(),
            nextAction: salesNextAction,
            ...(salesNextAction === 'follow_up_needed' ? { followUpDate: salesFollowUpDate } : { followUpDate: undefined }),
          },
        });
        setScreenNotice({
          title: 'Sales Step 1 updated',
          message: 'Changes are saved. Open Step 2 or Step 3 when more details are ready.',
          tone: 'success',
        });
        return;
      }

      const gps = await gpsForSave('sales');
      const savedSalesVisit = await crystalBioFrontendApi.submitSalesVisit(session, {
        accountName: salesAccountName.trim(),
        ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
        ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
        ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
        note: salesVisitNote.trim(),
        nextAction: salesNextAction,
        gps,
        ...(salesNextAction === 'follow_up_needed' ? { followUpDate: salesFollowUpDate } : {}),
        photos: salesPhotoAttachment ? [salesPhotoAttachment] : [],
      });
      setSalesSaveResult(savedSalesVisit);
      setBackendRecentVisitEntries((current) => [
        {
          id: savedSalesVisit.visit.id,
          customer: savedSalesVisit.opportunity.accountName,
          type: 'Sales' as const,
          status: savedSalesVisit.visit.nextAction === 'closed' ? 'Closed' : savedSalesVisit.visit.nextAction === 'no_follow_up' ? 'No follow-up' : 'Follow-up needed',
          next: savedSalesVisit.visit.followUpDate ? formatShortDate(savedSalesVisit.visit.followUpDate) : 'No date set',
          tone: savedSalesVisit.visit.nextAction === 'follow_up_needed' ? 'warning' as const : 'soft' as const,
          agentId: savedSalesVisit.visit.agentId,
          agentName: savedSalesVisit.visit.agentName,
          visitDate: savedSalesVisit.visit.visitDate,
          visitTime: savedSalesVisit.visit.visitTime,
          photoPayload: savedSalesVisit.opportunity.sitePhoto ?? storedPhotoPayload(salesPhotoNote, salesPhotoAttachment),
        },
        ...current,
      ].filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index));
      if (session.role === 'admin') void refreshAdminData(session);
      setSalesStep2Saved(false);
      setSalesStep3Saved(false);
      setScreenNotice(
        isBackendConfigured
          ? 'Sales Step 1 saved. Open Step 2 or Step 3 when more details are ready.'
          : 'Sales Step 1 saved. Step 2 and Step 3 can now be opened.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales Step 1 save failed');
    } finally {
      setIsSalesSubmitting(false);
    }
  };

  const handleSalesStep2Submit = async () => {
    if (!session || !salesSaveResult) {
      setScreenNotice('Save Sales Step 1 first, then complete Step 2.');
      return;
    }
    if (!salesAccountName.trim()) {
      setScreenNotice('Customer / lab name is required before saving Step 2.');
      return;
    }
    setIsSalesStep2Submitting(true);
    setScreenNotice('Saving Sales Step 2 customer and requirement details…');
    try {
      const opportunity = await crystalBioFrontendApi.submitSalesStep2(session, salesSaveResult.opportunity.id, {
        accountName: salesAccountName.trim(),
        ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
        ...(salesDesignation.trim() ? { designation: salesDesignation.trim() } : {}),
        ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
        ...(salesEmail.trim() ? { email: salesEmail.trim() } : {}),
        ...(salesDepartmentAddress.trim() ? { departmentAddress: salesDepartmentAddress.trim() } : {}),
        ...(salesLeadSource.trim() ? { leadSource: salesLeadSource.trim() } : {}),
        ...(salesProductType.trim() ? { productType: salesProductType.trim() } : {}),
        ...(salesBrandName.trim() ? { brandName: salesBrandName.trim() } : {}),
        ...(salesEquipmentModel.trim() ? { equipmentModel: salesEquipmentModel.trim() } : {}),
        ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
      });
      setSalesSaveResult({ ...salesSaveResult, opportunity: { ...salesSaveResult.opportunity, ...opportunity } });
      setSalesStep2Saved(true);
      setIsSalesStep2Open(false);
      setScreenNotice({
        title: 'Sales Step 2 saved',
        message: 'Customer and requirement details can still be updated later.',
        tone: 'success',
      });
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales Step 2 save failed');
    } finally {
      setIsSalesStep2Submitting(false);
    }
  };

  const handleSalesStep3Submit = async () => {
    if (!session || !salesSaveResult) {
      setScreenNotice('Save Sales Step 1 first, then complete Step 3.');
      return;
    }
    setIsSalesStep3Submitting(true);
    setScreenNotice('Saving Sales Step 3 quote, photos, and office details…');
    try {
      const opportunity = await crystalBioFrontendApi.submitSalesStep3(session, salesSaveResult.opportunity.id, {
        quoteSubmitted: salesQuoteSubmitted,
        ...(salesBudgetaryProposal.trim() ? { budgetaryProposal: salesBudgetaryProposal.trim() } : {}),
        ...(salesQuoteStatus.trim() ? { quoteStatus: salesQuoteStatus.trim() } : {}),
        ...(salesFundStatus.trim() ? { fundStatus: salesFundStatus.trim() } : {}),
        ...(salesProbability.trim() ? { probability: salesProbability.trim() } : {}),
        ...(salesClosingDate ? { closingDate: salesClosingDate } : {}),
        ...(salesSupportRequired.trim() ? { supportRequired: salesSupportRequired.trim() } : {}),
        ...(salesRemarksTimeline.trim() ? { remarksTimeline: salesRemarksTimeline.trim() } : {}),
        ...(salesOfficeNotes.trim() ? { officeNotes: salesOfficeNotes.trim() } : {}),
        ...(storedPhotoPayload(salesPhotoNote, salesPhotoAttachment) ? { sitePhoto: storedPhotoPayload(salesPhotoNote, salesPhotoAttachment) } : {}),
      });
      setSalesSaveResult({ ...salesSaveResult, opportunity: { ...salesSaveResult.opportunity, ...opportunity } });
      setSalesStep3Saved(true);
      setIsSalesStep3Open(false);
      setScreenNotice('Sales Step 3 saved. Admin can see quote/proof completion later.');
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales Step 3 save failed');
    } finally {
      setIsSalesStep3Submitting(false);
    }
  };

  const handleServiceSubmit = async () => {
    if (!session) {
      setScreenNotice('Please wait for login before saving the service visit.');
      return;
    }
    if (!serviceCustomerName.trim() || !serviceWorkDone.trim()) {
      setScreenNotice('Add customer name and today’s work done before saving.');
      return;
    }
    if ((serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed') && !serviceNextVisitDate) {
      setScreenNotice('Select next visit date or choose no follow-up.');
      return;
    }
    setIsServiceSubmitting(true);
    setScreenNotice(serviceSaveResult ? 'Updating Service Step 1 details…' : 'Saving service visit with location…');
    try {
      const serviceSession = isBackendConfigured || session.agentId === 'agent_3' ? session : await crystalBioFrontendApi.login('agent_3');
      if (serviceSession !== session) setSession(serviceSession);

      if (serviceSaveResult) {
        let serviceRecord = await crystalBioFrontendApi.submitServiceStep2(serviceSession, serviceSaveResult.serviceRecord.id, {
          customerName: serviceCustomerName.trim(),
          ...(servicePhone.trim() ? { phone: servicePhone.trim() } : {}),
          ...(serviceContactPerson.trim() ? { contactPerson: serviceContactPerson.trim() } : {}),
          ...(serviceEmail.trim() ? { email: serviceEmail.trim() } : {}),
          ...(serviceDepartmentAddress.trim() ? { departmentAddress: serviceDepartmentAddress.trim() } : {}),
          ...(serviceEquipmentName.trim() ? { equipmentName: serviceEquipmentName.trim() } : {}),
          ...(serviceBrandName.trim() ? { brandName: serviceBrandName.trim() } : {}),
          ...(serviceModelName.trim() ? { modelName: serviceModelName.trim() } : {}),
          ...(serviceSerialNumber.trim() ? { serialNumber: serviceSerialNumber.trim() } : {}),
          ...(serviceIssueCategory.trim() ? { issueCategory: serviceIssueCategory.trim() } : {}),
          ...(serviceIssueDescription.trim() ? { issueDescription: serviceIssueDescription.trim() } : {}),
          ...(serviceWarrantyAmc.trim() ? { warrantyAmc: serviceWarrantyAmc.trim() } : {}),
        });
        const servicePhotoPayload = storedPhotoPayload(servicePhotoNote, servicePhotoAttachment);
        if (servicePhotoPayload) {
          serviceRecord = await crystalBioFrontendApi.submitServiceStep3(serviceSession, serviceSaveResult.serviceRecord.id, { photoNote: servicePhotoPayload });
          setServiceStep3Saved(true);
        }
        setServiceSaveResult({
          serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord },
          visit: {
            ...serviceSaveResult.visit,
            serviceType,
            workDone: serviceWorkDone.trim(),
            supportRequired: serviceSupportRequired,
            nextAction: serviceNextAction,
            ...(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed' ? { nextVisitDate: serviceNextVisitDate } : { nextVisitDate: undefined }),
            ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : { officeNotes: undefined }),
          },
        });
        setScreenNotice({
          title: 'Service Step 1 updated',
          message: 'Changes are saved. Open Step 2 or Step 3 when more details are ready.',
          tone: 'success',
        });
        return;
      }

      const gps = await gpsForSave('service');
      const savedServiceVisit = await crystalBioFrontendApi.submitServiceVisit(serviceSession, {
        customerName: serviceCustomerName.trim(),
        ...(servicePhone.trim() ? { phone: servicePhone.trim() } : {}),
        ...(serviceContactPerson.trim() ? { contactPerson: serviceContactPerson.trim() } : {}),
        ...(serviceEmail.trim() ? { email: serviceEmail.trim() } : {}),
        ...(serviceDepartmentAddress.trim() ? { departmentAddress: serviceDepartmentAddress.trim() } : {}),
        ...(serviceEquipmentName.trim() ? { equipmentName: serviceEquipmentName.trim() } : {}),
        ...(serviceBrandName.trim() ? { brandName: serviceBrandName.trim() } : {}),
        ...(serviceModelName.trim() ? { modelName: serviceModelName.trim() } : {}),
        ...(serviceSerialNumber.trim() ? { serialNumber: serviceSerialNumber.trim() } : {}),
        ...(serviceIssueCategory.trim() ? { issueCategory: serviceIssueCategory.trim() } : {}),
        ...(serviceIssueDescription.trim() ? { issueDescription: serviceIssueDescription.trim() } : {}),
        ...(serviceWarrantyAmc.trim() ? { warrantyAmc: serviceWarrantyAmc.trim() } : {}),
        serviceType,
        workDone: serviceWorkDone.trim(),
        supportRequired: serviceSupportRequired,
        nextAction: serviceNextAction,
        gps,
        ...(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed' ? { nextVisitDate: serviceNextVisitDate } : {}),
        photos: servicePhotoAttachment ? [servicePhotoAttachment] : [],
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
      });
      setServiceSaveResult(savedServiceVisit);
      setBackendRecentVisitEntries((current) => [
        {
          id: savedServiceVisit.visit.id,
          customer: savedServiceVisit.serviceRecord.customerName,
          type: 'Service' as const,
          status: savedServiceVisit.visit.nextAction === 'closed' ? 'Closed' : savedServiceVisit.visit.nextAction === 'no_follow_up' ? 'No follow-up' : savedServiceVisit.visit.nextAction === 'parts_required' ? 'Parts required' : 'Next visit needed',
          next: savedServiceVisit.visit.nextVisitDate ? formatShortDate(savedServiceVisit.visit.nextVisitDate) : 'No date set',
          tone: savedServiceVisit.visit.nextAction === 'closed' ? 'soft' as const : 'info' as const,
          agentId: savedServiceVisit.visit.agentId,
          agentName: savedServiceVisit.visit.agentName,
          visitDate: savedServiceVisit.visit.visitDate,
          visitTime: savedServiceVisit.visit.visitTime,
          photoPayload: savedServiceVisit.serviceRecord.photoNote ?? storedPhotoPayload(servicePhotoNote, servicePhotoAttachment),
        },
        ...current,
      ].filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index));
      if (serviceSession.role === 'admin') void refreshAdminData(serviceSession);
      setServiceStep2Saved(false);
      setServiceStep3Saved(false);
      setScreenNotice(
        isBackendConfigured
          ? 'Service visit saved. Admin reports will include this update.'
          : 'Service visit saved. Admin reports will include this update.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Service visit save failed');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const handleServiceStep2Submit = async () => {
    if (!session || !serviceSaveResult) {
      setScreenNotice('Save Service Step 1 first, then complete Step 2.');
      return;
    }
    setIsServiceStep2Submitting(true);
    setScreenNotice('Saving Service Step 2 equipment and issue details…');
    try {
      const serviceRecord = await crystalBioFrontendApi.submitServiceStep2(session, serviceSaveResult.serviceRecord.id, {
        customerName: serviceCustomerName.trim(),
        ...(serviceContactPerson.trim() ? { contactPerson: serviceContactPerson.trim() } : {}),
        ...(servicePhone.trim() ? { phone: servicePhone.trim() } : {}),
        ...(serviceEmail.trim() ? { email: serviceEmail.trim() } : {}),
        ...(serviceDepartmentAddress.trim() ? { departmentAddress: serviceDepartmentAddress.trim() } : {}),
        ...(serviceEquipmentName.trim() ? { equipmentName: serviceEquipmentName.trim() } : {}),
        ...(serviceBrandName.trim() ? { brandName: serviceBrandName.trim() } : {}),
        ...(serviceModelName.trim() ? { modelName: serviceModelName.trim() } : {}),
        ...(serviceSerialNumber.trim() ? { serialNumber: serviceSerialNumber.trim() } : {}),
        ...(serviceIssueCategory.trim() ? { issueCategory: serviceIssueCategory.trim() } : {}),
        ...(serviceIssueDescription.trim() ? { issueDescription: serviceIssueDescription.trim() } : {}),
        ...(serviceWarrantyAmc.trim() ? { warrantyAmc: serviceWarrantyAmc.trim() } : {}),
      });
      setServiceSaveResult({ ...serviceSaveResult, serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord } });
      setServiceStep2Saved(true);
      setIsServiceStep2Open(false);
      setScreenNotice({
        title: 'Service Step 2 saved',
        message: 'Equipment and issue details are updated.',
        tone: 'success',
      });
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Service Step 2 save failed');
    } finally {
      setIsServiceStep2Submitting(false);
    }
  };

  const handleServiceStep3Submit = async () => {
    if (!session || !serviceSaveResult) {
      setScreenNotice('Save Service Step 1 first, then complete Step 3.');
      return;
    }
    setIsServiceStep3Submitting(true);
    setScreenNotice('Saving Service Step 3 parts, photos, and office details…');
    try {
      const serviceRecord = await crystalBioFrontendApi.submitServiceStep3(session, serviceSaveResult.serviceRecord.id, {
        ...(servicePartsRequired.trim() ? { partsRequired: servicePartsRequired.trim() } : {}),
        ...(servicePartsUsed.trim() ? { partsUsed: servicePartsUsed.trim() } : {}),
        ...(serviceMachineStatus.trim() ? { machineStatus: serviceMachineStatus.trim() } : {}),
        ...(serviceSupportRequiredNote.trim() ? { supportRequiredNote: serviceSupportRequiredNote.trim() } : {}),
        ...(serviceFinalRemarks.trim() ? { finalRemarks: serviceFinalRemarks.trim() } : {}),
        ...(storedPhotoPayload(servicePhotoNote, servicePhotoAttachment) ? { photoNote: storedPhotoPayload(servicePhotoNote, servicePhotoAttachment) } : {}),
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
      });
      setServiceSaveResult({ ...serviceSaveResult, serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord } });
      setServiceStep3Saved(true);
      setIsServiceStep3Open(false);
      setScreenNotice('Service Step 3 saved. Admin can see parts/proof completion later.');
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Service Step 3 save failed');
    } finally {
      setIsServiceStep3Submitting(false);
    }
  };

  const handleQuickAction = (action: (typeof actionMeta)[number]['onClick']) => {
    if (action === 'attendance-action') {
      if (isCheckedIn) {
        void handleAttendanceAction();
      } else {
        goToScreen('checkin');
      }
      return;
    }
    goToScreen(action, action === 'sales' ? { newSalesVisit: true } : action === 'service' ? { newServiceVisit: true } : undefined);
  };

  const roleLabel = (role?: FrontendSession['role']) => {
    if (role === 'admin') return 'Admin';
    if (role === 'service') return 'Service agent';
    if (role === 'both') return 'Sales + service agent';
    return 'Sales agent';
  };

  const handleLogout = () => {
    forgetSession();
    setSession(null);
    setAttendance(null);
    setIsAdminSignedIn(false);
    setStatusMessage('Logged out. Use your registered email and password.');
    setScreenNotice({ title: 'Logged out', message: 'You are back on the login screen.', tone: 'info' });
    setScreen('login');
  };

  const renderLogin = () => (
    <ScreenPanel title="Login" subtitle="Use your registered email and password.">
      <section className="login-brand-card" aria-label="CrystalBio login">
        <span className="login-brand-mark">CB</span>
        <div>
          <strong>CrystalBio Field App</strong>
          <small>Private team access</small>
        </div>
      </section>
      <section className="clean-login-card" aria-label="Login form">
        {setupToken && (
          <div className="form-card highlighted-card">
            <label>Set password from email link</label>
            <p>Create your password, then use the same email/password login below.</p>
            <input aria-label="New password" value={setupPassword} type="password" autoComplete="new-password" placeholder="New password" onChange={(event) => setSetupPassword(event.target.value)} />
            <input aria-label="Confirm new password" value={setupConfirmPassword} type="password" autoComplete="new-password" placeholder="Confirm password" onChange={(event) => setSetupConfirmPassword(event.target.value)} />
            <button type="button" className="primary-action" disabled={isPasswordSetupSubmitting} onClick={handleSetupPasswordSubmit}>{isPasswordSetupSubmitting ? 'Setting password…' : 'Set password'}</button>
          </div>
        )}
        <label className="field-card login-field-card">
          <span>Registered email</span>
          <input aria-label="Registered email" value={loginEmail} inputMode="email" autoComplete="email" placeholder="name@crystalbio.in" onChange={(event) => setLoginEmail(event.target.value)} />
        </label>
        <label className="field-card login-field-card">
          <span>Password</span>
          <input aria-label="Password" value={password} type="password" autoComplete="current-password" placeholder="Enter password" onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="button" className="primary-action login-main-button" onClick={handleAgentLogin}>Login</button>
        <div className="login-help-actions">
          <button type="button" className="text-link" onClick={handleForgotPassword}>Forgot password?</button>
        </div>
      </section>
    </ScreenPanel>
  );

  const renderHome = () => (
    <>
      <section className="planner-hero-card">
        <div>
          <p className="muted">Today</p>
          <strong>{isCheckedIn ? 'Checked in for field work' : 'Ready for field work'}</strong>
          <span>{statusMessage}</span>
        </div>
        <div className="hero-scribble" aria-hidden="true" />
      </section>

      {isAdminSignedIn && (
        <button type="button" className="secondary-action admin-return-action" onClick={() => goToScreen('admin')}>Back to admin dashboard</button>
      )}

      <div className="section-title action-title">
        <h3>Quick actions</h3>
        <span>Tap to open</span>
      </div>

      <div className="action-grid">
        {actionMeta.map((meta) => {
          const Icon = meta.icon;
          const isAttendanceAction = meta.onClick === 'attendance-action';
          return (
            <button
              key={meta.label}
              className={`action-card compact-action ${meta.className}`}
              type="button"
              disabled={isAttendanceAction && (!session || isAttendanceBusy)}
              onClick={() => handleQuickAction(meta.onClick)}
            >
              <div className="icon-pill"><Icon size={20} /></div>
              <h3>{isAttendanceAction && isAttendanceBusy ? 'Saving…' : meta.label}</h3>
              <p>{meta.hint}</p>
            </button>
          );
        })}
      </div>


      <section className="panel entries-panel">
        <div className="section-title">
          <h3>Recent visits</h3>
          <button type="button" className="text-link" onClick={() => goToScreen('visits')}>View all</button>
        </div>
        <div className="agent-recent-list">
          {recentVisitEntries.length ? recentVisitEntries.slice(0, 2).map((entry) => (
            <button className="agent-entry-card" key={entry.id} type="button" onClick={() => goToScreen(entry.type === 'Sales' ? 'sales' : 'service')}>
              <div className="agent-entry-main">
                <strong>{displayCustomerName(entry.customer)}</strong>
                <p>{entry.agentName}</p>
                <small>{entry.type} • Next: {entry.next}</small>
              </div>
              <span className={toneClass[entry.tone]}>{entry.status}</span>
            </button>
          )) : (
            <div className="empty-state">No saved visits yet. New Sales or Service updates will appear here.</div>
          )}
        </div>
      </section>
    </>
  );

  const renderVisits = () => {
    const query = visitSearch.trim().toLowerCase();
    const filteredEntries = recentVisitEntries.filter((entry) => {
      const haystack = `${entry.customer} ${entry.type} ${entry.next} ${entry.status}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    return (
      <ScreenPanel title="Visits" subtitle="Search previous entries, continue follow-ups, or start a new field update.">
        <label className="search-card visit-search-card">
          <Search size={17} />
          <input
            aria-label="Search visits"
            value={visitSearch}
            onChange={(event) => setVisitSearch(event.target.value)}
            placeholder="Search customer, phone, equipment, serial number"
          />
        </label>
        <div className="visit-action-grid">
          <button type="button" className="visit-action-card" aria-label="New sales visit update" onClick={() => goToScreen('sales', { newSalesVisit: true })}>
            <span className="visit-action-icon"><Plus size={19} /></span>
            <strong>Sales</strong>
            <small>New sales visit</small>
          </button>
          <button type="button" className="visit-action-card" aria-label="New service visit update" onClick={() => goToScreen('service', { newServiceVisit: true })}>
            <span className="visit-action-icon service-icon"><ClipboardList size={18} /></span>
            <strong>Service</strong>
            <small>New service visit</small>
          </button>
        </div>
        <div className="section-title previous-entries-title">
          <h3>Previous entries</h3>
          <span>Tap to continue</span>
        </div>
        {filteredEntries.length ? filteredEntries.map((entry) => (
          <button className="agent-entry-card agent-visit-entry-card" key={entry.id} type="button" onClick={() => goToScreen(entry.type === 'Sales' ? 'sales' : 'service')}>
            <div className="agent-entry-main">
              <strong>{displayCustomerName(entry.customer)}</strong>
              <p>{entry.agentName}</p>
              <small>{entry.type} • Next: {entry.next} • Tap to continue</small>
            </div>
            <span className={toneClass[entry.tone]}>{entry.status}</span>
          </button>
        )) : (
          <div className="empty-state">No saved visits yet. Start a Sales or Service update to create the first real entry.</div>
        )}
      </ScreenPanel>
    );
  };

  const renderSales = () => (
    <ScreenPanel title="Sales visit" subtitle="Save quickly first. Add remaining details later when free.">
      <div className="form-card highlighted-card">
        <label>Sales progress</label>
        <span>Step 1: {salesSaveResult ? 'Saved' : 'Pending'} • Step 2: {salesStep2Saved ? 'Saved' : 'Pending'} • Step 3: {salesStep3Saved ? 'Saved' : 'Pending'}</span>
      </div>


      <section className="step-card">
        <div className="step-heading">
          <div><span className="step-pill">Step 1</span><h3>Quick visit update</h3><p>For use at client place or immediately after coming out.</p></div>
          <span className={salesSaveResult ? 'chip chip-soft' : 'chip chip-warning'}>{salesSaveResult ? 'Saved' : 'Required'}</span>
        </div>
        <LocationCaptureCard purpose="sales" />
        <label className="field-card">
          <span>Customer / lab name</span>
          <input aria-label="Sales customer name" value={salesAccountName} onChange={(event) => setSalesAccountName(event.target.value)} />
        </label>
        <label className="field-card">
          <span>Today’s visit note</span>
          <textarea aria-label="Sales visit note" value={salesVisitNote} onChange={(event) => setSalesVisitNote(event.target.value)} placeholder="What happened in this visit?" rows={2} />
        </label>
        <label className="field-card">
          <span>Requirement discussed</span>
          <input aria-label="Sales requirement" value={salesRequirement} onChange={(event) => setSalesRequirement(event.target.value)} placeholder="Product need, quote, budget, status" />
        </label>
        <div className="inline-field-grid">
          <label className="field-card">
            <span>Contact if available</span>
            <input aria-label="Sales quick contact person" value={salesContactPerson} onChange={(event) => setSalesContactPerson(event.target.value)} placeholder="Name / role" />
          </label>
          <label className="field-card">
            <span>Phone if available</span>
            <input aria-label="Sales quick phone" value={salesPhone} onChange={(event) => setSalesPhone(event.target.value)} placeholder="Optional" inputMode="tel" />
          </label>
        </div>
        <div className="inline-field-grid">
          <label className="field-card">
            <span>Next action</span>
            <select aria-label="Sales next action" value={salesNextAction} onChange={(event) => setSalesNextAction(event.target.value as FrontendSalesNextAction)}>
              <option value="follow_up_needed">Follow-up needed</option>
              <option value="no_follow_up">No follow-up</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          {salesNextAction === 'follow_up_needed' && (
            <label className="field-card">
              <span>Follow-up date</span>
              <input aria-label="Sales follow-up date" type="date" value={salesFollowUpDate} onChange={(event) => setSalesFollowUpDate(event.target.value)} />
            </label>
          )}
        </div>
        <PhotoCaptureCard
          area="sales"
          title="Add photo"
          helpText="Optional. Camera or upload can be saved with this visit before tapping Save Step 1."
          note={salesPhotoNote}
          setNote={setSalesPhotoNote}
          photo={salesPhotoAttachment}
        />
        <button type="button" className="primary-action" disabled={salesAnySubmitting || !session} onClick={handleSalesSubmit}>{isSalesSubmitting ? 'Saving…' : salesSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
      </section>

      <section className={isSalesStep2Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
        <button type="button" className="step-heading step-toggle" aria-expanded={isSalesStep2Open} onClick={() => setIsSalesStep2Open((open) => !open)}>
          <div><span className="step-pill">Step 2</span><h3>Customer & requirement details</h3><p>Add contact and product details when available.</p><span className="step-collapsed-hint">Contact, phone, address, product</span></div>
          <span className={salesStep2Saved ? 'chip chip-soft' : 'chip chip-info'}>{salesStep2Saved ? 'Saved' : isSalesStep2Open ? 'Open' : 'Tap to open'}</span>
        </button>
        {isSalesStep2Open && <div className="step-body">
        <label className="field-card">
          <span>Contact person</span>
          <input aria-label="Sales contact person" value={salesContactPerson} onChange={(event) => setSalesContactPerson(event.target.value)} placeholder="Optional" />
        </label>
        <label className="field-card">
          <span>Designation</span>
          <input aria-label="Sales designation" value={salesDesignation} onChange={(event) => setSalesDesignation(event.target.value)} placeholder="Optional" />
        </label>
        <label className="field-card">
          <span>Phone</span>
          <input aria-label="Sales phone" value={salesPhone} onChange={(event) => setSalesPhone(event.target.value)} placeholder="Optional" inputMode="tel" />
        </label>
        <label className="field-card">
          <span>Email</span>
          <input aria-label="Sales email" value={salesEmail} onChange={(event) => setSalesEmail(event.target.value)} placeholder="Optional" inputMode="email" />
        </label>
        <label className="field-card">
          <span>Department / address</span>
          <textarea aria-label="Sales department address" value={salesDepartmentAddress} onChange={(event) => setSalesDepartmentAddress(event.target.value)} placeholder="Department, address, location details" rows={2} />
        </label>
        <label className="field-card">
          <span>Lead source</span>
          <select aria-label="Sales lead source" value={salesLeadSource} onChange={(event) => setSalesLeadSource(event.target.value)}>
            <option>Existing customer</option><option>Referral</option><option>IndiaMART</option><option>Website</option><option>Phone call</option><option>Field visit</option><option>Other</option>
          </select>
        </label>
        <label className="field-card">
          <span>Product type</span>
          <select aria-label="Sales product type" value={salesProductType} onChange={(event) => setSalesProductType(event.target.value)}>
            <option>Laboratory equipment</option><option>Hospital equipment</option><option>Biotech instrument</option><option>Consumables</option><option>Maintenance/service</option><option>Installation support</option><option>Other requirement</option>
          </select>
        </label>
        <label className="field-card">
          <span>Brand name</span>
          <input aria-label="Sales brand name" value={salesBrandName} onChange={(event) => setSalesBrandName(event.target.value)} placeholder="Optional" />
        </label>
        <label className="field-card">
          <span>Equipment name / model</span>
          <input aria-label="Sales equipment model" value={salesEquipmentModel} onChange={(event) => setSalesEquipmentModel(event.target.value)} placeholder="Optional" />
        </label>
        <button type="button" aria-label="Save Step 2" className={salesSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={salesAnySubmitting || !salesSaveResult} onClick={handleSalesStep2Submit}>{isSalesStep2Submitting ? 'Saving…' : salesSaveResult ? 'Save Step 2' : 'Complete Step 1 first'}</button>
        </div>}
      </section>

      <section className={isSalesStep3Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
        <button type="button" className="step-heading step-toggle" aria-expanded={isSalesStep3Open} onClick={() => setIsSalesStep3Open((open) => !open)}>
          <div><span className="step-pill">Step 3</span><h3>Quote, proof & office details</h3><p>Useful for follow-up, admin reports, and office team work.</p><span className="step-collapsed-hint">Quote status, support, proof, office notes</span></div>
          <span className={salesStep3Saved ? 'chip chip-soft' : 'chip chip-info'}>{salesStep3Saved ? 'Saved' : isSalesStep3Open ? 'Open' : 'Tap to open'}</span>
        </button>
        {isSalesStep3Open && <div className="step-body">
        <label className="field-card"><span>Quote submitted?</span><select aria-label="Sales quote submitted" value={salesQuoteSubmitted} onChange={(event) => setSalesQuoteSubmitted(event.target.value as 'yes' | 'no' | '')}><option value="">Not updated</option><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="field-card"><span>Budgetary proposal</span><input aria-label="Sales budgetary proposal" value={salesBudgetaryProposal} onChange={(event) => setSalesBudgetaryProposal(event.target.value)} placeholder="Optional" /></label>
        <label className="field-card"><span>Quote / deal status</span><select aria-label="Sales quote status" value={salesQuoteStatus} onChange={(event) => setSalesQuoteStatus(event.target.value)}><option>New inquiry</option><option>Quote pending</option><option>Budgetary quote</option><option>Negotiation</option><option>Closed won</option><option>Closed lost</option><option>Follow up later</option></select></label>
        <label className="field-card"><span>Fund status</span><select aria-label="Sales fund status" value={salesFundStatus} onChange={(event) => setSalesFundStatus(event.target.value)}><option>Available</option><option>Pending approval</option><option>Budget requested</option><option>Tender/procurement</option><option>Unknown</option><option>Not applicable</option></select></label>
        <label className="field-card"><span>Probability</span><input aria-label="Sales probability" value={salesProbability} onChange={(event) => setSalesProbability(event.target.value)} placeholder="Example: 40%" /></label>
        <label className="field-card"><span>Closing date</span><input aria-label="Sales closing date" type="date" value={salesClosingDate} onChange={(event) => setSalesClosingDate(event.target.value)} /></label>
        <label className="field-card"><span>Support required</span><textarea aria-label="Sales support required" value={salesSupportRequired} onChange={(event) => setSalesSupportRequired(event.target.value)} placeholder="Office/product/quote support needed" rows={2} /></label>
        <div className="office-action-strip" aria-label="Sales office action examples">
          <span>Office action markers</span>
          <button type="button" onClick={() => setSalesSupportRequired('Send quotation / product brochure')}>Send quote</button>
          <button type="button" onClick={() => setSalesSupportRequired('Arrange product demonstration')}>Product demo</button>
          <button type="button" onClick={() => setSalesSupportRequired('Call customer for budget confirmation')}>Call customer</button>
        </div>
        <label className="field-card"><span>Remarks and timeline</span><textarea aria-label="Sales remarks timeline" value={salesRemarksTimeline} onChange={(event) => setSalesRemarksTimeline(event.target.value)} placeholder="Timeline, discussion points, blockers" rows={2} /></label>
        <label className="field-card"><span>Notes for office team</span><textarea aria-label="Sales office notes" value={salesOfficeNotes} onChange={(event) => setSalesOfficeNotes(event.target.value)} placeholder="Internal notes" rows={2} /></label>
        <div className="field-card photo-action-card">
          <div>
            <span>Photos if needed</span>
            <small>Optional for Sales. Use only when a site, product, or visiting card photo is useful.</small>
          </div>
          <div className="photo-actions">
            <label className="secondary-action photo-button">Camera<input className="visually-hidden" aria-label="Sales camera photo" type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhotoSelection(event, 'camera', 'sales')} /></label>
            <label className="secondary-action photo-button">Upload<input className="visually-hidden" aria-label="Sales upload photo" type="file" accept="image/*" onChange={(event) => void handlePhotoSelection(event, 'upload', 'sales')} /></label>
          </div>
          <textarea aria-label="Sales photo note" value={salesPhotoNote} onChange={(event) => setSalesPhotoNote(event.target.value)} placeholder="Optional note, e.g. visiting card photo added" rows={2} />
          {salesPhotoAttachment && (
            <div className="selected-photo-preview">
              <small>Ready to save: {salesPhotoAttachment.fileName} • {Math.ceil(salesPhotoAttachment.sizeBytes / 1024)} KB</small>
              <img src={salesPhotoAttachment.dataUrl} alt={`Selected sales photo ${salesPhotoAttachment.fileName}`} />
            </div>
          )}
        </div>
        <button type="button" aria-label="Save Step 3" className={salesSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={salesAnySubmitting || !salesSaveResult} onClick={handleSalesStep3Submit}>{isSalesStep3Submitting ? 'Saving…' : salesSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
        </div>}
      </section>

      {salesSaveResult && (
        <div className="form-card highlighted-card">
          <label>Latest saved sales entry</label>
          <span>{salesSaveResult.opportunity.accountName} • Visit {salesSaveResult.visit.visitNumber} • {salesSaveResult.visit.nextAction.split('_').join(' ')}</span>
          <span>Step 2: {salesStep2Saved ? 'saved' : 'pending'} • Step 3: {salesStep3Saved ? 'saved' : 'pending'}</span>
          <PhotoViewer payload={salesSaveResult.opportunity.sitePhoto} label="saved sales" />
        </div>
      )}
    </ScreenPanel>
  );

  const renderService = () => {
    const serviceAnySubmitting = isServiceSubmitting || isServiceStep2Submitting || isServiceStep3Submitting;
    return (
      <ScreenPanel title="Service visit" subtitle="Save quickly first. Add equipment, parts, and proof later.">
        <div className="form-card highlighted-card">
          <label>Service progress</label>
          <span>Step 1: {serviceSaveResult ? 'Saved' : 'Pending'} • Step 2: {serviceStep2Saved ? 'Saved' : 'Pending'} • Step 3: {serviceStep3Saved ? 'Saved' : 'Pending'}</span>
        </div>


        <section className="step-card">
          <div className="step-heading">
            <div><span className="step-pill">Step 1</span><h3>Quick service update</h3><p>For the engineer to save at the site.</p></div>
            <span className={serviceSaveResult ? 'chip chip-soft' : 'chip chip-warning'}>{serviceSaveResult ? 'Saved' : 'Required'}</span>
          </div>
          <LocationCaptureCard purpose="service" />
          <label className="field-card"><span>Customer / lab name</span><input aria-label="Service customer name" value={serviceCustomerName} onChange={(event) => setServiceCustomerName(event.target.value)} /></label>
          <label className="field-card"><span>Work done / issue checked</span><textarea aria-label="Service work done" value={serviceWorkDone} onChange={(event) => setServiceWorkDone(event.target.value)} placeholder="Issue checked, work done, customer update" rows={3} /></label>
          <div className="inline-field-grid">
            <label className="field-card"><span>Equipment if known</span><input aria-label="Service quick equipment" value={serviceEquipmentName} onChange={(event) => setServiceEquipmentName(event.target.value)} placeholder="Machine / instrument" /></label>
            <label className="field-card"><span>Contact if available</span><input aria-label="Service quick contact person" value={serviceContactPerson} onChange={(event) => setServiceContactPerson(event.target.value)} placeholder="Name / role" /></label>
          </div>
          <div className="inline-field-grid">
            <label className="field-card"><span>Service type</span><select aria-label="Service type" value={serviceType} onChange={(event) => setServiceType(event.target.value as FrontendServiceType)}><option value="breakdown">Breakdown</option><option value="installation">Installation</option><option value="preventive_maintenance">Preventive maintenance</option><option value="repair">Repair</option><option value="calibration">Calibration</option><option value="demo">Product demonstration</option><option value="training">Training</option><option value="other">Other</option></select></label>
            <label className="field-card"><span>Next action</span><select aria-label="Service next action" value={serviceNextAction} onChange={(event) => setServiceNextAction(event.target.value as FrontendServiceNextAction)}><option value="parts_required">Parts required</option><option value="next_visit_needed">Next visit needed</option><option value="no_follow_up">No follow-up</option><option value="closed">Closed</option></select></label>
          </div>
          {(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed') && <label className="field-card compact-date-card"><span>Next visit date</span><input aria-label="Service next visit date" type="date" value={serviceNextVisitDate} onChange={(event) => setServiceNextVisitDate(event.target.value)} /></label>}
          <PhotoCaptureCard
            area="service"
            title="Add service photo"
            helpText="Optional. Take a machine, issue, part, or completed-work photo before saving Step 1."
            note={servicePhotoNote}
            setNote={setServicePhotoNote}
            photo={servicePhotoAttachment}
          />
          <button type="button" className="primary-action" disabled={serviceAnySubmitting || !session} onClick={handleServiceSubmit}>{isServiceSubmitting ? 'Saving…' : serviceSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
        </section>

        <section className={isServiceStep2Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
          <button type="button" className="step-heading step-toggle" aria-expanded={isServiceStep2Open} onClick={() => setIsServiceStep2Open((open) => !open)}>
            <div><span className="step-pill">Step 2</span><h3>Customer, equipment, issue</h3><p>Add instrument and issue details when available.</p><span className="step-collapsed-hint">Contact, equipment, serial, issue</span></div>
            <span className={serviceStep2Saved ? 'chip chip-soft' : 'chip chip-info'}>{serviceStep2Saved ? 'Saved' : isServiceStep2Open ? 'Open' : 'Tap to open'}</span>
          </button>
          {isServiceStep2Open && <div className="step-body">
          <label className="field-card"><span>Contact person</span><input aria-label="Service contact person" value={serviceContactPerson} onChange={(event) => setServiceContactPerson(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Phone</span><input aria-label="Service phone" value={servicePhone} onChange={(event) => setServicePhone(event.target.value)} placeholder="Optional" inputMode="tel" /></label>
          <label className="field-card"><span>Email</span><input aria-label="Service email" value={serviceEmail} onChange={(event) => setServiceEmail(event.target.value)} placeholder="Optional" inputMode="email" /></label>
          <label className="field-card"><span>Department / address</span><input aria-label="Service department address" value={serviceDepartmentAddress} onChange={(event) => setServiceDepartmentAddress(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Equipment / instrument</span><input aria-label="Service equipment" value={serviceEquipmentName} onChange={(event) => setServiceEquipmentName(event.target.value)} placeholder="Instrument name" /></label>
          <label className="field-card"><span>Brand</span><input aria-label="Service brand" value={serviceBrandName} onChange={(event) => setServiceBrandName(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Model</span><input aria-label="Service model" value={serviceModelName} onChange={(event) => setServiceModelName(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Serial number</span><input aria-label="Service serial number" value={serviceSerialNumber} onChange={(event) => setServiceSerialNumber(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Issue category</span><input aria-label="Service issue category" value={serviceIssueCategory} onChange={(event) => setServiceIssueCategory(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Detailed issue</span><textarea aria-label="Service issue description" value={serviceIssueDescription} onChange={(event) => setServiceIssueDescription(event.target.value)} placeholder="Optional detailed issue" rows={2} /></label>
          <label className="field-card"><span>Warranty / AMC</span><input aria-label="Service warranty AMC" value={serviceWarrantyAmc} onChange={(event) => setServiceWarrantyAmc(event.target.value)} placeholder="Optional" /></label>
          <button type="button" aria-label="Save Step 2" className={serviceSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={serviceAnySubmitting || !serviceSaveResult} onClick={handleServiceStep2Submit}>{isServiceStep2Submitting ? 'Saving…' : serviceSaveResult ? 'Save Step 2' : 'Complete Step 1 first'}</button>
          </div>}
        </section>

        <section className={isServiceStep3Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
          <button type="button" className="step-heading step-toggle" aria-expanded={isServiceStep3Open} onClick={() => setIsServiceStep3Open((open) => !open)}>
            <div><span className="step-pill">Step 3</span><h3>Parts, proof, office details</h3><p>For service closure and admin reporting.</p><span className="step-collapsed-hint">Parts, photos, support, final notes</span></div>
            <span className={serviceStep3Saved ? 'chip chip-soft' : 'chip chip-info'}>{serviceStep3Saved ? 'Saved' : isServiceStep3Open ? 'Open' : 'Tap to open'}</span>
          </button>
          {isServiceStep3Open && <div className="step-body">
          <label className="field-card"><span>Parts required</span><input aria-label="Service parts required" value={servicePartsRequired} onChange={(event) => setServicePartsRequired(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Parts used</span><input aria-label="Service parts used" value={servicePartsUsed} onChange={(event) => setServicePartsUsed(event.target.value)} placeholder="Optional" /></label>
          <label className="field-card"><span>Machine status</span><input aria-label="Service machine status" value={serviceMachineStatus} onChange={(event) => setServiceMachineStatus(event.target.value)} placeholder="Working / pending / closed" /></label>
          <label className="field-card support-card"><span>Support required?</span><select aria-label="Service support required" value={serviceSupportRequired ? 'yes' : 'no'} onChange={(event) => setServiceSupportRequired(event.target.value === 'yes')}><option value="yes">Yes, office/parts support needed</option><option value="no">No support needed</option></select></label>
          <label className="field-card"><span>Support note</span><textarea aria-label="Service support note" value={serviceSupportRequiredNote} onChange={(event) => setServiceSupportRequiredNote(event.target.value)} placeholder="Optional" rows={2} /></label>
          <div className="office-action-strip" aria-label="Service office action examples">
            <span>Office action markers</span>
            <button type="button" onClick={() => { setServiceSupportRequired(true); setServiceSupportRequiredNote('Arrange required parts and update engineer'); }}>Arrange parts</button>
            <button type="button" onClick={() => { setServiceSupportRequired(true); setServiceSupportRequiredNote('Schedule next site visit with customer'); }}>Revisit</button>
            <button type="button" onClick={() => { setServiceSupportRequired(true); setServiceSupportRequiredNote('Escalate case to office/service lead'); }}>Escalate</button>
          </div>
          <div className="field-card photo-action-card">
            <div><span>Service photos</span><small>Optional now. Use for machine, issue, part, or completed-work proof.</small></div>
            <div className="photo-actions">
              <label className="secondary-action photo-button">Camera<input className="visually-hidden" aria-label="Service camera photo" type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhotoSelection(event, 'camera', 'service')} /></label>
              <label className="secondary-action photo-button">Upload<input className="visually-hidden" aria-label="Service upload photo" type="file" accept="image/*" onChange={(event) => void handlePhotoSelection(event, 'upload', 'service')} /></label>
            </div>
            <input aria-label="Service photo note" value={servicePhotoNote} onChange={(event) => setServicePhotoNote(event.target.value)} placeholder="Optional photo note" />
            {servicePhotoAttachment && (
              <div className="selected-photo-preview">
                <small>Ready to save: {servicePhotoAttachment.fileName} • {Math.ceil(servicePhotoAttachment.sizeBytes / 1024)} KB</small>
                <img src={servicePhotoAttachment.dataUrl} alt={`Selected service photo ${servicePhotoAttachment.fileName}`} />
              </div>
            )}
          </div>
          <label className="field-card"><span>Final remarks</span><textarea aria-label="Service final remarks" value={serviceFinalRemarks} onChange={(event) => setServiceFinalRemarks(event.target.value)} placeholder="Optional customer confirmation / remarks" rows={2} /></label>
          <label className="field-card"><span>Notes for office</span><textarea aria-label="Service office notes" value={serviceOfficeNotes} onChange={(event) => setServiceOfficeNotes(event.target.value)} placeholder="Optional office notes" rows={2} /></label>
          <button type="button" aria-label="Save Step 3" className={serviceSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={serviceAnySubmitting || !serviceSaveResult} onClick={handleServiceStep3Submit}>{isServiceStep3Submitting ? 'Saving…' : serviceSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
          </div>}
        </section>

        {serviceSaveResult && <div className="form-card highlighted-card"><label>Latest saved service visit</label><span>{serviceSaveResult.serviceRecord.customerName} • Visit {serviceSaveResult.visit.visitNumber} • {serviceSaveResult.visit.nextAction.split('_').join(' ')}</span><span>Step 2: {serviceStep2Saved ? 'saved' : 'pending'} • Step 3: {serviceStep3Saved ? 'saved' : 'pending'}</span><PhotoViewer payload={serviceSaveResult.serviceRecord.photoNote} label="saved service" /></div>}
      </ScreenPanel>
    );
  };

  const renderCheckIn = () => (
    <ScreenPanel title="Check in" subtitle="Choose today’s work plan before starting field work.">
      <div className="attendance-status-card">
        <div className="attendance-status-icon"><MapPin size={20} /></div>
        <div>
          <label>Current location</label>
          <strong>{currentGps ? 'Location added' : 'Add current location'}</strong>
          <span>{currentLocationSummary}</span>
        </div>
      </div>
      <button type="button" className="secondary-action location-capture-action" disabled={isLocationCapturing} onClick={() => void captureCurrentLocation('check-in')}>
        {isLocationCapturing ? 'Getting location…' : currentGps ? 'Refresh current location' : 'Use current location'}
      </button>
      <div className="work-type-card">
        <label>Today’s work plan</label>
        <p>Select one or more before check-in.</p>
        <div className="work-type-badges">
          {['Sales visit', 'Service visit', 'In office'].map((type) => {
            const selected = workTypes.includes(type);
            return (
              <button key={type} type="button" className={selected ? 'work-type-badge work-type-selected' : 'work-type-badge'} onClick={() => toggleWorkType(type)}>
                {selected ? '✓ ' : ''}{type}
              </button>
            );
          })}
        </div>
        <span>{workTypes.length ? `Selected: ${workTypes.join(' + ')}` : 'Work type is mandatory before check-in.'}</span>
      </div>
      <label className="field-card">
        <span>Opening note</span>
        <textarea aria-label="Check-in opening note" value={checkInNote} onChange={(event) => setCheckInNote(event.target.value)} placeholder="Optional: route plan, first client, or office note" rows={3} />
      </label>
      <button type="button" className="primary-action" disabled={!session || isAttendanceBusy || !workTypes.length} onClick={handleCheckInSubmit}>{isAttendanceBusy ? 'Saving…' : 'Check in now'}</button>
      <button type="button" className="secondary-action" onClick={() => goToScreen('attendance')}>View attendance</button>
    </ScreenPanel>
  );

  const renderAttendance = () => {
    const todayStatus = attendance?.status === 'checked_in' ? 'Checked in' : attendance?.status === 'checked_out' ? 'Checked out' : 'Not checked in yet';
    const todayDetail = attendance?.status === 'checked_in'
      ? 'Start location saved. Check out after field work.'
      : attendance?.status === 'checked_out'
        ? 'Start and end locations saved for today.'
        : 'Tap Check in before the first field visit.';
    const todayLog = attendance?.status === 'checked_in'
      ? { date: 'Today', status: 'Checked in', detail: `Started today • ${workTypes.join(' + ') || 'Work type not selected'}` }
      : attendance?.status === 'checked_out'
        ? { date: 'Today', status: 'Checked out', detail: `Completed today • ${workTypes.join(' + ') || 'Work type not selected'}` }
        : { date: 'Today', status: 'Ready to check in', detail: `Not started yet • ${workTypes.join(' + ') || 'Choose work type'}` };
    const attendanceLogs = [todayLog, ...sampleAttendanceLogs.filter((log) => log.date !== 'Today')];
    return (
      <ScreenPanel title="Attendance" subtitle="Track today, weekly attendance, and leave status in one place.">
        <div className="attendance-status-card">
          <div className="attendance-status-icon"><Clock3 size={20} /></div>
          <div>
            <label>Today’s status</label>
            <strong>{todayStatus}</strong>
            <span>{todayDetail}</span>
          </div>
        </div>
        <div className="work-type-card">
          <label>Today’s work type</label>
          <p>Select one or more before check-in.</p>
          <div className="work-type-badges">
            {['Sales visit', 'Service visit', 'In office'].map((type) => {
              const selected = workTypes.includes(type);
              return (
                <button key={type} type="button" className={selected ? 'work-type-badge work-type-selected' : 'work-type-badge'} onClick={() => toggleWorkType(type)}>
                  {type}
                </button>
              );
            })}
          </div>
          <span>{workTypes.length ? `Marked as: ${workTypes.join(' + ')}` : 'Choose field work, office work, or both.'}</span>
        </div>
        <div className="form-card highlighted-card location-capture-card">
          <label>GPS capture</label>
          <p>{currentLocationSummary}</p>
          <button type="button" className="secondary-action location-capture-action" disabled={isLocationCapturing} onClick={() => void captureCurrentLocation('attendance')}>
            {isLocationCapturing ? 'Getting location…' : currentGps ? 'Refresh current location' : 'Use current location'}
          </button>
        </div>
        <button type="button" className="primary-action attendance-main-action" disabled={!session || isAttendanceBusy} onClick={() => isCheckedIn ? void handleAttendanceAction() : goToScreen('checkin')}>{isAttendanceBusy ? 'Saving…' : attendanceAction}</button>
        <div className="section-label">Recent attendance</div>
        {attendanceLogs.map((log) => (
          <div className="entry-row" key={log.date}>
            <div><strong>{log.date}</strong><p>{log.detail}</p></div>
            <span className="chip chip-soft">{log.status}</span>
          </div>
        ))}
        <div className="section-label leave-section-label">Leave requests</div>
        <div className="form-card leave-status-card">
          <label>Leave status</label>
          <strong>{leaveRequest ? leaveRequest.status : 'No active request'}</strong>
          <span>{leaveRequest ? `${leaveRequest.fromDate} to ${leaveRequest.toDate} • ${leaveRequest.reason}` : 'No leave requests submitted.'}</span>
        </div>
        <button type="button" className="secondary-action" onClick={() => goToScreen('leave')}>Request leave</button>
      </ScreenPanel>
    );
  };

  const renderLeave = () => (
    <ScreenPanel title="Leave request" subtitle="Send a simple request for admin approval.">
      <div className="form-card highlighted-card leave-summary-card">
        <label>Request summary</label>
        <span>{leaveFromDate || 'From date'} to {leaveToDate || 'To date'}</span>
        <p>{leaveReason}{leaveNote ? ` • ${leaveNote}` : ''}</p>
      </div>
      <label className="field-card">
        <span>From date</span>
        <input aria-label="Leave from date" type="date" value={leaveFromDate} onChange={(event) => setLeaveFromDate(event.target.value)} />
      </label>
      <label className="field-card">
        <span>To date</span>
        <input aria-label="Leave to date" type="date" value={leaveToDate} onChange={(event) => setLeaveToDate(event.target.value)} />
      </label>
      <label className="field-card">
        <span>Reason</span>
        <select aria-label="Leave reason" value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)}>
          <option>Sick leave</option>
          <option>Personal work</option>
          <option>Emergency</option>
          <option>Family function</option>
          <option>Other</option>
        </select>
      </label>
      <label className="field-card">
        <span>Note for admin</span>
        <textarea aria-label="Leave note" value={leaveNote} onChange={(event) => setLeaveNote(event.target.value)} placeholder="Optional short note" rows={3} />
      </label>
      <button type="button" className="primary-action" disabled={isLeaveSubmitting || !session} onClick={handleLeaveSubmit}>{isLeaveSubmitting ? 'Submitting…' : 'Submit leave request'}</button>
      {leaveRequest && (
        <div className="form-card leave-confirm-card">
          <label>Latest request</label>
          <strong>{leaveRequest.status}</strong>
          <span>{leaveRequest.fromDate} to {leaveRequest.toDate} • {leaveRequest.reason}</span>
          {leaveRequest.note && <span>Note: {leaveRequest.note}</span>}
        </div>
      )}
      <div className="section-label">Leave history</div>
      <div className="entry-row">
        <div><strong>{leaveRequest ? `${leaveRequest.fromDate} to ${leaveRequest.toDate}` : 'No leave request yet'}</strong><p>{leaveRequest ? leaveRequest.reason : 'Submit a request to track approval status.'}</p></div>
        <span className="chip chip-soft">{leaveRequest ? 'in review' : 'clear'}</span>
      </div>

    </ScreenPanel>
  );

  const renderReports = () => {
    const leaveStatus = leaveRequest?.status ?? 'No leave pending';
    const attendanceLabel = attendance?.status === 'checked_in' ? 'Checked in today' : attendance?.status === 'checked_out' ? 'Checked out today' : 'Not checked in';
    const currentSalesCount = backendRecentVisitEntries.filter((entry) => entry.type === 'Sales').length;
    const currentServiceCount = backendRecentVisitEntries.filter((entry) => entry.type === 'Service').length;
    const currentFollowUps = backendRecentVisitEntries.filter((entry) => entry.tone === 'warning').length;
    const reportCopy: Record<ReportPeriod, { title: string; range: string; sales: string; service: string; attendance: string; followUps: string; leave: string }> = {
      today: { title: 'Daily report', range: 'Today', sales: String(currentSalesCount), service: String(currentServiceCount), attendance: attendanceLabel, followUps: String(currentFollowUps), leave: leaveStatus },
      week: { title: 'Weekly report', range: 'This week', sales: 'Generate from admin report', service: 'Generate from admin report', attendance: 'Generate from admin report', followUps: 'Generate from admin report', leave: leaveStatus },
      month: { title: 'Monthly report', range: 'This month', sales: 'Generate from admin report', service: 'Generate from admin report', attendance: 'Generate from admin report', followUps: 'Generate from admin report', leave: leaveStatus },
      custom: { title: 'Custom date report', range: `${reportFromDate} to ${reportToDate}`, sales: 'Generate from admin report', service: 'Generate from admin report', attendance: 'Generate from admin report', followUps: 'Generate from admin report', leave: leaveStatus },
    };
    const activeReport = reportCopy[reportPeriod];
    const kindLabels: Record<AgentReportKind, { title: string; helper: string }> = {
      attendance: { title: 'Attendance report', helper: 'Check-in, check-out, working days, leave' },
      visits: { title: 'Visit report', helper: 'Sales visits, service visits, follow-ups' },
      combined: { title: 'Combined work report', helper: 'Attendance + visits + leave in one report' },
    };
    const generateReport = () => {
      setScreenNotice({
        title: `${activeReport.title} ready`,
        message: `${kindLabels[reportKind].title} for ${activeReport.range}.`,
        tone: 'success',
      });
    };

    return (
      <ScreenPanel title="My reports" subtitle="Choose one report type, choose dates, then generate.">
        <section className="report-setup-card" aria-label="Report setup">
          <label>Report type</label>
          <div className="report-kind-list">
            {(Object.keys(kindLabels) as AgentReportKind[]).map((kind) => (
              <button key={kind} type="button" className={kind === reportKind ? 'report-kind-row report-kind-active' : 'report-kind-row'} onClick={() => setReportKind(kind)}>
                <span>{kindLabels[kind].title}</span>
                <small>{kindLabels[kind].helper}</small>
              </button>
            ))}
          </div>

          <div className={reportPeriod === 'custom' ? 'date-filter-card inline-date-filter-card date-filter-card-expanded' : 'date-filter-card inline-date-filter-card compact-date-filter-card'} aria-label="My report period">
          <div className="date-filter-head compact-date-filter-head">
            <div><label>Report dates</label><strong>{activeReport.range}</strong></div>
            <select aria-label="My report preset" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}>
              <option value="today">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="custom">Custom dates</option>
            </select>
          </div>
          {reportPeriod === 'custom' && (
            <div className="date-range-fields compact-date-range-fields">
              <label><span>From</span><input aria-label="My report from date" type="date" value={reportFromDate} onChange={(event) => setReportFromDate(event.target.value)} /></label>
              <label><span>To</span><input aria-label="My report to date" type="date" value={reportToDate} onChange={(event) => setReportToDate(event.target.value)} /></label>
            </div>
          )}
          </div>

          <button type="button" className="primary-action single-report-generate" onClick={generateReport}>Generate report</button>
          <p className="report-approval-note">Preview uses saved field entries. Full office PDF is available from Admin Reports.</p>
        </section>

        <section className="report-preview-card simple-report-preview-card">
          <div className="report-preview-heading">
            <div>
              <label>Preview</label>
              <strong>{kindLabels[reportKind].title}</strong>
              <span>{activeReport.title} • {activeReport.range}</span>
            </div>
            <span className="chip chip-soft">Preview</span>
          </div>
          {(reportKind === 'attendance' || reportKind === 'combined') && (
            <div className="report-line"><span>Attendance</span><strong>{activeReport.attendance}</strong></div>
          )}
          {(reportKind === 'visits' || reportKind === 'combined') && (
            <>
              <div className="report-line"><span>Sales visits</span><strong>{activeReport.sales}</strong></div>
              <div className="report-line"><span>Service visits</span><strong>{activeReport.service}</strong></div>
              <div className="report-line"><span>Follow-ups pending</span><strong>{activeReport.followUps}</strong></div>
            </>
          )}
          {(reportKind === 'attendance' || reportKind === 'combined') && (
            <div className="report-line"><span>Leave</span><strong>{activeReport.leave}</strong></div>
          )}
        </section>
      </ScreenPanel>
    );
  };

  const renderProfile = () => {
    const agentName = session?.agentName ?? 'Not logged in';
    const agentId = session?.agentId ?? 'Not available';
    const agentPhone = session?.phone ?? 'Not added';
    const agentEmail = session?.email ?? 'Not added';

    return (
      <ScreenPanel title="Profile" subtitle="Logged-in account details.">
        <section className="profile-hero-card">
          <span className="profile-avatar"><UserRound size={25} /></span>
          <div>
            <p>Logged-in user</p>
            <strong>{agentName}</strong>
            <span>{roleLabel(session?.role)}</span>
          </div>
        </section>

        <section className="profile-info-card">
          <div><span>Employee ID</span><strong>{agentId}</strong></div>
          <div><span>Role</span><strong>{roleLabel(session?.role)}</strong></div>
          <div><span>Phone</span><strong>{agentPhone}</strong></div>
          <div><span>Email ID</span><strong>{agentEmail}</strong></div>
        </section>

        <button type="button" className="secondary-action logout-action" onClick={handleLogout}>Logout</button>
      </ScreenPanel>
    );
  };


  const roleTextForAdminSeat = (role: AdminSeat['role']) => {
    if (role === 'admin') return 'Admin';
    if (role === 'service') return 'Service agent';
    return 'Sales agent';
  };

  const statusTextForSeat = (status: AdminSeatStatus) => {
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'Inactive';
    if (status === 'expired') return 'Setup expired';
    return 'Setup pending';
  };

  const handleCreateSeatInvite = async () => {
    const trimmedName = newSeatName.trim();
    const trimmedEmail = newSeatEmail.trim();
    const trimmedEmployeeId = newSeatEmployeeId.trim();
    if (!trimmedName || !trimmedEmail || !trimmedEmployeeId) {
      setScreenNotice({ title: 'Missing details', message: 'Name, employee ID, and email are needed before creating a pilot profile.', tone: 'warning' });
      return;
    }
    if (isBackendConfigured && (!session || session.role !== 'admin')) {
      setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before changing employee access.', tone: 'warning' });
      return;
    }
    const inviteSession = session ?? { token: 'demo-admin-token', agentId: 'agent_1', agentName: 'Admin User', role: 'admin' as const };
    try {
      const invitedSeat: FrontendAdminSeatInvite = await crystalBioFrontendApi.createAdminInvite(inviteSession, {
        name: trimmedName,
        employeeId: trimmedEmployeeId,
        email: trimmedEmail,
        mobile: newSeatMobile.trim() || undefined,
        role: newSeatRole,
      });
      const nextSeat: AdminSeat = {
        id: invitedSeat.id,
        name: invitedSeat.name,
        employeeId: invitedSeat.employeeId,
        email: invitedSeat.email,
        mobile: invitedSeat.mobile || 'Not added',
        role: invitedSeat.role,
        territory: newSeatTerritory.trim() || 'Not assigned',
        status: invitedSeat.active ? 'active' : 'invited',
        lastActive: 'Invite created just now',
        setupLink: invitedSeat.setupLink,
        emailDelivery: invitedSeat.emailDelivery,
      };
      setAdminSeats((current) => [nextSeat, ...current.filter((seat) => seat.email !== nextSeat.email)]);
      setSelectedAdminSeatId(nextSeat.id);
      setAdminAgentsView('invite');
      setScreenNotice({ title: 'Profile created', message: `Profile created for ${nextSeat.name}. For this pilot, copy the setup link/message and share it manually.`, tone: 'success' });
    } catch (error) {
      rememberLaunchIssue('Admin profile', error);
      setScreenNotice({ title: 'Profile failed', message: error instanceof Error ? error.message : 'Could not create the employee profile.', tone: 'error' });
    }
  };

  const updateSeatFromBackend = (agent: FrontendAdminSeatInvite, fallback?: AdminSeat) => {
    const nextSeat: AdminSeat = {
      id: agent.id,
      name: agent.name,
      employeeId: agent.employeeId || fallback?.employeeId || agent.id,
      email: agent.email || fallback?.email || 'Email not added',
      mobile: agent.mobile || fallback?.mobile || 'Not added',
      role: agent.role,
      territory: fallback?.territory || 'CrystalBio team',
      status: agent.active ? 'active' : agent.inviteStatus === 'pending' ? 'invited' : 'inactive',
      lastActive: agent.active ? (fallback?.lastActive || 'Active') : agent.inviteStatus === 'pending' ? 'Invite pending' : 'Inactive',
      setupLink: agent.setupLink || fallback?.setupLink,
      emailDelivery: agent.emailDelivery || fallback?.emailDelivery,
    };
    setAdminSeats((current) => current.map((seat) => seat.id === nextSeat.id ? nextSeat : seat));
    setSelectedAdminSeatId(nextSeat.id);
    return nextSeat;
  };

  const handleResetSeatInvite = async (seat: AdminSeat) => {
    if (!session || session.role !== 'admin') {
      setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before resetting access.', tone: 'warning' });
      return;
    }
    try {
      const agent = await crystalBioFrontendApi.resetAdminInvite(session, seat.id);
      const nextSeat = updateSeatFromBackend(agent, seat);
      setAdminAgentsView('invite');
      setScreenNotice({ title: 'Setup link ready', message: `${nextSeat.name} has a fresh setup link. Copy it and share it manually for this pilot.`, tone: 'info' });
    } catch (error) {
      rememberLaunchIssue('Reset access', error);
      setScreenNotice({ title: 'Reset failed', message: error instanceof Error ? error.message : 'Could not reset this password setup.', tone: 'error' });
    }
  };

  const handleDeactivateSeat = async (seat: AdminSeat) => {
    if (!session || session.role !== 'admin') {
      setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before changing profile access.', tone: 'warning' });
      return;
    }
    try {
      const agent = await crystalBioFrontendApi.updateAdminAgentStatus(session, seat.id, false);
      const nextSeat = updateSeatFromBackend(agent, seat);
      setScreenNotice({ title: 'Profile deactivated', message: `${nextSeat.name} can no longer log in.`, tone: 'warning' });
    } catch (error) {
      rememberLaunchIssue('Deactivate profile', error);
      setScreenNotice({ title: 'Deactivate failed', message: error instanceof Error ? error.message : 'Could not deactivate this profile.', tone: 'error' });
    }
  };

  const renderAdmin = () => {
    const backendRows: AdminActivityRow[] = (adminReport?.agentSummaries ?? []).map((summary) => {
      const totalVisits = summary.salesVisitCount + summary.serviceVisitCount;
      const needsReview = summary.attendanceStatus === 'not_checked_in' || summary.followUpsDue.length > 0;
      const roleKey = adminRoleKeyForSummary(summary);
      return {
        id: summary.agentId,
        name: summary.agentName,
        role: adminRoleLabel(roleKey),
        roleKey,
        attendance: summary.attendanceStatus.replace(/_/g, ' '),
        visits: totalVisits ? `${summary.salesVisitCount} sales • ${summary.serviceVisitCount} service` : 'No visit update yet',
        status: needsReview ? 'Needs check' : 'Ready',
        chipClass: needsReview ? 'chip chip-warning' : 'chip chip-soft',
        salesVisitCount: summary.salesVisitCount,
        serviceVisitCount: summary.serviceVisitCount,
        followUpsDue: summary.followUpsDue,
      };
    });
    const adminRows = backendRows;
    const totalVisits = adminRows.reduce((sum, row) => sum + row.salesVisitCount + row.serviceVisitCount, 0);
    const checkedInCount = adminRows.filter((row) => row.attendance === 'checked in').length;
    const needsReviewCount = adminRows.filter((row) => row.status !== 'Ready').length;
    const followUpCount = adminRows.reduce((sum, row) => sum + row.followUpsDue.length, 0);
    const period = {
      label: adminPeriod === 'custom' ? `${adminReportFromDate} to ${adminReportToDate}` : adminPeriod === 'today' ? 'Today' : adminPeriod === 'week' ? 'This week' : 'This month',
      active: totalVisits ? `${totalVisits} field updates today` : 'No submitted work yet today',
      summary: adminRows.length ? `${checkedInCount} checked in • ${needsReviewCount} need check • ${followUpCount} follow-ups` : 'No field activity has been saved yet.',
      visits: String(totalVisits),
      checkedIn: String(checkedInCount),
      leave: String(adminLeaveRequests.filter((request) => request.status === 'pending').length),
      followUps: String(followUpCount),
    };
    const overviewPeriod = period;
    const adminReportDetails: Record<string, { attendance: string[]; visits: string[]; missing: string[]; leave: string; officeAction: string }> = Object.fromEntries(adminRows.map((row) => [row.name, {
      attendance: [`Status: ${row.attendance}`],
      visits: [row.visits],
      missing: row.status === 'Ready' ? ['No missing item flagged.'] : ['Check attendance or pending follow-up.'],
      leave: 'Leave details appear under Approvals when submitted.',
      officeAction: row.followUpsDue.length ? row.followUpsDue.join(', ') : 'No office action recorded.',
    }]));
    const adminOfficeActions = adminRows.flatMap((row) => row.followUpsDue.map((detail) => ({ title: 'Follow-up due', detail: `${row.name} • ${detail}`, tone: 'warning' as const })));
    const adminTodayPriorities = adminOfficeActions.slice(0, 3).map((action) => ({ ...action, label: 'Action', target: 'agents' as const, filter: 'all' as AdminAgentFilter }));
    const openTodayPriority = (item: (typeof adminTodayPriorities)[number]) => {
      setAdminAgentFilter(item.filter);
      setExpandedAgentActivityId(null);
      setAdminTab('agents');
      setScreenNotice({ title: item.title, message: 'Opened the live agent list.', tone: 'warning' });
    };
    const adminReportScopeLabels: Record<AdminReportScope, string> = {
      office: 'Whole office report',
      sales: 'All sales agents',
      service: 'All service agents',
      agent: 'Selected agent',
    };
    const adminReportKindLabels: Record<AdminReportKind, string> = {
      attendance: 'Attendance report',
      visits: 'Visit report',
      combined: 'Combined report',
    };
    const adminReportScopeRows = adminRows.filter((row) => {
      if (adminReportScope === 'office') return true;
      if (adminReportScope === 'sales') return matchesAdminAgentFilter(row, 'sales');
      if (adminReportScope === 'service') return matchesAdminAgentFilter(row, 'service');
      return true;
    });
    const reportSalesVisits = adminReportScopeRows.reduce((sum, row) => sum + row.salesVisitCount, 0);
    const reportServiceVisits = adminReportScopeRows.reduce((sum, row) => sum + row.serviceVisitCount, 0);
    const reportReadyAgents = adminReportScopeRows.filter((row) => row.status === 'Ready').length;
    const reportReviewAgents = adminReportScopeRows.filter((row) => row.status !== 'Ready').length;
    const reportSubmittedEntries = teamVisitEntries.filter((entry) => {
      if (adminReportScope === 'office') return true;
      const agentRow = adminRows.find((row) => row.id === entry.agentId || row.name === entry.agentName);
      if (adminReportScope === 'sales') return entry.type === 'Sales' || agentRow?.roleKey === 'sales' || agentRow?.roleKey === 'both';
      if (adminReportScope === 'service') return entry.type === 'Service' || agentRow?.roleKey === 'service' || agentRow?.roleKey === 'both';
      return true;
    });
    const overviewVisibleEntries = teamVisitEntries.slice(0, 4);
    const overviewMetricDetails: Record<AdminOverviewMetric, string[]> = {
      visits: overviewVisibleEntries.length
        ? overviewVisibleEntries.map((entry) => `${displayCustomerName(entry.customer)} • ${entry.agentName} • ${entry.type}`)
        : ['No submitted Sales or Service forms today.'],
      checkedIn: adminRows.filter((row) => row.attendance === 'checked in').length
        ? adminRows.filter((row) => row.attendance === 'checked in').map((row) => `${row.name} • ${row.role}`)
        : ['No agent checked in yet.'],
      leave: adminLeaveRequests.filter((request) => request.status === 'pending').length
        ? adminLeaveRequests.filter((request) => request.status === 'pending').map((request) => `${request.agentName} • ${formatShortDate(request.fromDate)} to ${formatShortDate(request.toDate)}`)
        : ['No leave requests waiting.'],
      followUps: followUpCount
        ? adminRows.flatMap((row) => row.followUpsDue.map((detail) => `${row.name} • ${detail}`))
        : ['No follow-up action waiting.'],
    };
    const adminOverviewMetrics: Array<{ key: AdminOverviewMetric; value: string; label: string; hint: string; action: string }> = [
      { key: 'visits', value: overviewPeriod.visits, label: 'Total visits', hint: 'Today', action: 'Show forms' },
      { key: 'checkedIn', value: overviewPeriod.checkedIn, label: 'Checked in', hint: 'Agents active', action: 'Show active' },
      { key: 'leave', value: overviewPeriod.leave, label: 'Leave', hint: 'Needs review', action: 'Review' },
      { key: 'followUps', value: overviewPeriod.followUps, label: 'Follow-ups', hint: 'Need action', action: 'Show action' },
    ];
    const openAdminMetric = (key: AdminOverviewMetric) => {
      setExpandedAdminMetric((current) => current === key ? null : key);
      if (key === 'leave') {
        const firstPendingLeave = adminLeaveRequests.find((request) => request.status === 'pending');
        if (firstPendingLeave) setSelectedAdminApproval(firstPendingLeave.id);
      }
      setScreenNotice(null);
    };
    const successfulLoginEvents = adminLoginActivity.filter((event) => event.success);
    const failedLoginEvents = adminLoginActivity.filter((event) => !event.success);
    const seriousClientErrors = adminClientErrors.filter((event) => event.severity === 'critical' || event.severity === 'high');
    const lastMonitorEvent = [...adminLoginActivity, ...adminClientErrors]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
    const monitoringCards = [
      { label: 'Logged in', value: String(successfulLoginEvents.length), hint: 'Recent successful account logins', tone: 'good' },
      { label: 'Failed login', value: String(failedLoginEvents.length), hint: failedLoginEvents.length ? 'Needs a quick check' : 'No failed attempts', tone: failedLoginEvents.length ? 'warn' : 'good' },
      { label: 'App errors', value: String(adminClientErrors.length), hint: seriousClientErrors.length ? `${seriousClientErrors.length} serious` : 'No serious issue', tone: seriousClientErrors.length ? 'warn' : 'good' },
    ];
    const refreshMonitoring = async () => {
      if (!session || session.role !== 'admin') {
        setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before opening monitoring.', tone: 'warning' });
        return;
      }
      setIsAdminMonitorRefreshing(true);
      try {
        const [loginActivity, clientErrors] = await Promise.all([
          crystalBioFrontendApi.getAdminLoginActivity(session),
          crystalBioFrontendApi.getAdminClientErrors(session),
        ]);
        setAdminLoginActivity(loginActivity);
        setAdminClientErrors(clientErrors);
        setScreenNotice({ title: 'Monitoring refreshed', message: 'Latest login and error records are showing.', tone: 'success' });
      } catch (error) {
        rememberLaunchIssue('Monitoring refresh', error);
        setScreenNotice({ title: 'Refresh failed', message: error instanceof Error ? error.message : 'Could not load monitoring records.', tone: 'error' });
      } finally {
        setIsAdminMonitorRefreshing(false);
      }
    };
    const reportVisitCount = reportSubmittedEntries.length || reportSalesVisits + reportServiceVisits;
    const reportChartMax = Math.max(reportSalesVisits, reportServiceVisits, reportReadyAgents, reportReviewAgents, 1);
    const chartWidth = (value: number) => `${Math.max(value === 0 ? 0 : 8, Math.round((value / reportChartMax) * 100))}%`;
    const backendApprovalRequests = [...reviewedAdminLeaveRequests, ...adminLeaveRequests]
      .filter((request, index, all) => all.findIndex((candidate) => candidate.id === request.id) === index);
    const approvalRequests = backendApprovalRequests;
    const pendingApprovalRequests = approvalRequests.filter((request) => request.status === 'pending');
    const adminApprovals: Record<AdminApprovalId, { leaveRequestId: string; status: FrontendLeaveRequest['status']; label: string; chipClass: string; agent: string; title: string; summary: string; detail: string; meta: string; actionNote: string }> = Object.fromEntries(
      approvalRequests.map((request) => [
        request.id,
        {
          leaveRequestId: request.id,
          status: request.status,
          label: 'Leave',
          chipClass: request.status === 'pending' ? 'chip chip-warning' : request.status === 'approved' ? 'chip chip-soft' : 'chip chip-info',
          agent: request.agentName,
          title: 'Leave request',
          summary: `${formatShortDate(request.fromDate)} to ${formatShortDate(request.toDate)} • ${request.reason}`,
          detail: `${request.agentName} requested leave from ${formatShortDate(request.fromDate)} to ${formatShortDate(request.toDate)}.${request.note ? ` Note: ${request.note}` : ''}`,
          meta: `Field agent • ${request.status === 'pending' ? 'Waiting for admin decision' : `Marked ${request.status}`}`,
          actionNote: request.status === 'pending' ? 'Approval status will show in the agent app and reports.' : 'This decision has already been recorded.',
        },
      ]),
    );
    const openApproval = (approvalId: AdminApprovalId) => {
      setSelectedAdminApproval(approvalId);
      setAdminTab('approvals');
      setScreenNotice(null);
    };
    const activeApproval = selectedAdminApproval ? adminApprovals[selectedAdminApproval] : null;
    const reviewAdminLeave = async (nextStatus: 'approved' | 'rejected') => {
      if (!activeApproval) return;
      if (isBackendConfigured && (!session || session.role !== 'admin')) {
        setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before approving leave.', tone: 'warning' });
        return;
      }
      const reviewSession = session ?? { token: 'demo-admin-token', agentId: 'agent_1', agentName: 'Admin User', role: 'admin' as const };
      try {
        const reviewedLeave = await crystalBioFrontendApi.reviewLeaveRequest(reviewSession, activeApproval.leaveRequestId, nextStatus);
        setReviewedAdminLeaveRequests((current) => [reviewedLeave, ...current.filter((request) => request.id !== reviewedLeave.id)]);
        setAdminLeaveRequests((current) => current.map((request) => request.id === reviewedLeave.id ? reviewedLeave : request));
        setScreenNotice({ title: nextStatus === 'approved' ? 'Approved' : 'Rejected', message: `${reviewedLeave.agentName} leave request marked ${nextStatus}.`, tone: nextStatus === 'approved' ? 'success' : 'warning' });
      } catch (error) {
        rememberLaunchIssue('Leave approval', error);
        setScreenNotice({ title: 'Leave update failed', message: error instanceof Error ? error.message : 'Could not update leave approval.', tone: 'error' });
      }
    };
    const visibleAgentActivityRows = adminRows.filter((row) => matchesAdminAgentFilter(row, adminAgentFilter));
    const adminOwnFieldEntries = recentVisitEntries.filter((entry) => entry.agentId === session?.agentId || (!entry.agentId && entry.agentName === session?.agentName));
    const adminFieldEntrySource = adminFieldEntryScope === 'all' ? teamVisitEntries : adminOwnFieldEntries;
    const normalizedAdminFieldSearch = adminFieldEntrySearch.trim().toLowerCase();
    const visibleAdminFieldEntries = adminFieldEntrySource.filter((entry) => {
      if (!normalizedAdminFieldSearch) return true;
      return [displayCustomerName(entry.customer), entry.customer, entry.agentName, entry.type, entry.status, entry.visitDate, entry.visitTime]
        .some((value) => String(value ?? '').toLowerCase().includes(normalizedAdminFieldSearch));
    });
    const fieldEntriesForAgent = (row: AdminActivityRow) => teamVisitEntries.filter((entry) => entry.agentId === row.id || (!entry.agentId && entry.agentName === row.name));
    const visibleTeamEntries = teamVisitEntries.filter((entry) => {
      const matchesAgent = adminEntryAgentFilter === 'all' || entry.agentId === adminEntryAgentFilter || (!entry.agentId && entry.agentName === adminEntryAgentFilter);
      const matchesType = adminEntryTypeFilter === 'all' || entry.type === adminEntryTypeFilter;
      return matchesAgent && matchesType;
    });
    const shownTeamEntries = showAllAdminEntries ? visibleTeamEntries : visibleTeamEntries.slice(0, 5);
    const selectedAdminEntry = selectedAdminEntryId ? teamVisitEntries.find((entry) => entry.id === selectedAdminEntryId) : null;
    const visibleCheckedInCount = visibleAgentActivityRows.filter((row) => row.attendance === 'checked in').length;
    const visibleMissingCount = visibleAgentActivityRows.filter((row) => row.status !== 'Ready').length;
    const visibleFollowUpCount = visibleAgentActivityRows.filter((row) => row.followUpsDue.length > 0).length;
    const selectedSeat = adminSeats.find((seat) => seat.id === selectedAdminSeatId) ?? adminSeats[0];
    const activeSeatCount = adminSeats.filter((seat) => seat.status === 'active').length;
    const invitedSeatCount = adminSeats.filter((seat) => seat.status === 'invited' || seat.status === 'expired').length;
    const inactiveSeatCount = adminSeats.filter((seat) => seat.status === 'inactive').length;
    const generateAdminReport = () => {
      const rangeLabel = adminPeriod === 'custom' ? `${adminReportFromDate} to ${adminReportToDate}` : period.label.toLowerCase();
      setScreenNotice({
        title: `${adminReportKindLabels[adminReportKind]} ready`,
        message: `${adminReportScopeLabels[adminReportScope]} generated for ${rangeLabel}. Download PDF will use this report type.`,
        tone: 'success',
      });
    };
    const downloadAdminPdf = async () => {
      if (!session) {
        setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before downloading the PDF.', tone: 'warning' });
        return;
      }
      try {
        const pdfUrl = await crystalBioFrontendApi.downloadAdminReportPdf(session, { fromDate: adminReportFromDate, toDate: adminReportToDate, kind: adminReportKind });
        const reportName = adminReportKind === 'attendance' ? 'attendance-report' : adminReportKind === 'visits' ? 'visit-report' : 'field-report';
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `crystalbio-${reportName}-${adminReportFromDate}-to-${adminReportToDate}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
        setScreenNotice({ title: 'PDF downloaded', message: `${adminReportKindLabels[adminReportKind]} download started.`, tone: 'success' });
      } catch (error) {
        rememberLaunchIssue('Report PDF download', error);
        setScreenNotice({ title: 'PDF download failed', message: error instanceof Error ? error.message : 'Could not download the report PDF.', tone: 'error' });
      }
    };
    const changePeriod = (nextPeriod: ReportPeriod) => {
      setAdminPeriod(nextPeriod);
      if (nextPeriod === 'today') {
        setAdminReportFromDate(todayInput());
        setAdminReportToDate(todayInput());
      }
      if (nextPeriod === 'week') {
        setAdminReportFromDate(daysAgoInput(6));
        setAdminReportToDate(todayInput());
      }
      if (nextPeriod === 'month') {
        setAdminReportFromDate(startOfCurrentMonthInput());
        setAdminReportToDate(todayInput());
      }
      setScreenNotice(null);
    };
    const renderAdminDateFilter = (label: string) => (
      <section className={`date-filter-card compact-date-filter-card ${adminPeriod === 'custom' ? 'date-filter-card-expanded' : ''}`} aria-label={`${label} period`}>
        <div className="date-filter-head compact-date-filter-head">
          <div><label>{label}</label><strong>{period.label}</strong></div>
          <select aria-label={`${label} preset`} value={adminPeriod} onChange={(event) => changePeriod(event.target.value as ReportPeriod)}>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Choose dates</option>
          </select>
        </div>
        {adminPeriod === 'custom' && (
          <div className="date-range-fields compact-date-range-fields">
            <label><span>From</span><input aria-label={`${label} from date`} type="date" value={adminReportFromDate} onChange={(event) => { setAdminReportFromDate(event.target.value); setAdminPeriod('custom'); }} /></label>
            <label><span>To</span><input aria-label={`${label} to date`} type="date" value={adminReportToDate} onChange={(event) => { setAdminReportToDate(event.target.value); setAdminPeriod('custom'); }} /></label>
          </div>
        )}
      </section>
    );
    const renderAdminEntryDetail = (backLabel: string, onBack: () => void) => selectedAdminEntry ? (
      <section className="admin-entry-detail-card" aria-label="Submitted form details">
        <button type="button" className="admin-detail-back" onClick={onBack}><ChevronLeft size={16} /> {backLabel}</button>
        <div className="admin-entry-detail-head">
          <span className={toneClass[selectedAdminEntry.tone]}>{selectedAdminEntry.type}</span>
          <strong>{displayCustomerName(selectedAdminEntry.customer)}</strong>
          <p>{selectedAdminEntry.agentName} • {formatVisitWhen(selectedAdminEntry)}</p>
          <small>Read-only view. Edit from the original field form only if correction is needed.</small>
        </div>
        <div className="admin-entry-detail-grid">
          {(selectedAdminEntry.detailRows?.length ? selectedAdminEntry.detailRows : [
            { label: 'Submitted by', value: selectedAdminEntry.agentName },
            { label: 'Status', value: selectedAdminEntry.status },
            { label: 'Next', value: selectedAdminEntry.next },
          ]).map((row) => (
            <div key={`${row.label}-${row.value}`}><span>{row.label}</span><strong>{row.value}</strong></div>
          ))}
        </div>
        <PhotoViewer payload={selectedAdminEntry.photoPayload} label={`${selectedAdminEntry.customer} ${selectedAdminEntry.type}`} />
      </section>
    ) : null;

    const showOverview = adminTab === 'overview';
    const showFieldEntry = adminTab === 'fieldEntry';
    const showAgents = adminTab === 'agents';
    const showApprovals = adminTab === 'overview' || adminTab === 'approvals';
    const showReports = adminTab === 'adminReports';
    const showMonitoring = adminTab === 'monitoring';
    const showProfiles = adminTab === 'profiles';

    return (
      <ScreenPanel title={adminTab === 'overview' ? 'Admin overview' : adminTab === 'fieldEntry' ? 'Field entry' : adminTab === 'agents' ? 'Agents' : adminTab === 'approvals' ? 'Approvals' : adminTab === 'monitoring' ? 'Live monitor' : adminTab === 'profiles' ? 'Profiles' : 'Admin reports'} subtitle="">
        {(showOverview || showReports) && (
          <>
            {showOverview && (
              <>
                <section className="admin-hero-card">
                  <div>
                    <p>Today field status</p>
                    <strong>{overviewPeriod.active}</strong>
                    <span>{overviewPeriod.summary}</span>
                  </div>
                  <span className="admin-hero-icon"><UsersRound size={22} /></span>
                </section>
                <div className="admin-metric-grid">
                  {adminOverviewMetrics.map((metric) => (
                    <button key={metric.key} type="button" className={expandedAdminMetric === metric.key ? 'metric-card admin-metric-card admin-metric-card-open' : 'metric-card admin-metric-card'} aria-expanded={expandedAdminMetric === metric.key} onClick={() => openAdminMetric(metric.key)}>
                      <strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.hint}</small><em>{expandedAdminMetric === metric.key ? 'Hide' : metric.action}</em>
                    </button>
                  ))}
                </div>
                {expandedAdminMetric && (
                  <section className="admin-metric-expanded-card" aria-label={`${adminOverviewMetrics.find((metric) => metric.key === expandedAdminMetric)?.label ?? 'Overview'} details`}>
                    <div className="admin-report-heading"><label>{adminOverviewMetrics.find((metric) => metric.key === expandedAdminMetric)?.label}</label><span>{overviewMetricDetails[expandedAdminMetric].length}</span></div>
                    <div className="admin-metric-expanded-list">
                      {overviewMetricDetails[expandedAdminMetric].slice(0, 4).map((detail) => <span key={detail}>{detail}</span>)}
                    </div>
                    {expandedAdminMetric === 'visits' && overviewVisibleEntries.length > 0 && <button type="button" className="secondary-action admin-view-all-entries" onClick={() => openAdminTab('agents')}>Open submitted work</button>}
                    {expandedAdminMetric === 'leave' && adminLeaveRequests.some((request) => request.status === 'pending') && <button type="button" className="secondary-action admin-view-all-entries" onClick={() => openAdminTab('approvals')}>Open approvals</button>}
                    {expandedAdminMetric === 'followUps' && followUpCount > 0 && <button type="button" className="secondary-action admin-view-all-entries" onClick={() => openAdminTab('agents')}>Open agents</button>}
                  </section>
                )}
                <section className="admin-office-actions-card admin-today-priority-card">
                  <div className="admin-report-heading"><label>Latest submitted work</label><span>{teamVisitEntries.length} forms</span></div>
                  <div className="admin-priority-list">
                    {overviewVisibleEntries.length ? overviewVisibleEntries.map((entry) => (
                      <button key={`overview-entry-${entry.id}`} type="button" className="admin-priority-row admin-click-row" onClick={() => { setSelectedAdminEntryId(entry.id); setSelectedAdminEntryReturnTab('agents'); setAdminTab('agents'); }}>
                        <span className={toneClass[entry.tone]}>{entry.type}</span>
                        <div className="admin-priority-main"><strong>{displayCustomerName(entry.customer)}</strong><small>{entry.agentName} • {formatVisitWhen(entry)} • {entry.status}</small></div>
                        <em>Open</em>
                      </button>
                    )) : (
                      <div className="empty-state">Submitted Sales and Service forms will appear here.</div>
                    )}
                  </div>
                </section>
                {adminTodayPriorities.length > 0 && (
                  <section className="admin-office-actions-card admin-today-priority-card">
                    <div className="admin-report-heading"><label>Needs office action</label><span>{adminTodayPriorities.length}</span></div>
                    <div className="admin-priority-list">
                      {adminTodayPriorities.map((item) => (
                        <button key={item.title} type="button" className="admin-priority-row admin-click-row" onClick={() => openTodayPriority(item)}>
                          <span className="chip chip-warning">{item.label}</span>
                          <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                          <em>Open</em>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {showReports && renderAdminDateFilter('Report date range')}
          </>
        )}

        {showMonitoring && (
          <>
            <section className="admin-monitor-hero-card">
              <div>
                <p>Bloom live view</p>
                <strong>{seriousClientErrors.length ? 'Needs attention' : 'All clear now'}</strong>
                <span>{lastMonitorEvent ? `Last activity: ${formatMonitorWhen(lastMonitorEvent.createdAt)}` : 'No login or error activity recorded yet.'}</span>
              </div>
              <span className={seriousClientErrors.length ? 'admin-monitor-icon admin-monitor-icon-warn' : 'admin-monitor-icon'}>
                {seriousClientErrors.length ? <AlertTriangle size={22} /> : <Activity size={22} />}
              </span>
            </section>
            <div className="admin-monitor-grid">
              {monitoringCards.map((card) => (
                <article key={card.label} className={`admin-monitor-card admin-monitor-card-${card.tone}`}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                  <small>{card.hint}</small>
                </article>
              ))}
            </div>
            <button type="button" className="secondary-action admin-monitor-refresh" disabled={isAdminMonitorRefreshing} onClick={() => void refreshMonitoring()}>
              {isAdminMonitorRefreshing ? 'Refreshing…' : 'Refresh monitoring'}
            </button>
            <section className="admin-monitor-list-card" aria-label="Logged-in accounts">
              <div className="admin-report-heading"><label>Logged-in accounts</label><span>{successfulLoginEvents.length}</span></div>
              <div className="admin-monitor-list">
                {successfulLoginEvents.length ? successfulLoginEvents.slice(0, 12).map((event) => (
                  <article key={event.id} className="admin-monitor-row">
                    <span className="chip chip-soft">Logged in</span>
                    <div><strong>{event.agentName || event.email || 'Account'}</strong><p>{event.email || roleLabel(event.role)} • {formatMonitorWhen(event.createdAt)}</p><small>{roleLabel(event.role)}</small></div>
                  </article>
                )) : <div className="empty-state">No successful logins recorded yet.</div>}
              </div>
            </section>
            <section className="admin-monitor-list-card" aria-label="Failed login attempts">
              <div className="admin-report-heading"><label>Failed login attempts</label><span>{failedLoginEvents.length}</span></div>
              <div className="admin-monitor-list">
                {failedLoginEvents.length ? failedLoginEvents.slice(0, 8).map((event) => (
                  <article key={event.id} className="admin-monitor-row admin-monitor-row-warn">
                    <span className="chip chip-warning">Check</span>
                    <div><strong>{event.email || 'Unknown email'}</strong><p>{formatMonitorWhen(event.createdAt)}</p><small>{event.message}</small></div>
                  </article>
                )) : <div className="empty-state">No failed login attempts recorded.</div>}
              </div>
            </section>
            <section className="admin-monitor-list-card" aria-label="User-facing app errors">
              <div className="admin-report-heading"><label>App errors</label><span>{adminClientErrors.length}</span></div>
              <div className="admin-monitor-list">
                {adminClientErrors.length ? adminClientErrors.slice(0, 10).map((event) => (
                  <article key={event.id} className={event.severity === 'critical' || event.severity === 'high' ? 'admin-monitor-row admin-monitor-row-warn' : 'admin-monitor-row'}>
                    <span className={event.severity === 'critical' || event.severity === 'high' ? 'chip chip-warning' : 'chip chip-info'}>{event.severity}</span>
                    <div><strong>{event.journey || 'App issue'}</strong><p>{event.agentName || roleLabel(event.role)} • {formatMonitorWhen(event.createdAt)}</p><small>{event.message}{event.status ? ` • ${event.status}` : ''}</small></div>
                  </article>
                )) : <div className="empty-state">No user-facing errors recorded.</div>}
              </div>
            </section>
          </>
        )}

        {showFieldEntry && (
          <>
            <section className="admin-action-card admin-field-entry-card">
              <label>Field entry</label>
              <strong>Submit your own field update</strong>
              <p>Sales and Service entries saved here stay under this admin login.</p>
              <div className="visit-action-grid admin-field-entry-grid">
                <button type="button" className="visit-action-card" onClick={() => goToScreen('sales', { newSalesVisit: true })}><span className="visit-action-icon"><Plus size={19} /></span><strong>Sales entry</strong><small>Customer visit, quote, follow-up</small></button>
                <button type="button" className="visit-action-card" onClick={() => goToScreen('service', { newServiceVisit: true })}><span className="visit-action-icon service-icon"><ClipboardList size={18} /></span><strong>Service entry</strong><small>Machine issue, parts, closure</small></button>
              </div>
            </section>
            <section className="admin-report-list-card admin-field-entry-recent" aria-label="Saved field entries">
              <div className="admin-report-heading"><label>Field entries</label><span>{visibleAdminFieldEntries.length} shown</span></div>
              <div className="admin-field-entry-filter" role="group" aria-label="Field entry list filter">
                <button type="button" className={adminFieldEntryScope === 'mine' ? 'admin-field-entry-filter-active' : ''} onClick={() => setAdminFieldEntryScope('mine')}>My entries</button>
                <button type="button" className={adminFieldEntryScope === 'all' ? 'admin-field-entry-filter-active' : ''} onClick={() => setAdminFieldEntryScope('all')}>All entries</button>
              </div>
              <label className="search-card visit-search-card admin-field-entry-search">
                <Search size={16} />
                <input aria-label="Search field entries" value={adminFieldEntrySearch} onChange={(event) => setAdminFieldEntrySearch(event.target.value)} placeholder="Search customer or agent" />
              </label>
              {visibleAdminFieldEntries.length ? visibleAdminFieldEntries.slice(0, 10).map((entry) => (
                <article key={`admin-field-entry-${entry.id}`} className="admin-field-entry-item-card">
                  <div className="admin-field-entry-item-main">
                    <strong>{displayCustomerName(entry.customer)}</strong>
                    <p>{entry.agentName}</p>
                    <small>{entry.type} • {formatVisitWhen(entry)} • {entry.status}</small>
                  </div>
                  <span className={toneClass[entry.tone]}>{entry.type}</span>
                  <PhotoViewer payload={entry.photoPayload} label={`${displayCustomerName(entry.customer)} ${entry.type}`} />
                </article>
              )) : (
                <div className="empty-state">No matching entries found.</div>
              )}
            </section>
          </>
        )}

        {showApprovals && (
          activeApproval ? (
            <section className="admin-approval-detail-card">
              <button type="button" className="admin-detail-back" onClick={() => setSelectedAdminApproval(null)}>
                <ChevronLeft size={16} /> Back to approvals
              </button>
              <span className={activeApproval.chipClass}>{activeApproval.label}</span>
              <div className="admin-approval-detail-heading">
                <h4>{activeApproval.title}</h4>
                <strong>{activeApproval.agent}</strong>
                <p>{activeApproval.summary}</p>
              </div>
              <div className="admin-approval-detail-body">
                <span>{activeApproval.meta}</span>
                <p>{activeApproval.detail}</p>
                <small>{activeApproval.actionNote}</small>
              </div>
              <div className="admin-approval-actions">
                <button type="button" className="secondary-action" disabled={activeApproval.status !== 'pending'} onClick={() => void reviewAdminLeave('rejected')}>Reject</button>
                <button type="button" className="primary-action" disabled={activeApproval.status !== 'pending'} onClick={() => void reviewAdminLeave('approved')}>Approve</button>
              </div>
            </section>
          ) : (
            <>
              <section className="admin-action-card admin-approval-list-card admin-leave-decision-card">
                <div className="admin-report-heading admin-leave-heading"><label>Leave approvals</label><span>{pendingApprovalRequests.length ? `${pendingApprovalRequests.length} pending` : 'Clear'}</span></div>
                <div className="admin-leave-summary-line">
                  <strong>{pendingApprovalRequests.length}</strong>
                  <span>{pendingApprovalRequests.length ? 'Decision needed today' : 'No leave decisions pending'}</span>
                </div>
                {approvalRequests.length ? approvalRequests.map((request) => (
                  <button key={request.id} type="button" className="admin-alert-row admin-click-row admin-leave-row" onClick={() => openApproval(request.id)}>
                    <span className={request.status === 'pending' ? 'chip chip-warning' : request.status === 'approved' ? 'chip chip-soft' : 'chip chip-info'}>{request.status === 'pending' ? 'Review' : request.status}</span>
                    <div><strong>{request.agentName}</strong><p>{formatShortDate(request.fromDate)} to {formatShortDate(request.toDate)} • {request.reason}</p><small>{request.status === 'pending' ? 'Open to approve or reject.' : 'Open to review recorded status.'}</small></div>
                  </button>
                )) : (
                  <div className="admin-alert-row"><span className="chip chip-soft">Clear</span><div><strong>No leave approvals pending</strong><p>New agent requests will appear here from the backend.</p></div></div>
                )}
              </section>
            </>
          )
        )}

        {showAgents && (
          <>
            {adminAgentsView === 'list' && (
              <>
                {selectedAdminEntry && selectedAdminEntryReturnTab === 'agents' ? (
                  renderAdminEntryDetail('Back to entries', () => setSelectedAdminEntryId(null))
                ) : (
                  <>
                    <section className="admin-agent-snapshot-card admin-agent-snapshot-top" aria-label="Team summary">
                      <div><strong>{checkedInCount}</strong><span>Checked in</span></div>
                      <div><strong>{needsReviewCount}</strong><span>Need check</span></div>
                      <div><strong>{followUpCount}</strong><span>Follow-ups</span></div>
                    </section>
                    <section className="admin-agents-compact-head">
                      <div>
                        <p>Submitted entries</p>
                        <span>Review submitted Sales and Service forms. Use filters only when needed.</span>
                      </div>
                    </section>
                    <section className="admin-entry-filter-card" aria-label="Submitted entry filters">
                      <label><span>Agent</span><select aria-label="Entry agent filter" value={adminEntryAgentFilter} onChange={(event) => { setAdminEntryAgentFilter(event.target.value); setShowAllAdminEntries(false); }}>
                        <option value="all">All entries</option>
                        {adminRows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                      </select></label>
                      <label><span>Type</span><select aria-label="Entry type filter" value={adminEntryTypeFilter} onChange={(event) => { setAdminEntryTypeFilter(event.target.value as AdminVisitTypeFilter); setShowAllAdminEntries(false); }}>
                        <option value="all">All</option>
                        <option value="Sales">Sales</option>
                        <option value="Service">Service</option>
                      </select></label>
                    </section>
                    <section className="admin-report-list-card admin-agent-activity-list admin-entry-list-card">
                      <div className="admin-report-heading">
                        <label>{showAllAdminEntries ? 'All submitted entries' : 'Recent 5 entries'}</label>
                        <span>{visibleTeamEntries.length} total</span>
                      </div>
                      {shownTeamEntries.length ? shownTeamEntries.map((entry) => (
                        <button key={entry.id} type="button" className="admin-field-entry-item-card admin-agent-entry-item-card admin-click-row" onClick={() => { setSelectedAdminEntryId(entry.id); setSelectedAdminEntryReturnTab('agents'); }}>
                          <div className="admin-field-entry-item-main">
                            <strong>{displayCustomerName(entry.customer)}</strong>
                            <p>{entry.agentName}</p>
                            <small>{entry.type} • {formatVisitWhen(entry)} • {entry.status}</small>
                          </div>
                          <span className={toneClass[entry.tone]}>View details</span>
                        </button>
                      )) : (
                        <div className="empty-state">No submitted entries match this filter yet.</div>
                      )}
                      {visibleTeamEntries.length > 5 && (
                        <button type="button" className="secondary-action admin-view-all-entries" onClick={() => setShowAllAdminEntries((current) => !current)}>
                          {showAllAdminEntries ? 'Show recent 5' : 'View all entries'}
                        </button>
                      )}
                    </section>
                  </>
                )}
              </>
            )}


            {adminAgentsView === 'profile' && selectedSeat && (
              <section className="admin-seat-profile-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to profiles</button>
                <div className="admin-seat-profile-head">
                  <span className="profile-avatar"><UserRound size={22} /></span>
                  <div><p>{roleTextForAdminSeat(selectedSeat.role)}</p><strong>{selectedSeat.name}</strong><span>{selectedSeat.employeeId} • {selectedSeat.territory}</span></div>
                </div>
                <div className="profile-info-card admin-seat-info-grid">
                  <div><span>Email</span><strong>{selectedSeat.email}</strong></div>
                  <div><span>Mobile</span><strong>{selectedSeat.mobile}</strong></div>
                  <div><span>Status</span><strong>{statusTextForSeat(selectedSeat.status)}</strong></div>
                  <div><span>Last active</span><strong>{selectedSeat.lastActive}</strong></div>
                </div>
                <div className="admin-seat-actions">
                  <button type="button" className="secondary-action" onClick={() => void handleResetSeatInvite(selectedSeat)}>Create setup link</button>
                  <button type="button" className="secondary-action" onClick={() => void handleResetSeatInvite(selectedSeat)}>Reset password link</button>
                  <button type="button" className="secondary-action logout-action" disabled={selectedSeat.status === 'inactive'} onClick={() => void handleDeactivateSeat(selectedSeat)}>Deactivate</button>
                </div>
              </section>
            )}

            {adminAgentsView === 'invite' && selectedSeat && (
              <section className="admin-invite-preview-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to profiles</button>
                <span className="chip chip-soft">Setup link ready</span>
                <div className="admin-invite-mail">
                  <p>For: {selectedSeat.email}</p>
                  <strong>Set up CrystalBio Field App account</strong>
                  <span>For this pilot, setup/reset details are shared manually. Copy this link/message only when a reset is needed.</span>
                  {selectedSeat.setupLink && <input aria-label="Setup link" readOnly value={selectedSeat.setupLink} />}
                  <button type="button" className="primary-action" onClick={() => setScreenNotice({ title: 'Setup message ready', message: `${selectedSeat.name}'s setup link is ready to share.`, tone: 'info' })}>Copy setup message</button>
                </div>
                <div className="admin-seat-meta-row"><span>Manual share for now</span><span>No public signup</span></div>
              </section>
            )}
          </>
        )}

        {showProfiles && (
          <>
            {adminAgentsView === 'add' ? (
              <section className="admin-seat-form-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to profiles</button>
                <div className="admin-seat-form-heading"><label>New profile</label><strong>Add pilot profile</strong><span>Pilot users should normally be pre-created with unique passwords. Use this only if another employee must be added.</span></div>
                <label className="field-card"><span>Agent name</span><input aria-label="New agent name" value={newSeatName} onChange={(event) => setNewSeatName(event.target.value)} /></label>
                <label className="field-card"><span>Employee ID</span><input aria-label="New employee ID" value={newSeatEmployeeId} onChange={(event) => setNewSeatEmployeeId(event.target.value)} /></label>
                <label className="field-card"><span>Registered email ID</span><input aria-label="New agent email" inputMode="email" value={newSeatEmail} onChange={(event) => setNewSeatEmail(event.target.value)} /></label>
                <label className="field-card"><span>Mobile number</span><input aria-label="New agent mobile" inputMode="tel" value={newSeatMobile} onChange={(event) => setNewSeatMobile(event.target.value)} /></label>
                <div className="inline-field-grid">
                  <label className="field-card"><span>Role</span><select aria-label="New agent role" value={newSeatRole} onChange={(event) => setNewSeatRole(event.target.value as AdminSeat['role'])}><option value="sales">Sales agent</option><option value="service">Service agent</option><option value="admin">Admin</option></select></label>
                  <label className="field-card"><span>Territory</span><input aria-label="New agent territory" value={newSeatTerritory} onChange={(event) => setNewSeatTerritory(event.target.value)} /></label>
                </div>
                <button type="button" className="primary-action" onClick={handleCreateSeatInvite}>Create pilot profile</button>
              </section>
            ) : (
              <>
                <section className="profile-hero-card admin-profile-hero-card">
                  <span className="profile-avatar"><UserRound size={25} /></span>
                  <div>
                    <p>Admin profile</p>
                    <strong>{session?.role === 'admin' ? session.agentName : 'CrystalBio Admin'}</strong>
                    <span>{session?.role === 'admin' ? session.email : 'admin@crystalbio.in'} • Owner access</span>
                    <small className="profile-access-note">Private access • Public signup off • Users pre-loaded for pilot</small>
                  </div>
                </section>
                <section className="admin-profile-access-summary" aria-label="Profile access summary">
                  <div><strong>{activeSeatCount}</strong><span>Active</span></div>
                  <div><strong>{invitedSeatCount}</strong><span>Invited</span></div>
                  <div><strong>{inactiveSeatCount}</strong><span>Inactive</span></div>
                </section>
                <button type="button" className="secondary-action logout-action" onClick={handleLogout}>Logout</button>
                <section className="admin-report-list-card admin-agent-activity-list">
                  <div className="admin-report-heading profile-list-heading"><label>Team profiles</label><button type="button" className="profile-add-button" disabled onClick={() => setScreenNotice({ title: 'Pilot users pre-loaded', message: 'New pilot users are created outside the frontend with unique passwords for each registered email.', tone: 'info' })}><Plus size={16} /> Pilot users pre-loaded</button></div>
                  {adminSeats.map((seat) => (
                    <button key={seat.id} type="button" className="admin-report-row admin-click-row" onClick={() => { setSelectedAdminSeatId(seat.id); setAdminAgentsView('profile'); }}>
                      <div className="admin-report-row-main"><strong>{seat.name}</strong><p>{roleTextForAdminSeat(seat.role)} • {seat.employeeId}</p><small>{seat.email}</small></div>
                      <span className={seat.status === 'active' ? 'chip chip-soft' : seat.status === 'invited' ? 'chip chip-info' : 'chip chip-warning'}>{statusTextForSeat(seat.status)}</span>
                    </button>
                  ))}
                </section>
              </>
            )}
          </>
        )}

        {showReports && (
          <>
            {adminTab === 'adminReports' && selectedAdminEntry && selectedAdminEntryReturnTab === 'adminReports' ? (
              renderAdminEntryDetail('Back to reports', () => setSelectedAdminEntryId(null))
            ) : adminTab === 'adminReports' && (
              <section className="admin-report-list-card admin-report-setup-card">
                <div className="admin-report-scope-row">
                  <label>Report type</label>
                  <select aria-label="Admin report type" value={adminReportKind} onChange={(event) => setAdminReportKind(event.target.value as AdminReportKind)}>
                    <option value="attendance">Attendance report</option>
                    <option value="visits">Visit report</option>
                    <option value="combined">Combined report</option>
                  </select>
                </div>
                <div className="admin-report-scope-row">
                  <label>Report for</label>
                  <select aria-label="Admin report scope" value={adminReportScope} onChange={(event) => { setAdminReportScope(event.target.value as AdminReportScope); setExpandedAdminReportId(null); }}>
                    <option value="office">Whole office</option>
                    <option value="sales">All sales agents</option>
                    <option value="service">All service agents</option>

                  </select>
                </div>
                <button type="button" className="primary-action single-report-generate" onClick={generateAdminReport}>Generate report</button>
                <button type="button" className="secondary-action single-report-generate" onClick={downloadAdminPdf}>Download PDF</button>

                <section className="admin-report-summary-card admin-owner-report-summary">
                  <div className="admin-report-heading"><label>Today’s report</label><span>{period.label}</span></div>
                  <div className="admin-report-mini-metrics">
                    <div><strong>{reportVisitCount}</strong><span>Visits</span></div>
                    <div><strong>{period.followUps}</strong><span>Follow-ups</span></div>
                    <div><strong>{adminOfficeActions.length}</strong><span>Office action</span></div>
                    <div><strong>{checkedInCount}</strong><span>Active</span></div>
                  </div>
                  <div className="admin-report-chart-block compact-report-chart" aria-label="Simple report charts">
                    <div className="admin-chart-row"><span>Sales</span><div><i style={{ width: chartWidth(reportSalesVisits) }} /></div><strong>{reportSalesVisits}</strong></div>
                    <div className="admin-chart-row"><span>Service</span><div><i className="service-bar" style={{ width: chartWidth(reportServiceVisits) }} /></div><strong>{reportServiceVisits}</strong></div>
                  </div>
                </section>

                {adminOfficeActions.length > 0 && (
                  <section className="admin-office-actions-card">
                    <div className="admin-report-heading"><label>Office action</label><span>{adminOfficeActions.length}</span></div>
                    {adminOfficeActions.slice(0, 4).map((action) => (
                      <div key={`${action.title}-${action.detail}`} className="admin-office-action-row">
                        <span className="chip chip-warning">Action</span>
                        <div><strong>{action.title}</strong><small>{action.detail}</small></div>
                      </div>
                    ))}
                  </section>
                )}

                <section className="admin-office-actions-card admin-attendance-check-card">
                  <div className="admin-report-heading"><label>Attendance summary</label><span>{reportReviewAgents ? `${reportReviewAgents} need check` : 'Clear'}</span></div>
                  <div className="admin-report-empty-note"><strong>{reportReadyAgents} ready • {reportReviewAgents} need check</strong><span>{checkedInCount} checked in today</span></div>
                </section>
              </section>
            )}
          </>
        )}
      </ScreenPanel>
    );
  };

  const renderScreen = () => {
    if (screen === 'login') return renderLogin();
    if (screen === 'visits') return renderVisits();
    if (screen === 'sales') return renderSales();
    if (screen === 'service') return renderService();
    if (screen === 'checkin') return renderCheckIn();
    if (screen === 'attendance') return renderAttendance();
    if (screen === 'leave') return renderLeave();
    if (screen === 'reports') return renderReports();
    if (screen === 'profile') return renderProfile();
    if (screen === 'admin') return renderAdmin();
    return renderHome();
  };

  const activeNotice: ToastNotice | null = screenNotice
    ? typeof screenNotice === 'string'
      ? { title: 'Notice', message: screenNotice, tone: 'info' }
      : screenNotice
    : null;

  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">CrystalBio Field Hub</p>
        <h1>{screen === 'login' ? 'Login screen' : screen === 'admin' ? (adminTab === 'adminReports' ? 'Admin reports screen' : adminTab === 'monitoring' ? 'Admin monitoring screen' : adminTab === 'fieldEntry' ? 'Admin field entry screen' : adminTab === 'approvals' ? 'Admin approvals screen' : adminTab === 'agents' ? 'Admin agents screen' : adminTab === 'profiles' ? 'Admin profiles screen' : 'Admin overview screen') : screen === 'profile' ? 'Agent profile screen' : 'Agent home screen'}</h1>
        <p>{screen === 'login' ? 'Role-based entry for field agents and admin users.' : screen === 'admin' ? 'Owner view for team attendance, leave, and field reports.' : 'Mobile workspace for field attendance, visits, leave, and reports.'}</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <div className="statusbar"><span>9:41</span><span>●●●</span></div>

          <header className="phone-header">
            <div>
              {screen === 'admin' && adminTab !== 'overview' && <button type="button" className="back-button" onClick={() => openAdminTab('overview')}><ChevronLeft size={17} /> Overview</button>}
              {screen !== 'home' && screen !== 'login' && screen !== 'admin' && (
                <button
                  type="button"
                  className="back-button"
                  onClick={isAdminSignedIn && (screen === 'sales' || screen === 'service') ? returnToAdminFieldEntry : () => goToScreen('home')}
                >
                  <ChevronLeft size={17} /> {isAdminSignedIn && (screen === 'sales' || screen === 'service') ? 'Field entry' : 'Home'}
                </button>
              )}
              <p className="muted">{screen === 'login' ? 'Welcome' : timeGreeting()}</p>
              <h2>{screen === 'login' ? 'CrystalBio' : screen === 'admin' ? (session?.role === 'admin' ? session.agentName : 'Admin') : session?.agentName ?? 'Field agent'}</h2>
            </div>
            {screen === 'admin' ? (
              <div className="header-action-cluster">
                <button type="button" className="avatar avatar-button" aria-label={adminTab === 'profiles' ? 'Admin profile selected' : 'Open admin profile'} onClick={() => openAdminTab('profiles')}><UsersRound size={21} /></button>
              </div>
            ) : (
              <button type="button" className="avatar avatar-button" aria-label={screen === 'profile' ? 'Profile selected' : 'Open profile'} disabled={screen === 'login'} onClick={() => goToScreen('profile')}><UserRound size={21} /></button>
            )}
          </header>

          {renderScreen()}

          {activeNotice && (
            <div key={`${activeNotice.title}-${activeNotice.message}`} className={`save-toast save-toast-${activeNotice.tone ?? 'success'}`} role="status">
              <span className="save-toast-accent" aria-hidden="true" />
              <span className="save-toast-icon"><CheckCircle2 size={18} /></span>
              <span className="save-toast-copy"><strong>{activeNotice.title}</strong><span>{activeNotice.message}</span></span>
              <button type="button" className="save-toast-close" aria-label="Close message" onClick={() => setScreenNotice(null)}><X size={16} /></button>
            </div>
          )}

          {screen !== 'login' && <nav className={screen === 'admin' ? 'bottom-nav admin-bottom-nav' : 'bottom-nav'} aria-label={screen === 'admin' ? 'Admin navigation' : 'Agent navigation'}>
            {screen === 'admin' ? (
              [
                { label: 'Overview', tab: 'overview' as AdminTab, icon: Home },
                { label: 'Field entry', tab: 'fieldEntry' as AdminTab, icon: ClipboardList },
                { label: 'Agents', tab: 'agents' as AdminTab, icon: UsersRound },
                { label: 'Approvals', tab: 'approvals' as AdminTab, icon: CalendarCheck },
                { label: 'Reports', tab: 'adminReports' as AdminTab, icon: FileText },
                { label: 'Monitor', tab: 'monitoring' as AdminTab, icon: Activity },
              ].map((item) => {
                const Icon = item.icon;
                const selected = adminTab === item.tab;
                return (
                  <button key={item.label} type="button" className={selected ? 'nav-item nav-item-selected' : 'nav-item'} aria-label={selected ? `${item.label} selected` : item.label} onClick={() => openAdminTab(item.tab)}>
                    <Icon size={17} />
                    {item.label}
                  </button>
                );
              })
            ) : navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.screen === screen || (screen === 'sales' && item.screen === 'visits') || (screen === 'service' && item.screen === 'visits') || ((screen === 'leave' || screen === 'checkin') && item.screen === 'attendance');
              return (
                <button
                  key={item.label}
                  type="button"
                  className={selected ? 'nav-item nav-item-selected' : 'nav-item'}
                  aria-label={selected ? `${item.label} selected` : item.label}
                  onClick={() => goToScreen(item.screen)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>}
        </div>
      </section>
    </main>
  );
}

function ScreenPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="panel screen-panel">
      <div className="screen-heading">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default App;
