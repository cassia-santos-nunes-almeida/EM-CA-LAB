import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SDomainPanel } from '@circuits/components/modules/InteractiveLab/SDomainPanel';
import type { Complex } from '@circuits/types/circuit';

// Guards the pole-prediction gate's integrity: every offered option must be a
// physically reachable correct answer. The denominator s^2 + (R/L)s + 1/(LC)
// always has a nonzero constant term, so poles are either on the real axis or a
// complex-conjugate pair — never at the origin. The removed "At the origin"
// option could never be keyed correct (getCorrectPoleAnswer never returns it),
// so it must stay absent; both remaining options must stay reachable-correct.
const baseProps = {
  numerator: [100],
  denominator: [1, 4, 13],
  alpha: 2, omega0: 3.6, zeta: 0.55,
  dampingType: 'Underdamped',
  chartColors: { grid: '#eee', text: '#333', legend: '#333' },
};

const COMPLEX_POLES: Complex[] = [{ real: -2, imag: 3 }, { real: -2, imag: -3 }];
const REAL_POLES: Complex[] = [{ real: -1, imag: 0 }, { real: -5, imag: 0 }];

describe('SDomainPanel pole-prediction gate', () => {
  it('offers only the two reachable options — never the dead "At the origin"', () => {
    render(<SDomainPanel {...baseProps} poles={COMPLEX_POLES} />);
    expect(screen.getByRole('button', { name: 'Real axis only' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complex conjugate pairs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'At the origin' })).not.toBeInTheDocument();
    expect(screen.queryByText('At the origin')).not.toBeInTheDocument();
  });

  it('grades "Complex conjugate pairs" correct for a complex-conjugate pole pair', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(<SDomainPanel {...baseProps} poles={COMPLEX_POLES} onPredict={onPredict} />);
    await user.click(screen.getByRole('button', { name: 'Complex conjugate pairs' }));
    expect(onPredict).toHaveBeenCalledWith(true);
  });

  it('grades "Real axis only" correct for two real poles', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(<SDomainPanel {...baseProps} poles={REAL_POLES} onPredict={onPredict} />);
    await user.click(screen.getByRole('button', { name: 'Real axis only' }));
    expect(onPredict).toHaveBeenCalledWith(true);
  });

  it('grades the non-matching option incorrect (gate actually discriminates)', async () => {
    const user = userEvent.setup();
    const onPredict = vi.fn();
    render(<SDomainPanel {...baseProps} poles={REAL_POLES} onPredict={onPredict} />);
    await user.click(screen.getByRole('button', { name: 'Complex conjugate pairs' }));
    expect(onPredict).toHaveBeenCalledWith(false);
  });
});
