import { describe, it, expect } from 'vitest';
import {
  calculateResistance,
  calculateCapacitance,
  calculateInductance,
  materials,
} from '@circuits/utils/componentMath';

describe('calculateResistance', () => {
  it('computes R = rho * L / A', () => {
    // Copper: rho = 1.68e-8, L = 1m, A = 1e-6 m^2 → R = 0.0168 Ω
    expect(calculateResistance(1.68e-8, 1, 1e-6)).toBeCloseTo(0.0168, 4);
  });

  it('doubles with double length', () => {
    const r1 = calculateResistance(1e-8, 1, 1e-6);
    const r2 = calculateResistance(1e-8, 2, 1e-6);
    expect(r2).toBeCloseTo(r1 * 2);
  });

  it('halves with double area', () => {
    const r1 = calculateResistance(1e-8, 1, 1e-6);
    const r2 = calculateResistance(1e-8, 1, 2e-6);
    expect(r2).toBeCloseTo(r1 / 2);
  });

  it('returns 0 when resistivity is 0', () => {
    expect(calculateResistance(0, 1, 1e-6)).toBe(0);
  });
});

describe('calculateCapacitance', () => {
  it('computes C = epsilon * A / d', () => {
    // Air: epsilon = 8.854e-12, A = 0.01 m^2, d = 0.001 m
    expect(calculateCapacitance(8.854e-12, 0.01, 0.001)).toBeCloseTo(8.854e-11, 14);
  });

  it('increases with area', () => {
    const c1 = calculateCapacitance(8.854e-12, 0.01, 0.001);
    const c2 = calculateCapacitance(8.854e-12, 0.02, 0.001);
    expect(c2).toBeCloseTo(c1 * 2);
  });

  it('decreases with distance', () => {
    const c1 = calculateCapacitance(8.854e-12, 0.01, 0.001);
    const c2 = calculateCapacitance(8.854e-12, 0.01, 0.002);
    expect(c2).toBeCloseTo(c1 / 2);
  });

  it('scales with permittivity', () => {
    const c1 = calculateCapacitance(8.854e-12, 0.01, 0.001);
    const c2 = calculateCapacitance(2 * 8.854e-12, 0.01, 0.001);
    expect(c2).toBeCloseTo(c1 * 2);
  });
});

describe('calculateInductance', () => {
  it('computes L = mu * N^2 * A / l', () => {
    // mu = 1.257e-6, N = 100, A = 0.0001, l = 0.1
    const expected = (1.257e-6 * 100 * 100 * 0.0001) / 0.1;
    expect(calculateInductance(1.257e-6, 100, 0.0001, 0.1)).toBeCloseTo(expected, 10);
  });

  it('scales with N^2', () => {
    const l1 = calculateInductance(1.257e-6, 100, 0.0001, 0.1);
    const l2 = calculateInductance(1.257e-6, 200, 0.0001, 0.1);
    expect(l2).toBeCloseTo(l1 * 4);
  });

  it('scales linearly with area', () => {
    const l1 = calculateInductance(1.257e-6, 100, 0.0001, 0.1);
    const l2 = calculateInductance(1.257e-6, 100, 0.0002, 0.1);
    expect(l2).toBeCloseTo(l1 * 2);
  });

  it('inversely scales with length', () => {
    const l1 = calculateInductance(1.257e-6, 100, 0.0001, 0.1);
    const l2 = calculateInductance(1.257e-6, 100, 0.0001, 0.2);
    expect(l2).toBeCloseTo(l1 / 2);
  });
});

describe('materials', () => {
  it('contains at least 5 materials', () => {
    expect(materials.length).toBeGreaterThanOrEqual(5);
  });

  it('all materials have a name', () => {
    for (const m of materials) {
      expect(m.name).toBeTruthy();
    }
  });

  it('conductive materials have resistivity', () => {
    const conductors = materials.filter(m => m.resistivity);
    expect(conductors.length).toBeGreaterThanOrEqual(4);
    for (const m of conductors) {
      expect(m.resistivity).toBeGreaterThan(0);
    }
  });

  it('dielectric materials have permittivity', () => {
    const dielectrics = materials.filter(m => m.permittivity);
    expect(dielectrics.length).toBeGreaterThanOrEqual(3);
    for (const m of dielectrics) {
      expect(m.permittivity).toBeGreaterThan(0);
    }
  });
});
