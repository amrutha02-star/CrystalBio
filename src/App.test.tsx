import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Crystal Bio MVP shell', () => {
  it('renders the agent home with key actions', () => {
    render(<App />);

    expect(screen.getByText('Crystal Bio Field Hub')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Check in')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getAllByText('Leave').length).toBeGreaterThan(0);
  });

  it('shows selected bottom navigation with icons', () => {
    render(<App />);

    expect(screen.getByLabelText('Home selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Entries')).toBeInTheDocument();
    expect(screen.getByLabelText('Leave')).toBeInTheDocument();
  });

  it('shows admin as an app mode for the owner, not a PDF-style report page', () => {
    render(<App />);

    expect(screen.getByText('Owner app mode')).toBeInTheDocument();
    expect(screen.getByText('Switch between filling forms and reviewing team activity.')).toBeInTheDocument();
    expect(screen.getByText('Owner can submit forms too')).toBeInTheDocument();
  });

  it('shows project monitoring separately from client-facing admin', () => {
    render(<App />);

    expect(screen.getByText('Internal monitoring')).toBeInTheDocument();
    expect(screen.getByText('Visible to Amrutha/project team, not field agents or client owner.')).toBeInTheDocument();
  });
});
