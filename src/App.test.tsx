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
});
