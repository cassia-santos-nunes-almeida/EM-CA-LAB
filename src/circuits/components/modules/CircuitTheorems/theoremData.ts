/**
 * Fixed-circuit data + pure logic for the Circuit Theorems section.
 *
 * ONE fixed source network powers the whole section: a 24 V source in series
 * with R1 = 6 Ω into node A, a 2 A current source injecting into A, and
 * R2 = 3 Ω from A to ground; the port is A–ground. Every number below is
 * precomputed from that network — no symbolic algebra at runtime.
 *
 * KaTeX note: every formula in this .ts file is a RUNTIME string, so commands
 * are written with DOUBLE backslashes here (JS escape-processing halves them;
 * the rendered string must carry exactly one backslash per command).
 */

/** The fixed source network (values in volts, ohms, amps). */
export const SOURCE_NETWORK = { vs: 24, r1: 6, is: 2, r2: 3 } as const;

/** Verified port characterization (hardcoded, blueprint-verified). */
export const V_TH = 12;
export const R_TH = 2;
export const I_SC = 6;
/** P_max = V_th^2 / (4 R_th) = 144/8 W, drawn at R_L = R_th. */
export const P_MAX = 18;

/* ────────────────────────────────────────────────────────────────────────────
 * Source Knock-Out Bench (superposition)
 * ──────────────────────────────────────────────────────────────────────────── */

/** Stable key for one of the four on/off source combinations. */
export type KnockoutKey = 'both-on' | 'v-only' | 'i-only' | 'both-off';

export interface KnockoutReading {
  key: KnockoutKey;
  /** Node-A voltage for this source combination. */
  vA: 12 | 8 | 4 | 0;
  /** Short ledger label for this combination. */
  label: string;
  /** One-line KaTeX derivation of the reading. */
  derivation: string;
}

/**
 * Pure truth table of the knock-out bench: node-A voltage for each
 * combination of the 24 V source (vOn) and the 2 A source (iOn).
 */
export function knockoutState(vOn: boolean, iOn: boolean): KnockoutReading {
  if (vOn && iOn) {
    return {
      key: 'both-on',
      vA: 12,
      label: 'Both sources ON',
      derivation: 'V_A = 8 + 4 = 12\\ \\text{V} \\;\\; (\\text{superposition of the two rows below})',
    };
  }
  if (vOn) {
    return {
      key: 'v-only',
      vA: 8,
      label: '24 V source alone (2 A source opened)',
      derivation: 'V_A = 24 \\cdot \\frac{3}{6+3} = 8\\ \\text{V}',
    };
  }
  if (iOn) {
    return {
      key: 'i-only',
      vA: 4,
      label: '2 A source alone (24 V source shorted)',
      derivation: 'V_A = 2 \\cdot (6 \\parallel 3) = 2 \\cdot 2 = 4\\ \\text{V}',
    };
  }
  return {
    key: 'both-off',
    vA: 0,
    label: 'Both sources OFF',
    derivation: 'V_A = 0\\ \\text{V} \\;\\; (\\text{no source, no response})',
  };
}

/** Ledger display order for the four knock-out combinations. */
export const KNOCKOUT_LEDGER_ORDER: KnockoutKey[] = ['both-on', 'v-only', 'i-only', 'both-off'];

/** KaTeX chip shown when both single-source states have been visited. */
export const LINEARITY_CHIP = '8 + 4 = 12 = V_A^{\\text{both}}';

/* ────────────────────────────────────────────────────────────────────────────
 * Black-Box Port Instrument (Thevenin by measurement)
 * ──────────────────────────────────────────────────────────────────────────── */

/** Catalog load resistances that attach to the port. */
export type LoadR = 1 | 2 | 4 | 10;

export interface LoadRow {
  r: LoadR;
  /** Load current i_L = V_th / (R_th + R_L), in amps. */
  iL: number;
  /** Load voltage v_L = i_L · R_L, in volts. */
  vL: number;
  /** Load power P = i_L² · R_L, in watts. */
  p: number;
}

/** The verified four-load answer table (the whole point of the section). */
export const LOAD_TABLE: LoadRow[] = [
  { r: 1, iL: 4, vL: 4, p: 16 },
  { r: 2, iL: 3, vL: 6, p: 18 },
  { r: 4, iL: 2, vL: 8, p: 16 },
  { r: 10, iL: 1, vL: 10, p: 10 },
];

/** One selectable R_th computation offered after both measurements. */
export interface RthChoice {
  id: string;
  /** Plain-text label rendered on the choice button. */
  label: string;
  correct: boolean;
  /** Coaching shown when this (wrong) choice is picked. */
  feedback?: string;
}

export const RTH_CHOICES: RthChoice[] = [
  { id: 'two', label: '12/6 = 2 Ω', correct: true },
  { id: 'seventytwo', label: '12 × 6 = 72 Ω', correct: false, feedback: 'Ohms are volts PER amp — divide.' },
  { id: 'half', label: '6/12 = 0.5 Ω', correct: false, feedback: 'Upside down: R = V/I.' },
];

export type BlackBoxPhase = 'idle' | 'voc' | 'isc' | 'twin' | 'congruence' | 'done';

export interface BlackBoxState {
  phase: BlackBoxPhase;
  /** Coaching from a wrong R_th pick; null when clear. */
  feedback: string | null;
  /** Loads attached so far (insertion order, no duplicates). */
  visitedLoads: LoadR[];
  /** The load currently on the port (congruence/done phases). */
  activeLoad: LoadR | null;
}

export type BlackBoxAction =
  | { type: 'measureVoc' }
  | { type: 'measureIsc' }
  | { type: 'pickRth'; choiceId: string }
  | { type: 'continue' }
  | { type: 'attachLoad'; r: LoadR };

export const initialBlackBoxState: BlackBoxState = {
  phase: 'idle',
  feedback: null,
  visitedLoads: [],
  activeLoad: null,
};

const ALL_LOADS: LoadR[] = [1, 2, 4, 10];

export function blackBoxReducer(state: BlackBoxState, action: BlackBoxAction): BlackBoxState {
  switch (state.phase) {
    case 'idle':
      if (action.type === 'measureVoc') return { ...state, phase: 'voc' };
      return state;

    case 'voc':
      if (action.type === 'measureIsc') return { ...state, phase: 'isc' };
      return state;

    case 'isc': {
      if (action.type !== 'pickRth') return state;
      const choice = RTH_CHOICES.find((c) => c.id === action.choiceId);
      if (!choice) return { ...state, feedback: 'Pick one of the offered computations.' };
      if (!choice.correct) return { ...state, feedback: choice.feedback ?? 'Not quite — try again.' };
      return { ...state, phase: 'twin', feedback: null };
    }

    case 'twin':
      if (action.type === 'continue') return { ...state, phase: 'congruence' };
      return state;

    case 'congruence':
    case 'done': {
      if (action.type !== 'attachLoad') return state;
      const visitedLoads = state.visitedLoads.includes(action.r)
        ? state.visitedLoads
        : [...state.visitedLoads, action.r];
      const phase = ALL_LOADS.every((r) => visitedLoads.includes(r)) ? 'done' : state.phase;
      return { ...state, visitedLoads, activeLoad: action.r, phase };
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Max-Power Bench
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PowerPoint {
  /** Load resistance in ohms. */
  r: number;
  /** Load power P = (V_th / (R_th + r))² · r, in watts. */
  p: number;
}

function buildMaxPowerPoints(): PowerPoint[] {
  const points: PowerPoint[] = [];
  // 0.25 steps are exact in binary floating point, so r === 2 is a grid point.
  for (let r = 0.25; r <= 10; r += 0.25) {
    points.push({ r, p: (V_TH / (R_TH + r)) ** 2 * r });
  }
  return points;
}

/** Precomputed P_L(R_L) sweep for the max-power chart, R_L = 0.25 … 10 Ω. */
export const MAX_POWER_POINTS: PowerPoint[] = buildMaxPowerPoints();
