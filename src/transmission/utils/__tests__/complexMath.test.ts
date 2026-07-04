import { describe, it, expect } from 'vitest';
import { cadd, cmul, cdiv, fromPolarDeg, toPolarDeg, expJ } from '@transmission/utils/complexMath';

describe('complexMath (Euler anchors, hand-derived)', () => {
  it('j·j = −1: the 90°-rotation-twice identity', () => {
    const j = { real: 0, imag: 1 };
    const jj = cmul(j, j);
    expect(jj.real).toBeCloseTo(-1, 12);
    expect(jj.imag).toBeCloseTo(0, 12);
  });
  it('Euler: e^{jπ} = −1 and e^{jπ/2} = j', () => {
    expect(expJ(Math.PI).real).toBeCloseTo(-1, 12);
    expect(expJ(Math.PI).imag).toBeCloseTo(0, 12);
    expect(expJ(Math.PI / 2).real).toBeCloseTo(0, 12);
    expect(expJ(Math.PI / 2).imag).toBeCloseTo(1, 12);
  });
  it('multiplication multiplies magnitudes and adds angles: (2∠30°)(3∠45°) = 6∠75°', () => {
    const p = toPolarDeg(cmul(fromPolarDeg(2, 30), fromPolarDeg(3, 45)));
    expect(p.mag).toBeCloseTo(6, 12);
    expect(p.angleDeg).toBeCloseTo(75, 12);
  });
  it('phasor addition beats trig identities: 3∠0° + 4∠90° = 5∠53.13°', () => {
    const s = toPolarDeg(cadd(fromPolarDeg(3, 0), fromPolarDeg(4, 90)));
    expect(s.mag).toBeCloseTo(5, 12);
    expect(s.angleDeg).toBeCloseTo(53.130102, 5);
  });
  it('the quarter-wave flip: Γ_L·e^{−j2βl} at βl = 90° is −Γ_L', () => {
    const gammaL = { real: 0.5, imag: 0 };
    const g = cmul(gammaL, expJ(-Math.PI)); // e^{−j2βl}, 2βl = 180°
    expect(g.real).toBeCloseTo(-0.5, 12);
    expect(g.imag).toBeCloseTo(0, 12);
  });
  it('division divides magnitudes and subtracts angles: (6∠75°)/(3∠45°) = 2∠30°; 1/j = −j', () => {
    const q = toPolarDeg(cdiv(fromPolarDeg(6, 75), fromPolarDeg(3, 45)));
    expect(q.mag).toBeCloseTo(2, 12);
    expect(q.angleDeg).toBeCloseTo(30, 12);
    const invJ = cdiv({ real: 1, imag: 0 }, { real: 0, imag: 1 });
    expect(invJ.real).toBeCloseTo(0, 12);
    expect(invJ.imag).toBeCloseTo(-1, 12);
  });
  it('toPolarDeg normalizes the atan2(−0, −1) = −π corner into (−180, 180]', () => {
    expect(toPolarDeg({ real: -1, imag: -0 }).angleDeg).toBeCloseTo(180, 12);
  });
});
