import { describe, it, expect } from 'vitest';
import {
  ETA0,
  intrinsicImpedance,
  lossTangent,
  attenuationGoodConductor,
  skinDepth,
  nepersToDb,
  normalIncidenceGamma,
  normalIncidenceTau,
  reflectedPowerFraction,
} from '@em/sections/em-wave/mediaMath';

/* ─── Constants ───────────────────────────────────────────────────── */

describe('ETA0', () => {
  it('intrinsic impedance of free space is 376.730 Ω', () => {
    // √(μ₀/ε₀) = √(1.25663706e-6 / 8.8541878e-12) = √(1.4193e5) = 376.730
    expect(ETA0).toBeCloseTo(376.73, 2);
  });
});

/* ─── intrinsicImpedance ─────────────────────────────────────────── */

describe('intrinsicImpedance', () => {
  it('free space (εr = 1) equals η₀ = 376.730 Ω', () => {
    expect(intrinsicImpedance(1)).toBeCloseTo(376.73, 2);
  });

  it('glass (εr = 2.25, n = 1.5): η = η₀/1.5 = 251.15 Ω', () => {
    // 376.730 / 1.5 = 251.153
    expect(intrinsicImpedance(2.25)).toBeCloseTo(251.153, 2);
  });

  it('seawater at RF (εr = 81, n = 9): η = η₀/9 = 41.859 Ω', () => {
    // 376.730 / 9 = 41.859
    expect(intrinsicImpedance(81)).toBeCloseTo(41.859, 3);
  });

  it('μr defaults to 1 (non-magnetic medium)', () => {
    expect(intrinsicImpedance(2.25)).toBe(intrinsicImpedance(2.25, 1));
  });

  it('magnetic medium scales by √μr: εr = 1, μr = 4 → 2·η₀', () => {
    // √(4/1) = 2 → 2 × 376.730 = 753.461
    expect(intrinsicImpedance(1, 4)).toBeCloseTo(2 * ETA0, 2);
  });

  it('returns NaN for εr ≤ 0', () => {
    expect(intrinsicImpedance(-1)).toBeNaN();
    expect(intrinsicImpedance(0)).toBeNaN();
  });
});

/* ─── lossTangent ────────────────────────────────────────────────── */

describe('lossTangent', () => {
  it('seawater (σ = 4 S/m, εr = 81) at 1 MHz is a good conductor: tan δ ≈ 888', () => {
    // ωε = 2π·10⁶ · 81 · 8.8541878e-12 = 4.506e-3 S/m → 4 / 4.506e-3 = 887.7 ≫ 1
    expect(lossTangent(4, 1e6, 81)).toBeCloseTo(887.7, 0);
  });

  it('same seawater at 100 GHz flips to dielectric: tan δ ≈ 8.88e-3 ≪ 1', () => {
    // tan δ ∝ 1/f: 887.7 × 10⁶/10¹¹ = 8.877e-3
    expect(lossTangent(4, 1e11, 81)).toBeCloseTo(8.877e-3, 4);
  });

  it('returns NaN for f ≤ 0', () => {
    expect(lossTangent(4, 0, 81)).toBeNaN();
    expect(lossTangent(4, -1e6, 81)).toBeNaN();
  });
});

/* ─── attenuationGoodConductor ───────────────────────────────────── */

describe('attenuationGoodConductor', () => {
  it('seawater at 1 MHz: α = √(π·10⁶·μ₀·4) = 3.9738 Np/m', () => {
    // π×10⁶ = 3.1416e6; ×1.25663706e-6 = 3.9478; ×4 = 15.791; √ = 3.9738
    expect(attenuationGoodConductor(1e6, 4)).toBeCloseTo(3.9738, 3);
  });

  it('seawater at 10 kHz: α = √0.15791 = 0.39738 Np/m (f ÷ 100 ⇒ α ÷ 10)', () => {
    expect(attenuationGoodConductor(1e4, 4)).toBeCloseTo(0.39738, 4);
  });

  it('returns NaN for f ≤ 0 or σ ≤ 0', () => {
    expect(attenuationGoodConductor(0, 4)).toBeNaN();
    expect(attenuationGoodConductor(-1e6, 4)).toBeNaN();
    expect(attenuationGoodConductor(1e6, 0)).toBeNaN();
    expect(attenuationGoodConductor(1e6, -4)).toBeNaN();
  });
});

/* ─── skinDepth ──────────────────────────────────────────────────── */

describe('skinDepth', () => {
  it('seawater at 1 MHz: δs = 1/3.9738 = 0.25165 m (25 cm)', () => {
    expect(skinDepth(1e6, 4)).toBeCloseTo(0.25165, 4);
  });

  it('seawater at 10 kHz: δs = 2.5165 m (δs ∝ 1/√f: f ÷ 100 ⇒ δs × 10)', () => {
    expect(skinDepth(1e4, 4)).toBeCloseTo(2.5165, 3);
  });

  it('copper (σ = 5.8e7 S/m) at 1 GHz: δs = 2.090 μm', () => {
    // π×10⁹·1.25663706e-6 = 3947.8; ×5.8e7 = 2.2897e11; √ = 4.785e5 Np/m; 1/α = 2.090e-6 m
    expect(skinDepth(1e9, 5.8e7)).toBeCloseTo(2.09e-6, 8);
  });

  it('returns NaN for f ≤ 0 (same guards as attenuationGoodConductor)', () => {
    expect(skinDepth(0, 4)).toBeNaN();
  });
});

/* ─── nepersToDb ─────────────────────────────────────────────────── */

describe('nepersToDb', () => {
  it('1 Np = 20·log₁₀(e) = 8.6859 dB', () => {
    expect(nepersToDb(1)).toBeCloseTo(8.6859, 3);
  });

  it('seawater 1 MHz attenuation: 3.9738 Np × 8.6859 = 34.516 dB/m', () => {
    // 3.9738 × 8.685889 = 34.516 (spec: 34.51 ± 0.02)
    expect(nepersToDb(3.9738)).toBeCloseTo(34.516, 2);
  });

  it('0 Np is 0 dB', () => {
    expect(nepersToDb(0)).toBe(0);
  });
});

/* ─── normalIncidenceGamma ───────────────────────────────────────── */

describe('normalIncidenceGamma', () => {
  it('air → glass: Γ = (251.153 − 376.730)/(251.153 + 376.730) = −0.200', () => {
    // −125.577 / 627.883 = −0.200; independent check via n: (1−1.5)/(1+1.5) = −0.2 ✓
    expect(normalIncidenceGamma(376.73, 251.153)).toBeCloseTo(-0.2, 4);
  });

  it('air → seawater-RF: Γ = (41.859 − 376.730)/(41.859 + 376.730) = −0.800', () => {
    // −334.871 / 418.589 = −0.800; independent check via n: (1−9)/(1+9) = −0.8 exact ✓
    expect(normalIncidenceGamma(376.73, 41.859)).toBeCloseTo(-0.8, 4);
  });

  it('matched media (η₁ = η₂): no step, no echo — Γ = 0', () => {
    expect(normalIncidenceGamma(377, 377)).toBe(0);
  });
});

/* ─── normalIncidenceTau ─────────────────────────────────────────── */

describe('normalIncidenceTau', () => {
  it('air → glass: τ = 2·251.153/627.883 = 0.800', () => {
    expect(normalIncidenceTau(376.73, 251.153)).toBeCloseTo(0.8, 4);
  });

  it('matched media: τ = 1 (everything gets through)', () => {
    expect(normalIncidenceTau(377, 377)).toBe(1);
  });

  it('τ = 1 + Γ within 1e-12 for three (η₁, η₂) pairs', () => {
    const pairs: Array<[number, number]> = [
      [377, 251.15],
      [377, 41.86],
      [251.15, 377],
    ];
    for (const [eta1, eta2] of pairs) {
      const gamma = normalIncidenceGamma(eta1, eta2);
      const tau = normalIncidenceTau(eta1, eta2);
      expect(Math.abs(tau - (1 + gamma))).toBeLessThan(1e-12);
    }
  });
});

/* ─── reflectedPowerFraction ─────────────────────────────────────── */

describe('reflectedPowerFraction', () => {
  it('air → glass (Γ = −0.2): 4% of the power reflects', () => {
    expect(reflectedPowerFraction(-0.2)).toBeCloseTo(0.04, 4);
  });

  it('air → seawater-RF (Γ = −0.8): 64% reflects', () => {
    expect(reflectedPowerFraction(-0.8)).toBeCloseTo(0.64, 4);
  });

  it('matched (Γ = 0): nothing reflects', () => {
    expect(reflectedPowerFraction(0)).toBe(0);
  });
});

/* ─── Power conservation (property) ──────────────────────────────── */

describe('power conservation at a normal-incidence interface', () => {
  // Γ² + τ²·(η₁/η₂) = 1: reflected + transmitted power equals incident power.
  // Hand check (glass):    0.04 + 0.64 × (377/251.15 ≈ 1.5)  = 0.04 + 0.96 = 1.00 ✓
  // Hand check (seawater): 0.64 + 0.04 × (377/41.86 ≈ 9.005) = 0.64 + 0.36 = 1.00 ✓ (τ = 1 + Γ = 0.2)
  it('Γ² + τ²·(η₁/η₂) = 1 within 1e-9 for all (η₁, η₂) pairs', () => {
    const pairs: Array<[number, number]> = [
      [377, 251.15], // air → glass
      [377, 41.86], // air → seawater-RF
      [251.15, 377], // glass → air (reverse direction)
    ];
    for (const [eta1, eta2] of pairs) {
      const gamma = normalIncidenceGamma(eta1, eta2);
      const tau = normalIncidenceTau(eta1, eta2);
      const total = gamma * gamma + tau * tau * (eta1 / eta2);
      expect(Math.abs(total - 1)).toBeLessThan(1e-9);
    }
  });
});
