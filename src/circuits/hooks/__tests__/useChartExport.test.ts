import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartExport } from '@circuits/hooks/useChartExport';
import { createRef } from 'react';

describe('useChartExport', () => {
  it('returns a function', () => {
    const ref = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useChartExport(ref, 'test-chart'));
    expect(typeof result.current).toBe('function');
  });

  it('does nothing when ref.current is null', () => {
    const ref = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useChartExport(ref, 'test-chart'));

    // Should not throw when called with null ref
    expect(() => result.current()).not.toThrow();
  });

  it('does nothing when no SVG found in container', () => {
    const container = document.createElement('div');
    const ref = { current: container };

    const querySpy = vi.spyOn(container, 'querySelector').mockReturnValue(null);

    const { result } = renderHook(() => useChartExport(ref, 'test-chart'));

    expect(() => result.current()).not.toThrow();
    expect(querySpy).toHaveBeenCalledWith('svg.recharts-surface');

    querySpy.mockRestore();
  });
});
