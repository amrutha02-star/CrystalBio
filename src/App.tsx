import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, ChevronLeft, ClipboardList, Clock3, FileText, Home, MapPin, Plus, Search, UserRound, UsersRound, X } from 'lucide-react';
import { sampleEntries } from './appData';
import { crystalBioFrontendApi, type FrontendAttendance, type FrontendLeaveRequest, type FrontendLoginInput, type FrontendSalesSaveResult, type FrontendSalesNextAction, type FrontendServiceSaveResult, type FrontendServiceNextAction, type FrontendServiceType, type FrontendSession } from './crystalBioFrontendApi';

type AppScreen = 'login' | 'home' | 'visits' | 'sales' | 'service' | 'checkin' | 'attendance' | 'leave' | 'reports' | 'profile' | 'admin';
type ReportPeriod = 'today' | 'week' | 'month' | 'custom';
type AgentReportKind = 'attendance' | 'visits' | 'combined';
type AdminAgentFilter = 'all' | 'sales' | 'service';
type AdminReportScope = 'office' | 'sales' | 'service' | 'rahul' | 'meera' | 'anil';
type AdminTab = 'overview' | 'agents' | 'approvals' | 'adminReports' | 'profiles';
type AdminApprovalId = 'meera-leave';
type AdminAgentsView = 'list' | 'add' | 'profile' | 'invite';
type AdminSeatStatus = 'invited' | 'active' | 'inactive' | 'expired';
type AdminSeat = {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  mobile: string;
  role: 'sales' | 'service' | 'admin';
  territory: string;
  status: AdminSeatStatus;
  lastActive: string;
};
type ToastNotice = { title: string; message: string; tone?: 'success' | 'info' | 'warning' | 'error' };

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


const initialAdminSeats: AdminSeat[] = [
  { id: 'seat_rahul', name: 'Rahul Sales', employeeId: 'CB-S-014', email: 'rahul.sales@crystalbio.in', mobile: '+91 98765 43210', role: 'sales', territory: 'Kochi', status: 'active', lastActive: 'Today, 10:42 AM' },
  { id: 'seat_meera', name: 'Meera Service', employeeId: 'CB-SE-008', email: 'meera.service@crystalbio.in', mobile: '+91 98765 43111', role: 'service', territory: 'Ernakulam', status: 'active', lastActive: 'Today, 9:58 AM' },
  { id: 'seat_anil', name: 'Anil Sales', employeeId: 'CB-S-021', email: 'anil.sales@crystalbio.in', mobile: '+91 98765 43009', role: 'sales', territory: 'Thrissur', status: 'invited', lastActive: 'Invite sent today' },
];

const sampleAttendanceLogs = [
  { date: 'Today', status: 'Ready to check in', detail: 'GPS will be saved when the agent taps Check in.' },
  { date: 'Yesterday', status: 'Checked out', detail: '9:18 AM to 6:04 PM' },
];

const screenOptions: AppScreen[] = ['login', 'home', 'visits', 'sales', 'service', 'checkin', 'attendance', 'leave', 'reports', 'profile', 'admin'];

const agentIdForScreen = (nextScreen: AppScreen) => (nextScreen === 'service' ? 'agent_3' : 'agent_2');
const loginInputForScreen = (nextScreen: AppScreen): FrontendLoginInput => {
  if (nextScreen === 'admin') return { loginCode: 'admin', passcode: 'admin1234' };
  if (nextScreen === 'service') return { loginCode: 'service1', passcode: '1234' };
  return { loginCode: 'sales1', passcode: '1234' };
};

const getInitialScreen = (): AppScreen => {
  if (typeof window === 'undefined') return 'login';
  const requestedScreen = new URLSearchParams(window.location.search).get('screen') as AppScreen | null;
  return requestedScreen && screenOptions.includes(requestedScreen) ? requestedScreen : 'login';
};

const getInitialAdminTab = (): AdminTab => {
  if (typeof window === 'undefined') return 'overview';
  const requestedTab = new URLSearchParams(window.location.search).get('adminTab') as AdminTab | null;
  return requestedTab && ['overview', 'agents', 'approvals', 'adminReports', 'profiles'].includes(requestedTab) ? requestedTab : 'overview';
};

const getInitialAdminApproval = (): AdminApprovalId | null => {
  if (typeof window === 'undefined') return null;
  const requestedApproval = new URLSearchParams(window.location.search).get('approval') as AdminApprovalId | null;
  return requestedApproval && ['meera-leave'].includes(requestedApproval) ? requestedApproval : null;
};

function App() {
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(() => getInitialScreen() === 'admin');
  const [session, setSession] = useState<FrontendSession | null>(null);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading logged-in agent…');
  const [screenNotice, setScreenNotice] = useState<ToastNotice | string | null>(null);
  const [loginCode, setLoginCode] = useState('sales1');
  const [passcode, setPasscode] = useState('1234');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('week');
  const [reportKind, setReportKind] = useState<AgentReportKind>('combined');
  const [reportFromDate, setReportFromDate] = useState('2026-06-01');
  const [reportToDate, setReportToDate] = useState('2026-06-08');
  const [adminPeriod, setAdminPeriod] = useState<ReportPeriod>('today');
  const [adminReportFromDate, setAdminReportFromDate] = useState('2026-06-01');
  const [adminReportToDate, setAdminReportToDate] = useState('2026-06-08');
  const [adminReportScope, setAdminReportScope] = useState<AdminReportScope>('office');
  const [expandedAdminReportId, setExpandedAdminReportId] = useState<string | null>('Rahul Sales');
  const [adminAgentFilter, setAdminAgentFilter] = useState<AdminAgentFilter>('all');
  const [adminTab, setAdminTab] = useState<AdminTab>(getInitialAdminTab);
  const [selectedAdminApproval, setSelectedAdminApproval] = useState<AdminApprovalId | null>(getInitialAdminApproval);
  const [adminAgentsView, setAdminAgentsView] = useState<AdminAgentsView>('list');
  const [selectedAdminSeatId, setSelectedAdminSeatId] = useState(initialAdminSeats[0].id);
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
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
  const [visitSearch, setVisitSearch] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>(['Sales visit']);
  const [checkInNote, setCheckInNote] = useState('');
  const [salesAccountName, setSalesAccountName] = useState('Apollo Diagnostics');
  const [salesContactPerson, setSalesContactPerson] = useState('Lab manager');
  const [salesDesignation, setSalesDesignation] = useState('Lab manager');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [salesDepartmentAddress, setSalesDepartmentAddress] = useState('');
  const [salesLeadSource, setSalesLeadSource] = useState('Field visit');
  const [salesProductType, setSalesProductType] = useState('Laboratory equipment');
  const [salesBrandName, setSalesBrandName] = useState('');
  const [salesEquipmentModel, setSalesEquipmentModel] = useState('');
  const [salesRequirement, setSalesRequirement] = useState('Biochemistry analyzer requirement');
  const [salesVisitNote, setSalesVisitNote] = useState('Requirement confirmed. Quote to be shared.');
  const [salesNextAction, setSalesNextAction] = useState<FrontendSalesNextAction>('follow_up_needed');
  const [salesFollowUpDate, setSalesFollowUpDate] = useState('2026-06-10');
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
  const [salesStep2Saved, setSalesStep2Saved] = useState(false);
  const [salesStep3Saved, setSalesStep3Saved] = useState(false);
  const [salesSaveResult, setSalesSaveResult] = useState<FrontendSalesSaveResult | null>(null);
  const [isSalesSubmitting, setIsSalesSubmitting] = useState(false);
  const [isSalesStep2Submitting, setIsSalesStep2Submitting] = useState(false);
  const [isSalesStep3Submitting, setIsSalesStep3Submitting] = useState(false);
  const [serviceCustomerName, setServiceCustomerName] = useState('Metro Lab');
  const [serviceContactPerson, setServiceContactPerson] = useState('Lab supervisor');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceEmail, setServiceEmail] = useState('');
  const [serviceDepartmentAddress, setServiceDepartmentAddress] = useState('');
  const [serviceEquipmentName, setServiceEquipmentName] = useState('Centrifuge');
  const [serviceBrandName, setServiceBrandName] = useState('');
  const [serviceModelName, setServiceModelName] = useState('');
  const [serviceSerialNumber, setServiceSerialNumber] = useState('CB-01');
  const [serviceIssueCategory, setServiceIssueCategory] = useState('Machine noise');
  const [serviceIssueDescription, setServiceIssueDescription] = useState('');
  const [serviceWarrantyAmc, setServiceWarrantyAmc] = useState('');
  const [serviceType, setServiceType] = useState<FrontendServiceType>('breakdown');
  const [serviceWorkDone, setServiceWorkDone] = useState('Diagnosed issue and checked machine performance.');
  const [serviceSupportRequired, setServiceSupportRequired] = useState(true);
  const [serviceNextAction, setServiceNextAction] = useState<FrontendServiceNextAction>('parts_required');
  const [serviceNextVisitDate, setServiceNextVisitDate] = useState('2026-06-09');
  const [servicePartsRequired, setServicePartsRequired] = useState('Bearing kit');
  const [servicePartsUsed, setServicePartsUsed] = useState('');
  const [serviceMachineStatus, setServiceMachineStatus] = useState('Working with observation');
  const [serviceSupportRequiredNote, setServiceSupportRequiredNote] = useState('');
  const [serviceFinalRemarks, setServiceFinalRemarks] = useState('');
  const [servicePhotoNote, setServicePhotoNote] = useState('');
  const [serviceOfficeNotes, setServiceOfficeNotes] = useState('Share parts availability with office.');
  const [serviceStep2Saved, setServiceStep2Saved] = useState(false);
  const [serviceStep3Saved, setServiceStep3Saved] = useState(false);
  const [serviceSaveResult, setServiceSaveResult] = useState<FrontendServiceSaveResult | null>(null);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [isServiceStep2Submitting, setIsServiceStep2Submitting] = useState(false);
  const [isServiceStep3Submitting, setIsServiceStep3Submitting] = useState(false);
  const isBackendConfigured = crystalBioFrontendApi.isBackendConfigured();

  useEffect(() => {
    if (isBackendConfigured && screen === 'login') {
      setStatusMessage('Enter login code and passcode.');
      return undefined;
    }
    let isMounted = true;
    crystalBioFrontendApi
      .login(isBackendConfigured ? loginInputForScreen(screen) : agentIdForScreen(screen))
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
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
      { label: 'Sales', hint: 'New visit', className: 'action-peach', icon: Plus, onClick: 'sales' as const },
      { label: 'Service', hint: 'Report', className: 'action-sky', icon: ClipboardList, onClick: 'service' as const },
      { label: 'Attendance', hint: 'Logs & leave', className: 'action-attendance', icon: CalendarCheck, onClick: 'attendance' as const },
    ],
    [attendanceAction, attendanceHint],
  );

  const toggleWorkType = (type: string) => {
    setWorkTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  };

  const handleAttendanceAction = async () => {
    if (!session) return;
    setIsAttendanceBusy(true);
    setStatusMessage(isCheckedIn ? 'Capturing check-out location…' : 'Capturing check-in location…');
    try {
      const nextAttendance = isCheckedIn
        ? await crystalBioFrontendApi.checkOut(session)
        : await crystalBioFrontendApi.checkIn(session);
      setAttendance(nextAttendance);
      setStatusMessage(
        nextAttendance.status === 'checked_in'
          ? 'Checked in. GPS saved for today.'
          : 'Checked out. End location saved.',
      );
    } catch (error) {
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
      const nextAttendance = await crystalBioFrontendApi.checkIn(session);
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
      setScreenNotice(error instanceof Error ? error.message : 'Check-in failed');
      setStatusMessage(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsAttendanceBusy(false);
    }
  };

  const resetSalesFormForNewVisit = () => {
    setSalesAccountName('Apollo Diagnostics');
    setSalesContactPerson('Lab manager');
    setSalesDesignation('Lab manager');
    setSalesPhone('');
    setSalesEmail('');
    setSalesDepartmentAddress('');
    setSalesLeadSource('Field visit');
    setSalesProductType('Laboratory equipment');
    setSalesBrandName('');
    setSalesEquipmentModel('');
    setSalesRequirement('Biochemistry analyzer requirement');
    setSalesVisitNote('Requirement confirmed. Quote to be shared.');
    setSalesNextAction('follow_up_needed');
    setSalesFollowUpDate('2026-06-10');
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
    setSalesStep2Saved(false);
    setSalesStep3Saved(false);
    setSalesSaveResult(null);
  };

  const resetServiceFormForNewVisit = () => {
    setServiceCustomerName('Metro Lab');
    setServiceContactPerson('Lab supervisor');
    setServicePhone('');
    setServiceEmail('');
    setServiceDepartmentAddress('');
    setServiceEquipmentName('Centrifuge');
    setServiceBrandName('');
    setServiceModelName('');
    setServiceSerialNumber('CB-01');
    setServiceIssueCategory('Machine noise');
    setServiceIssueDescription('');
    setServiceWarrantyAmc('');
    setServiceType('breakdown');
    setServiceWorkDone('Diagnosed issue and checked machine performance.');
    setServiceSupportRequired(true);
    setServiceNextAction('parts_required');
    setServiceNextVisitDate('2026-06-09');
    setServicePartsRequired('Bearing kit');
    setServicePartsUsed('');
    setServiceMachineStatus('Working with observation');
    setServiceSupportRequiredNote('');
    setServiceFinalRemarks('');
    setServicePhotoNote('');
    setServiceOfficeNotes('Share parts availability with office.');
    setServiceStep2Saved(false);
    setServiceStep3Saved(false);
    setServiceSaveResult(null);
  };

  const goToScreen = (nextScreen: AppScreen, options?: { newSalesVisit?: boolean; newServiceVisit?: boolean }) => {
    setScreenNotice(null);
    if (options?.newSalesVisit) resetSalesFormForNewVisit();
    if (options?.newServiceVisit) resetServiceFormForNewVisit();
    if (nextScreen === 'sales' || nextScreen === 'service') {
      setStatusMessage('Loading logged-in agent…');
      crystalBioFrontendApi.login(isBackendConfigured ? loginInputForScreen(nextScreen) : agentIdForScreen(nextScreen)).then((nextSession) => {
        setSession(nextSession);
        setStatusMessage('Logged in. Check in to start field work.');
      }).catch((error: Error) => {
        setStatusMessage(error.message);
      });
    }
    setScreen(nextScreen);
  };

  const openAdminTab = (nextTab: AdminTab) => {
    setAdminTab(nextTab);
    if (nextTab !== 'approvals') setSelectedAdminApproval(null);
    if (nextTab !== 'agents' && nextTab !== 'profiles') setAdminAgentsView('list');
    setScreenNotice(null);
  };

  const handleAgentLogin = async () => {
    setIsAdminSignedIn(false);
    setScreenNotice(null);
    setStatusMessage('Checking login…');
    try {
      const nextSession = await crystalBioFrontendApi.login(
        isBackendConfigured ? { loginCode: loginCode.trim(), passcode } : 'agent_2',
      );
      setSession(nextSession);
      if (nextSession.role === 'admin') {
        setIsAdminSignedIn(true);
        setAdminTab('overview');
        setSelectedAdminApproval(null);
        setStatusMessage('Admin logged in.');
        setScreen('admin');
        return;
      }
      setStatusMessage('Logged in. Check in to start field work.');
      setScreen('home');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Login failed');
      setScreenNotice(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleAdminLogin = async () => {
    setAdminTab('overview');
    setSelectedAdminApproval(null);
    setScreenNotice(null);
    setStatusMessage('Checking admin login…');
    try {
      const nextSession = await crystalBioFrontendApi.login(
        isBackendConfigured ? { loginCode: loginCode.trim(), passcode } : 'agent_2',
      );
      if (isBackendConfigured && nextSession.role !== 'admin') {
        throw new Error('Use an admin login code to open admin access.');
      }
      setIsAdminSignedIn(true);
      setSession(nextSession);
      setStatusMessage('Admin logged in.');
      setScreen('admin');
    } catch (error) {
      setIsAdminSignedIn(false);
      setStatusMessage(error instanceof Error ? error.message : 'Admin login failed');
      setScreenNotice(error instanceof Error ? error.message : 'Admin login failed');
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
        const opportunity = await crystalBioFrontendApi.submitSalesStep2(session, salesSaveResult.opportunity.id, {
          accountName: salesAccountName.trim(),
          ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
          ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
          ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
        });
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
          message: 'Changes are saved. Step 2 and Step 3 remain available.',
          tone: 'success',
        });
        return;
      }

      const savedSalesVisit = await crystalBioFrontendApi.submitSalesVisit(session, {
        accountName: salesAccountName.trim(),
        ...(salesContactPerson.trim() ? { contactPerson: salesContactPerson.trim() } : {}),
        ...(salesPhone.trim() ? { phone: salesPhone.trim() } : {}),
        ...(salesRequirement.trim() ? { requirement: salesRequirement.trim() } : {}),
        note: salesVisitNote.trim(),
        nextAction: salesNextAction,
        ...(salesNextAction === 'follow_up_needed' ? { followUpDate: salesFollowUpDate } : {}),
      });
      setSalesSaveResult(savedSalesVisit);
      setSalesStep2Saved(false);
      setSalesStep3Saved(false);
      setScreenNotice(
        isBackendConfigured
          ? 'Sales Step 1 saved. Agent can complete Step 2 and Step 3 later.'
          : 'Sales Step 1 saved. Step 2 and Step 3 can now be saved.',
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
        ...(salesPhotoNote.trim() ? { sitePhoto: salesPhotoNote.trim() } : {}),
      });
      setSalesSaveResult({ ...salesSaveResult, opportunity: { ...salesSaveResult.opportunity, ...opportunity } });
      setSalesStep3Saved(true);
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
      const serviceSession = session.agentId === 'agent_3' ? session : await crystalBioFrontendApi.login(
        isBackendConfigured ? { loginCode: 'service1', passcode: '1234' } : 'agent_3',
      );
      if (serviceSession !== session) setSession(serviceSession);

      if (serviceSaveResult) {
        const serviceRecord = await crystalBioFrontendApi.submitServiceStep2(serviceSession, serviceSaveResult.serviceRecord.id, {
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
          message: 'Changes are saved. Step 2 and Step 3 remain available.',
          tone: 'success',
        });
        return;
      }

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
        ...(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed' ? { nextVisitDate: serviceNextVisitDate } : {}),
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
      });
      setServiceSaveResult(savedServiceVisit);
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
        ...(servicePhotoNote.trim() ? { photoNote: servicePhotoNote.trim() } : {}),
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
      });
      setServiceSaveResult({ ...serviceSaveResult, serviceRecord: { ...serviceSaveResult.serviceRecord, ...serviceRecord } });
      setServiceStep3Saved(true);
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
    setSession(null);
    setAttendance(null);
    setIsAdminSignedIn(false);
    setStatusMessage('Logged out. Enter login code and passcode.');
    setScreenNotice({ title: 'Logged out', message: 'You are back on the login screen.', tone: 'info' });
    setScreen('login');
  };

  const renderLogin = () => (
    <ScreenPanel title="Login" subtitle="Enter your employee details to open the app.">
      <section className="login-hero-card clean-login-card">
        <p>CrystalBio</p>
        <strong>Field work login</strong>
        <span>One simple login. The app opens the right access based on the person’s account.</span>
      </section>
      <label className="field-card login-field-card">
        <span>Mobile number / Employee ID</span>
        <input aria-label="Mobile number or employee ID" value={loginCode} inputMode="text" onChange={(event) => setLoginCode(event.target.value)} />
      </label>
      <label className="field-card login-field-card">
        <span>Password / PIN</span>
        <input aria-label="Password or PIN" value={passcode} type="password" onChange={(event) => setPasscode(event.target.value)} />
      </label>
      <button type="button" className="primary-action login-main-button" onClick={handleAgentLogin}>Login</button>
      <button type="button" className="secondary-action login-admin-button" onClick={handleAdminLogin}>Admin access</button>
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
        {sampleEntries.slice(0, 2).map((entry) => (
          <button className="entry-row entry-button" key={entry.customer} type="button" onClick={() => goToScreen(entry.type === 'Sales' ? 'sales' : 'service')}>
            <div>
              <strong>{entry.customer}</strong>
              <p>{entry.type} • Next: {entry.next}</p>
            </div>
            <span className={toneClass[entry.tone]}>{entry.status}</span>
          </button>
        ))}
      </section>
    </>
  );

  const renderVisits = () => {
    const query = visitSearch.trim().toLowerCase();
    const filteredEntries = sampleEntries.filter((entry) => {
      const haystack = `${entry.customer} ${entry.type} ${entry.next} ${entry.status}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    return (
      <ScreenPanel title="Visits" subtitle="Search previous entries or start a new field update.">
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
            <small>New visit update</small>
          </button>
          <button type="button" className="visit-action-card" aria-label="New service visit update" onClick={() => goToScreen('service', { newServiceVisit: true })}>
            <span className="visit-action-icon service-icon"><ClipboardList size={18} /></span>
            <strong>Service</strong>
            <small>New service update</small>
          </button>
        </div>
        {filteredEntries.length ? filteredEntries.map((entry) => (
          <button className="entry-row entry-button" key={entry.customer} type="button" onClick={() => goToScreen(entry.type === 'Sales' ? 'sales' : 'service')}>
            <div>
              <strong>{entry.customer}</strong>
              <p>{entry.type} • Next: {entry.next}</p>
            </div>
            <span className={toneClass[entry.tone]}>{entry.status}</span>
          </button>
        )) : (
          <div className="empty-state">No matching visits found.</div>
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
        <div className="form-card highlighted-card">
          <label>Current visit location</label>
          <p>{isBackendConfigured ? 'Location permission is requested when this update is saved.' : 'Location is captured when this update is saved.'}</p>
        </div>
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
        <button type="button" className="primary-action" disabled={salesAnySubmitting || !session} onClick={handleSalesSubmit}>{isSalesSubmitting ? 'Saving…' : salesSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
      </section>

      <section className="step-card">
        <div className="step-heading">
          <div><span className="step-pill">Step 2</span><h3>Customer & requirement details</h3><p>Add contact and product details when available.</p></div>
          <span className={salesStep2Saved ? 'chip chip-soft' : 'chip chip-info'}>{salesStep2Saved ? 'Saved' : 'Later'}</span>
        </div>
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
      </section>

      <section className="step-card">
        <div className="step-heading">
          <div><span className="step-pill">Step 3</span><h3>Quote, proof & office details</h3><p>Useful for follow-up, admin reports, and office team work.</p></div>
          <span className={salesStep3Saved ? 'chip chip-soft' : 'chip chip-info'}>{salesStep3Saved ? 'Saved' : 'Later'}</span>
        </div>
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
          <button type="button" onClick={() => setSalesSupportRequired('Arrange demo support')}>Demo support</button>
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
            <button type="button" className="secondary-action photo-button" onClick={() => setScreenNotice('Camera capture is scheduled for device testing.')}>Camera</button>
            <button type="button" className="secondary-action photo-button" onClick={() => setScreenNotice('File upload is scheduled for device testing.')}>Upload</button>
          </div>
          <textarea aria-label="Sales photo note" value={salesPhotoNote} onChange={(event) => setSalesPhotoNote(event.target.value)} placeholder="Optional note, e.g. visiting card photo added" rows={2} />
        </div>
        <button type="button" aria-label="Save Step 3" className={salesSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={salesAnySubmitting || !salesSaveResult} onClick={handleSalesStep3Submit}>{isSalesStep3Submitting ? 'Saving…' : salesSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
      </section>

      {salesSaveResult && (
        <div className="form-card highlighted-card">
          <label>Latest saved sales entry</label>
          <span>{salesSaveResult.opportunity.accountName} • Visit {salesSaveResult.visit.visitNumber} • {salesSaveResult.visit.nextAction.split('_').join(' ')}</span>
          <span>Step 2: {salesStep2Saved ? 'saved' : 'pending'} • Step 3: {salesStep3Saved ? 'saved' : 'pending'}</span>
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
          <div className="form-card highlighted-card">
            <label>Current visit location</label>
            <p>{isBackendConfigured ? 'Location permission is requested when this update is saved.' : 'Location is captured when this update is saved.'}</p>
          </div>
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
          <button type="button" className="primary-action" disabled={serviceAnySubmitting || !session} onClick={handleServiceSubmit}>{isServiceSubmitting ? 'Saving…' : serviceSaveResult ? 'Save Step 1 changes' : 'Save Step 1'}</button>
        </section>

        <section className="step-card">
          <div className="step-heading">
            <div><span className="step-pill">Step 2</span><h3>Customer, equipment, issue</h3><p>Add instrument and issue details when available.</p></div>
            <span className={serviceStep2Saved ? 'chip chip-soft' : 'chip chip-info'}>{serviceStep2Saved ? 'Saved' : 'Later'}</span>
          </div>
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
        </section>

        <section className="step-card">
          <div className="step-heading">
            <div><span className="step-pill">Step 3</span><h3>Parts, proof, office details</h3><p>For service closure and admin reporting.</p></div>
            <span className={serviceStep3Saved ? 'chip chip-soft' : 'chip chip-info'}>{serviceStep3Saved ? 'Saved' : 'Later'}</span>
          </div>
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
          <div className="field-card photo-action-card"><div><span>Service photos</span><small>Optional now. Use for machine, issue, part, or completed-work proof.</small></div><div className="photo-actions"><button type="button" className="secondary-action photo-button" onClick={() => setScreenNotice('Camera capture is scheduled for device testing.')}>Camera</button><button type="button" className="secondary-action photo-button" onClick={() => setScreenNotice('File upload is scheduled for device testing.')}>Upload</button></div><input aria-label="Service photo note" value={servicePhotoNote} onChange={(event) => setServicePhotoNote(event.target.value)} placeholder="Optional photo note" /></div>
          <label className="field-card"><span>Final remarks</span><textarea aria-label="Service final remarks" value={serviceFinalRemarks} onChange={(event) => setServiceFinalRemarks(event.target.value)} placeholder="Optional customer confirmation / remarks" rows={2} /></label>
          <label className="field-card"><span>Notes for office</span><textarea aria-label="Service office notes" value={serviceOfficeNotes} onChange={(event) => setServiceOfficeNotes(event.target.value)} placeholder="Optional office notes" rows={2} /></label>
          <button type="button" aria-label="Save Step 3" className={serviceSaveResult ? 'secondary-action step-save-action' : 'secondary-action step-save-action locked-step-action'} disabled={serviceAnySubmitting || !serviceSaveResult} onClick={handleServiceStep3Submit}>{isServiceStep3Submitting ? 'Saving…' : serviceSaveResult ? 'Save Step 3' : 'Complete Step 1 first'}</button>
        </section>

        {serviceSaveResult && <div className="form-card highlighted-card"><label>Latest saved service visit</label><span>{serviceSaveResult.serviceRecord.customerName} • Visit {serviceSaveResult.visit.visitNumber} • {serviceSaveResult.visit.nextAction.split('_').join(' ')}</span><span>Step 2: {serviceStep2Saved ? 'saved' : 'pending'} • Step 3: {serviceStep3Saved ? 'saved' : 'pending'}</span></div>}
      </ScreenPanel>
    );
  };

  const renderCheckIn = () => (
    <ScreenPanel title="Check in" subtitle="Choose today’s work plan before starting field work.">
      <div className="attendance-status-card">
        <div className="attendance-status-icon"><MapPin size={20} /></div>
        <div>
          <label>Current location</label>
          <strong>{isBackendConfigured ? 'Phone GPS will be captured' : 'Location capture ready'}</strong>
          <span>{isBackendConfigured ? 'The app asks for location when the agent taps Check in now.' : 'The app saves the phone location when the agent checks in.'}</span>
        </div>
      </div>
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
        <div className="form-card highlighted-card">
          <label>GPS capture</label>
          <p>{isBackendConfigured ? 'The app saves the phone location during check-in and check-out.' : 'The app saves phone location during check-in and check-out.'}</p>
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
    const reportCopy: Record<ReportPeriod, { title: string; range: string; visits: string; sales: string; service: string; attendance: string; followUps: string; leave: string }> = {
      today: { title: 'Daily report', range: '08 Jun', visits: '4', sales: '2', service: '2', attendance: attendanceLabel, followUps: '1', leave: leaveStatus },
      week: { title: 'Weekly report', range: '09 Jun – 15 Jun', visits: '8', sales: '5', service: '3', attendance: '5 / 6 days present', followUps: '3', leave: leaveStatus },
      month: { title: 'Monthly report', range: 'June 2026', visits: '31', sales: '18', service: '13', attendance: '21 / 24 days present', followUps: '7', leave: leaveStatus },
      custom: { title: 'Custom date report', range: `${reportFromDate} to ${reportToDate}`, visits: '12', sales: '7', service: '5', attendance: 'Selected range attendance', followUps: '2', leave: leaveStatus },
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
        </section>

        <section className="report-preview-card simple-report-preview-card">
          <div className="report-preview-heading">
            <div>
              <label>Preview</label>
              <strong>{kindLabels[reportKind].title}</strong>
              <span>{activeReport.title} • {activeReport.range}</span>
            </div>
            <span className="chip chip-soft">Visual only</span>
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
    const agentName = session?.agentName ?? 'Rahul Sales';
    const agentId = session?.agentId ?? 'agent_2';
    const agentPhone = session?.phone ?? '+91 98765 43210';
    const agentEmail = session?.email ?? 'rahul.sales@crystalbio.in';

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
    if (status === 'expired') return 'Invite expired';
    return 'Invite pending';
  };

  const handleCreateSeatInvite = () => {
    const trimmedName = newSeatName.trim();
    const trimmedEmail = newSeatEmail.trim();
    const trimmedEmployeeId = newSeatEmployeeId.trim();
    if (!trimmedName || !trimmedEmail || !trimmedEmployeeId) {
      setScreenNotice({ title: 'Missing details', message: 'Name, employee ID, and email are needed before sending invite.', tone: 'warning' });
      return;
    }
    const nextSeat: AdminSeat = {
      id: `seat_${Date.now()}`,
      name: trimmedName,
      employeeId: trimmedEmployeeId,
      email: trimmedEmail,
      mobile: newSeatMobile.trim() || 'Not added',
      role: newSeatRole,
      territory: newSeatTerritory.trim() || 'Not assigned',
      status: 'invited',
      lastActive: 'Invite sent just now',
    };
    setAdminSeats((current) => [nextSeat, ...current]);
    setSelectedAdminSeatId(nextSeat.id);
    setAdminAgentsView('invite');
    setScreenNotice({ title: 'Invite sent', message: `${nextSeat.name} can set password from the email invite.`, tone: 'success' });
  };

  const renderAdmin = () => {
    const adminPeriodData: Record<ReportPeriod, { label: string; active: string; summary: string; visits: string; checkedIn: string; leave: string; followUps: string }> = {
      today: { label: 'Today', active: '3 agents active', summary: '1 service visit • 2 sales visits • 1 leave request pending', visits: '5', checkedIn: '3', leave: '1', followUps: '4' },
      week: { label: 'This week', active: '8 agents active', summary: '9 service visits • 14 sales visits • 3 leave requests', visits: '23', checkedIn: '8', leave: '3', followUps: '11' },
      month: { label: 'This month', active: '11 agents tracked', summary: '38 service visits • 61 sales visits • 7 leave requests', visits: '99', checkedIn: '11', leave: '7', followUps: '26' },
      custom: { label: 'Custom range', active: '6 agents tracked', summary: `${adminReportFromDate} to ${adminReportToDate} • 12 service visits • 18 sales visits • 2 leave requests`, visits: '30', checkedIn: '6', leave: '2', followUps: '8' },
    };
    const adminReportRows: Record<ReportPeriod, Array<{ name: string; role: string; attendance: string; visits: string; status: string; chipClass: string }>> = {
      today: [
        { name: 'Rahul Sales', role: 'Sales agent', attendance: 'Checked in', visits: '2 sales visits • 1 follow-up', status: 'Ready', chipClass: 'chip chip-soft' },
        { name: 'Meera Service', role: 'Service agent', attendance: 'Checked in', visits: '1 service visit • parts required', status: 'Ready', chipClass: 'chip chip-info' },
        { name: 'Anil Sales', role: 'Sales agent', attendance: 'Not checked in', visits: 'No visit update today', status: 'Missing', chipClass: 'chip chip-warning' },
      ],
      week: [
        { name: 'Rahul Sales', role: 'Sales agent', attendance: '5 / 6 days', visits: '8 sales visits • 3 follow-ups', status: 'Ready', chipClass: 'chip chip-soft' },
        { name: 'Meera Service', role: 'Service agent', attendance: '5 / 6 days', visits: '6 service visits • 2 pending parts', status: 'Ready', chipClass: 'chip chip-info' },
        { name: 'Anil Sales', role: 'Sales agent', attendance: '4 / 6 days', visits: '6 sales visits • 1 missing day', status: 'Review', chipClass: 'chip chip-warning' },
      ],
      month: [
        { name: 'Rahul Sales', role: 'Sales agent', attendance: '21 / 24 days', visits: '31 sales visits • 9 follow-ups', status: 'Ready', chipClass: 'chip chip-soft' },
        { name: 'Meera Service', role: 'Service agent', attendance: '22 / 24 days', visits: '24 service visits • 5 open parts', status: 'Ready', chipClass: 'chip chip-info' },
        { name: 'Anil Sales', role: 'Sales agent', attendance: '18 / 24 days', visits: '30 sales visits • 3 missing updates', status: 'Review', chipClass: 'chip chip-warning' },
      ],
      custom: [
        { name: 'Rahul Sales', role: 'Sales agent', attendance: 'Selected range', visits: '10 sales visits • 4 follow-ups', status: 'Ready', chipClass: 'chip chip-soft' },
        { name: 'Meera Service', role: 'Service agent', attendance: 'Selected range', visits: '8 service visits • 2 open parts', status: 'Ready', chipClass: 'chip chip-info' },
        { name: 'Anil Sales', role: 'Sales agent', attendance: 'Selected range', visits: '8 sales visits • 2 missing updates', status: 'Review', chipClass: 'chip chip-warning' },
      ],
    };
    const adminReportDetails: Record<string, { attendance: string[]; visits: string[]; missing: string[]; leave: string; officeAction: string }> = {
      'Rahul Sales': {
        attendance: ['Present 5/6 days', 'Check-in average 9:18 AM', 'All check-outs captured with GPS'],
        visits: ['Apollo Diagnostics: biochemistry analyzer requirement confirmed', 'Quote submitted: No', 'Follow-up date: 17 Jun', 'Office note: share quotation and brochure'],
        missing: ['Quote value not added yet'],
        leave: 'No leave pending in this range',
        officeAction: 'Send quote to Apollo Diagnostics',
      },
      'Meera Service': {
        attendance: ['Present 5/6 days', 'One service day ended late', 'GPS captured for all visits'],
        visits: ['Metro Lab: centrifuge noise checked', 'Parts required: bearing kit', 'Machine status: working with observation', 'Next visit needed after parts arrive'],
        missing: ['Part availability confirmation pending'],
        leave: 'Leave request: 12 Jun to 13 Jun • waiting approval',
        officeAction: 'Arrange bearing kit and update Meera',
      },
      'Anil Sales': {
        attendance: ['Present 4/6 days', 'One missed check-in', 'One visit saved without checkout'],
        visits: ['6 sales visits logged', '2 follow-ups overdue', 'One Wednesday visit has only Step 1 saved'],
        missing: ['Requirement details missing', 'Follow-up date missing', 'Customer contact not added'],
        leave: 'No leave request submitted',
        officeAction: 'Ask Anil to complete missing Wednesday visit update',
      },
    };
    const adminOfficeActions = [
      { title: 'Send quote', detail: 'Apollo Diagnostics • biochemistry analyzer', tone: 'warning' },
      { title: 'Arrange parts', detail: 'Metro Lab • bearing kit required', tone: 'info' },
      { title: 'Complete missing update', detail: 'Anil Sales • Wednesday visit fields missing', tone: 'warning' },
    ];
    const adminReportScopeLabels: Record<AdminReportScope, string> = {
      office: 'Whole office report',
      sales: 'All sales agents',
      service: 'All service agents',
      rahul: 'Rahul Sales',
      meera: 'Meera Service',
      anil: 'Anil Sales',
    };
    const adminReportScopeRows = adminReportRows[adminPeriod].filter((row) => {
      if (adminReportScope === 'office') return true;
      if (adminReportScope === 'sales' || adminReportScope === 'service') return row.role.toLowerCase().startsWith(adminReportScope);
      return row.name.toLowerCase().startsWith(adminReportScope);
    });
    const adminApprovals: Record<AdminApprovalId, { label: string; chipClass: string; agent: string; title: string; summary: string; detail: string; meta: string; actionNote: string }> = {
      'meera-leave': {
        label: 'Leave',
        chipClass: 'chip chip-warning',
        agent: 'Meera Service',
        title: 'Leave request',
        summary: '12 Jun to 13 Jun • Sick leave',
        detail: 'Meera has requested leave for two days. Admin can approve or reject from this detail view.',
        meta: 'Service agent • Submitted today',
        actionNote: 'Approval status will show in Meera’s Leave and Reports pages.',
      },
    };
    const openApproval = (approvalId: AdminApprovalId) => {
      setSelectedAdminApproval(approvalId);
      setAdminTab('approvals');
      setScreenNotice(null);
    };
    const activeApproval = selectedAdminApproval ? adminApprovals[selectedAdminApproval] : null;
    const visibleAgentActivityRows = adminReportRows.today.filter((row) => {
      if (adminAgentFilter === 'all') return true;
      return row.role.toLowerCase().startsWith(adminAgentFilter);
    });
    const selectedSeat = adminSeats.find((seat) => seat.id === selectedAdminSeatId) ?? adminSeats[0];
    const period = adminPeriodData[adminPeriod];
    const overviewPeriod = adminPeriodData.today;
    const generateAdminReport = () => {
      const rangeLabel = adminPeriod === 'custom' ? `${adminReportFromDate} to ${adminReportToDate}` : period.label.toLowerCase();
      setScreenNotice({
        title: `${adminReportScopeLabels[adminReportScope]} ready`,
        message: `${adminReportScopeLabels[adminReportScope]} generated for ${rangeLabel}.`,
        tone: 'success',
      });
    };
    const changePeriod = (nextPeriod: ReportPeriod) => {
      setAdminPeriod(nextPeriod);
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
    const showOverview = adminTab === 'overview';
    const showAgents = adminTab === 'agents';
    const showApprovals = adminTab === 'overview' || adminTab === 'approvals';
    const showReports = adminTab === 'adminReports';
    const showProfiles = adminTab === 'profiles';

    return (
      <ScreenPanel title={adminTab === 'overview' ? 'Admin overview' : adminTab === 'agents' ? 'Agents' : adminTab === 'approvals' ? 'Approvals' : adminTab === 'profiles' ? 'Profiles' : 'Admin reports'} subtitle="">
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
                  <div className="metric-card admin-metric-card"><strong>{overviewPeriod.visits}</strong><span>Total visits</span><small>Today</small></div>
                  <div className="metric-card admin-metric-card"><strong>{overviewPeriod.checkedIn}</strong><span>Checked in</span><small>Agents active</small></div>
                  <div className="metric-card admin-metric-card"><strong>{overviewPeriod.leave}</strong><span>Leave</span><small>Needs review</small></div>
                  <div className="metric-card admin-metric-card"><strong>{overviewPeriod.followUps}</strong><span>Follow-ups</span><small>Need action</small></div>
                </div>
              </>
            )}

            {showReports && renderAdminDateFilter('Report date range')}
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
                <button type="button" className="secondary-action" onClick={() => setScreenNotice({ title: 'Rejected', message: `${activeApproval.title} marked rejected.`, tone: 'warning' })}>Reject</button>
                <button type="button" className="primary-action" onClick={() => setScreenNotice({ title: 'Approved', message: `${activeApproval.title} approved and reflected in the agent app.`, tone: 'success' })}>Approve</button>
              </div>
            </section>
          ) : (
            <section className="admin-action-card admin-approval-list-card">
              <label>Leave approvals</label>
              <button type="button" className="admin-alert-row admin-click-row" onClick={() => openApproval('meera-leave')}>
                <span className="chip chip-warning">Leave</span>
                <div><strong>Meera Service</strong><p>12 Jun to 13 Jun • Sick leave</p><small>Waiting for admin decision</small></div>
              </button>
            </section>
          )
        )}

        {showAgents && (
          <>
            {adminAgentsView === 'list' && (
              <>
                <section className="admin-agents-compact-head">
                  <div>
                    <p>Live agent status</p>
                    <span>Quick check of who is working today, who updated visits, and who needs follow-up. Reports stay separate.</span>
                  </div>
                </section>
                <div className="admin-filter-row admin-agent-filter-row" aria-label="Agent type filters">
                  {(['all', 'sales', 'service'] as AdminAgentFilter[]).map((filter) => (
                    <button key={filter} type="button" className={adminAgentFilter === filter ? 'admin-filter-active' : ''} onClick={() => setAdminAgentFilter(filter)}>
                      {filter === 'all' ? 'All' : filter === 'sales' ? 'Sales agents' : 'Service agents'}
                    </button>
                  ))}
                </div>
                <section className="admin-report-list-card admin-agent-activity-list">
                  <div className="admin-report-heading">
                    <label>Today activity</label>
                    <span>{visibleAgentActivityRows.length} shown</span>
                  </div>
                  {visibleAgentActivityRows.map((row) => (
                    <button key={`${adminPeriod}-${row.name}`} type="button" className="admin-report-row admin-click-row" onClick={() => setScreenNotice({ title: `${row.name} activity opened`, message: `${row.role}: ${row.attendance}. ${row.visits}.`, tone: 'info' })}>
                      <div className="admin-report-row-main">
                        <strong>{row.name}</strong>
                        <p>{row.role} • {row.attendance}</p>
                        <small>{row.visits}</small>
                      </div>
                      <span className={row.chipClass}>{row.status}</span>
                    </button>
                  ))}
                </section>
              </>
            )}

            {adminAgentsView === 'add' && (
              <section className="admin-seat-form-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to agents</button>
                <div className="admin-seat-form-heading"><label>New profile</label><strong>Add agent seat</strong><span>Create the profile first, then send the password setup invite to the registered email.</span></div>
                <label className="field-card"><span>Agent name</span><input aria-label="New agent name" value={newSeatName} onChange={(event) => setNewSeatName(event.target.value)} /></label>
                <label className="field-card"><span>Employee ID</span><input aria-label="New employee ID" value={newSeatEmployeeId} onChange={(event) => setNewSeatEmployeeId(event.target.value)} /></label>
                <label className="field-card"><span>Email ID for invite</span><input aria-label="New agent email" inputMode="email" value={newSeatEmail} onChange={(event) => setNewSeatEmail(event.target.value)} /></label>
                <label className="field-card"><span>Mobile number</span><input aria-label="New agent mobile" inputMode="tel" value={newSeatMobile} onChange={(event) => setNewSeatMobile(event.target.value)} /></label>
                <div className="inline-field-grid">
                  <label className="field-card"><span>Role</span><select aria-label="New agent role" value={newSeatRole} onChange={(event) => setNewSeatRole(event.target.value as AdminSeat['role'])}><option value="sales">Sales agent</option><option value="service">Service agent</option><option value="admin">Admin</option></select></label>
                  <label className="field-card"><span>Territory</span><input aria-label="New agent territory" value={newSeatTerritory} onChange={(event) => setNewSeatTerritory(event.target.value)} /></label>
                </div>
                <button type="button" className="primary-action" onClick={handleCreateSeatInvite}>Create profile + send invite</button>
              </section>
            )}

            {adminAgentsView === 'profile' && selectedSeat && (
              <section className="admin-seat-profile-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to agents</button>
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
                  <button type="button" className="secondary-action" onClick={() => { setAdminAgentsView('invite'); setScreenNotice({ title: 'Invite resent', message: `Setup link sent to ${selectedSeat.email}.`, tone: 'success' }); }}>Resend invite</button>
                  <button type="button" className="secondary-action" onClick={() => setScreenNotice({ title: 'Password reset sent', message: `${selectedSeat.name} will receive a secure reset email.`, tone: 'success' })}>Reset password</button>
                  <button type="button" className="secondary-action logout-action" onClick={() => setAdminSeats((current) => current.map((seat) => seat.id === selectedSeat.id ? { ...seat, status: 'inactive' } : seat))}>Deactivate</button>
                </div>
              </section>
            )}

            {adminAgentsView === 'invite' && selectedSeat && (
              <section className="admin-invite-preview-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to agents</button>
                <span className="chip chip-soft">Email invite</span>
                <div className="admin-invite-mail">
                  <p>To: {selectedSeat.email}</p>
                  <strong>Set up your CrystalBio Field App account</strong>
                  <span>Hi {selectedSeat.name}, your company profile is ready. Click the secure link to create your password and activate access.</span>
                  <button type="button" className="primary-action" onClick={() => setScreenNotice({ title: 'Password setup page', message: `${selectedSeat.name} can create password and open the app.`, tone: 'info' })}>Set up my account</button>
                </div>
                <div className="admin-seat-meta-row"><span>Link expires in 48 hours</span><span>No public signup</span></div>
              </section>
            )}
          </>
        )}

        {showProfiles && (
          <>
            {adminAgentsView === 'add' ? (
              <section className="admin-seat-form-card">
                <button type="button" className="admin-detail-back" onClick={() => setAdminAgentsView('list')}><ChevronLeft size={16} /> Back to profiles</button>
                <div className="admin-seat-form-heading"><label>New profile</label><strong>Add agent seat</strong><span>Create the profile first, then send the password setup invite to the registered email.</span></div>
                <label className="field-card"><span>Agent name</span><input aria-label="New agent name" value={newSeatName} onChange={(event) => setNewSeatName(event.target.value)} /></label>
                <label className="field-card"><span>Employee ID</span><input aria-label="New employee ID" value={newSeatEmployeeId} onChange={(event) => setNewSeatEmployeeId(event.target.value)} /></label>
                <label className="field-card"><span>Email ID for invite</span><input aria-label="New agent email" inputMode="email" value={newSeatEmail} onChange={(event) => setNewSeatEmail(event.target.value)} /></label>
                <label className="field-card"><span>Mobile number</span><input aria-label="New agent mobile" inputMode="tel" value={newSeatMobile} onChange={(event) => setNewSeatMobile(event.target.value)} /></label>
                <div className="inline-field-grid">
                  <label className="field-card"><span>Role</span><select aria-label="New agent role" value={newSeatRole} onChange={(event) => setNewSeatRole(event.target.value as AdminSeat['role'])}><option value="sales">Sales agent</option><option value="service">Service agent</option><option value="admin">Admin</option></select></label>
                  <label className="field-card"><span>Territory</span><input aria-label="New agent territory" value={newSeatTerritory} onChange={(event) => setNewSeatTerritory(event.target.value)} /></label>
                </div>
                <button type="button" className="primary-action" onClick={handleCreateSeatInvite}>Create profile + send invite</button>
              </section>
            ) : (
              <>
                <section className="profile-hero-card admin-profile-hero-card">
                  <span className="profile-avatar"><UserRound size={25} /></span>
                  <div>
                    <p>Admin profile</p>
                    <strong>{session?.agentName ?? 'Admin User'}</strong>
                    <span>{session?.email ?? 'admin@crystalbio.in'} • Owner access</span>
                    <small className="profile-access-note">Invite only • Public signup off • Email OTP backup on</small>
                  </div>
                </section>
                <section className="admin-report-list-card admin-agent-activity-list">
                  <div className="admin-report-heading profile-list-heading"><label>Team profiles</label><button type="button" className="profile-add-button" onClick={() => setAdminAgentsView('add')}><Plus size={16} /> Add profile</button></div>
                  {adminSeats.map((seat) => (
                    <button key={seat.id} type="button" className="admin-report-row admin-click-row" onClick={() => { setSelectedAdminSeatId(seat.id); setAdminTab('agents'); setAdminAgentsView('profile'); }}>
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
            {adminTab === 'adminReports' && (
              <section className="admin-report-list-card admin-report-setup-card">
                <div className="admin-report-scope-row">
                  <label>Report for</label>
                  <select aria-label="Admin report scope" value={adminReportScope} onChange={(event) => { setAdminReportScope(event.target.value as AdminReportScope); setExpandedAdminReportId(null); }}>
                    <option value="office">Whole office</option>
                    <option value="sales">All sales agents</option>
                    <option value="service">All service agents</option>
                    <option value="rahul">Rahul Sales</option>
                    <option value="meera">Meera Service</option>
                    <option value="anil">Anil Sales</option>
                  </select>
                </div>
                <button type="button" className="primary-action single-report-generate" onClick={generateAdminReport}>Generate report</button>

                <section className="admin-report-summary-card">
                  <div className="admin-report-heading"><label>Report summary</label><span>{period.label}</span></div>
                  <div className="admin-report-mini-metrics">
                    <div><strong>{adminReportScopeRows.length}</strong><span>People</span></div>
                    <div><strong>{period.visits}</strong><span>Visits</span></div>
                    <div><strong>{period.followUps}</strong><span>Follow-ups</span></div>
                    <div><strong>{adminReportScopeRows.filter((row) => row.status !== 'Ready').length}</strong><span>Review</span></div>
                  </div>
                  <div className="admin-report-chart-block" aria-label="Simple report charts">
                    <div className="admin-chart-row"><span>Sales</span><div><i style={{ width: '61%' }} /></div><strong>14</strong></div>
                    <div className="admin-chart-row"><span>Service</span><div><i className="service-bar" style={{ width: '39%' }} /></div><strong>9</strong></div>
                    <div className="admin-chart-row"><span>Ready</span><div><i style={{ width: '62%' }} /></div><strong>5</strong></div>
                    <div className="admin-chart-row"><span>Review</span><div><i className="warning-bar" style={{ width: '38%' }} /></div><strong>3</strong></div>
                  </div>
                </section>

                <section className="admin-office-actions-card">
                  <div className="admin-report-heading"><label>Needs office action</label><span>{adminOfficeActions.length}</span></div>
                  {adminOfficeActions.map((action) => (
                    <div key={action.title} className="admin-office-action-row">
                      <span className={action.tone === 'info' ? 'chip chip-info' : 'chip chip-warning'}>{action.tone === 'info' ? 'Service' : 'Action'}</span>
                      <div><strong>{action.title}</strong><small>{action.detail}</small></div>
                    </div>
                  ))}
                </section>

                <div className="admin-report-heading">
                  <label>{adminReportScope === 'office' ? 'Person-wise report' : 'Selected report'}</label>
                  <span>{adminReportScopeRows.length} shown</span>
                </div>
                {adminReportScopeRows.map((row) => {
                  const detail = adminReportDetails[row.name];
                  const isExpanded = expandedAdminReportId === row.name;
                  return (
                    <article key={row.name} className={isExpanded ? 'admin-report-row-card admin-report-row-expanded' : 'admin-report-row-card'}>
                      <button type="button" className="admin-report-row admin-click-row" aria-expanded={isExpanded} onClick={() => setExpandedAdminReportId(isExpanded ? null : row.name)}>
                        <div className="admin-report-row-main">
                          <strong>{row.name}</strong>
                          <p>{row.role} • {row.attendance}</p>
                          <small>{row.visits}</small>
                        </div>
                        <span className={row.chipClass}>{row.status}</span>
                      </button>
                      {isExpanded && detail && (
                        <div className="admin-report-expanded-panel">
                          <details open>
                            <summary>Attendance details</summary>
                            {detail.attendance.map((item) => <p key={item}>{item}</p>)}
                          </details>
                          <details open>
                            <summary>{row.role.startsWith('Sales') ? 'Sales visit details' : 'Service visit details'}</summary>
                            {detail.visits.map((item) => <p key={item}>{item}</p>)}
                          </details>
                          <details>
                            <summary>Leave details</summary>
                            <p>{detail.leave}</p>
                          </details>
                          <details open>
                            <summary>Missing information</summary>
                            {detail.missing.map((item) => <p key={item}>{item}</p>)}
                          </details>
                          <div className="admin-expanded-action"><span>Office action</span><strong>{detail.officeAction}</strong></div>
                        </div>
                      )}
                    </article>
                  );
                })}
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
      ? { title: 'Saved', message: screenNotice, tone: 'success' }
      : screenNotice
    : null;

  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">CrystalBio Field Hub</p>
        <h1>{screen === 'login' ? 'Login screen' : screen === 'admin' ? (adminTab === 'adminReports' ? 'Admin reports screen' : adminTab === 'approvals' ? 'Admin approvals screen' : adminTab === 'agents' ? 'Admin agents screen' : adminTab === 'profiles' ? 'Admin profiles screen' : 'Admin overview screen') : screen === 'profile' ? 'Agent profile screen' : 'Agent home screen'}</h1>
        <p>{screen === 'login' ? 'Role-based entry for field agents and admin users.' : screen === 'admin' ? 'Owner view for team attendance, leave, and field reports.' : 'Mobile workspace for field attendance, visits, leave, and reports.'}</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <div className="statusbar"><span>9:41</span><span>●●●</span></div>

          <header className="phone-header">
            <div>
              {screen !== 'home' && screen !== 'login' && <button type="button" className="back-button" onClick={() => goToScreen('home')}><ChevronLeft size={17} /> Home</button>}
              <p className="muted">{screen === 'login' ? 'Welcome' : screen === 'admin' ? 'Owner access' : 'Good morning'}</p>
              <h2>{screen === 'login' ? 'CrystalBio' : screen === 'admin' ? 'Admin' : session?.agentName ?? (screen === 'service' ? 'Meera Service' : 'Rahul Sales')}</h2>
            </div>
            <button type="button" className="avatar avatar-button" aria-label={screen === 'admin' && adminTab === 'profiles' ? 'Admin profile selected' : screen === 'profile' ? 'Profile selected' : 'Open profile'} disabled={screen === 'login'} onClick={() => screen === 'admin' ? openAdminTab('profiles') : goToScreen('profile')}>{screen === 'admin' ? <UsersRound size={21} /> : <UserRound size={21} />}</button>
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
                { label: 'Field entry', tab: 'overview' as AdminTab, screen: 'visits' as AppScreen, icon: ClipboardList },
                { label: 'Agents', tab: 'agents' as AdminTab, icon: UsersRound },
                { label: 'Approvals', tab: 'approvals' as AdminTab, icon: CalendarCheck },
                { label: 'Reports', tab: 'adminReports' as AdminTab, icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const selected = item.screen ? screen === item.screen : adminTab === (item.tab as AdminTab);
                return (
                  <button key={item.label} type="button" className={selected ? 'nav-item nav-item-selected' : 'nav-item'} aria-label={selected ? `${item.label} selected` : item.label} onClick={() => item.screen ? goToScreen(item.screen) : openAdminTab(item.tab as AdminTab)}>
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
