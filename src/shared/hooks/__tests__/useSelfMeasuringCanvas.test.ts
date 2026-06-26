// src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';

function fakeCanvas(scale: () => void, w = 100, h = 50) {
  return {
    width: 0,
    height: 0,
    getContext: () => ({ scale }) as unknown as CanvasRenderingContext2D,
    getBoundingClientRect: () => ({ width: w, height: h }),
  } as unknown as HTMLCanvasElement;
}

describe('useSelfMeasuringCanvas', () => {
  beforeEach(() => vi.stubGlobal('devicePixelRatio', 2));
  afterEach(() => vi.unstubAllGlobals());

  it('returns null when no canvas is attached', () => {
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('returns null when the 2D context is unavailable', () => {
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    result.current.canvasRef.current = {
      getContext: () => null,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    } as unknown as HTMLCanvasElement;
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('scales the backing store by dpr, scales the context, returns CSS size + dpr', () => {
    const scale = vi.fn();
    const canvas = fakeCanvas(scale);
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    result.current.canvasRef.current = canvas;

    const frame = result.current.prepareFrame();
    expect(frame).not.toBeNull();
    expect(frame!.width).toBe(100);     // CSS px
    expect(frame!.height).toBe(50);     // CSS px
    expect(frame!.dpr).toBe(2);
    expect(canvas.width).toBe(200);     // backing store = CSS * dpr
    expect(canvas.height).toBe(100);
    expect(scale).toHaveBeenCalledWith(2, 2);
  });

  it('scaled:false sizes the backing store but does NOT scale the context', () => {
    const scale = vi.fn();
    const canvas = fakeCanvas(scale);
    const { result } = renderHook(() => useSelfMeasuringCanvas({ scaled: false }));
    result.current.canvasRef.current = canvas;

    const frame = result.current.prepareFrame();
    expect(canvas.width).toBe(200);     // still DPR-sized backing store
    expect(canvas.height).toBe(100);
    expect(scale).not.toHaveBeenCalled();
    expect(frame!.dpr).toBe(2);
  });
});
