# EM-CA-LAB — Phase 0 Complete

Phase 0 consolidated the three separate EM&AC Lab apps (**M1** EM fundamentals,
**M2** circuit analysis, **M3** transmission lines & antennas) into this single
Vite + React + TypeScript application, re-presented as **one course** following a
circuits-first 5-part pedagogical spine. Foundation only — **no new content or
features were added.**

Plan of record: `~/.claude/plans/let-s-talk-through-the-jazzy-taco.md`

## What shipped

**Structure — code by domain, presentation by curriculum:**

```
src/
  shared/        deduped components, hooks, merged progress+theme store,
                 constants/curriculum.ts  ← the 5-Part spine (single source of truth)
                 components/{layout/Layout,layout/Sidebar,common/AiTutor,
                            common/CourseNavigation,CourseLanding}
  em/            sections + canvas sims + em-only components (was M1)
  circuits/      sections + circuitSolver/componentMath + circuit components (was M2)
  transmission/  sections + simulations + transmissionMath (was M3)
  sectionRegistry.tsx   ← the ONE place presentation reaches into a domain
  App.tsx               ← unified BrowserRouter
```

- **`curriculum.ts`** defines `PARTS`, `SECTIONS`, `ALL_SECTIONS`, `getAdjacentSections`.
  Re-ordering the course is a config edit, not a file move.
- **Router:** `/` course landing + flat `/<section-id>` for all 20 sections,
  lazy-loaded via `sectionRegistry.tsx`. A route-integrity test asserts the
  registry's keys are exactly `ALL_SECTIONS`.
- **Shell:** `Sidebar` renders Parts + completion badges straight from the
  curriculum/store; `CourseNavigation` does course-wide prev/next *across* Part
  boundaries.

**The 5-Part spine:**

| Part | Sections | Code domain |
|---|---|---|
| 1 · Circuit Analysis, Laplace & Transients | component-physics, circuit-analysis, laplace-theory, s-domain, interactive-lab | circuits |
| 2 · Electric & Magnetic Fields | coulomb, gauss, ampere, lorentz | em |
| 3 · Induction, Magnetics & Inductance | faraday, lenz, magnetic-circuits, transformers | em (+ transformers code from transmission) |
| 4 · Maxwell, Waves, Radiation & Antennas | maxwell, em-wave, polarization, antennas | em (+ antennas code from transmission) |
| 5 · Transmission Lines & Distributed Systems | lumped-distributed, transmission-lines, transients | transmission |

## Verification (all green)

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors (jsx-a11y on) |
| `npm run build` (`tsc -b && vite build`) | clean |
| `npm test` | **264 passed, 38 files, 0 skips** |
| Architecture invariants | no leftover `@/`, no cross-domain leaks, `shared/` imports no domain |
| Production smoke | preview serves `/` + deep routes (200), `dist/sw.js` + `manifest.webmanifest` present |

Committed as `8488e23` on `main` (193 files, fresh repo — clean import, no history).

## Not yet done (handed back)

1. **Push** — `git push -u origin main`. Confirm the GitHub repo is **private**
   first (this commit bundles all three modules' source).
2. **Activate skill settings** — review `.claude/settings.proposed.json` and
   rename it to `.claude/settings.json` if you want the skill-sync hooks +
   MCP permissions (writing it directly was blocked as self-modification).
3. **Manual visual walk** — `npm run dev`, click Part 1→5, confirm the **16
   canvas sims** (em ×~9 + transmission ×7) and **recharts charts**
   (gauss / em-wave / coulomb) render correctly sized. Not headless-verifiable.

## Deferred to later phases (intentionally out of Phase-0 scope)

- 2 `MODULE_URLS.module2` bridge links (`magnetic-circuits`, `Antennas`) still
  point at the old standalone deployments → repoint to internal routes (content).
- Unify `Tabs` + `TabSet` (they genuinely diverge: controlled vs uncontrolled).
- Trim now-unused `em/constants/physics.ts` exports (`getAdjacentModules`,
  `LEARNING_TRACKS`); add vitest `css:true`.
- Retarget `my-claude-skills/scripts/sync-config.json` (3 module entries → 1).

Then the broader program: **Phase 1** docked `LabLayout` rollout · **Phase 2**
ILO9 Heaviside + content gaps · **Phase 3** new RC/RL/RLC + pole-zero sims.

## Run

```bash
npm install
npm run dev        # dev server
npm run build      # tsc -b && vite build
npm test           # vitest (264 tests)
npm run lint       # eslint
npm run preview    # serve the production build
```

> `scripts/` holds the throwaway Phase-0 consolidation codemods
> (`gen-manifest.mjs`, `consolidate.mjs`, `migrate-coursenav.mjs`) and the move
> manifests — kept as provenance; not part of the app bundle.
