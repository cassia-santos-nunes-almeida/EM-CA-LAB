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

// ── Walkthrough fix: stale velocity at rest ──
//
// The sim only recomputes magnetPos/prevPos on an input event (drag, arrow
// key, slider, or an auto-oscillate tick). Once input stops, those two values
// stay frozen, so a naive `v = magnetPos - prevPos` would stay pinned at its
// last nonzero delta forever — the canvas keeps drawing a 'v' arrow, induced-
// current markers, and a REPULSION/ATTRACTION label for a magnet that is
// visibly sitting still (dΦ/dt = 0 must read as steady/zero).
//
// Grace window (ms) after the last position-changing input before the
// displayed velocity starts decaying toward zero instead of staying frozen.
export const VELOCITY_DECAY_GRACE_MS = 150;
// Per-frame multiplicative decay applied once the grace window has elapsed.
const VELOCITY_DECAY_FACTOR = 0.85;
// Below this magnitude the decaying velocity snaps to exactly 0 (steady state).
const VELOCITY_DECAY_EPSILON = 0.01;

/**
 * Effective magnet velocity to display for the current animation frame.
 *
 * While an input event is actively driving the position (auto-oscillate, or
 * any other input within the grace window), the raw per-event delta `rawV`
 * is passed through unchanged. Once more than `VELOCITY_DECAY_GRACE_MS` has
 * elapsed since the last position-changing input, the previously-displayed
 * velocity decays geometrically toward zero, snapping to exactly 0 once it is
 * negligible — so the flux/force readouts fall back to their existing
 * zero-velocity ("steady") branches instead of reporting motion that has
 * already stopped.
 *
 * @param rawV            magnetPos − prevPos for the current React state (slider units)
 * @param prevEffectiveV   the effective velocity displayed on the previous frame
 * @param msSinceLastMove  milliseconds since the last position-changing input event
 * @param isAutoPlay       true while auto-oscillate drives the magnet continuously
 */
export function effectiveMagnetVelocity(
  rawV: number,
  prevEffectiveV: number,
  msSinceLastMove: number,
  isAutoPlay: boolean,
): number {
  if (isAutoPlay || msSinceLastMove <= VELOCITY_DECAY_GRACE_MS) {
    return rawV;
  }
  const decayed = prevEffectiveV * VELOCITY_DECAY_FACTOR;
  return Math.abs(decayed) < VELOCITY_DECAY_EPSILON ? 0 : decayed;
}
