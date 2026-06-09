import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/**
 * Props for {@link LabLayout} — the split-pane "lab bench" chapter layout.
 */
interface LabLayoutProps {
  /** The reading content (theory, concept checks, callouts). Scrolls normally. */
  theory: ReactNode;
  /** The interactive lab bench (a LabStation framing a gated simulation). */
  bench: ReactNode;
  /** Additional CSS class names for the grid wrapper. */
  className?: string;
  /** Stable id applied to the bench wrapper so an in-page "Jump to lab" anchor can target it. */
  benchId?: string;
  /** When set (with benchId), renders a sub-lg "Jump to lab" anchor at the top of the theory column. */
  jumpLabel?: string;
}

/**
 * Two-column chapter layout for an interactive lab: theory reads down the left
 * column while the lab bench is pinned in a sticky right column, so the
 * simulation never scrolls out of view. Below `lg` the two panes stack into a
 * single column (theory first, then bench); when `benchId`+`jumpLabel` are
 * provided, a sub-lg "Jump to lab" anchor lets phone users skip the theory
 * column straight to the live bench.
 */
export function LabLayout({ theory, bench, className, benchId, jumpLabel }: LabLayoutProps) {
  return (
    <div
      className={cn(
        'grid items-start gap-6 lg:gap-8',
        'lg:grid-cols-[1fr_minmax(420px,48%)]',
        className,
      )}
    >
      <div className="min-w-0">
        {jumpLabel && benchId && (
          <a
            href={`#${benchId}`}
            className="lg:hidden inline-flex items-center gap-1.5 mb-4 rounded-md px-3 py-1.5 text-sm font-medium text-engineering-blue-700 dark:text-engineering-blue-400 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 hover:bg-engineering-blue-100 dark:hover:bg-engineering-blue-900/30 transition-colors"
          >
            {jumpLabel}
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
        {theory}
      </div>
      <div
        id={benchId}
        tabIndex={benchId ? -1 : undefined}
        className="scroll-mt-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1"
      >
        {bench}
      </div>
    </div>
  );
}
