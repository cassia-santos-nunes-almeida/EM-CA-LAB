import { useEffect, useState } from 'react';

/**
 * Scroll-spy hook. Returns the id of the section currently at the top of the
 * viewport, chosen from the given ordered list of element ids.
 *
 * It re-queries the DOM on every scroll/resize (rather than observing fixed
 * element references once), so it tolerates sections that mount and unmount —
 * e.g. when they live inside a tab panel that React remounts on tab switch.
 *
 * Pass a STABLE `ids` array (module-level const or memoised) so the effect does
 * not re-subscribe on every render.
 *
 * @param ids    Ordered section element ids, top-to-bottom.
 * @param offset Pixels from the top of the viewport that count as "active".
 */
export function useActiveSection(ids: string[], offset = 96): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(ids[0]);

  useEffect(() => {
    const computeActive = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      setActiveId(current);
    };

    computeActive();
    window.addEventListener('scroll', computeActive, { passive: true });
    window.addEventListener('resize', computeActive);
    return () => {
      window.removeEventListener('scroll', computeActive);
      window.removeEventListener('resize', computeActive);
    };
  }, [ids, offset]);

  return activeId;
}
