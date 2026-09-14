-- Migration for snapshotting daily timetable structures so historical dates retain their schedule even if Google Sheets is overwritten
create table if not exists public.daily_timetable (
  id uuid primary key default gen_random_uuid(),
  class_date date not null,
  period text not null check (char_length(period) between 1 and 20),
  subject text not null,
  group_code text not null references public.subject_groups(code),
  section text check (section in ('A', 'B')),
  created_at timestamptz not null default now(),
  unique (class_date, period, group_code)
);

create index if not exists daily_timetable_date_idx on public.daily_timetable (class_date);
alter table public.daily_timetable enable row level security;
