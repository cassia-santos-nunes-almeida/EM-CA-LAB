import { describe, it, expect } from 'vitest';
import { antennaRingLabelDeg } from '../radiationPatternRing';

/**
 * #9 batch 2 — antenna polar-plot degree-ring labels (Appendix A.1#10).
 *
 * The pattern (plotX/plotY) and the "Antenna axis"/"Broadside" text are correct; only
 * the NUMERIC ring was inverted vs the antenna θ convention (θ=0 along the axis, θ=90
 * broadside). A ring tick is drawn at plot angle `deg` (CCW from +x): the antenna θ
 * shown there must be (90−deg) mod 360, so the ring reads 0°(axis)→90°(broadside)→180°.
 * This is a relabel only — calculateRadiationPattern / plotX / plotY are untouched.
 */
describe('antenna ring labels match the θ-from-axis convention (A.1#10)', () => {
  it('labels the broadside ticks (right & left) as 90° / 270°, not 0° / 180°', () => {
    expect(antennaRingLabelDeg(0)).toBe(90); // right = broadside
    expect(antennaRingLabelDeg(180)).toBe(270); // left = broadside (full-circle θ sweep)
  });

  it('labels the antenna-axis ticks (top & bottom) as the 0°/180° nulls', () => {
    expect(antennaRingLabelDeg(90)).toBe(0); // top = along the axis (null)
    expect(antennaRingLabelDeg(270)).toBe(180); // bottom = along the axis (null)
  });

  it('increases monotonically clockwise from the top axis', () => {
    expect(antennaRingLabelDeg(60)).toBe(30);
    expect(antennaRingLabelDeg(30)).toBe(60);
    expect(antennaRingLabelDeg(330)).toBe(120);
  });
});
