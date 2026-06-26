import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MagneticCircuitsSection } from '@em/sections/magnetic-circuits/index';
import { useProgressStore } from '@shared/store/progressStore';

// Mock katex (sections.test.tsx convention): MathWrapper's katex.render call
// falls back to textContent = formula, so raw LaTeX strings are searchable text.
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

// Local copies of the page-test helpers (parallel-work convention:
// new section page tests replicate the tiny helpers).
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/magnetic-circuits']}>
      <MagneticCircuitsSection />
    </MemoryRouter>,
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByText(/COMMIT PREDICTION/i));
}

const GAP_GATE_CORRECT = 'Collapses about 50× — the 1% gap out-resists the 99% core';

/** Read the section's prediction-gate counters from the progress store. */
function readGateCounters() {
  const s = useProgressStore.getState().sections['magnetic-circuits'];
  return {
    answered: s?.predictionGatesAnswered ?? 0,
    correct: s?.predictionGatesCorrect ?? 0,
  };
}

describe('MagneticCircuits page — solve it by hand (unit 2F)', () => {
  it('renders Worked Example 1 ungated under the Solve it by hand heading, with the B = 4 T exhibit', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /solve it by hand/i })).toBeInTheDocument();
    // Worked Example 1 sits in front of any gate: the sim's own toroid, on paper.
    expect(screen.getByText(/Step 1 — Path and reluctance/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify against the instrument/i)).toBeInTheDocument();
    // The two 2E plausibility callouts (§3A saturation exhibit + §3D pass).
    expect(screen.getAllByText('Does this make sense?')).toHaveLength(2);
    expect(screen.getByText(/should bother you/i)).toBeInTheDocument();
  });

  it('blocks Worked Example 2 behind the new magnitude gate with no Skip control', () => {
    renderPage();
    // Both the sim gate and the new gap gate are locked on first visit.
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
    expect(screen.getByText(/1% of the flux path/i)).toBeInTheDocument();
    // Absence-pin: the gated worked example must NOT leak pre-pass.
    expect(screen.queryByText(/Reluctance of the gap/i)).toBeNull();
    expect(screen.queryByText(/now cut the gap/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull();
  });

  it('reveals Worked Example 2 after a correct prediction and marks the gate in the store', async () => {
    const user = userEvent.setup();
    renderPage();
    const before = readGateCounters();
    await passPredictionGate(user, GAP_GATE_CORRECT);
    expect(screen.getByText(/Step 3 — Reluctance of the gap/i)).toBeInTheDocument();
    expect(screen.getByText(/Where did the MMF go/i)).toBeInTheDocument();
    const after = readGateCounters();
    expect(after.answered).toBe(before.answered + 1);
    expect(after.correct).toBe(before.correct + 1);
  });

  it('runs the inverse-design Your Turn: correct reveal, then the air-core distractor', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(/run the magnetic circuit backwards/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'N = 50 turns' }));
    expect(screen.getByText(/L = 50\.00 mH/)).toBeInTheDocument();
    // Grading oracle: 'Updated Values' is the correct-branch-ONLY header
    // (the reveal itself renders after ANY selection, so it cannot catch a
    // correct flag accidentally moved to another option).
    expect(screen.getByText('Updated Values')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    await user.click(screen.getByRole('button', { name: 'N = 250,000 turns' }));
    expect(screen.getByText(/air-core answer/i)).toBeInTheDocument();
    // The distractor must be graded WRONG: correct-only header absent,
    // wrong-branch header present.
    expect(screen.queryByText('Updated Values')).toBeNull();
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();
  });

  it('adds the series-MMF concept check and keeps the original three', async () => {
    const user = userEvent.setup();
    renderPage();
    // Regression: the three pre-existing checks still render.
    expect(screen.getByText(/reluctance analogous/i)).toBeInTheDocument();
    expect(screen.getByText(/air gap is introduced/i)).toBeInTheDocument();
    expect(screen.getByText(/N₁ = 100 and N₂ = 500/)).toBeInTheDocument();
    // CC-4: MMF divides in proportion to reluctance.
    expect(screen.getByText(/half iron/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ferrite takes 5× more — MMF divides in proportion to reluctance' }),
    );
    expect(screen.getByText(/166\.7 A·t versus 33\.3 A·t/)).toBeInTheDocument();
  });

  it('adds the hand-check instruction to the guided challenge', () => {
    renderPage();
    expect(screen.getByText(/Hand-check that baseline before touching anything else/i)).toBeInTheDocument();
  });
});
