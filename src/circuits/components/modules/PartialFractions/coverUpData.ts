/**
 * Fixed-function data + pure reducer for the Partial Fractions & Heaviside
 * section's "Cover-Up" lab.
 *
 * The whole lab is a finite state machine over ONE flagship function with a
 * fully precomputed solution path — no symbolic algebra:
 *
 *   F(s) = 96(s+5) / [ s (s+8) (s+6) ]  →  A = 10, B = −18, C = 8
 *   f(t) = (10 − 18 e^{−8t} + 8 e^{−6t}) u(t)
 *
 * KaTeX note: every formula in this .ts file is a RUNTIME string, so commands
 * are written with DOUBLE backslashes here (JS escape-processing halves them;
 * the rendered string must carry exactly one backslash per command).
 */

/** Coefficient slots of the target decomposition A/s + B/(s+8) + C/(s+6). */
export type SlotId = 'A' | 'B' | 'C';

/** Denominator factor chips of the flagship function. */
export type FactorId = 's' | 's8' | 's6';

/** Per-slot solving phase. */
export type SlotPhase = 'unsolved' | 'covering' | 'evaluating' | 'revealing' | 'solved';

/** Keys of the three time-domain terms on the assembly plot. */
export type TermKey = 'k1' | 'k2' | 'k3';

export const SLOT_IDS: readonly SlotId[] = ['A', 'B', 'C'] as const;

export const FACTOR_IDS: readonly FactorId[] = ['s', 's8', 's6'] as const;

/** Verified residues of the flagship expansion. */
export const RESIDUES: Record<SlotId, number> = { A: 10, B: -18, C: 8 };

/** One selectable evaluation point offered while harvesting a residue. */
export interface EvalChoice {
  /** Stable id, unique within its slot. */
  id: string;
  /** Button label, e.g. 's = −8'. */
  label: string;
  correct: boolean;
}

/** Denominator chip metadata (KaTeX runtime string + accessible label). */
export interface FactorChip {
  id: FactorId;
  katex: string;
  /** Accessible name of the chip button. */
  label: string;
}

export const FACTORS: Record<FactorId, FactorChip> = {
  s: { id: 's', katex: 's', label: 'Cover the factor s' },
  s8: { id: 's8', katex: '(s+8)', label: 'Cover the factor (s+8)' },
  s6: { id: 's6', katex: '(s+6)', label: 'Cover the factor (s+6)' },
};

/** Precomputed solving path for one coefficient slot. */
export interface SlotConfig {
  id: SlotId;
  /** The factor the thumb must cover. */
  factor: FactorId;
  /** Display text of the pole this slot lives at, e.g. 's = −8'. */
  poleLabel: string;
  residue: number;
  /** Residue as display text (unicode minus). */
  residueDisplay: string;
  /** Coaching per WRONG factor chip. */
  wrongFactorFeedback: Partial<Record<FactorId, string>>;
  evalChoices: EvalChoice[];
  /** Three KaTeX arithmetic lines revealed one Next-click at a time. */
  revealSteps: string[];
}

export const SLOTS: Record<SlotId, SlotConfig> = {
  A: {
    id: 'A',
    factor: 's',
    poleLabel: 's = 0',
    residue: 10,
    residueDisplay: '10',
    wrongFactorFeedback: {
      s8: 'A sits over s — its pole lives at s = 0. (s+8) vanishes at s = −8, which isolates B instead.',
      s6: 'A sits over s — its pole lives at s = 0. (s+6) vanishes at s = −6, which isolates C instead.',
    },
    evalChoices: [
      { id: 'p0', label: 's = 0', correct: true },
      { id: 'm5', label: 's = −5', correct: false },
      { id: 'inf', label: 's = ∞', correct: false },
    ],
    revealSteps: [
      'A = \\left.\\frac{96(s+5)}{(s+8)(s+6)}\\right|_{s=0}',
      'A = \\frac{96 \\cdot 5}{8 \\cdot 6} = \\frac{480}{48}',
      'A = 10',
    ],
  },
  B: {
    id: 'B',
    factor: 's8',
    poleLabel: 's = −8',
    residue: -18,
    residueDisplay: '−18',
    wrongFactorFeedback: {
      s: 'B sits over (s+8) — its pole lives at s = −8. Cover the factor that vanishes there.',
      s6: 'B sits over (s+8) — its pole lives at s = −8. (s+6) vanishes at s = −6, which isolates C instead.',
    },
    evalChoices: [
      { id: 'm8', label: 's = −8', correct: true },
      { id: 'p8', label: 's = 8', correct: false },
      { id: 'p0', label: 's = 0', correct: false },
    ],
    revealSteps: [
      'B = \\left.\\frac{96(s+5)}{s(s+6)}\\right|_{s=-8}',
      'B = \\frac{96 \\cdot (-3)}{(-8)(-2)} = \\frac{-288}{16}',
      'B = -18',
    ],
  },
  C: {
    id: 'C',
    factor: 's6',
    poleLabel: 's = −6',
    residue: 8,
    residueDisplay: '8',
    wrongFactorFeedback: {
      s: 'C sits over (s+6) — its pole lives at s = −6. s vanishes at s = 0, which isolates A instead.',
      s8: 'C sits over (s+6) — its pole lives at s = −6. (s+8) vanishes at s = −8, which isolates B instead.',
    },
    evalChoices: [
      { id: 'm6', label: 's = −6', correct: true },
      { id: 'p6', label: 's = 6', correct: false },
      { id: 'm5', label: 's = −5', correct: false },
    ],
    revealSteps: [
      'C = \\left.\\frac{96(s+5)}{s(s+8)}\\right|_{s=-6}',
      'C = \\frac{96 \\cdot (-1)}{(-6)(2)} = \\frac{-96}{-12}',
      'C = 8',
    ],
  },
};

/** Coaching shown when a wrong evaluation point is picked (any slot). */
export const EVAL_COACHING =
  'Cover-up evaluates at the POLE the covered factor creates — the value of s that makes the covered factor vanish.';

/** Cost stamp of the identification method's worked block. */
export const IDENTIFICATION_COST = '1 expansion · 3 simultaneous equations · 2 substitutions.';

/** Cost stamp of the finished cover-up. */
export const COVERUP_COST = '3 thumb-covers · 0 simultaneous equations';

/* ────────────────────────────────────────────────────────────────────────────
 * Reducer
 * ──────────────────────────────────────────────────────────────────────────── */

export interface CoverUpState {
  slots: Record<SlotId, SlotPhase>;
  activeSlot: SlotId | null;
  /** Index of the highest visible reveal line of the active slot (0-based). */
  revealIndex: number;
  feedback: string | null;
  /** True once all three residues are harvested. */
  assembled: boolean;
  checkedTerms: Record<TermKey, boolean>;
}

export type CoverUpAction =
  | { type: 'pickSlot'; slot: SlotId }
  | { type: 'pickFactor'; factor: FactorId }
  | { type: 'pickEvalPoint'; pointId: string }
  | { type: 'revealNext' }
  | { type: 'toggleTerm'; term: TermKey };

export function createInitialCoverUpState(): CoverUpState {
  return {
    slots: { A: 'unsolved', B: 'unsolved', C: 'unsolved' },
    activeSlot: null,
    revealIndex: 0,
    feedback: null,
    assembled: false,
    checkedTerms: { k1: false, k2: false, k3: false },
  };
}

export function coverUpReducer(state: CoverUpState, action: CoverUpAction): CoverUpState {
  switch (action.type) {
    case 'pickSlot': {
      if (state.slots[action.slot] !== 'unsolved') return state;
      const slots = { ...state.slots };
      // Abandoning a half-finished slot resets it (each slot is one
      // independent precomputed path; no partial credit carries over).
      if (state.activeSlot !== null && slots[state.activeSlot] !== 'solved') {
        slots[state.activeSlot] = 'unsolved';
      }
      slots[action.slot] = 'covering';
      return { ...state, slots, activeSlot: action.slot, revealIndex: 0, feedback: null };
    }

    case 'pickFactor': {
      const slot = state.activeSlot;
      if (slot === null || state.slots[slot] !== 'covering') return state;
      const config = SLOTS[slot];
      if (action.factor === config.factor) {
        return { ...state, slots: { ...state.slots, [slot]: 'evaluating' }, feedback: null };
      }
      return { ...state, feedback: config.wrongFactorFeedback[action.factor] ?? null };
    }

    case 'pickEvalPoint': {
      const slot = state.activeSlot;
      if (slot === null || state.slots[slot] !== 'evaluating') return state;
      const choice = SLOTS[slot].evalChoices.find((c) => c.id === action.pointId);
      if (!choice) return state;
      if (choice.correct) {
        return {
          ...state,
          slots: { ...state.slots, [slot]: 'revealing' },
          revealIndex: 0,
          feedback: null,
        };
      }
      return { ...state, feedback: EVAL_COACHING };
    }

    case 'revealNext': {
      const slot = state.activeSlot;
      if (slot === null || state.slots[slot] !== 'revealing') return state;
      if (state.revealIndex < SLOTS[slot].revealSteps.length - 1) {
        return { ...state, revealIndex: state.revealIndex + 1 };
      }
      const slots: Record<SlotId, SlotPhase> = { ...state.slots, [slot]: 'solved' };
      const assembled = SLOT_IDS.every((id) => slots[id] === 'solved');
      return { ...state, slots, activeSlot: null, revealIndex: 0, feedback: null, assembled };
    }

    case 'toggleTerm':
      return {
        ...state,
        checkedTerms: { ...state.checkedTerms, [action.term]: !state.checkedTerms[action.term] },
      };

    default:
      return state;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Time-domain evaluators + assembly-plot sweep
 * ──────────────────────────────────────────────────────────────────────────── */

/** Per-term evaluators of f(t); their k1+k2+k3 sum IS f96 (exactly). */
export const TERM_EVALUATORS: Record<TermKey, (t: number) => number> = {
  k1: () => 10,
  k2: (t) => -18 * Math.exp(-8 * t),
  k3: (t) => 8 * Math.exp(-6 * t),
};

/** Full flagship response f(t) = 10 − 18e^{−8t} + 8e^{−6t}, t ≥ 0. */
export function f96(t: number): number {
  return TERM_EVALUATORS.k1(t) + TERM_EVALUATORS.k2(t) + TERM_EVALUATORS.k3(t);
}

/** Checkbox label per term (KaTeX runtime string + plain-text equivalent). */
export const TERM_LABELS: Record<TermKey, { katex: string; text: string }> = {
  k1: { katex: '10\\,u(t)', text: '10 u(t)' },
  k2: { katex: '-18e^{-8t}', text: 'minus 18 e to the minus 8 t' },
  k3: { katex: '+8e^{-6t}', text: 'plus 8 e to the minus 6 t' },
};

export const TERM_KEYS: readonly TermKey[] = ['k1', 'k2', 'k3'] as const;

export const RESPONSE_T_MAX = 1.2;
export const RESPONSE_POINT_COUNT = 121;

/** Final value f(∞) (final-value theorem: lim s→0 of sF(s) = 96·5/48 = 10). */
export const FINAL_VALUE = 10;

export interface ResponsePoint {
  t: number;
  /** Full target response f(t) — always plotted (dashed reference). */
  target: number;
  /** Sum of the currently checked terms (solid line). */
  partial: number;
}

/** Sweep t ∈ [0, RESPONSE_T_MAX] on the fixed 121-point grid. */
export function buildResponsePoints(checked: Record<TermKey, boolean>): ResponsePoint[] {
  const points: ResponsePoint[] = [];
  for (let i = 0; i < RESPONSE_POINT_COUNT; i++) {
    const t = (i * RESPONSE_T_MAX) / (RESPONSE_POINT_COUNT - 1);
    let partial = 0;
    for (const key of TERM_KEYS) {
      if (checked[key]) partial += TERM_EVALUATORS[key](t);
    }
    points.push({ t, target: f96(t), partial });
  }
  return points;
}
