import type { ReactNode } from 'react';
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
}

/**
 * Two-column chapter layout for an interactive lab: theory reads down the left
 * column while the lab bench is pinned in a sticky right column, so the
 * simulation never scrolls out of view (the core of the "docked bench"
 * idea — sims can't get buried). The sticky bench is capped to the viewport
 * height with its own internal scroll, so a tall simulation cannot break out of
 * the sticky region. Below the `lg` breakpoint the two panes stack into a single
 * column (theory first, then the bench) for phones and narrow windows.
 */
export function LabLayout({ theory, bench, className }: LabLayoutProps) {
  return (
    <div
      className={cn(
        'grid items-start gap-6 lg:gap-8',
        'lg:grid-cols-[1fr_minmax(360px,42%)]',
        className,
      )}
    >
      <div className="min-w-0">{theory}</div>
      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
        {bench}
      </div>
    </div>
  );
}
