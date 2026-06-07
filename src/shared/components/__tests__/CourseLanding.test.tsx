import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseLanding } from '@shared/components/CourseLanding';

function renderLanding() {
  render(
    <MemoryRouter>
      <CourseLanding />
    </MemoryRouter>,
  );
}

describe('CourseLanding', () => {
  it('shows a mono PART · QUANTITY tag for the first and last Part', () => {
    renderLanding();
    expect(screen.getByText(/PART 01/)).toHaveTextContent('CIRCUITS');
    expect(screen.getByText(/PART 05/)).toHaveTextContent('LINES');
  });

  it('deep-links each section name to its route', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: "Coulomb's Law" });
    expect(link).toHaveAttribute('href', '/coulomb');
  });
});
