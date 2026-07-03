/**
 * Wave number k = 2π·f·n / 300 (arb. units). Single source for the EquationBox
 * `k=` readout and the snapshot chart's k — the readout previously double-rounded
 * (derived k from a λ already rounded to a whole number) (A.5 #11).
 */
export const waveNumber = (frequency: number, refractiveIndex: number): number =>
  (2 * Math.PI * frequency * refractiveIndex) / 300;

export function buildSnapshotData(amplitude: number, k: number, refractiveIndex: number) {
  return Array.from({ length: 50 }, (_, i) => {
    const x = i * 6;
    const E = amplitude * Math.cos(k * x);
    const Braw = (amplitude * refractiveIndex / 300) * Math.cos(k * x);
    return { x, E: +E.toFixed(2), B: +Braw.toFixed(4) };
  });
}

export function buildPowerData(
  vAmplitude: number,
  iAmplitude: number,
  omega: number,
  phiV: number,
  phiI: number,
) {
  return Array.from({ length: 60 }, (_, i) => {
    const t = i * 0.05;
    const v = vAmplitude * Math.cos(omega * t + phiV);
    const iVal = iAmplitude * Math.cos(omega * t + phiI);
    return { t: +t.toFixed(2), P: +(v * iVal / 1000).toFixed(2) };
  });
}
