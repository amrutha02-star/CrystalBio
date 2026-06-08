import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ClipboardList, FileText, Home, MapPin, Plus, Search, UserRound } from 'lucide-react';
import { sampleEntries } from './appData';
import { crystalBioFrontendApi, type FrontendAttendance, type FrontendSession } from './crystalBioFrontendApi';

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

function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [session, setSession] = useState<FrontendSession | null>(null);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading logged-in agent…');
  const [screenNotice, setScreenNotice] = useState<string | null>(null);
  const isBackendConfigured = crystalBioFrontendApi.isBackendConfigured();

  useEffect(() => {
    let isMounted = true;
    crystalBioFrontendApi
      .login()
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
    setScreen(nextScreen);
  };

  const showPreviewNotice = (message: string) => {
    setScreenNotice(message);
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
    <ScreenPanel notice={screenNotice} title="Sales visit" subtitle="Today’s visit update first, customer and quote details below.">
      <div className="form-card highlighted-card">
        <label>Current visit location</label>
        <p>GPS is mandatory when this update is saved.</p>
        <button type="button" className="secondary-action" onClick={() => showPreviewNotice('GPS capture is designed here. It will save location when the sales form is connected to the backend.')}>Capture GPS</button>
      </div>
      <div className="form-card"><label>Customer / lab name</label><span>Apollo Diagnostics</span></div>
      <div className="form-card"><label>Requirement</label><span>Product need, quote status, fund status, probability</span></div>
      <button type="button" className="primary-action" onClick={() => showPreviewNotice('Sales save is the next backend connection step. This preview keeps demo details fixed until that is connected.')}>Save visit update</button>
    </ScreenPanel>
  );

  const renderService = () => (
    <ScreenPanel notice={screenNotice} title="Service visit" subtitle="Open existing equipment history or save a new service update.">
      <div className="search-card"><Search size={17} /><span>Search customer, equipment, serial number, phone</span></div>
      <div className="form-card highlighted-card"><label>Today’s work done</label><span>Issue, service type, parts, next action, photos</span></div>
      <div className="form-card"><label>Equipment details</label><span>Model, serial number, warranty/AMC details</span></div>
      <button type="button" className="primary-action" onClick={() => showPreviewNotice('Service save is designed here and will save real records when the service form is connected.')}>Save service update</button>
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
      <div className="form-card"><label>Leave dates</label><span>Select start and end date</span></div>
      <div className="form-card"><label>Reason</label><span>Sick leave, personal work, emergency, other</span></div>
      <button type="button" className="primary-action" onClick={() => showPreviewNotice('Leave request submission is the next small backend connection. Demo preview does not change approval status automatically.')}>Submit leave request</button>
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
