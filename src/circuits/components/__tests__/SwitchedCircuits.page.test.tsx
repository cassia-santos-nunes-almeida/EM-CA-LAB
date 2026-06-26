import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SwitchedCircuits } from '@circuits/components/modules/SwitchedCircuits/index';
import { getSectionNumber } from '@shared/constants/curriculum';

// Local copies of the pages.test.tsx helpers (parallel-work convention:
// new sections get their own test file and replicate the tiny helpers).
function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByText(/COMMIT PREDICTION/i));
}

const GATE_CORRECT = '8 V — exactly what it held at 0⁻';
const BOUNDARY_TAB = 'The 0⁻/0⁺ Boundary';
const RECIPE_TAB = 'The First-Order Recipe';
const SECOND_ORDER_TAB = 'Second Order: A₁ & A₂';

describe('SwitchedCircuits page', () => {
  it('gates the bench behind a blocking Predict First prediction with no Skip control', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /pre-switch source/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull();
  });

  it('reveals all four bench sliders after passing the gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    await passPredictionGate(user, GATE_CORRECT);
    expect(screen.getByRole('slider', { name: /pre-switch source/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /post-switch source/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /R₃/ })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /C = 25 µF/ })).toBeInTheDocument();
  });

  it('shows the worked-example readouts digit for digit at the bench defaults', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    await passPredictionGate(user, GATE_CORRECT);
    expect(screen.getByText('8.00 V')).toBeInTheDocument();
    expect(screen.getByText('20.0 V')).toBeInTheDocument();
    expect(screen.getByText('50.0 ms')).toBeInTheDocument();
    expect(screen.getByText('0 → 6.00 mA')).toBeInTheDocument();
  });

  it('doubles τ and halves the current jump when R₃ moves from 2 kΩ to 4 kΩ', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    await passPredictionGate(user, GATE_CORRECT);
    fireEvent.change(screen.getByRole('slider', { name: /R₃/ }), { target: { value: '4' } });
    expect(screen.getByText('100.0 ms')).toBeInTheDocument();
    expect(screen.getByText('0 → 3.00 mA')).toBeInTheDocument();
  });

  it('applies the Discharge preset: aria-pressed moves, final value 0.0 V, jump 0 → −4.00 mA', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    await passPredictionGate(user, GATE_CORRECT);
    const worked = screen.getByRole('button', { name: 'Worked example' });
    const discharge = screen.getByRole('button', { name: 'Discharge (V₂ = 0)' });
    expect(worked).toHaveAttribute('aria-pressed', 'true');
    expect(discharge).toHaveAttribute('aria-pressed', 'false');
    await user.click(discharge);
    expect(discharge).toHaveAttribute('aria-pressed', 'true');
    expect(worked).toHaveAttribute('aria-pressed', 'false');
    // v_C(∞) readout drops to 0 and the current jump flips sign (U+2212 minus).
    expect(screen.getByText('0.0 V')).toBeInTheDocument();
    expect(screen.getByText('0 → −4.00 mA')).toBeInTheDocument();
    // v_C(0⁺) is untouched by the preset — still the divider's 8 V.
    expect(screen.getByText('8.00 V')).toBeInTheDocument();
  });

  it("surfaces the inductive-kick exercise's progressive hints", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    // The recipe tab has two hint sources (CC-2 and the YourTurnPanel); click both.
    for (const btn of screen.getAllByRole('button', { name: 'Need a hint?' })) {
      await user.click(btn);
    }
    expect(
      screen.getByText('At DC an inductor is a short — which resistor does it bypass before the switch opens?'),
    ).toBeInTheDocument();
  });

  it('keeps the bench unlocked after tabbing away and back (lifted gate state)', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    await passPredictionGate(user, GATE_CORRECT);
    await user.click(screen.getByRole('tab', { name: BOUNDARY_TAB }));
    expect(screen.queryByRole('slider')).toBeNull();
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    expect(screen.getByRole('slider', { name: /pre-switch source/i })).toBeInTheDocument();
    expect(screen.queryByText('Predict First')).toBeNull();
  });

  it('walks the first-order WorkedSteps through all six reveals', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    expect(screen.getByRole('button', { name: 'Reveal step 2 of 6' })).toBeInTheDocument();
    for (let step = 2; step <= 6; step++) {
      await user.click(screen.getByRole('button', { name: `Reveal step ${step} of 6` }));
    }
    expect(screen.getByText('All steps revealed')).toBeInTheDocument();
  });

  it('renders the numbered h1 and one concept check per tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SwitchedCircuits />, '/switched-circuits');
    const heading = screen.getByRole('heading', { level: 1, name: /Switched Circuits & Initial Conditions/i });
    expect(heading).toHaveTextContent(getSectionNumber('switched-circuits'));
    // CC-1 on the default (boundary) tab:
    expect(screen.getByText(/interrupting the only current path/i)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: RECIPE_TAB }));
    expect(screen.getByText(/What is v one time constant later/i)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: SECOND_ORDER_TAB }));
    expect(screen.getByText(/capacitor-voltage slope zero/i)).toBeInTheDocument();
  });
});
