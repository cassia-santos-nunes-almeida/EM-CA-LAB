import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InteractiveLab } from '@circuits/components/modules/InteractiveLab';

// Mock katex so MathWrapper renders the raw LaTeX, making the displayed transfer
// function assertable as text (same call-site-binding the #9 net uses).
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

/** True if any rendered MathWrapper contains the given LaTeX substring. */
function hasFormula(sub: string): boolean {
  return screen.queryAllByText((content) => content.includes(sub)).length > 0;
}

function renderInteractiveLabRLCStep() {
  return render(
    <MemoryRouter initialEntries={['/interactive-lab']}>
      <InteractiveLab />
    </MemoryRouter>,
  );
}

/**
 * Audit P-01 (CRITICAL): the displayed overdamped STEP response was
 * v_C(t) = V_s(A_1 e^{s_1 t} + A_2 e^{s_2 t}) — no forced term, so it decays
 * to 0 for ANY constants, while the chart (and circuitSolver, RK4-verified)
 * pins v(0)=0, v(∞)=V_s. The card must show the complete response.
 */
describe('overdamped step card shows the complete response (P-01)', () => {
  it('carries the forced term and drops the old decaying form', () => {
    renderInteractiveLabRLCStep();
    expect(hasFormula(String.raw`v_C(t) = V_s + A_1 e^{s_1 t} + A_2 e^{s_2 t}`)).toBe(true);
    expect(hasFormula(String.raw`v_C(t) = V_s(A_1 e^{s_1 t} + A_2 e^{s_2 t})`)).toBe(false);
  });
});
