import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/* ─── Mock katex (used by MathWrapper) ─────────────────────────── */
/* Unlike the sibling suites, `render` writes the raw latex into the
   target element so block formulas can be asserted as text. */
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
    render: (latex: string, el: HTMLElement) => {
      el.textContent = latex;
    },
  },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

/* ─── Mock canvas getContext for the simulations ───────────────── */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    ellipse: vi.fn(), fill: vi.fn(), stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
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

import { Transformers } from '@transmission/components/modules/Transformers';

const renderTF = () => render(<MemoryRouter><Transformers /></MemoryRouter>);
const flybackQ = /snap a mechanical switch open/i;

/** Answer the flyback gate correctly and continue past it (Theory tab). */
async function passFlybackGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('≈10 000 V — a high-voltage spike'));
  // Correctness oracle: PredictionGate passes on ANY committed answer, so the
  // blocking/reveal assertions alone cannot catch a stale getCorrectAnswer().
  // Pin that 'spark' is actually graded correct before continuing — otherwise
  // a drifted option id would mark every right prediction "Not quite" and
  // corrupt predictionGatesCorrect stats with the suite still green.
  expect(await screen.findByText('Correct!')).toBeInTheDocument();
  await user.click(screen.getByText('Continue'));
}

describe('Transformers — section 3.4 page (mutual-inductance extension)', () => {
  it('renders the h1 with the derived section number', () => {
    renderTF();
    const h1 = screen.getByRole('heading', { level: 1, name: /Transformers & Coupled Coils/i });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('3.4');
  });

  it('opens the Theory tab with the M definition block (flux linkage per ampere)', () => {
    const { container } = renderTF();
    expect(
      screen.getByRole('heading', { level: 2, name: /What is mutual inductance/i }),
    ).toBeInTheDocument();
    // The katex mock writes raw latex into the DOM — pin the defining formula.
    expect(container.textContent).toContain(String.raw`N_2\,\Phi_{21}`);
  });

  it('CC-M1: the open-secondary ramp check marks 25 V correct', async () => {
    const user = userEvent.setup();
    renderTF();
    expect(screen.getByText(/ramps steadily from 0 to 2 A in 4 ms/i)).toBeInTheDocument();
    await user.click(screen.getByText('25 V'));
    expect(await screen.findByText(/500 A\/s/)).toBeInTheDocument();
  });

  it('blocks the flyback reveal behind the gate with no Skip control', () => {
    renderTF();
    expect(screen.getByText(flybackQ)).toBeInTheDocument();
    expect(screen.queryByText(/flyback spike/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
  });

  it('reveals the flyback card after a committed prediction', async () => {
    const user = userEvent.setup();
    renderTF();
    await passFlybackGate(user);
    expect(screen.getByText(/flyback spike/i)).toBeInTheDocument();
    expect(screen.getByText(/ignition coil/i)).toBeInTheDocument();
  });

  it('keeps the flyback gate unlocked across a tab remount (lifted state)', async () => {
    const user = userEvent.setup();
    renderTF();
    await passFlybackGate(user);

    await user.click(screen.getByRole('tab', { name: /Simulations/i }));
    await user.click(screen.getByRole('tab', { name: /Theory/i }));
    expect(screen.getByText(/flyback spike/i)).toBeInTheDocument();
    expect(screen.queryByText(flybackQ)).not.toBeInTheDocument();
  });

  it('Practice tab: the new measure-M YourTurn renders above the reflected-impedance one', async () => {
    const user = userEvent.setup();
    renderTF();
    await user.click(screen.getByRole('tab', { name: /Practice/i }));

    const measureM = screen.getByText(/sealed module/i);
    const reflected = screen.getByText(/You found Z_reflected/i);
    expect(measureM).toBeInTheDocument();
    expect(reflected).toBeInTheDocument();
    // Definition-level skill (measure M) must come before the design-level one.
    expect(
      measureM.compareDocumentPosition(reflected) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('Simulations tab: the original k/N₂ gate question still renders with real subscripts', async () => {
    const user = userEvent.setup();
    renderTF();
    await user.click(screen.getByRole('tab', { name: /Simulations/i }));
    expect(screen.getByText(/double N₂ while keeping/i)).toBeInTheDocument();
  });
});
