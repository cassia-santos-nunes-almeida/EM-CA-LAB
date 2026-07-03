import { describe, it, expect } from 'vitest';
import { calculateCircuitResponse } from '@circuits/utils/circuitSolver';

/**
 * Audit P-01/P-02 regression class-guard: every closed-form card displayed in
 * InteractiveLab/TimeDomain has a JS mirror here, evaluated against the solver
 * at indexed samples (t_i = i·timeStep exactly — no interpolation). If a card
 * and the solver ever disagree again, this suite fails instead of a student.
 * Post-Task-2 the time-domain impulse cards carry V_s, so their mirrors are
 * direct twins (×1); only the H(s) cards remain unit-impulse-referenced (and
 * are not mirrored here — they are transfer functions, not time signals).
 */
const TS = 1e-4, DUR = 0.01;

describe('displayed formulas match circuitSolver (P-01/P-02 guard)', () => {
  it('RC step: v=Vs(1−e^{−t/τ}), i=(Vs/R)e^{−t/τ} — R=1kΩ, C=1µF, τ=1ms=10·TS', () => {
    const r = calculateCircuitResponse('RC', { R: 1000, L: 0, C: 1e-6, voltage: 10 }, TS, DUR);
    for (const i of [0, 10, 50]) { // t = 0, τ, 5τ
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-t / 1e-3)), 6);
      expect(r.data[i].current).toBeCloseTo((10 / 1000) * Math.exp(-t / 1e-3), 6);
    }
  });
  it('RC impulse: card v=(Vs/RC)e^{−t/τ} (P-02 form ×1, already Vs-carrying)', () => {
    const r = calculateCircuitResponse('RC', { R: 1000, L: 0, C: 1e-6, voltage: 10 }, TS, DUR, 'impulse');
    for (const i of [0, 10, 50]) {
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo((10 / (1000 * 1e-6)) * Math.exp(-t / 1e-3), 6);
    }
  });
  it('RL step + impulse: τ=L/R=1ms — R=100Ω, L=0.1H', () => {
    const step = calculateCircuitResponse('RL', { R: 100, L: 0.1, C: 0, voltage: 10 }, TS, DUR);
    const imp = calculateCircuitResponse('RL', { R: 100, L: 0.1, C: 0, voltage: 10 }, TS, DUR, 'impulse');
    for (const i of [0, 10, 50]) {
      const t = step.data[i].time;
      expect(step.data[i].current).toBeCloseTo((10 / 100) * (1 - Math.exp(-100 * t / 0.1)), 6);
      expect(step.data[i].voltage).toBeCloseTo(10 * Math.exp(-100 * t / 0.1), 6);
      expect(imp.data[i].current).toBeCloseTo((10 / 0.1) * Math.exp(-100 * t / 0.1), 4); // i(t)=(Vs/L)e^{−Rt/L}
    }
  });
  it('RLC overdamped step: v = Vs + A₁e^{s₁t} + A₂e^{s₂t}, A₁=Vs·s₂/(s₁−s₂), A₂=−Vs·s₁/(s₁−s₂) — the P-01 card', () => {
    // R=100Ω, L=0.1H, C=100µF (InteractiveLab defaults): α=500, ω₀=316.2278, ζ=1.581
    const r = calculateCircuitResponse('RLC', { R: 100, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    const alpha = 500, w0 = 1 / Math.sqrt(0.1 * 1e-4);
    const sq = Math.sqrt(alpha * alpha - w0 * w0), s1 = -alpha + sq, s2 = -alpha - sq;
    const A1 = 10 * s2 / (s1 - s2), A2 = -10 * s1 / (s1 - s2);
    for (const i of [0, 20, 88]) { // t = 0, 2ms, 8.8ms (~1/|s₁|)
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo(10 + A1 * Math.exp(s1 * t) + A2 * Math.exp(s2 * t), 6);
    }
    expect(r.data[r.data.length - 1].voltage).toBeGreaterThan(5); // charges toward Vs, never decays to 0
  });
  it('RLC underdamped step + critically-damped step match their cards', () => {
    // Underdamped: R=20Ω, L=0.1H, C=100µF → α=100, ω₀=316.2278, ζ=0.316
    const u = calculateCircuitResponse('RLC', { R: 20, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    const a = 100, w0 = 1 / Math.sqrt(0.1 * 1e-4), wd = Math.sqrt(w0 * w0 - a * a);
    for (const i of [0, 10, 30]) {
      const t = u.data[i].time;
      expect(u.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t))), 6);
    }
    // Critically damped: L=0.1H, C=100µF → ω₀=316.2278, R=2Lω₀=63.2456Ω → α=ω₀
    const R = 2 * 0.1 * w0;
    const c = calculateCircuitResponse('RLC', { R, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    for (const i of [0, 10, 30]) {
      const t = c.data[i].time;
      expect(c.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-w0 * t) * (1 + w0 * t)), 6);
    }
  });
});
