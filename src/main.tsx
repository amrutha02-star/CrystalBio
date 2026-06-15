import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { crystalBioFrontendApi } from './crystalBioFrontendApi';
import './styles.css';

window.addEventListener('error', (event) => {
  void crystalBioFrontendApi.reportClientIssue({
    type: 'browser_error',
    severity: 'high',
    journey: 'App screen error',
    message: event.message || 'Browser error in the app',
    path: event.filename,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'Unhandled app error');
  void crystalBioFrontendApi.reportClientIssue({
    type: 'browser_error',
    severity: 'high',
    journey: 'App screen error',
    message: reason,
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
