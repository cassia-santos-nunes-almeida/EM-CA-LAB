/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/**
 * Permanent net — canvas labels must not use "modifier letter" raised glyphs (e.g. U+1D30
 * MODIFIER LETTER CAPITAL D) as fake sub/superscripts. They render raised and misaligned:
 * the bounce diagram showed "Tᴰ" instead of the subscript "T_D" used in the prose/formulas
 * everywhere else. Use a plain "T_D".
 */
const MODIFIER_D_CHAR = 'ᴰ';
const MODIFIER_D_ESCAPE = '\\u1D30'; // the same defect written as a JS string escape

function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter(
      (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.split(sep).includes('__tests__'),
    )
    .map((f) => join(dir, f));
}

describe('no modifier-letter raised glyphs in canvas labels (A.2#14)', () => {
  it('no source uses U+1D30 (MODIFIER LETTER CAPITAL D), as a char or an escape', () => {
    const srcDir = resolve(import.meta.dirname, '..');
    const offenders = sourceFiles(srcDir).filter((f) => {
      const text = readFileSync(f, 'utf8');
      return text.includes(MODIFIER_D_CHAR) || text.includes(MODIFIER_D_ESCAPE);
    });
    expect(offenders, `U+1D30 found in:\n${offenders.join('\n')}`).toEqual([]);
  });
});
