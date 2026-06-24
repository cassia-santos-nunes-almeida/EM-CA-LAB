/**
 * Pure physics helpers for the Lenz's-law magnet-and-coil simulation.
 * Extracted from the canvas render so the sign/direction conventions are unit-testable.
 */

/**
 * Signed x-extent of the on-canvas F_mag (braking-force) arrow.
 *
 * @param v          magnet velocity in slider units/frame (sign is the direction of motion)
 * @param intensity  induced-EMF magnitude proxy (emfNorm); only its magnitude is used
 */
export function brakingForceArrowX(v: number, intensity: number): number {
  // Lenz: the eddy-current force always OPPOSES the magnet's motion, so the
  // direction is −sign(v) regardless of which side of the coil the magnet is on.
  // (The previous sign(−intensity) tracked the magnet's side and pointed the wrong
  // way over the left half, where intensity ∝ dNorm·v flips sign.) The magnitude
  // still scales with the induced-EMF magnitude, capped for display.
  return -Math.sign(v) * Math.min(Math.abs(intensity) * 10, 150);
}
