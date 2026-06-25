/**
 * Pure travelling-wave samplers for the TransmissionLineSim sinusoidal animation,
 * extracted so the propagation directions are unit-testable.
 */

/** Incident wave, travelling source→load (+x): sin(k·pos − ωt). */
export function incidentWave(k: number, pos: number, omega: number, t: number): number {
  return Math.sin(k * pos - omega * t);
}

/** Reflected wave (amplitude γ), travelling load→source (−x), continuous with the
 *  incident wave at the load (pos = lineLength). */
export function reflectedWave(
  gamma: number,
  k: number,
  pos: number,
  lineLength: number,
  omega: number,
  t: number,
): number {
  return gamma * Math.sin(k * (2 * lineLength - pos) - omega * t);
}
