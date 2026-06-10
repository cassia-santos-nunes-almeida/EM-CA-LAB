import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* ─── Mock katex (used by MathWrapper) ─────────────────────────── */
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
    render: vi.fn(),
  },
}));

/* ─── Mock katex CSS import ────────────────────────────────────── */
vi.mock('katex/dist/katex.min.css', () => ({}));

/* ─── Mock canvas getContext for simulation components ─────────── */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: '',
    lineJoin: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    setLineDash: vi.fn(),
    canvas: { width: 800, height: 600 },
  })) as never;
});

/* ─── Mock requestAnimationFrame / cancelAnimationFrame ────────── */
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

/* ─── Helper ───────────────────────────────────────────────────── */
function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/* ─── Page smoke tests ─────────────────────────────────────────── */

describe('Transmission page smoke tests', () => {
  it('Transformers renders without crashing', async () => {
    const { Transformers } = await import('@transmission/components/modules/Transformers');
    renderInRouter(<Transformers />);
    expect(screen.getByRole('heading', { level: 1, name: /Transformers & Coupled Coils/i })).toBeInTheDocument();
  });

  it('LumpedDistributed renders without crashing', async () => {
    const { LumpedDistributed } = await import('@transmission/components/modules/LumpedDistributed');
    renderInRouter(<LumpedDistributed />);
    expect(screen.getByRole('heading', { level: 1, name: /Lumped Circuits to Distributed/i })).toBeInTheDocument();
  });

  it('TransmissionLines renders without crashing', async () => {
    const { TransmissionLines } = await import('@transmission/components/modules/TransmissionLines');
    renderInRouter(<TransmissionLines />);
    expect(screen.getByRole('heading', { level: 1, name: /Transmission Lines/i })).toBeInTheDocument();
  });

  it('Transients renders without crashing', async () => {
    const { Transients } = await import('@transmission/components/modules/Transients');
    renderInRouter(<Transients />);
    expect(screen.getByRole('heading', { level: 1, name: /Transients on Transmission Lines/i })).toBeInTheDocument();
  });

  it('Antennas renders without crashing', async () => {
    const { Antennas } = await import('@transmission/components/modules/Antennas');
    renderInRouter(<Antennas />);
    expect(screen.getAllByText(/Antenna/i).length).toBeGreaterThan(0);
  });
});
