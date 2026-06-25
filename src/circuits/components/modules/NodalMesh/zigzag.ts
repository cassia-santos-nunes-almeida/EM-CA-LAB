/**
 * Shared circuit-SVG resistor zig-zag polyline helpers for the NodalMesh diagrams
 * (Bridge / Mesh / Supernode). Previously copied byte-for-byte across those files
 * (A.5 #10) — single source here.
 */

/** Vertical zig-zag resistor polyline points, centered on x from y1 to y2. */
export function verticalZigzag(x: number, y1: number, y2: number): string {
  const pts: string[] = [`${x},${y1}`];
  const span = y2 - y1;
  for (let i = 1; i <= 6; i++) {
    const dx = i % 2 === 1 ? -10 : 10;
    pts.push(`${x + dx},${y1 + (span * i) / 7}`);
  }
  pts.push(`${x},${y2}`);
  return pts.join(' ');
}

/** Horizontal zig-zag resistor polyline points, centered on y from x1 to x2. */
export function horizontalZigzag(y: number, x1: number, x2: number): string {
  const pts: string[] = [`${x1},${y}`];
  const span = x2 - x1;
  for (let i = 1; i <= 6; i++) {
    const dy = i % 2 === 1 ? -10 : 10;
    pts.push(`${x1 + (span * i) / 7},${y + dy}`);
  }
  pts.push(`${x2},${y}`);
  return pts.join(' ');
}
