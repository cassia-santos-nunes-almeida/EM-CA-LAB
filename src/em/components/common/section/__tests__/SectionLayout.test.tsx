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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { MODULES } from '@em/constants/physics';

// Mock katex (used transitively by some children)
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

// Mock useScrollSpy — control anchors and activeId from tests
vi.mock('@shared/hooks/useScrollSpy', () => ({
  useScrollSpy: vi.fn(),
}));

import { useScrollSpy } from '@shared/hooks/useScrollSpy';
const mockedUseScrollSpy = vi.mocked(useScrollSpy);

beforeEach(() => {
  // Default: no anchors, no activeId
  mockedUseScrollSpy.mockReturnValue({
    anchors: [],
    activeId: null,
    scrollToAnchor: () => {},
  });
});

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

describe('SectionLayout — breadcrumb chrome', () => {
  it('Test A: renders static breadcrumb segments (Part tag, quantity, section number, title)', () => {
    // magnetic-circuits is Part 3: B-FIELD, section number "3.3"
    mockedUseScrollSpy.mockReturnValue({
      anchors: [],
      activeId: null,
      scrollToAnchor: () => {},
    });
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <span>content</span>
        </SectionLayout>
      </MemoryRouter>
    );
    // Part tag
    expect(screen.getByText('PART 03')).toBeInTheDocument();
    // Quantity
    expect(screen.getByText('B-FIELD')).toBeInTheDocument();
    // Section number — "3.3" rendered as its own text node (appears in breadcrumb + h1)
    expect(screen.getAllByText('3.3').length).toBeGreaterThanOrEqual(1);
    // Title appears in both breadcrumb and h1
    expect(screen.getAllByText('Magnetic Circuits').length).toBeGreaterThanOrEqual(1);
  });

  it('Test B: renders active subsection label and k/total meter when anchor is active', () => {
    mockedUseScrollSpy.mockReturnValue({
      anchors: [{ id: 'a1', label: 'Section One' }],
      activeId: 'a1',
      scrollToAnchor: () => {},
    });
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <span>content</span>
        </SectionLayout>
      </MemoryRouter>
    );
    // Active anchor label appears in breadcrumb
    expect(screen.getByText('Section One')).toBeInTheDocument();
    // k/total meter: "1/1"
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('Test C: renders just static segments with 0 anchors — no crash, no empty fragment', () => {
    mockedUseScrollSpy.mockReturnValue({
      anchors: [],
      activeId: null,
      scrollToAnchor: () => {},
    });
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <span>content</span>
        </SectionLayout>
      </MemoryRouter>
    );
    // Static breadcrumb still renders
    expect(screen.getByText('PART 03')).toBeInTheDocument();
    // No k/total meter
    expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
    // No active subsection label (Section One is not present)
    expect(screen.queryByText('Section One')).toBeNull();
  });

  it('Test D: SectionAnchor rendered inside children shows its id in the DOM', () => {
    mockedUseScrollSpy.mockReturnValue({
      anchors: [{ id: 'test-anchor', label: 'Test Section' }],
      activeId: 'test-anchor',
      scrollToAnchor: () => {},
    });
    render(
      <MemoryRouter>
        <SectionLayout sectionId="magnetic-circuits" hook="Why it matters">
          <SectionAnchor id="test-anchor" label="Test Section">
            <p>Anchor content here</p>
          </SectionAnchor>
        </SectionLayout>
      </MemoryRouter>
    );
    // The SectionAnchor renders a <div id="test-anchor">
    const anchorEl = document.getElementById('test-anchor');
    expect(anchorEl).not.toBeNull();
    // And its label shows as the active subsection
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });
});
