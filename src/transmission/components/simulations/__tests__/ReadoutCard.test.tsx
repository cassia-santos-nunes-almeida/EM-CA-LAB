import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReadoutCard } from '../ReadoutCard';

/**
 * A.5 #9 — the slate {label, value} ReadoutCard was copied byte-for-byte in 4
 * transmission sims. Hoisted to one shared component; this pins its render.
 */
describe('shared transmission ReadoutCard (A.5 #9)', () => {
  it('renders the label and the formatted value', () => {
    render(<ReadoutCard label="Z₀" value="50 Ω" />);
    expect(screen.getByText('Z₀')).toBeInTheDocument();
    expect(screen.getByText('50 Ω')).toBeInTheDocument();
  });
});
