import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeftOpen } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import {
  PARTS,
  SECTIONS,
  PART_QUANTITIES,
  PART_TRACES,
  getSectionNumber,
} from '@shared/constants/curriculum';
import { useProgressStore, isModuleComplete } from '@shared/store/progressStore';
import { TraceScreen } from '@shared/components/common/TraceScreen';

/**
 * SidebarIconRail — the 58 px collapsed variant of the course sidebar (spec §2.4).
 *
 * A narrow column of five Part chips plus an expand-toggle at the top. The chip
 * for the Part containing the active route is filled (Part accent) and carries
 * the live LED; the others are muted/outline.
 *
 * Keyboard-reachability (spec §6): each chip is a native `<details>/<summary>`
 * so the flyout opens by Tab→Enter/Space with no mouse — `<summary>` is a real
 * focusable, toggleable control. We additionally open the flyout on focus/hover
 * (and keep it open while focus moves THROUGH its links via a blur timeout), so
 * tabbing into the chip reveals the section list and tabbing on through the links
 * keeps it visible. This is intentionally NOT hover-only CSS.
 */
export function SidebarIconRail({ onNavigate }: { onNavigate?: () => void }) {
  const sections = useProgressStore((s) => s.sections);
  const setSidebarCollapsed = useProgressStore((s) => s.setSidebarCollapsed);
  const toggleSidebarCollapsed = useProgressStore((s) => s.toggleSidebarCollapsed);
  const { pathname } = useLocation();

  const activePart = PARTS.find((part) =>
    part.sectionIds.some((id) => SECTIONS[id]?.route === pathname),
  );

  // Which chip's flyout is open (by Part id). Driven by focus/hover, not :hover.
  const [openPart, setOpenPart] = useState<string | null>(null);
  // A per-chip blur timer so focus moving through the flyout links keeps it open.
  const blurTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = blurTimers.current;
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

  const openFlyout = (partId: string) => {
    const t = blurTimers.current[partId];
    if (t) clearTimeout(t);
    setOpenPart(partId);
  };

  const scheduleClose = (partId: string) => {
    const t = blurTimers.current[partId];
    if (t) clearTimeout(t);
    // Small delay so focus can land on a flyout link before we close it.
    blurTimers.current[partId] = setTimeout(() => {
      setOpenPart((prev) => (prev === partId ? null : prev));
    }, 120);
  };

  const expand = () => {
    // Defensive: write the explicit value AND honor the toggle contract from
    // the task spec so either persistence path lands on "expanded".
    setSidebarCollapsed(false);
    if (useProgressStore.getState().sidebarCollapsed) {
      toggleSidebarCollapsed();
    }
  };

  return (
    <aside
      className="w-[58px] bg-rail border-r border-card-border flex flex-col h-full items-center"
      aria-label="Course navigation (collapsed)"
    >
      <div className="w-full flex justify-center py-3 border-b border-card-border">
        <button
          type="button"
          onClick={expand}
          className="p-2 rounded-lg text-muted hover:text-title hover:bg-chassis transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 w-full overflow-y-auto overflow-x-visible py-2 flex flex-col items-center gap-1">
        {PARTS.map((part) => {
          const accent = `var(--color-part-${part.number})`;
          const isCurrent = activePart?.id === part.id;
          const isOpen = openPart === part.id;
          return (
            <details
              key={part.id}
              open={isOpen}
              className="relative w-full flex flex-col items-center"
            >
              <summary
                onFocus={() => openFlyout(part.id)}
                onBlur={() => scheduleClose(part.id)}
                onMouseEnter={() => openFlyout(part.id)}
                onMouseLeave={() => scheduleClose(part.id)}
                onClick={(e) => {
                  // Native <details> toggles `open` on summary click; mirror that
                  // into our controlled state so focus/hover and click agree.
                  e.preventDefault();
                  setOpenPart((prev) => (prev === part.id ? null : part.id));
                }}
                className={cn(
                  'list-none cursor-pointer flex flex-col items-center justify-center gap-1 w-11 h-12 rounded-lg transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none',
                  isCurrent
                    ? 'font-bold text-title'
                    : 'text-muted hover:text-title hover:bg-chassis',
                )}
                style={
                  isCurrent
                    ? { backgroundColor: `var(--color-part-${part.number}-bg)`, boxShadow: `inset 0 0 0 1.5px ${accent}` }
                    : undefined
                }
                aria-label={`Part ${part.number}: ${part.title}`}
                title={`PART ${String(part.number).padStart(2, '0')} · ${PART_QUANTITIES[part.number]}`}
              >
                <span className="relative inline-flex items-center">
                  <TraceScreen
                    traceKind={PART_TRACES[part.number]}
                    accentVar={`--color-part-${part.number}`}
                    size="spark"
                    className="!w-7"
                  />
                  {isCurrent && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] motion-reduce:shadow-none"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="font-mono text-[9px] font-bold leading-none">
                  {String(part.number).padStart(2, '0')}
                </span>
              </summary>

              {/* Flyout panel — section list for this Part. */}
              <div
                onFocus={() => openFlyout(part.id)}
                onBlur={() => scheduleClose(part.id)}
                onMouseEnter={() => openFlyout(part.id)}
                onMouseLeave={() => scheduleClose(part.id)}
                className={cn(
                  'absolute left-[58px] top-0 z-50 w-60 rounded-lg border border-card-border bg-card shadow-lg p-2',
                  'transition-opacity duration-150 motion-reduce:transition-none',
                  isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
              >
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 pt-1 pb-2"
                  style={{ color: `var(--color-part-${part.number}-label)` }}
                >
                  PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
                  <span className="sr-only"> — {part.title}</span>
                </p>
                <ul className="space-y-0.5">
                  {part.sectionIds.map((id) => {
                    const section = SECTIONS[id];
                    const done = isModuleComplete(sections[id], id);
                    return (
                      <li key={id}>
                        <NavLink
                          to={section.route}
                          onClick={() => {
                            setOpenPart(null);
                            onNavigate?.();
                          }}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                              isActive
                                ? 'bg-chassis text-title font-semibold'
                                : 'text-muted hover:bg-chassis hover:text-title',
                            )
                          }
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              done ? 'bg-led' : 'bg-transparent ring-1 ring-current opacity-50',
                            )}
                            aria-hidden="true"
                          />
                          <span
                            className="font-mono text-[10px] text-muted w-7 shrink-0"
                            aria-hidden="true"
                          >
                            {getSectionNumber(id)}
                          </span>
                          <span className="flex-1">{section.title}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          );
        })}
      </nav>
    </aside>
  );
}
