import { describe, expect, it } from 'vitest';
import { formModules, buildPhases, agentNavItems, getRequiredMvpModules, roleAccess } from './appData';

describe('Crystal Bio product model', () => {
  it('maps the four existing Convogenie forms into app modules', () => {
    expect(formModules.map((module) => module.slug)).toEqual([
      'daily-check-in',
      'sales-visit',
      'service-visit',
      'leave-request',
    ]);
  });

  it('keeps sales and service as stepped flows instead of one long form', () => {
    const sales = formModules.find((module) => module.slug === 'sales-visit');
    const service = formModules.find((module) => module.slug === 'service-visit');

    expect(sales?.steps.length).toBeGreaterThanOrEqual(5);
    expect(service?.steps.length).toBeGreaterThanOrEqual(5);
    expect(sales?.supportsPartialSave).toBe(true);
    expect(service?.supportsPartialSave).toBe(true);
  });

  it('prioritizes agent usability before advanced reporting', () => {
    expect(buildPhases[0].title).toContain('Final Requirements');
    expect(buildPhases[1].title).toContain('Core Agent App');
    expect(buildPhases[4].title).toContain('Telegram and Email Reporting');
  });

  it('exposes a simple agent navigation model with selected-state friendly items', () => {
    expect(agentNavItems.map((item) => item.label)).toContain('Home');
    expect(agentNavItems.map((item) => item.label)).toContain('Visits');
    expect(agentNavItems.map((item) => item.label)).toContain('Attendance');
    expect(agentNavItems.length).toBeLessThanOrEqual(5);
  });

  it('keeps admin as a role inside the same app, not a separate PDF-style page', () => {
    expect(roleAccess.owner.canSubmitForms).toBe(true);
    expect(roleAccess.owner.canViewAdminDashboard).toBe(true);
    expect(roleAccess.agent.canViewAdminDashboard).toBe(false);
  });

  it('keeps internal monitoring visible to Amrutha/project team, not field agents or client owner', () => {
    expect(roleAccess.projectMonitor.canViewIssueCommandCenter).toBe(true);
    expect(roleAccess.owner.canViewIssueCommandCenter).toBe(false);
    expect(roleAccess.agent.canViewIssueCommandCenter).toBe(false);
  });

  it('defines a realistic MVP scope', () => {
    expect(getRequiredMvpModules()).toEqual([
      'Email login',
      'Daily check-in',
      'Sales report',
      'Service report',
      'Leave request',
      'Saved visit updates',
      'Visits',
      'Admin dashboard',
      'Leave approval',
      'Basic reports',
    ]);
  });
});
