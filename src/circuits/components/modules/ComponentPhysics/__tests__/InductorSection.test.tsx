import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InductorSection } from '../InductorSection';
import { materials } from '@circuits/utils/componentMath';
import {
  inductorCores,
  PERMEABILITY_MIN,
  PERMEABILITY_MAX,
  sliderToPermeability,
  permeabilityToSlider,
} from '../inductorCores';

/**
 * #9 batch 2 (09c) — inductor "Core Materials" defects (Appendix A.2#2 + A.2#3,
 * de-dup A.5).
 *
 *  A.2#2 (InductorSection.tsx:80): the preset list was `materials.filter(m =>
 *         m.permeability).slice(0,3)` → Copper/Aluminum/Silver — wire CONDUCTORS
 *         with μr≈1 (two diamagnetic), falsely presented as magnetic cores.
 *         Restrict to real cores (Air + Iron), sourced from `materials`.
 *  A.2#3 (InductorSection.tsx:93): the hardcoded Iron preset μ=6.3e-3 H/m pegged
 *         the permeability slider (linear range μ·1e6 ∈ [1.257,10] → max 1e-5 H/m,
 *         ~630× under iron). The slider must span the full preset range — log scale.
 *  A.5   : the Iron preset must come from the shared `materials` table, not a
 *         duplicated literal.
 */

const NOOP = () => {};
const baseProps = {
  turns: 100,
  area: 5e-4,
  length: 0.1,
  permeability: 1.257e-6,
  inductance: 0.001,
  onTurnsChange: NOOP,
  onAreaChange: NOOP,
  onLengthChange: NOOP,
  onPermeabilityChange: NOOP,
};

describe('inductor core presets are real magnetic cores, not wire conductors (A.2#2)', () => {
  it('offers Air and Iron, never the Cu/Al/Ag/Au conductors (μr≈1)', () => {
    const names = inductorCores.map((c) => c.name);
    expect(names).toContain('Air');
    expect(names).toContain('Iron');
    for (const conductor of ['Copper', 'Aluminum', 'Silver', 'Gold']) {
      expect(names).not.toContain(conductor);
    }
  });

  it('sources each preset μ from the shared materials table (A.5 de-dup)', () => {
    for (const core of inductorCores) {
      const m = materials.find((x) => x.name === core.name);
      expect(m?.permeability).toBeDefined();
      expect(core.permeability).toBe(m!.permeability);
    }
  });
});

describe('permeability slider spans every preset on a log scale (A.2#3)', () => {
  it('reaches the iron preset μ=6.3e-3 H/m instead of pegging at ~1e-5', () => {
    const iron = inductorCores.find((c) => c.name === 'Iron')!;
    expect(iron.permeability).toBe(6.3e-3);
    expect(iron.permeability).toBeLessThanOrEqual(PERMEABILITY_MAX);
    expect(iron.permeability).toBeGreaterThanOrEqual(PERMEABILITY_MIN);
    // the OLD linear slider topped out at μ·1e6 = 10 → 1e-5 H/m; iron must be reachable now.
    expect(PERMEABILITY_MAX).toBeGreaterThan(1e-5);
  });

  it('round-trips μ through the log mapping and keeps the geometric mid mid-slider', () => {
    expect(sliderToPermeability(permeabilityToSlider(PERMEABILITY_MIN))).toBeCloseTo(PERMEABILITY_MIN, 12);
    expect(sliderToPermeability(permeabilityToSlider(PERMEABILITY_MAX))).toBeCloseTo(PERMEABILITY_MAX, 9);
    const mid = sliderToPermeability(
      (permeabilityToSlider(PERMEABILITY_MIN) + permeabilityToSlider(PERMEABILITY_MAX)) / 2,
    );
    // a LINEAR slider would cram everything below ~μ_max/2; a log slider keeps the
    // geometric mean (~√(μ_min·μ_max)) near the centre — well clear of both ends.
    expect(mid).toBeGreaterThan(PERMEABILITY_MIN * 10);
    expect(mid).toBeLessThan(PERMEABILITY_MAX / 10);
  });
});

describe('InductorSection renders the corrected presets + slider (call-site binding)', () => {
  it('shows Air and Iron core buttons, not the conductor materials', () => {
    render(<InductorSection {...baseProps} />);
    expect(screen.getByRole('button', { name: /Air/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Iron/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Copper/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Aluminum/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Silver/i })).toBeNull();
  });

  it('drives the permeability slider on the shared log scale (rendered == module)', () => {
    render(<InductorSection {...baseProps} />);
    const slider = screen.getByLabelText(/core permeability/i) as HTMLInputElement;
    expect(Number(slider.min)).toBeCloseTo(permeabilityToSlider(PERMEABILITY_MIN), 6);
    expect(Number(slider.max)).toBeCloseTo(permeabilityToSlider(PERMEABILITY_MAX), 6);
  });
});
