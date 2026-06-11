import { describe, it, expect } from 'vitest';
import {
  coverUpReducer,
  createInitialCoverUpState,
  buildResponsePoints,
  f96,
  TERM_EVALUATORS,
  SLOTS,
  SLOT_IDS,
  RESIDUES,
  EVAL_COACHING,
  RESPONSE_POINT_COUNT,
  RESPONSE_T_MAX,
  type CoverUpState,
  type SlotId,
} from '@circuits/components/modules/PartialFractions/coverUpData';

/** Walk one slot through its full happy path: pick → cover → evaluate → reveal ×3. */
function solveSlot(state: CoverUpState, slot: SlotId): CoverUpState {
  let s = coverUpReducer(state, { type: 'pickSlot', slot });
  s = coverUpReducer(s, { type: 'pickFactor', factor: SLOTS[slot].factor });
  const correct = SLOTS[slot].evalChoices.find((c) => c.correct)!;
  s = coverUpReducer(s, { type: 'pickEvalPoint', pointId: correct.id });
  s = coverUpReducer(s, { type: 'revealNext' });
  s = coverUpReducer(s, { type: 'revealNext' });
  s = coverUpReducer(s, { type: 'revealNext' });
  return s;
}

describe('coverUpReducer', () => {
  it('walks the full happy path in slot order A → B → C', () => {
    let state = createInitialCoverUpState();
    state = solveSlot(state, 'A');
    expect(state.slots.A).toBe('solved');
    expect(state.assembled).toBe(false);
    state = solveSlot(state, 'B');
    expect(state.slots.B).toBe('solved');
    expect(state.assembled).toBe(false);
    state = solveSlot(state, 'C');
    expect(state.slots).toEqual({ A: 'solved', B: 'solved', C: 'solved' });
    expect(state.activeSlot).toBeNull();
    expect(state.assembled).toBe(true);
  });

  it('is order-independent: C → A → B also assembles', () => {
    let state = createInitialCoverUpState();
    state = solveSlot(state, 'C');
    expect(state.slots.C).toBe('solved');
    state = solveSlot(state, 'A');
    state = solveSlot(state, 'B');
    expect(state.slots).toEqual({ A: 'solved', B: 'solved', C: 'solved' });
    expect(state.assembled).toBe(true);
  });

  it('coaches a wrong factor pick for slot B with pole coaching and stays covering', () => {
    let state = coverUpReducer(createInitialCoverUpState(), { type: 'pickSlot', slot: 'B' });
    state = coverUpReducer(state, { type: 'pickFactor', factor: 's' });
    expect(state.slots.B).toBe('covering');
    expect(state.feedback).toMatch(/pole lives at/);
    // The correct factor still gets through afterwards.
    state = coverUpReducer(state, { type: 'pickFactor', factor: 's8' });
    expect(state.slots.B).toBe('evaluating');
    expect(state.feedback).toBeNull();
  });

  it('coaches a wrong evaluation point and stays evaluating', () => {
    let state = coverUpReducer(createInitialCoverUpState(), { type: 'pickSlot', slot: 'A' });
    state = coverUpReducer(state, { type: 'pickFactor', factor: 's' });
    expect(state.slots.A).toBe('evaluating');
    state = coverUpReducer(state, { type: 'pickEvalPoint', pointId: 'm5' });
    expect(state.slots.A).toBe('evaluating');
    expect(state.feedback).toBe(EVAL_COACHING);
    state = coverUpReducer(state, { type: 'pickEvalPoint', pointId: 'p0' });
    expect(state.slots.A).toBe('revealing');
    expect(state.revealIndex).toBe(0);
  });

  it('reveals arithmetic lines one Next at a time before committing the residue', () => {
    let state = coverUpReducer(createInitialCoverUpState(), { type: 'pickSlot', slot: 'B' });
    state = coverUpReducer(state, { type: 'pickFactor', factor: 's8' });
    state = coverUpReducer(state, { type: 'pickEvalPoint', pointId: 'm8' });
    state = coverUpReducer(state, { type: 'revealNext' });
    expect(state.revealIndex).toBe(1);
    expect(state.slots.B).toBe('revealing');
    state = coverUpReducer(state, { type: 'revealNext' });
    expect(state.revealIndex).toBe(2);
    state = coverUpReducer(state, { type: 'revealNext' });
    expect(state.slots.B).toBe('solved');
    expect(state.activeSlot).toBeNull();
  });

  it('ignores pickFactor / pickEvalPoint / revealNext with no active slot', () => {
    const initial = createInitialCoverUpState();
    expect(coverUpReducer(initial, { type: 'pickFactor', factor: 's' })).toBe(initial);
    expect(coverUpReducer(initial, { type: 'pickEvalPoint', pointId: 'p0' })).toBe(initial);
    expect(coverUpReducer(initial, { type: 'revealNext' })).toBe(initial);
  });

  it('ignores picking an already-solved slot', () => {
    let state = solveSlot(createInitialCoverUpState(), 'A');
    const after = coverUpReducer(state, { type: 'pickSlot', slot: 'A' });
    expect(after).toBe(state);
    state = after;
    expect(state.slots.A).toBe('solved');
  });

  it('resets a half-finished slot back to unsolved when switching slots', () => {
    let state = coverUpReducer(createInitialCoverUpState(), { type: 'pickSlot', slot: 'A' });
    state = coverUpReducer(state, { type: 'pickFactor', factor: 's' });
    state = coverUpReducer(state, { type: 'pickSlot', slot: 'B' });
    expect(state.slots.A).toBe('unsolved');
    expect(state.slots.B).toBe('covering');
    expect(state.activeSlot).toBe('B');
  });

  it('toggles term checkboxes', () => {
    let state = createInitialCoverUpState();
    state = coverUpReducer(state, { type: 'toggleTerm', term: 'k2' });
    expect(state.checkedTerms.k2).toBe(true);
    state = coverUpReducer(state, { type: 'toggleTerm', term: 'k2' });
    expect(state.checkedTerms.k2).toBe(false);
  });
});

describe('flagship response evaluators', () => {
  it('starts from zero: |f96(0)| < 1e-9 (initial-value theorem)', () => {
    expect(Math.abs(f96(0))).toBeLessThan(1e-9);
  });

  it('settles at the final value: |f96(1.2) − 10| < 0.01 (final-value theorem)', () => {
    expect(Math.abs(f96(1.2) - 10)).toBeLessThan(0.01);
  });

  it('term evaluators sum exactly to f96 at t = 0, 0.1, 0.5', () => {
    for (const t of [0, 0.1, 0.5]) {
      const sum = TERM_EVALUATORS.k1(t) + TERM_EVALUATORS.k2(t) + TERM_EVALUATORS.k3(t);
      expect(sum).toBe(f96(t));
    }
  });

  it('residues sum to zero (the degree-gap-2 initial-value audit)', () => {
    expect(RESIDUES.A + RESIDUES.B + RESIDUES.C).toBe(0);
  });

  it('builds the response sweep with the documented grid', () => {
    const points = buildResponsePoints({ k1: true, k2: false, k3: false });
    expect(points).toHaveLength(RESPONSE_POINT_COUNT);
    expect(points[0].t).toBe(0);
    expect(points[points.length - 1].t).toBeCloseTo(RESPONSE_T_MAX, 9);
    // Target column is always the full response; partial is only the checked terms.
    for (const p of [points[0], points[60], points[120]]) {
      expect(p.target).toBe(f96(p.t));
      expect(p.partial).toBe(10);
    }
  });

  it('slot configs are internally consistent', () => {
    for (const id of SLOT_IDS) {
      const slot = SLOTS[id];
      expect(slot.evalChoices.filter((c) => c.correct)).toHaveLength(1);
      expect(slot.revealSteps).toHaveLength(3);
      expect(RESIDUES[id]).toBe(slot.residue);
      // KaTeX house rule: runtime strings carry exactly ONE backslash per
      // command — a doubled backslash here renders as literal text.
      for (const step of slot.revealSteps) {
        expect(step).not.toContain('\\\\');
      }
      expect(slot.revealSteps[0]).toContain('\\frac');
    }
  });
});
