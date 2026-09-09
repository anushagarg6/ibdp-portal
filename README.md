# IBDP Portal

A small, Vercel-ready Next.js app that reads a public Google Sheet timetable, fairly assigns one student per subject group, emails the daily list through Resend, and lets students record what was covered, homework, and absences.

## How it works

- The public Google Sheet contains timetable data only—never student names.
- Supabase stores student/group membership, assignment history, and class updates.
- A Vercel cron runs once Monday–Saturday at 01:30 UTC (7:00 AM India time), before the school day begins.
- The cron picks the least-recently-selected active student in each group, records the assignment once, and sends one summary email.
- Students sign in with their name and personal access code. They can view every update in their section, and any student enrolled in a subject can edit that subject's update. The teacher code can view and edit both sections.
- Subject members can add an update even if the morning lead assignment has not run yet. Unmapped timetable groups remain unassigned without blocking assignments for configured groups.
- Subject members can attach up to three JPEG, PNG, WebP, PDF, or DOCX files per class, with a 4 MB limit for each file. Attachments stay in private Supabase storage and are served only after section access is checked.
- Supabase is accessed only from the server with the service-role key. Row Level Security blocks browser access.

## 1. Google Sheet format

The included configuration is already pointed at the supplied example sheet. Its columns are school sections, and each row is a period:

| A | B |
|---|---|
| Homeroom | Homeroom |
| Physics | Math AA / Math AI |
| Computer science / Chemistry | Computer science / Chemistry / Visual Arts (B7) |

The importer reads both sections every day, splits `/` choices into separate classes, and skips Homeroom, Break, and Reading Time. It appends the section to each generated group code—for example, Physics in column A becomes `PHYSICS-A`, while Math AA in column B becomes `MATH-AA-B`.

The original row format (`Date, Period, Subject, Group`) remains supported too. Keep this public sheet free of student names, attendance, and homework.

## 2. Create Supabase data

1. Create a Supabase project.
2. Open its SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. The first cron run automatically creates the subject groups found in the sheet. To configure students before that, add the required groups and student mappings with SQL like this:

```sql
insert into public.subject_groups (code, display_name) values
  ('PHYSICS-A', 'Physics · Section A'),
  ('MATH-AA-B', 'Math AA · Section B')
on conflict (code) do nothing;

insert into public.students (name) values ('Example Student');

insert into public.student_subjects (student_id, group_code)
select id, 'PHYSICS-A' from public.students where name = 'Example Student';
```

Add every real student to each generated group they attend. A student can belong to several groups.

Give every student a section and private code by running [`supabase/student-access-migration.sql`](supabase/student-access-migration.sql), repeating the update for each student. Codes are stored only as bcrypt hashes:

```sql
update public.students
set section = 'B',
    access_code_hash = crypt('a-unique-code-at-least-8-characters', gen_salt('bf', 12))
where name = 'Student Name';
```
4. In **Project Settings → API**, copy the project URL and service-role key. The service-role key is a server secret and must never be exposed in browser code.

The database is the lightweight persistence layer. `rotation_history` makes the selection fair across days, `class_updates` stores separate notes for each period, and `daily_runs` prevents duplicate daily email runs.

## 3. Configure locally

Copy `.env.example` to `.env.local`, fill every value, then run:

```bash
npm install
npm run dev
```

Generate long secrets with `openssl rand -base64 32`. For Resend, verify a sending domain and use an address on that domain for `EMAIL_FROM`.

## 4. Test

```bash
npm test
npm run lint
npm run build
```

## 5. Deploy to Vercel

1. Push this folder to a Git repository and import it into Vercel.
2. Add every variable from `.env.example` under **Project Settings → Environment Variables**. Use separate Supabase/Resend credentials for preview deployments, or disable previews.
3. Set `APP_URL` to `https://ibdpsrkp.vercel.app`.
4. Deploy. Vercel reads `vercel.json` and schedules `/api/cron/daily`.
5. Confirm the cron in **Project → Settings → Cron Jobs**. Vercel cron schedules use UTC.

To test the scheduled endpoint without waiting, make a GET request with `Authorization: Bearer <CRON_SECRET>`. A successful run is recorded, so it will not send twice for the same date.

## Environment variables

| Variable | Purpose |
|---|---|
| `TIMETABLE_CSV_URL` | Public CSV URL for the A/B section timetable tab |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key |
| `CLASSROOM_ACCESS_CODE` | Teacher access code; students use their personal database codes |
| `SESSION_SECRET` | Signs secure login cookies |
| `CRON_SECRET` | Protects the Vercel cron route |
| `RESEND_API_KEY` | Sends the daily email |
| `EMAIL_FROM` | Verified sender |
| `EMAIL_TO` | Daily summary recipient |
| `APP_URL` | Production website URL used in email |
| `APP_TIME_ZONE` | Time zone used to determine “today” |

## Security notes

- Keep the teacher code private and rotate any student code that is shared accidentally.
- Each student receives a signed, HTTP-only session. Classmates can read their section, while the update endpoint independently verifies that the signed-in student belongs to the subject before allowing a write.
- Do not expose the Supabase service-role key through a `NEXT_PUBLIC_` variable.
- The login endpoint is rate-limited in Supabase. Periodically remove old `login_attempts` rows if the table grows.
- The timetable URL is public by design, so keep it free of personal or sensitive information.
