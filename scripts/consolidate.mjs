// Throwaway consolidation codemod (Phase 0). NOT shipped.
// Copies source files into the EM-CA-LAB tree and rewrites their import
// specifiers (`@/...` and relative) to the new domain aliases, using a
// manifest of { src, dest } moves. Bare-module imports (react, lucide, …)
// are left untouched. Any local import that resolves to a file NOT in the
// manifest is reported as UNRESOLVED so it can be handled by hand.
//
// Usage: node scripts/consolidate.mjs <manifest.json> [--dry]
import fs from 'node:fs';
import path from 'node:path';

const DEST_SRC = norm(path.resolve(import.meta.dirname, '..', 'src'));
const ALIASES = {
  '@shared': `${DEST_SRC}/shared`,
  '@em': `${DEST_SRC}/em`,
  '@circuits': `${DEST_SRC}/circuits`,
  '@transmission': `${DEST_SRC}/transmission`,
};

const manifestPath = process.argv[2];
const dry = process.argv.includes('--dry');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function norm(p) { return p.replace(/\\/g, '/'); }
function stripExt(p) { return p.replace(/\.(tsx?|jsx?)$/, ''); }

// Map every moved source file (key: normalized, ext-stripped abs path) -> dest abs (ext-stripped)
const moveMap = new Map();
for (const m of manifest) {
  moveMap.set(stripExt(norm(path.resolve(m.src))), stripExt(norm(path.resolve(m.dest))));
}

function srcRootOf(absSrc) {
  const n = norm(absSrc);
  const i = n.indexOf('/src/');
  return i === -1 ? path.dirname(n) : n.slice(0, i + 4); // '.../src'
}

function lookupDest(absNoExt) {
  const k = norm(absNoExt);
  if (moveMap.has(k)) return moveMap.get(k);
  if (moveMap.has(k + '/index')) return moveMap.get(k + '/index');
  return null;
}

function toAliasSpec(destNoExt) {
  const d = norm(destNoExt);
  for (const [alias, root] of Object.entries(ALIASES)) {
    if (d === root) return alias;
    if (d.startsWith(root + '/')) return alias + d.slice(root.length);
  }
  return null;
}

function rewriteSpec(spec, fileSrcAbs) {
  let targetNoExt;
  if (spec.startsWith('@/')) targetNoExt = path.posix.join(srcRootOf(fileSrcAbs), spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../')) targetNoExt = path.posix.join(norm(path.dirname(fileSrcAbs)), spec);
  else return { kind: 'bare' };
  targetNoExt = stripExt(targetNoExt);
  const dest = lookupDest(targetNoExt);
  if (!dest) return { kind: 'unresolved' };
  const alias = toAliasSpec(dest);
  return alias ? { kind: 'ok', spec: alias } : { kind: 'unresolved' };
}

const SPEC_RE = /(\b(?:from|import)\s*(?:\(\s*)?(['"]))([^'"]+)(\2)/g;
const unresolved = [];
let written = 0;

for (const m of manifest) {
  // map-only entries (copy:false) exist purely so imports of a deduped
  // component resolve to the single shared copy — they are not written.
  if (m.copy === false) continue;
  const srcAbs = norm(path.resolve(m.src));
  const destAbs = norm(path.resolve(m.dest));
  if (!fs.existsSync(srcAbs)) { console.error('MISSING SRC:', srcAbs); process.exit(1); }
  const text = fs.readFileSync(srcAbs, 'utf8');
  const out = text.replace(SPEC_RE, (full, pre, _q, spec, close) => {
    const r = rewriteSpec(spec, srcAbs);
    if (r.kind === 'ok') return pre + r.spec + close;
    if (r.kind === 'unresolved') unresolved.push({ spec, in: norm(path.relative(DEST_SRC, destAbs)) });
    return full;
  });
  if (!dry) {
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.writeFileSync(destAbs, out);
  }
  written++;
}

console.log(`${dry ? '[dry] ' : ''}processed ${written} files`);
if (unresolved.length) {
  console.log(`\nUNRESOLVED local imports (${unresolved.length}) — handle by hand or add to manifest:`);
  for (const u of unresolved) console.log(`  ${u.spec}   (in ${u.in})`);
} else {
  console.log('All local imports resolved to moved files. ✓');
}
