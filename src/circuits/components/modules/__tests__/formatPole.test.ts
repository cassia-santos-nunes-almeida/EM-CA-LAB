import { describe, it, expect } from 'vitest';
import { formatPole } from '../SDomainAnalysis';

/**
 * A.5 #6 — the Read-the-Plot pole readout was an inline map callback; extracted to
 * formatPole(). These pin the exact "s{i+1} = …" output so the extraction is
 * provably byte-identical (real poles, and ± imaginary parts).
 */
describe('formatPole (A.5 #6 SDomainAnalysis)', () => {
  it('formats real poles as "s{i+1} = x"', () => {
    expect(formatPole({ x: -1, y: 0 }, 0)).toBe('s1 = -1');
    expect(formatPole({ x: -4, y: 0 }, 1)).toBe('s2 = -4');
  });

  it('appends ±{y}j for complex poles', () => {
    expect(formatPole({ x: -2, y: 3 }, 0)).toBe('s1 = -2+3j');
    expect(formatPole({ x: -2, y: -3 }, 1)).toBe('s2 = -2-3j');
  });
});
