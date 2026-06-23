-- CrystalBio PostgreSQL schema draft for staging only.
-- Do not run against live production until migration scripts, count checks, Bloom QA, rollback, and Rahul approval pass.

create table if not exists agents (
  id text primary key,
  name text not null,
  role text not null check (role in ('sales', 'service', 'both', 'admin')),
  active boolean not null default true,
  employee_id text,
  email text unique,
  mobile text,
  login_code text,
  passcode text,
  password text,
  invite_token text,
  invite_status text check (invite_status in ('pending', 'accepted')),
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists login_sessions (
  token text primary key,
  agent_id text not null references agents(id),
  agent_name text not null,
  role text not null,
  employee_id text,
  phone text,
  email text,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists attendance_records (
  id text primary key,
  agent_id text not null references agents(id),
  agent_name text not null,
  attendance_date date not null,
  check_in_at timestamptz not null,
  check_in_latitude numeric,
  check_in_longitude numeric,
  check_in_accuracy_meters numeric,
  check_out_at timestamptz,
  check_out_latitude numeric,
  check_out_longitude numeric,
  check_out_accuracy_meters numeric,
  status text not null check (status in ('checked_in', 'checked_out')),
  note text,
  work_types text[] not null default '{}',
  auto_checked_out boolean,
  auto_check_out_reason text,
  system_restored boolean,
  raw_json jsonb not null default '{}'::jsonb
);

create index if not exists attendance_agent_date_idx on attendance_records(agent_id, attendance_date);
create index if not exists attendance_status_idx on attendance_records(status);

create table if not exists sales_opportunities (
  id text primary key,
  owner_agent_id text not null references agents(id),
  account_name text not null,
  contact_person text,
  designation text,
  phone text,
  email text,
  department_address text,
  lead_source text,
  product_type text,
  brand_name text,
  equipment_model text,
  requirement text,
  quote_submitted text,
  budgetary_proposal text,
  quote_status text,
  fund_status text,
  probability text,
  closing_date date,
  support_required text,
  remarks_timeline text,
  office_notes text,
  step2_saved boolean,
  step3_saved boolean,
  status text not null default 'open',
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_visit_updates (
  id text primary key,
  opportunity_id text not null references sales_opportunities(id) on delete cascade,
  agent_id text not null references agents(id),
  agent_name text not null,
  visit_number integer not null,
  visit_date date not null,
  visit_time text,
  gps_latitude numeric,
  gps_longitude numeric,
  gps_accuracy_meters numeric,
  note text,
  next_action text,
  follow_up_date date,
  expected_closing_date date,
  raw_json jsonb not null default '{}'::jsonb,
  unique(opportunity_id, visit_number)
);

create index if not exists sales_owner_idx on sales_opportunities(owner_agent_id);
create index if not exists sales_visit_opportunity_idx on sales_visit_updates(opportunity_id);

create table if not exists service_records (
  id text primary key,
  owner_agent_id text not null references agents(id),
  customer_name text not null,
  phone text,
  department_address text,
  brand_name text,
  equipment_name text,
  model_name text,
  serial_number text,
  contact_person text,
  email text,
  issue_category text,
  issue_description text,
  warranty_amc text,
  parts_required text,
  parts_used text,
  machine_status text,
  support_required_note text,
  final_remarks text,
  photo_note text,
  step2_saved boolean,
  step3_saved boolean,
  status text not null default 'open',
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_visit_updates (
  id text primary key,
  service_record_id text not null references service_records(id) on delete cascade,
  agent_id text not null references agents(id),
  agent_name text not null,
  visit_number integer not null,
  visit_date date not null,
  visit_time text,
  gps_latitude numeric,
  gps_longitude numeric,
  gps_accuracy_meters numeric,
  service_type text,
  work_done text,
  support_required boolean,
  next_action text,
  next_visit_date date,
  office_notes text,
  raw_json jsonb not null default '{}'::jsonb,
  unique(service_record_id, visit_number)
);

create index if not exists service_owner_idx on service_records(owner_agent_id);
create index if not exists service_visit_record_idx on service_visit_updates(service_record_id);

create table if not exists leave_requests (
  id text primary key,
  agent_id text not null references agents(id),
  agent_name text not null,
  from_date date not null,
  to_date date not null,
  reason text,
  note text,
  status text not null,
  reviewed_by_agent_id text references agents(id),
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists file_attachments (
  id text primary key,
  related_type text not null check (related_type in ('sales_opportunity', 'sales_visit', 'service_record', 'service_visit', 'attendance')),
  related_id text not null,
  purpose text,
  storage_provider text not null check (storage_provider in ('r2', 's3', 'local_migration_placeholder')),
  storage_bucket text,
  storage_key text not null,
  original_file_name text,
  content_type text,
  size_bytes integer,
  uploaded_by_agent_id text references agents(id),
  migrated_from_json boolean not null default false,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists file_attachments_related_idx on file_attachments(related_type, related_id);

create table if not exists migration_metadata (
  key text primary key,
  value text not null,
  raw_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
