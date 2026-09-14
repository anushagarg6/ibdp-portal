-- Safe Supabase Migration: Update Student Names to First Name Only
-- Preserves existing student IDs and class update history to avoid Foreign Key errors.

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

-- 2. Safely rename existing full-name student records to First Name Only
update public.students set name = 'Arnav', section = 'A', active = true, access_code_hash = crypt('arnav123', gen_salt('bf', 10)) where lower(name) in ('arnav', 'arnav virmani');
update public.students set name = 'Aayushi', section = 'A', active = true, access_code_hash = crypt('aayushi123', gen_salt('bf', 10)) where lower(name) in ('aayushi', 'aayushi sharma');
update public.students set name = 'Dhruv', section = 'A', active = true, access_code_hash = crypt('dhruv123', gen_salt('bf', 10)) where lower(name) in ('dhruv', 'dhruv vason');
update public.students set name = 'Sidharth', section = 'A', active = true, access_code_hash = crypt('sidharth123', gen_salt('bf', 10)) where lower(name) in ('sidharth', 'sidharth modi');
update public.students set name = 'Anusha', section = 'A', active = true, access_code_hash = crypt('anusha123', gen_salt('bf', 10)) where lower(name) in ('anusha');
update public.students set name = 'Saanvii', section = 'A', active = true, access_code_hash = crypt('saanvii123', gen_salt('bf', 10)) where lower(name) in ('saanvii', 'saanvii saluja');
update public.students set name = 'Arhaan', section = 'A', active = true, access_code_hash = crypt('arhaan123', gen_salt('bf', 10)) where lower(name) in ('arhaan', 'arhaan sharma');

update public.students set name = 'Arjun', section = 'B', active = true, access_code_hash = crypt('arjun123', gen_salt('bf', 10)) where lower(name) in ('arjun', 'arjun raina');
update public.students set name = 'Ayaansh', section = 'B', active = true, access_code_hash = crypt('ayaansh123', gen_salt('bf', 10)) where lower(name) in ('ayaansh', 'ayaansh gautam');
update public.students set name = 'Vishwam', section = 'B', active = true, access_code_hash = crypt('vishwam123', gen_salt('bf', 10)) where lower(name) in ('vishwam');
update public.students set name = 'Gouransh', section = 'B', active = true, access_code_hash = crypt('gouransh123', gen_salt('bf', 10)) where lower(name) in ('gouransh');
update public.students set name = 'Aakanksha', section = 'B', active = true, access_code_hash = crypt('aakanksha123', gen_salt('bf', 10)) where lower(name) in ('aakanksha', 'aakanksha kamti');
update public.students set section = 'B', active = true, access_code_hash = crypt('pratap123', gen_salt('bf', 10)) where lower(name) in ('pratap', 'bhanu pratap');
update public.students set name = 'Pratap', section = 'B', active = true, access_code_hash = crypt('pratap123', gen_salt('bf', 10)) where lower(name) in ('pratap', 'bhanu pratap');
update public.students set name = 'Aliya', section = 'B', active = true, access_code_hash = crypt('aliya123', gen_salt('bf', 10)) where lower(name) in ('aliya');
update public.students set name = 'Kiaan', section = 'B', active = true, access_code_hash = crypt('kiaan123', gen_salt('bf', 10)) where lower(name) in ('kiaan');
update public.students set name = 'Rubani', section = 'B', active = true, access_code_hash = crypt('rubani123', gen_salt('bf', 10)) where lower(name) in ('rubani');
update public.students set name = 'Priya', section = 'B', active = true, access_code_hash = crypt('priya123', gen_salt('bf', 10)) where lower(name) in ('priya', 'priyh', 'bhanu priya');
update public.students set name = 'Tanjot', section = 'B', active = true, access_code_hash = crypt('tanjot123', gen_salt('bf', 10)) where lower(name) in ('tanjot');
update public.students set name = 'Guransh', section = 'B', active = true, access_code_hash = crypt('guransh123', gen_salt('bf', 10)) where lower(name) in ('guransh', 'guransh singh soni');

-- 3. Upsert any students that do not exist yet
insert into public.students (name, section, active, access_code_hash) values
  ('Arnav', 'A', true, crypt('arnav123', gen_salt('bf', 10))),
  ('Aayushi', 'A', true, crypt('aayushi123', gen_salt('bf', 10))),
  ('Dhruv', 'A', true, crypt('dhruv123', gen_salt('bf', 10))),
  ('Sidharth', 'A', true, crypt('sidharth123', gen_salt('bf', 10))),
  ('Anusha', 'A', true, crypt('anusha123', gen_salt('bf', 10))),
  ('Saanvii', 'A', true, crypt('saanvii123', gen_salt('bf', 10))),
  ('Arhaan', 'A', true, crypt('arhaan123', gen_salt('bf', 10))),
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
  ('Guransh', 'B', true, crypt('guransh123', gen_salt('bf', 10)))
on conflict ((lower(name))) do update set
  section = excluded.section,
  active = true,
  access_code_hash = excluded.access_code_hash;

-- 4. Refresh subject memberships for all students
delete from public.student_subjects
where student_id in (
  select id from public.students
  where lower(name) in (
    'arnav', 'aayushi', 'dhruv', 'sidharth', 'anusha', 'saanvii', 'arhaan',
    'arjun', 'ayaansh', 'vishwam', 'gouransh', 'aakanksha', 'pratap', 'aliya', 'kiaan', 'rubani', 'priya', 'tanjot', 'guransh'
  )
);

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
