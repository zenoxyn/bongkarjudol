import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Clock,
  FastForward,
  GraduationCap,
  Info,
  Minus,
  Plus,
  Repeat,
  Sparkles,
  Square,
  Ticket,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import type { GridMatrix, TumbleStepLog } from '../engine/gameEngine.ts';
import { ALLOWED_BETS, type SlotSymbol } from '../engine/config.ts';
import {
  formatCredit,
  type PageRoute,
  type RoundSummaryDto,
  type SimulationSessionDto,
  type SpinResponseDto,
} from '../types/api.ts';
import { CABINET_SYMBOL_META, SYMBOL_META, SymbolGlyph } from './SymbolIcon.tsx';
import { getSpinTimingProfile } from '../utils/simulatorControls.ts';

export type SpinAnimPhase =
  | 'idle'
  | 'spinning'
  | 'landing'
  | 'highlighting'
  | 'clearing'
  | 'scatter_celebration'
  | 'free_spin_summary'
  | 'settled';

export interface FreeSpinPlaybackState {
  current: number;
  total: number;
  payouts: number[];
  accumulatedWin: number;
  winningCount: number;
}

export interface ActiveChainView {
  label: string;
  tumbleLog: TumbleStepLog[];
  multiplierSum: number;
  appliedMultiplier: number;
  grossPayout: number;
  basePayout: number;
}

interface SlotStageProps {
  session: SimulationSessionDto;
  remainingSec: number;
  selectedBet: number;
  selectedAutoCount: number;
  spinning: boolean;
  ending: boolean;
  error: string | null;
  recentRounds: RoundSummaryDto[];
  displayedGrid: GridMatrix;
  removedKeySet: Set<string>;
  lastSpin: SpinResponseDto | null;
  activeChain: ActiveChainView | null;
  activeChainIdx: number;
  activeStepIdx: number;
  currentStep: TumbleStepLog | null;
  animPhase: SpinAnimPhase;
  freeSpinState: FreeSpinPlaybackState | null;
  soundMuted: boolean;
  fastMode: boolean;
  creating: boolean;
  buyingScatter: boolean;
  eduScatterEnabled: boolean;
  eduScatterCount: 3 | 4 | 5;
  autoProgress: { done: number; total: number } | null;
  onSelectBet: (bet: number) => void;
  onStepBet: (direction: -1 | 1) => void;
  onMaxBet: () => void;
  onSpin: () => void;
  onStartAutoSpin: (count: number) => void;
  onStopAutoSpin: () => void;
  onEndSession: () => void;
  onStartNewSession: () => void;
  onBuyScatter: () => void;
  onToggleEduScatter: () => void;
  onSelectEduScatterCount: (count: 3 | 4 | 5) => void;
  onToggleSound: () => void;
  onToggleFastMode: () => void;
  onSkipAnimation: () => void;
  onSelectChain: (chainIdx: number) => void;
  onSelectStep: (stepIdx: number) => void;
  onNavigate: (page: PageRoute) => void;
}

const AUTO_SPIN_COUNTS = [10, 20, 30, 40, 50] as const;

const SPIN_REEL_POOL: SlotSymbol[] = [
  'CROWN',
  'GEM',
  'WILD',
  'BELL',
  'CHERRY',
  'MULTIPLIER',
  'SCATTER',
  'LEAF',
  'MOON',
];

const PAY_SCROLL_ITEMS: Array<{
  symbol: SlotSymbol;
  label: string;
  ratio: string;
}> = [
  { symbol: 'CROWN', label: 'Crown', ratio: '3.2×' },
  { symbol: 'GEM', label: 'Gem', ratio: '1.92×' },
  { symbol: 'BELL', label: 'Bell', ratio: '1.28×' },
  { symbol: 'CHERRY', label: 'Cherry', ratio: '0.8×' },
  { symbol: 'WILD', label: 'Wild', ratio: 'Ganti' },
];

const PARTICLE_VECTORS = [
  { tx: '-110px', ty: '-75px', rot: '-140deg', delay: '0ms', color: '#FDE047' },
  { tx: '105px', ty: '-80px', rot: '150deg', delay: '30ms', color: '#F59E0B' },
  { tx: '-75px', ty: '-115px', rot: '95deg', delay: '60ms', color: '#38BDF8' },
  { tx: '80px', ty: '-110px', rot: '-110deg', delay: '45ms', color: '#34D399' },
  { tx: '-135px', ty: '-25px', rot: '-80deg', delay: '80ms', color: '#F472B6' },
  { tx: '135px', ty: '-30px', rot: '120deg', delay: '70ms', color: '#FDE047' },
  { tx: '-35px', ty: '-125px', rot: '160deg', delay: '20ms', color: '#FBBF24' },
  { tx: '40px', ty: '-120px', rot: '-160deg', delay: '50ms', color: '#A78BFA' },
];

function DragonCrestSvg({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 90 220"
      className={`w-14 xl:w-20 h-auto pointer-events-none select-none opacity-85 ${
        flip ? '-scale-x-100' : ''
      }`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dragonGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
      <path
        d="M72 22 C44 18, 22 36, 20 64 C18 86, 46 92, 56 108 C64 122, 34 146, 26 176 C22 192, 38 206, 62 210"
        fill="none"
        stroke="url(#dragonGold)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M78 30 L56 14 L52 30 L34 24 L42 40 L20 42 L38 56 L66 52 Z"
        fill="url(#dragonGold)"
        stroke="#FEF9C3"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="54" cy="37" r="3" fill="#DC2626" />
      <path
        d="M14 68 Q34 62 50 76 M16 112 Q36 104 54 118 M20 156 Q38 148 52 162"
        fill="none"
        stroke="#FDE68A"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function GoldPotEmblem() {
  return (
    <svg viewBox="0 0 110 64" className="w-12 h-7 sm:w-20 sm:h-12 lg:w-24 lg:h-14 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="potGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="potBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="55%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#450A0A" />
        </linearGradient>
      </defs>
      {/* Coins pile */}
      <ellipse cx="36" cy="24" rx="11" ry="6" fill="url(#potGold)" stroke="#FEF9C3" strokeWidth="1" />
      <ellipse cx="74" cy="24" rx="11" ry="6" fill="url(#potGold)" stroke="#FEF9C3" strokeWidth="1" />
      <ellipse cx="55" cy="18" rx="14" ry="8" fill="#FACC15" stroke="#FEF9C3" strokeWidth="1.2" />
      <circle cx="44" cy="19" r="5" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
      <circle cx="66" cy="19" r="5" fill="#FDE047" stroke="#B45309" strokeWidth="1" />
      <circle cx="55" cy="13" r="4.5" fill="#34D399" stroke="#D1FAE5" strokeWidth="1" />
      {/* Pot body */}
      <path
        d="M22 25 H88 C92 43, 82 58, 55 58 C28 58, 18 43, 22 25 Z"
        fill="url(#potBody)"
        stroke="url(#potGold)"
        strokeWidth="2.6"
      />
      <rect x="19" y="22" width="72" height="6" rx="3" fill="url(#potGold)" />
      {/* Prosperity emblem */}
      <circle cx="55" cy="42" r="10" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
      <path d="M50 42 H60 M55 37 V47" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SlotStage({
  session,
  remainingSec,
  selectedBet,
  selectedAutoCount,
  spinning,
  ending,
  error,
  recentRounds,
  displayedGrid,
  removedKeySet,
  lastSpin,
  activeChain,
  activeChainIdx,
  activeStepIdx,
  currentStep,
  animPhase,
  freeSpinState,
  soundMuted,
  fastMode,
  creating,
  buyingScatter,
  eduScatterEnabled,
  eduScatterCount,
  autoProgress,
  onSelectBet,
  onStepBet,
  onMaxBet,
  onSpin,
  onStartAutoSpin,
  onStopAutoSpin,
  onEndSession,
  onStartNewSession,
  onBuyScatter,
  onToggleEduScatter,
  onSelectEduScatterCount,
  onToggleSound,
  onToggleFastMode,
  onSkipAnimation,
  onSelectChain,
  onSelectStep,
  onNavigate,
}: SlotStageProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [autoMenuOpen, setAutoMenuOpen] = useState(false);
  const [betMenuOpen, setBetMenuOpen] = useState(false);

  const holdTimerRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef(false);

  const isFreeSpinActive = Boolean(freeSpinState);
  const isAnimating =
    animPhase === 'spinning' ||
    animPhase === 'landing' ||
    animPhase === 'highlighting' ||
    animPhase === 'clearing' ||
    animPhase === 'scatter_celebration' ||
    animPhase === 'free_spin_summary';

  const targetPayout = isFreeSpinActive
    ? freeSpinState!.accumulatedWin
    : animPhase === 'spinning'
    ? 0
    : animPhase === 'settled' && lastSpin
    ? lastSpin.grossPayout
    : activeChain?.grossPayout ?? 0;

  const [displayPayout, setDisplayPayout] = useState(targetPayout);
  const displayPayoutRef = useRef(displayPayout);
  displayPayoutRef.current = displayPayout;
  const [spinTick, setSpinTick] = useState(0);

  const timingProfile = getSpinTimingProfile(fastMode, isFreeSpinActive);

  useEffect(() => {
    if (animPhase !== 'spinning') return;
    const id = window.setInterval(() => {
      setSpinTick((t) => (t + 1) % SPIN_REEL_POOL.length);
    }, timingProfile.reelTickMs);
    return () => window.clearInterval(id);
  }, [animPhase, timingProfile.reelTickMs]);

  useEffect(() => {
    if (!isFreeSpinActive && (targetPayout === 0 || animPhase === 'spinning')) {
      setDisplayPayout(0);
      return;
    }
    if (targetPayout === 0) {
      setDisplayPayout(0);
      return;
    }
    const startVal = isFreeSpinActive ? displayPayoutRef.current : 0;
    const duration = isFreeSpinActive ? 320 : fastMode ? 180 : 420;
    const startTime = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPayout(Number((startVal + (targetPayout - startVal) * eased).toFixed(2)));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [targetPayout, animPhase, fastMode, isFreeSpinActive, lastSpin?.roundId, activeChainIdx]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const stepBaseWin = currentStep?.basePayout ?? 0;
  const hasWinsOnStep = (currentStep?.wins.length ?? 0) > 0;

  const winTier = useMemo(() => {
    if (!lastSpin || lastSpin.grossPayout <= 0) return 'none';
    const ratio = lastSpin.grossPayout / lastSpin.betAmount;
    if (ratio >= 5) return 'mega';
    if (ratio >= 2) return 'big';
    if (ratio >= 1) return 'profit';
    return 'partial';
  }, [lastSpin]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const canInteractSpin =
    session.status === 'active' &&
    !spinning &&
    !autoProgress &&
    selectedBet <= session.currentBalance;

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleSpinPointerDown = () => {
    if (!canInteractSpin) return;
    holdTriggeredRef.current = false;
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      setAutoMenuOpen(true);
    }, 480);
  };

  const handleSpinPointerUp = () => {
    clearHoldTimer();
  };

  const handleSpinClick = () => {
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      return;
    }
    setAutoMenuOpen(false);
    setBetMenuOpen(false);
    onSpin();
  };

  const minAffordableBet = ALLOWED_BETS[0];
  const isMinBet = selectedBet <= minAffordableBet;
  const isMaxAffordableBet =
    selectedBet >=
    ([...ALLOWED_BETS].reverse().find((b) => b <= session.currentBalance) ?? minAffordableBet);

  const sessionEndedReason =
    session.status === 'completed'
      ? 'Batas 100 Putaran Tercapai / Sesi Diakhiri'
      : session.status === 'exhausted'
      ? 'Koin Habis (Di Bawah Taruhan 10)'
      : session.status === 'expired'
      ? 'Waktu Sesi 15 Menit Habis'
      : null;

  const canBuyScatter =
    session.status === 'active' &&
    !spinning &&
    !buyingScatter &&
    !autoProgress &&
    session.currentBalance >= session.buyScatterCost + session.betMin;

  return (
    <section
      aria-label="Arena Mesin Simulasi Slot 6x5"
      className="relative w-full flex-1 flex flex-col justify-between overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_#6E1028_0%,_#3B0614_48%,_#1A0208_100%)] text-amber-50 select-none"
      data-anim-phase={animPhase}
      data-session-status={session.status}
    >
      {/* Subtle decorative crimson-gold backdrop lattice */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.22), transparent 40%), radial-gradient(circle at 80% 25%, rgba(251,191,36,0.18), transparent 38%)',
        }}
      />

      {/* TOP CABINET BAR: Balanced Mobile Header + Desktop Telemetry */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-2.5 sm:px-5 pt-7 sm:pt-2.5 pb-1 shrink-0 space-y-1.5 sm:space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
          {/* Row 1 on mobile (full width, balanced left-center-right); Left cluster on sm+ */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3">
            <div
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-b from-[#450A14] to-[#230309] border-2 border-amber-400/90 pl-1 pr-2.5 sm:pl-1.5 sm:pr-3.5 py-0.5 sm:py-1 shadow-[0_4px_14px_rgba(0,0,0,0.45)] shrink-0"
              title="Sisa Koin Virtual (Simulasi Belajar)"
            >
              <span
                aria-hidden="true"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-700 border border-yellow-100 flex items-center justify-center shadow-inner shrink-0"
              >
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-amber-950/75 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-xs bg-amber-950/80" />
                </span>
              </span>
              <div className="leading-tight">
                <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-300/90 font-semibold whitespace-nowrap">
                  <span className="sm:hidden">Koin Anda</span>
                  <span className="hidden sm:inline">Sisa Koin Virtual</span>
                </div>
                <div
                  className="font-mono tabular-nums text-sm sm:text-lg font-extrabold text-white tracking-tight"
                  data-testid="current-balance"
                >
                  {formatCredit(session.currentBalance)}
                </div>
              </div>
            </div>

            {/* Mobile-only compact multiplier pill centered between Coin & Clock */}
            <div className="sm:hidden px-2.5 py-1 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border border-yellow-100 text-[10px] font-mono tabular-nums font-extrabold text-amber-950 shadow whitespace-nowrap">
              {animPhase === 'spinning'
                ? 'PENGALI ...'
                : `PENGALI ${activeChain?.appliedMultiplier ?? 1}×`}
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-black/35 border border-amber-400/35 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono tabular-nums text-amber-100 shrink-0">
              <Clock size={12} className="text-amber-300 shrink-0" aria-hidden="true" />
              <span>{formatCountdown(remainingSec)}</span>
            </div>
          </div>

          {/* Row 2 on mobile (full-width symmetrical 3-column controls); Right cluster on sm+ */}
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleFastMode}
              disabled={isFreeSpinActive}
              aria-pressed={fastMode}
              className={`min-h-[36px] w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                isFreeSpinActive
                  ? 'bg-fuchsia-700/90 text-yellow-100 border-fuchsia-300 shadow-sm cursor-not-allowed'
                  : fastMode
                  ? 'bg-amber-400 text-amber-950 border-yellow-200 shadow-sm'
                  : 'bg-[#360711]/90 border-amber-400/50 text-amber-100 hover:bg-[#4A0B18]'
              }`}
              title={
                isFreeSpinActive
                  ? 'Mode Free Spin otomatis berjalan pada kecepatan normal (2-2.5 detik)'
                  : 'Ubah kecepatan putaran (Normal 3-4 detik, Cepat 0.5-1.5 detik)'
              }
            >
              <Zap size={12} aria-hidden="true" />
              <span className="sm:hidden">
                {isFreeSpinActive ? 'Free Spin' : fastMode ? 'Cepat' : 'Normal'}
              </span>
              <span className="hidden sm:inline">
                {isFreeSpinActive
                  ? 'Free Spin (2–2.5d)'
                  : fastMode
                  ? 'Cepat (0.5–1.5d)'
                  : 'Normal (3–4d)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={!soundMuted}
              aria-label={soundMuted ? 'Aktifkan Efek Suara' : 'Matikan Efek Suara'}
              className={`min-h-[36px] w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                !soundMuted
                  ? 'bg-[#360711]/90 border-amber-400/50 text-amber-100 hover:bg-[#4A0B18]'
                  : 'bg-black/45 border-amber-500/30 text-amber-200/70 hover:text-amber-100'
              }`}
            >
              {soundMuted ? (
                <VolumeX size={13} aria-hidden="true" />
              ) : (
                <Volume2 size={13} aria-hidden="true" />
              )}
              <span>{soundMuted ? 'Bisu' : 'Suara'}</span>
            </button>

            {session.status === 'active' ? (
              <button
                type="button"
                disabled={ending || (spinning && !autoProgress)}
                onClick={onEndSession}
                className="min-h-[36px] w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full border border-rose-400/50 bg-rose-950/75 hover:bg-rose-900 text-rose-100 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Square size={11} aria-hidden="true" />
                <span>{ending ? 'Akhiri...' : 'Akhiri Sesi'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={creating}
                onClick={onStartNewSession}
                className="min-h-[36px] w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full border border-emerald-300/70 bg-emerald-800/85 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <span>{creating ? 'Menyiapkan...' : 'Sesi Baru'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Strip: Clean symmetrical 4-column strip on mobile (< sm), 4-Wing + Gold Pot on sm+ */}
        <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
          {/* Left Wings (on mobile flows as 2 equal grid columns via contents) */}
          <div className="contents sm:block sm:space-y-1 sm:min-w-0">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 rounded-lg sm:rounded-md bg-gradient-to-b sm:bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] border border-amber-400/75 shadow-inner text-center sm:text-left">
              <span className="text-[9px] sm:text-xs font-display font-semibold sm:font-bold tracking-wide text-amber-200 whitespace-nowrap">
                Putaran
              </span>
              <span
                className="font-mono tabular-nums text-xs sm:text-sm font-bold text-white leading-tight"
                data-testid="paid-spins-count"
              >
                {session.paidSpinsCount}/{session.maxPaidSpins}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 rounded-lg sm:rounded-md bg-gradient-to-b sm:bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] border border-amber-400/75 shadow-inner text-center sm:text-left">
              <span className="text-[9px] sm:text-xs font-display font-semibold sm:font-bold tracking-wide text-sky-100 whitespace-nowrap">
                <span className="sm:hidden">Modal</span>
                <span className="hidden sm:inline">MODAL KELUAR</span>
              </span>
              <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-white leading-tight">
                {formatCredit(session.totalPaidBet)}
              </span>
            </div>
          </div>

          {/* Center Golden Treasure Pot + Live Multiplier (shown on sm+ where there is horizontal room) */}
          <div className="hidden sm:flex flex-col items-center justify-center px-1">
            <GoldPotEmblem />
            <div className="-mt-2 px-2.5 py-0.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border border-yellow-100 text-xs font-mono tabular-nums font-extrabold text-amber-950 shadow whitespace-nowrap">
              {animPhase === 'spinning'
                ? 'PENGALI ...'
                : `PENGALI ${activeChain?.appliedMultiplier ?? 1}×`}
            </div>
          </div>

          {/* Right Wings (on mobile flows as 2 equal grid columns via contents) */}
          <div className="contents sm:block sm:space-y-1 sm:min-w-0">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 rounded-lg sm:rounded-md bg-gradient-to-b sm:bg-gradient-to-l from-[#581C87] to-[#7E22CE] border border-amber-400/75 shadow-inner text-center sm:text-left">
              <span className="text-[9px] sm:text-xs font-display font-semibold sm:font-bold tracking-wide text-fuchsia-100 whitespace-nowrap">
                <span className="sm:hidden">Hadiah</span>
                <span className="hidden sm:inline">HADIAH MASUK</span>
              </span>
              <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-white leading-tight">
                {formatCredit(session.totalGrossPayout)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 rounded-lg sm:rounded-md bg-gradient-to-b sm:bg-gradient-to-l from-[#064E3B] to-[#047857] border border-amber-400/75 shadow-inner text-center sm:text-left">
              <span className="text-[9px] sm:text-xs font-display font-semibold sm:font-bold tracking-wide text-emerald-100 whitespace-nowrap">
                <span className="sm:hidden">Bersih</span>
                <span className="hidden sm:inline">UNTUNG/RUGI</span>
              </span>
              <span
                className={`font-mono tabular-nums text-xs sm:text-sm font-bold leading-tight ${
                  session.netProfitLoss >= 0 ? 'text-amber-200' : 'text-rose-200'
                }`}
              >
                {session.netProfitLoss >= 0 ? '+' : ''}
                {formatCredit(session.netProfitLoss)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Error Alert if any */}
      {error && (
        <div
          role="alert"
          className="relative z-20 max-w-xl mx-auto mt-1 px-4 py-2 rounded-lg bg-rose-950/95 border border-rose-400 text-rose-100 text-xs sm:text-sm text-center"
        >
          {error}
        </div>
      )}

      {/* CENTER STAGE: Flanking Dragon Scrolls + Glowing Golden 6x5 Reel Cabinet + Right-Aligned Edu Panel */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[1560px] mx-auto px-2 sm:px-5 py-1 sm:py-2 [@media(min-width:1024px)_and_(min-height:700px)]:overflow-y-auto no-scrollbar">
        <div className="w-full min-h-full flex flex-col items-center justify-center gap-1.5 sm:gap-3">
          {/* Mobile Quick Controls (< md): Single crisp 3-column bar with comfortable touch height */}
          <div className="md:hidden w-full max-w-[680px] space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="min-h-[40px] px-2 py-1.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg border border-amber-300/80 bg-amber-400/95 text-amber-950 cursor-pointer whitespace-nowrap"
              >
                <Info size={13} aria-hidden="true" />
                <span>Aturan</span>
              </button>

              <button
                type="button"
                disabled={!canBuyScatter}
                onClick={onBuyScatter}
                className="min-h-[40px] px-2 py-1.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg border border-fuchsia-300/75 bg-gradient-to-r from-fuchsia-700 to-purple-800 hover:from-fuchsia-600 hover:to-purple-700 disabled:opacity-40 text-white cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Ticket size={13} aria-hidden="true" />
                <span>
                  Scatter {session.buyScatterCost}
                  {session.scatterTickets > 0 ? ` (${session.scatterTickets})` : ''}
                </span>
              </button>

              <button
                type="button"
                disabled={spinning || Boolean(autoProgress) || session.status !== 'active'}
                onClick={onToggleEduScatter}
                aria-pressed={eduScatterEnabled}
                className={`min-h-[40px] px-2 py-1.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg border cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                  eduScatterEnabled
                    ? 'bg-emerald-600 border-emerald-200 text-white'
                    : 'bg-black/45 border-amber-400/50 text-amber-100'
                }`}
              >
                <GraduationCap size={13} aria-hidden="true" />
                <span>
                  Edu: {eduScatterEnabled ? `${eduScatterCount}★` : 'MATI'}
                </span>
              </button>
            </div>

            {eduScatterEnabled && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-black/40 border border-emerald-400/40 px-2.5 py-1.5 text-[11px]">
                <span className="text-emerald-200 font-medium">Jumlah Bintang Bonus:</span>
                <div className="inline-flex items-center gap-1">
                  {([3, 4, 5] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={spinning || Boolean(autoProgress)}
                      onClick={() => onSelectEduScatterCount(cnt)}
                      className={`min-h-[32px] px-2.5 py-1 text-[11px] font-mono font-bold rounded-md border cursor-pointer ${
                        eduScatterCount === cnt
                          ? 'bg-amber-400 text-amber-950 border-yellow-100'
                          : 'bg-black/45 text-amber-200 border-amber-400/40'
                      }`}
                    >
                      {cnt}★
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-center lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-3 xl:gap-4">
          {/* Left Dragon Crest & Paytable Scroll (Desktop — right-aligned flush against cabinet left edge) */}
          <div className="hidden lg:flex items-center justify-end gap-2 xl:gap-3 min-w-0">
            <div className="hidden xl:block shrink-0">
              <DragonCrestSvg />
            </div>
            <div className="w-24 xl:w-28 shrink-0 rounded-lg bg-gradient-to-b from-[#991B1B] via-[#7F1D1D] to-[#450A0A] border-2 border-amber-400/85 p-2 shadow-xl space-y-1.5">
              <div className="text-center border-b border-amber-400/40 pb-1">
                <div className="text-[10px] font-display font-bold tracking-wider text-amber-200">
                  NILAI 12+
                </div>
              </div>
              {PAY_SCROLL_ITEMS.map((item) => (
                <div
                  key={item.symbol}
                  className="flex flex-col items-center gap-0.5 py-0.5 rounded bg-black/25 border border-amber-400/20"
                >
                  <SymbolGlyph symbol={item.symbol} size={20} />
                  <span className="text-[10px] font-mono tabular-nums font-bold text-amber-200 leading-none">
                    {item.ratio}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Golden-Framed 6x5 Reel Grid (mathematically centered in viewport on lg+) */}
          <div className="w-full max-w-[680px] lg:w-[490px] xl:w-[550px] [@media(min-width:1400px)]:w-[600px] 2xl:w-[630px] [@media(min-width:1024px)_and_(max-height:820px)]:!w-[540px] [@media(min-width:1024px)_and_(max-height:740px)]:!w-[490px] mx-auto rounded-2xl p-1 sm:p-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_18px_48px_rgba(0,0,0,0.7),0_0_32px_rgba(245,158,11,0.28)]">
            <div className="relative rounded-xl bg-gradient-to-b from-[#3A0C06] via-[#240603] to-[#160302] border-2 border-yellow-200/60 p-1.5 sm:p-2 overflow-hidden">
              {/* Celebratory Particle Confetti on Winning Round */}
              {animPhase === 'settled' && lastSpin && lastSpin.grossPayout > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden"
                >
                  {PARTICLE_VECTORS.map((p, idx) => (
                    <span
                      key={idx}
                      className="absolute w-2.5 h-2.5 rounded-full animate-particle-burst"
                      style={
                        {
                          backgroundColor: p.color,
                          boxShadow: `0 0 10px ${p.color}`,
                          '--tx': p.tx,
                          '--ty': p.ty,
                          '--rot': p.rot,
                          animationDelay: p.delay,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}

              {/* Floating Tumble Step Win Callout */}
              {animPhase === 'highlighting' && hasWinsOnStep && stepBaseWin > 0 && (
                <div
                  aria-live="polite"
                  className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center"
                >
                  <div className="animate-win-banner px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 font-display font-extrabold text-sm sm:text-base shadow-[0_8px_24px_rgba(245,158,11,0.75)] border-2 border-white">
                    +{formatCredit(stepBaseWin)} Hadiah Gambar!
                    {currentStep && currentStep.multipliersCollected.length > 0 && (
                      <span className="ml-2 text-rose-800">
                        ({currentStep.multipliersCollected.map((m) => `${m}×`).join('+')})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Festive Scatter Celebration Overlay with Sliced Left-to-Right Banner */}
              {animPhase === 'scatter_celebration' && lastSpin && (
                <div
                  aria-live="polite"
                  className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,_rgba(217,70,239,0.78)_0%,_rgba(88,28,135,0.88)_55%,_rgba(24,4,42,0.92)_100%)] flex flex-col items-center justify-center text-center px-3 overflow-hidden"
                >
                  {/* Festive radial burst confetti */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    {PARTICLE_VECTORS.map((p, idx) => (
                      <span
                        key={idx}
                        className="absolute w-3 h-3 rounded-full animate-particle-burst"
                        style={
                          {
                            backgroundColor: p.color,
                            boxShadow: `0 0 14px ${p.color}`,
                            '--tx': p.tx,
                            '--ty': p.ty,
                            '--rot': p.rot,
                            animationDelay: p.delay,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  {/* Sliced Banner sliding in from the left */}
                  <div className="animate-scatter-slice-in relative w-full max-w-md bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 p-[3px] shadow-[0_14px_45px_rgba(245,158,11,0.75)]">
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#581C87] via-[#9D174D] to-[#B91C1C] px-6 py-5">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-scatter-sheen"
                      />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-yellow-200">
                          <Sparkles size={15} aria-hidden="true" />
                          <span>{lastSpin.initialScatterCount} SCATTER TERKUMPUL!</span>
                          <Sparkles size={15} aria-hidden="true" />
                        </div>
                        <div
                          className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white mt-1 drop-shadow-[0_3px_10px_rgba(0,0,0,0.65)]"
                          data-testid="scatter-free-banner"
                        >
                          FREE {lastSpin.freeSpinsAwarded}× SPIN
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-amber-100 mt-1.5">
                          PUTARAN BONUS GRATIS · TANPA POTONG KOIN
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Festive Free Spin Accumulation Summary Overlay (Sliced Left-to-Right Banner) */}
              {animPhase === 'free_spin_summary' && freeSpinState && (
                <div
                  aria-live="polite"
                  className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.82)_0%,_rgba(120,53,15,0.9)_55%,_rgba(28,10,4,0.94)_100%)] flex flex-col items-center justify-center text-center px-3 overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    {PARTICLE_VECTORS.map((p, idx) => (
                      <span
                        key={idx}
                        className="absolute w-3 h-3 rounded-full animate-particle-burst"
                        style={
                          {
                            backgroundColor: p.color,
                            boxShadow: `0 0 14px ${p.color}`,
                            '--tx': p.tx,
                            '--ty': p.ty,
                            '--rot': p.rot,
                            animationDelay: p.delay,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  {/* Sliced Summary Banner sliding in from the left */}
                  <div className="animate-scatter-slice-in relative w-full max-w-md bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-300 p-[3px] shadow-[0_14px_45px_rgba(245,158,11,0.8)]">
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#7C2D12] via-[#991B1B] to-[#581C87] px-6 py-5">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-scatter-sheen"
                      />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-200">
                          <Sparkles size={15} aria-hidden="true" />
                          <span>AKUMULASI {freeSpinState.total}× FREE SPIN</span>
                          <Sparkles size={15} aria-hidden="true" />
                        </div>
                        <div
                          className="font-display text-3xl sm:text-5xl font-black tracking-tight text-yellow-200 mt-1 drop-shadow-[0_3px_10px_rgba(0,0,0,0.65)] font-mono tabular-nums"
                          data-testid="free-spin-summary-banner"
                        >
                          +{formatCredit(freeSpinState.accumulatedWin)} KOIN
                        </div>
                        <p className="text-[11px] sm:text-xs font-semibold text-amber-100 mt-1.5">
                          {freeSpinState.winningCount} dari {freeSpinState.total} putaran menghasilkan hadiah · Kembali ke mode normal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6-Column x 5-Row Grid */}
              <div
                className="grid grid-cols-6 gap-1 sm:gap-1.5"
                data-testid="slot-grid"
                aria-label="Layar Mesin Slot 6 kolom kali 5 baris"
              >
                {displayedGrid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const displayCell =
                      animPhase === 'spinning'
                        ? {
                            symbol:
                              SPIN_REEL_POOL[
                                (rIdx - spinTick + cIdx * 2 + SPIN_REEL_POOL.length * 4) %
                                  SPIN_REEL_POOL.length
                              ],
                            multiplierValue: 2 as const,
                          }
                        : cell;

                    const meta = CABINET_SYMBOL_META[displayCell.symbol];
                    const isRemoved =
                      animPhase !== 'spinning' && removedKeySet.has(`${rIdx},${cIdx}`);
                    const isActiveMultiplier =
                      animPhase !== 'spinning' &&
                      displayCell.symbol === 'MULTIPLIER' &&
                      hasWinsOnStep;
                    const isScatterGlow =
                      animPhase !== 'spinning' && displayCell.symbol === 'SCATTER';

                    const labelText =
                      displayCell.symbol === 'MULTIPLIER'
                        ? `${meta.label} ${displayCell.multiplierValue ?? 2}x`
                        : meta.label;

                    let motionClass = 'animate-cell-enter';
                    let animDelay = `${cIdx * 20}ms`;
                    if (animPhase === 'spinning') {
                      motionClass = 'animate-reel-spin opacity-90';
                      animDelay = `${cIdx * 35}ms`;
                    } else if (animPhase === 'landing') {
                      motionClass = 'animate-reel-drop';
                      animDelay = `${
                        cIdx * timingProfile.colStopIntervalMs +
                        rIdx * (fastMode && !isFreeSpinActive ? 8 : 18)
                      }ms`;
                    } else if (animPhase === 'clearing' && isRemoved) {
                      motionClass = 'animate-tile-shatter z-10';
                      animDelay = '0ms';
                    } else if (animPhase === 'highlighting' && isRemoved) {
                      motionClass = 'animate-tile-win z-10';
                      animDelay = '0ms';
                    } else if (animPhase === 'highlighting' && isActiveMultiplier) {
                      motionClass = 'animate-multiplier-strike z-10';
                      animDelay = '60ms';
                    }

                    return (
                      <div
                        key={
                          animPhase === 'spinning'
                            ? `spin-${rIdx}-${cIdx}`
                            : `${rIdx}-${cIdx}-${activeChainIdx}-${activeStepIdx}-${lastSpin?.roundId ?? 'init'}`
                        }
                        role="img"
                        aria-label={`Baris ${rIdx + 1} Kolom ${cIdx + 1}: ${labelText}${
                          isRemoved ? ' (menang)' : ''
                        }`}
                        className={`aspect-[10/9] sm:aspect-[5/4] lg:aspect-[11/9] rounded-lg border flex flex-col items-center justify-center p-0.5 sm:p-1 select-none relative transition-shadow ${
                          meta.tileBgClass
                        } ${
                          isRemoved
                            ? 'ring-2 ring-yellow-200 border-amber-200 brightness-120'
                            : isActiveMultiplier
                            ? 'ring-2 ring-orange-300 border-amber-200'
                            : isScatterGlow
                            ? 'border-fuchsia-300'
                            : 'border-amber-500/45'
                        } ${motionClass}`}
                        style={{
                          animationDelay: animDelay,
                          boxShadow: isRemoved
                            ? '0 0 22px rgba(251, 191, 36, 0.85), inset 0 1px 0 rgba(255,255,255,0.28)'
                            : `${meta.glowShadow}, inset 0 1px 0 rgba(254,240,138,0.16)`,
                        }}
                      >
                        <div className="scale-75 sm:scale-100 origin-center">
                          <SymbolGlyph
                            symbol={displayCell.symbol}
                            multiplierValue={displayCell.multiplierValue}
                            size={28}
                          />
                        </div>
                        <span
                          className={`sm:mt-0.5 text-[9px] sm:text-[11px] font-semibold leading-none truncate max-w-full ${meta.textClass}`}
                        >
                          {displayCell.symbol === 'MULTIPLIER'
                            ? `${displayCell.multiplierValue ?? 2}×`
                            : meta.shortLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inner Frame Bottom Telemetry Line + Plain-Language Live Lesson */}
              <div className="mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-amber-400/25 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-1 text-[10px] sm:text-xs font-mono tabular-nums text-amber-200/90">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-sans">
                  <span className="font-mono">TARUHAN: {formatCredit(selectedBet)}</span>
                  <span aria-hidden="true" className="text-amber-500/60">·</span>
                  <span>
                    {sessionEndedReason ? (
                      <span className="text-amber-300 font-semibold">
                        {sessionEndedReason}
                      </span>
                    ) : freeSpinState ? (
                      <span className="text-fuchsia-200 font-semibold font-mono" data-testid="free-spin-progress">
                        FREE SPIN {freeSpinState.current}/{freeSpinState.total} · TOTAL:{' '}
                        {formatCredit(freeSpinState.accumulatedWin)} KOIN
                      </span>
                    ) : autoProgress ? (
                      `OTOMATIS ${autoProgress.done}/${autoProgress.total}`
                    ) : animPhase === 'spinning' ? (
                      'SEDANG MENGOCOK LAYAR...'
                    ) : animPhase === 'settled' && lastSpin ? (
                      lastSpin.grossPayout === 0 ? (
                        <span className="text-rose-200">
                          Zonk (−{formatCredit(lastSpin.betAmount)} koin). Putaran berikutnya tetap diacak dari nol.
                        </span>
                      ) : lastSpin.netResult < 0 ? (
                        <span className="text-amber-300 font-semibold">
                          Menang Palsu! Dapat {formatCredit(lastSpin.grossPayout)}, tapi taruhan {formatCredit(lastSpin.betAmount)} → Tetap rugi {formatCredit(lastSpin.netResult)}
                        </span>
                      ) : (
                        <span className="text-emerald-300 font-semibold">
                          Kebetulan untung +{formatCredit(lastSpin.netResult)} koin (rata-rata jangka panjang tetap −25%).
                        </span>
                      )
                    ) : (
                      'Minimal 8 gambar sama di mana saja = keluar hadiah'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAnimating && !autoProgress && (
                    <button
                      type="button"
                      onClick={onSkipAnimation}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded cursor-pointer whitespace-nowrap"
                    >
                      <FastForward size={12} aria-hidden="true" />
                      <span>Lewati</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct One-Tap Action Bar when Session Ends (so users on mobile/desktop immediately see next steps) */}
              {sessionEndedReason && (
                <div className="mt-2 rounded-xl bg-black/65 border border-amber-300/70 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-amber-100 font-medium">
                    Sesi selesai! Lihat bukti hasilnya sekarang:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('statistik')}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold cursor-pointer"
                    >
                      Lihat Grafik Saya
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('materi')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold cursor-pointer"
                    >
                      Baca Penjelasan
                    </button>
                    <button
                      type="button"
                      disabled={creating}
                      onClick={onStartNewSession}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                    >
                      Coba Ulang
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Simbol Khusus (with Beli Scatter 500) + Edukasi Scatter Panel (left-aligned flush against cabinet right edge) */}
          <div className="hidden lg:flex lg:flex-col xl:flex-row lg:items-start xl:items-center justify-start gap-2 xl:gap-2.5 min-w-0">
            <div className="w-44 xl:w-32 [@media(min-width:1400px)]:w-34 shrink-0 rounded-lg bg-gradient-to-b from-[#991B1B] via-[#7F1D1D] to-[#450A0A] border-2 border-amber-400/85 p-2 shadow-xl space-y-1.5 text-center">
              <div className="border-b border-amber-400/40 pb-1">
                <div className="text-[10px] font-display font-bold tracking-wider text-amber-200">
                  SIMBOL KHUSUS
                </div>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-1.5">
                <div className="flex flex-col items-center gap-0.5 py-1 rounded bg-black/25 border border-amber-400/20">
                  <SymbolGlyph symbol="SCATTER" size={20} />
                  <span className="text-[10px] font-semibold text-fuchsia-200">Scatter</span>
                  <span className="text-[9px] text-amber-200/80">3+ = Gratis</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 py-1 rounded bg-black/25 border border-amber-400/20">
                  <SymbolGlyph symbol="MULTIPLIER" multiplierValue={5} size={20} />
                  <span className="text-[10px] font-semibold text-orange-200">Pengali</span>
                  <span className="text-[9px] text-amber-200/80">2× / 3× / 5×</span>
                </div>
              </div>

              {/* Beli Scatter 500 Koin inside Simbol Khusus */}
              <div className="pt-1 border-t border-amber-400/30 space-y-1">
                <button
                  type="button"
                  disabled={!canBuyScatter}
                  onClick={onBuyScatter}
                  data-testid="buy-scatter-btn"
                  title="Beli 1 Tiket Scatter seharga 500 koin. Spin berikutnya dengan taruhan berapapun pasti memunculkan Scatter & Free Spin."
                  className="w-full py-1.5 px-1.5 rounded-md bg-gradient-to-b from-fuchsia-500 via-purple-600 to-purple-800 hover:from-fuchsia-400 hover:to-purple-700 disabled:opacity-40 border border-fuchsia-200/80 text-white shadow cursor-pointer disabled:cursor-not-allowed flex flex-col items-center leading-tight"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold">
                    <Ticket size={11} aria-hidden="true" />
                    <span>{buyingScatter ? 'MEMBELI...' : 'BELI SCATTER'}</span>
                  </span>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-yellow-200">
                    {formatCredit(session.buyScatterCost)} Koin
                  </span>
                </button>
                {session.scatterTickets > 0 && (
                  <div
                    className="rounded bg-fuchsia-950/90 border border-fuchsia-300/60 px-1 py-0.5 text-[9px] font-semibold text-yellow-200"
                    data-testid="scatter-tickets-badge"
                  >
                    {session.scatterTickets}× Tiket Aktif (Pasti Scatter)
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="w-full py-1 text-[10px] font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded cursor-pointer"
              >
                Rincian
              </button>
            </div>

            <div className="hidden [@media(min-width:1620px)]:block shrink-0">
              <DragonCrestSvg flip />
            </div>

            {/* Educational Scatter Feature */}
            <aside
              aria-label="Fitur Edukasi Scatter"
              className={`w-44 xl:w-44 [@media(min-width:1400px)]:w-46 shrink-0 rounded-xl border-2 p-2 xl:p-2.5 shadow-xl flex flex-col items-end text-right gap-1.5 xl:gap-2 transition-colors ${
                eduScatterEnabled
                  ? 'bg-gradient-to-b from-[#134E4A] via-[#0F172A] to-[#090D16] border-emerald-300/90'
                  : 'bg-gradient-to-b from-[#3B0815] via-[#24040C] to-[#160207] border-amber-400/75'
              }`}
              data-testid="edu-scatter-panel"
            >
              <div className="w-full border-b border-amber-400/30 pb-1 flex flex-col items-end">
                <div className="inline-flex items-center gap-1 text-[10px] font-display font-bold tracking-wider text-amber-200 uppercase">
                  <span>EDUKASI SCATTER</span>
                  <GraduationCap size={13} className="text-amber-300" aria-hidden="true" />
                </div>
                <span className="text-[9px] text-amber-100/75">
                  Mode Belajar Pola Bonus
                </span>
              </div>

              <button
                type="button"
                disabled={spinning || Boolean(autoProgress) || session.status !== 'active'}
                onClick={onToggleEduScatter}
                aria-pressed={eduScatterEnabled}
                data-testid="edu-scatter-toggle"
                className={`w-full py-1.5 px-2.5 rounded-lg border text-right font-display font-bold text-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-all ${
                  eduScatterEnabled
                    ? 'bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-emerald-100 text-white shadow-[0_4px_14px_rgba(16,185,129,0.45)]'
                    : 'bg-black/45 hover:bg-black/65 border-amber-400/50 text-amber-100'
                }`}
              >
                {eduScatterEnabled ? 'AKTIF · Selalu Scatter' : 'MATI · Mode Acak'}
              </button>

              <div className="w-full space-y-1">
                <div className="text-[10px] font-semibold text-amber-200/90">
                  Pilih Jumlah Scatter:
                </div>
                <div className="flex items-center justify-end gap-1">
                  {([3, 4, 5] as const).map((cnt) => {
                    const freeQty = cnt === 3 ? 10 : cnt === 4 ? 12 : 15;
                    const active = eduScatterEnabled && eduScatterCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        disabled={
                          spinning ||
                          Boolean(autoProgress) ||
                          session.status !== 'active'
                        }
                        onClick={() => onSelectEduScatterCount(cnt)}
                        data-testid={`edu-scatter-count-${cnt}`}
                        className={`px-2 py-1 rounded-md border text-right cursor-pointer disabled:opacity-45 transition-colors ${
                          active
                            ? 'bg-amber-400 text-amber-950 border-yellow-100 font-extrabold shadow'
                            : 'bg-black/40 text-amber-100 border-amber-400/40 hover:bg-amber-500/20'
                        }`}
                      >
                        <div className="text-[11px] font-mono leading-none">
                          {cnt}★
                        </div>
                        <div className="text-[8px] font-sans leading-tight opacity-85">
                          {freeQty}×
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] leading-snug text-amber-100/80 hidden xl:block">
                {eduScatterEnabled
                  ? `Tiap Spin memunculkan ${eduScatterCount} Scatter (${
                      eduScatterCount === 3 ? 10 : eduScatterCount === 4 ? 12 : 15
                    }× Free Spin). Klik MATI untuk kembali acak normal.`
                  : 'Aktifkan untuk selalu munculkan Scatter di layar & pelajari hasil Free Spin.'}
              </p>
            </aside>
          </div>
          </div>

          {/* Tablet Structured Action & Edu Deck (768px - 1023px): eliminates dead void & gives real feature cards */}
          <div className="hidden md:grid lg:hidden grid-cols-3 gap-3 w-full max-w-[680px]">
            <div className="rounded-xl bg-[#2A070E]/90 border border-amber-400/60 p-3 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-display font-bold text-amber-200 uppercase tracking-wide">
                  Aturan &amp; Hadiah
                </div>
                <p className="text-[11px] text-amber-100/80 mt-0.5 leading-snug">
                  Minimal 8 gambar sama. Daun &amp; Bulan selalu zonk (42%).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="min-h-[38px] w-full px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Info size={14} aria-hidden="true" />
                <span>Lihat Tabel Hadiah</span>
              </button>
            </div>

            <div className="rounded-xl bg-[#2B0A2B]/90 border border-fuchsia-400/55 p-3 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-display font-bold text-fuchsia-200 uppercase tracking-wide">
                  Beli Bintang Bonus
                </div>
                <p className="text-[11px] text-fuchsia-100/80 mt-0.5 leading-snug">
                  Coba apakah beli bonus {formatCredit(session.buyScatterCost)} koin pasti balik modal.
                </p>
              </div>
              <button
                type="button"
                disabled={!canBuyScatter}
                onClick={onBuyScatter}
                className="min-h-[38px] w-full px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 disabled:opacity-40 text-white cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <Ticket size={14} aria-hidden="true" />
                <span>
                  Beli ({session.buyScatterCost})
                  {session.scatterTickets > 0 ? ` · ${session.scatterTickets}×` : ''}
                </span>
              </button>
            </div>

            <div className="rounded-xl bg-[#18121E]/90 border border-emerald-400/45 p-3 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-display font-bold text-emerald-200 uppercase tracking-wide">
                  Edukasi Scatter
                </span>
                {eduScatterEnabled && (
                  <div className="inline-flex gap-1">
                    {([3, 4, 5] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={spinning || Boolean(autoProgress)}
                        onClick={() => onSelectEduScatterCount(cnt)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer ${
                          eduScatterCount === cnt
                            ? 'bg-amber-400 text-amber-950 border-yellow-100'
                            : 'bg-black/45 text-amber-200 border-amber-400/40'
                        }`}
                      >
                        {cnt}★
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={spinning || Boolean(autoProgress) || session.status !== 'active'}
                onClick={onToggleEduScatter}
                aria-pressed={eduScatterEnabled}
                className={`min-h-[38px] w-full px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer disabled:opacity-40 inline-flex items-center justify-center gap-1.5 ${
                  eduScatterEnabled
                    ? 'bg-emerald-600 border-emerald-200 text-white'
                    : 'bg-black/45 border-amber-400/50 text-amber-100 hover:bg-black/65'
                }`}
              >
                <GraduationCap size={14} aria-hidden="true" />
                <span>{eduScatterEnabled ? `Aktif (${eduScatterCount}★)` : 'Mode Acak (Mati)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM UNIFIED CASINO CONSOLE BAR (2 crisp rows on < md, mathematically centered 3-track grid on md+) */}
      <div className="relative z-20 w-full shrink-0 bg-gradient-to-b from-[#5E111D] via-[#37080F] to-[#1D0307] border-t-2 border-amber-400/85 shadow-[0_-8px_28px_rgba(0,0,0,0.55)]">
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-5 py-1.5 sm:py-2 flex flex-wrap md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-1.5 sm:gap-2 lg:gap-3">
          {/* Win Display (+ mobile [i] button on Row 1) */}
          <div className="order-first md:order-none md:justify-self-center w-full md:w-[230px] lg:w-[270px] xl:w-[310px] flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setAutoMenuOpen(false);
                setBetMenuOpen(false);
                setInfoOpen(true);
              }}
              aria-label="Buka rincian langkah putaran, tabel hadiah, dan catatan"
              className="md:hidden w-11 h-11 rounded-xl bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 hover:from-amber-100 hover:to-amber-500 border-2 border-yellow-100 text-amber-950 flex items-center justify-center shadow-md cursor-pointer shrink-0"
            >
              <Info size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>

            <div className="flex-1 min-w-0 rounded-xl bg-gradient-to-b from-[#4C1D57] via-[#320D3B] to-[#1D0623] border-2 border-amber-400/85 px-3 sm:px-4 py-1 text-center shadow-inner">
              <div className="text-[9px] sm:text-[10px] font-display font-bold tracking-widest text-amber-300 leading-none truncate">
                {freeSpinState
                  ? `FREE SPIN (${freeSpinState.current}/${freeSpinState.total})`
                  : animPhase === 'spinning'
                  ? 'MENGOCOK...'
                  : 'HADIAH PUTARAN'}
              </div>
              <div
                className={`font-mono tabular-nums text-base sm:text-xl lg:text-2xl font-extrabold leading-tight mt-0.5 ${
                  displayPayout > 0 ? 'text-yellow-300' : 'text-amber-100/80'
                }`}
                data-testid="win-display"
              >
                {!freeSpinState && animPhase === 'spinning' ? '...' : formatCredit(displayPayout)}
              </div>
            </div>
          </div>

          {/* Left Group (on md+ moves to order-first): [i] Info Button + Unified Bet Selector (- | TARUHAN | +) */}
          <div className="md:order-first md:justify-self-start flex items-center gap-1.5 sm:gap-2 relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setAutoMenuOpen(false);
                setBetMenuOpen(false);
                setInfoOpen(true);
              }}
              aria-label="Buka rincian langkah putaran, tabel hadiah, dan catatan"
              className="hidden md:flex w-11 h-11 lg:h-12 rounded-xl bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 hover:from-amber-100 hover:to-amber-500 border-2 border-yellow-100 text-amber-950 items-center justify-center shadow-md cursor-pointer shrink-0"
            >
              <Info size={19} strokeWidth={2.5} aria-hidden="true" />
            </button>

            {/* Unified Bet Selector Box */}
            <div
              className="relative flex items-center rounded-xl bg-[#24060A] border-2 border-amber-400/85 p-0.5 shadow-inner"
              role="group"
              aria-label="Kontrol pilih taruhan"
            >
              <button
                type="button"
                disabled={
                  session.status !== 'active' ||
                  spinning ||
                  Boolean(autoProgress) ||
                  isMinBet
                }
                onClick={() => onStepBet(-1)}
                aria-label="Kurangi taruhan"
                className="w-8 h-10 sm:w-9 sm:h-10 lg:w-10 lg:h-11 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 disabled:opacity-35 text-amber-950 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Minus size={15} strokeWidth={2.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                disabled={session.status !== 'active' || spinning || Boolean(autoProgress)}
                onClick={() => {
                  setAutoMenuOpen(false);
                  setBetMenuOpen((v) => !v);
                }}
                aria-expanded={betMenuOpen}
                aria-label={`Pilih nominal taruhan, saat ini ${selectedBet} koin`}
                className="px-1.5 sm:px-2.5 lg:px-3.5 py-0.5 text-center cursor-pointer hover:bg-white/5 rounded-md transition-colors min-w-[54px] sm:min-w-[78px] lg:min-w-[100px]"
              >
                <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-display font-bold tracking-wider text-amber-300 leading-none">
                  TARUHAN
                </div>
                <div
                  className="font-mono tabular-nums text-xs sm:text-base lg:text-lg font-extrabold text-white mt-0.5 leading-tight"
                  data-testid="selected-bet-value"
                >
                  {formatCredit(selectedBet)}
                </div>
              </button>

              <button
                type="button"
                disabled={
                  session.status !== 'active' ||
                  spinning ||
                  Boolean(autoProgress) ||
                  isMaxAffordableBet
                }
                onClick={() => onStepBet(1)}
                aria-label="Tambah taruhan"
                className="w-8 h-10 sm:w-9 sm:h-10 lg:w-10 lg:h-11 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 disabled:opacity-35 text-amber-950 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Plus size={15} strokeWidth={2.8} aria-hidden="true" />
              </button>

              {/* Quick 10..100 Bet Picker Popover */}
              {betMenuOpen && (
                <div
                  role="dialog"
                  aria-label="Pilih nominal taruhan cepat"
                  className="absolute bottom-full left-0 mb-2 w-64 max-w-[calc(100vw-1rem)] rounded-xl bg-[#2A070D] border-2 border-amber-400 p-2.5 shadow-2xl z-30"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200 mb-2">
                    <span>Pilih Taruhan (10–100)</span>
                    <button
                      type="button"
                      onClick={() => setBetMenuOpen(false)}
                      aria-label="Tutup pilihan taruhan"
                      className="text-amber-300 hover:text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ALLOWED_BETS.map((bet) => {
                      const active = selectedBet === bet;
                      const disabled =
                        bet > session.currentBalance || session.status !== 'active';
                      return (
                        <button
                          key={bet}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            onSelectBet(bet);
                            setBetMenuOpen(false);
                          }}
                          className={`py-2 rounded-lg text-xs font-mono tabular-nums font-bold border cursor-pointer disabled:opacity-35 ${
                            active
                              ? 'bg-amber-400 text-amber-950 border-yellow-100'
                              : 'bg-black/40 text-amber-100 border-amber-500/40 hover:bg-amber-500/20'
                          }`}
                        >
                          {bet}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Group: MAX + AUTO + Big Green SPIN (stays strictly single-row next to bet box even on 360px) */}
          <div className="md:justify-self-end flex items-center gap-1 sm:gap-1.5 lg:gap-2 relative flex-1 md:flex-initial justify-end">
            <button
              type="button"
              disabled={
                session.status !== 'active' ||
                spinning ||
                Boolean(autoProgress) ||
                session.currentBalance < minAffordableBet
              }
              onClick={() => {
                setAutoMenuOpen(false);
                setBetMenuOpen(false);
                onMaxBet();
              }}
              className="h-11 lg:h-12 px-2 sm:px-3 rounded-xl bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A] to-[#D97706] hover:from-white hover:to-amber-500 disabled:opacity-40 border-2 border-amber-200 text-amber-950 font-display font-extrabold text-[10px] sm:text-xs leading-tight shadow-md cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              MAX
            </button>

            {!autoProgress && (
              <button
                type="button"
                disabled={
                  session.status !== 'active' ||
                  spinning ||
                  selectedBet > session.currentBalance
                }
                onClick={() => {
                  setBetMenuOpen(false);
                  setAutoMenuOpen((v) => !v);
                }}
                aria-expanded={autoMenuOpen}
                aria-label="Pilih putaran otomatis 10 sampai 50 kali"
                className="h-11 lg:h-12 px-2 sm:px-3 rounded-xl bg-[#2A0810] hover:bg-[#3F0D18] disabled:opacity-40 border-2 border-amber-400/80 text-amber-200 font-display font-bold text-[10px] sm:text-xs inline-flex items-center gap-1 shadow-md cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <Repeat size={13} aria-hidden="true" />
                <span>AUTO</span>
              </button>
            )}

            {/* Auto-Spin Popover (triggered by holding SPIN or clicking AUTO) */}
            {autoMenuOpen && !autoProgress && (
              <div
                role="dialog"
                aria-label="Pilih jumlah putaran otomatis"
                className="absolute bottom-full right-0 mb-2 w-64 max-w-[calc(100vw-1rem)] rounded-xl bg-[#2A070D] border-2 border-amber-400 p-3 shadow-2xl z-30 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-amber-200">
                  <span>Putar Otomatis</span>
                  <button
                    type="button"
                    onClick={() => setAutoMenuOpen(false)}
                    aria-label="Tutup menu putar otomatis"
                    className="text-amber-300 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {AUTO_SPIN_COUNTS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setAutoMenuOpen(false);
                        onStartAutoSpin(cnt);
                      }}
                      className={`py-2 rounded-lg text-xs font-mono tabular-nums font-bold border cursor-pointer transition-colors ${
                        selectedAutoCount === cnt
                          ? 'bg-emerald-500 text-white border-emerald-200'
                          : 'bg-black/45 text-amber-100 border-amber-400/45 hover:bg-emerald-700/60'
                      }`}
                    >
                      {cnt}×
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-amber-200/80 leading-snug">
                  Pilih jumlah putaran. Otomatis berhenti jika koin habis atau mencapai 100 putaran.
                </p>
              </div>
            )}

            {autoProgress ? (
              <button
                type="button"
                onClick={onStopAutoSpin}
                className="h-11 lg:h-12 flex-1 md:flex-initial min-w-[78px] sm:min-w-[118px] lg:min-w-[156px] px-2.5 sm:px-4 rounded-xl bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 hover:from-rose-400 hover:to-rose-700 border-2 border-rose-200 text-white shadow-[0_6px_18px_rgba(225,29,72,0.5)] cursor-pointer flex flex-col items-center justify-center whitespace-nowrap"
              >
                <span className="font-display font-extrabold text-xs sm:text-base leading-none">
                  STOP
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono tabular-nums font-semibold text-rose-100 mt-0.5 leading-none">
                  AUTO {autoProgress.done}/{autoProgress.total}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!canInteractSpin}
                onPointerDown={handleSpinPointerDown}
                onPointerUp={handleSpinPointerUp}
                onPointerLeave={handleSpinPointerUp}
                onPointerCancel={handleSpinPointerUp}
                onClick={handleSpinClick}
                className="h-11 lg:h-12 flex-1 md:flex-initial min-w-[78px] sm:min-w-[118px] lg:min-w-[156px] px-2.5 sm:px-4 rounded-xl bg-gradient-to-b from-lime-300 via-emerald-500 to-green-700 hover:from-lime-200 hover:to-green-600 disabled:opacity-45 border-2 border-lime-100 text-white shadow-[0_6px_20px_rgba(22,163,74,0.55)] cursor-pointer disabled:cursor-not-allowed flex flex-col items-center justify-center whitespace-nowrap active:translate-y-0.5 transition-transform"
              >
                <span
                  className="font-display font-extrabold text-sm sm:text-base lg:text-lg tracking-wide leading-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                >
                  {spinning ? 'MUTAR...' : 'SPIN'}
                </span>
                <span className="hidden lg:block text-[9px] font-semibold tracking-wider text-lime-50/95 mt-0.5 leading-none">
                  {spinning ? 'HARAP TUNGGU' : 'TAHAN UNTUK OTOMATIS'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EDUCATIONAL BREAKDOWN & HISTORY DRAWER (Opened via [ i ] button) */}
      {infoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rincian Putaran dan Cara Kerja Mesin"
          className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Rincian Langkah & Catatan Putaran
                </h2>
                <p className="text-xs text-slate-500">
                  Mesin 6×5 ({session.configVersion}) · Semua koin 100% virtual
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                aria-label="Tutup rincian"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-950 space-y-1 leading-relaxed">
              <div className="font-semibold">Aturan Gampang Mesin Ini:</div>
              <p>
                Harus terkumpul minimal <strong>8 gambar sama</strong> di layar untuk keluar hadiah.
                Gambar <strong>Daun &amp; Bulan</strong> itu zonk (tidak ada hadiah, peluangnya 42%).
                Hadiah 12+ gambar: Crown 3,2× · Gem 1,92× · Bell 1,28× · Cherry 0,8× taruhan.
              </p>
            </div>

            {lastSpin && activeChain ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium text-slate-600">
                    Putaran #{lastSpin.roundNumber} · Taruhan{' '}
                    <strong className="font-mono">{formatCredit(lastSpin.betAmount)}</strong> ·
                    Hadiah{' '}
                    <strong className="font-mono">{formatCredit(lastSpin.grossPayout)}</strong>
                  </div>
                  {lastSpin.freeSpinsAwarded > 0 && (
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => onSelectChain(0)}
                        className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${
                          activeChainIdx === 0 ? 'bg-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Utama
                      </button>
                      {lastSpin.freeSpinChains.map((fs) => (
                        <button
                          key={fs.chainIndex}
                          type="button"
                          onClick={() => onSelectChain(fs.chainIndex)}
                          className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${
                            activeChainIdx === fs.chainIndex
                              ? 'bg-white shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Gratis #{fs.chainIndex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeChain.tumbleLog.map((step, idx) => (
                    <button
                      key={step.evaluationIndex}
                      type="button"
                      onClick={() => onSelectStep(idx)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                        activeStepIdx === idx
                          ? 'bg-sky-800 text-white border-sky-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {idx === 0 ? 'Layar Awal' : `Runtuh ${idx}`}
                    </button>
                  ))}
                </div>

                {currentStep && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm space-y-2">
                    {currentStep.wins.length === 0 ? (
                      <p className="text-slate-600">
                        Tidak ada gambar sejenis yang terkumpul minimal 8 buah pada layar ini.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-slate-700">
                        {currentStep.wins.map((w) => (
                          <li key={w.symbol} className="flex justify-between gap-2">
                            <span>
                              {SYMBOL_META[w.symbol].shortLabel}: {w.naturalCount} asli
                              {w.wildsAssigned > 0 ? ` + ${w.wildsAssigned} Wild` : ''} ={' '}
                              <strong>{w.effectiveCount}</strong>
                            </span>
                            <span className="font-mono tabular-nums font-semibold">
                              +{formatCredit(w.basePayout)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="border-t border-slate-200 pt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                      <span>
                        Awal: <strong className="font-mono">{formatCredit(activeChain.basePayout)}</strong>
                      </span>
                      <span>
                        Pengali: <strong className="font-mono">{activeChain.appliedMultiplier}×</strong>
                      </span>
                      <span>
                        Total: <strong className="font-mono">{formatCredit(activeChain.grossPayout)}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {lastSpin.grossPayout > 0 && lastSpin.netResult < 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-xs text-amber-950">
                    <strong>Dapat Hadiah Belum Tentu Untung:</strong> Anda mendapat hadiah{' '}
                    <span className="font-mono font-semibold">
                      {formatCredit(lastSpin.grossPayout)}
                    </span>{' '}
                    koin, tapi karena taruhan{' '}
                    <span className="font-mono font-semibold">
                      {formatCredit(lastSpin.betAmount)}
                    </span>{' '}
                    koin, hasil bersihnya tetap{' '}
                    <span className="font-mono font-semibold">
                      {formatCredit(lastSpin.netResult)}
                    </span>{' '}
                    koin.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600">
                Belum ada putaran. Tekan <strong>SPIN</strong> di bawah untuk memutar gulungan
                6×5, atau tahan tombol <strong>SPIN</strong> (atau klik <strong>AUTO</strong>) untuk
                memulai putaran otomatis 10–50×.
              </p>
            )}

            {/* Recent rounds */}
            <div className="space-y-2">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Catatan Putaran Terakhir
              </h3>
              {recentRounds.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada riwayat putaran.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-500 text-left">
                        <th className="py-2 px-3 font-medium">#</th>
                        <th className="py-2 px-3 font-medium">Taruhan</th>
                        <th className="py-2 px-3 font-medium">Hadiah</th>
                        <th className="py-2 px-3 font-medium text-right">Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {recentRounds.map((r) => (
                        <tr key={r.roundId}>
                          <td className="py-1.5 px-3 text-slate-500">#{r.roundNumber}</td>
                          <td className="py-1.5 px-3 text-slate-700">
                            {formatCredit(r.betAmount)}
                          </td>
                          <td className="py-1.5 px-3 text-slate-900">
                            {formatCredit(r.grossPayout)}
                          </td>
                          <td
                            className={`py-1.5 px-3 text-right font-semibold ${
                              r.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {r.netResult >= 0 ? '+' : ''}
                            {formatCredit(r.netResult)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    onNavigate('statistik');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg cursor-pointer"
                >
                  <span>Lihat Grafik Statistik</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInfoOpen(false);
                    onNavigate('algoritma');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cara Kerja Mesin
                </button>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Kembali ke Mesin
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
