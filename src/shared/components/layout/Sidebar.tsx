import { NavLink } from 'react-router-dom';
import { Home, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { PARTS, SECTIONS, PART_QUANTITIES } from '@shared/constants/curriculum';
import { useThemeStore, useProgressStore, isModuleComplete } from '@shared/store/progressStore';

/**
 * Course sidebar. Renders the 5-Part spine from the curriculum config in the
 * "Lab Instrument" palette: a neutral white masthead with a green "live" LED,
 * each Part labelled by a mono `PART 0N · QUANTITY` eyebrow (Variant B: the full
 * descriptive title is sr-only + a hover title, not a resting line), completion
 * shown by a green LED check, and the active section marked with its Part-accent edge.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useThemeStore();
  const sections = useProgressStore((s) => s.sections);

  return (
    <aside className="w-64 bg-card border-r border-card-border flex flex-col h-full">
      <div className="p-6 border-b border-card-border">
        <h1 className="flex items-center gap-2 text-xl font-bold text-title">
          <span
            className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)]"
            aria-hidden="true"
          />
          EM&amp;AC Lab
        </h1>
        <p className="text-sm text-muted mt-1">Electromagnetism &amp; Circuit Analysis</p>
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
                ? 'bg-chassis text-title font-semibold'
                : 'text-muted hover:bg-chassis hover:text-title',
            )
          }
        >
          <Home className="w-4 h-4" />
          <span>Course Home</span>
        </NavLink>

        {PARTS.map((part) => {
          const accent = `var(--color-part-${part.number})`;
          const labelColor = `var(--color-part-${part.number}-label)`;
          return (
            <div key={part.id} className="mb-4">
              <p
                className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-2"
                style={{ color: labelColor }}
                title={part.title}
              >
                PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
                <span className="sr-only"> — {part.title}</span>
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
                        style={({ isActive }) =>
                          isActive ? { borderLeftWidth: '3px', borderLeftColor: accent } : undefined
                        }
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm',
                            isActive
                              ? 'bg-chassis text-title font-semibold'
                              : 'text-muted hover:bg-chassis hover:text-title',
                          )
                        }
                      >
                        <CheckCircle2
                          className={cn(
                            'w-4 h-4 shrink-0',
                            done ? 'text-led' : 'text-slate-300 dark:text-slate-600',
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{section.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-card-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm font-medium bg-chassis text-muted hover:text-title transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <p className="text-[10px] text-muted text-center font-medium tracking-wide">
          EM &amp; Circuit Analysis · 6 ECTS
        </p>
        <p className="text-[10px] text-muted text-center mt-0.5">&copy; 2026 LUT University</p>
      </div>
    </aside>
  );
}
