import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionGate } from '@shared/components/common/PredictionGate';

/**
 * Coverage for the predict-first persistence contract used by the chaptered
 * lab layout: a blocking gate hides the simulation until the student commits,
 * fires onPassed when it unlocks, and — given initialPassed — renders the
 * simulation immediately so a remounted panel (TabSet remounts on tab switch)
 * does not re-lock and demand a second prediction.
 */

const opts = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' },
];

const base = {
  question: 'Pick the right one',
  options: opts,
  getCorrectAnswer: () => 'a',
  explanation: <span>because A is right</span>,
};

describe('PredictionGate — persistence', () => {
  it('renders children immediately when initialPassed is true', () => {
    render(
      <PredictionGate {...base} allowSkip={false} initialPassed>
        <div>the simulation</div>
      </PredictionGate>,
    );
    expect(screen.getByText('the simulation')).toBeInTheDocument();
    expect(screen.queryByText('Pick the right one')).not.toBeInTheDocument();
  });

  it('hides children until answered + continued, then fires onPassed once', async () => {
    const user = userEvent.setup();
    const onPassed = vi.fn();
    render(
      <PredictionGate {...base} allowSkip={false} onPassed={onPassed}>
        <div>the simulation</div>
      </PredictionGate>,
    );
    // blocking: simulation hidden behind the prompt
    expect(screen.queryByText('the simulation')).not.toBeInTheDocument();
    expect(onPassed).not.toHaveBeenCalled();

    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByText('Continue'));

    expect(onPassed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('the simulation')).toBeInTheDocument();
  });

  it('omits the Skip control when allowSkip is false (no scroll-free bypass)', () => {
    render(
      <PredictionGate {...base} allowSkip={false}>
        <div>the simulation</div>
      </PredictionGate>,
    );
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });
});
