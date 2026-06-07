import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Crystal Bio agent view shell', () => {
  it('renders the focused agent home with compact quick actions', () => {
    render(<App />);

    expect(screen.getByText('Crystal Bio Field Hub')).toBeInTheDocument();
    expect(screen.getByText('Agent view iteration')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Check in')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getAllByText('Leave').length).toBeGreaterThan(0);
  });

  it('keeps agent bottom navigation clear with a selected home state', () => {
    render(<App />);

    expect(screen.getByLabelText('Home selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Entries')).toBeInTheDocument();
    expect(screen.getByLabelText('Leave')).toBeInTheDocument();
    expect(screen.getByLabelText('Reports')).toBeInTheDocument();
  });

  it('keeps admin and monitoring sections out of the agent review screen', () => {
    render(<App />);

    expect(screen.queryByText('Owner app mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal monitoring')).not.toBeInTheDocument();
  });
});
