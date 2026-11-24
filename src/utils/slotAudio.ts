// Procedural Web Audio API sound synthesizer for BongkarJudol slot animations.
// Includes master compressor + higher output level, continuous "klinting-klinting" normal spin loop,
// distinct celebratory golden arpeggio loop during Free Spins, and crisp "jrengg" win fanfare chords.

class SlotAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private spinLoopTimer: number | null = null;
  private spinTickStep = 0;

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(next: boolean): void {
    this.muted = next;
    if (next) {
      this.stopSpinLoop();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(next ? 0 : 0.9, this.ctx.currentTime);
    }
  }

  private getOutput(): { ctx: AudioContext; out: AudioNode } | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        compressor.knee.setValueAtTime(18, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      if (!this.masterGain) return null;
      return { ctx: this.ctx, out: this.masterGain };
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.22,
    delaySec = 0,
    endFreq?: number
  ) {
    const audio = this.getOutput();
    if (!audio) return;
    const { ctx, out } = audio;
    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(40, endFreq),
          now + durationSec
        );
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // ignore audio context restrictions
    }
  }

  // Crisp metallic "klinting-klinting" pulse while normal reels are spinning
  private playKlintingTick() {
    const pattern = [1396.91, 1567.98, 1760, 1567.98]; // F6, G6, A6, G6
    const baseFreq = pattern[this.spinTickStep % pattern.length];
    this.spinTickStep += 1;
    this.playTone(baseFreq, 0.085, 'sine', 0.2, 0);
    this.playTone(baseFreq * 2, 0.065, 'triangle', 0.11, 0);
  }

  // Distinct festive Free Spin pulse: warm golden rising chime + bass bounce
  private playFreeSpinPulse() {
    const arp = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5, 783.99, 659.25];
    const step = this.spinTickStep % arp.length;
    const freq = arp[step];
    this.spinTickStep += 1;

    // Shimmering bonus chime
    this.playTone(freq, 0.11, 'triangle', 0.21, 0);
    this.playTone(freq * 1.5, 0.09, 'sine', 0.12, 0.01);
    // Downbeat warm pulse every 4 steps so it clearly feels like bonus mode
    if (step % 4 === 0) {
      this.playTone(196, 0.12, 'triangle', 0.16, 0, 146.83);
    }
  }

  startSpinLoop(fastMode = false) {
    this.stopSpinLoop();
    if (this.muted || typeof window === 'undefined') return;
    this.spinTickStep = 0;
    this.playKlintingTick();
    const intervalMs = fastMode ? 85 : 120;
    this.spinLoopTimer = window.setInterval(() => {
      if (this.muted) {
        this.stopSpinLoop();
        return;
      }
      this.playKlintingTick();
    }, intervalMs);
  }

  startFreeSpinLoop() {
    this.stopSpinLoop();
    if (this.muted || typeof window === 'undefined') return;
    this.spinTickStep = 0;
    this.playFreeSpinPulse();
    this.spinLoopTimer = window.setInterval(() => {
      if (this.muted) {
        this.stopSpinLoop();
        return;
      }
      this.playFreeSpinPulse();
    }, 105);
  }

  stopSpinLoop() {
    if (this.spinLoopTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.spinLoopTimer);
      this.spinLoopTimer = null;
    }
  }

  playSpinStart() {
    this.playTone(260, 0.13, 'triangle', 0.18, 0, 520);
    this.playTone(390, 0.13, 'sine', 0.14, 0.03, 660);
  }

  playReelStop(colIndex: number) {
    const base = 155 + colIndex * 22;
    this.playTone(base, 0.075, 'triangle', 0.22, 0, 88);
    this.playTone(base * 4.2, 0.045, 'sine', 0.08, 0);
  }

  // "Jrengg!" bright win chord on cluster payout
  playWinCluster(stepIndex: number) {
    const roots = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const root = roots[Math.min(stepIndex, roots.length - 1)];
    this.playTone(root, 0.34, 'triangle', 0.24, 0);
    this.playTone(root * 1.25, 0.36, 'sawtooth', 0.11, 0.015);
    this.playTone(root * 1.5, 0.38, 'sine', 0.2, 0.03);
    this.playTone(root * 2, 0.32, 'sine', 0.14, 0.045);
  }

  playMultiplierHit(value: number) {
    const pitch = value >= 5 ? 987.77 : value >= 3 ? 880 : 740;
    this.playTone(pitch, 0.24, 'sawtooth', 0.13, 0, pitch * 1.35);
    this.playTone(pitch * 1.5, 0.28, 'sine', 0.2, 0.04);
  }

  playScatterTrigger() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.28, 'triangle', 0.22, idx * 0.065);
      this.playTone(n * 1.5, 0.24, 'sine', 0.12, idx * 0.065);
    });
  }

  // Celebratory "Jrengg!" + coin cascade when Free Spins finish with accumulated payout
  playFreeSpinSummaryFanfare() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    fanfare.forEach((n, idx) => {
      this.playTone(n, 0.52, 'triangle', 0.22, idx * 0.04);
      this.playTone(n * 2, 0.38, 'sine', 0.11, idx * 0.04);
    });
    for (let i = 0; i < 8; i++) {
      this.playTone(1320 + (i % 4) * 240, 0.075, 'sine', 0.15, 0.22 + i * 0.055);
    }
  }

  // Celebratory "Jrengg!" big-win chord + coin cascade
  playBigWin() {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((n, idx) => {
      this.playTone(n, 0.48, 'triangle', 0.2, idx * 0.025);
      this.playTone(n * 2, 0.35, 'sine', 0.1, idx * 0.025);
    });
    for (let i = 0; i < 6; i++) {
      this.playTone(1480 + (i % 3) * 260, 0.065, 'sine', 0.14, 0.15 + i * 0.06);
    }
  }

  playRoundLoss() {
    this.playTone(210, 0.12, 'sine', 0.09, 0, 145);
  }
}

export const slotAudio = new SlotAudioEngine();
