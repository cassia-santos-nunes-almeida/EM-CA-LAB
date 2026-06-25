import { describe, it, expect } from 'vitest';
import { Q_CIRCULAR } from '../index';

/**
 * #9 batch 2 (09c) — A.2#11: Q_CIRCULAR's procedural/worked hints wrote the
 * y-component as Ey = E₀cos(ωt − δ), but the equation panel uses the +δ
 * convention: E_y = ey·cos(kz − ωt + δ). Harmless to the answer (90°) but an
 * internal inconsistency a student comparing hint to panel would trip on.
 * Align the hint to +δ and export Q_CIRCULAR so the convention is pinned.
 */
describe('Q_CIRCULAR hints follow the panel +δ convention (A.2#11)', () => {
  const hintText = Q_CIRCULAR.hints.map((h) => h.content).join('\n');

  it('writes the y-component with +δ, matching E_y = …cos(kz − ωt + δ)', () => {
    expect(hintText).toContain('cos(ωt + δ)');
    expect(hintText).not.toContain('cos(ωt − δ)'); // U+2212 minus (old)
    expect(hintText).not.toContain('cos(ωt - δ)'); // ASCII hyphen guard
  });

  it('leaves the correct answer (90°) unchanged', () => {
    expect(Q_CIRCULAR.correctIndex).toBe(2);
    expect(Q_CIRCULAR.options[Q_CIRCULAR.correctIndex]).toBe('90°');
  });
});
