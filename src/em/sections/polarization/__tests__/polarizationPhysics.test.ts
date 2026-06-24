import { describe, it, expect } from 'vitest';
import { orientationPsi, axialRatio, linearSlope } from '../physics';

/**
 * #9 batch 2 — polarization tier-1 displayed-math correctness (Appendix A.1 #6, #7, A.2 #10).
 * These pure functions feed the displayed ψ / AR / Slope readouts in index.tsx (the component
 * just .toFixed()s them), so asserting them binds to the rendered equation panel.
 */
describe('orientation angle ψ uses the general atan2 branch with no ex===ey special case (A.1#7)', () => {
  it('is +45° when Ex=Ey and cos δ > 0', () => {
    expect(orientationPsi(50, 50, 45)).toBeCloseTo(45, 1);
  });

  it('is −45° (not +45°) when Ex=Ey and cos δ < 0', () => {
    // The buggy `ex===ey ? 45` special case forces +45° here; the true tilt is −45°
    // (reachable via Circular quick-set → drag δ to 135°).
    expect(orientationPsi(50, 50, 135)).toBeCloseTo(-45, 1);
  });
});

describe('axial ratio AR = |cot χ| ∈ [1, ∞) (A.1#6)', () => {
  it('equals the major/minor axis ratio for an axis-aligned ellipse (δ=90°)', () => {
    // Ex=3, Ey=1, δ=90° ⇒ χ=18.43° ⇒ AR = cot χ = 3.0 (the bug showed |tan χ| = 0.333).
    expect(axialRatio(3, 1, 90)).toBeCloseTo(3.0, 2);
  });

  it('is 1 for circular polarization', () => {
    expect(axialRatio(50, 50, 90)).toBeCloseTo(1, 4);
  });

  it('is ∞ for linear polarization (natural χ→0 limit, no hard-coded branch)', () => {
    expect(axialRatio(40, 30, 0)).toBe(Infinity);
  });

  it('is always ≥ 1 across elliptical states (never the reciprocal < 1)', () => {
    for (const [ex, ey, d] of [[40, 20, 50], [60, 25, 110], [30, 30, 60], [80, 10, 30]] as const) {
      expect(axialRatio(ex, ey, d)).toBeGreaterThanOrEqual(1 - 1e-9);
    }
  });
});

describe('linear-state slope carries the sign of cos δ (A.2#10)', () => {
  it('is +Ey/Ex at δ=0° and −Ey/Ex at δ=180°', () => {
    expect(linearSlope(2, 1, 0)).toBeCloseTo(0.5, 4);
    expect(linearSlope(2, 1, 180)).toBeCloseTo(-0.5, 4); // buggy form is always +0.5
  });
});
