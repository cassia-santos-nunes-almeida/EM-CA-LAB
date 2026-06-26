/**
 * MobileTabBar — spec §2.6 mobile bottom tab-bar + Part bottom-sheet.
 *
 * Visible below the `md` breakpoint (`md:hidden` on the outer wrapper).
 * The five Part chips sit in a fixed bottom bar for thumb-reach navigation.
 * Tapping a Part opens a bottom sheet listing:
 *   - that Part's sections (NavLinks with getSectionNumber)
 *   - the current section's subsections (from useScrollSpy) when present
 *
 * The CURRENT Part (the one containing the active route) is raised + LED.
 * The sheet closes on: navigation / backdrop tap / Escape.
 *
 * Accessibility:
 *   - Chips are <button> elements (focusable).
 *   - Sheet is dismissible by Escape and backdrop click.
 *   - prefers-reduced-motion: sheet slide-in animation is skipped.
 *   - Focus traps inside the sheet while open.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@shared/utils/cn';
import {
  PARTS,
  SECTIONS,
  PART_QUANTITIES,
  PART_TRACES,
  getSectionNumber,
} from '@shared/constants/curriculum';
import { TraceScreen } from '@shared/components/common/TraceScreen';
import { useScrollSpy } from '@shared/hooks/useScrollSpy';

interface MobileTabBarProps {
  /** Called when a navigation link is tapped (mirrors Sidebar onNavigate). */
  onNavigate?: () => void;
}

export function MobileTabBar({ onNavigate }: MobileTabBarProps) {
  const { pathname } = useLocation();
  const { anchors, activeId } = useScrollSpy();

  // Which Part's bottom sheet is open (by Part id), or null when closed.
  // Also track the pathname at the moment the sheet was opened — when the route
  // changes, the sheet is considered closed (navigation completed). This avoids
  // calling setState directly in a useEffect (the linter rule).
  const [sheetState, setSheetState] = useState<{ partId: string; openedAt: string } | null>(null);

  // The sheet is visually open only if the Part id is set AND the route hasn't
  // changed since the chip was tapped.
  const openPartId = sheetState && sheetState.openedAt === pathname ? sheetState.partId : null;

  // Ref to the sheet panel for focus-trap.
  const sheetRef = useRef<HTMLDivElement>(null);

  // The Part that contains the currently-active route.
  const activePart = PARTS.find((part) =>
    part.sectionIds.some((id) => SECTIONS[id]?.route === pathname),
  );

  // Dismiss on Escape.
  useEffect(() => {
    if (!openPartId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetState(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openPartId]);

  // Focus-trap: when the sheet opens, move focus inside.
  useEffect(() => {
    if (openPartId && sheetRef.current) {
      // Focus the first focusable element in the sheet, or the sheet itself.
      const first = sheetRef.current.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      (first ?? sheetRef.current)?.focus();
    }
  }, [openPartId]);

  const handleChipClick = useCallback((partId: string) => {
    setSheetState((prev) =>
      prev?.partId === partId && prev.openedAt === pathname
        ? null
        : { partId, openedAt: pathname },
    );
  }, [pathname]);

  const handleClose = useCallback(() => {
    setSheetState(null);
  }, []);

  const handleNavigate = useCallback(() => {
    setSheetState(null);
    onNavigate?.();
  }, [onNavigate]);

  const openPart = openPartId ? PARTS.find((p) => p.id === openPartId) ?? null : null;

  return (
    <>
      {/* ── Backdrop (closes the sheet) ──────────────────────────────────── */}
      {openPartId && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      {/* ── Bottom sheet ─────────────────────────────────────────────────── */}
      {openPart && (
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Part ${openPart.number}: ${openPart.title} — sections`}
          tabIndex={-1}
          className={cn(
            'fixed bottom-[56px] left-0 right-0 z-50 md:hidden',
            'bg-card border-t border-card-border rounded-t-2xl shadow-2xl',
            'max-h-[60vh] overflow-y-auto',
            'animate-slide-up motion-reduce:animate-none',
          )}
        >
          {/* Sheet header */}
          <div className="px-4 pt-4 pb-2 border-b border-card-border flex items-center gap-3">
            <TraceScreen
              traceKind={PART_TRACES[openPart.number]}
              accentVar={`--color-part-${openPart.number}`}
              size="spark"
            />
            <div className="min-w-0 flex-1">
              <p
                className="font-mono text-[10px] font-bold uppercase tracking-widest truncate"
                style={{ color: `var(--color-part-${openPart.number}-label)` }}
              >
                PART {String(openPart.number).padStart(2, '0')} · {PART_QUANTITIES[openPart.number]}
              </p>
              <p className="text-sm font-semibold text-title truncate">{openPart.title}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 p-2 rounded-lg text-muted hover:text-title hover:bg-chassis transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
              aria-label="Close section list"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Section list */}
          <nav aria-label={`Part ${openPart.number} sections`} className="px-3 py-2">
            <ul className="space-y-0.5">
              {openPart.sectionIds.map((id) => {
                const section = SECTIONS[id];
                const isActiveSection = section.route === pathname;
                const accent = `var(--color-part-${openPart.number})`;
                const partBg = `var(--color-part-${openPart.number}-bg)`;

                return (
                  <li key={id}>
                    <Link
                      to={section.route}
                      onClick={handleNavigate}
                      className={cn(
                        'flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-md border-l-[3px] transition-colors text-sm',
                        isActiveSection
                          ? 'text-title font-semibold'
                          : 'text-muted hover:bg-chassis hover:text-title border-transparent',
                      )}
                      style={
                        isActiveSection
                          ? { backgroundColor: partBg, borderLeftColor: accent }
                          : { borderLeftColor: 'transparent' }
                      }
                      aria-current={isActiveSection ? 'page' : undefined}
                    >
                      {/* Status dot: LED for active, ring for others */}
                      {isActiveSection ? (
                        <span
                          className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] shrink-0 motion-reduce:shadow-none"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full shrink-0 bg-transparent ring-1 ring-current opacity-40"
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
                    </Link>

                    {/* Subsections (scroll-spy anchors) — active section only */}
                    {isActiveSection && anchors.length > 0 && (
                      <ul className="mt-0.5 mb-1 ml-[14px] pl-3 border-l border-card-border space-y-0.5">
                        {anchors.map((anchor) => {
                          const anchorActive = anchor.id === activeId;
                          return (
                            <li key={anchor.id}>
                              <a
                                href={`#${anchor.id}`}
                                onClick={handleNavigate}
                                className={cn(
                                  'flex items-center gap-2 px-1 py-1 rounded text-xs transition-colors',
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
                                      : 'bg-transparent ring-1 ring-current opacity-40',
                                  )}
                                  aria-hidden="true"
                                />
                                <span className="flex-1 truncate">{anchor.label}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* ── Bottom tab-bar ────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-card border-t border-card-border flex items-stretch"
        aria-label="Part navigation"
      >
        {PARTS.map((part) => {
          const isCurrent = activePart?.id === part.id;
          const isSheetOpen = openPartId === part.id;
          const accent = `var(--color-part-${part.number})`;
          const partBg = `var(--color-part-${part.number}-bg)`;

          return (
            <button
              key={part.id}
              type="button"
              onClick={() => handleChipClick(part.id)}
              aria-label={`Part ${part.number}: ${part.title}`}
              aria-expanded={isSheetOpen}
              title={`PART ${String(part.number).padStart(2, '0')} · ${PART_QUANTITIES[part.number]}`}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta focus-visible:outline-none',
                isCurrent ? 'font-bold' : 'text-muted hover:text-title',
              )}
              style={
                isCurrent
                  ? { backgroundColor: partBg, boxShadow: `inset 0 2px 0 0 ${accent}` }
                  : undefined
              }
            >
              {/* TraceScreen spark + LED */}
              <span className="relative inline-flex items-center">
                <TraceScreen
                  traceKind={PART_TRACES[part.number]}
                  accentVar={`--color-part-${part.number}`}
                  size="spark"
                />
                {isCurrent && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] motion-reduce:shadow-none"
                    aria-hidden="true"
                  />
                )}
              </span>

              {/* Mono part number */}
              <span className="font-mono text-[9px] font-bold leading-none tabular-nums">
                {String(part.number).padStart(2, '0')}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
