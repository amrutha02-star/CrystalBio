import { Bell, CalendarCheck, ClipboardList, FileText, Home, MapPin, Plus, UserRound } from 'lucide-react';
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
  { label: 'Leave', hint: 'Request', className: 'action-cream' },
];

function App() {
  return (
    <main className="app-shell agent-only-shell">
      <section className="preview-note">
        <p className="eyebrow">Agent view iteration</p>
        <h1>Crystal Bio Field Hub</h1>
        <p>Focusing only on the field-agent home screen before moving to admin.</p>
      </section>

      <section className="agent-preview-wrap">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <header className="phone-header">
            <div>
              <p className="muted">Good morning</p>
              <h2>Rahul</h2>
            </div>
            <div className="avatar"><UserRound size={22} /></div>
          </header>

          <div className="planner-hero-card">
            <div>
              <p className="muted">Today</p>
              <strong>Ready for field work</strong>
              <span>Check in first, then add sales or service updates.</span>
            </div>
            <Bell size={20} />
          </div>

          <div className="section-title action-title">
            <h3>Quick actions</h3>
            <span>4 tasks</span>
          </div>

          <div className="action-grid">
            {formModules.map((module, index) => {
              const meta = actionMeta[index];
              return (
                <article key={module.slug} className={`action-card compact-action ${meta.className}`}>
                  <div className="icon-pill">{index === 0 ? <MapPin /> : index === 1 ? <Plus /> : index === 2 ? <ClipboardList /> : <CalendarCheck />}</div>
                  <h3>{meta.label}</h3>
                  <p>{meta.hint}</p>
                  {module.supportsDrafts && <span className="mini-dot">Draft</span>}
                </article>
              );
            })}
          </div>

          <section className="panel entries-panel">
            <div className="section-title">
              <h3>My Entries</h3>
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
