import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayControls } from '@em/components/common/PlayControls';

describe('PlayControls', () => {
  it('shows Pause when playing', () => {
    render(<PlayControls isPlaying={true} onToggle={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause simulation')).toBeInTheDocument();
  });

  it('shows Play when paused', () => {
    render(<PlayControls isPlaying={false} onToggle={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Play simulation')).toBeInTheDocument();
  });

  it('calls onToggle and onReset', () => {
    const onToggle = vi.fn();
    const onReset = vi.fn();
    render(<PlayControls isPlaying={true} onToggle={onToggle} onReset={onReset} />);
    fireEvent.click(screen.getByText('Pause'));
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });
});
