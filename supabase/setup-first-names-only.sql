-- Complete Supabase setup script using FIRST NAMES ONLY for all students.
-- Copy and run this entire script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1. Ensure subject groups exist
insert into public.subject_groups (code, display_name) values
  ('ENGLISH-A-A', 'English A · Section A'),
  ('ENGLISH-A-B', 'English A · Section B'),
  ('FRENCH-AB-A', 'French AB · Section A'),
  ('FRENCH-B-A', 'French B · Section A'),
  ('GERMAN-AB-A', 'German AB · Section A'),
  ('GERMAN-B-A', 'German B · Section A'),
  ('HINDI-B-A', 'Hindi B · Section A'),
  ('PHYSICS-A', 'Physics · Section A'),
  ('CHEMISTRY-A', 'Chemistry · Section A'),
  ('COMPUTER-SCIENCE-A', 'Computer Science · Section A'),
  ('BIO-A', 'Bio · Section A'),
  ('BUSINESS-MANAGEMENT-A', 'Business Management · Section A'),
  ('DS-A', 'DS · Section A'),
  ('ECONOMICS-A', 'Economics · Section A'),
  ('MATH-AA-A', 'Math AA · Section A'),
  ('MATH-AI-A', 'Math AI · Section A'),

  ('FRENCH-AB-B', 'French AB · Section B'),
  ('FRENCH-B-B', 'French B · Section B'),
  ('GERMAN-AB-B', 'German AB · Section B'),
  ('GERMAN-B-B', 'German B · Section B'),
  ('HINDI-B-B', 'Hindi B · Section B'),
  ('PHYSICS-B', 'Physics · Section B'),
  ('CHEMISTRY-B', 'Chemistry · Section B'),
  ('COMPUTER-SCIENCE-B', 'Computer Science · Section B'),
  ('BIO-B', 'Bio · Section B'),
  ('BUSINESS-MANAGEMENT-B1-B', 'Business Management (B1) · Section B'),
  ('DS-B', 'DS · Section B'),
  ('ECON-B', 'Econ (B) · Section B'),
  ('PSYCH-B9-B', 'Psych (B9) · Section B'),
  ('ESS-B', 'ESS · Section B'),
  ('VISUAL-ARTS-B7-B', 'Visual Arts (B7) · Section B'),
  ('MATH-AA-B', 'Math AA · Section B'),
  ('MATH-AI-B', 'Math AI · Section B')
on conflict (code) do update set display_name = excluded.display_name;

-- 2. Clear old data to prevent duplicate or full name conflicts
delete from public.student_subjects;
delete from public.rotation_history;
delete from public.students;

-- 3. Insert all 19 students using First Names Only
insert into public.students (name, section, active, access_code_hash) values
  -- DP1A (Section A)
  ('Arnav', 'A', true, crypt('arnav123', gen_salt('bf', 10))),
  ('Aayushi', 'A', true, crypt('aayushi123', gen_salt('bf', 10))),
  ('Dhruv', 'A', true, crypt('dhruv123', gen_salt('bf', 10))),
  ('Sidharth', 'A', true, crypt('sidharth123', gen_salt('bf', 10))),
  ('Anusha', 'A', true, crypt('anusha123', gen_salt('bf', 10))),
  ('Saanvii', 'A', true, crypt('saanvii123', gen_salt('bf', 10))),
  ('Arhaan', 'A', true, crypt('arhaan123', gen_salt('bf', 10))),

  -- DP1B (Section B)
  ('Arjun', 'B', true, crypt('arjun123', gen_salt('bf', 10))),
  ('Ayaansh', 'B', true, crypt('ayaansh123', gen_salt('bf', 10))),
  ('Vishwam', 'B', true, crypt('vishwam123', gen_salt('bf', 10))),
  ('Gouransh', 'B', true, crypt('gouransh123', gen_salt('bf', 10))),
  ('Aakanksha', 'B', true, crypt('aakanksha123', gen_salt('bf', 10))),
  ('Pratap', 'B', true, crypt('pratap123', gen_salt('bf', 10))),
  ('Aliya', 'B', true, crypt('aliya123', gen_salt('bf', 10))),
  ('Kiaan', 'B', true, crypt('kiaan123', gen_salt('bf', 10))),
  ('Rubani', 'B', true, crypt('rubani123', gen_salt('bf', 10))),
  ('Priya', 'B', true, crypt('priya123', gen_salt('bf', 10))),
  ('Tanjot', 'B', true, crypt('tanjot123', gen_salt('bf', 10))),
  ('Guransh', 'B', true, crypt('guransh123', gen_salt('bf', 10)));

-- 4. Map subjects for each student
insert into public.student_subjects (student_id, group_code)
select s.id, m.group_code
from (values
  -- DP1A
  ('Arnav', 'ENGLISH-A-A'), ('Arnav', 'FRENCH-AB-A'), ('Arnav', 'PHYSICS-A'), ('Arnav', 'CHEMISTRY-A'), ('Arnav', 'BIO-A'), ('Arnav', 'MATH-AA-A'), ('Arnav', 'MATH-AI-A'),
  ('Aayushi', 'ENGLISH-A-A'), ('Aayushi', 'GERMAN-AB-A'), ('Aayushi', 'PHYSICS-A'), ('Aayushi', 'CHEMISTRY-A'), ('Aayushi', 'BIO-A'), ('Aayushi', 'MATH-AA-A'), ('Aayushi', 'MATH-AI-A'),
  ('Dhruv', 'ENGLISH-A-A'), ('Dhruv', 'FRENCH-AB-A'), ('Dhruv', 'PHYSICS-A'), ('Dhruv', 'CHEMISTRY-A'), ('Dhruv', 'BUSINESS-MANAGEMENT-A'), ('Dhruv', 'MATH-AA-A'), ('Dhruv', 'MATH-AI-A'),
  ('Sidharth', 'ENGLISH-A-A'), ('Sidharth', 'GERMAN-AB-A'), ('Sidharth', 'PHYSICS-A'), ('Sidharth', 'CHEMISTRY-A'), ('Sidharth', 'BUSINESS-MANAGEMENT-A'), ('Sidharth', 'MATH-AA-A'), ('Sidharth', 'MATH-AI-A'),
  ('Anusha', 'ENGLISH-A-A'), ('Anusha', 'HINDI-B-A'), ('Anusha', 'PHYSICS-A'), ('Anusha', 'COMPUTER-SCIENCE-A'), ('Anusha', 'DS-A'), ('Anusha', 'MATH-AA-A'), ('Anusha', 'MATH-AI-A'),
  ('Saanvii', 'ENGLISH-A-A'), ('Saanvii', 'FRENCH-AB-A'), ('Saanvii', 'PHYSICS-A'), ('Saanvii', 'COMPUTER-SCIENCE-A'), ('Saanvii', 'ECONOMICS-A'), ('Saanvii', 'MATH-AA-A'), ('Saanvii', 'MATH-AI-A'),
  ('Arhaan', 'ENGLISH-A-A'), ('Arhaan', 'HINDI-B-A'), ('Arhaan', 'PHYSICS-A'), ('Arhaan', 'CHEMISTRY-A'), ('Arhaan', 'ECONOMICS-A'), ('Arhaan', 'MATH-AA-A'), ('Arhaan', 'MATH-AI-A'),

  -- DP1B
  ('Arjun', 'ENGLISH-A-B'), ('Arjun', 'FRENCH-B-B'), ('Arjun', 'ECON-B'), ('Arjun', 'PSYCH-B9-B'), ('Arjun', 'BIO-B'), ('Arjun', 'MATH-AA-B'),
  ('Ayaansh', 'ENGLISH-A-B'), ('Ayaansh', 'HINDI-B-B'), ('Ayaansh', 'ECON-B'), ('Ayaansh', 'COMPUTER-SCIENCE-B'), ('Ayaansh', 'BUSINESS-MANAGEMENT-B1-B'), ('Ayaansh', 'MATH-AA-B'),
  ('Vishwam', 'ENGLISH-A-B'), ('Vishwam', 'GERMAN-AB-B'), ('Vishwam', 'PHYSICS-B'), ('Vishwam', 'CHEMISTRY-B'), ('Vishwam', 'BUSINESS-MANAGEMENT-B1-B'), ('Vishwam', 'MATH-AA-B'),
  ('Gouransh', 'ENGLISH-A-B'), ('Gouransh', 'HINDI-B-B'), ('Gouransh', 'PHYSICS-B'), ('Gouransh', 'COMPUTER-SCIENCE-B'), ('Gouransh', 'BUSINESS-MANAGEMENT-B1-B'), ('Gouransh', 'MATH-AA-B'),
  ('Aakanksha', 'ENGLISH-A-B'), ('Aakanksha', 'HINDI-B-B'), ('Aakanksha', 'PHYSICS-B'), ('Aakanksha', 'COMPUTER-SCIENCE-B'), ('Aakanksha', 'ECON-B'), ('Aakanksha', 'MATH-AA-B'),
  ('Pratap', 'ENGLISH-A-B'), ('Pratap', 'GERMAN-B-B'), ('Pratap', 'PHYSICS-B'), ('Pratap', 'COMPUTER-SCIENCE-B'), ('Pratap', 'PSYCH-B9-B'), ('Pratap', 'MATH-AA-B'),
  ('Aliya', 'ENGLISH-A-B'), ('Aliya', 'GERMAN-B-B'), ('Aliya', 'PSYCH-B9-B'), ('Aliya', 'COMPUTER-SCIENCE-B'), ('Aliya', 'BIO-B'), ('Aliya', 'MATH-AA-B'),
  ('Kiaan', 'ENGLISH-A-B'), ('Kiaan', 'HINDI-B-B'), ('Kiaan', 'PSYCH-B9-B'), ('Kiaan', 'BUSINESS-MANAGEMENT-B1-B'), ('Kiaan', 'ESS-B'), ('Kiaan', 'MATH-AI-B'),
  ('Rubani', 'ENGLISH-A-B'), ('Rubani', 'GERMAN-AB-B'), ('Rubani', 'ECON-B'), ('Rubani', 'VISUAL-ARTS-B7-B'), ('Rubani', 'ESS-B'), ('Rubani', 'MATH-AI-B'),
  ('Priya', 'ENGLISH-A-B'), ('Priya', 'GERMAN-AB-B'), ('Priya', 'PHYSICS-B'), ('Priya', 'COMPUTER-SCIENCE-B'), ('Priya', 'PSYCH-B9-B'), ('Priya', 'MATH-AI-B'),
  ('Tanjot', 'ENGLISH-A-B'), ('Tanjot', 'FRENCH-AB-B'), ('Tanjot', 'PHYSICS-B'), ('Tanjot', 'COMPUTER-SCIENCE-B'), ('Tanjot', 'ECON-B'), ('Tanjot', 'MATH-AA-B'),
  ('Guransh', 'ENGLISH-A-B'), ('Guransh', 'HINDI-B-B'), ('Guransh', 'PHYSICS-B'), ('Guransh', 'CHEMISTRY-B'), ('Guransh', 'ECON-B'), ('Guransh', 'MATH-AA-B'), ('Guransh', 'MATH-AI-B')
) as m(student_name, group_code)
join public.students s on lower(s.name) = lower(m.student_name)
on conflict (student_id, group_code) do nothing;
