import { describe, it, expect, vi } from 'vitest';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCanvasTouch } from '@em/hooks/useCanvasTouch';

/**
 * Regression coverage for the late-mount contract: every em canvas mounts
 * AFTER first render (revealed by a PredictionGate), so the hook must attach
 * its touch listeners via callback ref, not a mount-time effect. The old
 * effect-based hook ran once, found canvasRef.current === null, and silently
 * left the revealed sim touch-dead for the whole mount.
 */

function Harness({ onMouseDown, refSpy }: {
  onMouseDown?: () => void;
  refSpy?: (ref: RefObject<HTMLCanvasElement | null>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasTouchRef = useCanvasTouch(canvasRef);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { refSpy?.(canvasRef); });
  return (
    <div>
      <button onClick={() => setRevealed(true)}>reveal</button>
      {revealed && (
        <canvas ref={canvasTouchRef} data-testid="sim-canvas" onMouseDown={onMouseDown} />
      )}
    </div>
  );
}

describe('useCanvasTouch — late-mounting canvas (PredictionGate reveal)', () => {
  it('translates touch to mouse on a canvas that mounts after first render', async () => {
    const user = userEvent.setup();
    const onMouseDown = vi.fn();
    render(<Harness onMouseDown={onMouseDown} />);

    // Locked state: no canvas in the DOM, hook must cope with the null ref.
    expect(screen.queryByTestId('sim-canvas')).not.toBeInTheDocument();

    await user.click(screen.getByText('reveal'));
    const canvas = screen.getByTestId('sim-canvas');

    fireEvent.touchStart(canvas, { touches: [{ clientX: 10, clientY: 20 }] });
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('keeps canvasRef.current in sync for draw loops and mouse handlers', async () => {
    const user = userEvent.setup();
    let captured: RefObject<HTMLCanvasElement | null> | undefined;
    render(<Harness refSpy={(r) => { captured = r; }} />);
    expect(captured!.current).toBeNull();

    await user.click(screen.getByText('reveal'));
    expect(captured!.current).toBe(screen.getByTestId('sim-canvas'));
  });

  it('ignores multi-touch so pinch zoom still works', async () => {
    const user = userEvent.setup();
    const onMouseDown = vi.fn();
    render(<Harness onMouseDown={onMouseDown} />);
    await user.click(screen.getByText('reveal'));

    fireEvent.touchStart(screen.getByTestId('sim-canvas'), {
      touches: [
        { clientX: 10, clientY: 20 },
        { clientX: 30, clientY: 40 },
      ],
    });
    expect(onMouseDown).not.toHaveBeenCalled();
  });
});
