# BONGKARJUDOL — Software Design Document

**Bongkar Peluang. Pahami Risikonya.**
Dokumen Perancangan Teknis — Minimum Viable Product (MVP)

| Informasi Dokumen | Keterangan |
|---|---|
| Nama produk | BongkarJudol |
| Jenis dokumen | Software Design Document (SDD) |
| Versi | 1.0 |
| Tanggal | 16 November 2026 |

> Dokumen ini merekonstruksi spesifikasi teknis aplikasi dari kode sumber yang ada
> (`src/`), sehingga selalu sinkron dengan implementasi. Aplikasi ini adalah situs
> statis (Vite + React) yang berjalan sepenuhnya di sisi klien (browser), tanpa
> backend dan tanpa database. Seluruh state sesi, simulasi, dan hasil kuis
> disimpan di `localStorage` peramban.

## 1. Tujuan Produk

Aplikasi web edukasi interaktif yang menunjukkan cara kerja RNG, probabilitas, RTP,
House Edge, Expected Value, dan variansi melalui simulasi "slot" dengan kredit virtual
terbatas. Tidak ada uang asli, tidak ada nilai komersial, tidak ada mekanik judi nyata.

## 2. Arsitektur

- **Frontend:** React 19 + TypeScript, dibundel Vite 8, gaya Tailwind CSS 4.
- **State:** `localStorage` (sesi anonim, sesi simulasi, riwayat putaran, hasil kuis).
- **Game engine:** modul murni `src/engine/` ( RNG, grid 6×5, tumble, cluster win,
  wild alokasi, multiplier, scatter/free spins) — berjalan di browser.
- **Deployment:** Vercel (static output `dist/`), tanpa serverless function.

### 2.1 Modul

| Modul | Path | Tanggung jawab |
|---|---|---|
| Konfigurasi | `src/engine/config.ts` | Versi, parameter sesi, bobot simbol, paytable |
| RNG | `src/engine/rng.ts` | Antarmuka `RngProvider` + implementasi |
| Mesin permainan | `src/engine/gameEngine.ts` | Grid, tumble, cluster, wild, multiplier, free spins |
| Monte Carlo | `src/engine/monteCarlo.ts` | Skrip CLI laporan RTP (statis `src/data/monteCarloReport.json`) |
| Konten belajar | `src/data/learningContent.ts` | Materi, bank soal pre/post test |
| Layanan lokal | `src/services/localSimulation.ts`, `localQuiz.ts` | Logika sesi/kuis berbasis `localStorage` |
| UI | `src/pages/*`, `src/components/*` | Halaman & komponen presentasi |

## 3. Aturan Sesi Simulasi

| Parameter | Nilai | Sumber |
|---|---|---|
| Modal awal | 1000 koin mainan | `STARTING_BALANCE` |
| Taruhan | 10–100, kelipatan 10 | `ALLOWED_BETS` |
| Batas putaran berbayar | 100 | `MAX_PAID_SPINS` |
| Batas durasi | 15 menit (900 dtk) | `SESSION_DURATION_SECONDS` |
| Maks transisi tumble | 5 (6 evaluasi grid) | `MAX_TUMBLE_TRANSITIONS` |
| Biaya beli Scatter | 500 koin | `BUY_SCATTER_COST` |
| Grid | 6 kolom × 5 baris = 30 sel | `GRID_COLS/GRID_ROWS` |

Sesi berakhir otomatis bila: 100 putaran tercapai, waktu 15 menit habis, atau saldo
tidak cukup untuk taruhan minimum 10 koin.

## 4. Mekanik Permainan

1. **Grid awal** diisi 30 sel berdasarkan `SYMBOL_WEIGHTS` (CHERRY 15, BELL 13, GEM 11,
   CROWN 9, WILD 5, SCATTER 2, MULTIPLIER 3, LEAF 21, MOON 21 — total 100).
2. **Cluster win:** simbol reguler yang muncul ≥8 kali membayar sesuai `PAYTABLE_MULTIPLIERS`
   dengan tier 8–9 / 10–11 / 12+.
3. **Wild:** dialokasikan secara global paling optimal (tie-break: payout > wild terpakai
   minimum > prioritas CROWN>GEM>BELL>CHERRY).
4. **Multiplier:** simbol MULTIPLIER bernilai 2×/3×/5× (bobot 70/25/5); jumlah nilainya
   jadi pengali total rantai.
5. **Tumble:** simbol yang menang + multiplier + wild terpakai dihapus, grid runtuh &
   diisi ulang, hingga maksimal 5 transisi.
6. **Scatter → Free Spins:** 3→10, 4→12, 5+→15 putaran gratis (tanpa biaya, tanpa scatter).

## 5. Learning Flow

1. Pre-test 8 soal (bank `PRE_TEST_QUESTIONS`) → skor awal.
2. Simulasi (opsional, dengan mode edukasi pilih jumlah Scatter 3/4/5).
3. Materi belajar (`LEARNING_MATERIALS`).
4. Post-test 8 soal (`POST_TEST_QUESTIONS`) → hanya bisa setelah pre-test.
5. Halaman Hasil: delta skor, penguasaan per topik, rekomendasi topik yang perlu diulang.

## 6. Penyimpanan (Browser)

Seluruh state bertahan saat refresh namun **tidak lintas perangkat** (hilang bila
ganti browser / incognito / clear site data):

- `bj_session_token` (sessionStorage) — token sesi untuk konsistensi header.
- `localStorage` — sesi simulasi aktif, riwayat putaran, hasil pre/post test,
  versi konten.

## 7. Keamanan & Privasi (MVP edukasi)

- Tidak ada data pribadi, tidak ada autentikasi, tidak ada uang.
- Karena engine berjalan di klien, tidak ada jaminan anti-cheat — wajar untuk game
  edukasi dengan kredit virtual tanpa nilai.
- Semua angka adalah kredit mainan.

## 8. Deployment

- Build: `vite build` → `dist/`.
- Vercel: framework Vite, SPA rewrite ke `index.html`.
- Tanpa variabel lingkungan, tanpa database, tanpa CLI tambahan.

## 9. Versi

- `CONFIG_VERSION` = `BJ-MVP-1.0.0` (parameter permainan)
- `CONTENT_VERSION` = `BJ-CONTENT-1.0.0` (materi & soal)