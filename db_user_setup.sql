-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO CREATE THE USERS TABLE
-- Buka Dashboard Supabase -> SQL Editor -> New Query -> Paste & Run

-- Hapus tabel user lama (singular) agar tidak terjadi konflik reserved keyword
DROP TABLE IF EXISTS public.user;

-- Buat tabel users baru (plural) yang aman dari reserved keyword
CREATE TABLE IF NOT EXISTS public.users (
  id bigint primary key generated always as identity,
  nama text not null,
  username text not null unique,
  password text not null,
  level text not null default 'User',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Nonaktifkan Row Level Security (RLS) agar frontend Next.js dapat melakukan SELECT dan INSERT langsung
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Berikan izin akses penuh ke client role
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
