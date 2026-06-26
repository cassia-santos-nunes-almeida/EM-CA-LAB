import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

/* katex (MathWrapper) + canvas + RAF mocks, mirroring the transmission test harness */
vi.mock('katex', () => ({
  default: { renderToString: (latex: string) => `<span class="katex">${latex}</span>`, render: vi.fn() },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), save: vi.fn(), restore: vi.fn(),
    translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), setTransform: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })), fillText: vi.fn(), strokeText: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })), putImageData: vi.fn(), closePath: vi.fn(),
    quadraticCurveTo: vi.fn(), bezierCurveTo: vi.fn(), rect: vi.fn(), clip: vi.fn(),
    setLineDash: vi.fn(), font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
    lineCap: '', lineJoin: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    canvas: { width: 800, height: 600 },
  })) as never;
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number;
    globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  }
});

import { EMWaveSection } from '@em/sections/em-wave/index';

/**
 * #9 batch 2 (09c) — units net: the AC-phasor "V Phase" / "I Phase" sliders rendered
 * a bare number (e.g. "45") while the companion Δφ readout and the polarization phase
 * slider both use the degree sign. A phase IS an angle in degrees here, so the slider
 * readout must carry the ° unit.
 */
describe('em-wave V/I phase sliders carry the degree unit', () => {
  it('renders the V Phase value with ° once the phasor view is open', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><EMWaveSection /></MemoryRouter>);

    // Pass the blocking prediction gate (B ⟂ E along y), then reveal the sim.
    await user.click(screen.getByRole('button', { name: /Along y/i }));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));

    // Switch to the AC Phasors view where the V/I Phase sliders live.
    await user.click(screen.getByRole('button', { name: 'AC Phasors' }));

    const vPhase = screen.getByRole('slider', { name: 'V Phase' });
    fireEvent.change(vPhase, { target: { value: '45' } });

    expect(screen.getByText('45°')).toBeInTheDocument();
  });

  it('marks the normalized Frequency/Amplitude/Speed readouts as (arb.)', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><EMWaveSection /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /Along y/i }));
    await user.click(screen.getByText(/COMMIT PREDICTION/i));

    // Default (3D) view shows Frequency, Amplitude and Speed; each value readout now
    // carries " (arb.)" to match the chart axes. The digit prefix excludes the
    // "Attenuation α (arb.)" slider LABEL (its (arb.) follows a Greek letter, not a value).
    expect(screen.getAllByText(/\d\s*\(arb\.\)/).length).toBeGreaterThanOrEqual(3);
  });
});
