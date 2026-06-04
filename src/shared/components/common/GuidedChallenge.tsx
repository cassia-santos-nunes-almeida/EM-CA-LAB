import { useState } from 'react';
import { Trophy, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/**
 * Data for a guided, multi-step exploration challenge.
 * Distinct from the auto-check `Challenge` in ChallengeCard — see
 * docs/guided-challenge-spec.md in EM-AC-Lab-Module1. Every instruction must
 * reference a control that actually exists in the section's simulation.
 */
export interface GuidedChallengeData {
  title: string;
  description: string;
  instructions: string[];
  hint?: string;
}

interface GuidedChallengeProps {
  challenge: GuidedChallengeData;
  onComplete?: () => void;
}

/**
 * Guided challenge with step-by-step instructions, an optional hint, and manual
 * completion tracking (open-ended exploration — no auto-grading).
 */
export function GuidedChallenge({ challenge, onComplete }: GuidedChallengeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    onComplete?.();
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 shadow-sm transition-colors',
        completed
          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
          : 'border-engineering-blue-200 dark:border-engineering-blue-800 bg-white dark:bg-slate-800'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy
          size={18}
          className={cn(
            completed ? 'text-green-500' : 'text-engineering-blue-500'
          )}
        />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Challenge
        </h4>
        {completed && (
          <CheckCircle size={16} className="text-green-500 ml-auto" />
        )}
      </div>

      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
        {challenge.title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {challenge.description}
      </p>

      <div className="space-y-2 mb-4">
        {challenge.instructions.map((step, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 p-2 rounded-lg text-sm transition-all',
              i === currentStep
                ? 'bg-engineering-blue-50 dark:bg-engineering-blue-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800'
                : i < currentStep
                  ? 'text-slate-400 dark:text-slate-600 line-through'
                  : 'text-slate-500 dark:text-slate-400'
            )}
          >
            <span className="font-mono text-xs font-bold mt-0.5 shrink-0">
              {i < currentStep ? '✓' : `${i + 1}.`}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {!completed && currentStep < challenge.instructions.length - 1 && (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
          >
            Next Step <ChevronRight size={14} />
          </button>
        )}
        {!completed && currentStep === challenge.instructions.length - 1 && (
          <button
            onClick={handleComplete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Mark Complete <CheckCircle size={14} />
          </button>
        )}
        {challenge.hint && !showHint && !completed && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Lightbulb size={14} /> Hint
          </button>
        )}
      </div>

      {showHint && !completed && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          {challenge.hint}
        </div>
      )}
    </div>
  );
}
