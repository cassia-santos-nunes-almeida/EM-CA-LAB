import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';

const challenge = {
  title: 'Component Explorer',
  description: 'Explore the component sliders.',
  instructions: ['Step one', 'Step two', 'Step three'],
  hint: 'Try adjusting a slider.',
};

describe('GuidedChallenge', () => {
  it('renders title, description, and instructions', () => {
    render(<GuidedChallenge challenge={challenge} />);
    expect(screen.getByText('Component Explorer')).toBeInTheDocument();
    expect(screen.getByText('Explore the component sliders.')).toBeInTheDocument();
    expect(screen.getByText('Step one')).toBeInTheDocument();
  });

  it('advances steps with Next Step button', () => {
    render(<GuidedChallenge challenge={challenge} />);
    fireEvent.click(screen.getByText('Next Step'));
    const stepOne = screen.getByText('Step one');
    expect(stepOne.closest('div')).toHaveClass('line-through');
  });

  it('shows Mark Complete on last step and calls onComplete', () => {
    const onComplete = vi.fn();
    render(<GuidedChallenge challenge={challenge} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByText('Next Step'));
    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mark Complete'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('shows hint when Hint button is clicked', () => {
    render(<GuidedChallenge challenge={challenge} />);
    fireEvent.click(screen.getByText('Hint'));
    expect(screen.getByText('Try adjusting a slider.')).toBeInTheDocument();
  });

  it('completes locally without onComplete — the non-tracked usage at all 24 call sites', () => {
    // No call site passes onComplete; completion is self-reported and must not
    // depend on the progress store. The component must reach its completed state
    // on its own, with the store/criterion untouched.
    render(<GuidedChallenge challenge={challenge} />);
    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByText('Mark Complete'));

    // Completed state is reflected locally: the action control is gone and the
    // container takes its completed styling.
    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument();
    expect(screen.getByText('Component Explorer').closest('div.rounded-xl'))
      .toHaveClass('border-green-300');
  });
});
