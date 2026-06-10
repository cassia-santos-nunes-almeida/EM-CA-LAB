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
 *
 * Skip policy: default-deny. A gate without an explicit `allowSkip` prop must
 * never render a Skip control; only resetKey re-locking gates opt in, and for
 * them Skip must pass the gate in one click.
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
      <PredictionGate {...base} initialPassed>
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
      <PredictionGate {...base} onPassed={onPassed}>
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
});

describe('PredictionGate — Skip policy (default-deny)', () => {
  it('omits the Skip control by default (no allowSkip prop => no bypass)', () => {
    render(
      <PredictionGate {...base}>
        <div>the simulation</div>
      </PredictionGate>,
    );
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });

  it('renders Skip when allowSkip is explicit, and clicking it passes the gate', async () => {
    const user = userEvent.setup();
    const onPassed = vi.fn();
    render(
      <PredictionGate {...base} allowSkip onPassed={onPassed}>
        <div>the simulation</div>
      </PredictionGate>,
    );
    // exemption contract for resetKey re-locking gates: Skip is visible...
    const skip = screen.getByText('Skip');
    expect(skip).toBeInTheDocument();
    expect(screen.queryByText('the simulation')).not.toBeInTheDocument();

    // ...and is a one-click escape that reveals the gated content
    await user.click(skip);
    expect(screen.getByText('the simulation')).toBeInTheDocument();
    expect(onPassed).toHaveBeenCalledTimes(1);
  });
});
