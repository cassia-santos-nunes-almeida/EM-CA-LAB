import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Tabs } from '@circuits/components/common/Tabs';

const tabs = [
  { label: 'Alpha', content: <p>Alpha content</p> },
  { label: 'Beta', content: <p>Beta content</p> },
  { label: 'Gamma', content: <p>Gamma content</p> },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('shows the first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Alpha content')).toBeInTheDocument();
    expect(screen.queryByText('Beta content')).not.toBeInTheDocument();
  });

  it('respects defaultIndex prop', () => {
    render(<Tabs tabs={tabs} defaultIndex={1} />);
    expect(screen.queryByText('Alpha content')).not.toBeInTheDocument();
    expect(screen.getByText('Beta content')).toBeInTheDocument();
  });

  it('switches content when a different tab is clicked', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);

    await user.click(screen.getByText('Beta'));
    expect(screen.queryByText('Alpha content')).not.toBeInTheDocument();
    expect(screen.getByText('Beta content')).toBeInTheDocument();

    await user.click(screen.getByText('Gamma'));
    expect(screen.queryByText('Beta content')).not.toBeInTheDocument();
    expect(screen.getByText('Gamma content')).toBeInTheDocument();
  });
});
