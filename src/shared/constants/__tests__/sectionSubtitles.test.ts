/**
 * RED-before-GREEN: asserts that the 10 EM section subtitles in the shared
 * curriculum match MODULES descriptions verbatim, and that their titles match
 * MODULES labels verbatim.
 *
 * This test is intentionally cross-domain (imports MODULES from @em) — it is
 * legitimate for a TEST to cross domain boundaries; the production SectionLayout
 * component may not.
 */
import { describe, it, expect } from 'vitest';
import { SECTIONS } from '@shared/constants/curriculum';
import { MODULES } from '@em/constants/physics';

const EM_SECTION_IDS = [
  'coulomb',
  'gauss',
  'ampere',
  'lorentz',
  'faraday',
  'lenz',
  'magnetic-circuits',
  'maxwell',
  'em-wave',
  'polarization',
] as const;

describe('shared curriculum — EM section subtitles match MODULES descriptions', () => {
  for (const id of EM_SECTION_IDS) {
    const mod = MODULES.find((m) => m.id === id)!;

    it(`SECTIONS["${id}"].title === MODULES label ("${mod.label}")`, () => {
      expect(SECTIONS[id].title).toBe(mod.label);
    });

    it(`SECTIONS["${id}"].subtitle === MODULES description ("${mod.description}")`, () => {
      expect((SECTIONS[id] as { subtitle?: string }).subtitle).toBe(mod.description);
    });
  }
});
