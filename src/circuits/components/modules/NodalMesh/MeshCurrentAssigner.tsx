import { useReducer } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { MeshDiagram } from './MeshDiagram';
import {
  CONVENTION_INFO,
  MESH_CHECK_CHIP,
  MESH_KVL_1_TERMS,
  MESH_KVL_2_PREFILL,
  MESH_KVL_2_TERMS,
  MESH_SOLVE_LINES,
  MESH_TIDY_1,
  MESH_TIDY_2,
  buildEquationLine,
  initialMeshAssignerState,
  meshAssignerReducer,
} from './nodalMeshData';

const PRIMARY_BUTTON =
  'px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors';

const CHOICE_BUTTON =
  'px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 transition-colors';

const TOGGLE_BUTTON =
  'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40';

/** Pre-filled mesh-2 line with the shared-term slot still open. */
const KVL_2_LINE = `\\square + ${MESH_KVL_2_PREFILL.join(' + ')} = 0`;

/**
 * Mesh-current walkthrough over the fixed two-window circuit: assign the two
 * circulating arrows (the convention check normalizes to all-clockwise),
 * build both KVL equations term by term — the shared R3 branch is the whole
 * trick — then step through the solve to i1 = 4 A, i2 = 1 A.
 */
export function MeshCurrentAssigner() {
  const [state, dispatch] = useReducer(meshAssignerReducer, initialMeshAssignerState);
  const { phase, mesh1CW, mesh2CW, conventionInfo, termIndex, revealIndex, feedback, solution } = state;

  const activeSteps =
    phase === 'kvl-1' ? MESH_KVL_1_TERMS : phase === 'kvl-2' ? MESH_KVL_2_TERMS : null;
  const activeStep = activeSteps?.[termIndex] ?? null;

  const equationLine =
    phase === 'kvl-1'
      ? buildEquationLine(MESH_KVL_1_TERMS.slice(0, termIndex).map((t) => t.committedKatex), 3)
      : phase === 'kvl-2'
        ? KVL_2_LINE
        : null;

  const solveLinesShown =
    phase === 'solve' ? revealIndex + 1 : phase === 'done' ? MESH_SOLVE_LINES.length : 0;

  return (
    <div className="space-y-4">
      <MeshDiagram
        mesh1CW={mesh1CW}
        mesh2CW={mesh2CW}
        highlight={activeStep?.highlight ?? null}
        showSolution={phase === 'done'}
      />
      <p className="text-sm text-muted">
        A 20 V source drives the left window and a 4 V source (+ terminal up) opposes the right
        window; R1 (2 Ω) and R2 (8 Ω) sit on the top rail and the shared R3 (4 Ω) forms the wall
        between the two windows.
      </p>

      <div aria-live="polite">
        {feedback && (
          <p className="text-sm rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
            {feedback}
          </p>
        )}
      </div>

      {phase === 'assign' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Step 1 — assign a circulating current to each window.</span>{' '}
            Click an arrow chip to flip its direction, then check the convention.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              aria-label="Mesh 1 arrow clockwise"
              aria-pressed={mesh1CW}
              onClick={() => dispatch({ type: 'toggleMesh', mesh: 1 })}
              className={TOGGLE_BUTTON}
            >
              Mesh 1: {mesh1CW ? '↻ clockwise' : '↺ counter-clockwise'}
            </button>
            <button
              aria-label="Mesh 2 arrow clockwise"
              aria-pressed={mesh2CW}
              onClick={() => dispatch({ type: 'toggleMesh', mesh: 2 })}
              className={TOGGLE_BUTTON}
            >
              Mesh 2: {mesh2CW ? '↻ clockwise' : '↺ counter-clockwise'}
            </button>
            <button onClick={() => dispatch({ type: 'checkConvention' })} className={PRIMARY_BUTTON}>
              Check convention
            </button>
          </div>
          {conventionInfo && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
              <p className="text-sm text-blue-800 dark:text-blue-300">{CONVENTION_INFO}</p>
              <button onClick={() => dispatch({ type: 'normalize' })} className={PRIMARY_BUTTON}>
                Set both clockwise
              </button>
            </div>
          )}
        </div>
      )}

      {activeStep && equationLine && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            {phase === 'kvl-1'
              ? 'KVL around mesh 1 — voltage drops sum to zero'
              : 'KVL around mesh 2 — R2 and the 4 V source are pre-filled'}
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

      {(phase === 'tidy-1' || phase === 'tidy-2') && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            {phase === 'tidy-1' ? 'Collect terms — equation 1 of 2' : 'Collect terms — equation 2 of 2'}
          </h4>
          <MathWrapper formula={phase === 'tidy-1' ? MESH_TIDY_1 : MESH_TIDY_2} block />
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
          {MESH_SOLVE_LINES.slice(0, solveLinesShown).map((line) => (
            <MathWrapper key={line} formula={line} block />
          ))}
          {phase === 'solve' && (
            <button onClick={() => dispatch({ type: 'revealNext' })} className={PRIMARY_BUTTON}>
              Reveal next line
            </button>
          )}
        </div>
      )}

      {phase === 'done' && solution && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 space-y-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            The shared branch carries i₁ − i₂ = {solution.shared} A downward ({solution.vR3} V
            across R3). Left-branch check:
          </p>
          <MathWrapper formula={MESH_CHECK_CHIP} block />
          <p className="font-mono text-xs font-bold tracking-widest text-green-700 dark:text-green-400">
            CHECK PASSES ✓
          </p>
        </div>
      )}
    </div>
  );
}
