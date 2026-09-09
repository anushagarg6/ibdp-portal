create table if not exists public.class_update_attachments (
  id uuid primary key default gen_random_uuid(),
  class_date date not null,
  period text not null check (char_length(period) between 1 and 20),
  group_code text not null references public.subject_groups(code),
  storage_path text not null unique check (char_length(storage_path) between 1 and 300),
  uploaded_by uuid references public.students(id),
  created_at timestamptz not null default now()
);

create index if not exists class_update_attachments_class_idx
  on public.class_update_attachments (class_date, group_code, period);

alter table public.class_update_attachments enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'class-work-images',
  'class-work-images',
  false,
  4000000,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No client storage policies are created. Files are accessed only by authenticated,
-- authorized server routes using the server-side service role.
