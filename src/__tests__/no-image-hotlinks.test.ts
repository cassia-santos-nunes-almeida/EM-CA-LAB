import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Regression guard: no FigureImage component may receive a `src` that points at
 * an external http(s) URL (hotlinking). All images must be local assets bundled
 * with the app. This test scans every .tsx file in src/ and fails if it finds a
 * FigureImage with an external src, listing the offending files so a developer
 * knows what to fix.
 */

function tsxFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => join(dir, f));
}

describe('no external image hotlinks', () => {
  it('no FigureImage src points at an http(s) URL', () => {
    // import.meta.dirname is Node 20.11+/24; project targets Node 24
    const srcDir = resolve(import.meta.dirname, '..');

    const offenders = tsxFiles(srcDir).filter((file) => {
      const text = readFileSync(file, 'utf8');
      // Match src="http...", src={'http...'}, src={`http...`}
      return text.includes('FigureImage') && /src=\{?["'`]https?:\/\//.test(text);
    });

    expect(
      offenders,
      `Hotlinked image src found in:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
