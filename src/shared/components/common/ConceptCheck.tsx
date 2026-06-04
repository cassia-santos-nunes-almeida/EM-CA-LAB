import { useState } from 'react';
import { HelpCircle, Lightbulb } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface MultipleChoiceOption {
  text: string;
  correct: boolean;
  explanation: string;
}

interface MultipleChoiceCheck {
  mode: 'multiple-choice';
  question: string;
  options: MultipleChoiceOption[];
  /** Progressive hints shown on request (tier 1: nudge, tier 2: conceptual, tier 3: near-answer) */
  hints?: string[];
}

interface PredictRevealCheck {
  mode: 'predict-reveal';
  question: string;
  answer: string;
  /** Progressive hints shown on request (tier 1: nudge, tier 2: conceptual, tier 3: near-answer) */
  hints?: string[];
}

export type ConceptCheckData = MultipleChoiceCheck | PredictRevealCheck;

/** Props for the ConceptCheck component supporting multiple-choice and predict-reveal modes. */
interface ConceptCheckProps {
  /** The concept check configuration including question, mode, and optional hints */
  data: ConceptCheckData;
  /** Additional CSS class names */
  className?: string;
  /** Called when a correct answer is selected or answer is revealed */
  onComplete?: () => void;
  /** Called when a hint is revealed, with the hint tier (1-based) */
  onHint?: (tier: number) => void;
}

export function ConceptCheck({ data, className, onComplete, onHint }: ConceptCheckProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const hints = data.hints;
  const hasHints = hints && hints.length > 0;
  const canShowMoreHints = hasHints && hintLevel < hints.length;

  return (
    <div className={cn(
      'rounded-lg p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
      className,
    )}>
      <div className="flex items-start gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
            Check Your Understanding
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {data.question}
          </p>
        </div>
      </div>

      {hintLevel > 0 && hints && (
        <div className="ml-7 mb-3 space-y-1.5">
          {hints.slice(0, hintLevel).map((hint, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {canShowMoreHints && selectedIndex === null && !revealed && (
        <button
          onClick={() => {
            const next = hintLevel + 1;
            setHintLevel(next);
            onHint?.(next);
          }}
          className="ml-7 mb-3 text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium flex items-center gap-1"
        >
          <Lightbulb className="w-3 h-3" />
          Need a hint?
        </button>
      )}

      {data.mode === 'multiple-choice' && (
        <div role="group" aria-label="Answer options" className="space-y-2 ml-7">
          {data.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const showFeedback = isSelected && selectedIndex !== null;

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  if (option.correct) onComplete?.();
                }}
                disabled={selectedIndex !== null}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedIndex === null && 'bg-white dark:bg-slate-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300',
                  showFeedback && option.correct && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ring-2 ring-green-400',
                  showFeedback && !option.correct && 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400',
                  !isSelected && selectedIndex !== null && 'opacity-60 text-slate-500 dark:text-slate-400',
                )}
              >
                {option.text}
                {showFeedback && (
                  <p
                    aria-live="polite"
                    className={cn(
                      'text-xs mt-1',
                      option.correct ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
                    )}
                  >
                    {option.explanation}
                  </p>
                )}
              </button>
            );
          })}
          {selectedIndex !== null && (
            <button
              onClick={() => { setSelectedIndex(null); setHintLevel(0); }}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium mt-1"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {data.mode === 'predict-reveal' && (
        <div className="ml-7">
          {revealed ? (
            <div className="bg-white dark:bg-slate-700/50 rounded-md px-3 py-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">{data.answer}</p>
              <button
                onClick={() => setRevealed(false)}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium mt-2"
              >
                Hide Answer
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setRevealed(true); onComplete?.(); }}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Reveal Answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
