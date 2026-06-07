import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PARTS, SECTIONS, PART_QUANTITIES } from '@shared/constants/curriculum';

/**
 * Course landing page (route `/`). One entry point onto the 5-Part spine, styled
 * in the "Lab Instrument" light palette: cool-grey chassis, white cards, a 4px
 * per-Part accent border and a mono `PART 0N · QUANTITY` tag. Section names
 * deep-link into each section.
 */
export function CourseLanding() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl mx-auto text-center">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-2">
          Five instruments · one bench
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-title">
          Electromagnetism &amp; Circuit Analysis
        </h1>
        <p className="mt-3 text-muted">
          Predict, then observe. Work through the five parts in order, or jump straight to any
          section from the sidebar.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PARTS.map((part) => {
          const first = SECTIONS[part.sectionIds[0]];
          const accent = `var(--color-part-${part.number})`;
          const labelColor = `var(--color-part-${part.number}-label)`;
          return (
            <div
              key={part.id}
              className="flex flex-col rounded-xl border border-l-4 border-card-border bg-card p-6 shadow-sm"
              style={{ borderLeftColor: accent }}
            >
              <p
                className="font-mono text-[10px] font-bold tracking-widest mb-1"
                style={{ color: labelColor }}
              >
                PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
              </p>
              <h2 className="text-lg font-bold text-title mb-3">{part.title}</h2>
              <ul className="text-sm text-muted space-y-1 mb-4 flex-1">
                {part.sectionIds.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />
                    <Link
                      to={SECTIONS[id].route}
                      className="rounded-sm transition-colors hover:text-cta hover:underline focus:outline-none focus:ring-2 focus:ring-cta"
                    >
                      {SECTIONS[id].title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={first.route}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-cta transition-all hover:gap-2.5"
              >
                Start Part {part.number}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
