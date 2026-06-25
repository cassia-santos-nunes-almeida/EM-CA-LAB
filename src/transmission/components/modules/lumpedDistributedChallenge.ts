/**
 * Data for the "Your Turn" coax challenge in LumpedDistributed (compute v and Z₀).
 * Extracted from the inline JSX so the options can be pinned by a fast unit test
 * bound to the actual misconception arithmetic (Appendix A.2#9).
 */

/** Per-unit-length parameters of the worked coax: L′ = 0.25 µH/m, C′ = 100 pF/m. */
export const COAX_LP = 0.25e-6; // H/m
export const COAX_CP = 100e-12; // F/m

export interface YourTurnOptionData {
  text: string;
  correct: boolean;
  explanation: string;
}

/**
 * Correct answer: v = 1/√(L′C′) = 2×10⁸ m/s, Z₀ = √(L′/C′) = 50 Ω.
 * The "forgot the √" distractor must offer L′/C′ = 2500 Ω to match its explanation.
 */
export const Z0_YOUR_TURN_OPTIONS: YourTurnOptionData[] = [
  {
    text: 'v = 2 × 10⁸ m/s, Z₀ = 50 Ω',
    correct: true,
    explanation:
      'v = 1/√(L′C′) = 1/√(0.25×10⁻⁶ × 100×10⁻¹²) = 2×10⁸ m/s. Z₀ = √(L′/C′) = √(0.25×10⁻⁶ / 100×10⁻¹²) = 50 Ω.',
  },
  {
    text: 'v = 3 × 10⁸ m/s, Z₀ = 50 Ω',
    correct: false,
    explanation:
      '3×10⁸ m/s is the speed of light in vacuum. The wave speed on this cable is slower due to the dielectric.',
  },
  {
    text: 'v = 2 × 10⁸ m/s, Z₀ = 2500 Ω',
    correct: false,
    explanation: 'The wave speed is correct, but Z₀ = √(L′/C′), not L′/C′.',
  },
  {
    text: 'v = 1 × 10⁸ m/s, Z₀ = 100 Ω',
    correct: false,
    explanation: 'Check the arithmetic: v = 1/√(2.5×10⁻¹⁷) = 2×10⁸ m/s.',
  },
];
