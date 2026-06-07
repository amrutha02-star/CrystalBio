export type AppModule = {
  slug: string;
  title: string;
  description: string;
  sourceForm: string;
  supportsDrafts: boolean;
  steps: string[];
  highlights: string[];
  statusOptions: string[];
};

export type BuildPhase = {
  title: string;
  goal: string;
  deliverables: string[];
};

export const formModules: AppModule[] = [
  {
    slug: 'daily-check-in',
    title: 'Daily Check-in',
    description: 'Simple start-of-day attendance with optional location and notes.',
    sourceForm: 'crystal-bio-login',
    supportsDrafts: false,
    steps: ['Confirm name', 'Capture time and location', 'Add optional note', 'Submit check-in'],
    highlights: ['Auto-filled agent name', 'Auto time stamp', 'Missing check-in alerts'],
    statusOptions: ['Checked in', 'Not checked in', 'On leave'],
  },
  {
    slug: 'sales-visit',
    title: 'Sales Visit',
    description: 'Sales visit and pipeline update split into small, mobile-friendly steps.',
    sourceForm: 'crystal-bio-sales',
    supportsDrafts: true,
    steps: [
      'Customer/account details',
      'Requirement and product details',
      'Quote and fund status',
      'Probability and closing date',
      'Remarks, support, photos',
      'Review and submit',
    ],
    highlights: ['Quote status', 'Fund status', 'Probability', 'Closing date', 'Support required'],
    statusOptions: ['New inquiry', 'Quote pending', 'Quote submitted', 'Negotiation', 'Closed won', 'Closed lost', 'Follow-up later'],
  },
  {
    slug: 'service-visit',
    title: 'Service Visit',
    description: 'Service/engineering work report with equipment history and next action.',
    sourceForm: 'crystal-bio-service',
    supportsDrafts: true,
    steps: [
      'Customer details',
      'Equipment details',
      'Service type',
      'Work done',
      'Next action and support required',
      'Photos and notes',
      'Review and submit',
    ],
    highlights: ['Equipment name', 'Serial number', 'Work done', 'Next action', 'Support required'],
    statusOptions: ['Installation', 'Preventive maintenance', 'Breakdown', 'Repair', 'Calibration', 'Demo', 'Training', 'Follow-up required', 'Completed'],
  },
  {
    slug: 'leave-request',
    title: 'Leave Request',
    description: 'Agent leave request with admin approval instead of agent-filled approver.',
    sourceForm: 'crystal-bio-leave',
    supportsDrafts: false,
    steps: ['Select leave dates', 'Add reason', 'Add optional note', 'Submit for admin approval'],
    highlights: ['Date range', 'Reason', 'Admin approval', 'Agent status visibility'],
    statusOptions: ['Pending', 'Approved', 'Rejected'],
  },
];

export type NavItem = {
  label: string;
  icon: 'home' | 'entries' | 'leave' | 'reports';
  selected?: boolean;
};

export type RoleAccess = {
  canSubmitForms: boolean;
  canViewOwnEntries: boolean;
  canViewAdminDashboard: boolean;
  canViewIssueCommandCenter: boolean;
};

export const agentNavItems: NavItem[] = [
  { label: 'Home', icon: 'home', selected: true },
  { label: 'Entries', icon: 'entries' },
  { label: 'Leave', icon: 'leave' },
  { label: 'Reports', icon: 'reports' },
];

export const roleAccess: Record<'agent' | 'owner' | 'projectMonitor', RoleAccess> = {
  agent: {
    canSubmitForms: true,
    canViewOwnEntries: true,
    canViewAdminDashboard: false,
    canViewIssueCommandCenter: false,
  },
  owner: {
    canSubmitForms: true,
    canViewOwnEntries: true,
    canViewAdminDashboard: true,
    canViewIssueCommandCenter: false,
  },
  projectMonitor: {
    canSubmitForms: false,
    canViewOwnEntries: false,
    canViewAdminDashboard: false,
    canViewIssueCommandCenter: true,
  },
};

export const buildPhases: BuildPhase[] = [
  {
    title: 'Phase 0: Final Requirements and Form Cleanup',
    goal: 'Confirm required fields, optional fields, photos, GPS, alert rules, and recipients.',
    deliverables: ['Final field map', 'Clean screen flow', 'MVP scope confirmation'],
  },
  {
    title: 'Phase 1: Core Agent App',
    goal: 'Prove agents can submit work comfortably without frustration.',
    deliverables: ['Email login', 'Agent home', 'Daily check-in', 'Sales entry', 'Service entry', 'Leave request', 'Save draft', 'My Entries'],
  },
  {
    title: 'Phase 2: Admin Dashboard',
    goal: 'Give admin visibility into submitted sales, service, leave, and attendance data.',
    deliverables: ['Dashboard summary', 'Sales reports', 'Service reports', 'Agent-wise view', 'Leave approval', 'Basic export'],
  },
  {
    title: 'Phase 3: Follow-Up and Case Timeline',
    goal: 'Support second and third visits on the same case without duplicate confusion.',
    deliverables: ['Timeline view', 'Add progress update', 'Next follow-up date', 'Overdue tracking'],
  },
  {
    title: 'Phase 4: Telegram and Email Reporting',
    goal: 'Automate owner alerts and scheduled weekly/monthly reports.',
    deliverables: ['Owner Telegram alerts', 'Saturday weekly email', 'Monthly 1st-day email', 'Agent reports', 'Delivery retry tracking'],
  },
  {
    title: 'Phase 5: Monitoring and Issue Command Center',
    goal: 'Catch app problems before field agents get frustrated.',
    deliverables: ['Failed submission tracking', 'Draft monitoring', 'Upload issue alerts', 'Plain-English issue dashboard'],
  },
  {
    title: 'Phase 6: Polish, Testing, and Rollout',
    goal: 'Make the mobile UI reliable, readable, and pleasant for real field use.',
    deliverables: ['Mobile UI polish', 'Real-agent test run', 'Help text', 'Client demo', 'Rollout plan'],
  },
];

export const sampleEntries = [
  { customer: 'Apollo Diagnostics', type: 'Sales', status: 'Quote pending', next: 'Tomorrow', tone: 'warning' },
  { customer: 'City Lab Services', type: 'Service', status: 'Follow-up required', next: '12 Jun', tone: 'info' },
  { customer: 'Crystal Bio HQ', type: 'Leave', status: 'Pending approval', next: 'Admin review', tone: 'soft' },
];

export const adminMetrics = [
  { label: 'Checked in', value: '18', detail: '2 missing today' },
  { label: 'Sales reports', value: '34', detail: '7 need follow-up' },
  { label: 'Service reports', value: '21', detail: '4 support required' },
  { label: 'Leave requests', value: '3', detail: 'waiting approval' },
];

export function getRequiredMvpModules(): string[] {
  return [
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
  ];
}
