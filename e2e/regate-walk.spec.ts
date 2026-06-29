// Decision-#4 re-gate visual walk (faraday + magnetic-circuits LabLayout migration).
// CAPTURE-ONLY (no assertions) — generates screenshots for the owner's human
// pixel/pedagogy review, the one thing the automated gate can't sign off:
//   1. the predict-first ENTRY (bench leads with gate 1 blocking),
//   2. the SECOND blocking gate mid-theory WITH the live sticky bench beside it
//      (the core "is a 2nd mid-theory gate OK?" + "do the toroid readouts stay
//      visible in the sticky bench at laptop height?" question), and
//   3. the WHOLE section flow with every gate unlocked.
// Run:  npx playwright test e2e/regate-walk.spec.ts --project=desktop
// Out:  e2e/__screenshots__/regate-walk/<section>/<viewport>-<n>-*.png  (gitignored)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, type Page } from '@playwright/test';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '__screenshots__', 'regate-walk');
const SETTLE = 1500;

const SECTIONS = [
  { id: 'faraday', route: '/faraday' },
  { id: 'magnetic-circuits', route: '/magnetic-circuits' },
];

// Laptop 1280x800 is THE critical case: the sticky bench is max-h-[calc(100vh-6rem)]
// ≈ 704px, so a LabStation header + 400px canvas + ControlPanel can crowd it — the
// critic's bench-overflow concern. The roomy desktop and the stacked mobile are
// captured for comparison.
const VIEWPORTS = [
  { name: 'laptop-1280x800', w: 1280, h: 800 },
  { name: 'desktop-1440x900', w: 1440, h: 900 },
  { name: 'mobile-390x844', w: 390, h: 844 },
];

async function waitReady(page: Page) {
  await page.locator('#main-content [role="status"][aria-label="Loading"]').waitFor({ state: 'detached' }).catch(() => {});
  await page.locator('#main-content h1').first().waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE);
}

// Resolve exactly ONE blocking gate (select an option, then click "Commit Prediction").
// Because leadWithBench renders the bench DOM-first, the first [data-gate] is gate 1.
async function unlockOneGate(page: Page) {
  const before = await page.locator('[data-gate]').count();
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('[data-gate]').count()) < before) return; // one gate resolved
    const commit = page.locator('[data-gate]').getByRole('button', { name: /commit prediction|continue/i });
    if (await commit.count()) {
      await commit.first().click({ timeout: 3000 }).catch(() => {});
    } else {
      const opt = page.locator('[data-gate] button:enabled').first();
      if ((await opt.count()) === 0) return;
      await opt.click({ timeout: 3000 }).catch(() => {});
    }
    await page.waitForTimeout(350);
  }
}

async function unlockAllGates(page: Page) {
  for (let i = 0; i < 30; i++) {
    const commit = page.locator('[data-gate]').getByRole('button', { name: /commit prediction|continue/i });
    if (await commit.count()) {
      await commit.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    const opt = page.locator('[data-gate] button:enabled').first();
    if ((await opt.count()) === 0) break;
    await opt.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

for (const s of SECTIONS) {
  for (const v of VIEWPORTS) {
    test(`regate-walk ${s.id} @ ${v.name}`, async ({ page }) => {
      await page.setViewportSize({ width: v.w, height: v.h });
      const dir = path.join(OUT, s.id);

      // (1) Predict-first ENTRY: the bench leads with gate 1 blocking.
      await page.goto(s.route);
      await waitReady(page);
      await page.screenshot({ path: path.join(dir, `${v.name}-1-entry-gate1-blocking.png`), animations: 'disabled' });

      // (2) THE decision-#4 frame: unlock ONLY gate 1 (so the live sim renders in the
      //     sticky bench), then scroll to the STILL-BLOCKING gate 2 mid-theory. On lg+
      //     this shows the 2nd blocking gate (left column) beside the pinned bench
      //     (right) — exactly the "is the bench / its readouts visible while answering
      //     the 2nd gate" overflow check.
      await unlockOneGate(page);
      await page.waitForTimeout(SETTLE);
      const gate2 = page.locator('[data-gate]').first(); // gate 1 resolved → this is gate 2
      if (await gate2.count()) {
        await gate2.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(dir, `${v.name}-2-gate2-blocking-with-bench.png`), animations: 'disabled' });
      }

      // (3) WHOLE section, every gate unlocked, app-shell expanded so fullPage captures
      //     the entire flow (the document itself never scrolls — Layout uses h-screen +
      //     overflow-auto on #main-content).
      await unlockAllGates(page);
      await page.waitForTimeout(SETTLE);
      await page.addStyleTag({ content: '.h-screen{height:auto !important} #main-content{overflow:visible !important}' });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(dir, `${v.name}-3-unlocked-full.png`), fullPage: true, animations: 'disabled' });
    });
  }
}
