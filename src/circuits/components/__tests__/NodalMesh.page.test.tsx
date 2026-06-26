import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NodalMesh } from '@circuits/components/modules/NodalMesh/index';

// Local copies of the pages.test.tsx helpers (parallel-work convention:
// new sections get their own test file and replicate the tiny helpers).
function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByText(/COMMIT PREDICTION/i));
}

const GATE_1_CORRECT = 'Neither — no two elements share both end-nodes, so reduction cannot start';
const GATE_2_CORRECT = 'i₁ − i₂';

describe('NodalMesh page', () => {
  it('gates both labs behind Predict First predictions', () => {
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Choose the bottom node as reference/ })).toBeNull();
  });

  it('renders heading, ToC, and the node pickers after passing the first gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    await passPredictionGate(user, GATE_1_CORRECT);
    expect(screen.getByRole('heading', { level: 1, name: /Nodal & Mesh Analysis/ })).toBeInTheDocument();
    expect(screen.getByText('Jump to:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose node A as reference' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose the bottom node as reference' })).toBeInTheDocument();
  });

  it('coaches on a non-bottom reference pick, then confirms the bottom node', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    await passPredictionGate(user, GATE_1_CORRECT);
    await user.click(screen.getByRole('button', { name: 'Choose node A as reference' }));
    expect(screen.getByText(/busiest node/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose the bottom node as reference' }));
    expect(screen.getByText(/direct unknown/)).toBeInTheDocument();
  });

  it('shows the leaving-convention feedback on the into-the-node distractor', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    await passPredictionGate(user, GATE_1_CORRECT);
    await user.click(screen.getByRole('button', { name: 'Choose the bottom node as reference' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: '(12 - V_A) / 2' }));
    expect(screen.getByText(/LEAVING the node/)).toBeInTheDocument();
  });

  it('walks the mesh assigner convention check after passing the second gate', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    await passPredictionGate(user, GATE_2_CORRECT);
    const mesh1Toggle = screen.getByRole('button', { name: 'Mesh 1 arrow clockwise' });
    expect(mesh1Toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mesh 2 arrow clockwise' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(mesh1Toggle);
    expect(mesh1Toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Check convention' }));
    expect(screen.getByText(/all-clockwise/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set both clockwise' }));
    expect(screen.getByText(/Walk mesh 1 clockwise/)).toBeInTheDocument();
  });

  it('accepts the correct equation-count concept check answer', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NodalMesh />, '/nodal-mesh-analysis');
    await user.click(screen.getByText('n − 2'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });
});
