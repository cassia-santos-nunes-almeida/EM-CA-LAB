/**
 * SI unit mapping for the Lorentz-force sim — a pure relabel, no physics changes.
 *
 * Declared scale (design doc 2026-06-11-phase2-2g §3.1): the particle is an ion.
 *   1 px = 1 mm · charge slider in elementary charges e · mass slider in atomic
 *   mass units u · effective B (bField/20) in mT.
 * The velocity unit is then FORCED by consistency: requiring the on-screen orbit
 * radius in px to equal the physical radius in mm gives
 *   V_UNIT = 1e-3 · (e/u) · 1e-3 ≈ 96.4853 m/s per (px/s),
 * so the orbit you see in px IS the physical orbit in mm, exactly.
 */

/** Elementary charge in C (exact, SI 2019). */
export const E_CHARGE = 1.602176634e-19;
/** Unified atomic mass unit in kg. */
export const ATOMIC_MASS_U = 1.66053907e-27;
/** Declared scale: 1 px = 1 mm. */
export const PX_TO_M = 1e-3;
/** B slider unit: the sim's effective field (bField/20) is read in mT. */
export const B_UNIT_T = 1e-3;
/** Derived from the r_px ≡ r_mm consistency requirement: ≈ 96.4853 m/s per px/s. */
export const V_UNIT_M_PER_S = PX_TO_M * (E_CHARGE / ATOMIC_MASS_U) * B_UNIT_T;
/** The sim's respawn handler sets vx = velocity × 2.5 (slider units → px/s). */
export const SLIDER_V_TO_PX = 2.5;

/** Canvas speed in px/s → physical speed in km/s (vPx × V_UNIT / 1000). */
export function pxPerSecToKms(vPx: number): number {
  return (vPx * V_UNIT_M_PER_S) / 1000;
}

/** Slider value → launch speed magnitude in km/s (|vSlider| × 2.5 × V_UNIT / 1000). */
export function sliderToSpeedKms(vSlider: number): number {
  return pxPerSecToKms(Math.abs(vSlider) * SLIDER_V_TO_PX);
}

/**
 * Cyclotron radius in mm: r = mv/(qB) with m in u, q in e, B in mT, v in km/s.
 * Because 1 px = 1 mm, this equals the orbit radius drawn on screen in px.
 * The ∞-guard mirrors the sim's hover readout: qE = 0 or bMt = 0 → Infinity.
 */
export function cyclotronRadiusMm(mU: number, qE: number, bMt: number, vKms: number): number {
  if (qE === 0 || bMt === 0) return Infinity;
  const rMetres = (mU * ATOMIC_MASS_U * vKms * 1000) / (qE * E_CHARGE * bMt * B_UNIT_T);
  return rMetres * 1000; // m → mm (≡ px on screen)
}

/** Magnetic force magnitude in attonewtons: F = qvB → qE × vKms × bMt × 0.1602177 aN. */
export function forceAttoN(qE: number, vKms: number, bMt: number): number {
  return qE * E_CHARGE * (vKms * 1000) * (bMt * B_UNIT_T) * 1e18;
}
