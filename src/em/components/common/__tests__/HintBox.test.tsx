import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HintBox } from '@em/components/common/HintBox';

describe('HintBox', () => {
  it('renders children', () => {
    render(<HintBox>Helpful tip here</HintBox>);
    expect(screen.getByText('Helpful tip here')).toBeInTheDocument();
  });
});
