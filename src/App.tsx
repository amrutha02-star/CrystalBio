import { AlertTriangle, Bell, CalendarCheck, CheckCircle2, ClipboardList, Mail, MapPin, Plus, UserRound } from 'lucide-react';
import { adminMetrics, agentNavItems, buildPhases, formModules, getRequiredMvpModules, sampleEntries } from './appData';

const toneClass: Record<string, string> = {
  warning: 'chip chip-warning',
  info: 'chip chip-info',
  soft: 'chip chip-soft',
};

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Crystal Bio Equipment</p>
          <h1>Crystal Bio Field Hub</h1>
          <p className="hero-copy">
            Mobile-first MVP for sales and service agents to check in, submit visits, continue follow-ups, request leave, and see their own entries.
          </p>
        </div>
        <div className="hero-badge">
          <CheckCircle2 size={20} /> Phase 1 build started
        </div>
      </section>

      <section className="phone-grid">
        <div className="phone-frame agent-phone" aria-label="Agent app preview">
          <header className="phone-header">
            <div>
              <p className="muted">Good morning</p>
              <h2>Rahul</h2>
            </div>
            <div className="avatar"><UserRound size={22} /></div>
          </header>

          <div className="attention-card">
            <div>
              <p className="muted">Today</p>
              <strong>3 things need attention</strong>
            </div>
            <Bell size={20} />
          </div>

          <div className="action-grid">
            {formModules.map((module, index) => (
              <article key={module.slug} className="action-card">
                <div className="icon-pill">{index === 0 ? <MapPin /> : index === 1 ? <Plus /> : index === 2 ? <ClipboardList /> : <CalendarCheck />}</div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                {module.supportsDrafts && <span className="chip chip-soft">Save draft</span>}
              </article>
            ))}
          </div>

          <section className="panel">
            <div className="section-title">
              <h3>My Entries</h3>
              <span>View all</span>
            </div>
            {sampleEntries.map((entry) => (
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
            {agentNavItems.map((item) => <span key={item}>{item}</span>)}
          </nav>
        </div>

        <div className="desktop-panel">
          <div className="section-title large">
            <div>
              <p className="eyebrow">Owner/Admin</p>
              <h2>Admin command view</h2>
            </div>
            <span className="chip chip-info">Live visibility</span>
          </div>

          <div className="metric-grid">
            {adminMetrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </div>

          <section className="report-stack">
            <h3>Automatic reports</h3>
            <div className="report-card"><Mail size={18} /> Saturday weekly email</div>
            <div className="report-card"><Mail size={18} /> Monthly 1st-day report</div>
            <div className="report-card"><Bell size={18} /> Immediate Telegram alerts for important updates</div>
          </section>

          <section className="issue-card">
            <div>
              <p className="eyebrow">Monitoring</p>
              <h3>Issue Command Center</h3>
              <p>Tracks failed submissions, stuck drafts, photo upload issues, report delivery failures, and login problems in plain English.</p>
            </div>
            <AlertTriangle />
          </section>
        </div>
      </section>

      <section className="phase-section">
        <div className="section-title large">
          <div>
            <p className="eyebrow">Build plan</p>
            <h2>Phased delivery so the app does not become overwhelming</h2>
          </div>
        </div>
        <div className="phase-grid">
          {buildPhases.map((phase) => (
            <article key={phase.title} className="phase-card">
              <h3>{phase.title}</h3>
              <p>{phase.goal}</p>
              <ul>
                {phase.deliverables.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mvp-card">
        <p className="eyebrow">MVP scope</p>
        <h2>First version must prove agents can use it comfortably</h2>
        <div className="mvp-list">
          {getRequiredMvpModules().map((module) => <span key={module}>{module}</span>)}
        </div>
      </section>
    </main>
  );
}

export default App;
