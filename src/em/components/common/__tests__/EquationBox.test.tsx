import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EquationBox } from '@em/components/common/EquationBox';

vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

describe('EquationBox', () => {
  it('renders title and equations', () => {
    const equations = [
      { label: 'Gauss', math: '\\nabla \\cdot E = \\rho' },
      { label: 'Faraday', math: '\\nabla \\times E = -\\partial B / \\partial t' },
    ];
    render(<EquationBox title="Maxwell Equations" equations={equations} />);
    expect(screen.getByText('Maxwell Equations')).toBeInTheDocument();
    expect(screen.getByText('Gauss')).toBeInTheDocument();
    expect(screen.getByText('Faraday')).toBeInTheDocument();
  });
});
