import { describe, it, expect } from 'vitest';
import { computeBounces, computeVoltageData, initialVoltage } from '@transmission/components/simulations/BounceDiagram';
import { steadyStateVoltageFromGamma } from '@transmission/utils/transmissionMath';
// initialVoltage is a local helper at BounceDiagram.tsx:53-56 (VS=10, Z0=50
// module constants + zsFromGamma divider), exported for tests.
// Verified values: initialVoltage(0) = 5.0 V exactly; initialVoltage(0.5) = 2.5 V exactly.

/**
 * Audit P-05: a wave of amplitude a arriving at an end with reflection Γ jumps
 * the terminal voltage by a·(1+Γ) AT THE ARRIVAL — incident plus the reflection
 * launched that instant. The old code added only +a at arrival and parked the
 * Γ·a on the NEXT segment's departure, so the LAST visible segment's plateau
 * was short by Γ·a (ΓL=0.5, ΓS=0, 1 bounce: plotted 5 V, physical 7.5 V).
 */
describe('bounce chart plateaus carry the (1+Γ) arrival term (P-05)', () => {
  it('launch amplitude oracle: initialVoltage(0) = VS·Z0/(Z0+Z0) = 5 V exactly', () => {
    expect(initialVoltage(0)).toBe(5);
  });
  it('single bounce, matched source: load plateau = V0·(1+ΓL) = V_ss', () => {
    const v0 = initialVoltage(0); // Γs=0
    const segs = computeBounces(0.5, 0, 1);
    const { loadData } = computeVoltageData(segs, 0.5, 0);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(v0 * 1.5, 6);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(steadyStateVoltageFromGamma(v0, 0.5, 0), 6);
  });
  it('ΓL=ΓS=0.5: both terminal series converge to V_ss as bounces grow', () => {
    const v0 = initialVoltage(0.5);
    const segs = computeBounces(0.5, 0.5, 30);
    const { sourceData, loadData } = computeVoltageData(segs, 0.5, 0.5);
    const vss = steadyStateVoltageFromGamma(v0, 0.5, 0.5);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(vss, 3);
    expect(sourceData[sourceData.length - 1].voltage).toBeCloseTo(vss, 3);
  });
  it('source terminal at t=0 shows only the launch V0', () => {
    const segs = computeBounces(0.5, 0.5, 4);
    const { sourceData } = computeVoltageData(segs, 0.5, 0.5);
    expect(sourceData[1]).toEqual({ time: 0, voltage: initialVoltage(0.5) });
  });
});
