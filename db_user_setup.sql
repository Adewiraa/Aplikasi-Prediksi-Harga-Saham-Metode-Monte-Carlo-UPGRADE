-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO CREATE THE USERS TABLE AND POLICIES
-- Buka Dashboard Supabase -> SQL Editor -> New Query -> Paste & Run

-- 1. Hapus tabel user lama jika ada
DROP TABLE IF EXISTS public.user;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Buat tabel users yang baru
CREATE TABLE public.users (
  id bigint primary key generated always as identity,
  nama text not null,
  username text not null unique,
  password text not null,
  level text not null default 'User',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Buat kebijakan (Policy) agar siapa saja (anon & authenticated) bisa melakukan SELECT, INSERT, UPDATE, dan DELETE
CREATE POLICY "Allow public select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.users FOR DELETE USING (true);

-- 5. Berikan hak akses penuh ke client role
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 6. Sisipkan akun bawaan untuk demonstrasi dan keamanan
INSERT INTO public.users (nama, username, password, level)
VALUES ('Ade Wiramiharja (Admin)', 'admin@prediksihargasaham.com', 'admin1234', 'Admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.users (nama, username, password, level)
VALUES ('Demo Visitor', 'demo@prediksihargasaham.com', 'demo1234', 'User')
ON CONFLICT (username) DO NOTHING;
