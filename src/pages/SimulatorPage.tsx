import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  apiFetch,
  ApiClientError,
  type PageRoute,
  type RoundSummaryDto,
  type SimulationSessionDto,
  type SpinResponseDto,
} from '../types/api.ts';
import {
  SlotStage,
  type FreeSpinPlaybackState,
  type SpinAnimPhase,
} from '../components/SlotStage.tsx';
import { SymbolGlyph } from '../components/SymbolIcon.tsx';
import type { GridMatrix, TumbleStepLog } from '../engine/gameEngine.ts';
import { ALLOWED_BETS } from '../engine/config.ts';
import { slotAudio } from '../utils/slotAudio.ts';
import {
  accumulateFreeSpinPayouts,
  FREE_SPIN_TIMING,
  getMaxAffordableBet,
  getSpinTimingProfile,
  stepAllowedBet,
} from '../utils/simulatorControls.ts';

interface SimulatorPageProps {
  session: SimulationSessionDto | null;
  ensureAnonymousSession: () => Promise<void>;
  onSessionChange: (session: SimulationSessionDto | null) => void;
  onNavigate: (page: PageRoute) => void;
  autostart?: boolean;
}

const DEFAULT_PREVIEW_GRID: GridMatrix = [
  [
    { symbol: 'CHERRY' },
    { symbol: 'LEAF' },
    { symbol: 'BELL' },
    { symbol: 'MOON' },
    { symbol: 'GEM' },
    { symbol: 'LEAF' },
  ],
  [
    { symbol: 'MOON' },
    { symbol: 'CROWN' },
    { symbol: 'LEAF' },
    { symbol: 'CHERRY' },
    { symbol: 'MOON' },
    { symbol: 'BELL' },
  ],
  [
    { symbol: 'LEAF' },
    { symbol: 'GEM' },
    { symbol: 'WILD' },
    { symbol: 'MOON' },
    { symbol: 'CHERRY' },
    { symbol: 'SCATTER' },
  ],
  [
    { symbol: 'BELL' },
    { symbol: 'MOON' },
    { symbol: 'LEAF' },
    { symbol: 'MULTIPLIER', multiplierValue: 2 },
    { symbol: 'CROWN' },
    { symbol: 'LEAF' },
  ],
  [
    { symbol: 'LEAF' },
    { symbol: 'CHERRY' },
    { symbol: 'MOON' },
    { symbol: 'BELL' },
    { symbol: 'LEAF' },
    { symbol: 'GEM' },
  ],
];

export function SimulatorPage({
  session,
  ensureAnonymousSession,
  onSessionChange,
  onNavigate,
  autostart,
}: SimulatorPageProps) {
  const [selectedBet, setSelectedBet] = useState<number>(20);
  const [selectedAutoCount, setSelectedAutoCount] = useState<number>(10);
  const [spinning, setSpinning] = useState(false);
  const [autoProgress, setAutoProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSpin, setLastSpin] = useState<SpinResponseDto | null>(null);
  const [recentRounds, setRecentRounds] = useState<RoundSummaryDto[]>([]);
  const [activeChainIdx, setActiveChainIdx] = useState<number>(0);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [animPhase, setAnimPhase] = useState<SpinAnimPhase>('idle');
  const [freeSpinState, setFreeSpinState] = useState<FreeSpinPlaybackState | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => slotAudio.isMuted());
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [buyingScatter, setBuyingScatter] = useState<boolean>(false);
  const [eduScatterEnabled, setEduScatterEnabled] = useState<boolean>(false);
  const [eduScatterCount, setEduScatterCount] = useState<3 | 4 | 5>(3);
  const [remainingSec, setRemainingSec] = useState<number>(
    session?.remainingSeconds ?? 900
  );

  const autoStartTriggeredRef = useRef(false);
  const playbackIdRef = useRef(0);
  const skipAnimRef = useRef(false);
  const autoStopRequestedRef = useRef(false);
  const fastModeRef = useRef(fastMode);
  const eduScatterEnabledRef = useRef(eduScatterEnabled);
  const eduScatterCountRef = useRef(eduScatterCount);

  useEffect(() => {
    fastModeRef.current = fastMode;
  }, [fastMode]);

  useEffect(() => {
    eduScatterEnabledRef.current = eduScatterEnabled;
  }, [eduScatterEnabled]);

  useEffect(() => {
    eduScatterCountRef.current = eduScatterCount;
  }, [eduScatterCount]);

  useEffect(() => {
    return () => {
      playbackIdRef.current += 1;
      autoStopRequestedRef.current = true;
      slotAudio.stopSpinLoop();
    };
  }, []);

  // Sync remaining countdown from active session
  useEffect(() => {
    if (!session) return;
    setRemainingSec(session.remainingSeconds);
    if (session.status !== 'active') return;

    const timer = window.setInterval(() => {
      setRemainingSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.status, session?.remainingSeconds]);

  // Fetch recent rounds when session changes
  useEffect(() => {
    if (!session) {
      setRecentRounds([]);
      return;
    }
    apiFetch<{ total: number; rounds: RoundSummaryDto[] }>(
      `/api/v1/simulation-sessions/${session.id}/rounds?limit=8`
    )
      .then((res) => setRecentRounds(res.rounds))
      .catch(() => {
        // ignore secondary load error
      });
  }, [session?.id, session?.paidSpinsCount]);

  // Adjust selected bet if balance falls below current bet
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    if (selectedBet > session.currentBalance) {
      const affordable = [...ALLOWED_BETS]
        .reverse()
        .find((b) => b <= session.currentBalance);
      if (affordable) setSelectedBet(affordable);
    }
  }, [session?.currentBalance, session?.status, selectedBet]);

  const handleToggleSound = () => {
    const next = !soundMuted;
    slotAudio.setMuted(next);
    setSoundMuted(next);
  };

  const handleToggleFastMode = () => {
    setFastMode((prev) => !prev);
  };

  const handleSkipAnimation = () => {
    skipAnimRef.current = true;
    slotAudio.stopSpinLoop();
    setFreeSpinState(null);
  };

  const handleStartSession = async () => {
    playbackIdRef.current += 1;
    autoStopRequestedRef.current = true;
    setAutoProgress(null);
    setFreeSpinState(null);
    setCreating(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      const created = await apiFetch<SimulationSessionDto>(
        '/api/v1/simulation-sessions',
        { method: 'POST', body: JSON.stringify({}) }
      );
      setLastSpin(null);
      setActiveChainIdx(0);
      setActiveStepIdx(0);
      setAnimPhase('idle');
      onSessionChange(created);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'ACTIVE_SESSION_EXISTS') {
        const state = await apiFetch<{ simulationSession: SimulationSessionDto | null }>(
          '/api/v1/session-state'
        );
        if (state.simulationSession) {
          onSessionChange(state.simulationSession);
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'Gagal membuat sesi simulasi baru.'
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // Support ?autostart=1 for automated testability
  useEffect(() => {
    if (
      autostart &&
      !session &&
      !creating &&
      !autoStartTriggeredRef.current
    ) {
      autoStartTriggeredRef.current = true;
      void handleStartSession();
    }
  }, [autostart, session, creating]);

  const waitAnimated = async (ms: number, runId: number): Promise<boolean> => {
    const stepMs = 40;
    let elapsed = 0;
    while (elapsed < ms) {
      if (playbackIdRef.current !== runId || skipAnimRef.current) {
        return false;
      }
      await new Promise((r) => setTimeout(r, Math.min(stepMs, ms - elapsed)));
      elapsed += stepMs;
    }
    return playbackIdRef.current === runId && !skipAnimRef.current;
  };

  const playChainSequence = async (
    chainIdx: number,
    steps: TumbleStepLog[],
    runId: number,
    isFreeSpin = false
  ) => {
    if (playbackIdRef.current !== runId || skipAnimRef.current) return;
    const timing = getSpinTimingProfile(fastModeRef.current, isFreeSpin);

    setActiveChainIdx(chainIdx);
    setActiveStepIdx(0);
    setAnimPhase('landing');

    for (let c = 0; c < 6; c++) {
      window.setTimeout(() => {
        if (playbackIdRef.current === runId && !skipAnimRef.current) {
          slotAudio.playReelStop(c);
        }
      }, c * timing.colStopIntervalMs);
    }

    const landed = await waitAnimated(timing.initialLandingMs, runId);
    if (!landed) return;

    for (let s = 0; s < steps.length; s++) {
      if (playbackIdRef.current !== runId || skipAnimRef.current) return;
      const step = steps[s];
      setActiveStepIdx(s);

      if (s > 0) {
        setAnimPhase('landing');
        const dropOk = await waitAnimated(timing.tumbleLandingMs, runId);
        if (!dropOk) return;
      }

      if (step.wins.length > 0) {
        setAnimPhase('highlighting');
        slotAudio.playWinCluster(s);
        if (step.multipliersCollected.length > 0) {
          slotAudio.playMultiplierHit(Math.max(...step.multipliersCollected));
        }

        const highlightOk = await waitAnimated(timing.highlightMs, runId);
        if (!highlightOk) return;

        if (s + 1 < steps.length) {
          setAnimPhase('clearing');
          const clearOk = await waitAnimated(timing.clearMs, runId);
          if (!clearOk) return;
        }
      }
    }
  };

  const executeSingleSpin = async (
    sessionId: string,
    betAmount: number
  ): Promise<{ ok: boolean; refreshed: SimulationSessionDto | null }> => {
    const runId = ++playbackIdRef.current;
    skipAnimRef.current = false;

    const timing = getSpinTimingProfile(fastModeRef.current);

    setSpinning(true);
    setError(null);
    setAnimPhase('spinning');
    slotAudio.playSpinStart();
    slotAudio.startSpinLoop(fastModeRef.current);

    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `spin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const spinPayload: Record<string, unknown> = { bet_amount: betAmount };
      if (eduScatterEnabledRef.current) {
        spinPayload.demo_scatter_count = eduScatterCountRef.current;
      }

      const [result] = await Promise.all([
        apiFetch<SpinResponseDto>(
          `/api/v1/simulation-sessions/${sessionId}/spins`,
          {
            method: 'POST',
            headers: {
              'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(spinPayload),
          }
        ),
        waitAnimated(timing.minSpinMs, runId),
      ]);

      slotAudio.stopSpinLoop();

      if (playbackIdRef.current !== runId) {
        return { ok: false, refreshed: null };
      }
      setLastSpin(result);

      if (!skipAnimRef.current) {
        await playChainSequence(0, result.tumbleLog, runId);
      }

      if (
        result.freeSpinsAwarded > 0 &&
        result.freeSpinChains.length > 0 &&
        playbackIdRef.current === runId &&
        !skipAnimRef.current
      ) {
        const currentTiming = getSpinTimingProfile(fastModeRef.current);
        setAnimPhase('scatter_celebration');
        slotAudio.playScatterTrigger();
        const celebrated = await waitAnimated(
          currentTiming.scatterCelebrationMs,
          runId
        );
        if (celebrated) {
          const fsPayouts: number[] = [];
          const totalFreeSpins = result.freeSpinChains.length;
          setFreeSpinState({
            current: 0,
            total: totalFreeSpins,
            payouts: [],
            accumulatedWin: 0,
            winningCount: 0,
          });

          for (const fs of result.freeSpinChains) {
            if (playbackIdRef.current !== runId || skipAnimRef.current) break;

            setFreeSpinState((prev) =>
              prev ? { ...prev, current: fs.chainIndex } : null
            );
            setAnimPhase('spinning');
            slotAudio.playSpinStart();
            slotAudio.startFreeSpinLoop();

            const spun = await waitAnimated(FREE_SPIN_TIMING.minSpinMs, runId);
            slotAudio.stopSpinLoop();
            if (!spun) break;

            await playChainSequence(fs.chainIndex, fs.tumbleLog, runId, true);
            if (playbackIdRef.current !== runId || skipAnimRef.current) break;

            fsPayouts.push(fs.grossPayout);
            const acc = accumulateFreeSpinPayouts(fsPayouts);
            setFreeSpinState({
              current: fs.chainIndex,
              total: totalFreeSpins,
              payouts: acc.payouts,
              accumulatedWin: acc.total,
              winningCount: acc.winningCount,
            });

            const postPauseMs =
              fs.grossPayout > 0 ? 220 : FREE_SPIN_TIMING.autoInterSpinPauseMs;
            const paused = await waitAnimated(postPauseMs, runId);
            if (!paused) break;
          }

          if (playbackIdRef.current === runId && !skipAnimRef.current) {
            setAnimPhase('free_spin_summary');
            slotAudio.playFreeSpinSummaryFanfare();
            await waitAnimated(FREE_SPIN_TIMING.freeSpinSummaryMs, runId);
          }

          if (playbackIdRef.current === runId) {
            setFreeSpinState(null);
          }
        }
      }

      if (playbackIdRef.current !== runId) {
        return { ok: false, refreshed: null };
      }

      if (skipAnimRef.current) {
        setActiveChainIdx(0);
        setActiveStepIdx(Math.max(0, result.tumbleLog.length - 1));
      } else if (result.freeSpinChains.length > 0) {
        setActiveChainIdx(0);
        setActiveStepIdx(0);
      }

      setAnimPhase('settled');
      if (result.grossPayout >= result.betAmount * 2) {
        slotAudio.playBigWin();
      } else if (result.grossPayout === 0) {
        slotAudio.playRoundLoss();
      }

      const refreshed = await apiFetch<SimulationSessionDto>(
        `/api/v1/simulation-sessions/${sessionId}`
      );
      if (playbackIdRef.current === runId) {
        onSessionChange(refreshed);
      }
      return { ok: true, refreshed };
    } catch (err) {
      slotAudio.stopSpinLoop();
      setFreeSpinState(null);
      setAnimPhase('idle');
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (
          err.code === 'SESSION_NOT_ACTIVE' ||
          err.code === 'SPIN_LIMIT_REACHED' ||
          err.code === 'INSUFFICIENT_BALANCE'
        ) {
          const refreshed = await apiFetch<SimulationSessionDto>(
            `/api/v1/simulation-sessions/${sessionId}`
          ).catch(() => null);
          if (refreshed) onSessionChange(refreshed);
        }
      } else {
        setError('Gagal memproses putaran simulasi.');
      }
      return { ok: false, refreshed: null };
    } finally {
      if (playbackIdRef.current === runId) {
        slotAudio.stopSpinLoop();
        setFreeSpinState(null);
        setSpinning(false);
      }
    }
  };

  const handleSpin = async () => {
    if (!session || session.status !== 'active' || spinning || autoProgress) return;
    await executeSingleSpin(session.id, selectedBet);
  };

  const handleStartAutoSpin = async (count: number) => {
    if (!session || session.status !== 'active' || spinning || autoProgress) return;
    if (selectedBet > session.currentBalance) return;

    setSelectedAutoCount(count);
    autoStopRequestedRef.current = false;
    const betToUse = selectedBet;
    const sessionId = session.id;

    setAutoProgress({ done: 0, total: count });

    for (let i = 1; i <= count; i++) {
      if (autoStopRequestedRef.current) break;
      setAutoProgress({ done: i, total: count });

      const { ok, refreshed } = await executeSingleSpin(sessionId, betToUse);
      if (!ok || !refreshed) break;
      if (
        refreshed.status !== 'active' ||
        refreshed.currentBalance < betToUse ||
        refreshed.paidSpinsCount >= refreshed.maxPaidSpins
      ) {
        break;
      }

      if (i < count && !autoStopRequestedRef.current) {
        const pauseMs = getSpinTimingProfile(fastModeRef.current).autoInterSpinPauseMs;
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    }

    setAutoProgress(null);
    autoStopRequestedRef.current = false;
  };

  const handleStopAutoSpin = () => {
    autoStopRequestedRef.current = true;
  };

  const handleEndSession = async () => {
    if (!session || session.status !== 'active' || ending) return;
    autoStopRequestedRef.current = true;
    setAutoProgress(null);
    setFreeSpinState(null);
    playbackIdRef.current += 1;
    slotAudio.stopSpinLoop();
    setEnding(true);
    setError(null);
    try {
      const ended = await apiFetch<SimulationSessionDto>(
        `/api/v1/simulation-sessions/${session.id}/end`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      onSessionChange(ended);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengakhiri sesi simulasi.'
      );
    } finally {
      setEnding(false);
    }
  };

  const handleStepBet = (direction: -1 | 1) => {
    if (!session) return;
    setSelectedBet((prev) =>
      stepAllowedBet(prev, direction, session.currentBalance)
    );
  };

  const handleMaxBet = () => {
    if (!session) return;
    setSelectedBet(getMaxAffordableBet(session.currentBalance));
  };

  const handleBuyScatter = async () => {
    if (!session || session.status !== 'active' || spinning || buyingScatter || autoProgress) {
      return;
    }
    setBuyingScatter(true);
    setError(null);
    try {
      const updated = await apiFetch<SimulationSessionDto>(
        `/api/v1/simulation-sessions/${session.id}/buy-scatter`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      slotAudio.playScatterTrigger();
      onSessionChange(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal membeli tiket Scatter.'
      );
    } finally {
      setBuyingScatter(false);
    }
  };

  const handleToggleEduScatter = () => {
    setEduScatterEnabled((prev) => !prev);
  };

  const handleSelectEduScatterCount = (count: 3 | 4 | 5) => {
    setEduScatterCount(count);
    setEduScatterEnabled(true);
  };

  const activeChain = useMemo(() => {
    if (!lastSpin) return null;
    if (activeChainIdx === 0) {
      return {
        label: 'Putaran Utama',
        tumbleLog: lastSpin.tumbleLog,
        wins: lastSpin.wins,
        multiplierSum: lastSpin.multiplierSum,
        appliedMultiplier: lastSpin.appliedMultiplier,
        grossPayout: lastSpin.paidChainGrossPayout,
        basePayout: lastSpin.tumbleLog.reduce((s, t) => s + t.basePayout, 0),
      };
    }
    const fs = lastSpin.freeSpinChains[activeChainIdx - 1];
    if (!fs) return null;
    return {
      label: `Putaran Gratis #${fs.chainIndex}`,
      tumbleLog: fs.tumbleLog,
      wins: fs.wins,
      multiplierSum: fs.multiplierSum,
      appliedMultiplier: fs.appliedMultiplier,
      grossPayout: fs.grossPayout,
      basePayout: fs.basePayout,
    };
  }, [lastSpin, activeChainIdx]);

  const currentStep: TumbleStepLog | null = useMemo(() => {
    if (!activeChain || activeChain.tumbleLog.length === 0) return null;
    const clamped = Math.min(activeStepIdx, activeChain.tumbleLog.length - 1);
    return activeChain.tumbleLog[clamped];
  }, [activeChain, activeStepIdx]);

  const displayedGrid: GridMatrix = currentStep?.grid ?? DEFAULT_PREVIEW_GRID;
  const removedKeySet = useMemo(() => {
    if (!currentStep) return new Set<string>();
    return new Set(currentStep.removedPositions.map((p) => `${p.row},${p.col}`));
  }, [currentStep]);

  // Keep Simulator Cabinet visible across active AND ended/exhausted/expired states
  // so user manually navigates via the toggleable navbar
  if (session) {
    return (
      <div data-testid="simulator-page" className="w-full flex-1 min-h-0 flex flex-col">
        <SlotStage
          session={session}
          remainingSec={remainingSec}
          selectedBet={selectedBet}
          selectedAutoCount={selectedAutoCount}
          spinning={spinning}
          ending={ending}
          creating={creating}
          buyingScatter={buyingScatter}
          eduScatterEnabled={eduScatterEnabled}
          eduScatterCount={eduScatterCount}
          error={error}
          recentRounds={recentRounds}
          displayedGrid={displayedGrid}
          removedKeySet={removedKeySet}
          lastSpin={lastSpin}
          activeChain={activeChain}
          activeChainIdx={activeChainIdx}
          activeStepIdx={activeStepIdx}
          currentStep={currentStep}
          animPhase={animPhase}
          freeSpinState={freeSpinState}
          soundMuted={soundMuted}
          fastMode={fastMode}
          autoProgress={autoProgress}
          onSelectBet={setSelectedBet}
          onStepBet={handleStepBet}
          onMaxBet={handleMaxBet}
          onSpin={handleSpin}
          onStartAutoSpin={handleStartAutoSpin}
          onStopAutoSpin={handleStopAutoSpin}
          onEndSession={handleEndSession}
          onStartNewSession={handleStartSession}
          onBuyScatter={handleBuyScatter}
          onToggleEduScatter={handleToggleEduScatter}
          onSelectEduScatterCount={handleSelectEduScatterCount}
          onToggleSound={handleToggleSound}
          onToggleFastMode={handleToggleFastMode}
          onSkipAnimation={handleSkipAnimation}
          onSelectChain={(idx) => {
            setAnimPhase('idle');
            setActiveChainIdx(idx);
            setActiveStepIdx(0);
          }}
          onSelectStep={(idx) => {
            setAnimPhase('idle');
            setActiveStepIdx(idx);
          }}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  // Pre-start or Ended Session View
  return (
    <div
      className="bg-editorial-grid min-h-screen"
      data-testid="simulator-page"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 space-y-6">
        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm flex items-start gap-2.5"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Visual Briefing Panel */}
          <div className="lg:col-span-6 rounded-2xl overflow-hidden bg-dark-blueprint border border-slate-700/80 text-slate-50 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-sky-300">
                Laboratorium Simulasi · Kabinet 6×5 Runtuh
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]">
                Siap Mencoba Mesin Simulasi Slot?
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rasakan langsung bagaimana putaran gratis, bola pengali, dan efek runtuh bekerja—sambil
                melihat saldo 1.000 koin mainan Anda perlahan tergerus sistem.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl p-3.5 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Modal Mainan</div>
                <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                  1.000
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Batas Putar</div>
                <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-white mt-0.5">
                  100×
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Batas Waktu</div>
                <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-white mt-0.5">
                  15 Menit
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 bg-slate-950/75 border border-slate-800 rounded-xl p-3">
              {DEFAULT_PREVIEW_GRID.slice(0, 2).map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="aspect-square rounded-lg border border-slate-700/80 bg-slate-900/90 flex items-center justify-center"
                  >
                    <SymbolGlyph
                      symbol={cell.symbol}
                      multiplierValue={cell.multiplierValue}
                      size={26}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Action & Rules Panel */}
          <div className="lg:col-span-6 surface-elevated rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-sky-800">
                Aturan Sesi Simulasi
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Aman, Terbatas &amp; Tidak Bisa Isi Ulang
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Anda mendapat modal <strong>1.000 koin mainan gratis</strong> (bukan uang asli).
                Simulasi akan berhenti otomatis setelah <strong>100 kali putar</strong>, waktu{' '}
                <strong>15 menit</strong>, atau saat koin tidak cukup untuk taruhan terkecil{' '}
                <strong>10 koin</strong>.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-700 border-t border-slate-200 pt-4">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-sky-800 mt-0.5">01</span>
                  <span>Tersedia putar otomatis 10–50× untuk mempercepat uji ketahanan saldo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-sky-800 mt-0.5">02</span>
                  <span>Ada simulasi Beli Scatter (500 koin) untuk membuktikan apakah benar balik modal.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-sky-800 mt-0.5">03</span>
                  <span>Semua riwayat otomatis masuk ke halaman Catatan &amp; Grafik.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={creating}
                onClick={handleStartSession}
                className="min-h-[48px] flex-1 px-6 py-3 text-sm font-semibold text-white bg-sky-800 hover:bg-sky-900 disabled:opacity-60 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
              >
                {creating ? 'Menyiapkan Mesin...' : 'Mulai Simulasi (1.000 Koin)'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pre-test')}
                className="min-h-[48px] px-5 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
              >
                Isi Tes Awal Dulu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
