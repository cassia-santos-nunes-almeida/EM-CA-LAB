import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@shared/components/layout/Sidebar';

function renderSidebar() {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders the masthead heading and Course Home', () => {
    renderSidebar();
    expect(screen.getByRole('heading', { name: /EM&AC Lab/ })).toBeInTheDocument();
    expect(screen.getByText('Course Home')).toBeInTheDocument();
  });

  it('labels each Part with a mono PART · QUANTITY eyebrow', () => {
    renderSidebar();
    expect(screen.getByText(/PART 01/)).toHaveTextContent('CIRCUITS');
    expect(screen.getByText(/PART 03/)).toHaveTextContent('B-FIELD');
  });

  it('keeps the full Part title available to assistive tech (Variant B sr-only)', () => {
    renderSidebar();
    expect(screen.getByText(/Circuit Analysis, Laplace/)).toBeInTheDocument();
  });
});
