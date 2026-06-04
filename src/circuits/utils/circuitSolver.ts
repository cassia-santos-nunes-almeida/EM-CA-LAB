import {
  type CircuitParams,
  type TimeSeriesPoint,
  type CircuitType,
  type DampingType,
  type CircuitResponse,
  type InputType,
  type Complex,
  classifyDamping,
} from '@circuits/types/circuit';

export type { CircuitParams, TimeSeriesPoint, CircuitType, DampingType, CircuitResponse, InputType, Complex };

/** Shared RLC characteristic parameters computed from R, L, C */
interface RLCParams {
  alpha: number;
  omega0: number;
  zeta: number;
  dampingType: DampingType;
}

function computeRLCParams(R: number, L: number, C: number): RLCParams {
  const alpha = R / (2 * L);
  const omega0 = 1 / Math.sqrt(L * C);
  const zeta = alpha / omega0;
  return { alpha, omega0, zeta, dampingType: classifyDamping(zeta) };
}

/** Generate evenly-spaced time samples using integer counter to avoid float drift (F9). */
function timeSamples(timeStep: number, duration: number): number[] {
  const n = Math.floor(duration / timeStep) + 1;
  const times: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    times[i] = i * timeStep;
  }
  return times;
}

export function calculateCircuitResponse(
  type: CircuitType,
  params: CircuitParams,
  timeStep: number = 0.0001,
  duration: number = 0.01,
  inputType: InputType = 'step'
): CircuitResponse {
  const { R, L, C, voltage } = params;

  switch (type) {
    case 'RC':
      return inputType === 'impulse'
        ? calculateRCImpulseResponse(R, C, voltage, timeStep, duration)
        : calculateRCResponse(R, C, voltage, timeStep, duration);
    case 'RL':
      return inputType === 'impulse'
        ? calculateRLImpulseResponse(R, L, voltage, timeStep, duration)
        : calculateRLResponse(R, L, voltage, timeStep, duration);
    case 'RLC':
      return calculateRLCUnified(R, L, C, voltage, timeStep, duration, inputType);
  }
}

function calculateRCResponse(
  R: number, C: number, Vs: number, timeStep: number, duration: number
): CircuitResponse {
  const tau = R * C;
  const times = timeSamples(timeStep, duration);
  const data: TimeSeriesPoint[] = times.map(t => {
    const expTerm = Math.exp(-t / tau);
    return { time: t, voltage: Vs * (1 - expTerm), current: (Vs / R) * expTerm };
  });
  return { data, timeConstant: tau };
}

function calculateRLResponse(
  R: number, L: number, Vs: number, timeStep: number, duration: number
): CircuitResponse {
  const tau = L / R;
  const times = timeSamples(timeStep, duration);
  const data: TimeSeriesPoint[] = times.map(t => {
    const expTerm = Math.exp(-t / tau);
    return { time: t, voltage: Vs * expTerm, current: (Vs / R) * (1 - expTerm) };
  });
  return { data, timeConstant: tau };
}

function calculateRCImpulseResponse(
  R: number, C: number, Vs: number, timeStep: number, duration: number
): CircuitResponse {
  const tau = R * C;
  const vScale = Vs / (R * C);
  const iScale = -(Vs / (R * R * C));
  const times = timeSamples(timeStep, duration);
  const data: TimeSeriesPoint[] = times.map(t => {
    const expTerm = Math.exp(-t / tau);
    return { time: t, voltage: vScale * expTerm, current: iScale * expTerm };
  });
  return { data, timeConstant: tau };
}

function calculateRLImpulseResponse(
  R: number, L: number, Vs: number, timeStep: number, duration: number
): CircuitResponse {
  const tau = L / R;
  const iScale = Vs / L;
  const vScale = -(Vs * R / L);
  const times = timeSamples(timeStep, duration);
  const data: TimeSeriesPoint[] = times.map(t => {
    const expTerm = Math.exp(-t / tau);
    return { time: t, voltage: vScale * expTerm, current: iScale * expTerm };
  });
  return { data, timeConstant: tau };
}

/**
 * Unified RLC response for both step and impulse inputs.
 * Eliminates duplication between the former calculateRLCResponse and calculateRLCImpulseResponse (F7/F8).
 */
function calculateRLCUnified(
  R: number, L: number, C: number, Vs: number,
  timeStep: number, duration: number, inputType: InputType
): CircuitResponse {
  const { alpha, omega0, zeta, dampingType } = computeRLCParams(R, L, C);
  const times = timeSamples(timeStep, duration);
  const data: TimeSeriesPoint[] = new Array(times.length);

  if (dampingType === 'overdamped') {
    const sqrtTerm = Math.sqrt(alpha * alpha - omega0 * omega0);
    const s1 = -alpha + sqrtTerm;
    const s2 = -alpha - sqrtTerm;

    if (inputType === 'step') {
      // Overdamped step (charge) response of v_C: forced term Vs plus the two
      // natural modes, fixed by v(0)=0 and dv/dt(0)=i(0)/C=0. The earlier form
      // omitted the forced Vs term, so it produced an inverted discharge curve
      // (v(0)=Vs, v(inf)=0). Now v(0)=0, v(inf)=Vs, i(0)=0. Note s1*s2 = omega0^2.
      const invDiff = 1 / (s1 - s2);
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const exp1 = Math.exp(s1 * t);
        const exp2 = Math.exp(s2 * t);
        data[i] = {
          time: t,
          voltage: Vs * (1 + (s2 * exp1 - s1 * exp2) * invDiff),
          current: C * Vs * s1 * s2 * (exp1 - exp2) * invDiff,
        };
      }
    } else {
      const scale = Vs * omega0 * omega0;
      const invDiff = 1 / (s1 - s2);
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const exp1 = Math.exp(s1 * t);
        const exp2 = Math.exp(s2 * t);
        data[i] = {
          time: t,
          voltage: scale * (exp1 - exp2) * invDiff,
          current: C * scale * (s1 * exp1 - s2 * exp2) * invDiff,
        };
      }
    }
  } else if (dampingType === 'critically-damped') {
    if (inputType === 'step') {
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const expTerm = Math.exp(-alpha * t);
        data[i] = {
          time: t,
          voltage: Vs * (1 - expTerm * (1 + alpha * t)),
          current: (Vs / L) * t * expTerm,
        };
      }
    } else {
      const scale = Vs * omega0 * omega0;
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const expTerm = Math.exp(-alpha * t);
        data[i] = {
          time: t,
          voltage: scale * t * expTerm,
          current: C * scale * (1 - alpha * t) * expTerm,
        };
      }
    }
  } else {
    // underdamped
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);

    if (inputType === 'step') {
      const alphaOverOmegaD = alpha / omegaD;
      const w0sqC = Vs * omega0 * omega0 * C;
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const expTerm = Math.exp(-alpha * t);
        const sinD = Math.sin(omegaD * t);
        const cosD = Math.cos(omegaD * t);
        data[i] = {
          time: t,
          voltage: Vs * (1 - expTerm * (cosD + alphaOverOmegaD * sinD)),
          current: w0sqC * expTerm * sinD / omegaD,
        };
      }
    } else {
      const scale = Vs * omega0 * omega0 / omegaD;
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const expTerm = Math.exp(-alpha * t);
        const sinD = Math.sin(omegaD * t);
        const cosD = Math.cos(omegaD * t);
        data[i] = {
          time: t,
          voltage: scale * expTerm * sinD,
          current: C * scale * expTerm * (omegaD * cosD - alpha * sinD),
        };
      }
    }
  }

  return { data, dampingType, alpha, omega0, zeta };
}

export function calculateTransferFunction(R: number, L: number, C: number): {
  numerator: number[];
  denominator: number[];
  poles: Complex[];
  zeros: Complex[];
} {
  const omega0Squared = 1 / (L * C);
  const alpha = R / (2 * L);

  const denominator = [1, 2 * alpha, omega0Squared];
  const numerator = [omega0Squared];

  const discriminant = 4 * alpha * alpha - 4 * omega0Squared;

  let poles: Complex[];
  if (discriminant > 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    poles = [
      { real: (-2 * alpha + sqrtDisc) / 2, imag: 0 },
      { real: (-2 * alpha - sqrtDisc) / 2, imag: 0 }
    ];
  } else if (discriminant === 0) {
    poles = [
      { real: -alpha, imag: 0 },
      { real: -alpha, imag: 0 }
    ];
  } else {
    const imagPart = Math.sqrt(-discriminant) / 2;
    poles = [
      { real: -alpha, imag: imagPart },
      { real: -alpha, imag: -imagPart }
    ];
  }

  return { numerator, denominator, poles, zeros: [] };
}
