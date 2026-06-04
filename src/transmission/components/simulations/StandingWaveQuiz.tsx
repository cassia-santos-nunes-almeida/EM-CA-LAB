import { useCallback, useEffect, useRef, useState } from 'react';

/** Props for the StandingWaveQuiz component. */
interface StandingWaveQuizProps {
  /** Additional CSS class names for the outermost container. */
  className?: string;
}

/** A single quiz case definition. */
interface QuizCase {
  /** Unique identifier. */
  id: string;
  /** Reflection coefficient for this case. */
  gamma: number;
  /** Correct answer key. */
  answer: 'matched' | 'open' | 'short' | 'partial';
  /** Brief explanation shown after answering. */
  explanation: string;
  /** Descriptive title shown after correct answer. */
  title: string;
}

/** The four fixed quiz cases. */
const CASES: QuizCase[] = [
  {
    id: 'matched',
    gamma: 0,
    answer: 'matched',
    title: 'Matched Load',
    explanation:
      'When \u0393 = 0 the load impedance equals Z\u2080. No reflection occurs, so the voltage is uniform along the line.',
  },
  {
    id: 'open',
    gamma: 1,
    answer: 'open',
    title: 'Open Circuit',
    explanation:
      'An open circuit gives \u0393 = +1. The reflected wave has the same sign as the incident wave, creating a voltage maximum at the load.',
  },
  {
    id: 'short',
    gamma: -1,
    answer: 'short',
    title: 'Short Circuit',
    explanation:
      'A short circuit gives \u0393 = \u22121. The reflected wave cancels the incident wave at the load, producing a voltage node (zero) there.',
  },
  {
    id: 'partial',
    gamma: 0.5,
    answer: 'partial',
    title: 'Partial Reflection',
    explanation:
      'When |\u0393| is between 0 and 1, the standing wave has intermediate maxima and minima. The VSWR is finite and greater than 1.',
  },
];

/** The four possible answer choices. */
const CHOICES: { id: 'open' | 'short' | 'matched' | 'partial'; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'short', label: 'Short' },
  { id: 'matched', label: 'Matched' },
  { id: 'partial', label: 'Partial Reflection' },
];

/**
 * Interactive quiz where students identify termination conditions from
 * standing wave patterns.
 *
 * Four small canvas plots display distinct voltage standing wave patterns.
 * For each pattern, the student selects one of four termination types.
 * Correct answers are shown in green; incorrect answers in amber with the
 * correct answer and a brief explanation.
 */
export function StandingWaveQuiz({ className }: StandingWaveQuizProps) {
  /** Track which cases have been answered and whether correctly. */
  const [answers, setAnswers] = useState<Record<string, string | null>>({
    matched: null,
    open: null,
    short: null,
    partial: null,
  });

  const handleAnswer = (caseId: string, choiceId: string) => {
    setAnswers((prev) => {
      if (prev[caseId] !== null) return prev; // already answered
      return { ...prev, [caseId]: choiceId };
    });
  };

  const correctCount = CASES.filter(
    (c) => answers[c.id] === c.answer,
  ).length;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Identify the Termination
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {correctCount} / {CASES.length} correct
          </span>
        </div>

        {/* Quiz cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {CASES.map((quizCase, index) => (
            <QuizCard
              key={quizCase.id}
              quizCase={quizCase}
              caseIndex={index}
              selectedAnswer={answers[quizCase.id]}
              onAnswer={(choiceId) => handleAnswer(quizCase.id, choiceId)}
            />
          ))}
        </div>

        {/* Completion message */}
        {correctCount === CASES.length && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-center">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              All patterns correctly identified!
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              You can now recognize how different terminations shape the standing wave pattern.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -- QuizCard sub-component ----------------------------------------------- */

/** Props for a single quiz card. */
interface QuizCardProps {
  /** The quiz case data. */
  quizCase: QuizCase;
  /** Zero-based index of this case in the list. */
  caseIndex: number;
  /** The student's selected answer, or null if unanswered. */
  selectedAnswer: string | null;
  /** Callback when the student clicks an answer. */
  onAnswer: (choiceId: string) => void;
}

/** A single standing wave pattern with answer buttons. */
function QuizCard({ quizCase, caseIndex, selectedAnswer, onAnswer }: QuizCardProps) {
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === quizCase.answer;

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-colors ${
        hasAnswered
          ? isCorrect
            ? 'border-green-300 dark:border-green-700'
            : 'border-amber-300 dark:border-amber-700'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Canvas plot */}
      <div className="bg-white dark:bg-slate-800 p-2">
        <StandingWaveCanvas gamma={quizCase.gamma} index={caseIndex} />
      </div>

      {/* Answer buttons */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {CHOICES.map((choice) => {
            const isSelected = selectedAnswer === choice.id;
            const isCorrectChoice = choice.id === quizCase.answer;

            let btnClass =
              'px-2 py-2.5 rounded-md text-xs font-medium transition-colors border ';

            if (!hasAnswered) {
              btnClass +=
                'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 cursor-pointer';
            } else if (isSelected && isCorrect) {
              btnClass +=
                'border-green-400 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-2 ring-green-400';
            } else if (isSelected && !isCorrect) {
              btnClass +=
                'border-amber-400 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400';
            } else if (isCorrectChoice) {
              btnClass +=
                'border-green-300 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
            } else {
              btnClass +=
                'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-50';
            }

            return (
              <button
                key={choice.id}
                onClick={() => onAnswer(choice.id)}
                disabled={hasAnswered}
                className={btnClass}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {hasAnswered && (
          <div
            className={`rounded-md p-2 text-[11px] leading-relaxed ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span className="font-semibold">
              {isCorrect ? 'Correct!' : `Correct answer: ${quizCase.title}.`}
            </span>{' '}
            {quizCase.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

/* -- StandingWaveCanvas sub-component ------------------------------------- */

/** Props for the standing wave canvas. */
interface StandingWaveCanvasProps {
  /** Reflection coefficient for this pattern (-1, 0, 0.5, or 1). */
  gamma: number;
  /** Zero-based index of this pattern in the quiz. */
  index: number;
}

/**
 * Small canvas that renders the voltage standing wave pattern for a given
 * reflection coefficient. The load end is at the right side of the canvas.
 */
function StandingWaveCanvas({ gamma, index }: StandingWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const displayW = container ? container.clientWidth : 280;
    const displayH = 80;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const dark = document.documentElement.classList.contains('dark');

    // Clear
    ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, displayW, displayH);

    const margin = 8;
    const plotW = displayW - 2 * margin;
    const plotH = displayH - 2 * margin;
    const centerY = margin + plotH / 2;
    const amp = plotH * 0.4;

    // Axis line
    ctx.strokeStyle = dark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(margin + plotW, centerY);
    ctx.stroke();

    // Compute the standing wave envelope: |V(z)| = |1 + gamma * e^{-j2kz}|
    // For display, we show the voltage magnitude envelope vs position.
    // z = 0 at load (right side), z increases to the left (toward source).
    const numPoints = 200;
    const numWavelengths = 2; // show 2 wavelengths

    ctx.strokeStyle = dark ? '#34d399' : '#16a34a';
    ctx.lineWidth = 2;

    // Upper envelope
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints; // 0 = left (source side), 1 = right (load side)
      const z = (1 - frac) * numWavelengths; // distance from load in wavelengths
      const kz2 = 2 * (2 * Math.PI) * z;

      // |V(z)| = |1 + gamma * exp(-j * 2kz)|
      // = sqrt((1 + gamma*cos(2kz))^2 + (gamma*sin(2kz))^2)
      // = sqrt(1 + gamma^2 + 2*gamma*cos(2kz))
      const vMag = Math.sqrt(1 + gamma * gamma + 2 * gamma * Math.cos(kz2));

      const px = margin + frac * plotW;
      const py = centerY - vMag * amp / (1 + Math.abs(gamma));

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Lower envelope (mirror)
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      const z = (1 - frac) * numWavelengths;
      const kz2 = 2 * (2 * Math.PI) * z;
      const vMag = Math.sqrt(1 + gamma * gamma + 2 * gamma * Math.cos(kz2));

      const px = margin + frac * plotW;
      const py = centerY + vMag * amp / (1 + Math.abs(gamma));

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Load end marker
    ctx.strokeStyle = dark ? '#f87171' : '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(margin + plotW, margin);
    ctx.lineTo(margin + plotW, margin + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('Source', margin, margin + plotH + 10);
    ctx.textAlign = 'right';
    ctx.fillText('Load', margin + plotW, margin + plotH + 10);
  }, [gamma]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        aria-label={`Standing wave pattern ${index + 1} of 4`}
      />
    </div>
  );
}
