import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';

/**
 * EM SectionAnchor sweep (Track B #13 / PR1) — structural guard.
 *
 * Every EM section body is wrapped in <SectionAnchor id label> so the level-3
 * scroll-spy TOC/breadcrumb (shipped in #11) populates. The anchor id is the
 * single source of truth. This test renders each section and asserts its
 * expected anchor ids appear in the DOM, in document order, with no dropped or
 * duplicated wrap — the three failure modes of a mechanical sweep.
 *
 * Faraday is the already-swept reference: it acts as a live control that must
 * pass on the very first run, proving the harness is sound.
 *
 * SectionAnchor renders its <div id> OUTSIDE any PredictionGate, so all anchor
 * ids are present on initial render regardless of gate state. registerAnchor
 * defaults to a noop (SectionAnchorContext), so no ScrollSpyProvider is needed.
 */

// katex (via MathWrapper) — stub to avoid real layout work across 10 full sections,
// mirroring the em-wave phaseUnits test harness.
vi.mock('katex', () => ({
  default: { renderToString: (latex: string) => `<span class="katex">${latex}</span>`, render: vi.fn() },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  }
});

import { FaradaySection } from '@em/sections/faraday/index';
import { GaussSection } from '@em/sections/gauss/index';
import { LorentzSection } from '@em/sections/lorentz/index';
import { CoulombSection } from '@em/sections/coulomb/index';
import { LenzSection } from '@em/sections/lenz/index';
import { PolarizationSection } from '@em/sections/polarization/index';
import { AmpereSection } from '@em/sections/ampere/index';
import { MaxwellSection } from '@em/sections/maxwell/index';
import { EMWaveSection } from '@em/sections/em-wave/index';
import { MagneticCircuitsSection } from '@em/sections/magnetic-circuits/index';
import { MathVectorsSection } from '@em/sections/math-vectors/index';
import { MathIntegralsSection } from '@em/sections/math-integrals/index';

interface Case {
  name: string;
  Section: ComponentType;
  anchors: string[];
}

const CASES: Case[] = [
  // Reference (already swept) — live control, must pass first run.
  { name: 'faraday', Section: FaradaySection, anchors: ['faraday-induction-sim', 'faraday-theory', 'faraday-challenge'] },
  // Clean single-gate sections.
  { name: 'gauss', Section: GaussSection, anchors: ['gauss-flux-sim', 'gauss-concept-checks', 'gauss-theory', 'gauss-challenge'] },
  { name: 'lorentz', Section: LorentzSection, anchors: ['lorentz-force-sim', 'lorentz-theory', 'lorentz-challenge'] },
  { name: 'coulomb', Section: CoulombSection, anchors: ['coulomb-superposition-sim', 'coulomb-theory', 'coulomb-challenge'] },
  { name: 'lenz', Section: LenzSection, anchors: ['lenz-induction-sim', 'lenz-theory', 'lenz-challenge'] },
  { name: 'polarization', Section: PolarizationSection, anchors: ['polarization-state-sim', 'polarization-theory', 'polarization-challenge'] },
  // Second-gate sections — gate stays contained inside the theory/radiation anchor.
  { name: 'ampere', Section: AmpereSection, anchors: ['ampere-field-sim', 'ampere-theory', 'ampere-challenge'] },
  { name: 'maxwell', Section: MaxwellSection, anchors: ['maxwell-four-equations', 'maxwell-radiation', 'maxwell-theory', 'maxwell-challenge'] },
  { name: 'em-wave', Section: EMWaveSection, anchors: ['em-wave-sim', 'em-wave-concept-checks', 'em-wave-theory', 'em-wave-challenge'] },
  { name: 'magnetic-circuits', Section: MagneticCircuitsSection, anchors: ['magnetic-circuits-toroid-sim', 'magnetic-circuits-theory', 'magnetic-circuits-challenge'] },
  { name: 'math-vectors', Section: MathVectorsSection, anchors: ['math-vectors-products-sim', 'math-vectors-concept-checks', 'math-vectors-theory', 'math-vectors-challenge'] },
  { name: 'math-integrals', Section: MathIntegralsSection, anchors: ['math-integrals-flux-sim', 'math-integrals-concept-checks', 'math-integrals-theory', 'math-integrals-challenge'] },
];

describe('EM SectionAnchor sweep', () => {
  it.each(CASES)('$name renders its anchor ids in document order', ({ Section, anchors }) => {
    const { container } = render(
      <MemoryRouter>
        <Section />
      </MemoryRouter>,
    );

    // All elements carrying an id, in document order, filtered to the section's
    // anchor set. Equality catches: missing wrap, reordered wrap, duplicate id.
    const present = Array.from(container.querySelectorAll<HTMLElement>('[id]'))
      .map((el) => el.id)
      .filter((id) => anchors.includes(id));

    expect(present).toEqual(anchors);
  });

  it('uses globally-unique anchor ids across all EM sections', () => {
    const all = CASES.flatMap((c) => c.anchors);
    expect(new Set(all).size).toBe(all.length);
  });
});
