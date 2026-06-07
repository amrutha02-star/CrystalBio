import { describe, expect, it } from 'vitest';
import { formModules, buildPhases, agentNavItems, getRequiredMvpModules } from './appData';

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
    expect(sales?.supportsDrafts).toBe(true);
    expect(service?.supportsDrafts).toBe(true);
  });

  it('prioritizes agent usability before advanced reporting', () => {
    expect(buildPhases[0].title).toContain('Final Requirements');
    expect(buildPhases[1].title).toContain('Core Agent App');
    expect(buildPhases[4].title).toContain('Telegram and Email Reporting');
  });

  it('exposes a simple agent navigation model', () => {
    expect(agentNavItems).toContain('Home');
    expect(agentNavItems).toContain('Entries');
    expect(agentNavItems).toContain('Leave');
    expect(agentNavItems.length).toBeLessThanOrEqual(5);
  });

  it('defines a realistic MVP scope', () => {
    expect(getRequiredMvpModules()).toEqual([
      'Email login',
      'Daily check-in',
      'Sales report',
      'Service report',
      'Leave request',
      'Save draft',
      'My Entries',
      'Admin dashboard',
      'Leave approval',
      'Basic reports',
    ]);
  });
});
