import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface MediaFrameProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  className?: string;
  aspectClass?: string;
}

export function MediaFrame({
  src,
  alt,
  fallbackTitle,
  fallbackSubtitle,
  className = '',
  aspectClass = 'aspect-video',
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${aspectClass} w-full bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-slate-100 flex flex-col items-center justify-center gap-2 p-6 text-center ${className}`}
      >
        <ImageOff size={24} className="text-sky-300" aria-hidden="true" />
        <div className="font-display text-sm font-semibold">{fallbackTitle}</div>
        {fallbackSubtitle && (
          <div className="text-xs text-slate-300 max-w-sm leading-relaxed">
            {fallbackSubtitle}
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${aspectClass} w-full object-cover block ${className}`}
    />
  );
}
