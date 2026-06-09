import { describe, it, expect } from 'vitest';
import { buildForceData } from '@em/sections/coulomb/chartData';
import { buildGaussData } from '@em/sections/gauss/chartData';
import { buildSnapshotData, buildPowerData } from '@em/sections/em-wave/chartData';

const K_COULOMB = 8.988e9;
const EPSILON_0 = 8.854e-12;

describe('chart data builders keep x numeric', () => {
  it('coulomb forceData: r is a number and F is positive', () => {
    // 4 μC and 2 μC representative values (in C)
    const q1 = 4e-6;
    const q2 = 2e-6;
    const d = buildForceData(q1, q2, K_COULOMB);
    expect(d).toHaveLength(40);
    expect(typeof d[0].r).toBe('number');
    expect(d.every(p => p.F > 0)).toBe(true);
  });

  it('coulomb forceData: r values are numeric and match expected range', () => {
    const d = buildForceData(4e-6, 4e-6, K_COULOMB);
    // First point: r = 0.02 + 0 * 0.012 = 0.020
    expect(d[0].r).toBeCloseTo(0.02, 3);
    // Last point: r = 0.02 + 39 * 0.012 = 0.488
    expect(d[39].r).toBeCloseTo(0.488, 3);
  });

  it('gauss data ELECTRIC mode: r is a number and E is positive for nonzero charge', () => {
    const Q = 5e-6; // 5 μC → flux = Q / EPSILON_0
    const flux = Q / EPSILON_0;
    const d = buildGaussData('ELECTRIC', 5, flux, EPSILON_0);
    expect(d).toHaveLength(30);
    expect(typeof d[0].r).toBe('number');
    expect(d.every(p => p.E > 0)).toBe(true);
  });

  it('gauss data ELECTRIC mode charge===0: E is zero (log-zero guard)', () => {
    const flux = 0;
    const d = buildGaussData('ELECTRIC', 0, flux, EPSILON_0);
    expect(d.every(p => p.E === 0)).toBe(true);
  });

  it('gauss data MAGNETIC mode: r is a number and E is zero', () => {
    const d = buildGaussData('MAGNETIC', 0, 0, EPSILON_0);
    expect(typeof d[0].r).toBe('number');
    expect(d.every(p => p.E === 0)).toBe(true);
  });

  it('em-wave snapshot: x is a number', () => {
    const k = (2 * Math.PI * 1.0 * 1.0) / 300;
    const d = buildSnapshotData(40, k, 1.0);
    expect(d).toHaveLength(50);
    expect(typeof d[0].x).toBe('number');
    // First point: x = 0
    expect(d[0].x).toBe(0);
    // Last point: x = 49 * 6 = 294
    expect(d[49].x).toBe(294);
  });

  it('em-wave snapshot: B is at true scale (not multiplied by c)', () => {
    const k = (2 * Math.PI * 1.0 * 1.0) / 300;
    const amplitude = 40;
    const refractiveIndex = 1.0;
    const d = buildSnapshotData(amplitude, k, refractiveIndex);
    // At x=0, sin(k*0) = 0, so E=0 and B=0 — check a non-zero point
    // At i=1: x=6, E = amplitude * sin(k*6), B = (amplitude * n / 300) * sin(k*6)
    // B should be E * refractiveIndex / 300 (true scale, not ×300)
    const pt = d[1];
    const x = 6;
    const sinVal = Math.sin(k * x);
    const expectedB = (amplitude * refractiveIndex / 300) * sinVal;
    expect(pt.B).toBeCloseTo(+expectedB.toFixed(4), 4);
    // Verify B is NOT the ×300 scaled version
    expect(Math.abs(pt.B)).toBeLessThan(1); // true B << E in magnitude
  });

  it('em-wave power: t is a number', () => {
    const omega = 2 * Math.PI * 1.0;
    const d = buildPowerData(80, 60, omega, 0, 0);
    expect(d).toHaveLength(60);
    expect(typeof d[0].t).toBe('number');
    // First point: t = 0.00
    expect(d[0].t).toBe(0);
    // Last point: t = 59 * 0.05 = 2.95
    expect(d[59].t).toBeCloseTo(2.95, 2);
  });
});
