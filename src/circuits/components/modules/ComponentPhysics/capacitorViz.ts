/**
 * Pure helpers for the Capacitor section's plate-area visuals, extracted so the
 * side-view plate scaling and the default state are unit-testable.
 */

/** Real Plate-Area slider range, in m² (0.5–10 cm²). */
export const CAP_AREA_MIN = 5e-5;
export const CAP_AREA_MAX = 1e-3;

/** Default plate area (m²) — 1 cm², within the slider range (opening C ≈ 0.885 pF).
 *  The old 0.01 m² (100 cm²) sat outside the 0.5–10 cm² slider, so the opening
 *  88.54 pF reading was unreachable and C dropped ~10× the instant the slider moved. */
export const DEFAULT_CAPACITOR_AREA = 1e-4;

/** Plate area → 0..1, normalized to the slider range so the SVG visibly responds.
 *  (The old [0.005, 0.10] m² window was ~100× the real slider range, making areaNorm
 *  negative across the whole slider so the plate stayed frozen at its floor.) */
export function capacitorAreaNorm(area: number): number {
  return (area - CAP_AREA_MIN) / (CAP_AREA_MAX - CAP_AREA_MIN);
}

/** Side-view plate height (px), 40–130 across the slider. */
export function plateHeightPx(area: number): number {
  return 40 + capacitorAreaNorm(area) * 90;
}
