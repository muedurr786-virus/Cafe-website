import { useState } from 'react';
import { Coffee } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResilientImage({ src, alt, className = '' }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-zinc-200/70 text-zinc-500 p-6 text-center ${className}`}
      >
        <Coffee className="w-7 h-7 mb-2 text-zinc-400" strokeWidth={1.5} />
        <span className="text-xs font-medium text-zinc-600 max-w-[180px] line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
