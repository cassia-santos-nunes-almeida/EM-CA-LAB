import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChallengeCard } from '@circuits/components/common/ChallengeCard';
import type { Challenge } from '@circuits/components/common/ChallengeCard';

const incompleteChallenge: Challenge = {
  id: 'test-1',
  title: 'Test Challenge',
  description: 'Do something interesting.',
  hint: 'Here is a hint.',
  successMessage: 'Great job!',
  check: () => false,
};

const completeChallenge: Challenge = {
  ...incompleteChallenge,
  check: () => true,
};

const noCheckChallenge: Challenge = {
  id: 'test-2',
  title: 'Exploration',
  description: 'Explore this feature.',
  hint: 'Try adjusting the slider.',
};

describe('ChallengeCard', () => {
  it('renders title and description', () => {
    render(<ChallengeCard challenge={incompleteChallenge} />);
    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    expect(screen.getByText('Do something interesting.')).toBeInTheDocument();
  });

  it('shows "Show Hint" button when hint is available and not complete', async () => {
    const user = userEvent.setup();
    render(<ChallengeCard challenge={incompleteChallenge} />);

    const hintButton = screen.getByText('Show Hint');
    expect(hintButton).toBeInTheDocument();

    await user.click(hintButton);
    expect(screen.getByText('Here is a hint.')).toBeInTheDocument();
  });

  it('does not show hint button when challenge is complete', () => {
    render(<ChallengeCard challenge={completeChallenge} />);
    expect(screen.queryByText('Show Hint')).not.toBeInTheDocument();
  });

  it('shows success message when complete', () => {
    render(<ChallengeCard challenge={completeChallenge} />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
    expect(screen.queryByText('Do something interesting.')).not.toBeInTheDocument();
  });

  it('dismisses the card when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChallengeCard challenge={incompleteChallenge} />);

    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Test Challenge')).not.toBeInTheDocument();
  });

  it('renders without check function (exploration-only)', () => {
    render(<ChallengeCard challenge={noCheckChallenge} />);
    expect(screen.getByText('Exploration')).toBeInTheDocument();
    expect(screen.getByText('Explore this feature.')).toBeInTheDocument();
  });

  it('calls check function on render', () => {
    const check = vi.fn(() => false);
    render(<ChallengeCard challenge={{ ...incompleteChallenge, check }} />);
    expect(check).toHaveBeenCalled();
  });
});
