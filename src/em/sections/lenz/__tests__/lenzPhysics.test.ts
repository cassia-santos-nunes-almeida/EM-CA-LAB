import { describe, it, expect } from 'vitest';
import { brakingForceArrowX } from '../physics';
import { Q_RING_DIR } from '../index';

/**
 * #9 batch 2 — lenz tier-1 physics correctness (Appendix A.1 #4, #5).
 *
 * Call-site-bound assertions:
 *  - #4: the F_mag braking-force arrow drawn at index.tsx (drawArrow(..., fLen, ...))
 *        must oppose the magnet's velocity on BOTH halves of the canvas. `intensity`
 *        (= emfNorm) has sign(intensity) = sign(dNorm·v), so it flips with the magnet's
 *        side; the correct braking direction is −sign(v), independent of side.
 *  - #5: the Q_RING_DIR ConceptCheck rendered at index.tsx:490 must not double-key
 *        the correct direction (two "clockwise" options, one graded wrong).
 */
describe('lenz braking-force arrow opposes velocity on both sides of the coil (A.1#4)', () => {
  it('opposes v when the magnet is RIGHT of the coil (intensity tracks +sign(v))', () => {
    expect(Math.sign(brakingForceArrowX(2, 8))).toBe(-1); // v>0 ⇒ force points left
    expect(Math.sign(brakingForceArrowX(-2, -8))).toBe(1); // v<0 ⇒ force points right
  });

  it('opposes v when the magnet is LEFT of the coil (intensity tracks −sign(v)) — the default region', () => {
    // The buggy sign(-intensity) form AIDS v here (points with the velocity).
    expect(Math.sign(brakingForceArrowX(2, -8))).toBe(-1); // v>0 ⇒ force points left
    expect(Math.sign(brakingForceArrowX(-2, 8))).toBe(1); // v<0 ⇒ force points right
  });

  it('scales magnitude with the induced-EMF intensity, capped at 150', () => {
    expect(Math.abs(brakingForceArrowX(1, 5))).toBeCloseTo(50); // 5·10, under the cap
    expect(Math.abs(brakingForceArrowX(1, 100))).toBe(150); // capped
  });
});

describe('lenz Q_RING_DIR ConceptCheck has no directional double-key (A.1#5)', () => {
  const namesClockwise = (s: string) =>
    /clockwise/i.test(s) && !/counter[- ]?clockwise/i.test(s);

  it('keys exactly one option to the correct "clockwise" direction', () => {
    const clockwiseIdx = Q_RING_DIR.options
      .map((text, i) => ({ text, i }))
      .filter(({ text }) => namesClockwise(text))
      .map(({ i }) => i);
    // Pre-fix: options 0 ("Clockwise, to maintain…") and 2 ("Clockwise, to oppose…")
    // both name the correct direction with equivalent Lenz reasoning, yet 0 is wrong.
    expect(clockwiseIdx).toEqual([Q_RING_DIR.correctIndex]);
  });
});
