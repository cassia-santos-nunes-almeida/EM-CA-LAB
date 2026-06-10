import { describe, it, expect } from 'vitest';
import {
  knockoutState,
  blackBoxReducer,
  initialBlackBoxState,
  RTH_CHOICES,
  LOAD_TABLE,
  MAX_POWER_POINTS,
  V_TH,
  R_TH,
  I_SC,
  P_MAX,
  type BlackBoxAction,
  type BlackBoxState,
  type LoadR,
} from '@circuits/components/modules/CircuitTheorems/theoremData';

function runBox(actions: BlackBoxAction[], from: BlackBoxState = initialBlackBoxState): BlackBoxState {
  return actions.reduce(blackBoxReducer, from);
}

describe('knockoutState', () => {
  it('returns the full truth table for the two source toggles', () => {
    expect(knockoutState(true, true).vA).toBe(12);
    expect(knockoutState(true, false).vA).toBe(8);
    expect(knockoutState(false, true).vA).toBe(4);
    expect(knockoutState(false, false).vA).toBe(0);
  });

  it('keys each state uniquely for the visited ledger', () => {
    const keys = [
      knockoutState(true, true).key,
      knockoutState(true, false).key,
      knockoutState(false, true).key,
      knockoutState(false, false).key,
    ];
    expect(new Set(keys).size).toBe(4);
  });

  it('single-source readings superpose to the both-on reading', () => {
    expect(knockoutState(true, false).vA + knockoutState(false, true).vA)
      .toBe(knockoutState(true, true).vA);
  });
});

describe('blackBoxReducer', () => {
  const correctRth = RTH_CHOICES.find((c) => c.correct);
  const wrongRth = RTH_CHOICES.find((c) => !c.correct);
  if (!correctRth || !wrongRth) throw new Error('RTH_CHOICES must contain correct and wrong choices');

  it('walks the full happy path idle → voc → isc → twin → congruence → done', () => {
    let state = runBox([{ type: 'measureVoc' }]);
    expect(state.phase).toBe('voc');

    state = runBox([{ type: 'measureIsc' }], state);
    expect(state.phase).toBe('isc');

    state = runBox([{ type: 'pickRth', choiceId: correctRth.id }], state);
    expect(state.phase).toBe('twin');
    expect(state.feedback).toBeNull();

    state = runBox([{ type: 'continue' }], state);
    expect(state.phase).toBe('congruence');

    state = runBox([
      { type: 'attachLoad', r: 1 },
      { type: 'attachLoad', r: 2 },
      { type: 'attachLoad', r: 4 },
    ], state);
    expect(state.phase).toBe('congruence');
    expect(state.visitedLoads).toHaveLength(3);

    state = runBox([{ type: 'attachLoad', r: 10 }], state);
    expect(state.phase).toBe('done');
    expect([...state.visitedLoads].sort((a, b) => a - b)).toEqual([1, 2, 4, 10]);
  });

  it('uses the verified pickRth choice id "two"', () => {
    expect(correctRth.id).toBe('two');
  });

  it('stays in isc with coaching feedback on a wrong R_th pick', () => {
    const atIsc = runBox([{ type: 'measureVoc' }, { type: 'measureIsc' }]);
    const state = runBox([{ type: 'pickRth', choiceId: wrongRth.id }], atIsc);
    expect(state.phase).toBe('isc');
    expect(state.feedback).toBe(wrongRth.feedback);
  });

  it('ignores out-of-phase actions', () => {
    expect(runBox([{ type: 'measureIsc' }]).phase).toBe('idle');
    expect(runBox([{ type: 'attachLoad', r: 2 }]).phase).toBe('idle');
    const atTwin = runBox([
      { type: 'measureVoc' },
      { type: 'measureIsc' },
      { type: 'pickRth', choiceId: correctRth.id },
    ]);
    expect(runBox([{ type: 'measureVoc' }], atTwin).phase).toBe('twin');
  });

  it('does not duplicate visited loads when a load is re-attached', () => {
    const atCongruence = runBox([
      { type: 'measureVoc' },
      { type: 'measureIsc' },
      { type: 'pickRth', choiceId: correctRth.id },
      { type: 'continue' },
    ]);
    const state = runBox([
      { type: 'attachLoad', r: 2 },
      { type: 'attachLoad', r: 2 },
    ], atCongruence);
    expect(state.visitedLoads).toEqual([2]);
    expect(state.activeLoad).toBe(2);
  });
});

describe('LOAD_TABLE', () => {
  it('matches the verified four-load solution', () => {
    expect(LOAD_TABLE).toEqual([
      { r: 1, iL: 4, vL: 4, p: 16 },
      { r: 2, iL: 3, vL: 6, p: 18 },
      { r: 4, iL: 2, vL: 8, p: 16 },
      { r: 10, iL: 1, vL: 10, p: 10 },
    ]);
  });

  it('is consistent with the Thevenin twin i_L = V_th / (R_th + R_L)', () => {
    for (const row of LOAD_TABLE) {
      expect(row.iL).toBeCloseTo(V_TH / (R_TH + row.r), 10);
      expect(row.vL).toBeCloseTo(row.iL * row.r, 10);
      expect(row.p).toBeCloseTo(row.iL * row.iL * row.r, 10);
    }
  });
});

describe('MAX_POWER_POINTS', () => {
  it('peaks at exactly 18 W at R = 2 Ω (a grid point)', () => {
    const max = MAX_POWER_POINTS.reduce((best, pt) => (pt.p > best.p ? pt : best));
    expect(max.r).toBe(2);
    expect(max.p).toBe(18);
    expect(P_MAX).toBe(18);
  });

  it('sweeps R_L from 0.25 to 10 in 0.25 steps', () => {
    expect(MAX_POWER_POINTS[0].r).toBe(0.25);
    expect(MAX_POWER_POINTS[MAX_POWER_POINTS.length - 1].r).toBe(10);
    expect(MAX_POWER_POINTS).toHaveLength(40);
  });

  it('contains the four catalog loads at the verified powers', () => {
    const catalog: LoadR[] = [1, 2, 4, 10];
    for (const r of catalog) {
      const pt = MAX_POWER_POINTS.find((p) => p.r === r);
      const row = LOAD_TABLE.find((row) => row.r === r);
      expect(pt?.p).toBeCloseTo(row?.p ?? NaN, 10);
    }
  });
});

describe('verified port numbers', () => {
  it('hardcodes V_th = 12, R_th = 2, I_sc = 6', () => {
    expect(V_TH).toBe(12);
    expect(R_TH).toBe(2);
    expect(I_SC).toBe(6);
    expect(V_TH / I_SC).toBe(R_TH);
  });
});
