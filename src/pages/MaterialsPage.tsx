import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ImageOff } from 'lucide-react';
import {
  apiFetch,
  type LearningMaterialDto,
  type PageRoute,
} from '../types/api.ts';
import type { SlotSymbol } from '../engine/config.ts';
import { SYMBOL_META, SymbolGlyph } from '../components/SymbolIcon.tsx';

import eduKocokanKartuImg from '../assets/images/edu_kocokan_kartu_1795526077688.jpg';
import eduIlustrasiMesinImg from '../assets/images/edu_ilustrasi_mesin_1795526079842.jpg';
import eduMenangPalsuImg from '../assets/images/edu_menang_palsu_1795526079885.jpg';
import eduPotonganBandarImg from '../assets/images/edu_potongan_bandar_1795526079872.jpg';
import eduJebakanPikiranImg from '../assets/images/edu_jebakan_pikiran_1795526079416.jpg';

interface MaterialsPageProps {
  initialSlug?: string | null;
  onNavigate: (page: PageRoute) => void;
}

interface TopicIllustrationConfig {
  imageSrc: string;
  imageAlt: string;
  caption: string;
  symbols: Array<{
    symbol: SlotSymbol;
    multiplierValue?: 2 | 3 | 5;
    name: string;
    role: string;
  }>;
}

const TOPIC_VISUALS: Record<string, TopicIllustrationConfig> = {
  'rng-dan-independensi': {
    imageSrc: eduKocokanKartuImg,
    imageAlt: 'Ilustrasi 100 kartu di dalam topi pesulap yang dikocok ulang setiap putaran',
    caption:
      'Setiap kali tombol Putar ditekan, komputer mengocok ulang seluruh kartu dari nol. Kartu yang keluar sebelumnya tidak disimpan.',
    symbols: [
      { symbol: 'LEAF', name: 'Daun (Zonk)', role: 'Kosong · 21%' },
      { symbol: 'MOON', name: 'Bulan (Zonk)', role: 'Kosong · 21%' },
      { symbol: 'CROWN', name: 'Mahkota / Crown', role: 'Hadiah besar · 9%' },
      { symbol: 'SCATTER', name: 'Bintang Bonus', role: 'Putaran gratis · 2%' },
    ],
  },
  'bobot-simbol-dan-probabilitas': {
    imageSrc: eduKocokanKartuImg,
    imageAlt: 'Ilustrasi pembagian 100 kartu berisi banyak kartu Daun dan Bulan yang kosong dibanding dua kartu Bintang Bonus',
    caption:
      'Ibarat 100 kartu di dalam topi: 42 kartu adalah gambar kosong (Daun & Bulan), sedangkan Bintang Bonus hanya ada 2 kartu.',
    symbols: [
      { symbol: 'LEAF', name: 'Daun', role: 'Zonk 21% (0 koin)' },
      { symbol: 'MOON', name: 'Bulan', role: 'Zonk 21% (0 koin)' },
      { symbol: 'CHERRY', name: 'Cherry', role: 'Hadiah kecil · 15%' },
      { symbol: 'CROWN', name: 'Mahkota / Crown', role: 'Hadiah tinggi · 9%' },
      { symbol: 'WILD', name: 'Wild', role: 'Pengganti · 5%' },
      { symbol: 'SCATTER', name: 'Bintang Bonus', role: 'Sangat langka · 2%' },
    ],
  },
  'cluster-dan-alokasi-wild': {
    imageSrc: eduIlustrasiMesinImg,
    imageAlt: 'Ilustrasi layar mesin kotak 6 kali 5 berisi gambar Cherry, Bell, Gem, dan Mahkota',
    caption:
      'Mesin menghitung jumlah gambar yang sama di mana saja pada 30 kotak layar. Minimal harus ada 8 gambar yang sama baru keluar hadiah.',
    symbols: [
      { symbol: 'CHERRY', name: 'Cherry', role: 'Min. 8 gambar = 0,2×' },
      { symbol: 'BELL', name: 'Bell', role: 'Min. 8 gambar = 0,35×' },
      { symbol: 'GEM', name: 'Gem', role: 'Min. 8 gambar = 0,6×' },
      { symbol: 'CROWN', name: 'Crown', role: 'Min. 8 gambar = 1,2×' },
      { symbol: 'WILD', name: 'Wild (Pengganti)', role: 'Bantu 1 jenis saja · 5%' },
      { symbol: 'LEAF', name: 'Daun & Bulan (Zonk)', role: 'Tidak bisa menang · 42%' },
    ],
  },
  'mekanisme-tumble': {
    imageSrc: eduIlustrasiMesinImg,
    imageAlt: 'Ilustrasi gambar di layar mesin kotak yang pecah lalu digantikan gambar baru dari atas',
    caption:
      'Saat 8+ gambar menang pecah, kotak kosong diisi gambar baru dari atas—tetapi gambar yang jatuh tetap punya 42% peluang kosong (Daun/Bulan).',
    symbols: [
      { symbol: 'GEM', name: 'Gem', role: 'Pecah jika 8+ buah' },
      { symbol: 'CHERRY', name: 'Cherry', role: 'Pecah jika 8+ buah' },
      { symbol: 'LEAF', name: 'Daun', role: 'Sering jatuh mengisi kotak' },
      { symbol: 'MOON', name: 'Bulan', role: 'Sering menyetop runtuhan' },
    ],
  },
  'multiplier-aditif': {
    imageSrc: eduIlustrasiMesinImg,
    imageAlt: 'Ilustrasi bola pengali 2x, 3x, dan 5x yang dijumlahkan angkanya di layar mesin',
    caption:
      'Bola pengali yang muncul dalam satu rangkaian kemenangan dijumlahkan angkanya (misalnya 2 + 3 = 5×), bukan dikali silang.',
    symbols: [
      { symbol: 'MULTIPLIER', multiplierValue: 2, name: 'Bola 2×', role: 'Menambah +2 angka pengali' },
      { symbol: 'MULTIPLIER', multiplierValue: 3, name: 'Bola 3×', role: 'Menambah +3 angka pengali' },
      { symbol: 'MULTIPLIER', multiplierValue: 5, name: 'Bola 5×', role: 'Hangus jika 0 gambar menang' },
    ],
  },
  'scatter-dan-free-spins': {
    imageSrc: eduIlustrasiMesinImg,
    imageAlt: 'Ilustrasi Bintang Bonus dan layar putaran gratis dengan pengali dan hitungan koin',
    caption:
      'Minimal 3 Bintang Bonus memicu 10–15 Putaran Gratis. Namun total hadiahnya sering jauh lebih kecil daripada harga Beli Scatter (500 koin).',
    symbols: [
      { symbol: 'SCATTER', name: 'Bintang Bonus (Scatter)', role: '3★ = 10 Gratis · 4★ = 12 · 5★ = 15' },
      { symbol: 'MULTIPLIER', multiplierValue: 5, name: 'Bola Pengali', role: 'Ikut muncul di mode gratis' },
      { symbol: 'CROWN', name: 'Mahkota / Crown', role: 'Tetap perlu 8+ buah' },
    ],
  },
  'gross-payout-vs-net-profit': {
    imageSrc: eduMenangPalsuImg,
    imageAlt: 'Ilustrasi koin besar masuk ke layar penuh perayaan tetapi hanya sedikit koin kembali ke dompet',
    caption:
      'Trik Menang Palsu: layar meriah menyebut Anda menang 4 koin, padahal taruhan yang baru saja dipotong adalah 20 koin (dompet tetap tekor 16 koin).',
    symbols: [
      { symbol: 'CHERRY', name: '8 Cherry (0,2×)', role: 'Taruhan 20 → dapat 4 koin (−16)' },
      { symbol: 'BELL', name: '8 Bell (0,35×)', role: 'Taruhan 20 → dapat 7 koin (−13)' },
      { symbol: 'GEM', name: '8 Gem (0,6×)', role: 'Taruhan 20 → dapat 12 koin (−8)' },
    ],
  },
  'rtp-teoretis-vs-observasi': {
    imageSrc: eduPotonganBandarImg,
    imageAlt: 'Ilustrasi corong yang membagi 100 koin menjadi sekitar 75 koin kembali ke pemain dan sekitar 25 koin masuk brankas bandar',
    caption:
      'Dari setiap 100 koin taruhan yang berputar jangka panjang, mesin ini rata-rata hanya mengembalikan 75,2 koin sebagai hadiah.',
    symbols: [
      { symbol: 'CROWN', name: 'Hadiah Besar', role: 'Jarang keluar, memberi ilusi awal' },
      { symbol: 'CHERRY', name: 'Hadiah Kecil', role: 'Lebih sering, nilai di bawah taruhan' },
      { symbol: 'LEAF', name: 'Daun & Bulan', role: '42% layar kosong menjaga RTP < 100%' },
    ],
  },
  'house-edge-dan-expected-value': {
    imageSrc: eduPotonganBandarImg,
    imageAlt: 'Ilustrasi potongan pasti bandar sebesar 24,8 persen yang masuk ke brankas tertutup di setiap putaran',
    caption:
      'Setiap kali uang kemenangan kecil diputar ulang, total taruhan ikut membesar dan potongan pasti bandar ~25% terus menggerus sisa modal.',
    symbols: [
      { symbol: 'LEAF', name: 'Daun (0 koin)', role: 'Menahan hadiah agar rata-rata tekor' },
      { symbol: 'MOON', name: 'Bulan (0 koin)', role: 'Menahan hadiah agar rata-rata tekor' },
      { symbol: 'SCATTER', name: 'Bintang Bonus', role: 'Biaya tetap termasuk dalam potongan 24,8%' },
    ],
  },
  'variansi-dan-bias-kognitif': {
    imageSrc: eduJebakanPikiranImg,
    imageAlt: 'Ilustrasi seseorang meletakkan ponsel slot dan memilih menjaga tabungan keluarga yang cerah',
    caption:
      'Keluar dari jebakan pikiran: berhenti mengejar kekalahan melindungi uang makan, sekolah, dan tabungan keluarga sebelum habis.',
    symbols: [
      { symbol: 'SCATTER', name: 'Umpan 2 Bintang', role: 'Ilusi "kurang 1 lagi" bikin penasaran' },
      { symbol: 'MULTIPLIER', multiplierValue: 5, name: 'Bola Nyaris', role: 'Muncul saat kalah agar terus main' },
      { symbol: 'LEAF', name: 'Kenyataan Layar', role: '42% isi layar tetap gambar kosong' },
    ],
  },
};

interface InlineSymbolMatch {
  symbol: SlotSymbol;
  multiplierValue?: 2 | 3 | 5;
}

const SYMBOL_TOKEN_REGEX =
  /(\bBintang Bonus\b|\bScatter\b|\b[Bb]ola pengali\b|\b[Bb]ola\s*5×|\b[Bb]ola\s*3×|\b[Bb]ola\s*2×|\bDaun\b|\bBulan\b|\bMahkota\b|\bCrown\b|\bCherry\b|\bBell\b|\bGem\b|\bWild\b|(?<![0-9])[235]×)/g;

function resolveSymbolToken(token: string): InlineSymbolMatch | null {
  const lower = token.toLowerCase();
  if (lower === 'daun') return { symbol: 'LEAF' };
  if (lower === 'bulan') return { symbol: 'MOON' };
  if (lower === 'mahkota' || lower === 'crown') return { symbol: 'CROWN' };
  if (lower === 'cherry') return { symbol: 'CHERRY' };
  if (lower === 'bell') return { symbol: 'BELL' };
  if (lower === 'gem') return { symbol: 'GEM' };
  if (lower === 'wild') return { symbol: 'WILD' };
  if (lower === 'bintang bonus' || lower === 'scatter') return { symbol: 'SCATTER' };
  if (lower === 'bola pengali') return { symbol: 'MULTIPLIER', multiplierValue: 5 };
  if (lower.includes('2×')) return { symbol: 'MULTIPLIER', multiplierValue: 2 };
  if (lower.includes('3×')) return { symbol: 'MULTIPLIER', multiplierValue: 3 };
  if (lower.includes('5×')) return { symbol: 'MULTIPLIER', multiplierValue: 5 };
  return null;
}

function RichSymbolText({
  text,
  darkSurface = false,
}: {
  text: string;
  darkSurface?: boolean;
}) {
  const parts = text.split(SYMBOL_TOKEN_REGEX);
  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        const match = resolveSymbolToken(part);
        if (!match) {
          return <Fragment key={idx}>{part}</Fragment>;
        }
        const meta = SYMBOL_META[match.symbol];
        const badgeStyle = darkSurface
          ? 'bg-slate-800 border-slate-600 text-amber-100'
          : `${meta.bgClass} ${meta.borderClass} ${meta.textClass}`;
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 align-middle px-1.5 py-0.5 mx-0.5 rounded-md border text-[0.88em] font-semibold leading-none whitespace-nowrap ${badgeStyle}`}
          >
            <SymbolGlyph
              symbol={match.symbol}
              multiplierValue={match.multiplierValue}
              size={15}
            />
            <span>{part}</span>
          </span>
        );
      })}
    </>
  );
}

function TopicIllustrationCard({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const visual = TOPIC_VISUALS[slug];
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [slug]);

  if (!visual) return null;

  return (
    <div className="space-y-4">
      <figure className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {imgError ? (
          <div className="aspect-video w-full bg-slate-100 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500">
            <ImageOff size={28} aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">{title}</span>
            <span className="text-xs text-slate-500 max-w-md">{visual.caption}</span>
          </div>
        ) : (
          <div className="overflow-hidden">
            <img
              src={visual.imageSrc}
              alt={visual.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full aspect-video object-cover block transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          </div>
        )}
        <figcaption className="px-4 py-2.5 text-xs sm:text-sm text-slate-600 bg-white border-t border-slate-200 leading-relaxed">
          <RichSymbolText text={visual.caption} />
        </figcaption>
      </figure>

      {/* Symbol Visual Guide for this Topic */}
      <section
        aria-label="Gambar simbol yang dibahas pada topik ini"
        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2.5"
      >
        <div className="text-xs font-semibold text-slate-700">
          Kenali Gambar yang Dibahas di Bacaan Ini:
        </div>
        <div
          className={`grid gap-2.5 ${
            visual.symbols.length === 4
              ? 'grid-cols-1 sm:grid-cols-2'
              : visual.symbols.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {visual.symbols.map((item, idx) => {
            const meta = SYMBOL_META[item.symbol];
            return (
              <div
                key={`${item.symbol}-${idx}`}
                className="interactive-card group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 min-w-0 hover:border-sky-300"
              >
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110 ${meta.bgClass} ${meta.borderClass}`}
                >
                  <SymbolGlyph
                    symbol={item.symbol}
                    multiplierValue={item.multiplierValue}
                    size={26}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 leading-snug transition-colors group-hover:text-sky-900">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    {item.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Topic-Specific Visual Diagram */}
      <TopicDiagram slug={slug} />
    </div>
  );
}

function TopicDiagram({ slug }: { slug: string }) {
  if (slug === 'rng-dan-independensi') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual: Kenapa Mesin Selalu Mulai dari Nol
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-semibold text-rose-900">Putaran #1–#10</div>
            <div className="text-rose-700 mt-0.5">Kalah 10× berturut-turut</div>
            <div className="font-mono text-[11px] text-slate-600 mt-1">Peluang bonus: 2%</div>
          </div>
          <div className="rounded-lg bg-slate-100 border border-slate-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-semibold text-slate-900">Putaran #11</div>
            <div className="text-slate-700 mt-0.5">Mesin mengocok ulang baru</div>
            <div className="font-mono text-[11px] text-slate-600 mt-1">Ingatan kekalahan: 0</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-semibold text-sky-900">Peluang Putaran #11</div>
            <div className="text-sky-800 mt-0.5">Tetap sama persis seperti #1</div>
            <div className="font-mono text-[11px] font-bold text-sky-900 mt-1">
              Tetap 2% (tidak naik!)
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'bobot-simbol-dan-probabilitas') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual Pembagian 100 Kartu di Dalam Mesin
        </div>
        <div className="h-7 w-full rounded-lg overflow-hidden flex border border-slate-300 text-[11px] font-mono font-bold">
          <div
            style={{ width: '42%' }}
            className="bg-slate-700 text-white flex items-center justify-center px-1 truncate"
          >
            42% Zonk
          </div>
          <div
            style={{ width: '48%' }}
            className="bg-sky-700 text-white flex items-center justify-center px-1 truncate"
          >
            48% Gambar Hadiah
          </div>
          <div
            style={{ width: '10%' }}
            className="bg-amber-500 text-slate-950 flex items-center justify-center px-0.5 truncate"
          >
            10%
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <SymbolGlyph symbol="LEAF" size={14} /> + <SymbolGlyph symbol="MOON" size={14} /> = 42 kartu kosong
          </span>
          <span className="inline-flex items-center gap-1">
            <SymbolGlyph symbol="WILD" size={14} /> = 5 kartu Wild
          </span>
          <span className="inline-flex items-center gap-1">
            <SymbolGlyph symbol="SCATTER" size={14} /> = cuma 2 kartu Bintang Bonus
          </span>
        </div>
      </div>
    );
  }

  if (slug === 'cluster-dan-alokasi-wild') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual Contoh Aturan 1 Gambar Wild
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1 shrink-0">
              <SymbolGlyph symbol="GEM" size={22} />
              <span className="font-mono font-bold">+</span>
              <SymbolGlyph symbol="WILD" size={22} />
            </div>
            <div>
              <div className="font-bold text-emerald-900">7 Gem + 1 Wild = 8 buah (Menang)</div>
              <div className="text-emerald-800">Wild otomatis menolong hadiah yang lebih besar.</div>
            </div>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <SymbolGlyph symbol="CHERRY" size={22} />
            <div>
              <div className="font-bold text-rose-900">Cherry tetap 7 buah (Tidak Menang)</div>
              <div className="text-rose-800">1 Wild tidak bisa dipakai dobel untuk Cherry.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'multiplier-aditif') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual Hitungan Bola Pengali: Dijumlahkan, Bukan Dikalikan
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1 shrink-0">
              <SymbolGlyph symbol="MULTIPLIER" multiplierValue={2} size={22} />
              <span className="font-mono font-bold">+</span>
              <SymbolGlyph symbol="MULTIPLIER" multiplierValue={3} size={22} />
            </div>
            <div>
              <div className="font-bold text-emerald-900">Benar: 2 + 3 = 5×</div>
              <div className="text-emerald-800">Hadiah 10 koin × 5 = 50 koin.</div>
            </div>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1 shrink-0">
              <SymbolGlyph symbol="MULTIPLIER" multiplierValue={5} size={22} />
              <span className="font-mono font-bold text-rose-700">✕</span>
            </div>
            <div>
              <div className="font-bold text-rose-900">Salah Kira: 2 × 3 = 6×</div>
              <div className="text-rose-800">Kalau 0 gambar menang, bola pengali langsung hangus.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'gross-payout-vs-net-profit') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual Kenapa "Menang 4 Koin" Tetap Bikin Rugi
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono tabular-nums">
          <div className="rounded-lg bg-slate-100 border border-slate-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-sans text-[11px] text-slate-600">Taruhan Keluar</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">−20 koin</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-sans text-[11px] text-amber-900">Hadiah Layar</div>
            <div className="text-base font-bold text-amber-800 mt-0.5">+4 koin</div>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="font-sans text-[11px] text-rose-900">Hasil Dompet</div>
            <div className="text-base font-bold text-rose-700 mt-0.5">Rugi −16</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'rtp-teoretis-vs-observasi' || slug === 'house-edge-dan-expected-value') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700">
          Visual Nasib Setiap 100 Koin yang Masuk ke Mesin
        </div>
        <div className="h-7 w-full rounded-lg overflow-hidden flex border border-slate-300 text-[11px] font-mono font-bold">
          <div
            style={{ width: '75.2%' }}
            className="bg-sky-700 text-white flex items-center justify-center px-2 truncate"
          >
            75,2% Balik Jadi Hadiah
          </div>
          <div
            style={{ width: '24.8%' }}
            className="bg-rose-700 text-white flex items-center justify-center px-2 truncate"
          >
            24,8% Jatah Bandar
          </div>
        </div>
        <p className="text-[11px] text-slate-600">
          Makin banyak putaran dimainkan, total uang yang terpotong ke pihak bandar makin besar.
        </p>
      </div>
    );
  }

  return null;
}

export function MaterialsPage({ initialSlug, onNavigate }: MaterialsPageProps) {
  const [materials, setMaterials] = useState<LearningMaterialDto[]>([]);
  const [contentVersion, setContentVersion] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug ?? null);
  const [readSlugs, setReadSlugs] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem('bj_read_materials');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(true);
  const articleTopRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialSlug) {
      setActiveSlug(initialSlug);
    }
  }, [initialSlug]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ contentVersion: string; materials: LearningMaterialDto[] }>(
      '/api/v1/learning/materials'
    )
      .then((res) => {
        if (cancelled) return;
        setMaterials(res.materials);
        setContentVersion(res.contentVersion);
        setActiveSlug((prev) => prev ?? res.materials[0]?.slug ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentIdx = materials.findIndex((m) => m.slug === activeSlug);
  const current = currentIdx >= 0 ? materials[currentIdx] : materials[0];

  const markAsRead = (slug: string) => {
    setReadSlugs((prev) => {
      const next = new Set(prev);
      next.add(slug);
      try {
        window.localStorage.setItem(
          'bj_read_materials',
          JSON.stringify(Array.from(next))
        );
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  useEffect(() => {
    if (current) {
      markAsRead(current.slug);
    }
  }, [current?.slug]);

  const selectTopic = (slug: string) => {
    setActiveSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-slate-600">
        Memuat bacaan belajar...
      </div>
    );
  }

  const readPct = materials.length > 0 ? Math.round((readSlugs.size / materials.length) * 100) : 0;

  return (
    <div className="space-y-0">
      {/* Dark Editorial Header Band with Reading Progress */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-26 pb-7 sm:pb-9 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-sky-300">
                Tahap 02 · 10 Bacaan Singkat Bergambar · Versi {contentVersion}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Materi: Kenapa Slot Selalu Menggerus Uang
              </h1>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-200 font-mono tabular-nums shrink-0">
              Sudah dibaca: {readSlugs.size} / {materials.length} topik
            </div>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-200"
              style={{ width: `${readPct}%` }}
            />
          </div>
        </div>
      </section>

      <div className="bg-editorial-grid py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
          {/* Mobile & Tablet Compact Topic Picker (so reading article appears immediately above the fold) */}
          <div className="lg:hidden surface-elevated border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <label
              htmlFor="mobile-topic-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Pilih Topik Bacaan ({currentIdx + 1} dari {materials.length}):
            </label>
            <select
              id="mobile-topic-select"
              value={current?.slug ?? ''}
              onChange={(e) => selectTopic(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-2 focus:outline-sky-700"
            >
              {materials.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {readSlugs.has(m.slug) ? '✓ ' : ''}
                  {m.title}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {materials.map((m) => {
                const isActive = current?.slug === m.slug;
                const isRead = readSlugs.has(m.slug);
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => selectTopic(m.slug)}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sky-800 text-white border-sky-800'
                        : isRead
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {m.order}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Desktop Topic Sidebar */}
            <aside
              aria-label="Daftar topik materi"
              className="hidden lg:block lg:col-span-4 surface-elevated border border-slate-200/80 rounded-2xl p-3 space-y-1 sticky top-20"
            >
              {materials.map((m) => {
                const isActive = current?.slug === m.slug;
                const isRead = readSlugs.has(m.slug);
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => selectTopic(m.slug)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-sky-800 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-sky-50/80 hover:text-sky-900 hover:translate-x-0.5'
                    }`}
                  >
                    <span className="truncate">{m.title}</span>
                    {isRead && (
                      <CheckCircle2
                        size={15}
                        className={isActive ? 'text-sky-200 shrink-0' : 'text-emerald-600 shrink-0'}
                        aria-label="Sudah dibaca"
                      />
                    )}
                  </button>
                );
              })}
            </aside>

            {/* Material Content */}
            {current && (
              <article
                ref={articleTopRef}
                className="lg:col-span-8 surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-8 space-y-6"
              >
                <div className="space-y-2 border-b border-slate-200 pb-5">
                  <div className="text-xs font-medium text-slate-500">
                    Bacaan {current.order} dari {materials.length} · Sekitar{' '}
                    {current.readTimeMinutes} menit baca
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {current.title}
                  </h2>
                  <p className="text-sm text-slate-600">{current.subtitle}</p>
                </div>

            <TopicIllustrationCard slug={current.slug} title={current.title} />

            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-sky-900 mb-1">
                Inti Singkatnya:
              </div>
              <p className="text-[15px] sm:text-base text-slate-800 leading-relaxed font-medium">
                <RichSymbolText text={current.summary} />
              </p>
            </div>

            <div className="space-y-6">
              {current.sections.map((sec) => (
                <section key={sec.heading} className="space-y-2.5">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900">
                    <RichSymbolText text={sec.heading} />
                  </h3>
                  <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed">
                    <RichSymbolText text={sec.body} />
                  </p>
                  {sec.formula && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">
                      <span className="text-slate-500 block text-[11px] mb-0.5">
                        Patokan Sederhana:
                      </span>
                      <span className="font-mono leading-relaxed">
                        <RichSymbolText text={sec.formula} />
                      </span>
                    </div>
                  )}
                  {sec.example && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-4 py-3 text-xs sm:text-sm text-amber-950 leading-relaxed">
                      <strong className="font-semibold">Contoh Nyata:</strong>{' '}
                      <RichSymbolText text={sec.example} />
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div className="bg-slate-900 text-slate-50 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-semibold text-amber-300">
                Pesan Penting untuk Diingat
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed">
                <RichSymbolText text={current.keyTakeaway} darkSurface />
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={() => {
                  if (currentIdx > 0) selectTopic(materials[currentIdx - 1].slug);
                }}
                className="group min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer"
              >
                <ArrowLeft
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:-translate-x-0.5"
                />
                <span>Sebelumnya</span>
              </button>

              {currentIdx < materials.length - 1 ? (
                <button
                  type="button"
                  onClick={() => selectTopic(materials[currentIdx + 1].slug)}
                  className="group min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer"
                >
                  <span>Topik Berikutnya</span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('post-test')}
                  className="group min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer"
                >
                  <span>Lanjut ke Tes Akhir</span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </button>
              )}
            </div>
          </article>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
