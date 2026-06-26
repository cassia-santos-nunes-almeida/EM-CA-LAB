import { NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun, ChevronLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import {
  PARTS,
  SECTIONS,
  PART_QUANTITIES,
  PART_TRACES,
  getSectionNumber,
} from '@shared/constants/curriculum';
import { useThemeStore, useProgressStore, isModuleComplete } from '@shared/store/progressStore';
import { useScrollSpy } from '@shared/hooks/useScrollSpy';
import { TraceScreen } from '@shared/components/common/TraceScreen';
import { SidebarIconRail } from '@shared/components/layout/SidebarIconRail';
import { useSidebarCollapse } from '@shared/components/layout/useSidebarCollapse';

/** Total number of course sections — the course-progress denominator. */
const TOTAL_SECTIONS = Object.keys(SECTIONS).length;

/**
 * Course sidebar — the 3-level scroll-spy navigation (spec §2.2).
 *
 * Level 1 · Part   — native `<details>` per Part (NO `name=`, so they're
 *                    non-exclusive: opening another Part to look ahead does not
 *                    collapse the current one). The Part containing the active
 *                    route is auto-open.
 * Level 2 · Section — the Part's sections as NavLinks: tinted pill + bold when
 *                    active, a live LED dot for the active section, a filled dot
 *                    for visited, an empty ring for unvisited; a per-Part `n/N`
 *                    completion badge.
 * Level 3 · Subsection — under the ACTIVE section only, the scroll-spy anchors
 *                    render as a nested list of smooth-scroll links (filled dot
 *                    for scrolled-past, live LED for the in-view one). Graceful
 *                    when there are no anchors (renders nothing).
 *
 * Collapse — `useSidebarCollapse` resolves the §5 precedence; when it reports
 * `collapsed` we render the 58 px `SidebarIconRail` instead of the accordion.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useThemeStore();
  const sections = useProgressStore((s) => s.sections);
  const { pathname } = useLocation();
  const { anchors, activeId, scrollToAnchor } = useScrollSpy();
  const { collapsed, isAutoCollapsed, toggleCollapse, expandWithPin } = useSidebarCollapse();

  // When collapsed (manual or auto), render the narrow icon-rail instead.
  if (collapsed) {
    return <SidebarIconRail onNavigate={onNavigate} onExpand={expandWithPin} />;
  }

  // The section id of the active route (drives level-2 highlight + level-3 host).
  const activeSectionId =
    Object.values(SECTIONS).find((s) => s.route === pathname)?.id ?? null;

  // Course-wide completion (done / total).
  const doneCount = Object.keys(SECTIONS).filter((id) =>
    isModuleComplete(sections[id], id),
  ).length;

  // Index of the currently-in-view anchor (for level-3 scrolled-past dots).
  const activeAnchorIndex = anchors.findIndex((a) => a.id === activeId);

  return (
    <aside className="w-64 bg-rail border-r border-card-border flex flex-col h-full">
      {/* ── Top band: brand + theme + collapse + course progress ───────────── */}
      <div className="p-4 border-b border-card-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold text-title">
              <span
                className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] motion-reduce:shadow-none"
                aria-hidden="true"
              />
              EM&amp;AC Lab
            </h1>
            <p className="text-sm text-muted mt-1">Electromagnetism &amp; Circuit Analysis</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted hover:text-title hover:bg-chassis transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2 rounded-lg text-muted hover:text-title hover:bg-chassis transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isAutoCollapsed && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted">
            auto-collapsed for the bench
          </p>
        )}

        {/* Course-wide progress bar (done / total). */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Course progress
            </span>
            <span className="font-mono text-[10px] font-bold text-title">
              {doneCount}/{TOTAL_SECTIONS}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-chassis overflow-hidden">
            <div
              className="h-full rounded-full bg-led transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(doneCount / TOTAL_SECTIONS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Nav area: 3-level accordion ────────────────────────────────────── */}
      <nav className="flex-1 p-3 overflow-y-auto" aria-label="Course navigation">
        {PARTS.map((part) => {
          const accent = `var(--color-part-${part.number})`;
          const labelColor = `var(--color-part-${part.number}-label)`;
          const partBg = `var(--color-part-${part.number}-bg)`;

          // Auto-open the Part that contains the active route.
          const partHasActive = part.sectionIds.some(
            (id) => SECTIONS[id]?.route === pathname,
          );
          // Per-Part completion badge.
          const partDone = part.sectionIds.filter((id) =>
            isModuleComplete(sections[id], id),
          ).length;

          return (
            <details
              key={part.id}
              open={partHasActive ? true : undefined}
              className="mb-2 group"
            >
              <summary
                className="list-none cursor-pointer flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-chassis transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
                title={part.title}
              >
                <TraceScreen
                  traceKind={PART_TRACES[part.number]}
                  accentVar={`--color-part-${part.number}`}
                  size="spark"
                />
                <span className="flex-1 min-w-0">
                  <span
                    className="block font-mono text-[10px] font-bold uppercase tracking-widest truncate"
                    style={{ color: labelColor }}
                  >
                    PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
                  </span>
                  <span className="sr-only">{part.title}</span>
                </span>
                <span
                  className="font-mono text-[10px] font-bold tabular-nums shrink-0"
                  style={{ color: partDone === part.sectionIds.length ? 'var(--color-led)' : labelColor }}
                  aria-label={`${partDone} of ${part.sectionIds.length} sections complete`}
                >
                  {partDone}/{part.sectionIds.length}
                </span>
              </summary>

              {/* Level 2 — section list. */}
              <ul className="mt-1 mb-1 space-y-0.5 pl-1">
                {part.sectionIds.map((id) => {
                  const section = SECTIONS[id];
                  const done = isModuleComplete(sections[id], id);
                  const visited = sections[id]?.visited ?? false;
                  const isActiveSection = id === activeSectionId;

                  return (
                    <li key={id}>
                      <NavLink
                        to={section.route}
                        onClick={onNavigate}
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? partBg : undefined,
                          borderLeftColor: isActive ? accent : 'transparent',
                        })}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-md border-l-[3px] transition-colors text-sm',
                            isActive
                              ? 'text-title font-semibold'
                              : 'text-muted hover:bg-chassis hover:text-title',
                          )
                        }
                      >
                        {/* Dot indicator: LED (active) / filled (visited) / ring (unvisited). */}
                        {isActiveSection ? (
                          <span
                            data-testid={`section-led-${id}`}
                            className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] shrink-0 motion-reduce:shadow-none"
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              done || visited
                                ? 'bg-current opacity-70'
                                : 'bg-transparent ring-1 ring-current opacity-40',
                            )}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className="font-mono text-[10px] text-muted w-7 shrink-0 tabular-nums"
                          aria-hidden="true"
                        >
                          {getSectionNumber(id)}
                        </span>
                        <span className="flex-1">{section.title}</span>
                      </NavLink>

                      {/* Level 3 — subsection scroll-spy TOC (active section only). */}
                      {isActiveSection && anchors.length > 0 && (
                        <ul className="mt-0.5 mb-1 ml-[14px] pl-3 border-l border-card-border space-y-0.5">
                          {anchors.map((anchor, idx) => {
                            const anchorActive = anchor.id === activeId;
                            const scrolledPast =
                              activeAnchorIndex >= 0 && idx < activeAnchorIndex;
                            return (
                              <li key={anchor.id}>
                                <button
                                  type="button"
                                  onClick={() => scrollToAnchor(anchor.id)}
                                  className={cn(
                                    'flex items-center gap-2 w-full text-left pl-1 pr-2 py-1 rounded text-xs transition-colors',
                                    anchorActive
                                      ? 'text-title font-medium'
                                      : 'text-muted hover:text-title',
                                  )}
                                  aria-current={anchorActive ? 'location' : undefined}
                                >
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full shrink-0',
                                      anchorActive
                                        ? 'bg-led shadow-[0_0_5px_var(--color-led)] motion-reduce:shadow-none'
                                        : scrolledPast
                                          ? 'bg-current opacity-60'
                                          : 'bg-transparent ring-1 ring-current opacity-40',
                                    )}
                                    aria-hidden="true"
                                  />
                                  <span className="flex-1 truncate">{anchor.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </nav>

      {/* ── Bottom: Course home ────────────────────────────────────────────── */}
      <div className="p-3 border-t border-card-border">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm',
              isActive
                ? 'bg-chassis text-title font-semibold'
                : 'text-muted hover:bg-chassis hover:text-title',
            )
          }
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>Course Home</span>
        </NavLink>
        <p className="text-[10px] text-muted text-center mt-3 font-medium tracking-wide">
          EM &amp; Circuit Analysis · 6 ECTS
        </p>
        <p className="text-[10px] text-muted text-center mt-0.5">&copy; 2026 LUT University</p>
      </div>
    </aside>
  );
}
