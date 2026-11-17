-- =====================================================================
-- MinePod by Lourdes Auto Parts - Supabase Database Schema & Seed Data
-- =====================================================================
-- Jalankan skrip SQL ini di Supabase SQL Editor:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Klik menu "SQL Editor" di bilah kiri
-- 3. Tempel seluruh isi file ini -> Klik "Run"
-- =====================================================================

-- 1. TABEL: EPISODES (Pipeline Produksi Podcast)
CREATE TABLE IF NOT EXISTS episodes (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    guest TEXT DEFAULT '',
    goal TEXT DEFAULT '',
    rec TEXT DEFAULT '',
    rel TEXT DEFAULT '',
    d JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: GUESTS (Daftar & Manajemen Tamu Podcast)
CREATE TABLE IF NOT EXISTS guests (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    ep INT DEFAULT 1,
    st INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: KPIS (Pelacakan Metrik & Indikator Kinerja Bulanan)
CREATE TABLE IF NOT EXISTS kpis (
    id BIGINT PRIMARY KEY,
    m TEXT NOT NULL,
    v NUMERIC,
    r NUMERIC,
    i NUMERIC,
    s NUMERIC,
    l NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: EQUIPMENTS (Peralatan & Anggaran Produksi)
CREATE TABLE IF NOT EXISTS equipments (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    spec TEXT DEFAULT '',
    est NUMERIC DEFAULT 0,
    act NUMERIC,
    st INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: RISKS (Mitigasi Risiko Produksi)
CREATE TABLE IF NOT EXISTS risks (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    mit TEXT DEFAULT '',
    ok BOOLEAN DEFAULT FALSE,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mengizinkan akses publik/anonim agar aplikasi dapat membaca dan menyimpan data
-- =====================================================================

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

-- Buat policy jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for episodes') THEN
        CREATE POLICY "Public Access for episodes" ON episodes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for guests') THEN
        CREATE POLICY "Public Access for guests" ON guests FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for kpis') THEN
        CREATE POLICY "Public Access for kpis" ON kpis FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for equipments') THEN
        CREATE POLICY "Public Access for equipments" ON equipments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for risks') THEN
        CREATE POLICY "Public Access for risks" ON risks FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =====================================================================
-- AKTIFKAN SUPABASE REALTIME (Sync Otomatis Antar Perangkat / Tab)
-- =====================================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE episodes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE guests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE kpis;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE equipments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE risks;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- =====================================================================
-- SEED DATA AWAL (MinePod by Lourdes Auto Parts)
-- =====================================================================

-- Inisialisasi 6 Episode Pertama
INSERT INTO episodes (id, title, guest, goal, rec, rel, d)
VALUES
(1, 'Cerita di Balik PT. Garuda Mart Indonesia', 'Perwakilan Manajemen', 'Brand Awareness & Trust', '', '', '{}'::jsonb),
(2, 'Industri Auto Parts 2026: Tren, Tantangan, dan Peluang Masa Depan', 'CEO / Founder', 'Thought Leadership & Brand Authority', '', '', '{}'::jsonb),
(3, 'Dari Masalah Menjadi Solusi: Cerita Nyata di Balik Kepuasan Pelanggan', 'Marketing / Business Development / Pelanggan', 'Customer Trust & Lead Generation', '', '', '{}'::jsonb),
(4, 'Behind the Safety: Sehari Bersama Tim HSE dan Budaya Kerja Aman', 'Departemen HSE', 'Employer Branding & Safety Awareness', '', '', '{}'::jsonb),
(5, 'Dari Ide Menjadi Inovasi: Proses R&D dan Production', 'Departemen RnD', 'Technical Credibility & Employer Branding', '', '', '{}'::jsonb),
(6, 'After-Sales Excellence: Peran Tim Service', 'Departemen Service', 'Service Excellence & Customer Loyalty', '', '', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Inisialisasi Tamu
INSERT INTO guests (id, name, ep, st)
VALUES
(1, 'Perwakilan Manajemen', 1, 0),
(2, 'CEO / Founder', 2, 0),
(3, 'Marketing / Busdev', 3, 0),
(4, 'Departemen HSE', 4, 0),
(5, 'Departemen RnD', 5, 0),
(6, 'Departemen Service', 6, 0)
ON CONFLICT (id) DO NOTHING;

-- Inisialisasi Peralatan & Anggaran (Paket A)
INSERT INTO equipments (id, name, spec, est, act, st)
VALUES
(1, 'Kamera Mirrorless (3 unit)', 'Sony A5000', 12000000, NULL, 0),
(2, 'Tripod 3 unit', 'INBEX IB-2R 170CM + remote Bluetooth', 600000, NULL, 0),
(3, 'Processor (second)', 'Intel Core i7 6800K LGA 2011-V3', 1200000, NULL, 0),
(4, 'Power Supply', 'Thermalright TR-SP1000 1000W 80+ Platinum', 1800000, NULL, 0),
(5, 'VGA', 'ASUS KO GeForce RTX 3060 Ti 8GB OC V2', 1600000, NULL, 0),
(6, 'RAM', 'Digital Alliance DDR4 16GB 3200MHz', 2100000, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- Inisialisasi Risiko & Mitigasi
INSERT INTO risks (id, name, mit, ok, note)
VALUES
(1, 'Konsistensi produksi menurun', 'Batch recording 3–4 episode sekaligus untuk membangun buffer konten', false, ''),
(2, 'Kualitas audio kurang baik', 'Penanganan akustik ruangan dan pelatihan teknis singkat bagi operator', false, ''),
(3, 'Tamu batal hadir', 'Daftar cadangan topik solo dan tamu internal', false, ''),
(4, 'Isu kerahasiaan / reputasi', 'Release form tertulis dari tamu dan review konten sebelum rilis', false, ''),
(5, 'Engagement rendah', 'Evaluasi KPI per kuartal dan penyesuaian topik berdasarkan data pendengar', false, ''),
(6, 'Man power', 'Fokus untuk podcast (penunjukan tim produksi)', false, '')
ON CONFLICT (id) DO NOTHING;
