import { describe, it, expect } from 'vitest';
import {
  CAP_AREA_MIN,
  CAP_AREA_MAX,
  DEFAULT_CAPACITOR_AREA,
  capacitorAreaNorm,
  plateHeightPx,
} from '../capacitorViz';

/**
 * #9 batch 2 — capacitor plate-area defects (Appendix A.1#11 + B.1).
 *
 *  A.1#11: the default plate area must be REACHABLE on the Plate-Area slider
 *          (0.5–10 cm² = [5e-5, 1e-3] m²); the old 0.01 m² (100 cm²) was outside it.
 *  B.1   : the side-view plate-height normalization must span the slider, not the
 *          ~100×-too-wide [0.005, 0.10] m² window that froze the plate at its floor.
 */
describe('capacitor plate-area normalization spans the real slider range (B.1)', () => {
  it('maps the slider endpoints to areaNorm 0 → 1', () => {
    expect(capacitorAreaNorm(CAP_AREA_MIN)).toBeCloseTo(0, 6);
    expect(capacitorAreaNorm(CAP_AREA_MAX)).toBeCloseTo(1, 6);
  });

  it('drives the side-view plate height across its full [40, 130] px band', () => {
    expect(plateHeightPx(CAP_AREA_MIN)).toBeCloseTo(40, 3); // floor at slider min
    expect(plateHeightPx(CAP_AREA_MAX)).toBeCloseTo(130, 3); // top at slider max
    // The frozen-plate bug left a span of <1 px across the whole slider.
    expect(plateHeightPx(CAP_AREA_MAX) - plateHeightPx(CAP_AREA_MIN)).toBeGreaterThan(80);
  });

  it('is monotonically increasing in area', () => {
    const mid = (CAP_AREA_MIN + CAP_AREA_MAX) / 2;
    expect(plateHeightPx(CAP_AREA_MIN)).toBeLessThan(plateHeightPx(mid));
    expect(plateHeightPx(mid)).toBeLessThan(plateHeightPx(CAP_AREA_MAX));
  });
});

describe('default capacitor plate area is reachable on the slider (A.1#11)', () => {
  it('lies within the Plate-Area slider range', () => {
    expect(DEFAULT_CAPACITOR_AREA).toBeGreaterThanOrEqual(CAP_AREA_MIN);
    expect(DEFAULT_CAPACITOR_AREA).toBeLessThanOrEqual(CAP_AREA_MAX);
  });
});
