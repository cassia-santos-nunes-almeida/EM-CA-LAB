import { render, screen, within } from '@testing-library/react';
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

  it('renders bench before theory in DOM order when leadWithBench is set', () => {
    // Predict-first sections (e.g. gauss) put the gated sim in the bench but need
    // it DOM-first so scroll-spy registers the sim anchor first and the mobile
    // stack leads with the sim. The desktop grid still places it visually right.
    const { container } = render(
      <LabLayout leadWithBench theory={<p>THEORY_CONTENT</p>} bench={<p>BENCH_CONTENT</p>} />,
    );
    const html = container.innerHTML;
    expect(html.indexOf('BENCH_CONTENT')).toBeLessThan(html.indexOf('THEORY_CONTENT'));
  });

  it('keeps the bench visually right (col 2) and theory left (col 1) under leadWithBench', () => {
    // The DOM-order test above only covers half the contract: explicit grid
    // placement is what keeps the DOM-first bench from rendering visually-LEFT
    // via auto-placement. Lock both wrappers' columns so a refactor can't drop it.
    const { container } = render(
      <LabLayout leadWithBench theory={<p>THEORY_CONTENT</p>} bench={<p>BENCH_CONTENT</p>} />,
    );
    const [benchWrapper, theoryWrapper] = Array.from(container.firstElementChild!.children);
    expect(benchWrapper.className).toContain('lg:col-start-2'); // bench → right
    expect(theoryWrapper.className).toContain('lg:col-start-1'); // theory → left
  });

  it('renders no "Jump to lab" anchor under leadWithBench (the sim already leads the stack)', () => {
    // With leadWithBench the bench is DOM-first AND first in the mobile stack, so a
    // "Jump to lab" link would point UP to content the reader already passed.
    render(
      <LabLayout leadWithBench benchId="lab-x" jumpLabel="Jump to lab" theory={<p>t</p>} bench={<p>b</p>} />,
    );
    expect(screen.queryByRole('link', { name: /Jump to lab/i })).toBeNull();
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
    const benchWrapper = container.querySelector('#lab-test');
    expect(benchWrapper).toBeTruthy();
    expect(within(benchWrapper as HTMLElement).getByTestId('b')).toBeInTheDocument();
  });

  it('renders no jump anchor when jumpLabel/benchId are omitted', () => {
    render(<LabLayout theory={<p>t</p>} bench={<p>b</p>} />);
    expect(screen.queryByRole('link', { name: /Jump to lab/i })).toBeNull();
  });

  it('renders no jump anchor when benchId is set but jumpLabel is omitted', () => {
    render(<LabLayout benchId="lab-x" theory={<p>t</p>} bench={<p>b</p>} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
