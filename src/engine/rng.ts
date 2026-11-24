export interface RngProvider {
  /**
   * Mengembalikan integer acak dalam rentang inklusif [min, max].
   */
  nextInt(min: number, max: number): number;
}

/**
 * RNG deterministik ber-seed tetap (Mulberry32).
 * Dipakai untuk eksperimen Monte Carlo dan sebagai fallback bila `crypto`
 * tidak tersedia di lingkungan runtime.
 */
export class SeededRng implements RngProvider {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(min: number, max: number): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const span = max - min + 1;
    return min + Math.floor(unit * span);
  }
}

/**
 * RNG skrip berurutan untuk unit test deterministik.
 */
export class ScriptedRng implements RngProvider {
  private index = 0;
  private readonly sequence: number[];
  private readonly fallback: number;

  constructor(sequence: number[], fallback = 100) {
    this.sequence = sequence;
    this.fallback = fallback;
  }

  nextInt(min: number, max: number): number {
    const val = this.index < this.sequence.length ? this.sequence[this.index++] : this.fallback;
    if (val < min) return min;
    if (val > max) return max;
    return val;
  }
}