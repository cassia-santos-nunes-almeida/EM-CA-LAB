/**
 * Pure helpers for the Coulomb field-line visualization, extracted so the arrowhead
 * direction convention is unit-testable.
 */

/**
 * Angle (rad) of a field-line arrowhead at a point where the field is (Ex, Ey), while the
 * line is being traced in `traceDirection` (+1 from a positive seed, −1 from a negative).
 */
// `traceDirection` is intentionally ignored — the arrowhead shows the true field E (toward
// negative charges, away from positive), independent of which way the line is traced. (The
// old form used the trace step ∝ direction·E, so negative-seeded lines pointed outward.)
// Keeping the param documents that invariant and powers the direction-independence test.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fieldLineArrowAngle(Ex: number, Ey: number, traceDirection: number): number {
  return Math.atan2(Ey, Ex);
}
