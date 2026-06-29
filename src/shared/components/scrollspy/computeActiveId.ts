/**
 * Pure active-subsection selector for the scroll-spy.
 *
 * Returns the LAST anchor (in document order) whose top edge has scrolled above
 * the activation line — i.e. "the subsection you have most recently scrolled
 * into". Document-order (not geometric-topmost) makes this robust to a PINNED
 * sticky anchor whose visual top is fixed near the container top: such an anchor
 * is only the "last above the line" when no later anchor is above it (= at the
 * very top), so it correctly reclaims active on scroll-up instead of leaving the
 * meter stale on a theory anchor.
 *
 * @param orderedIds   anchor ids in document order
 * @param activationLine viewport-y (px) of the activation line
 * @param topOf        reads an anchor's current viewport-y top, or null if absent
 */
export function computeActiveId(
  orderedIds: string[],
  activationLine: number,
  topOf: (id: string) => number | null,
): string | null {
  let active: string | null = null;
  for (const id of orderedIds) {
    const top = topOf(id);
    if (top === null) continue;
    // Keep advancing: among all anchors above the line, the LAST in doc order wins.
    if (top <= activationLine) active = id;
  }
  return active;
}
