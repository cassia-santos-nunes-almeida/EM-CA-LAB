import { NavLink } from 'react-router-dom';
import { Home, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { PARTS, SECTIONS } from '@shared/constants/curriculum';
import { useThemeStore, useProgressStore, isModuleComplete } from '@shared/store/progressStore';

/**
 * Course sidebar. Renders the 5-Part spine straight from the curriculum config:
 * a "Course Home" link, then each Part as a labelled group of its sections, with
 * a completion badge driven by the progress store. Re-ordering the course is a
 * curriculum edit — this component needs no changes.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useThemeStore();
  const sections = useProgressStore((s) => s.sections);

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-engineering-blue-600 to-engineering-blue-800">
        <h1 className="text-xl font-bold text-white">EM&AC Lab</h1>
        <p className="text-sm text-engineering-blue-200 mt-1">Electromagnetism &amp; Circuit Analysis</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto" aria-label="Course navigation">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm mb-4',
              isActive
                ? 'bg-engineering-blue-50 dark:bg-engineering-blue-900/30 text-engineering-blue-700 dark:text-engineering-blue-300 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
            )
          }
        >
          <Home className="w-4 h-4" />
          <span>Course Home</span>
        </NavLink>

        {PARTS.map((part) => (
          <div key={part.id} className="mb-4">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-2">
              Part {part.number} · {part.title}
            </p>
            <ul className="space-y-1">
              {part.sectionIds.map((id) => {
                const section = SECTIONS[id];
                const done = isModuleComplete(sections[id], id);
                return (
                  <li key={id}>
                    <NavLink
                      to={section.route}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm',
                          isActive
                            ? 'bg-engineering-blue-50 dark:bg-engineering-blue-900/30 text-engineering-blue-700 dark:text-engineering-blue-300 font-semibold border-l-3 border-engineering-blue-600'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
                        )
                      }
                    >
                      <CheckCircle2
                        className={cn('w-4 h-4 shrink-0', done ? 'text-green-500' : 'text-slate-300 dark:text-slate-600')}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{section.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium tracking-wide">
          EM &amp; Circuit Analysis · 6 ECTS
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-0.5">&copy; 2026 LUT University</p>
      </div>
    </aside>
  );
}
