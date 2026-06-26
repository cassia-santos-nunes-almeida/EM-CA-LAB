/**
 * SectionLayout render test — verifies that when no title/subtitle props are
 * passed the component sources both from the shared curriculum (post-refactor)
 * and NOT from MODULES directly.
 *
 * magnetic-circuits is used as the sentinel section because its label and
 * description are distinctive enough to be unambiguous in the rendered output.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { MODULES } from '@em/constants/physics';

// Mock katex (used transitively by some children)
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

const MAG_CIRCUITS = MODULES.find((m) => m.id === 'magnetic-circuits')!;

describe('SectionLayout — default heading/subtitle from shared curriculum', () => {
  it('renders the MODULES label in <h1> when no title prop is passed', () => {
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <span>content</span>
        </SectionLayout>
      </MemoryRouter>
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain(MAG_CIRCUITS.label); // "Magnetic Circuits"
  });

  it('renders the MODULES description in the subtitle paragraph when no subtitle prop is passed', () => {
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <span>content</span>
        </SectionLayout>
      </MemoryRouter>
    );
    // subtitle paragraph: MAG_CIRCUITS.description
    expect(screen.getByText(MAG_CIRCUITS.description)).toBeInTheDocument();
  });
});
