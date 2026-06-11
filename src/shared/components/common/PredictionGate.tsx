import { useState, type ReactNode } from 'react';
import { Eye, CheckCircle, XCircle, SkipForward } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/** A single prediction option that can include a visual (e.g., SVG curve sketch). */
interface PredictionOption {
  /** Unique identifier for this option */
  id: string;
  /** Display label text */
  label: string;
  /** Optional visual element (e.g., SVG curve sketch) rendered above the label */
  visual?: ReactNode;
}

/** Props for the PredictionGate component that asks students to predict before seeing results. */
interface PredictionGateProps {
  /** The prediction question prompt */
  question: string;
  /** Available prediction options */
  options: PredictionOption[];
  /** Function that returns the ID of the correct option based on current parameters */
  getCorrectAnswer: () => string;
  /** Explanation shown after answering (can include MathWrapper elements) */
  explanation: ReactNode;
  /** Content revealed after the gate is passed (omit in non-blocking mode) */
  children?: ReactNode;
  /** Key that triggers a gate reset when it changes (e.g., derived from parameter values) */
  resetKey?: string;
  /**
   * Whether to show a "Skip" link (defaults to false). Set it on gates that
   * re-lock via resetKey so re-triggers stay one-click dismissible.
   */
  allowSkip?: boolean;
  /**
   * Non-blocking mode: the prompt invites a prediction but never hides what
   * follows. Any `children` render immediately below the prompt regardless of
   * the answer. Use when the simulation should always be discoverable (the
   * "predict, but the lab stays visible" pattern) instead of being gated.
   */
  nonBlocking?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Called when the student submits a prediction */
  onPredict?: (correct: boolean) => void;
  /**
   * Seeds the gate as already-passed on (re)mount. Used to restore the unlocked
   * state after a remount (e.g. a Tabs panel that remounts on tab switch),
   * so a committed gate does not re-lock and force a second prediction.
   */
  initialPassed?: boolean;
  /** Called when the gate transitions to passed (Continue/Skip), so a parent can persist the unlocked state. */
  onPassed?: () => void;
}

export function PredictionGate({
  question,
  options,
  getCorrectAnswer,
  explanation,
  children,
  resetKey,
  allowSkip = false,
  className,
  onPredict,
  nonBlocking = false,
  initialPassed = false,
  onPassed,
}: PredictionGateProps) {
  return (
    <PredictionGateInner
      key={resetKey}
      question={question}
      options={options}
      getCorrectAnswer={getCorrectAnswer}
      explanation={explanation}
      allowSkip={allowSkip}
      className={className}
      onPredict={onPredict}
      nonBlocking={nonBlocking}
      initialPassed={initialPassed}
      onPassed={onPassed}
    >
      {children}
    </PredictionGateInner>
  );
}

function PredictionGateInner({
  question,
  options,
  getCorrectAnswer,
  explanation,
  children,
  allowSkip = false,
  className,
  onPredict,
  nonBlocking = false,
  initialPassed = false,
  onPassed,
}: Omit<PredictionGateProps, 'resetKey'>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [passed, setPassed] = useState(initialPassed);

  const correctId = getCorrectAnswer();
  const isCorrect = selectedId === correctId;
  const hasAnswered = selectedId !== null;

  const handleSelect = (id: string) => {
    if (hasAnswered) return;
    setSelectedId(id);
    onPredict?.(id === correctId);
  };

  const handleContinue = () => {
    setPassed(true);
    onPassed?.();
  };

  const handleSkip = () => {
    setPassed(true);
    onPassed?.();
  };

  // Blocking mode: once passed (or skipped), swap the prompt for the content.
  if (passed && !nonBlocking) {
    return <>{children}</>;
  }

  const prompt = (
    <div className={cn(
      'rounded-lg border-2 border-dashed border-engineering-blue-300 dark:border-engineering-blue-700 p-5 bg-engineering-blue-50/50 dark:bg-engineering-blue-900/10',
      className,
    )}>
      <div className="flex items-start gap-2 mb-4">
        <Eye className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
            Predict First
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {question}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = option.id === correctId;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={hasAnswered}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center',
                !hasAnswered && 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 cursor-pointer',
                hasAnswered && isSelected && isCorrect && 'border-green-400 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400',
                hasAnswered && isSelected && !isCorrect && 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400',
                hasAnswered && !isSelected && isCorrectOption && 'border-green-300 bg-green-50/50 dark:bg-green-900/10',
                hasAnswered && !isSelected && !isCorrectOption && 'opacity-50',
              )}
            >
              {option.visual && (
                <div className="w-full">{option.visual}</div>
              )}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {option.label}
              </span>
              {hasAnswered && isSelected && (
                isCorrect
                  ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  : <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div className={cn(
          'rounded-lg p-4 mb-4',
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
            : 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500',
        )}>
          <p className={cn(
            'text-xs font-semibold uppercase tracking-wide mb-2',
            isCorrect ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
          )}>
            {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
          </p>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {explanation}
          </div>
        </div>
      )}

      {/* In non-blocking mode the content below is always visible, so the
          Continue / Skip controls (which reveal gated content) are omitted. */}
      {!nonBlocking && (
        <div className="flex items-center gap-3">
          {hasAnswered && (
            <button
              onClick={handleContinue}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
            >
              Continue
            </button>
          )}
          {allowSkip && !hasAnswered && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (nonBlocking) {
    return (
      <>
        {prompt}
        {children}
      </>
    );
  }

  return prompt;
}
