-- Allows a teacher to create an update before the daily lead has been assigned.
-- Student submissions still store the signed-in student's ID.
alter table public.class_updates
  alter column student_id drop not null;
