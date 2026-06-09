export function buildForceData(q1: number, q2: number, kCoulomb: number) {
  return Array.from({ length: 40 }, (_, i) => {
    const r = 0.02 + i * 0.012;
    return { r: +r.toFixed(3), F: kCoulomb * q1 * q2 / (r * r) };
  });
}
