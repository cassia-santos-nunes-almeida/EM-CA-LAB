import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PARTS, SECTIONS } from '@shared/constants/curriculum';

/**
 * Course landing page (route `/`). Replaces the three separate module overviews
 * with one entry point showing the 5-Part spine. Phase 0: structure only, no new
 * content — Part cards link to the first section of each Part.
 */
export function CourseLanding() {
  return (
    <div className="space-y-8">
      <header className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
          Electromagnetism &amp; Circuit Analysis
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          An interactive virtual laboratory. Work through the five parts in order, or jump straight to any section
          from the sidebar.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PARTS.map((part) => {
          const first = SECTIONS[part.sectionIds[0]];
          return (
            <div
              key={part.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-engineering-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  {part.number}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{part.title}</h2>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-4 flex-1">
                {part.sectionIds.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-engineering-blue-400 shrink-0" aria-hidden="true" />
                    {SECTIONS[id].title}
                  </li>
                ))}
              </ul>
              <Link
                to={first.route}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-engineering-blue-600 dark:text-engineering-blue-400 hover:gap-2.5 transition-all"
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
