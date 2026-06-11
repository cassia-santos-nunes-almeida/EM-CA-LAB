import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { WorkedSteps } from '@circuits/components/common/WorkedSteps';

const steps = [
  { title: 'Step 1 — Set up', body: <p>First body</p> },
  { title: 'Step 2 — Substitute', body: <p>Second body</p> },
  { title: 'Step 3 — Solve', body: <p>Third body</p> },
];

describe('WorkedSteps', () => {
  it('renders only step 1 initially', () => {
    render(<WorkedSteps steps={steps} />);
    expect(screen.getByText('Step 1 — Set up')).toBeInTheDocument();
    expect(screen.getByText('First body')).toBeInTheDocument();
    expect(screen.queryByText('Step 2 — Substitute')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 3 — Solve')).not.toBeInTheDocument();
    expect(screen.queryByText('All steps revealed')).not.toBeInTheDocument();
  });

  it('shows the reveal button labeled with the next step number', () => {
    render(<WorkedSteps steps={steps} />);
    expect(screen.getByRole('button', { name: 'Reveal step 2 of 3' })).toBeInTheDocument();
  });

  it('renders the tryFirstPrompt nudge above the button when provided', () => {
    render(<WorkedSteps steps={steps} tryFirstPrompt="Try this step on paper before revealing." />);
    expect(screen.getByText('Try this step on paper before revealing.')).toBeInTheDocument();
  });

  it('appends the next step on click and keeps focus on the button', async () => {
    const user = userEvent.setup();
    render(<WorkedSteps steps={steps} />);

    await user.click(screen.getByRole('button', { name: 'Reveal step 2 of 3' }));
    expect(screen.getByText('Step 2 — Substitute')).toBeInTheDocument();
    expect(screen.getByText('Second body')).toBeInTheDocument();
    expect(screen.queryByText('Step 3 — Solve')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Reveal step 3 of 3' });
    expect(button).toHaveFocus();
  });

  it('unmounts the button after the last step and announces completion in an aria-live region', async () => {
    const user = userEvent.setup();
    render(<WorkedSteps steps={steps} />);

    await user.click(screen.getByRole('button', { name: 'Reveal step 2 of 3' }));
    await user.click(screen.getByRole('button', { name: 'Reveal step 3 of 3' }));

    expect(screen.getByText('Step 3 — Solve')).toBeInTheDocument();
    expect(screen.getByText('Third body')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    const announcement = screen.getByText('All steps revealed');
    expect(announcement.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('hides the tryFirstPrompt once every step is revealed', async () => {
    const user = userEvent.setup();
    render(<WorkedSteps steps={steps} tryFirstPrompt="Try this step on paper before revealing." />);

    await user.click(screen.getByRole('button', { name: 'Reveal step 2 of 3' }));
    await user.click(screen.getByRole('button', { name: 'Reveal step 3 of 3' }));

    expect(screen.queryByText('Try this step on paper before revealing.')).not.toBeInTheDocument();
  });
});
