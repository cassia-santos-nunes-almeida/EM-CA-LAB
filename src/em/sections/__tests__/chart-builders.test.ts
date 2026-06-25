import { describe, it, expect } from 'vitest';
import { buildForceData, magnitudeInCoulombs } from '@em/sections/coulomb/chartData';
import { buildGaussData } from '@em/sections/gauss/chartData';
import { buildSnapshotData, buildPowerData, waveNumber } from '@em/sections/em-wave/chartData';

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

/**
 * #9 batch 2 (09c) — golden worked-numbers net. The builders above were pinned
 * only structurally (F>0, E>0, axis values); these assertions pin the actual
 * physics magnitude the student sees plotted, so a future formula drift fails.
 * Every expected value is independently hand-derived (not recomputed from the
 * builder's own expression) using the app's real constants.
 */
describe('em-wave waveNumber helper (A.5 #11 — single k formula, no double-rounding)', () => {
  it('computes k = 2π·f·n / 300 directly', () => {
    expect(waveNumber(1, 1)).toBeCloseTo(0.020944, 6); // 2π/300
    expect(Number(waveNumber(1, 1).toFixed(3))).toBe(0.021); // default displayed kVal unchanged
    expect(waveNumber(3, 1.5)).toBeCloseTo(0.094248, 6);
  });

  it('avoids the old double-rounding (k from a λ pre-rounded to a whole number)', () => {
    // old: lambda=(300/(f·n)).toFixed(0) then k=2π/lambda. Pick f·n where λ rounds heavily.
    const f = 2.6, n = 1.33; // f·n = 3.458 → λ = 86.76, old rounds λ→87
    const direct = waveNumber(f, n);
    const doubleRounded = (2 * Math.PI) / parseFloat((300 / (f * n)).toFixed(0));
    expect(direct).not.toBeCloseTo(doubleRounded, 4); // they diverge before the .toFixed(3) display
  });
});

describe('coulomb µC→C magnitude helper (A.5 #7 dedup)', () => {
  it('converts microcoulombs to a coulomb magnitude', () => {
    expect(magnitudeInCoulombs(4)).toBeCloseTo(4e-6, 12);
    expect(magnitudeInCoulombs(-2)).toBeCloseTo(2e-6, 12); // magnitude (|q|)
    expect(magnitudeInCoulombs(0)).toBe(0);
  });
});

describe('golden worked-numbers: chart builders plot the correct physics values', () => {
  it('Coulomb F = k·q₁·q₂/r² (4 µC, 2 µC)', () => {
    const d = buildForceData(4e-6, 2e-6, K_COULOMB);
    expect(d[0].F).toBeCloseTo(179.76, 2);    // r = 0.020 m
    expect(d[39].F).toBeCloseTo(0.30193, 4);  // r = 0.488 m (inverse-square)
    // q₂: 2 µC → 4 µC doubles F at every r.
    expect(buildForceData(4e-6, 4e-6, K_COULOMB)[0].F).toBeCloseTo(359.52, 2);
  });

  it('Gauss radial E = |Q|/(4πε₀r²) (Q = 5 µC)', () => {
    const d = buildGaussData('ELECTRIC', 5, 5e-6 / EPSILON_0, EPSILON_0);
    expect(d[0].r).toBeCloseTo(0.2, 2);
    expect(d[0].E).toBeCloseTo(1123467.8, 0);   // r = 0.2 m
    expect(d[29].r).toBeCloseTo(1.94, 2);
    expect(d[29].E).toBeCloseTo(11940.35, 1);   // r = 1.94 m
  });

  it('EM-wave instantaneous power P = v·i/1000 (V₀=80, I₀=60, in phase, f=1 Hz)', () => {
    const omega = 2 * Math.PI * 1.0;
    const d = buildPowerData(80, 60, omega, 0, 0);
    expect(d[1].P).toBeCloseTo(0.46, 2);  // t = 0.05 s
    expect(d[5].P).toBeCloseTo(4.8, 2);   // t = 0.25 s — both sines peak: 80·60/1000
    expect(d[10].P).toBeCloseTo(0, 2);    // t = 0.50 s — both sines ≈ 0
  });

  it('EM-wave snapshot E and true-scale B at an independent point (x = 6)', () => {
    const k = (2 * Math.PI * 1.0 * 1.0) / 300;
    const d = buildSnapshotData(40, k, 1.0);
    // sin(k·6) = sin(0.125664) = 0.125334 → E = 40·0.125334, B = (40/300)·0.125334
    expect(d[1].E).toBeCloseTo(5.01, 2);
    expect(d[1].B).toBeCloseTo(0.0167, 4);
  });
});
