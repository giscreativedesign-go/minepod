# 🎙️ MinePod by Lourdes Auto Parts
> **Sistem Penunjang Kerja Produksi Podcast**  
> *"Wawasan Inspiratif untuk Bisnis Masa Depan"* — PT. Garuda Mart Indonesia / Lourdes Auto Parts

Aplikasi manajemen dan pipeline produksi podcast siap pakai yang dirancang untuk dapat langsung dideploy ke **Supabase** (Database PostgreSQL & Realtime Sync) dan **Vercel** (Hosting Frontend & Serverless Edge).

---

## 🌟 Fitur Utama

- **Pipeline Produksi 5 Tahap:** Pra-Produksi, Produksi, Pasca-Produksi, Distribusi, dan Evaluasi dengan checklist interaktif dan kalkulasi progres otomatis.
- **Sinkronisasi Supabase Realtime:** Setiap perubahan data (checklist, judul, tanggal, status) otomatis tersinkronisasi ke PostgreSQL Supabase dan langsung tampil di perangkat tim lain secara realtime.
- **Offline / Local Fallback:** Jika belum terhubung ke Supabase atau saat koneksi internet terputus, aplikasi tetap berjalan mulus menggunakan `localStorage` browser.
- **Manajemen Tamu (Guest Relations):** Pelacakan status undangan narasumber, keterkaitan episode, hingga verifikasi *Release Form*.
- **Rekap Kinerja:** Menggabungkan target dan laporan KPI, metrik kerja, serta WLA per tahap/PIC dengan diagram batang dan donat. SLA ditandai belum dikonfigurasi sampai target dan data aktual tersedia.
- **Menu QCC Podcast:** Analisa episode dan checklist produksi, perbandingan periode, jadwal rekaman/rilis, metrik pendengar, Pareto checklist tertunda, kandidat tema, Fishbone 6M, tindak lanjut PDCA, serta ekspor laporan PowerPoint 17 slide. Catatan QCC disimpan lokal di browser.
- **Anggaran & Peralatan (Paket A):** Pelacakan spesifikasi alat studio, estimasi biaya vs realisasi, status pesanan, serta kalkulasi otomatis selisih hemat/over-budget.
- **Mitigasi Risiko Produksi:** SOP antisipasi kendala teknis, audio, konsistensi jadwal, dan legalitas.
- **Cadangan & Reset (Backup JSON):** Ekspor dan impor data sewaktu-waktu dalam format JSON.
- **Dukungan Tema:** Mode Terang (*Light*) dan Gelap (*Dark*) sesuai kenyamanan mata.

---

## 🚀 Panduan Deploy

### Bagian 1: Konfigurasi Supabase (Database)

1. **Buat Akun & Proyek:**
   - Kunjungi [supabase.com](https://supabase.com) dan buat akun (gratis).
   - Klik **New Project**, tentukan nama proyek (misal: `minepod-lourdes`), buat password database, dan pilih region terdekat (misal: *Singapore*).

2. **Jalankan Skrip Database:**
   - Di dashboard Supabase, buka menu **SQL Editor** pada bilah menu sebelah kiri.
   - Klik **New query**.
   - Buka file [`supabase/schema.sql`](supabase/schema.sql), salin seluruh isinya, tempel ke SQL Editor Supabase, lalu klik tombol **Run**.
   - *Skrip ini akan membuat tabel `episodes`, `guests`, `kpis`, `equipments`, `risks`, mengaktifkan Row Level Security (RLS), mengaktifkan Realtime, dan mengisi data awal bawaan Lourdes Auto Parts.*

3. **Ambil Kredensial API:**
   - Buka menu **Project Settings** (ikon gerigi) > **API**.
   - Salin dua nilai berikut:
     - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
     - **Project API Keys** -> `anon` `public` (kunci publik panjang yang diawali `eyJ...`)

---

### Bagian 2: Deploy ke Vercel (Frontend & Serverless)

Aplikasi ini sudah dilengkapi dengan [`vercel.json`](vercel.json) dan endpoint Serverless [`api/config.js`](api/config.js).

#### Cara A: Melalui GitHub (Direkomendasikan)
1. Buat repositori baru di GitHub (misal: `minepod-lourdes`).
2. Masukkan kode ini ke repositori Anda:
   ```bash
   git init
   git add .
   git commit -m "Inisialisasi MinePod Supabase & Vercel"
   git branch -M main
   git remote add origin https://github.com/USERNAME/minepod-lourdes.git
   git push -u origin main
   ```
3. Buka [vercel.com](https://vercel.com) dan masuk dengan akun Anda.
4. Klik **Add New...** > **Project**, lalu pilih repositori GitHub Anda.
5. Pada bagian **Environment Variables**, tambahkan 2 variabel:
   - `SUPABASE_URL` = (Project URL dari Supabase)
   - `SUPABASE_ANON_KEY` = (anon public key dari Supabase)
6. Klik **Deploy**.
7. Dalam beberapa detik, website Anda sudah aktif dengan URL resmi dari Vercel (misal: `https://minepod-lourdes.vercel.app`) dan langsung terhubung dengan database Supabase!

#### Cara B: Menggunakan Vercel CLI
Jika Anda memiliki [Vercel CLI](https://vercel.com/cli):
```bash
npm install -g vercel
vercel
```
Tambahkan environment variables melalui dashboard Vercel setelah selesai.

---

### Bagian 3: Menjalankan di Komputer Lokal (Localhost)

Aplikasi ini memiliki built-in server tanpa perlu menginstal dependensi tambahan:

1. Buat salinan file lingkungan:
   ```bash
   cp .env.example .env
   ```
   Lalu buka file `.env` dan masukkan `SUPABASE_URL` serta `SUPABASE_ANON_KEY` Anda.

2. Jalankan server lokal:
   ```bash
   npm run dev
   # atau:
   node server.js
   ```

3. Buka browser di [http://localhost:3000](http://localhost:3000).

*(Catatan: Anda juga bisa langsung membuka file `index.html` di browser tanpa server lokal, lalu mengatur Supabase URL dan Key melalui tombol **⚙️ Supabase** di header!)*

---

## 📁 Struktur Berkas

```
podcast/
├── api/
│   └── config.js           # Vercel Serverless Function (membaca Environment Variables)
├── css/
│   └── style.css           # Desain UI resmi Lourdes Auto Parts, responsif & dark mode
├── js/
│   ├── app.js              # Controller utama aplikasi, kalkulasi, checklist, dan render
│   └── supabase.js         # Klien Supabase, sinkronisasi realtime, dan CRUD
├── supabase/
│   └── schema.sql          # Skrip SQL lengkap untuk Supabase (Tabel, RLS, Realtime, Seed Data)
├── .env.example            # Contoh konfigurasi environment variable
├── .gitignore              # Pencegah commit berkas privat / rahasia
├── index.html              # Halaman web utama
├── package.json            # Skrip proyek (npm run dev / start)
├── server.js               # Server lokal mandiri (Zero-Dependency)
├── vercel.json             # Konfigurasi routing & header untuk Vercel
└── README.md               # Dokumentasi lengkap
```

---

## 💡 Tips & Penggunaan

1. **Multi-User / Kolaborasi Tim:**  
   Buka URL aplikasi di dua tab atau perangkat berbeda. Centang salah satu checklist di Tab 1, maka tab/perangkat lainnya akan otomatis tercentang dalam hitungan milidetik berkat Supabase Realtime!
2. **Indikator Status Supabase:**  
   - 🟢 **Supabase Aktif**: Data tersambung langsung ke cloud database PostgreSQL.
   - 🟡 **Mode Lokal**: Data tersimpan di memori browser lokal (klik tombol ini kapan saja untuk menyambungkan ke Supabase).
3. **One-Click Data Seeding:**  
   Jika Anda membuat tabel baru di Supabase tanpa data awal, cukup klik tombol **⚙️ Supabase** > **Unggah Data Awal ke Supabase** untuk mengisi database secara instan dengan 6 episode dan seluruh aset Lourdes Auto Parts.

---

**MinePod by Lourdes Auto Parts**  
*Mendukung Transformasi Digital & Komunikasi Korporat Masa Depan.*
