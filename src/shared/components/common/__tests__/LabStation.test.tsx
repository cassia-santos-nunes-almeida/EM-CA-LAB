import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabStation } from '@shared/components/common/LabStation';
import { PredictionGate } from '@shared/components/common/PredictionGate';

describe('LabStation', () => {
  it('renders the "Interactive Lab" eyebrow, numbered title, objective, and children', () => {
    render(
      <LabStation number="3.3" title="Reflections & Standing Waves" objective="Sweep the load.">
        <div>docked sim</div>
      </LabStation>,
    );

    expect(screen.getByText('Interactive Lab')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /3\.3\s*Reflections & Standing Waves/ })).toBeInTheDocument();
    expect(screen.getByText('Sweep the load.')).toBeInTheDocument();
    expect(screen.getByText('docked sim')).toBeInTheDocument();
  });

  it('omits the objective line when not provided', () => {
    render(
      <LabStation title="The Smith Chart">
        <div>chart</div>
      </LabStation>,
    );
    expect(screen.getByRole('heading', { level: 2, name: /The Smith Chart/ })).toBeInTheDocument();
    expect(screen.getByText('chart')).toBeInTheDocument();
  });
});

describe('PredictionGate — non-blocking mode', () => {
  it('keeps children visible immediately and still fires onPredict', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(
      <PredictionGate
        nonBlocking
        question="Pick one"
        options={[
          { id: 'a', label: 'Option A' },
          { id: 'b', label: 'Option B' },
        ]}
        getCorrectAnswer={() => 'a'}
        explanation={<span>A is right</span>}
        onPredict={onPredict}
      >
        <div>always-visible sim</div>
      </PredictionGate>,
    );

    // The "gated" content is visible before any answer (no burial).
    expect(screen.getByText('always-visible sim')).toBeInTheDocument();
    // No Continue/Skip controls in non-blocking mode.
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();

    await user.click(screen.getByText('Option A'));
    expect(onPredict).toHaveBeenCalledWith(true);
    // Still visible after answering.
    expect(screen.getByText('always-visible sim')).toBeInTheDocument();
    expect(screen.getByText('A is right')).toBeInTheDocument();
  });
});
