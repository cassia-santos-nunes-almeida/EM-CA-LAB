import { useRef, useCallback } from 'react';

/**
 * Hook that provides a canvas ref and a resize-to-parent helper.
 * Returns the 2D rendering context after resizing.
 */
export function useCanvasSetup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    return canvas.getContext('2d');
  }, []);

  return { canvasRef, getCtx };
}
