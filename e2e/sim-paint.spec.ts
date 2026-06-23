// Regression net for the hidden-canvas dead-loop bug class: a sim's RAF loop
// must start (and the canvas must actually PAINT) even when the canvas mounts
// late — revealed by a PredictionGate or activated inside a TabSet panel.
//
// For every course route: answer every blocking gate, visit every tab (re-
// answering gates a tab switch may remount), and after each reveal assert that
// no visible canvas is still a blank default-size bitmap. A drawn sim always
// has >2 distinct sampled colors; an unstarted loop leaves exactly 1 (or a
// 300x150 default bitmap).
import { test, expect, type Page } from '@playwright/test';
import { ALL_SECTIONS } from '../src/shared/constants/curriculum';

const SETTLE_MS = 1500; // recharts mount animation + canvas warm-up

// Routes that MUST surface at least one canvas once gates/tabs are walked —
// guards against a vacuous pass when gate-unlocking silently fails and the
// canvas never enters the DOM at all.
const EXPECT_CANVAS = new Set([
  'coulomb', 'gauss', 'ampere', 'lorentz', 'faraday', 'lenz', 'magnetic-circuits',
  'maxwell', 'em-wave', 'polarization',
  'transformers', 'antennas', 'lumped-distributed', 'transmission-lines', 'transients',
]);

// Per-route minimum painted-canvas height (px). distinctColors>2 alone passes a
// canvas that draws into a COLLAPSED box (parent.clientHeight ~0 at draw time, or
// a mis-sized sticky/overflow column after the #12/#14 sim migration) — this floor
// closes that gap. Baselined on correct code 2026-06-23 (tip 1dc8f74), desktop AND
// mobile viewports: floor = 0.6 × the smallest healthy canvas height observed for
// the route, so every legitimate size (incl. maxwell's 158px multi-displays and
// transmission-lines' 80px diagrams) passes while a collapse fails. EM single-canvas
// sims (the migration targets) get the strongest floor. If a real layout change moves
// a baseline, update the value deliberately — do NOT relax it to dodge a true regression.
const MIN_CANVAS_H: Record<string, number> = {
  coulomb: 238, gauss: 238, ampere: 238, lorentz: 238, faraday: 238,
  lenz: 238, 'magnetic-circuits': 238, polarization: 238,
  transients: 312, antennas: 300, 'em-wave': 189, transformers: 144,
  'lumped-distributed': 132, maxwell: 94, 'transmission-lines': 48,
};
const DEFAULT_MIN_CANVAS_H = 40; // any canvas-bearing route not individually baselined

interface CanvasPaint {
  cssW: number; cssH: number;
  bitmapW: number; bitmapH: number;
  type: string;
  distinctColors: number;
}

function measureCanvases(page: Page): Promise<CanvasPaint[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('#main-content canvas'))
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.height > 0; // ignore detached/hidden
      })
      .map((c) => {
        const el = c as HTMLCanvasElement;
        const rect = el.getBoundingClientRect();
        const base = {
          cssW: Math.round(rect.width), cssH: Math.round(rect.height),
          bitmapW: el.width, bitmapH: el.height,
        };
        try {
          const ctx = el.getContext('2d');
          if (!ctx) return { ...base, type: 'non-2d', distinctColors: -1 };
          if (!el.width || !el.height) return { ...base, type: '2d', distinctColors: 0 };
          const data = ctx.getImageData(0, 0, el.width, el.height).data;
          const colors = new Set<number>();
          for (let i = 0; i < data.length && colors.size <= 8; i += 16) {
            colors.add((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]);
          }
          return { ...base, type: '2d', distinctColors: colors.size };
        } catch {
          return { ...base, type: 'unreadable', distinctColors: -1 };
        }
      });
  });
}

async function unlockGates(page: Page) {
  for (let i = 0; i < 30; i++) {
    const cont = page.locator('div.border-dashed').getByRole('button', { name: 'Continue' });
    if (await cont.count() > 0) {
      await cont.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    const opt = page.locator('div.border-dashed:has-text("Predict First") button:enabled').first();
    if (await opt.count() === 0) break;
    await opt.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

function expectPainted(canvases: CanvasPaint[], where: string) {
  for (const c of canvases) {
    // 2d canvases must not be blank: an unstarted loop shows ≤2 colors
    // (usually 1) and typically the 300x150 default bitmap.
    if (c.type === '2d') {
      expect(
        c.distinctColors,
        `${where}: blank canvas (css ${c.cssW}x${c.cssH}, bitmap ${c.bitmapW}x${c.bitmapH}, ` +
        `${c.distinctColors} sampled colors) — render loop never started?`,
      ).toBeGreaterThan(2);
    }
  }
}

// A canvas can PAINT (distinctColors>2) yet be collapsed/squished — the failure
// mode the #12/#14 migration risks and the current net can't see. Pin both the
// rendered CSS height and the backing bitmap height against the per-route floor.
// They are equal today (sims set canvas.height = parent.clientHeight, no DPR
// scaling); asserting both now locks the baseline before #14 makes them diverge.
function expectHeights(canvases: CanvasPaint[], sectionId: string, where: string) {
  const floor = MIN_CANVAS_H[sectionId] ?? DEFAULT_MIN_CANVAS_H;
  for (const c of canvases) {
    if (c.type !== '2d') continue;
    const dims = `css ${c.cssW}x${c.cssH}, bitmap ${c.bitmapW}x${c.bitmapH}`;
    expect(
      c.cssH,
      `${where}: canvas CSS height ${c.cssH}px below floor ${floor}px — collapsed/squished? (${dims})`,
    ).toBeGreaterThanOrEqual(floor);
    expect(
      c.bitmapH,
      `${where}: canvas bitmap height ${c.bitmapH}px below floor ${floor}px — collapsed/squished? (${dims})`,
    ).toBeGreaterThanOrEqual(floor);
  }
}

for (const s of ALL_SECTIONS) {
  test(`sims paint after reveal: ${s.id}`, async ({ page }) => {
    await page.goto(s.route);
    await expect(page.locator('#main-content [role="status"][aria-label="Loading"]')).toHaveCount(0);
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);

    await unlockGates(page);
    await page.waitForTimeout(SETTLE_MS);
    const defaultView = await measureCanvases(page);
    expectPainted(defaultView, `${s.id} (default view)`);
    expectHeights(defaultView, s.id, `${s.id} (default view)`);
    let canvasesSeen = defaultView.length;

    // Walk every tab; a tab switch can remount panels and re-lock gates.
    const tabs = page.locator('[role="tab"], [role="tablist"] button');
    const tabCount = await tabs.count();
    for (let t = 0; t < Math.min(tabCount, 12); t++) {
      await tabs.nth(t).click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      await unlockGates(page);
      await page.waitForTimeout(SETTLE_MS);
      const label = (await tabs.nth(t).textContent())?.trim() ?? `tab ${t}`;
      const inTab = await measureCanvases(page);
      expectPainted(inTab, `${s.id} (tab "${label}")`);
      expectHeights(inTab, s.id, `${s.id} (tab "${label}")`);
      canvasesSeen += inTab.length;
    }

    if (EXPECT_CANVAS.has(s.id)) {
      expect(
        canvasesSeen,
        `${s.id}: no canvas ever appeared — gate unlock or tab walk silently failed`,
      ).toBeGreaterThan(0);
    }
  });
}
