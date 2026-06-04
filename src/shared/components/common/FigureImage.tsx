import { useState } from 'react';
import { cn } from '@shared/utils/cn';

interface FigureImageProps {
  /** Direct URL to the image file. */
  src: string;
  /** Alt text describing the image for accessibility. */
  alt: string;
  /** Caption displayed below the image. */
  caption: string;
  /** Attribution line (author, license, source). */
  attribution: string;
  /** Optional link to the original source page. */
  sourceUrl?: string;
  /** Optional additional class names for the outer figure element. */
  className?: string;
}

export function FigureImage({
  src,
  alt,
  caption,
  attribution,
  sourceUrl,
  className,
}: FigureImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <figure
      className={cn(
        'max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm',
        className,
      )}
    >
      <div className="relative bg-slate-100 dark:bg-slate-700">
        {!loaded && !error && (
          <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
            Loading image…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
            Image unavailable
          </div>
        )}
        <a href={src} target="_blank" rel="noopener noreferrer" title="Click to view full size">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'w-full h-auto max-h-72 object-contain transition-opacity duration-300 cursor-zoom-in',
              loaded ? 'opacity-100' : 'opacity-0',
              error && 'hidden',
            )}
          />
        </a>
      </div>
      <figcaption className="px-4 py-3 space-y-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {caption}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-engineering-blue-500 dark:hover:text-engineering-blue-400 transition-colors"
            >
              {attribution}
            </a>
          ) : (
            attribution
          )}
        </p>
      </figcaption>
    </figure>
  );
}
