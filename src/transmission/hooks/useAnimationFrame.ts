import { useCallback, useEffect, useRef } from 'react';

/** Timing information passed to the per-frame callback. */
export interface FrameInfo {
  /** The requestAnimationFrame timestamp, in milliseconds. */
  timestamp: number;
  /** Seconds elapsed since the previous frame. */
  dt: number;
  /** Seconds elapsed since the loop started (or the last reset). */
  elapsed: number;
}

/**
 * Runs a continuous requestAnimationFrame loop that is built once. The loop always
 * invokes the LATEST `onFrame` (kept in a ref and refreshed every render), so the
 * callback may freely close over current state/props without the loop being torn
 * down and recreated on every change.
 *
 * `onFrame` receives real timing — `timestamp`, per-frame `dt`, and total `elapsed`
 * (all derived from the rAF timestamp) — so time-based animation keeps the same
 * wall-clock behaviour the M3 sims relied on.
 *
 * Pass `isPlaying = false` to pause the loop (it tears down and restarts when the
 * flag flips). `reset()` zeroes the elapsed clock.
 */
export function useAnimationFrame(onFrame: (frame: FrameInfo) => void, isPlaying = true) {
  const callbackRef = useRef(onFrame);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const elapsedRef = useRef(0);

  // Always call the latest callback without restarting the loop.
  useEffect(() => {
    callbackRef.current = onFrame;
  });

  const reset = useCallback(() => {
    elapsedRef.current = 0;
    lastTsRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    lastTsRef.current = 0;
    const loop = (timestamp: number) => {
      if (!lastTsRef.current) lastTsRef.current = timestamp;
      const dt = (timestamp - lastTsRef.current) / 1000;
      lastTsRef.current = timestamp;
      elapsedRef.current += dt;
      callbackRef.current({ timestamp, dt, elapsed: elapsedRef.current });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return { reset };
}
