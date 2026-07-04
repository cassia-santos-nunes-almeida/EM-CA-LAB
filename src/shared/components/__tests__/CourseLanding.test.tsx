import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseLanding } from '@shared/components/CourseLanding';
import { useProgressStore } from '@shared/store/progressStore';

function renderLanding() {
  render(
    <MemoryRouter>
      <CourseLanding />
    </MemoryRouter>,
  );
}

describe('CourseLanding', () => {
  // ── Original assertions (must stay green) ──────────────────────────────────

  it('shows a mono PART · QUANTITY tag for the first and last Part', () => {
    renderLanding();
    expect(screen.getByText(/PART 01/)).toHaveTextContent('CIRCUITS');
    expect(screen.getByText(/PART 05/)).toHaveTextContent('LINES');
  });

  it('deep-links each section name to its route (Part 2 collapsed)', () => {
    // Native <details> keeps collapsed children MOUNTED (just display-hidden),
    // so the link is always in the DOM regardless of which Part is open.
    renderLanding();
    const link = screen.getByRole('link', { name: "Coulomb's Law" });
    expect(link).toHaveAttribute('href', '/coulomb');
  });

  // ── New accordion-structure assertions ─────────────────────────────────────

  it('renders a <summary> row for all five Parts', () => {
    renderLanding();
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByTestId(`part-summary-${n}`)).toBeInTheDocument();
    }
  });

  it('shows a section count in each Part summary', () => {
    renderLanding();
    // Part 1 has 9 sections, Part 2 has 4, etc.
    expect(screen.getByTestId('section-count-1')).toHaveTextContent('9 sections');
    expect(screen.getByTestId('section-count-2')).toHaveTextContent('5 sections');
    expect(screen.getByTestId('section-count-5')).toHaveTextContent('4 sections');
  });

  it('all section deep-links are in the DOM even when their Part is collapsed', () => {
    renderLanding();
    // Spot-check one section per Part
    expect(screen.getByRole('link', { name: 'Component Physics' })).toHaveAttribute('href', '/component-physics');
    expect(screen.getByRole('link', { name: "Coulomb's Law" })).toHaveAttribute('href', '/coulomb');
    expect(screen.getByRole('link', { name: "Faraday's Law" })).toHaveAttribute('href', '/faraday');
    expect(screen.getByRole('link', { name: "Maxwell's Equations" })).toHaveAttribute('href', '/maxwell');
    expect(screen.getByRole('link', { name: 'Transmission Lines' })).toHaveAttribute('href', '/transmission-lines');
  });

  it('renders a Start-Part CTA for each Part pointing at the first section route', () => {
    renderLanding();
    // Part 1 first section = /component-physics
    expect(screen.getByTestId('start-part-1')).toHaveAttribute('href', '/component-physics');
    // Part 2 first section = /math-vectors
    expect(screen.getByTestId('start-part-2')).toHaveAttribute('href', '/math-vectors');
    // Part 5 first section = /lumped-distributed
    expect(screen.getByTestId('start-part-5')).toHaveAttribute('href', '/lumped-distributed');
  });

  // ── Visited / progress state ───────────────────────────────────────────────

  describe('when a section is visited', () => {
    beforeEach(() => {
      // Seed visited state directly into the store before rendering
      useProgressStore.setState({
        sections: {
          coulomb: {
            visited: true,
            predictionGatesAnswered: 0,
            predictionGatesCorrect: 0,
            conceptChecksCompleted: 0,
            hintsUsed: 0,
          },
        },
      });
    });

    it('shows a filled dot for the visited section', () => {
      renderLanding();
      // The visited Coulomb section's dot should have data-visited="true"
      // The section list items each contain a SectionDot with data-visited
      // We look for the dot adjacent to the Coulomb link
      const coulombLink = screen.getByRole('link', { name: "Coulomb's Law" });
      // The dot is a sibling span within the same <li>
      const li = coulombLink.closest('li');
      expect(li).not.toBeNull();
      const dot = li!.querySelector('[data-visited]');
      expect(dot).not.toBeNull();
      expect(dot).toHaveAttribute('data-visited', 'true');
    });

    it('shows an unfilled dot for a non-visited section', () => {
      renderLanding();
      // gauss is not visited
      const gaussLink = screen.getByRole('link', { name: "Gauss's Law" });
      const li = gaussLink.closest('li');
      const dot = li!.querySelector('[data-visited]');
      expect(dot).toHaveAttribute('data-visited', 'false');
    });
  });

  // ── Accessible page title ──────────────────────────────────────────────────

  it('has an accessible <h1> with the course title', () => {
    renderLanding();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Electromagnetism & Circuit Analysis');
  });

  // ── Part accordion structure ───────────────────────────────────────────────

  it('renders a part-accordion container', () => {
    renderLanding();
    expect(screen.getByTestId('part-accordion')).toBeInTheDocument();
  });
});
