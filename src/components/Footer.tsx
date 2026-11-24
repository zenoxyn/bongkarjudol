import type { PageRoute } from '../types/api.ts';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#0B1324] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="max-w-xl space-y-2.5">
          <p className="font-display text-base font-bold text-white tracking-tight">
            BongkarJudol
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Edukasi interaktif cara kerja mesin slot dan risiko keuangan. Semua koin di sini
            100% simulasi belajar (bukan uang sungguhan), bukan alat tebak pola gacor, dan tidak
            terhubung dengan situs judi mana pun.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tanpa daftar akun: tidak perlu nama, email, atau nomor HP. Catatan belajar hanya
            disimpan sementara di browser Anda maksimal 7 hari.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:text-sm font-medium text-slate-300 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('pre-test')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Tes Awal
          </button>
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Simulasi Slot
          </button>
          <button
            type="button"
            onClick={() => onNavigate('statistik')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Catatan &amp; Grafik
          </button>
          <button
            type="button"
            onClick={() => onNavigate('algoritma')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Cara Kerja Mesin
          </button>
          <button
            type="button"
            onClick={() => onNavigate('materi')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Materi Belajar
          </button>
          <button
            type="button"
            onClick={() => onNavigate('post-test')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Tes Akhir
          </button>
          <button
            type="button"
            onClick={() => onNavigate('hasil')}
            className="text-left py-1 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Hasil Belajar
          </button>
        </div>
      </div>
    </footer>
  );
}
