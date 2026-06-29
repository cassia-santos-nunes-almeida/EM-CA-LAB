/**
 * ScrollSpyProvider
 *
 * Owns exactly ONE IntersectionObserver (spec §4) whose root is the scroll
 * container passed via rootRef (= Layout's <main id="main-content"> element).
 *
 * Active selection (computeActiveId): on every observer callback we recompute
 * the active anchor from current geometry as the LAST anchor in DOCUMENT ORDER
 * whose top has scrolled above the activation line (root top + 15%). Document-
 * order (not geometric-topmost) is robust to a PINNED sticky anchor — e.g. a
 * leadWithBench sim bench — which sits visually near the top forever: being
 * doc-first it is only the "last above the line" when nothing later is (= at the
 * very top), so the meter resets to it on scroll-up instead of going stale on a
 * theory anchor.
 *
 * rootMargin "-10% 0px -85% 0px" is only the TRIGGER: a thin band near the top
 * whose crossings tell us when to recompute (threshold 0).
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
import { computeActiveId } from './computeActiveId';

/**
 * Fraction of the scroll-container height at which an anchor becomes "active"
 * once its top scrolls above it. 0.15 = the lower edge of the rootMargin band.
 */
const ACTIVATION_RATIO = 0.15;

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

    const recompute = () => {
      // Recompute from current geometry on every crossing: the active anchor is
      // the LAST in document order whose top is above the activation line.
      const rootRect = root.getBoundingClientRect();
      const activationLine = rootRect.top + ACTIVATION_RATIO * rootRect.height;
      setActiveId(
        computeActiveId(
          anchors.map((a) => a.id),
          activationLine,
          (id) => {
            const el = document.getElementById(id);
            return el ? el.getBoundingClientRect().top : null;
          },
        ),
      );
    };

    const observer = new IntersectionObserver(recompute, {
      root,
      // Top-biased band: only its crossings TRIGGER a recompute (the active
      // anchor itself is chosen by computeActiveId, not by "is intersecting").
      rootMargin: '-10% 0px -85% 0px',
      threshold: 0,
    });

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
