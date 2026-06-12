import { useState, type ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

/** A single step in a sequential worked example. */
export interface WorkedStep {
  /** Step heading, e.g. "Step 1 — Constraint (the source dictates)" */
  title: string;
  /** Step content (text, MathWrapper blocks, …) */
  body: ReactNode;
}

interface WorkedStepsProps {
  /** Steps in order; the first renders open, the rest reveal one click at a time. */
  steps: WorkedStep[];
  /** Nudge above the reveal button, e.g. "Try this step on paper before revealing." */
  tryFirstPrompt?: string;
  /** Optional anchor id for the wrapper */
  id?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Sequential step-reveal worked example. Step 1 renders open; a single native
 * button labeled "Reveal step n of N" appends the next step on each click
 * (focus stays on the button because the element persists). When the last
 * step opens the button unmounts and an aria-live region announces
 * "All steps revealed".
 */
export function WorkedSteps({ steps, tryFirstPrompt, id, className }: WorkedStepsProps) {
  const [revealedCount, setRevealedCount] = useState(1);

  const total = steps.length;
  const allRevealed = revealedCount >= total;

  return (
    <div id={id} className={cn('space-y-4', className)}>
      {steps.slice(0, revealedCount).map((step, index) => (
        <div key={index} className="bg-white dark:bg-slate-700/50 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {step.title}
          </h4>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {step.body}
          </div>
        </div>
      ))}

      {!allRevealed && (
        <div>
          {tryFirstPrompt && (
            <p className="text-sm italic text-slate-600 dark:text-slate-400 mb-2">
              {tryFirstPrompt}
            </p>
          )}
          <button
            onClick={() => setRevealedCount((n) => Math.min(n + 1, total))}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
          >
            Reveal step {revealedCount + 1} of {total}
          </button>
        </div>
      )}

      {/* Always mounted so the completion announcement actually fires for screen readers. */}
      <p aria-live="polite" className="text-xs font-mono uppercase tracking-wide text-green-700 dark:text-green-400">
        {allRevealed ? 'All steps revealed' : null}
      </p>
    </div>
  );
}
