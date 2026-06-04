import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionHook } from '@shared/components/common/SectionHook';

describe('SectionHook', () => {
  it('renders the hook text under a "Why This Matters" label', () => {
    render(<SectionHook text="Electrostatic shielding protects sensitive electronics." />);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    expect(screen.getByText('Electrostatic shielding protects sensitive electronics.')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(<SectionHook text="Hook" icon={<svg data-testid="custom-icon" />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
