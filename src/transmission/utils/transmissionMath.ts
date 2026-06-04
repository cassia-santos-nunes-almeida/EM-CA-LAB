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
