/**
 * SectionAnchor
 *
 * Renders a <div> carrying the given DOM id and registers {id, label} into
 * SectionAnchorContext on mount, unregistering on unmount.  ScrollSpyProvider
 * fetches the real DOM element via document.getElementById(id) whenever the
 * anchor list changes, so no RefObject needs to pass through context.
 *
 * Usage:
 *   <SectionAnchor id="flux-and-emf" label="Flux & the EMF rule">
 *     <h2>Flux &amp; the EMF rule</h2>
 *     …section body…
 *   </SectionAnchor>
 */

import { useEffect, useContext, type ReactNode } from 'react';
import { SectionAnchorContext } from './SectionAnchorContext';

interface SectionAnchorProps {
  id: string;
  label: string;
  children: ReactNode;
  /**
   * Optional classes applied to the rendered <div id>. Used when the anchor id
   * is migrated off an inner element that carried scroll-margin (e.g.
   * `scroll-mt-4`): since the anchor div becomes the scroll target, the margin
   * must travel with the id. Omitted in EM sections, which need no margin.
   */
  className?: string;
}

export function SectionAnchor({ id, label, children, className }: SectionAnchorProps) {
  const { registerAnchor, unregisterAnchor } = useContext(SectionAnchorContext);

  useEffect(() => {
    registerAnchor({ id, label });
    return () => {
      unregisterAnchor(id);
    };
    // id and label are stable primitive props — re-running only when they change
    // is the correct behaviour (old anchor removed, new one registered).
  }, [id, label, registerAnchor, unregisterAnchor]);

  return <div id={id} className={className}>{children}</div>;
}
