// Single source of truth for the course's pedagogical structure.
//
// The app's CODE is grouped by engineering domain (src/{circuits,em,transmission}),
// but its PRESENTATION follows a deliberate circuits-first learning spine. This
// file decouples the two: it defines the 5 Parts, the ordered sections within
// each, and per-section metadata (title, route, code domain, concept-check
// target). Routing, the sidebar's Part grouping, and course-wide prev/next all
// derive from here — so re-ordering the course later is a config edit, not a
// file move.
//
// Pedagogy ≠ provenance: a few sections present in a Part whose code lives in a
// different domain (Transformers/Antennas code is in `transmission`, but they
// teach in Parts 3/4). The `domain` field records where the CODE lives; Part
// membership records where it TEACHES.
//
// Metadata-only by design: no component/loader imports live here, so `shared/`
// never depends upward on a domain folder. The lazy-loaded component registry
// lives in src/sectionRegistry.tsx (keyed by section id; App.tsx imports its
// SECTION_LOADERS); a route-integrity test asserts that registry covers every
// section defined here.

export type Domain = 'circuits' | 'em' | 'transmission';

export interface CourseSection {
  /** Globally-unique, stable id. Also the progress-store key and the URL path. */
  id: string;
  /** Human-readable title for sidebar, nav, and page heading. */
  title: string;
  /** Flat route path, always `/<id>`. */
  route: string;
  /** Engineering domain the section's CODE lives in (src/<domain>/…). */
  domain: Domain;
  /**
   * Concept-check target used to derive the sidebar "complete" badge. Only the
   * EM-fundamentals sections were authored with a fixed target (3); everything
   * else completes on first visit (0). See `isModuleComplete` in the store.
   */
  expectedChecks: number;
}

export interface CoursePart {
  /** Stable Part id (used for sidebar group keys). */
  id: string;
  /** Part number shown in the UI (1-indexed, matches spine order). */
  number: number;
  /** Part title. */
  title: string;
  /** Ordered section ids belonging to this Part. */
  sectionIds: string[];
}

/** Every section, in spine order. The flattened list and lookup derive from this. */
const SECTION_LIST: CourseSection[] = [
  // ── Part 1 · Circuit Analysis, Laplace & Transients (circuits) ──────────
  { id: 'component-physics', title: 'Component Physics', route: '/component-physics', domain: 'circuits', expectedChecks: 0 },
  { id: 'circuit-analysis', title: 'Circuit Analysis', route: '/circuit-analysis', domain: 'circuits', expectedChecks: 0 },
  { id: 'nodal-mesh-analysis', title: 'Nodal & Mesh Analysis', route: '/nodal-mesh-analysis', domain: 'circuits', expectedChecks: 0 },
  { id: 'circuit-theorems', title: 'Circuit Theorems', route: '/circuit-theorems', domain: 'circuits', expectedChecks: 0 },
  { id: 'laplace-theory', title: 'Laplace Theory', route: '/laplace-theory', domain: 'circuits', expectedChecks: 0 },
  { id: 'partial-fractions', title: 'Partial Fractions & Heaviside', route: '/partial-fractions', domain: 'circuits', expectedChecks: 0 },
  { id: 's-domain', title: 's-Domain Analysis', route: '/s-domain', domain: 'circuits', expectedChecks: 0 },
  { id: 'interactive-lab', title: 'Interactive Lab', route: '/interactive-lab', domain: 'circuits', expectedChecks: 0 },

  // ── Part 2 · Electric & Magnetic Fields (em) ────────────────────────────
  { id: 'coulomb', title: "Coulomb's Law", route: '/coulomb', domain: 'em', expectedChecks: 3 },
  { id: 'gauss', title: "Gauss's Law", route: '/gauss', domain: 'em', expectedChecks: 3 },
  { id: 'ampere', title: "Ampère's Law", route: '/ampere', domain: 'em', expectedChecks: 3 },
  { id: 'lorentz', title: 'Lorentz Force', route: '/lorentz', domain: 'em', expectedChecks: 3 },

  // ── Part 3 · Induction, Magnetics & Inductance (em + transformers code) ──
  { id: 'faraday', title: "Faraday's Law", route: '/faraday', domain: 'em', expectedChecks: 3 },
  { id: 'lenz', title: "Lenz's Law", route: '/lenz', domain: 'em', expectedChecks: 3 },
  { id: 'magnetic-circuits', title: 'Magnetic Circuits', route: '/magnetic-circuits', domain: 'em', expectedChecks: 3 },
  { id: 'transformers', title: 'Transformers', route: '/transformers', domain: 'transmission', expectedChecks: 0 },

  // ── Part 4 · Maxwell, Waves, Radiation & Antennas (em + antennas code) ───
  { id: 'maxwell', title: "Maxwell's Equations", route: '/maxwell', domain: 'em', expectedChecks: 3 },
  { id: 'em-wave', title: 'EM Waves', route: '/em-wave', domain: 'em', expectedChecks: 3 },
  { id: 'polarization', title: 'Polarization', route: '/polarization', domain: 'em', expectedChecks: 3 },
  { id: 'antennas', title: 'Antennas', route: '/antennas', domain: 'transmission', expectedChecks: 0 },

  // ── Part 5 · Transmission Lines & Distributed Systems (transmission) ─────
  { id: 'lumped-distributed', title: 'Lumped to Distributed', route: '/lumped-distributed', domain: 'transmission', expectedChecks: 0 },
  { id: 'transmission-lines', title: 'Transmission Lines', route: '/transmission-lines', domain: 'transmission', expectedChecks: 0 },
  { id: 'line-impedance', title: 'Line Impedance & Matching', route: '/line-impedance', domain: 'transmission', expectedChecks: 0 },
  { id: 'transients', title: 'Transients', route: '/transients', domain: 'transmission', expectedChecks: 0 },
];

/** The 5-Part circuits-first spine: lead with the algorithmic toolkit, ground it
 *  in field physics, then fuse the two in transmission lines. */
export const PARTS: CoursePart[] = [
  {
    id: 'circuits-laplace-transients',
    number: 1,
    title: 'Circuit Analysis, Laplace & Transients',
    sectionIds: ['component-physics', 'circuit-analysis', 'nodal-mesh-analysis', 'circuit-theorems', 'laplace-theory', 'partial-fractions', 's-domain', 'interactive-lab'],
  },
  {
    id: 'electric-magnetic-fields',
    number: 2,
    title: 'Electric & Magnetic Fields',
    sectionIds: ['coulomb', 'gauss', 'ampere', 'lorentz'],
  },
  {
    id: 'induction-magnetics',
    number: 3,
    title: 'Induction, Magnetics & Inductance',
    sectionIds: ['faraday', 'lenz', 'magnetic-circuits', 'transformers'],
  },
  {
    id: 'maxwell-waves-antennas',
    number: 4,
    title: 'Maxwell, Waves, Radiation & Antennas',
    sectionIds: ['maxwell', 'em-wave', 'polarization', 'antennas'],
  },
  {
    id: 'transmission-lines',
    number: 5,
    title: 'Transmission Lines & Distributed Systems',
    sectionIds: ['lumped-distributed', 'transmission-lines', 'line-impedance', 'transients'],
  },
];

/** Section metadata keyed by id. */
export const SECTIONS: Record<string, CourseSection> = Object.fromEntries(
  SECTION_LIST.map((s): [string, CourseSection] => [s.id, s]),
);

// Fail fast on a duplicate id in SECTION_LIST: Object.fromEntries would silently
// collapse it (two list entries → one record key), so a size mismatch is the only
// signal. Mirrors the ALL_SECTIONS drift guard below.
if (Object.keys(SECTIONS).length !== SECTION_LIST.length) {
  throw new Error('curriculum: duplicate section id in SECTION_LIST');
}

/**
 * All sections flattened into spine order (Part 1 → Part 5, in-Part order).
 * This is the canonical course sequence that drives prev/next. Throws at module
 * load if a Part references an id with no matching section (fail fast on drift).
 */
export const ALL_SECTIONS: CourseSection[] = PARTS.flatMap((part) =>
  part.sectionIds.map((id) => {
    const section = SECTIONS[id];
    if (!section) {
      throw new Error(`curriculum: Part "${part.id}" references unknown section "${id}"`);
    }
    return section;
  }),
);

/** The Part a given section belongs to (or null if it isn't wired into one). */
export function getPartForSection(sectionId: string): CoursePart | null {
  return PARTS.find((p) => p.sectionIds.includes(sectionId)) ?? null;
}

/** Previous/next section along the full course spine (null at the ends). */
export function getAdjacentSections(currentId: string): {
  prev: CourseSection | null;
  next: CourseSection | null;
} {
  const idx = ALL_SECTIONS.findIndex((s) => s.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ALL_SECTIONS[idx - 1] : null,
    next: idx < ALL_SECTIONS.length - 1 ? ALL_SECTIONS[idx + 1] : null,
  };
}

/** Concept-check target for a section (0 when untracked / unknown). */
export function getExpectedChecks(sectionId: string): number {
  return SECTIONS[sectionId]?.expectedChecks ?? 0;
}

/** The course-wide "Part.Section" number for a section, derived from PARTS
 *  order (e.g. transmission-lines → "5.2"). Empty string if not wired in.
 *  Derived (not stored) so re-ordering the spine auto-renumbers everything. */
export function getSectionNumber(sectionId: string): string {
  const part = PARTS.find((p) => p.sectionIds.includes(sectionId));
  if (!part) return '';
  return `${part.number}.${part.sectionIds.indexOf(sectionId) + 1}`;
}

/** The physics quantity each Part foregrounds, used as the mono `PART 0N · QUANTITY`
 *  instrument tag on the landing cards and in the sidebar. Keyed by Part number. */
export const PART_QUANTITIES: Record<number, string> = {
  1: 'CIRCUITS',
  2: 'E-FIELD',
  3: 'B-FIELD',
  4: 'WAVES',
  5: 'LINES',
};

// Fail fast if a Part lacks a quantity word (mirrors the dup-id / Part-reference
// guards above): better a load-time throw than rendering "PART 0N · undefined".
for (const part of PARTS) {
  if (!PART_QUANTITIES[part.number]) {
    throw new Error(`curriculum: PART_QUANTITIES is missing a word for Part ${part.number}`);
  }
}
