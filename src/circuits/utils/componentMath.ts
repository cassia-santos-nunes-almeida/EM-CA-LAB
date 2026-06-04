export const resistanceFormula = {
  basic: 'R = \\rho \\frac{L}{A}',
  ohmsLaw: 'V = IR',
  power: 'P = I^2R = \\frac{V^2}{R}',
};

export const capacitanceFormula = {
  basic: 'C = \\epsilon \\frac{A}{d}',
  currentVoltage: 'i(t) = C\\frac{dv}{dt}',
  energy: 'W = \\frac{1}{2}CV^2',
  impedance: 'Z_C = \\frac{1}{j\\omega C}',
};

export const inductanceFormula = {
  basic: 'L = \\frac{N^2 \\mu A}{l}',
  voltageCurrents: 'v(t) = L\\frac{di}{dt}',
  energy: 'W = \\frac{1}{2}LI^2',
  impedance: 'Z_L = j\\omega L',
};

export const circuitAnalysisFormulas = {
  rc: {
    timeConstant: '\\tau = RC',
    voltage: 'v(t) = V_s(1 - e^{-t/\\tau})',
    current: 'i(t) = \\frac{V_s}{R}e^{-t/\\tau}',
  },
  rl: {
    timeConstant: '\\tau = \\frac{L}{R}',
    current: 'i(t) = \\frac{V_s}{R}(1 - e^{-t/\\tau})',
    voltage: 'v(t) = V_s e^{-t/\\tau}',
  },
  rlc: {
    alpha: '\\alpha = \\frac{R}{2L}',
    omega0: '\\omega_0 = \\frac{1}{\\sqrt{LC}}',
    zeta: '\\zeta = \\frac{\\alpha}{\\omega_0}',
    overdamped: 'v(t) = A_1e^{s_1t} + A_2e^{s_2t}',
    criticallyDamped: 'v(t) = (A_1 + A_2t)e^{-\\alpha t}',
    underdamped: 'v(t) = e^{-\\alpha t}(A_1\\cos(\\omega_d t) + A_2\\sin(\\omega_d t))',
  },
};

export const laplaceTransforms = [
  { function: '\\delta(t)', transform: '1', description: 'Unit Impulse' },
  { function: 'u(t)', transform: '\\frac{1}{s}', description: 'Unit Step' },
  { function: 't', transform: '\\frac{1}{s^2}', description: 'Ramp' },
  { function: 't^n', transform: '\\frac{n!}{s^{n+1}}', description: 'Power of t' },
  { function: 'e^{-at}', transform: '\\frac{1}{s+a}', description: 'Exponential' },
  { function: 'te^{-at}', transform: '\\frac{1}{(s+a)^2}', description: 'Exponential with t' },
  { function: '\\sin(\\omega t)', transform: '\\frac{\\omega}{s^2 + \\omega^2}', description: 'Sine' },
  { function: '\\cos(\\omega t)', transform: '\\frac{s}{s^2 + \\omega^2}', description: 'Cosine' },
  { function: 'e^{-at}\\sin(\\omega t)', transform: '\\frac{\\omega}{(s+a)^2 + \\omega^2}', description: 'Damped Sine' },
  { function: 'e^{-at}\\cos(\\omega t)', transform: '\\frac{s+a}{(s+a)^2 + \\omega^2}', description: 'Damped Cosine' },
];

export const laplaceProperties = [
  { property: 'Linearity', formula: 'a\\mathcal{L}\\{f(t)\\} + b\\mathcal{L}\\{g(t)\\} = a F(s) + b G(s)' },
  { property: 'Time Shift', formula: '\\mathcal{L}\\{f(t-a)u(t-a)\\} = e^{-as}F(s)' },
  { property: 'Frequency Shift', formula: '\\mathcal{L}\\{e^{-at}f(t)\\} = F(s+a)' },
  { property: 'Differentiation', formula: '\\mathcal{L}\\{\\frac{df}{dt}\\} = sF(s) - f(0^-)' },
  { property: 'Integration', formula: '\\mathcal{L}\\{\\int_0^t f(\\tau)d\\tau\\} = \\frac{F(s)}{s}' },
  { property: 'Time Scaling', formula: '\\mathcal{L}\\{f(at)\\} = \\frac{1}{a}F(\\frac{s}{a})' },
  { property: 'Initial Value', formula: '\\lim_{t \\to 0^+} f(t) = \\lim_{s \\to \\infty} sF(s)' },
  { property: 'Final Value', formula: '\\lim_{t \\to \\infty} f(t) = \\lim_{s \\to 0} sF(s)', caveat: 'Valid only if all poles of sF(s) have negative real parts (system is stable). Do not apply to unstable or marginally stable systems.' },
];

export interface MaterialProperty {
  name: string;
  resistivity?: number;
  permittivity?: number;
  permeability?: number;
  note?: string;
}

export const materials: MaterialProperty[] = [
  { name: 'Copper', resistivity: 1.68e-8, permeability: 1.256629e-6 },
  { name: 'Aluminum', resistivity: 2.65e-8, permeability: 1.256665e-6 },
  { name: 'Silver', resistivity: 1.59e-8, permeability: 1.256629e-6 },
  { name: 'Gold', resistivity: 2.44e-8, permeability: 1.256629e-6 },
  { name: 'Iron', resistivity: 9.71e-8, permeability: 6.3e-3, note: 'Typical value at moderate flux density. Iron is nonlinear: \u03BCr varies from ~100 (saturation) to ~10,000 (low flux). A full model requires the B-H curve.' },
  { name: 'Air', permittivity: 8.854e-12, permeability: 1.257e-6 },
  { name: 'Paper', permittivity: 3.7e-11 },
  { name: 'Teflon', permittivity: 2.1e-11 },
  { name: 'Glass', permittivity: 4.0e-11 },
];

export function calculateResistance(resistivity: number, length: number, area: number): number {
  return (resistivity * length) / area;
}

export function calculateCapacitance(permittivity: number, area: number, distance: number): number {
  return (permittivity * area) / distance;
}

export function calculateInductance(
  permeability: number,
  turns: number,
  area: number,
  length: number
): number {
  return (permeability * turns * turns * area) / length;
}
