import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ControlPanel } from '@em/components/common/ControlPanel';

describe('ControlPanel', () => {
  it('renders title and children', () => {
    render(
      <ControlPanel title="Parameters">
        <span>child content</span>
      </ControlPanel>
    );
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ControlPanel title="Test" className="custom-class">
        <span>x</span>
      </ControlPanel>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
