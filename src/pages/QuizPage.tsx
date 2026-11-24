import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  apiFetch,
  ApiClientError,
  type PageRoute,
  type QuizFetchDto,
  type QuizSubmissionResultDto,
} from '../types/api.ts';
import { MediaFrame } from '../components/MediaFrame.tsx';
import bannerQuizImg from '../assets/images/banner_quiz_assessment_1795526794629.jpg';

interface QuizPageProps {
  testType: 'pre' | 'post';
  ensureAnonymousSession: () => Promise<void>;
  onQuizCompleted: () => Promise<void>;
  onNavigate: (page: PageRoute) => void;
  preTestCompleted: boolean;
}

export function QuizPage({
  testType,
  ensureAnonymousSession,
  onQuizCompleted,
  onNavigate,
  preTestCompleted,
}: QuizPageProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizFetchDto | null>(null);
  const [attemptResult, setAttemptResult] = useState<QuizSubmissionResultDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const endpointBase =
    testType === 'pre' ? '/api/v1/quizzes/pre-test' : '/api/v1/quizzes/post-test';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        await ensureAnonymousSession();
        const data = await apiFetch<QuizFetchDto>(endpointBase);
        if (!cancelled) {
          setQuizData(data);
          setAttemptResult(data.attempt);
          setAnswers({});
          setElapsedSeconds(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat daftar pertanyaan kuis.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [endpointBase, ensureAnonymousSession]);

  useEffect(() => {
    if (loading || attemptResult) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, attemptResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizData) return;

    const unanswered = quizData.questions.filter((q) => !answers[q.questionKey]);
    if (unanswered.length > 0) {
      setError(`Masih ada ${unanswered.length} pertanyaan yang belum dipilih jawabannya.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<QuizSubmissionResultDto>(
        `${endpointBase}/attempts`,
        {
          method: 'POST',
          body: JSON.stringify({
            duration_seconds: elapsedSeconds,
            started_at: startedAt,
            answers: quizData.questions.map((q) => ({
              question_key: q.questionKey,
              selected_option_key: answers[q.questionKey],
            })),
          }),
        }
      );
      setAttemptResult(result);
      await onQuizCompleted();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Gagal mengirim jawaban kuis.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (testType === 'post' && !preTestCompleted && !attemptResult && !loading) {
    return (
      <div className="bg-editorial-grid min-h-screen pt-24 sm:pt-28 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="surface-elevated border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 bg-slate-900">
              <MediaFrame
                src={bannerQuizImg}
                alt="Meja kerja analitik dengan dadu probabilitas dan kartu catatan"
                fallbackTitle="Evaluasi Pemahaman"
                aspectClass="aspect-video md:h-full"
              />
            </div>
            <div className="md:col-span-7 p-6 sm:p-8 space-y-4 flex flex-col justify-center">
              <div className="text-xs font-semibold text-sky-800">
                Langkah 03 · Tes Akhir
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                Isi Tes Awal Terlebih Dahulu
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Supaya nanti terlihat seberapa jauh pemahaman Anda meningkat setelah belajar,
                silakan kerjakan Tes Awal dulu sebelum membuka Tes Akhir.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('pre-test')}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                >
                  Mulai Tes Awal
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('materi')}
                  className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Baca Materi Dulu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        <div className="surface-elevated border border-slate-200 rounded-2xl p-8 text-sm text-slate-600">
          Memuat pertanyaan {testType === 'pre' ? 'Tes Awal' : 'Tes Akhir'}...
        </div>
      </div>
    );
  }

  const totalQ = quizData?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  return (
    <div className="bg-editorial-grid min-h-[calc(100vh-4rem)] pb-12">
      {/* Dark Editorial Assessment Header */}
      <section className="bg-dark-blueprint text-slate-50 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-26 pb-7 sm:pb-9">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2.5">
              <div className="text-xs font-medium text-sky-300">
                {testType === 'pre'
                  ? 'Langkah 01 · Cek Tebakan Awal Sebelum Coba Mesin'
                  : 'Langkah 03 · Cek Pemahaman Setelah Belajar'}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {testType === 'pre' ? 'Tes Awal (8 Soal Singkat)' : 'Tes Akhir (8 Soal Singkat)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {testType === 'pre'
                  ? 'Jawab sesuai perkiraan Anda sekarang. Tidak ada nilai jelek—hasil ini jadi pembanding setelah Anda mencoba mesin simulasi.'
                  : 'Bandingkan pemahaman Anda sekarang setelah mencoba simulasi koin mainan dan melihat hitungan aslinya.'}
              </p>

              {!attemptResult ? (
                <div className="flex flex-wrap items-center gap-5 pt-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-slate-400">Terjawab:</span>
                    <span className="font-mono tabular-nums font-bold text-white">
                      {answeredCount} / {totalQ}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200">
                    <Clock size={14} className="text-sky-300" aria-hidden="true" />
                    <span className="font-mono tabular-nums font-semibold">
                      {formatTimer(elapsedSeconds)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-slate-300">Skor Anda:</span>
                  <span className="font-mono tabular-nums text-2xl font-bold text-amber-300">
                    {attemptResult.score} / {attemptResult.totalQuestions} ({attemptResult.scorePercent}%)
                  </span>
                </div>
              )}
            </div>

            <div className="hidden md:block md:col-span-4">
              <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-xl">
                <MediaFrame
                  src={bannerQuizImg}
                  alt="Meja kerja analitik dengan dadu probabilitas dan buku catatan"
                  fallbackTitle="Evaluasi Pemahaman"
                  aspectClass="aspect-video"
                />
              </div>
            </div>
          </div>

          {!attemptResult && totalQ > 0 && (
            <div className="mt-5 space-y-1.5">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm font-medium"
          >
            {error}
          </div>
        )}

        {attemptResult ? (
          <div className="space-y-6">
            <div className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {testType === 'pre'
                    ? 'Tes Awal Sudah Tersimpan'
                    : 'Tes Akhir Sudah Tersimpan'}
                </h2>
                <p className="text-sm text-slate-600">
                  Waktu mengerjakan:{' '}
                  <span className="font-mono tabular-nums font-semibold">
                    {formatTimer(attemptResult.durationSeconds)}
                  </span>
                  . Baca penjelasan mudah di bawah ini sebelum lanjut.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onNavigate(testType === 'pre' ? 'simulator' : 'hasil')
                }
                className="group min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 hover:-translate-y-0.5 active:translate-y-0 rounded-lg transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>
                  {testType === 'pre'
                    ? 'Lanjut ke Simulasi Slot'
                    : 'Lihat Hasil Belajar'}
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-1"
                />
              </button>
            </div>

            <div className="space-y-4">
              {quizData?.questions.map((q, idx) => {
                const rev = attemptResult.review.find(
                  (r) => r.questionKey === q.questionKey
                );
                return (
                  <div
                    key={q.questionKey}
                    className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-slate-500">
                          Soal {idx + 1} · {q.topicTitle}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 leading-snug">
                          {q.prompt}
                        </h3>
                      </div>
                      {rev?.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
                          <CheckCircle2 size={16} aria-hidden="true" />
                          Benar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 shrink-0">
                          <XCircle size={16} aria-hidden="true" />
                          Salah
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      {q.options.map((opt) => {
                        const isSelected = rev?.selectedOptionKey === opt.key;
                        const isCorrect = rev?.correctOptionKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`px-3.5 py-2.5 rounded-xl border leading-relaxed ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-mono font-bold mr-2">
                              {opt.key.toUpperCase()}.
                            </span>
                            <span>{opt.text}</span>
                            {isCorrect && (
                              <span className="ml-2 text-xs font-semibold text-emerald-700">
                                (Jawaban Benar)
                              </span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="ml-2 text-xs font-semibold text-rose-700">
                                (Pilihan Anda)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {rev && (
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed">
                        <strong className="font-semibold text-slate-900">Penjelasan Mudah:</strong>{' '}
                        {rev.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {quizData?.questions.map((q, idx) => (
              <fieldset
                key={q.questionKey}
                className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3.5"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>
                    Soal {idx + 1} dari {totalQ} · {q.topicTitle}
                  </span>
                  <span className="font-mono text-slate-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <legend className="sr-only">
                  Soal {idx + 1}: {q.topicTitle}
                </legend>
                <p className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug">
                  {q.prompt}
                </p>
                <div className="space-y-2.5 pt-1">
                  {q.options.map((opt) => {
                    const checked = answers[q.questionKey] === opt.key;
                    const inputId = `${q.questionKey}-${opt.key}`;
                    return (
                      <label
                        key={opt.key}
                        htmlFor={inputId}
                        className={`group min-h-[48px] flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                          checked
                            ? 'bg-sky-50/90 border-sky-700 text-slate-950 ring-2 ring-sky-700/15 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-sky-50/55 hover:border-sky-300 hover:-translate-y-0.5 hover:shadow-xs text-slate-700'
                        }`}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={q.questionKey}
                          value={opt.key}
                          checked={checked}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.questionKey]: opt.key,
                            }))
                          }
                          className="mt-1 w-4 h-4 accent-sky-800 shrink-0"
                        />
                        <span className="text-sm leading-relaxed">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-mono font-bold mr-2 transition-colors duration-150 ${
                              checked
                                ? 'bg-sky-800 text-white'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-900'
                            }`}
                          >
                            {opt.key.toUpperCase()}
                          </span>
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <div className="surface-elevated border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-slate-600">
                Jawaban hanya dikirim sekali di sesi ini. Pastikan semua {totalQ} soal sudah dipilih.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] px-6 py-3 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 rounded-lg transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap"
              >
                {submitting
                  ? 'Menyimpan Jawaban...'
                  : `Kirim Jawaban ${testType === 'pre' ? 'Tes Awal' : 'Tes Akhir'}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
