import {
  ALLOWED_BETS,
  BET_MIN,
  BUY_SCATTER_COST,
  CONFIG_VERSION,
  CONTENT_VERSION,
  MAX_PAID_SPINS,
  SESSION_DURATION_SECONDS,
  STARTING_BALANCE,
} from '../engine/config.ts';
import {
  GameEngine,
  roundCurrency,
  type ChainResult,
  type ClusterWin,
  type GridMatrix,
  type TumbleStepLog,
} from '../engine/gameEngine.ts';
import type { RngProvider } from '../engine/rng.ts';
import { createDefaultRng } from '../utils/rngBrowser.ts';

/**
 * Layanan simulasi berbasis peramban (tanpa backend/database).
 * State disimpan di `localStorage` dan hanya berlaku di perangkat ini.
 */

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
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
  allowedBets: readonly number[];
  durationSecondsLimit: number;
  remainingSeconds: number;
  startedAt: string;
  endedAt: string | null;
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
  freeSpinChains: Array<{
    chainIndex: number;
    initialGrid: GridMatrix;
    tumbleLog: TumbleStepLog[];
    wins: ClusterWin[];
    tumbleCount: number;
    basePayout: number;
    multiplierSum: number;
    appliedMultiplier: number;
    grossPayout: number;
  }>;
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
  balanceSeries: Array<{ roundNumber: number; balanceAfter: number; netResult: number }>;
}

interface StoredRound {
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
  detail: SpinResponseDto;
}

interface StoredSession {
  id: string;
  status: 'active' | 'completed' | 'expired' | 'exhausted';
  configVersion: string;
  startingBalance: number;
  currentBalance: number;
  totalPaidBet: number;
  totalGrossPayout: number;
  paidSpinsCount: number;
  maxPaidSpins: number;
  scatterTickets: number;
  scatterBuySpent: number;
  startedAt: string;
  endedAt: string | null;
  rounds: StoredRound[];
}

const STORAGE_KEY = 'bj_simulation_state_v1';

interface StorageShape {
  contentVersion: string;
  session: StoredSession | null;
}

function safeRead(): StorageShape {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { contentVersion: CONTENT_VERSION, session: null };
    const parsed = JSON.parse(raw) as StorageShape;
    if (!parsed || typeof parsed !== 'object') {
      return { contentVersion: CONTENT_VERSION, session: null };
    }
    return {
      contentVersion: parsed.contentVersion ?? CONTENT_VERSION,
      session: parsed.session ?? null,
    };
  } catch {
    return { contentVersion: CONTENT_VERSION, session: null };
  }
}

function safeWrite(state: StorageShape): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Kuota penuh / storage diblokir: abaikan agar UI tidak crash
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `bj-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalSimulationService {
  private readonly rng: RngProvider;
  private readonly nowFn: () => Date;

  constructor(rng: RngProvider = createDefaultRng(), nowFn: () => Date = () => new Date()) {
    this.rng = rng;
    this.nowFn = nowFn;
  }

  private readSession(): StoredSession | null {
    return safeRead().session;
  }

  private writeSession(session: StoredSession | null): void {
    const state = safeRead();
    state.session = session;
    state.contentVersion = CONTENT_VERSION;
    safeWrite(state);
  }

  private formatSession(session: StoredSession): SimulationSessionDto {
    const nowMs = this.nowFn().getTime();
    const startedMs = new Date(session.startedAt).getTime();
    const remainingSeconds =
      session.status === 'active'
        ? Math.max(0, SESSION_DURATION_SECONDS - Math.floor((nowMs - startedMs) / 1000))
        : 0;
    const netProfitLoss = roundCurrency(session.totalGrossPayout - session.totalPaidBet);

    return {
      id: session.id,
      status: session.status,
      configVersion: session.configVersion,
      startingBalance: session.startingBalance,
      currentBalance: session.currentBalance,
      totalPaidBet: session.totalPaidBet,
      totalGrossPayout: session.totalGrossPayout,
      netProfitLoss,
      paidSpinsCount: session.paidSpinsCount,
      maxPaidSpins: session.maxPaidSpins,
      scatterTickets: session.scatterTickets,
      buyScatterCost: BUY_SCATTER_COST,
      scatterBuySpent: session.scatterBuySpent,
      betMin: BET_MIN,
      betMax: 100,
      betStep: 10,
      allowedBets: ALLOWED_BETS,
      durationSecondsLimit: SESSION_DURATION_SECONDS,
      remainingSeconds,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  /** Sinkronkan status kedaluwarsa sebelum mengembalikan sesi. */
  private syncAndFormat(session: StoredSession): SimulationSessionDto {
    if (session.status === 'active') {
      const now = this.nowFn();
      const startedMs = new Date(session.startedAt).getTime();
      const elapsed = Math.floor((now.getTime() - startedMs) / 1000);
      if (elapsed >= SESSION_DURATION_SECONDS) {
        session.status = 'expired';
        session.endedAt = now.toISOString();
        this.writeSession(session);
      }
    }
    return this.formatSession(session);
  }

  getLatestSimulationSession(): SimulationSessionDto | null {
    const session = this.readSession();
    if (!session) return null;
    return this.syncAndFormat(session);
  }

  createSimulationSession(): SimulationSessionDto {
    const existing = this.readSession();
    if (existing) {
      const synced = this.syncAndFormat(existing);
      if (synced.status === 'active') {
        throw new AppError(
          409,
          'ACTIVE_SESSION_EXISTS',
          'Masih terdapat sesi simulasi aktif. Akhiri sesi tersebut terlebih dahulu.'
        );
      }
    }

    const now = this.nowFn().toISOString();
    const session: StoredSession = {
      id: makeId(),
      status: 'active',
      configVersion: CONFIG_VERSION,
      startingBalance: STARTING_BALANCE,
      currentBalance: STARTING_BALANCE,
      totalPaidBet: 0,
      totalGrossPayout: 0,
      paidSpinsCount: 0,
      maxPaidSpins: MAX_PAID_SPINS,
      scatterTickets: 0,
      scatterBuySpent: 0,
      startedAt: now,
      endedAt: null,
      rounds: [],
    };
    this.writeSession(session);
    return this.formatSession(session);
  }

  private requireSession(sessionId: string): StoredSession {
    const session = this.readSession();
    if (!session || session.id !== sessionId) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Sesi simulasi tidak ditemukan.');
    }
    return session;
  }

  getSimulationSession(sessionId: string): SimulationSessionDto {
    return this.syncAndFormat(this.requireSession(sessionId));
  }

  endSimulationSession(sessionId: string): SimulationSessionDto {
    const session = this.requireSession(sessionId);
    if (session.status === 'active') {
      const now = this.nowFn().toISOString();
      session.status = 'completed';
      session.endedAt = now;
      this.writeSession(session);
    }
    return this.formatSession(session);
  }

  buyScatter(sessionId: string): SimulationSessionDto {
    const session = this.requireSession(sessionId);
    const now = this.nowFn();
    const startedMs = new Date(session.startedAt).getTime();
    const elapsedSeconds = Math.floor((now.getTime() - startedMs) / 1000);

    if (session.status !== 'active') {
      throw new AppError(
        409,
        'SESSION_NOT_ACTIVE',
        `Sesi simulasi sudah berakhir (${session.status}).`
      );
    }

    if (elapsedSeconds >= SESSION_DURATION_SECONDS) {
      session.status = 'expired';
      session.endedAt = now.toISOString();
      this.writeSession(session);
      throw new AppError(
        409,
        'SESSION_NOT_ACTIVE',
        'Batas durasi 15 menit sesi simulasi telah tercapai.'
      );
    }

    if (session.paidSpinsCount >= session.maxPaidSpins) {
      throw new AppError(
        409,
        'SPIN_LIMIT_REACHED',
        'Batas maksimum 100 paid spins telah tercapai.'
      );
    }

    const balanceBefore = roundCurrency(session.currentBalance);
    if (balanceBefore < BUY_SCATTER_COST + BET_MIN) {
      throw new AppError(
        409,
        'INSUFFICIENT_BALANCE',
        `Minimal sisa koin ${BUY_SCATTER_COST + BET_MIN} untuk membeli 1 Scatter (${BUY_SCATTER_COST}) dan menyisakan minimal ${BET_MIN} koin untuk taruhan Spin.`
      );
    }

    session.currentBalance = roundCurrency(balanceBefore - BUY_SCATTER_COST);
    session.totalPaidBet = roundCurrency(session.totalPaidBet + BUY_SCATTER_COST);
    session.scatterBuySpent = roundCurrency(session.scatterBuySpent + BUY_SCATTER_COST);
    session.scatterTickets += 1;
    this.writeSession(session);
    return this.formatSession(session);
  }

  executeSpin(
    sessionId: string,
    payload: Record<string, unknown>
  ): SpinResponseDto {
    const rawBet = payload.bet_amount ?? payload.betAmount;
    if (
      typeof rawBet !== 'number' ||
      !Number.isInteger(rawBet) ||
      !(ALLOWED_BETS as readonly number[]).includes(rawBet)
    ) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'Taruhan (bet_amount) harus bilangan bulat 10–100 dengan kelipatan 10.'
      );
    }
    const betAmount = rawBet as number;

    const rawDemoScatter =
      payload.demo_scatter_count ?? payload.demoScatterCount ?? null;
    let demoScatterCount: number | null = null;
    if (rawDemoScatter !== null && rawDemoScatter !== undefined) {
      if (
        typeof rawDemoScatter !== 'number' ||
        !Number.isInteger(rawDemoScatter) ||
        rawDemoScatter < 3 ||
        rawDemoScatter > 5
      ) {
        throw new AppError(
          422,
          'VALIDATION_ERROR',
          'Pilihan Mode Edukasi Scatter harus 3, 4, atau 5 Scatter.'
        );
      }
      demoScatterCount = rawDemoScatter;
    }

    const session = this.requireSession(sessionId);
    const now = this.nowFn();
    const startedMs = new Date(session.startedAt).getTime();
    const elapsedSeconds = Math.floor((now.getTime() - startedMs) / 1000);

    if (session.status !== 'active') {
      throw new AppError(
        409,
        'SESSION_NOT_ACTIVE',
        `Sesi simulasi sudah berakhir (${session.status}).`
      );
    }

    if (elapsedSeconds >= SESSION_DURATION_SECONDS) {
      session.status = 'expired';
      session.endedAt = now.toISOString();
      this.writeSession(session);
      throw new AppError(
        409,
        'SESSION_NOT_ACTIVE',
        'Batas durasi 15 menit sesi simulasi telah tercapai.'
      );
    }

    if (session.paidSpinsCount >= session.maxPaidSpins) {
      session.status = 'completed';
      session.endedAt = now.toISOString();
      this.writeSession(session);
      throw new AppError(
        409,
        'SPIN_LIMIT_REACHED',
        'Batas maksimum 100 paid spins telah tercapai.'
      );
    }

    const balanceBefore = roundCurrency(session.currentBalance);
    if (balanceBefore < betAmount) {
      if (balanceBefore < BET_MIN) {
        session.status = 'exhausted';
        session.endedAt = now.toISOString();
        this.writeSession(session);
      }
      throw new AppError(
        409,
        'INSUFFICIENT_BALANCE',
        'Saldo virtual tidak mencukupi untuk taruhan yang dipilih.'
      );
    }

    const scatterTickets = session.scatterTickets;
    let nextScatterTickets = scatterTickets;
    let forcedScatterCount: number | undefined;
    let exactScatterCount = true;

    if (demoScatterCount !== null) {
      forcedScatterCount = demoScatterCount;
      exactScatterCount = true;
    } else if (scatterTickets > 0) {
      nextScatterTickets = scatterTickets - 1;
      forcedScatterCount = 3;
      exactScatterCount = false;
    }

    const engine = new GameEngine(this.rng);
    const roundResult = engine.playPaidRound(betAmount, {
      forcedScatterCount,
      exactScatterCount,
    });

    const balanceAfter = roundCurrency(
      balanceBefore - betAmount + roundResult.grossPayout
    );
    const nextSpinsCount = session.paidSpinsCount + 1;
    const nextTotalPaidBet = roundCurrency(session.totalPaidBet + betAmount);
    const nextTotalGrossPayout = roundCurrency(
      session.totalGrossPayout + roundResult.grossPayout
    );

    let nextStatus: 'active' | 'completed' | 'exhausted' = 'active';
    let endedAt: string | null = null;
    if (nextSpinsCount >= session.maxPaidSpins) {
      nextStatus = 'completed';
      endedAt = now.toISOString();
    } else if (balanceAfter < BET_MIN) {
      nextStatus = 'exhausted';
      endedAt = now.toISOString();
    }

    const remainingSeconds = Math.max(
      0,
      SESSION_DURATION_SECONDS - Math.floor((now.getTime() - startedMs) / 1000)
    );

    const roundId = session.rounds.length + 1;
    const toChainDto = (c: ChainResult) => ({
      chainIndex: c.chainIndex,
      initialGrid: c.initialGrid,
      tumbleLog: c.tumbleLog,
      wins: c.winsSummary,
      tumbleCount: c.tumbleCount,
      basePayout: c.basePayout,
      multiplierSum: c.multiplierSum,
      appliedMultiplier: c.appliedMultiplier,
      grossPayout: c.grossPayout,
    });

    const response: SpinResponseDto = {
      roundId,
      roundNumber: nextSpinsCount,
      betAmount,
      initialGrid: roundResult.paidChain.initialGrid,
      tumbleLog: roundResult.paidChain.tumbleLog,
      wins: roundResult.paidChain.winsSummary,
      tumbleCount: roundResult.paidChain.tumbleCount,
      multiplierSum: roundResult.paidChain.multiplierSum,
      appliedMultiplier: roundResult.paidChain.appliedMultiplier,
      paidChainGrossPayout: roundResult.paidChain.grossPayout,
      initialScatterCount: roundResult.initialScatterCount,
      freeSpinsAwarded: roundResult.freeSpinsAwarded,
      freeSpinsPlayed: roundResult.freeSpinsPlayed,
      freeSpinChains: roundResult.freeSpinChains.map(toChainDto),
      totalBasePayout: roundResult.totalBasePayout,
      tumbleCountTotal: roundResult.tumbleCountTotal,
      grossPayout: roundResult.grossPayout,
      netResult: roundResult.netResult,
      balanceBefore,
      balanceAfter,
      paidSpinsCount: nextSpinsCount,
      maxPaidSpins: session.maxPaidSpins,
      remainingSeconds,
      sessionStatus: nextStatus,
    };

    const createdAt = now.toISOString();
    session.rounds.push({
      roundId,
      roundNumber: nextSpinsCount,
      betAmount,
      balanceBefore,
      balanceAfter,
      totalBasePayout: roundResult.totalBasePayout,
      grossPayout: roundResult.grossPayout,
      netResult: roundResult.netResult,
      initialScatterCount: roundResult.initialScatterCount,
      freeSpinsAwarded: roundResult.freeSpinsAwarded,
      freeSpinsPlayed: roundResult.freeSpinsPlayed,
      tumbleCountTotal: roundResult.tumbleCountTotal,
      createdAt,
      detail: response,
    });

    session.status = nextStatus;
    session.currentBalance = balanceAfter;
    session.totalPaidBet = nextTotalPaidBet;
    session.totalGrossPayout = nextTotalGrossPayout;
    session.paidSpinsCount = nextSpinsCount;
    session.scatterTickets = nextScatterTickets;
    session.endedAt = endedAt;
    this.writeSession(session);

    return response;
  }

  getRounds(
    sessionId: string,
    limit = 50
  ): { total: number; rounds: RoundSummaryDto[] } {
    const session = this.requireSession(sessionId);
    const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
    const sorted = [...session.rounds].sort((a, b) => b.roundNumber - a.roundNumber);

    return {
      total: session.rounds.length,
      rounds: sorted.slice(0, safeLimit).map((r) => ({
        roundId: r.roundId,
        roundNumber: r.roundNumber,
        betAmount: r.betAmount,
        balanceBefore: r.balanceBefore,
        balanceAfter: r.balanceAfter,
        totalBasePayout: r.totalBasePayout,
        grossPayout: r.grossPayout,
        netResult: r.netResult,
        initialScatterCount: r.initialScatterCount,
        freeSpinsAwarded: r.freeSpinsAwarded,
        freeSpinsPlayed: r.freeSpinsPlayed,
        tumbleCountTotal: r.tumbleCountTotal,
        createdAt: r.createdAt,
      })),
    };
  }

  getRoundDetail(sessionId: string, roundId: number): SpinResponseDto {
    const session = this.requireSession(sessionId);
    const round = session.rounds.find((r) => r.roundId === roundId);
    if (!round) {
      throw new AppError(
        404,
        'RESOURCE_NOT_FOUND',
        'Detail putaran simulasi tidak ditemukan.'
      );
    }
    return round.detail;
  }

  getStatistics(sessionId: string): SessionStatisticsDto {
    const session = this.syncAndFormat(this.requireSession(sessionId));
    const rounds = [...this.requireSession(sessionId).rounds].sort(
      (a, b) => a.roundNumber - b.roundNumber
    );

    let totalPaidBet = 0;
    let totalGrossPayout = 0;
    let winningPayoutRounds = 0;
    let netProfitRounds = 0;
    let breakEvenRounds = 0;
    let netLossRounds = 0;
    let totalTumbles = 0;
    let roundsWithTumble = 0;
    let freeSpinTriggerCount = 0;
    let totalFreeSpinsPlayed = 0;

    let bZero = 0;
    let bBelowOne = 0;
    let bOneToTwo = 0;
    let bTwoToFive = 0;
    let bFiveToTen = 0;
    let bTenPlus = 0;

    const balanceSeries: Array<{
      roundNumber: number;
      balanceAfter: number;
      netResult: number;
    }> = [];

    for (const r of rounds) {
      const { betAmount: bet, grossPayout: gross, netResult: net } = r;

      totalPaidBet = roundCurrency(totalPaidBet + bet);
      totalGrossPayout = roundCurrency(totalGrossPayout + gross);

      if (gross > 0) winningPayoutRounds++;
      if (net > 0) netProfitRounds++;
      else if (Math.abs(net) < 1e-9) breakEvenRounds++;
      else netLossRounds++;

      totalTumbles += r.tumbleCountTotal;
      if (r.tumbleCountTotal > 0) roundsWithTumble++;
      if (r.freeSpinsAwarded > 0) freeSpinTriggerCount++;
      totalFreeSpinsPlayed += r.freeSpinsPlayed;

      const ratio = bet > 0 ? gross / bet : 0;
      if (ratio === 0) bZero++;
      else if (ratio < 1) bBelowOne++;
      else if (ratio < 2) bOneToTwo++;
      else if (ratio < 5) bTwoToFive++;
      else if (ratio < 10) bFiveToTen++;
      else bTenPlus++;

      balanceSeries.push({
        roundNumber: r.roundNumber,
        balanceAfter: r.balanceAfter,
        netResult: net,
      });
    }

    const totalPaidBetWithBuys = roundCurrency(totalPaidBet + session.scatterBuySpent);
    const netProfitLoss = roundCurrency(totalGrossPayout - totalPaidBetWithBuys);
    const observedRtpPercent =
      totalPaidBetWithBuys > 0
        ? roundCurrency((totalGrossPayout / totalPaidBetWithBuys) * 100)
        : 0;
    const observedHouseEdgePercent =
      totalPaidBetWithBuys > 0 ? roundCurrency(100 - observedRtpPercent) : 0;

    return {
      session,
      paidSpins: rounds.length,
      totalPaidBet: totalPaidBetWithBuys,
      totalGrossPayout,
      netProfitLoss,
      observedRtpPercent,
      observedHouseEdgePercent,
      winningPayoutRounds,
      netProfitRounds,
      breakEvenRounds,
      netLossRounds,
      totalTumbles,
      roundsWithTumble,
      freeSpinTriggerCount,
      totalFreeSpinsPlayed,
      payoutBuckets: [
        { label: '0', count: bZero },
        { label: '>0 s.d. <1×', count: bBelowOne },
        { label: '1× s.d. <2×', count: bOneToTwo },
        { label: '2× s.d. <5×', count: bTwoToFive },
        { label: '5× s.d. <10×', count: bFiveToTen },
        { label: '≥10×', count: bTenPlus },
      ],
      balanceSeries,
    };
  }
}

export const simulationService = new LocalSimulationService();