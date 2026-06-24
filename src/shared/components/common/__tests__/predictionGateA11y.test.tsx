import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionGate } from '@shared/components/common/PredictionGate';

/**
 * Accessibility contract for the predict-first gate (one fix, ~30 call sites):
 *  - the prediction result is announced via an aria-live status region;
 *  - on the Continue/Skip reveal, focus moves into the revealed content so
 *    keyboard / screen-reader users are not left behind on a now-gone prompt.
 *    Most reveals are <canvas> sims with no heading, so focus targets a generic
 *    tabIndex=-1 wrapper, NOT a heading;
 *  - a gate that remounts already-passed (initialPassed) must NOT steal focus —
 *    that path is a silent state restore (e.g. a Tabs panel), not a user action.
 */

const base = {
  question: 'Pick the right one',
  options: [
    { id: 'a', label: 'Option A' },
    { id: 'b', label: 'Option B' },
  ],
  getCorrectAnswer: () => 'a',
  explanation: <span>because A is right</span>,
};

describe('PredictionGate — accessibility', () => {
  it('announces the result in an aria-live status region after answering', async () => {
    const user = userEvent.setup();
    render(
      <PredictionGate {...base}>
        <canvas data-testid="sim" />
      </PredictionGate>,
    );
    await user.click(screen.getByText('Option A'));
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(/Correct/i);
  });

  it('moves focus into the revealed content on Continue (wrapper, not a heading)', async () => {
    const user = userEvent.setup();
    render(
      <PredictionGate {...base}>
        <canvas data-testid="sim" />
      </PredictionGate>,
    );
    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByText('Continue'));

    const wrapper = screen.getByTestId('sim').parentElement!;
    expect(wrapper).toHaveAttribute('tabindex', '-1');
    expect(wrapper).toBe(document.activeElement);
  });

  it('moves focus into the revealed content on Skip too', async () => {
    const user = userEvent.setup();
    render(
      <PredictionGate {...base} allowSkip>
        <canvas data-testid="sim" />
      </PredictionGate>,
    );
    await user.click(screen.getByText('Skip'));
    const wrapper = screen.getByTestId('sim').parentElement!;
    expect(wrapper).toBe(document.activeElement);
  });

  it('does NOT steal focus when remounting already-passed (initialPassed)', () => {
    render(
      <PredictionGate {...base} initialPassed>
        <canvas data-testid="sim" />
      </PredictionGate>,
    );
    // content is shown, but focus stays where it was (the body) — no yank.
    expect(screen.getByTestId('sim')).toBeInTheDocument();
    const wrapper = screen.getByTestId('sim').parentElement!;
    expect(wrapper).not.toBe(document.activeElement);
    expect(document.body).toBe(document.activeElement);
  });
});
