import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/**
 * Props for {@link LabStation} — the docked "virtual laboratory" frame.
 */
interface LabStationProps {
  /** Optional section number shown before the title (e.g. "3.3"). */
  number?: string;
  /** Lab-station title (e.g. "Reflections & Standing Waves"). */
  title: string;
  /** One-line statement of what the learner will explore at this station. */
  objective?: string;
  /** Station contents — typically a prediction prompt followed by the docked simulation. */
  children: ReactNode;
  /** Optional id for deep-linking / scroll targets. */
  id?: string;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * A consistent, discoverable frame that docks an interactive simulation inline
 * with the surrounding theory — the core building block of the "virtual lab"
 * template. It replaces the pattern of burying simulations behind a tab or a
 * blocking prediction gate: the station header makes the lab obvious, and the
 * simulation (passed as children) is always visible.
 */
export function LabStation({
  number,
  title,
  objective,
  children,
  id,
  className,
}: LabStationProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-xl border border-engineering-blue-200 dark:border-engineering-blue-800',
        'bg-white dark:bg-slate-800 shadow-md overflow-hidden',
        className,
      )}
    >
      <div className="flex items-start gap-3 px-5 py-3 border-b border-engineering-blue-100 dark:border-engineering-blue-900/40 bg-engineering-blue-50/60 dark:bg-engineering-blue-900/10">
        <FlaskConical
          className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-widest mb-0.5">
            Interactive Lab
          </p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {number && (
              <span className="font-mono text-sm text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
                {number}
              </span>
            )}
            {title}
          </h2>
          {objective && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
              {objective}
            </p>
          )}
        </div>
      </div>
      <div className="p-5 space-y-6">
        {children}
      </div>
    </section>
  );
}
