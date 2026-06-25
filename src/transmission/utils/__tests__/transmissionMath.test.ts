import { describe, it, expect } from 'vitest';
import {
  C,
  calculateMutualInductance,
  calculateSecondaryVoltage,
  calculateActualSecondaryVoltage,
  calculateSecondaryCurrent,
  calculateReflectedImpedance,
  calculateCharacteristicImpedance,
  calculateReflectionCoefficient,
  calculateVSWR,
  calculateWaveSpeed,
  calculatePropagationDelay,
  calculateWavelength,
  calculateBounceVoltages,
  calculateSteadyStateVoltage,
  steadyStateVoltageFromGamma,
  calculateRadiationPattern,
  calculateDirectivity,
  calculateRadiationResistance,
  calculateHPBW,
  calculateComplexReflectionCoefficient,
  calculatePhaseConstant,
  electricalLengthDegrees,
  rotateGamma,
  gammaToImpedance,
  calculateInputImpedance,
  calculateStubReactance,
  quarterWaveTransformerImpedance,
} from '@transmission/utils/transmissionMath';

/* ─── Constants ───────────────────────────────────────────────────── */

describe('constants', () => {
  it('speed of light is 3e8 m/s', () => {
    expect(C).toBe(3e8);
  });
});

/* ─── Mutual Inductance ──────────────────────────────────────────── */

describe('calculateMutualInductance', () => {
  it('returns 0 when k = 0 (no coupling)', () => {
    expect(calculateMutualInductance(0, 10e-3, 10e-3)).toBe(0);
  });

  it('returns sqrt(L1*L2) when k = 1 (perfect coupling)', () => {
    expect(calculateMutualInductance(1, 10e-3, 10e-3)).toBeCloseTo(10e-3);
  });

  it('handles unequal inductances', () => {
    // k=0.5, L1=4mH, L2=9mH → M = 0.5 * sqrt(36e-6) = 0.5 * 6e-3 = 3e-3
    expect(calculateMutualInductance(0.5, 4e-3, 9e-3)).toBeCloseTo(3e-3);
  });
});

/* ─── Transformer Voltages ───────────────────────────────────────── */

describe('calculateSecondaryVoltage (ideal)', () => {
  it('step-up: V2 = V1 * N2/N1', () => {
    expect(calculateSecondaryVoltage(120, 100, 500)).toBeCloseTo(600);
  });

  it('step-down: V2 = V1 * N2/N1', () => {
    expect(calculateSecondaryVoltage(120, 500, 100)).toBeCloseTo(24);
  });

  it('1:1 ratio gives same voltage', () => {
    expect(calculateSecondaryVoltage(120, 50, 50)).toBeCloseTo(120);
  });

  it('returns 0 when N1 = 0', () => {
    expect(calculateSecondaryVoltage(120, 0, 50)).toBe(0);
  });
});

describe('calculateActualSecondaryVoltage', () => {
  it('equals ideal when k = 1', () => {
    expect(calculateActualSecondaryVoltage(120, 50, 50, 1)).toBeCloseTo(120);
  });

  it('scales by k', () => {
    expect(calculateActualSecondaryVoltage(120, 50, 50, 0.5)).toBeCloseTo(60);
  });

  it('returns 0 when k = 0', () => {
    expect(calculateActualSecondaryVoltage(120, 50, 50, 0)).toBe(0);
  });

  it('returns 0 when N1 = 0', () => {
    expect(calculateActualSecondaryVoltage(120, 0, 50, 0.8)).toBe(0);
  });
});

/* ─── Transformer Current ────────────────────────────────────────── */

describe('calculateSecondaryCurrent', () => {
  it('step-up transformer reduces current', () => {
    // I1=2A, N1=100, N2=500 → I2 = 2 * 100/500 = 0.4A
    expect(calculateSecondaryCurrent(2, 100, 500)).toBeCloseTo(0.4);
  });

  it('returns 0 when N2 = 0', () => {
    expect(calculateSecondaryCurrent(2, 100, 0)).toBe(0);
  });
});

/* ─── Reflected Impedance ────────────────────────────────────────── */

describe('calculateReflectedImpedance', () => {
  it('standard case: Zref = (N1/N2)^2 * ZL', () => {
    // N1=100, N2=50, ZL=100 → (100/50)^2 * 100 = 400
    expect(calculateReflectedImpedance(100, 50, 100)).toBeCloseTo(400);
  });

  it('1:1 ratio reflects same impedance', () => {
    expect(calculateReflectedImpedance(50, 50, 75)).toBeCloseTo(75);
  });

  it('returns Infinity when N2 = 0', () => {
    expect(calculateReflectedImpedance(100, 0, 50)).toBe(Infinity);
  });
});

/* ─── Characteristic Impedance ───────────────────────────────────── */

describe('calculateCharacteristicImpedance', () => {
  it('standard lossless line: Z0 = sqrt(L/C)', () => {
    // L'=250nH/m, C'=100pF/m → Z0 = sqrt(250e-9/100e-12) = sqrt(2500) = 50
    expect(calculateCharacteristicImpedance(250e-9, 100e-12)).toBeCloseTo(50);
  });

  it('returns Infinity when Cp = 0', () => {
    expect(calculateCharacteristicImpedance(250e-9, 0)).toBe(Infinity);
  });
});

/* ─── Reflection Coefficient ─────────────────────────────────────── */

describe('calculateReflectionCoefficient', () => {
  it('matched load: Gamma = 0', () => {
    expect(calculateReflectionCoefficient(50, 50)).toBe(0);
  });

  it('open circuit: Gamma = 1', () => {
    expect(calculateReflectionCoefficient(Infinity, 50)).toBe(1);
  });

  it('short circuit: Gamma = -1', () => {
    expect(calculateReflectionCoefficient(0, 50)).toBeCloseTo(-1);
  });

  it('ZL > Z0: positive Gamma', () => {
    // ZL=100, Z0=50 → Gamma = 50/150 = 1/3
    expect(calculateReflectionCoefficient(100, 50)).toBeCloseTo(1 / 3);
  });

  it('ZL < Z0: negative Gamma', () => {
    // ZL=25, Z0=50 → Gamma = -25/75 = -1/3
    expect(calculateReflectionCoefficient(25, 50)).toBeCloseTo(-1 / 3);
  });
});

/* ─── VSWR ───────────────────────────────────────────────────────── */

describe('calculateVSWR', () => {
  it('matched: VSWR = 1', () => {
    expect(calculateVSWR(0)).toBe(1);
  });

  it('total reflection: VSWR = Infinity', () => {
    expect(calculateVSWR(1)).toBe(Infinity);
    expect(calculateVSWR(-1)).toBe(Infinity);
  });

  it('Gamma = 0.5: VSWR = 3', () => {
    expect(calculateVSWR(0.5)).toBeCloseTo(3);
  });

  it('Gamma = 1/3: VSWR = 2', () => {
    expect(calculateVSWR(1 / 3)).toBeCloseTo(2);
  });
});

/* ─── Wave Speed ─────────────────────────────────────────────────── */

describe('calculateWaveSpeed', () => {
  it('standard lossless line', () => {
    // L'=250nH/m, C'=100pF/m → v = 1/sqrt(25e-18) = 1/5e-9 = 2e8 m/s
    expect(calculateWaveSpeed(250e-9, 100e-12)).toBeCloseTo(2e8);
  });
});

/* ─── Propagation Delay ──────────────────────────────────────────── */

describe('calculatePropagationDelay', () => {
  it('standard case', () => {
    // 1m line, v=2e8 → Td = 5ns
    expect(calculatePropagationDelay(1, 2e8)).toBeCloseTo(5e-9);
  });

  it('returns Infinity when v = 0', () => {
    expect(calculatePropagationDelay(1, 0)).toBe(Infinity);
  });
});

/* ─── Wavelength ─────────────────────────────────────────────────── */

describe('calculateWavelength', () => {
  it('1 GHz → 0.3m', () => {
    expect(calculateWavelength(1e9)).toBeCloseTo(0.3);
  });

  it('returns Infinity for f = 0', () => {
    expect(calculateWavelength(0)).toBe(Infinity);
  });
});

/* ─── Bounce Diagram ─────────────────────────────────────────────── */

describe('calculateBounceVoltages', () => {
  it('matched source and load: no reflections', () => {
    // ZL = Z0 = Zs → gammaL = 0, gammaS = 0
    const events = calculateBounceVoltages(10, 50, 50, 0, 0, 4);
    // V0 = 10 * 50/(50+50) = 5V
    expect(events[0].voltage).toBeCloseTo(5);
    // All subsequent bounces have 0 amplitude (gamma=0 kills them)
    for (let i = 1; i < events.length; i++) {
      expect(events[i].voltage).toBeCloseTo(0);
    }
  });

  it('open circuit load: Gamma_L = 1', () => {
    const events = calculateBounceVoltages(10, 50, 50, 1, 0, 2);
    // V0 = 5V. vLoad = 5*(1+1) = 10V after bounce 0
    expect(events[0].vLoad).toBeCloseTo(10);
    // Bounce 1: backward, amplitude = 5*1 = 5V
    expect(events[1].voltage).toBeCloseTo(5);
    expect(events[1].direction).toBe('backward');
  });

  it('short circuit load: Gamma_L = -1', () => {
    const events = calculateBounceVoltages(10, 50, 50, -1, 0, 2);
    // V0 = 5V. vLoad = 5*(1+(-1)) = 0V
    expect(events[0].vLoad).toBeCloseTo(0);
    // Bounce 1: backward, amplitude = 5*(-1) = -5V
    expect(events[1].voltage).toBeCloseTo(-5);
  });

  it('converges toward steady state', () => {
    // Zs=25, Z0=50, ZL=100
    // gammaL = (100-50)/(100+50) = 1/3
    // gammaS = (25-50)/(25+50) = -1/3
    const gammaL = 1 / 3;
    const gammaS = -1 / 3;
    const events = calculateBounceVoltages(10, 25, 50, gammaL, gammaS, 20);
    // Steady state: Vss = 10 * 100/(25+100) = 8V
    const lastEvent = events[events.length - 1];
    expect(lastEvent.vLoad).toBeCloseTo(8, 1);
  });
});

/* ─── Steady-State Voltage ───────────────────────────────────────── */

describe('calculateSteadyStateVoltage', () => {
  it('voltage divider: Vss = Vs * ZL/(Zs + ZL)', () => {
    expect(calculateSteadyStateVoltage(10, 25, 100)).toBeCloseTo(8);
  });

  it('open circuit: Vss = Vs', () => {
    expect(calculateSteadyStateVoltage(10, 50, Infinity)).toBe(10);
  });

  it('short circuit: Vss = 0', () => {
    expect(calculateSteadyStateVoltage(10, 50, 0)).toBe(0);
  });
});

/**
 * A.5 #8 — the gamma-domain steady state BounceDiagram renders. The impedance-domain
 * calculateSteadyStateVoltage above cannot express the marginal/unstable case, so this
 * is the form that must carry the |Γ_L·Γ_S| ≥ 1 ⇒ ∞ guard (the readout shows '∞ (unstable)').
 */
describe('steadyStateVoltageFromGamma', () => {
  it('converges to V0·(1+Γ_L)/(1−Γ_L·Γ_S) when |Γ_L·Γ_S| < 1', () => {
    // matched source (Γ_S=0): Vss = V0·(1+Γ_L)
    expect(steadyStateVoltageFromGamma(5, 0.5, 0)).toBeCloseTo(7.5);
  });

  it('diverges to ∞ at the marginal/unstable boundary |Γ_L·Γ_S| ≥ 1', () => {
    expect(steadyStateVoltageFromGamma(5, 1, -1)).toBe(Infinity); // Γ_L=+1, Γ_S=−1 — sustained oscillation
    expect(steadyStateVoltageFromGamma(5, 1, 1)).toBe(Infinity); // Γ_L·Γ_S=+1 — denom→0
  });
});

/* ─── Radiation Pattern ──────────────────────────────────────────── */

describe('calculateRadiationPattern', () => {
  it('half-wave dipole (L/λ=0.5): max at θ = π/2', () => {
    const maxPattern = calculateRadiationPattern(0.5, Math.PI / 2);
    expect(maxPattern).toBeCloseTo(1, 1); // Should be 1 at broadside
  });

  it('returns 0 on axis (θ = 0)', () => {
    expect(calculateRadiationPattern(0.5, 0)).toBe(0);
  });

  it('returns 0 on axis (θ = π)', () => {
    expect(calculateRadiationPattern(0.5, Math.PI)).toBe(0);
  });
});

/* ─── Radiation Resistance ───────────────────────────────────────── */

describe('calculateRadiationResistance', () => {
  it('half-wave dipole: R_rad ≈ 73 ohms', () => {
    const Rrad = calculateRadiationResistance(0.5);
    expect(Rrad).toBeCloseTo(73, 0); // Within 1 ohm
  });
});

/* ─── Directivity ────────────────────────────────────────────────── */

describe('calculateDirectivity', () => {
  it('half-wave dipole: D ≈ 1.64 (2.15 dBi)', () => {
    const D = calculateDirectivity(0.5);
    expect(D).toBeCloseTo(1.64, 1);
  });
});

/* ─── HPBW ───────────────────────────────────────────────────────── */

describe('calculateHPBW', () => {
  it('half-wave dipole: HPBW ≈ 78°', () => {
    const hpbw = calculateHPBW(0.5);
    expect(hpbw).toBeCloseTo(78, 0); // Within 1 degree
  });
});

/* ─── Complex Reflection Coefficient ─────────────────────────────── */

describe('calculateComplexReflectionCoefficient', () => {
  it('matched load: Gamma = 0', () => {
    const g = calculateComplexReflectionCoefficient(50, 0, 50);
    expect(g.real).toBeCloseTo(0);
    expect(g.imag).toBeCloseTo(0);
    expect(g.magnitude).toBeCloseTo(0);
  });

  it('short circuit: Gamma = -1', () => {
    const g = calculateComplexReflectionCoefficient(0, 0, 50);
    expect(g.real).toBeCloseTo(-1);
    expect(g.imag).toBeCloseTo(0);
    expect(g.magnitude).toBeCloseTo(1);
    expect(g.phaseDeg).toBeCloseTo(180);
  });

  it('real load: same as scalar formula', () => {
    const g = calculateComplexReflectionCoefficient(100, 0, 50);
    expect(g.real).toBeCloseTo(1 / 3);
    expect(g.imag).toBeCloseTo(0);
    expect(g.magnitude).toBeCloseTo(1 / 3);
  });

  it('purely reactive load: |Gamma| = 1', () => {
    const g = calculateComplexReflectionCoefficient(0, 50, 50);
    expect(g.magnitude).toBeCloseTo(1);
  });

  it('complex load: ZL = 25 + j25, Z0 = 50', () => {
    // Gamma = (25+j25 - 50)/(25+j25 + 50) = (-25+j25)/(75+j25)
    // = (-25+j25)(75-j25) / (75²+25²) = (-1875+625+j1875+j625) / 6250
    // = (-1250 + j2500) / 6250 = -0.2 + j0.4
    const g = calculateComplexReflectionCoefficient(25, 25, 50);
    expect(g.real).toBeCloseTo(-0.2);
    expect(g.imag).toBeCloseTo(0.4);
    expect(g.magnitude).toBeCloseTo(Math.sqrt(0.04 + 0.16));
  });

  it('edge case: ZL = 0, Z0 = 0 returns magnitude 1', () => {
    const g = calculateComplexReflectionCoefficient(0, 0, 0);
    expect(g.magnitude).toBe(1);
  });
});

/* ─── Phase Constant ─────────────────────────────────────────────── */

describe('calculatePhaseConstant', () => {
  it('λ = 2 m → β = 2π/2 = π rad/m', () => {
    expect(calculatePhaseConstant(2)).toBeCloseTo(Math.PI);
  });

  it('λ = 0.2 m → β = 2π/0.2 = 10π = 31.4159 rad/m', () => {
    expect(calculatePhaseConstant(0.2)).toBeCloseTo(31.4159, 3);
  });

  it('λ = 0 → NaN (no wavelength, no phase constant)', () => {
    expect(calculatePhaseConstant(0)).toBeNaN();
  });
});

/* ─── Electrical Length ──────────────────────────────────────────── */

describe('electricalLengthDegrees', () => {
  it('0.3λ → 360·0.3 = 108°', () => {
    expect(electricalLengthDegrees(0.3)).toBeCloseTo(108);
  });

  it('λ/8 → 360·0.125 = 45°', () => {
    expect(electricalLengthDegrees(0.125)).toBeCloseTo(45);
  });

  it('l = 0 → 0°', () => {
    expect(electricalLengthDegrees(0)).toBe(0);
  });
});

/* ─── Gamma Rotation ─────────────────────────────────────────────── */

describe('rotateGamma', () => {
  it('the exam rotation: Γ_L = 1/3, l = 0.3λ (βl = 0.6π) → ⅓·e^(−j216°) = ⅓∠144°', () => {
    // Γ(l) = ⅓·e^(−j2·0.6π) = ⅓·e^(−j216°) ≡ ⅓∠+144°
    // real = ⅓·cos 144° = ⅓·(−0.80902) = −0.26967
    // imag = ⅓·sin 144° = ⅓·(+0.58779) = +0.19593
    const g = rotateGamma(1 / 3, 0, 0.6 * Math.PI);
    expect(g.real).toBeCloseTo(-0.2697, 4);
    expect(g.imag).toBeCloseTo(0.1959, 4);
    expect(g.magnitude).toBeCloseTo(0.3333, 4);
    expect(g.phaseDeg).toBeCloseTo(144.0, 1);
  });

  it('full lap: βl = π (l = λ/2) returns Γ to its start', () => {
    const g = rotateGamma(1 / 3, 0, Math.PI);
    expect(g.real).toBeCloseTo(0.3333, 4);
    expect(g.imag).toBeCloseTo(0, 6);
  });

  it('quarter-wave: βl = π/2 → Γ → −Γ (half a lap)', () => {
    const g = rotateGamma(0.5, 0, Math.PI / 2);
    expect(g.real).toBeCloseTo(-0.5);
    expect(g.imag).toBeCloseTo(0, 6);
  });
});

/* ─── Gamma → Impedance ──────────────────────────────────────────── */

describe('gammaToImpedance', () => {
  it('Γ = 1/3 → Z = 50·(4/3)/(2/3) = 100 Ω', () => {
    const z = gammaToImpedance(1 / 3, 0, 50);
    expect(z.real).toBeCloseTo(100);
    expect(z.imag).toBeCloseTo(0);
  });

  it('Γ = −1/3 → Z = 50·(2/3)/(4/3) = 25 Ω', () => {
    const z = gammaToImpedance(-1 / 3, 0, 50);
    expect(z.real).toBeCloseTo(25);
    expect(z.imag).toBeCloseTo(0);
  });

  it('Γ = 0 → Z = Z₀ (matched)', () => {
    const z = gammaToImpedance(0, 0, 50);
    expect(z.real).toBeCloseTo(50);
    expect(z.imag).toBeCloseTo(0);
  });

  it('Γ = +1 → Z = ∞ (open)', () => {
    const z = gammaToImpedance(1, 0, 50);
    expect(z.real).toBe(Infinity);
  });

  it('Γ = −1 → Z = 0 (short)', () => {
    const z = gammaToImpedance(-1, 0, 50);
    expect(z.real).toBeCloseTo(0);
    expect(z.imag).toBeCloseTo(0);
  });

  it('the exam point: Γ = −0.2697 + j0.1959 → Z = 26.93 + j11.87 Ω', () => {
    // Z = 50·(1+Γ)/(1−Γ) with Γ = ⅓∠144°:
    // (0.7303 + j0.1959)/(1.2697 − j0.1959) → ×conj → den |1−Γ|² = 1.6505
    // real = 50·0.88889/1.6505 = 26.93; imag = 50·0.39180/1.6505 = 11.87
    const z = gammaToImpedance(-0.2697, 0.1959, 50);
    expect(z.real).toBeCloseTo(26.93, 1);
    expect(Math.abs(z.real - 26.93)).toBeLessThan(0.05);
    expect(Math.abs(z.imag - 11.87)).toBeLessThan(0.05);
  });
});

/* ─── Input Impedance of a Lossless Line ─────────────────────────── */

describe('calculateInputImpedance', () => {
  it('THE exam task: Z₀ = 50 Ω, Z_L = 100 Ω, l = 0.3λ → 26.93 + j11.87 Ω', () => {
    // βl = 0.6π = 108°, tan 108° = −3.078 (negative past 90° — the classic trap)
    // Z_in = 50·(100 + j50·(−3.078))/(50 + j100·(−3.078))
    //      = 50·(100 − j153.9)/(50 − j307.8)
    //      = 50·(183.5∠−57.0°)/(311.8∠−80.8°) = 29.4∠23.8° = 26.93 + j11.87 Ω
    const z = calculateInputImpedance(100, 0, 50, 0.6 * Math.PI);
    expect(Math.abs(z.real - 26.93)).toBeLessThan(0.05);
    expect(Math.abs(z.imag - 11.87)).toBeLessThan(0.05);
  });

  it('λ/8 warm-up: βl = 45° → exactly 40 − j30 Ω (the 3-4-5 triangle)', () => {
    // tan 45° = 1: Z_in = 50·(100 + j50)/(50 + j100)
    // = 50·(100+j50)(50−j100)/(50²+100²) = 50·(10000 − j7500)/12500 = 40 − j30
    const z = calculateInputImpedance(100, 0, 50, Math.PI / 4);
    expect(z.real).toBeCloseTo(40);
    expect(z.imag).toBeCloseTo(-30);
  });

  it('λ/4 inversion (the gate): Z_in = Z₀²/Z_L = 2500/100 = 25 Ω', () => {
    const z = calculateInputImpedance(100, 0, 50, Math.PI / 2);
    expect(z.real).toBeCloseTo(25);
    expect(z.imag).toBeCloseTo(0);
  });

  it('λ/2 identity: Z_in = Z_L for a real load', () => {
    const z = calculateInputImpedance(100, 0, 50, Math.PI);
    expect(z.real).toBeCloseTo(100);
    expect(z.imag).toBeCloseTo(0);
  });

  it('l = 0: Z_in = Z_L (tan 0 = 0)', () => {
    const z = calculateInputImpedance(100, 0, 50, 0);
    expect(z.real).toBeCloseTo(100);
    expect(z.imag).toBeCloseTo(0);
  });

  it('CC-2 oracle: complex load 80 − j20 Ω through λ/2 → identical 80 − j20 Ω', () => {
    const z = calculateInputImpedance(80, -20, 50, Math.PI);
    expect(z.real).toBeCloseTo(80);
    expect(z.imag).toBeCloseTo(-20);
  });

  it('matched load: length irrelevant (Γ_L = 0 has no phase to rotate)', () => {
    const z = calculateInputImpedance(50, 0, 50, 1.234);
    expect(z.real).toBeCloseTo(50);
    expect(z.imag).toBeCloseTo(0);
  });

  it('short seen through λ/4 → open (Infinity)', () => {
    const z = calculateInputImpedance(0, 0, 50, Math.PI / 2);
    expect(z.real).toBe(Infinity);
  });

  it('open load (ZLr = Infinity) seen through λ/4 → short (≈0)', () => {
    const z = calculateInputImpedance(Infinity, 0, 50, Math.PI / 2);
    expect(z.real).toBeCloseTo(0);
    expect(z.imag).toBeCloseTo(0);
  });
});

/* ─── Stub Reactance ─────────────────────────────────────────────── */

describe('calculateStubReactance', () => {
  it('shorted λ/8 stub (βl = 45°): +jZ₀·tan 45° = +50 Ω', () => {
    expect(calculateStubReactance(50, Math.PI / 4, 'short')).toBeCloseTo(50);
  });

  it('open λ/8 stub (βl = 45°): −jZ₀·cot 45° = −50 Ω', () => {
    expect(calculateStubReactance(50, Math.PI / 4, 'open')).toBeCloseTo(-50);
  });

  it('shorted λ/16 stub (βl = 22.5°): 50·tan 22.5° = 20.71 Ω', () => {
    expect(calculateStubReactance(50, Math.PI / 8, 'short')).toBeCloseTo(20.71, 2);
  });

  it('shorted 3λ/8 stub (βl = 135°): 50·tan 135° = −50 Ω (capacitive)', () => {
    expect(calculateStubReactance(50, (3 * Math.PI) / 4, 'short')).toBeCloseTo(-50);
  });

  it('shorted λ/4 stub: pole guard → Infinity (short looks open)', () => {
    expect(calculateStubReactance(50, Math.PI / 2, 'short')).toBe(Infinity);
  });

  it('open λ/4 stub: cot 90° = 0 → ≈0 (open looks short)', () => {
    expect(calculateStubReactance(50, Math.PI / 2, 'open')).toBeCloseTo(0);
  });
});

/* ─── Quarter-Wave Transformer ───────────────────────────────────── */

describe('quarterWaveTransformerImpedance', () => {
  it('√(50·100) = 70.711 Ω', () => {
    expect(quarterWaveTransformerImpedance(50, 100)).toBeCloseTo(70.711, 3);
  });

  it('√(50·75) = 61.237 Ω (the dipole YourTurn)', () => {
    expect(quarterWaveTransformerImpedance(50, 75)).toBeCloseTo(61.237, 3);
  });

  it('R_L = 0 → NaN', () => {
    expect(quarterWaveTransformerImpedance(50, 0)).toBeNaN();
  });

  it('R_L < 0 → NaN', () => {
    expect(quarterWaveTransformerImpedance(50, -10)).toBeNaN();
  });
});
