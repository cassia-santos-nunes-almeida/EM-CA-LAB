import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PhasorAlgebra } from '../PhasorAlgebra';

vi.mock('katex', () => ({
  default: { renderToString: (latex: string) => `<span class="katex">${latex}</span>`, render: vi.fn() },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/math-phasors']}>
      <PhasorAlgebra />
    </MemoryRouter>,
  );
}

describe('math-phasors page (2A page-test contract)', () => {
  it('renders the numbered title and states Euler as the bridge, not a known fact', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /complex numbers & phasors/i })).toBeInTheDocument();
    // katex is mocked to pass raw LaTeX through, so the identity is string-greppable:
    expect(document.body.textContent).toContain('e^{j\\theta} = \\cos\\theta + j\\sin\\theta');
  });
  it('gates the multiplier behind a prediction with no skip control', () => {
    renderPage();
    expect(document.querySelector('[data-gate]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull();
    expect(screen.queryByTestId('phasor-product-readout')).toBeNull();
  });
  it('unlocks on a committed prediction and shows the deterministic 6∠75° readout', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /6∠75°/ }));
    await user.click(screen.getByRole('button', { name: /commit prediction|continue/i }));
    expect(await screen.findByTestId('phasor-product-readout')).toHaveTextContent('6.00∠75.0°');
  });
});
