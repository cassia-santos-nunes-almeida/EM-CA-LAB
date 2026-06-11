// Full-page screenshot harness — Phase-2 entry gate.
// Captures `/` (landing) + every course route from the curriculum spine so the
// owner can do a visual walk without clicking through the app. Capture-only:
// no pixel assertions in v1; gates are screenshotted in their LOCKED
// first-visit state (fresh context = empty localStorage = light theme).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { ALL_SECTIONS } from '../src/shared/constants/curriculum';

const SETTLE_MS = 1500; // recharts mount animation + canvas warm-up
// ESM equivalent of __dirname (package is "type": "module"):
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '__screenshots__');

const PAGES = [
  { name: '00-landing', route: '/', isSection: false },
  ...ALL_SECTIONS.map((s, i) => ({
    name: `${String(i + 1).padStart(2, '0')}-${s.id}`,
    route: s.route,
    isSection: true,
  })),
];

for (const { name, route, isSection } of PAGES) {
  test(`screenshot ${name}`, async ({ page, viewport }, testInfo) => {
    await page.goto(route);
    // 1. Suspense resolved — lazy chunk arrived (spinner detached). Scoped by
    //    aria-label because recharts tooltips also carry a persistent
    //    role="status" on chart pages (coulomb/gauss/em-wave).
    await expect(page.locator('#main-content [role="status"][aria-label="Loading"]')).toHaveCount(0);
    // 2. The section actually rendered a heading:
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    // 3. Expand the app-shell scroll container: the document itself never
    //    scrolls (Layout uses h-screen + overflow-auto on #main-content), so
    //    fullPage would otherwise silently capture a single viewport.
    await page.addStyleTag({ content:
      '.h-screen{height:auto !important} #main-content{overflow:visible !important}' });
    if (isSection) {
      // Tripwire: the shell-expansion must have made the document taller than
      // the viewport, or fullPage is silently capturing one screen.
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(h, 'app-shell expansion stopped working — check Layout h-screen/#main-content').toBeGreaterThan(viewport!.height);
    }
    // 4. KaTeX woff2s (vendor-katex chunk) finished loading:
    await page.evaluate(() => document.fonts.ready);
    // 5. One fixed settle: recharts mount animation (default ~1.5 s) +
    //    post-reflow ResponsiveContainer remeasure + canvas warm-up:
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({
      path: path.join(OUT, testInfo.project.name, `${name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}
