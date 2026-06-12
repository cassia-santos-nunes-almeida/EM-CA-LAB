import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AmpereSection } from '@em/sections/ampere/index';
import { LorentzSection } from '@em/sections/lorentz/index';

// Mock katex for all sections that use MathWrapper (same shim as sections.test.tsx):
// formulas render as their raw LaTeX source inside a .katex span.
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

// Local copies of the tiny page-test helpers (parallel-work convention:
// new page tests replicate them rather than importing from another test file).
function renderSection(Section: React.ComponentType) {
  return render(
    <MemoryRouter>
      <Section />
    </MemoryRouter>
  );
}

/** Click a prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string | RegExp) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('AmpereSection — forces between parallel wires (unit 2D)', () => {
  it('blocks the parallel-wires reveal behind a new Predict First gate with no Skip', () => {
    renderSection(AmpereSection);
    // The new gate's question is visible…
    expect(screen.getByText(/carry current in the SAME direction/i)).toBeInTheDocument();
    // …but the gated reveal card is not, and there is no Skip escape hatch.
    expect(screen.queryByText(/LIKE CURRENTS ATTRACT/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull();
  });

  it('keeps the original sim gate alongside the new parallel-wires gate', () => {
    renderSection(AmpereSection);
    expect(screen.getByText(/distance r from a long straight wire/i)).toBeInTheDocument();
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
  });

  it('reveals the like-currents card, ampere definition and busbar example after passing the gate', async () => {
    const user = userEvent.setup();
    renderSection(AmpereSection);
    await passPredictionGate(user, 'Attract');
    expect(screen.getByText(/LIKE CURRENTS ATTRACT/i)).toBeInTheDocument();
    expect(screen.getByText(/classical.*ampere/i)).toBeInTheDocument();
    expect(screen.getByText(/Short-circuit forces on a busbar pair/i)).toBeInTheDocument();
    expect(screen.getByText(/200 N\/m/)).toBeInTheDocument();
  });

  it('CC-A: the parallel-wires ConceptCheck reveals its explanation on the correct answer', async () => {
    const user = userEvent.setup();
    renderSection(AmpereSection);
    await passPredictionGate(user, 'Attract');
    expect(screen.getByText(/100 A in the same direction/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '0.02 N/m, attractive' }));
    // The shared explanation surfaces (and pins the dropped-2π distractor teaching).
    expect(screen.getByText(/drop the 2π/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2×10⁻⁷/).length).toBeGreaterThan(0);
  });
});

describe('LorentzSection — complete force & force on conductors (unit 2D)', () => {
  it('states the complete Lorentz force with the velocity-selector story (ungated theory)', () => {
    renderSection(LorentzSection);
    expect(screen.getByRole('heading', { name: /The complete Lorentz force/i })).toBeInTheDocument();
    expect(screen.getAllByText(/velocity selector/i).length).toBeGreaterThan(0);
    // EquationBox carries the new full-force row — under the katex mock formulas
    // render as their raw LaTeX source, so the substring is stable.
    expect(
      screen.getAllByText((content) =>
        content.includes(String.raw`q(\vec{E} + \vec{v} \times \vec{B})`)
      ).length
    ).toBeGreaterThan(0);
  });

  it('CC-L: the velocity-selector ConceptCheck reveals its explanation on the correct answer', async () => {
    const user = userEvent.setup();
    renderSection(LorentzSection);
    expect(screen.getByText(/crossed fields/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Those with v = 2.0×10⁵ m/s — regardless of charge or mass' })
    );
    // The shared explanation surfaces (q- and m-blindness is the teaching point).
    expect(screen.getByText(/flipping its sign flips BOTH forces/i)).toBeInTheDocument();
    expect(screen.getAllByText(/E\/B/).length).toBeGreaterThan(0);
  });

  it('derives F = BIl from drifting charges and pins the loudspeaker numbers', () => {
    renderSection(LorentzSection);
    expect(screen.getByRole('heading', { name: /From particles to wires/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Why a loudspeaker works/i })).toBeInTheDocument();
    // Pin the hand-derived chain (l ≈ 7.85 m → F = 3.93 N) against silent edits.
    expect(screen.getAllByText(/7\.85/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.93/).length).toBeGreaterThan(0);
  });
});
