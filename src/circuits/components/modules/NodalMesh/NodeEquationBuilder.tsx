import { useReducer } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { BridgeDiagram } from './BridgeDiagram';
import {
  LABEL_NOTE,
  NODE_KCL_A_TERMS,
  NODE_KCL_B_PREFILL,
  NODE_KCL_B_TERMS,
  NODE_SOLVE_LINES,
  NODE_TIDY_A,
  NODE_TIDY_B,
  buildEquationLine,
  initialNodeBuilderState,
  nodeBuilderReducer,
  type BridgeNode,
} from './nodalMeshData';

const PRIMARY_BUTTON =
  'px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors';

const CHOICE_BUTTON =
  'px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 transition-colors';

interface NodePicker {
  node: BridgeNode;
  /** Full accessible label for the picker button. */
  label: string;
  /** Short visible text inside the chip. */
  short: string;
  /** Percentage position over the 420×260 diagram. */
  left: string;
  top: string;
}

const NODE_PICKERS: NodePicker[] = [
  { node: 'plus', label: 'Choose the + node as reference', short: '+', left: '52.4%', top: '15.4%' },
  { node: 'A', label: 'Choose node A as reference', short: 'A', left: '33.3%', top: '50%' },
  { node: 'B', label: 'Choose node B as reference', short: 'B', left: '71.4%', top: '50%' },
  { node: 'bottom', label: 'Choose the bottom node as reference', short: '0V', left: '52.4%', top: '84.6%' },
];

/**
 * Click-by-click KCL equation builder over the fixed bridge circuit:
 * pick a reference node, label the unknowns, assemble both node equations
 * term by term (the diagram highlights each branch), then step through the
 * solve to the verified V_A = 7.2 V / V_B = 4.8 V / I_5 = 0.6 A answer.
 */
export function NodeEquationBuilder() {
  const [state, dispatch] = useReducer(nodeBuilderReducer, initialNodeBuilderState);
  const { phase, termIndex, revealIndex, feedback } = state;

  const activeSteps =
    phase === 'kcl-A' ? NODE_KCL_A_TERMS : phase === 'kcl-B' ? NODE_KCL_B_TERMS : null;
  const activeStep = activeSteps?.[termIndex] ?? null;

  const equationLine =
    phase === 'kcl-A'
      ? buildEquationLine(NODE_KCL_A_TERMS.slice(0, termIndex).map((t) => t.committedKatex), 3)
      : phase === 'kcl-B'
        ? buildEquationLine(
            [NODE_KCL_B_PREFILL, ...NODE_KCL_B_TERMS.slice(0, termIndex).map((t) => t.committedKatex)],
            3,
          )
        : null;

  const solveLinesShown =
    phase === 'solve' ? revealIndex + 1 : phase === 'done' ? NODE_SOLVE_LINES.length : 0;

  return (
    <div className="space-y-4">
      <div className="relative">
        <BridgeDiagram
          highlightBranch={activeStep?.highlight ?? null}
          showGround={phase !== 'pick-reference'}
          showUnknownLabels={phase !== 'pick-reference'}
          showSolution={phase === 'done'}
        />
        {phase === 'pick-reference' &&
          NODE_PICKERS.map((picker) => (
            <button
              key={picker.node}
              aria-label={picker.label}
              onClick={() => dispatch({ type: 'pickNode', node: picker.node })}
              style={{ left: picker.left, top: picker.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-engineering-blue-600 bg-white/90 dark:bg-slate-800/90 text-xs font-bold text-engineering-blue-700 dark:text-engineering-blue-400 shadow hover:bg-engineering-blue-50 dark:hover:bg-engineering-blue-900/40 transition-colors"
            >
              {picker.short}
            </button>
          ))}
      </div>
      <p className="text-sm text-muted">
        A 12 V source feeds two voltage dividers — R1 over R3 on the left, R2 over R4 on the
        right — with R5 bridging their midpoints A and B.
      </p>

      <div aria-live="polite">
        {feedback && (
          <p
            className={`text-sm rounded-lg p-3 ${
              phase === 'label'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            {feedback}
          </p>
        )}
      </div>

      {phase === 'pick-reference' && (
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold">Step 1 — choose the reference node.</span> One node
          gets defined as 0 V and every other node voltage is measured against it. Click a node
          on the diagram.
        </p>
      )}

      {phase === 'label' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">{LABEL_NOTE}</p>
          <button onClick={() => dispatch({ type: 'continue' })} className={PRIMARY_BUTTON}>
            Continue
          </button>
        </div>
      )}

      {activeStep && equationLine && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            {phase === 'kcl-A'
              ? 'KCL at node A — currents leaving sum to zero'
              : 'KCL at node B — the R2 term is pre-filled'}
          </h4>
          <MathWrapper formula={equationLine} block />
          <p className="text-sm text-slate-700 dark:text-slate-300">{activeStep.prompt}</p>
          <div className="flex flex-wrap gap-2">
            {activeStep.choices.map((choice) => (
              <button
                key={choice.id}
                aria-label={choice.label}
                onClick={() => dispatch({ type: 'pickTerm', choiceId: choice.id })}
                className={CHOICE_BUTTON}
              >
                <MathWrapper formula={choice.katex} />
              </button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'tidy-A' || phase === 'tidy-B') && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            {phase === 'tidy-A' ? 'Collect terms — equation 1 of 2' : 'Collect terms — equation 2 of 2'}
          </h4>
          <MathWrapper formula={phase === 'tidy-A' ? NODE_TIDY_A : NODE_TIDY_B} block />
          <button onClick={() => dispatch({ type: 'continue' })} className={PRIMARY_BUTTON}>
            Continue
          </button>
        </div>
      )}

      {solveLinesShown > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            Two equations, two unknowns
          </h4>
          {NODE_SOLVE_LINES.slice(0, solveLinesShown).map((line) => (
            <MathWrapper key={line} formula={line} block />
          ))}
          {phase === 'solve' && (
            <button onClick={() => dispatch({ type: 'revealNext' })} className={PRIMARY_BUTTON}>
              Reveal next line
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-3">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
              KCL closes at both nodes:
            </p>
            <MathWrapper formula="\text{node A: } \frac{12 - 7.2}{2} = 2.4 = 1.8 + 0.6" block />
            <MathWrapper formula="\text{node B: } 1.8 + 0.6 = 2.4 = \frac{4.8}{2}" block />
          </div>
          <p className="font-mono text-xs font-bold tracking-widest text-green-700 dark:text-green-400">
            SOLVED — 2 EQUATIONS
          </p>
        </div>
      )}
    </div>
  );
}
