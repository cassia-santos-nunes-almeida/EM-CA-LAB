export function buildGaussData(
  mode: 'ELECTRIC' | 'MAGNETIC',
  charge: number,
  flux: number,
  epsilon0: number,
) {
  const Q = charge * 1e-6;
  return Array.from({ length: 30 }, (_, i) => {
    const r = 0.2 + i * 0.06;
    const E = mode === 'ELECTRIC' && charge !== 0
      ? Math.abs(Q) / (4 * Math.PI * epsilon0 * r * r)
      : 0;
    return { r: +r.toFixed(2), Flux: flux, E };
  });
}
