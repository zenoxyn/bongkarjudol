import {
  GRID_COLS,
  GRID_ROWS,
  MAX_TUMBLE_TRANSITIONS,
  MULTIPLIER_WEIGHTS,
  REGULAR_SYMBOLS_PRIORITY,
  SYMBOL_WEIGHTS,
  getPaytableMultiplier,
  mapScatterToFreeSpins,
  type RegularSymbol,
  type SlotSymbol,
} from './config.ts';
import type { RngProvider } from './rng.ts';

export interface GridCell {
  symbol: SlotSymbol;
  multiplierValue?: 2 | 3 | 5;
}

export type GridMatrix = GridCell[][]; // [row][col], 5 rows x 6 cols

export interface ClusterWin {
  symbol: RegularSymbol;
  naturalCount: number;
  wildsAssigned: number;
  effectiveCount: number;
  basePayout: number;
}

export interface GridCoordinate {
  row: number;
  col: number;
}

export interface TumbleStepLog {
  evaluationIndex: number; // 0..5
  grid: GridMatrix;
  wins: ClusterWin[];
  basePayout: number;
  multipliersCollected: Array<2 | 3 | 5>;
  removedPositions: GridCoordinate[];
}

export interface ChainResult {
  chainType: 'paid' | 'free';
  chainIndex: number; // 0 for paid, 1..n for free spins
  initialGrid: GridMatrix;
  tumbleLog: TumbleStepLog[];
  winsSummary: ClusterWin[];
  tumbleCount: number;
  basePayout: number;
  multiplierSum: number;
  appliedMultiplier: number;
  grossPayout: number;
  scatterCountInitial: number | null;
}

export interface PaidRoundResult {
  betAmount: number;
  paidChain: ChainResult;
  freeSpinChains: ChainResult[];
  initialScatterCount: number;
  freeSpinsAwarded: number;
  freeSpinsPlayed: number;
  totalBasePayout: number;
  tumbleCountTotal: number;
  grossPayout: number;
  netResult: number;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function cloneGrid(grid: GridMatrix): GridMatrix {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export function mapRollToSymbol(roll: number): SlotSymbol {
  let cumulative = 0;
  for (const entry of SYMBOL_WEIGHTS) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.symbol;
    }
  }
  return SYMBOL_WEIGHTS[SYMBOL_WEIGHTS.length - 1].symbol;
}

export function mapRollToMultiplierValue(roll: number): 2 | 3 | 5 {
  let cumulative = 0;
  for (const entry of MULTIPLIER_WEIGHTS) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.value;
    }
  }
  return 5;
}

export function sampleCell(rng: RngProvider): GridCell {
  const symbolRoll = rng.nextInt(1, 100);
  const symbol = mapRollToSymbol(symbolRoll);
  if (symbol === 'MULTIPLIER') {
    const multRoll = rng.nextInt(1, 100);
    return {
      symbol,
      multiplierValue: mapRollToMultiplierValue(multRoll),
    };
  }
  return { symbol };
}

export function sampleNonScatterCell(rng: RngProvider): GridCell {
  for (let i = 0; i < 25; i++) {
    const cell = sampleCell(rng);
    if (cell.symbol !== 'SCATTER') return cell;
  }
  return { symbol: 'LEAF' };
}

export function generateGrid(rng: RngProvider): GridMatrix {
  const grid: GridMatrix = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push(sampleCell(rng));
    }
    grid.push(row);
  }
  return grid;
}

export function generateGridWithScatterCount(
  rng: RngProvider,
  targetScatterCount: number,
  exact = true
): GridMatrix {
  const clampedTarget = Math.max(0, Math.min(GRID_ROWS * GRID_COLS, Math.trunc(targetScatterCount)));
  const grid = generateGrid(rng);
  const scatterPositions: GridCoordinate[] = [];
  const nonScatterPositions: GridCoordinate[] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c].symbol === 'SCATTER') {
        scatterPositions.push({ row: r, col: c });
      } else {
        nonScatterPositions.push({ row: r, col: c });
      }
    }
  }

  const shuffle = <T,>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [items[i], items[j]] = [items[j], items[i]];
    }
  };

  if (scatterPositions.length < clampedTarget) {
    shuffle(nonScatterPositions);
    const needed = clampedTarget - scatterPositions.length;
    for (let i = 0; i < needed && i < nonScatterPositions.length; i++) {
      const pos = nonScatterPositions[i];
      grid[pos.row][pos.col] = { symbol: 'SCATTER' };
    }
  } else if (exact && scatterPositions.length > clampedTarget) {
    shuffle(scatterPositions);
    const excess = scatterPositions.length - clampedTarget;
    for (let i = 0; i < excess; i++) {
      const pos = scatterPositions[i];
      grid[pos.row][pos.col] = sampleNonScatterCell(rng);
    }
  }

  return grid;
}

export function countSymbolInGrid(grid: GridMatrix, target: SlotSymbol): number {
  let count = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c].symbol === target) {
        count++;
      }
    }
  }
  return count;
}

export interface WildAllocationResult {
  wins: ClusterWin[];
  totalBasePayout: number;
  totalWildsUsed: number;
  allocationBySymbol: Record<RegularSymbol, number>;
}

/**
 * Mencari alokasi Wild global paling optimal di antara 4 simbol reguler.
 * Kriteria tie-break sesuai SDD 5.4:
 * 1. Total base payout terbesar.
 * 2. Jumlah Wild terpakai paling sedikit.
 * 3. Prioritas simbol: CROWN > GEM > BELL > CHERRY.
 */
export function evaluateClustersWithWilds(
  grid: GridMatrix,
  betAmount: number
): WildAllocationResult {
  const counts: Record<RegularSymbol, number> = {
    CROWN: 0,
    GEM: 0,
    BELL: 0,
    CHERRY: 0,
  };
  let wildCount = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const sym = grid[r][c].symbol;
      if (sym === 'WILD') {
        wildCount++;
      } else if (
        sym === 'CROWN' ||
        sym === 'GEM' ||
        sym === 'BELL' ||
        sym === 'CHERRY'
      ) {
        counts[sym]++;
      }
    }
  }

  // Kandidat alokasi wild yang masuk akal untuk tiap simbol:
  // 0, atau jumlah minimum wild untuk menembus ambang batas tier 8, 10, 12.
  const candidatesPerSymbol: Record<RegularSymbol, number[]> = {
    CROWN: [0],
    GEM: [0],
    BELL: [0],
    CHERRY: [0],
  };

  for (const sym of REGULAR_SYMBOLS_PRIORITY) {
    const c = counts[sym];
    const thresholds = [8, 10, 12];
    const seen = new Set<number>([0]);
    for (const t of thresholds) {
      if (c < t) {
        const needed = t - c;
        if (needed <= wildCount && !seen.has(needed)) {
          seen.add(needed);
          candidatesPerSymbol[sym].push(needed);
        }
      }
    }
  }

  let bestPayoutCents = -1;
  let bestWildsUsed = Number.MAX_SAFE_INTEGER;
  let bestAlloc: [number, number, number, number] = [0, 0, 0, 0];

  const [crownOpts, gemOpts, bellOpts, cherryOpts] = [
    candidatesPerSymbol.CROWN,
    candidatesPerSymbol.GEM,
    candidatesPerSymbol.BELL,
    candidatesPerSymbol.CHERRY,
  ];

  for (const wCrown of crownOpts) {
    for (const wGem of gemOpts) {
      if (wCrown + wGem > wildCount) continue;
      for (const wBell of bellOpts) {
        if (wCrown + wGem + wBell > wildCount) continue;
        for (const wCherry of cherryOpts) {
          const used = wCrown + wGem + wBell + wCherry;
          if (used > wildCount) continue;

          const pCrown = Math.round(
            getPaytableMultiplier('CROWN', counts.CROWN + wCrown) * betAmount * 100
          );
          const pGem = Math.round(
            getPaytableMultiplier('GEM', counts.GEM + wGem) * betAmount * 100
          );
          const pBell = Math.round(
            getPaytableMultiplier('BELL', counts.BELL + wBell) * betAmount * 100
          );
          const pCherry = Math.round(
            getPaytableMultiplier('CHERRY', counts.CHERRY + wCherry) * betAmount * 100
          );

          const totalCents = pCrown + pGem + pBell + pCherry;

          let isBetter = false;
          if (totalCents > bestPayoutCents) {
            isBetter = true;
          } else if (totalCents === bestPayoutCents) {
            if (used < bestWildsUsed) {
              isBetter = true;
            } else if (used === bestWildsUsed) {
              const candidateTuple: [number, number, number, number] = [
                wCrown,
                wGem,
                wBell,
                wCherry,
              ];
              // Prioritas CROWN > GEM > BELL > CHERRY
              const payoutsCandidate = [pCrown, pGem, pBell, pCherry];
              const payoutsBest = [
                Math.round(
                  getPaytableMultiplier('CROWN', counts.CROWN + bestAlloc[0]) *
                    betAmount *
                    100
                ),
                Math.round(
                  getPaytableMultiplier('GEM', counts.GEM + bestAlloc[1]) *
                    betAmount *
                    100
                ),
                Math.round(
                  getPaytableMultiplier('BELL', counts.BELL + bestAlloc[2]) *
                    betAmount *
                    100
                ),
                Math.round(
                  getPaytableMultiplier('CHERRY', counts.CHERRY + bestAlloc[3]) *
                    betAmount *
                    100
                ),
              ];
              for (let i = 0; i < 4; i++) {
                if (payoutsCandidate[i] !== payoutsBest[i]) {
                  isBetter = payoutsCandidate[i] > payoutsBest[i];
                  break;
                }
                if (candidateTuple[i] !== bestAlloc[i]) {
                  isBetter = candidateTuple[i] > bestAlloc[i];
                  break;
                }
              }
            }
          }

          if (isBetter) {
            bestPayoutCents = totalCents;
            bestWildsUsed = used;
            bestAlloc = [wCrown, wGem, wBell, wCherry];
          }
        }
      }
    }
  }

  const allocationBySymbol: Record<RegularSymbol, number> = {
    CROWN: bestAlloc[0],
    GEM: bestAlloc[1],
    BELL: bestAlloc[2],
    CHERRY: bestAlloc[3],
  };

  const wins: ClusterWin[] = [];
  for (const sym of REGULAR_SYMBOLS_PRIORITY) {
    const naturalCount = counts[sym];
    const wildsAssigned = allocationBySymbol[sym];
    const effectiveCount = naturalCount + wildsAssigned;
    const mult = getPaytableMultiplier(sym, effectiveCount);
    if (mult > 0) {
      wins.push({
        symbol: sym,
        naturalCount,
        wildsAssigned,
        effectiveCount,
        basePayout: roundCurrency(mult * betAmount),
      });
    }
  }

  return {
    wins,
    totalBasePayout: roundCurrency(bestPayoutCents / 100),
    totalWildsUsed: bestWildsUsed,
    allocationBySymbol,
  };
}

export function applyGravityAndRefill(
  grid: GridMatrix,
  removedPositions: GridCoordinate[],
  rng: RngProvider
): GridMatrix {
  const removedSet = new Set(removedPositions.map((p) => `${p.row},${p.col}`));
  const nextGrid: GridMatrix = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ symbol: 'LEAF' as SlotSymbol }))
  );

  for (let c = 0; c < GRID_COLS; c++) {
    const survivors: GridCell[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      if (!removedSet.has(`${r},${c}`)) {
        survivors.push({ ...grid[r][c] });
      }
    }
    const emptyCount = GRID_ROWS - survivors.length;
    for (let r = 0; r < emptyCount; r++) {
      nextGrid[r][c] = sampleCell(rng);
    }
    for (let i = 0; i < survivors.length; i++) {
      nextGrid[emptyCount + i][c] = survivors[i];
    }
  }

  return nextGrid;
}

export class GameEngine {
  private readonly rng: RngProvider;

  constructor(rng: RngProvider) {
    this.rng = rng;
  }

  playChain(
    betAmount: number,
    options: {
      chainType: 'paid' | 'free';
      chainIndex: number;
      scatterEnabled: boolean;
      presetInitialGrid?: GridMatrix;
    }
  ): ChainResult {
    let currentGrid = options.presetInitialGrid
      ? cloneGrid(options.presetInitialGrid)
      : generateGrid(this.rng);
    const initialGrid = cloneGrid(currentGrid);

    const scatterCountInitial = options.scatterEnabled
      ? countSymbolInGrid(initialGrid, 'SCATTER')
      : null;

    const tumbleLog: TumbleStepLog[] = [];
    const winsSummary: ClusterWin[] = [];
    let baseTotal = 0;
    let multiplierSum = 0;
    let tumbleCount = 0;

    for (let evalIdx = 0; evalIdx <= MAX_TUMBLE_TRANSITIONS; evalIdx++) {
      const evaluation = evaluateClustersWithWilds(currentGrid, betAmount);

      if (evaluation.wins.length === 0) {
        if (evalIdx === 0) {
          tumbleLog.push({
            evaluationIndex: 0,
            grid: cloneGrid(currentGrid),
            wins: [],
            basePayout: 0,
            multipliersCollected: [],
            removedPositions: [],
          });
        }
        break;
      }

      const winningSymbols = new Set<RegularSymbol>(
        evaluation.wins.map((w) => w.symbol)
      );

      const removedPositions: GridCoordinate[] = [];
      const multipliersCollected: Array<2 | 3 | 5> = [];
      let wildsRemainingToRemove = evaluation.totalWildsUsed;

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const cell = currentGrid[r][c];
          if (winningSymbols.has(cell.symbol as RegularSymbol)) {
            removedPositions.push({ row: r, col: c });
          } else if (cell.symbol === 'MULTIPLIER') {
            const val = cell.multiplierValue ?? 2;
            multipliersCollected.push(val);
            multiplierSum += val;
            removedPositions.push({ row: r, col: c });
          } else if (cell.symbol === 'WILD' && wildsRemainingToRemove > 0) {
            removedPositions.push({ row: r, col: c });
            wildsRemainingToRemove--;
          }
        }
      }

      baseTotal = roundCurrency(baseTotal + evaluation.totalBasePayout);
      winsSummary.push(...evaluation.wins);

      tumbleLog.push({
        evaluationIndex: evalIdx,
        grid: cloneGrid(currentGrid),
        wins: evaluation.wins,
        basePayout: evaluation.totalBasePayout,
        multipliersCollected,
        removedPositions,
      });

      if (evalIdx === MAX_TUMBLE_TRANSITIONS) {
        break;
      }

      tumbleCount++;
      currentGrid = applyGravityAndRefill(currentGrid, removedPositions, this.rng);
    }

    const appliedMultiplier = multiplierSum > 0 ? multiplierSum : 1;
    const grossPayout = roundCurrency(baseTotal * appliedMultiplier);

    return {
      chainType: options.chainType,
      chainIndex: options.chainIndex,
      initialGrid,
      tumbleLog,
      winsSummary,
      tumbleCount,
      basePayout: baseTotal,
      multiplierSum,
      appliedMultiplier,
      grossPayout,
      scatterCountInitial,
    };
  }

  playPaidRound(
    betAmount: number,
    options?: { forcedScatterCount?: number; exactScatterCount?: boolean }
  ): PaidRoundResult {
    const presetInitialGrid =
      options?.forcedScatterCount && options.forcedScatterCount > 0
        ? generateGridWithScatterCount(
            this.rng,
            options.forcedScatterCount,
            options.exactScatterCount ?? true
          )
        : undefined;

    const paidChain = this.playChain(betAmount, {
      chainType: 'paid',
      chainIndex: 0,
      scatterEnabled: true,
      presetInitialGrid,
    });

    const initialScatterCount = paidChain.scatterCountInitial ?? 0;
    const freeSpinsAwarded = mapScatterToFreeSpins(initialScatterCount);
    const freeSpinChains: ChainResult[] = [];
    let freeSpinGrossTotal = 0;
    let totalBasePayout = paidChain.basePayout;
    let tumbleCountTotal = paidChain.tumbleCount;

    for (let i = 1; i <= freeSpinsAwarded; i++) {
      const fsChain = this.playChain(betAmount, {
        chainType: 'free',
        chainIndex: i,
        scatterEnabled: false,
      });
      freeSpinChains.push(fsChain);
      freeSpinGrossTotal = roundCurrency(freeSpinGrossTotal + fsChain.grossPayout);
      totalBasePayout = roundCurrency(totalBasePayout + fsChain.basePayout);
      tumbleCountTotal += fsChain.tumbleCount;
    }

    const grossPayout = roundCurrency(paidChain.grossPayout + freeSpinGrossTotal);
    const netResult = roundCurrency(grossPayout - betAmount);

    return {
      betAmount,
      paidChain,
      freeSpinChains,
      initialScatterCount,
      freeSpinsAwarded,
      freeSpinsPlayed: freeSpinChains.length,
      totalBasePayout,
      tumbleCountTotal,
      grossPayout,
      netResult,
    };
  }
}

export interface SessionMetrics {
  paidSpins: number;
  totalPaidBet: number;
  totalGrossPayout: number;
  netProfitLoss: number;
  observedRtpPercent: number;
  houseEdgeObservedPercent: number;
  endingBalance: number;
}

export function calculateSessionMetrics(
  startingBalance: number,
  rounds: Array<{ betAmount: number; grossPayout: number }>
): SessionMetrics {
  const paidSpins = rounds.length;
  let totalPaidBet = 0;
  let totalGrossPayout = 0;

  for (const r of rounds) {
    totalPaidBet = roundCurrency(totalPaidBet + r.betAmount);
    totalGrossPayout = roundCurrency(totalGrossPayout + r.grossPayout);
  }

  const netProfitLoss = roundCurrency(totalGrossPayout - totalPaidBet);
  const endingBalance = roundCurrency(
    startingBalance - totalPaidBet + totalGrossPayout
  );
  const observedRtpPercent =
    totalPaidBet > 0 ? roundCurrency((totalGrossPayout / totalPaidBet) * 100) : 0;
  const houseEdgeObservedPercent =
    totalPaidBet > 0 ? roundCurrency(100 - observedRtpPercent) : 0;

  return {
    paidSpins,
    totalPaidBet,
    totalGrossPayout,
    netProfitLoss,
    observedRtpPercent,
    houseEdgeObservedPercent,
    endingBalance,
  };
}
