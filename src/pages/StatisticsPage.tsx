import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, X } from 'lucide-react';
import {
  apiFetch,
  formatCredit,
  type AlgorithmSpecDto,
  type PageRoute,
  type RoundSummaryDto,
  type SessionStatisticsDto,
  type SimulationSessionDto,
  type SpinResponseDto,
} from '../types/api.ts';
import {
  BalanceTrajectoryChart,
  FeatureFrequencyChart,
  PayoutDistributionChart,
  RtpComparisonChart,
} from '../components/charts/StatsCharts.tsx';
import { SYMBOL_META, SymbolGlyph } from '../components/SymbolIcon.tsx';
import { MediaFrame } from '../components/MediaFrame.tsx';
import heroLabImg from '../assets/images/hero_probability_lab_1795526790875.jpg';

interface StatisticsPageProps {
  session: SimulationSessionDto | null;
  algoSpec: AlgorithmSpecDto | null;
  onNavigate: (page: PageRoute) => void;
}

export function StatisticsPage({
  session,
  algoSpec,
  onNavigate,
}: StatisticsPageProps) {
  const [stats, setStats] = useState<SessionStatisticsDto | null>(null);
  const [rounds, setRounds] = useState<RoundSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<SpinResponseDto | null>(null);

  useEffect(() => {
    if (!session) {
      setStats(null);
      setRounds([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiFetch<SessionStatisticsDto>(
        `/api/v1/simulation-sessions/${session.id}/statistics`
      ),
      apiFetch<{ total: number; rounds: RoundSummaryDto[] }>(
        `/api/v1/simulation-sessions/${session.id}/rounds?limit=50`
      ),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        setStats(s);
        setRounds(r.rounds);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.id, session?.paidSpinsCount]);

  const openRoundTrace = async (roundId: number) => {
    if (!session) return;
    const detail = await apiFetch<SpinResponseDto>(
      `/api/v1/simulation-sessions/${session.id}/rounds/${roundId}`
    );
    setSelectedTrace(detail);
  };

  const mcRtp = algoSpec?.monteCarloReport?.estimatedRtpPercent ?? 75.21;

  if (!session) {
    return (
      <div className="bg-editorial-grid min-h-screen pt-24 sm:pt-28 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="surface-elevated border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 bg-slate-900">
              <MediaFrame
                src={heroLabImg}
                alt="Mesin transparansi probabilitas slot"
                fallbackTitle="Catatan Simulasi Slot"
                aspectClass="aspect-video md:h-full"
              />
            </div>
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-4">
              <div className="text-xs font-semibold text-sky-800">
                Tahap 02 · Catatan Bermain Anda
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Belum Ada Catatan Bermain
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Silakan coba dulu simulasi slotnya supaya 4 grafik analisis (naik-turun koin,
                sebaran hadiah, frekuensi menang palsu, dan uang balik RTP) serta riwayat tiap
                putaran langsung muncul di sini.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                >
                  Buka Simulasi Slot
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('algoritma')}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Lihat Uji 100.000 Putaran
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-slate-600">
        Menghitung catatan &amp; grafik sesi Anda...
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Dark Header Band */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-26 pb-7 sm:pb-9 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-sky-300">
              Tahap 02 · Catatan Bermain Anda ({session.configVersion})
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              Catatan &amp; Grafik Hasil Simulasi
            </h1>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('algoritma')}
              className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-medium text-slate-100 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:border-sky-400/50 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              Cara Kerja Mesin
            </button>
            <button
              type="button"
              onClick={() => onNavigate('materi')}
              className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              Baca Materi Belajar →
            </button>
          </div>
        </div>
      </section>

      <div className="bg-editorial-grid py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {stats && (
            <>
              {/* Plain-Language Summary Verdict */}
              {stats.paidSpins > 0 && (
                <section
                  aria-label="Kesimpulan sederhana sesi Anda"
                  className={`rounded-2xl border p-5 sm:p-6 space-y-2 ${
                    stats.netProfitLoss >= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-display text-sm sm:text-base font-bold">
                    {stats.netProfitLoss >= 0 ? (
                      <CheckCircle2 size={18} className="text-emerald-700 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={18} className="text-rose-700 shrink-0" aria-hidden="true" />
                    )}
                    <h2>
                      Ringkasan Nasib Koin Anda ({stats.netProfitLoss >= 0 ? 'Sementara Untung' : 'Tergerus Sistem'})
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    Dari modal awal <strong>{formatCredit(stats.session.startingBalance)} koin</strong>,
                    Anda sudah memutar total taruhan{' '}
                    <strong>{formatCredit(stats.totalPaidBet)} koin</strong> selama{' '}
                    <strong>{stats.paidSpins} putaran</strong>. Hadiah yang masuk{' '}
                    {stats.netProfitLoss < 0 ? 'cuma ' : ''}
                    <strong>{formatCredit(stats.totalGrossPayout)} koin</strong>, jadi hasil bersihnya{' '}
                    <strong>
                      {stats.netProfitLoss >= 0 ? 'untung +' : 'rugi '}
                      {formatCredit(stats.netProfitLoss)} koin
                    </strong>
                    . Dari {stats.winningPayoutRounds} kali layar keluar hadiah, hanya{' '}
                    <strong>{stats.netProfitRounds} kali</strong> yang hadiahnya benar-benar lebih
                    besar dari taruhan!
                  </p>
                </section>
              )}

              {/* Summary KPIs */}
              <section
                aria-label="Ringkasan statistik sesi"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
              >
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Putaran Dipakai</div>
                  <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {stats.paidSpins}
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Total Uang Diputar</div>
                  <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {formatCredit(stats.totalPaidBet)}
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Total Hadiah Masuk</div>
                  <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {formatCredit(stats.totalGrossPayout)}
                  </div>
                </div>
                <div
                  className={`surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4 ${
                    stats.netProfitLoss < 0 ? 'hover:border-rose-300' : ''
                  }`}
                >
                  <div className="text-xs text-slate-500">Untung / Rugi Bersih</div>
                  <div
                    className={`font-mono tabular-nums text-lg sm:text-xl font-bold mt-1 ${
                      stats.netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {stats.netProfitLoss >= 0 ? '+' : ''}
                    {formatCredit(stats.netProfitLoss)}
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Sisa Koin Mainan</div>
                  <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {formatCredit(stats.session.currentBalance)}
                  </div>
                </div>
                <div className="surface-elevated interactive-card group border border-slate-200/80 rounded-xl p-4">
                  <div className="text-xs text-slate-500 transition-colors group-hover:text-sky-800">Uang Balik (RTP)</div>
                  <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-sky-800 mt-1">
                    {stats.observedRtpPercent.toFixed(1)}%
                  </div>
                </div>
              </section>

              {stats.paidSpins === 0 ? (
                <div className="surface-elevated border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
                  <p className="text-sm text-slate-600">
                    Modal awal 1.000 koin sudah siap, tapi Anda belum menekan tombol Putar sama sekali.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('simulator')}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                  >
                    Mulai Putaran Pertama
                  </button>
                </div>
              ) : (
                <>
                  {/* 4 Chart.js Visualizations */}
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    <BalanceTrajectoryChart
                      title="Grafik Naik-Turunnya Koin Anda"
                      subtitle="Membandingkan sisa koin tiap putaran dengan modal awal 1.000"
                      caption={`Dari modal awal ${formatCredit(
                        stats.session.startingBalance
                      )}, setelah ${stats.paidSpins} kali putar koin Anda sekarang ${formatCredit(
                        stats.session.currentBalance
                      )}.`}
                      startingBalance={stats.session.startingBalance}
                      series={stats.balanceSeries}
                    />

                    <PayoutDistributionChart
                      title="Sebaran Besar Hadiah yang Keluar"
                      subtitle="Berapa kali hadiah keluar dibanding besarnya taruhan"
                      caption={`Sebanyak ${stats.winningPayoutRounds} putaran memang memberi hadiah (> 0), tapi hanya ${stats.netProfitRounds} putaran yang hadiahnya benar-benar lebih besar dari taruhan Anda.`}
                      buckets={stats.payoutBuckets.map((b) => ({
                        label: b.label,
                        value: b.count,
                      }))}
                    />

                    <FeatureFrequencyChart
                      title="Seberapa Sering Dapat Hadiah, Untung, Runtuh & Bonus"
                      subtitle="Persentase kejadian selama Anda bermain di sesi ini"
                      caption={`Gambar runtuh terjadi ${stats.totalTumbles} kali. Bonus Putaran Gratis muncul ${stats.freeSpinTriggerCount} kali (total ${stats.totalFreeSpinsPlayed} putaran gratis).`}
                      paidSpins={stats.paidSpins}
                      winningPayoutRounds={stats.winningPayoutRounds}
                      netProfitRounds={stats.netProfitRounds}
                      roundsWithTumble={stats.roundsWithTumble}
                      freeSpinTriggerCount={stats.freeSpinTriggerCount}
                    />

                    <RtpComparisonChart
                      title="Uang Balik Sesi Anda vs Rata-Rata 100.000 Putaran"
                      subtitle="Ingat: hasil bermain sebentar bisa jauh berbeda dari hasil jangka panjang"
                      caption={`Hasil Anda (${stats.observedRtpPercent.toFixed(
                        1
                      )}%) baru dari ${
                        stats.paidSpins
                      } putaran. Angka uji 100.000 putaran (${mcRtp.toFixed(
                        1
                      )}%) adalah rata-rata mesin yang selalu di bawah 100%.`}
                      observedRtp={stats.observedRtpPercent}
                      monteCarloRtp={mcRtp}
                    />
                  </section>

                  {/* Full Round History (Mobile Cards + Desktop Table) */}
                  <section className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900">
                        Catatan Lengkap Tiap Putaran
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Tekan Lihat Grid untuk melihat ulang susunan gambar yang keluar di putaran itu.
                      </p>
                    </div>

                    {/* Mobile Card List (< md) */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {rounds.map((r) => (
                        <div
                          key={r.roundId}
                          className="py-3 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 transition-colors hover:bg-sky-50/75"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                              <span className="font-mono font-bold text-slate-900">
                                Putaran #{r.roundNumber}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600">
                                Taruhan <strong className="font-mono">{formatCredit(r.betAmount)}</strong>
                              </span>
                              {r.freeSpinsPlayed > 0 && (
                                <>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-sky-800 font-medium">
                                    {r.freeSpinsPlayed} Gratis
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-mono tabular-nums">
                              <span className="text-slate-600">
                                Hadiah: <strong className="text-slate-900">{formatCredit(r.grossPayout)}</strong>
                              </span>
                              <span
                                className={`font-semibold ${
                                  r.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                Bersih: {r.netResult >= 0 ? '+' : ''}
                                {formatCredit(r.netResult)}
                              </span>
                              <span className="text-slate-500">
                                Sisa: {formatCredit(r.balanceAfter)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openRoundTrace(r.roundId)}
                            className="group min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer shrink-0"
                          >
                            <Eye
                              size={14}
                              aria-hidden="true"
                              className="transition-transform duration-150 group-hover:scale-110"
                            />
                            <span>Grid</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop & Tablet Table (md+) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 text-left">
                            <th className="py-2 pr-3 font-medium">Putaran</th>
                            <th className="py-2 px-3 font-medium">Taruhan</th>
                            <th className="py-2 px-3 font-medium">Runtuh</th>
                            <th className="py-2 px-3 font-medium">Bonus Gratis</th>
                            <th className="py-2 px-3 font-medium">Hadiah</th>
                            <th className="py-2 px-3 font-medium">Untung/Rugi</th>
                            <th className="py-2 px-3 font-medium">Sisa Koin</th>
                            <th className="py-2 pl-3 font-medium text-right">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                          {rounds.map((r) => (
                            <tr key={r.roundId} className="transition-colors hover:bg-sky-50/75">
                              <td className="py-2.5 pr-3 text-slate-600">
                                #{r.roundNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800">
                                {formatCredit(r.betAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {r.tumbleCountTotal}×
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {r.freeSpinsPlayed > 0
                                  ? `${r.freeSpinsPlayed} Gratis`
                                  : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-900 font-medium">
                                {formatCredit(r.grossPayout)}
                              </td>
                              <td
                                className={`py-2.5 px-3 font-semibold ${
                                  r.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {r.netResult >= 0 ? '+' : ''}
                                {formatCredit(r.netResult)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-900">
                                {formatCredit(r.balanceAfter)}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-sans">
                                <button
                                  type="button"
                                  onClick={() => openRoundTrace(r.roundId)}
                                  className="group inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100/80 hover:-translate-y-0.5 rounded-md transition-all duration-150 cursor-pointer"
                                >
                                  <Eye
                                    size={13}
                                    aria-hidden="true"
                                    className="transition-transform duration-150 group-hover:scale-110"
                                  />
                                  <span>Lihat Grid</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {/* Round Trace Reconstruction Modal */}
          {selectedTrace && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Detail putaran ${selectedTrace.roundNumber}`}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            >
              <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      Isi Layar Putaran #{selectedTrace.roundNumber}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      Taruhan {formatCredit(selectedTrace.betAmount)} · Hadiah{' '}
                      {formatCredit(selectedTrace.grossPayout)} · Bersih{' '}
                      {selectedTrace.netResult >= 0 ? '+' : ''}
                      {formatCredit(selectedTrace.netResult)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTrace(null)}
                    aria-label="Tutup detail putaran"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Gambar di Layar Awal (6 kolom × 5 baris)
                  </div>
                  <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                    {selectedTrace.initialGrid.map((row, r) =>
                      row.map((cell, c) => {
                        const meta = SYMBOL_META[cell.symbol];
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`p-1 sm:p-1.5 rounded-md border flex flex-col items-center justify-center min-w-0 ${meta.bgClass} ${meta.borderClass}`}
                          >
                            <SymbolGlyph
                              symbol={cell.symbol}
                              multiplierValue={cell.multiplierValue}
                              size={16}
                            />
                            <span className="text-[8px] sm:text-[10px] font-medium mt-0.5 text-slate-700 truncate max-w-full">
                              {cell.symbol === 'MULTIPLIER'
                                ? `${cell.multiplierValue ?? 2}×`
                                : meta.shortLabel}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Ringkasan Kejadian di Putaran Ini
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm space-y-1.5">
                    <div>
                      Berapa Kali Gambar Runtuh:{' '}
                      <strong className="font-mono">{selectedTrace.tumbleCount}×</strong>
                    </div>
                    <div>
                      Bola Pengali yang Terkumpul:{' '}
                      <strong className="font-mono">
                        {selectedTrace.multiplierSum > 0
                          ? `${selectedTrace.multiplierSum}×`
                          : 'Tidak ada (1×)'}
                      </strong>
                    </div>
                    <div>
                      Putaran Gratis Didapat:{' '}
                      <strong className="font-mono">
                        {selectedTrace.freeSpinsAwarded} kali
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
