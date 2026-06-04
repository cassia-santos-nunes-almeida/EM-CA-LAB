import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasSetup } from '@transmission/hooks/useCanvasSetup';

describe('useCanvasSetup', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 2);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no canvas is attached', () => {
    const { result } = renderHook(() => useCanvasSetup());
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('returns null when the 2D context is unavailable', () => {
    const { result } = renderHook(() => useCanvasSetup());
    result.current.canvasRef.current = {
      getContext: () => null,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    } as unknown as HTMLCanvasElement;
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('scales the backing store by devicePixelRatio and returns CSS size', () => {
    const { result } = renderHook(() => useCanvasSetup());
    const scale = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ scale }) as unknown as CanvasRenderingContext2D,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    } as unknown as HTMLCanvasElement;
    result.current.canvasRef.current = canvas;

    const frame = result.current.prepareFrame();
    expect(frame).not.toBeNull();
    expect(frame!.width).toBe(100);
    expect(frame!.height).toBe(50);
    expect(canvas.width).toBe(200); // 100 * dpr(2)
    expect(canvas.height).toBe(100); // 50 * dpr(2)
    expect(scale).toHaveBeenCalledWith(2, 2);
  });
});
