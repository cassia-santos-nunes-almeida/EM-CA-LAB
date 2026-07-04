// Pure integral/local-view math for the math-integrals section (2.3). No React.
// The div/curl helpers are central-difference samplers so the section's
// interpretive prose ("flux per unit volume", "circulation per unit area")
// is pinned by numbers, not vibes.

export type Field2 = (p: { x: number; y: number }) => { x: number; y: number };

/** Flux of a uniform field |E| through a flat area tilted tiltDeg from face-on. */
export function fluxTilted(E: number, area: number, tiltDeg: number): number {
  return E * area * Math.cos((tiltDeg * Math.PI) / 180);
}

/** ∫E·dl along a straight path of given length at pathAngleDeg to a uniform E. */
export function pathIntegralUniform(E: number, length: number, pathAngleDeg: number): number {
  return E * length * Math.cos((pathAngleDeg * Math.PI) / 180);
}

export function divergenceAt(field: Field2, p: { x: number; y: number }, h = 1e-4): number {
  const dFx = (field({ x: p.x + h, y: p.y }).x - field({ x: p.x - h, y: p.y }).x) / (2 * h);
  const dFy = (field({ x: p.x, y: p.y + h }).y - field({ x: p.x, y: p.y - h }).y) / (2 * h);
  return dFx + dFy;
}

export function curlZAt(field: Field2, p: { x: number; y: number }, h = 1e-4): number {
  const dFyDx = (field({ x: p.x + h, y: p.y }).y - field({ x: p.x - h, y: p.y }).y) / (2 * h);
  const dFxDy = (field({ x: p.x, y: p.y + h }).x - field({ x: p.x, y: p.y - h }).x) / (2 * h);
  return dFyDx - dFxDy;
}

/** Outward flux (per unit depth) through the closed box [−half, half]², midpoint rule. */
export function netFluxBox(field: Field2, half: number, samplesPerSide = 64): number {
  const dl = (2 * half) / samplesPerSide;
  let flux = 0;
  for (let i = 0; i < samplesPerSide; i++) {
    const t = -half + (i + 0.5) * dl;
    flux += field({ x: half, y: t }).x * dl;   // right face, n̂ = +x̂
    flux -= field({ x: -half, y: t }).x * dl;  // left face, n̂ = −x̂
    flux += field({ x: t, y: half }).y * dl;   // top face, n̂ = +ŷ
    flux -= field({ x: t, y: -half }).y * dl;  // bottom face, n̂ = −ŷ
  }
  return flux;
}

/** CCW circulation (per unit depth) around the same closed box, midpoint rule. */
export function circulationBox(field: Field2, half: number, samplesPerSide = 64): number {
  const dl = (2 * half) / samplesPerSide;
  let circ = 0;
  for (let i = 0; i < samplesPerSide; i++) {
    const t = -half + (i + 0.5) * dl;
    circ += field({ x: half, y: t }).y * dl;   // right face, t̂ = +ŷ (CCW)
    circ -= field({ x: -half, y: t }).y * dl;  // left face, t̂ = −ŷ
    circ -= field({ x: t, y: half }).x * dl;   // top face, t̂ = −x̂
    circ += field({ x: t, y: -half }).x * dl;  // bottom face, t̂ = +x̂
  }
  return circ;
}

// ── Canonical Local-view bench fields ────────────────────────────────────────
export const fieldUniform: Field2 = () => ({ x: 1, y: 0 });

/** 2-D point source r̂/r = (x,y)/r²: divergence 0 away from the origin; box
 *  flux 2π whenever the origin is enclosed (any box size). r² clamped so the
 *  canvas can sample arrows near the origin without blowing up. */
export const fieldPointSource: Field2 = (p) => {
  const r2 = Math.max(p.x * p.x + p.y * p.y, 1e-6);
  return { x: p.x / r2, y: p.y / r2 };
};

/** Rigid rotation F = (−y, x): curl 2 everywhere, divergence 0. */
export const fieldVortex: Field2 = (p) => ({ x: -p.y, y: p.x });
