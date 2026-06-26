/**
 * PartAccordion — vertical exclusive accordion of the five Course Parts.
 *
 * Uses native <details name="landing-parts"> so the browser enforces the
 * exclusive-open constraint (one Part open at a time) without JavaScript,
 * and hands keyboard + AT support to the user agent for free.
 *
 * IMPORTANT — collapsed children stay MOUNTED:
 *   Native <details> keeps collapsed children in the DOM (they are display-hidden,
 *   not conditionally removed). This means every section <Link> is always present
 *   in the DOM regardless of which Part is open — deep-links and the existing
 *   "Coulomb's Law → /coulomb" test stay green.
 *
 * Progress read-only:
 *   Subscribes to progressStore.sections for visited state. Does NOT write
 *   anything — no markVisited side-effects from the landing.
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  PARTS,
  SECTIONS,
  PART_QUANTITIES,
  PART_SUMMARIES,
  PART_TRACES,
  getSectionNumber,
} from '@shared/constants/curriculum';
import { useProgressStore } from '@shared/store/progressStore';
import { TraceScreen } from '@shared/components/common/TraceScreen';

export function PartAccordion() {
  // Read-only subscription — we never call markVisited from here.
  const sections = useProgressStore((s) => s.sections);

  return (
    <div className="space-y-2" data-testid="part-accordion">
      {PARTS.map((part) => {
        const n = part.number;
        const accentVar = `--color-part-${n}`;
        const accentBgVar = `--color-part-${n}-bg`;
        const labelVar = `--color-part-${n}-label`;
        const traceKind = PART_TRACES[n];
        const firstSection = SECTIONS[part.sectionIds[0]];
        const summary = PART_SUMMARIES[n];

        // Per-Part visited count for the progress bar
        const visitedCount = part.sectionIds.filter((id) => sections[id]?.visited).length;
        const total = part.sectionIds.length;
        const progressPct = total > 0 ? (visitedCount / total) * 100 : 0;

        return (
          <details
            key={part.id}
            name="landing-parts"
            className="group rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--color-card-border)',
              borderLeftWidth: '4px',
              borderLeftColor: `var(${accentVar})`,
            }}
            data-part={n}
          >
            {/* ── Collapsed summary row ──────────────────────────────────── */}
            <summary
              className="part-summary flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
              style={{ background: `var(${accentBgVar})` }}
              data-testid={`part-summary-${n}`}
            >
              {/* Remove default marker (cross-browser) */}
              {/* Trace spark */}
              <TraceScreen
                traceKind={traceKind}
                accentVar={`--color-part-${n}`}
                size="spark"
                className="shrink-0"
              />

              {/* Mono PART 0N · QUANTITY tag */}
              <span
                className="font-mono text-[10px] font-bold tracking-widest shrink-0"
                style={{ color: `var(${labelVar})` }}
              >
                PART {String(n).padStart(2, '0')} · {PART_QUANTITIES[n]}
              </span>

              {/* Part title */}
              <span
                className="flex-1 text-base font-semibold truncate"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-title)' }}
              >
                {part.title}
              </span>

              {/* Section count */}
              <span
                className="font-mono text-[10px] shrink-0 hidden sm:block"
                style={{ color: 'var(--color-muted)' }}
                data-testid={`section-count-${n}`}
              >
                {total} section{total !== 1 ? 's' : ''}
              </span>

              {/* Chevron — rotates 180° when open via CSS */}
              <ChevronIcon accentVar={accentVar} />
            </summary>

            {/* ── Open body (2-column) ───────────────────────────────────── */}
            <div
              className="px-5 py-5 grid gap-6 md:grid-cols-[1fr_auto]"
              style={{ background: 'var(--color-card)' }}
            >
              {/* LEFT — clickable section list */}
              <ul className="space-y-1.5" aria-label={`${part.title} sections`}>
                {part.sectionIds.map((id) => {
                  const sec = SECTIONS[id];
                  const visited = sections[id]?.visited ?? false;
                  const secNum = getSectionNumber(id);
                  return (
                    <li key={id} className="flex items-center gap-2.5">
                      {/* Dot: filled = visited, hollow = not yet */}
                      <SectionDot visited={visited} accentVar={accentVar} />

                      {/* Section number */}
                      <span
                        className="font-mono text-[10px] shrink-0"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {secNum}
                      </span>

                      {/* Section link */}
                      <Link
                        to={sec.route}
                        className="text-sm rounded-sm transition-colors hover:text-cta hover:underline focus:outline-none focus:ring-2 focus:ring-cta"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {sec.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* RIGHT — bigger trace screen + summary + CTA + progress */}
              <div className="flex flex-col gap-3 md:min-w-[200px] md:max-w-[220px]">
                {/* Bigger trace screen */}
                <TraceScreen
                  traceKind={traceKind}
                  accentVar={`--color-part-${n}`}
                  size="screen"
                  className="self-start"
                />

                {/* One-line Part summary */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {summary}
                </p>

                {/* Start Part CTA */}
                <Link
                  to={firstSection.route}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 focus:outline-none focus:ring-2 focus:ring-cta rounded-sm mt-auto"
                  style={{ color: `var(${accentVar})` }}
                  data-testid={`start-part-${n}`}
                  aria-label={`Start Part ${n}: ${part.title}`}
                >
                  Start Part {n}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                {/* Per-Part progress bar */}
                <div>
                  <div
                    className="flex items-center justify-between mb-1 font-mono text-[9px]"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <span>{visitedCount} / {total} visited</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-card-border)' }}
                    role="progressbar"
                    aria-valuenow={visitedCount}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label={`Part ${n} progress: ${visitedCount} of ${total} sections visited`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        background: `var(${accentVar})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Chevron icon that rotates 180° when the parent <details> is open.
 * Uses the CSS `group-open` pseudo-class selector via Tailwind.
 */
function ChevronIcon({ accentVar }: { accentVar: string }) {
  return (
    <svg
      className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ color: `var(${accentVar})` }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Accent dot: filled circle when visited, ring outline when not.
 */
function SectionDot({
  visited,
  accentVar,
}: {
  visited: boolean;
  accentVar: string;
}) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 border"
      style={{
        borderColor: `var(${accentVar})`,
        backgroundColor: visited ? `var(${accentVar})` : 'transparent',
      }}
      aria-hidden="true"
      data-visited={visited}
    />
  );
}
