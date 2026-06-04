import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveSection } from '@transmission/hooks/useActiveSection';

// Stable ids array (the hook expects a stable reference, like a module const).
const IDS = ['a', 'b', 'c'];

describe('useActiveSection', () => {
  let tops: Record<string, number>;

  beforeEach(() => {
    tops = { a: -10, b: 500, c: 1000 };
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) =>
      id in tops
        ? ({ getBoundingClientRect: () => ({ top: tops[id] }) } as unknown as HTMLElement)
        : null,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the topmost section above the offset on initial compute', () => {
    // a.top(-10) - 96 <= 0 -> active; b and c are below the fold
    const { result } = renderHook(() => useActiveSection(IDS));
    expect(result.current).toBe('a');
  });

  it('updates the active id as more sections scroll above the offset', () => {
    const { result } = renderHook(() => useActiveSection(IDS));
    act(() => {
      tops = { a: -600, b: -100, c: 400 };
      window.dispatchEvent(new Event('scroll'));
    });
    // a and b are both above the 96px offset; the lower one (b) wins
    expect(result.current).toBe('b');
  });

  it('falls back to the first id when no section is above the offset', () => {
    const { result } = renderHook(() => useActiveSection(IDS));
    act(() => {
      tops = { a: 200, b: 600, c: 1200 };
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe('a');
  });
});
