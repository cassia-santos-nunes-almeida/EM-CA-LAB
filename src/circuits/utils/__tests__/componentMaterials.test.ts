import { describe, it, expect } from 'vitest';
import { materials } from '../componentMath';

/**
 * Permanent net (units) + sweep N1 — dielectric materials must store ABSOLUTE permittivity
 * ε = εr·ε0 (ε0 = 8.854e-12 F/m). Paper/Teflon had used εr×1e-11, ~13% high, which inflated
 * the "Calculated Capacitance" readout when those presets were clicked.
 */
const EPS0 = 8.854e-12;
const epsrOf = (name: string) => materials.find((m) => m.name === name)!.permittivity! / EPS0;

describe('dielectric materials use absolute permittivity ε = εr·ε0 (N1)', () => {
  it('Teflon εr ≈ 2.1', () => {
    expect(epsrOf('Teflon')).toBeCloseTo(2.1, 1);
  });

  it('Paper εr ≈ 3.7', () => {
    expect(epsrOf('Paper')).toBeCloseTo(3.7, 1);
  });

  it('Air is vacuum permittivity (εr = 1)', () => {
    expect(epsrOf('Air')).toBeCloseTo(1, 2);
  });

  it('every named dielectric has a physical εr ≥ 1', () => {
    for (const m of materials.filter((mm) => mm.permittivity)) {
      expect(m.permittivity! / EPS0).toBeGreaterThanOrEqual(1 - 1e-9);
    }
  });
});
