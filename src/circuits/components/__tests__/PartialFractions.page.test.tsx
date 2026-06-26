import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PartialFractions } from '@circuits/components/modules/PartialFractions/index';
import { SLOTS, FACTORS } from '@circuits/components/modules/PartialFractions/coverUpData';

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

const GATE_CORRECT = 's = −8';

/** Walk one cover-up slot through its full happy path in the UI. */
async function solveSlot(user: UserEvent, slot: 'A' | 'B' | 'C') {
  await user.click(screen.getByRole('button', { name: `Solve coefficient ${slot}` }));
  await user.click(screen.getByRole('button', { name: FACTORS[SLOTS[slot].factor].label }));
  const correct = SLOTS[slot].evalChoices.find((c) => c.correct)!;
  await user.click(screen.getByRole('button', { name: correct.label }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
}

describe('PartialFractions page', () => {
  it('gates the cover-up bench behind a Predict First prediction', () => {
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cover the factor (s+8)' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Solve coefficient B' })).toBeNull();
  });

  it('renders heading, ToC, and the coefficient slots after passing the gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    await passPredictionGate(user, GATE_CORRECT);
    expect(screen.getByRole('heading', { level: 1, name: /Partial Fractions/ })).toBeInTheDocument();
    expect(screen.getByText('Jump to:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solve coefficient A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solve coefficient B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solve coefficient C' })).toBeInTheDocument();
  });

  it('coaches a wrong factor pick for B, drops the thumb, and harvests −18', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    await passPredictionGate(user, GATE_CORRECT);
    await user.click(screen.getByRole('button', { name: 'Solve coefficient B' }));
    await user.click(screen.getByRole('button', { name: 'Cover the factor s' }));
    expect(screen.getByText(/pole lives at/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cover the factor (s+8)' }));
    expect(screen.getByRole('img', { name: 'covered factor' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 's = −8' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('B = −18')).toBeInTheDocument();
  });

  it('coaches a wrong evaluation point before accepting the pole', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    await passPredictionGate(user, GATE_CORRECT);
    await user.click(screen.getByRole('button', { name: 'Solve coefficient A' }));
    await user.click(screen.getByRole('button', { name: 'Cover the factor s' }));
    await user.click(screen.getByRole('button', { name: 's = −5' }));
    expect(screen.getByText(/evaluates at the POLE/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 's = 0' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  // 23 user-event clicks over a large page — needs more than the 20s default.
  it('assembles f(t) after all three slots and verifies the theorem detectors', { timeout: 90000 }, async () => {
    const user = userEvent.setup();
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    await passPredictionGate(user, GATE_CORRECT);
    await solveSlot(user, 'A');
    await solveSlot(user, 'B');
    await solveSlot(user, 'C');
    expect(screen.getByText('3 thumb-covers · 0 simultaneous equations')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(screen.getAllByText('awaiting all terms')).toHaveLength(2);
    for (const box of checkboxes) {
      await user.click(box);
    }
    expect(screen.getAllByText('verified')).toHaveLength(2);
  });

  it('accepts the improper-fraction concept check answer', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PartialFractions />, '/partial-fractions');
    await user.click(screen.getByText('polynomial-divide — the fraction is improper (deg 3 ≥ deg 2)'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });
});
