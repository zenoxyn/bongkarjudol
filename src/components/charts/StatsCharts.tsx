import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ChartPropsBase {
  title: string;
  subtitle: string;
  caption: string;
}

export function BalanceTrajectoryChart({
  title,
  subtitle,
  caption,
  startingBalance,
  series,
}: ChartPropsBase & {
  startingBalance: number;
  series: Array<{ roundNumber: number; balanceAfter: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const labels = ['Awal', ...series.map((s) => `#${s.roundNumber}`)];
    const data = [startingBalance, ...series.map((s) => s.balanceAfter)];
    const baseline = labels.map(() => startingBalance);

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Koin Anda',
            data,
            borderColor: '#0F4C81',
            backgroundColor: 'rgba(15, 76, 129, 0.08)',
            borderWidth: 2,
            fill: true,
            tension: 0.15,
            pointRadius: series.length > 35 ? 1.5 : 3,
          },
          {
            label: 'Modal Awal (1.000)',
            data: baseline,
            borderColor: '#94A3B8',
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 12 } },
          },
        },
        scales: {
          y: {
            grace: '15%',
            suggestedMin: Math.max(0, Math.min(...data) - 40),
            grid: { color: '#F1F5F9' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [startingBalance, series]);

  return (
    <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-60 relative">
        <canvas ref={canvasRef} aria-label={title} />
      </div>
      <p className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
        {caption}
      </p>
    </div>
  );
}

export function PayoutDistributionChart({
  title,
  subtitle,
  caption,
  buckets,
  unitLabel = 'Putaran',
}: ChartPropsBase & {
  buckets: Array<{ label: string; value: number }>;
  unitLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: buckets.map((b) => b.label),
        datasets: [
          {
            label: unitLabel,
            data: buckets.map((b) => b.value),
            backgroundColor: [
              '#64748B',
              '#E11D48',
              '#D97706',
              '#0EA5E9',
              '#0284C7',
              '#0369A1',
            ],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [buckets, unitLabel]);

  return (
    <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-60 relative">
        <canvas ref={canvasRef} aria-label={title} />
      </div>
      <p className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
        {caption}
      </p>
    </div>
  );
}

export function RtpComparisonChart({
  title,
  subtitle,
  caption,
  observedRtp,
  monteCarloRtp,
}: ChartPropsBase & {
  observedRtp: number;
  monteCarloRtp: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Sesi Anda', 'Rata-rata Mesin', 'Impas (100%)'],
        datasets: [
          {
            label: 'Persentase (%)',
            data: [observedRtp, monteCarloRtp, 100],
            backgroundColor: ['#0284C7', '#0F172A', '#CBD5E1'],
            borderRadius: 6,
            barThickness: 36,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 120,
            grid: { color: '#F1F5F9' },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [observedRtp, monteCarloRtp]);

  return (
    <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-52 relative">
        <canvas ref={canvasRef} aria-label={title} />
      </div>
      <p className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
        {caption}
      </p>
    </div>
  );
}

export function FeatureFrequencyChart({
  title,
  subtitle,
  caption,
  paidSpins,
  winningPayoutRounds,
  netProfitRounds,
  roundsWithTumble,
  freeSpinTriggerCount,
}: ChartPropsBase & {
  paidSpins: number;
  winningPayoutRounds: number;
  netProfitRounds: number;
  roundsWithTumble: number;
  freeSpinTriggerCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pct = (n: number) =>
      paidSpins > 0 ? Number(((n / paidSpins) * 100).toFixed(1)) : 0;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [
          'Keluar Hadiah',
          'Untung Beneran',
          'Simbol Runtuh',
          'Putaran Gratis',
        ],
        datasets: [
          {
            label: 'Persentase (%)',
            data: [
              pct(winningPayoutRounds),
              pct(netProfitRounds),
              pct(roundsWithTumble),
              pct(freeSpinTriggerCount),
            ],
            backgroundColor: ['#D97706', '#059669', '#0284C7', '#0369A1'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#F1F5F9' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [
    paidSpins,
    winningPayoutRounds,
    netProfitRounds,
    roundsWithTumble,
    freeSpinTriggerCount,
  ]);

  return (
    <div className="surface-elevated border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-52 relative">
        <canvas ref={canvasRef} aria-label={title} />
      </div>
      <p className="text-xs text-slate-600 border-t border-slate-100 pt-2.5">
        {caption}
      </p>
    </div>
  );
}
