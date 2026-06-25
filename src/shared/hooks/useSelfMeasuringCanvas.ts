// src/shared/hooks/useSelfMeasuringCanvas.ts
import { useCallback, useRef } from 'react';

/** Result of preparing a canvas for a frame: the 2D context, CSS-pixel size, and dpr. */
export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** Canvas width in CSS pixels (not backing-store pixels). */
  width: number;
  /** Canvas height in CSS pixels. */
  height: number;
  /** The devicePixelRatio applied to the backing store this frame. */
  dpr: number;
}

export interface SelfMeasuringCanvasOptions {
  /**
   * Apply `ctx.scale(dpr, dpr)` so draw code works in CSS pixels (default true).
   * Pass `false` for sims whose geometry and pointer math already operate in
   * backing-store pixels (e.g. polarization's bitmap-space drag).
   */
  scaled?: boolean;
}

/**
 * Canvas ref + a per-frame setup helper that self-measures via
 * `getBoundingClientRect()` and handles devicePixelRatio scaling.
 *
 * Call `prepareFrame()` at the top of each render: it sizes the backing store to
 * the canvas's CSS size × DPR, (optionally) scales the 2D context so drawing code
 * works in CSS pixels, and returns `{ ctx, width, height, dpr }` — or `null` if the
 * canvas or context is unavailable (caller should early-return but keep the rAF loop
 * scheduled, since EM canvases mount late behind a PredictionGate).
 *
 * This is the canonical Track-B #14 hook. It generalizes the proven
 * `src/transmission/hooks/useCanvasSetup.ts` and replaces the legacy
 * inline `canvas.width = parentElement.clientWidth` (no DPR) pattern.
 */
export function useSelfMeasuringCanvas(options: SelfMeasuringCanvasOptions = {}) {
  const { scaled = true } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const prepareFrame = useCallback((): CanvasFrame | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    if (scaled) ctx.scale(dpr, dpr);

    return { ctx, width: rect.width, height: rect.height, dpr };
  }, [scaled]);

  return { canvasRef, prepareFrame };
}
