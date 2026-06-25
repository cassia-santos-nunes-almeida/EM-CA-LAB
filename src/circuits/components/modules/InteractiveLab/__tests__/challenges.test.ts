import { describe, it, expect } from 'vitest';
import { getChallenges } from '../challenges';

/**
 * A.2#4 — the "Make it Ring" challenge wins at ζ<0.3, i.e. R < 2·0.3·√(L/C). For the
 * defaults L=0.1 H, C=1e-4 F that is R < ~19 Ω; the hint said "below 30 Ω", where ζ≈0.47
 * and the challenge can never be won.
 */
const ring = (R: number) =>
  getChallenges({ circuitType: 'RLC', inputType: 'step', R, L: 0.1, C: 0.0001 }).find(
    (c) => c.id === 'make-it-ring',
  )!;

describe('"Make it Ring" hint names an R that actually wins (A.2#4)', () => {
  it('rings below ~19 Ω but not at the old hinted 30 Ω', () => {
    expect(ring(18).check()).toBe(true); // ζ ≈ 0.285 < 0.3
    expect(ring(30).check()).toBe(false); // ζ ≈ 0.474 — never wins
  });

  it('points the student at ~19 Ω, not the unwinnable 30 Ω', () => {
    expect(ring(18).hint).toMatch(/19/);
    expect(ring(18).hint).not.toMatch(/30/);
  });
});
