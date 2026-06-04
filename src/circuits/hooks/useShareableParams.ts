import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Clamp a numeric string from the URL within [min, max], or return fallback. */
export function clampNum(raw: string | null, min: number, max: number, fallback: number): number {
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/** Parse an enum value from the URL, returning fallback if invalid. */
export function parseEnum<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw !== null && allowed.includes(raw as T) ? (raw as T) : fallback;
}

/**
 * Hook that syncs a record of deferred values to URL search params.
 * Call this once per component — pass the deferred (debounced) values.
 *
 * Also provides a copy-link helper that copies the current URL to clipboard.
 */
export function useUrlSync(
  params: Record<string, string | number>,
) {
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    const entries: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      entries[key] = String(value);
    }
    setSearchParams(entries, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams, ...Object.values(params)]);
}

/**
 * Hook that provides a "copy shareable link" action with a 2-second feedback state.
 */
export function useCopyLink() {
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, []);

  return { copyLink, linkCopied };
}
