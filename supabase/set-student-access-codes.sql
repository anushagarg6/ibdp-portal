-- Migration script to generate and set bcrypt access code hashes for all students in Supabase.
-- Run this script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- DP1A (Section A)
update public.students set section = 'A', access_code_hash = crypt('arnav123', gen_salt('bf', 10)) where lower(name) = 'arnav virmani';
update public.students set section = 'A', access_code_hash = crypt('aayushi123', gen_salt('bf', 10)) where lower(name) = 'aayushi sharma';
update public.students set section = 'A', access_code_hash = crypt('dhruv123', gen_salt('bf', 10)) where lower(name) = 'dhruv vason';
update public.students set section = 'A', access_code_hash = crypt('sidharth123', gen_salt('bf', 10)) where lower(name) = 'sidharth modi';
update public.students set section = 'A', access_code_hash = crypt('anusha123', gen_salt('bf', 10)) where lower(name) = 'anusha';
update public.students set section = 'A', access_code_hash = crypt('saanvii123', gen_salt('bf', 10)) where lower(name) = 'saanvii saluja';
update public.students set section = 'A', access_code_hash = crypt('arhaan123', gen_salt('bf', 10)) where lower(name) = 'arhaan sharma';

-- DP1B (Section B)
update public.students set section = 'B', access_code_hash = crypt('arjun123', gen_salt('bf', 10)) where lower(name) = 'arjun raina';
update public.students set section = 'B', access_code_hash = crypt('ayaansh123', gen_salt('bf', 10)) where lower(name) = 'ayaansh gautam';
update public.students set section = 'B', access_code_hash = crypt('vishwam123', gen_salt('bf', 10)) where lower(name) = 'vishwam';
update public.students set section = 'B', access_code_hash = crypt('gouransh123', gen_salt('bf', 10)) where lower(name) = 'gouransh';
update public.students set section = 'B', access_code_hash = crypt('aakanksha123', gen_salt('bf', 10)) where lower(name) = 'aakanksha kamti';
update public.students set section = 'B', access_code_hash = crypt('pratap123', gen_salt('bf', 10)) where lower(name) = 'bhanu pratap';
update public.students set section = 'B', access_code_hash = crypt('aliya123', gen_salt('bf', 10)) where lower(name) = 'aliya';
update public.students set section = 'B', access_code_hash = crypt('kiaan123', gen_salt('bf', 10)) where lower(name) = 'kiaan';
update public.students set section = 'B', access_code_hash = crypt('rubani123', gen_salt('bf', 10)) where lower(name) = 'rubani';
update public.students set section = 'B', access_code_hash = crypt('priya123', gen_salt('bf', 10)) where lower(name) = 'bhanu priya';
update public.students set section = 'B', access_code_hash = crypt('tanjot123', gen_salt('bf', 10)) where lower(name) = 'tanjot';
update public.students set section = 'B', access_code_hash = crypt('guransh123', gen_salt('bf', 10)) where lower(name) = 'guransh singh soni';
