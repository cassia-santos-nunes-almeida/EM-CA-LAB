/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/**
 * Permanent net — regression guard for the recurring KaTeX double-backslash bug.
 *
 * In a JSX *attribute* string, backslashes are LITERAL (JSX does not process escapes),
 * so `<MathWrapper formula="\\delta" />` feeds KaTeX the text `\\delta` (a line-break
 * token + "delta") and renders as plain text instead of δ. The fix is always a SINGLE
 * backslash in that position. (This is a per-repo recurrence — it was fixed app-wide in
 * the pre-consolidation modules and must not creep back in.)
 *
 * Scope is deliberately narrow to stay false-positive-free:
 *  - Only `formula="…"` / `formula='…'` JSX *attributes* are checked. Object properties
 *    (`math: '\\delta'`) and JS-expression props (`formula={'\\delta'}` / template
 *    literals) are JS strings where `\\` → `\` is CORRECT, so they are exempt.
 *  - Only `\\` immediately followed by a LETTER is flagged; a standalone `\\` line break
 *    (followed by a space/brace/&) is legitimate KaTeX and is ignored.
 */
const FORMULA_ATTR = /\bformula\s*=\s*("[^"]*"|'[^']*')/g;
const DOUBLE_ESCAPED_COMMAND = /\\{2}[A-Za-z]/;

/** Quoted-attribute formula values on a line that double-escape a LaTeX command. */
export function findKatexDoubleBackslash(text: string): { line: number; snippet: string }[] {
  const out: { line: number; snippet: string }[] = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(FORMULA_ATTR)) {
      if (DOUBLE_ESCAPED_COMMAND.test(m[1])) out.push({ line: i + 1, snippet: m[0].trim() });
    }
  });
  return out;
}

function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter(
      (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.split(sep).includes('__tests__'),
    )
    .map((f) => join(dir, f));
}

describe('KaTeX double-backslash lint', () => {
  it('flags a double-escaped command in a formula attribute but not the safe cases', () => {
    expect(findKatexDoubleBackslash(String.raw`<MathWrapper formula="\\delta" />`)).toHaveLength(1);
    expect(findKatexDoubleBackslash(String.raw`<MathWrapper formula="\\frac{a}{b}" block />`)).toHaveLength(1);
    // Correct single backslash in the attribute — fine.
    expect(findKatexDoubleBackslash(String.raw`<MathWrapper formula="\delta" />`)).toHaveLength(0);
    // Legitimate KaTeX line break (\\ not followed by a letter) — fine.
    expect(findKatexDoubleBackslash(String.raw`<MathWrapper formula="x \\ y" />`)).toHaveLength(0);
    // JS-expression / template prop — \\ is a JS escape that yields the correct \delta.
    expect(findKatexDoubleBackslash("<MathWrapper formula={'\\\\delta'} />")).toHaveLength(0);
    expect(findKatexDoubleBackslash('<MathWrapper formula={`\\\\delta`} />')).toHaveLength(0);
  });

  it('no source file double-escapes a LaTeX command in a formula attribute', () => {
    const srcDir = resolve(import.meta.dirname, '..');
    const offenders = sourceFiles(srcDir).flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return findKatexDoubleBackslash(text).map((v) => `${file}:${v.line}  ${v.snippet}`);
    });
    expect(offenders, `KaTeX double-backslash found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
