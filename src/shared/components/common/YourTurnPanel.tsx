import { useState, type ReactNode } from 'react';
import { Pencil, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/** A single answer option for the YourTurnPanel. */
interface YourTurnOption {
  /** Display text for this option */
  text: string;
  /** Whether this is the correct answer */
  correct: boolean;
  /** Explanation shown when this option is selected */
  explanation: string;
}

/** Props for the YourTurnPanel component that adds practice exercises after worked examples. */
interface YourTurnPanelProps {
  /** Description of the modified scenario (e.g., "Now consider the same RC circuit but with R = 200Ω") */
  scenario: string;
  /** The question to ask about the parameter change */
  question: string;
  /** Multiple choice options */
  options: YourTurnOption[];
  /** Content shown after a correct answer (e.g., updated equation with new values) */
  correctReveal: ReactNode;
  /** Optional progressive hints */
  hints?: string[];
  /** Additional CSS class names */
  className?: string;
}

export function YourTurnPanel({ scenario, question, options, correctReveal, className }: YourTurnPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedOption = selectedIndex !== null ? options[selectedIndex] : null;
  const isCorrect = selectedOption?.correct ?? false;

  return (
    <div className={cn(
      'border-t-2 border-dashed border-slate-300 dark:border-slate-600 pt-5 mt-6',
      className,
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Pencil className="w-4 h-4 text-engineering-blue-600 dark:text-engineering-blue-400" />
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide">
          Your Turn
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">{scenario}</p>

        <p className="text-sm font-semibold text-slate-900 dark:text-white">{question}</p>

        <div className="space-y-2">
          {options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const showFeedback = isSelected && selectedIndex !== null;

            return (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                disabled={selectedIndex !== null}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedIndex === null && 'bg-white dark:bg-slate-600/50 hover:bg-engineering-blue-50 dark:hover:bg-engineering-blue-900/20 text-slate-700 dark:text-slate-300',
                  showFeedback && option.correct && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-2 ring-green-400',
                  showFeedback && !option.correct && 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400',
                  !isSelected && selectedIndex !== null && 'opacity-60 text-slate-500 dark:text-slate-400',
                )}
              >
                <span className="flex items-start gap-2">
                  {showFeedback && option.correct && <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                  {showFeedback && !option.correct && <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                  <span>{option.text}</span>
                </span>
                {showFeedback && (
                  <p className={cn(
                    'text-xs mt-1 ml-6',
                    option.correct ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
                  )}>
                    {option.explanation}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {selectedIndex !== null && isCorrect && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Updated Values</p>
            {correctReveal}
          </div>
        )}

        {selectedIndex !== null && !isCorrect && (
          <div className="bg-white dark:bg-slate-600/50 rounded-lg p-4 border-l-4 border-slate-300 dark:border-slate-500">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">Correct Answer</p>
            {correctReveal}
          </div>
        )}

        {selectedIndex !== null && (
          <button
            onClick={() => setSelectedIndex(null)}
            className="text-xs text-engineering-blue-700 dark:text-engineering-blue-400 hover:underline font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
