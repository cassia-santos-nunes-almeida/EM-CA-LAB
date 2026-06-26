import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LaplaceTheory } from '@circuits/components/modules/LaplaceTheory';

/**
 * #8 — the laplace-theory motivation gate lives inside a Tabs panel, which
 * remounts on tab switch (key={activeIndex}). Its unlocked state must be lifted
 * above the Tabs so leaving the tab and returning does NOT re-lock the gate and
 * force a second prediction. Without the lift, returning to the Theory tab hides
 * the already-revealed comparison behind the prompt again.
 */

function renderLaplace() {
  return render(
    <MemoryRouter>
      <LaplaceTheory />
    </MemoryRouter>,
  );
}

const GATE_PROMPT = /How many algebraic steps/;
const REVEALED = 'Time-Domain Approach (Classical ODE)';

describe('LaplaceTheory motivation gate — remount persistence', () => {
  it('stays unlocked after leaving the Theory tab and returning', async () => {
    const user = userEvent.setup();
    renderLaplace();

    // Gate is blocking: prompt shown, comparison hidden.
    expect(screen.getByText(GATE_PROMPT)).toBeInTheDocument();
    expect(screen.queryByText(REVEALED)).not.toBeInTheDocument();

    // Predict + continue -> comparison revealed.
    await user.click(screen.getByRole('button', { name: '4-6 steps' }));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByText(REVEALED)).toBeInTheDocument();

    // Leave to another tab and come back — the panel remounts.
    await user.click(screen.getByRole('tab', { name: /Tables & Properties/ }));
    await user.click(screen.getByRole('tab', { name: /Theory & Why Use/ }));

    // The gate must remain unlocked: comparison still visible, prompt not back.
    expect(screen.getByText(REVEALED)).toBeInTheDocument();
    expect(screen.queryByText(GATE_PROMPT)).not.toBeInTheDocument();
  });
});
