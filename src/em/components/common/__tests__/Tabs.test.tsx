import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs } from '@em/components/common/Tabs';

const tabs = [
  { id: 'sim', label: 'Simulation' },
  { id: 'theory', label: 'Theory' },
  { id: 'practice', label: 'Practice' },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} activeTab="sim" onTabChange={vi.fn()} />);
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByText('Theory')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<Tabs tabs={tabs} activeTab="theory" onTabChange={vi.fn()} />);
    expect(screen.getByText('Theory').closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Simulation').closest('button')).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="sim" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Practice'));
    expect(onChange).toHaveBeenCalledWith('practice');
  });

  it('has tablist role', () => {
    render(<Tabs tabs={tabs} activeTab="sim" onTabChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('supports keyboard navigation with ArrowRight', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="sim" onTabChange={onChange} />);
    // Roving tabindex: the key handler lives on the focusable tab buttons, so
    // arrow keys are pressed on the active tab (not the tablist container).
    fireEvent.keyDown(screen.getByText('Simulation').closest('button')!, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('theory');
  });
});
