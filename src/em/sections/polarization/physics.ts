/**
 * Pure polarization-ellipse helpers, extracted from the section's inline render math
 * so the displayed ψ / χ / AR / slope readouts are unit-testable.
 */
const DEG = 180 / Math.PI;

/** Orientation (tilt) angle ψ of the polarization ellipse, in degrees.
 *  tan(2ψ) = (2·Ex·Ey·cos δ)/(Ex²−Ey²). */
export function orientationPsi(ex: number, ey: number, deltaDeg: number): number {
  // General branch is correct on its own (incl. Ex=Ey, where Ex²−Ey²=0 makes
  // atan2 resolve to ±90°⇒ψ=±45° via sign(cos δ)); the old `ex===ey ? 45` special
  // case forced +45° even when cos δ < 0 (true tilt −45°). Degenerate only at the
  // exact circle (Ex=Ey, δ=±90°), where ψ is physically undefined and harmless.
  const d = (deltaDeg * Math.PI) / 180;
  return 0.5 * Math.atan2(2 * ex * ey * Math.cos(d), ex * ex - ey * ey) * DEG;
}

/** Ellipticity angle χ, in degrees. sin(2χ) = (2·Ex·Ey·sin δ)/(Ex²+Ey²). */
export function ellipticityChi(ex: number, ey: number, deltaDeg: number): number {
  const d = (deltaDeg * Math.PI) / 180;
  const sin2chi = (2 * ex * ey * Math.sin(d)) / (ex * ex + ey * ey || 1);
  return 0.5 * Math.asin(Math.max(-1, Math.min(1, sin2chi))) * DEG;
}

/** Axial ratio AR = |cot χ| ∈ [1, ∞) (Ulaby / IEEE 145). Linear (χ=0) → ∞ as a
 *  natural limit, so no hard-coded branch — and AR stays monotonic in ellipticity
 *  (the old |tan χ| was the reciprocal, giving AR<1 and a false 0→∞ discontinuity). */
export function axialRatio(ex: number, ey: number, deltaDeg: number): number {
  const chi = (ellipticityChi(ex, ey, deltaDeg) * Math.PI) / 180;
  return Math.abs(1 / Math.tan(chi));
}

/** Signed slope of a linear polarization state: +Ey/Ex at δ=0, −Ey/Ex at δ=180°. */
export function linearSlope(ex: number, ey: number, deltaDeg: number): number {
  return Math.sign(Math.cos((deltaDeg * Math.PI) / 180)) * (ey / (ex || 1));
}
