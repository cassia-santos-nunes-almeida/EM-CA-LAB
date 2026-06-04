/**
 * Shared type definitions for circuit analysis.
 * Single source of truth — import from here, not from individual files.
 */

export type CircuitType = 'RC' | 'RL' | 'RLC';
export type DampingType = 'overdamped' | 'critically-damped' | 'underdamped';
export type InputType = 'step' | 'impulse';

/** Tolerance for treating zeta ~= 1 as critically damped */
export const CRITICAL_DAMPING_TOLERANCE = 0.01;

export interface CircuitParams {
  R: number;
  L: number;
  C: number;
  voltage: number;
}

export interface TimeSeriesPoint {
  time: number;
  voltage: number;
  current: number;
}

export interface CircuitResponse {
  data: TimeSeriesPoint[];
  dampingType?: DampingType;
  alpha?: number;
  omega0?: number;
  zeta?: number;
  timeConstant?: number;
}

export interface Complex {
  real: number;
  imag: number;
}

/**
 * Classify damping type from zeta using the shared tolerance constant.
 * Use this everywhere instead of hardcoded thresholds.
 */
export function classifyDamping(zeta: number): DampingType {
  if (zeta > 1 + CRITICAL_DAMPING_TOLERANCE) return 'overdamped';
  if (zeta < 1 - CRITICAL_DAMPING_TOLERANCE) return 'underdamped';
  return 'critically-damped';
}

/**
 * Human-readable damping label for UI display.
 */
export function dampingLabel(type: DampingType): string {
  switch (type) {
    case 'overdamped': return 'Overdamped';
    case 'critically-damped': return 'Critically Damped';
    case 'underdamped': return 'Underdamped';
  }
}
