import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Crystal Bio MVP shell', () => {
  it('renders the agent home with key actions', () => {
    render(<App />);

    expect(screen.getByText('Crystal Bio Field Hub')).toBeInTheDocument();
    expect(screen.getByText('Daily Check-in')).toBeInTheDocument();
    expect(screen.getByText('Sales Visit')).toBeInTheDocument();
    expect(screen.getByText('Service Visit')).toBeInTheDocument();
    expect(screen.getByText('Leave Request')).toBeInTheDocument();
  });

  it('shows admin visibility and reporting sections', () => {
    render(<App />);

    expect(screen.getByText('Admin command view')).toBeInTheDocument();
    expect(screen.getAllByText('Saturday weekly email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Monthly 1st-day report').length).toBeGreaterThan(0);
    expect(screen.getByText('Issue Command Center')).toBeInTheDocument();
  });
});
