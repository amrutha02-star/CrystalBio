import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('Crystal Bio agent view shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/?screen=home');
  });

  it('shows a clean login form and lets admins submit without logging out', async () => {
    window.history.pushState({}, '', '/?screen=login');
    render(<App />);

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.getByLabelText('Mobile number or employee ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Password or PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /admin access/i }));
    expect(await screen.findByLabelText('My form')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('My form'));
    expect(await screen.findByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to admin dashboard/i })).toBeInTheDocument();
  });

  it('renders the connected agent home with compact quick actions', async () => {
    render(<App />);

    expect(screen.getByText('Agent home screen')).toBeInTheDocument();
    expect(screen.getByText('CrystalBio Field Hub')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(await screen.findByText('Rahul Sales')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getAllByText('Attendance').length).toBeGreaterThan(0);
  });

  it('sends attendance check-in and changes the action to check out', async () => {
    render(<App />);

    const checkIn = await screen.findByRole('button', { name: /check in/i });
    fireEvent.click(checkIn);

    expect(screen.getByRole('heading', { name: 'Check in' })).toBeInTheDocument();
    expect(screen.getByText('Today’s work plan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /check in now/i }));

    await waitFor(() => expect(screen.getByText('Checked in. Sales visit saved with GPS.')).toBeInTheDocument());
    expect(screen.getByText('Checked in for field work')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Attendance'));
    expect(screen.getByText('Started today • Sales visit')).toBeInTheDocument();
    expect(screen.getAllByText('Checked in').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
  });

  it('sends attendance check-out after check-in', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /check in/i }));
    fireEvent.click(screen.getByRole('button', { name: /check in now/i }));
    await waitFor(() => expect(screen.getByText('Checked in. Sales visit saved with GPS.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => expect(screen.getByText('Checked out. End location saved.')).toBeInTheDocument());
    expect(screen.getByText('Ready for field work')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Attendance'));
    expect(screen.getByText('Completed today • Sales visit')).toBeInTheDocument();
    expect(screen.getAllByText('Checked out').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument();
  });

  it('keeps agent bottom navigation clear with selected home and profile access', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    expect(screen.getByLabelText('Home selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Visits')).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance')).toBeInTheDocument();
    expect(screen.getByLabelText('Reports')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('opens an agent profile page from the profile button with simple account and work details', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');
    fireEvent.click(screen.getByLabelText('Profile'));

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getAllByText('Rahul Sales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sales agent').length).toBeGreaterThan(0);
    expect(screen.getByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('agent_2')).toBeInTheDocument();
    expect(screen.getByText('Today’s status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request leave/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Profile selected').length).toBeGreaterThan(0);
  });

  it('keeps admin and monitoring sections out of the agent review screen', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    expect(screen.queryByText('Owner app mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal monitoring')).not.toBeInTheDocument();
  });

  it('opens every visible home quick action instead of leaving dead buttons', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    expect(screen.getByText('Sales visit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /service report/i }));
    expect(screen.getByText('Service visit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /^attendance logs & leave$/i }));
    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request leave/i })).toBeInTheDocument();
  });

  it('opens bottom navigation screens and presents reports as current field data, not fixed demo numbers', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /^visits$/i }));
    expect(screen.getByRole('heading', { name: 'Visits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new sales visit update/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^reports$/i }));
    expect(screen.getByText('My reports')).toBeInTheDocument();
    expect(screen.getByText('Weekly summary')).toBeInTheDocument();
    expect(screen.getByText('Current data')).toBeInTheDocument();
    expect(screen.getByText('Report summary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^month$/i }));
    expect(screen.getByText('Monthly summary')).toBeInTheDocument();
    expect(screen.getAllByText(/June 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^week$/i }));
    expect(screen.getByText('Weekly summary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^monthly$/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Monthly summary ready'));
    expect(screen.getByText('Monthly summary')).toBeInTheDocument();
    expect(screen.queryByText(/fixed demo values/i)).not.toBeInTheDocument();
  });

  it('opens recent visit rows instead of showing non-clickable dashboard details', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /apollo diagnostics/i }));
    expect(screen.getByText('Sales visit')).toBeInTheDocument();
  });

  it('keeps admin/report demo controls out of the agent home screen', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    expect(screen.queryByText('End-to-end demo flow')).not.toBeInTheDocument();
    expect(screen.queryByText('Client story')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /preview admin report flow/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Admin reports')).not.toBeInTheDocument();
    expect(screen.getByText('Recent visits')).toBeInTheDocument();
  });

  it('shows feedback for second-level preview buttons instead of doing nothing', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    fireEvent.click(screen.getByRole('button', { name: /save step 1/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 1 saved'));
    expect(screen.getByRole('status')).toHaveClass('save-toast');
    expect(screen.queryByRole('status')).not.toHaveClass('screen-notice');
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 4500 });
    expect(screen.getByRole('button', { name: /save step 1 changes/i })).toBeEnabled();
    expect(screen.getByText(/Apollo Diagnostics • Visit 1 • follow up needed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Step 2: pending • Step 3: pending/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Sales visit note'), { target: { value: 'Updated after first save.' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 1 changes/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 1 updated'));

    fireEvent.change(screen.getByLabelText('Sales email'), { target: { value: 'lab@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 2/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 2 saved'));
    expect(screen.getAllByText(/Step 2: saved • Step 3: pending/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Sales quote submitted'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText('Sales office notes'), { target: { value: 'Prepare quote follow-up' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 3/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 3 saved'));
    expect(screen.getAllByText(/Step 2: saved • Step 3: saved/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /save step 2/i })).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /service report/i }));
    await waitFor(() => expect(screen.getByText('Meera Service')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /save step 1/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service visit saved'));
    expect(screen.getByRole('button', { name: /save step 1 changes/i })).toBeEnabled();
    expect(screen.getByText(/Metro Lab • Visit 1 • parts required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Step 2: pending • Step 3: pending/i).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Service work done'), { target: { value: 'Updated after first save.' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 1 changes/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service Step 1 updated'));
    fireEvent.change(screen.getByLabelText('Service issue description'), { target: { value: 'Noise during spin cycle' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 2/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service Step 2 saved'));
    fireEvent.change(screen.getByLabelText('Service final remarks'), { target: { value: 'Customer informed about parts timeline' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 3/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service Step 3 saved'));
    expect(screen.getAllByText(/Step 2: saved • Step 3: saved/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Attendance'));
    fireEvent.click(screen.getByRole('button', { name: /request leave/i }));
    fireEvent.change(screen.getByLabelText('Leave from date'), { target: { value: '2026-06-12' } });
    fireEvent.change(screen.getByLabelText('Leave to date'), { target: { value: '2026-06-13' } });
    fireEvent.change(screen.getByLabelText('Leave reason'), { target: { value: 'Personal work' } });
    fireEvent.change(screen.getByLabelText('Leave note'), { target: { value: 'Family appointment' } });
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Leave request sent'));
    expect(screen.getAllByText(/2026-06-12 to 2026-06-13/i).length).toBeGreaterThan(0);
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('Note: Family appointment')).toBeInTheDocument();
  }, 10000);

  it('opens the admin overview route with interactive filters, attention, agent filter, and nav', async () => {
    window.history.pushState({}, '', '/?screen=admin');
    render(<App />);

    expect(screen.getByText('Admin overview screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
    expect(screen.getByText('3 agents active')).toBeInTheDocument();
    expect(screen.getByText('Leave approvals')).toBeInTheDocument();
    expect(screen.queryByText('Apollo Diagnostics')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByText('8 agents active')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Agents' }));
    expect(screen.getByRole('heading', { name: 'Agents' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sales agents' }));
    expect(screen.getByText('Rahul Sales')).toBeInTheDocument();
    expect(screen.getByText('Anil Sales')).toBeInTheDocument();
    expect(screen.queryByText('Meera Service')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Approvals' }));
    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Meera Service.*Sick leave/i }));
    expect(screen.getByText('Back to approvals')).toBeInTheDocument();
    expect(screen.getByText('12 Jun to 13 Jun • Sick leave')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Approved'));
  });

  it('shows person-wise admin reports and feedback when generating reports', async () => {
    window.history.pushState({}, '', '/?screen=admin&adminTab=adminReports');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Admin reports' })).toBeInTheDocument();
    expect(screen.getByText('Person-wise reports')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sales')).toBeInTheDocument();
    expect(screen.getByText('Meera Service')).toBeInTheDocument();
    expect(screen.getByText('Anil Sales')).toBeInTheDocument();
    expect(screen.queryByText('Auto-generated from field activity')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByText('8 sales visits • 3 follow-ups')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /generate this week admin report/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('This week admin report ready'));
  });
});
