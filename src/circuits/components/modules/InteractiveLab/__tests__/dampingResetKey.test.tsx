import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { InteractiveLab } from '@circuits/components/modules/InteractiveLab';

/**
 * #3 — the RLC damping prediction gate grades against classifyDamping(zeta), so
 * its reset key must track that classification, not raw R/L/C buckets.
 *
 * Under the old log(1.2) bucketing (with the default L=0.1, C=0.0001 → R_crit≈63.25):
 *   - R=61 → zeta≈0.96 → UNDERDAMPED, old bucket 23
 *   - R=70 → zeta≈1.11 → OVERDAMPED,  old bucket 23  (SAME bucket!)
 * so crossing the zeta=1 boundary did NOT re-lock the gate — leaving a stale
 * "Correct!" verdict for the wrong damping category. Keying the reset on the
 * verdict (classifyDamping) fixes both this stale case and needless re-locks.
 */

function renderLab(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/interactive-lab${search}`]}>
      <InteractiveLab />
    </MemoryRouter>,
  );
}

/** The R slider is the range input spanning 1..10000. */
function rSlider(): HTMLInputElement {
  return screen.getAllByRole('slider').find(
    (s) => s.getAttribute('max') === '10000',
  ) as HTMLInputElement;
}

const GATE_Q = /what do you expect the step response to look like/i;

describe('InteractiveLab damping gate — reset tracks the verdict, not raw buckets', () => {
  it('re-locks when a change crosses the damping boundary within one old bucket', async () => {
    const user = userEvent.setup();
    renderLab('?R=61'); // zeta≈0.96 → underdamped

    // Predict correctly → the gate enters its answered state (Continue appears).
    await user.click(screen.getByRole('button', { name: /Underdamped/i }));
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();

    // Cross zeta=1 into overdamped — same old log(1.2) bucket as R=61.
    fireEvent.change(rSlider(), { target: { value: '70' } });

    // The gate MUST re-lock: the answered-state Continue is gone (no stale verdict).
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
    });
    expect(screen.getByText(GATE_Q)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overdamped/i })).toBeEnabled();
  });

  it('does NOT re-lock for a change that stays in the same damping category', async () => {
    const user = userEvent.setup();
    renderLab('?R=61'); // underdamped

    await user.click(screen.getByRole('button', { name: /Underdamped/i }));
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();

    // Still underdamped (zeta≈0.87). Old bucketing (61→bucket 23, 55→bucket 22)
    // would needlessly re-lock; verdict-keying must not.
    fireEvent.change(rSlider(), { target: { value: '55' } });

    // Let the deferred recompute and any re-lock flush, THEN assert the answered
    // state held (a positive assertion alone would pass before the re-lock fires).
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });
});
