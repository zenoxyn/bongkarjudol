import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { QuizPage } from './pages/QuizPage.tsx';
import { SimulatorPage } from './pages/SimulatorPage.tsx';
import { StatisticsPage } from './pages/StatisticsPage.tsx';
import { AlgorithmPage } from './pages/AlgorithmPage.tsx';
import { MaterialsPage } from './pages/MaterialsPage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import {
  apiFetch,
  setClientSessionToken,
  type AlgorithmSpecDto,
  type PageRoute,
  type SessionStateResponse,
  type SimulationSessionDto,
} from './types/api.ts';

function getInitialRoute(): { page: PageRoute; autostart: boolean } {
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  if (autostart) {
    return { page: 'simulator', autostart: true };
  }
  const hash = window.location.hash.replace(/^#/, '') as PageRoute;
  const valid: PageRoute[] = [
    'landing',
    'pre-test',
    'simulator',
    'statistik',
    'algoritma',
    'materi',
    'post-test',
    'hasil',
  ];
  if (valid.includes(hash)) {
    return { page: hash, autostart: false };
  }
  return { page: 'landing', autostart: false };
}

export default function App() {
  const initial = getInitialRoute();
  const [currentPage, setCurrentPage] = useState<PageRoute>(initial.page);
  const [autostart] = useState<boolean>(initial.autostart);
  const [materialSlug, setMaterialSlug] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionStateResponse | null>(null);
  const [algoSpec, setAlgoSpec] = useState<AlgorithmSpecDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [simulatorNavOpen, setSimulatorNavOpen] = useState(false);

  const refreshSessionState = useCallback(async () => {
    try {
      const state = await apiFetch<SessionStateResponse>('/api/v1/session-state');
      setSessionState(state);
      return state;
    } catch {
      return null;
    }
  }, []);

  const ensureAnonymousSession = useCallback(async () => {
    const res = await apiFetch<{ session_token?: string }>(
      '/api/v1/anonymous-sessions',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    if (res.session_token) {
      setClientSessionToken(res.session_token);
    }
    await refreshSessionState();
  }, [refreshSessionState]);

  useEffect(() => {
    void refreshSessionState();
    apiFetch<AlgorithmSpecDto>('/api/v1/algorithm/spec')
      .then(setAlgoSpec)
      .catch(() => {
        // ignore
      });
  }, [refreshSessionState]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '') as PageRoute;
      if (
        [
          'landing',
          'pre-test',
          'simulator',
          'statistik',
          'algoritma',
          'materi',
          'post-test',
          'hasil',
        ].includes(hash)
      ) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((page: PageRoute, slug?: string) => {
    if (slug) setMaterialSlug(slug);
    setSimulatorNavOpen(false);
    setCurrentPage(page);
    window.location.hash = page === 'landing' ? '' : page;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleStartLearningFlow = async () => {
    setBusy(true);
    try {
      await ensureAnonymousSession();
      const latest = await refreshSessionState();
      if (latest?.preTestCompleted) {
        navigate('simulator');
      } else {
        navigate('pre-test');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSimulationSessionChange = (sim: SimulationSessionDto | null) => {
    setSessionState((prev) =>
      prev
        ? { ...prev, simulationSession: sim }
        : {
            authenticated: true,
            anonymousSessionId: null,
            simulationSession: sim,
            preTestCompleted: false,
            postTestCompleted: false,
          }
    );
  };

  const isFullScreenSimulator =
    currentPage === 'simulator' && Boolean(sessionState?.simulationSession);

  return (
    <div
      className={
        isFullScreenSimulator
          ? 'min-h-dvh [@media(min-width:1024px)_and_(min-height:700px)]:h-dvh [@media(min-width:1024px)_and_(min-height:700px)]:overflow-hidden flex flex-col bg-[#1A0208] text-slate-900'
          : 'min-h-screen flex flex-col bg-[#E6EDF6] text-slate-900'
      }
      data-page={currentPage}
    >
      {isFullScreenSimulator ? (
        <>
          <div
            className={`fixed top-0 inset-x-0 z-50 transition-transform duration-200 ease-out ${
              simulatorNavOpen
                ? 'translate-y-0 shadow-lg'
                : '-translate-y-full pointer-events-none'
            }`}
            aria-hidden={!simulatorNavOpen}
          >
            <Header
              currentPage={currentPage}
              onNavigate={(p) => navigate(p)}
              sessionState={sessionState}
              variant="docked"
            />
          </div>

          <button
            type="button"
            onClick={() => setSimulatorNavOpen((v) => !v)}
            aria-expanded={simulatorNavOpen}
            aria-label={
              simulatorNavOpen ? 'Sembunyikan navbar' : 'Tampilkan navbar'
            }
            data-testid="toggle-navbar-btn"
            className={`fixed left-1/2 -translate-x-1/2 z-50 px-4 py-1 text-[11px] font-display font-bold tracking-wide rounded-b-xl border border-t-0 border-amber-400/85 bg-gradient-to-b from-[#5E111D] to-[#2B060D] text-amber-200 hover:text-white shadow-lg cursor-pointer transition-all duration-200 whitespace-nowrap ${
              simulatorNavOpen ? 'top-14' : 'top-0'
            }`}
          >
            {simulatorNavOpen ? 'Tutup Menu ▴' : 'Menu ▾'}
          </button>
        </>
      ) : (
        <Header
          currentPage={currentPage}
          onNavigate={(p) => navigate(p)}
          sessionState={sessionState}
          variant="floating"
        />
      )}

      <main
        className={
          isFullScreenSimulator
            ? 'flex-1 min-h-0 flex flex-col [@media(min-width:1024px)_and_(min-height:700px)]:overflow-hidden'
            : 'flex-1'
        }
      >
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={(p) => navigate(p)}
            onStartLearningFlow={handleStartLearningFlow}
            sessionState={sessionState}
            algoSpec={algoSpec}
            busy={busy}
          />
        )}

        {currentPage === 'pre-test' && (
          <QuizPage
            testType="pre"
            ensureAnonymousSession={ensureAnonymousSession}
            onQuizCompleted={async () => {
              await refreshSessionState();
            }}
            onNavigate={(p) => navigate(p)}
            preTestCompleted={Boolean(sessionState?.preTestCompleted)}
          />
        )}

        {currentPage === 'simulator' && (
          <SimulatorPage
            session={sessionState?.simulationSession ?? null}
            ensureAnonymousSession={ensureAnonymousSession}
            onSessionChange={handleSimulationSessionChange}
            onNavigate={(p) => navigate(p)}
            autostart={autostart}
          />
        )}

        {currentPage === 'statistik' && (
          <StatisticsPage
            session={sessionState?.simulationSession ?? null}
            algoSpec={algoSpec}
            onNavigate={(p) => navigate(p)}
          />
        )}

        {currentPage === 'algoritma' && (
          <AlgorithmPage
            spec={algoSpec}
            onNavigate={(p) => navigate(p)}
          />
        )}

        {currentPage === 'materi' && (
          <MaterialsPage
            initialSlug={materialSlug}
            onNavigate={(p) => navigate(p)}
          />
        )}

        {currentPage === 'post-test' && (
          <QuizPage
            testType="post"
            ensureAnonymousSession={ensureAnonymousSession}
            onQuizCompleted={async () => {
              await refreshSessionState();
            }}
            onNavigate={(p) => navigate(p)}
            preTestCompleted={Boolean(sessionState?.preTestCompleted)}
          />
        )}

        {currentPage === 'hasil' && (
          <ResultsPage
            ensureAnonymousSession={ensureAnonymousSession}
            onNavigate={(p, slug) => navigate(p, slug)}
          />
        )}
      </main>

      {!isFullScreenSimulator && <Footer onNavigate={(p) => navigate(p)} />}
    </div>
  );
}
