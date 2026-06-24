import { describe, it, expect } from 'vitest';
import { incidentWave, reflectedWave } from '../transmissionWaves';

/**
 * #9 batch 2 — TransmissionLineSim sinusoidal wave direction (Appendix A.1#8).
 * The incident wave must travel source→load (+x) and the reflected wave load→source
 * (−x). Direction is asserted via the d'Alembert shift identity (exact for a single
 * travelling sinusoid), which the buggy sin(k·pos + ωt) form fails.
 */
describe('transmission-line sinusoidal waves travel in the labelled directions (A.1#8)', () => {
  const k = 0.5;
  const omega = 1.2;
  const L = 10;
  const gamma = 0.4;
  const v = omega / k; // phase velocity
  const dt = 0.01;
  const pos = 3.3;

  it('incident wave travels toward the load (+x): f(pos, t+dt) = f(pos − v·dt, t)', () => {
    expect(incidentWave(k, pos, omega, dt)).toBeCloseTo(incidentWave(k, pos - v * dt, omega, 0), 6);
  });

  it('reflected wave travels toward the source (−x): f(pos, t+dt) = f(pos + v·dt, t)', () => {
    expect(reflectedWave(gamma, k, pos, L, omega, dt)).toBeCloseTo(
      reflectedWave(gamma, k, pos + v * dt, L, omega, 0),
      6,
    );
  });

  it('preserves continuity ref = γ·inc at the load (pos = L), independent of the time-sign', () => {
    for (const t of [0, 0.7, 1.9]) {
      expect(reflectedWave(gamma, k, L, L, omega, t)).toBeCloseTo(gamma * incidentWave(k, L, omega, t), 9);
    }
  });
});
