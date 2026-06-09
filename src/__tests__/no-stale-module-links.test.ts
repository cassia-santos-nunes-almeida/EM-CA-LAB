/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/**
 * Regression guard: the consolidated course must never link out to the three
 * legacy per-module deployments (em-ac-lab-module*.vercel.app) or resurrect
 * the MODULE_URLS bridge constants that pointed at them. Cross-references
 * between sections are internal router links derived from curriculum.ts.
 * Companion to no-image-hotlinks.test.ts.
 */

function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.tsx')) &&
        !f.split(sep).includes('__tests__'),
    )
    .map((f) => join(dir, f));
}

describe('no stale legacy-module links', () => {
  it('no source file references the legacy module deployments or MODULE_URLS', () => {
    const srcDir = resolve(import.meta.dirname, '..');

    const offenders = sourceFiles(srcDir).filter((file) => {
      const text = readFileSync(file, 'utf8');
      return text.includes('em-ac-lab-module') || text.includes('MODULE_URLS');
    });

    expect(
      offenders,
      `Legacy module link found in:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
