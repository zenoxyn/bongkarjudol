export const CONFIG_VERSION = 'BJ-MVP-1.0.0' as const;
export const CONTENT_VERSION = 'BJ-CONTENT-1.0.0' as const;

export const GRID_COLS = 6;
export const GRID_ROWS = 5;
export const GRID_SIZE = GRID_COLS * GRID_ROWS; // 30

export const STARTING_BALANCE = 1000;
export const BET_MIN = 10;
export const BET_MAX = 100;
export const BET_STEP = 10;
export const ALLOWED_BETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export const MAX_PAID_SPINS = 100;
export const SESSION_DURATION_SECONDS = 15 * 60; // 15 menit
export const MAX_TUMBLE_TRANSITIONS = 5; // Maksimum 6 evaluasi grid (0..5)
export const BUY_SCATTER_COST = 500;

export type RegularSymbol = 'CHERRY' | 'BELL' | 'GEM' | 'CROWN';
export type SpecialSymbol = 'WILD' | 'SCATTER' | 'MULTIPLIER';
export type NeutralSymbol = 'LEAF' | 'MOON';
export type SlotSymbol = RegularSymbol | SpecialSymbol | NeutralSymbol;

export const REGULAR_SYMBOLS_PRIORITY: readonly RegularSymbol[] = [
  'CROWN',
  'GEM',
  'BELL',
  'CHERRY',
] as const;

export interface SymbolWeightEntry {
  symbol: SlotSymbol;
  weight: number; // percent (1..100 cumulative)
  role: 'regular' | 'wild' | 'scatter' | 'multiplier' | 'neutral';
  label: string;
  description: string;
}

export const SYMBOL_WEIGHTS: readonly SymbolWeightEntry[] = [
  {
    symbol: 'CHERRY',
    weight: 15,
    role: 'regular',
    label: 'Cherry',
    description: 'Simbol reguler tingkat dasar. Cluster mulai 8 simbol.',
  },
  {
    symbol: 'BELL',
    weight: 13,
    role: 'regular',
    label: 'Bell',
    description: 'Simbol reguler menengah-bawah. Cluster mulai 8 simbol.',
  },
  {
    symbol: 'GEM',
    weight: 11,
    role: 'regular',
    label: 'Gem',
    description: 'Simbol reguler menengah-atas. Cluster mulai 8 simbol.',
  },
  {
    symbol: 'CROWN',
    weight: 9,
    role: 'regular',
    label: 'Crown',
    description: 'Simbol reguler bernilai tertinggi. Cluster mulai 8 simbol.',
  },
  {
    symbol: 'WILD',
    weight: 5,
    role: 'wild',
    label: 'Wild',
    description: 'Pengganti satu jenis simbol reguler secara optimal.',
  },
  {
    symbol: 'SCATTER',
    weight: 2,
    role: 'scatter',
    label: 'Scatter',
    description: 'Memicu Free Spins bila muncul >= 3 pada grid awal paid spin.',
  },
  {
    symbol: 'MULTIPLIER',
    weight: 3,
    role: 'multiplier',
    label: 'Multiplier',
    description: 'Pengali payout (2x, 3x, atau 5x) bila muncul di grid menang.',
  },
  {
    symbol: 'LEAF',
    weight: 21,
    role: 'neutral',
    label: 'Leaf',
    description: 'Simbol netral pengisi grid; tidak menghasilkan payout.',
  },
  {
    symbol: 'MOON',
    weight: 21,
    role: 'neutral',
    label: 'Moon',
    description: 'Simbol netral pengisi grid; tidak menghasilkan payout.',
  },
] as const;

export interface MultiplierWeightEntry {
  value: 2 | 3 | 5;
  weight: number; // percent
}

export const MULTIPLIER_WEIGHTS: readonly MultiplierWeightEntry[] = [
  { value: 2, weight: 70 },
  { value: 3, weight: 25 },
  { value: 5, weight: 5 },
] as const;

// Paytable dalam rasio terhadap bet_amount (disimpan juga dalam basis integer per-100 agar bebas floating point)
export const PAYTABLE_MULTIPLIERS: Record<
  RegularSymbol,
  { tier8_9: number; tier10_11: number; tier12Plus: number }
> = {
  CHERRY: { tier8_9: 0.2, tier10_11: 0.4, tier12Plus: 0.8 },
  BELL: { tier8_9: 0.32, tier10_11: 0.64, tier12Plus: 1.28 },
  GEM: { tier8_9: 0.48, tier10_11: 0.96, tier12Plus: 1.92 },
  CROWN: { tier8_9: 0.8, tier10_11: 1.6, tier12Plus: 3.2 },
};

export function mapScatterToFreeSpins(scatterCount: number): number {
  if (scatterCount >= 5) return 15;
  if (scatterCount === 4) return 12;
  if (scatterCount === 3) return 10;
  return 0;
}

export function getPaytableMultiplier(symbol: RegularSymbol, count: number): number {
  if (count < 8) return 0;
  const entry = PAYTABLE_MULTIPLIERS[symbol];
  if (count >= 12) return entry.tier12Plus;
  if (count >= 10) return entry.tier10_11;
  return entry.tier8_9;
}
