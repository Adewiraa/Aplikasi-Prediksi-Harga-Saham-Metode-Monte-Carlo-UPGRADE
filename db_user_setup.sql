-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO CREATE THE USER TABLE
-- Buka Dashboard Supabase -> SQL Editor -> New Query -> Paste & Run

CREATE TABLE IF NOT EXISTS public.user (
  id bigint primary key generated always as identity,
  nama text not null,
  username text not null unique,
  password text not null,
  level text not null default 'User',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Nonaktifkan Row Level Security (RLS) pada tabel user untuk mempermudah testing tugas akhir/skripsi
ALTER TABLE public.user DISABLE ROW LEVEL SECURITY;
