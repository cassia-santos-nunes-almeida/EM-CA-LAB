import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BounceDiagram } from '@transmission/components/simulations/BounceDiagram';

const gammaSlider = (name: RegExp) =>
  screen.getByRole('slider', { name }) as HTMLInputElement;

/**
 * #9 batch 2 — bounce-diagram steady-state stability guard (Appendix A.1#9).
 * Asserted via the RENDERED V_ss readout (the component renders its OWN local
 * steadyStateVoltage; the test-only transmissionMath util is a false-green trap, B.2).
 */
describe('BounceDiagram V_ss readout flags |Γ_L·Γ_S| ≥ 1 as unstable (A.1#9)', () => {
  it('shows "∞ (unstable)" for Γ_L=+1, Γ_S=−1 — sustained oscillation, no steady state', () => {
    render(<BounceDiagram />);
    fireEvent.change(gammaSlider(/at Load/i), { target: { value: '1' } });
    fireEvent.change(gammaSlider(/at Source/i), { target: { value: '-1' } });
    // The closed form V0(1+Γ_L)/(1−Γ_LΓ_S) = 10·2/2 = 10 V is NOT a real limit here
    // (the partial sums oscillate 10/20/10/0 forever), so the readout must say unstable.
    expect(screen.getByText(/unstable/i)).toBeInTheDocument();
  });

  it('still shows a finite V_ss for a converging setting (default Γ_L=0.5, Γ_S=0)', () => {
    render(<BounceDiagram />);
    expect(screen.queryByText(/unstable/i)).not.toBeInTheDocument();
  });
});
