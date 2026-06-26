/**
 * ScrollSpyProvider
 *
 * Owns exactly ONE IntersectionObserver (spec §4) whose root is the scroll
 * container passed via rootRef (= Layout's <main id="main-content"> element).
 *
 * rootMargin: "-10% 0px -85% 0px"
 *   — a thin horizontal band anchored near the top of the scroll container.
 *     The section whose anchor enters this band is the "active" one.
 *     "topmost intersecting" is resolved by picking the anchor with the
 *     smallest positive boundingClientRect.top at callback time; when no
 *     anchor is intersecting the current activeId is kept (avoids flickering
 *     at the boundary between two anchors).
 *
 * Anchor-element lookup: document.getElementById(id) is called at
 * observation-time, not at registration-time, so we never hold a stale ref.
 *
 * Re-observation: the effect re-runs whenever the registered anchor list
 * changes (new page mounts SectionAnchors / old page unmounts them).
 *
 * prefers-reduced-motion: the scrollToAnchor helper uses 'instant' when
 * window.matchMedia('(prefers-reduced-motion: reduce)').matches is true.
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  SectionAnchorContext,
  type AnchorEntry,
} from './SectionAnchorContext';

interface ScrollSpyProviderProps {
  /** Ref to the scroll container element (Layout's <main>). */
  rootRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function ScrollSpyProvider({ rootRef, children }: ScrollSpyProviderProps) {
  const [anchors, setAnchors] = useState<AnchorEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const registerAnchor = useCallback((entry: AnchorEntry) => {
    setAnchors(prev => {
      // Avoid duplicate registration
      if (prev.some(a => a.id === entry.id)) return prev;
      // Maintain document order by querying the DOM for insertion position
      const el = document.getElementById(entry.id);
      if (!el) return [...prev, entry];
      const newList = [...prev, entry].sort((a, b) => {
        const elA = document.getElementById(a.id);
        const elB = document.getElementById(b.id);
        if (!elA || !elB) return 0;
        const rel = elA.compareDocumentPosition(elB);
        // Node.DOCUMENT_POSITION_FOLLOWING = 4 → b comes after a → a < b
        return rel & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      return newList;
    });
  }, []);

  const unregisterAnchor = useCallback((id: string) => {
    setAnchors(prev => prev.filter(a => a.id !== id));
    setActiveId(prev => (prev === id ? null : prev));
  }, []);

  const scrollToAnchor = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: prefersReduced ? 'instant' : 'smooth',
      block: 'start',
    });
  }, []);

  // --- IntersectionObserver ---
  useEffect(() => {
    const root = rootRef.current;
    if (!root || anchors.length === 0) return;

    // Collect the real DOM elements for the current anchor list
    const elements = anchors
      .map(a => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Build a map of currently intersecting entries from this batch
        // combined with previous knowledge.  We track all intersecting ids
        // so we can pick the topmost one.
        setActiveId(prevId => {
          // Update the intersecting set based on the incoming entries
          const intersectingSet = new Set<string>();

          // We rebuild from entries only — simpler and avoids stale sets.
          // Entries whose isIntersecting=false are not included.
          for (const entry of entries) {
            if (entry.isIntersecting) {
              intersectingSet.add((entry.target as HTMLElement).id);
            }
          }

          if (intersectingSet.size === 0) {
            // No new intersections in this batch — keep prevId if its element
            // is still intersecting (we cannot know from this batch alone).
            // Fall back to prevId to avoid flickering during threshold gaps.
            return prevId;
          }

          // Among intersecting anchors pick the topmost (smallest top offset)
          let topmostId: string | null = null;
          let topmostTop = Infinity;
          for (const id of intersectingSet) {
            const el = document.getElementById(id);
            if (!el) continue;
            const top = el.getBoundingClientRect().top;
            if (top < topmostTop) {
              topmostTop = top;
              topmostId = id;
            }
          }
          return topmostId ?? prevId;
        });
      },
      {
        root,
        // Top-biased band: 10% from the top edge to 85% from the bottom edge
        // → only ~5% of the container height acts as the "active zone".
        rootMargin: '-10% 0px -85% 0px',
        threshold: 0,
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [anchors, rootRef]);

  const contextValue = useMemo(
    () => ({
      anchors,
      activeId,
      registerAnchor,
      unregisterAnchor,
      scrollToAnchor,
    }),
    [anchors, activeId, registerAnchor, unregisterAnchor, scrollToAnchor],
  );

  return (
    <SectionAnchorContext.Provider value={contextValue}>
      {children}
    </SectionAnchorContext.Provider>
  );
}
