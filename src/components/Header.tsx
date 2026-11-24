import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import type { PageRoute, SessionStateResponse } from '../types/api.ts';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  sessionState: SessionStateResponse | null;
  variant?: 'floating' | 'docked';
}

const NAV_ITEMS: Array<{ page: PageRoute; label: string }> = [
  { page: 'landing', label: 'Beranda' },
  { page: 'simulator', label: 'Simulasi' },
  { page: 'statistik', label: 'Catatan' },
  { page: 'algoritma', label: 'Cara Kerja' },
  { page: 'materi', label: 'Materi' },
];

export function Header({
  currentPage,
  onNavigate,
  sessionState,
  variant = 'floating',
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryAction: { label: string; target: PageRoute } = !sessionState?.preTestCompleted
    ? { label: 'Tes Awal', target: 'pre-test' }
    : !sessionState?.postTestCompleted
    ? { label: 'Tes Akhir', target: 'post-test' }
    : { label: 'Hasil Belajar', target: 'hasil' };

  const handleNav = (page: PageRoute) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  const isFloating = variant === 'floating';

  return (
    <header
      className={
        isFloating
          ? 'fixed top-2.5 sm:top-3.5 inset-x-0 z-40 px-3 sm:px-6 lg:px-8 pointer-events-none'
          : 'bg-[#1A0208]/85 backdrop-blur-xl backdrop-saturate-150 border-b border-amber-400/25'
      }
    >
      <div
        className={
          isFloating
            ? 'pointer-events-auto max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 lg:gap-8 rounded-2xl bg-[linear-gradient(135deg,rgba(11,22,44,0.92),rgba(8,17,34,0.88))] backdrop-blur-2xl backdrop-saturate-150 border border-sky-200/20 shadow-[0_14px_38px_-10px_rgba(2,6,23,0.62),inset_0_1px_0_rgba(255,255,255,0.22)]'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4 lg:gap-8'
        }
      >
        {/* Zone 1: Single text wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleNav('landing');
          }}
          className="font-display text-lg font-bold tracking-tight text-white hover:text-sky-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 rounded-sm"
        >
          BongkarJudol
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 lg:gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <a
                key={item.page}
                href={`#${item.page}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.page);
                }}
                aria-current={active ? 'page' : undefined}
                className={`text-sm whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  active
                    ? 'text-white border-sky-400 font-semibold'
                    : 'text-slate-200/85 border-transparent font-medium hover:text-white hover:border-white/50 hover:-translate-y-[1px]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(primaryAction.target)}
            className="group min-h-[38px] inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-700/95 hover:bg-sky-600 border border-sky-400/40 rounded-xl shadow-[0_4px_14px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_18px_rgba(2,132,199,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 cursor-pointer"
          >
            <span>{primaryAction.label}</span>
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="md:hidden min-w-[42px] min-h-[42px] flex items-center justify-center text-slate-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Navigasi seluler"
          className={
            isFloating
              ? 'pointer-events-auto max-w-7xl mx-auto md:hidden mt-2 rounded-2xl bg-[#0A1428]/95 backdrop-blur-2xl backdrop-saturate-150 border border-sky-200/20 px-3.5 py-3 flex flex-col gap-1 shadow-2xl'
              : 'md:hidden border-t border-white/15 bg-[#1A0208]/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 shadow-2xl'
          }
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNav(item.page)}
                className={`text-left min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-sky-500/20 text-white border border-sky-400/35 font-semibold'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="border-t border-white/10 mt-2 pt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleNav('pre-test')}
              className="min-h-[44px] px-2 py-2 text-xs font-medium text-slate-100 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl cursor-pointer"
            >
              Tes Awal
            </button>
            <button
              type="button"
              onClick={() => handleNav('post-test')}
              className="min-h-[44px] px-2 py-2 text-xs font-medium text-slate-100 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl cursor-pointer"
            >
              Tes Akhir
            </button>
            <button
              type="button"
              onClick={() => handleNav('hasil')}
              className="min-h-[44px] px-2 py-2 text-xs font-medium text-slate-100 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl cursor-pointer"
            >
              Hasil
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
