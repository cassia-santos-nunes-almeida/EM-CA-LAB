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
    // ILO-8: the plausibility callout (c = 1/√(μ₀ε₀)) sits OUTSIDE the gate.
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
  });

  it('GaussSection renders', async () => {
    const { GaussSection } = await import('@em/sections/gauss/index');
    renderSection(GaussSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // The guided-challenge capstone is wired in at the end of the section.
    expect(screen.getByText('Flux Through Any Surface')).toBeInTheDocument();
    // Unit 2G: the plausibility callout sits OUTSIDE the gate (ungated by design).
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
  });

  it('CoulombSection renders', async () => {
    const { CoulombSection } = await import('@em/sections/coulomb/index');
    renderSection(CoulombSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // Unit 2G: the plausibility callout sits OUTSIDE the gate (ungated by design).
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
  });

  it('AmpereSection renders', async () => {
    const { AmpereSection } = await import('@em/sections/ampere/index');
    renderSection(AmpereSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // Unit 2G: the plausibility callout sits OUTSIDE the gates (ungated by design).
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
  });

  it('LorentzSection renders', async () => {
    const { LorentzSection } = await import('@em/sections/lorentz/index');
    renderSection(LorentzSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // Unit 2G: the plausibility callout sits OUTSIDE the gate (ungated by design).
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
    // Unit 2G: the 'Computed r' EquationBox row reads in real SI — under the katex
    // mock formulas render as raw LaTeX, so the mm unit substring is stable.
    expect(
      screen.getAllByText((content) => content.includes(String.raw`\text{mm}`)).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('FaradaySection renders', async () => {
    const { FaradaySection } = await import('@em/sections/faraday/index');
    renderSection(FaradaySection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // Unit 2G: the plausibility callout sits OUTSIDE the gates (ungated by design).
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
    // Unit 2G: the critique exercise (Q_MISSING_AREA) is ungated too.
    expect(screen.getByText(/reports a peak EMF of 31\.4 V/)).toBeInTheDocument();
    // Unit 2G: the equation box reads in real SI — under the katex mock formulas
    // render as raw LaTeX, so the Hz and mV unit substrings are stable.
    expect(
      screen.getAllByText((content) => content.includes(String.raw`\text{Hz}`)).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText((content) => content.includes(String.raw`\text{mV}`)).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('LenzSection renders', async () => {
    const { LenzSection } = await import('@em/sections/lenz/index');
    renderSection(LenzSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    // ILO-8: the plausibility callout (induced EMF ≈ 0.16 V) sits OUTSIDE the gate.
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
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
    // ILO-8: the plausibility callout (circular-polarization fragility) sits OUTSIDE the gate.
    expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1);
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
    // Two gates since unit 2D: the sim gate plus the parallel-wires gate.
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
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
    // Pin the answer key: the gate must judge this option correct, not merely answered.
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByRole('img', { name: /radiating charge/i })).toBeInTheDocument();
  });

  it('EMWaveSection gates the sim behind a Predict First prediction', async () => {
    const { EMWaveSection } = await import('@em/sections/em-wave/index');
    renderSection(EMWaveSection);
    // Two locked gates on first render: the wave sim + the media interface panel.
    expect(screen.getAllByText('Predict First')).toHaveLength(2);
    expect(screen.getByText(/Along which axis does the B field oscillate/i)).toBeInTheDocument();
  });

  it('EMWaveSection teaches waves in real media behind a second blocking gate', async () => {
    const { EMWaveSection } = await import('@em/sections/em-wave/index');
    renderSection(EMWaveSection);
    // Theory block, interface gate question and both new concept checks render immediately.
    expect(screen.getByText('Waves in Real Media')).toBeInTheDocument();
    expect(screen.getAllByText(/intrinsic impedance/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/fraction of the incident POWER reflects back/i)).toBeInTheDocument();
    expect(screen.getByText(/impedance of free space.*physically represent/i)).toBeInTheDocument();
    expect(screen.getByText(/which single dimensionless ratio decides/i)).toBeInTheDocument();
    // Blocking gate with the no-Skip default: the interface panel stays hidden.
    expect(screen.queryByLabelText('ε_r of medium 2')).toBeNull();
    expect(screen.queryByText('Skip')).toBeNull();
    // Answer the prediction and continue → slider + mediaMath readouts appear.
    fireEvent.click(screen.getByRole('button', { name: '4%' }));
    // Pin the answer key: the gate must judge this option correct, not merely answered.
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByLabelText('ε_r of medium 2')).toBeInTheDocument();
    // The slider's own readout shows the full 2-decimal default, not a 1-dp rounding.
    expect(screen.getByText('2.25')).toBeInTheDocument();
    // Default εr = 2.25 (glass): η₂ = 376.73/1.5 = 251.2 Ω, Γ = −0.200, 4% / 96% power split.
    expect(screen.getByText('251.2 Ω')).toBeInTheDocument();
    expect(screen.getByText('−0.200')).toBeInTheDocument();
    expect(screen.getByText('4.0%')).toBeInTheDocument();
    expect(screen.getByText('96.0%')).toBeInTheDocument();
    // Slide to seawater (εr = 81): Γ = (41.86−376.73)/(41.86+376.73) = −0.800 → 64% reflected.
    fireEvent.change(screen.getByLabelText('ε_r of medium 2'), { target: { value: '81' } });
    expect(screen.getByText('−0.800')).toBeInTheDocument();
    expect(screen.getByText('64.0%')).toBeInTheDocument();
    expect(screen.getByText('36.0%')).toBeInTheDocument();
  });

  it('EMWaveSection adds an attenuation slider to the unlocked wave sim', async () => {
    const { EMWaveSection } = await import('@em/sections/em-wave/index');
    renderSection(EMWaveSection);
    // Hidden while the wave-sim gate is locked (separately unlocked from the interface gate).
    expect(screen.queryByLabelText('Attenuation α (arb.)')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Along y' }));
    fireEvent.click(screen.getByText(/COMMIT PREDICTION/i));
    expect(screen.getByLabelText('Attenuation α (arb.)')).toBeInTheDocument();
  });

  it('PolarizationSection gates the sim behind a Predict First prediction', async () => {
    const { PolarizationSection } = await import('@em/sections/polarization/index');
    renderSection(PolarizationSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/90° phase difference/i)).toBeInTheDocument();
  });
});
