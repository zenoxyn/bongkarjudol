import type { RngProvider } from '../engine/rng.ts';

/**
 * RNG produksi berbasis CSPRNG peramban (`crypto.getRandomValues`).
 * Menghasilkan integer acak inklusif [min, max] tanpa bias modulo yang berarti.
 */
export class BrowserCryptoRng implements RngProvider {
  private readonly buffer = new Uint32Array(1);

  nextInt(min: number, max: number): number {
    const span = max - min + 1;
    if (span <= 0) return min;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      // Batasi ke 2^32-1 agar pembagian tidak bias
      const limit = Math.floor(0x100000000 / span) * span;
      let value = 0;
      do {
        crypto.getRandomValues(this.buffer);
        value = this.buffer[0];
      } while (value >= limit);
      return min + (value % span);
    }
    // Fallback (hanya bila crypto tidak tersedia)
    return min + Math.floor(Math.random() * span);
  }
}

export function createDefaultRng(): RngProvider {
  return new BrowserCryptoRng();
}