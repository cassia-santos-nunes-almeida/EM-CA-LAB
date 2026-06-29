import { describe, it, expect } from 'vitest';
import { computeActiveId } from '../computeActiveId';

/**
 * The active-subsection selector is document-order based: the active anchor is the
 * LAST one (in doc order) whose top has scrolled above the activation line. This is
 * what makes it robust to a PINNED sticky anchor (leadWithBench bench): such an
 * anchor sits visually near the top forever, but because it is doc-FIRST it is only
 * the "last above the line" when nothing later is — i.e. at the very top — so it
 * reclaims active on scroll-up instead of leaving a stale theory anchor selected.
 */
describe('computeActiveId', () => {
  const topOf = (tops: Record<string, number | null>) => (id: string) => tops[id] ?? null;

  it('returns null when no anchor has crossed the activation line yet', () => {
    expect(computeActiveId(['a', 'b', 'c'], 100, topOf({ a: 200, b: 400, c: 600 }))).toBeNull();
  });

  it('returns the last doc-order anchor whose top is above the line (normal scroll)', () => {
    // a scrolled well above, b just above the line, c still below
    expect(computeActiveId(['a', 'b', 'c'], 100, topOf({ a: -50, b: 60, c: 300 }))).toBe('b');
  });

  it('resets to a pinned doc-first anchor at the top (sticky bench, scrolled all the way up)', () => {
    // sim pinned near the top (always above the line); theory anchors are below it
    expect(computeActiveId(['sim', 'checks', 'theory'], 120, topOf({ sim: 24, checks: 300, theory: 500 }))).toBe('sim');
  });

  it('does not let a pinned doc-first anchor dominate once a later anchor crosses the line', () => {
    // sim pinned at 24 (above line) but checks has also crossed → checks wins (doc-after sim)
    expect(computeActiveId(['sim', 'checks', 'theory'], 120, topOf({ sim: 24, checks: 80, theory: 400 }))).toBe('checks');
  });

  it('ignores anchors whose element is missing (null top)', () => {
    expect(computeActiveId(['a', 'gone', 'c'], 100, topOf({ a: 50, gone: null, c: 300 }))).toBe('a');
  });
});
