import { describe, it, expect } from 'vitest';
import {
  COAX_LP,
  COAX_CP,
  Z0_YOUR_TURN_OPTIONS,
} from '../lumpedDistributedChallenge';

/**
 * #9 batch 2 (09c) — A.2#9: the "Your Turn" Z₀ distractor offered Z₀ = 25 Ω, but
 * its explanation pins the misconception as "used L′/C′, not √(L′/C′)". For the
 * given coax (L′ = 0.25 µH/m, C′ = 100 pF/m) that error gives L′/C′ = 2500 Ω, not
 * 25 Ω — so the distractor neither matched the misconception nor was reachable by
 * any plausible slip. Set it to 2500 Ω so it teaches the exact error it describes.
 * (Item stays winnable: √(L′/C′) = 50 Ω is the unique correct answer.)
 */
describe('Your Turn Z₀ distractor matches the misconception it teaches (A.2#9)', () => {
  it('offers L′/C′ = 2500 Ω (forgot the √), never the spurious 25 Ω', () => {
    expect(COAX_LP / COAX_CP).toBe(2500); // the "forgot the √" value
    const forgotSqrt = Z0_YOUR_TURN_OPTIONS.find((o) => /not L′\/C′/.test(o.explanation));
    expect(forgotSqrt).toBeDefined();
    expect(forgotSqrt!.correct).toBe(false);
    expect(forgotSqrt!.text).toMatch(/2500\s*Ω/);
    expect(forgotSqrt!.text).not.toMatch(/25\s*Ω/); // not the old, unmotivated 25 Ω
  });

  it('keeps √(L′/C′) = 50 Ω as the unique correct answer', () => {
    expect(Math.sqrt(COAX_LP / COAX_CP)).toBe(50);
    const correct = Z0_YOUR_TURN_OPTIONS.filter((o) => o.correct);
    expect(correct).toHaveLength(1);
    expect(correct[0].text).toMatch(/50\s*Ω/);
  });
});
