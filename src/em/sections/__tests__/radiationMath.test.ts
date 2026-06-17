import { describe, it, expect } from 'vitest';
import { chargeY, fieldLinePoint, type ChargeParams } from '@em/sections/maxwell/radiationMath';

/* ─── Shared parameters ──────────────────────────────────────────── */

// amp 30 px, ω = 2π rad per time unit (period = 1), kick hop 40 px over τ = 0.2.
const P: ChargeParams = { amp: 30, omega: 2 * Math.PI, kickDist: 40, kickTau: 0.2 };

/* ─── chargeY ────────────────────────────────────────────────────── */

describe('chargeY', () => {
  it('rest mode: the charge never moves', () => {
    expect(chargeY('rest', 123, P)).toBe(0);
  });

  it('oscillate mode: quarter period sits at full amplitude', () => {
    // 30·sin(2π·0.25) = 30·sin(π/2) = 30
    expect(chargeY('oscillate', 0.25, P)).toBeCloseTo(30, 10);
  });

  it('oscillate mode: half period crosses zero', () => {
    // 30·sin(2π·0.5) = 30·sin(π) ≈ 0
    expect(chargeY('oscillate', 0.5, P)).toBeCloseTo(0, 10);
  });

  it('kick mode: nothing happens before t = 0', () => {
    expect(chargeY('kick', -1, P)).toBe(0);
  });

  it('kick mode: smoothstep midpoint is half the hop', () => {
    // u = t/τ = 0.1/0.2 = 0.5; s(0.5) = 3·0.25 − 2·0.125 = 0.5 ⇒ 40·0.5 = 20
    expect(chargeY('kick', 0.1, P)).toBeCloseTo(20, 10);
  });

  it('kick mode: long after the kick the charge holds at kickDist', () => {
    expect(chargeY('kick', 5, P)).toBe(40);
  });
});

/* ─── fieldLinePoint ─────────────────────────────────────────────── */

describe('fieldLinePoint', () => {
  it('oscillate: a point one full period of light-travel out is purely radial', () => {
    // retarded t = 1 − 100/100 = 0 ⇒ chargeY = 0 — the line is purely radial
    const pt = fieldLinePoint('oscillate', 1, 100, 0, 100, P);
    expect(pt.dx).toBeCloseTo(100, 10);
    expect(pt.dy).toBeCloseTo(0, 10);
  });

  it('oscillate: equatorial spoke carries the transverse kink offset', () => {
    // retarded t = 1 − 75/100 = 0.25 ⇒ chargeY = 30 — THE kink: transverse offset
    const pt = fieldLinePoint('oscillate', 1, 75, 0, 100, P);
    expect(pt.dx).toBeCloseTo(75, 10);
    expect(pt.dy).toBeCloseTo(30, 10);
  });

  it('oscillate: pole spoke at zero retarded displacement is just the radius', () => {
    // retarded t = 1 − 50/100 = 0.5 ⇒ chargeY ≈ 0; θ = π/2 pole spoke ⇒ dy = r
    const pt = fieldLinePoint('oscillate', 1, 50, Math.PI / 2, 100, P);
    expect(pt.dx).toBeCloseTo(0, 10);
    expect(pt.dy).toBeCloseTo(50, 10);
  });

  it('rest: straight spoke — the no-radiation control (equatorial)', () => {
    // r·cos 0 = 60, r·sin 0 = 0 regardless of t
    const pt = fieldLinePoint('rest', 42, 60, 0, 2, P);
    expect(pt.dx).toBeCloseTo(60, 10);
    expect(pt.dy).toBeCloseTo(0, 10);
  });

  it('rest: straight spoke — the no-radiation control (45°)', () => {
    // r = 80, θ = π/4 ⇒ dx = dy = 80/√2 ≈ 56.5685
    const pt = fieldLinePoint('rest', 7, 80, Math.PI / 4, 2, P);
    expect(pt.dx).toBeCloseTo(80 / Math.SQRT2, 10);
    expect(pt.dy).toBeCloseTo(80 / Math.SQRT2, 10);
  });
});
