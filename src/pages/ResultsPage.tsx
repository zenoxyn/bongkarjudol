import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, MinusCircle, TrendingUp } from 'lucide-react';
import {
  apiFetch,
  type LearningResultsDto,
  type PageRoute,
} from '../types/api.ts';

interface ResultsPageProps {
  ensureAnonymousSession: () => Promise<void>;
  onNavigate: (page: PageRoute, materialSlug?: string) => void;
}

export function ResultsPage({
  ensureAnonymousSession,
  onNavigate,
}: ResultsPageProps) {
  const [results, setResults] = useState<LearningResultsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await ensureAnonymousSession();
        const data = await apiFetch<LearningResultsDto>('/api/v1/learning/results');
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [ensureAnonymousSession]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-sm text-slate-600">
        Memuat ringkasan hasil belajar Anda...
      </div>
    );
  }

  const pre = results?.preTest;
  const post = results?.postTest;

  return (
    <div className="space-y-0">
      {/* Dark Scoreboard Header */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-26 pb-8 sm:pb-10 space-y-6">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-sky-300">
              Langkah 03 · Hasil Belajar · Versi {results?.contentVersion}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Perbandingan Skor Tes Awal vs Tes Akhir
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="interactive-card-dark bg-slate-900/90 border border-slate-700/80 rounded-xl p-5">
              <div className="text-xs text-slate-400">Skor Tes Awal</div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-white mt-1.5">
                {pre ? `${pre.score} / ${pre.totalQuestions} (${pre.scorePercent}%)` : '—'}
              </div>
              {pre && (
                <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  Selesai dalam {pre.durationSeconds} detik
                </div>
              )}
            </div>

            <div className="interactive-card-dark bg-slate-900/90 border border-slate-700/80 rounded-xl p-5">
              <div className="text-xs text-slate-400">Skor Tes Akhir</div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-sky-300 mt-1.5">
                {post ? `${post.score} / ${post.totalQuestions} (${post.scorePercent}%)` : '—'}
              </div>
              {post && (
                <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  Selesai dalam {post.durationSeconds} detik
                </div>
              )}
            </div>

            <div className="interactive-card-dark bg-slate-900/90 border border-slate-700/80 rounded-xl p-5">
              <div className="text-xs text-slate-400">Perubahan Skor</div>
              <div
                className={`font-mono tabular-nums text-xl sm:text-2xl font-bold mt-1.5 ${
                  (results?.scoreDelta ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results?.scoreDelta !== null && results?.scoreDelta !== undefined
                  ? `${results.scoreDelta >= 0 ? '+' : ''}${results.scoreDelta} soal (${
                      (results.scorePercentDelta ?? 0) >= 0 ? '+' : ''
                    }${results.scorePercentDelta}%)`
                  : '—'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Sebelum vs sesudah belajar
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-editorial-grid py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
          {/* Missing Pre/Post notice */}
          {(!pre || !post) && (
            <div className="surface-elevated border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Tes Belum Selesai Semua
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {!pre
                  ? 'Anda belum mengisi Tes Awal. Kerjakan lebih dulu untuk melihat skor awal Anda.'
                  : 'Anda sudah mengisi Tes Awal. Sekarang kerjakan Tes Akhir untuk melihat peningkatan pemahaman Anda.'}
              </p>
              <div className="flex flex-wrap gap-3">
                {!pre ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('pre-test')}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                  >
                    Isi Tes Awal
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('post-test')}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                  >
                    Isi Tes Akhir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('materi')}
                  className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Baca Materi Belajar
                </button>
              </div>
            </div>
          )}

          {/* Topic-by-topic Mastery Matrix */}
          {results && (
            <section className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Pemahaman per Topik Pembahasan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Topik bertanda Perlu Dibaca Ulang sebaiknya dibuka lagi di menu Materi.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {results.topicMastery.map((item) => (
                  <div
                    key={item.topicSlug}
                    className="py-3.5 px-3 -mx-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-150 hover:bg-sky-50/65"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.topicTitle}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tes Awal:{' '}
                        {item.preCorrect === null
                          ? 'Belum'
                          : item.preCorrect
                          ? 'Benar'
                          : 'Salah'}{' '}
                        · Tes Akhir:{' '}
                        {item.postCorrect === null
                          ? 'Belum'
                          : item.postCorrect
                          ? 'Benar'
                          : 'Salah'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                      {item.status === 'improved' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <TrendingUp size={15} aria-hidden="true" />
                          Meningkat
                        </span>
                      )}
                      {item.status === 'mastered' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                          <CheckCircle2 size={15} aria-hidden="true" />
                          Sudah Paham
                        </span>
                      )}
                      {item.status === 'needs_review' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <MinusCircle size={15} aria-hidden="true" />
                          Perlu Dibaca Ulang
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="text-xs text-slate-500">Menunggu</span>
                      )}

                      <button
                        type="button"
                        onClick={() => onNavigate('materi', item.topicSlug)}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-900 border border-transparent hover:border-sky-200 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen size={13} aria-hidden="true" />
                        <span>Buka Materi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong className="text-slate-900">Catatan:</strong> Perbandingan skor ini membantu Anda melihat bagian mana dari cara
            kerja slot yang sudah dipahami dan mana yang perlu diwaspadai di kehidupan nyata.
          </div>
        </div>
      </div>
    </div>
  );
}
