import { ALLOWED_BETS } from '../engine/config.ts';

export interface SpinTimingProfile {
  minSpinMs: number;
  initialLandingMs: number;
  colStopIntervalMs: number;
  tumbleLandingMs: number;
  highlightMs: number;
  clearMs: number;
  scatterCelebrationMs: number;
  freeSpinSummaryMs: number;
  autoInterSpinPauseMs: number;
  reelTickMs: number;
}

export const NORMAL_SPIN_TIMING: SpinTimingProfile = {
  minSpinMs: 2250,
  initialLandingMs: 750,
  colStopIntervalMs: 110,
  tumbleLandingMs: 280,
  highlightMs: 380,
  clearMs: 180,
  scatterCelebrationMs: 1900,
  freeSpinSummaryMs: 2200,
  autoInterSpinPauseMs: 220,
  reelTickMs: 70,
};

export const FAST_SPIN_TIMING: SpinTimingProfile = {
  minSpinMs: 380,
  initialLandingMs: 220,
  colStopIntervalMs: 30,
  tumbleLandingMs: 110,
  highlightMs: 160,
  clearMs: 80,
  scatterCelebrationMs: 1400,
  freeSpinSummaryMs: 1800,
  autoInterSpinPauseMs: 90,
  reelTickMs: 42,
};

// Dedicated Free Spin timing: 2.0 to 2.5 seconds per free spin regardless of fast mode
export const FREE_SPIN_TIMING: SpinTimingProfile = {
  minSpinMs: 1450,
  initialLandingMs: 550,
  colStopIntervalMs: 80,
  tumbleLandingMs: 180,
  highlightMs: 320,
  clearMs: 120,
  scatterCelebrationMs: 1900,
  freeSpinSummaryMs: 2200,
  autoInterSpinPauseMs: 160,
  reelTickMs: 58,
};

export function getSpinTimingProfile(
  fastMode: boolean,
  isFreeSpin = false
): SpinTimingProfile {
  if (isFreeSpin) return FREE_SPIN_TIMING;
  return fastMode ? FAST_SPIN_TIMING : NORMAL_SPIN_TIMING;
}

export function estimateSpinDurationMs(
  fastMode: boolean,
  options: { winSteps?: number; tumbleTransitions?: number; isFreeSpin?: boolean } = {}
): number {
  const t = getSpinTimingProfile(fastMode, options.isFreeSpin ?? false);
  const winSteps = options.winSteps ?? 0;
  const tumbleTransitions = options.tumbleTransitions ?? 0;
  return (
    t.minSpinMs +
    t.initialLandingMs +
    winSteps * t.highlightMs +
    tumbleTransitions * (t.clearMs + t.tumbleLandingMs)
  );
}

export function accumulateFreeSpinPayouts(payouts: readonly number[]): {
  payouts: number[];
  total: number;
  winningCount: number;
} {
  const copy = payouts.map((p) => Number(p.toFixed(2)));
  const total = Number(copy.reduce((sum, p) => sum + p, 0).toFixed(2));
  const winningCount = copy.filter((p) => p > 0).length;
  return { payouts: copy, total, winningCount };
}

export function getMaxAffordableBet(balance: number): number {
  for (let i = ALLOWED_BETS.length - 1; i >= 0; i--) {
    if (ALLOWED_BETS[i] <= balance) {
      return ALLOWED_BETS[i];
    }
  }
  return ALLOWED_BETS[0];
}

export function stepAllowedBet(
  currentBet: number,
  direction: -1 | 1,
  balance: number
): number {
  const affordable = ALLOWED_BETS.filter((b) => b <= balance);
  if (affordable.length === 0) return ALLOWED_BETS[0];

  const currentIdx = affordable.indexOf(currentBet as (typeof ALLOWED_BETS)[number]);
  if (currentIdx === -1) {
    return affordable[affordable.length - 1];
  }
  const nextIdx = Math.max(
    0,
    Math.min(affordable.length - 1, currentIdx + direction)
  );
  return affordable[nextIdx];
}
