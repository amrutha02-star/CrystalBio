import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Crystal Bio agent view shell', () => {
  it('renders the connected agent home with compact quick actions', async () => {
    render(<App />);

    expect(screen.getByText('Agent home screen')).toBeInTheDocument();
    expect(screen.getByText('Demo preview')).toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText('Checked in. GPS saved for today.')).toBeInTheDocument());
    expect(screen.getByText('Checked in for field work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
  });

  it('sends attendance check-out after check-in', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /check in/i }));
    await waitFor(() => expect(screen.getByText('Checked in. GPS saved for today.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => expect(screen.getByText('Checked out. End location saved.')).toBeInTheDocument());
    expect(screen.getByText('Ready for field work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument();
  });

  it('keeps agent bottom navigation clear with a selected home state', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    expect(screen.getByLabelText('Home selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Visits')).toBeInTheDocument();
    expect(screen.getByLabelText('Attendance')).toBeInTheDocument();
    expect(screen.getByLabelText('Reports')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /save service update/i })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Home'));
    fireEvent.click(screen.getByRole('button', { name: /^attendance logs & leave$/i }));
    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send leave request/i })).toBeInTheDocument();
  });

  it('opens bottom navigation screens and keeps demo report numbers clearly fixed', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /^visits$/i }));
    expect(screen.getByRole('heading', { name: 'Visits' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new sales visit update/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^reports$/i }));
    expect(screen.getByText('My reports')).toBeInTheDocument();
    expect(screen.getByText('These preview numbers are fixed demo values. They will come from backend reports when reports are connected.')).toBeInTheDocument();
  });

  it('opens recent visit rows instead of showing non-clickable dashboard details', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /apollo diagnostics/i }));
    expect(screen.getByText('Sales visit')).toBeInTheDocument();
  });

  it('shows feedback for second-level preview buttons instead of doing nothing', async () => {
    render(<App />);

    await screen.findByText('Rahul Sales');

    fireEvent.click(screen.getByRole('button', { name: /sales new visit/i }));
    fireEvent.click(screen.getByRole('button', { name: /save step 1/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Demo Sales Step 1 saved'));
    expect(screen.getByRole('status')).toHaveClass('save-toast');
    expect(screen.queryByRole('status')).not.toHaveClass('screen-notice');
    expect(screen.getByRole('button', { name: /step 1 saved/i })).toBeDisabled();
    expect(screen.getByText(/Apollo Diagnostics • Visit 1 • follow up needed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Step 2: pending • Step 3: pending/i).length).toBeGreaterThan(0);

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
    fireEvent.click(screen.getByRole('button', { name: /save service update/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Demo service visit saved'));
    expect(screen.getByText(/Metro Lab • Visit 1 • parts required/i)).toBeInTheDocument();
    expect(screen.getByText('Work: Diagnosed issue and checked machine performance.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Attendance'));
    fireEvent.click(screen.getByRole('button', { name: /send leave request/i }));
    fireEvent.change(screen.getByLabelText('Leave from date'), { target: { value: '2026-06-12' } });
    fireEvent.change(screen.getByLabelText('Leave to date'), { target: { value: '2026-06-13' } });
    fireEvent.change(screen.getByLabelText('Leave reason'), { target: { value: 'Personal work' } });
    fireEvent.change(screen.getByLabelText('Leave note'), { target: { value: 'Family appointment' } });
    fireEvent.click(screen.getByRole('button', { name: /submit leave request/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Demo leave request saved'));
    expect(screen.getByText(/2026-06-12 to 2026-06-13 • Personal work • pending/i)).toBeInTheDocument();
    expect(screen.getByText('Note: Family appointment')).toBeInTheDocument();
  });
});
