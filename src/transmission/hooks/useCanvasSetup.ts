import { useCallback, useRef } from 'react';

/** Result of preparing a canvas for a frame: the 2D context and CSS-pixel size. */
export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** Canvas width in CSS pixels (not backing-store pixels). */
  width: number;
  /** Canvas height in CSS pixels. */
  height: number;
}

/**
 * Canvas ref + a per-frame setup helper that handles devicePixelRatio scaling.
 *
 * Call `prepareFrame()` at the top of each render: it sizes the backing store to
 * the element's CSS size × DPR, scales the 2D context so drawing code can work in
 * CSS pixels, and returns `{ ctx, width, height }` — or `null` if the canvas or
 * context is unavailable (caller should early-return).
 *
 * This consolidates the dpr/getBoundingClientRect/ctx.scale boilerplate that was
 * duplicated across every M3 simulation.
 */
export function useCanvasSetup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const prepareFrame = useCallback((): CanvasFrame | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    return { ctx, width: rect.width, height: rect.height };
  }, []);

  return { canvasRef, prepareFrame };
}
