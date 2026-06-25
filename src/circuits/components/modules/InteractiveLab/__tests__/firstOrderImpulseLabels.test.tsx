import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FirstOrderAnalysisPanel, responseYAxisLabel } from '../index';
import type { CircuitResponse } from '@circuits/utils/circuitSolver';

/**
 * #9 batch 2 (09c) — InteractiveLab impulse-mode labelling (Appendix A.2#5 + A.2#6).
 *
 *  A.2#5 (index.tsx:520): the response Y-axis was hardcoded "Voltage (V) / Current
 *         (mA)". An impulse response h(t)=ds/dt carries an extra 1/time, so in
 *         impulse mode the axis is V/s and mA/s — it must relabel.
 *  A.2#6 (index.tsx:283-295, +270): FirstOrderAnalysisPanel said the response
 *         "reaches 63.2% / 99.3% of final value" even in impulse mode. A first-order
 *         impulse response DECAYS to 0 (no final value); at t=τ it is e⁻¹ = 36.8%
 *         of its PEAK. The panel must gate this language on inputType.
 */

const resp = { timeConstant: 0.001 } as CircuitResponse;
const panelProps = { circuitType: 'RC' as const, response: resp, R: 1000, L: 0.1, C: 1e-6 };

describe('response Y-axis carries the impulse 1/time units (A.2#5)', () => {
  it('step mode: plain V / mA, no per-second', () => {
    const label = responseYAxisLabel('step');
    expect(label).toMatch(/\(V\)/);
    expect(label).toMatch(/\(mA\)/);
    expect(label).not.toMatch(/\/s/);
  });

  it('impulse mode: V/s and mA/s (rate units)', () => {
    const label = responseYAxisLabel('impulse');
    expect(label).toMatch(/V\/s/);
    expect(label).toMatch(/mA\/s/);
  });
});

describe('FirstOrderAnalysisPanel milestones match the input type (A.2#6)', () => {
  it('step mode: 63.2% / 99.3% of FINAL value, no "peak"', () => {
    render(<FirstOrderAnalysisPanel {...panelProps} inputType="step" />);
    expect(screen.getByText(/63\.2%/)).toBeTruthy();
    expect(screen.getByText(/99\.3%/)).toBeTruthy();
    expect(screen.queryAllByText(/peak/i)).toHaveLength(0);
  });

  it('impulse mode: 36.8% of PEAK, decays to ~0, never "final value" or 63.2%', () => {
    render(<FirstOrderAnalysisPanel {...panelProps} inputType="impulse" />);
    expect(screen.getByText(/36\.8%/)).toBeTruthy();
    expect(screen.queryAllByText(/peak/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/63\.2%/)).toBeNull();
    expect(screen.queryByText(/99\.3%/)).toBeNull();
    expect(screen.queryAllByText(/final value/i)).toHaveLength(0);
  });
});
