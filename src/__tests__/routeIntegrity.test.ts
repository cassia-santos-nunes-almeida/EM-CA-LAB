import { describe, it, expect } from 'vitest';
import { ALL_SECTIONS } from '@shared/constants/curriculum';
import { SECTION_LOADERS } from '../sectionRegistry';

/**
 * Guards the curriculum ↔ router contract: every section defined in the spine
 * must have exactly one lazy loader, and the registry must not carry any loader
 * for a section that no longer exists. Catches both "added a section, forgot to
 * route it" and "removed a section, left a dead route".
 */
describe('route integrity — loader registry vs curriculum spine', () => {
  it('registry keys are exactly the curriculum section ids (no missing, no extra)', () => {
    const loaderIds = Object.keys(SECTION_LOADERS).sort();
    const sectionIds = ALL_SECTIONS.map((s) => s.id).sort();
    expect(loaderIds).toEqual(sectionIds);
  });

  it('resolves a defined loader for every section in the spine', () => {
    for (const section of ALL_SECTIONS) {
      expect(SECTION_LOADERS[section.id], `loader for "${section.id}"`).toBeDefined();
    }
  });
});
