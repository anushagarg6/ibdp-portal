-- Migration to update students and their subject memberships according to the DP1A / DP1B chart.

-- 1. Ensure all subject groups exist
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

-- 2. Insert or update student profiles with section
insert into public.students (name, section) values
  -- DP1A (Section A)
  ('Arnav Virmani', 'A'),
  ('Aayushi Sharma', 'A'),
  ('Dhruv Vason', 'A'),
  ('Sidharth Modi', 'A'),
  ('Anusha', 'A'),
  ('Saanvii Saluja', 'A'),
  ('Arhaan Sharma', 'A'),

  -- DP1B (Section B)
  ('Arjun Raina', 'B'),
  ('Ayaansh Gautam', 'B'),
  ('Vishwam', 'B'),
  ('Gouransh', 'B'),
  ('Aakanksha Kamti', 'B'),
  ('Bhanu Pratap', 'B'),
  ('Aliya', 'B'),
  ('Kiaan', 'B'),
  ('Rubani', 'B'),
  ('Bhanu Priya', 'B'),
  ('Tanjot', 'B'),
  ('Guransh Singh Soni', 'B')
on conflict ((lower(name))) do update set section = excluded.section;

-- 3. Clear existing subject memberships for these students
delete from public.student_subjects
where student_id in (
  select id from public.students
  where lower(name) in (
    'arnav virmani', 'aayushi sharma', 'dhruv vason', 'sidharth modi', 'anusha', 'saanvii saluja', 'arhaan sharma',
    'arjun raina', 'ayaansh gautam', 'vishwam', 'gouransh', 'aakanksha kamti', 'bhanu pratap', 'aliya', 'kiaan', 'rubani', 'bhanu priya', 'tanjot', 'guransh singh soni'
  )
);

-- 4. Insert exact student subject mappings from chart
insert into public.student_subjects (student_id, group_code)
select s.id, m.group_code
from (values
  -- DP1A
  ('Arnav Virmani', 'ENGLISH-A-A'), ('Arnav Virmani', 'FRENCH-AB-A'), ('Arnav Virmani', 'PHYSICS-A'), ('Arnav Virmani', 'CHEMISTRY-A'), ('Arnav Virmani', 'BIO-A'), ('Arnav Virmani', 'MATH-AA-A'), ('Arnav Virmani', 'MATH-AI-A'),
  ('Aayushi Sharma', 'ENGLISH-A-A'), ('Aayushi Sharma', 'GERMAN-AB-A'), ('Aayushi Sharma', 'PHYSICS-A'), ('Aayushi Sharma', 'CHEMISTRY-A'), ('Aayushi Sharma', 'BIO-A'), ('Aayushi Sharma', 'MATH-AA-A'), ('Aayushi Sharma', 'MATH-AI-A'),
  ('Dhruv Vason', 'ENGLISH-A-A'), ('Dhruv Vason', 'FRENCH-AB-A'), ('Dhruv Vason', 'PHYSICS-A'), ('Dhruv Vason', 'CHEMISTRY-A'), ('Dhruv Vason', 'BUSINESS-MANAGEMENT-A'), ('Dhruv Vason', 'MATH-AA-A'), ('Dhruv Vason', 'MATH-AI-A'),
  ('Sidharth Modi', 'ENGLISH-A-A'), ('Sidharth Modi', 'GERMAN-AB-A'), ('Sidharth Modi', 'PHYSICS-A'), ('Sidharth Modi', 'CHEMISTRY-A'), ('Sidharth Modi', 'BUSINESS-MANAGEMENT-A'), ('Sidharth Modi', 'MATH-AA-A'), ('Sidharth Modi', 'MATH-AI-A'),
  ('Anusha', 'ENGLISH-A-A'), ('Anusha', 'HINDI-B-A'), ('Anusha', 'PHYSICS-A'), ('Anusha', 'COMPUTER-SCIENCE-A'), ('Anusha', 'DS-A'), ('Anusha', 'MATH-AA-A'), ('Anusha', 'MATH-AI-A'),
  ('Saanvii Saluja', 'ENGLISH-A-A'), ('Saanvii Saluja', 'FRENCH-AB-A'), ('Saanvii Saluja', 'PHYSICS-A'), ('Saanvii Saluja', 'COMPUTER-SCIENCE-A'), ('Saanvii Saluja', 'ECONOMICS-A'), ('Saanvii Saluja', 'MATH-AA-A'), ('Saanvii Saluja', 'MATH-AI-A'),
  ('Arhaan Sharma', 'ENGLISH-A-A'), ('Arhaan Sharma', 'HINDI-B-A'), ('Arhaan Sharma', 'PHYSICS-A'), ('Arhaan Sharma', 'CHEMISTRY-A'), ('Arhaan Sharma', 'ECONOMICS-A'), ('Arhaan Sharma', 'MATH-AA-A'), ('Arhaan Sharma', 'MATH-AI-A'),

  -- DP1B
  ('Arjun Raina', 'ENGLISH-A-B'), ('Arjun Raina', 'FRENCH-B-B'), ('Arjun Raina', 'ECON-B'), ('Arjun Raina', 'PSYCH-B9-B'), ('Arjun Raina', 'BIO-B'), ('Arjun Raina', 'MATH-AA-B'),
  ('Ayaansh Gautam', 'ENGLISH-A-B'), ('Ayaansh Gautam', 'HINDI-B-B'), ('Ayaansh Gautam', 'ECON-B'), ('Ayaansh Gautam', 'COMPUTER-SCIENCE-B'), ('Ayaansh Gautam', 'BUSINESS-MANAGEMENT-B1-B'), ('Ayaansh Gautam', 'MATH-AA-B'),
  ('Vishwam', 'ENGLISH-A-B'), ('Vishwam', 'GERMAN-AB-B'), ('Vishwam', 'PHYSICS-B'), ('Vishwam', 'CHEMISTRY-B'), ('Vishwam', 'BUSINESS-MANAGEMENT-B1-B'), ('Vishwam', 'MATH-AA-B'),
  ('Gouransh', 'ENGLISH-A-B'), ('Gouransh', 'HINDI-B-B'), ('Gouransh', 'PHYSICS-B'), ('Gouransh', 'COMPUTER-SCIENCE-B'), ('Gouransh', 'BUSINESS-MANAGEMENT-B1-B'), ('Gouransh', 'MATH-AA-B'),
  ('Aakanksha Kamti', 'ENGLISH-A-B'), ('Aakanksha Kamti', 'HINDI-B-B'), ('Aakanksha Kamti', 'PHYSICS-B'), ('Aakanksha Kamti', 'COMPUTER-SCIENCE-B'), ('Aakanksha Kamti', 'ECON-B'), ('Aakanksha Kamti', 'MATH-AA-B'),
  ('Bhanu Pratap', 'ENGLISH-A-B'), ('Bhanu Pratap', 'GERMAN-B-B'), ('Bhanu Pratap', 'PHYSICS-B'), ('Bhanu Pratap', 'COMPUTER-SCIENCE-B'), ('Bhanu Pratap', 'PSYCH-B9-B'), ('Bhanu Pratap', 'MATH-AA-B'),
  ('Aliya', 'ENGLISH-A-B'), ('Aliya', 'GERMAN-B-B'), ('Aliya', 'PSYCH-B9-B'), ('Aliya', 'COMPUTER-SCIENCE-B'), ('Aliya', 'BIO-B'), ('Aliya', 'MATH-AA-B'),
  ('Kiaan', 'ENGLISH-A-B'), ('Kiaan', 'HINDI-B-B'), ('Kiaan', 'PSYCH-B9-B'), ('Kiaan', 'BUSINESS-MANAGEMENT-B1-B'), ('Kiaan', 'ESS-B'), ('Kiaan', 'MATH-AI-B'),
  ('Rubani', 'ENGLISH-A-B'), ('Rubani', 'GERMAN-AB-B'), ('Rubani', 'ECON-B'), ('Rubani', 'VISUAL-ARTS-B7-B'), ('Rubani', 'ESS-B'), ('Rubani', 'MATH-AI-B'),
  ('Bhanu Priya', 'ENGLISH-A-B'), ('Bhanu Priya', 'GERMAN-AB-B'), ('Bhanu Priya', 'PHYSICS-B'), ('Bhanu Priya', 'COMPUTER-SCIENCE-B'), ('Bhanu Priya', 'PSYCH-B9-B'), ('Bhanu Priya', 'MATH-AI-B'),
  ('Tanjot', 'ENGLISH-A-B'), ('Tanjot', 'FRENCH-AB-B'), ('Tanjot', 'PHYSICS-B'), ('Tanjot', 'COMPUTER-SCIENCE-B'), ('Tanjot', 'ECON-B'), ('Tanjot', 'MATH-AA-B'),
  ('Guransh Singh Soni', 'ENGLISH-A-B'), ('Guransh Singh Soni', 'HINDI-B-B'), ('Guransh Singh Soni', 'PHYSICS-B'), ('Guransh Singh Soni', 'CHEMISTRY-B'), ('Guransh Singh Soni', 'ECON-B'), ('Guransh Singh Soni', 'MATH-AA-B'), ('Guransh Singh Soni', 'MATH-AI-B')
) as m(student_name, group_code)
join public.students s on lower(s.name) = lower(m.student_name)
on conflict (student_id, group_code) do nothing;
