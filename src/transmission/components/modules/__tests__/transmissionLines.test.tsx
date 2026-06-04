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

/* ─── Mock canvas getContext for the simulations ───────────────── */
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

import { TransmissionLines } from '@transmission/components/modules/TransmissionLines';

const renderTL = () => render(<MemoryRouter><TransmissionLines /></MemoryRouter>);
const simLabel = /transmission line simulation/i;
const predictQ = /what do you expect the reflected wave/i;

describe('TransmissionLines — chaptered split-pane labs', () => {
  it('gates the lab sim behind a blocking prediction and keeps it unlocked across tab switches', async () => {
    const user = userEvent.setup();
    renderTL();

    // Open the Reflections lab tab.
    await user.click(screen.getByRole('tab', { name: /Reflections/i }));

    // Blocking: the prediction prompt is shown and the sim is NOT yet mounted.
    expect(screen.getByText(predictQ)).toBeInTheDocument();
    expect(screen.queryByLabelText(simLabel)).not.toBeInTheDocument();

    // Commit a prediction → the sim is revealed.
    await user.click(screen.getByText('No reflection'));
    await user.click(screen.getByText('Continue'));
    expect(screen.getByLabelText(simLabel)).toBeInTheDocument();
    expect(screen.queryByText(predictQ)).not.toBeInTheDocument();

    // Switch away and back — the lab must stay unlocked (no re-prediction).
    await user.click(screen.getByRole('tab', { name: /Impedance/i }));
    await user.click(screen.getByRole('tab', { name: /Reflections/i }));

    expect(screen.getByLabelText(simLabel)).toBeInTheDocument();
    expect(screen.queryByText(predictQ)).not.toBeInTheDocument();
  });

  it('renders the section heading and three flask-marked lab tabs', () => {
    renderTL();
    expect(screen.getByRole('heading', { level: 1, name: /Transmission Lines/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Reflections/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Smith Chart/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Inverse/i })).toBeInTheDocument();
  });
});
