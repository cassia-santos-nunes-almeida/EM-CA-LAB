import { useReducer } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { cn } from '@shared/utils/cn';
import { ResponsePlot } from '@circuits/components/modules/PartialFractions/ResponsePlot';
import {
  coverUpReducer,
  createInitialCoverUpState,
  SLOTS,
  SLOT_IDS,
  FACTORS,
  FACTOR_IDS,
  IDENTIFICATION_COST,
  COVERUP_COST,
} from '@circuits/components/modules/PartialFractions/coverUpData';

/**
 * The "Cover-Up" lab: harvest the three residues of the flagship function in
 * any order — pick a slot, cover its factor with the thumb, evaluate at the
 * pole, step through the precomputed arithmetic — then assemble f(t) term by
 * term on the response plot.
 */
export function CoverUpStepper() {
  const [state, dispatch] = useReducer(coverUpReducer, undefined, createInitialCoverUpState);

  const activeSlot = state.activeSlot !== null ? SLOTS[state.activeSlot] : null;
  const activePhase = state.activeSlot !== null ? state.slots[state.activeSlot] : null;

  return (
    <div className="space-y-6">
      {/* The flagship function with clickable denominator factor chips */}
      <div className="bg-white dark:bg-slate-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
          The flagship function, with each denominator factor as a chip your thumb can cover:
        </p>
        <div className="flex items-center justify-center gap-3">
          <MathWrapper formula="F(s) =" />
          <div className="inline-flex flex-col items-center">
            <MathWrapper formula="96(s+5)" />
            <div className="w-full border-t-2 border-slate-700 dark:border-slate-300 my-1" aria-hidden="true" />
            <div className="flex items-center gap-1">
              {FACTOR_IDS.map((factorId) => {
                const chip = FACTORS[factorId];
                const covered =
                  activeSlot !== null &&
                  (activePhase === 'evaluating' || activePhase === 'revealing') &&
                  activeSlot.factor === factorId;
                return (
                  <span key={factorId} className="relative inline-flex">
                    <button
                      aria-label={chip.label}
                      disabled={activePhase !== 'covering'}
                      onClick={() => dispatch({ type: 'pickFactor', factor: factorId })}
                      className={cn(
                        'px-2 py-1 rounded-md border-2 transition-colors',
                        activePhase === 'covering'
                          ? 'border-engineering-blue-300 dark:border-engineering-blue-700 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 hover:border-engineering-blue-500 cursor-pointer'
                          : 'border-transparent',
                      )}
                    >
                      <MathWrapper formula={chip.katex} />
                    </button>
                    {covered && (
                      <span
                        role="img"
                        aria-label="covered factor"
                        className="absolute inset-0 flex items-center justify-center rounded-md bg-slate-500/90 dark:bg-slate-400/90 text-base"
                      >
                        <span aria-hidden="true">👍</span>
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Target decomposition with the three coefficient slots */}
      <div className="bg-white dark:bg-slate-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          Target decomposition — pick any unsolved coefficient to harvest (order does not matter):
        </p>
        <MathWrapper formula="F(s) = \frac{A}{s} + \frac{B}{s+8} + \frac{C}{s+6}" block />
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
          {SLOT_IDS.map((slotId) => {
            const phase = state.slots[slotId];
            const isActive = state.activeSlot === slotId;
            return (
              <button
                key={slotId}
                aria-label={`Solve coefficient ${slotId}`}
                disabled={phase === 'solved'}
                onClick={() => dispatch({ type: 'pickSlot', slot: slotId })}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 font-mono text-sm font-semibold transition-colors',
                  phase === 'solved' && 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
                  isActive && phase !== 'solved' && 'border-engineering-blue-500 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 text-engineering-blue-700 dark:text-engineering-blue-400',
                  !isActive && phase !== 'solved' && 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-engineering-blue-400 cursor-pointer',
                )}
              >
                {slotId}{phase === 'solved' ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active-slot micro-flow */}
      {activeSlot !== null && activePhase !== null && activePhase !== 'solved' && (
        <div className="bg-white dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
          {activePhase === 'covering' && (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Solving {activeSlot.id}: cover the factor that creates this pole.
            </p>
          )}

          {activePhase === 'evaluating' && (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Factor covered. Now evaluate everything you can still see at s = ?
              </p>
              <div className="flex flex-wrap gap-2">
                {activeSlot.evalChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => dispatch({ type: 'pickEvalPoint', pointId: choice.id })}
                    className="px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-sm font-mono text-slate-700 dark:text-slate-300 hover:border-engineering-blue-400 transition-colors"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activePhase === 'revealing' && (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                The arithmetic, one line at a time:
              </p>
              {activeSlot.revealSteps.slice(0, state.revealIndex + 1).map((step) => (
                <MathWrapper key={step} formula={step} block />
              ))}
              <button
                onClick={() => dispatch({ type: 'revealNext' })}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
              >
                Next
              </button>
            </>
          )}
        </div>
      )}

      {/* Coaching feedback (always mounted so screen readers hear updates) */}
      <p aria-live="polite" className="min-h-[1rem]">
        {state.feedback !== null && (
          <span className="block rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
            {state.feedback}
          </span>
        )}
      </p>

      {/* Residue tally */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Residue tally:
        </span>
        {SLOT_IDS.map((slotId) => (
          <span
            key={slotId}
            className={cn(
              'font-mono text-sm px-2 py-1 rounded',
              state.slots[slotId] === 'solved'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
            )}
          >
            {state.slots[slotId] === 'solved' ? `${slotId} = ${SLOTS[slotId].residueDisplay}` : `${slotId} = ?`}
          </span>
        ))}
      </div>

      {/* Finale: cost stamps, assembled inverse, term-assembly plot */}
      {state.assembled && (
        <div className="space-y-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Identification cost
              </p>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{IDENTIFICATION_COST}</p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700 dark:text-green-400">
                Cover-up cost
              </p>
              <p className="font-mono text-xs text-green-800 dark:text-green-300">{COVERUP_COST}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              All three residues paid — the inverse transform assembles itself from the table:
            </p>
            <MathWrapper formula="f(t) = \left(10 - 18e^{-8t} + 8e^{-6t}\right)u(t)" block />
            <p className="inline-block mt-2 rounded-full bg-engineering-blue-50 dark:bg-engineering-blue-900/20 px-3 py-1 text-xs font-medium text-engineering-blue-700 dark:text-engineering-blue-400">
              identification gave the same A, B, C — two methods, one truth
            </p>
          </div>

          <ResponsePlot
            checked={state.checkedTerms}
            onToggle={(term) => dispatch({ type: 'toggleTerm', term })}
          />
        </div>
      )}
    </div>
  );
}
