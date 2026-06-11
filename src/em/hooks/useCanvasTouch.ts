import { useCallback, useRef, type RefObject } from 'react';

/**
 * Converts touch events on a canvas element to synthetic mouse events,
 * enabling all mouse-based drag interactions to work on touch devices.
 * Prevents default touch behavior (scroll/zoom) on the canvas.
 *
 * Returns a callback ref — pass it as the canvas's `ref` instead of the raw
 * ref object. A mount-time effect cannot do this job: every em canvas mounts
 * late (revealed by a PredictionGate, or remounted by a TabSet/resetKey), long
 * after an effect's only run would have found a null ref and silently attached
 * nothing. The callback ref (re)attaches the listeners whenever the canvas
 * element (re)mounts, and keeps `canvasRef.current` in sync for the draw loops
 * and mouse handlers that read it.
 */
export function useCanvasTouch(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const detachRef = useRef<(() => void) | null>(null);

  return useCallback((canvas: HTMLCanvasElement | null) => {
    detachRef.current?.();
    detachRef.current = null;
    canvasRef.current = canvas;
    if (!canvas) return;

    const touchToMouse = (type: string) => (e: TouchEvent) => {
      if (e.touches.length > 1) return; // allow pinch zoom
      e.preventDefault();
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return;
      const mouseEvent = new MouseEvent(type, {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
      });
      canvas.dispatchEvent(mouseEvent);
    };

    const onTouchStart = touchToMouse('mousedown');
    const onTouchMove = touchToMouse('mousemove');
    const onTouchEnd = touchToMouse('mouseup');

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    detachRef.current = () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [canvasRef]);
}
