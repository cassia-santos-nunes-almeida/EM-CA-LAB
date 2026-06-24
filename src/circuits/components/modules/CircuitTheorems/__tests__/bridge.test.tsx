import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CircuitTheorems } from '@circuits/components/modules/CircuitTheorems';

vi.mock('katex', () => ({
  default: {
    renderToString: (s: string) => s,
    render: (s: string, el: HTMLElement) => {
      el.textContent = s;
    },
  },
}));

/**
 * Sweep N2 — the CircuitTheorems closing bridge said "the next section builds the
 * transform", but the curriculum puts Switched Circuits next (which explicitly avoids the
 * transform); the Laplace transform is built a few sections later. Same next-section-bridge
 * class as transformers A.1#12.
 */
describe('CircuitTheorems closing bridge points at the real next section (N2)', () => {
  it('does not claim the immediately-next section builds the transform', () => {
    render(
      <MemoryRouter initialEntries={['/circuit-theorems']}>
        <CircuitTheorems />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/next section builds the transform/i)).not.toBeInTheDocument();
  });
});
