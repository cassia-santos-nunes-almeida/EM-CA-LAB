import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimationFrame } from '@transmission/hooks/useAnimationFrame';

describe('useAnimationFrame', () => {
  let frameCb: FrameRequestCallback | null;

  beforeEach(() => {
    frameCb = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frameCb = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onFrame with dt and elapsed derived from real timestamps', () => {
    const onFrame = vi.fn();
    renderHook(() => useAnimationFrame(onFrame));

    act(() => frameCb!(1000)); // first frame: dt 0
    act(() => frameCb!(1016)); // +16ms

    expect(onFrame).toHaveBeenCalledTimes(2);
    const second = onFrame.mock.calls[1][0];
    expect(second.timestamp).toBe(1016);
    expect(second.dt).toBeCloseTo(0.016, 3);
    expect(second.elapsed).toBeCloseTo(0.016, 3);
  });

  it('always invokes the latest onFrame without restarting the loop', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useAnimationFrame(cb), {
      initialProps: { cb: first },
    });

    act(() => frameCb!(1000));
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ cb: second });
    act(() => frameCb!(1016));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1); // not called again
  });

  it('does not start a loop when isPlaying is false', () => {
    const onFrame = vi.fn();
    renderHook(() => useAnimationFrame(onFrame, false));
    expect(frameCb).toBeNull();
  });
});
