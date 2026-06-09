export function buildSnapshotData(amplitude: number, k: number, refractiveIndex: number) {
  return Array.from({ length: 50 }, (_, i) => {
    const x = i * 6;
    const E = amplitude * Math.sin(k * x);
    const Braw = (amplitude * refractiveIndex / 300) * Math.sin(k * x);
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
    const v = vAmplitude * Math.sin(omega * t + phiV);
    const iVal = iAmplitude * Math.sin(omega * t + phiI);
    return { t: +t.toFixed(2), P: +(v * iVal / 1000).toFixed(2) };
  });
}
