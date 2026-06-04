import { useRef, useEffect, useCallback } from 'react';

interface UseAnimationFrameOptions {
  isPlaying?: boolean;
  onFrame: (time: number) => void;
}

/**
 * Custom hook wrapping requestAnimationFrame with auto-cleanup.
 * Shared by all canvas-based simulation modules.
 */
export function useAnimationFrame({ isPlaying = true, onFrame }: UseAnimationFrameOptions) {
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const callbackRef = useRef(onFrame);

  useEffect(() => {
    callbackRef.current = onFrame;
  });

  const reset = useCallback(() => {
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    const animate = () => {
      callbackRef.current(timeRef.current);
      if (isPlaying) {
        timeRef.current += 1;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  return { timeRef, reset };
}
