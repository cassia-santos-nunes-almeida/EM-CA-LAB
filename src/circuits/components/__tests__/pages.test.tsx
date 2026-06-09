import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ComponentPhysics } from '@circuits/components/modules/ComponentPhysics/index';
import { TimeDomain } from '@circuits/components/modules/TimeDomain/index';
import { SDomainAnalysis } from '@circuits/components/modules/SDomainAnalysis';

function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('ComponentPhysics page', () => {
  it('gates the R/L/C explorer behind a Predict First prediction', () => {
    renderWithRouter(<ComponentPhysics />);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resistor' })).toBeNull();
  });

  it('renders with resistor tab active by default', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ComponentPhysics />);
    await passPredictionGate(user, 'Quadruples (×4)');
    expect(screen.getByRole('heading', { level: 1, name: /Component Physics/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resistor' })).toBeInTheDocument();
    expect(screen.getByText(/Ohm's Law/i)).toBeInTheDocument();
  });

  it('switches to capacitor tab on click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ComponentPhysics />);
    await passPredictionGate(user, 'Quadruples (×4)');
    await user.click(screen.getByRole('button', { name: 'Capacitor' }));
    // Capacitor section heading
    expect(screen.getByRole('heading', { name: /Theory/i })).toBeInTheDocument();
  });

  it('switches to inductor tab on click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ComponentPhysics />);
    await passPredictionGate(user, 'Quadruples (×4)');
    await user.click(screen.getByRole('button', { name: 'Inductor' }));
    expect(screen.getByRole('heading', { name: /Theory/i })).toBeInTheDocument();
  });
});

describe('TimeDomain page', () => {
  it('gates the circuit tabs behind a Predict First prediction', () => {
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'RC Circuit' })).toBeNull();
  });

  it('renders with table of contents and circuit tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    await passPredictionGate(user, 'τ doubles; pole moves toward the origin (slower)');
    expect(screen.getByRole('heading', { level: 1, name: /Circuit Analysis/ })).toBeInTheDocument();
    expect(screen.getByText('Jump to:')).toBeInTheDocument();
    // Tab buttons
    expect(screen.getByRole('button', { name: 'RC Circuit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RL Circuit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RLC Circuit' })).toBeInTheDocument();
  });

  it('switches between circuit tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    await passPredictionGate(user, 'τ doubles; pole moves toward the origin (slower)');
    // Click RL tab
    await user.click(screen.getByRole('button', { name: 'RL Circuit' }));
    // RL-specific concept check should now be visible
    expect(screen.getByText(/double R in an RL circuit/i)).toBeInTheDocument();
  });

  it('shows RC concept check by default', () => {
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    expect(screen.getByText(/double R in an RC circuit/i)).toBeInTheDocument();
  });

  it('has collapsible Method Comparison section defaultOpen', () => {
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    const methodButtons = screen.getAllByRole('button', { name: /Method Comparison/i });
    const collapsibleButton = methodButtons.find(b => b.hasAttribute('aria-expanded'));
    expect(collapsibleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('has collapsible Response Types section defaultClosed', () => {
    renderWithRouter(<TimeDomain />, '/circuit-analysis');
    const responseButton = screen.getByRole('button', { name: /Circuit Response Types/i });
    expect(responseButton).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('SDomainAnalysis page', () => {
  it('gates the Tabs behind a Predict First prediction', () => {
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.queryByText('Transfer Function Fundamentals')).toBeNull();
  });

  it('renders with Theory tab by default', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    await passPredictionGate(user, 'Unstable — the response grows without bound');
    expect(screen.getByRole('heading', { level: 1, name: /S-Domain Theory/ })).toBeInTheDocument();
    expect(screen.getByText('Transfer Function Fundamentals')).toBeInTheDocument();
  });

  it('switches to Damping tab via tablist', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    await passPredictionGate(user, 'Unstable — the response grows without bound');
    const tablist = screen.getByRole('tablist');
    const dampingTab = within(tablist).getByRole('tab', { name: /Damping/i });
    await user.click(dampingTab);
    expect(screen.getByText('Damping Behavior')).toBeInTheDocument();
  });

  it('has a concept check with multiple choice', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    await passPredictionGate(user, 'Unstable — the response grows without bound');
    expect(screen.getByText(/poles at s = -3/i)).toBeInTheDocument();
  });

  it('allows answering concept check correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    await passPredictionGate(user, 'Unstable — the response grows without bound');
    await user.click(screen.getByText('Stable, underdamped'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });

  it('shows Try Again after answering', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SDomainAnalysis />, '/s-domain');
    await passPredictionGate(user, 'Unstable — the response grows without bound');
    await user.click(screen.getByText('Stable, underdamped'));
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
