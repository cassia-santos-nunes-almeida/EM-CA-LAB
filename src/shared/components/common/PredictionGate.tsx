import { useState, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle, XCircle, SkipForward } from 'lucide-react';
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
  /**
   * Instrument-panel header label shown in the dark brow, e.g. "Faraday".
   * Rendered as "BENCH · {label} · ARMED". Defaults to "PREDICT FIRST" when omitted.
   * Additive optional — all existing call sites continue to work unchanged.
   */
  label?: string;
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
  label,
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
      label={label}
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
  label,
}: Omit<PredictionGateProps, 'resetKey'>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [passed, setPassed] = useState(initialPassed);

  const revealRef = useRef<HTMLDivElement>(null);
  // Only move focus on a real Continue/Skip click — NOT when the gate remounts
  // already-passed (initialPassed, e.g. a Tabs panel restoring its unlocked
  // state), which would silently steal focus to the revealed canvas.
  const focusOnReveal = useRef(false);

  const correctId = getCorrectAnswer();
  const isCorrect = selectedId === correctId;
  const hasAnswered = selectedId !== null;

  // After the reveal renders, move focus into it. Many reveals are <canvas> sims
  // with no heading, so we focus a generic tabIndex=-1 wrapper rather than a
  // heading that often does not exist — keeping keyboard / screen-reader users
  // oriented to the content that just appeared.
  useEffect(() => {
    if (passed && !nonBlocking && focusOnReveal.current) {
      focusOnReveal.current = false;
      revealRef.current?.focus();
    }
  }, [passed, nonBlocking]);

  const handleSelect = (id: string) => {
    if (hasAnswered) return;
    setSelectedId(id);
    onPredict?.(id === correctId);
  };

  const handleContinue = () => {
    focusOnReveal.current = true;
    setPassed(true);
    onPassed?.();
  };

  const handleSkip = () => {
    focusOnReveal.current = true;
    setPassed(true);
    onPassed?.();
  };

  // Blocking mode: once passed (or skipped), swap the prompt for the content.
  // The tabIndex=-1 wrapper is the focus target for the reveal (see effect above).
  if (passed && !nonBlocking) {
    return (
      <div ref={revealRef} tabIndex={-1} className="outline-none">
        {children}
      </div>
    );
  }

  // Instrument header label: "BENCH · {label} · ARMED" or "BENCH · PREDICT FIRST · ARMED"
  const benchLabel = label
    ? `BENCH · ${label.toUpperCase()} · ARMED`
    : 'BENCH · PREDICT FIRST · ARMED';

  const prompt = (
    <div
      data-gate="true"
      className={cn(
        'rounded-lg border border-screen overflow-hidden shadow-sm',
        className,
      )}
    >
      {/* Instrument brow — dark header strip */}
      <div className="bg-screen px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-xs text-led tracking-widest uppercase">
          {benchLabel}
        </span>
        <span className="font-mono text-xs text-slate-400 flex items-center gap-1.5">
          <span className={cn(
            'inline-block w-2 h-2 rounded-sm',
            hasAnswered ? 'bg-led' : 'bg-amber-400',
          )} />
          {hasAnswered ? 'COMMITTED' : 'LOCKED · PREDICT FIRST'}
        </span>
      </div>

      {/* Body — warm paper ground */}
      <div className="bg-chassis p-5">
        <p className="font-mono text-xs text-muted uppercase tracking-wide mb-1">
          Predict First
        </p>
        <p className="text-sm font-semibold text-title mb-4">
          {question}
        </p>

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
                  'flex flex-col items-center gap-2 p-3 rounded border font-mono text-xs transition-all text-center',
                  !hasAnswered && 'border-screen bg-white dark:bg-slate-800 hover:border-led cursor-pointer',
                  hasAnswered && isSelected && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400',
                  hasAnswered && isSelected && !isCorrect && 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400',
                  hasAnswered && !isSelected && isCorrectOption && 'border-green-300 bg-green-50/50 dark:bg-green-900/10',
                  hasAnswered && !isSelected && !isCorrectOption && 'opacity-40',
                )}
              >
                {option.visual && (
                  <div className="w-full">{option.visual}</div>
                )}
                <span className="text-xs font-medium text-ink dark:text-slate-300">
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
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'rounded-lg p-4 mb-4',
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                : 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500',
            )}
          >
            <p className={cn(
              'text-xs font-semibold uppercase tracking-wide mb-2',
              isCorrect ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
            )}>
              {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
            </p>
            <div className="text-sm text-ink dark:text-slate-300">
              {explanation}
            </div>
          </div>
        )}

        {/* In non-blocking mode the content below is always visible, so the
            commit / skip controls (which reveal gated content) are omitted. */}
        {!nonBlocking && (
          <div className="flex items-center gap-3">
            {hasAnswered && (
              <button
                onClick={handleContinue}
                className="px-5 py-2 rounded font-mono text-xs font-semibold tracking-widest uppercase bg-led text-screen hover:opacity-90 transition-opacity"
              >
                COMMIT PREDICTION ▸
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
