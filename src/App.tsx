import { CalendarCheck, ClipboardList, FileText, Home, MapPin, Plus, UserRound } from 'lucide-react';
import { agentNavItems, formModules, sampleEntries } from './appData';

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

const actionMeta = [
  { label: 'Check in', hint: 'Start day', className: 'action-mint' },
  { label: 'Sales', hint: 'New visit', className: 'action-peach' },
  { label: 'Service', hint: 'Report', className: 'action-sky' },
  { label: 'Attendance', hint: 'Logs & leave', className: 'action-cream' },
];

const actionIcon = [MapPin, Plus, ClipboardList, CalendarCheck];

function App() {
  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">Approved direction</p>
        <h1>Agent home screen</h1>
        <p>Now applying the softer Google Sans design system to the actual Crystal Bio agent app.</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <div className="statusbar"><span>9:41</span><span>●●●</span></div>

          <header className="phone-header">
            <div>
              <p className="muted">Good morning</p>
              <h2>Rahul</h2>
            </div>
            <div className="avatar"><UserRound size={21} /></div>
          </header>

          <section className="planner-hero-card">
            <div>
              <p className="muted">Today</p>
              <strong>Ready for field work</strong>
              <span>Check in first. Add visits as the day moves.</span>
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
              return (
                <article key={module.slug} className={`action-card compact-action ${meta.className}`}>
                  <div className="icon-pill"><Icon size={20} /></div>
                  <h3>{meta.label}</h3>
                  <p>{meta.hint}</p>
                  {module.supportsDrafts && <span className="mini-dot">Draft</span>}
                </article>
              );
            })}
          </div>

          <section className="panel entries-panel">
            <div className="section-title">
              <h3>My entries</h3>
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
