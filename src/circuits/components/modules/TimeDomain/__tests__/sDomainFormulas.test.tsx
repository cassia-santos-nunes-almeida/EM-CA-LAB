import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TimeDomain } from '@circuits/components/modules/TimeDomain/index';

// Mock katex so MathWrapper renders the raw LaTeX, making the displayed s-domain
// transfer functions assertable as text (the "call-site binding" the correctness
// net pins: rendered formula string == the correct algebra).
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

function renderTimeDomain() {
  return render(
    <MemoryRouter initialEntries={['/circuit-analysis']}>
      <TimeDomain />
    </MemoryRouter>,
  );
}

/** True if any rendered MathWrapper contains the given LaTeX substring. */
function hasFormula(sub: string): boolean {
  return screen.queryAllByText((content) => content.includes(sub)).length > 0;
}

/**
 * #9 batch 1 — s-domain transcription correctness (Appendix A.1#1, A.1#2, A.2#1).
 * The derivation panels are gated behind the Predict-First gate; RC is default,
 * RLC is a tab, and the RLC natural-response card lives in the collapsible
 * "Circuit Response Types" section.
 */
describe('TimeDomain s-domain transfer functions are algebraically correct', () => {
  async function passGate(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'τ doubles; pole moves toward the origin (slower)' }));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));
  }

  it('RC step current I(s) has no spurious factor of s (A.1#1)', async () => {
    const user = userEvent.setup();
    renderTimeDomain();
    await passGate(user); // RC tab is the default

    // Correct: I(s) = V_s C / (RCs + 1). The spurious-s form V_s C / [s(RCs+1)]
    // inverse-transforms to an extra non-decaying DC term (and is units-wrong).
    expect(hasFormula(String.raw`= \frac{V_s C}{RCs + 1}`)).toBe(true);
    expect(hasFormula(String.raw`\frac{V_s C}{s(RCs + 1)}`)).toBe(false);
  });

  it('RLC natural response does not double-count the decay (A.2#1)', async () => {
    const user = userEvent.setup();
    renderTimeDomain();
    await passGate(user);

    // Reveal the "Circuit Response Types" collapsible (closed by default).
    await user.click(screen.getByRole('button', { name: /Circuit Response Types/i }));

    // s₁,s₂ are the FULL poles, so v(t) = A₁e^{s₁t}+A₂e^{s₂t}; the e^{-αt} prefactor
    // would apply the decay twice.
    expect(hasFormula(String.raw`v(t) = A_1 e^{s_1 t} + A_2 e^{s_2 t}`)).toBe(true);
    expect(hasFormula(String.raw`e^{-\alpha t}(A_1 e^{s_1 t}`)).toBe(false);
  });

  it('RLC step capacitor voltage V_C(s) keeps the 1/s of the step input (A.1#2)', async () => {
    const user = userEvent.setup();
    renderTimeDomain();
    await passGate(user);
    await user.click(screen.getByRole('button', { name: 'RLC Circuit' }));

    // Correct: V_C(s) = V_s / [s(s²LC + sRC + 1)]. The s-less form gives V_C(∞)=0
    // by the final-value theorem, but a capacitor charges to V_s under a step.
    expect(hasFormula(String.raw`V_C(s) = \frac{V_s}{s(s^2LC + sRC + 1)}`)).toBe(true);
    expect(hasFormula(String.raw`\frac{V_s}{s^2LC + sRC + 1}`)).toBe(false);
  });

  it('Step 4 damping solutions carry the forced term V_s (audit P-04)', async () => {
    const user = userEvent.setup();
    renderTimeDomain();
    await passGate(user);
    await user.click(screen.getByRole('button', { name: 'RLC Circuit' })); // circuit tabs render as buttons — same query as the test at :70

    // Driven step equation (Step 3 RHS = V_s/LC) ⇒ complete response = V_s + natural modes.
    expect(hasFormula(String.raw`v(t) = V_s + A_1e^{s_1t} + A_2e^{s_2t}`)).toBe(true);
    expect(hasFormula(String.raw`v(t) = V_s + (A_1 + A_2t)e^{-\alpha t}`)).toBe(true);
    expect(hasFormula(String.raw`v(t) = V_s + e^{-\alpha t}(A_1\cos(\omega_d t) + A_2\sin(\omega_d t))`)).toBe(true);
    // The old source-free forms must be gone from Step 4 (unspaced variants —
    // the SPACED natural-response card in ResponseComparisons stays and is
    // asserted true elsewhere in this file).
    expect(hasFormula(String.raw`v(t) = A_1e^{s_1t} + A_2e^{s_2t}`)).toBe(false);
  });
});
