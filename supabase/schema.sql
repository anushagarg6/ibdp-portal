create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  section text check (section in ('A', 'B')),
  access_code_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists students_name_lower_idx on public.students (lower(name));

create table if not exists public.subject_groups (
  code text primary key check (char_length(code) between 1 and 80),
  display_name text not null check (char_length(display_name) between 1 and 120)
);

create table if not exists public.student_subjects (
  student_id uuid not null references public.students(id) on delete cascade,
  group_code text not null references public.subject_groups(code) on delete cascade,
  primary key (student_id, group_code)
);

create table if not exists public.rotation_history (
  id uuid primary key default gen_random_uuid(),
  class_date date not null,
  group_code text not null references public.subject_groups(code),
  student_id uuid not null references public.students(id),
  selected_at timestamptz not null default now(),
  unique (class_date, group_code)
);

create table if not exists public.class_updates (
  id uuid primary key default gen_random_uuid(),
  class_date date not null,
  period text not null check (char_length(period) between 1 and 20),
  group_code text not null references public.subject_groups(code),
  student_id uuid references public.students(id),
  covered text not null default '' check (char_length(covered) <= 2000),
  homework text not null default '' check (char_length(homework) <= 1000),
  absent_names text not null default '' check (char_length(absent_names) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_date, period, group_code)
);

create table if not exists public.class_update_attachments (
  id uuid primary key default gen_random_uuid(),
  class_date date not null,
  period text not null check (char_length(period) between 1 and 20),
  group_code text not null references public.subject_groups(code),
  storage_path text not null unique check (char_length(storage_path) between 1 and 300),
  uploaded_by uuid references public.students(id),
  created_at timestamptz not null default now()
);
create index if not exists class_update_attachments_class_idx on public.class_update_attachments (class_date, group_code, period);

create table if not exists public.daily_runs (
  class_date date primary key,
  status text not null check (status in ('processing', 'sent', 'failed', 'no_classes')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  ip_address text not null check (char_length(ip_address) <= 100),
  attempted_at timestamptz not null default now()
);
create index if not exists login_attempts_ip_time_idx on public.login_attempts (ip_address, attempted_at);

alter table public.students enable row level security;
alter table public.subject_groups enable row level security;
alter table public.student_subjects enable row level security;
alter table public.rotation_history enable row level security;
alter table public.class_updates enable row level security;
alter table public.class_update_attachments enable row level security;
alter table public.daily_runs enable row level security;
alter table public.login_attempts enable row level security;

alter table public.students add column if not exists section text check (section in ('A', 'B'));
alter table public.students add column if not exists access_code_hash text;

-- Intentionally no anon/authenticated policies. Only the server-side service role can access these tables.

-- Add the subject groups and real students using the examples in README.md.
