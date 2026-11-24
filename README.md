# BongkarJudol

**Bongkar Peluang. Pahami Risikonya.**

Aplikasi web edukasi interaktif untuk memahami RNG, probabilitas, RTP, House Edge,
Expected Value, dan variansi melalui simulasi kredit virtual terbatas. Tidak ada
uang asli, tidak ada mekanik judi nyata — hanya kredit mainan untuk tujuan belajar.

## Fitur

- **Simulasi slot edukatif** — grid 6×5 dengan tumble, cluster win, Wild, pengali,
  dan Free Spins. Modal 1.000 koin mainan, maksimal 100 putaran atau 15 menit.
- **Tes Awal & Tes Akhir** — 8 soal masing-masing, dengan pembahasan jawaban.
- **Materi belajar** — 5 topik tentang cara kerja mesin dan jebakan pola pikir.
- **Halaman Statistik** — RTP teramati, house edge, distribusi payout, grafik saldo,
  dan detail tiap putaran.
- **Halaman Algoritma** — transparansi bobot simbol, paytable, dan hasil Monte Carlo
  100.000 trial.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Chart.js (grafik statistik)

Seluruh permainan berjalan **di sisi klien** (browser). Tidak ada backend, tidak ada
database. Sesi simulasi dan hasil kuis disimpan di `localStorage` peramban sehingga
bertahan saat refresh, tetapi **tidak lintas perangkat** (ganti browser / incognito /
hapus data situs = mulai baru). Ini memang disengaja: aplikasi ini murni edukasi.

## Menjalankan Lokal

**Prasyarat:** Node.js 20+ (disarankan 22+).

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Perintah lain:

```bash
npm run build     # build produksi ke dist/
npm run preview   # pratinjau hasil build
npm run lint      # cek TypeScript
npm test          # jalankan unit test engine
npm run montecarlo # regenerasi src/data/monteCarloReport.json
```

## Deploy ke Vercel

1. Push repository ini ke GitHub.
2. Di Vercel, **Add New → Project**, pilih repo `zenoxyn/bongkarjudol`.
3. Vercel otomatis mendeteksi framework **Vite**. Pengaturan build sudah disediakan
   di `vercel.json` (build `dist/`, SPA rewrite). Klik **Deploy**.

Tidak ada environment variable, database, atau langkah tambahan yang diperlukan.

## Struktur Project

```
src/
  engine/      # logika permainan murni (RNG, grid, tumble, paytable)
  data/        # materi belajar, bank soal, laporan Monte Carlo
  services/    # layanan sesi & kuis berbasis localStorage
  components/  # komponen presentasi
  pages/       # 7 halaman aplikasi
  types/       # tipe data & router "API" lokal
  utils/       # kontrol simulator, audio, RNG browser
docs/
  software-design-document.md
```

## Lisensi

Proyek edukasi. Bebas dipakai untuk pembelajaran.
