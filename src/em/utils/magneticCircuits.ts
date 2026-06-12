// Pure magnetic-circuit math extracted from the magnetic-circuits section's
// inline sim physics. Formula-for-formula identical to the canvas readouts —
// the unit tests pin the identity, so any edit here (or there) that changes a
// digit breaks the build instead of silently invalidating the worked examples.

/** Permeability of free space, μ₀ = 4π×10⁻⁷ T·m/A. */
const MU_0 = 4 * Math.PI * 1e-7;

/** ℛ = l/(μ₀·μᵣ·A) in A·t/Wb. */
export function reluctance(length: number, muR: number, area: number): number {
  return length / (MU_0 * muR * area);
}

export interface ToroidSolution {
  /** Air-gap length in m (gapPercent of the mean-circumference path). */
  gapLength: number;
  /** Remaining core path length in m. */
  coreLength: number;
  /** Core reluctance in A·t/Wb. */
  reluctanceCore: number;
  /** Gap reluctance in A·t/Wb (0 when there is no gap). */
  reluctanceGap: number;
  /** Series total ℛ_core + ℛ_gap in A·t/Wb. */
  reluctanceTotal: number;
  /** Magnetomotive force NI in A·t. */
  mmf: number;
  /** Flux Φ = MMF/ℛ_total in Wb (Hopkinson's law). */
  flux: number;
  /** Flux density B = Φ/A in T (continuous through the series path). */
  B: number;
  /** Field strength in the core, H = B/(μ₀μᵣ), in A/m. */
  hCore: number;
  /** Field strength in the gap, H = B/μ₀, in A/m (0 when there is no gap). */
  hGap: number;
  /** Inductance L = N²/ℛ_total in H. */
  inductance: number;
}

/**
 * The sim's toroid, solved: gapPercent in [0,100]; hGap = 0 when gapPercent = 0
 * (display convention preserved). Geometry defaults = the sim's
 * (r = 0.05 m, A = 10⁻³ m²).
 */
export function solveToroid(
  muR: number,
  turns: number,
  current: number,
  gapPercent: number,
  meanRadius: number = 0.05,
  coreArea: number = 0.001,
): ToroidSolution {
  // Toroid geometry (physical)
  const pathLength = 2 * Math.PI * meanRadius;
  const gapLength = (gapPercent / 100) * pathLength;
  const coreLength = pathLength - gapLength;

  // Reluctances
  const reluctanceCore = reluctance(coreLength, muR, coreArea);
  const reluctanceGap = gapLength > 0 ? reluctance(gapLength, 1, coreArea) : 0;
  const reluctanceTotal = reluctanceCore + reluctanceGap;

  // Computed outputs
  const mmf = turns * current;
  const flux = mmf / reluctanceTotal;
  const B = flux / coreArea;
  // H differs by section: B = μ₀μᵣH_core = μ₀H_gap
  const hCore = B / (MU_0 * muR);
  const hGap = gapLength > 0 ? B / MU_0 : 0;
  const inductance = (turns * turns) / reluctanceTotal;

  return {
    gapLength,
    coreLength,
    reluctanceCore,
    reluctanceGap,
    reluctanceTotal,
    mmf,
    flux,
    B,
    hCore,
    hGap,
    inductance,
  };
}
