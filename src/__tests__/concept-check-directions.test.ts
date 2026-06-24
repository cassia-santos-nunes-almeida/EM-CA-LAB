import { describe, it, expect } from 'vitest';
import { Q_RING_DIR } from '@em/sections/lenz/index';
import { Q_FORCE_DIR } from '@em/sections/lorentz/index';

/**
 * Permanent net — directional ConceptCheck distractor-independence.
 *
 * The lenz Q_RING_DIR "double-key" (Appendix A.1#5) had two options stating the same
 * correct direction with equivalent reasoning, one graded wrong. The invariant that
 * prevents that class: in a directional ConceptCheck, EXACTLY ONE option may name the
 * keyed direction, and it must be the correct answer. This net pins that for the
 * audit's directional CCs (§A.4); extend the table as the other directional CCs
 * (faraday motional-EMF sign, ampere RHR, polarization handedness) are folded in.
 */

/** Indices of the options whose text names `term` (excluding a near-miss like
 *  "counter-clockwise" when the term is "clockwise"). */
function optionsNamingDirection(
  options: readonly string[],
  term: RegExp,
  exclude: RegExp | null,
): number[] {
  return options
    .map((text, i) => ({ text, i }))
    .filter(({ text }) => term.test(text) && !(exclude?.test(text)))
    .map(({ i }) => i);
}

const CASES = [
  { name: 'lenz · Q_RING_DIR (ring exiting a field)', cc: Q_RING_DIR, term: /clockwise/i, exclude: /counter[- ]?clockwise/i },
  { name: 'lorentz · Q_FORCE_DIR (F = qv×B on a negative charge)', cc: Q_FORCE_DIR, term: /\+y/, exclude: null },
] as const;

describe('directional ConceptChecks key exactly one direction (no double-key)', () => {
  for (const { name, cc, term, exclude } of CASES) {
    it(name, () => {
      const named = optionsNamingDirection(cc.options, term, exclude);
      expect(named).toEqual([cc.correctIndex]);
    });
  }

  it('the invariant catches a synthetic double-key', () => {
    // Two options name "clockwise"; the guard must report both, so it would fail the
    // ===[correctIndex] assertion above (proving it is not vacuously green).
    const doubleKeyed = ['Clockwise, to maintain the flux', 'Clockwise, to oppose the decrease', 'Counter-clockwise'];
    expect(optionsNamingDirection(doubleKeyed, /clockwise/i, /counter[- ]?clockwise/i)).toEqual([0, 1]);
  });
});
