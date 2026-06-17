/**
 * Pure math for "Waves in Real Media" (em-wave 4.2): intrinsic impedance,
 * loss tangent / good-conductor attenuation, and normal-incidence
 * reflection at a two-media interface. Unicode-only docs, no LaTeX.
 */

/** Vacuum permittivity ε₀ = 8.8541878×10⁻¹² F/m (CODATA). */
const EPSILON_0 = 8.8541878e-12;

/** Vacuum permeability μ₀ = 4π×10⁻⁷ ≈ 1.25663706×10⁻⁶ H/m (CODATA). */
const MU_0 = 1.25663706e-6;

/** Intrinsic impedance of free space η₀ = √(μ₀/ε₀) ≈ 376.730 Ω. */
export const ETA0 = Math.sqrt(MU_0 / EPSILON_0);

/** Intrinsic impedance η = η₀·√(μr/εr) in Ω; NaN for εr ≤ 0. μr defaults to 1. */
export function intrinsicImpedance(epsR: number, muR: number = 1): number {
  if (epsR <= 0) return NaN;
  return ETA0 * Math.sqrt(muR / epsR);
}

/** Loss tangent tan δ = σ/(ωε) = σ/(2πf·εr·ε₀), dimensionless; NaN for f ≤ 0. */
export function lossTangent(sigma: number, f: number, epsR: number): number {
  if (f <= 0) return NaN;
  return sigma / (2 * Math.PI * f * epsR * EPSILON_0);
}

/** Good-conductor attenuation α = √(π·f·μ₀·μr·σ) in Np/m; NaN for f ≤ 0 or σ ≤ 0. μr defaults to 1. */
export function attenuationGoodConductor(f: number, sigma: number, muR: number = 1): number {
  if (f <= 0 || sigma <= 0) return NaN;
  return Math.sqrt(Math.PI * f * MU_0 * muR * sigma);
}

/** Skin depth δs = 1/attenuationGoodConductor in m — same guards (NaN propagates). */
export function skinDepth(f: number, sigma: number, muR: number = 1): number {
  return 1 / attenuationGoodConductor(f, sigma, muR);
}

/** Nepers → decibels: 1 Np = 20·log₁₀(e) ≈ 8.685889 dB. */
export function nepersToDb(np: number): number {
  return np * (20 / Math.LN10);
}

/** Normal-incidence reflection coefficient Γ = (η₂ − η₁)/(η₂ + η₁), dimensionless. */
export function normalIncidenceGamma(eta1: number, eta2: number): number {
  return (eta2 - eta1) / (eta2 + eta1);
}

/** Normal-incidence transmission coefficient τ = 2η₂/(η₁ + η₂) = 1 + Γ. */
export function normalIncidenceTau(eta1: number, eta2: number): number {
  return (2 * eta2) / (eta1 + eta2);
}

/** Reflected power fraction Γ² (the transmitted fraction is 1 − Γ²). */
export function reflectedPowerFraction(gamma: number): number {
  return gamma * gamma;
}
