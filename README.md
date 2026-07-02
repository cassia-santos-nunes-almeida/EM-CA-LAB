# EM-CA-LAB

Interactive virtual lab for **BL30A0350 — Electromagnetism and Circuit Analysis**
(LUT University). ~25 lecture sections spanning circuit analysis, electromagnetics,
and transmission lines, each built around *predict-first* interactive simulations:
students commit a prediction before the simulation unlocks, then explore it live.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, KaTeX, and
Recharts. Ships as a PWA and deploys on Vercel.

## Quick start

```bash
npm install
npm run dev        # Vite dev server
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck (`tsc -b`) + production build |
| `npm run lint` | ESLint (flat config, incl. jsx-a11y) |
| `npm test` | unit tests (Vitest; on low-RAM boxes prefer `npx vitest run --no-file-parallelism`) |
| `npm run e2e` | build + Playwright e2e (desktop / mobile / HiDPI projects) |
| `npm run preview` | serve the production build |

## Layout

```
src/
├── shared/         # cross-domain: curriculum spine, layout primitives, scroll-spy, store
├── circuits/       # circuit analysis modules
├── em/             # electromagnetics sections
├── transmission/   # transmission lines, transformers, antennas (they teach across several Parts — see src/shared/constants/curriculum.ts)
├── sectionRegistry.tsx   # section id → lazy component (the only presentation↔domain bridge)
└── __tests__/      # repo-wide guard tests
e2e/                # Playwright specs + screenshot harnesses
docs/               # audits, design specs, implementation plans
```

Contributor conventions (gates, guard-test contracts, PR workflow) live in
[CLAUDE.md](CLAUDE.md).

© Cássia Almeida / LUT University — course material for BL30A0350 students.
