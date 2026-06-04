import { cn } from '@shared/utils/cn';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import type { Equation } from '@em/types/index';

interface EquationBoxProps {
  title: string;
  equations: Equation[];
  className?: string;
}

export function EquationBox({ title, equations, className }: EquationBoxProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm',
        className
      )}
    >
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
      <div className="space-y-2">
        {equations.map((eq, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
          >
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 min-w-[5rem] max-w-[7rem] shrink-0">
              {eq.label}
            </span>
            <div className={cn('text-lg', eq.color || 'text-indigo-700 dark:text-indigo-400')}>
              <MathWrapper formula={eq.math} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
