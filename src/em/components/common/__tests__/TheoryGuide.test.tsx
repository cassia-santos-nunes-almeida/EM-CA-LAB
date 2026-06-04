import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TheoryGuide } from '@em/components/common/TheoryGuide';

describe('TheoryGuide', () => {
  it('renders children and header', () => {
    render(<TheoryGuide><p>Theory content</p></TheoryGuide>);
    expect(screen.getByText('Theory Guide')).toBeInTheDocument();
    expect(screen.getByText('Theory content')).toBeInTheDocument();
  });
});
