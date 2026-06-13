-- JALANKAN SCRIPT INI DI SQL EDITOR SUPABASE UNTUK MEMBUAT KEBIJAKAN AKSES (RLS & GRANTS) PADA TABEL SAHAM, HARGA HISTORIS, DAN HASIL PREDIKSI
-- Buka Dashboard Supabase -> SQL Editor -> New Query -> Paste & Run

-- =========================================================================
-- 1. KONFIGURASI UNTUK TABEL: saham
-- =========================================================================

-- Aktifkan Row Level Security (RLS) pada tabel saham
ALTER TABLE public.saham ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada untuk menghindari duplikasi
DROP POLICY IF EXISTS "Allow public select" ON public.saham;
DROP POLICY IF EXISTS "Allow public insert" ON public.saham;
DROP POLICY IF EXISTS "Allow public update" ON public.saham;
DROP POLICY IF EXISTS "Allow public delete" ON public.saham;

-- Buat Kebijakan Baru
CREATE POLICY "Allow public select" ON public.saham FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.saham FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.saham FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.saham FOR DELETE USING (true);

-- Berikan hak akses ke client roles
GRANT ALL ON TABLE public.saham TO anon, authenticated, service_role;


-- =========================================================================
-- 2. KONFIGURASI UNTUK TABEL: harga_historis
-- =========================================================================

-- Aktifkan Row Level Security (RLS) pada tabel harga_historis
ALTER TABLE public.harga_historis ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada untuk menghindari duplikasi
DROP POLICY IF EXISTS "Allow public select" ON public.harga_historis;
DROP POLICY IF EXISTS "Allow public insert" ON public.harga_historis;
DROP POLICY IF EXISTS "Allow public update" ON public.harga_historis;
DROP POLICY IF EXISTS "Allow public delete" ON public.harga_historis;

-- Buat Kebijakan Baru
CREATE POLICY "Allow public select" ON public.harga_historis FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.harga_historis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.harga_historis FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.harga_historis FOR DELETE USING (true);

-- Berikan hak akses ke client roles
GRANT ALL ON TABLE public.harga_historis TO anon, authenticated, service_role;


-- =========================================================================
-- 3. KONFIGURASI UNTUK TABEL: hasil_prediksi
-- =========================================================================

-- Aktifkan Row Level Security (RLS) pada tabel hasil_prediksi
ALTER TABLE public.hasil_prediksi ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada untuk menghindari duplikasi
DROP POLICY IF EXISTS "Allow public select" ON public.hasil_prediksi;
DROP POLICY IF EXISTS "Allow public insert" ON public.hasil_prediksi;
DROP POLICY IF EXISTS "Allow public update" ON public.hasil_prediksi;
DROP POLICY IF EXISTS "Allow public delete" ON public.hasil_prediksi;

-- Buat Kebijakan Baru
CREATE POLICY "Allow public select" ON public.hasil_prediksi FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.hasil_prediksi FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.hasil_prediksi FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.hasil_prediksi FOR DELETE USING (true);

-- Berikan hak akses ke client roles
GRANT ALL ON TABLE public.hasil_prediksi TO anon, authenticated, service_role;
