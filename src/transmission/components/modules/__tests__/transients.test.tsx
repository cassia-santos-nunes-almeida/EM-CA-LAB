import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/* ─── Mock katex (used by MathWrapper) ─────────────────────────── */
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
    render: vi.fn(),
  },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

/* ─── Mock canvas getContext for the BounceDiagram simulation ──── */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    scale: vi.fn(), setTransform: vi.fn(), measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn(), strokeText: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: [] })), putImageData: vi.fn(),
    closePath: vi.fn(), quadraticCurveTo: vi.fn(), bezierCurveTo: vi.fn(),
    rect: vi.fn(), clip: vi.fn(), setLineDash: vi.fn(),
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '',
    lineJoin: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    canvas: { width: 800, height: 600 },
  })) as never;

  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

import { Transients } from '@transmission/components/modules/Transients';

const renderTransients = () => render(<MemoryRouter><Transients /></MemoryRouter>);
const simLabel = /bounce diagram showing voltage reflections/i;
const predictQ = /after the first reflection/i;

describe('Transients — tab strip gate unlock survives tab round-trips', () => {
  it('keeps the bounce diagram revealed after switching tabs away and back', async () => {
    const user = userEvent.setup();
    renderTransients();

    // Open the Simulations tab.
    await user.click(screen.getByRole('tab', { name: /Simulations/i }));

    // Blocking: the prediction prompt is shown and the sim is NOT yet mounted.
    expect(screen.getByText(predictQ)).toBeInTheDocument();
    expect(screen.queryByLabelText(simLabel)).not.toBeInTheDocument();

    // Commit a prediction → the sim is revealed.
    await user.click(screen.getByText('Vₛ'));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByLabelText(simLabel)).toBeInTheDocument();
    expect(screen.queryByText(predictQ)).not.toBeInTheDocument();

    // Switch away and back — tab strip remounts the panel, but the lifted
    // unlocked state must keep the sim revealed (no re-prediction).
    await user.click(screen.getByRole('tab', { name: /Theory/i }));
    await user.click(screen.getByRole('tab', { name: /Simulations/i }));

    expect(screen.getByLabelText(simLabel)).toBeInTheDocument();
    expect(screen.queryByText(predictQ)).not.toBeInTheDocument();
    expect(screen.queryByText('Predict First')).not.toBeInTheDocument();
  });
});
