/**
 * SectionAnchorContext
 *
 * Single source of truth for the registered scroll anchors and the currently
 * active anchor id.  ScrollSpyProvider writes to this context; SectionAnchor
 * registers/unregisters into it; useScrollSpy reads from it.
 *
 * Anchor-registration mechanism (option-b from spec §3.2):
 *   SectionAnchor renders a <div id={id}> and calls registerAnchor({id,label})
 *   on mount.  ScrollSpyProvider queries the real DOM element via
 *   document.getElementById(id) when the anchor list changes, so it never
 *   holds a stale ref across React re-renders.  This avoids the complexity of
 *   passing RefObjects through context while remaining robust — the element is
 *   always fetched at observation-time, not captured at registration-time.
 */

import { createContext } from 'react';

export interface AnchorEntry {
  id: string;
  label: string;
}

export interface SectionAnchorContextValue {
  /** Registered anchors in document order (maintained by ScrollSpyProvider). */
  anchors: AnchorEntry[];
  /** Register an anchor on SectionAnchor mount. */
  registerAnchor: (entry: AnchorEntry) => void;
  /** Unregister an anchor on SectionAnchor unmount. */
  unregisterAnchor: (id: string) => void;
  /** The id of the topmost intersecting anchor, or null when none. */
  activeId: string | null;
  /**
   * Smooth-scrolls to the element with the given anchor id.
   * Respects prefers-reduced-motion: uses 'instant' when motion is reduced.
   */
  scrollToAnchor: (id: string) => void;
}

const noop = () => {};

export const SectionAnchorContext = createContext<SectionAnchorContextValue>({
  anchors: [],
  registerAnchor: noop,
  unregisterAnchor: noop,
  activeId: null,
  scrollToAnchor: noop,
});
