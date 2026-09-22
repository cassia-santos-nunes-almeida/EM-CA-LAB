# EM-CA-LAB

Interactive "virtual lab" website for **BL30A0350 — Electromagnetism and Circuit
Analysis** (LUT University): 28 curriculum sections across three engineering
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
  direct pushes to `main` are blocked. Open PRs with `gh` where it is installed
  (the workspace machine file says which machines have it); elsewhere use the
  GitHub REST API recipe in that same file.
- **Stacked-PR trap (bit twice: #49, #53):** never trust auto-retarget. Open
  the second PR against `main`, and after a stack lands, ancestor-check BOTH
  commits are on `origin/main` before declaring anything merged.
  (verified 2026-07-02)
- After merge: delete branches local + remote, re-run the gates on merged main.

## Where knowledge lives

- `ls .claude/skills/` — the synced skill set. Source of truth is
  `../my-claude-skills` — edit skills THERE (a PostToolUse hook warns if you
  edit a synced copy here).
- `docs/audits/` — correctness sweeps; `2026-07-03-post-redesign-lo-ux-audit.md`
  holds the live defect register and the Top-10 roadmap (the 2026-06-25
  punch-list is fully dispositioned). `docs/superpowers/plans|specs/` — dated
  implementation plans. `docs/design/` — navigation-shell spec + prototypes,
  plus `2026-09-16-aitutor-provider-abstraction.md` (tutor provider plan).
- Durable lessons → `../my-claude-skills/LESSONS-INBOX.md` (retro skill);
  session continuity → Claude Code's per-project auto-memory directory (no
  remember plugin is installed). The repo outranks all memory files.

## Models and agents

- The session model orchestrates and keeps judgment; subagents run one tier
  below, and every spawn names its tier explicitly — rule P-AGENT-04 in the
  synced `.claude/skills/context_evaluator/shared-patterns.md`. Which model a
  session runs is a user/machine setting: it lives in the machine file, not
  here.
- Backstop, not substitute: the tracked, project-level `.claude/settings.json`
  sets `CLAUDE_CODE_SUBAGENT_MODEL` so a spawn that forgets its tier still
  runs at the tier named there. Resolution order is per-call `model` → agent
  frontmatter → that variable → session model. Re-check the value whenever
  the session tier changes.
- Project agents live in `.claude/agents/` and carry their tier and effort in
  frontmatter; `prompt-cold-reader` omits CLAUDE.md on purpose so prompt
  cold-reads stay fresh. `.claude/settings.json` also pins `ultracode` for
  this project (every session: xhigh effort + workflow orchestration).
- Model IDs, pricing, API shapes: load the `claude-api` skill — never from
  memory. The in-app tutor (`AiTutor.tsx`) is a client-side Gemini call with a
  student-entered key; the provider-abstraction plan is in `docs/design/`.

## Program state (verified 2026-09-16 — re-verify against git before relying)

Redesign Tracks A/B/C, the physics-truth batch (PR #58) and the math
prerequisite sections (PR #59; 25→28 sections) are on `main`. Nothing under
`src/` has changed since 2026-07-04. The live roadmap is the Top-10 table in
`docs/audits/2026-07-03-post-redesign-lo-ux-audit.md`; item #1 landed in #58,
items #2–#10 are open (each verified in code 2026-09-16):

- #2 cheap wins — no `model.md` per physics module yet; phantom gate keys C-09.
- #3 completion/tracking integrity — gate unlock not persisted from
  `progressStore`; one ConceptCheck can complete a section badge
  (RT-1/RT-2/RT-5). Gamification decision: SURFACE (decided in the audit).
- #4 gate follow-up — no post-unlock micro-question in `PredictionGate.tsx`.
- #5 s-domain promise repair — `SDomainAnalysis.tsx` still says "assuming
  zero initial conditions".
- #6 notation sweep tier 1 — `dA` ×22 in `src/em`; `dS`, `ρ_l`, `Λ` ×0.
- #7 RL bench + rod-on-rails-lite — LO5/LO6 still PARTIAL.
- #8 chunked scroll — no chunk markers in `src/shared/components`.
- #9 transmission campaign — all six modules still tab-based; zero commits to
  `src/transmission` since July; scroll-spy only in PhasorAlgebra.
- #10 magnetic-circuits split — not started.

Parked behind the ten (audit "#11+"): full engineering-blue retint + Tier-2
glyphs, hint-ladder UI, bench-state persistence, per-Part challenge station,
exam-paper calibration. Cross-domain bench/scroll-spy uniformity is #9.
