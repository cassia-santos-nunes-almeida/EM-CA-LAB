import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';
import { useThemeStore } from '@shared/store/progressStore';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { cn } from '@shared/utils/cn';
import {
  buildResponsePoints,
  TERM_KEYS,
  TERM_LABELS,
  RESPONSE_T_MAX,
  FINAL_VALUE,
  type TermKey,
} from '@circuits/components/modules/PartialFractions/coverUpData';

interface ResponsePlotProps {
  /** Which of the three inverse-transform terms are currently enabled. */
  checked: Record<TermKey, boolean>;
  /** Toggle one term on/off. */
  onToggle: (term: TermKey) => void;
}

/** A "free error detector" chip: a theorem audit that goes green only when the
 *  partial sum matches the target curve (i.e. all three terms are enabled). */
function DetectorChip({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs',
        ok
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
          : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50',
      )}
    >
      <p className={cn(
        'font-mono font-semibold',
        ok ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-300',
      )}>
        {label}{' '}
        <span aria-live="polite" className="uppercase tracking-wide">
          {ok ? 'verified' : 'awaiting all terms'}
        </span>
      </p>
      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
    </div>
  );
}

/**
 * Term-assembly plot for the flagship response: the dashed reference is the
 * full target f(t); the solid line is the sum of whichever terms are checked.
 * The partial sum snaps onto the target only when every pole is paid.
 */
export function ResponsePlot({ checked, onToggle }: ResponsePlotProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
    target: isDark ? '#94a3b8' : '#64748b',
  };

  const data = useMemo(() => buildResponsePoints(checked), [checked]);
  const allChecked = TERM_KEYS.every((key) => checked[key]);

  return (
    <div className="space-y-4">
      <fieldset className="border-0 p-0 m-0">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Assemble f(t) term by term
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TERM_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <input
                id={`coverup-term-${key}`}
                type="checkbox"
                checked={checked[key]}
                onChange={() => onToggle(key)}
                aria-label={TERM_LABELS[key].text}
                className="w-4 h-4 accent-engineering-blue-600"
              />
              <label
                htmlFor={`coverup-term-${key}`}
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <MathWrapper formula={TERM_LABELS[key].katex} />
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="t"
            type="number"
            domain={[0, RESPONSE_T_MAX]}
            ticks={[0, 0.3, 0.6, 0.9, 1.2]}
            tick={{ fill: chartColors.text }}
            label={{ value: 'Time t (s)', position: 'insideBottom', offset: -5, fill: chartColors.text }}
          />
          <YAxis
            domain={[-10, 12]}
            tick={{ fill: chartColors.text }}
            label={{ value: 'f(t)', angle: -90, position: 'insideLeft', fill: chartColors.text }}
          />
          <Legend verticalAlign="top" height={28} />
          <Line
            name="target f(t)"
            type="monotone"
            dataKey="target"
            stroke={chartColors.target}
            strokeDasharray="6 3"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
          <Line
            name="partial sum"
            type="monotone"
            dataKey="partial"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2">
        <DetectorChip
          ok={allChecked}
          label="f(0⁺) = 0 ·"
          detail="initial-value theorem — the degree gap is 2, so the response must start from zero (the residues sum to 0)"
        />
        <DetectorChip
          ok={allChecked}
          label={`f(∞) = ${FINAL_VALUE} ·`}
          detail="final-value theorem — lim s→0 of sF(s) = 96·5/48 = 10, and only the 1/s term survives as t → ∞"
        />
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
        The residue is each pole's weight in the response — the partial sum snaps onto the
        target only when every pole is paid.
      </p>
    </div>
  );
}
