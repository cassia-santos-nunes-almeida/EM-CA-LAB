# EM-CA-LAB

Interactive "virtual lab" website for **BL30A0350 — Electromagnetism and Circuit
Analysis** (LUT University): ~25 curriculum sections across three engineering
domains, with blocking predict-first simulations, concept checks, and worked
derivations. React 19 + TypeScript + Vite + Tailwind v4 + Zustand + KaTeX +
Recharts; PWA (vite-plugin-pwa); client-side Gemini tutor; deployed on Vercel.

This file is machine-neutral — machine facts (paths, interpreters, RAM quirks)
live in the untracked `../CLAUDE.md` workspace file on each machine.

## Commands & gates — ALL green before any PR, with executed output shown

| Gate | Command | Notes |
|---|---|---|
| Types + build | `npm run build` | `tsc -b && vite build` — this IS the typecheck |
| Lint | `npm run lint` | flat config incl. jsx-a11y; lint failures count as red |
| Unit | `npx vitest run --no-file-parallelism` | run from INSIDE the repo; the serial flag is a local low-core/RAM guard — CI runs plain `npx vitest run`. Per-machine counts and timings: machine file |
| E2E | `npm run e2e` | builds, then Playwright ×3 projects: desktop / mobile / desktop-hidpi (dpr2), workers=2, port 4273. `npm run e2e:quick` reuses an existing build |

CI is the arbiter: `.github/workflows/gates.yml` runs all four gates on every
PR and every push to `main` (GitHub ubuntu runners, Node 24; job names match
this table one-to-one). Local gates are the pre-flight. Close with:
`Tested: [...]. Not tested: [...] because [...]`.

## Architecture spine

- `src/shared/constants/curriculum.ts` — **single source of truth** for course
  structure (Parts → ordered sections → `{id, title, route, domain}`); a section's
  `domain` says where its code lives, its Part says where it teaches.
- `src/sectionRegistry.tsx` — the ONE place presentation reaches into domains
  (section id → lazy component via `lazyRetry`, which retries a dynamic import
  once on stale-service-worker chunk failure). `routeIntegrity.test.ts` pins
  registry keys == `ALL_SECTIONS`.
- Domains: `@circuits` / `@em` / `@transmission` / `@shared` (aliases in
  `vite.config.ts`; vitest config is inline there too — no separate config file).
  **`shared/` must never import from a domain.**
- Layout/interaction primitives in `src/shared/components/common/`:
  `LabLayout` (split-pane bench; `leadWithBench` renders the sim DOM-first for
  predict-first sections), `PredictionGate`, `ConceptCheck`, `MathWrapper`,
  `LabStation`, `GuidedChallenge`; scroll-spy in `src/shared/components/scrollspy/`
  (`ScrollSpyProvider`, `SectionAnchor`, `computeActiveId`).
- `src/shared/hooks/useSelfMeasuringCanvas.ts` — the canonical canvas hook:
  `prepareFrame()` self-measures + applies DPR; it returns `null` while a gate
  hides the canvas — callers early-return but KEEP the rAF loop scheduled.
- Physics/math are pure modules tested alongside: several em sections have a
  `physics.ts` (not all do),
  `src/circuits/utils/componentMath.ts`,
  `src/transmission/utils/transmissionMath.ts`, etc. Extract math to these
  modules; components stay thin.

## Contracts the guard tests enforce — extend deliberately, never dodge

- **KaTeX backslashes:** in a JSX *attribute*, `formula="\delta"` (single
  backslash); `\\` belongs only inside JS-expression strings
  (`formula={'\\delta'}`) or real line breaks —
  `src/__tests__/no-katex-double-backslash.test.ts` scans all source.
- **Directional ConceptChecks:** exactly ONE option may name the keyed
  direction and it must be correct — `src/__tests__/concept-check-directions.test.ts`.
- **PredictionGate DOM contract:** `[data-gate]` attribute + a button matching
  /commit prediction|continue/i — the e2e `unlockGates` helpers depend on it.
- **`MIN_CANVAS_W`/`MIN_CANVAS_H` + `DPR_MIGRATED`** tables in
  `e2e/sim-paint.spec.ts`: every LabLayout / self-measuring-canvas migration
  adds its section id. Update baselines deliberately; never relax them to make
  a real regression pass.
- **Notation authority:** Nilsson (circuits/Laplace), Ulaby (EM primary), Ida
  (secondary) — the `em-ca-textbook-conventions` skill resolves conflicts.
- Repo-wide guards live in `src/__tests__/` (`theme-tokens`, `no-image-hotlinks`,
  `no-stale-module-links`, `no-modifier-letter-glyphs`, `app`).

## Git & PR workflow

- Conventional commits with scope (`feat(faraday): …`). Feature branch → PR;
  direct pushes to `main` are blocked. PRs open via the GitHub REST API (no gh
  CLI on any machine — recipe in the workspace machine file).
- **Stacked-PR trap (bit twice: #49, #53):** never trust auto-retarget. Open
  the second PR against `main`, and after a stack lands, ancestor-check BOTH
  commits are on `origin/main` before declaring anything merged.
  (verified 2026-07-02)
- After merge: delete branches local + remote, re-run the gates on merged main.

## Where knowledge lives

- `ls .claude/skills/` — the synced skill set. Source of truth is
  `../my-claude-skills` — edit skills THERE (a PostToolUse hook warns if you
  edit a synced copy here).
- `docs/audits/` — correctness sweeps; the 2026-06-25 fresh-uniform-sweep holds
  the remaining defect punch-list. `docs/superpowers/plans|specs/` — dated
  implementation plans. `docs/design/` — navigation-shell spec + prototypes.
- Durable lessons → `../my-claude-skills/LESSONS-INBOX.md` (retro skill);
  session continuity → remember plugin. The repo outranks all memory files.

## Program state (verified 2026-07-02 — re-verify against git before relying)

Redesign Tracks A/B/C are complete and on `main`. Known open items: full-body
engineering-blue retint, cross-domain bench/scroll-spy uniformity (transmission
has none), gamification dead-tracking surface-or-delete decision.
