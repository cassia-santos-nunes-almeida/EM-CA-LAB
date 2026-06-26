/**
 * useSidebarCollapse — the §5 auto-collapse precedence engine.
 *
 * One signal decides whether the sidebar shows as a full 264 px accordion or a
 * 58 px icon-rail. Three inputs feed it (spec §5):
 *
 *   pref          = the user's PERSISTED manual choice (progressStore.sidebarCollapsed)
 *   simActive     = the current in-view section's `simHeavy` flag (curriculum)
 *   pinnedSection = an EPHEMERAL section the user manually expanded while it was
 *                   sim-heavy (local state — deliberately NOT persisted, so the
 *                   pin never outlives the visit that created it)
 *
 *   collapsed =  pref                                ? true
 *             :  simActive && pinnedSection !== cur  ? true   // auto, for the bench
 *             :                                         false
 *
 * - Manual toggle persists `pref`. Expanding while on a sim-heavy section pins
 *   that section open (so the auto-rule can't immediately re-collapse it).
 * - Leaving a sim-heavy section clears the pin (a render-phase reconciliation
 *   keyed on the active section id), so the user's persisted `pref` resumes
 *   control — this is the "stale pin" guard the navscope doc calls out.
 * - `isAutoCollapsed` is true only on the auto path (sim-heavy), never when the
 *   user manually collapsed — it drives the "auto-collapsed for the bench" badge.
 */

import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProgressStore } from '@shared/store/progressStore';
import { SECTIONS } from '@shared/constants/curriculum';

export interface UseSidebarCollapseResult {
  /** Effective collapsed state (the §5 precedence result). */
  collapsed: boolean;
  /** True only when the collapse is automatic (sim-heavy path), not manual. */
  isAutoCollapsed: boolean;
  /** Manual toggle. Persists `pref`; expanding on a sim-heavy section pins it. */
  toggleCollapse: () => void;
  /** Same as `isAutoCollapsed` — drives the "auto-collapsed for the bench" badge. */
  autoCollapseBadgeVisible: boolean;
}

/** Resolve the active route's section id from the current pathname. */
function sectionIdFromPath(pathname: string): string | null {
  // Routes are flat `/<id>`; match the section whose route equals the path.
  const match = Object.values(SECTIONS).find((s) => s.route === pathname);
  return match?.id ?? null;
}

export function useSidebarCollapse(): UseSidebarCollapseResult {
  const pref = useProgressStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useProgressStore((s) => s.setSidebarCollapsed);

  const { pathname } = useLocation();
  const currentSectionId = sectionIdFromPath(pathname);
  const simActive = currentSectionId
    ? (SECTIONS[currentSectionId]?.simHeavy ?? false)
    : false;

  // Ephemeral pin — a section the user manually expanded while it was sim-heavy.
  const [pinnedSection, setPinnedSection] = useState<string | null>(null);

  // Stale-pin guard (spec §5: "leaving a sim-heavy section clears the pin").
  // We reconcile DURING RENDER rather than in an effect — the React-endorsed
  // "adjust state when a prop changes" pattern (https://react.dev/learn/
  // you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes):
  // store the section the render last reconciled against, and when the active
  // section moves on, drop a pin that belonged to the section we just left.
  // Calling setState during render (vs. in an effect) is what React recommends
  // here — it re-renders immediately with no extra paint and avoids the
  // cascading-render lint.
  const [seenSection, setSeenSection] = useState<string | null>(currentSectionId);
  if (seenSection !== currentSectionId) {
    setSeenSection(currentSectionId);
    if (pinnedSection !== null && pinnedSection !== currentSectionId) {
      setPinnedSection(null);
    }
  }

  // §5 precedence.
  const collapsed = pref
    ? true
    : simActive && pinnedSection !== currentSectionId
      ? true
      : false;

  // Auto path only: collapsed BUT not because the user chose it (pref=false).
  const isAutoCollapsed = !pref && simActive && pinnedSection !== currentSectionId;

  const toggleCollapse = useCallback(() => {
    // `collapsed` is the current effective state; the toggle flips it.
    if (collapsed) {
      // → expanding. Persist the expand. If we're expanding ON a sim-heavy
      //   section, pin it so the auto-rule doesn't immediately re-collapse it.
      setSidebarCollapsed(false);
      if (simActive && currentSectionId) {
        setPinnedSection(currentSectionId);
      }
    } else {
      // → collapsing. A deliberate manual collapse: persist the preference.
      setSidebarCollapsed(true);
    }
  }, [collapsed, simActive, currentSectionId, setSidebarCollapsed]);

  return {
    collapsed,
    isAutoCollapsed,
    toggleCollapse,
    autoCollapseBadgeVisible: isAutoCollapsed,
  };
}
