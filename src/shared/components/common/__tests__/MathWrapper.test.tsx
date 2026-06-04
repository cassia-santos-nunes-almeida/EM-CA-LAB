import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MathWrapper } from '@shared/components/common/MathWrapper';

// The canonical MathWrapper renders KaTeX imperatively into a ref'd element
// inside a useEffect (React Testing Library flushes effects during render).
// On any KaTeX failure it falls back to textContent = formula, so the target
// element is always populated either way.
describe('MathWrapper', () => {
  it('renders inline math into a <span> carrying the className', () => {
    const { container } = render(<MathWrapper formula="E = mc^2" className="my-math" />);
    const span = container.querySelector('span.my-math');
    expect(span).toBeInTheDocument();
    expect(span?.textContent ?? '').not.toBe('');
  });

  it('renders block math into a <div> with block layout classes', () => {
    const { container } = render(<MathWrapper formula="x^2 + y^2" block className="extra" />);
    const div = container.querySelector('div.extra');
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('my-4', 'overflow-x-auto');
    expect(div?.textContent ?? '').not.toBe('');
  });
});
