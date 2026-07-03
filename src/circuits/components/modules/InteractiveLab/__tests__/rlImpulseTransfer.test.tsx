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

function renderRLImpulse() {
  return render(
    <MemoryRouter initialEntries={['/interactive-lab?circuit=RL&input=impulse']}>
      <InteractiveLab />
    </MemoryRouter>,
  );
}

function renderRCImpulse() {
  return render(
    <MemoryRouter initialEntries={['/interactive-lab?circuit=RC&input=impulse']}>
      <InteractiveLab />
    </MemoryRouter>,
  );
}

/**
 * #9 batch 2 — RL impulse S-domain transfer function (Appendix A.1#3).
 * The Circuit Equations panel is open by default and ungated; circuit/input
 * are URL-driven, so ?circuit=RL&input=impulse renders the S-Domain card directly.
 */
describe('InteractiveLab RL impulse transfer function is the current impulse response (A.1#3)', () => {
  it('prints H(s) = (1/L)/(s + R/L) — the transform of i(t)=(1/L)e^{-Rt/L}', () => {
    renderRLImpulse();
    expect(hasFormula(String.raw`H(s) = \frac{1/L}{s + R/L}`)).toBe(true);
    // The R-scaled form (R/L)/(s+R/L) is the dimensionless v_R/v_in transfer —
    // wrong quantity AND units under a "Current" heading.
    expect(hasFormula(String.raw`\frac{R/L}{s + R/L}`)).toBe(false);
  });

  it('RL time-domain impulse card carries the source factor V_s (audit P-02)', () => {
    renderRLImpulse(); // module-scope helper extracted above (render is synchronous)
    expect(hasFormula(String.raw`i(t) = \frac{V_s}{L}e^{-Rt/L}`)).toBe(true);
    expect(hasFormula(String.raw`i(t) = \frac{1}{L}e^{-Rt/L}`)).toBe(false);
    // H(s) is the UNIT-impulse transfer function and must stay V_s-free:
    expect(hasFormula(String.raw`H(s) = \frac{1/L}{s + R/L}`)).toBe(true);
  });
});

/**
 * RC impulse time-domain card sibling (audit P-02) — the solver plots the
 * response to V_s·δ(t) (vScale = Vs/(RC)), so the card must carry V_s too.
 */
describe('InteractiveLab RC impulse time-domain card carries V_s (audit P-02)', () => {
  it('RC time-domain impulse card carries the source factor V_s', () => {
    renderRCImpulse();
    expect(hasFormula(String.raw`v_C(t) = \frac{V_s}{RC}e^{-t/\tau}`)).toBe(true);
    expect(hasFormula(String.raw`v_C(t) = \frac{1}{RC}e^{-t/\tau}`)).toBe(false);
    // H(s) is the UNIT-impulse transfer function and must stay V_s-free:
    expect(hasFormula(String.raw`H(s) = \frac{1/RC}{s + 1/RC}`)).toBe(true);
  });
});
