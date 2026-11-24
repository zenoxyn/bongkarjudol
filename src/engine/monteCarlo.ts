import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_VERSION } from './config.ts';
import { GameEngine } from './gameEngine.ts';
import { SeededRng } from './rng.ts';

export interface MonteCarloBucket {
  label: string;
  minRatio: number;
  maxRatio: number | null;
  count: number;
  percent: number;
}

export interface MonteCarloReport {
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
  distribution: MonteCarloBucket[];
}

export function runMonteCarlo(trials = 100_000, seed = 20261116): MonteCarloReport {
  const engine = new GameEngine(new SeededRng(seed));
  const unitBet = 10; // bet = 10, dinormalisasi ke 1 unit dengan dibagi bet

  let totalGrossUnits = 0;
  let sumSqUnits = 0;
  let payoutPositiveCount = 0;
  let netProfitCount = 0;
  let breakEvenCount = 0;
  let netLossCount = 0;
  let totalTumbles = 0;
  let roundsWithTumble = 0;
  let scatterTriggers = 0;
  let totalFreeSpins = 0;

  let bZero = 0;
  let bBelowOne = 0;
  let bOneToTwo = 0;
  let bTwoToFive = 0;
  let bFiveToTen = 0;
  let bTenPlus = 0;

  for (let i = 0; i < trials; i++) {
    const round = engine.playPaidRound(unitBet);
    const ratio = round.grossPayout / unitBet;

    totalGrossUnits += ratio;
    sumSqUnits += ratio * ratio;

    if (ratio > 0) payoutPositiveCount++;
    if (ratio > 1) netProfitCount++;
    else if (Math.abs(ratio - 1) < 1e-9) breakEvenCount++;
    else netLossCount++;

    totalTumbles += round.tumbleCountTotal;
    if (round.tumbleCountTotal > 0) roundsWithTumble++;
    if (round.freeSpinsAwarded > 0) scatterTriggers++;
    totalFreeSpins += round.freeSpinsPlayed;

    if (ratio === 0) bZero++;
    else if (ratio < 1) bBelowOne++;
    else if (ratio < 2) bOneToTwo++;
    else if (ratio < 5) bTwoToFive++;
    else if (ratio < 10) bFiveToTen++;
    else bTenPlus++;
  }

  const mean = totalGrossUnits / trials;
  const variance = Math.max(0, sumSqUnits / trials - mean * mean);
  const sd = Math.sqrt(variance * (trials / (trials - 1)));
  const se = sd / Math.sqrt(trials);
  const ciLow = mean - 1.96 * se;
  const ciHigh = mean + 1.96 * se;

  const pct = (n: number) => Number(((n / trials) * 100).toFixed(3));
  const fix4 = (n: number) => Number(n.toFixed(4));
  const fix6 = (n: number) => Number(n.toFixed(6));

  return {
    configVersion: CONFIG_VERSION,
    seed,
    trials,
    generatedAt: new Date().toISOString(),
    totalPaidBet: trials,
    totalGrossPayout: Number(totalGrossUnits.toFixed(2)),
    estimatedRtpPercent: fix4(mean * 100),
    estimatedHouseEdgePercent: fix4((1 - mean) * 100),
    meanPayoutPerUnit: fix6(mean),
    expectedValuePerUnit: fix6(mean - 1),
    standardDeviation: fix6(sd),
    standardError: fix6(se),
    confidenceInterval95: {
      lowUnit: fix6(ciLow),
      highUnit: fix6(ciHigh),
      lowRtpPercent: Number((ciLow * 100).toFixed(2)),
      highRtpPercent: Number((ciHigh * 100).toFixed(2)),
    },
    payoutPositiveFrequencyPercent: pct(payoutPositiveCount),
    netProfitFrequencyPercent: pct(netProfitCount),
    breakEvenFrequencyPercent: pct(breakEvenCount),
    netLossFrequencyPercent: pct(netLossCount),
    meanTumblesPerRound: Number((totalTumbles / trials).toFixed(5)),
    roundWithTumbleFrequencyPercent: pct(roundsWithTumble),
    scatterTriggerFrequencyPercent: pct(scatterTriggers),
    meanFreeSpinsPerRound: Number((totalFreeSpins / trials).toFixed(5)),
    distribution: [
      { label: '0', minRatio: 0, maxRatio: 0, count: bZero, percent: pct(bZero) },
      {
        label: '> 0 hingga < 1× bet',
        minRatio: 0,
        maxRatio: 1,
        count: bBelowOne,
        percent: pct(bBelowOne),
      },
      {
        label: '1× hingga < 2× bet',
        minRatio: 1,
        maxRatio: 2,
        count: bOneToTwo,
        percent: pct(bOneToTwo),
      },
      {
        label: '2× hingga < 5× bet',
        minRatio: 2,
        maxRatio: 5,
        count: bTwoToFive,
        percent: pct(bTwoToFive),
      },
      {
        label: '5× hingga < 10× bet',
        minRatio: 5,
        maxRatio: 10,
        count: bFiveToTen,
        percent: pct(bFiveToTen),
      },
      {
        label: '≥ 10× bet',
        minRatio: 10,
        maxRatio: null,
        count: bTenPlus,
        percent: pct(bTenPlus),
      },
    ],
  };
}

// Jalankan langsung lewat CLI untuk menghasilkan laporan statis berversi
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('monteCarlo.ts');

if (isDirectRun) {
  const report = runMonteCarlo(100_000, 20261116);
  const outDir = path.resolve(process.cwd(), 'src/data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'monteCarloReport.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log('Monte Carlo 100.000 trial selesai:', {
    configVersion: report.configVersion,
    estimatedRtpPercent: report.estimatedRtpPercent,
    estimatedHouseEdgePercent: report.estimatedHouseEdgePercent,
    expectedValuePerUnit: report.expectedValuePerUnit,
    payoutPositiveFrequencyPercent: report.payoutPositiveFrequencyPercent,
    netProfitFrequencyPercent: report.netProfitFrequencyPercent,
    scatterTriggerFrequencyPercent: report.scatterTriggerFrequencyPercent,
    ci95: report.confidenceInterval95,
  });
}
