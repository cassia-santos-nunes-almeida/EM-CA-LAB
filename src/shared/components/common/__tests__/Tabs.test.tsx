import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '@shared/components/common/Tabs';

// Merged superset of the former circuits Tabs and transmission TabSet suites,
// plus regression coverage for the duplicate-DOM-id defect the twins shared
// and the new controlled mode.

const tabs = [
  { label: 'Theory', content: <div>theory content</div> },
  { label: 'Tables', content: <div>tables content</div> },
  { label: 'Examples', content: <div>examples content</div> },
];

describe('Tabs', () => {
  it('renders every tab label as a tab role', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Theory' })).toBeInTheDocument();
  });

  it('shows the first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('theory content')).toBeInTheDocument();
    expect(screen.queryByText('tables content')).not.toBeInTheDocument();
  });

  it('respects defaultIndex', () => {
    render(<Tabs tabs={tabs} defaultIndex={1} />);
    expect(screen.getByText('tables content')).toBeInTheDocument();
  });

  it('switches content on click and updates aria-selected', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    await user.click(screen.getByRole('tab', { name: 'Examples' }));
    expect(screen.getByText('examples content')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Examples' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Theory' })).toHaveAttribute('aria-selected', 'false');
  });

  it('ArrowRight/ArrowLeft move with wrap-around', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    screen.getByRole('tab', { name: 'Theory' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('tables content')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowLeft}'); // wraps from first to last
    expect(screen.getByText('examples content')).toBeInTheDocument();
  });

  it('Home/End jump to first/last tab', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} defaultIndex={1} />);
    screen.getByRole('tab', { name: 'Tables' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByText('examples content')).toBeInTheDocument();
    await user.keyboard('{Home}');
    expect(screen.getByText('theory content')).toBeInTheDocument();
  });

  it('uses roving tabindex (only the active tab is focusable)', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'Theory' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Tables' })).toHaveAttribute('tabindex', '-1');
  });

  it('two instances on one page produce no duplicate DOM ids', () => {
    // Regression: the former twins both emitted bare `tab-0`/`tabpanel-0`,
    // which collide whenever two tab strips render on the same page.
    render(
      <>
        <Tabs tabs={tabs} />
        <Tabs tabs={tabs} />
      </>,
    );
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wires aria-controls/aria-labelledby to the scoped ids', () => {
    render(<Tabs tabs={tabs} />);
    const tab = screen.getByRole('tab', { name: 'Theory' });
    const panel = screen.getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Controlled() {
      const [index, setIndex] = useState(0);
      return (
        <Tabs
          tabs={tabs}
          activeIndex={index}
          onActiveIndexChange={(i) => { onChange(i); setIndex(i); }}
        />
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole('tab', { name: 'Tables' }));
    expect(onChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('tables content')).toBeInTheDocument();
  });

  it('REMOUNTS panel content on tab switch (the caveat #8 lifts state to dodge)', async () => {
    // The active panel renders with key={activeIndex}, so leaving a tab and
    // returning mounts a FRESH instance of its content — any unlifted local
    // state is lost. This is exactly why a PredictionGate inside a Tabs panel
    // re-locks on tab switch unless its unlocked state is lifted to the parent
    // (initialPassed/onPassed). Pin the remount so a future change to the panel
    // key can't silently turn the gates back into one-shot re-lockers.
    const user = userEvent.setup();
    function Counter() {
      const [n, setN] = useState(0);
      return <button onClick={() => setN((x) => x + 1)}>count {n}</button>;
    }
    const remountTabs = [
      { label: 'Stateful', content: <Counter /> },
      { label: 'Other', content: <div>other content</div> },
    ];
    render(<Tabs tabs={remountTabs} />);

    await user.click(screen.getByRole('button', { name: 'count 0' }));
    await user.click(screen.getByRole('button', { name: 'count 1' }));
    expect(screen.getByRole('button', { name: 'count 2' })).toBeInTheDocument();

    // leave and return -> panel content remounts, local state resets to 0
    await user.click(screen.getByRole('tab', { name: 'Other' }));
    await user.click(screen.getByRole('tab', { name: 'Stateful' }));
    expect(screen.getByRole('button', { name: 'count 0' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'count 2' })).not.toBeInTheDocument();
  });
});
