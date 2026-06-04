import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from '@em/components/common/Slider';

describe('Slider', () => {
  const defaults = { label: 'Amplitude', value: 50, min: 0, max: 100, onChange: vi.fn() };

  it('renders label and value', () => {
    render(<Slider {...defaults} />);
    expect(screen.getByText('Amplitude')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows unit when provided', () => {
    render(<Slider {...defaults} unit=" Hz" />);
    expect(screen.getByText('50 Hz')).toBeInTheDocument();
  });

  it('shows decimal value when step is fractional', () => {
    render(<Slider {...defaults} value={3.5} step={0.1} />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('calls onChange with parsed number', () => {
    const onChange = vi.fn();
    render(<Slider {...defaults} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('has accessible label', () => {
    render(<Slider {...defaults} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', 'Amplitude');
  });
});
