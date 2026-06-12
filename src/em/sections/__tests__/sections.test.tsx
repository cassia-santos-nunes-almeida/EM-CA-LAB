import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock katex for all sections that use MathWrapper
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

// Helper to render a section inside a router
function renderSection(Section: React.ComponentType) {
  return render(
    <MemoryRouter>
      <Section />
    </MemoryRouter>
  );
}

describe('Section smoke tests', () => {
  it('MaxwellSection renders', async () => {
    const { MaxwellSection } = await import('@em/sections/maxwell/index');
    renderSection(MaxwellSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('GaussSection renders', async () => {
    const { GaussSection } = await import('@em/sections/gauss/index');
    renderSection(GaussSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // The guided-challenge capstone is wired in at the end of the section.
    expect(screen.getByText('Flux Through Any Surface')).toBeInTheDocument();
  });

  it('CoulombSection renders', async () => {
    const { CoulombSection } = await import('@em/sections/coulomb/index');
    renderSection(CoulombSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('AmpereSection renders', async () => {
    const { AmpereSection } = await import('@em/sections/ampere/index');
    renderSection(AmpereSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('LorentzSection renders', async () => {
    const { LorentzSection } = await import('@em/sections/lorentz/index');
    renderSection(LorentzSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('FaradaySection renders', async () => {
    const { FaradaySection } = await import('@em/sections/faraday/index');
    renderSection(FaradaySection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('LenzSection renders', async () => {
    const { LenzSection } = await import('@em/sections/lenz/index');
    renderSection(LenzSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('EMWaveSection renders', async () => {
    const { EMWaveSection } = await import('@em/sections/em-wave/index');
    renderSection(EMWaveSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('PolarizationSection renders', async () => {
    const { PolarizationSection } = await import('@em/sections/polarization/index');
    renderSection(PolarizationSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('MagneticCircuitsSection renders', async () => {
    const { MagneticCircuitsSection } = await import('@em/sections/magnetic-circuits/index');
    renderSection(MagneticCircuitsSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('CoulombSection gates the sim behind a Predict First prediction', async () => {
    const { CoulombSection } = await import('@em/sections/coulomb/index');
    renderSection(CoulombSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/net electric field/i)).toBeInTheDocument();
  });

  it('GaussSection gates the sim behind a Predict First prediction', async () => {
    const { GaussSection } = await import('@em/sections/gauss/index');
    renderSection(GaussSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/double the sphere's radius/i)).toBeInTheDocument();
  });

  it('AmpereSection gates the sim behind a Predict First prediction', async () => {
    const { AmpereSection } = await import('@em/sections/ampere/index');
    renderSection(AmpereSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/distance r from a long straight wire/i)).toBeInTheDocument();
  });

  it('MaxwellSection gates the cards behind a Predict First prediction', async () => {
    const { MaxwellSection } = await import('@em/sections/maxwell/index');
    renderSection(MaxwellSection);
    // Two locked gates on first render: the 4-card overview + the radiation sim.
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
    expect(screen.getByText(/let Maxwell predict self-propagating/i)).toBeInTheDocument();
  });

  it('MaxwellSection teaches the radiation mechanism behind a second blocking gate', async () => {
    const { MaxwellSection } = await import('@em/sections/maxwell/index');
    renderSection(MaxwellSection);
    // Theory block, new gate question, CC-K and the Larmor cap render immediately.
    expect(screen.getByText('Why accelerating charges radiate')).toBeInTheDocument();
    expect(screen.getByText(/which of them radiates electromagnetic energy/i)).toBeInTheDocument();
    expect(screen.getByText(/why does only the radiation field carry energy/i)).toBeInTheDocument();
    expect(screen.getByText(/Larmor's scaling/)).toBeInTheDocument();
    // Blocking gate with the no-Skip default: the sim canvas stays hidden.
    expect(screen.queryByRole('img', { name: /radiating charge/i })).toBeNull();
    expect(screen.queryByText('Skip')).toBeNull();
    // Answer the prediction and continue → the kink sim canvas is revealed.
    fireEvent.click(screen.getByRole('button', { name: /only the oscillating one/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('img', { name: /radiating charge/i })).toBeInTheDocument();
  });

  it('EMWaveSection gates the sim behind a Predict First prediction', async () => {
    const { EMWaveSection } = await import('@em/sections/em-wave/index');
    renderSection(EMWaveSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/Along which axis does the B field oscillate/i)).toBeInTheDocument();
  });

  it('PolarizationSection gates the sim behind a Predict First prediction', async () => {
    const { PolarizationSection } = await import('@em/sections/polarization/index');
    renderSection(PolarizationSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/90° phase difference/i)).toBeInTheDocument();
  });
});
