// Generic complex arithmetic for the math-phasors section (5.1). Shape matches
// the { real, imag } pair transmissionMath's reflection-coefficient helpers
// already use. j is the imaginary unit throughout (course hard rule: never i).
// Note: this { real, imag } duplication is deliberate — src/circuits/types/circuit.ts:35 declares
// an identical data-only Complex type, but cross-domain imports are forbidden.

export interface Complex {
  real: number;
  imag: number;
}

export function cadd(a: Complex, b: Complex): Complex {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}

export function cmul(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function cdiv(a: Complex, b: Complex): Complex {
  const d = b.real * b.real + b.imag * b.imag;
  return {
    real: (a.real * b.real + a.imag * b.imag) / d,
    imag: (a.imag * b.real - a.real * b.imag) / d,
  };
}

export function fromPolarDeg(mag: number, angleDeg: number): Complex {
  const rad = (angleDeg * Math.PI) / 180;
  return { real: mag * Math.cos(rad), imag: mag * Math.sin(rad) };
}

export function toPolarDeg(z: Complex): { mag: number; angleDeg: number } {
  let angleDeg = (Math.atan2(z.imag, z.real) * 180) / Math.PI;
  // atan2(−0, −1) returns −π; fold onto (−180, 180] so ±180 is unambiguous.
  if (angleDeg <= -180) angleDeg += 360;
  return { mag: Math.hypot(z.real, z.imag), angleDeg };
}

/** Euler: e^{jθ} = cosθ + j sinθ. */
export function expJ(thetaRad: number): Complex {
  return { real: Math.cos(thetaRad), imag: Math.sin(thetaRad) };
}
