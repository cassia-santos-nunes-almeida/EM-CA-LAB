import { describe, it, expect } from 'vitest';
import { getSectionNumber } from '@shared/constants/curriculum';

describe('getSectionNumber', () => {
  it('derives Part.Section from spine order', () => {
    expect(getSectionNumber('component-physics')).toBe('1.1');
    expect(getSectionNumber('nodal-mesh-analysis')).toBe('1.3');
    expect(getSectionNumber('circuit-theorems')).toBe('1.4');
    expect(getSectionNumber('switched-circuits')).toBe('1.5');
    expect(getSectionNumber('partial-fractions')).toBe('1.7');
    expect(getSectionNumber('interactive-lab')).toBe('1.9');
    expect(getSectionNumber('math-vectors')).toBe('2.1');
    expect(getSectionNumber('coulomb')).toBe('2.2');
    expect(getSectionNumber('magnetic-circuits')).toBe('3.3');
    expect(getSectionNumber('transformers')).toBe('3.4');
    expect(getSectionNumber('antennas')).toBe('4.4');
    expect(getSectionNumber('transmission-lines')).toBe('5.2');
    expect(getSectionNumber('line-impedance')).toBe('5.3');
    expect(getSectionNumber('transients')).toBe('5.4');
  });

  it('returns empty string for an unknown id', () => {
    expect(getSectionNumber('does-not-exist')).toBe('');
  });
});
