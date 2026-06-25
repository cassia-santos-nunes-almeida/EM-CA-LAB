import { describe, it, expect } from 'vitest';
import { fieldLineArrowAngle } from '../physics';

/**
 * Permanent net (sim-sign) + sweep N3 — coulomb field-line arrowhead direction.
 *
 * Field lines are traced AWAY from their seed (direction = −1 for a negative seed), but
 * the arrowhead must show the true field E, which points TOWARD a negative charge. The
 * bug took the arrow angle from the trace step (∝ direction·E), so negative-seeded lines
 * pointed outward. The arrow must follow E, independent of the trace direction.
 */
describe('coulomb field-line arrowheads follow the field, not the trace direction (N3)', () => {
  it('is identical whichever way the line is traced', () => {
    const Ex = 0.6, Ey = -0.8;
    expect(fieldLineArrowAngle(Ex, Ey, 1)).toBeCloseTo(fieldLineArrowAngle(Ex, Ey, -1), 10);
  });

  it('points toward a negative charge (inward), where E points', () => {
    // At (+r,0) of a charge at the origin the field is along −x (Ex<0); a line seeded on a
    // q<0 charge is traced with direction=−1. The arrowhead must still point −x (inward).
    expect(Math.cos(fieldLineArrowAngle(-1, 0, -1))).toBeLessThan(0);
  });
});
