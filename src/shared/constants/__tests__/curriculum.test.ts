import { describe, it, expect } from 'vitest';
import {
  PARTS,
  SECTIONS,
  ALL_SECTIONS,
  getAdjacentSections,
  getPartForSection,
  getExpectedChecks,
  PART_QUANTITIES,
} from '@shared/constants/curriculum';

describe('curriculum — 5-part circuits-first spine', () => {
  it('has exactly 5 parts numbered 1..5 in spine order', () => {
    expect(PARTS).toHaveLength(5);
    expect(PARTS.map((p) => p.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('covers all 25 sections', () => {
    expect(ALL_SECTIONS).toHaveLength(25);
  });

  it('leads with circuits — Part 1 is entirely circuits-domain', () => {
    expect(PARTS[0].sectionIds.every((id) => SECTIONS[id].domain === 'circuits')).toBe(true);
  });

  it('every Part section id resolves to a defined section', () => {
    for (const part of PARTS) {
      for (const id of part.sectionIds) {
        expect(SECTIONS[id], `section "${id}" in part "${part.id}"`).toBeDefined();
      }
    }
  });

  it('every defined section belongs to exactly one Part', () => {
    for (const id of Object.keys(SECTIONS)) {
      const owners = PARTS.filter((p) => p.sectionIds.includes(id));
      expect(owners, `section "${id}" should be in exactly one part`).toHaveLength(1);
    }
  });

  it('ALL_SECTIONS is the flattened spine with no duplicate ids', () => {
    const ids = ALL_SECTIONS.map((s) => s.id);
    expect(ids).toHaveLength(PARTS.reduce((n, p) => n + p.sectionIds.length, 0));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(PARTS.flatMap((p) => p.sectionIds));
  });

  it('SECTION metadata and the Part spine cover the identical id set (no orphan/extra entries)', () => {
    expect(Object.keys(SECTIONS)).toHaveLength(25);
    expect(new Set(ALL_SECTIONS.map((s) => s.id))).toEqual(new Set(Object.keys(SECTIONS)));
  });

  it('routes are unique and of the form /<id>', () => {
    const routes = ALL_SECTIONS.map((s) => s.route);
    expect(new Set(routes).size).toBe(routes.length);
    for (const s of ALL_SECTIONS) expect(s.route).toBe(`/${s.id}`);
  });

  it('prev/next chains the entire spine and is null at the ends', () => {
    const first = ALL_SECTIONS[0];
    const last = ALL_SECTIONS[ALL_SECTIONS.length - 1];
    expect(getAdjacentSections(first.id).prev).toBeNull();
    expect(getAdjacentSections(last.id).next).toBeNull();

    // Walk forward across every section, crossing all Part boundaries.
    let cursor: string | null = first.id;
    const walked: string[] = [];
    while (cursor) {
      walked.push(cursor);
      cursor = getAdjacentSections(cursor).next?.id ?? null;
    }
    expect(walked).toEqual(ALL_SECTIONS.map((s) => s.id));
  });

  it('prev/next crosses Part boundaries (last of Part 1 ↔ first of Part 2)', () => {
    const endOfP1 = PARTS[0].sectionIds.at(-1)!;
    const startOfP2 = PARTS[1].sectionIds[0];
    expect(getAdjacentSections(endOfP1).next?.id).toBe(startOfP2);
    expect(getAdjacentSections(startOfP2).prev?.id).toBe(endOfP1);
  });

  it('returns null neighbors for an unknown id', () => {
    expect(getAdjacentSections('does-not-exist')).toEqual({ prev: null, next: null });
  });

  it('maps sections back to their Part (pedagogy, not provenance)', () => {
    expect(getPartForSection('coulomb')?.number).toBe(2);
    expect(getPartForSection('transformers')?.number).toBe(3);
    expect(getPartForSection('antennas')?.number).toBe(4);
    expect(getPartForSection('nope')).toBeNull();
  });

  it('records code-domain provenance distinct from Part membership', () => {
    // Transformers/Antennas teach in Parts 3/4 but their code lives in transmission.
    expect(SECTIONS.transformers.domain).toBe('transmission');
    expect(SECTIONS.antennas.domain).toBe('transmission');
    expect(getPartForSection('transformers')?.id).toBe('induction-magnetics');
    expect(getPartForSection('antennas')?.id).toBe('maxwell-waves-antennas');
  });

  it('expectedChecks: EM fundamentals carry per-section targets, everything else 0', () => {
    expect(getExpectedChecks('gauss')).toBe(3);
    expect(getExpectedChecks('maxwell')).toBe(4);
    expect(getExpectedChecks('em-wave')).toBe(5);
    expect(getExpectedChecks('component-physics')).toBe(0);
    expect(getExpectedChecks('transformers')).toBe(0);
    expect(getExpectedChecks('unknown-section')).toBe(0);
  });

  it('PART_QUANTITIES maps each Part number to its physics-quantity word', () => {
    expect(PART_QUANTITIES[1]).toBe('CIRCUITS');
    expect(PART_QUANTITIES[2]).toBe('E-FIELD');
    expect(PART_QUANTITIES[3]).toBe('B-FIELD');
    expect(PART_QUANTITIES[4]).toBe('WAVES');
    expect(PART_QUANTITIES[5]).toBe('LINES');
  });

  it('PART_QUANTITIES covers every Part in the spine', () => {
    for (const part of PARTS) {
      expect(PART_QUANTITIES[part.number], `Part ${part.number}`).toBeTruthy();
    }
  });
});
