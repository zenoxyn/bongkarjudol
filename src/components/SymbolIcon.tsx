import { useId } from 'react';
import type { SlotSymbol } from '../engine/config.ts';

interface SymbolVisualMeta {
  label: string;
  shortLabel: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconColor: string;
}

export interface CabinetSymbolMeta {
  label: string;
  shortLabel: string;
  tileBgClass: string;
  tileBorderClass: string;
  textClass: string;
  glowShadow: string;
  tier: 'high' | 'mid' | 'special' | 'neutral';
}

export const SYMBOL_META: Record<SlotSymbol, SymbolVisualMeta> = {
  CHERRY: {
    label: 'Cherry',
    shortLabel: 'Cherry',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-800',
    iconColor: '#E11D48',
  },
  BELL: {
    label: 'Bell',
    shortLabel: 'Bell',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-800',
    iconColor: '#D97706',
  },
  GEM: {
    label: 'Gem',
    shortLabel: 'Gem',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-800',
    iconColor: '#0284C7',
  },
  CROWN: {
    label: 'Crown',
    shortLabel: 'Crown',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-900',
    iconColor: '#D97706',
  },
  WILD: {
    label: 'Wild',
    shortLabel: 'Wild',
    bgClass: 'bg-sky-50/75',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-900',
    iconColor: '#0369A1',
  },
  SCATTER: {
    label: 'Scatter',
    shortLabel: 'Scatter',
    bgClass: 'bg-sky-50/75',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-900',
    iconColor: '#0369A1',
  },
  MULTIPLIER: {
    label: 'Multiplier',
    shortLabel: 'Mult',
    bgClass: 'bg-sky-50/75',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-900',
    iconColor: '#D97706',
  },
  LEAF: {
    label: 'Leaf (Netral)',
    shortLabel: 'Leaf',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-600',
    iconColor: '#64748B',
  },
  MOON: {
    label: 'Moon (Netral)',
    shortLabel: 'Moon',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-600',
    iconColor: '#475569',
  },
};

export const CABINET_SYMBOL_META: Record<SlotSymbol, CabinetSymbolMeta> = {
  CHERRY: {
    label: 'Cherry',
    shortLabel: 'Cherry',
    tileBgClass: 'bg-gradient-to-b from-rose-950/90 to-[#280B18]',
    tileBorderClass: 'border-rose-500/45',
    textClass: 'text-rose-200',
    glowShadow: '0 0 18px rgba(244, 63, 94, 0.48)',
    tier: 'mid',
  },
  BELL: {
    label: 'Bell',
    shortLabel: 'Bell',
    tileBgClass: 'bg-gradient-to-b from-amber-950/90 to-[#2B1A06]',
    tileBorderClass: 'border-amber-400/55',
    textClass: 'text-amber-200',
    glowShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
    tier: 'mid',
  },
  GEM: {
    label: 'Gem',
    shortLabel: 'Gem',
    tileBgClass: 'bg-gradient-to-b from-sky-950/90 to-[#0B2239]',
    tileBorderClass: 'border-cyan-400/55',
    textClass: 'text-sky-200',
    glowShadow: '0 0 20px rgba(56, 189, 248, 0.52)',
    tier: 'high',
  },
  CROWN: {
    label: 'Crown',
    shortLabel: 'Crown',
    tileBgClass: 'bg-gradient-to-b from-indigo-900/95 to-[#1F1746]',
    tileBorderClass: 'border-amber-300/70',
    textClass: 'text-amber-200',
    glowShadow: '0 0 22px rgba(251, 191, 36, 0.55)',
    tier: 'high',
  },
  WILD: {
    label: 'Wild',
    shortLabel: 'Wild',
    tileBgClass: 'bg-gradient-to-b from-emerald-900/95 to-[#062C22]',
    tileBorderClass: 'border-emerald-400/75',
    textClass: 'text-emerald-200',
    glowShadow: '0 0 22px rgba(16, 185, 129, 0.55)',
    tier: 'special',
  },
  SCATTER: {
    label: 'Scatter',
    shortLabel: 'Scatter',
    tileBgClass: 'bg-gradient-to-b from-fuchsia-950/95 to-[#2B0B3E]',
    tileBorderClass: 'border-fuchsia-400/75',
    textClass: 'text-fuchsia-200',
    glowShadow: '0 0 24px rgba(217, 70, 239, 0.6)',
    tier: 'special',
  },
  MULTIPLIER: {
    label: 'Multiplier',
    shortLabel: 'Mult',
    tileBgClass: 'bg-gradient-to-b from-orange-900/95 to-[#3B1206]',
    tileBorderClass: 'border-amber-300/85',
    textClass: 'text-amber-100',
    glowShadow: '0 0 24px rgba(249, 115, 22, 0.65)',
    tier: 'special',
  },
  LEAF: {
    label: 'Leaf (Netral)',
    shortLabel: 'Leaf',
    tileBgClass: 'bg-gradient-to-b from-slate-800/80 to-slate-900/95',
    tileBorderClass: 'border-slate-700/80',
    textClass: 'text-slate-400',
    glowShadow: '0 0 8px rgba(148, 163, 184, 0.2)',
    tier: 'neutral',
  },
  MOON: {
    label: 'Moon (Netral)',
    shortLabel: 'Moon',
    tileBgClass: 'bg-gradient-to-b from-slate-800/80 to-[#111932]',
    tileBorderClass: 'border-slate-700/80',
    textClass: 'text-slate-400',
    glowShadow: '0 0 8px rgba(148, 163, 184, 0.2)',
    tier: 'neutral',
  },
};

export function SymbolGlyph({
  symbol,
  multiplierValue,
  size = 24,
}: {
  symbol: SlotSymbol;
  multiplierValue?: 2 | 3 | 5;
  size?: number;
}) {
  const uid = useId().replace(/:/g, '');

  switch (symbol) {
    case 'CHERRY':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={`ch-${uid}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="40%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#9F1239" />
            </radialGradient>
          </defs>
          <path d="M14 4.5C12.5 8 10 11 8 14.5" stroke="#4ADE80" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M14 4.5C16.2 8 18.2 11 19.5 14.5" stroke="#4ADE80" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M14 4.5C15.8 3.2 18.4 3.4 19.6 5C17.4 6 15.6 5.8 14 4.5Z" fill="#22C55E" />
          <circle cx="8.5" cy="18.5" r="5" fill={`url(#ch-${uid})`} stroke="#FFE4E6" strokeWidth="0.9" />
          <circle cx="19.5" cy="19" r="4.8" fill={`url(#ch-${uid})`} stroke="#FFE4E6" strokeWidth="0.9" />
          <ellipse cx="6.8" cy="16.6" rx="1.4" ry="0.9" fill="#FFF1F2" opacity="0.75" />
          <ellipse cx="17.8" cy="17.1" rx="1.3" ry="0.85" fill="#FFF1F2" opacity="0.75" />
        </svg>
      );

    case 'BELL':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`bl-${uid}`} x1="6" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="22.2" r="2.6" fill="#FDE047" stroke="#92400E" strokeWidth="1" />
          <path
            d="M14 3.5C9.8 3.5 7.2 6.8 7.2 11.2V16.2L4.8 19.5H23.2L20.8 16.2V11.2C20.8 6.8 18.2 3.5 14 3.5Z"
            fill={`url(#bl-${uid})`}
            stroke="#FEF9C3"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <path d="M10.5 7.5C9.7 9.1 9.5 11.2 9.5 14.5" stroke="#FEF9C3" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
        </svg>
      );

    case 'GEM':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`gm-${uid}`} x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A5F3FC" />
              <stop offset="45%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <polygon points="8,4.5 20,4.5 25,10.5 14,24 3,10.5" fill={`url(#gm-${uid})`} stroke="#E0F2FE" strokeWidth="1" strokeLinejoin="round" />
          <polygon points="8,4.5 20,4.5 17.5,10.5 10.5,10.5" fill="#E0F2FE" opacity="0.7" />
          <polygon points="10.5,10.5 17.5,10.5 14,24" fill="#38BDF8" opacity="0.65" />
          <line x1="3" y1="10.5" x2="25" y2="10.5" stroke="#BAE6FD" strokeWidth="0.9" opacity="0.8" />
        </svg>
      );

    case 'CROWN':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`cr-${uid}`} x1="3" y1="5" x2="25" y2="23" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="48%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <path
            d="M3.5 20.5L5.2 8.5L10.5 13.8L14 5.5L17.5 13.8L22.8 8.5L24.5 20.5H3.5Z"
            fill={`url(#cr-${uid})`}
            stroke="#FEF9C3"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <rect x="3.5" y="21.5" width="21" height="2.8" rx="1.2" fill="#D97706" stroke="#FDE68A" strokeWidth="0.8" />
          <circle cx="14" cy="14.5" r="1.8" fill="#EF4444" stroke="#FEF9C3" strokeWidth="0.7" />
          <circle cx="8.5" cy="16" r="1.3" fill="#38BDF8" />
          <circle cx="19.5" cy="16" r="1.3" fill="#38BDF8" />
        </svg>
      );

    case 'WILD':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`wl-${uid}`} x1="3" y1="4" x2="25" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="4.5" width="23" height="19" rx="5" fill={`url(#wl-${uid})`} stroke="#D1FAE5" strokeWidth="1.2" />
          <path
            d="M7.2 10L9.4 18L11.8 11.8L14 18L16.2 11.8L18.6 18L20.8 10"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'SCATTER':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`sc-${uid}`} x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5D0FE" />
              <stop offset="45%" stopColor="#C026D3" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
          <polygon
            points="14,2.5 17.5,9.6 25.3,10.7 19.6,16.2 21,24 14,20.3 7,24 8.4,16.2 2.7,10.7 10.5,9.6"
            fill={`url(#sc-${uid})`}
            stroke="#FAE8FF"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="3.4" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="0.9" />
        </svg>
      );

    case 'MULTIPLIER': {
      const val = multiplierValue ?? 2;
      const bgStyle =
        val >= 5
          ? 'linear-gradient(135deg, #FDE047 0%, #EA580C 55%, #B91C1C 100%)'
          : val >= 3
          ? 'linear-gradient(135deg, #FDE047 0%, #F97316 65%, #C2410C 100%)'
          : 'linear-gradient(135deg, #FDBA74 0%, #EA580C 100%)';
      return (
        <div
          className="flex items-center justify-center rounded-full font-mono font-bold text-white border border-amber-200/90 shadow-sm"
          style={{
            width: size,
            height: size,
            background: bgStyle,
            fontSize: Math.max(11, Math.round(size * 0.44)),
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
          }}
          aria-hidden="true"
        >
          {val}×
        </div>
      );
    }

    case 'LEAF':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path
            d="M22.5 5.5C13.5 5.5 6.5 10.5 6.5 18.8C6.5 20.4 6.9 21.8 7.5 22.8C16.2 22.8 22.5 16.4 22.5 5.5Z"
            stroke="#94A3B8"
            strokeWidth="1.8"
            fill="#64748B"
            fillOpacity="0.45"
          />
          <path d="M6.8 22.2L17.5 10.2" stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'MOON':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path
            d="M19.5 17.4A7.6 7.6 0 0 1 10.9 8.8A7.6 7.6 0 1 0 19.5 17.4Z"
            fill="#94A3B8"
            fillOpacity="0.5"
            stroke="#CBD5E1"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
