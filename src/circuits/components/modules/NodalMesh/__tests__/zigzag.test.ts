import { describe, it, expect } from 'vitest';
import { verticalZigzag, horizontalZigzag } from '../zigzag';

/**
 * A.5 #10 — verticalZigzag had 3 byte-identical copies (Bridge/Mesh/index) and
 * horizontalZigzag 2 (Bridge/Mesh). Hoisted to one shared circuit-SVG util; these
 * pin the exact polyline format so the extraction is provably output-identical.
 */
describe('zigzag resistor polylines (A.5 #10 shared util)', () => {
  it('verticalZigzag: 6 alternating ±10 teeth between the endpoints', () => {
    expect(verticalZigzag(0, 0, 70)).toBe('0,0 -10,10 10,20 -10,30 10,40 -10,50 10,60 0,70');
  });

  it('horizontalZigzag: 6 alternating ±10 teeth between the endpoints', () => {
    expect(horizontalZigzag(0, 0, 70)).toBe('0,0 10,-10 20,10 30,-10 40,10 50,-10 60,10 70,0');
  });
});
