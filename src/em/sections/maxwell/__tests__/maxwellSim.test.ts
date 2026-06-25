import { describe, it, expect } from 'vitest';
import { faradayOrbitSign } from '../physics';

/**
 * Permanent net (sim-sign) + sweep N4 — maxwell drawFaraday induced-E orbit handedness.
 *
 * flux>0 is drawn ⊙ (out of page); dFlux>0 ⇒ the out-of-page flux is INCREASING, so by
 * Lenz the induced E opposes it (drives a CLOCKWISE current as seen from the +z/viewer
 * side). The orbit dot is (cos angle, sin angle) on a y-DOWN canvas, where screen-clockwise
 * means the angle INCREASES — so the sign applied to the angle must be +1 for dFlux>0.
 */
describe('maxwell Faraday induced-E orbit has the correct handedness (N4)', () => {
  it('uses +1 (screen-clockwise) for increasing out-of-page flux', () => {
    expect(faradayOrbitSign(1)).toBe(1);
    expect(faradayOrbitSign(-1)).toBe(-1);
  });

  it('moves the orbit dot downward from the +x crossing (clockwise on the y-down canvas)', () => {
    const angleAt = (t: number) => t * 0.1 * faradayOrbitSign(1);
    // From angle 0 (the 3-o'clock point), a clockwise step increases screen-y (moves down).
    expect(Math.sin(angleAt(0.5))).toBeGreaterThan(Math.sin(angleAt(0)));
  });
});
