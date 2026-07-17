import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { crystalBioFrontendApi } from './crystalBioFrontendApi';

describe('Crystal Bio agent view shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = 'crystalbio_frontend_session=; Path=/; Max-Age=0; SameSite=Lax';
    window.history.pushState({}, '', '/?screen=home');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:crystalbio-report') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('shows a clean single login form without redundant access copy', async () => {
    window.history.pushState({}, '', '/?screen=login');
    render(<App />);

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.getByText('Use your registered email and password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Registered email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.queryByText('Field work login')).not.toBeInTheDocument();
    expect(screen.queryByText(/invite-only access/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /admin access/i })).not.toBeInTheDocument();
  });

  it('shows the Periwinkle live monitor without asking for a CrystalBio login', async () => {
    window.history.pushState({}, '', '/periwinkle-live-monitor-a93f27.html');

    render(<App />);

    expect(screen.getByText('Admin monitoring screen')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Live monitor' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Periwinkle public monitor • no company login needed')).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Registered email')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Admin navigation' })).not.toBeInTheDocument();
  });

  it('keeps the password field inside a real login form so phone Enter/Go can submit', async () => {
    window.history.pushState({}, '', '/?screen=login');
    render(<App />);

    const loginForm = screen.getByRole('form', { name: 'Login form' });

    expect(loginForm).toContainElement(screen.getByLabelText('Password'));
    expect(screen.getByRole('button', { name: /^login$/i })).toHaveAttribute('type', 'submit');
  });

  it('submits login when Enter/Go is pressed from the password field', async () => {
    window.history.pushState({}, '', '/?screen=login');
    render(<App />);

    fireEvent.keyDown(screen.getByLabelText('Password'), { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(screen.getByText('Agent home screen')).toBeInTheDocument());
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });

  it('keeps a saved logged-in session after a browser refresh without returning to login', async () => {
    window.history.pushState({}, '', '/');
    window.localStorage.setItem('crystalbio.session.v1', JSON.stringify({
      token: 'saved-token',
      agentId: 'agent_qa',
      agentName: 'QA Test Agent',
      role: 'both',
      phone: 'Registered mobile',
      email: 'qa.agent@crystalbio.in',
    }));

    render(<App />);

    expect(screen.getByText('Agent home screen')).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
    expect(screen.getByText('QA Test Agent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument();
  });

  it('restores a saved login from the first-party app cookie when mobile storage is missing', async () => {
    window.history.pushState({}, '', '/');
    document.cookie = `crystalbio_frontend_session=${encodeURIComponent(JSON.stringify({
      token: 'cookie-token',
      agentId: 'agent_cookie',
      agentName: 'Cookie Session Agent',
      role: 'sales',
      phone: 'Registered mobile',
      email: 'cookie.agent@crystalbio.in',
    }))}; Path=/; Max-Age=7776000; SameSite=Lax`;

    render(<App />);

    expect(screen.getByText('Agent home screen')).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
    expect(screen.getByText('Cookie Session Agent')).toBeInTheDocument();
    expect(window.localStorage.getItem('crystalbio.session.v1')).toContain('cookie-token');
  });

  it('writes a first-party app cookie when login is saved so daily reopen has a fallback', async () => {
    window.history.pushState({}, '', '/?screen=login');

    render(<App />);
    fireEvent.keyDown(screen.getByLabelText('Password'), { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(screen.getByText('Agent home screen')).toBeInTheDocument());
    expect(document.cookie).toContain('crystalbio_frontend_session=');
  });

  it('clears the first-party app cookie when the user logs out', async () => {
    window.history.pushState({}, '', '/?screen=profile');
    window.localStorage.setItem('crystalbio.session.v1', JSON.stringify({
      token: 'saved-token',
      agentId: 'agent_qa',
      agentName: 'QA Test Agent',
      role: 'both',
      phone: 'Registered mobile',
      email: 'qa.agent@crystalbio.in',
    }));
    document.cookie = `crystalbio_frontend_session=${encodeURIComponent(JSON.stringify({
      token: 'saved-token',
      agentId: 'agent_qa',
      agentName: 'QA Test Agent',
      role: 'both',
      phone: 'Registered mobile',
      email: 'qa.agent@crystalbio.in',
    }))}; Path=/; Max-Age=7776000; SameSite=Lax`;

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(document.cookie).not.toContain('crystalbio_frontend_session=');
  });

  it('renders the connected agent home with compact quick actions', async () => {
    render(<App />);

    expect(screen.getByText('Agent home screen')).toBeInTheDocument();
    expect(screen.getByText('CrystalBio Field Hub')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(await screen.findByText('QA Test Agent')).toBeInTheDocument();
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
    expect(screen.getAllByText(/Started at .*Sales visit/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Checked in').length).toBeGreaterThan(0);
    expect(screen.queryByText('Saved work mode')).not.toBeInTheDocument();
    const checkOut = screen.getByRole('button', { name: /check out/i });
    expect(checkOut).toBeInTheDocument();
    fireEvent.click(checkOut);
    await waitFor(() => expect(screen.getByRole('button', { name: /check in again/i })).toBeInTheDocument());
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
    expect(screen.getAllByText(/Finished at .*Sales visit/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Checked out').length).toBeGreaterThan(0);
    const checkInAgain = screen.getByRole('button', { name: /check in again/i });
    expect(checkInAgain).toBeEnabled();
    fireEvent.click(checkInAgain);
    expect(screen.getByRole('heading', { name: 'Check in again' })).toBeInTheDocument();
  });

  it('keeps agent bottom navigation focused on work screens because profile is in the top header', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    expect(screen.getByLabelText('Home selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Visits')).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance')).toBeInTheDocument();
    expect(screen.getByLabelText('Reports')).toBeInTheDocument();
    expect(screen.getByLabelText('Open profile')).toBeInTheDocument();
    expect(screen.queryByLabelText('Profile')).not.toBeInTheDocument();
  });

  it('opens an agent profile page from the top profile button with login contact details only', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');
    fireEvent.click(screen.getByLabelText('Open profile'));

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getAllByText('QA Test Agent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sales + service agent').length).toBeGreaterThan(0);
    expect(screen.getByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('agent_2')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Registered mobile')).toBeInTheDocument();
    expect(screen.getByText('Email ID')).toBeInTheDocument();
    expect(screen.getByText('qa.agent@crystalbio.in')).toBeInTheDocument();
    expect(screen.queryByText('Today’s status')).not.toBeInTheDocument();
    expect(screen.queryByText('Leave status')).not.toBeInTheDocument();
    expect(screen.queryByText('What this page is for')).not.toBeInTheDocument();
    expect(screen.queryByText(/Agents can quickly confirm/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request leave/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view attendance/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Profile selected')).toBeInTheDocument();
  });

  it('keeps admin and monitoring sections out of the agent review screen', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    expect(screen.queryByText('Owner app mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal monitoring')).not.toBeInTheDocument();
  });

  it('opens every visible home quick action instead of leaving dead buttons', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sales new visit/i })); });
    expect(screen.getByText('Sales visit')).toBeInTheDocument();
    expect(screen.queryByText('Field visit assistant')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous entries/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sales quick contact person')).toBeInTheDocument();
    expect(screen.getByLabelText('Sales quick phone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /customer & requirement details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quote & office details/i })).toBeInTheDocument();
    expect(screen.queryByText('Office action markers')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByLabelText('Home')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /service new service update/i })); });
    expect(screen.getByText('Service visit')).toBeInTheDocument();
    expect(screen.queryByText('Save the site update first')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Service quick equipment')).toBeInTheDocument();
    expect(screen.getByLabelText('Service quick contact person')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /customer, equipment, issue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parts & office details/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /arrange parts/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByLabelText('Home')); });
    act(() => { fireEvent.click(screen.getByRole('button', { name: /^attendance logs & leave$/i })); });
    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request leave/i })).toBeInTheDocument();
  });

  it('opens bottom navigation screens and presents reports as current field data, not fixed demo numbers', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    fireEvent.click(screen.getByRole('button', { name: /^visits$/i }));
    expect(screen.getByRole('heading', { name: 'Visits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new sales visit update/i })).toBeInTheDocument();
    expect(screen.getByText('Previous entries')).toBeInTheDocument();
    expect(screen.getByText(/No saved visits yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^reports$/i }));
    expect(screen.getByText('My reports')).toBeInTheDocument();
    expect(screen.getByText(/Weekly report/)).toBeInTheDocument();
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
    expect(screen.getByText(/Downloads a real PDF from saved field entries/i)).toBeInTheDocument();
    expect(screen.getByText('Attendance report')).toBeInTheDocument();
    expect(screen.getAllByText('Custom dates').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('My report preset'), { target: { value: 'custom' } });
    expect(screen.getByLabelText('My report from date')).toBeInTheDocument();
    expect(screen.getByLabelText('My report to date')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('My report preset'), { target: { value: 'month' } });
    expect(screen.getByText(/Monthly report/)).toBeInTheDocument();
    expect(screen.getAllByText(/This month/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('My report preset'), { target: { value: 'week' } });
    expect(screen.getByText(/Weekly report/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^monthly$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^generate report$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^download report$/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Report downloaded'));
    expect(screen.getAllByText(/Weekly report/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/fixed demo values/i)).not.toBeInTheDocument();
  });

  it('opens recent visit rows instead of showing non-clickable dashboard details', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    fireEvent.click(screen.getByRole('button', { name: /^visits$/i }));
    expect(screen.queryByRole('button', { name: /apollo diagnostics/i })).not.toBeInTheDocument();
    expect(screen.getByText(/No saved visits yet/i)).toBeInTheDocument();
  });

  it('keeps admin/report demo controls out of the agent home screen', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    expect(screen.queryByText('End-to-end demo flow')).not.toBeInTheDocument();
    expect(screen.queryByText('Client story')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /preview admin report flow/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Admin reports')).not.toBeInTheDocument();
    expect(screen.getByText('Recent visits')).toBeInTheDocument();
  });

  it('shows feedback for second-level preview buttons instead of doing nothing', async () => {
    render(<App />);

    await screen.findByText('QA Test Agent');

    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    fireEvent.change(screen.getByLabelText('Sales customer name'), { target: { value: 'QA Test Lab' } });
    fireEvent.change(screen.getByLabelText('Sales visit note'), { target: { value: 'QA sales visit note' } });
    fireEvent.change(screen.getByLabelText('Sales follow-up date'), { target: { value: '2026-06-20' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 1/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 1 saved'));
    expect(screen.getByRole('status')).toHaveClass('save-toast');
    expect(screen.queryByRole('status')).not.toHaveClass('screen-notice');
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 4500 });
    expect(screen.getByText('Saved Sales Entry')).toBeInTheDocument();
    expect(screen.getByText('What do you want to do now?')).toBeInTheDocument();
    expect(screen.queryByText('Follow-up timeline')).not.toBeInTheDocument();
    expect(screen.getByText(/QA Test Lab/)).toBeInTheDocument();
    expect(screen.getByText((content) => /^\d{2}\/\d{2}\/\d{4} • \d{2}:\d{2}$/.test(content))).toBeInTheDocument();
    expect(screen.queryByText(/^\d{4}-\d{2}-\d{2} • \d{2}:\d{2}$/)).not.toBeInTheDocument();
    expect(screen.getByText(/Step 2\s+pending/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add follow-up 2/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /add follow-up/i }));
    expect(screen.getByRole('button', { name: /save follow-up/i })).toBeEnabled();
    expect(screen.getByLabelText('Sales email')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Sales follow-up status'), { target: { value: 'no_follow_up' } });
    expect(screen.queryByLabelText('Sales follow-up note')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save status/i })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Sales follow-up status'), { target: { value: 'follow_up_needed' } });
    expect(screen.getByLabelText('Sales follow-up note')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sales follow-up note'), { target: { value: 'Updated after first save.' } });
    fireEvent.click(screen.getByRole('button', { name: /save follow-up/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Follow-up saved'));
    expect(screen.getByText('Follow-up 2')).toBeInTheDocument();
    expect(screen.getAllByText('Updated after first save.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /add follow-up 3/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Sales email'), { target: { value: 'lab@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 2/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 2 saved'));
    expect(screen.getAllByText(/Step 2\s+saved/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Step 3\s+pending/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Sales quote submitted')).toBeEnabled();

    expect(screen.getAllByLabelText('Sales camera photo')).toHaveLength(1);
    expect(screen.getByLabelText('Sales camera photo')).toHaveClass('visually-hidden');
    expect(screen.getByLabelText('Sales upload photo')).toHaveClass('visually-hidden');
    expect(screen.getByLabelText('Sales camera photo').closest('.photo-button')).toHaveTextContent(/^Camera$/);
    expect(screen.getByLabelText('Sales upload photo').closest('.photo-button')).toHaveTextContent(/^Upload$/);
    expect(screen.queryByText('Photos if needed')).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('Sales camera photo')).toHaveLength(1);
    expect(screen.queryByText('Photos if needed')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sales quote submitted'), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText('Sales office notes'), { target: { value: 'Prepare quote follow-up' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 3/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 3 saved'));
    expect(screen.getAllByText(/Step 2\s+saved/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Step 3\s+saved/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    expect(screen.getByRole('button', { name: /save step 1/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /customer & requirement details/i }));
    expect(screen.getByRole('button', { name: /save step 2/i })).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /service new service update/i }));
    await waitFor(() => expect(screen.getByText('Service Agent')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Service customer name'), { target: { value: 'QA Service Lab' } });
    fireEvent.change(screen.getByLabelText('Service work done'), { target: { value: 'QA service work done' } });
    fireEvent.change(screen.getByLabelText('Service next visit date'), { target: { value: '2026-06-21' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 1/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service visit saved'));
    expect(screen.getByText('Saved Service Entry')).toBeInTheDocument();
    expect(screen.getByText('What do you want to do now?')).toBeInTheDocument();
    expect(screen.queryByText('Follow-up timeline')).not.toBeInTheDocument();
    expect(screen.getByText(/QA Service Lab/)).toBeInTheDocument();
    expect(screen.getByText(/Step 2\s+pending/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add follow-up 2/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /add follow-up/i }));
    expect(screen.getByRole('button', { name: /save follow-up/i })).toBeEnabled();
    expect(screen.getByLabelText('Service issue description')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Service follow-up status'), { target: { value: 'no_follow_up' } });
    expect(screen.queryByLabelText('Service follow-up note')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save status/i })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Service follow-up status'), { target: { value: 'parts_required' } });
    expect(screen.getByLabelText('Service follow-up note')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Service follow-up note'), { target: { value: 'Updated after first save.' } });
    fireEvent.click(screen.getByRole('button', { name: /save follow-up/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Follow-up saved'));
    expect(screen.getByText('Follow-up 2')).toBeInTheDocument();
    expect(screen.getAllByText('Updated after first save.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /add follow-up 3/i })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Service issue description'), { target: { value: 'Noise during spin cycle' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 2/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service Step 2 saved'));
    expect(screen.getByLabelText('Service final remarks')).toBeEnabled();
    expect(screen.getAllByLabelText('Service camera photo')).toHaveLength(1);
    expect(screen.queryByText('Service photos')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Service final remarks'), { target: { value: 'Customer informed about parts timeline' } });
    fireEvent.click(screen.getByRole('button', { name: /save step 3/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Service Step 3 saved'));
    expect(screen.getAllByText(/Step 2\s+saved/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Step 3\s+saved/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Attendance'));
    fireEvent.click(screen.getByRole('button', { name: /request leave/i }));
    fireEvent.change(screen.getByLabelText('Leave from date'), { target: { value: '2026-06-12' } });
    fireEvent.change(screen.getByLabelText('Leave to date'), { target: { value: '2026-06-13' } });
    fireEvent.change(screen.getByLabelText('Leave reason'), { target: { value: 'Personal work' } });
    fireEvent.change(screen.getByLabelText('Leave note'), { target: { value: 'Family appointment' } });
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Leave request sent'));
    expect(screen.getAllByText(/12\/06\/2026 to 13\/06\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('Note: Family appointment')).toBeInTheDocument();
  }, 10000);

  it('opens the admin overview route with useful submitted-work summary and no repeated team dump', async () => {
    window.history.pushState({}, '', '/?screen=admin');
    render(<App />);

    expect(screen.getByText('Admin overview screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open admin profile/i }));
    expect(screen.getByText('Admin profiles screen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /overview/i })[0]);
    expect(screen.getByRole('button', { name: /total visits today show forms/i })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: /total visits today show forms/i }));
    expect(screen.getByRole('button', { name: /total visits today hide/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No submitted Sales or Service forms today.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /checked in agents active show active/i }));
    expect(screen.getByText('No agents currently checked in.')).toBeInTheDocument();
    expect(screen.queryByText(/Auto checked out/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Out /i)).not.toBeInTheDocument();
    expect(screen.getByText('Today field status')).toBeInTheDocument();
    expect(screen.getByText(/No submitted work yet today|field updates today/i)).toBeInTheDocument();
    expect(screen.getByText('Leave approvals')).toBeInTheDocument();
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Launch monitoring')).not.toBeInTheDocument();
    expect(screen.queryByText('No user-action failures captured')).not.toBeInTheDocument();
    expect(screen.queryByText('Latest submitted work')).not.toBeInTheDocument();
    expect(screen.queryByText('Today’s action queue')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
    expect(screen.getByLabelText('Overview selected')).toBeInTheDocument();
    expect(screen.queryByLabelText('Overview date range preset')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Field entry' }));
    expect(screen.getByText('Admin field entry screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Field entry' })).toBeInTheDocument();
    expect(screen.getByText('Field entries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My entries' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All entries' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search field entries')).toBeInTheDocument();
    expect(screen.getByText('Submit your own field update')).toBeInTheDocument();
    expect(screen.queryByText(/help an agent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Full team entries are under Agents/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Agents' }));
    expect(screen.getByRole('heading', { name: 'Agents' })).toBeInTheDocument();
    expect(screen.getByText('Team today')).toBeInTheDocument();
    expect(screen.getByLabelText('Team summary')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent status filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All agents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sales' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Service' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In office' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Checked in' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Not in' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Checked out' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Checked out' })[0]);
    expect(screen.getAllByRole('button', { name: 'Checked out' })[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Agent list')).toBeInTheDocument();
    expect(screen.queryByText('Submitted entries')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent 5 entries')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Entry agent filter')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Entry type filter')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view all entries/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Activity date range preset')).not.toBeInTheDocument();
    expect(screen.queryByText('Team status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view team status/i })).not.toBeInTheDocument();
    expect(screen.queryByText('QA Test Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Sales Agent')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Approvals' }));
    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.queryByText(/Sick leave/i)).not.toBeInTheDocument();
  });


  it('shows a clear show-all control when Field Entry has more than 10 matching rows', async () => {
    window.history.pushState({}, '', '/?screen=admin');
    window.localStorage.setItem('crystalbio.session.v1', JSON.stringify({
      token: 'admin-token',
      agentId: 'admin_1',
      agentName: 'Raghavendra',
      role: 'admin',
      phone: 'Registered mobile',
      email: 'sales@crystalbio.in',
    }));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Field entry' }));
    for (let index = 1; index <= 11; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /sales entry/i }));
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Sales visit' })).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText('Sales customer name'), { target: { value: `Visibility Test Customer ${index}` } });
      fireEvent.change(screen.getByLabelText('Sales visit note'), { target: { value: 'Testing Field Entry visibility' } });
      fireEvent.change(screen.getByLabelText('Sales next action'), { target: { value: 'no_follow_up' } });
      fireEvent.click(screen.getByRole('button', { name: /^save step 1$/i }));
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 1 saved'));
      fireEvent.click(screen.getByRole('button', { name: /field entry/i }));
    }

    expect(screen.getByText('10 of 11 shown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show all 11 entries' })).toBeInTheDocument();
    expect(screen.queryByText('Visibility Test Customer 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all 11 entries' }));
    expect(screen.getByText('11 of 11 shown')).toBeInTheDocument();
    expect(screen.getByText('Visibility Test Customer 1')).toBeInTheDocument();

    const overviewNavButtons = screen.getAllByRole('button', { name: 'Overview' });
    fireEvent.click(overviewNavButtons[overviewNavButtons.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: /total visits today show forms/i }));
    const totalVisitsDetail = screen.getByLabelText('Total visits details');
    expect(within(totalVisitsDetail).getByText('Total visits')).toBeInTheDocument();
    expect(within(totalVisitsDetail).getByText('11')).toBeInTheDocument();
    expect(within(totalVisitsDetail).getByRole('button', { name: 'Open all in Field Entry' })).toBeInTheDocument();
  }, 20000);

  it('keeps report entry details inside Reports instead of jumping to Agents', async () => {
    window.history.pushState({}, '', '/?screen=admin');
    window.localStorage.setItem('crystalbio.session.v1', JSON.stringify({
      token: 'admin-token',
      agentId: 'admin_1',
      agentName: 'Raghavendra',
      role: 'admin',
      phone: 'Registered mobile',
      email: 'sales@crystalbio.in',
    }));
    vi.spyOn(crystalBioFrontendApi, 'getAdminLeaveRequests').mockResolvedValue([
      {
        id: 'leave_overlap_test',
        agentId: 'agent_2',
        agentName: 'QA Test Agent',
        fromDate: '2026-06-12',
        toDate: '2026-06-13',
        reason: 'Personal work',
        status: 'pending',
      },
    ]);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Field entry' }));
    fireEvent.click(screen.getByRole('button', { name: /sales entry/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sales visit' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Sales customer name'), { target: { value: 'Report Back Test Lab' } });
    fireEvent.change(screen.getByLabelText('Sales visit note'), { target: { value: 'Testing reports back path' } });
    fireEvent.change(screen.getByLabelText('Sales follow-up date'), { target: { value: '2026-06-20' } });
    fireEvent.click(screen.getByRole('button', { name: /^save step 1$/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sales Step 1 saved'));

    fireEvent.click(screen.getByRole('button', { name: /field entry/i }));
    const overviewButtons = screen.getAllByRole('button', { name: 'Overview' });
    fireEvent.click(overviewButtons[overviewButtons.length - 1]);
    await waitFor(() => expect(screen.getByRole('button', { name: /1\s+Leave\s+Needs review\s+Review/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /1\s+Leave\s+Needs review\s+Review/i }));
    expect(screen.getByText('Leave request')).toBeInTheDocument();
    expect(screen.queryByText('Latest submitted work')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /total visits today show forms/i }));
    expect(screen.queryByRole('button', { name: /open submitted work/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Report Back Test Lab.*Raghavendra.*Sales.*Open/i }));
    expect(screen.getByLabelText('Submitted form details')).toBeInTheDocument();
    expect(screen.getByText('Back to dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Leave request')).not.toBeInTheDocument();
    expect(screen.getByText('Sales agent: Raghavendra')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to dashboard/i }));
    expect(screen.getByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /total visits today show forms/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Field entry' }));
    expect(screen.getByRole('heading', { name: 'Field entry' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Report Back Test Lab.*View details/i }));
    expect(screen.getByLabelText('Submitted form details')).toBeInTheDocument();
    expect(screen.getByText('Back to field entries')).toBeInTheDocument();
    expect(screen.queryByText(/Read-only view/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Submitted by')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 status')).not.toBeInTheDocument();
    expect(screen.getByText('Sales agent: Raghavendra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit this entry/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit this entry/i }));
    expect(screen.getByRole('heading', { name: 'Sales visit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit saved details/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /field entry/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Reports' }));
    expect(screen.getByRole('heading', { name: 'Admin reports' })).toBeInTheDocument();
    expect(screen.getByText('Today’s report')).toBeInTheDocument();
    expect(screen.queryByText('Submitted forms')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Report Back Test Lab/i })).not.toBeInTheDocument();
  }, 10000);

  it('keeps admin reports summary-first without dumping team names', async () => {
    window.history.pushState({}, '', '/?screen=admin&adminTab=adminReports');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Admin reports' })).toBeInTheDocument();
    expect(screen.getByText('Today’s report')).toBeInTheDocument();
    expect(screen.queryByText('Submitted forms')).not.toBeInTheDocument();
    expect(screen.getByText('Attendance summary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view team names/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open agents/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Person-wise review belongs/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Person-wise report')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Admin report scope')).toBeInTheDocument();
    expect(screen.queryByText('QA Test Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Service Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Sales Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Auto-generated from field activity')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Report date range preset'), { target: { value: 'week' } });
    expect(screen.getByText('Attendance summary')).toBeInTheDocument();
    expect(screen.queryByText('8 sales visits • 3 follow-ups')).not.toBeInTheDocument();
    expect(screen.queryByText('Send quote to QA Test Lab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^generate report$/i })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /^download pdf$/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('PDF downloaded'));
  });
});
