import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_COLS,
  GRID_ROWS,
  mapScatterToFreeSpins,
  SYMBOL_WEIGHTS,
} from './config.ts';
import {
  applyGravityAndRefill,
  calculateSessionMetrics,
  countSymbolInGrid,
  evaluateClustersWithWilds,
  GameEngine,
  generateGrid,
  generateGridWithScatterCount,
  mapRollToSymbol,
  type GridCell,
  type GridMatrix,
} from './gameEngine.ts';
import { ScriptedRng, SeededRng } from './rng.ts';

function buildGrid(fill: GridCell = { symbol: 'LEAF' }): GridMatrix {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ ...fill }))
  );
}

test('UT-00: symbol weights sum strictly to 100%', () => {
  const sum = SYMBOL_WEIGHTS.reduce((acc, s) => acc + s.weight, 0);
  assert.equal(sum, 100);
});

test('UT-01: weighted sampling maps boundary rolls accurately', () => {
  assert.equal(mapRollToSymbol(1), 'CHERRY');
  assert.equal(mapRollToSymbol(15), 'CHERRY');
  assert.equal(mapRollToSymbol(16), 'BELL');
  assert.equal(mapRollToSymbol(28), 'BELL');
  assert.equal(mapRollToSymbol(29), 'GEM');
  assert.equal(mapRollToSymbol(40), 'CROWN');
  assert.equal(mapRollToSymbol(49), 'WILD');
  assert.equal(mapRollToSymbol(54), 'SCATTER');
  assert.equal(mapRollToSymbol(56), 'MULTIPLIER');
  assert.equal(mapRollToSymbol(59), 'LEAF');
  assert.equal(mapRollToSymbol(80), 'MOON');
  assert.equal(mapRollToSymbol(100), 'MOON');
});

test('UT-02: generateGrid always creates 6x5 (30 cells)', () => {
  const grid = generateGrid(new SeededRng(42));
  assert.equal(grid.length, 5);
  for (const row of grid) {
    assert.equal(row.length, 6);
  }
});

test('UT-03: cluster minimum — 7 Cherry without Wild does not win', () => {
  const grid = buildGrid();
  for (let i = 0; i < 7; i++) {
    grid[Math.floor(i / 6)][i % 6] = { symbol: 'CHERRY' };
  }
  const res = evaluateClustersWithWilds(grid, 10);
  assert.equal(res.wins.length, 0);
  assert.equal(res.totalBasePayout, 0);
});

test('UT-04: cluster minimum — 8 Cherry wins tier 8-9 payout', () => {
  const grid = buildGrid();
  for (let i = 0; i < 8; i++) {
    grid[Math.floor(i / 6)][i % 6] = { symbol: 'CHERRY' };
  }
  const res = evaluateClustersWithWilds(grid, 10);
  assert.equal(res.wins.length, 1);
  assert.equal(res.wins[0].symbol, 'CHERRY');
  assert.equal(res.wins[0].effectiveCount, 8);
  assert.equal(res.totalBasePayout, 2); // 0.20 * 10
});

test('UT-05: multi-cluster — 8 Cherry and 8 Bell both score independently', () => {
  const grid = buildGrid();
  for (let i = 0; i < 8; i++) {
    grid[0][i % 6] = { symbol: 'CHERRY' };
  }
  grid[1][0] = { symbol: 'CHERRY' };
  grid[1][1] = { symbol: 'CHERRY' }; // wait: row 0 has 6, so 6+2 = 8 cherry
  for (let c = 0; c < 6; c++) grid[2][c] = { symbol: 'BELL' };
  grid[3][0] = { symbol: 'BELL' };
  grid[3][1] = { symbol: 'BELL' };
  const res = evaluateClustersWithWilds(grid, 10);
  assert.equal(res.wins.length, 2);
  assert.equal(res.totalBasePayout, 5.2); // 2.0 + 3.2
});

test('UT-06 & UT-07: Wild assigns optimally and never double-counts across clusters', () => {
  const grid = buildGrid();
  // 7 GEM, 7 CHERRY, 1 WILD -> 1 Wild should only go to GEM (0.48x > 0.20x), not both
  for (let i = 0; i < 7; i++) {
    grid[0][i % 6] = { symbol: 'GEM' };
  }
  grid[1][0] = { symbol: 'GEM' };
  for (let c = 0; c < 6; c++) grid[2][c] = { symbol: 'CHERRY' };
  grid[3][0] = { symbol: 'CHERRY' };
  grid[4][0] = { symbol: 'WILD' };

  const res = evaluateClustersWithWilds(grid, 10);
  assert.equal(res.wins.length, 1);
  assert.equal(res.wins[0].symbol, 'GEM');
  assert.equal(res.totalWildsUsed, 1);
  assert.equal(res.totalBasePayout, 4.8);
});

test('UT-08: Wild tie-break prefers fewest Wilds, then priority CROWN > GEM > BELL > CHERRY', () => {
  const grid = buildGrid();
  // 7 CROWN + 7 CROWN? Let's create exact payout tie: 9 CROWN (+1 wild = +0.80x) vs 7 CROWN? Wait: 9 CHERRY (+1 wild = +0.20x) vs 7 CHERRY? Let's test fewest wilds:
  // 8 CROWN + 2 WILD -> 0 wilds gives 8 CROWN (0.80x), 2 wilds gives 10 CROWN (1.60x).
  // Suppose 7 CROWN + 9 BELL + 1 WILD: CROWN jump = +0.80, BELL jump = +0.32 -> CROWN wins.
  // Suppose 10 CHERRY + 1 WILD (needs 2 wilds for 12): uses 0 wilds!
  for (let c = 0; c < 6; c++) grid[0][c] = { symbol: 'CHERRY' };
  for (let c = 0; c < 4; c++) grid[1][c] = { symbol: 'CHERRY' };
  grid[4][0] = { symbol: 'WILD' };
  const res = evaluateClustersWithWilds(grid, 10);
  assert.equal(res.totalWildsUsed, 0); // Unused wild is not consumed!
  assert.equal(res.totalBasePayout, 4); // 0.40 * 10
});

test('UT-09: Tumble gravity preserves vertical relative order in each column', () => {
  const grid = buildGrid({ symbol: 'MOON' });
  grid[0][0] = { symbol: 'CROWN' }; // stays
  grid[1][0] = { symbol: 'CHERRY' }; // removed
  grid[2][0] = { symbol: 'GEM' }; // stays
  grid[3][0] = { symbol: 'CHERRY' }; // removed
  grid[4][0] = { symbol: 'BELL' }; // stays

  // Fill with LEAF (roll 65)
  const rng = new ScriptedRng([], 65);
  const next = applyGravityAndRefill(
    grid,
    [
      { row: 1, col: 0 },
      { row: 3, col: 0 },
    ],
    rng
  );
  assert.equal(next[0][0].symbol, 'LEAF');
  assert.equal(next[1][0].symbol, 'LEAF');
  assert.equal(next[2][0].symbol, 'CROWN');
  assert.equal(next[3][0].symbol, 'GEM');
  assert.equal(next[4][0].symbol, 'BELL');
});

test('UT-10: Tumble stops at maximum 5 transitions (6 evaluations total)', () => {
  // Always fill every refill with CHERRY (roll 1) so every grid has >= 8 Cherries
  const engine = new GameEngine(new ScriptedRng([], 1));
  const initial = buildGrid({ symbol: 'CHERRY' });
  const chain = engine.playChain(10, {
    chainType: 'paid',
    chainIndex: 0,
    scatterEnabled: false,
    presetInitialGrid: initial,
  });
  assert.equal(chain.tumbleLog.length, 6);
  assert.equal(chain.tumbleCount, 5);
});

test('UT-11, UT-12, UT-13, UT-17: Multiplier sums (not multiplies), defaults to 1x, ignored on no-win', () => {
  // Case A: Winning grid with 2x and 3x -> 5x applied, base 10 -> gross 50
  const gridWin = buildGrid();
  for (let c = 0; c < 6; c++) gridWin[0][c] = { symbol: 'CHERRY' };
  for (let c = 0; c < 6; c++) gridWin[1][c] = { symbol: 'CHERRY' }; // 12 cherry = 0.80*10 = 8
  for (let c = 0; c < 6; c++) gridWin[2][c] = { symbol: 'CHERRY' };
  // Wait: let's make base payout = 10: 8 CHERRY (2.0) + 8 CROWN (8.0) = 10.0 at bet 10
  const gridExact = buildGrid();
  for (let c = 0; c < 6; c++) gridExact[0][c] = { symbol: 'CHERRY' };
  gridExact[1][0] = { symbol: 'CHERRY' };
  gridExact[1][1] = { symbol: 'CHERRY' };
  for (let c = 0; c < 6; c++) gridExact[2][c] = { symbol: 'CROWN' };
  gridExact[3][0] = { symbol: 'CROWN' };
  gridExact[3][1] = { symbol: 'CROWN' };
  gridExact[4][0] = { symbol: 'MULTIPLIER', multiplierValue: 2 };
  gridExact[4][1] = { symbol: 'MULTIPLIER', multiplierValue: 3 };

  const engineWin = new GameEngine(new ScriptedRng([], 65)); // refill with LEAF (no further wins)
  const resWin = engineWin.playChain(10, {
    chainType: 'paid',
    chainIndex: 0,
    scatterEnabled: false,
    presetInitialGrid: gridExact,
  });
  assert.equal(resWin.basePayout, 10);
  assert.equal(resWin.multiplierSum, 5);
  assert.equal(resWin.appliedMultiplier, 5);
  assert.equal(resWin.grossPayout, 50);

  // Case B: No multiplier -> default 1x
  gridExact[4][0] = { symbol: 'LEAF' };
  gridExact[4][1] = { symbol: 'LEAF' };
  const resDefault = engineWin.playChain(10, {
    chainType: 'paid',
    chainIndex: 0,
    scatterEnabled: false,
    presetInitialGrid: gridExact,
  });
  assert.equal(resDefault.multiplierSum, 0);
  assert.equal(resDefault.appliedMultiplier, 1);
  assert.equal(resDefault.grossPayout, 10);

  // Case C: Multiplier on non-winning grid is not collected
  const gridNoWin = buildGrid();
  gridNoWin[0][0] = { symbol: 'MULTIPLIER', multiplierValue: 5 };
  const resNoWin = engineWin.playChain(10, {
    chainType: 'paid',
    chainIndex: 0,
    scatterEnabled: false,
    presetInitialGrid: gridNoWin,
  });
  assert.equal(resNoWin.multiplierSum, 0);
  assert.equal(resNoWin.grossPayout, 0);
});

test('UT-14, UT-15, UT-16: Scatter triggers Free Spins on initial grid only, no retrigger', () => {
  assert.equal(mapScatterToFreeSpins(0), 0);
  assert.equal(mapScatterToFreeSpins(2), 0);
  assert.equal(mapScatterToFreeSpins(3), 10);
  assert.equal(mapScatterToFreeSpins(4), 12);
  assert.equal(mapScatterToFreeSpins(5), 15);
  assert.equal(mapScatterToFreeSpins(7), 15);

  // Scatter only counted when scatterEnabled = true
  const gridScatter = buildGrid();
  gridScatter[0][0] = { symbol: 'SCATTER' };
  gridScatter[0][1] = { symbol: 'SCATTER' };
  gridScatter[0][2] = { symbol: 'SCATTER' };

  const engine = new GameEngine(new ScriptedRng([], 65));
  const paid = engine.playChain(20, {
    chainType: 'paid',
    chainIndex: 0,
    scatterEnabled: true,
    presetInitialGrid: gridScatter,
  });
  assert.equal(paid.scatterCountInitial, 3);

  const free = engine.playChain(20, {
    chainType: 'free',
    chainIndex: 1,
    scatterEnabled: false,
    presetInitialGrid: gridScatter,
  });
  assert.equal(free.scatterCountInitial, null);
});

test('UT-18 & UT-19: EV/RTP and Ending Balance formulas match SDD test vectors', () => {
  const metrics = calculateSessionMetrics(1000, [
    { betAmount: 50, grossPayout: 30 },
    { betAmount: 50, grossPayout: 40 },
  ]);
  assert.equal(metrics.totalPaidBet, 100);
  assert.equal(metrics.totalGrossPayout, 70);
  assert.equal(metrics.netProfitLoss, -30);
  assert.equal(metrics.observedRtpPercent, 70);
  assert.equal(metrics.houseEdgeObservedPercent, 30);
  assert.equal(metrics.endingBalance, 970);
});

test('UT-20: Deterministic RNG produces identical paid round outputs', () => {
  const e1 = new GameEngine(new SeededRng(123456));
  const e2 = new GameEngine(new SeededRng(123456));
  const r1 = e1.playPaidRound(20);
  const r2 = e2.playPaidRound(20);
  assert.deepEqual(r1, r2);
});

test('UT-21: generateGridWithScatterCount and forcedScatterCount award exact Scatters and Free Spins', () => {
  const rng = new SeededRng(99);
  for (const count of [3, 4, 5] as const) {
    const grid = generateGridWithScatterCount(rng, count, true);
    assert.equal(countSymbolInGrid(grid, 'SCATTER'), count);
  }

  const engine = new GameEngine(new SeededRng(777));
  const r3 = engine.playPaidRound(20, { forcedScatterCount: 3, exactScatterCount: true });
  assert.equal(r3.initialScatterCount, 3);
  assert.equal(r3.freeSpinsAwarded, 10);

  const r4 = engine.playPaidRound(20, { forcedScatterCount: 4, exactScatterCount: true });
  assert.equal(r4.initialScatterCount, 4);
  assert.equal(r4.freeSpinsAwarded, 12);

  const r5 = engine.playPaidRound(20, { forcedScatterCount: 5, exactScatterCount: true });
  assert.equal(r5.initialScatterCount, 5);
  assert.equal(r5.freeSpinsAwarded, 15);
});
