import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders the title', () => {
    render(
      <CollapsibleSection title="My Section">
        <p>Section content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('is collapsed by default (defaultOpen=false)', () => {
    render(
      <CollapsibleSection title="My Section">
        <p>Section content</p>
      </CollapsibleSection>,
    );
    const toggle = screen.getByRole('button', { name: /My Section/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('is expanded when defaultOpen=true', () => {
    render(
      <CollapsibleSection title="My Section" defaultOpen={true}>
        <p>Section content</p>
      </CollapsibleSection>,
    );
    const toggle = screen.getByRole('button', { name: /My Section/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles open/closed on click', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="My Section">
        <p>Section content</p>
      </CollapsibleSection>,
    );

    const toggle = screen.getByRole('button', { name: /My Section/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders children', () => {
    render(
      <CollapsibleSection title="My Section" defaultOpen={true}>
        <p>Hello child</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Hello child')).toBeInTheDocument();
  });
});
