import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ClipboardList, FileText, Home, MapPin, Plus, UserRound } from 'lucide-react';
import { agentNavItems, formModules, sampleEntries } from './appData';
import { crystalBioFrontendApi, type FrontendAttendance, type FrontendSession } from './crystalBioFrontendApi';

const toneClass: Record<string, string> = {
  warning: 'chip chip-warning',
  info: 'chip chip-info',
  soft: 'chip chip-soft',
};

const navIcon = {
  home: Home,
  entries: ClipboardList,
  leave: CalendarCheck,
  reports: FileText,
};

const actionIcon = [MapPin, Plus, ClipboardList, CalendarCheck];

function App() {
  const [session, setSession] = useState<FrontendSession | null>(null);
  const [attendance, setAttendance] = useState<FrontendAttendance | null>(null);
  const [isAttendanceBusy, setIsAttendanceBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading logged-in agent…');
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
      { label: attendanceAction, hint: attendanceHint, className: 'action-mint' },
      { label: 'Sales', hint: 'New visit', className: 'action-peach' },
      { label: 'Service', hint: 'Report', className: 'action-sky' },
      { label: 'Attendance', hint: 'Logs & leave', className: 'action-cream' },
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

  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">{isBackendConfigured ? 'Backend connected' : 'Demo preview'}</p>
        <h1>Agent home screen</h1>
        <p>{isBackendConfigured ? 'Home now logs in the agent and sends attendance check-in/check-out to the Crystal Bio backend API.' : 'GitHub Pages preview uses demo data; configure the backend URL to send real attendance records.'}</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <div className="statusbar"><span>9:41</span><span>●●●</span></div>

          <header className="phone-header">
            <div>
              <p className="muted">Good morning</p>
              <h2>{session?.agentName ?? '{Agent Name}'}</h2>
            </div>
            <div className="avatar"><UserRound size={21} /></div>
          </header>

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
            <span>4 tasks</span>
          </div>

          <div className="action-grid">
            {formModules.map((module, index) => {
              const meta = actionMeta[index];
              const Icon = actionIcon[index];
              const isAttendanceAction = index === 0;
              return (
                <button
                  key={module.slug}
                  className={`action-card compact-action ${meta.className}`}
                  type="button"
                  disabled={isAttendanceAction && (!session || isAttendanceBusy)}
                  onClick={isAttendanceAction ? handleAttendanceAction : undefined}
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
              <span>View all</span>
            </div>
            {sampleEntries.slice(0, 2).map((entry) => (
              <div className="entry-row" key={entry.customer}>
                <div>
                  <strong>{entry.customer}</strong>
                  <p>{entry.type} • Next: {entry.next}</p>
                </div>
                <span className={toneClass[entry.tone]}>{entry.status}</span>
              </div>
            ))}
          </section>

          <nav className="bottom-nav">
            {agentNavItems.map((item) => {
              const Icon = navIcon[item.icon];
              return (
                <span
                  key={item.label}
                  className={item.selected ? 'nav-item nav-item-selected' : 'nav-item'}
                  aria-label={item.selected ? `${item.label} selected` : item.label}
                >
                  <Icon size={17} />
                  {item.label}
                </span>
              );
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}

export default App;
