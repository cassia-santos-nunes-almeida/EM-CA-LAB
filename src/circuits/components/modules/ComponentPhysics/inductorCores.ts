import { materials } from '@circuits/utils/componentMath';

/**
 * Inductor CORE presets — magnetic cores only.
 *
 * The old preset list took `materials.filter(m => m.permeability).slice(0,3)`,
 * which resolved to Copper/Aluminum/Silver: wire CONDUCTORS with μr≈1 (two of
 * them diamagnetic), misleading as inductor cores (Appendix A.2#2). We restrict
 * to the real cores in the shared table — Air (≈μ₀) and Iron (ferromagnetic) —
 * and source their μ from `materials`, so there is no duplicated literal (A.5).
 */
const CORE_NAMES = ['Air', 'Iron'] as const;

export interface InductorCore {
  name: string;
  /** absolute permeability μ in H/m */
  permeability: number;
  note?: string;
}

export const inductorCores: InductorCore[] = CORE_NAMES.map((name) => {
  const m = materials.find((x) => x.name === name);
  if (!m || m.permeability === undefined) {
    throw new Error(`inductorCores: material "${name}" is missing a permeability`);
  }
  return { name: m.name, permeability: m.permeability, note: m.note };
});

/**
 * Permeability-slider bounds = the full preset span, so the iron preset
 * (μ = 6.3e-3 H/m, ~630× the old linear max of 1e-5 H/m) is reachable instead
 * of pegging the thumb (A.2#3). The span covers ~3.7 decades, so the slider
 * runs on a LOG scale: its position is log₁₀(μ).
 */
export const PERMEABILITY_MIN = Math.min(...inductorCores.map((c) => c.permeability));
export const PERMEABILITY_MAX = Math.max(...inductorCores.map((c) => c.permeability));

export const PERMEABILITY_SLIDER_MIN = Math.log10(PERMEABILITY_MIN);
export const PERMEABILITY_SLIDER_MAX = Math.log10(PERMEABILITY_MAX);

/** slider position (log₁₀ μ) → permeability μ in H/m */
export const sliderToPermeability = (sliderPos: number): number => 10 ** sliderPos;
/** permeability μ in H/m → slider position (log₁₀ μ) */
export const permeabilityToSlider = (mu: number): number => Math.log10(mu);
