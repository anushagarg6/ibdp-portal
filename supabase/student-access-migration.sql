create extension if not exists pgcrypto;

alter table public.students
  add column if not exists section text check (section in ('A', 'B'));

alter table public.students
  add column if not exists access_code_hash text;

create unique index if not exists students_name_lower_idx on public.students (lower(name));

-- Repeat this update for each real student, changing the name, section, and code.
-- Codes should be unique and at least 8 characters long.
update public.students
set section = 'A',
    access_code_hash = crypt('replace-with-private-code', gen_salt('bf', 12))
where name = 'Example Student';
