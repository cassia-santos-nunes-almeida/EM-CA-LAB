// Pure vector-product math for the math-vectors section (2.1). No React.
// Convention: in-plane vectors; cross2z returns the ẑ-component, so its SIGN
// is the out-of-screen (+) / into-screen (−) direction of A×B (RH rule).

export interface Vec2 {
  x: number;
  y: number;
}

export function vecFromPolarDeg(mag: number, angleDeg: number): Vec2 {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) };
}

export function magnitude(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function vadd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function cross2z(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

/** Precondition: both `a` and `b` must have non-zero magnitude (callers guarantee it — the bench fixes |A| = 2 and floors |B| at 0.5); result is NaN otherwise. */
export function angleBetweenDeg(a: Vec2, b: Vec2): number {
  const cos = dot2(a, b) / (magnitude(a) * magnitude(b));
  // clamp against float drift before acos
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

/**
 * Signed length of the projection of b onto the direction of ontoA: |b|cosθ.
 * Precondition: `ontoA` must have non-zero magnitude (callers guarantee it — the
 * bench fixes |A| = 2 and floors |B| at 0.5); result is NaN otherwise.
 */
export function projectionLength(b: Vec2, ontoA: Vec2): number {
  return dot2(b, ontoA) / magnitude(ontoA);
}
