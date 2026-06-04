import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import type { ConceptCheckData } from '@shared/components/common/ConceptCheck';

const multipleChoiceData: ConceptCheckData = {
  mode: 'multiple-choice',
  question: 'What is 2+2?',
  options: [
    { text: '3', correct: false, explanation: 'Too low.' },
    { text: '4', correct: true, explanation: 'Correct!' },
    { text: '5', correct: false, explanation: 'Too high.' },
  ],
};

const predictRevealData: ConceptCheckData = {
  mode: 'predict-reveal',
  question: 'What color is the sky?',
  answer: 'Blue on a clear day.',
};

describe('ConceptCheck — multiple-choice mode', () => {
  it('renders the question and all options', () => {
    render(<ConceptCheck data={multipleChoiceData} />);
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows explanation after selecting a correct answer', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={multipleChoiceData} />);

    await user.click(screen.getByText('4'));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('shows explanation after selecting a wrong answer', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={multipleChoiceData} />);

    await user.click(screen.getByText('3'));
    expect(screen.getByText('Too low.')).toBeInTheDocument();
  });

  it('disables all options after selection', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={multipleChoiceData} />);

    await user.click(screen.getByText('4'));
    const buttons = screen.getAllByRole('button');
    // Option buttons should be disabled; "Try Again" is not disabled
    const optionButtons = buttons.filter(b => b.textContent !== 'Try Again');
    for (const btn of optionButtons) {
      expect(btn).toBeDisabled();
    }
  });

  it('resets selection when "Try Again" is clicked', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={multipleChoiceData} />);

    await user.click(screen.getByText('4'));
    expect(screen.getByText('Correct!')).toBeInTheDocument();

    await user.click(screen.getByText('Try Again'));
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    // Options should be enabled again
    expect(screen.getByText('3')).not.toBeDisabled();
  });
});

describe('ConceptCheck — predict-reveal mode', () => {
  it('renders the question and a Reveal button', () => {
    render(<ConceptCheck data={predictRevealData} />);
    expect(screen.getByText('What color is the sky?')).toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });

  it('shows the answer when Reveal is clicked', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={predictRevealData} />);

    await user.click(screen.getByText('Reveal Answer'));
    expect(screen.getByText('Blue on a clear day.')).toBeInTheDocument();
    expect(screen.getByText('Hide Answer')).toBeInTheDocument();
  });

  it('hides the answer when Hide is clicked', async () => {
    const user = userEvent.setup();
    render(<ConceptCheck data={predictRevealData} />);

    await user.click(screen.getByText('Reveal Answer'));
    await user.click(screen.getByText('Hide Answer'));
    expect(screen.queryByText('Blue on a clear day.')).not.toBeInTheDocument();
    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });
});
