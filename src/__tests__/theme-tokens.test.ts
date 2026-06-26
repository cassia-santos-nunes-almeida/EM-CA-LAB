/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Permanent net — regression guard for the warm Lab-Instrument token layer (#11).
 *
 * Asserts by reading the compiled source of src/index.css that:
 *  1. --color-chassis resolves to the WARM paper value (#f4f1ea), not the old cool slate-100 (#f1f5f9).
 *  2. --font-display is defined (Space Grotesk loaded).
 *  3. No other hardcoded cool-chassis hex leaks in CSS rules (only comments are exempt).
 *  4. All new chrome tokens are present in @theme static.
 *  5. All new chrome tokens are mirrored in the .dark block.
 *
 * This uses a source-read approach (no jsdom needed) — reliable in vitest without a browser.
 */

const CSS_PATH = resolve(import.meta.dirname, '../index.css');

function readCss(): string {
  return readFileSync(CSS_PATH, 'utf8');
}

describe('warm Lab-Instrument token layer (#11)', () => {
  it('--color-chassis is set to warm paper #f4f1ea in @theme static', () => {
    const css = readCss();
    // The @theme static block must contain the warm value
    expect(css).toMatch(/--color-chassis:\s*#f4f1ea/);
  });

  it('old cool chassis value #f1f5f9 does NOT appear in any CSS rule (only in comments)', () => {
    const css = readCss();
    // Strip all CSS comments then check for old hex
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toMatch(/#f1f5f9/i);
  });

  it('--font-display is defined with Space Grotesk in @theme', () => {
    const css = readCss();
    expect(css).toMatch(/--font-display:\s*["']?Space Grotesk["']?/);
  });

  it('Space Grotesk is included in the Google Fonts @import', () => {
    const css = readCss();
    expect(css).toMatch(/Space\+Grotesk/);
  });

  it('new chrome tokens are present in @theme static', () => {
    const css = readCss();
    const newTokens = ['--color-ink', '--color-rail', '--color-screen'];
    for (const token of newTokens) {
      expect(css, `Missing token: ${token}`).toMatch(new RegExp(token + '\\s*:'));
    }
  });

  it('per-Part bg washes are all present', () => {
    const css = readCss();
    for (let i = 1; i <= 5; i++) {
      expect(css, `Missing --color-part-${i}-bg`).toMatch(
        new RegExp(`--color-part-${i}-bg\\s*:`),
      );
    }
  });

  it('--color-led and --color-cta are unchanged (#10b981 and #2563eb)', () => {
    const css = readCss();
    expect(css).toMatch(/--color-led:\s*#10b981/);
    expect(css).toMatch(/--color-cta:\s*#2563eb/);
  });

  it('new chrome tokens are mirrored in the .dark block', () => {
    const css = readCss();
    // Find the .dark block
    const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/s);
    expect(darkMatch, '.dark block not found').toBeTruthy();
    const darkBlock = darkMatch![1];
    const mirroredTokens = ['--color-ink', '--color-rail', '--color-screen', '--color-chassis', '--color-card'];
    for (const token of mirroredTokens) {
      expect(darkBlock, `Token ${token} not mirrored in .dark`).toMatch(
        new RegExp(token + '\\s*:'),
      );
    }
  });

  it('code rule no longer uses hardcoded rgb(241 245 249) chassis hex', () => {
    const css = readCss();
    // Strip comments
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toMatch(/rgb\(\s*241\s+245\s+249\s*\)/);
  });

  it('code rule uses var(--color-chassis) for background', () => {
    const css = readCss();
    expect(css).toMatch(/code\s*\{[^}]*background-color:\s*var\(--color-chassis\)/s);
  });
});
