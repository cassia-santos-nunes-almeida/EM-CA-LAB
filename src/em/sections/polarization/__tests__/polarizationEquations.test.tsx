import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import { PolarizationSection } from '../index';

// Mock katex so MathWrapper renders the raw LaTeX, making the displayed
// equation panel assertable as text (the "call-site binding" this test pins:
// rendered formula string == the sim's actual phase convention).
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

function renderPolarizationSection() {
  return render(
    <MemoryRouter>
      <PolarizationSection />
    </MemoryRouter>,
  );
}

/** True if any rendered MathWrapper contains the given LaTeX substring. */
function hasFormula(sub: string): boolean {
  return screen.queryAllByText((content) => content.includes(sub)).length > 0;
}

/**
 * Audit P-07: panel displayed E_y = e_y·cos(kz − ωt + δ) while the sim animates
 * cos(ωt − kz + δ). cos is even ⇒ the displayed δ has the OPPOSITE sign, so a
 * student expanding the printed equation derives the opposite rotation sense
 * from the labeled handedness state.
 */
it('equation panel uses the sim convention cos(ωt − kz + δ) (P-07)', () => {
  renderPolarizationSection();
  expect(hasFormula(String.raw`\cos(\omega t - kz`)).toBe(true);
  expect(hasFormula(String.raw`\cos(kz - \omega t`)).toBe(false);
});
