insert into public.subject_groups (code, display_name) values
  ('FRENCH-AB-A', 'French AB · Section A'),
  ('FRENCH-B-A', 'French B · Section A'),
  ('GERMAN-B-A', 'German B · Section A'),
  ('GERMAN-AB-A', 'German AB · Section A'),
  ('HINDI-B-A', 'Hindi B · Section A'),
  ('FRENCH-AB-B', 'French AB · Section B'),
  ('FRENCH-B-B', 'French B · Section B'),
  ('GERMAN-B-B', 'German B · Section B'),
  ('GERMAN-AB-B', 'German AB · Section B'),
  ('HINDI-B-B', 'Hindi B · Section B')
on conflict (code) do update set display_name = excluded.display_name;

-- Remove only the obsolete generic memberships. Historical rotations remain intact.
delete from public.student_subjects
where group_code in ('LANGUAGE-ACQUISITION-A', 'LANGUAGE-ACQUISITION-B');

insert into public.student_subjects (student_id, group_code)
select s.id, mapping.group_code
from (values
  ('Anusha', 'HINDI-B-A'),
  ('Dhruv', 'FRENCH-B-A'),
  ('Pratap', 'GERMAN-AB-B'),
  ('Aallya', 'GERMAN-B-B'),
  ('Priyh', 'GERMAN-B-B'),
  ('Vishwam', 'GERMAN-AB-B'),
  ('Arjun', 'FRENCH-B-B')
) as mapping(student_name, group_code)
join public.students s on lower(s.name) = lower(mapping.student_name)
on conflict (student_id, group_code) do nothing;
