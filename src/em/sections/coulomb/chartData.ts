/** A charge entered in microcoulombs → its magnitude in coulombs (|q|·1e-6).
 *  Single source for the µC→C conversion duplicated across the force label and
 *  the force-vs-distance chart prep (A.5 #7). */
export const magnitudeInCoulombs = (qMicro: number): number => Math.abs(qMicro) * 1e-6;

export function buildForceData(q1: number, q2: number, kCoulomb: number) {
  return Array.from({ length: 40 }, (_, i) => {
    const r = 0.02 + i * 0.012;
    return { r: +r.toFixed(3), F: kCoulomb * q1 * q2 / (r * r) };
  });
}
