import type { BounceEvent } from '@transmission/types/transmission';

/** Speed of light in vacuum (m/s). */
export const C = 3e8;

/** Calculate mutual inductance: M = k * sqrt(L1 * L2). */
export function calculateMutualInductance(k: number, L1: number, L2: number): number {
  return k * Math.sqrt(L1 * L2);
}

/** Calculate ideal transformer secondary voltage: V2 = V1 * (N2/N1). */
export function calculateSecondaryVoltage(V1: number, N1: number, N2: number): number {
  if (N1 === 0) return 0;
  return V1 * (N2 / N1);
}

/** Calculate actual secondary voltage accounting for coupling: V2 ≈ k * V1 * (N2/N1). */
export function calculateActualSecondaryVoltage(V1: number, N1: number, N2: number, k: number): number {
  if (N1 === 0) return 0;
  return k * V1 * (N2 / N1);
}

/** Calculate ideal transformer secondary current: I2 = I1 * (N1/N2). */
export function calculateSecondaryCurrent(I1: number, N1: number, N2: number): number {
  if (N2 === 0) return 0;
  return I1 * (N1 / N2);
}

/** Calculate reflected impedance: Zref = (N1/N2)^2 * ZL. */
export function calculateReflectedImpedance(N1: number, N2: number, ZL: number): number {
  if (N2 === 0) return Infinity;
  return Math.pow(N1 / N2, 2) * ZL;
}

/** Calculate characteristic impedance (lossless): Z0 = sqrt(L'/C'). */
export function calculateCharacteristicImpedance(Lp: number, Cp: number): number {
  if (Cp === 0) return Infinity;
  return Math.sqrt(Lp / Cp);
}

/** Calculate reflection coefficient: Gamma = (ZL - Z0) / (ZL + Z0). */
export function calculateReflectionCoefficient(ZL: number, Z0: number): number {
  if (!isFinite(ZL)) return 1; // Open circuit
  if (ZL + Z0 === 0) return -Infinity;
  return (ZL - Z0) / (ZL + Z0);
}

/** Calculate VSWR from reflection coefficient magnitude. */
export function calculateVSWR(gammaMag: number): number {
  const absGamma = Math.abs(gammaMag);
  if (absGamma >= 1) return Infinity;
  return (1 + absGamma) / (1 - absGamma);
}

/** Calculate wave speed: v = 1 / sqrt(L' * C'). */
export function calculateWaveSpeed(Lp: number, Cp: number): number {
  return 1 / Math.sqrt(Lp * Cp);
}

/** Calculate propagation delay: Td = length / v. */
export function calculatePropagationDelay(length: number, v: number): number {
  if (v === 0) return Infinity;
  return length / v;
}

/** Calculate free-space wavelength from frequency: lambda_0 = c / f. */
export function calculateWavelength(frequency: number): number {
  if (frequency === 0) return Infinity;
  return C / frequency;
}

/**
 * Calculate bounce diagram voltages for a step input.
 * Returns array of BounceEvent objects representing each bounce.
 */
export function calculateBounceVoltages(
  Vs: number,
  Zs: number,
  Z0: number,
  gammaLoad: number,
  gammaSource: number,
  numBounces: number,
): BounceEvent[] {
  const events: BounceEvent[] = [];

  // Initial voltage launched onto line: V+ = Vs * Z0 / (Zs + Z0)
  const V0 = Vs * Z0 / (Zs + Z0);

  let currentAmplitude = V0;
  let vSourceAccum = V0; // Voltage at source end
  let vLoadAccum = 0; // Voltage at load end

  // Bounce 0: initial forward wave (source → load)
  vLoadAccum += currentAmplitude * (1 + gammaLoad);
  events.push({
    index: 0,
    voltage: currentAmplitude,
    direction: 'forward',
    vSource: vSourceAccum,
    vLoad: vLoadAccum,
  });

  for (let i = 1; i <= numBounces; i++) {
    if (i % 2 === 1) {
      // Odd bounce: reflect at load, wave travels backward (load → source)
      currentAmplitude *= gammaLoad;
      vSourceAccum += currentAmplitude * (1 + gammaSource);
      events.push({
        index: i,
        voltage: currentAmplitude,
        direction: 'backward',
        vSource: vSourceAccum,
        vLoad: vLoadAccum,
      });
    } else {
      // Even bounce: reflect at source, wave travels forward (source → load)
      currentAmplitude *= gammaSource;
      vLoadAccum += currentAmplitude * (1 + gammaLoad);
      events.push({
        index: i,
        voltage: currentAmplitude,
        direction: 'forward',
        vSource: vSourceAccum,
        vLoad: vLoadAccum,
      });
    }
  }

  return events;
}

/**
 * Calculate steady-state voltage from geometric series.
 * Vss = Vs * ZL / (Zs + ZL) for resistive networks.
 */
export function calculateSteadyStateVoltage(Vs: number, Zs: number, ZL: number): number {
  if (!isFinite(ZL)) return Vs; // Open circuit
  if (Zs + ZL === 0) return 0;
  return Vs * ZL / (Zs + ZL);
}

/**
 * Calculate the far-field radiation pattern of a thin dipole antenna.
 * Returns the normalized E-field magnitude at angle theta (radians from axis).
 * Uses the standard antenna pattern formula.
 */
export function calculateRadiationPattern(
  dipoleLengthFraction: number,
  theta: number,
): number {
  const kL = Math.PI * dipoleLengthFraction; // k * L/2 where k = 2pi/lambda
  const sinTheta = Math.sin(theta);

  if (Math.abs(sinTheta) < 1e-10) return 0;

  const numerator = Math.cos(kL * Math.cos(theta)) - Math.cos(kL);
  return Math.abs(numerator / sinTheta);
}

/**
 * Calculate approximate directivity for a dipole antenna.
 * Uses numerical integration of the radiation pattern.
 */
export function calculateDirectivity(dipoleLengthFraction: number): number {
  const steps = 360;
  const dTheta = Math.PI / steps;
  let integralU = 0;
  let maxU = 0;

  for (let i = 0; i <= steps; i++) {
    const theta = i * dTheta;
    const E = calculateRadiationPattern(dipoleLengthFraction, theta);
    const U = E * E;
    if (U > maxU) maxU = U;
    integralU += U * Math.sin(theta) * dTheta;
  }

  if (integralU === 0) return 0;
  return (2 * maxU) / integralU;
}

/**
 * Calculate approximate radiation resistance for a thin dipole.
 * Uses numerical integration (Prad = integral of U * sin(theta) dtheta dphi).
 */
export function calculateRadiationResistance(dipoleLengthFraction: number): number {
  // For a half-wave dipole, R_rad ≈ 73 ohms
  // General formula involves integrating |F(theta)|^2 sin(theta)
  const steps = 360;
  const dTheta = Math.PI / steps;
  let integral = 0;

  for (let i = 0; i <= steps; i++) {
    const theta = i * dTheta;
    const E = calculateRadiationPattern(dipoleLengthFraction, theta);
    integral += E * E * Math.sin(theta) * dTheta;
  }

  // R_rad = 60 * integral (for a center-fed dipole with 1A input)
  return 60 * integral;
}

/**
 * Calculate half-power beamwidth (HPBW) in degrees.
 * Finds the angle where the pattern drops to half its max power.
 */
export function calculateHPBW(dipoleLengthFraction: number): number {
  const steps = 1800;
  const dTheta = Math.PI / steps;
  let maxU = 0;
  let maxTheta = Math.PI / 2;

  // Find maximum
  for (let i = 0; i <= steps; i++) {
    const theta = i * dTheta;
    const E = calculateRadiationPattern(dipoleLengthFraction, theta);
    const U = E * E;
    if (U > maxU) {
      maxU = U;
      maxTheta = theta;
    }
  }

  const halfPower = maxU / 2;

  // Find 3dB angles
  let theta1 = maxTheta;
  let theta2 = maxTheta;

  for (let i = Math.round(maxTheta / dTheta); i >= 0; i--) {
    const theta = i * dTheta;
    const E = calculateRadiationPattern(dipoleLengthFraction, theta);
    if (E * E < halfPower) {
      theta1 = theta;
      break;
    }
  }

  for (let i = Math.round(maxTheta / dTheta); i <= steps; i++) {
    const theta = i * dTheta;
    const E = calculateRadiationPattern(dipoleLengthFraction, theta);
    if (E * E < halfPower) {
      theta2 = theta;
      break;
    }
  }

  return (theta2 - theta1) * (180 / Math.PI);
}

/** Phase constant β = 2π/λ in rad/m. Returns NaN for wavelength ≤ 0. */
export function calculatePhaseConstant(wavelength: number): number {
  if (wavelength <= 0) return NaN;
  return (2 * Math.PI) / wavelength;
}

/** Electrical length in degrees from l/λ: 360·lOverLambda. */
export function electricalLengthDegrees(lOverLambda: number): number {
  return 360 * lOverLambda;
}

/** Rotate Γ toward the generator: Γ(l) = Γ_L·e^(−j·2·betaL). betaL in RADIANS
 *  (= 2π·l/λ); the round-trip factor 2 is applied INSIDE. Returns the same
 *  shape as calculateComplexReflectionCoefficient. */
export function rotateGamma(
  gammaReal: number, gammaImag: number, betaL: number,
): { real: number; imag: number; magnitude: number; phaseDeg: number } {
  const angle = -2 * betaL;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const real = gammaReal * cos - gammaImag * sin;
  const imag = gammaReal * sin + gammaImag * cos;
  const magnitude = Math.sqrt(real * real + imag * imag);
  const phaseDeg = Math.atan2(imag, real) * (180 / Math.PI);
  return { real, imag, magnitude, phaseDeg };
}

/** Invert Γ → impedance: Z = Z0·(1+Γ)/(1−Γ). Returns { real: Infinity, imag: 0 }
 *  when |1−Γ|² < 1e-12 (e.g. a short seen through λ/4). NOTE: deliberately NOT
 *  wired into SmithChartSim's private _gammaToZL, whose 500-clamp is load-bearing
 *  for click-to-place. */
export function gammaToImpedance(
  gammaReal: number, gammaImag: number, Z0: number,
): { real: number; imag: number } {
  const numR = 1 + gammaReal;
  const numI = gammaImag;
  const denR = 1 - gammaReal;
  const denI = -gammaImag;
  const denMagSq = denR * denR + denI * denI;
  if (denMagSq < 1e-12) return { real: Infinity, imag: 0 };
  const real = Z0 * (numR * denR + numI * denI) / denMagSq;
  const imag = Z0 * (numI * denR - numR * denI) / denMagSq;
  return { real, imag };
}

/** Z_in of a lossless line: Γ_L → rotate by −2·betaL → invert. betaL in RADIANS.
 *  ZLr = Infinity (open load) handled explicitly (Γ_L = 1+j0), since
 *  calculateComplexReflectionCoefficient NaNs on Infinity. Named to avoid the
 *  transformer's calculateReflectedImpedance. */
export function calculateInputImpedance(
  ZLr: number, ZLi: number, Z0: number, betaL: number,
): { real: number; imag: number } {
  const gammaL = !isFinite(ZLr)
    ? { real: 1, imag: 0 }
    : calculateComplexReflectionCoefficient(ZLr, ZLi, Z0);
  const gammaIn = rotateGamma(gammaL.real, gammaL.imag, betaL);
  return gammaToImpedance(gammaIn.real, gammaIn.imag, Z0);
}

/** Stub input reactance in ohms: 'short' → Z0·tan(betaL), 'open' → −Z0·cot(betaL).
 *  Pole guards: short with |cos βl| < 1e-9 → Infinity; open with |sin βl| < 1e-9 →
 *  (cos βl > 0 ? -Infinity : Infinity). */
export function calculateStubReactance(Z0: number, betaL: number, kind: 'short' | 'open'): number {
  const cos = Math.cos(betaL);
  const sin = Math.sin(betaL);
  if (kind === 'short') {
    if (Math.abs(cos) < 1e-9) return Infinity;
    return Z0 * (sin / cos);
  }
  if (Math.abs(sin) < 1e-9) return cos > 0 ? -Infinity : Infinity;
  return -Z0 * (cos / sin);
}

/** Quarter-wave transformer impedance √(Z0·RL); NaN for RL ≤ 0 or Z0 ≤ 0. */
export function quarterWaveTransformerImpedance(Z0: number, RL: number): number {
  if (Z0 <= 0 || RL <= 0) return NaN;
  return Math.sqrt(Z0 * RL);
}

/** Calculate complex reflection coefficient for complex load impedance. */
export function calculateComplexReflectionCoefficient(
  ZLr: number, ZLi: number, Z0: number
): { real: number; imag: number; magnitude: number; phaseDeg: number } {
  // Gamma = (ZL - Z0) / (ZL + Z0) where ZL = ZLr + jZLi
  const numR = ZLr - Z0;
  const numI = ZLi;
  const denR = ZLr + Z0;
  const denI = ZLi;
  const denMagSq = denR * denR + denI * denI;
  if (denMagSq === 0) return { real: 1, imag: 0, magnitude: 1, phaseDeg: 0 };
  const real = (numR * denR + numI * denI) / denMagSq;
  const imag = (numI * denR - numR * denI) / denMagSq;
  const magnitude = Math.sqrt(real * real + imag * imag);
  const phaseDeg = Math.atan2(imag, real) * (180 / Math.PI);
  return { real, imag, magnitude, phaseDeg };
}
