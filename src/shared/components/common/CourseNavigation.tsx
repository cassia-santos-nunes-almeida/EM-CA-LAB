import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdjacentSections } from '@shared/constants/curriculum';

interface CourseNavigationProps {
  /**
   * Current section id. If omitted, it is derived from the route (pathname minus
   * the leading slash) — this supports both explicit callers (`currentSectionId`)
   * and the older prop-less call sites.
   */
  currentSectionId?: string;
}

/**
 * Course-wide previous/next navigation along the curriculum spine. Unlike the
 * old per-module ModuleNavigation, prev/next here cross Part boundaries, so the
 * last section of Part 1 links forward to the first section of Part 2, etc.
 */
export function CourseNavigation({ currentSectionId }: CourseNavigationProps) {
  const location = useLocation();
  const id = currentSectionId ?? location.pathname.replace(/^\//, '');
  const { prev, next } = getAdjacentSections(id);

  if (!prev && !next) return null;

  return (
    <nav
      className="flex items-center justify-between pt-8 mt-8 border-t border-slate-200 dark:border-slate-700"
      aria-label="Course navigation"
    >
      {prev ? (
        <Link
          to={prev.route}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Previous</p>
            <p>{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={next.route}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-engineering-blue-600 dark:text-engineering-blue-400 hover:bg-engineering-blue-50 dark:hover:bg-engineering-blue-900/20 transition-colors"
        >
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Next</p>
            <p>{next.title}</p>
          </div>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
