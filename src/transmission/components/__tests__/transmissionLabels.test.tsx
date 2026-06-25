import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TransmissionLineSim } from '@transmission/components/simulations/TransmissionLineSim';
import { TransmissionLines } from '@transmission/components/modules/TransmissionLines';

vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
    render: (latex: string, el: HTMLElement) => {
      el.textContent = latex;
    },
  },
}));

describe('TransmissionLineSim frequency-axis + wavelength labels (A.2 #15, #17)', () => {
  it('labels the frequency-slider centre tick at its true log-midpoint, 100 MHz (not 1 GHz)', () => {
    render(<TransmissionLineSim />);
    // Slider spans exp 6..10 (1 MHz..10 GHz); the centre is exp 8 = 100 MHz.
    expect(screen.getByText('100 MHz')).toBeInTheDocument();
    expect(screen.queryByText('1 GHz')).not.toBeInTheDocument();
  });

  it('labels both wavelength readouts consistently (free-space λ₀)', () => {
    render(<TransmissionLineSim />);
    // Both readouts show the same free-space wavelength; they must not be labelled λ₀ vs λ.
    expect(screen.getAllByText(/Free-space wavelength/i).length).toBeGreaterThanOrEqual(2);
  });
});

describe('TransmissionLines impedance examples (A.2#16)', () => {
  it('does not list USB as a 100 Ω differential pair (it is 90 Ω)', () => {
    render(
      <MemoryRouter>
        <TransmissionLines />
      </MemoryRouter>,
    );
    expect(screen.queryByText((c) => c.includes('(Ethernet, USB)'))).not.toBeInTheDocument();
    expect(screen.getByText((c) => c.includes('USB is 90'))).toBeInTheDocument();
  });
});
