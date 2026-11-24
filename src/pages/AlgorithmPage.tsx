import type { AlgorithmSpecDto, PageRoute } from '../types/api.ts';
import { PayoutDistributionChart } from '../components/charts/StatsCharts.tsx';
import { SYMBOL_META, SymbolGlyph } from '../components/SymbolIcon.tsx';
import { MediaFrame } from '../components/MediaFrame.tsx';
import algoBlueprintImg from '../assets/images/banner_algorithm_blueprint_1795526792541.jpg';

interface AlgorithmPageProps {
  spec: AlgorithmSpecDto | null;
  onNavigate: (page: PageRoute) => void;
}

const ROLE_LABEL: Record<string, string> = {
  regular: 'Gambar Hadiah',
  wild: 'Pengganti (Wild)',
  scatter: 'Bintang Bonus',
  multiplier: 'Bola Pengali',
  neutral: 'Kosong / Zonk',
};

export function AlgorithmPage({ spec, onNavigate }: AlgorithmPageProps) {
  if (!spec) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-slate-600">
        Memuat aturan mesin dan hasil uji coba 100.000 putaran...
      </div>
    );
  }

  const mc = spec.monteCarloReport;
  const lossPer100 = mc ? Math.round(Math.abs(mc.expectedValuePerUnit) * 100) : 25;
  const rtpPer100 = mc ? Math.round(mc.estimatedRtpPercent) : 75;
  let runningCumulative = 0;

  return (
    <div className="space-y-0">
      {/* Dark Blueprint Header Banner */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
              <div className="text-xs font-medium text-sky-300">
                Tahap 02 · Bongkar Rahasia Mesin · Aturan {spec.configVersion}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight [text-wrap:balance]">
                Cara Kerja Mesin di Balik Layar
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Tidak ada rahasia yang ditutup-tutupi: lihat sendiri kenapa gambar kosong paling
                sering muncul, berapa kecil hadiah gambar biasa, dan bukti hasil setelah mesin
                diputar 100.000 kali.
              </p>

              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-semibold text-amber-300">
                  Analogi 100 Kartu di Dalam Topi
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Setiap kotak mengambil 1 kartu acak dari <strong>100 kartu</strong>. Dari 100
                  kartu itu, <strong>42 kartu adalah Daun &amp; Bulan (ZONK / 0 koin)</strong>,
                  sedangkan <strong>Bintang Bonus cuma 2 kartu</strong>!
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('materi')}
                  className="min-h-[44px] inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  Baca 10 Materi Mudah →
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="group rounded-2xl overflow-hidden border border-slate-700/80 hover:border-sky-500/50 bg-slate-900 shadow-2xl h-full min-h-[240px] transition-colors duration-200">
                <MediaFrame
                  src={algoBlueprintImg}
                  alt="Diagram potong mesin pengacak angka (RNG) yang menyortir 100 kartu peluang ke dalam layar 6 kali 5"
                  fallbackTitle="Arsitektur RNG 100 Kartu"
                  fallbackSubtitle="Setiap kotak diundi independen dari 100 kartu peluang pada setiap putaran."
                  aspectClass="aspect-video lg:h-full"
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-editorial-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
          {/* Section 1 & 2: Weights & Paytable */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  1. Jatah Peluang Tiap Gambar (Dari 100 Kartu)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Setiap kali memutar, 30 kotak diisi dari aturan ini. Hampir separuh isi kotak (42%) adalah gambar Zonk.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-left">
                      <th className="py-2.5 pr-3 font-medium">Gambar</th>
                      <th className="py-2.5 px-2 font-medium">Fungsi</th>
                      <th className="py-2.5 px-2 font-medium">Jatah</th>
                      <th className="py-2.5 pl-2 font-medium hidden sm:table-cell">Nomor Kocokan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spec.symbolWeights.map((entry) => {
                      const start = runningCumulative + 1;
                      runningCumulative += entry.weight;
                      const end = runningCumulative;
                      const meta = SYMBOL_META[entry.symbol];
                      const isZonk = entry.role === 'neutral';
                      return (
                        <tr
                          key={entry.symbol}
                          className={`group transition-colors duration-150 ${
                            isZonk
                              ? 'bg-slate-50/90 hover:bg-rose-50/75'
                              : 'hover:bg-sky-50/75'
                          }`}
                        >
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`p-1.5 rounded-lg border shrink-0 transition-transform duration-150 group-hover:scale-110 ${meta.bgClass} ${meta.borderClass}`}
                              >
                                <SymbolGlyph symbol={entry.symbol} size={18} />
                              </span>
                              <span className="font-semibold text-slate-900 transition-colors group-hover:text-sky-900">
                                {entry.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">
                            {ROLE_LABEL[entry.role] ?? entry.role}
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono tabular-nums font-bold w-9 shrink-0 ${
                                  isZonk ? 'text-rose-700' : 'text-slate-900'
                                }`}
                              >
                                {entry.weight}%
                              </span>
                              <div className="hidden sm:block w-16 sm:w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-colors duration-150 ${
                                    isZonk
                                      ? 'bg-rose-500 group-hover:bg-rose-600'
                                      : 'bg-sky-700 group-hover:bg-sky-500'
                                  }`}
                                  style={{ width: `${Math.min(100, entry.weight * 4)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 pl-2 font-mono tabular-nums text-slate-500 hidden sm:table-cell">
                            {start}–{end}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Paytable & Special Rules */}
            <div className="lg:col-span-5 space-y-6">
              <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    2. Daftar Hadiah (Jika Taruhan 100 Koin)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Minimal harus terkumpul <strong>8 gambar sama</strong> di layar. Perhatikan betapa kecilnya hadiah jika kurang dari 12 gambar:
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-left">
                        <th className="py-2 pr-2 font-medium">Gambar</th>
                        <th className="py-2 px-2 font-medium">8–9 buah</th>
                        <th className="py-2 px-2 font-medium">10–11 buah</th>
                        <th className="py-2 pl-2 font-medium">12+ buah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {(['CHERRY', 'BELL', 'GEM', 'CROWN'] as const).map((sym) => {
                        const p = spec.paytable[sym];
                        return (
                          <tr key={sym} className="group transition-colors duration-150 hover:bg-sky-50/75">
                            <td className="py-2.5 pr-2 font-sans font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex transition-transform duration-150 group-hover:scale-110">
                                  <SymbolGlyph symbol={sym} size={16} />
                                </span>
                                <span>{SYMBOL_META[sym].shortLabel}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-slate-700">
                              <div>{p.tier8_9.toFixed(2)}×</div>
                              <div className="text-[10px] font-sans text-rose-700">
                                ({Math.round(p.tier8_9 * 100)} koin)
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-slate-700">
                              <div>{p.tier10_11.toFixed(2)}×</div>
                              <div className="text-[10px] font-sans text-slate-500">
                                ({Math.round(p.tier10_11 * 100)} koin)
                              </div>
                            </td>
                            <td className="py-2.5 pl-2 font-semibold text-slate-900">
                              <div>{p.tier12Plus.toFixed(2)}×</div>
                              <div className="text-[10px] font-sans font-normal text-emerald-700">
                                ({Math.round(p.tier12Plus * 100)} koin)
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-amber-950 bg-amber-50 border border-amber-200 rounded-xl p-3.5 leading-relaxed">
                  <strong>Lihat buktinya:</strong> Taruhan 100 koin lalu dapat 8 Cherry cuma dibayar{' '}
                  <strong>20 koin</strong>! Layar merayakan menang, padahal Anda rugi <strong>80 koin</strong>.
                </p>
              </div>

              <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3 text-xs sm:text-sm text-slate-700">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  3. Aturan Tambahan Mesin
                </h2>
                <ul className="space-y-2.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Wild (Pengganti):</strong> Hanya menolong 1 jenis gambar dengan hadiah paling
                    besar (urutan: <strong>Crown &gt; Gem &gt; Bell &gt; Cherry</strong>).
                  </li>
                  <li>
                    <strong>Gambar Runtuh:</strong> Gambar menang pecah dan diganti gambar baru, dibatasi
                    maksimal <strong>{spec.sessionRules.maxTumbleTransitions} kali runtuh</strong> per putaran.
                  </li>
                  <li>
                    <strong>Bola Pengali:</strong> Angka{' '}
                    {spec.multiplierWeights.map((m) => `${m.value}× (${m.weight}%)`).join(', ')}. Jika
                    muncul dua bola saat menang, nilainya <strong>dijumlahkan</strong> (2× + 3× = 5×,
                    bukan 6×). Kalau tidak ada yang menang, pengali hangus.
                  </li>
                  <li>
                    <strong>Bintang Bonus (Scatter):</strong> 3 bintang = 10 putaran gratis, 4 = 12
                    gratis, 5+ = 15 gratis. Tidak bisa memicu bonus tambahan lagi di dalamnya.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: 100,000 Trials */}
          {mc && (
            <section className="space-y-6 border-t border-slate-200 pt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-sky-800">
                    Hasil Uji Mesin · Aturan {mc.configVersion}
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    Bukti Nyata Setelah Diputar {mc.trials.toLocaleString('id-ID')} Kali
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                  Angka ini hasil murni dari mesin yang sama yang Anda mainkan di simulator, bukan rekayasa.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-5">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Uang Balik (RTP)</div>
                  <div className="font-mono tabular-nums text-2xl font-bold text-sky-800 mt-1">
                    {mc.estimatedRtpPercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Dari 100 koin balik ~{rtpPer100} koin
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 hover:border-rose-300 rounded-xl p-5">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-rose-700">Potongan Bandar</div>
                  <div className="font-mono tabular-nums text-2xl font-bold text-rose-700 mt-1">
                    {mc.estimatedHouseEdgePercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Otomatis terpotong tiap putar
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 hover:border-rose-300 rounded-xl p-5">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-rose-700">Rata-rata Hilang</div>
                  <div className="font-mono tabular-nums text-2xl font-bold text-rose-700 mt-1">
                    −{lossPer100} / 100
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Tiap taruhan 100, hilang ~{lossPer100} koin
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-5">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Peluang Bintang Bonus</div>
                  <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                    {mc.scatterTriggerFrequencyPercent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Kira-kira 1 kali tiap 45 putaran
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <PayoutDistributionChart
                    title="Sebaran Hadiah dari 100.000 Kali Uji Putaran"
                    subtitle="Perbandingan besar hadiah yang keluar terhadap modal taruhan"
                    caption={`Walaupun ${mc.payoutPositiveFrequencyPercent.toFixed(
                      1
                    )}% putaran mengeluarkan hadiah (> 0), sebanyak ${mc.netLossFrequencyPercent.toFixed(
                      1
                    )}% putaran tetap berakhir rugi karena hadiahnya lebih kecil dari taruhan!`}
                    buckets={mc.distribution.map((d) => ({
                      label: d.label,
                      value: d.percent,
                    }))}
                    unitLabel="Persentase (%)"
                  />
                </div>

                <div className="lg:col-span-5 surface-elevated border border-slate-200/80 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Ringkasan Nasib 100 Putaran
                  </h3>
                  <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                    <div className="py-3 px-2 -mx-2 rounded-lg flex justify-between gap-2 transition-colors hover:bg-sky-50/60">
                      <dt className="text-slate-600">Layar Keluar Hadiah (&gt; 0)</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {mc.payoutPositiveFrequencyPercent.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-lg flex justify-between gap-2 transition-colors hover:bg-sky-50/60">
                      <dt className="text-slate-600">Benar-Benar Untung (&gt; Taruhan)</dt>
                      <dd className="font-mono tabular-nums font-semibold text-emerald-700">
                        {mc.netProfitFrequencyPercent.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-lg flex justify-between gap-2 transition-colors hover:bg-sky-50/60">
                      <dt className="text-slate-600">Impas (Hadiah = Taruhan)</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {mc.breakEvenFrequencyPercent.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-lg flex justify-between gap-2 transition-colors hover:bg-sky-50/60">
                      <dt className="text-slate-600">Tetap Rugi (Hadiah &lt; Taruhan)</dt>
                      <dd className="font-mono tabular-nums font-semibold text-rose-700">
                        {mc.netLossFrequencyPercent.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-lg flex justify-between gap-2 transition-colors hover:bg-sky-50/60">
                      <dt className="text-slate-600">Rata-rata Gambar Runtuh</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {mc.meanTumblesPerRound.toFixed(2)}× per putaran
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
