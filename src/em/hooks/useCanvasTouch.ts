import { useEffect, type RefObject } from 'react';

/**
 * Converts touch events on a canvas element to synthetic mouse events,
 * enabling all mouse-based drag interactions to work on touch devices.
 * Prevents default touch behavior (scroll/zoom) on the canvas.
 */
export function useCanvasTouch(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
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

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [canvasRef]);
}
