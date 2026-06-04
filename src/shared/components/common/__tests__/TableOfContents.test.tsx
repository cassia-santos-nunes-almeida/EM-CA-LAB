import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableOfContents } from '@shared/components/common/TableOfContents';

const items = [
  { id: 'sec-a', label: 'Section A' },
  { id: 'sec-b', label: 'Section B' },
  { id: 'sec-c', label: 'Section C' },
];

describe('TableOfContents', () => {
  beforeEach(() => {
    // jsdom does not implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders a Jump-to label and one pill per item', () => {
    render(<TableOfContents items={items} />);
    expect(screen.getByText('Jump to:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section A' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section B' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section C' })).toBeInTheDocument();
  });

  it('marks only the active item with aria-current', () => {
    render(<TableOfContents items={items} activeId="sec-b" />);
    expect(screen.getByRole('link', { name: 'Section B' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Section A' })).not.toHaveAttribute('aria-current');
  });

  it('smooth-scrolls to the target on click when the element exists', async () => {
    const user = userEvent.setup();
    const target = document.createElement('div');
    target.id = 'sec-b';
    document.body.appendChild(target);
    const scrollSpy = vi.spyOn(target, 'scrollIntoView');

    render(<TableOfContents items={items} />);
    await user.click(screen.getByRole('link', { name: 'Section B' }));

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    document.body.removeChild(target);
  });
});
