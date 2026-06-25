/**
 * Pure sign/convention helpers for the Maxwell-section canvas sims, extracted so the
 * induced-field handedness is unit-testable.
 */

/**
 * Sign applied to the drawFaraday induced-E orbit angle for a given flux rate dFlux
 * (out-of-page flux; ⊙ when positive).
 */
export function faradayOrbitSign(dFlux: number): number {
  // Out-of-page flux increasing (dFlux>0) ⇒ Lenz drives a clockwise induced E (viewer
  // side); on the y-down canvas the orbit angle (cos,sin) must INCREASE for screen-
  // clockwise, so the sign is +1. (The old −1 spun it counter-clockwise.)
  return dFlux > 0 ? 1 : -1;
}
