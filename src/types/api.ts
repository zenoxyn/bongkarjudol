import type {
  ClusterWin,
  GridMatrix,
  TumbleStepLog,
} from '../engine/gameEngine.ts';
import type { SlotSymbol, SymbolWeightEntry } from '../engine/config.ts';
import {
  ALLOWED_BETS,
  BET_MAX,
  BET_MIN,
  BET_STEP,
  CONFIG_VERSION,
  CONTENT_VERSION,
  GRID_COLS,
  GRID_ROWS,
  MAX_PAID_SPINS,
  MAX_TUMBLE_TRANSITIONS,
  MULTIPLIER_WEIGHTS,
  PAYTABLE_MULTIPLIERS,
  SESSION_DURATION_SECONDS,
  STARTING_BALANCE,
  SYMBOL_WEIGHTS,
} from '../engine/config.ts';
import monteCarloData from '../data/monteCarloReport.json';
import { simulationService, AppError } from '../services/localSimulation.ts';
import { quizService } from '../services/localQuiz.ts';

export type PageRoute =
  | 'landing'
  | 'pre-test'
  | 'simulator'
  | 'statistik'
  | 'algoritma'
  | 'materi'
  | 'post-test'
  | 'hasil';

export interface SessionStateResponse {
  authenticated: boolean;
  anonymousSessionId: string | null;
  contentVersion?: string;
  expiresAt?: string;
  simulationSession: SimulationSessionDto | null;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
}

export interface SimulationSessionDto {
  id: string;
  status: 'active' | 'completed' | 'expired' | 'exhausted';
  configVersion: string;
  startingBalance: number;
  currentBalance: number;
  totalPaidBet: number;
  totalGrossPayout: number;
  netProfitLoss: number;
  paidSpinsCount: number;
  maxPaidSpins: number;
  scatterTickets: number;
  buyScatterCost: number;
  scatterBuySpent: number;
  betMin: number;
  betMax: number;
  betStep: number;
  allowedBets: number[];
  durationSecondsLimit: number;
  remainingSeconds: number;
  startedAt: string;
  endedAt: string | null;
}

export interface FreeSpinChainDto {
  chainIndex: number;
  initialGrid: GridMatrix;
  tumbleLog: TumbleStepLog[];
  wins: ClusterWin[];
  tumbleCount: number;
  basePayout: number;
  multiplierSum: number;
  appliedMultiplier: number;
  grossPayout: number;
}

export interface SpinResponseDto {
  roundId: number;
  roundNumber: number;
  betAmount: number;
  initialGrid: GridMatrix;
  tumbleLog: TumbleStepLog[];
  wins: ClusterWin[];
  tumbleCount: number;
  multiplierSum: number;
  appliedMultiplier: number;
  paidChainGrossPayout: number;
  initialScatterCount: number;
  freeSpinsAwarded: number;
  freeSpinsPlayed: number;
  freeSpinChains: FreeSpinChainDto[];
  totalBasePayout: number;
  tumbleCountTotal: number;
  grossPayout: number;
  netResult: number;
  balanceBefore: number;
  balanceAfter: number;
  paidSpinsCount: number;
  maxPaidSpins: number;
  remainingSeconds: number;
  sessionStatus: 'active' | 'completed' | 'expired' | 'exhausted';
}

export interface RoundSummaryDto {
  roundId: number;
  roundNumber: number;
  betAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  totalBasePayout: number;
  grossPayout: number;
  netResult: number;
  initialScatterCount: number;
  freeSpinsAwarded: number;
  freeSpinsPlayed: number;
  tumbleCountTotal: number;
  createdAt: string;
}

export interface SessionStatisticsDto {
  session: SimulationSessionDto;
  paidSpins: number;
  totalPaidBet: number;
  totalGrossPayout: number;
  netProfitLoss: number;
  observedRtpPercent: number;
  observedHouseEdgePercent: number;
  winningPayoutRounds: number;
  netProfitRounds: number;
  breakEvenRounds: number;
  netLossRounds: number;
  totalTumbles: number;
  roundsWithTumble: number;
  freeSpinTriggerCount: number;
  totalFreeSpinsPlayed: number;
  payoutBuckets: Array<{ label: string; count: number }>;
  balanceSeries: Array<{
    roundNumber: number;
    balanceAfter: number;
    netResult: number;
  }>;
}

export interface PublicQuizQuestionDto {
  questionKey: string;
  topicSlug: string;
  topicTitle: string;
  prompt: string;
  options: Array<{ key: string; text: string }>;
}

export interface QuizSubmissionResultDto {
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

export interface QuizFetchDto {
  contentVersion: string;
  testType: 'pre' | 'post';
  alreadySubmitted: boolean;
  attempt: QuizSubmissionResultDto | null;
  questions: PublicQuizQuestionDto[];
}

export interface LearningMaterialDto {
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  readTimeMinutes: number;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
    formula?: string;
    example?: string;
  }>;
  keyTakeaway: string;
}

export interface LearningResultsDto {
  contentVersion: string;
  preTest: QuizSubmissionResultDto | null;
  postTest: QuizSubmissionResultDto | null;
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

export interface AlgorithmSpecDto {
  configVersion: string;
  contentVersion: string;
  grid: { cols: number; rows: number };
  sessionRules: {
    startingBalance: number;
    betMin: number;
    betMax: number;
    betStep: number;
    allowedBets: number[];
    maxPaidSpins: number;
    durationSeconds: number;
    maxTumbleTransitions: number;
  };
  symbolWeights: SymbolWeightEntry[];
  multiplierWeights: Array<{ value: 2 | 3 | 5; weight: number }>;
  paytable: Record<
    'CHERRY' | 'BELL' | 'GEM' | 'CROWN',
    { tier8_9: number; tier10_11: number; tier12Plus: number }
  >;
  scatterMapping: Array<{ scatterCount: string; freeSpins: number }>;
  monteCarloReport: {
    configVersion: string;
    seed: number;
    trials: number;
    generatedAt: string;
    totalPaidBet: number;
    totalGrossPayout: number;
    estimatedRtpPercent: number;
    estimatedHouseEdgePercent: number;
    meanPayoutPerUnit: number;
    expectedValuePerUnit: number;
    standardDeviation: number;
    standardError: number;
    confidenceInterval95: {
      lowUnit: number;
      highUnit: number;
      lowRtpPercent: number;
      highRtpPercent: number;
    };
    payoutPositiveFrequencyPercent: number;
    netProfitFrequencyPercent: number;
    breakEvenFrequencyPercent: number;
    netLossFrequencyPercent: number;
    meanTumblesPerRound: number;
    roundWithTumbleFrequencyPercent: number;
    scatterTriggerFrequencyPercent: number;
    meanFreeSpinsPerRound: number;
    distribution: Array<{
      label: string;
      count: number;
      percent: number;
    }>;
  } | null;
}

export type SymbolName = SlotSymbol;

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SESSION_TOKEN_STORAGE_KEY = 'bj_session_token';

export function getClientSessionToken(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setClientSessionToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

/** Bangun spesifikasi algoritma dari konfigurasi engine + laporan Monte Carlo statis. */
function buildAlgorithmSpec(): AlgorithmSpecDto {
  return {
    configVersion: CONFIG_VERSION,
    contentVersion: CONTENT_VERSION,
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
    sessionRules: {
      startingBalance: STARTING_BALANCE,
      betMin: BET_MIN,
      betMax: BET_MAX,
      betStep: BET_STEP,
      allowedBets: [...ALLOWED_BETS],
      maxPaidSpins: MAX_PAID_SPINS,
      durationSeconds: SESSION_DURATION_SECONDS,
      maxTumbleTransitions: MAX_TUMBLE_TRANSITIONS,
    },
    symbolWeights: [...SYMBOL_WEIGHTS],
    multiplierWeights: [...MULTIPLIER_WEIGHTS],
    paytable: PAYTABLE_MULTIPLIERS,
    scatterMapping: [
      { scatterCount: '0–2', freeSpins: 0 },
      { scatterCount: '3', freeSpins: 10 },
      { scatterCount: '4', freeSpins: 12 },
      { scatterCount: '5+', freeSpins: 15 },
    ],
    monteCarloReport: monteCarloData as AlgorithmSpecDto['monteCarloReport'],
  };
}

function emptySessionState(): SessionStateResponse {
  return {
    authenticated: false,
    anonymousSessionId: null,
    simulationSession: null,
    preTestCompleted: false,
    postTestCompleted: false,
  };
}

/**
 * Router "API" lokal. Semua request yang sebelumnya menuju backend Express
 * kini dilayani langsung oleh layanan berbasis browser (`localSimulation`
 * dan `localQuiz`). Signature tetap sama agar halaman tidak perlu berubah.
 */
function localRequest<T>(path: string, options: RequestInit): T {
  const method = (options.method ?? 'GET').toUpperCase();
  const [pathname, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  const body: Record<string, unknown> = (() => {
    if (!options.body || typeof options.body !== 'string') return {};
    try {
      const parsed = JSON.parse(options.body);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  })();

  const throwNotFound = (): never => {
    throw new ApiClientError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan.');
  };

  // GET /api/v1/algorithm/spec
  if (pathname === '/api/v1/algorithm/spec' && method === 'GET') {
    return buildAlgorithmSpec() as T;
  }

  // GET /api/v1/learning/materials
  if (pathname === '/api/v1/learning/materials' && method === 'GET') {
    return quizService.getMaterials() as T;
  }

  // GET /api/v1/learning/results
  if (pathname === '/api/v1/learning/results' && method === 'GET') {
    return quizService.getLearningResults() as T;
  }

  // GET /api/v1/quizzes/pre-test | post-test
  const quizMatch = pathname.match(/^\/api\/v1\/quizzes\/(pre|post)-test$/);
  if (quizMatch && method === 'GET') {
    return quizService.getQuizQuestions(
      quizMatch[1] as 'pre' | 'post'
    ) as T;
  }

  // POST /api/v1/quizzes/pre-test/attempts | post-test/attempts
  const quizAttemptMatch = pathname.match(
    /^\/api\/v1\/quizzes\/(pre|post)-test\/attempts$/
  );
  if (quizAttemptMatch && method === 'POST') {
    return quizService.submitQuiz(
      quizAttemptMatch[1] as 'pre' | 'post',
      body
    ) as T;
  }

  // POST /api/v1/anonymous-sessions — sesi anonim kini tidak butuh server.
  if (pathname === '/api/v1/anonymous-sessions' && method === 'POST') {
    const token = getClientSessionToken() ?? `bj-local-${Date.now()}`;
    setClientSessionToken(token);
    return {
      anonymous_session_id: token,
      content_version: CONTENT_VERSION,
      expires_at: null,
      session_token: token,
    } as T;
  }

  // GET /api/v1/session-state
  if (pathname === '/api/v1/session-state' && method === 'GET') {
    const simSession = simulationService.getLatestSimulationSession();
    return {
      authenticated: Boolean(simSession) || quizService.getAttempt('pre') !== null,
      anonymousSessionId: getClientSessionToken(),
      contentVersion: CONTENT_VERSION,
      simulationSession: simSession,
      preTestCompleted: quizService.getAttempt('pre') !== null,
      postTestCompleted: quizService.getAttempt('post') !== null,
    } as T;
  }

  // POST /api/v1/simulation-sessions
  if (pathname === '/api/v1/simulation-sessions' && method === 'POST') {
    return simulationService.createSimulationSession() as T;
  }

  const sessionMatch = pathname.match(/^\/api\/v1\/simulation-sessions\/([^/]+)$/);
  if (sessionMatch && method === 'GET') {
    return simulationService.getSimulationSession(sessionMatch[1]) as T;
  }

  const spinsMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/spins$/
  );
  if (spinsMatch && method === 'POST') {
    return simulationService.executeSpin(spinsMatch[1], body) as T;
  }

  const buyScatterMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/buy-scatter$/
  );
  if (buyScatterMatch && method === 'POST') {
    return simulationService.buyScatter(buyScatterMatch[1]) as T;
  }

  const roundsMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/rounds$/
  );
  if (roundsMatch && method === 'GET') {
    const limit = Number(query.get('limit') ?? 50);
    return simulationService.getRounds(
      roundsMatch[1],
      Number.isFinite(limit) ? limit : 50
    ) as T;
  }

  const roundDetailMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/rounds\/(\d+)$/
  );
  if (roundDetailMatch && method === 'GET') {
    const roundId = Number(roundDetailMatch[2]);
    return simulationService.getRoundDetail(roundDetailMatch[1], roundId) as T;
  }

  const statsMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/statistics$/
  );
  if (statsMatch && method === 'GET') {
    return simulationService.getStatistics(statsMatch[1]) as T;
  }

  const endMatch = pathname.match(
    /^\/api\/v1\/simulation-sessions\/([^/]+)\/end$/
  );
  if (endMatch && method === 'POST') {
    return simulationService.endSimulationSession(endMatch[1]) as T;
  }

  return throwNotFound();
}

/**
 * Pemanggil data seragam untuk seluruh halaman. Sekarang dijalankan sepenuhnya
 * di browser (tanpa network). Tetap async agar signature pemanggil tidak berubah.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    return localRequest<T>(path, options);
  } catch (err) {
    if (err instanceof AppError) {
      throw new ApiClientError(err.status, err.code, err.message);
    }
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError(
      500,
      'INTERNAL_ERROR',
      'Terjadi kesalahan saat memproses permintaan.'
    );
  }
}

/** State sesi awal untuk fallback di UI. */
export const EMPTY_SESSION_STATE = emptySessionState;

export function formatCredit(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
