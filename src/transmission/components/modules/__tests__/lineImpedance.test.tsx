import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

import { LineImpedance } from '@transmission/components/modules/LineImpedance';

const renderLI = () => render(<MemoryRouter><LineImpedance /></MemoryRouter>);
const gateQ = /quarter-wavelength/i;
const distSlider = /distance from load/i;

describe('LineImpedance — section 5.4 page', () => {
  it('renders the h1 with the derived section number', () => {
    renderLI();
    const h1 = screen.getByRole('heading', { level: 1, name: /Line Impedance & Matching/i });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('5.4');
  });

  it('blocks the bench behind the gate with no Skip control, and unlock survives tab switches', async () => {
    const user = userEvent.setup();
    renderLI();

    // Open the Z_in Lab tab: gate question visible, sim absent, no Skip rendered.
    await user.click(screen.getByRole('tab', { name: /Z_in Lab/i }));
    expect(screen.getByText(gateQ)).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: distSlider })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();

    // Commit the prediction → the bench is revealed.
    await user.click(screen.getByText('25 Ω — less than Z₀'));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByRole('slider', { name: distSlider })).toBeInTheDocument();

    // Switch away and back — the lifted unlock state must survive the remount.
    await user.click(screen.getByRole('tab', { name: /Electrical Length/i }));
    await user.click(screen.getByRole('tab', { name: /Z_in Lab/i }));
    expect(screen.getByRole('slider', { name: distSlider })).toBeInTheDocument();
    expect(screen.queryByText(gateQ)).not.toBeInTheDocument();
  });

  it('bench readouts: λ/4 inversion on the exam load, then → ∞ for the short', async () => {
    const user = userEvent.setup();
    renderLI();

    await user.click(screen.getByRole('tab', { name: /Z_in Lab/i }));
    await user.click(screen.getByText('25 Ω — less than Z₀'));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));

    // Default exam load (100 Ω) at l = 0.25λ → Z_in = Z₀²/Z_L = 25 Ω exactly.
    const slider = screen.getByRole('slider', { name: distSlider });
    fireEvent.change(slider, { target: { value: '0.25' } });
    expect(screen.getByText('25.0 + j0.0 Ω')).toBeInTheDocument();

    // Short preset at l = 0.25λ → the quarter-wave inverter turns it into an open.
    await user.click(screen.getByRole('button', { name: /Short \(0 Ω\)/ }));
    expect(screen.getByText('→ ∞ (open)')).toBeInTheDocument();
  });

  it('renders all three ConceptChecks across the tabs', async () => {
    const user = userEvent.setup();
    renderLI();

    // CC-1 lives in the Electrical Length tab (default).
    expect(screen.getByText(/What happens to the reflection coefficient/i)).toBeInTheDocument();

    // CC-2 lives in the Z_in Lab theory column.
    await user.click(screen.getByRole('tab', { name: /Z_in Lab/i }));
    expect(screen.getByText(/terminated in Z_L = 80 − j20 Ω/i)).toBeInTheDocument();

    // CC-3 lives in the Stubs tab.
    await user.click(screen.getByRole('tab', { name: /Stubs/i }));
    expect(screen.getByText(/What does it present at its input/i)).toBeInTheDocument();
  });
});

/**
 * #9 batch 2 (09c) — A.2#7: the lossy-line aside quoted "~20 dB/100 m for thin
 * RG-58" at 1 GHz, ~4× low (real ~70–100 dB/100 m; theoretical floor ~35). The
 * point (loss is negligible across a 5 cm matching section) survives a correct
 * figure, so fix the number to ~80 dB/100 m. CollapsibleSection always renders
 * its children, so the aside is in the DOM on the default tab.
 */
describe('lossy-line aside quotes a physically real RG-58 figure (A.2#7)', () => {
  it('states ~80 dB for thin RG-58, not the ~4× low 20 dB', () => {
    renderLI();
    expect(screen.getByText(/80 dB for thin RG-58/)).toBeInTheDocument();
    expect(screen.queryByText(/20 dB for thin RG-58/)).not.toBeInTheDocument();
  });
});
