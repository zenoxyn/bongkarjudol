import { useState } from 'react';
import { ArrowRight, BookOpen, Calculator, ShieldCheck } from 'lucide-react';
import type { AlgorithmSpecDto, PageRoute, SessionStateResponse } from '../types/api.ts';
import type { SlotSymbol } from '../engine/config.ts';
import { SYMBOL_META, SymbolGlyph } from '../components/SymbolIcon.tsx';
import { MediaFrame } from '../components/MediaFrame.tsx';
import heroLabImg from '../assets/images/hero_probability_lab_1795526790875.jpg';

interface LandingPageProps {
  onNavigate: (page: PageRoute) => void;
  onStartLearningFlow: () => Promise<void>;
  sessionState: SessionStateResponse | null;
  algoSpec: AlgorithmSpecDto | null;
  busy: boolean;
}

const MYTHS: Array<{ num: string; myth: string; fact: string }> = [
  {
    num: '01',
    myth: '"Lagi ada jam gacor / mesin lagi panas"',
    fact: 'Setiap tekan tombol, komputer mengocok ulang dari nol. Jam berapa pun peluangnya tetap sama persis.',
  },
  {
    num: '02',
    myth: '"Sudah kalah banyak, bentar lagi pasti dikasih menang"',
    fact: 'Mesin tidak punya ingatan. Kalah 20 kali beruntun tidak bikin putaran ke-21 lebih gampang menang.',
  },
  {
    num: '03',
    myth: '"Layar bunyi MENANG! berarti lagi untung"',
    fact: 'Pasang 20 koin lalu dapat hadiah 6 koin itu tetap rugi 14 koin, walau layarnya berkedip meriah.',
  },
  {
    num: '04',
    myth: '"Beli bonus putaran gratis pasti langsung balik modal"',
    fact: 'Hadiah bonus gratis sudah dihitung agar rata-rata pemain tetap rugi. Sering kali hasilnya di bawah harga belinya.',
  },
];

const SYMBOL_PREVIEW: Array<{
  symbol: SlotSymbol;
  name: string;
  share: string;
  note: string;
  category: 'zonk' | 'reward' | 'special';
  detail: string;
  isZonk?: boolean;
}> = [
  {
    symbol: 'LEAF',
    name: 'Daun',
    share: '21%',
    note: 'Zonk (0 koin)',
    category: 'zonk',
    detail: '21 dari 100 kartu berisi Daun kosong tanpa hadiah untuk menyumbat kotak agar gambar lain sulit terkumpul 8 buah.',
    isZonk: true,
  },
  {
    symbol: 'MOON',
    name: 'Bulan',
    share: '21%',
    note: 'Zonk (0 koin)',
    category: 'zonk',
    detail: '21 dari 100 kartu berisi Bulan kosong (0 koin). Gabungan Daun + Bulan membuat 42% layar rata-rata buntu.',
    isZonk: true,
  },
  {
    symbol: 'CHERRY',
    name: 'Cherry',
    share: '15%',
    note: 'Hadiah kecil',
    category: 'reward',
    detail: 'Muncul paling sering di antara gambar hadiah, tetapi 8–9 Cherry hanya membayar 0,2× taruhan (tetap tekor 80%).',
  },
  {
    symbol: 'BELL',
    name: 'Bell',
    share: '13%',
    note: 'Hadiah sedang',
    category: 'reward',
    detail: 'Butuh minimal 8 gambar di layar dan hanya membayar 0,32× taruhan jika terkumpul 8–9 buah.',
  },
  {
    symbol: 'GEM',
    name: 'Gem',
    share: '11%',
    note: 'Hadiah tinggi',
    category: 'reward',
    detail: 'Baru memberi untung bersih jika terkumpul 12+ gambar sekaligus (1,92× taruhan); kalau 8–11 buah tetap rugi.',
  },
  {
    symbol: 'CROWN',
    name: 'Crown',
    share: '9%',
    note: 'Hadiah utama',
    category: 'reward',
    detail: 'Gambar hadiah termahal (0,80×–3,20× taruhan), namun jatahnya sengaja dibatasi cuma 9 dari 100 kartu.',
  },
  {
    symbol: 'WILD',
    name: 'Wild',
    share: '5%',
    note: 'Pengganti 1 jenis',
    category: 'special',
    detail: 'Hanya menolong 1 jenis gambar bernilai tertinggi pada putaran tersebut, tidak pernah bisa menggantikan semua gambar sekaligus.',
  },
  {
    symbol: 'MULTIPLIER',
    name: 'Pengali',
    share: '3%',
    note: '2×, 3×, 5×',
    category: 'special',
    detail: 'Bola pengali dijumlahkan (bukan dikali silang) dan langsung hangus jika di putaran itu tidak ada 8+ gambar menang.',
  },
  {
    symbol: 'SCATTER',
    name: 'Bonus',
    share: '2%',
    note: 'Putaran gratis',
    category: 'special',
    detail: 'Cuma 2 dari 100 kartu! Butuh minimal 3 Bintang sekaligus (~1 kali tiap 45 putaran) untuk masuk mode Putaran Gratis.',
  },
];

const CATEGORY_SUMMARY: Record<
  'zonk' | 'reward' | 'special',
  { label: string; share: string; cards: string; detail: string }
> = {
  zonk: {
    label: 'Zonk (Kosong)',
    share: '42%',
    cards: '42 dari 100 kartu',
    detail:
      'Total 42 kartu bernilai 0 koin: Daun 21 kartu + Bulan 21 kartu. Dua gambar ini sengaja dibuat paling banyak supaya kotak layar cepat buntu dan gambar hadiah sulit terkumpul 8 buah. Kalau yang muncul mayoritas Daun & Bulan, putaran itu tidak membayar apa pun.',
  },
  reward: {
    label: 'Gambar Hadiah',
    share: '48%',
    cards: '48 dari 100 kartu',
    detail:
      'Total 48 kartu berhadiah: Cherry 15 + Bell 13 + Gem 11 + Crown 9. Semua gambar ini baru membayar jika terkumpul minimal 8 gambar sama di layar, dan sebagian besar kombinasi 8–9 gambar masih membayar di bawah taruhan. Hanya kombinasi langka yang benar-benar untung.',
  },
  special: {
    label: 'Kartu Spesial',
    share: '10%',
    cards: '10 dari 100 kartu',
    detail:
      'Total hanya 10 kartu spesial: Wild 5 + Pengali 3 + Bonus 2. Wild cuma menggantikan 1 jenis gambar, Pengali dijumlahkan (bukan dikali silang), dan Bonus butuh minimal 3 Bintang sekaligus (sekitar 1 kali tiap 45 putaran). Jatahnya sengaja dibuat mini agar jarang menolong.',
  },
};

export function LandingPage({
  onNavigate,
  onStartLearningFlow,
  sessionState,
  algoSpec,
  busy,
}: LandingPageProps) {
  const [activeSymbol, setActiveSymbol] = useState<SlotSymbol>('LEAF');
  const [hoveredSegment, setHoveredSegment] = useState<'zonk' | 'reward' | 'special' | null>(null);
  const mc = algoSpec?.monteCarloReport;
  const rtp = mc ? mc.estimatedRtpPercent : 75.21;
  const edge = mc ? mc.estimatedHouseEdgePercent : 24.79;
  const lossPer100 = mc ? Math.round(Math.abs(mc.expectedValuePerUnit) * 100) : 25;
  const payoutPos = mc ? mc.payoutPositiveFrequencyPercent : 43.9;
  const netProfit = mc ? mc.netProfitFrequencyPercent : 18.4;
  const netLoss = mc ? mc.netLossFrequencyPercent : 80.3;
  const selectedItem =
    SYMBOL_PREVIEW.find((item) => item.symbol === activeSymbol) ?? SYMBOL_PREVIEW[0];

  const isSegmentHighlighted = (category: 'zonk' | 'reward' | 'special') =>
    hoveredSegment ? hoveredSegment === category : selectedItem.category === category;

  const isTileHighlighted = (item: (typeof SYMBOL_PREVIEW)[number]) =>
    hoveredSegment ? hoveredSegment === item.category : activeSymbol === item.symbol;

  return (
    <div className="space-y-0">
      {/* 1. Full-Bleed Midnight Editorial Hero */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-sky-300 tracking-wide">
                <span>Edukasi Gratis Anti-Judol</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>Koin Mainan</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>Tanpa Daftar Akun</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
                Bongkar Peluang. Pahami Risikonya.
              </h1>

              <p className="text-[15px] sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Coba sendiri mesin slot tiruan ini pakai koin mainan gratis. Buktikan langsung
                kenapa layarnya sering terasa memberi menang, tapi makin lama dimainkan saldo hampir
                pasti habis dimakan sistem bandar.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onStartLearningFlow}
                  className="group min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg shadow-lg shadow-sky-950/50 hover:shadow-sky-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 whitespace-nowrap"
                >
                  <span>
                    {sessionState?.preTestCompleted
                      ? 'Lanjutkan ke Simulasi Slot'
                      : 'Mulai Tes Awal & Coba Mesin'}
                  </span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('algoritma')}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-100 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:border-sky-400/60 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  <span>Lihat Bukti Hitungannya</span>
                </button>
              </div>

              <div className="border-t border-slate-800 pt-5 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong className="font-semibold text-white">100% Simulasi Edukasi:</strong>{' '}
                  Tidak ada setor uang, tidak bisa dicairkan, bukan alat cari pola gacor, dan
                  tidak terhubung ke situs judi mana pun.
                </p>
              </div>
            </div>

            {/* Right Exhibit Showcase Column */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="group relative flex-1 rounded-2xl overflow-hidden border border-slate-700/80 hover:border-sky-500/50 bg-[#090F1E] shadow-2xl sm:min-h-[380px] flex flex-col justify-end transition-colors duration-200">
                <div className="relative h-52 sm:h-full sm:absolute sm:inset-0 overflow-hidden">
                  <MediaFrame
                    src={heroLabImg}
                    alt="Ilustrasi kotak kaca mesin peluang yang memperlihatkan tumpukan token Daun dan Bulan kosong dibanding sedikit Mahkota dan Bintang Bonus"
                    fallbackTitle="Laboratorium Transparansi Mesin Slot"
                    fallbackSubtitle="42% kotak berisi gambar kosong (Daun & Bulan), hanya 2% berisi Bintang Bonus."
                    aspectClass="h-full w-full"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#090F1E] via-[#090F1E]/75 sm:via-[#090F1E]/65 to-transparent"
                    aria-hidden="true"
                  />
                </div>
                <div className="relative z-10 p-5 sm:p-7 space-y-4 bg-[#090F1E] sm:bg-transparent">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-amber-300">
                      Bukti Uji Coba · {mc ? mc.trials.toLocaleString('id-ID') : '100.000'} Kali Putar
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                      Kenapa Rasanya Menang Terus, Tapi Saldo Habis?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg">
                      Hampir separuh putaran memang mengeluarkan hadiah, tetapi sebagian besar
                      nilainya <strong>lebih kecil dari taruhan</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/70 rounded-xl p-3.5">
                    <div className="rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-white/5">
                      <div className="text-[11px] text-slate-300">Layar Ada Hadiah</div>
                      <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                        {payoutPos.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-white/5">
                      <div className="text-[11px] text-slate-300">Untung Beneran</div>
                      <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                        {netProfit.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-white/5">
                      <div className="text-[11px] text-slate-300">Ujungnya Rugi</div>
                      <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-rose-400 mt-0.5">
                        {netLoss.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Proof Ledger & Machine Anatomy Band */}
      <section className="bg-editorial-grid border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
          {/* 4-Column KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="surface-elevated interactive-card group rounded-xl p-5 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500 transition-colors group-hover:text-sky-800">
                Uang Balik (RTP)
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 transition-colors group-hover:text-sky-900">
                {rtp.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Dari Rp100 ribu berulang, rata-rata cuma balik Rp{Math.round(rtp)} ribu.
              </p>
            </div>

            <div className="surface-elevated interactive-card group rounded-xl p-5 border border-slate-200/80 hover:border-rose-300">
              <div className="text-xs font-medium text-slate-500 transition-colors group-hover:text-rose-700">
                Potongan Bandar
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-rose-700 mt-1.5">
                {edge.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Rp{lossPer100} ribu dari tiap Rp100 ribu perlahan tersedot ke bandar.
              </p>
            </div>

            <div className="surface-elevated interactive-card group rounded-xl p-5 border border-slate-200/80 hover:border-rose-300">
              <div className="text-xs font-medium text-slate-500 transition-colors group-hover:text-rose-700">
                Peluang Putaran Rugi
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-rose-700 mt-1.5">
                {netLoss.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Sekitar 8 dari 10 kali putar berakhir tekor dibanding taruhan.
              </p>
            </div>

            <div className="surface-elevated interactive-card group rounded-xl p-5 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500 transition-colors group-hover:text-sky-800">
                Isi Kotak Zonk (Kosong)
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 transition-colors group-hover:text-sky-900">
                42.0%
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Hampir separuh isi 30 kotak layar adalah Daun &amp; Bulan bernilai 0 koin.
              </p>
            </div>
          </div>

          {/* Interactive Visual Anatomy of the 100 Cards */}
          <div className="surface-elevated rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="text-xs font-semibold text-sky-800">
                  Bedah Isi Mesin · Arahkan Kursor atau Ketuk Gambar di Bawah
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  Isi 100 Kartu Kocokan di Balik Layar Mesin
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sebelum mencoba memutar mesin, lihat jatah asli tiap gambar. Gambar kosong (Daun
                  &amp; Bulan) sengaja dibuat paling banyak agar hadiah besar jarang sekali berkumpul.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('algoritma')}
                className="group min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer self-start lg:self-auto whitespace-nowrap"
              >
                <span>Buka Rincian Daftar Hadiah</span>
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-1"
                />
              </button>
            </div>

            {/* Interactive Proportion Stacked Bar */}
            <div className="space-y-2">
              <div
                className="h-9 w-full rounded-lg overflow-hidden flex border border-slate-300 text-[11px] sm:text-xs font-mono font-bold"
                role="group"
                aria-label="Proporsi 100 kartu mesin"
              >
                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('zonk')}
                  onFocus={() => setHoveredSegment('zonk')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onBlur={() => setHoveredSegment(null)}
                  onClick={() => setActiveSymbol('LEAF')}
                  style={{ width: '42%', boxSizing: 'border-box', minWidth: 0 }}
                  className={`bg-slate-700 text-white flex items-center justify-center gap-1 px-1 sm:px-2 h-full text-[11px] sm:text-xs font-mono font-bold transition-opacity duration-150 cursor-pointer ${
                    isSegmentHighlighted('zonk') ? 'opacity-100' : 'opacity-70 hover:opacity-95'
                  }`}
                >
                  <span className="sm:hidden truncate">42% Zonk</span>
                  <span className="hidden sm:inline truncate">42% Zonk (Daun &amp; Bulan)</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('reward')}
                  onFocus={() => setHoveredSegment('reward')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onBlur={() => setHoveredSegment(null)}
                  onClick={() => setActiveSymbol('CHERRY')}
                  style={{ width: '48%', boxSizing: 'border-box', minWidth: 0 }}
                  className={`bg-sky-700 text-white flex items-center justify-center px-1 sm:px-2 h-full text-[11px] sm:text-xs font-mono font-bold transition-opacity duration-150 cursor-pointer ${
                    isSegmentHighlighted('reward') ? 'opacity-100' : 'opacity-75 hover:opacity-95'
                  }`}
                >
                  <span className="sm:hidden truncate">48% Hadiah</span>
                  <span className="hidden sm:inline truncate">48% Gambar Hadiah</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('special')}
                  onFocus={() => setHoveredSegment('special')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onBlur={() => setHoveredSegment(null)}
                  onClick={() => setActiveSymbol('SCATTER')}
                  style={{ width: '10%', boxSizing: 'border-box', minWidth: 0 }}
                  className={`bg-amber-500 text-slate-950 flex items-center justify-center px-0.5 sm:px-1 h-full text-[11px] sm:text-xs font-mono font-bold transition-opacity duration-150 cursor-pointer ${
                    isSegmentHighlighted('special') ? 'opacity-100' : 'opacity-75 hover:opacity-95'
                  }`}
                >
                  <span className="truncate">10%</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="leading-relaxed">
                  42 kartu bernilai 0 koin · 48 kartu hadiah (perlu 8+ gambar sama) · 10 kartu
                  spesial (Wild, Pengali, Bonus)
                </span>
              </div>
            </div>

            {/* 9 Interactive Symbol Tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
              {SYMBOL_PREVIEW.map((item) => {
                const isSpecial = item.category === 'special';
                const isHighlighted = isTileHighlighted(item);
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    aria-pressed={isHighlighted}
                    onMouseEnter={() => setActiveSymbol(item.symbol)}
                    onFocus={() => setActiveSymbol(item.symbol)}
                    onClick={() => setActiveSymbol(item.symbol)}
                    className={`group rounded-xl border p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-sky-600 ${
                      isHighlighted
                        ? item.isZonk
                          ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 -translate-y-1 shadow-md'
                          : isSpecial
                          ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/25 -translate-y-1 shadow-md'
                          : 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-600/20 -translate-y-1 shadow-md'
                        : item.isZonk
                        ? 'bg-slate-100/90 border-slate-200 hover:border-rose-300 hover:-translate-y-1 hover:shadow-sm'
                        : isSpecial
                        ? 'bg-sky-50/70 border-sky-200 hover:border-amber-400 hover:-translate-y-1 hover:shadow-sm'
                        : 'bg-white border-slate-200 hover:border-sky-400 hover:-translate-y-1 hover:shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-transform duration-150 group-hover:scale-110 ${
                        isHighlighted ? 'bg-white border-slate-300 scale-105' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <SymbolGlyph
                        symbol={item.symbol}
                        multiplierValue={item.symbol === 'MULTIPLIER' ? 5 : undefined}
                        size={24}
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {item.name}
                    </div>
                    <div
                      className={`font-mono tabular-nums text-xs font-bold ${
                        item.isZonk ? 'text-rose-700' : 'text-sky-900'
                      }`}
                    >
                      {item.share}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {item.note}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Symbol Detail Bar */}
            <div
              aria-live="polite"
              className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors duration-150"
            >
              {hoveredSegment ? (
                (() => {
                  const group = SYMBOL_PREVIEW.filter((item) => item.category === hoveredSegment);
                  const summary = CATEGORY_SUMMARY[hoveredSegment];
                  return (
                    <>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          {group.map((item) => (
                            <div
                              key={item.symbol}
                              className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs"
                            >
                              <SymbolGlyph
                                symbol={item.symbol}
                                multiplierValue={item.symbol === 'MULTIPLIER' ? 5 : undefined}
                                size={22}
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{summary.label}</div>
                          <div className="text-xs font-mono tabular-nums text-sky-800 font-semibold">
                            {summary.cards} · {summary.share}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] sm:text-xs">
                          {group.map((item) => (
                            <span key={item.symbol} className="text-slate-600">
                              <span className="font-bold text-slate-900">{item.name}</span>{' '}
                              {item.share}
                            </span>
                          ))}
                        </div>
                        <p>{summary.detail}</p>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      <SymbolGlyph
                        symbol={selectedItem.symbol}
                        multiplierValue={selectedItem.symbol === 'MULTIPLIER' ? 5 : undefined}
                        size={24}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedItem.name}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-sky-800 font-semibold">
                        Jatah {selectedItem.share} · {selectedItem.note}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed sm:border-l sm:border-slate-200 sm:pl-4">
                    {selectedItem.detail}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 Common Myths Busted */}
      <section className="bg-[#DCE5F2] border-b border-slate-300/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
          <div className="max-w-2xl space-y-1.5">
            <div className="text-xs font-semibold text-rose-700">
              Cek Fakta Lapangan
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              4 Anggapan yang Sering Bikin Orang Terjebak
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Banyak korban berasal dari pekerja dan keluarga biasa yang tergoda janji manis. Ini
              fakta sebenarnya di balik layar:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MYTHS.map((item) => (
              <div
                key={item.num}
                className="surface-elevated interactive-card group rounded-xl border border-slate-200/90 hover:border-rose-300/90 p-5 sm:p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-rose-700">Mitos {item.num}</span>
                    <span className="font-mono text-slate-400 transition-colors group-hover:text-rose-500">
                      #{item.num}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                    {item.myth}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200 group-hover:border-rose-200 transition-colors pt-3.5">
                  <strong className="font-semibold text-slate-900">Faktanya:</strong> {item.fact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 3-Step Pedagogical Loop */}
      <section className="bg-editorial-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-sky-800">
                Alur Belajar Interaktif
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                3 Langkah Mudah Membuktikan Sendiri
              </h2>
              <p className="text-sm text-slate-600">
                Cukup 10–15 menit pakai koin mainan terbatas (maksimal 100 putaran).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-elevated interactive-card group rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-sky-800">Langkah 01 · Coba Sendiri</span>
                  <span className="font-mono text-slate-400 transition-colors group-hover:text-sky-600">01</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 transition-colors group-hover:text-sky-900">
                  Tes Awal &amp; Main Simulasi
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Jawab 8 pertanyaan singkat pakai bahasa sehari-hari, lalu coba mesin slot tiruan
                  dengan modal 1.000 koin mainan.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('pre-test')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-sky-800 hover:text-sky-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Buka Tes Awal →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Buka Simulasi →
                </button>
              </div>
            </div>

            <div className="surface-elevated interactive-card group rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-sky-800">Langkah 02 · Buka Rahasianya</span>
                  <span className="font-mono text-slate-400 transition-colors group-hover:text-sky-600">02</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 transition-colors group-hover:text-sky-900">
                  Lihat Catatan &amp; Cara Kerja Mesin
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Lihat grafik naik-turun koin Anda sendiri, bongkar jatah gambar zonk di dalam
                  mesin, dan baca 10 materi pendek bergambar.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('statistik')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-sky-800 hover:text-sky-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Catatan →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('algoritma')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Cara Kerja →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('materi')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Materi →
                </button>
              </div>
            </div>

            <div className="surface-elevated interactive-card group rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-sky-800">Langkah 03 · Cek Perubahan</span>
                  <span className="font-mono text-slate-400 transition-colors group-hover:text-sky-600">03</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 transition-colors group-hover:text-sky-900">
                  Tes Akhir &amp; Hasil Belajar
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Jawab lagi 8 pertanyaan singkat setelah melihat bukti aslinya, lalu lihat langsung
                  topik mana yang sudah Anda kuasai.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('post-test')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-sky-800 hover:text-sky-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Buka Tes Akhir →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('hasil')}
                  className="min-h-[40px] inline-flex items-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:translate-x-1 transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Hasil Belajar →
                </button>
              </div>
            </div>
          </div>

          {/* Grounded Safeguards Band */}
          <div className="surface-elevated grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200/90 rounded-2xl p-6 sm:p-8">
            <div className="group flex items-start gap-4 rounded-xl p-2 -m-2 transition-colors hover:bg-sky-50/45">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 shrink-0 transition-all duration-150 group-hover:bg-sky-100 group-hover:scale-105">
                <Calculator size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Mesin Jujur &amp; Terbuka (Bukan Setingan Menang di Awal)
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Berbeda dari situs judi asli yang sering memberi umpan menang di awal, aturan
                  mesin ini dibuka terang-terangan (<span className="font-mono text-xs">BJ-MVP-1.0.0</span>)
                  dan sudah diuji 100.000 kali putaran.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 rounded-xl p-2 -m-2 transition-colors hover:bg-sky-50/45">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 shrink-0 transition-all duration-150 group-hover:bg-sky-100 group-hover:scale-105">
                <BookOpen size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Dibatasi Sengaja Agar Tidak Jadi Candu
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Ada tombol putar otomatis 10–50 kali supaya cepat melihat saldo tergerus, tapi
                  modal 1.000 koin tidak bisa diisi ulang dan simulasi berhenti di 100 putaran atau
                  15 menit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
