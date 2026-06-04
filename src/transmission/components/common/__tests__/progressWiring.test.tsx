import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptCheck, type ConceptCheckData } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { useProgressStore } from '@shared/store/progressStore';

/**
 * Regression coverage for the "dead progress callbacks" fix: ConceptCheck and
 * PredictionGate now expose onComplete/onHint/onPredict, and the module call
 * sites wire them to the emac-m3-progress store. These tests assert both the
 * component-level callback contract and that wiring them to the real store
 * actually moves the previously-dead counters.
 */

const mcData: ConceptCheckData = {
  mode: 'multiple-choice',
  question: 'What Γ indicates a matched load?',
  options: [
    { text: 'Γ = 0', correct: true, explanation: 'Matched — no reflection.' },
    { text: 'Γ = 1', correct: false, explanation: 'Total reflection.' },
  ],
  hints: ['Substitute Z_L = Z_0 into the Γ formula.'],
};

const prData: ConceptCheckData = {
  mode: 'predict-reveal',
  question: 'What is VSWR when the load is matched?',
  answer: 'VSWR = 1 because there is no reflected wave.',
};

const pgOptions = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' },
];

describe('ConceptCheck — progress callbacks', () => {
  it('fires onComplete when the correct option is selected', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ConceptCheck data={mcData} onComplete={onComplete} />);

    await user.click(screen.getByText('Γ = 0'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onComplete when an incorrect option is selected', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ConceptCheck data={mcData} onComplete={onComplete} />);

    await user.click(screen.getByText('Γ = 1'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('fires onHint with the 1-based tier when a hint is revealed', async () => {
    const user = userEvent.setup();
    const onHint = vi.fn();
    render(<ConceptCheck data={mcData} onHint={onHint} />);

    await user.click(screen.getByText('Need a hint?'));
    expect(onHint).toHaveBeenCalledWith(1);
  });

  it('fires onComplete when a predict-reveal answer is revealed', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ConceptCheck data={prData} onComplete={onComplete} />);

    await user.click(screen.getByText('Reveal Answer'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('PredictionGate — progress callback', () => {
  it('fires onPredict(true) when the correct option is chosen', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(
      <PredictionGate
        question="Pick the correct one"
        options={pgOptions}
        getCorrectAnswer={() => 'a'}
        explanation={<span>because A is right</span>}
        onPredict={onPredict}
      >
        <div>revealed content</div>
      </PredictionGate>,
    );

    await user.click(screen.getByText('Option A'));
    expect(onPredict).toHaveBeenCalledWith(true);
  });

  it('fires onPredict(false) when an incorrect option is chosen', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(
      <PredictionGate
        question="Pick the correct one"
        options={pgOptions}
        getCorrectAnswer={() => 'a'}
        explanation={<span>because A is right</span>}
        onPredict={onPredict}
      >
        <div>revealed content</div>
      </PredictionGate>,
    );

    await user.click(screen.getByText('Option B'));
    expect(onPredict).toHaveBeenCalledWith(false);
  });
});

describe('progress store wiring (module call-site pattern)', () => {
  beforeEach(() => {
    useProgressStore.setState({ sections: {} });
  });

  it('increments conceptChecksCompleted when onComplete is wired to the store', async () => {
    const user = userEvent.setup();
    const { incrementConceptChecks } = useProgressStore.getState();
    render(
      <ConceptCheck data={mcData} onComplete={() => incrementConceptChecks('demo')} />,
    );

    await user.click(screen.getByText('Γ = 0'));
    expect(useProgressStore.getState().sections.demo.conceptChecksCompleted).toBe(1);
  });

  it('increments hintsUsed when onHint is wired to the store', async () => {
    const user = userEvent.setup();
    const { incrementHints } = useProgressStore.getState();
    render(<ConceptCheck data={mcData} onHint={() => incrementHints('demo')} />);

    await user.click(screen.getByText('Need a hint?'));
    expect(useProgressStore.getState().sections.demo.hintsUsed).toBe(1);
  });

  it('increments predictionGatesAnswered/Correct when onPredict is wired to the store', async () => {
    const user = userEvent.setup();
    const { markPredictionGate } = useProgressStore.getState();
    render(
      <PredictionGate
        question="Pick the correct one"
        options={pgOptions}
        getCorrectAnswer={() => 'a'}
        explanation={<span>because A is right</span>}
        onPredict={(correct) => markPredictionGate('demo', correct)}
      >
        <div>revealed content</div>
      </PredictionGate>,
    );

    await user.click(screen.getByText('Option A'));
    const section = useProgressStore.getState().sections.demo;
    expect(section.predictionGatesAnswered).toBe(1);
    expect(section.predictionGatesCorrect).toBe(1);
  });
});
