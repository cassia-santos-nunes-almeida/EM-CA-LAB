import { describe, it, expect } from 'vitest';
import { EPSR_PRESETS } from '../RealMedia';

/**
 * Sweep N5 — the εr≈81 interface preset modeled seawater as a LOSSLESS dielectric (64%
 * reflection), contradicting the section's own loss-tangent analysis (seawater is a good
 * conductor at RF, tan δ ≫ 1, reflecting ~all of it). εr=81 is water's LOW-frequency
 * permittivity, where the lossless model holds.
 */
describe('em-wave εr≈81 interface preset is honestly labeled (N5)', () => {
  it('is not labeled as RF seawater (a conductor) for a lossless 64% reflection', () => {
    const preset = EPSR_PRESETS.find((p) => p.value === 81)!;
    expect(preset.label).not.toMatch(/seawater-rf/i);
    // The caption must flag the low-frequency / conductor caveat so the lossless model is honest.
    expect(preset.caption).toMatch(/low.?freq|conductor/i);
  });
});
