import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, ChevronLeft, ClipboardList, Clock3, FileText, Home, MapPin, Pencil, Plus, Search, UserRound, UsersRound, X } from 'lucide-react';
import { crystalBioFrontendApi, type FrontendAdminReport, type FrontendAdminSeatInvite, type FrontendAttendance, type FrontendClientErrorEvent, type FrontendGps, type FrontendLeaveRequest, type FrontendLoginActivityEvent, type FrontendLoginInput, type FrontendRecentVisitEntry, type FrontendVisitDetailRow, type FrontendSalesSaveResult, type FrontendSalesNextAction, type FrontendServiceSaveResult, type FrontendServiceNextAction, type FrontendServiceType, type FrontendSession } from './crystalBioFrontendApi';

type AppScreen = 'login' | 'home' | 'visits' | 'sales' | 'service' | 'checkin' | 'attendance' | 'leave' | 'reports' | 'profile' | 'admin';
type ReportPeriod = 'today' | 'week' | 'month' | 'custom';
type AgentReportKind = 'attendance' | 'visits' | 'combined';
type AdminReportKind = 'attendance' | 'visits' | 'combined';
type AdminAgentFilter = 'all' | 'sales' | 'service' | 'office' | 'checkedIn' | 'notCheckedIn' | 'checkedOut';
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
  attendanceCheckInTime?: string;
  attendanceCheckOutTime?: string;
  attendanceSessionCount: number;
  attendanceAutoCheckedOut?: boolean;
  attendanceWorkTypes?: string[];
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
type PhotoPreview = { dataUrl: string; fileName: string; note?: string; label: string };

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
const appBuildVersion = '20260624031243';
const appVersionReloadKey = 'crystalbio.version-reload.v1';
const isPublicMonitorPath = () => typeof window !== 'undefined' && window.location.pathname.includes('periwinkle-live-monitor');

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
  if (isPublicMonitorPath()) return 'admin';
  const requestedScreen = new URLSearchParams(window.location.search).get('screen') as AppScreen | null;
  if (requestedScreen && screenOptions.includes(requestedScreen)) return requestedScreen;
  const storedScreen = window.localStorage.getItem(screenStorageKey) as AppScreen | null;
  if (storedSession && storedScreen && screenOptions.includes(storedScreen) && storedScreen !== 'login') return storedScreen;
  if (storedSession) return storedSession.role === 'admin' ? 'admin' : 'home';
  return 'login';
};

const getInitialAdminTab = (): AdminTab => {
  if (typeof window === 'undefined') return 'overview';
  if (isPublicMonitorPath()) return 'monitoring';
  const requestedTab = new URLSearchParams(window.location.search).get('adminTab') as AdminTab | null;
  return requestedTab && ['overview', 'fieldEntry', 'agents', 'approvals', 'adminReports', 'monitoring', 'profiles'].includes(requestedTab) ? requestedTab : 'overview';
};

const getInitialAdminApproval = (): AdminApprovalId | null => {
  if (typeof window === 'undefined') return null;
  const requestedApproval = new URLSearchParams(window.location.search).get('approval') as AdminApprovalId | null;
  return requestedApproval || null;
};

const istTimeZone = 'Asia/Kolkata';

const formatShortDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (year && month && day) return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: istTimeZone }).format(date);
};

const formatDateToken = (value: string) => formatShortDate(value).replace(/\//g, '');

const normalizeDateInputValue = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slashDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashDate) return `${slashDate[3]}-${slashDate[2]}-${slashDate[1]}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateInput(parsed);
};

const isDateInRange = (value: string | undefined, fromDate: string, toDate: string) => {
  const normalized = normalizeDateInputValue(value);
  if (!normalized) return false;
  return normalized >= normalizeDateInputValue(fromDate) && normalized <= normalizeDateInputValue(toDate);
};

const formatMonitorWhen = (value?: string) => {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: istTimeZone }).format(date).replace(',', '');
};

const roleLabel = (role?: FrontendSession['role']) => {
  if (role === 'admin') return 'Admin';
  if (role === 'sales') return 'Sales';
  if (role === 'service') return 'Service';
  if (role === 'both') return 'Sales + service';
  return 'User';
};

const formatAttendanceTime = (value?: string) => {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: istTimeZone }).format(date);
};

const formatDateInput = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: istTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
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

const startOfCurrentMonthInput = () => {
  const today = formatDateInput(new Date());
  const [year, month] = today.split('-');
  return `${year}-${month}-01`;
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

const matchesAdminAgentFilter = (row: Pick<AdminActivityRow, 'roleKey' | 'salesVisitCount' | 'serviceVisitCount' | 'attendance' | 'attendanceWorkTypes'>, filter: AdminAgentFilter) => {
  if (filter === 'all') return true;
  if (filter === 'checkedIn') return row.attendance === 'checked in';
  if (filter === 'notCheckedIn') return row.attendance === 'not checked in';
  if (filter === 'checkedOut') return row.attendance === 'checked out';
  if (filter === 'office') return row.attendanceWorkTypes?.includes('In office') ?? false;
  if (filter === 'sales') return row.roleKey === 'sales' || row.roleKey === 'both';
  if (filter === 'service') return row.roleKey === 'service' || row.roleKey === 'both';
  return true;
};
function App() {
  const isPublicMonitorPage = isPublicMonitorPath();
  const initialStoredSession = readStoredSession();
  const initialScreen = getInitialScreen(initialStoredSession);
  const hasConfiguredBackend = crystalBioFrontendApi.isBackendConfigured();
  const mustValidateStoredSession = Boolean(hasConfiguredBackend && initialStoredSession && !isPublicMonitorPage);
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (isPublicMonitorPage) return 'admin';
    if (hasConfiguredBackend && !initialStoredSession) return 'login';
    return hasConfiguredBackend && initialScreen === 'admin' && initialStoredSession?.role !== 'admin' ? 'login' : initialScreen;
  });
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(() => initialStoredSession?.role === 'admin' || (!hasConfiguredBackend && initialScreen === 'admin'));
  const [session, setSession] = useState<FrontendSession | null>(() => initialStoredSession);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [currentGps, setCurrentGps] = useState<FrontendGps | null>(null);
  const [currentGpsCapturedAt, setCurrentGpsCapturedAt] = useState<string | null>(null);
  const [isLocationCapturing, setIsLocationCapturing] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Add location before saving.');
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
  const [adminEntryDetailCache, setAdminEntryDetailCache] = useState<Record<string, FrontendRecentVisitEntry>>({});
  const [loadingAdminEntryDetailId, setLoadingAdminEntryDetailId] = useState<string | null>(null);
  const [showAllAdminEntries, setShowAllAdminEntries] = useState(false);
  const [showAdminTeamStatus, setShowAdminTeamStatus] = useState(false);
  const [expandedAdminMetric, setExpandedAdminMetric] = useState<AdminOverviewMetric | null>(null);
  const [adminEntryAgentFilter, setAdminEntryAgentFilter] = useState('all');
  const [adminEntryTypeFilter, setAdminEntryTypeFilter] = useState<AdminVisitTypeFilter>('all');
  const [adminFieldEntryScope, setAdminFieldEntryScope] = useState<AdminFieldEntryScope>('mine');
  const [adminFieldEntryTypeFilter, setAdminFieldEntryTypeFilter] = useState<AdminVisitTypeFilter>('all');
  const [adminFieldEntrySearch, setAdminFieldEntrySearch] = useState('');
  const [showAllAdminFieldEntries, setShowAllAdminFieldEntries] = useState(false);
  const [adminEntryReturnScrollY, setAdminEntryReturnScrollY] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<PhotoPreview | null>(null);
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
  const [isSalesSavedDetailsEditing, setIsSalesSavedDetailsEditing] = useState(false);
  const [showSalesFollowUpComposer, setShowSalesFollowUpComposer] = useState(false);
  const [isSalesStep2Editing, setIsSalesStep2Editing] = useState(false);
  const [isSalesStep3Editing, setIsSalesStep3Editing] = useState(false);
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
  const [isServiceSavedDetailsEditing, setIsServiceSavedDetailsEditing] = useState(false);
  const [showServiceFollowUpComposer, setShowServiceFollowUpComposer] = useState(false);
  const [isServiceStep2Editing, setIsServiceStep2Editing] = useState(false);
  const [isServiceStep3Editing, setIsServiceStep3Editing] = useState(false);
  const [backendRecentVisitEntries, setBackendRecentVisitEntries] = useState<FrontendRecentVisitEntry[]>([]);
  const [adminTeamRecentVisitEntries, setAdminTeamRecentVisitEntries] = useState<FrontendRecentVisitEntry[]>([]);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [isServiceStep2Submitting, setIsServiceStep2Submitting] = useState(false);
  const [isServiceStep3Submitting, setIsServiceStep3Submitting] = useState(false);
  const salesSubmitInFlightRef = useRef(false);
  const serviceSubmitInFlightRef = useRef(false);
  const [launchIssues, setLaunchIssues] = useState<LaunchIssue[]>([]);
  const isBackendConfigured = crystalBioFrontendApi.isBackendConfigured();

  useEffect(() => {
    const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
    if (!isDev || typeof window === 'undefined') return;
    const preview = new URLSearchParams(window.location.search).get('savedEntryPreview');
    if (preview === 'sales' && !salesSaveResult) {
      setSalesAccountName('Apollo Diagnostics');
      setSalesContactPerson('Dr. Meera');
      setSalesProductType('Laboratory equipment');
      setSalesVisitNote('Interested in reagent requirement. Follow-up planned for quote discussion.');
      setSalesNextAction('follow_up_needed');
      setSalesFollowUpDate('2026-06-24');
      setSalesStep2Saved(false);
      setSalesStep3Saved(false);
      setIsSalesStep2Open(false);
      setIsSalesStep3Open(false);
      setSalesSaveResult({
        opportunity: {
          id: 'preview-sales-entry',
          ownerAgentId: 'agent_2',
          accountName: 'Apollo Diagnostics',
          contactPerson: 'Dr. Meera',
          productType: 'Laboratory equipment',
          status: 'open',
          step2Saved: false,
          step3Saved: false,
          visits: [{
            id: 'preview-sales-visit',
            opportunityId: 'preview-sales-entry',
            agentId: 'agent_2',
            agentName: 'Raghavendra',
            visitNumber: 1,
            visitDate: '2026-06-22',
            visitTime: '17:45',
            gps: { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 25 },
            note: 'Interested in reagent requirement. Follow-up planned for quote discussion.',
            nextAction: 'follow_up_needed',
            followUpDate: '2026-06-24',
            photos: [],
          }],
        },
        visit: {
          id: 'preview-sales-visit',
          opportunityId: 'preview-sales-entry',
          agentId: 'agent_2',
          agentName: 'Raghavendra',
          visitNumber: 1,
          visitDate: '2026-06-22',
          visitTime: '17:45',
          gps: { latitude: 12.9716, longitude: 77.5946, accuracyMeters: 25 },
          note: 'Interested in reagent requirement. Follow-up planned for quote discussion.',
          nextAction: 'follow_up_needed',
          followUpDate: '2026-06-24',
          photos: [],
        },
      });
    }
  }, []);

  const rememberLaunchIssue = (area: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || 'Unknown issue');
    setLaunchIssues((current) => [{ area, message, when: 'Just now' }, ...current].slice(0, 5));
  };

  const restoreAgentAttendance = async (agentSession: FrontendSession) => {
    if (agentSession.role === 'admin') return;
    try {
      const currentAttendance = await crystalBioFrontendApi.getCurrentAttendance(agentSession);
      setAttendance(currentAttendance);
      if (currentAttendance?.workTypes?.length) setWorkTypes(currentAttendance.workTypes);
      setStatusMessage(
        currentAttendance?.status === 'checked_in'
          ? 'Checked in. Use Check out when field work is finished.'
          : 'Logged in. Check in to start field work.',
      );
    } catch (error) {
      rememberLaunchIssue('Attendance restore', error);
      setStatusMessage('Logged in. Check attendance if the screen does not update.');
    }
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
          setAdminTab(isPublicMonitorPage ? 'monitoring' : 'overview');
          setScreen('admin');
          rememberScreen('admin');
          setStatusMessage('Admin logged in.');
          void refreshAdminData(validatedSession);
          return;
        }
        setIsAdminSignedIn(false);
        setScreen('home');
        rememberScreen('home');
        setStatusMessage('Loading attendance…');
        void restoreAgentAttendance(validatedSession);
      })
      .catch((error) => {
        if (!isMounted) return;
        rememberLaunchIssue('Saved login validation', error);
        if (isExpiredSessionError(error)) {
          forgetSession();
          setSession(null);
          setIsAdminSignedIn(false);
          setScreen('login');
          setStatusMessage('Please log in again.');
          return;
        }
        setStatusMessage('Saved login kept. Check connection if the screen does not update.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hostname !== 'work.convogenie.ai') return undefined;
    let cancelled = false;
    const checkForUpdate = async () => {
      try {
        const response = await fetch(`./version.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const version = await response.json() as { version?: string };
        if (!cancelled && version.version && version.version !== appBuildVersion) {
          const lastReloadedVersion = window.sessionStorage.getItem(appVersionReloadKey);
          if (lastReloadedVersion !== version.version) {
            window.sessionStorage.setItem(appVersionReloadKey, version.version);
            window.location.reload();
          }
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
    if (isPublicMonitorPage) {
      setStatusMessage('Live monitor open. No CrystalBio company login needed.');
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
        setStatusMessage('Loading attendance…');
        void restoreAgentAttendance(nextSession);
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
    if (session?.role !== 'admin' || screen !== 'admin') return undefined;
    let stopped = false;
    const refreshVisibleAdminData = () => {
      if (stopped || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
      void refreshAdminData(session);
    };
    const refreshWhenVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refreshVisibleAdminData();
    };
    const interval = window.setInterval(refreshVisibleAdminData, 30000);
    window.addEventListener('focus', refreshVisibleAdminData);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshVisibleAdminData);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [session?.token, session?.role, screen, adminReportFromDate, adminReportToDate]);

  useEffect(() => {
    if (!isPublicMonitorPage) return undefined;
    let isMounted = true;
    const refreshPublicMonitor = async () => {
      setIsAdminMonitorRefreshing(true);
      try {
        const snapshot = await crystalBioFrontendApi.getPublicMonitorSnapshot();
        if (!isMounted) return;
        setAdminLoginActivity(snapshot.loginActivity);
        setAdminClientErrors(snapshot.clientErrors);
      } catch (error) {
        if (isMounted) rememberLaunchIssue('Public monitor refresh', error);
      } finally {
        if (isMounted) setIsAdminMonitorRefreshing(false);
      }
    };
    void refreshPublicMonitor();
    const timer = window.setInterval(refreshPublicMonitor, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [isPublicMonitorPage]);

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
  const isCheckedOut = attendance?.status === 'checked_out';
  const savedAttendanceWorkTypes = attendance?.workTypes?.length ? attendance.workTypes : workTypes;
  const savedWorkTypeLabel = savedAttendanceWorkTypes.length ? savedAttendanceWorkTypes.join(' + ') : 'Mode not recorded';
  const attendanceStartedLabel = attendance?.checkInTime ? formatAttendanceTime(attendance.checkInTime) : 'Time not recorded';
  const attendanceEndedLabel = attendance?.checkOutTime ? formatAttendanceTime(attendance.checkOutTime) : 'Time not recorded';
  const attendanceAction = isCheckedIn ? 'Check out' : isCheckedOut ? 'Check in again' : 'Check in';
  const attendanceHint = isCheckedIn ? 'End session' : isCheckedOut ? 'Back from break' : 'Start day';

  const actionMeta = useMemo(
    () => [
      { label: attendanceAction, hint: attendanceHint, className: isCheckedIn ? 'action-checkout-live' : isCheckedOut ? 'action-checkin-again' : 'action-mint', icon: MapPin, onClick: 'attendance-action' as const },
      { label: 'Sales', hint: 'New visit update', className: 'action-peach', icon: Plus, onClick: 'sales' as const },
      { label: 'Service', hint: 'New service update', className: 'action-sky', icon: ClipboardList, onClick: 'service' as const },
      { label: 'Attendance', hint: 'Logs & leave', className: 'action-attendance', icon: CalendarCheck, onClick: 'attendance' as const },
    ],
    [attendanceAction, attendanceHint, isCheckedIn, isCheckedOut],
  );

  const latestVisitEntries: FrontendRecentVisitEntry[] = [
    ...(salesSaveResult ? [{
      id: salesSaveResult.visit.id,
      recordId: salesSaveResult.opportunity.id,
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
      recordId: serviceSaveResult.serviceRecord.id,
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
      const capturedAt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: istTimeZone }).format(new Date());
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
      {(currentGps || purpose === 'check-in') && <p>{currentLocationSummary}</p>}
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
        : await crystalBioFrontendApi.checkIn(session, gps, workTypes, checkInNote.trim() || undefined);
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
    if (isCheckedIn) {
      setScreenNotice({ title: 'Already checked in', message: `Your check-in is already registered${attendance?.checkInTime ? ` at ${formatAttendanceTime(attendance.checkInTime)}` : ''}. Use Check out when field work is finished.`, tone: 'info' });
      setScreen('attendance');
      return;
    }
    if (!workTypes.length) {
      setScreenNotice({ title: 'Choose work type', message: 'Select Sales visit, Service visit, or In office before check-in.', tone: 'warning' });
      return;
    }
    setIsAttendanceBusy(true);
    setScreenNotice('Capturing check-in location…');
    setStatusMessage('Capturing check-in location…');
    try {
      const gps = await gpsForSave('check-in');
      const nextAttendance = await crystalBioFrontendApi.checkIn(session, gps, workTypes, checkInNote.trim() || undefined);
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
    setIsSalesSavedDetailsEditing(false);
    setShowSalesFollowUpComposer(false);
    setIsSalesStep2Editing(false);
    setIsSalesStep3Editing(false);
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
    setIsServiceSavedDetailsEditing(false);
    setShowServiceFollowUpComposer(false);
    setIsServiceStep2Editing(false);
    setIsServiceStep3Editing(false);
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

  const canUseBrowserHistory = () => (
    typeof window !== 'undefined' && !window.navigator.userAgent.toLowerCase().includes('jsdom')
  );

  const pushAdminDetailHistory = (marker: Record<string, string>) => {
    if (!canUseBrowserHistory()) return;
    const markerKey = Object.keys(marker)[0];
    if (markerKey && window.history.state?.[markerKey] === marker[markerKey]) return;
    window.history.pushState({ ...(window.history.state ?? {}), ...marker }, '', window.location.href);
  };

  const clearAdminDetailHistoryMarkers = () => {
    if (!canUseBrowserHistory()) return;
    const currentState = window.history.state;
    if (!currentState) return;
    const {
      crystalBioAdminEntryDetail: _entryDetail,
      crystalBioAdminEntryReturnTab: _entryReturnTab,
      crystalBioAdminApprovalDetail: _approvalDetail,
      crystalBioAdminAgentDetail: _agentDetail,
      crystalBioAdminProfileDetail: _profileDetail,
      ...restState
    } = currentState;
    window.history.replaceState(restState, '', window.location.href);
  };

  const openAdminTab = (nextTab: AdminTab) => {
    clearAdminDetailHistoryMarkers();
    setAdminTab(nextTab);
    setSelectedAdminEntryId(null);
    setSelectedAdminEntryReturnTab(nextTab);
    setExpandedAgentActivityId(null);
    if (nextTab !== 'agents') setShowAdminTeamStatus(false);
    if (nextTab !== 'approvals') setSelectedAdminApproval(null);
    if (nextTab !== 'agents' && nextTab !== 'profiles') setAdminAgentsView('list');
    setScreenNotice(null);
  };

  const openAdminEntryDetail = (entry: FrontendRecentVisitEntry, returnTab: AdminTab) => {
    if (typeof window !== 'undefined') {
      setAdminEntryReturnScrollY(window.scrollY);
      pushAdminDetailHistory({ crystalBioAdminEntryDetail: entry.id, crystalBioAdminEntryReturnTab: returnTab });
    }
    setSelectedAdminEntryId(entry.id);
    setSelectedAdminEntryReturnTab(returnTab);
    if (!session || adminEntryDetailCache[entry.id]?.photoPayload || entry.photoPayload) return;
    setLoadingAdminEntryDetailId(entry.id);
    crystalBioFrontendApi.getRecentVisitDetail(session, { id: entry.id, scope: 'team' })
      .then((detailEntry) => {
        if (detailEntry) setAdminEntryDetailCache((current) => ({ ...current, [entry.id]: detailEntry }));
      })
      .catch((error: Error) => {
        rememberLaunchIssue('Field Entry detail load', error);
        setScreenNotice({ title: 'Entry detail delayed', message: 'The entry opened, but photo/proof detail could not load yet.', tone: 'error' });
      })
      .finally(() => setLoadingAdminEntryDetailId((current) => (current === entry.id ? null : current)));
  };

  const closeAdminEntryDetail = (options?: { fromHistory?: boolean }) => {
    if (!options?.fromHistory && canUseBrowserHistory() && window.history.state?.crystalBioAdminEntryDetail) {
      window.history.back();
      return;
    }
    setSelectedAdminEntryId(null);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function' && !window.navigator.userAgent.toLowerCase().includes('jsdom')) {
      window.setTimeout(() => {
        try {
          window.scrollTo({ top: adminEntryReturnScrollY, behavior: 'auto' });
        } catch {
          // Some test/mobile webview environments do not expose scroll restoration.
        }
      }, 0);
    }
  };

  const closeAdminApprovalDetail = (options?: { fromHistory?: boolean }) => {
    if (!options?.fromHistory && canUseBrowserHistory() && window.history.state?.crystalBioAdminApprovalDetail) {
      window.history.back();
      return;
    }
    setSelectedAdminApproval(null);
  };

  const closeAdminAgentDetail = (options?: { fromHistory?: boolean }) => {
    if (!options?.fromHistory && canUseBrowserHistory() && window.history.state?.crystalBioAdminAgentDetail) {
      window.history.back();
      return;
    }
    setExpandedAgentActivityId(null);
  };

  const closeAdminProfileDetail = (options?: { fromHistory?: boolean }) => {
    if (!options?.fromHistory && canUseBrowserHistory() && window.history.state?.crystalBioAdminProfileDetail) {
      window.history.back();
      return;
    }
    setAdminAgentsView('list');
  };

  useEffect(() => {
    if (!canUseBrowserHistory()) return undefined;
    const handlePopState = () => {
      setSelectedAdminEntryId((current) => {
        if (current) window.setTimeout(() => closeAdminEntryDetail({ fromHistory: true }), 0);
        return current;
      });
      setSelectedAdminApproval((current) => {
        if (current) window.setTimeout(() => closeAdminApprovalDetail({ fromHistory: true }), 0);
        return current;
      });
      setExpandedAgentActivityId((current) => {
        if (current) window.setTimeout(() => closeAdminAgentDetail({ fromHistory: true }), 0);
        return current;
      });
      setAdminAgentsView((current) => {
        if (current === 'profile' || current === 'invite' || current === 'add') {
          window.setTimeout(() => closeAdminProfileDetail({ fromHistory: true }), 0);
        }
        return current;
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminEntryReturnScrollY]);

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

  const entryDetailValue = (entry: FrontendRecentVisitEntry, label: string) => (
    entry.detailRows?.find((row) => row.label === label)?.value ?? ''
  );

  const savedStatusToBoolean = (value: string) => value.toLowerCase() === 'saved';

  const detailRowsWithoutAdminClutter = (entry: FrontendRecentVisitEntry) => {
    const rows = entry.detailRows ?? [];
    const preferredLabels = entry.type === 'Sales'
      ? ['Contact person', 'Product type', 'Brand / model', 'Requirement', 'Visit note', 'Next action', 'Follow-up date', 'Quote status', 'Support required', 'Office notes']
      : ['Contact person', 'Equipment', 'Serial number', 'Work done', 'Next action', 'Next visit date', 'Machine status', 'Support note', 'Office notes'];
    const hiddenTopClutter = new Set(['Submitted by', 'Visit date', 'Customer', 'Step 2 status', 'Step 3 status']);
    const preferredRows = preferredLabels
      .map((label) => rows.find((row) => row.label === label))
      .filter((row): row is FrontendVisitDetailRow => Boolean(row));
    const remainingRows = rows.filter((row) => !hiddenTopClutter.has(row.label) && !preferredLabels.includes(row.label));
    return [...preferredRows, ...remainingRows];
  };

  const displayDetailValue = (row: FrontendVisitDetailRow) => {
    if (['Follow-up date', 'Next visit date', 'Closing date', 'Visit date'].includes(row.label) && /^\d{4}-\d{2}-\d{2}$/.test(row.value)) return formatShortDate(row.value);
    return row.value;
  };

  const salesNextActionFromStatus = (status: string): FrontendSalesNextAction => {
    const normalized = status.toLowerCase();
    if (normalized.includes('closed')) return 'closed';
    if (normalized.includes('no follow')) return 'no_follow_up';
    return 'follow_up_needed';
  };

  const serviceNextActionFromStatus = (status: string): FrontendServiceNextAction => {
    const normalized = status.toLowerCase();
    if (normalized.includes('closed')) return 'closed';
    if (normalized.includes('no follow')) return 'no_follow_up';
    return normalized.includes('next visit') ? 'next_visit_needed' : 'parts_required';
  };

  const openSavedVisitEntry = (entry: FrontendRecentVisitEntry) => {
    const agentId = entry.agentId ?? session?.agentId ?? 'agent_2';
    const agentName = entry.agentName || session?.agentName || 'Field agent';
    const fallbackGps: FrontendGps = { latitude: 0, longitude: 0 };

    if (entry.type === 'Sales') {
      const nextAction = salesNextActionFromStatus(entry.status);
      const salesPhoto = parseStoredPhotoPayload(entry.photoPayload);
      setSalesAccountName(entryDetailValue(entry, 'Customer') || entry.customer);
      setSalesContactPerson(entryDetailValue(entry, 'Contact person'));
      setSalesDesignation(entryDetailValue(entry, 'Designation'));
      setSalesPhone(entryDetailValue(entry, 'Phone'));
      setSalesEmail(entryDetailValue(entry, 'Email'));
      setSalesDepartmentAddress(entryDetailValue(entry, 'Department / address'));
      setSalesLeadSource(entryDetailValue(entry, 'Lead source') || 'Field visit');
      setSalesProductType(entryDetailValue(entry, 'Product type') || 'Laboratory equipment');
      setSalesRequirement(entryDetailValue(entry, 'Requirement'));
      setSalesVisitNote(entryDetailValue(entry, 'Visit note'));
      setSalesNextAction(nextAction);
      setSalesFollowUpDate(entryDetailValue(entry, 'Follow-up date'));
      setSalesQuoteSubmitted((entryDetailValue(entry, 'Quote submitted') as 'yes' | 'no' | '') || '');
      setSalesBudgetaryProposal(entryDetailValue(entry, 'Budget / proposal'));
      setSalesQuoteStatus(entryDetailValue(entry, 'Quote status') || 'New inquiry');
      setSalesFundStatus(entryDetailValue(entry, 'Fund status') || 'Unknown');
      setSalesProbability(entryDetailValue(entry, 'Probability'));
      setSalesClosingDate(entryDetailValue(entry, 'Closing date'));
      setSalesSupportRequired(entryDetailValue(entry, 'Support required'));
      setSalesOfficeNotes(entryDetailValue(entry, 'Office notes'));
      setSalesPhotoNote(salesPhoto.note);
      setSalesPhotoAttachment(salesPhoto.photo);
      setSalesStep2Saved(savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')));
      setSalesStep3Saved(savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')));
      setIsSalesSavedDetailsEditing(false);
      setIsSalesStep2Editing(false);
      setIsSalesStep3Editing(false);
      setIsSalesStep2Open(!savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')));
      setIsSalesStep3Open(!savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')));
      setSalesSaveResult({
        opportunity: {
          id: entry.recordId ?? entry.id,
          ownerAgentId: agentId,
          accountName: entryDetailValue(entry, 'Customer') || entry.customer,
          contactPerson: entryDetailValue(entry, 'Contact person') || undefined,
          designation: entryDetailValue(entry, 'Designation') || undefined,
          phone: entryDetailValue(entry, 'Phone') || undefined,
          email: entryDetailValue(entry, 'Email') || undefined,
          departmentAddress: entryDetailValue(entry, 'Department / address') || undefined,
          leadSource: entryDetailValue(entry, 'Lead source') || undefined,
          productType: entryDetailValue(entry, 'Product type') || undefined,
          requirement: entryDetailValue(entry, 'Requirement') || undefined,
          quoteSubmitted: (entryDetailValue(entry, 'Quote submitted') as 'yes' | 'no' | '') || undefined,
          budgetaryProposal: entryDetailValue(entry, 'Budget / proposal') || undefined,
          quoteStatus: entryDetailValue(entry, 'Quote status') || undefined,
          fundStatus: entryDetailValue(entry, 'Fund status') || undefined,
          probability: entryDetailValue(entry, 'Probability') || undefined,
          closingDate: entryDetailValue(entry, 'Closing date') || undefined,
          supportRequired: entryDetailValue(entry, 'Support required') || undefined,
          officeNotes: entryDetailValue(entry, 'Office notes') || undefined,
          sitePhoto: entry.photoPayload,
          step2Saved: savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')),
          step3Saved: savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')),
          status: nextAction === 'closed' ? 'closed' : 'open',
          visits: [{
            id: entry.id,
            opportunityId: entry.recordId ?? entry.id,
            agentId,
            agentName,
            visitNumber: 1,
            visitDate: entry.visitDate ?? '',
            visitTime: entry.visitTime ?? '',
            gps: fallbackGps,
            note: entryDetailValue(entry, 'Visit note'),
            nextAction,
            ...(entryDetailValue(entry, 'Follow-up date') ? { followUpDate: entryDetailValue(entry, 'Follow-up date') } : {}),
          }],
        },
        visit: {
          id: entry.id,
          opportunityId: entry.recordId ?? entry.id,
          agentId,
          agentName,
          visitNumber: 1,
          visitDate: entry.visitDate ?? '',
          visitTime: entry.visitTime ?? '',
          gps: fallbackGps,
          note: entryDetailValue(entry, 'Visit note'),
          nextAction,
          ...(entryDetailValue(entry, 'Follow-up date') ? { followUpDate: entryDetailValue(entry, 'Follow-up date') } : {}),
        },
      });
      goToScreen('sales');
      return;
    }

    const nextAction = serviceNextActionFromStatus(entry.status);
    const servicePhoto = parseStoredPhotoPayload(entry.photoPayload);
    setServiceCustomerName(entryDetailValue(entry, 'Customer') || entry.customer);
    setServiceContactPerson(entryDetailValue(entry, 'Contact person'));
    setServicePhone(entryDetailValue(entry, 'Phone'));
    setServiceEmail(entryDetailValue(entry, 'Email'));
    setServiceDepartmentAddress(entryDetailValue(entry, 'Department / address'));
    setServiceWorkDone(entryDetailValue(entry, 'Work done'));
    setServiceNextAction(nextAction);
    setServiceNextVisitDate(entryDetailValue(entry, 'Next visit date'));
    setServicePartsRequired(entryDetailValue(entry, 'Parts required'));
    setServicePartsUsed(entryDetailValue(entry, 'Parts used'));
    setServiceMachineStatus(entryDetailValue(entry, 'Machine status'));
    setServiceSupportRequiredNote(entryDetailValue(entry, 'Support note'));
    setServiceFinalRemarks(entryDetailValue(entry, 'Final remarks'));
    setServiceOfficeNotes(entryDetailValue(entry, 'Office notes'));
    setServicePhotoNote(servicePhoto.note);
    setServicePhotoAttachment(servicePhoto.photo);
    setServiceStep2Saved(savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')));
    setServiceStep3Saved(savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')));
    setIsServiceSavedDetailsEditing(false);
    setIsServiceStep2Editing(false);
    setIsServiceStep3Editing(false);
    setIsServiceStep2Open(!savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')));
    setIsServiceStep3Open(!savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')));
    setServiceSaveResult({
      serviceRecord: {
        id: entry.recordId ?? entry.id,
        ownerAgentId: agentId,
        customerName: entryDetailValue(entry, 'Customer') || entry.customer,
        contactPerson: entryDetailValue(entry, 'Contact person') || undefined,
        phone: entryDetailValue(entry, 'Phone') || undefined,
        email: entryDetailValue(entry, 'Email') || undefined,
        departmentAddress: entryDetailValue(entry, 'Department / address') || undefined,
        partsRequired: entryDetailValue(entry, 'Parts required') || undefined,
        partsUsed: entryDetailValue(entry, 'Parts used') || undefined,
        machineStatus: entryDetailValue(entry, 'Machine status') || undefined,
        supportRequiredNote: entryDetailValue(entry, 'Support note') || undefined,
        finalRemarks: entryDetailValue(entry, 'Final remarks') || undefined,
        photoNote: entry.photoPayload,
        step2Saved: savedStatusToBoolean(entryDetailValue(entry, 'Step 2 status')),
        step3Saved: savedStatusToBoolean(entryDetailValue(entry, 'Step 3 status')),
        status: nextAction === 'closed' ? 'closed' : nextAction === 'parts_required' ? 'pending_parts' : 'open',
        visits: [{
          id: entry.id,
          serviceRecordId: entry.recordId ?? entry.id,
          agentId,
          agentName,
          visitNumber: 1,
          visitDate: entry.visitDate ?? '',
          visitTime: entry.visitTime ?? '',
          gps: fallbackGps,
          serviceType: 'breakdown',
          workDone: entryDetailValue(entry, 'Work done'),
          supportRequired: entry.status !== 'Closed',
          nextAction,
          ...(entryDetailValue(entry, 'Next visit date') ? { nextVisitDate: entryDetailValue(entry, 'Next visit date') } : {}),
          ...(entryDetailValue(entry, 'Office notes') ? { officeNotes: entryDetailValue(entry, 'Office notes') } : {}),
        }],
      },
      visit: {
        id: entry.id,
        serviceRecordId: entry.recordId ?? entry.id,
        agentId,
        agentName,
        visitNumber: 1,
        visitDate: entry.visitDate ?? '',
        visitTime: entry.visitTime ?? '',
        gps: fallbackGps,
        serviceType: 'breakdown',
        workDone: entryDetailValue(entry, 'Work done'),
        supportRequired: entry.status !== 'Closed',
        nextAction,
        ...(entryDetailValue(entry, 'Next visit date') ? { nextVisitDate: entryDetailValue(entry, 'Next visit date') } : {}),
        ...(entryDetailValue(entry, 'Office notes') ? { officeNotes: entryDetailValue(entry, 'Office notes') } : {}),
      },
    });
    goToScreen('service');
  };

  const PhotoViewer = ({ payload, label }: { payload?: string; label: string }) => {
    const { note, photo } = parseStoredPhotoPayload(payload);
    if (!photo?.dataUrl) {
      if (!note) return null;
      return <small>{note}</small>;
    }
    return (
      <div className="saved-photo-viewer">
        <button type="button" className="photo-preview-button" onClick={() => setPhotoPreview({ dataUrl: photo.dataUrl, fileName: photo.fileName, note, label })} aria-label={`Preview ${label} photo`}>
          <img src={photo.dataUrl} alt={`${label}: ${photo.fileName}`} />
        </button>
        <div>
          <strong>{photo.fileName}</strong>
          <span>{Math.ceil(photo.sizeBytes / 1024)} KB{note ? ` • ${note}` : ''}</span>
          <button type="button" className="photo-inline-preview-action" onClick={() => setPhotoPreview({ dataUrl: photo.dataUrl, fileName: photo.fileName, note, label })}>Preview photo</button>
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
    helpText?: string;
    note: string;
    setNote: (value: string) => void;
    photo: StoredPhoto | null;
  }) => (
    <div className="field-card photo-action-card">
      <div>
        <span>{title}</span>
        {helpText && <small>{helpText}</small>}
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
      setStatusMessage('Loading attendance…');
      setScreen('home');
      rememberScreen('home');
      void restoreAgentAttendance(nextSession);
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

  const handleLoginPasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void handleAgentLogin();
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
  const isSalesStep2Complete = salesStep2Saved || salesSaveResult?.opportunity.step2Saved === true;
  const isSalesStep3Complete = salesStep3Saved || salesSaveResult?.opportunity.step3Saved === true;
  const isServiceStep2Complete = serviceStep2Saved || serviceSaveResult?.serviceRecord.step2Saved === true;
  const isServiceStep3Complete = serviceStep3Saved || serviceSaveResult?.serviceRecord.step3Saved === true;
  const isSalesStep2Locked = Boolean(salesSaveResult && isSalesStep2Complete && !isSalesStep2Editing);
  const isSalesStep3Locked = Boolean(salesSaveResult && isSalesStep3Complete && !isSalesStep3Editing);
  const isServiceStep2Locked = Boolean(serviceSaveResult && isServiceStep2Complete && !isServiceStep2Editing);
  const isServiceStep3Locked = Boolean(serviceSaveResult && isServiceStep3Complete && !isServiceStep3Editing);
  const salesContinuationNeedsNote = Boolean(salesSaveResult && salesNextAction === 'follow_up_needed');
  const serviceContinuationNeedsNote = Boolean(serviceSaveResult && (serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed'));
  const salesVisitHistory = (salesSaveResult?.opportunity.visits?.length ? salesSaveResult.opportunity.visits : salesSaveResult ? [salesSaveResult.visit] : [])
    .slice()
    .sort((first, second) => first.visitNumber - second.visitNumber);
  const serviceVisitHistory = (serviceSaveResult?.serviceRecord.visits?.length ? serviceSaveResult.serviceRecord.visits : serviceSaveResult ? [serviceSaveResult.visit] : [])
    .slice()
    .sort((first, second) => first.visitNumber - second.visitNumber);
  const nextSalesFollowUpNumber = Math.max(1, ...salesVisitHistory.map((visit) => visit.visitNumber || 1)) + 1;
  const nextServiceFollowUpNumber = Math.max(1, ...serviceVisitHistory.map((visit) => visit.visitNumber || 1)) + 1;

  const handleSalesSubmit = async () => {
    if (salesSubmitInFlightRef.current) return;
    if (!session) {
      setScreenNotice('Please wait for login before saving the sales visit.');
      return;
    }
    if (!salesAccountName.trim() || (!salesSaveResult && !salesVisitNote.trim()) || (salesContinuationNeedsNote && !salesVisitNote.trim())) {
      setScreenNotice(salesSaveResult ? 'Add follow-up note before saving follow-up needed.' : 'Add customer name and visit note before saving Step 1.');
      return;
    }
    if (salesNextAction === 'follow_up_needed' && !salesFollowUpDate) {
      setScreenNotice('Select follow-up date or choose no follow-up.');
      return;
    }
    salesSubmitInFlightRef.current = true;
    setIsSalesSubmitting(true);
    setScreenNotice(salesSaveResult ? (salesNextAction === 'follow_up_needed' ? 'Saving follow-up…' : 'Saving status…') : 'Saving Sales Step 1 with location…');
    try {
      if (salesSaveResult) {
        const gps = await gpsForSave('sales');
        let opportunity = await crystalBioFrontendApi.submitSalesStep2(session, salesSaveResult.opportunity.id, {
          accountName: salesAccountName.trim(),
          ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
          ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
          ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
        });
        const salesPhotoPayload = storedPhotoPayload(salesPhotoNote, salesPhotoAttachment);
        const visit = await crystalBioFrontendApi.addSalesVisitUpdate(session, salesSaveResult.opportunity.id, {
          gps,
          note: salesVisitNote.trim() || (salesNextAction === 'no_follow_up' ? 'No follow-up' : 'Status updated'),
          nextAction: salesNextAction,
          ...(salesNextAction === 'follow_up_needed' ? { followUpDate: salesFollowUpDate } : {}),
          photos: salesPhotoAttachment ? [salesPhotoAttachment] : [],
        });
        if (salesPhotoPayload) {
          opportunity = await crystalBioFrontendApi.submitSalesStep3(session, salesSaveResult.opportunity.id, { sitePhoto: salesPhotoPayload });
          setSalesStep3Saved(true);
        }
        const savedFollowUpVisit = visit.visitNumber <= Math.max(1, ...salesVisitHistory.map((historyVisit) => historyVisit.visitNumber || 1))
          ? { ...visit, visitNumber: nextSalesFollowUpNumber }
          : visit;
        const updatedSalesVisits = [...salesVisitHistory.filter((historyVisit) => historyVisit.id !== savedFollowUpVisit.id), savedFollowUpVisit]
          .sort((first, second) => first.visitNumber - second.visitNumber);
        setSalesSaveResult({
          opportunity: { ...salesSaveResult.opportunity, ...opportunity, visits: updatedSalesVisits },
          visit: savedFollowUpVisit,
        });
        setBackendRecentVisitEntries((current) => [
          {
            id: visit.id,
            recordId: salesSaveResult.opportunity.id,
            customer: salesAccountName.trim(),
            type: 'Sales' as const,
            status: visit.nextAction === 'closed' ? 'Closed' : visit.nextAction === 'no_follow_up' ? 'No follow-up' : 'Follow-up needed',
            next: visit.followUpDate ? formatShortDate(visit.followUpDate) : 'No date set',
            tone: visit.nextAction === 'follow_up_needed' ? 'warning' as const : 'soft' as const,
            agentId: visit.agentId,
            agentName: visit.agentName,
            visitDate: visit.visitDate,
            visitTime: visit.visitTime,
            photoPayload: opportunity.sitePhoto ?? storedPhotoPayload(salesPhotoNote, salesPhotoAttachment),
          },
          ...current,
        ].filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index));
        if (session.role === 'admin') void refreshAdminData(session);
        setShowSalesFollowUpComposer(false);
        setScreenNotice({
          title: 'Follow-up saved',
          message: 'This customer entry is updated.',
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
      setSalesSaveResult({
        ...savedSalesVisit,
        opportunity: { ...savedSalesVisit.opportunity, visits: savedSalesVisit.opportunity.visits?.length ? savedSalesVisit.opportunity.visits : [savedSalesVisit.visit] },
      });
      setShowSalesFollowUpComposer(false);
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
      setIsSalesStep2Editing(false);
      setIsSalesStep3Editing(false);
      setIsSalesStep2Open(true);
      setIsSalesStep3Open(false);
      setScreenNotice(
        isBackendConfigured
          ? 'Sales Step 1 saved. Open Step 2 or Step 3 when more details are ready.'
          : 'Sales Step 1 saved. Step 2 and Step 3 can now be opened.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales Step 1 save failed');
    } finally {
      salesSubmitInFlightRef.current = false;
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
        step2Saved: true,
      });
      setSalesSaveResult({ ...salesSaveResult, opportunity: { ...salesSaveResult.opportunity, ...opportunity } });
      setSalesStep2Saved(true);
      setIsSalesStep2Editing(false);
      setIsSalesStep2Open(false);
      setIsSalesStep3Open(true);
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
    setScreenNotice('Saving Sales Step 3 quote and office details…');
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
        step3Saved: true,
      });
      setSalesSaveResult({ ...salesSaveResult, opportunity: { ...salesSaveResult.opportunity, ...opportunity } });
      setSalesStep3Saved(true);
      setIsSalesStep3Editing(false);
      setIsSalesStep3Open(false);
      setScreenNotice('Sales Step 3 saved. Admin can see quote and office details later.');
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales Step 3 save failed');
    } finally {
      setIsSalesStep3Submitting(false);
    }
  };

  const handleServiceSubmit = async () => {
    if (serviceSubmitInFlightRef.current) return;
    if (!session) {
      setScreenNotice('Please wait for login before saving the service visit.');
      return;
    }
    if (!serviceCustomerName.trim() || (!serviceSaveResult && !serviceWorkDone.trim()) || (serviceContinuationNeedsNote && !serviceWorkDone.trim())) {
      setScreenNotice(serviceSaveResult ? 'Add service note before saving this status.' : 'Add customer name and today’s work done before saving.');
      return;
    }
    if ((serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed') && !serviceNextVisitDate) {
      setScreenNotice('Select next visit date or choose no follow-up.');
      return;
    }
    serviceSubmitInFlightRef.current = true;
    setIsServiceSubmitting(true);
    setScreenNotice(serviceSaveResult ? (serviceContinuationNeedsNote ? 'Saving follow-up…' : 'Saving status…') : 'Saving service visit with location…');
    try {
      const serviceSession = isBackendConfigured || session.agentId === 'agent_3' ? session : await crystalBioFrontendApi.login('agent_3');
      if (serviceSession !== session) setSession(serviceSession);

      if (serviceSaveResult) {
        const gps = await gpsForSave('service');
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
        const visit = await crystalBioFrontendApi.addServiceVisitUpdate(serviceSession, serviceSaveResult.serviceRecord.id, {
          gps,
          serviceType,
          workDone: serviceWorkDone.trim() || (serviceNextAction === 'no_follow_up' ? 'No follow-up' : 'Status updated'),
          supportRequired: serviceSupportRequired,
          nextAction: serviceNextAction,
          ...(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed' ? { nextVisitDate: serviceNextVisitDate } : {}),
          photos: servicePhotoAttachment ? [servicePhotoAttachment] : [],
          ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
        });
        if (servicePhotoPayload) {
          serviceRecord = await crystalBioFrontendApi.submitServiceStep3(serviceSession, serviceSaveResult.serviceRecord.id, { photoNote: servicePhotoPayload });
          setServiceStep3Saved(true);
        }
        const savedServiceFollowUpVisit = visit.visitNumber <= Math.max(1, ...serviceVisitHistory.map((historyVisit) => historyVisit.visitNumber || 1))
          ? { ...visit, visitNumber: nextServiceFollowUpNumber }
          : visit;
        const updatedServiceVisits = [...serviceVisitHistory.filter((historyVisit) => historyVisit.id !== savedServiceFollowUpVisit.id), savedServiceFollowUpVisit]
          .sort((first, second) => first.visitNumber - second.visitNumber);
        setServiceSaveResult({
          serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord, visits: updatedServiceVisits },
          visit: savedServiceFollowUpVisit,
        });
        setBackendRecentVisitEntries((current) => [
          {
            id: visit.id,
            recordId: serviceSaveResult.serviceRecord.id,
            customer: serviceCustomerName.trim(),
            type: 'Service' as const,
            status: visit.nextAction === 'closed' ? 'Closed' : visit.nextAction === 'no_follow_up' ? 'No follow-up' : visit.nextAction === 'parts_required' ? 'Parts required' : 'Next visit needed',
            next: visit.nextVisitDate ? formatShortDate(visit.nextVisitDate) : 'No date set',
            tone: visit.nextAction === 'closed' ? 'soft' as const : 'info' as const,
            agentId: visit.agentId,
            agentName: visit.agentName,
            visitDate: visit.visitDate,
            visitTime: visit.visitTime,
            photoPayload: serviceRecord.photoNote ?? storedPhotoPayload(servicePhotoNote, servicePhotoAttachment),
          },
          ...current,
        ].filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index));
        if (serviceSession.role === 'admin') void refreshAdminData(serviceSession);
        setShowServiceFollowUpComposer(false);
        setScreenNotice({
          title: 'Follow-up saved',
          message: 'This service entry is updated.',
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
      setServiceSaveResult({
        ...savedServiceVisit,
        serviceRecord: { ...savedServiceVisit.serviceRecord, visits: savedServiceVisit.serviceRecord.visits?.length ? savedServiceVisit.serviceRecord.visits : [savedServiceVisit.visit] },
      });
      setShowServiceFollowUpComposer(false);
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
      setIsServiceStep2Editing(false);
      setIsServiceStep3Editing(false);
      setIsServiceStep2Open(true);
      setIsServiceStep3Open(false);
      setScreenNotice(
        isBackendConfigured
          ? 'Service visit saved. Admin reports will include this update.'
          : 'Service visit saved. Admin reports will include this update.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Service visit save failed');
    } finally {
      serviceSubmitInFlightRef.current = false;
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
        step2Saved: true,
      });
      setServiceSaveResult({ ...serviceSaveResult, serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord } });
      setServiceStep2Saved(true);
      setIsServiceStep2Editing(false);
      setIsServiceStep2Open(false);
      setIsServiceStep3Open(true);
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
    setScreenNotice('Saving Service Step 3 parts and office details…');
    try {
      const serviceRecord = await crystalBioFrontendApi.submitServiceStep3(session, serviceSaveResult.serviceRecord.id, {
        ...(servicePartsRequired.trim() ? { partsRequired: servicePartsRequired.trim() } : {}),
        ...(servicePartsUsed.trim() ? { partsUsed: servicePartsUsed.trim() } : {}),
        ...(serviceMachineStatus.trim() ? { machineStatus: serviceMachineStatus.trim() } : {}),
        ...(serviceSupportRequiredNote.trim() ? { supportRequiredNote: serviceSupportRequiredNote.trim() } : {}),
        ...(serviceFinalRemarks.trim() ? { finalRemarks: serviceFinalRemarks.trim() } : {}),
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
        step3Saved: true,
      });
      setServiceSaveResult({ ...serviceSaveResult, serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord } });
      setServiceStep3Saved(true);
      setIsServiceStep3Editing(false);
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
        <form aria-label="Login form" className="login-submit-form" onSubmit={(event) => { event.preventDefault(); void handleAgentLogin(); }}>
          <label className="field-card login-field-card">
            <span>Registered email</span>
            <input aria-label="Registered email" value={loginEmail} inputMode="email" autoComplete="email" placeholder="name@crystalbio.in" onChange={(event) => setLoginEmail(event.target.value)} />
          </label>
          <label className="field-card login-field-card">
            <span>Password</span>
            <input aria-label="Password" value={password} type="password" autoComplete="current-password" placeholder="Enter password" onKeyDown={handleLoginPasswordKeyDown} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit" className="primary-action login-main-button">Login</button>
        </form>
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
            <button className="agent-entry-card" key={entry.id} type="button" onClick={() => openSavedVisitEntry(entry)}>
              <div className="agent-entry-main">
                <strong>{displayCustomerName(entry.customer)}</strong>
                <p>{entry.agentName}</p>
                <small>{entry.type}{entry.next !== 'No date set' ? ` • Next: ${entry.next}` : ''}</small>
              </div>
              <span className="agent-entry-status-text">{entry.status}</span>
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
          <span>Open a row to continue</span>
        </div>
        {filteredEntries.length ? filteredEntries.map((entry) => (
          <button className="agent-entry-card agent-visit-entry-card" key={entry.id} type="button" onClick={() => openSavedVisitEntry(entry)}>
            <div className="agent-entry-main">
              <strong>{displayCustomerName(entry.customer)}</strong>
              <p>{entry.agentName}</p>
              <small>{entry.type}{entry.next !== 'No date set' ? ` • Next: ${entry.next}` : ''}</small>
            </div>
            <span className="agent-entry-status-text">{entry.status}</span>
          </button>
        )) : (
          <div className="empty-state">No saved visits yet. Start a Sales or Service update to create the first real entry.</div>
        )}
      </ScreenPanel>
    );
  };

  const renderSales = () => (
    <ScreenPanel title="Sales visit">
      {salesSaveResult && (
        <>
          <section className="saved-entry-summary-card">
            <div className="saved-entry-summary-top">
              <div>
                <span className="saved-entry-eyebrow">Saved Sales Entry</span>
                <strong>{salesAccountName || salesSaveResult.opportunity.accountName}</strong>
                <small>{[salesContactPerson, salesProductType || salesRequirement, salesSaveResult.visit.agentName].filter(Boolean).join(' • ')}</small>
              </div>
              <span className="saved-entry-status-pill">{salesSaveResult.visit.nextAction === 'follow_up_needed' ? 'Follow-up due' : salesSaveResult.visit.nextAction === 'closed' ? 'Closed' : 'No follow-up'}</span>
            </div>
            <div className="saved-entry-meta-grid">
              <div><span>Last update</span><strong>{formatVisitWhen(salesSaveResult.visit)}</strong></div>
              <div><span>Next follow-up</span><strong>{salesSaveResult.visit.followUpDate ? formatShortDate(salesSaveResult.visit.followUpDate) : 'Not needed'}</strong></div>
            </div>
            <div className="saved-entry-step-chips" aria-label="Sales saved step status">
              <span>Step 1 saved</span>
              <span className={isSalesStep2Complete ? '' : 'pending'}>Step 2 {isSalesStep2Complete ? 'saved' : 'pending'}</span>
              <span className={isSalesStep3Complete ? '' : 'pending'}>Step 3 {isSalesStep3Complete ? 'saved' : 'pending'}</span>
            </div>
          </section>

          <section className="saved-entry-action-card">
            <h3>What do you want to do now?</h3>
            <button type="button" className="primary-action" onClick={() => { setShowSalesFollowUpComposer((open) => !open); if (salesNextAction !== 'follow_up_needed') setSalesNextAction('follow_up_needed'); }}>Add follow-up {nextSalesFollowUpNumber}</button>
            <div className="saved-entry-action-grid">
              {(!isSalesStep2Complete || !isSalesStep3Complete) && (
                <button type="button" className="secondary-action" onClick={() => { setIsSalesStep2Open(!isSalesStep2Complete); setIsSalesStep3Open(isSalesStep2Complete && !isSalesStep3Complete); }}>Complete pending details</button>
              )}
              <button type="button" className="secondary-action" onClick={() => setIsSalesSavedDetailsEditing(true)}>Edit original details</button>
            </div>
          </section>

          {showSalesFollowUpComposer && (
            <section className="saved-followup-card simplified-followup-card">
              <h3>Follow-up {nextSalesFollowUpNumber} details</h3>
              <div className="inline-field-grid">
                <label className="field-card">
                  <span>Next status</span>
                  <select aria-label="Sales follow-up status" value={salesNextAction} onChange={(event) => setSalesNextAction(event.target.value as FrontendSalesNextAction)}>
                    <option value="follow_up_needed">Follow-up needed</option>
                    <option value="no_follow_up">No follow-up</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                {salesNextAction === 'follow_up_needed' && (
                  <label className="field-card">
                    <span>Next date</span>
                    <input aria-label="Sales follow-up next date" type="date" value={salesFollowUpDate} onChange={(event) => setSalesFollowUpDate(event.target.value)} />
                  </label>
                )}
              </div>
              {salesContinuationNeedsNote && (
                <label className="field-card">
                  <span>Follow-up note</span>
                  <textarea aria-label="Sales follow-up note" value={salesVisitNote} onChange={(event) => setSalesVisitNote(event.target.value)} placeholder="What happened now?" rows={2} />
                </label>
              )}
              <button type="button" className="primary-action" disabled={salesAnySubmitting || !session} onClick={handleSalesSubmit}>{isSalesSubmitting ? 'Saving…' : salesNextAction === 'follow_up_needed' ? 'Save follow-up' : 'Save status'}</button>
            </section>
          )}

          <section className="visit-updates-card" aria-label="Sales visit updates">
            <div className="section-title compact-section-title">
              <h3>Visit updates</h3>
              <span>{salesVisitHistory.length} saved</span>
            </div>
            <div className="followup-history-card compact-followup-history">
              {salesVisitHistory.map((visit) => (
                <div key={visit.id} className="followup-history-row">
                  <span>{visit.visitNumber === 1 ? 'Original visit' : `Follow-up ${visit.visitNumber}`}</span>
                  <strong>{visit.note || 'Status updated'}</strong>
                  <small>{formatVisitWhen(visit)}{visit.followUpDate ? ` • Next: ${formatShortDate(visit.followUpDate)}` : ''}</small>
                </div>
              ))}
            </div>
          </section>

        </>
      )}
      <section className={salesSaveResult && !isSalesSavedDetailsEditing ? 'step-card saved-details-locked' : 'step-card'}>
        <div className="step-heading">
          <div><span className="step-pill">Step 1</span><h3>Original visit details</h3>{salesSaveResult && <p>{isSalesSavedDetailsEditing ? 'Editing original saved details' : 'Saved details locked'}</p>}</div>
          {salesSaveResult && (
            <button type="button" className="inline-edit-action" onClick={() => setIsSalesSavedDetailsEditing((editing) => !editing)}>
              {isSalesSavedDetailsEditing ? 'Lock details' : 'Edit saved details'}
            </button>
          )}
        </div>
        <fieldset className="saved-details-fieldset" disabled={Boolean(salesSaveResult && !isSalesSavedDetailsEditing)}>
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
          note={salesPhotoNote}
          setNote={setSalesPhotoNote}
          photo={salesPhotoAttachment}
        />
        <button type="button" className="primary-action" disabled={salesAnySubmitting || !session} onClick={handleSalesSubmit}>{isSalesSubmitting ? 'Saving…' : salesSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
        </fieldset>
      </section>

      <section className={isSalesStep2Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
        <div className="step-heading">
          <button type="button" className="step-toggle step-title-toggle" aria-expanded={isSalesStep2Open} onClick={() => setIsSalesStep2Open((open) => !open)}>
            <span className="step-pill">Step 2</span><h3>Customer & requirement details</h3><span className="step-collapsed-hint">Contact, phone, address, product</span>
          </button>
          {isSalesStep2Complete && (
            <button type="button" className="step-header-icon-action" aria-label={isSalesStep2Editing ? 'Lock Step 2' : 'Edit Step 2'} onClick={() => setIsSalesStep2Editing((editing) => !editing)}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        {isSalesStep2Open && <div className={isSalesStep2Locked ? 'step-body saved-details-locked' : 'step-body'}>
        <fieldset className="saved-details-fieldset" disabled={isSalesStep2Locked}>
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
        </fieldset>
        </div>}
      </section>

      <section className={isSalesStep3Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
        <div className="step-heading">
          <button type="button" className="step-toggle step-title-toggle" aria-expanded={isSalesStep3Open} onClick={() => setIsSalesStep3Open((open) => !open)}>
            <span className="step-pill">Step 3</span><h3>Quote & office details</h3><span className="step-collapsed-hint">Quote status, support, office notes</span>
          </button>
          {isSalesStep3Complete && (
            <button type="button" className="step-header-icon-action" aria-label={isSalesStep3Editing ? 'Lock Step 3' : 'Edit Step 3'} onClick={() => setIsSalesStep3Editing((editing) => !editing)}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        {isSalesStep3Open && <div className={isSalesStep3Locked ? 'step-body saved-details-locked' : 'step-body'}>
        <fieldset className="saved-details-fieldset" disabled={isSalesStep3Locked}>
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
        <button type="button" aria-label="Save Step 3" className={salesSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={salesAnySubmitting || !salesSaveResult} onClick={handleSalesStep3Submit}>{isSalesStep3Submitting ? 'Saving…' : salesSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
        </fieldset>
        </div>}
      </section>

    </ScreenPanel>
  );

  const renderService = () => {
    const serviceAnySubmitting = isServiceSubmitting || isServiceStep2Submitting || isServiceStep3Submitting;
    return (
      <ScreenPanel title="Service visit">
        {serviceSaveResult && (
          <>
            <section className="saved-entry-summary-card">
              <div className="saved-entry-summary-top">
                <div>
                  <span className="saved-entry-eyebrow">Saved Service Entry</span>
                  <strong>{serviceCustomerName || serviceSaveResult.serviceRecord.customerName}</strong>
                  <small>{[serviceContactPerson, serviceEquipmentName, serviceSaveResult.visit.agentName].filter(Boolean).join(' • ')}</small>
                </div>
                <span className="saved-entry-status-pill">{serviceSaveResult.visit.nextAction === 'parts_required' ? 'Parts required' : serviceSaveResult.visit.nextAction === 'next_visit_needed' ? 'Next visit' : serviceSaveResult.visit.nextAction === 'closed' ? 'Closed' : 'No follow-up'}</span>
              </div>
              <div className="saved-entry-meta-grid">
                <div><span>Last update</span><strong>{formatVisitWhen(serviceSaveResult.visit)}</strong></div>
                <div><span>Next visit</span><strong>{serviceSaveResult.visit.nextVisitDate ? formatShortDate(serviceSaveResult.visit.nextVisitDate) : 'Not needed'}</strong></div>
              </div>
              <div className="saved-entry-step-chips" aria-label="Service saved step status">
                <span>Step 1 saved</span>
                <span className={isServiceStep2Complete ? '' : 'pending'}>Step 2 {isServiceStep2Complete ? 'saved' : 'pending'}</span>
                <span className={isServiceStep3Complete ? '' : 'pending'}>Step 3 {isServiceStep3Complete ? 'saved' : 'pending'}</span>
              </div>
            </section>

            <section className="saved-entry-action-card">
              <h3>What do you want to do now?</h3>
              <button type="button" className="primary-action" onClick={() => { setShowServiceFollowUpComposer((open) => !open); if (serviceNextAction === 'no_follow_up' || serviceNextAction === 'closed') setServiceNextAction('next_visit_needed'); }}>Add follow-up {nextServiceFollowUpNumber}</button>
              <div className="saved-entry-action-grid">
                {(!isServiceStep2Complete || !isServiceStep3Complete) && (
                  <button type="button" className="secondary-action" onClick={() => { setIsServiceStep2Open(!isServiceStep2Complete); setIsServiceStep3Open(isServiceStep2Complete && !isServiceStep3Complete); }}>Complete pending details</button>
                )}
                <button type="button" className="secondary-action" onClick={() => setIsServiceSavedDetailsEditing(true)}>Edit original details</button>
              </div>
            </section>

            {showServiceFollowUpComposer && (
              <section className="saved-followup-card simplified-followup-card">
                <h3>Follow-up {nextServiceFollowUpNumber} details</h3>
                <div className="inline-field-grid">
                  <label className="field-card">
                    <span>Next status</span>
                    <select aria-label="Service follow-up status" value={serviceNextAction} onChange={(event) => setServiceNextAction(event.target.value as FrontendServiceNextAction)}>
                      <option value="parts_required">Parts required</option>
                      <option value="next_visit_needed">Next visit needed</option>
                      <option value="no_follow_up">No follow-up</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                  {(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed') && (
                    <label className="field-card">
                      <span>Next date</span>
                      <input aria-label="Service follow-up next date" type="date" value={serviceNextVisitDate} onChange={(event) => setServiceNextVisitDate(event.target.value)} />
                    </label>
                  )}
                </div>
                {serviceContinuationNeedsNote && (
                  <label className="field-card">
                    <span>Follow-up note</span>
                    <textarea aria-label="Service follow-up note" value={serviceWorkDone} onChange={(event) => setServiceWorkDone(event.target.value)} placeholder="What happened now?" rows={2} />
                  </label>
                )}
                <button type="button" className="primary-action" disabled={serviceAnySubmitting || !session} onClick={handleServiceSubmit}>{isServiceSubmitting ? 'Saving…' : serviceContinuationNeedsNote ? 'Save follow-up' : 'Save status'}</button>
              </section>
            )}

            <section className="visit-updates-card" aria-label="Service visit updates">
              <div className="section-title compact-section-title">
                <h3>Visit updates</h3>
                <span>{serviceVisitHistory.length} saved</span>
              </div>
              <div className="followup-history-card compact-followup-history">
                {serviceVisitHistory.map((visit) => (
                  <div key={visit.id} className="followup-history-row">
                    <span>{visit.visitNumber === 1 ? 'Original visit' : `Follow-up ${visit.visitNumber}`}</span>
                    <strong>{visit.workDone || 'Status updated'}</strong>
                    <small>{formatVisitWhen(visit)}{visit.nextVisitDate ? ` • Next: ${formatShortDate(visit.nextVisitDate)}` : ''}</small>
                  </div>
                ))}
              </div>
            </section>

          </>
        )}
        <section className={serviceSaveResult && !isServiceSavedDetailsEditing ? 'step-card saved-details-locked' : 'step-card'}>
          <div className="step-heading">
            <div><span className="step-pill">Step 1</span><h3>Original service details</h3>{serviceSaveResult && <p>{isServiceSavedDetailsEditing ? 'Editing original saved details' : 'Saved details locked'}</p>}</div>
            {serviceSaveResult && (
              <button type="button" className="inline-edit-action" onClick={() => setIsServiceSavedDetailsEditing((editing) => !editing)}>
                {isServiceSavedDetailsEditing ? 'Lock details' : 'Edit saved details'}
              </button>
            )}
          </div>
          <fieldset className="saved-details-fieldset" disabled={Boolean(serviceSaveResult && !isServiceSavedDetailsEditing)}>
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
            note={servicePhotoNote}
            setNote={setServicePhotoNote}
            photo={servicePhotoAttachment}
          />
          <button type="button" className="primary-action" disabled={serviceAnySubmitting || !session} onClick={handleServiceSubmit}>{isServiceSubmitting ? 'Saving…' : serviceSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
          </fieldset>
        </section>

        <section className={isServiceStep2Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
          <div className="step-heading">
            <button type="button" className="step-toggle step-title-toggle" aria-expanded={isServiceStep2Open} onClick={() => setIsServiceStep2Open((open) => !open)}>
              <span className="step-pill">Step 2</span><h3>Customer, equipment, issue</h3><span className="step-collapsed-hint">Contact, equipment, serial, issue</span>
            </button>
            {isServiceStep2Complete && (
              <button type="button" className="step-header-icon-action" aria-label={isServiceStep2Editing ? 'Lock Step 2' : 'Edit Step 2'} onClick={() => setIsServiceStep2Editing((editing) => !editing)}>
                <Pencil size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          {isServiceStep2Open && <div className={isServiceStep2Locked ? 'step-body saved-details-locked' : 'step-body'}>
          <fieldset className="saved-details-fieldset" disabled={isServiceStep2Locked}>
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
          </fieldset>
          </div>}
        </section>

        <section className={isServiceStep3Open ? 'step-card step-card-open' : 'step-card step-card-collapsed'}>
          <div className="step-heading">
            <button type="button" className="step-toggle step-title-toggle" aria-expanded={isServiceStep3Open} onClick={() => setIsServiceStep3Open((open) => !open)}>
              <span className="step-pill">Step 3</span><h3>Parts & office details</h3><p>For service closure and admin reporting.</p><span className="step-collapsed-hint">Parts, support, final notes</span>
            </button>
            {isServiceStep3Complete && (
              <button type="button" className="step-header-icon-action" aria-label={isServiceStep3Editing ? 'Lock Step 3' : 'Edit Step 3'} onClick={() => setIsServiceStep3Editing((editing) => !editing)}>
                <Pencil size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          {isServiceStep3Open && <div className={isServiceStep3Locked ? 'step-body saved-details-locked' : 'step-body'}>
          <fieldset className="saved-details-fieldset" disabled={isServiceStep3Locked}>
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
          <label className="field-card"><span>Final remarks</span><textarea aria-label="Service final remarks" value={serviceFinalRemarks} onChange={(event) => setServiceFinalRemarks(event.target.value)} placeholder="Optional customer confirmation / remarks" rows={2} /></label>
          <label className="field-card"><span>Notes for office</span><textarea aria-label="Service office notes" value={serviceOfficeNotes} onChange={(event) => setServiceOfficeNotes(event.target.value)} placeholder="Optional office notes" rows={2} /></label>
          <button type="button" aria-label="Save Step 3" className={serviceSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={serviceAnySubmitting || !serviceSaveResult} onClick={handleServiceStep3Submit}>{isServiceStep3Submitting ? 'Saving…' : serviceSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
          </fieldset>
          </div>}
        </section>

      </ScreenPanel>
    );
  };

  const renderCheckIn = () => {
    if (isCheckedIn) {
      return (
        <ScreenPanel title="Attendance" subtitle="You are already checked in for today.">
          <div className="attendance-status-card attendance-live-card">
            <div className="attendance-status-icon"><CheckCircle2 size={20} /></div>
            <div>
              <label>Already checked in</label>
              <strong>Started at {attendanceStartedLabel}</strong>
              <span>{savedWorkTypeLabel}</span>
            </div>
          </div>
          <div className="attendance-action-stack">
            <button type="button" className="primary-action attendance-checkout-action" disabled={!session || isAttendanceBusy} onClick={() => void handleAttendanceAction()}>{isAttendanceBusy ? 'Saving…' : 'Check out now'}</button>
            <button type="button" className="secondary-action" onClick={() => goToScreen('home')}>Continue work</button>
          </div>
          <div className="form-card attendance-help-card">
            <label>If you forgot yesterday</label>
            <span>Start today normally. Yesterday will stay marked for office review.</span>
          </div>
        </ScreenPanel>
      );
    }


    return (
    <ScreenPanel title={isCheckedOut ? 'Check in again' : 'Check in'} subtitle={isCheckedOut ? 'Previous session is closed. Start a new session if you are back at work.' : 'Choose today’s work plan before starting field work.'}>
      {isCheckedOut && (
        <div className="attendance-status-card attendance-complete-card">
          <div className="attendance-status-icon"><CheckCircle2 size={20} /></div>
          <div>
            <label>Last session checked out</label>
            <strong>Finished at {attendanceEndedLabel}</strong>
            <span>{savedWorkTypeLabel}</span>
          </div>
        </div>
      )}
      <div className="attendance-status-card attendance-ready-card">
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
      <button type="button" className="primary-action attendance-checkin-action" disabled={!session || isAttendanceBusy || !workTypes.length} onClick={handleCheckInSubmit}>{isAttendanceBusy ? 'Saving…' : isCheckedOut ? 'Check in again' : 'Check in now'}</button>
      <button type="button" className="secondary-action" onClick={() => goToScreen('attendance')}>View attendance</button>
    </ScreenPanel>
    );
  };

  const renderAttendance = () => {
    const todayStatus = isCheckedIn ? 'Checked in' : isCheckedOut ? 'Checked out' : 'Not checked in yet';
    const todayDetail = isCheckedIn
      ? `Started at ${attendanceStartedLabel} • ${savedWorkTypeLabel}`
      : isCheckedOut
        ? `Finished at ${attendanceEndedLabel} • ${savedWorkTypeLabel} • Check in again if you return`
        : 'Choose work type, add location, then check in.';
    const todayLog = isCheckedIn
      ? { date: 'Today', status: 'Checked in', detail: todayDetail }
      : isCheckedOut
        ? { date: 'Today', status: 'Checked out', detail: todayDetail }
        : { date: 'Today', status: 'Ready to check in', detail: `Not started yet • ${workTypes.join(' + ') || 'Choose work type'}` };
    const attendanceLogs = [todayLog, ...sampleAttendanceLogs.filter((log) => log.date !== 'Today')];
    return (
      <ScreenPanel title="Attendance" subtitle="Track today, weekly attendance, and leave status in one place.">
        <div className={`attendance-status-card ${isCheckedIn ? 'attendance-live-card' : isCheckedOut ? 'attendance-complete-card' : 'attendance-ready-card'}`}>
          <div className="attendance-status-icon"><Clock3 size={20} /></div>
          <div className="attendance-status-main">
            <label>Today’s status</label>
            <strong>{todayStatus}</strong>
            <span>{todayDetail}</span>
            {(isCheckedIn || isCheckedOut) && (
              <div className="attendance-status-badges" aria-label="Saved work mode">
                {['Sales visit', 'Service visit', 'In office'].filter((type) => savedAttendanceWorkTypes.includes(type)).map((type) => (
                  <span key={type} className="work-type-badge work-type-selected">✓ {type}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {!isCheckedIn && !isCheckedOut && (
          <div className="work-type-card">
            <label>Today’s work type</label>
            <p>Select one or more before check-in.</p>
            <div className="work-type-badges">
              {['Sales visit', 'Service visit', 'In office'].map((type) => {
                const selected = savedAttendanceWorkTypes.includes(type);
                return (
                  <button key={type} type="button" className={selected ? 'work-type-badge work-type-selected' : 'work-type-badge'} onClick={() => toggleWorkType(type)}>
                    {selected ? '✓ ' : ''}{type}
                  </button>
                );
              })}
            </div>
            <span>{workTypes.length ? `Marked as: ${workTypes.join(' + ')}` : 'Choose field work, office work, or both.'}</span>
          </div>
        )}
        <div className="form-card highlighted-card location-capture-card">
          <label>GPS capture</label>
          <p>{currentLocationSummary}</p>
          <button type="button" className="secondary-action location-capture-action" disabled={isLocationCapturing} onClick={() => void captureCurrentLocation('attendance')}>
            {isLocationCapturing ? 'Getting location…' : currentGps ? 'Refresh current location' : 'Use current location'}
          </button>
        </div>
        <button type="button" className={`primary-action attendance-main-action ${isCheckedIn ? 'attendance-checkout-action' : 'attendance-checkin-action'}`} disabled={!session || isAttendanceBusy} onClick={() => isCheckedIn ? void handleAttendanceAction() : goToScreen('checkin')}>{isAttendanceBusy ? 'Saving…' : attendanceAction}</button>
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
          <span>{leaveRequest ? `${formatShortDate(leaveRequest.fromDate)} to ${formatShortDate(leaveRequest.toDate)} • ${leaveRequest.reason}` : 'No leave requests submitted.'}</span>
        </div>
        <button type="button" className="secondary-action" onClick={() => goToScreen('leave')}>Request leave</button>
      </ScreenPanel>
    );
  };

  const renderLeave = () => (
    <ScreenPanel title="Leave request" subtitle="Send a simple request for admin approval.">
      <div className="form-card highlighted-card leave-summary-card">
        <label>Request summary</label>
        <span>{leaveFromDate ? formatShortDate(leaveFromDate) : 'From date'} to {leaveToDate ? formatShortDate(leaveToDate) : 'To date'}</span>
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
          <span>{formatShortDate(leaveRequest.fromDate)} to {formatShortDate(leaveRequest.toDate)} • {leaveRequest.reason}</span>
          {leaveRequest.note && <span>Note: {leaveRequest.note}</span>}
        </div>
      )}
      <div className="section-label">Leave history</div>
      <div className="entry-row">
        <div><strong>{leaveRequest ? `${formatShortDate(leaveRequest.fromDate)} to ${formatShortDate(leaveRequest.toDate)}` : 'No leave request yet'}</strong><p>{leaveRequest ? leaveRequest.reason : 'Submit a request to track approval status.'}</p></div>
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
      week: { title: 'Weekly report', range: 'This week', sales: 'In downloaded report', service: 'In downloaded report', attendance: 'In downloaded report', followUps: 'In downloaded report', leave: leaveStatus },
      month: { title: 'Monthly report', range: 'This month', sales: 'In downloaded report', service: 'In downloaded report', attendance: 'In downloaded report', followUps: 'In downloaded report', leave: leaveStatus },
      custom: { title: 'Custom date report', range: `${formatShortDate(reportFromDate)} to ${formatShortDate(reportToDate)}`, sales: 'In downloaded report', service: 'In downloaded report', attendance: 'In downloaded report', followUps: 'In downloaded report', leave: leaveStatus },
    };
    const activeReport = reportCopy[reportPeriod];
    const kindLabels: Record<AgentReportKind, { title: string; helper: string }> = {
      attendance: { title: 'Attendance report', helper: 'Check-in, check-out, working days, leave' },
      visits: { title: 'Visit report', helper: 'Sales visits, service visits, follow-ups' },
      combined: { title: 'Combined work report', helper: 'Attendance + visits + leave in one report' },
    };
    const downloadAgentReport = async () => {
      if (!session) {
        setScreenNotice({ title: 'Login needed', message: 'Please log in again before downloading the report.', tone: 'warning' });
        return;
      }
      try {
        const pdfUrl = await crystalBioFrontendApi.downloadAgentReportPdf(session, { fromDate: reportFromDate, toDate: reportToDate, kind: reportKind });
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `crystalbio-my-${reportKind}-report-${formatDateToken(reportFromDate)}-to-${formatDateToken(reportToDate)}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        if (pdfUrl.startsWith('blob:')) window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
        setScreenNotice({
          title: 'Report downloaded',
          message: `${kindLabels[reportKind].title} for ${activeReport.range} download started.`,
          tone: 'success',
        });
      } catch (error) {
        rememberLaunchIssue('Agent report PDF', error);
        setScreenNotice({ title: 'Report download failed', message: error instanceof Error ? error.message : 'Could not download the report PDF.', tone: 'error' });
      }
    };

    return (
      <ScreenPanel title="My reports" subtitle="Choose one report type and date range, then download.">
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

          <button type="button" className="primary-action single-report-generate" onClick={() => void downloadAgentReport()}>Download report</button>
          <p className="report-approval-note">Downloads a real PDF from saved field entries.</p>
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
    const adminAttendanceRecords = (adminReport?.attendanceDetails ?? [])
      .map((record) => ({
        ...record,
        checkInTime: record.checkInTime || record.checkInAt || '',
        checkOutTime: record.checkOutTime || record.checkOutAt,
      }))
      .filter((record) => record.checkInTime);
    const attendanceRecordsByAgent = new Map<string, typeof adminAttendanceRecords>();
    adminAttendanceRecords.forEach((record) => {
      const existing = attendanceRecordsByAgent.get(record.agentId) ?? [];
      existing.push(record);
      attendanceRecordsByAgent.set(record.agentId, existing);
    });
    attendanceRecordsByAgent.forEach((records) => {
      records.sort((left, right) => new Date(right.checkInTime).getTime() - new Date(left.checkInTime).getTime());
    });
    const backendRows: AdminActivityRow[] = (adminReport?.agentSummaries ?? []).map((summary) => {
      const agentAttendanceRecords = attendanceRecordsByAgent.get(summary.agentId) ?? [];
      const latestAttendance = agentAttendanceRecords.find((record) => record.status === summary.attendanceStatus) ?? agentAttendanceRecords[0];
      const totalVisits = summary.salesVisitCount + summary.serviceVisitCount;
      const needsReview = summary.attendanceStatus === 'not_checked_in' || summary.followUpsDue.length > 0;
      const roleKey = adminRoleKeyForSummary(summary);
      return {
        id: summary.agentId,
        name: summary.agentName,
        role: adminRoleLabel(roleKey),
        roleKey,
        attendance: summary.attendanceStatus.replace(/_/g, ' '),
        attendanceCheckInTime: latestAttendance?.checkInTime,
        attendanceCheckOutTime: latestAttendance?.checkOutTime,
        attendanceSessionCount: agentAttendanceRecords.length,
        attendanceAutoCheckedOut: latestAttendance?.autoCheckedOut,
        attendanceWorkTypes: latestAttendance?.workTypes,
        visits: totalVisits ? `${summary.salesVisitCount} sales • ${summary.serviceVisitCount} service` : 'No visit update yet',
        status: needsReview ? 'Needs check' : 'Ready',
        chipClass: needsReview ? 'chip chip-warning' : 'chip chip-soft',
        salesVisitCount: summary.salesVisitCount,
        serviceVisitCount: summary.serviceVisitCount,
        followUpsDue: summary.followUpsDue,
      };
    });
    const adminRows = backendRows;
    const overviewTodayEntries = teamVisitEntries.filter((entry) => isDateInRange(entry.visitDate, todayInput(), todayInput()));
    const totalVisits = teamVisitEntries.length ? overviewTodayEntries.length : adminRows.reduce((sum, row) => sum + row.salesVisitCount + row.serviceVisitCount, 0);
    const checkedInCount = adminRows.filter((row) => row.attendance === 'checked in').length;
    const needsReviewCount = adminRows.filter((row) => row.status !== 'Ready').length;
    const followUpCount = adminRows.reduce((sum, row) => sum + row.followUpsDue.length, 0);
    const period = {
      label: adminPeriod === 'custom' ? `${formatShortDate(adminReportFromDate)} to ${formatShortDate(adminReportToDate)}` : adminPeriod === 'today' ? 'Today' : adminPeriod === 'week' ? 'This week' : 'This month',
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
    const reportSubmittedEntries = teamVisitEntries.filter((entry) => {
      if (!isDateInRange(entry.visitDate, adminReportFromDate, adminReportToDate)) return false;
      if (adminReportScope === 'office') return true;
      const agentRow = adminRows.find((row) => row.id === entry.agentId || row.name === entry.agentName);
      if (adminReportScope === 'sales') return entry.type === 'Sales' || agentRow?.roleKey === 'sales' || agentRow?.roleKey === 'both';
      if (adminReportScope === 'service') return entry.type === 'Service' || agentRow?.roleKey === 'service' || agentRow?.roleKey === 'both';
      return true;
    });
    const reportSalesVisits = teamVisitEntries.length ? reportSubmittedEntries.filter((entry) => entry.type === 'Sales').length : adminReportScopeRows.reduce((sum, row) => sum + row.salesVisitCount, 0);
    const reportServiceVisits = teamVisitEntries.length ? reportSubmittedEntries.filter((entry) => entry.type === 'Service').length : adminReportScopeRows.reduce((sum, row) => sum + row.serviceVisitCount, 0);
    const reportReadyAgents = adminReportScopeRows.filter((row) => row.status === 'Ready').length;
    const reportReviewAgents = adminReportScopeRows.filter((row) => row.status !== 'Ready').length;
    const overviewVisibleEntries = overviewTodayEntries.slice(0, 4);
    const adminAttendanceOverviewDetails = adminRows
      .filter((row) => row.attendance !== 'not checked in')
      .sort((left, right) => (left.attendance === right.attendance ? left.name.localeCompare(right.name) : left.attendance === 'checked in' ? -1 : 1))
      .map((row) => {
        const checkInLabel = `In ${formatAttendanceTime(row.attendanceCheckInTime)}`;
        const checkOutLabel = row.attendance === 'checked out'
          ? row.attendanceAutoCheckedOut
            ? `Auto checked out ${formatAttendanceTime(row.attendanceCheckOutTime)}`
            : `Out ${formatAttendanceTime(row.attendanceCheckOutTime)}`
          : 'Still checked in';
        const workModeLabel = row.attendanceWorkTypes?.length ? row.attendanceWorkTypes.join(' + ') : 'Mode not recorded';
        const sessionNote = row.attendanceSessionCount > 1 ? ` • ${row.attendanceSessionCount} sessions today` : '';
        return {
          key: row.id,
          detail: `${row.name} • ${row.role} • ${checkInLabel} • ${checkOutLabel}${sessionNote}`,
          workModeLabel,
        };
      });
    const overviewMetricDetails: Record<AdminOverviewMetric, string[]> = {
      visits: overviewVisibleEntries.length
        ? overviewVisibleEntries.map((entry) => `${displayCustomerName(entry.customer)} • ${entry.agentName} • ${entry.type}`)
        : ['No submitted Sales or Service forms today.'],
      checkedIn: adminAttendanceOverviewDetails.length
        ? adminAttendanceOverviewDetails.map((row) => `${row.detail} • ${row.workModeLabel}`)
        : ['No attendance check-in recorded today.'],
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
    const openOverviewEntryDetail = (entry: FrontendRecentVisitEntry) => {
      setExpandedAdminMetric(null);
      openAdminEntryDetail(entry, 'overview');
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
      setIsAdminMonitorRefreshing(true);
      try {
        if (isPublicMonitorPage) {
          const snapshot = await crystalBioFrontendApi.getPublicMonitorSnapshot();
          setAdminLoginActivity(snapshot.loginActivity);
          setAdminClientErrors(snapshot.clientErrors);
          setScreenNotice({ title: 'Monitoring refreshed', message: 'Latest public monitor records are showing.', tone: 'success' });
          return;
        }
        if (!session || session.role !== 'admin') {
          setScreenNotice({ title: 'Admin login needed', message: 'Login as admin before opening monitoring.', tone: 'warning' });
          return;
        }
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
    const reportVisitCount = reportSalesVisits + reportServiceVisits;
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
      pushAdminDetailHistory({ crystalBioAdminApprovalDetail: approvalId });
      setSelectedAdminApproval(approvalId);
      setAdminTab('approvals');
      setScreenNotice(null);
    };
    const openAdminAgentDetail = (agentId: string) => {
      pushAdminDetailHistory({ crystalBioAdminAgentDetail: agentId });
      setExpandedAgentActivityId(agentId);
      setScreenNotice(null);
    };
    const openAdminSeatProfile = (seatId: string) => {
      pushAdminDetailHistory({ crystalBioAdminProfileDetail: seatId });
      setSelectedAdminSeatId(seatId);
      setAdminAgentsView('profile');
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
      if (adminFieldEntryTypeFilter !== 'all' && entry.type !== adminFieldEntryTypeFilter) return false;
      if (!normalizedAdminFieldSearch) return true;
      return [displayCustomerName(entry.customer), entry.customer, entry.agentName, entry.type, entry.status, entry.visitDate, entry.visitTime]
        .some((value) => String(value ?? '').toLowerCase().includes(normalizedAdminFieldSearch));
    });
    const displayedAdminFieldEntries = showAllAdminFieldEntries ? visibleAdminFieldEntries : visibleAdminFieldEntries.slice(0, 10);
    const hiddenAdminFieldEntryCount = Math.max(visibleAdminFieldEntries.length - displayedAdminFieldEntries.length, 0);
    const fieldEntriesForAgent = (row: AdminActivityRow) => teamVisitEntries.filter((entry) => entry.agentId === row.id || (!entry.agentId && entry.agentName === row.name));
    const visibleTeamEntries = teamVisitEntries.filter((entry) => {
      const matchesAgent = adminEntryAgentFilter === 'all' || entry.agentId === adminEntryAgentFilter || (!entry.agentId && entry.agentName === adminEntryAgentFilter);
      const matchesType = adminEntryTypeFilter === 'all' || entry.type === adminEntryTypeFilter;
      return matchesAgent && matchesType;
    });
    const shownTeamEntries = showAllAdminEntries ? visibleTeamEntries : visibleTeamEntries.slice(0, 5);
    const selectedAdminEntry = selectedAdminEntryId ? (adminEntryDetailCache[selectedAdminEntryId] ?? teamVisitEntries.find((entry) => entry.id === selectedAdminEntryId)) : null;
    const visibleCheckedInCount = visibleAgentActivityRows.filter((row) => row.attendance === 'checked in').length;
    const visibleMissingCount = visibleAgentActivityRows.filter((row) => row.status !== 'Ready').length;
    const visibleFollowUpCount = visibleAgentActivityRows.filter((row) => row.followUpsDue.length > 0).length;
    const checkedOutCount = adminRows.filter((row) => row.attendance === 'checked out').length;
    const notCheckedInCount = adminRows.filter((row) => row.attendance === 'not checked in').length;
    const selectedAgentActivityRow = expandedAgentActivityId ? adminRows.find((row) => row.id === expandedAgentActivityId) : null;
    const agentFilterOptions: Array<{ key: AdminAgentFilter; label: string }> = [
      { key: 'all', label: 'All agents' },
      { key: 'sales', label: 'Sales' },
      { key: 'service', label: 'Service' },
      { key: 'office', label: 'In office' },
      { key: 'checkedIn', label: 'Checked in' },
      { key: 'notCheckedIn', label: 'Not in' },
      { key: 'checkedOut', label: 'Checked out' },
    ];
    const selectAdminAgentFilter = (filter: AdminAgentFilter) => {
      setAdminAgentFilter(filter);
      setExpandedAgentActivityId(null);
      setScreenNotice(null);
    };
    const workModeForAgent = (row: AdminActivityRow) => row.attendanceWorkTypes?.length ? row.attendanceWorkTypes.join(' + ') : 'Mode not recorded';
    const lastActivityForAgent = (row: AdminActivityRow) => {
      const [latestEntry] = fieldEntriesForAgent(row);
      if (latestEntry) return formatVisitWhen(latestEntry);
      if (row.attendanceCheckInTime) return formatAttendanceTime(row.attendanceCheckInTime);
      return 'No activity today';
    };
    const openAgentEntriesInFieldEntry = (row: AdminActivityRow) => {
      setAdminFieldEntryScope('all');
      setAdminFieldEntrySearch(row.name);
      setSelectedAdminEntryId(null);
      setSelectedAdminEntryReturnTab('fieldEntry');
      setAdminTab('fieldEntry');
      setScreenNotice(null);
    };
    const selectedSeat = adminSeats.find((seat) => seat.id === selectedAdminSeatId) ?? adminSeats[0];
    const activeSeatCount = adminSeats.filter((seat) => seat.status === 'active').length;
    const invitedSeatCount = adminSeats.filter((seat) => seat.status === 'invited' || seat.status === 'expired').length;
    const inactiveSeatCount = adminSeats.filter((seat) => seat.status === 'inactive').length;
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
        downloadLink.download = `crystalbio-${reportName}-${formatDateToken(adminReportFromDate)}-to-${formatDateToken(adminReportToDate)}.pdf`;
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
        <div className="admin-detail-back-wrap">
          <button type="button" className="admin-detail-back" onClick={onBack}><ChevronLeft size={17} /> {backLabel}</button>
        </div>
        <div className="admin-entry-detail-head">
          <span className="admin-entry-type-label">{selectedAdminEntry.type}</span>
          <strong>{displayCustomerName(selectedAdminEntry.customer)}</strong>
          <p>{entryDetailValue(selectedAdminEntry, 'Contact person') || 'Contact not added'} • {selectedAdminEntry.type === 'Sales' ? (entryDetailValue(selectedAdminEntry, 'Brand / model') || entryDetailValue(selectedAdminEntry, 'Product type') || 'Product not added') : (entryDetailValue(selectedAdminEntry, 'Equipment') || 'Equipment not added')}</p>
          <small>{selectedAdminEntry.type} agent: {selectedAdminEntry.agentName}</small>
        </div>
        {selectedAdminEntry.agentId === session?.agentId && (
          <button type="button" className="primary-action admin-entry-edit-action" onClick={() => openSavedVisitEntry(selectedAdminEntry)}>
            Edit this entry
          </button>
        )}
        <div className="admin-entry-detail-grid">
          {(detailRowsWithoutAdminClutter(selectedAdminEntry).length ? detailRowsWithoutAdminClutter(selectedAdminEntry) : [
            { label: 'Status', value: selectedAdminEntry.status },
            { label: 'Next', value: selectedAdminEntry.next },
          ]).map((row) => (
            <div key={`${row.label}-${row.value}`}><span>{row.label}</span><strong>{displayDetailValue(row)}</strong></div>
          ))}
        </div>
        {loadingAdminEntryDetailId === selectedAdminEntry.id && <div className="empty-state">Loading photo/proof details…</div>}
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
              selectedAdminEntry && selectedAdminEntryReturnTab === 'overview' ? (
                renderAdminEntryDetail('Back to dashboard', closeAdminEntryDetail)
              ) : <>
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
                {expandedAdminMetric && (() => {
                  const metric = adminOverviewMetrics.find((item) => item.key === expandedAdminMetric);
                  const detailRows = overviewMetricDetails[expandedAdminMetric];
                  const shownDetailRows = expandedAdminMetric === 'checkedIn' ? detailRows : detailRows.slice(0, 4);
                  return (
                  <section className="admin-metric-expanded-card" aria-label={`${metric?.label ?? 'Overview'} details`}>
                    <div className="admin-report-heading"><label>{expandedAdminMetric === 'checkedIn' ? 'Attendance today' : metric?.label}</label><span>{expandedAdminMetric === 'checkedIn' ? `${checkedInCount} active` : detailRows.length}</span></div>
                    <div className="admin-metric-expanded-list">
                      {expandedAdminMetric === 'visits' && overviewVisibleEntries.length
                        ? overviewVisibleEntries.map((entry) => (
                          <button key={entry.id} type="button" className="admin-overview-entry-button" onClick={() => openOverviewEntryDetail(entry)}>
                            <strong>{displayCustomerName(entry.customer)}</strong>
                            <small>{entry.agentName} • {entry.type}</small>
                            <em>Open</em>
                          </button>
                        ))
                        : expandedAdminMetric === 'checkedIn' && adminAttendanceOverviewDetails.length
                        ? adminAttendanceOverviewDetails.map((detail) => (
                          <span key={detail.key}>{detail.detail} <span className={detail.workModeLabel === 'Mode not recorded' ? 'chip chip-info' : 'chip chip-soft'}>{detail.workModeLabel}</span></span>
                        ))
                        : shownDetailRows.map((detail) => <span key={detail}>{detail}</span>)}
                    </div>
                    {expandedAdminMetric === 'leave' && adminLeaveRequests.some((request) => request.status === 'pending') && <button type="button" className="secondary-action admin-view-all-entries" onClick={() => openAdminTab('approvals')}>Open approvals</button>}
                    {expandedAdminMetric === 'followUps' && followUpCount > 0 && <button type="button" className="secondary-action admin-view-all-entries" onClick={() => openAdminTab('agents')}>Open agents</button>}
                  </section>
                  );
                })()}
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
                <p>{isPublicMonitorPage ? 'Periwinkle public monitor • no company login needed' : 'Bloom live view'}</p>
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
          selectedAdminEntry && selectedAdminEntryReturnTab === 'fieldEntry' ? (
            renderAdminEntryDetail('Back to field entries', closeAdminEntryDetail)
          ) : (
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
                <div className="admin-report-heading"><label>Field entries</label><span>{displayedAdminFieldEntries.length} of {visibleAdminFieldEntries.length} shown</span></div>
                <div className="admin-field-entry-filter" role="group" aria-label="Field entry list filter">
                  <button type="button" className={adminFieldEntryScope === 'mine' ? 'admin-field-entry-filter-active' : ''} onClick={() => { setAdminFieldEntryScope('mine'); setShowAllAdminFieldEntries(false); }}>My entries</button>
                  <button type="button" className={adminFieldEntryScope === 'all' ? 'admin-field-entry-filter-active' : ''} onClick={() => { setAdminFieldEntryScope('all'); setShowAllAdminFieldEntries(false); }}>All entries</button>
                </div>
                <div className="admin-field-entry-filter admin-field-entry-type-filter" role="group" aria-label="Field entry type filter">
                  <button type="button" className={adminFieldEntryTypeFilter === 'all' ? 'admin-field-entry-filter-active' : ''} onClick={() => { setAdminFieldEntryTypeFilter('all'); setShowAllAdminFieldEntries(false); }}>All types</button>
                  <button type="button" className={adminFieldEntryTypeFilter === 'Sales' ? 'admin-field-entry-filter-active' : ''} onClick={() => { setAdminFieldEntryTypeFilter('Sales'); setShowAllAdminFieldEntries(false); }}>Sales</button>
                  <button type="button" className={adminFieldEntryTypeFilter === 'Service' ? 'admin-field-entry-filter-active' : ''} onClick={() => { setAdminFieldEntryTypeFilter('Service'); setShowAllAdminFieldEntries(false); }}>Service</button>
                </div>
                <label className="search-card visit-search-card admin-field-entry-search">
                  <Search size={16} />
                  <input aria-label="Search field entries" value={adminFieldEntrySearch} onChange={(event) => { setAdminFieldEntrySearch(event.target.value); setShowAllAdminFieldEntries(false); }} placeholder="Search customer or agent" />
                </label>
                {visibleAdminFieldEntries.length ? (
                  <>
                    {displayedAdminFieldEntries.map((entry) => (
                      <button key={`admin-field-entry-${entry.id}`} type="button" className="admin-field-entry-item-card admin-click-row" onClick={() => openAdminEntryDetail(entry, 'fieldEntry')}>
                        <div className="admin-field-entry-item-main">
                          <strong>{displayCustomerName(entry.customer)}</strong>
                          <p>{entry.agentName}</p>
                          <small>{entry.type} • {formatVisitWhen(entry)} • {entry.status}</small>
                        </div>
                        <span className="admin-neutral-detail-action">View details</span>
                      </button>
                    ))}
                    {hiddenAdminFieldEntryCount > 0 && (
                      <button type="button" className="secondary-action admin-field-entry-show-all" onClick={() => setShowAllAdminFieldEntries(true)}>
                        Show all {visibleAdminFieldEntries.length} entries
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-state">No matching entries found.</div>
                )}
              </section>
            </>
          )
        )}

        {showApprovals && (
          activeApproval ? (
            <section className="admin-approval-detail-card">
              <button type="button" className="admin-detail-back" onClick={() => closeAdminApprovalDetail()}>
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
                {selectedAgentActivityRow ? (
                  <section className="admin-agent-detail-card" aria-label="Agent details">
                    <button type="button" className="admin-detail-back" onClick={() => closeAdminAgentDetail()}><ChevronLeft size={16} /> Back to agents</button>
                    <div className="admin-seat-profile-head admin-agent-detail-head">
                      <span className="profile-avatar"><UserRound size={22} /></span>
                      <div>
                        <p>{selectedAgentActivityRow.role}</p>
                        <strong>{selectedAgentActivityRow.name}</strong>
                        <span>{selectedAgentActivityRow.status === 'Ready' ? 'No immediate check needed' : 'Needs admin check'}</span>
                      </div>
                    </div>
                    <section className="admin-agent-detail-section">
                      <div className="admin-report-heading"><label>Today attendance</label><span className={selectedAgentActivityRow.attendance === 'checked in' ? 'chip chip-soft' : selectedAgentActivityRow.attendance === 'not checked in' ? 'chip chip-warning' : 'chip chip-info'}>{selectedAgentActivityRow.attendance}</span></div>
                      <div className="profile-info-card admin-seat-info-grid admin-agent-detail-grid">
                        <div><span>Check-in</span><strong>{formatAttendanceTime(selectedAgentActivityRow.attendanceCheckInTime)}</strong></div>
                        <div><span>Check-out</span><strong>{selectedAgentActivityRow.attendance === 'checked in' ? 'Still checked in' : selectedAgentActivityRow.attendanceAutoCheckedOut ? `Auto checked out ${formatAttendanceTime(selectedAgentActivityRow.attendanceCheckOutTime)}` : formatAttendanceTime(selectedAgentActivityRow.attendanceCheckOutTime)}</strong></div>
                        <div><span>Work mode</span><strong>{workModeForAgent(selectedAgentActivityRow)}</strong></div>
                        <div><span>Sessions</span><strong>{selectedAgentActivityRow.attendanceSessionCount || 0} today</strong></div>
                      </div>
                    </section>
                    <section className="admin-agent-detail-section">
                      <div className="admin-report-heading"><label>Activity summary</label><span>Today</span></div>
                      <div className="profile-info-card admin-seat-info-grid admin-agent-detail-grid">
                        <div><span>Sales visits</span><strong>{selectedAgentActivityRow.salesVisitCount}</strong></div>
                        <div><span>Service visits</span><strong>{selectedAgentActivityRow.serviceVisitCount}</strong></div>
                        <div><span>Follow-ups</span><strong>{selectedAgentActivityRow.followUpsDue.length ? `${selectedAgentActivityRow.followUpsDue.length} pending` : 'None'}</strong></div>
                        <div><span>Last active</span><strong>{lastActivityForAgent(selectedAgentActivityRow)}</strong></div>
                      </div>
                      {selectedAgentActivityRow.followUpsDue.length > 0 && (
                        <div className="admin-agent-followup-list">
                          {selectedAgentActivityRow.followUpsDue.slice(0, 3).map((detail) => <span key={detail}>{detail}</span>)}
                        </div>
                      )}
                      <button type="button" className="primary-action admin-agent-field-entry-link" onClick={() => openAgentEntriesInFieldEntry(selectedAgentActivityRow)}>View this agent’s entries</button>
                    </section>
                  </section>
                ) : (
                  <>
                    <section className="admin-agents-compact-head">
                      <div>
                        <p>Team today</p>
                        <span>Agent status, attendance, work mode, and follow-ups. Submitted forms stay under Field Entry.</span>
                      </div>
                    </section>
                    <section className="admin-agent-snapshot-card admin-agent-snapshot-top" aria-label="Team summary">
                      <button type="button" className={adminAgentFilter === 'checkedIn' ? 'admin-agent-snapshot-button admin-agent-snapshot-button-active' : 'admin-agent-snapshot-button'} aria-pressed={adminAgentFilter === 'checkedIn'} onClick={() => selectAdminAgentFilter('checkedIn')}><strong>{checkedInCount}</strong><span>Checked in</span></button>
                      <button type="button" className={adminAgentFilter === 'notCheckedIn' ? 'admin-agent-snapshot-button admin-agent-snapshot-button-active' : 'admin-agent-snapshot-button'} aria-pressed={adminAgentFilter === 'notCheckedIn'} onClick={() => selectAdminAgentFilter('notCheckedIn')}><strong>{notCheckedInCount}</strong><span>Not in</span></button>
                      <button type="button" className={adminAgentFilter === 'checkedOut' ? 'admin-agent-snapshot-button admin-agent-snapshot-button-active' : 'admin-agent-snapshot-button'} aria-pressed={adminAgentFilter === 'checkedOut'} onClick={() => selectAdminAgentFilter('checkedOut')}><strong>{checkedOutCount}</strong><span>Checked out</span></button>
                    </section>
                    <section className="admin-agent-filter-card" aria-label="Agent filters">
                      <div className="admin-report-heading"><label>Filters</label><span>{visibleAgentActivityRows.length} shown</span></div>
                      <div className="admin-agent-filter-pills" role="group" aria-label="Agent status filters">
                        {agentFilterOptions.map((option) => (
                          <button key={option.key} type="button" className={adminAgentFilter === option.key ? 'admin-agent-filter-pill admin-agent-filter-pill-active' : 'admin-agent-filter-pill'} aria-pressed={adminAgentFilter === option.key} onClick={() => selectAdminAgentFilter(option.key)}>{option.label}</button>
                        ))}
                      </div>
                    </section>
                    <section className="admin-report-list-card admin-agent-activity-list admin-people-list-card" aria-label="Agent list">
                      <div className="admin-report-heading">
                        <label>Agents</label>
                        <span>{visibleAgentActivityRows.length} shown</span>
                      </div>
                      {visibleAgentActivityRows.length ? visibleAgentActivityRows.map((row) => {
                        const workModeLabel = workModeForAgent(row);
                        return (
                          <button key={row.id} type="button" className="admin-agent-person-card admin-click-row" onClick={() => openAdminAgentDetail(row.id)}>
                            <div className="admin-agent-person-main">
                              <strong>{row.name}</strong>
                              <p>{row.role}</p>
                              <small>{row.attendance === 'checked in' ? `In ${formatAttendanceTime(row.attendanceCheckInTime)}` : row.attendance === 'checked out' ? row.attendanceAutoCheckedOut ? `Auto checked out ${formatAttendanceTime(row.attendanceCheckOutTime)}` : `Out ${formatAttendanceTime(row.attendanceCheckOutTime)}` : 'No check-in today'}</small>
                            </div>
                            <div className="admin-agent-person-meta">
                              <span className={row.attendance === 'checked in' ? 'chip chip-soft' : row.attendance === 'not checked in' ? 'chip chip-warning' : 'chip chip-info'}>{row.attendance}</span>
                              <span className={workModeLabel === 'Mode not recorded' ? 'chip chip-info' : 'chip chip-soft'}>{workModeLabel}</span>
                              <small>{row.salesVisitCount + row.serviceVisitCount} visits today • {row.followUpsDue.length} follow-ups</small>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="empty-state">No agents match this filter.</div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}


            {adminAgentsView === 'profile' && selectedSeat && (
              <section className="admin-seat-profile-card">
                <button type="button" className="admin-detail-back" onClick={() => closeAdminProfileDetail()}><ChevronLeft size={16} /> Back to profiles</button>
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
                <button type="button" className="admin-detail-back" onClick={() => closeAdminProfileDetail()}><ChevronLeft size={16} /> Back to profiles</button>
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
                <button type="button" className="admin-detail-back" onClick={() => closeAdminProfileDetail()}><ChevronLeft size={16} /> Back to profiles</button>
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
                    <button key={seat.id} type="button" className="admin-report-row admin-click-row" onClick={() => openAdminSeatProfile(seat.id)}>
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
              renderAdminEntryDetail('Back to reports', closeAdminEntryDetail)
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
                <button type="button" className="primary-action single-report-generate" onClick={downloadAdminPdf}>Download PDF</button>

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
              {screen === 'admin' && adminTab !== 'overview' && !selectedAdminEntryId && !isPublicMonitorPage && <button type="button" className="back-button" onClick={() => openAdminTab('overview')}><ChevronLeft size={17} /> Overview</button>}
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
              <h2>{screen === 'login' ? 'CrystalBio' : screen === 'admin' ? (isPublicMonitorPage ? 'Live monitor' : session?.role === 'admin' ? session.agentName : 'Admin') : session?.agentName ?? 'Field agent'}</h2>
            </div>
            {screen === 'admin' && !isPublicMonitorPage ? (
              <div className="header-action-cluster">
                <button type="button" className="avatar avatar-button" aria-label={adminTab === 'profiles' ? 'Admin profile selected' : 'Open admin profile'} onClick={() => openAdminTab('profiles')}><UsersRound size={21} /></button>
              </div>
            ) : (
              screen !== 'admin' ? (
                <button type="button" className="avatar avatar-button" aria-label={screen === 'profile' ? 'Profile selected' : 'Open profile'} disabled={screen === 'login'} onClick={() => goToScreen('profile')}><UserRound size={21} /></button>
              ) : null
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

          {photoPreview && (
            <div className="photo-preview-modal" role="dialog" aria-modal="true" aria-label="Photo preview">
              <div className="photo-preview-modal-card">
                <button type="button" className="photo-preview-close" onClick={() => setPhotoPreview(null)} aria-label="Close photo preview"><X size={17} /> Close</button>
                <img src={photoPreview.dataUrl} alt={`${photoPreview.label}: ${photoPreview.fileName}`} />
                <div className="photo-preview-caption">
                  <strong>{photoPreview.fileName}</strong>
                  {photoPreview.note && <span>{photoPreview.note}</span>}
                </div>
              </div>
            </div>
          )}

          {screen !== 'login' && !isPublicMonitorPage && <nav className={screen === 'admin' ? 'bottom-nav admin-bottom-nav' : 'bottom-nav'} aria-label={screen === 'admin' ? 'Admin navigation' : 'Agent navigation'}>
            {screen === 'admin' ? (
              [
                { label: 'Overview', tab: 'overview' as AdminTab, icon: Home },
                { label: 'Field entry', tab: 'fieldEntry' as AdminTab, icon: ClipboardList },
                { label: 'Agents', tab: 'agents' as AdminTab, icon: UsersRound },
                { label: 'Approvals', tab: 'approvals' as AdminTab, icon: CalendarCheck },
                { label: 'Reports', tab: 'adminReports' as AdminTab, icon: FileText },
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
