import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';

const options = [
  { text: 'It doubles', correct: true, explanation: 'Right — linear in v.' },
  { text: 'It halves', correct: false, explanation: 'No, it grows.' },
];

function renderPanel() {
  return render(
    <YourTurnPanel
      scenario="Now double the particle speed."
      question="What happens to the radius?"
      options={options}
      correctReveal={<span>r = 2 mv/(qB)</span>}
    />,
  );
}

describe('YourTurnPanel', () => {
  it('renders scenario, question, and options', () => {
    renderPanel();
    expect(screen.getByText('Now double the particle speed.')).toBeInTheDocument();
    expect(screen.getByText('What happens to the radius?')).toBeInTheDocument();
    expect(screen.getByText('It doubles')).toBeInTheDocument();
  });

  it('shows the reveal under "Updated Values" on a correct answer', () => {
    renderPanel();
    fireEvent.click(screen.getByText('It doubles'));
    expect(screen.getByText('Updated Values')).toBeInTheDocument();
    expect(screen.getByText('r = 2 mv/(qB)')).toBeInTheDocument();
  });

  it('shows the reveal under "Correct Answer" on a wrong answer', () => {
    renderPanel();
    fireEvent.click(screen.getByText('It halves'));
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    expect(screen.getByText('r = 2 mv/(qB)')).toBeInTheDocument();
  });

  it('resets on Try Again', () => {
    renderPanel();
    fireEvent.click(screen.getByText('It halves'));
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('It doubles').closest('button')).not.toBeDisabled();
  });
});
