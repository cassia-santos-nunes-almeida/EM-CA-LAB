/**
 * useScrollSpy
 *
 * Returns { anchors, activeId, scrollToAnchor } from the nearest
 * ScrollSpyProvider (via SectionAnchorContext).
 *
 * Graceful outside-provider: the context has a no-op default (empty anchors,
 * null activeId, noop callbacks), so this hook never throws when used outside
 * a provider — it simply returns the inert defaults.
 */

import { useContext } from 'react';
import { SectionAnchorContext } from '@shared/components/scrollspy/SectionAnchorContext';

export function useScrollSpy() {
  const { anchors, activeId, scrollToAnchor } = useContext(SectionAnchorContext);
  return { anchors, activeId, scrollToAnchor };
}
