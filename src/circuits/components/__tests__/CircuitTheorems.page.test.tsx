import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CircuitTheorems } from '@circuits/components/modules/CircuitTheorems/index';

// Local copies of the pages.test.tsx helpers (accepted duplication — parallel
// section builders must not edit the shared test file).
function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('CircuitTheorems page', () => {
  it('gates all three benches behind Predict First predictions', () => {
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    expect(screen.getAllByText('Predict First')).toHaveLength(3);
    // Gated content is hidden: knock-out toggles and the black-box instrument
    expect(screen.queryByRole('button', { name: /24 V source:/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Measure V_oc' })).toBeNull();
  });

  it('reveals the knock-out bench after passing its gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, 'an open circuit (break the branch)');
    expect(screen.getByRole('heading', { level: 1, name: /Circuit Theorems/ })).toBeInTheDocument();
    expect(screen.getByText('Jump to:')).toBeInTheDocument();
    // Both source toggles render pressed (both sources start ON)
    expect(screen.getByRole('button', { name: /24 V source:/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /2 A source:/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('12.0 V')).toBeInTheDocument();
  });

  it('knocks out sources and reads the superposed node voltage', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, 'an open circuit (break the branch)');
    // Turn the 2 A source off: 24 V alone gives 8 V
    await user.click(screen.getByRole('button', { name: /2 A source:/ }));
    expect(screen.getByText('8.0 V')).toBeInTheDocument();
    // Turn the 24 V source off too: dead circuit reads 0 V
    await user.click(screen.getByRole('button', { name: /24 V source:/ }));
    expect(screen.getByText('0.0 V')).toBeInTheDocument();
  });

  it('measures V_oc and I_sc on the black-box port and reveals the Thevenin twin', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, '2 Ω');
    await user.click(screen.getByRole('button', { name: 'Measure V_oc' }));
    expect(screen.getByText('12.0 V')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Measure I_sc' }));
    expect(screen.getByText('6.0 A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '12/6 = 2 Ω' }));
    expect(screen.getAllByText(/Thevenin twin/).length).toBeGreaterThan(0);
  });

  it('coaches a wrong R_th pick and stays on the question', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, '2 Ω');
    await user.click(screen.getByRole('button', { name: 'Measure V_oc' }));
    await user.click(screen.getByRole('button', { name: 'Measure I_sc' }));
    await user.click(screen.getByRole('button', { name: '12 × 6 = 72 Ω' }));
    expect(screen.getByText(/volts PER amp/)).toBeInTheDocument();
    // Still on the question: the correct choice is still offered
    expect(screen.getByRole('button', { name: '12/6 = 2 Ω' })).toBeInTheDocument();
  });

  it('fills the congruence table for all four loads and declares them indistinguishable', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, '2 Ω');
    await user.click(screen.getByRole('button', { name: 'Measure V_oc' }));
    await user.click(screen.getByRole('button', { name: 'Measure I_sc' }));
    await user.click(screen.getByRole('button', { name: '12/6 = 2 Ω' }));
    await user.click(screen.getByRole('button', { name: 'Attach loads' }));
    for (const label of ['1 Ω', '2 Ω', '4 Ω', '10 Ω']) {
      await user.click(screen.getByRole('button', { name: label }));
    }
    expect(screen.getByText(/Indistinguishable at the terminals/)).toBeInTheDocument();
  });

  it('answers the superposition concept check correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await user.click(screen.getByText('6 ∥ 3 = 2 Ω'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });

  it('morphs the Thevenin twin into its Norton dual via the toggle', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    const toggle = screen.getByRole('button', { name: 'Norton form' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Thevenin equivalent: 12 V in series/)).toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Norton equivalent: 6 A in parallel/)).toBeInTheDocument();
  });

  it('reveals the max-power bench with the catalog answer table after its gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    await passPredictionGate(user, 'R_L = R_th = 2 Ω');
    expect(screen.getByText('18 W — the winner')).toBeInTheDocument();
  });

  it('renders the ungated Sanity-Check Triad anchor with its TOC entry', () => {
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    expect(screen.getByRole('heading', { level: 2, name: /The Sanity-Check Triad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Sanity-Check Triad' })).toHaveAttribute('href', '#sanity');
    // All three test cards are visible without passing any gate
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('Limiting cases')).toBeInTheDocument();
    expect(screen.getByText('Magnitude & bounds')).toBeInTheDocument();
  });

  it('rejects the 6 A report via the bounds test in the critique concept check', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CircuitTheorems />, '/circuit-theorems');
    // Critique question is ungated
    expect(screen.getByText(/reports i_L = 6 A/)).toBeInTheDocument();
    // Pick the bounds option (names the short-circuit current as the ceiling)
    await user.click(screen.getByText(/the ceiling for ANY load/));
    // Its explanation reveals the bounds reasoning
    expect(screen.getByText(/dead short across the port/)).toBeInTheDocument();
  });
});
