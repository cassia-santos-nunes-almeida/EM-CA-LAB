import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LabLayout } from '@shared/components/common/LabLayout';

describe('LabLayout', () => {
  it('renders theory before bench in DOM order (mobile stack order)', () => {
    const { container } = render(
      <LabLayout theory={<p>THEORY_CONTENT</p>} bench={<p>BENCH_CONTENT</p>} />,
    );
    const html = container.innerHTML;
    expect(html.indexOf('THEORY_CONTENT')).toBeLessThan(html.indexOf('BENCH_CONTENT'));
  });

  it('renders a sub-lg "Jump to lab" anchor targeting benchId when jumpLabel is set', () => {
    render(
      <LabLayout
        benchId="lab-test"
        jumpLabel="Jump to lab"
        theory={<p>theory</p>}
        bench={<p>bench</p>}
      />,
    );
    const anchor = screen.getByRole('link', { name: /Jump to lab/i });
    expect(anchor).toHaveAttribute('href', '#lab-test');
  });

  it('applies benchId as the id of the bench wrapper', () => {
    const { container } = render(
      <LabLayout benchId="lab-test" jumpLabel="Jump to lab" theory={<p>t</p>} bench={<span data-testid="b">b</span>} />,
    );
    expect(container.querySelector('#lab-test')).toBeTruthy();
    expect(container.querySelector('#lab-test')?.querySelector('[data-testid="b"]')).toBeTruthy();
  });

  it('renders no jump anchor when jumpLabel/benchId are omitted', () => {
    render(<LabLayout theory={<p>t</p>} bench={<p>b</p>} />);
    expect(screen.queryByRole('link', { name: /Jump to lab/i })).toBeNull();
  });
});
