import { describe, it, expect } from 'vitest';
import {
  dot2, cross2z, angleBetweenDeg, projectionLength, vecFromPolarDeg, magnitude, vadd,
} from '@em/sections/math-vectors/physics';

/**
 * Hand-derived vectors (magneticCircuits.test.ts style). These are the same
 * numbers the section's ConceptChecks and YourTurnPanel quote — if a formula
 * card and this module ever disagree, the mirror fails here, not on a student.
 */
describe('math-vectors physics (hand-derived)', () => {
  it('dot2: (3,4)·(−2,1) = −2; orthogonal pair gives exactly 0', () => {
    expect(dot2({ x: 3, y: 4 }, { x: -2, y: 1 })).toBe(-2);
    expect(dot2({ x: 1, y: 0 }, { x: 0, y: 5 })).toBe(0);
  });
  it('dot2 equals |A||B|cosθ on a non-axis pair (2∠0°, 3∠60° → 3)', () => {
    const a = vecFromPolarDeg(2, 0);
    const b = vecFromPolarDeg(3, 60);
    expect(dot2(a, b)).toBeCloseTo(2 * 3 * Math.cos(Math.PI / 3), 12);
  });
  it('cross2z: x̂×ŷ = +1 (out of screen, RH rule), ŷ×x̂ = −1, parallel → 0', () => {
    expect(cross2z({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(cross2z({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
    expect(cross2z({ x: 2, y: 0 }, { x: 3, y: 0 })).toBe(0);
  });
  it('|cross2z| equals |A||B|sinθ at θ = 120° (2∠0°, 1.5∠120°)', () => {
    const a = vecFromPolarDeg(2, 0);
    const b = vecFromPolarDeg(1.5, 120);
    expect(cross2z(a, b)).toBeCloseTo(2 * 1.5 * Math.sin((2 * Math.PI) / 3), 12);
  });
  it('angleBetweenDeg: 90 orthogonal, 180 antiparallel, 0 parallel', () => {
    expect(angleBetweenDeg({ x: 1, y: 0 }, { x: 0, y: 2 })).toBeCloseTo(90, 9);
    expect(angleBetweenDeg({ x: 1, y: 0 }, { x: -3, y: 0 })).toBeCloseTo(180, 9);
    expect(angleBetweenDeg({ x: 2, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(0, 9);
  });
  it('projectionLength is signed |B|cosθ: 2∠120° onto x̂ → −1', () => {
    expect(projectionLength(vecFromPolarDeg(2, 120), { x: 1, y: 0 })).toBeCloseTo(-1, 9);
    expect(magnitude({ x: 3, y: 4 })).toBe(5);
  });
  it('vadd is componentwise: (3,4)+(−2,1) = (1,5); two equal right-angle pushes → √2 × one push', () => {
    expect(vadd({ x: 3, y: 4 }, { x: -2, y: 1 })).toEqual({ x: 1, y: 5 });
    expect(magnitude(vadd({ x: 1, y: 0 }, { x: 0, y: 1 }))).toBeCloseTo(Math.SQRT2, 12);
  });
});
