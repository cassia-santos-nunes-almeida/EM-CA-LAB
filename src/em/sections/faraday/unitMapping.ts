/**
 * SI unit mapping for the Faraday sim — a pure relabel, no physics changes.
 *
 * Declared physical demo coil (design doc 2026-06-11-phase2-2g §4.1):
 *   B(t) = B0·sin(ωt) with B0 = 50 mT · loop radius a = 5 cm (A = πa² ≈ 7.854×10⁻³ m²)
 *   · frequency f = rate × 10 Hz (slider 0.1–3.0 → 1–30 Hz, signal-generator scale).
 * The sim's internal EMF is liveEmf = −N·rate·cos(ωt) (peak N·rate, arb. units);
 * the physical EMF is that value times one constant:
 *   ℰ = liveEmf · B0·A·2π·10 = liveEmf × 0.0246740 V ≈ liveEmf × 24.674 mV.
 */

/** Peak field of the demo electromagnet: 50 mT. */
export const B0_T = 0.05;
/** Loop radius: 5 cm. */
export const LOOP_RADIUS_M = 0.05;
/** Loop area A = πa² ≈ 7.853982×10⁻³ m². */
export const LOOP_AREA_M2 = Math.PI * LOOP_RADIUS_M ** 2;
/** Slider rate 0.1–3.0 → f = 1–30 Hz. */
export const HZ_PER_RATE = 10;
/** Volts per internal EMF unit: B0·A·2π·10 ≈ 0.0246740 V. */
export const EMF_SCALE_V = B0_T * LOOP_AREA_M2 * 2 * Math.PI * HZ_PER_RATE;

/** Slider rate → physical frequency in Hz. */
export function rateToHz(rate: number): number {
  return rate * HZ_PER_RATE;
}

/** Internal (arb.) EMF → millivolts, sign-preserving. */
export function emfArbToMillivolts(emfArb: number): number {
  return emfArb * EMF_SCALE_V * 1000;
}
