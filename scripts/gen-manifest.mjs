// Throwaway manifest generator (Phase 0). Walks a source module's src tree and
// emits the { src, dest } move list consumed by consolidate.mjs.
//
//  - DEDUP entries (key: src-relative path) map a file to its single @shared
//    copy. `copy:false` (default) = map-only (the shared copy already exists, we
//    only want imports of it rewritten to @shared). `copy:true` = actually write
//    to shared (used to relocate the ONE canonical test for a deduped component).
//  - SKIP entries (app-shell files) are handled by the unified router at Stage F.
//  - Everything else is copied into src/<domain>/<same-relative-path>.
//
// Usage: node scripts/gen-manifest.mjs <module>   (module = circuits | em | transmission)
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..');
const SHARED = `${REPO}/src/shared`.replace(/\\/g, '/');
const GH = path.resolve(REPO, '..').replace(/\\/g, '/');

// Deduped leaf components shared by ≥2 modules. Same relative dest in shared.
const COMMON_DEDUP = {
  'utils/cn.ts': 'utils/cn.ts',
  'components/common/MathWrapper.tsx': 'components/common/MathWrapper.tsx',
  'components/common/ConceptCheck.tsx': 'components/common/ConceptCheck.tsx',
  'components/common/SectionHook.tsx': 'components/common/SectionHook.tsx',
  'components/common/YourTurnPanel.tsx': 'components/common/YourTurnPanel.tsx',
  'components/common/FigureImage.tsx': 'components/common/FigureImage.tsx',
  'components/common/GuidedChallenge.tsx': 'components/common/GuidedChallenge.tsx',
  'components/common/TableOfContents.tsx': 'components/common/TableOfContents.tsx',
  'components/common/CollapsibleSection.tsx': 'components/common/CollapsibleSection.tsx',
  'components/common/PredictionGate.tsx': 'components/common/PredictionGate.tsx',
  'components/layout/ErrorBoundary.tsx': 'components/layout/ErrorBoundary.tsx',
  'hooks/useOnlineStatus.ts': 'hooks/useOnlineStatus.ts',
  'hooks/useAnalytics.ts': 'hooks/useAnalytics.ts',
  'store/progressStore.ts': 'store/progressStore.ts',
};

const CONFIG = {
  circuits: {
    srcRoot: `${GH}/EM-AC-Lab-Module2/src`,
    dedup: {
      ...mapOnly(COMMON_DEDUP),
      // Relocate the ONE canonical test for each deduped component into shared.
      'components/__tests__/CollapsibleSection.test.tsx': { to: 'components/common/__tests__/CollapsibleSection.test.tsx', copy: true },
      'components/__tests__/ConceptCheck.test.tsx': { to: 'components/common/__tests__/ConceptCheck.test.tsx', copy: true },
      'components/__tests__/GuidedChallenge.test.tsx': { to: 'components/common/__tests__/GuidedChallenge.test.tsx', copy: true },
    },
    skip: ['App.tsx', 'main.tsx', 'setupTests.ts'],
  },

  em: {
    srcRoot: `${GH}/EM-AC-Lab-Module1/src`,
    // M1's leaf section components live under components/common/section/; its
    // ErrorBoundary under components/common/ (shared canonical is in layout/).
    dedup: {
      'utils/cn.ts': { to: 'utils/cn.ts', copy: false },
      'components/common/MathWrapper.tsx': { to: 'components/common/MathWrapper.tsx', copy: false },
      'components/common/section/ConceptCheck.tsx': { to: 'components/common/ConceptCheck.tsx', copy: false },
      'components/common/section/PredictionGate.tsx': { to: 'components/common/PredictionGate.tsx', copy: false },
      'components/common/section/SectionHook.tsx': { to: 'components/common/SectionHook.tsx', copy: false },
      'components/common/section/YourTurnPanel.tsx': { to: 'components/common/YourTurnPanel.tsx', copy: false },
      'components/common/FigureImage.tsx': { to: 'components/common/FigureImage.tsx', copy: false },
      'components/common/GuidedChallenge.tsx': { to: 'components/common/GuidedChallenge.tsx', copy: false },
      'components/common/TableOfContents.tsx': { to: 'components/common/TableOfContents.tsx', copy: false },
      'components/common/CollapsibleSection.tsx': { to: 'components/common/CollapsibleSection.tsx', copy: false },
      'components/common/ErrorBoundary.tsx': { to: 'components/layout/ErrorBoundary.tsx', copy: false },
      'hooks/useOnlineStatus.ts': { to: 'hooks/useOnlineStatus.ts', copy: false },
      'hooks/useAnalytics.ts': { to: 'hooks/useAnalytics.ts', copy: false },
      'store/progressStore.ts': { to: 'store/progressStore.ts', copy: false },
      // Canonical shared tests contributed by M1 (components M2 had no test for).
      'components/common/section/__tests__/SectionHook.test.tsx': { to: 'components/common/__tests__/SectionHook.test.tsx', copy: true },
      'components/common/section/__tests__/YourTurnPanel.test.tsx': { to: 'components/common/__tests__/YourTurnPanel.test.tsx', copy: true },
    },
    skip: [
      // App shell — unified router/layout built at Stage F.
      'App.tsx', 'main.tsx', 'test/setup.ts',
      'components/layout/Layout.tsx', 'components/layout/Sidebar.tsx',
      // Duplicate tests of components already canonicalized to shared from M2…
      'components/common/section/__tests__/ConceptCheck.test.tsx',
      'components/common/__tests__/CollapsibleSection.test.tsx',
      'components/common/__tests__/GuidedChallenge.test.tsx',
      // …and PredictionGate, whose canonical shared test comes from M3 (Stage E).
      'components/common/section/__tests__/PredictionGate.test.tsx',
      // M1's ErrorBoundary test targets M1's simpler (fallback/Go-Home) component;
      // the canonical shared ErrorBoundary is M2's 3-level one with its own test.
      'components/common/__tests__/ErrorBoundary.test.tsx',
      // M1's MathWrapper test mocks renderToString+dangerouslySetInnerHTML; the
      // canonical M2 MathWrapper uses imperative katex.render into a ref.
      'components/common/__tests__/MathWrapper.test.tsx',
      // M1 store tests reference removed APIs (EXPECTED_CHECKS / migrate*); the
      // shared store test already covers the merged API.
      'store/__tests__/progressStore.test.ts',
      'store/__tests__/sectionProgress.test.ts',
    ],
  },

  transmission: {
    srcRoot: `${GH}/EM-AC-Lab-Module3/src`,
    dedup: {
      'utils/cn.ts': { to: 'utils/cn.ts', copy: false },
      'components/common/MathWrapper.tsx': { to: 'components/common/MathWrapper.tsx', copy: false },
      'components/common/ConceptCheck.tsx': { to: 'components/common/ConceptCheck.tsx', copy: false },
      'components/common/PredictionGate.tsx': { to: 'components/common/PredictionGate.tsx', copy: false },
      'components/common/SectionHook.tsx': { to: 'components/common/SectionHook.tsx', copy: false },
      'components/common/YourTurnPanel.tsx': { to: 'components/common/YourTurnPanel.tsx', copy: false },
      'components/common/FigureImage.tsx': { to: 'components/common/FigureImage.tsx', copy: false },
      'components/common/GuidedChallenge.tsx': { to: 'components/common/GuidedChallenge.tsx', copy: false },
      'components/common/TableOfContents.tsx': { to: 'components/common/TableOfContents.tsx', copy: false },
      'components/common/CollapsibleSection.tsx': { to: 'components/common/CollapsibleSection.tsx', copy: false },
      'components/common/LabLayout.tsx': { to: 'components/common/LabLayout.tsx', copy: false },
      'components/common/LabStation.tsx': { to: 'components/common/LabStation.tsx', copy: false },
      'components/layout/ErrorBoundary.tsx': { to: 'components/layout/ErrorBoundary.tsx', copy: false },
      'hooks/useOnlineStatus.ts': { to: 'hooks/useOnlineStatus.ts', copy: false },
      'hooks/useAnalytics.ts': { to: 'hooks/useAnalytics.ts', copy: false },
      'store/progressStore.ts': { to: 'store/progressStore.ts', copy: false },
      // Canonical shared tests contributed by M3 (its leaf components / superset).
      'components/common/__tests__/TableOfContents.test.tsx': { to: 'components/common/__tests__/TableOfContents.test.tsx', copy: true },
      'components/common/__tests__/LabStation.test.tsx': { to: 'components/common/__tests__/LabStation.test.tsx', copy: true },
      'components/common/__tests__/predictionGatePersist.test.tsx': { to: 'components/common/__tests__/predictionGatePersist.test.tsx', copy: true },
    },
    skip: [
      'App.tsx', 'main.tsx', 'setupTests.ts',
      'components/layout/Layout.tsx', 'components/layout/Sidebar.tsx',
      // Duplicate tests of components already canonicalized to shared from M2.
      'components/common/__tests__/CollapsibleSection.test.tsx',
      'components/common/__tests__/ConceptCheck.test.tsx',
      'components/common/__tests__/GuidedChallenge.test.tsx',
    ],
  },
};

function mapOnly(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, to]) => [k, { to, copy: false }]));
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

const moduleName = process.argv[2];
const cfg = CONFIG[moduleName];
if (!cfg) {
  console.error(`Unknown module "${moduleName}". Known: ${Object.keys(CONFIG).join(', ')}`);
  process.exit(1);
}

const domainRoot = `${REPO}/src/${moduleName}`.replace(/\\/g, '/');
const skip = new Set(cfg.skip ?? []);
const manifest = [];

for (const abs of walk(cfg.srcRoot)) {
  const rel = abs.slice(cfg.srcRoot.length + 1);
  if (skip.has(rel)) continue;
  const d = cfg.dedup?.[rel];
  if (d) {
    manifest.push({ src: abs, dest: `${SHARED}/${d.to}`, copy: d.copy });
  } else {
    manifest.push({ src: abs, dest: `${domainRoot}/${rel}` });
  }
}

const outPath = `${REPO}/scripts/manifest.${moduleName}.json`.replace(/\\/g, '/');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
const copied = manifest.filter((m) => m.copy !== false).length;
const mapOnlyN = manifest.length - copied;
console.log(`Wrote ${outPath}`);
console.log(`  ${manifest.length} entries: ${copied} copied, ${mapOnlyN} map-only (copy:false)`);
