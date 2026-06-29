// Guards the #11 active-subsection breadcrumb meter: it must ADVANCE as you scroll
// down a section and RESET when you scroll back to the top. The leadWithBench
// sections (gauss, faraday) put a scroll-spy anchor inside a lg:sticky bench; the old
// batch-topmost scroll-spy left the meter STALE on a theory anchor when scrolled
// back up. The doc-order selector (computeActiveId) fixes it. ampere is a normal
// (non-sticky, flat SectionLayout) control proving the algorithm change didn't
// regress ordinary sections — it replaces faraday, which became leadWithBench in #13/PR9.
import { test, expect, type Page } from '@playwright/test';

async function meterK(page: Page): Promise<number> {
  return page.evaluate(() => {
    const bc = document.querySelector('#main-content .font-mono.text-xs');
    const txt = bc ? (bc.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const m = /(\d+)\/(\d+)\s*$/.exec(txt); // trailing "k/total"
    return m ? parseInt(m[1], 10) : -1;
  });
}

async function scrollTo(page: Page, frac: number) {
  await page.evaluate((f) => {
    const m = document.querySelector('#main-content')!;
    m.scrollTop = (m.scrollHeight - m.clientHeight) * f;
  }, frac);
  await page.waitForTimeout(600); // let the IntersectionObserver recompute settle
}

const SECTIONS = [
  { id: 'gauss', route: '/gauss' },     // leadWithBench → sim anchor in the sticky bench
  { id: 'faraday', route: '/faraday' }, // leadWithBench (migrated #13/PR9) → sim anchor in the sticky bench
  { id: 'ampere', route: '/ampere' },   // normal (non-sticky, flat SectionLayout) control
];

for (const s of SECTIONS) {
  test(`breadcrumb advances then resets on scroll-up: ${s.id}`, async ({ page }) => {
    await page.goto(s.route);
    await expect(page.locator('#main-content [role="status"][aria-label="Loading"]')).toHaveCount(0);
    await expect(page.locator('#main-content h1').first()).toBeVisible();
    await page.waitForTimeout(1500);

    // Unlock any predict-first gate so the full body (and all anchors) render.
    const commit = page.locator('[data-gate]').getByRole('button', { name: /commit prediction|continue/i });
    for (let i = 0; i < 5 && (await commit.count()); i++) {
      await commit.first().click().catch(() => {});
      await page.waitForTimeout(400);
    }

    // Scroll down: the meter must advance past the first anchor (k ≥ 2).
    let maxK = -1;
    for (const f of [0.4, 0.6, 0.85]) {
      await scrollTo(page, f);
      maxK = Math.max(maxK, await meterK(page));
    }
    expect(maxK, `${s.id}: meter never advanced past the first anchor on scroll-down`).toBeGreaterThanOrEqual(2);

    // Scroll back to the very top: the meter must RESET (≤ 1), not stay stale on a
    // theory anchor. Pre-fix, gauss showed "Concept Checks 2/4" here. Step the scroll
    // up (like a real user) so the IntersectionObserver fires through each band
    // crossing rather than coalescing a single large programmatic jump.
    for (const f of [0.5, 0.2, 0]) await scrollTo(page, f);
    const topK = await meterK(page);
    expect(topK, `${s.id}: meter stale at top (showed ${topK}/N) — did not reset on scroll-up`).toBeLessThanOrEqual(1);
  });
}
