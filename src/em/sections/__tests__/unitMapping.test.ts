import { describe, it, expect } from 'vitest';
import {
  V_UNIT_M_PER_S,
  pxPerSecToKms,
  sliderToSpeedKms,
  cyclotronRadiusMm,
  forceAttoN,
} from '@em/sections/lorentz/unitMapping';
import {
  EMF_SCALE_V,
  rateToHz,
  emfArbToMillivolts,
} from '@em/sections/faraday/unitMapping';

describe('lorentz unit mapping (1 px = 1 mm, q in e, m in u, B in mT)', () => {
  it('V_UNIT_M_PER_S pins the e/u derivation: 1e-3 · (e/u) · 1e-3 ≈ 96.485 m/s per px/s', () => {
    // e/u = 1.602176634e-19 / 1.66053907e-27 = 9.6485332e7 C/kg
    // (cross-check: Faraday constant 96485.33 C/mol ÷ 1e-3 kg/mol = 9.6485e7 C/kg)
    // V_UNIT = 1e-3 · 9.6485332e7 · 1e-3 = 96.48533
    expect(V_UNIT_M_PER_S).toBeCloseTo(96.485, 3);
  });

  it('sliderToSpeedKms(50): default slider → 50·2.5 px/s · 96.48533 / 1000 ≈ 12.061 km/s', () => {
    // 125 × 96.48533 = 12060.67 m/s = 12.0607 km/s (spec §3.1 default sanity)
    expect(sliderToSpeedKms(50)).toBeCloseTo(12.061, 3);
  });

  it('sliderToSpeedKms(-50): magnitude — negative slider gives the same speed', () => {
    expect(sliderToSpeedKms(-50)).toBeCloseTo(12.061, 3);
  });

  it('pxPerSecToKms(125): the sim velocity (slider 50 × 2.5) maps to the same 12.061 km/s', () => {
    expect(pxPerSecToKms(125)).toBeCloseTo(12.061, 3);
  });

  it('cyclotronRadiusMm at the defaults (deuteron, 2.5 mT, 12.0607 km/s) is the 100 mm orbit oracle', () => {
    // r = mv/(qB) = (2 × 1.66053907e-27 × 1.20607e4) / (1 × 1.602176634e-19 × 2.5e-3)
    //   = 4.00544e-23 / 4.00544e-22 = 0.1000 m = 100 mm (spec §3.1 route 2)
    expect(cyclotronRadiusMm(2, 1, 2.5, 12.0607)).toBeCloseTo(100.0, 1);
  });

  it('mapping-honesty invariant: the screen-px radius IS the mm radius', () => {
    // The sim draws r_px = m·v_px/(q·B_sim); the SI mapping must reproduce it exactly,
    // because V_UNIT was DERIVED from the r_px ≡ r_mm consistency requirement (§3.1).
    const tuples: Array<[number, number, number, number]> = [
      [1, 1, 1, 100],
      [2, 1, 2.5, 125],
      [4, 2, 3.5, 210],
    ];
    for (const [m, q, bSim, vPx] of tuples) {
      const simRadiusPx = (m * vPx) / (q * bSim);
      expect(cyclotronRadiusMm(m, q, bSim, pxPerSecToKms(vPx))).toBeCloseTo(simRadiusPx, 1);
    }
  });

  it('cyclotronRadiusMm guards q = 0 with Infinity (mirrors the sim hover readout)', () => {
    expect(cyclotronRadiusMm(2, 0, 2.5, 12)).toBe(Infinity);
  });

  it('cyclotronRadiusMm guards B = 0 with Infinity', () => {
    expect(cyclotronRadiusMm(2, 1, 0, 12)).toBe(Infinity);
  });

  it('forceAttoN at the defaults ≈ 4.831 aN', () => {
    // F = qvB = 1.602176634e-19 × 1.20607e4 × 2.5e-3 = 4.831e-18 N = 4.831 aN
    // (display-constant route: 1 × 12.0607 × 2.5 × 0.1602177 = 4.831 ✓)
    expect(forceAttoN(1, 12.0607, 2.5)).toBeCloseTo(4.831, 2);
  });

  it('forceAttoN with zero charge is exactly 0', () => {
    expect(forceAttoN(0, 12, 2.5)).toBe(0);
  });
});

describe('faraday unit mapping (B0 = 50 mT, a = 5 cm, f = rate × 10 Hz)', () => {
  it('rateToHz maps the slider range 0.1–3.0 to 1–30 Hz', () => {
    expect(rateToHz(0.5)).toBe(5);
    expect(rateToHz(3)).toBe(30);
  });

  it('EMF_SCALE_V ≈ 0.024674 V per internal unit', () => {
    // B0·A·2π·10 = 0.05 × 7.853982e-3 × 62.831853 = 0.0246740 V (spec §4.1)
    expect(EMF_SCALE_V).toBeCloseTo(0.024674, 6);
  });

  it('emfArbToMillivolts(1): one internal unit = the per-turn peak at 10 Hz ≈ 24.674 mV', () => {
    expect(emfArbToMillivolts(1)).toBeCloseTo(24.674, 3);
  });

  it('emfArbToMillivolts(30): maxed-out sim (N = 10, f = 30 Hz) ≈ 740.22 mV', () => {
    // Direct route: 10 × 0.05 × 7.853982e-3 × 2π×30 = 0.075π² = 0.740220 V ✓ (§4.1 cross-check b)
    expect(emfArbToMillivolts(30)).toBeCloseTo(740.22, 2);
  });

  it('emfArbToMillivolts(-10): sign-preserving ≈ −246.74 mV', () => {
    // |value| matches §4.1 cross-check c: N = 10, rate = 1 → internal peak 10 → 246.7 mV
    expect(emfArbToMillivolts(-10)).toBeCloseTo(-246.74, 2);
  });
});
