/** Parameters for a coupled-coil / transformer simulation. */
export interface TransformerParams {
  /** Coupling coefficient (0 to 1) */
  k: number;
  /** Primary turns */
  N1: number;
  /** Secondary turns */
  N2: number;
  /** Primary inductance (H) */
  L1: number;
  /** Secondary inductance (H) */
  L2: number;
  /** Load impedance magnitude (ohms) */
  ZL: number;
  /** Source voltage (V) */
  Vs: number;
}

/** Parameters for a transmission line simulation. */
export interface TransmissionLineParams {
  /** Characteristic impedance (ohms) */
  Z0: number;
  /** Load impedance (ohms); Infinity for open, 0 for short */
  ZL: number;
  /** Source impedance (ohms) */
  Zs: number;
  /** Line length (m) */
  length: number;
  /** Signal frequency (Hz) */
  frequency: number;
  /** Signal type */
  signalType: 'sinusoidal' | 'step';
}

/** Parameters for a bounce diagram simulation. */
export interface BounceParams {
  /** Reflection coefficient at load (-1 to +1) */
  gammaLoad: number;
  /** Reflection coefficient at source (-1 to +1) */
  gammaSource: number;
  /** Number of bounces to show (1 to 8) */
  numBounces: number;
}

/** Parameters for the antenna radiation pattern simulation. */
export interface AntennaParams {
  /** Dipole length as a fraction of wavelength */
  dipoleLengthFraction: number;
}

/** A single bounce event in a bounce diagram. */
export interface BounceEvent {
  /** Bounce index (0 = initial) */
  index: number;
  /** Voltage amplitude of this bounce */
  voltage: number;
  /** Direction: 'forward' (source→load) or 'backward' (load→source) */
  direction: 'forward' | 'backward';
  /** Cumulative voltage at source end after this event */
  vSource: number;
  /** Cumulative voltage at load end after this event */
  vLoad: number;
}
