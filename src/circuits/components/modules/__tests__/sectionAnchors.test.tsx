import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType, ReactNode } from 'react';
import { ScrollSpyProvider } from '@shared/components/scrollspy/ScrollSpyProvider';
import { useScrollSpy } from '@shared/hooks/useScrollSpy';

/**
 * Non-EM SectionAnchor wrapper-swap (Track B #13 / PR2) — structural guard.
 *
 * The TOC-driven circuits sections render a flat body with a shared
 * <TableOfContents> and already carry DOM ids on inner elements. PR2 migrates
 * each tocEntries id onto a <SectionAnchor id label className="scroll-mt-4">
 * wrapper so the level-3 scroll-spy populates — without creating duplicate ids.
 *
 * The decisive assertion is REGISTRATION: each section's anchors must register
 * into ScrollSpyProvider's context, in document order. A plain DOM id on an
 * inner element does NOT register — only a <SectionAnchor> does — so this test
 * genuinely forces the migration (a bare id would leave `anchors` empty).
 *
 * Unlike the EM cohort, ids such as `puzzle`/`challenge` legitimately repeat
 * ACROSS sections (only one route mounts at a time) — asserted per-section.
 *
 * Antennas is intentionally EXCLUDED: it is a real <Tabs> section whose panels
 * remount on tab-switch (decision #3 — skip tabbed sections); its in-tab nav is
 * already handled by useActiveSection.
 */

vi.mock('katex', () => ({
  default: { renderToString: (latex: string) => `<span class="katex">${latex}</span>`, render: vi.fn() },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  }
  // jsdom lacks IntersectionObserver; ScrollSpyProvider constructs one once
  // anchors register. A no-op stub lets registration (the assertion target)
  // proceed without the observer needing to fire.
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = class {
      root = null;
      rootMargin = '';
      thresholds: number[] = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    } as unknown as typeof IntersectionObserver;
  }
});

import { TimeDomain } from '@circuits/components/modules/TimeDomain';
import { NodalMesh } from '@circuits/components/modules/NodalMesh';
import { CircuitTheorems } from '@circuits/components/modules/CircuitTheorems';
import { PartialFractions } from '@circuits/components/modules/PartialFractions';

interface Case {
  name: string;
  Section: ComponentType;
  anchors: string[];
}

const CASES: Case[] = [
  { name: 'circuit-analysis', Section: TimeDomain, anchors: ['circuit-analysis', 'concept-check', 'method-comparison', 'response-types'] },
  { name: 'nodal-mesh-analysis', Section: NodalMesh, anchors: ['puzzle', 'node-builder', 'mesh-assigner', 'choosing', 'escapes', 'challenge'] },
  { name: 'circuit-theorems', Section: CircuitTheorems, anchors: ['puzzle', 'knockout', 'blackbox', 'norton', 'max-power', 'sanity', 'challenge'] },
  { name: 'partial-fractions', Section: PartialFractions, anchors: ['puzzle', 'identification', 'cover-up', 'repeated-poles', 'complex-poles', 'challenge'] },
];

// Probe that captures the latest registered anchor-id list from context.
function makeProbe(sink: { ids: string[] }) {
  return function AnchorProbe() {
    const { anchors } = useScrollSpy();
    sink.ids = anchors.map((a) => a.id);
    return null;
  };
}

function withProvider(children: ReactNode) {
  const rootEl = document.createElement('div');
  document.body.appendChild(rootEl);
  const rootRef = { current: rootEl } as React.RefObject<HTMLElement | null>;
  return <ScrollSpyProvider rootRef={rootRef}>{children}</ScrollSpyProvider>;
}

describe('Non-EM SectionAnchor wrapper-swap', () => {
  it.each(CASES)('$name registers its anchors into scroll-spy in document order', ({ Section, anchors }) => {
    const sink = { ids: [] as string[] };
    const Probe = makeProbe(sink);

    render(
      withProvider(
        <MemoryRouter>
          <Section />
          <Probe />
        </MemoryRouter>,
      ),
    );

    // Only a <SectionAnchor> registers into context — a bare inner-element id
    // would leave this empty. Equality also catches reordered/dropped anchors.
    expect(sink.ids).toEqual(anchors);
  });

  it.each(CASES)('$name keeps each anchor id unique and scroll-margined', ({ Section, anchors }) => {
    const { container } = render(
      <MemoryRouter>
        <Section />
      </MemoryRouter>,
    );

    for (const id of anchors) {
      const matches = container.querySelectorAll(`[id="${id}"]`);
      // Exactly one element per id — the migration must remove the inner id.
      expect(matches.length, `#${id} should appear exactly once`).toBe(1);
      // The id-bearing element is the scroll target; it must carry the margin.
      expect((matches[0] as HTMLElement).className, `#${id} should carry scroll-mt-4`).toContain('scroll-mt-4');
    }
  });
});
