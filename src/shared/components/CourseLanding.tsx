/**
 * CourseLanding — route `/`.
 *
 * Layout: a slimmed through-line hero above a vertical Part accordion.
 * The accordion replaces the old 2-column card grid per spec §2.1.
 *
 * Hero separability (spec §9): remove <ThroughLineHero /> below to drop it.
 * The <h1> lives inside ThroughLineHero — if the hero is dropped, add an
 * <h1> here directly so the page always has an accessible heading.
 */

import { ThroughLineHero } from './landing/ThroughLineHero';
import { PartAccordion } from './landing/PartAccordion';

export function CourseLanding() {
  return (
    <div className="space-y-4">
      {/* Through-line hero (separable — see JSDoc above) */}
      <ThroughLineHero />

      {/* Vertical exclusive Part accordion */}
      <PartAccordion />
    </div>
  );
}
