import { describe, it, expect } from 'vitest';
import {
  fluxTilted, pathIntegralUniform, divergenceAt, curlZAt, netFluxBox, circulationBox,
  fieldUniform, fieldPointSource, fieldVortex,
} from '@em/sections/math-integrals/physics';

// Local fixture with EXACT finite-difference behavior (linear field): F = (x, y)
// is a uniformly EXPANDING field — divergence 2 at EVERY point, not a point
// source. (Named to prevent the exact confusion a point-source label caused.)
const expanding = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });

describe('math-integrals physics (hand-derived + local-view guards)', () => {
  it('fluxTilted: Φ = E·A·cosθ — face-on max, 60° exactly halves, edge-on exactly 0', () => {
    expect(fluxTilted(200, 0.5, 0)).toBeCloseTo(100, 9);
    expect(fluxTilted(200, 0.5, 60)).toBeCloseTo(50, 9);
    expect(fluxTilted(200, 0.5, 90)).toBeCloseTo(0, 9);
  });
  it('pathIntegralUniform: E·L·cosθ — along +20, perpendicular 0, opposed −20', () => {
    expect(pathIntegralUniform(10, 2, 0)).toBeCloseTo(20, 9);
    expect(pathIntegralUniform(10, 2, 90)).toBeCloseTo(0, 9);
    expect(pathIntegralUniform(10, 2, 180)).toBeCloseTo(-20, 9);
  });
  it('divergenceAt: 0 uniform; exactly 2 EVERYWHERE for the expanding field F = (x, y); 0 for the vortex', () => {
    expect(divergenceAt(fieldUniform, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
    expect(divergenceAt(expanding, { x: 0.4, y: -0.2 })).toBeCloseTo(2, 9); // central differences are exact on linear fields
    expect(divergenceAt(fieldVortex, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
  });
  it('point source (x,y)/r²: divergence is ZERO away from the origin — all source-ness at one point', () => {
    expect(divergenceAt(fieldPointSource, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 5);
    expect(divergenceAt(fieldPointSource, { x: -1.1, y: 0.7 })).toBeCloseTo(0, 5);
  });
  it('curlZAt: 0 uniform; exactly 2 for the vortex F = (−y, x); 0 for the expanding field', () => {
    expect(curlZAt(fieldUniform, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
    expect(curlZAt(fieldVortex, { x: 0.4, y: -0.2 })).toBeCloseTo(2, 9);
    expect(curlZAt(expanding, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
  });
  it('netFluxBox: 0 uniform (in = out); div × area = 2 × 4 = 8 for the expanding field (divergence theorem)', () => {
    expect(netFluxBox(fieldUniform, 1)).toBeCloseTo(0, 9);
    expect(netFluxBox(expanding, 1)).toBeCloseTo(8, 9); // midpoint rule exact on linear fields
  });
  it('point-source box flux is 2π whatever the box size — the shrink-invariance CC #3 keys on', () => {
    expect(netFluxBox(fieldPointSource, 1, 512)).toBeCloseTo(2 * Math.PI, 4);
    expect(netFluxBox(fieldPointSource, 0.5, 512)).toBeCloseTo(2 * Math.PI, 4);
  });
  it('circulationBox: 0 uniform; curl × area = 2 × 4 = 8 for the vortex (Stokes); 0 for the point source', () => {
    expect(circulationBox(fieldUniform, 1)).toBeCloseTo(0, 9);
    expect(circulationBox(fieldVortex, 1)).toBeCloseTo(8, 9); // per-face integrand constant — exact
    expect(circulationBox(fieldPointSource, 1)).toBeCloseTo(0, 9); // odd integrand, symmetric samples cancel
  });
});
