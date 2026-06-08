import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ClipboardList, FileText, Home, MapPin, Plus, Search, UserRound } from 'lucide-react';
import { sampleEntries } from './appData';
import { crystalBioFrontendApi, type FrontendAttendance, type FrontendLeaveRequest, type FrontendSalesSaveResult, type FrontendSalesNextAction, type FrontendServiceSaveResult, type FrontendServiceNextAction, type FrontendServiceType, type FrontendSession } from './crystalBioFrontendApi';

type AppScreen = 'home' | 'visits' | 'sales' | 'service' | 'attendance' | 'leave' | 'reports';

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

const sampleAttendanceLogs = [
  { date: 'Today', status: 'Ready to check in', detail: 'GPS will be saved when the agent taps Check in.' },
  { date: 'Yesterday', status: 'Checked out', detail: '9:18 AM to 6:04 PM' },
];

const screenOptions: AppScreen[] = ['home', 'visits', 'sales', 'service', 'attendance', 'leave', 'reports'];

const agentIdForScreen = (nextScreen: AppScreen) => (nextScreen === 'service' ? 'agent_3' : 'agent_2');

const getInitialScreen = (): AppScreen => {
  if (typeof window === 'undefined') return 'home';
  const requestedScreen = new URLSearchParams(window.location.search).get('screen') as AppScreen | null;
  return requestedScreen && screenOptions.includes(requestedScreen) ? requestedScreen : 'home';
};

function App() {
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);
  const [session, setSession] = useState<FrontendSession | null>(null);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading logged-in agent…');
  const [screenNotice, setScreenNotice] = useState<string | null>(null);
  const [leaveFromDate, setLeaveFromDate] = useState('2026-06-12');
  const [leaveToDate, setLeaveToDate] = useState('2026-06-12');
  const [leaveReason, setLeaveReason] = useState('Sick leave');
  const [leaveNote, setLeaveNote] = useState('');
  const [leaveRequest, setLeaveRequest] = useState<FrontendLeaveRequest | null>(null);
  const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
  const [salesAccountName, setSalesAccountName] = useState('Apollo Diagnostics');
  const [salesContactPerson, setSalesContactPerson] = useState('Lab manager');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesRequirement, setSalesRequirement] = useState('Biochemistry analyzer requirement');
  const [salesVisitNote, setSalesVisitNote] = useState('Requirement confirmed. Quote to be shared.');
  const [salesNextAction, setSalesNextAction] = useState<FrontendSalesNextAction>('follow_up_needed');
  const [salesFollowUpDate, setSalesFollowUpDate] = useState('2026-06-10');
  const [salesSaveResult, setSalesSaveResult] = useState<FrontendSalesSaveResult | null>(null);
  const [isSalesSubmitting, setIsSalesSubmitting] = useState(false);
  const [serviceCustomerName, setServiceCustomerName] = useState('Metro Lab');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceEquipmentName, setServiceEquipmentName] = useState('Centrifuge');
  const [serviceSerialNumber, setServiceSerialNumber] = useState('CB-01');
  const [serviceType, setServiceType] = useState<FrontendServiceType>('breakdown');
  const [serviceWorkDone, setServiceWorkDone] = useState('Diagnosed issue and checked machine performance.');
  const [serviceSupportRequired, setServiceSupportRequired] = useState(true);
  const [serviceNextAction, setServiceNextAction] = useState<FrontendServiceNextAction>('parts_required');
  const [serviceNextVisitDate, setServiceNextVisitDate] = useState('2026-06-09');
  const [serviceOfficeNotes, setServiceOfficeNotes] = useState('Share parts availability with office.');
  const [serviceSaveResult, setServiceSaveResult] = useState<FrontendServiceSaveResult | null>(null);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const isBackendConfigured = crystalBioFrontendApi.isBackendConfigured();

  useEffect(() => {
    let isMounted = true;
    crystalBioFrontendApi
      .login(agentIdForScreen(screen))
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

  const isCheckedIn = attendance?.status === 'checked_in';
  const attendanceAction = isCheckedIn ? 'Check out' : 'Check in';
  const attendanceHint = isCheckedIn ? 'End day' : 'Start day';

  const actionMeta = useMemo(
    () => [
      { label: attendanceAction, hint: attendanceHint, className: 'action-mint', icon: MapPin, onClick: 'attendance-action' as const },
      { label: 'Sales', hint: 'New visit', className: 'action-peach', icon: Plus, onClick: 'sales' as const },
      { label: 'Service', hint: 'Report', className: 'action-sky', icon: ClipboardList, onClick: 'service' as const },
      { label: 'Attendance', hint: 'Logs & leave', className: 'action-cream', icon: CalendarCheck, onClick: 'attendance' as const },
    ],
    [attendanceAction, attendanceHint],
  );

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

  const goToScreen = (nextScreen: AppScreen) => {
    setScreenNotice(null);
    if (nextScreen === 'sales' || nextScreen === 'service') {
      setStatusMessage('Loading logged-in agent…');
      crystalBioFrontendApi.login(agentIdForScreen(nextScreen)).then((nextSession) => {
        setSession(nextSession);
        setStatusMessage('Logged in. Check in to start field work.');
      }).catch((error: Error) => {
        setStatusMessage(error.message);
      });
    }
    setScreen(nextScreen);
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
    setScreenNotice(isBackendConfigured ? 'Sending leave request…' : 'Saving demo leave request…');
    try {
      const savedLeave = await crystalBioFrontendApi.submitLeaveRequest(session, {
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        reason: leaveReason,
        ...(leaveNote.trim() ? { note: leaveNote.trim() } : {}),
      });
      setLeaveRequest(savedLeave);
      setScreenNotice(
        isBackendConfigured
          ? 'Leave request sent to admin for approval.'
          : 'Demo leave request saved. Approval status will not change until the backend is connected.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Leave request failed');
    } finally {
      setIsLeaveSubmitting(false);
    }
  };

  const handleSalesSubmit = async () => {
    if (!session) {
      setScreenNotice('Please wait for login before saving the sales visit.');
      return;
    }
    if (!salesAccountName.trim() || !salesVisitNote.trim()) {
      setScreenNotice('Add customer name and today’s visit note before saving.');
      return;
    }
    if (salesNextAction === 'follow_up_needed' && !salesFollowUpDate) {
      setScreenNotice('Select follow-up date or choose no follow-up.');
      return;
    }
    setIsSalesSubmitting(true);
    setScreenNotice(isBackendConfigured ? 'Saving sales visit with GPS…' : 'Saving demo sales visit with GPS…');
    try {
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
      setScreenNotice(
        isBackendConfigured
          ? 'Sales visit saved. Admin reports will include this update.'
          : 'Demo sales visit saved. Admin reports will update when the backend is connected.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Sales visit save failed');
    } finally {
      setIsSalesSubmitting(false);
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
    setScreenNotice(isBackendConfigured ? 'Saving service visit with GPS…' : 'Saving demo service visit with GPS…');
    try {
      const serviceSession = session.agentId === 'agent_3' ? session : await crystalBioFrontendApi.login('agent_3');
      if (serviceSession !== session) setSession(serviceSession);
      const savedServiceVisit = await crystalBioFrontendApi.submitServiceVisit(serviceSession, {
        customerName: serviceCustomerName.trim(),
        ...(servicePhone.trim() ? { phone: servicePhone.trim() } : {}),
        ...(serviceEquipmentName.trim() ? { equipmentName: serviceEquipmentName.trim() } : {}),
        ...(serviceSerialNumber.trim() ? { serialNumber: serviceSerialNumber.trim() } : {}),
        serviceType,
        workDone: serviceWorkDone.trim(),
        supportRequired: serviceSupportRequired,
        nextAction: serviceNextAction,
        ...(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed' ? { nextVisitDate: serviceNextVisitDate } : {}),
        ...(serviceOfficeNotes.trim() ? { officeNotes: serviceOfficeNotes.trim() } : {}),
      });
      setServiceSaveResult(savedServiceVisit);
      setScreenNotice(
        isBackendConfigured
          ? 'Service visit saved. Admin reports will include this update.'
          : 'Demo service visit saved. Admin reports will update when the backend is connected.',
      );
    } catch (error) {
      setScreenNotice(error instanceof Error ? error.message : 'Service visit save failed');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const handleQuickAction = (action: (typeof actionMeta)[number]['onClick']) => {
    if (action === 'attendance-action') {
      void handleAttendanceAction();
      return;
    }
    goToScreen(action);
  };

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

  const renderVisits = () => (
    <ScreenPanel notice={screenNotice} title="Visits" subtitle="Search previous entries or start a new field update.">
      <div className="search-card"><Search size={17} /><span>Search customer, phone, equipment, serial number</span></div>
      <div className="split-actions">
        <button type="button" className="primary-action" onClick={() => goToScreen('sales')}>New sales visit update</button>
        <button type="button" className="secondary-action" onClick={() => goToScreen('service')}>New service visit update</button>
      </div>
      {sampleEntries.map((entry) => (
        <button className="entry-row entry-button" key={entry.customer} type="button" onClick={() => goToScreen(entry.type === 'Sales' ? 'sales' : 'service')}>
          <div>
            <strong>{entry.customer}</strong>
            <p>{entry.type} • Next: {entry.next}</p>
          </div>
          <span className={toneClass[entry.tone]}>{entry.status}</span>
        </button>
      ))}
    </ScreenPanel>
  );

  const renderSales = () => (
    <ScreenPanel notice={screenNotice} title="Sales visit" subtitle="Save today’s customer update with GPS.">
      <div className="form-card highlighted-card">
        <label>Current visit location</label>
        <p>{isBackendConfigured ? 'Location permission is requested when this update is saved.' : 'Demo preview uses fixed sample GPS. Connected backend mode requests location permission when saving.'}</p>
      </div>
      <label className="field-card">
        <span>Customer / lab name</span>
        <input aria-label="Sales customer name" value={salesAccountName} onChange={(event) => setSalesAccountName(event.target.value)} />
      </label>
      <label className="field-card">
        <span>Contact person</span>
        <input aria-label="Sales contact person" value={salesContactPerson} onChange={(event) => setSalesContactPerson(event.target.value)} placeholder="Optional" />
      </label>
      <label className="field-card">
        <span>Phone</span>
        <input aria-label="Sales phone" value={salesPhone} onChange={(event) => setSalesPhone(event.target.value)} placeholder="Optional" inputMode="tel" />
      </label>
      <label className="field-card">
        <span>Requirement</span>
        <textarea aria-label="Sales requirement" value={salesRequirement} onChange={(event) => setSalesRequirement(event.target.value)} placeholder="Product need, quote, budget, status" rows={2} />
      </label>
      <label className="field-card">
        <span>Today’s visit note</span>
        <textarea aria-label="Sales visit note" value={salesVisitNote} onChange={(event) => setSalesVisitNote(event.target.value)} placeholder="What happened in this visit?" rows={3} />
      </label>
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
      <button type="button" className="primary-action" disabled={isSalesSubmitting || !session} onClick={handleSalesSubmit}>{isSalesSubmitting ? 'Saving…' : 'Save visit update'}</button>
      {salesSaveResult && (
        <div className="form-card highlighted-card">
          <label>Latest saved visit</label>
          <span>{salesSaveResult.opportunity.accountName} • Visit {salesSaveResult.visit.visitNumber} • {salesSaveResult.visit.nextAction.split('_').join(' ')}</span>
          <span>Note: {salesSaveResult.visit.note}</span>
        </div>
      )}
    </ScreenPanel>
  );

  const renderService = () => (
    <ScreenPanel notice={screenNotice} title="Service visit" subtitle="Save today’s equipment service update with GPS.">
      <div className="form-card highlighted-card">
        <label>Current visit location</label>
        <p>{isBackendConfigured ? 'Location permission is requested when this update is saved.' : 'Demo preview uses fixed sample GPS. Connected backend mode requests location permission when saving.'}</p>
      </div>
      <label className="field-card">
        <span>Customer / lab name</span>
        <input aria-label="Service customer name" value={serviceCustomerName} onChange={(event) => setServiceCustomerName(event.target.value)} />
      </label>
      <label className="field-card">
        <span>Phone</span>
        <input aria-label="Service phone" value={servicePhone} onChange={(event) => setServicePhone(event.target.value)} placeholder="Optional" inputMode="tel" />
      </label>
      <label className="field-card">
        <span>Equipment</span>
        <input aria-label="Service equipment" value={serviceEquipmentName} onChange={(event) => setServiceEquipmentName(event.target.value)} placeholder="Instrument name" />
      </label>
      <label className="field-card">
        <span>Serial number</span>
        <input aria-label="Service serial number" value={serviceSerialNumber} onChange={(event) => setServiceSerialNumber(event.target.value)} placeholder="Optional" />
      </label>
      <label className="field-card">
        <span>Service type</span>
        <select aria-label="Service type" value={serviceType} onChange={(event) => setServiceType(event.target.value as FrontendServiceType)}>
          <option value="breakdown">Breakdown</option>
          <option value="installation">Installation</option>
          <option value="preventive_maintenance">Preventive maintenance</option>
          <option value="repair">Repair</option>
          <option value="calibration">Calibration</option>
          <option value="demo">Demo</option>
          <option value="training">Training</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="field-card">
        <span>Today’s work done</span>
        <textarea aria-label="Service work done" value={serviceWorkDone} onChange={(event) => setServiceWorkDone(event.target.value)} placeholder="Issue checked, work done, customer update" rows={3} />
      </label>
      <label className="field-card support-card">
        <span>Support required?</span>
        <select aria-label="Service support required" value={serviceSupportRequired ? 'yes' : 'no'} onChange={(event) => setServiceSupportRequired(event.target.value === 'yes')}>
          <option value="yes">Yes, office/parts support needed</option>
          <option value="no">No support needed</option>
        </select>
      </label>
      <label className="field-card">
        <span>Next action</span>
        <select aria-label="Service next action" value={serviceNextAction} onChange={(event) => setServiceNextAction(event.target.value as FrontendServiceNextAction)}>
          <option value="parts_required">Parts required</option>
          <option value="next_visit_needed">Next visit needed</option>
          <option value="no_follow_up">No follow-up</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      {(serviceNextAction === 'parts_required' || serviceNextAction === 'next_visit_needed') && (
        <label className="field-card">
          <span>Next visit date</span>
          <input aria-label="Service next visit date" type="date" value={serviceNextVisitDate} onChange={(event) => setServiceNextVisitDate(event.target.value)} />
        </label>
      )}
      <label className="field-card">
        <span>Notes for office</span>
        <textarea aria-label="Service office notes" value={serviceOfficeNotes} onChange={(event) => setServiceOfficeNotes(event.target.value)} placeholder="Optional office notes" rows={2} />
      </label>
      <button type="button" className="primary-action" disabled={isServiceSubmitting || !session} onClick={handleServiceSubmit}>{isServiceSubmitting ? 'Saving…' : 'Save service update'}</button>
      {serviceSaveResult && (
        <div className="form-card highlighted-card">
          <label>Latest saved service visit</label>
          <span>{serviceSaveResult.serviceRecord.customerName} • Visit {serviceSaveResult.visit.visitNumber} • {serviceSaveResult.visit.nextAction.split('_').join(' ')}</span>
          <span>Work: {serviceSaveResult.visit.workDone}</span>
        </div>
      )}
    </ScreenPanel>
  );

  const renderAttendance = () => (
    <ScreenPanel notice={screenNotice} title="Attendance" subtitle="Check-in, check-out, leave request, and status history.">
      <button type="button" className="primary-action" disabled={!session || isAttendanceBusy} onClick={handleAttendanceAction}>{isAttendanceBusy ? 'Saving…' : attendanceAction}</button>
      <button type="button" className="secondary-action" onClick={() => goToScreen('leave')}>Send leave request</button>
      {sampleAttendanceLogs.map((log) => (
        <div className="entry-row" key={log.date}>
          <div><strong>{log.date}</strong><p>{log.detail}</p></div>
          <span className="chip chip-soft">{log.status}</span>
        </div>
      ))}
    </ScreenPanel>
  );

  const renderLeave = () => (
    <ScreenPanel notice={screenNotice} title="Leave request" subtitle="Simple request for admin approval.">
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
        <span>Optional note</span>
        <textarea aria-label="Leave note" value={leaveNote} onChange={(event) => setLeaveNote(event.target.value)} placeholder="Add a short note for admin" rows={3} />
      </label>
      <button type="button" className="primary-action" disabled={isLeaveSubmitting || !session} onClick={handleLeaveSubmit}>{isLeaveSubmitting ? 'Submitting…' : 'Submit leave request'}</button>
      {leaveRequest && (
        <div className="form-card highlighted-card">
          <label>Latest request</label>
          <span>{leaveRequest.fromDate} to {leaveRequest.toDate} • {leaveRequest.reason} • {leaveRequest.status}</span>
          {leaveRequest.note && <span>Note: {leaveRequest.note}</span>}
        </div>
      )}
    </ScreenPanel>
  );

  const renderReports = () => (
    <ScreenPanel notice={screenNotice} title="My reports" subtitle="Agent can see own daily/weekly/monthly summaries. Admin sees everyone separately.">
      <div className="report-grid">
        <div className="metric-card"><strong>2</strong><span>Visits this week</span></div>
        <div className="metric-card"><strong>1</strong><span>Follow-up due</span></div>
        <div className="metric-card"><strong>0</strong><span>Pending leave</span></div>
      </div>
      <p className="panel-note">These preview numbers are fixed demo values. They will come from backend reports when reports are connected.</p>
    </ScreenPanel>
  );

  const renderScreen = () => {
    if (screen === 'visits') return renderVisits();
    if (screen === 'sales') return renderSales();
    if (screen === 'service') return renderService();
    if (screen === 'attendance') return renderAttendance();
    if (screen === 'leave') return renderLeave();
    if (screen === 'reports') return renderReports();
    return renderHome();
  };

  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">{isBackendConfigured ? 'Backend connected' : 'Demo preview'}</p>
        <h1>Agent home screen</h1>
        <p>{isBackendConfigured ? 'Home logs in the agent and sends attendance to the Crystal Bio backend API.' : 'GitHub Pages preview uses fixed demo data. Buttons open the next app screens; only hosted-backend sections will save real records.'}</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <div className="statusbar"><span>9:41</span><span>●●●</span></div>

          <header className="phone-header">
            <div>
              {screen !== 'home' && <button type="button" className="back-button" onClick={() => goToScreen('home')}><ChevronLeft size={17} /> Home</button>}
              <p className="muted">Good morning</p>
              <h2>{session?.agentName ?? '{Agent Name}'}</h2>
            </div>
            <div className="avatar"><UserRound size={21} /></div>
          </header>

          {renderScreen()}

          <nav className="bottom-nav" aria-label="Agent navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.screen === screen || (screen === 'sales' && item.screen === 'visits') || (screen === 'service' && item.screen === 'visits') || (screen === 'leave' && item.screen === 'attendance');
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
          </nav>
        </div>
      </section>
    </main>
  );
}

function ScreenPanel({ title, subtitle, notice, children }: { title: string; subtitle: string; notice: string | null; children: ReactNode }) {
  return (
    <section className="panel screen-panel">
      <div className="screen-heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {notice && <div className="screen-notice" role="status">{notice}</div>}
      {children}
    </section>
  );
}

export default App;
