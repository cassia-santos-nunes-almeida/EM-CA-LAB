import { describe, it, expect } from 'vitest';
import { reluctance, solveToroid } from '@em/utils/magneticCircuits';

// Every expected value below is hand-derived from the magnetic-circuits sim's
// own physics (src/em/sections/magnetic-circuits/index.tsx, inline block at
// lines 107–126 pre-extraction), with μ₀ = 4π×10⁻⁷ T·m/A and the sim's toroid
// geometry: mean radius r = 0.05 m, cross-section A = 10⁻³ m².
// These vectors PIN the identity between the page's readouts and the utility:
// if the physics ever drifts, the worked examples' "digit for digit" promise
// breaks this suite instead of silently lying.

describe('reluctance', () => {
  it('computes ℛ = l/(μ₀·μᵣ·A) for the sim toroid full path: 50 000 A·t/Wb', () => {
    // l = 2π(0.05) m, iron μᵣ = 5000, A = 10⁻³ m².
    // π cancels: ℛ = 2(0.05)/(4×10⁻⁷ × 5000 × 10⁻³) = 0.1/(2×10⁻⁶) = 50 000 exactly.
    expect(reluctance(2 * Math.PI * 0.05, 5000, 1e-3)).toBeCloseTo(50_000, 6);
  });

  it('computes the two half-ring segments of Worked Example 3 and their series sum', () => {
    // Each half: l = π(0.05). π cancels:
    // iron    ℛ = 0.05/(4×10⁻⁷ × 5000 × 10⁻³) = 0.05/(2×10⁻⁶) = 25 000 exactly
    // ferrite ℛ = 0.05/(4×10⁻⁷ × 1000 × 10⁻³) = 0.05/(4×10⁻⁷)·10³ = 125 000 exactly (5× iron)
    const rIron = reluctance(Math.PI * 0.05, 5000, 1e-3);
    const rFerrite = reluctance(Math.PI * 0.05, 1000, 1e-3);
    expect(rIron).toBeCloseTo(25_000, 6);
    expect(rFerrite).toBeCloseTo(125_000, 6);
    // Series reluctances add: ℛ_total = 150 000 A·t/Wb (Worked Example 3 Step 1).
    expect(rIron + rFerrite).toBeCloseTo(150_000, 6);
  });

  it('computes the literal 1 mm air gap one-liner: 795 775 A·t/Wb', () => {
    // ℛ = 10⁻³/(4π×10⁻⁷ × 1 × 10⁻³) = 10⁷/(4π) = 795 774.715… → 795 775 ±1.
    expect(reluctance(0.001, 1, 1e-3)).toBeCloseTo(795_775, 0);
  });
});

describe('solveToroid — Worked Example 1 / sim Iron defaults (μᵣ=5000, N=200, I=1 A, gap 0%)', () => {
  const sol = solveToroid(5000, 200, 1, 0);

  it('solves the ungapped iron toroid: ℛ = 5.00×10⁴, Φ = 4.00 mWb, B = 4.000 T, L = 0.800 H', () => {
    // ℛ_total = ℛ_core = 50 000 (gap branch off); MMF = NI = 200 A·t;
    // Φ = 200/50 000 = 4×10⁻³ Wb; B = Φ/A = 4.000 T; L = N²/ℛ = 40 000/50 000 = 0.800 H.
    expect(sol.mmf).toBe(200);
    expect(sol.reluctanceTotal).toBeCloseTo(50_000, 6);
    expect(sol.flux).toBeCloseTo(4e-3, 9);
    expect(sol.B).toBeCloseTo(4.0, 9);
    expect(sol.inductance).toBeCloseTo(0.8, 9);
    // H_core = B/(μ₀μᵣ) = 4/(6.283185×10⁻³) = 636.6197723675813 A/m.
    expect(sol.hCore).toBeCloseTo(636.62, 3);
  });

  it('preserves the display convention: hGap = 0 (not B/μ₀) when there is no gap', () => {
    expect(sol.gapLength).toBe(0);
    expect(sol.reluctanceGap).toBe(0);
    expect(sol.hGap).toBe(0);
  });

  it('reproduces the canvas readout strings at the default sliders digit for digit', () => {
    // The sim's formatSI prints: ≥1 → toFixed(3); ≥10⁻³ → (×10³).toFixed(2) milli-prefixed.
    expect(sol.hCore.toFixed(3)).toBe('636.620');            // "H_core = 636.620 A/m"
    expect(sol.B.toFixed(3)).toBe('4.000');                  // "B = 4.000 T"
    expect((sol.flux * 1e3).toFixed(2)).toBe('4.00');        // "Φ = 4.00 mWb"
    expect((sol.inductance * 1e3).toFixed(2)).toBe('800.00'); // "L = 800.00 mH"
  });
});

describe('solveToroid — Worked Example 2 (1% gap cut into the iron toroid)', () => {
  const sol = solveToroid(5000, 200, 1, 1);

  it('splits the path: l_gap = 3.14 mm, l_core = 0.3110 m', () => {
    // l_gap = 0.01 × 2π(0.05) = 3.141593×10⁻³ m; l_core = 0.99 × 0.3141593 = 0.3110177 m.
    expect(sol.gapLength).toBeCloseTo(3.1416e-3, 6);
    expect(sol.coreLength).toBeCloseTo(0.311018, 5);
  });

  it('computes the reluctances: core 49 500, gap 2.50×10⁶, total 2 549 500', () => {
    // ℛ_core = 0.99 × 50 000 = 49 500 exactly.
    // ℛ_gap = π×10⁻³/(4π×10⁻¹⁰) = 10⁷/4 = 2 500 000 exactly — 3 mm of air
    // out-resists 31 cm of iron 50-to-1.
    expect(sol.reluctanceCore).toBeCloseTo(49_500, 5);
    expect(sol.reluctanceGap).toBeCloseTo(2_500_000, 5);
    expect(sol.reluctanceTotal).toBeCloseTo(2_549_500, 5);
  });

  it('solves the gapped circuit: Φ = 78.45 μWb, B = 78.45 mT, L = 15.69 mH', () => {
    // Φ = 200/2 549 500 = 7.844675×10⁻⁵ Wb; B = Φ/10⁻³ = 0.0784468 T;
    // L = 40 000/2 549 500 = 0.0156894 H — the 51× collapse from 0.800 H.
    expect(sol.flux).toBeCloseTo(7.84468e-5, 9);
    expect(sol.B).toBeCloseTo(0.0784468, 6);
    expect(sol.inductance).toBeCloseTo(0.0156894, 6);
  });

  it('splits H by material: H_core = 12.485 A/m, H_gap = 62 425.9 A/m', () => {
    // H_core = B/(μ₀×5000) = 0.0784468/(6.2832×10⁻³) = 12.48519 A/m;
    // H_gap = B/μ₀ = 0.0784468/(1.256637×10⁻⁶) = 62 425.94 A/m (= 5000 × H_core).
    expect(sol.hCore).toBeCloseTo(12.485, 3);
    expect(sol.hGap).toBeCloseTo(62_425.9, 0);
    // Canvas string pin (formatSI ≥1 branch): "H_core = 12.485 A/m".
    expect(sol.hCore.toFixed(3)).toBe('12.485');
  });

  it('conserves MMF (Ampère audit): H_core·l_core + H_gap·l_gap = 200 A·t', () => {
    // 12.48519 × 0.3110177 + 62 425.94 × 3.141593×10⁻³ = 3.883 + 196.117 = 200.000.
    expect(sol.hCore * sol.coreLength + sol.hGap * sol.gapLength).toBeCloseTo(200, 6);
  });
});

describe('solveToroid — other spec oracles', () => {
  it('solves the inverse-design YourTurn: N = 50 turns gives B = 1.000 T, L = 50.00 mH', () => {
    // MMF = 50 A·t; Φ = 50/50 000 = 10⁻³ Wb; B = 1.000 T; L = 2 500/50 000 = 0.0500 H.
    const sol = solveToroid(5000, 50, 1, 0);
    expect(sol.B).toBeCloseTo(1.0, 9);
    expect(sol.inductance).toBeCloseTo(0.05, 9);
  });

  it('pins the air-core collapse (μᵣ = 1): ℛ = 2.5×10⁸, B = 8×10⁻⁴ T, L = 0.16 mH', () => {
    // ℛ = 0.3141593/(1.256637×10⁻⁶ × 10⁻³) = 0.1/(4×10⁻¹⁰) = 2.5×10⁸ exactly;
    // Φ = 200/2.5×10⁸ = 8×10⁻⁷ Wb; B = 8×10⁻⁴ T; L = 40 000/2.5×10⁸ = 1.6×10⁻⁴ H.
    const sol = solveToroid(1, 200, 1, 0);
    expect(sol.reluctanceTotal).toBeCloseTo(2.5e8, 0);
    expect(sol.B).toBeCloseTo(8e-4, 9);
    expect(sol.inductance).toBeCloseTo(1.6e-4, 9);
  });

  it('defaults its geometry to the sim toroid (r = 0.05 m, A = 10⁻³ m²)', () => {
    expect(solveToroid(5000, 200, 1, 1)).toEqual(solveToroid(5000, 200, 1, 1, 0.05, 0.001));
  });
});
