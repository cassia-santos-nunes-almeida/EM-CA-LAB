/**
 * Fixed-circuit data + pure reducers for the Nodal & Mesh Analysis section.
 *
 * Both interactives are finite state machines over ONE fixed example circuit
 * each, with a fully precomputed solution path — no symbolic algebra.
 *
 * KaTeX note: every formula in this .ts file is a RUNTIME string, so commands
 * are written with DOUBLE backslashes here (JS escape-processing halves them;
 * the rendered string must carry exactly one backslash per command).
 */

/** Branches of the fixed Wheatstone-style bridge circuit. */
export type BridgeBranch = 'r1' | 'r2' | 'r3' | 'r4' | 'r5';

/** Clickable nodes when picking the reference for nodal analysis. */
export type BridgeNode = 'plus' | 'A' | 'B' | 'bottom';

/** Elements of the fixed two-window mesh circuit, in mesh-1 walk order first. */
export type MeshElement = 'vs1' | 'r1' | 'r3' | 'r2' | 'vs2';

/** One selectable term offered while building a KCL/KVL equation. */
export interface TermChoice {
  /** Stable id, unique within its step. */
  id: string;
  /** KaTeX runtime string rendered on the choice button. */
  katex: string;
  /** Plain-text equivalent, used as the button's aria-label. */
  label: string;
  correct: boolean;
  /** Coaching shown when this (wrong) choice is picked. */
  feedback?: string;
}

/** One term slot of a growing equation, with its diagram highlight. */
export interface TermStep<H extends string = string> {
  /** Diagram element highlighted while this term is being picked. */
  highlight: H;
  /** One-line prompt naming the branch/element being summed. */
  prompt: string;
  /** KaTeX (no leading sign-joiner) appended to the committed equation line. */
  committedKatex: string;
  choices: TermChoice[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Bridge circuit (Node-Equation Builder): 12 V source, R1=2, R2=4, R3=4,
 * R4=2, R5=4 (all ohms). Verified solution hardcoded everywhere.
 * ──────────────────────────────────────────────────────────────────────────── */

export const BRIDGE_SOLUTION = {
  vA: 7.2,
  vB: 4.8,
  i5: 0.6,
} as const;

export const REFERENCE_CONFIRMATION =
  "Good: it touches 3 branches and the source's − terminal — every other node voltage becomes a direct unknown.";

export const REFERENCE_COACHING =
  "Legal, but you'd carry the source voltage through more unknowns. The busiest node makes the cleanest reference — try again.";

export const LABEL_NOTE =
  'A voltage source from the reference pins its node — the + node IS 12 V, no equation needed. (The general case is the supernode, below.)';

const LEAVING_CONVENTION_FEEDBACK =
  'That is the current flowing INTO node A. Our convention sums currents LEAVING the node — flip the sign and stay consistent.';

export const NODE_KCL_A_TERMS: TermStep<BridgeBranch>[] = [
  {
    highlight: 'r1',
    prompt: 'Term 1 of 3 — current leaving node A through R1 (toward the source + terminal):',
    committedKatex: '\\frac{V_A - 12}{2}',
    choices: [
      { id: 'leave', katex: '\\frac{V_A - 12}{2}', label: '(V_A - 12) / 2', correct: true },
      { id: 'into', katex: '\\frac{12 - V_A}{2}', label: '(12 - V_A) / 2', correct: false, feedback: LEAVING_CONVENTION_FEEDBACK },
      { id: 'mult', katex: '2(V_A - 12)', label: '2 (V_A - 12)', correct: false, feedback: "Ohm's law gives I = V/R — divide by R, don't multiply." },
    ],
  },
  {
    highlight: 'r3',
    prompt: 'Term 2 of 3 — current leaving node A through R3 (down to the reference):',
    committedKatex: '\\frac{V_A}{4}',
    choices: [
      { id: 'v-over-r', katex: '\\frac{V_A}{4}', label: 'V_A / 4', correct: true },
      { id: 'r-over-v', katex: '\\frac{4}{V_A}', label: '4 / V_A', correct: false, feedback: 'I = V/R, not R/V.' },
      { id: 'to-source', katex: '\\frac{V_A - 12}{4}', label: '(V_A - 12) / 4', correct: false, feedback: 'R3 connects node A to GROUND (0 V), not to the source.' },
    ],
  },
  {
    highlight: 'r5',
    prompt: 'Term 3 of 3 — current leaving node A across the bridge R5 (toward node B):',
    committedKatex: '\\frac{V_A - V_B}{4}',
    choices: [
      { id: 'diff-ab', katex: '\\frac{V_A - V_B}{4}', label: '(V_A - V_B) / 4', correct: true },
      { id: 'diff-ba', katex: '\\frac{V_B - V_A}{4}', label: '(V_B - V_A) / 4', correct: false, feedback: LEAVING_CONVENTION_FEEDBACK },
      { id: 'sum', katex: '\\frac{V_A + V_B}{4}', label: '(V_A + V_B) / 4', correct: false, feedback: 'The current depends on the voltage DIFFERENCE across R5.' },
    ],
  },
];

/** Pre-filled first term of KCL at node B (B → source via R2). */
export const NODE_KCL_B_PREFILL = '\\frac{V_B - 12}{4}';

export const NODE_KCL_B_TERMS: TermStep<BridgeBranch>[] = [
  {
    highlight: 'r4',
    prompt: 'Pick the current leaving node B through R4 (down to the reference):',
    committedKatex: '\\frac{V_B}{2}',
    choices: [
      { id: 'v-over-r', katex: '\\frac{V_B}{2}', label: 'V_B / 2', correct: true },
      { id: 'mult', katex: '2V_B', label: '2 V_B', correct: false, feedback: 'Divide by R.' },
      { id: 'wrong-r', katex: '\\frac{V_B}{4}', label: 'V_B / 4', correct: false, feedback: 'R4 is 2 Ω — R3 is the 4 Ω one.' },
    ],
  },
  {
    highlight: 'r5',
    prompt: 'Pick the current leaving node B across the bridge R5 (toward node A):',
    committedKatex: '\\frac{V_B - V_A}{4}',
    choices: [
      { id: 'diff-ba', katex: '\\frac{V_B - V_A}{4}', label: '(V_B - V_A) / 4', correct: true },
      { id: 'diff-ab', katex: '\\frac{V_A - V_B}{4}', label: '(V_A - V_B) / 4', correct: false, feedback: "From node B's seat, current leaves toward A — the convention flips with the node you sit at." },
      { id: 'wrong-r', katex: '\\frac{V_B - V_A}{2}', label: '(V_B - V_A) / 2', correct: false, feedback: 'The bridge resistor is 4 Ω.' },
    ],
  },
];

export const NODE_TIDY_A =
  '\\frac{V_A - 12}{2} + \\frac{V_A}{4} + \\frac{V_A - V_B}{4} = 0 \\;\\Rightarrow\\; 4V_A - V_B = 24';

export const NODE_TIDY_B =
  '\\frac{V_B - 12}{4} + \\frac{V_B}{2} + \\frac{V_B - V_A}{4} = 0 \\;\\Rightarrow\\; 4V_B - V_A = 12';

export const NODE_SOLVE_LINES = [
  'V_B = 4V_A - 24',
  '4(4V_A - 24) - V_A = 12 \\;\\Rightarrow\\; 15V_A = 108',
  'V_A = 7.2\\ \\text{V}, \\quad V_B = 4.8\\ \\text{V}',
  'I_5 = \\frac{V_A - V_B}{4} = \\frac{2.4}{4} = 0.6\\ \\text{A} \\;\\; (\\text{A} \\to \\text{B})',
];

export type NodeBuilderPhase =
  | 'pick-reference'
  | 'label'
  | 'kcl-A'
  | 'tidy-A'
  | 'kcl-B'
  | 'tidy-B'
  | 'solve'
  | 'done';

export interface NodeBuilderState {
  phase: NodeBuilderPhase;
  /** Index of the term being picked within the current KCL phase. */
  termIndex: number;
  /** Index of the last revealed solve line (0-based). */
  revealIndex: number;
  /** Coaching (wrong pick / wrong node) or confirmation text; null when clear. */
  feedback: string | null;
}

export type NodeBuilderAction =
  | { type: 'pickNode'; node: BridgeNode }
  | { type: 'pickTerm'; choiceId: string }
  | { type: 'continue' }
  | { type: 'revealNext' };

export const initialNodeBuilderState: NodeBuilderState = {
  phase: 'pick-reference',
  termIndex: 0,
  revealIndex: 0,
  feedback: null,
};

/**
 * Join the committed KaTeX terms of a growing KCL/KVL line and pad the
 * not-yet-picked slots with placeholder squares, ending in "= 0".
 * (Runtime string — KaTeX commands are doubled in this .ts source.)
 */
export function buildEquationLine(committed: string[], totalSlots: number): string {
  const parts = [...committed];
  while (parts.length < totalSlots) parts.push('\\square');
  return `${parts.join(' + ')} = 0`;
}

type TermPickResult =
  | { kind: 'wrong'; feedback: string }
  | { kind: 'advance' }
  | { kind: 'complete' };

function resolveTermPick(steps: TermStep<string>[], termIndex: number, choiceId: string): TermPickResult {
  const step = steps[termIndex];
  const choice = step?.choices.find((c) => c.id === choiceId);
  if (!choice) return { kind: 'wrong', feedback: 'Pick one of the offered terms.' };
  if (!choice.correct) return { kind: 'wrong', feedback: choice.feedback ?? 'Not quite — try another term.' };
  return termIndex >= steps.length - 1 ? { kind: 'complete' } : { kind: 'advance' };
}

export function nodeBuilderReducer(state: NodeBuilderState, action: NodeBuilderAction): NodeBuilderState {
  switch (state.phase) {
    case 'pick-reference':
      if (action.type === 'pickNode') {
        if (action.node === 'bottom') {
          return { ...state, phase: 'label', feedback: REFERENCE_CONFIRMATION };
        }
        return { ...state, feedback: REFERENCE_COACHING };
      }
      return state;

    case 'label':
      if (action.type === 'continue') return { ...state, phase: 'kcl-A', termIndex: 0, feedback: null };
      return state;

    case 'kcl-A': {
      if (action.type !== 'pickTerm') return state;
      const result = resolveTermPick(NODE_KCL_A_TERMS, state.termIndex, action.choiceId);
      if (result.kind === 'wrong') return { ...state, feedback: result.feedback };
      if (result.kind === 'advance') return { ...state, termIndex: state.termIndex + 1, feedback: null };
      return { ...state, phase: 'tidy-A', feedback: null };
    }

    case 'tidy-A':
      if (action.type === 'continue') return { ...state, phase: 'kcl-B', termIndex: 0, feedback: null };
      return state;

    case 'kcl-B': {
      if (action.type !== 'pickTerm') return state;
      const result = resolveTermPick(NODE_KCL_B_TERMS, state.termIndex, action.choiceId);
      if (result.kind === 'wrong') return { ...state, feedback: result.feedback };
      if (result.kind === 'advance') return { ...state, termIndex: state.termIndex + 1, feedback: null };
      return { ...state, phase: 'tidy-B', feedback: null };
    }

    case 'tidy-B':
      if (action.type === 'continue') return { ...state, phase: 'solve', revealIndex: 0, feedback: null };
      return state;

    case 'solve': {
      if (action.type !== 'revealNext') return state;
      const next = Math.min(state.revealIndex + 1, NODE_SOLVE_LINES.length - 1);
      return { ...state, revealIndex: next, phase: next >= NODE_SOLVE_LINES.length - 1 ? 'done' : 'solve' };
    }

    case 'done':
      return state;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Two-window mesh circuit (Mesh-Current Assigner): 20 V left branch, R1=2 Ω
 * top-left, shared R3=4 Ω center, R2=8 Ω top-right, 4 V right branch (+ up,
 * opposing clockwise i2). Verified solution hardcoded.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MeshSolution {
  i1: number;
  i2: number;
  /** Downward current through the shared branch R3: i1 − i2. */
  shared: number;
  /** Voltage across the shared R3. */
  vR3: number;
}

export const MESH_SOLUTION: MeshSolution = { i1: 4, i2: 1, shared: 3, vR3: 12 };

export const CONVENTION_INFO =
  'Any consistent choice works — the textbook (and house) convention is all-clockwise.';

export const MESH_KVL_1_TERMS: TermStep<MeshElement>[] = [
  {
    highlight: 'vs1',
    prompt: 'Walk mesh 1 clockwise. First element: the 20 V source, entered at its − terminal:',
    committedKatex: '-20',
    choices: [
      { id: 'rise', katex: '-20', label: '-20', correct: true },
      { id: 'drop', katex: '+20', label: '+20', correct: false, feedback: 'Walking − to + through a source is a voltage RISE: subtract it.' },
      { id: 'ohms', katex: '20i_1', label: '20 i_1', correct: false, feedback: 'A source contributes volts, not ohms·amps.' },
    ],
  },
  {
    highlight: 'r1',
    prompt: 'Next element: R1 (2 Ω), which carries only i₁:',
    committedKatex: '2i_1',
    choices: [
      { id: 'own', katex: '+2i_1', label: '+2 i_1', correct: true },
      { id: 'shared', katex: '2(i_1 - i_2)', label: '2 (i_1 - i_2)', correct: false, feedback: 'R1 lives only in mesh 1 — no sharing.' },
      { id: 'divide', katex: '\\frac{i_1}{2}', label: 'i_1 / 2', correct: false, feedback: 'KVL sums voltages: V = iR.' },
    ],
  },
  {
    highlight: 'r3',
    prompt: 'Last element: the shared R3 (4 Ω) on the wall between the two windows:',
    committedKatex: '4(i_1 - i_2)',
    choices: [
      { id: 'diff', katex: '+4(i_1 - i_2)', label: '+4 (i_1 - i_2)', correct: true },
      { id: 'solo', katex: '4i_1', label: '4 i_1', correct: false, feedback: 'R3 also carries i₂ — in the opposite direction.' },
      { id: 'sum', katex: '4(i_1 + i_2)', label: '4 (i_1 + i_2)', correct: false, feedback: 'The two circulations oppose in the shared branch: difference, not sum.' },
    ],
  },
];

/** Pre-filled mesh-2 terms (R2 drop and the 4 V source, + terminal up). */
export const MESH_KVL_2_PREFILL = ['8i_2', '4'];

export const MESH_KVL_2_TERMS: TermStep<MeshElement>[] = [
  {
    highlight: 'r3',
    prompt: 'Mesh 2, walked clockwise — R2 and the 4 V source are pre-filled. Pick the shared-branch term:',
    committedKatex: '4(i_2 - i_1)',
    choices: [
      { id: 'diff-21', katex: '4(i_2 - i_1)', label: '4 (i_2 - i_1)', correct: true },
      { id: 'diff-12', katex: '4(i_1 - i_2)', label: '4 (i_1 - i_2)', correct: false, feedback: "You are walking mesh 2 now — sit on i₂'s shoulder: it is i₂ minus i₁ from here." },
      { id: 'solo', katex: '4i_2', label: '4 i_2', correct: false, feedback: 'R3 still carries both mesh currents.' },
    ],
  },
];

export const MESH_TIDY_1 =
  '-20 + 2i_1 + 4(i_1 - i_2) = 0 \\;\\Rightarrow\\; 3i_1 - 2i_2 = 10';

export const MESH_TIDY_2 =
  '4(i_2 - i_1) + 8i_2 + 4 = 0 \\;\\Rightarrow\\; -i_1 + 3i_2 = -1';

export const MESH_SOLVE_LINES = [
  'i_1 = 3i_2 + 1',
  '3(3i_2 + 1) - 2i_2 = 10 \\;\\Rightarrow\\; 7i_2 = 7',
  'i_2 = 1\\ \\text{A}, \\quad i_1 = 4\\ \\text{A}',
];

/** Left-branch closure check shown in the done state. */
export const MESH_CHECK_CHIP = '\\frac{20 - 12}{2} = 4\\ \\text{A} = i_1';

export type MeshAssignerPhase =
  | 'assign'
  | 'kvl-1'
  | 'tidy-1'
  | 'kvl-2'
  | 'tidy-2'
  | 'solve'
  | 'done';

export interface MeshAssignerState {
  phase: MeshAssignerPhase;
  mesh1CW: boolean;
  mesh2CW: boolean;
  /** True after a failed convention check — show the info panel + normalize button. */
  conventionInfo: boolean;
  termIndex: number;
  revealIndex: number;
  feedback: string | null;
  /** Populated when the machine reaches 'done'. */
  solution: MeshSolution | null;
}

export type MeshAssignerAction =
  | { type: 'toggleMesh'; mesh: 1 | 2 }
  | { type: 'checkConvention' }
  | { type: 'normalize' }
  | { type: 'pickTerm'; choiceId: string }
  | { type: 'continue' }
  | { type: 'revealNext' };

export const initialMeshAssignerState: MeshAssignerState = {
  phase: 'assign',
  mesh1CW: true,
  mesh2CW: true,
  conventionInfo: false,
  termIndex: 0,
  revealIndex: 0,
  feedback: null,
  solution: null,
};

export function meshAssignerReducer(state: MeshAssignerState, action: MeshAssignerAction): MeshAssignerState {
  switch (state.phase) {
    case 'assign':
      if (action.type === 'toggleMesh') {
        return action.mesh === 1
          ? { ...state, mesh1CW: !state.mesh1CW }
          : { ...state, mesh2CW: !state.mesh2CW };
      }
      if (action.type === 'checkConvention') {
        if (state.mesh1CW && state.mesh2CW) {
          return { ...state, phase: 'kvl-1', termIndex: 0, conventionInfo: false };
        }
        return { ...state, conventionInfo: true };
      }
      if (action.type === 'normalize') {
        return { ...state, mesh1CW: true, mesh2CW: true, conventionInfo: false, phase: 'kvl-1', termIndex: 0 };
      }
      return state;

    case 'kvl-1': {
      if (action.type !== 'pickTerm') return state;
      const result = resolveTermPick(MESH_KVL_1_TERMS, state.termIndex, action.choiceId);
      if (result.kind === 'wrong') return { ...state, feedback: result.feedback };
      if (result.kind === 'advance') return { ...state, termIndex: state.termIndex + 1, feedback: null };
      return { ...state, phase: 'tidy-1', feedback: null };
    }

    case 'tidy-1':
      if (action.type === 'continue') return { ...state, phase: 'kvl-2', termIndex: 0, feedback: null };
      return state;

    case 'kvl-2': {
      if (action.type !== 'pickTerm') return state;
      const result = resolveTermPick(MESH_KVL_2_TERMS, state.termIndex, action.choiceId);
      if (result.kind === 'wrong') return { ...state, feedback: result.feedback };
      if (result.kind === 'advance') return { ...state, termIndex: state.termIndex + 1, feedback: null };
      return { ...state, phase: 'tidy-2', feedback: null };
    }

    case 'tidy-2':
      if (action.type === 'continue') return { ...state, phase: 'solve', revealIndex: 0, feedback: null };
      return state;

    case 'solve': {
      if (action.type !== 'revealNext') return state;
      const next = Math.min(state.revealIndex + 1, MESH_SOLVE_LINES.length - 1);
      if (next >= MESH_SOLVE_LINES.length - 1) {
        return { ...state, revealIndex: next, phase: 'done', solution: MESH_SOLUTION };
      }
      return { ...state, revealIndex: next };
    }

    case 'done':
      return state;
  }
}
