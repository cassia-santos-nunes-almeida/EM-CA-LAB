import { useState } from 'react';
import { Lightbulb, Check } from 'lucide-react';
import { cn } from '@shared/utils/cn';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  hint?: string;
  successMessage?: string;
  /** Return true when the challenge condition is met */
  check?: () => boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
  className?: string;
}

export function ChallengeCard({ challenge, className }: ChallengeCardProps) {
  const [showHint, setShowHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isComplete = challenge.check?.() ?? false;

  if (dismissed) return null;

  return (
    <div className={cn(
      'rounded-lg p-4 border-l-4 transition-colors',
      isComplete
        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500',
      className,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {isComplete ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-semibold',
              isComplete
                ? 'text-green-900 dark:text-green-300'
                : 'text-amber-900 dark:text-amber-300',
            )}>
              {challenge.title}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isComplete && challenge.successMessage
                ? challenge.successMessage
                : challenge.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs shrink-0"
          aria-label="Dismiss challenge"
        >
          ✕
        </button>
      </div>

      {challenge.hint && !isComplete && (
        <div className="mt-2 ml-8">
          {showHint ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-700/40 rounded px-2 py-1">
              {challenge.hint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              Show Hint
            </button>
          )}
        </div>
      )}
    </div>
  );
}
