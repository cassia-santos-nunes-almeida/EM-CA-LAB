import { describe, it, expect } from 'vitest';
import {
  calculateCircuitResponse,
  calculateTransferFunction,
  calculateDCDivider,
  switchedRCTau,
  switchedRCCurrentJump,
  switchedFirstOrder,
  secondOrderStepICs,
} from '@circuits/utils/circuitSolver';
import { classifyDamping, CRITICAL_DAMPING_TOLERANCE } from '@circuits/types/circuit';

// Tolerance for floating-point comparisons
const TOL = 1e-6;

describe('classifyDamping', () => {
  it('returns underdamped when zeta < 1 - tolerance', () => {
    expect(classifyDamping(0.5)).toBe('underdamped');
    expect(classifyDamping(0.0)).toBe('underdamped');
    expect(classifyDamping(1 - CRITICAL_DAMPING_TOLERANCE - 0.001)).toBe('underdamped');
  });

  it('returns overdamped when zeta > 1 + tolerance', () => {
    expect(classifyDamping(2.0)).toBe('overdamped');
    expect(classifyDamping(1 + CRITICAL_DAMPING_TOLERANCE + 0.001)).toBe('overdamped');
  });

  it('returns critically-damped when zeta is within tolerance of 1', () => {
    expect(classifyDamping(1.0)).toBe('critically-damped');
    expect(classifyDamping(1 + CRITICAL_DAMPING_TOLERANCE)).toBe('critically-damped');
    expect(classifyDamping(1 - CRITICAL_DAMPING_TOLERANCE)).toBe('critically-damped');
  });
});

describe('calculateCircuitResponse — RC step', () => {
  const params = { R: 1000, L: 0.1, C: 0.000001, voltage: 5 };
  const tau = params.R * params.C; // 1ms

  it('starts at 0V and converges to Vs', () => {
    const result = calculateCircuitResponse('RC', params, 0.0001, 0.01);
    const first = result.data[0];
    const last = result.data[result.data.length - 1];

    expect(first.voltage).toBeCloseTo(0, 4);
    expect(last.voltage).toBeCloseTo(params.voltage, 1);
  });

  it('returns correct time constant', () => {
    const result = calculateCircuitResponse('RC', params, 0.0001, 0.01);
    expect(result.timeConstant).toBeCloseTo(tau, 8);
  });

  it('matches V = Vs*(1 - e^(-t/tau)) at t = tau', () => {
    const result = calculateCircuitResponse('RC', params, tau, 5 * tau);
    // at t = tau, voltage = Vs * (1 - 1/e) ≈ 0.6321 * Vs
    const atTau = result.data[1]; // index 1 = 1 * tau
    expect(atTau.voltage).toBeCloseTo(params.voltage * (1 - Math.exp(-1)), TOL);
  });

  it('current starts at Vs/R and decays to 0', () => {
    const result = calculateCircuitResponse('RC', params, 0.0001, 0.01);
    const first = result.data[0];
    const last = result.data[result.data.length - 1];

    expect(first.current).toBeCloseTo(params.voltage / params.R, TOL);
    expect(last.current).toBeCloseTo(0, 3);
  });
});

describe('calculateCircuitResponse — RL step', () => {
  const params = { R: 100, L: 0.1, C: 0.0001, voltage: 10 };
  const tau = params.L / params.R; // 1ms

  it('voltage starts at Vs and decays', () => {
    const result = calculateCircuitResponse('RL', params, 0.0001, 0.01);
    expect(result.data[0].voltage).toBeCloseTo(params.voltage, TOL);
    expect(result.data[result.data.length - 1].voltage).toBeCloseTo(0, 2);
  });

  it('current starts at 0 and converges to Vs/R', () => {
    const result = calculateCircuitResponse('RL', params, 0.0001, 0.01);
    expect(result.data[0].current).toBeCloseTo(0, TOL);
    expect(result.data[result.data.length - 1].current).toBeCloseTo(params.voltage / params.R, 2);
  });

  it('returns correct time constant', () => {
    const result = calculateCircuitResponse('RL', params, 0.0001, 0.01);
    expect(result.timeConstant).toBeCloseTo(tau, 8);
  });
});

describe('calculateCircuitResponse — RC impulse', () => {
  const params = { R: 1000, L: 0.1, C: 0.000001, voltage: 5 };

  it('impulse response decays from peak toward 0', () => {
    // Use longer duration (10*tau) so signal fully decays
    const result = calculateCircuitResponse('RC', params, 0.0001, 0.05, 'impulse');
    const first = result.data[0];
    const last = result.data[result.data.length - 1];

    // Impulse starts at Vs/(RC) and decays
    expect(Math.abs(first.voltage)).toBeGreaterThan(Math.abs(last.voltage));
    expect(last.voltage).toBeCloseTo(0, 2);
  });
});

describe('calculateCircuitResponse — RLC', () => {
  it('detects underdamped response (R = 10, L = 0.1, C = 100uF)', () => {
    const params = { R: 10, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.00001, 0.05);

    expect(result.dampingType).toBe('underdamped');
    expect(result.zeta).toBeDefined();
    expect(result.zeta!).toBeLessThan(1);
  });

  it('detects overdamped response (R = 1000, L = 0.1, C = 100uF)', () => {
    const params = { R: 1000, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.0001, 0.05);

    expect(result.dampingType).toBe('overdamped');
    expect(result.zeta!).toBeGreaterThan(1);
  });

  it('detects critically-damped response (R = 2*sqrt(L/C))', () => {
    const L = 0.1, C = 0.0001;
    const R = 2 * Math.sqrt(L / C); // exact critical damping
    const params = { R, L, C, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.0001, 0.05);

    expect(result.dampingType).toBe('critically-damped');
  });

  it('underdamped step response overshoots Vs then settles', () => {
    const params = { R: 10, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.00001, 0.05);

    const maxVoltage = Math.max(...result.data.map(p => p.voltage));
    expect(maxVoltage).toBeGreaterThan(params.voltage);

    const last = result.data[result.data.length - 1];
    expect(last.voltage).toBeCloseTo(params.voltage, 0);
  });

  it('overdamped step response never exceeds Vs', () => {
    const params = { R: 1000, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.0001, 0.5);

    const maxVoltage = Math.max(...result.data.map(p => p.voltage));
    expect(maxVoltage).toBeLessThanOrEqual(params.voltage + TOL);
  });

  it('overdamped step response charges from 0 up to Vs (regression: was inverted)', () => {
    // Default lab parameters land here (R=100 -> zeta~1.58), so this is the curve
    // students see on first load. The earlier solver omitted the forced Vs term and
    // produced a discharge curve (v(0)=Vs, v(inf)=0). The "never exceeds Vs" test
    // above passes on that wrong curve too, so pin both endpoints and i(0).
    const params = { R: 100, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.0001, 0.1);
    const first = result.data[0];
    const last = result.data[result.data.length - 1];

    expect(result.dampingType).toBe('overdamped');
    expect(first.voltage).toBeCloseTo(0, 6); // v(0) = 0, not Vs
    expect(last.voltage).toBeCloseTo(params.voltage, 1); // rises to Vs
    expect(first.current).toBeCloseTo(0, 6); // i(0) = 0 for a step into an overdamped RLC

    // Overdamped has no overshoot: voltage is monotonically non-decreasing.
    const monotonic = result.data.every((p, i) =>
      i === 0 || p.voltage >= result.data[i - 1].voltage - TOL);
    expect(monotonic).toBe(true);
  });

  it('overdamped step rises to Vs at high R too (R=1000)', () => {
    const params = { R: 1000, L: 0.1, C: 0.0001, voltage: 5 };
    const result = calculateCircuitResponse('RLC', params, 0.0001, 0.5);
    expect(result.data[0].voltage).toBeCloseTo(0, 6);
    expect(result.data[result.data.length - 1].voltage).toBeCloseTo(params.voltage, 1);
  });

  it('impulse response starts near 0 and returns to 0', () => {
    const params = { R: 10, L: 0.1, C: 0.0001, voltage: 5 };
    // Longer duration so the underdamped oscillation decays fully
    const result = calculateCircuitResponse('RLC', params, 0.00001, 0.5, 'impulse');

    expect(result.data[0].voltage).toBeCloseTo(0, 2);
    const last = result.data[result.data.length - 1];
    expect(last.voltage).toBeCloseTo(0, 1);
  });
});

describe('calculateTransferFunction', () => {
  it('returns correct numerator and denominator for RLC', () => {
    const R = 100, L = 0.1, C = 0.0001;
    const result = calculateTransferFunction(R, L, C);

    const omega0Sq = 1 / (L * C);
    const alpha = R / (2 * L);

    expect(result.numerator).toEqual([omega0Sq]);
    expect(result.denominator).toEqual([1, 2 * alpha, omega0Sq]);
  });

  it('returns two real poles for overdamped system', () => {
    const R = 1000, L = 0.1, C = 0.0001;
    const result = calculateTransferFunction(R, L, C);

    expect(result.poles).toHaveLength(2);
    // Overdamped: both poles are real (imag = 0)
    expect(result.poles[0].imag).toBe(0);
    expect(result.poles[1].imag).toBe(0);
    // Both poles should be negative (stable)
    expect(result.poles[0].real).toBeLessThan(0);
    expect(result.poles[1].real).toBeLessThan(0);
  });

  it('returns conjugate complex poles for underdamped system', () => {
    const R = 10, L = 0.1, C = 0.0001;
    const result = calculateTransferFunction(R, L, C);

    expect(result.poles).toHaveLength(2);
    // Underdamped: complex conjugate pair
    expect(result.poles[0].real).toBeCloseTo(result.poles[1].real, TOL);
    expect(result.poles[0].imag).toBeCloseTo(-result.poles[1].imag, TOL);
    expect(result.poles[0].imag).not.toBe(0);
    // Negative real part (stable)
    expect(result.poles[0].real).toBeLessThan(0);
  });

  it('returns empty zeros array', () => {
    const result = calculateTransferFunction(100, 0.1, 0.0001);
    expect(result.zeros).toEqual([]);
  });
});

describe('calculateDCDivider', () => {
  it('computes the worked-example pre-state: 12 V through 4 kΩ into 8 kΩ ∥ C(open) gives 8 V', () => {
    // Capacitor = open at DC, so this is a pure divider:
    // v = 12 × 8000/(4000 + 8000) = 12 × 2/3 = 8 V
    expect(calculateDCDivider(12, 4000, 8000)).toBeCloseTo(8, 10);
  });

  it('passes the full source through when the series resistance is zero', () => {
    // v = 20 × 8000/(0 + 8000) = 20 V
    expect(calculateDCDivider(20, 0, 8000)).toBeCloseTo(20, 10);
  });

  it('returns 0 when the shunt branch is a short', () => {
    // v = 12 × 0/(4000 + 0) = 0 V
    expect(calculateDCDivider(12, 4000, 0)).toBeCloseTo(0, 10);
  });

  it('returns NaN when the total resistance is non-positive', () => {
    // Rseries + Rshunt = −4000 + 4000 = 0 — divider undefined
    expect(calculateDCDivider(12, -4000, 4000)).toBeNaN();
  });
});

describe('switchedRCTau', () => {
  it('worked example: τ = 2 kΩ × 25 µF = 50 ms', () => {
    // τ = R·C = 2000 × 25×10⁻⁶ = 0.05 s
    expect(switchedRCTau(2000, 25e-6)).toBeCloseTo(0.05, 10);
  });

  it('scales linearly with R: 8 kΩ × 25 µF = 200 ms', () => {
    // τ = 8000 × 25×10⁻⁶ = 0.2 s
    expect(switchedRCTau(8000, 25e-6)).toBeCloseTo(0.2, 10);
  });

  it('returns NaN for non-positive R or C', () => {
    expect(switchedRCTau(0, 1e-6)).toBeNaN();
    expect(switchedRCTau(2000, 0)).toBeNaN();
  });
});

describe('switchedRCCurrentJump', () => {
  it('worked example: i_C(0⁺) = (20 − 8)/2000 = 6 mA', () => {
    // v_C cannot jump (holds 8 V), so the full 12 V difference lands on R:
    // i = 12/2000 = 0.006 A — the discontinuous current the bench plots
    expect(switchedRCCurrentJump(20, 8, 2000)).toBeCloseTo(0.006, 10);
  });

  it('discharge preset: i_C(0⁺) = (0 − 8)/2000 = −4 mA', () => {
    expect(switchedRCCurrentJump(0, 8, 2000)).toBeCloseTo(-0.004, 10);
  });

  it('returns NaN for non-positive R', () => {
    expect(switchedRCCurrentJump(20, 8, 0)).toBeNaN();
  });
});

describe('switchedFirstOrder', () => {
  // Worked-example fixture throughout: x(0⁺) = 8 V, x(∞) = 20 V, τ = 50 ms
  it('starts exactly at x(0⁺)', () => {
    // t = 0: 20 + (8 − 20)·e⁰ = 20 − 12 = 8
    expect(switchedFirstOrder(8, 20, 0.05, 0)).toBeCloseTo(8, 10);
  });

  it('closes 63.2% of the gap after one τ', () => {
    // t = τ: 20 − 12e⁻¹ = 20 − 4.41455 = 15.58545
    // (equivalently 8 + 0.6321 × 12 = 15.585 — the 63.2% rule on the GAP)
    expect(switchedFirstOrder(8, 20, 0.05, 0.05)).toBeCloseTo(15.585, 3);
  });

  it('has settled after 5τ', () => {
    // t = 5τ: 20 − 12e⁻⁵ = 20 − 12 × 0.006738 = 20 − 0.08086 = 19.91914
    expect(switchedFirstOrder(8, 20, 0.05, 0.25)).toBeCloseTo(19.919, 3);
  });

  it('holds flat at x0 before the switch (t < 0)', () => {
    // Pre-switch segment: the chart plots x(0⁻) = 8 across the boundary
    expect(switchedFirstOrder(8, 20, 0.05, -0.1)).toBeCloseTo(8, 10);
  });

  it('handles pure discharge to zero', () => {
    // x(∞) = 0, t = τ = 0.2 s: 0 + 8e⁻¹ = 2.94304 — the Tab-1 discharge sanity value
    expect(switchedFirstOrder(8, 0, 0.2, 0.2)).toBeCloseTo(2.943, 3);
  });

  it('returns x(∞) when there is no gap', () => {
    // x0 = x(∞) = 5: the exponential carries zero amplitude — no transient at any t
    expect(switchedFirstOrder(5, 5, 0.1, 7)).toBeCloseTo(5, 10);
  });

  it('returns NaN for non-positive τ', () => {
    expect(switchedFirstOrder(8, 20, 0, 0.1)).toBeNaN();
  });
});

describe('secondOrderStepICs', () => {
  it('worked example oracle: 5 V pre-state under a 10 V step with zero slope gives A1 = −5, A2 = −3.75', () => {
    // Series RLC R = 6 Ω, L = 1 mH, C = 40 µF: α = 3000 s⁻¹, ω_d = 4000 rad/s (3-4-5 triangle).
    // ICs: v_C(0⁺) = 5 V, dv_C/dt(0⁺) = 0 (series i_L pins the slope), x∞ = 10 V.
    //   A1 = x0 − x∞ = 5 − 10 = −5
    //   A2 = (dxdt0 + α·A1)/ω_d = (0 + 3000·(−5))/4000 = −15000/4000 = −3.75
    const { A1, A2 } = secondOrderStepICs(3000, 4000, 5, 10, 0);
    expect(A1).toBeCloseTo(-5, 10);
    expect(A2).toBeCloseTo(-3.75, 10);
  });

  it('zero-state constants reproduce the legacy RLC solver samples (same-physics cross-tie)', () => {
    // Same circuit, zero state: R = 6 Ω, L = 1 mH, C = 40 µF, 10 V step.
    //   α  = R/(2L)  = 6/0.002 = 3000 s⁻¹
    //   ω₀ = 1/√(LC) = 1/√(4×10⁻⁸) = 5000 rad/s, ζ = α/ω₀ = 0.6 → underdamped
    //   ω_d = ω₀√(1 − ζ²) = 5000 × 0.8 = 4000 rad/s
    // Zero state: x0 = 0, dxdt0 = 0, x∞ = 10
    //   A1 = 0 − 10 = −10;  A2 = (0 + 3000·(−10))/4000 = −7.5
    // — exactly the constants calculateCircuitResponse bakes in invisibly: its step form
    //   Vs·(1 − e^(−αt)(cos ω_d t + (α/ω_d) sin ω_d t)) expands to
    //   10 + e^(−3000t)(−10 cos 4000t − 7.5 sin 4000t).
    const { A1, A2 } = secondOrderStepICs(3000, 4000, 0, 10, 0);
    expect(A1).toBeCloseTo(-10, 10);
    expect(A2).toBeCloseTo(-7.5, 10);

    // Reconstruct v(t) = 10 + e^(−3000t)(A1 cos 4000t + A2 sin 4000t) and compare against
    // the solver's own samples. timeStep = 1e-4 s and data[k].time = k·timeStep exactly
    // (integer-counter sampling), so t = 0.2 / 0.5 / 1.0 ms are indices 2 / 5 / 10.
    // Hand values:
    //   t = 0.2 ms: αt = 0.6, ω_d t = 0.8 rad → 10 + 0.54881×(−12.34724) = 3.2237 V
    //   t = 0.5 ms: αt = 1.5, ω_d t = 2.0 rad → 10 + 0.22313×(−2.65826)  = 9.4069 V
    //   t = 1.0 ms: αt = 3.0, ω_d t = 4.0 rad → 10 + 0.04979×(+12.21246) = 10.6080 V
    const response = calculateCircuitResponse(
      'RLC',
      { R: 6, L: 0.001, C: 0.00004, voltage: 10 },
      1e-4,
      0.002
    );
    expect(response.dampingType).toBe('underdamped');

    for (const k of [2, 5, 10]) {
      const t = k * 1e-4;
      const reconstructed =
        10 + Math.exp(-3000 * t) * (A1 * Math.cos(4000 * t) + A2 * Math.sin(4000 * t));
      expect(response.data[k].time).toBeCloseTo(t, 12);
      expect(response.data[k].voltage).toBeCloseTo(reconstructed, 10);
    }

    // Pin the hand-derived magnitudes too, so the cross-tie cannot pass with both
    // sides wrong in the same way.
    expect(response.data[2].voltage).toBeCloseTo(3.2237, 3);
    expect(response.data[5].voltage).toBeCloseTo(9.4069, 3);
    expect(response.data[10].voltage).toBeCloseTo(10.608, 3);
  });

  it('returns a NaN pair for non-positive ω_d', () => {
    const { A1, A2 } = secondOrderStepICs(3000, 0, 5, 10, 0);
    expect(A1).toBeNaN();
    expect(A2).toBeNaN();
  });
});
