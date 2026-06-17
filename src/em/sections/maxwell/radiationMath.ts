/**
 * Pure math for the radiating-charge field-line construction (Thomson/Purcell kink
 * picture): a charge that accelerates leaves its distant field pointing at where it
 * USED to be — news of the new position travels outward at the simulation light
 * speed, and the transverse stitch between the two zones is the radiated kink.
 * No canvas, no React — exported for the RadiatingChargeSim renderer and unit tests.
 */

/** Motion mode of the source charge. */
export type ChargeMode = 'rest' | 'kick' | 'oscillate';

/** Motion parameters for the source charge. */
export interface ChargeParams {
  /** Oscillation amplitude (px). */
  amp: number;
  /** Oscillation angular rate ω (rad per time unit). */
  omega: number;
  /** Kick hop distance D (px). */
  kickDist: number;
  /** Kick duration τ (time units). */
  kickTau: number;
}

/**
 * Charge displacement along the oscillation axis at time t (time units).
 * rest → 0 always; kick → smoothstep s(u) = 3u² − 2u³ ramp from 0 to kickDist over
 * [0, kickTau] (0 for t ≤ 0, holds kickDist for t ≥ kickTau); oscillate → amp·sin(ω·t).
 */
export function chargeY(mode: ChargeMode, t: number, p: ChargeParams): number {
  if (mode === 'oscillate') return p.amp * Math.sin(p.omega * t);
  if (mode === 'kick') {
    if (t <= 0) return 0;
    if (t >= p.kickTau) return p.kickDist;
    const u = t / p.kickTau;
    return p.kickDist * (3 * u * u - 2 * u * u * u);
  }
  return 0; // rest
}

/**
 * A field-line point: radial spoke of length r at angle thetaRad, anchored to the
 * charge's RETARDED position chargeY(mode, t − r/cSim, p) — the position the news
 * had reached when it left, travelling at cSim (px per time unit). Returns {dx, dy}
 * offsets from the charge's REST position in math coordinates, y up (the canvas
 * applies dy with its own y-flip): dx = r·cosθ, dy = chargeY(t − r/cSim) + r·sinθ.
 * Wherever the retarded displacement is nonzero, an equatorial spoke acquires a
 * transverse offset — the kink that IS the radiation.
 */
export function fieldLinePoint(
  mode: ChargeMode,
  t: number,
  r: number,
  thetaRad: number,
  cSim: number,
  p: ChargeParams,
): { dx: number; dy: number } {
  const tRetarded = t - r / cSim;
  return {
    dx: r * Math.cos(thetaRad),
    dy: chargeY(mode, tRetarded, p) + r * Math.sin(thetaRad),
  };
}
