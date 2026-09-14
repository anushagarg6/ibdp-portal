-- Migration script to generate and set bcrypt access code hashes for all students.
-- Run this script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- DP1A (Section A)
update public.students set section = 'A', access_code_hash = crypt('arnav-dp1a-821', gen_salt('bf', 12)) where lower(name) = 'arnav virmani';
update public.students set section = 'A', access_code_hash = crypt('aayushi-dp1a-394', gen_salt('bf', 12)) where lower(name) = 'aayushi sharma';
update public.students set section = 'A', access_code_hash = crypt('dhruv-dp1a-517', gen_salt('bf', 12)) where lower(name) = 'dhruv vason';
update public.students set section = 'A', access_code_hash = crypt('sidharth-dp1a-642', gen_salt('bf', 12)) where lower(name) = 'sidharth modi';
update public.students set section = 'A', access_code_hash = crypt('anusha-dp1a-759', gen_salt('bf', 12)) where lower(name) = 'anusha';
update public.students set section = 'A', access_code_hash = crypt('saanvii-dp1a-413', gen_salt('bf', 12)) where lower(name) = 'saanvii saluja';
update public.students set section = 'A', access_code_hash = crypt('arhaan-dp1a-928', gen_salt('bf', 12)) where lower(name) = 'arhaan sharma';

-- DP1B (Section B)
update public.students set section = 'B', access_code_hash = crypt('arjun-dp1b-683', gen_salt('bf', 12)) where lower(name) = 'arjun raina';
update public.students set section = 'B', access_code_hash = crypt('ayaansh-dp1b-741', gen_salt('bf', 12)) where lower(name) = 'ayaansh gautam';
update public.students set section = 'B', access_code_hash = crypt('vishwam-dp1b-852', gen_salt('bf', 12)) where lower(name) = 'vishwam';
update public.students set section = 'B', access_code_hash = crypt('gouransh-dp1b-963', gen_salt('bf', 12)) where lower(name) = 'gouransh';
update public.students set section = 'B', access_code_hash = crypt('aakanksha-dp1b-159', gen_salt('bf', 12)) where lower(name) = 'aakanksha kamti';
update public.students set section = 'B', access_code_hash = crypt('pratap-dp1b-357', gen_salt('bf', 12)) where lower(name) = 'bhanu pratap';
update public.students set section = 'B', access_code_hash = crypt('aliya-dp1b-486', gen_salt('bf', 12)) where lower(name) = 'aliya';
update public.students set section = 'B', access_code_hash = crypt('kiaan-dp1b-294', gen_salt('bf', 12)) where lower(name) = 'kiaan';
update public.students set section = 'B', access_code_hash = crypt('rubani-dp1b-618', gen_salt('bf', 12)) where lower(name) = 'rubani';
update public.students set section = 'B', access_code_hash = crypt('priya-dp1b-735', gen_salt('bf', 12)) where lower(name) = 'bhanu priya';
update public.students set section = 'B', access_code_hash = crypt('tanjot-dp1b-842', gen_salt('bf', 12)) where lower(name) = 'tanjot';
update public.students set section = 'B', access_code_hash = crypt('guransh-dp1b-529', gen_salt('bf', 12)) where lower(name) = 'guransh singh soni';
