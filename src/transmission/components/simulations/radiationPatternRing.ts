/**
 * Pure label mapping for the antenna radiation-pattern polar-plot degree ring,
 * extracted so the tick labelling is unit-testable.
 */

/**
 * Antenna θ (deg, from the antenna axis) shown at a ring tick drawn at plot angle
 * `plotDeg` (measured CCW from +x).
 */
export function antennaRingLabelDeg(plotDeg: number): number {
  // The pattern places antenna θ at plot position (sin θ, cos θ); a ring tick drawn at
  // CCW-from-+x angle `plotDeg` therefore sits at antenna θ = 90° − plotDeg (mod 360),
  // so the ring reads 0° at the top axis (null) → 90° broadside → 180° bottom axis.
  return (90 - plotDeg + 360) % 360;
}
