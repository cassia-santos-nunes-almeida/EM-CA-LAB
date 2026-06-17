import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

/**
 * Props for {@link PlausibilityCallout} — the "Does this make sense?" card.
 */
interface PlausibilityCalloutProps {
  /** Kicker line. Default matches the existing inline instances exactly. */
  title?: string;
  /** Callout body — prose, MathWrapper spans, or multiple paragraphs. */
  children: ReactNode;
  /** Additional CSS class names merged onto the card. */
  className?: string;
}

/**
 * The canonical plausibility callout: an engineering-blue tinted card with a
 * left accent bar and an uppercase kicker, placed beside computed results to
 * prompt the sanity-check habit (units, limiting cases, magnitude and bounds).
 *
 * The markup canonizes the pre-existing inline "Does this make sense?"
 * instances (TransmissionLines / LineImpedance / SwitchedCircuits) so they can
 * be migrated here as a pure refactor. The one deliberate divergence: the body
 * is a div rather than a p, so callouts can hold MathWrapper spans and
 * multiple paragraphs.
 */
export function PlausibilityCallout({
  title = 'Does this make sense?',
  children,
  className,
}: PlausibilityCalloutProps) {
  return (
    <div
      className={cn(
        'bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4',
        className,
      )}
    >
      <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
        {title}
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
