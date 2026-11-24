import { CONTENT_VERSION } from '../engine/config.ts';
import {
  LEARNING_MATERIALS,
  POST_TEST_QUESTIONS,
  PRE_TEST_QUESTIONS,
  stripQuizAnswers,
  type PublicQuizQuestion,
  type QuizQuestion,
} from '../data/learningContent.ts';
import { AppError } from './localSimulation.ts';

/**
 * Layanan kuis berbasis peramban. Hasil pre/post test disimpan di `localStorage`
 * sehingga bertahan saat refresh, namun tidak lintas perangkat.
 */

export interface QuizSubmissionResult {
  testType: 'pre' | 'post';
  contentVersion: string;
  score: number;
  totalQuestions: number;
  scorePercent: number;
  durationSeconds: number;
  submittedAt: string;
  review: Array<{
    questionKey: string;
    topicSlug: string;
    topicTitle: string;
    selectedOptionKey: string;
    correctOptionKey: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export interface LearningResultsDto {
  contentVersion: string;
  preTest: QuizSubmissionResult | null;
  postTest: QuizSubmissionResult | null;
  scoreDelta: number | null;
  scorePercentDelta: number | null;
  topicMastery: Array<{
    topicSlug: string;
    topicTitle: string;
    preCorrect: boolean | null;
    postCorrect: boolean | null;
    status: 'mastered' | 'improved' | 'needs_review' | 'pending';
  }>;
  recommendedSlugs: string[];
}

const STORAGE_KEY = 'bj_quiz_attempts_v1';

interface StoredAttempts {
  contentVersion: string;
  pre: QuizSubmissionResult | null;
  post: QuizSubmissionResult | null;
}

function safeRead(): StoredAttempts {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { contentVersion: CONTENT_VERSION, pre: null, post: null };
    const parsed = JSON.parse(raw) as StoredAttempts;
    return {
      contentVersion: parsed.contentVersion ?? CONTENT_VERSION,
      pre: parsed.pre ?? null,
      post: parsed.post ?? null,
    };
  } catch {
    return { contentVersion: CONTENT_VERSION, pre: null, post: null };
  }
}

function safeWrite(attempts: StoredAttempts): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Storage penuh/diblokir: abaikan
  }
}

export class LocalQuizService {
  private readonly nowFn: () => Date;

  constructor(nowFn: () => Date = () => new Date()) {
    this.nowFn = nowFn;
  }

  getMaterials() {
    return {
      contentVersion: CONTENT_VERSION,
      materials: LEARNING_MATERIALS,
    };
  }

  getQuizQuestions(testType: 'pre' | 'post'): {
    contentVersion: string;
    testType: 'pre' | 'post';
    alreadySubmitted: boolean;
    attempt: QuizSubmissionResult | null;
    questions: PublicQuizQuestion[];
  } {
    const questions =
      testType === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;
    const existing = this.getAttempt(testType);

    return {
      contentVersion: CONTENT_VERSION,
      testType,
      alreadySubmitted: Boolean(existing),
      attempt: existing,
      questions: stripQuizAnswers(questions),
    };
  }

  submitQuiz(
    testType: 'pre' | 'post',
    payload: {
      answers?: Array<{
        question_key?: string;
        questionKey?: string;
        selected_option_key?: string;
        selectedOptionKey?: string;
      }>;
      duration_seconds?: number;
      durationSeconds?: number;
      started_at?: string;
      startedAt?: string;
    }
  ): QuizSubmissionResult {
    const questions: readonly QuizQuestion[] =
      testType === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;

    if (testType === 'post' && !this.getAttempt('pre')) {
      throw new AppError(
        409,
        'PREREQUISITE_NOT_MET',
        'Silakan selesaikan Pre-test terlebih dahulu sebelum mengirim Post-test.'
      );
    }

    if (this.getAttempt(testType)) {
      throw new AppError(
        409,
        'QUIZ_ALREADY_SUBMITTED',
        `Anda sudah menyelesaikan ${testType === 'pre' ? 'Pre-test' : 'Post-test'} pada sesi ini.`
      );
    }

    const rawAnswers = payload.answers;
    if (!Array.isArray(rawAnswers) || rawAnswers.length !== questions.length) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        `Semua ${questions.length} pertanyaan wajib dijawab sebelum mengirim.`
      );
    }

    const answerMap = new Map<string, string>();
    for (const item of rawAnswers) {
      const qKey = String(item.question_key ?? item.questionKey ?? '').trim();
      const optKey = String(
        item.selected_option_key ?? item.selectedOptionKey ?? ''
      ).trim();
      if (!qKey || !optKey || answerMap.has(qKey)) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'Format jawaban tidak valid atau duplikat.'
        );
      }
      answerMap.set(qKey, optKey);
    }

    const now = this.nowFn();
    const rawDuration = payload.duration_seconds ?? payload.durationSeconds ?? 0;
    const durationSeconds =
      typeof rawDuration === 'number' && Number.isFinite(rawDuration) && rawDuration >= 0
        ? Math.min(86400, Math.round(rawDuration))
        : 0;

    let score = 0;
    const graded: Array<{
      q: QuizQuestion;
      selectedOptionKey: string;
      isCorrect: boolean;
    }> = [];

    for (const q of questions) {
      const selected = answerMap.get(q.questionKey);
      if (!selected || !q.options.some((o) => o.key === selected)) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          `Jawaban untuk pertanyaan ${q.questionKey} belum dipilih atau tidak valid.`
        );
      }
      const isCorrect = selected === q.correctOptionKey;
      if (isCorrect) score++;
      graded.push({ q, selectedOptionKey: selected, isCorrect });
    }

    const totalQuestions = questions.length;
    const scorePercent = Math.round((score / totalQuestions) * 10000) / 100;
    const submittedAt = now.toISOString();

    const result: QuizSubmissionResult = {
      testType,
      contentVersion: CONTENT_VERSION,
      score,
      totalQuestions,
      scorePercent,
      durationSeconds,
      submittedAt,
      review: graded.map((item) => ({
        questionKey: item.q.questionKey,
        topicSlug: item.q.topicSlug,
        topicTitle: item.q.topicTitle,
        selectedOptionKey: item.selectedOptionKey,
        correctOptionKey: item.q.correctOptionKey,
        isCorrect: item.isCorrect,
        explanation: item.q.explanation,
      })),
    };

    const attempts = safeRead();
    attempts.contentVersion = CONTENT_VERSION;
    if (testType === 'pre') attempts.pre = result;
    else attempts.post = result;
    safeWrite(attempts);

    return result;
  }

  getAttempt(testType: 'pre' | 'post'): QuizSubmissionResult | null {
    const attempts = safeRead();
    if (attempts.contentVersion !== CONTENT_VERSION) return null;
    return testType === 'pre' ? attempts.pre : attempts.post;
  }

  getLearningResults(): LearningResultsDto {
    const preTest = this.getAttempt('pre');
    const postTest = this.getAttempt('post');

    const preByTopic = new Map(
      (preTest?.review ?? []).map((r) => [r.topicSlug, r.isCorrect])
    );
    const postByTopic = new Map(
      (postTest?.review ?? []).map((r) => [r.topicSlug, r.isCorrect])
    );

    const topicMastery = PRE_TEST_QUESTIONS.map((q) => {
      const preCorrect = preByTopic.has(q.topicSlug)
        ? preByTopic.get(q.topicSlug)!
        : null;
      const postCorrect = postByTopic.has(q.topicSlug)
        ? postByTopic.get(q.topicSlug)!
        : null;

      let status: 'mastered' | 'improved' | 'needs_review' | 'pending' = 'pending';
      if (postCorrect !== null) {
        if (postCorrect && preCorrect === false) status = 'improved';
        else if (postCorrect) status = 'mastered';
        else status = 'needs_review';
      } else if (preCorrect !== null) {
        status = preCorrect ? 'mastered' : 'needs_review';
      }

      return {
        topicSlug: q.topicSlug,
        topicTitle: q.topicTitle,
        preCorrect,
        postCorrect,
        status,
      };
    });

    const recommendedSlugs = topicMastery
      .filter((t) => t.status === 'needs_review')
      .map((t) => t.topicSlug);

    return {
      contentVersion: CONTENT_VERSION,
      preTest,
      postTest,
      scoreDelta:
        preTest && postTest ? postTest.score - preTest.score : null,
      scorePercentDelta:
        preTest && postTest
          ? Math.round((postTest.scorePercent - preTest.scorePercent) * 100) / 100
          : null,
      topicMastery,
      recommendedSlugs,
    };
  }
}

export const quizService = new LocalQuizService();