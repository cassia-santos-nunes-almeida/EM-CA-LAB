/**
 * Audit P-03: 'Envelope τ = 1/α … 99% in ~5τ' was shown for ALL damping types,
 * but 1/α is the envelope constant ONLY when underdamped; for the DEFAULT
 * overdamped circuit (R=100Ω, L=0.1H, C=100µF: α=500, ω₀=316.2,
 * s₁=−112.7 s⁻¹) the true 99% settle is ~5/|s₁| ≈ 44 ms, not 5·(1/α)=10 ms.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RLCAnalysisPanel, chartTauMarkerMs } from '../index'; // same relative import form firstOrderImpulseLabels.test.tsx uses for FirstOrderAnalysisPanel (exported at index.tsx:269)

const base = { data: [], timeConstant: undefined };

describe('RLCAnalysisPanel τ card is damping-aware (P-03)', () => {
  it('overdamped: labels the slowest mode 1/|s₁| and drops the universal 99%-in-5τ hint', () => {
    render(<RLCAnalysisPanel response={{ ...base, dampingType: 'overdamped', alpha: 500, omega0: 316.2278, zeta: 1.5811 }} timeConstantMs={2} />);
    expect(screen.getByText(/Slowest mode/i)).toBeInTheDocument();
    // 1/|−500+√(500²−316.2278²)| = 1/112.702 s = 8.873 ms
    expect(screen.getByText('8.873')).toBeInTheDocument();
  });
  it('underdamped: keeps the envelope label and the ~5τ question', () => {
    render(<RLCAnalysisPanel response={{ ...base, dampingType: 'underdamped', alpha: 500, omega0: 1000, zeta: 0.5 }} timeConstantMs={2} />);
    // Anchored to the start of the string: the italic hint below also contains the
    // lowercase word "envelope" ("How many envelope time constants…"), so an
    // unanchored /Envelope/i matches both nodes and getByText throws for multiple matches.
    expect(screen.getByText(/^Envelope/i)).toBeInTheDocument();
    expect(screen.getByText('2.000')).toBeInTheDocument(); // 1/α = 2 ms
  });
});

/**
 * Phase-3 fix wave B (completes P-03): the response chart's dashed time-constant
 * marker used 2L/R for every RLC damping type, contradicting the panel above,
 * which shows the slowest-mode constant for overdamped — two different τ on
 * screen at once. chartTauMarkerMs must reuse the SAME response.alpha/omega0
 * fields as RLCAnalysisPanel's slowestTauMs so both numbers always agree.
 */
describe('chartTauMarkerMs matches RLCAnalysisPanel for overdamped RLC (P-03 chart completion)', () => {
  it('overdamped default (R=100,L=0.1,C=100µF: α=500, ω₀=316.2278): marker ≈ 8.873 ms — same number the panel shows', () => {
    const response = { ...base, dampingType: 'overdamped' as const, alpha: 500, omega0: 316.2278, zeta: 1.5811 };
    // envelopeTauMs (2L/R = 2ms) is passed but must be IGNORED for overdamped:
    expect(chartTauMarkerMs('RLC', response, 2)).toBeCloseTo(8.873, 3);
  });

  it('underdamped: marker falls back to the passed envelope constant (1/α), unchanged from before', () => {
    const response = { ...base, dampingType: 'underdamped' as const, alpha: 500, omega0: 1000, zeta: 0.5 };
    expect(chartTauMarkerMs('RLC', response, 2)).toBe(2);
  });

  it('critically damped: marker falls back to the passed envelope constant (1/α), unchanged from before', () => {
    const response = { ...base, dampingType: 'critically-damped' as const, alpha: 316.2278, omega0: 316.2278, zeta: 1 };
    expect(chartTauMarkerMs('RLC', response, 3.162)).toBe(3.162);
  });

  it('RC/RL: marker always falls back to the passed value regardless of dampingType field', () => {
    const rc = { data: [], timeConstant: 0.001 };
    expect(chartTauMarkerMs('RC', rc, 1.5)).toBe(1.5);
  });
});
