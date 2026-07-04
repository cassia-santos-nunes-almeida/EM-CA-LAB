# Math Prerequisites Implementation Plan (net-new curriculum scope)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the vector-algebra and calculus machinery the course uses from its first screens but never defines — dot/cross products and scalar×vector, line/flux/closed-surface integrals with the div/curl local view, and complex-number algebra with Euler's `e^{jθ}` — as three new point-of-need sections (25 → 28), closing the gap between the syllabus presupposition (`docs/BL30A0350-learning-outcomes.md:14` — "Prior knowledge: calculus, linear algebra, basic physics") and what the app actually provides, in direct support of LO2 (cross products, line integrals), LO7 (flux integrals), LO4/LO9 (complex numbers, phasors), and LO11–12 (transients). This is NET-NEW curriculum scope, not an audit defect — no file in `docs/audits/` mentions prerequisite math and no audit id exists or is invented for it.

**Architecture:** Three standalone sections inserted at point of need (Decision #1 below), each a vertical slice: a pure tested math module + a predict-first section component + deliberate extension of every guard pin. The two field-math sections are `em`-domain (SectionLayout + LabLayout `leadWithBench` + `useSelfMeasuringCanvas`, gauss exemplar); the phasor-bridge section is `transmission`-domain, self-assembled on the PartialFractions template (engineering dead-end hook → WorkedSteps → gated interactive → ConceptChecks → YourTurnPanel → GuidedChallenge). Consuming sections get four additive one-sentence back-links; their pinned strings stay byte-identical.

**Tech Stack:** React 19 + TypeScript, KaTeX via MathWrapper (katex mocked in render tests), canvas via `useSelfMeasuringCanvas`, SVG for the phasor lab, Zustand progress store, Vitest + Testing Library, Playwright e2e ×3 projects.

## Decision #1 — Placement: (b) new sections at point of need, plus links-only seams (a light (d))

*(Rationale section — binding choices, no direct action items; the executable consequences live in Tasks 3, 6, 9, and 10.)*

The four options, costed:

| Option | Mechanical cost (verified 2026-07-04 at HEAD `f76b904`) | Pedagogical fit |
|---|---|---|
| **(a) New "Part 0 / Math Toolkit" Part** | Heaviest by far: `PART_QUANTITIES` load-time throw (`curriculum.ts:209-213`), `PART_SUMMARIES` unguarded silent-undefined (`PartAccordion.tsx:45`), `PART_TRACES` + the closed 5-member `TraceKind` union with a no-default exhaustive switch (`TraceScreen.tsx:24,135-143` — missing entry = silently blank trace screens in all four nav surfaces), 6 new CSS tokens in BOTH theme blocks of `src/index.css` (silent transparent accents if missed), `theme-tokens.test.ts:57-64` loop bound, `MobileTabBar.test.tsx:35-42` "exactly 5 Part chips" + `Sidebar.test.tsx:282-291` `toBe(5)`, `curriculum.test.ts:13-16` `PARTS toHaveLength(5)` / `[1,2,3,4,5]` (breaks whether Part 0 keeps `number: 0` or renumbers 1..6), the `PARTS[0]`-is-circuits semantic pin (`curriculum.test.ts:22-24`) inverted by a prepend, `MobileTabBar.test.tsx:180` `PARTS[4]` index, `ThroughLineHero.tsx:26` "Five instruments · one bench" copy, and e2e screenshot renaming churn. | Worst: a front-loaded review Part for students who *nominally have the math* is the content they skip; it delays the first physics payoff and contradicts the engineering-hook pedagogy and the audit's 10–15-min-unit benchmarks. **Rejected.** |
| **(c) Just-in-time refresher blocks** inside gauss/ampere/maxwell/coulomb/LineImpedance | No curriculum.ts change, but content scattered across five files dense with test-pinned strings, and no standalone reference page a student (or the AI tutor) can be sent to. | gauss/maxwell/em-wave are already in the audit's "too long" cohort (>6× viewport, audit §D) — adding teaching blocks to them fights audit §D directly. **Rejected as primary.** |
| **(b) New sections inside existing Parts** | Proven, small: the 2A/2B precedent touch-list (`curriculum.ts` + `sectionRegistry.tsx` + 3–4 test-literal sets per section). `getSectionNumber` is *derived* per Part, so an insertion renumbers only within its own Part; only 4 of the 13 pinned literals shift (named below), all deliberate re-pins. | Point-of-need retrieval for students with nominal prior knowledge — the partial-fractions precedent exactly (pure math at 1.7, immediately before its consumer 1.8). **Chosen.** |
| **(d) Hybrid (b)+(c)** | (b) plus per-site teaching blocks — inherits (c)'s pinned-string exposure. | Adopted in reduced form: **(b) primary + links-only seams** — four additive one-sentence cross-references (Task 10), no teaching content duplicated in place. |

**Chosen placements** (verified against the pinned literals in `getSectionNumber.test.ts:5-19`, which pin 1.1, 1.3, 1.4, 1.5, 1.7, 1.9, 2.1, 3.3, 3.4, 4.4, 5.2, 5.3, 5.4):

| New section | Slot | Why here | Renumber cost |
|---|---|---|---|
| `math-vectors` — Vector Toolkit | **2.1** (opens Part 2, before coulomb) | Coulomb needs vector superposition and F = qE on its first screen; lorentz (2.6) needs the cross product; gauss needs the dot product. One section serves all of Part 2 onward. | `'coulomb'` `2.1→2.2` — the ONLY Part-2 literal pinned |
| `math-integrals` — Line & Flux Integrals | **2.3** (between coulomb and gauss) | `∮E·dA` appears unglossed in gauss's theory pane (`gauss/index.tsx:318`), `∮B·dl` in ampere (`ampere/index.tsx:445`); div/curl closes the section as "the local view", forward-feeding maxwell (4.1), which name-drops the divergence/Stokes theorems without stating them (`maxwell/index.tsx:550`). Placing it directly before gauss is the partial-fractions move. | none (gauss/ampere/lorentz have no number pins; coulomb stays 2.2) |
| `math-phasors` — Complex Numbers & Phasors | **5.1** (opens Part 5) | The scoped gap is the bridge from em-wave's geometric rotating arrow (4.2 "Phasor Sync", no complex formalism) to transmission's algebraic phasors (`Γ_L e^{−j2βl}`); Euler's identity appears exactly once in the app, cited as a known fact (`LineImpedance.tsx:323`). Every consumer of the phasor *algebra* is in Part 5 — Part 1 (complex poles at 1.7, σ ± jω at 1.8) *reads* complex numbers but never computes with them, and gets a forward seam in Task 10 instead. Part-1 placement was considered and rejected: the charter scopes this topic as the phasor bridge, and 5.1 back-links to both 4.2 and 1.8. | `'transmission-lines'` `5.2→5.3`, `'line-impedance'` `5.3→5.4`, `'transients'` `5.4→5.5` |

Verified gap statement (grep at `f76b904`): the charter's "hint asides like 'E ⊥ dA → zero'" do not exist — a case-insensitive grep finds **zero** occurrences of "dot product" anywhere in `src/` and "line integral" nowhere at all; "cross product" is named exactly once (`lorentz/index.tsx:428`). The gap is *larger* than the charter claimed, which strengthens the standalone-section decision.

## Decision #2 — Domain per section

*(Rationale section — binding choices, no direct action items.)*

- **`math-vectors`, `math-integrals` → `domain: 'em'`.** Placement argues against the `'circuits'` default: they teach inside Part 2 among em sections, and the em toolchain is exactly what they need — `SectionLayout` is em-domain-only, LabLayout `leadWithBench` + `useSelfMeasuringCanvas` is the Part-2 house look, and the notation being taught is the em EquationBox notation. Accepted costs, made explicit: a `MODULES` entry each in `src/em/constants/physics.ts` (label/description must match curriculum title/subtitle verbatim), `EM_SECTION_IDS` extension in `sectionSubtitles.test.ts` (10 → 12), `subtitle` fields in curriculum.ts, and em `sectionAnchors.test.tsx` CASES entries.
- **`math-phasors` → `domain: 'transmission'`.** All of its consumers are transmission sections; co-locating code with consumers follows the transformers/antennas cross-domain precedent (curriculum.ts:11-14 — "domain records where the CODE lives; Part membership records where it TEACHES"). The `'circuits'` default (laplace-theory/partial-fractions precedent) is rejected because that precedent is circuits-math-in-a-circuits-Part; nothing in Part 1 consumes the phasor bridge. It also reuses transmission's existing `{ real, imag }` complex-pair shape (`calculateComplexReflectionCoefficient`).
- **No new `Domain` union value.** A `'math'` domain would cost a new `src/math/` folder + `vite.config.ts` alias (and the inline vitest config) + mirrored `tsconfig.app.json` paths for three sections that fit existing domains. Rejected.

## Global Constraints

- **Precondition:** clean `main` at or after `f76b904`. Start: `git checkout main && git pull && git checkout -b feat/math-prereqs`. Feature branch → PR; direct pushes to `main` are blocked.
- **Machine (home-desktop):** unit tests ALWAYS `npx vitest run --no-file-parallelism [path]` from INSIDE the repo (default fork pool OOMs this box). Full serial suite ≈ 9 min at this size.
- **Gates before PR (ALL green, executed output shown):** `npm run build` (tsc -b + vite build — this IS the typecheck) · `npm run lint` · `npx vitest run --no-file-parallelism` · `npm run e2e` (×3 projects: desktop / mobile / desktop-hidpi, workers=2, port 4273). Baseline 782+ tests / 107+ files at `f76b904`; counts only grow. Close with `Tested: [...]. Not tested: [...] because [...]`.
- **Notation:** invoke the `em-ca-textbook-conventions` skill BEFORE authoring any formula string. Resolved for this plan: `j` never `i` for the imaginary unit; cosine-reference phasors (hard rule 2 — `v(t) = V_m cos(ωt + φ)` before any phasor conversion); Nilsson for circuit-phasor typography (`\mathbf{V}`), Ulaby EM primary, Ida secondary; θ for the inter-vector angle; ω angular frequency, φ phase. **One deliberate deviation, documented here:** the flux element is written `d\vec{A}` (not Ulaby's `dS`) because the shipped gauss/ampere EquationBoxes already use `\oint \vec{E} \cdot d\vec{A}` / `\oint \vec{B} \cdot d\vec{l}` — the new sections teach the notation the app actually displays; app-wide consistency beats textbook purity, and the plan never mixes both in one section.
- **KaTeX backslash contract** (guard test scans all source): in a JSX *attribute*, single backslash (`formula="\vec{A}"`); in a JS string/template literal, double (`'\\vec{A}'`). Never violate.
- **Audit-alignment for every new section** (2026-07-03 audit §D/§E): 3–5 labeled chunks, ≤3 learning goals, ONE PredictionGate per sim (anti-overlock), concept checks at the END of derivations, secondary derivations default-collapsed, and `expectedChecks: 3` with ≥3 identity-keyed wired checks each (satisfies roadmap #3's guard `expectedChecks ≤ wired checks`; no new section ships the complete-on-first-visit ceiling — this plan has NO `expectedChecks: 0` section to justify). No hardcoded section numbers in prose — always `{getSectionNumber('<id>')}` interpolation.
- **DO NOT TOUCH:**
  - The existing gauss/ampere EquationBox strings and maxwell's differential-form MathWrapper formulas (`gauss/index.tsx:318`, `ampere/index.tsx:445`, `maxwell/index.tsx:546-574`) — the new sections teach them; consumers stay byte-identical except the four additive seam sentences in Task 10 (plain prose, no formula attributes).
  - Every string pinned by `phaseUnits.test.tsx` and `circularHintConvention.test.ts`; all em-wave sim internals (no forward-link edit there — see out-of-scope).
  - `PART_QUANTITIES` / `PART_SUMMARIES` / `PART_TRACES` / the `--color-part-N` tokens in `src/index.css` / the `theme-tokens.test.ts` loop / the MobileTabBar & Sidebar 5-chip pins — no new Part exists in this plan.
  - The 9 `getSectionNumber.test.ts` literals NOT named for re-pin (1.1, 1.3, 1.4, 1.5, 1.7, 1.9, 3.3, 3.4, 4.4). Only the four named re-pins (coulomb, transmission-lines, line-impedance, transients) may change, in their named tasks.
  - Existing `MIN_CANVAS_H` / `MIN_CANVAS_W` baselines and `DPR_MIGRATED` ids in `e2e/sim-paint.spec.ts` — add entries, never lower or remove; never relax a pin to make a regression pass.
  - `expectedChecks` of EXISTING sections (raising transformers etc. is audit roadmap #3's job, not this plan's).
  - `circuitSolver.ts` / `transmissionMath.ts` existing exports; `PartialFractions/`, `LaplaceTheory.tsx`, `gauss/index.tsx` (templates — copy patterns, zero edits).
- **Conventional commits** with scope, one per task. PR via the GitHub REST API (no gh CLI — token via `git credential fill`, NEVER printed; UTF-8 JSON payload FILE in the session scratchpad). Single PR, no stack.
- **Release note (SW/PWA):** vite-plugin-pwa `autoUpdate` means returning students see the OLD shell (without the new sections) until their next visit's SW activation — mention in the PR body.
- Line numbers in this plan were verified 2026-07-04 at HEAD `f76b904`; re-locate by CONTENT if drifted.

---

### Task 1: `math-vectors` pure physics module (TDD)

**Files:**
- Create: `src/em/sections/math-vectors/physics.ts`
- Test: `src/em/sections/math-vectors/__tests__/vectorPhysics.test.ts` (sibling-`__tests__` pattern, like `coulomb/__tests__/coulombSim.test.ts`)

**Interfaces:**
- Consumes: nothing (pure module, no React).
- Produces: `interface Vec2 { x: number; y: number }`; `vecFromPolarDeg(mag: number, angleDeg: number): Vec2`; `magnitude(a: Vec2): number`; `vadd(a: Vec2, b: Vec2): Vec2` (componentwise sum — the bench's Add mode and coulomb's superposition run on it); `dot2(a: Vec2, b: Vec2): number`; `cross2z(a: Vec2, b: Vec2): number` (z-component of the cross product of two in-plane vectors — sign = out of / into the screen); `angleBetweenDeg(a: Vec2, b: Vec2): number`; `projectionLength(b: Vec2, ontoA: Vec2): number` (signed |B|cosθ). Task 2's bench consumes all of these.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  dot2, cross2z, angleBetweenDeg, projectionLength, vecFromPolarDeg, magnitude, vadd,
} from '@em/sections/math-vectors/physics';

/**
 * Hand-derived vectors (magneticCircuits.test.ts style). These are the same
 * numbers the section's ConceptChecks and YourTurnPanel quote — if a formula
 * card and this module ever disagree, the mirror fails here, not on a student.
 */
describe('math-vectors physics (hand-derived)', () => {
  it('dot2: (3,4)·(−2,1) = −2; orthogonal pair gives exactly 0', () => {
    expect(dot2({ x: 3, y: 4 }, { x: -2, y: 1 })).toBe(-2);
    expect(dot2({ x: 1, y: 0 }, { x: 0, y: 5 })).toBe(0);
  });
  it('dot2 equals |A||B|cosθ on a non-axis pair (2∠0°, 3∠60° → 3)', () => {
    const a = vecFromPolarDeg(2, 0);
    const b = vecFromPolarDeg(3, 60);
    expect(dot2(a, b)).toBeCloseTo(2 * 3 * Math.cos(Math.PI / 3), 12);
  });
  it('cross2z: x̂×ŷ = +1 (out of screen, RH rule), ŷ×x̂ = −1, parallel → 0', () => {
    expect(cross2z({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(cross2z({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
    expect(cross2z({ x: 2, y: 0 }, { x: 3, y: 0 })).toBe(0);
  });
  it('|cross2z| equals |A||B|sinθ at θ = 120° (2∠0°, 1.5∠120°)', () => {
    const a = vecFromPolarDeg(2, 0);
    const b = vecFromPolarDeg(1.5, 120);
    expect(cross2z(a, b)).toBeCloseTo(2 * 1.5 * Math.sin((2 * Math.PI) / 3), 12);
  });
  it('angleBetweenDeg: 90 orthogonal, 180 antiparallel, 0 parallel', () => {
    expect(angleBetweenDeg({ x: 1, y: 0 }, { x: 0, y: 2 })).toBeCloseTo(90, 9);
    expect(angleBetweenDeg({ x: 1, y: 0 }, { x: -3, y: 0 })).toBeCloseTo(180, 9);
    expect(angleBetweenDeg({ x: 2, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(0, 9);
  });
  it('projectionLength is signed |B|cosθ: 2∠120° onto x̂ → −1', () => {
    expect(projectionLength(vecFromPolarDeg(2, 120), { x: 1, y: 0 })).toBeCloseTo(-1, 9);
    expect(magnitude({ x: 3, y: 4 })).toBe(5);
  });
  it('vadd is componentwise: (3,4)+(−2,1) = (1,5); two equal right-angle pushes → √2 × one push', () => {
    expect(vadd({ x: 3, y: 4 }, { x: -2, y: 1 })).toEqual({ x: 1, y: 5 });
    expect(magnitude(vadd({ x: 1, y: 0 }, { x: 0, y: 1 }))).toBeCloseTo(Math.SQRT2, 12);
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/math-vectors/__tests__/vectorPhysics.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement the module**

```ts
// Pure vector-product math for the math-vectors section (2.1). No React.
// Convention: in-plane vectors; cross2z returns the ẑ-component, so its SIGN
// is the out-of-screen (+) / into-screen (−) direction of A×B (RH rule).

export interface Vec2 {
  x: number;
  y: number;
}

export function vecFromPolarDeg(mag: number, angleDeg: number): Vec2 {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) };
}

export function magnitude(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function vadd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function cross2z(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function angleBetweenDeg(a: Vec2, b: Vec2): number {
  const cos = dot2(a, b) / (magnitude(a) * magnitude(b));
  // clamp against float drift before acos
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

/** Signed length of the projection of b onto the direction of ontoA: |b|cosθ. */
export function projectionLength(b: Vec2, ontoA: Vec2): number {
  return dot2(b, ontoA) / magnitude(ontoA);
}
```

- [ ] **Step 4: Run to verify PASS** — same command, ALL PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-vectors): pure vector-product physics module with hand-derived vectors"`

---

### Task 2: `math-vectors` section component — predict-first dot/cross bench

**Files:**
- Create: `src/em/sections/math-vectors/index.tsx` (named exports `MathVectorsSection`, `Q_CROSS_DIR`, `Q_QE_DIR`)
- Test: `src/em/sections/__tests__/sections.test.tsx` (extend — append two `it`s inside the existing describe, reusing its `renderSection` helper and katex mock)
- Test: `src/em/sections/__tests__/sectionAnchors.test.tsx` (extend — import + one `CASES` entry)
- Test: `src/__tests__/concept-check-directions.test.ts` (extend — two `CASES` entries)

**Interfaces:**
- Consumes: everything Task 1 produces; `SectionLayout` (`@em/components/common/section/SectionLayout`, props `sectionId/hook/toc`), `LabLayout` (`@shared/components/common/LabLayout`, `leadWithBench` + `theory`/`bench`), `useSelfMeasuringCanvas` (`@shared/hooks/useSelfMeasuringCanvas` — `prepareFrame()` self-measures + DPR; returns `null` while the gate hides the canvas: early-return but KEEP the rAF loop scheduled, exactly the gauss pattern at `gauss/index.tsx:152-161`), `PredictionGate`/`ConceptCheck`/`WorkedSteps`/`YourTurnPanel`/`GuidedChallenge`/`MathWrapper`/`SectionAnchor` from `@shared/components/common|scrollspy`, `EquationBox`/`ControlPanel`/`Slider` from `@em/components/common/`, `useProgressStore` (`markPredictionGate`, `incrementConceptChecks`, `incrementHints`).
- Produces: `export function MathVectorsSection()` (Task 3's registry entry loads it); exported check consts `Q_CROSS_DIR`, `Q_QE_DIR` (the directions guard imports them). Bench readout test-ids `dot-readout` / `cross-readout` / `add-readout`.

- [ ] **Step 1: Write the failing tests.** Append to `src/em/sections/__tests__/sections.test.tsx`, matching that file's idiom — every existing `it` imports its section DYNAMICALLY inside the test body (the file has no top-of-file section imports). Do NOT assert on the `h1`: SectionLayout sources its heading from `SECTIONS[sectionId]` (`SectionLayout.tsx:54` — `title ?? section?.title ?? ''`), and `'math-vectors'` only joins SECTIONS in Task 3, so the title does not exist yet; assert curriculum-independent markers instead:

```tsx
  it('MathVectorsSection renders', async () => {
    const { MathVectorsSection } = await import('@em/sections/math-vectors/index');
    renderSection(MathVectorsSection);
    // Curriculum-independent marker: the SectionHook block renders regardless of
    // spine wiring (the h1 title arrives only with the Task 3 curriculum entry).
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('MathVectorsSection gates the sim behind a Predict First prediction', async () => {
    const { MathVectorsSection } = await import('@em/sections/math-vectors/index');
    const { container } = renderSection(MathVectorsSection);
    // Exact string, NOT a regex: /predict first/i multi-matches PredictionGate's
    // brow ('BENCH · PREDICT FIRST · ARMED'), status ('LOCKED · PREDICT FIRST'),
    // and body <p> and throws — the coulomb idiom is getByText('Predict First').
    expect(screen.getByText('Predict First')).toBeInTheDocument();
    expect(screen.getByText(/what is the SIGN of A·B/i)).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull(); // bench stays gated
  });
```

Append to `sectionAnchors.test.tsx` (import `MathVectorsSection` with the others, then in `CASES` after the magnetic-circuits row):

```tsx
  { name: 'math-vectors', Section: MathVectorsSection, anchors: ['math-vectors-products-sim', 'math-vectors-concept-checks', 'math-vectors-theory', 'math-vectors-challenge'] },
```

Append to `concept-check-directions.test.ts` `CASES` (import `{ Q_CROSS_DIR, Q_QE_DIR } from '@em/sections/math-vectors/index';`):

```ts
  { name: 'math-vectors · Q_CROSS_DIR (x̂×ŷ out of the screen)', cc: Q_CROSS_DIR, term: /out of the screen/i, exclude: null },
  { name: 'math-vectors · Q_QE_DIR (F = qE on an electron)', cc: Q_QE_DIR, term: /−x|-x/, exclude: null },
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/__tests__ src/__tests__/concept-check-directions.test.ts` → RED in this exact shape: the two new `sections.test.tsx` its fail individually (dynamic import unresolved), while `sectionAnchors.test.tsx` and `concept-check-directions.test.ts` fail WHOLESALE at collection (their new top-of-file static imports don't resolve yet). That wholesale collection failure is the expected RED, not an environment problem — all three files go green in Step 4.
- [ ] **Step 3: Implement the section.** Full component (`src/em/sections/math-vectors/index.tsx`). Content contract: 4 labeled chunks (bench / checks / theory / challenge), 3 learning goals (linear combination = add tip-to-tail, stretch, flip; dot = projection; cross = area + RH direction), ONE gate, THREE bench modes (Dot / Cross / Add — Add exists because coulomb's first real need at 2.2 is superposition of force vectors). The two multiple-choice checks are typed `QuizQuestion` (`src/em/types/index.ts:27-34` — note `hints` is `QuizHint[]`: `{ tier: 1|2|3; label: string; content: string }` objects, NOT `string[]`; lenz's `Q_RING_DIR` is the model) and render through `toConceptCheck` from `@em/components/common/section/quizAdapter` the way gauss's checks do — content below is normative:

```tsx
import { useEffect, useRef, useState } from 'react';
import { SectionLayout } from '@em/components/common/section/SectionLayout';
import { LabLayout } from '@shared/components/common/LabLayout';
import { EquationBox } from '@em/components/common/EquationBox';
import { ControlPanel } from '@em/components/common/ControlPanel';
import { Slider } from '@em/components/common/Slider';
import { toConceptCheck } from '@em/components/common/section/quizAdapter';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { WorkedSteps } from '@shared/components/common/WorkedSteps';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { SectionAnchor } from '@shared/components/scrollspy/SectionAnchor';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
import { useProgressStore, useThemeStore } from '@shared/store/progressStore';
import type { QuizQuestion } from '@em/types';
import { dot2, cross2z, angleBetweenDeg, projectionLength, vecFromPolarDeg, vadd, magnitude } from './physics';

// Exported for the concept-check-directions guard (CASES imports these directly).
// eslint-disable-next-line react-refresh/only-export-components
export const Q_CROSS_DIR: QuizQuestion = {
  question: 'A points along +x, B points along +y, both in the screen plane. Which direction is A×B?',
  options: ['Out of the screen', 'Into the screen', 'Along +x', 'Along −y'],
  correctIndex: 0,
  explanation: 'Right-hand rule: fingers sweep from A (+x) toward B (+y), thumb points out of the screen — x̂×ŷ = ẑ. This is the same triad em-wave uses for E, B, and k.',
  hints: [
    { tier: 1, label: 'Nudge', content: 'Point your right-hand fingers along A, curl them toward B — where does your thumb aim?' },
    { tier: 2, label: 'Conceptual hint', content: 'The cross product is perpendicular to BOTH inputs — in the screen plane, only two candidates survive.' },
    { tier: 3, label: 'Worked step', content: 'x̂×ŷ = ẑ is the defining right-handed orientation, and ẑ is out of the screen here.' },
  ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const Q_QE_DIR: QuizQuestion = {
  question: 'The electric field at a point aims along +x. Which direction is the force on an electron there?',
  options: ['Along −x', 'Along +x', 'Zero — electrons only feel magnetic forces', 'Along +y'],
  correctIndex: 0,
  explanation: 'F = qE is a scalar times a vector: the magnitude scales by |q|, and a NEGATIVE scalar flips the direction. The electron (q < 0) is pushed opposite E, along −x.',
  hints: [
    { tier: 1, label: 'Nudge', content: 'F = qE. What sign is q for an electron?' },
    { tier: 2, label: 'Conceptual hint', content: 'Multiplying a vector by a negative scalar reverses its direction.' },
  ],
};

const Q_DOT_ZERO = {
  question: 'Slide B around A on the bench: at exactly what angle between them is A·B zero — and what does the projection picture say at that angle?',
  answer: '90°. The projection of B onto A has zero length there — B spends none of itself along A. That is why "E ⊥ dA" will kill flux terms when you reach Gauss’s law.',
  hints: [
    'Watch the dashed projection segment as θ crosses 90°.',
    'A·B = |A||B|cosθ — which factor can be zero when neither length is?',
  ],
};

const Q_ADD = {
  question: 'Two equal-strength repulsive pushes act on a charge, at right angles to each other. Compared with ONE push alone, how strong is the net push, and where does it point?',
  answer: '√2 ≈ 1.41 times one push, pointing along the diagonal between the two. Vectors add tip-to-tail (componentwise), not by adding magnitudes — magnitude-adding would wrongly give 2×. Check it on the bench’s Add mode with |B| = 2 at 90°. This is exactly how two Coulomb forces combine in the next section.',
  hints: [
    'Draw the two pushes tip-to-tail — what triangle do you get?',
    'Add components: (F, 0) + (0, F) = (F, F). How long is that?',
  ],
};

const CHALLENGE = {
  title: 'Where the two products trade places',
  description: 'A is fixed at 2 units along +x. Use the bench to find the angle where the dot readout A·B and the signed cross readout (A×B)·ẑ are exactly equal.',
  instructions: [
    'Set |B| = 1.5 and sweep the angle slider slowly from 0° to 90°, toggling between the Dot and Cross readouts as you go.',
    'A·B falls as (A×B)·ẑ grows — find the crossing angle, then check it against tanθ = 1.',
    'Now set 225° — verify the two readouts are equal there too, and BOTH negative.',
    'Why can the cross-product MAGNITUDE |A×B| never equal a negative dot product? (That is why the bench shows you the signed ẑ-component.)',
  ],
  hint: 'A·B ∝ cosθ and (A×B)·ẑ ∝ sinθ — equal where tanθ = 1: 45° and 225°. At 225° both are −2.12; the magnitude |A×B| would be +2.12.',
};

const TOC = [
  { id: 'math-vectors-products-sim', label: 'Lab: Two-Arrow Bench' },
  { id: 'math-vectors-concept-checks', label: 'Concept Checks' },
  { id: 'math-vectors-theory', label: 'Theory: The Two Products' },
  { id: 'math-vectors-challenge', label: 'Guided Challenge' },
];

const A = vecFromPolarDeg(2, 0); // fixed reference arrow, 2 units along +x

// One epsilon for BOTH the canvas marker and the readout, so the two surfaces
// can never disagree about "parallel" (vecFromPolarDeg(m, 180) gives y ≈ +1e-16).
const CROSS_EPS = 1e-9;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, v: { x: number; y: number }, scale: number,
  color: string, label: string,
) {
  const tx = cx + v.x * scale;
  const ty = cy - v.y * scale; // canvas y is down; math y is up
  const ang = Math.atan2(cy - ty, tx - cx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.beginPath(); // arrowhead
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - 10 * Math.cos(ang - 0.4), ty + 10 * Math.sin(ang - 0.4));
  ctx.lineTo(tx - 10 * Math.cos(ang + 0.4), ty + 10 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 14px monospace';
  ctx.fillText(label, tx + 8, ty - 8);
}

export function MathVectorsSection() {
  const [mode, setMode] = useState<'dot' | 'cross' | 'add'>('dot');
  const [bMag, setBMag] = useState(1.5);
  const [bAngle, setBAngle] = useState(120);
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
  const animationRef = useRef(0);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  // Theme-aware canvas (audit C-02 defect class: hardcoded hexes go illegible in
  // dark mode) — the em house pattern; coulomb does the same. If COLORS/COLORS_DARK
  // in @em/constants/physics already provide these roles, use them instead of literals.
  const isDarkMode = useThemeStore((s) => s.theme) === 'dark';

  const b = vecFromPolarDeg(bMag, bAngle);

  useEffect(() => {
    const colAxis = isDarkMode ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.35)';
    const colDrop = isDarkMode ? '#94a3b8' : '#64748b';
    const colMark = isDarkMode ? '#94a3b8' : '#475569';
    const colA = isDarkMode ? '#f87171' : '#dc2626';
    const colB = isDarkMode ? '#60a5fa' : '#2563eb';
    const colPos = isDarkMode ? '#34d399' : '#059669';
    const colNeg = isDarkMode ? '#f87171' : '#dc2626';
    const render = () => {
      const frame = prepareFrame();
      if (!frame) {
        // Canvas hidden behind the gate: keep the loop alive (gauss pattern).
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      const cx = width / 2;
      const cy = height / 2;
      // Add mode draws A+B (up to 5 units) — widen the world so it never clips.
      const scale = Math.min(width, height) / (mode === 'add' ? 11 : 8);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = colAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
      ctx.stroke();
      const bv = vecFromPolarDeg(bMag, bAngle);
      if (mode === 'dot') {
        // dashed drop from B's tip onto the A line + bold signed projection
        const p = projectionLength(bv, A);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = colDrop;
        ctx.beginPath();
        ctx.moveTo(cx + bv.x * scale, cy - bv.y * scale);
        ctx.lineTo(cx + p * scale, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = p >= 0 ? colPos : colNeg;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + p * scale, cy);
        ctx.stroke();
      } else if (mode === 'cross') {
        // parallelogram spanned by A and B; ⊙/⊗ marker for A×B direction
        const z = cross2z(A, bv);
        const zEff = Math.abs(z) < CROSS_EPS ? 0 : z;
        ctx.fillStyle = zEff >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + A.x * scale, cy - A.y * scale);
        ctx.lineTo(cx + (A.x + bv.x) * scale, cy - (A.y + bv.y) * scale);
        ctx.lineTo(cx + bv.x * scale, cy - bv.y * scale);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colMark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, 2 * Math.PI);
        ctx.stroke();
        if (zEff === 0) {
          // parallel vectors: no direction to mark
        } else if (zEff > 0) {
          ctx.beginPath(); // ⊙ out of screen
          ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
          ctx.fillStyle = colMark;
          ctx.fill();
        } else {
          ctx.beginPath(); // ⊗ into screen
          ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6);
          ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6);
          ctx.stroke();
        }
      } else {
        // Add: ghost copy of B re-rooted at A's tip (tip-to-tail), then the resultant
        const r = vadd(A, bv);
        ctx.setLineDash([6, 4]);
        drawArrow(ctx, cx + A.x * scale, cy - A.y * scale, bv, scale, colDrop, '');
        ctx.setLineDash([]);
        drawArrow(ctx, cx, cy, r, scale, colPos, 'A+B');
      }
      drawArrow(ctx, cx, cy, A, scale, colA, 'A');
      drawArrow(ctx, cx, cy, bv, scale, colB, 'B');
      animationRef.current = requestAnimationFrame(render);
    };
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [prepareFrame, bMag, bAngle, mode, isDarkMode]);

  const bench = (
    <SectionAnchor id="math-vectors-products-sim" label="Lab: Two-Arrow Bench" className="scroll-mt-4">
      <PredictionGate
        question="A is fixed along +x. You swing B to 120° away from A — past the perpendicular. Without computing: what is the SIGN of A·B there?"
        options={[
          { id: 'neg', label: 'Negative' },
          { id: 'zero', label: 'Exactly zero' },
          { id: 'pos', label: 'Still positive' },
        ]}
        getCorrectAnswer={() => 'neg'}
        explanation={<span>A·B = |A||B|cosθ, and cos120° &lt; 0. Geometrically: past 90° the projection of B onto A points <em>backwards</em> along A — B spends part of itself opposing A.</span>}
        onPredict={(correct) => markPredictionGate('math-vectors', correct)}
      >
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Vector bench: arrows A and B with the dot-product projection, cross-product parallelogram and out/into-screen marker, or the tip-to-tail resultant, depending on mode"
            className="w-full h-[300px] rounded-md bg-white dark:bg-slate-900"
          />
          <ControlPanel title="Vector Controls">
            <div className="flex gap-2" role="group" aria-label="Bench mode">
              {([['dot', 'Dot A·B'], ['cross', 'Cross A×B'], ['add', 'Add A+B']] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`px-3 py-1 rounded border text-sm ${mode === m
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Slider label="B angle from A (°)" value={bAngle} min={0} max={360} step={5} onChange={setBAngle} />
            <Slider label="|B|" value={bMag} min={0.5} max={3} step={0.1} onChange={setBMag} />
          </ControlPanel>
          {mode === 'dot' && (
            <p className="font-mono text-sm" data-testid="dot-readout">
              A·B = |A||B|cosθ = 2 × {bMag.toFixed(1)} × cos({angleBetweenDeg(A, b).toFixed(0)}°) = {dot2(A, b).toFixed(2)}
            </p>
          )}
          {mode === 'cross' && (() => {
            const z = cross2z(A, b);
            const zEff = Math.abs(z) < CROSS_EPS ? 0 : z; // same epsilon as the canvas marker
            return (
              <p className="font-mono text-sm" data-testid="cross-readout">
                (A×B)·ẑ = {zEff.toFixed(2)} — {zEff > 0 ? 'out of the screen ⊙' : zEff < 0 ? 'into the screen ⊗' : 'zero (parallel)'}
              </p>
            );
          })()}
          {mode === 'add' && (
            <p className="font-mono text-sm" data-testid="add-readout">
              A+B = ({vadd(A, b).x.toFixed(2)}, {vadd(A, b).y.toFixed(2)}), |A+B| = {magnitude(vadd(A, b)).toFixed(2)}
            </p>
          )}
        </div>
      </PredictionGate>
    </SectionAnchor>
  );

  const theory = (
    <>
      <SectionAnchor id="math-vectors-concept-checks" label="Concept Checks" className="scroll-mt-4">
        <div className="space-y-4">
          <ConceptCheck data={toConceptCheck(Q_CROSS_DIR)} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_DOT_ZERO.question, answer: Q_DOT_ZERO.answer, hints: Q_DOT_ZERO.hints }} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          <ConceptCheck data={toConceptCheck(Q_QE_DIR)} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
          {/* 4 wired checks ≥ expectedChecks: 3 — audit roadmap #3 guard satisfied */}
          <ConceptCheck data={{ mode: 'predict-reveal', question: Q_ADD.question, answer: Q_ADD.answer, hints: Q_ADD.hints }} onComplete={() => incrementConceptChecks('math-vectors')} onHint={() => incrementHints('math-vectors')} />
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-vectors-theory" label="Theory: The Two Products" className="scroll-mt-4">
        <div className="space-y-4">
          <EquationBox
            title="The two ways vectors multiply"
            equations={[
              { label: 'Anatomy of a vector', math: '\\vec{A} = A_x\\hat{x} + A_y\\hat{y},\\quad |\\vec{A}| = \\sqrt{A_x^2 + A_y^2}\\quad (\\hat{x}: \\text{a length-1 direction marker})' },
              { label: 'Addition (tip-to-tail)', math: '\\vec{A} + \\vec{B} = (A_x + B_x)\\,\\hat{x} + (A_y + B_y)\\,\\hat{y}', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Dot (projection)', math: '\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta = A_x B_x + A_y B_y + A_z B_z', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Cross (area + axis)', math: '|\\vec{A} \\times \\vec{B}| = |\\vec{A}||\\vec{B}|\\sin\\theta', color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Cross, component form (in-plane)', math: '(\\vec{A} \\times \\vec{B})_z = A_x B_y - A_y B_x', color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Right-handed triad', math: '\\hat{x} \\times \\hat{y} = \\hat{z},\\quad \\hat{y} \\times \\hat{z} = \\hat{x},\\quad \\hat{z} \\times \\hat{x} = \\hat{y}' },
              { label: 'Scalar × vector', math: '\\vec{F} = q\\vec{E} \\;\\;(q < 0 \\text{ flips the direction})' },
            ]}
          />
          <WorkedSteps
            tryFirstPrompt="Compute A·B for the gate's setup (A = 2x̂, B at 120°, |B| = 1.5) before revealing."
            steps={[
              {
                title: 'Step 1 — Components from the polar form',
                body: (
                  <>
                    <p className="mb-2">B at 120° with length 1.5:</p>
                    <MathWrapper formula="\vec{B} = 1.5(\cos 120^{\circ}\,\hat{x} + \sin 120^{\circ}\,\hat{y}) = -0.75\,\hat{x} + 1.30\,\hat{y}" block />
                  </>
                ),
              },
              {
                title: 'Step 2 — Multiply matching components and add',
                body: <MathWrapper formula="\vec{A} \cdot \vec{B} = (2)(-0.75) + (0)(1.30) = -1.5" block />,
              },
              {
                title: 'Step 3 — Cross-check against the projection picture',
                body: (
                  <p>
                    |A||B|cos120° = 2 × 1.5 × (−0.5) = −1.5. Same number, two routes: components when you have coordinates, projection when you have geometry. The bench readout shows both at once.
                  </p>
                ),
              },
            ]}
          />
          <YourTurnPanel
            scenario="A field-mapping bench hands you A = 3x̂ + 4ŷ and B = −2x̂ + 1ŷ (units of field × meters)."
            question="What is A·B?"
            options={[
              { text: '−2', correct: true, explanation: 'Correct: (3)(−2) + (4)(1) = −6 + 4 = −2. Obtuse pair — the projection opposes A.' },
              { text: '+10', correct: false, explanation: 'You dropped the minus sign on (3)(−2) — component products keep their signs: −6 + 4 = −2, not 6 + 4.' },
              { text: '−10', correct: false, explanation: 'You flipped the sign of (4)(1); only the x-term is negative: −6 + 4 = −2, not −6 − 4.' },
              { text: '+2', correct: false, explanation: 'Watch the sign of (3)(−2).' },
            ]}
            correctReveal={
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <MathWrapper formula="\vec{A} \cdot \vec{B} = (3)(-2) + (4)(1) = -2" block />
                <p>Negative dot product ⇒ the angle between them is obtuse — check it: cosθ = −2/(5·√5) ⇒ θ ≈ 100°.</p>
              </div>
            }
          />
        </div>
      </SectionAnchor>
      <SectionAnchor id="math-vectors-challenge" label="Guided Challenge" className="scroll-mt-4">
        <GuidedChallenge challenge={CHALLENGE} />
      </SectionAnchor>
    </>
  );

  return (
    <SectionLayout
      sectionId="math-vectors"
      hook="A solar panel tilted 60° away from facing the sun loses half its power; a motor's torque peaks when the coil face lies parallel to the field. Both facts are one small algebra away — and the whole of Part 2 speaks it."
      toc={TOC}
    >
      <LabLayout leadWithBench theory={theory} bench={bench} />
    </SectionLayout>
  );
}
```

KaTeX contract check: `equations` array entries are JS strings → `\\`; `MathWrapper formula="…"` JSX attributes → single `\`. Both used exactly as shown above.

- [ ] **Step 4: Run to verify PASS** — `npx vitest run --no-file-parallelism src/em/sections/math-vectors src/em/sections/__tests__ src/__tests__/concept-check-directions.test.ts src/__tests__/no-katex-double-backslash.test.ts` → ALL PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-vectors): Vector Toolkit section — predict-first dot/cross bench"`

---

### Task 3: Wire `math-vectors` into the spine as 2.1 (25 → 26 sections)

**Files:**
- Modify: `src/shared/constants/curriculum.ts:78-79` (SECTION_LIST — new entry directly above coulomb) and `:116` (`PARTS[1].sectionIds`)
- Modify: `src/sectionRegistry.tsx:39` region (new lazyRetry entry above coulomb's)
- Modify: `src/em/constants/physics.ts` (MODULES — new entry above coulomb's at `:73`; extend the existing lucide-react import with `ArrowUpRight`)
- Modify: `src/shared/constants/__tests__/curriculum.test.ts:18-20` (25→26 + it-name), `:49` (25→26), `:101-108` (expectedChecks — add pin + rename it), `:124-150` (simHeavy 16→17 + list)
- Modify: `src/shared/constants/__tests__/getSectionNumber.test.ts:12` (coulomb `'2.1'`→`'2.2'`, add `math-vectors` → `'2.1'`)
- Modify: `src/shared/constants/__tests__/sectionSubtitles.test.ts:14-25` (`EM_SECTION_IDS` + `'math-vectors'`)
- Modify: `src/shared/components/__tests__/CourseLanding.test.tsx:45` (`section-count-2` `'4 sections'`→`'5 sections'`) and `:64` (`start-part-2` href `'/coulomb'`→`'/math-vectors'` — the Start-Part CTA derives from `PARTS[1].sectionIds[0]`)
- Modify: `e2e/sim-paint.spec.ts:19` (`DPR_MIGRATED` + `'math-vectors'`), `:24-28` (`EXPECT_CANVAS`), `:39-45` (`MIN_CANVAS_H`), `:54-73` (`MIN_CANVAS_W`)

**Interfaces:**
- Consumes: `MathVectorsSection` (Task 2).
- Produces: section id `'math-vectors'` reachable at route `/math-vectors` as section 2.1; `routeIntegrity.test.ts` passes with the new registry key.

- [ ] **Step 1: Re-pin the guard tests FIRST (failing against current curriculum).** In `curriculum.test.ts`: it-name `'covers all 25 sections'` → `'covers all 26 sections'`, both `toHaveLength(25)` → `26`; simHeavy it-name `'exactly 16 sections'` → `'exactly 17 sections'`, `toHaveLength(16)` → `17`, insert `'math-vectors',` into the pinned id array at its sorted position (between `'magnetic-circuits'` and `'maxwell'` — the assertion `.sort()`s both sides, but keep the literal pre-sorted, house style); in the expectedChecks it (rename to `'expectedChecks: EM fundamentals and the math sections carry per-section targets, everything else 0'`) add:

```ts
    expect(getExpectedChecks('math-vectors')).toBe(3);
```

In `getSectionNumber.test.ts`:

```ts
    expect(getSectionNumber('math-vectors')).toBe('2.1');
    expect(getSectionNumber('coulomb')).toBe('2.2');
```

In `sectionSubtitles.test.ts` add `'math-vectors',` as the first entry of `EM_SECTION_IDS`. In `CourseLanding.test.tsx`: `:45` `'4 sections'` → `'5 sections'`, and `:64` re-pin the Start-Part CTA — `expect(getByTestId('start-part-2')).toHaveAttribute('href', '/math-vectors');` (the CTA links `PARTS[1].sectionIds[0]`, which this task changes).

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx src/__tests__/routeIntegrity.test.ts` → the edited pins FAIL; routeIntegrity still green (nothing added yet).
- [ ] **Step 3: Wire the section.** `curriculum.ts` SECTION_LIST, directly above the coulomb entry:

```ts
  { id: 'math-vectors', title: 'Vector Toolkit', subtitle: 'Dot and cross products — projection, rotation, and the right-hand rule', route: '/math-vectors', domain: 'em', expectedChecks: 3, simHeavy: true },
```

`PARTS[1].sectionIds`:

```ts
    sectionIds: ['math-vectors', 'coulomb', 'gauss', 'ampere', 'lorentz'],
```

`sectionRegistry.tsx`, above the coulomb loader (named-export re-wrap, em directory-import pattern):

```ts
  'math-vectors': lazyRetry(() => import('@em/sections/math-vectors').then((m) => ({ default: m.MathVectorsSection }))),
```

`src/em/constants/physics.ts` MODULES, above the coulomb entry (label/description MUST equal the curriculum title/subtitle byte-for-byte — `sectionSubtitles.test.ts` pins it):

```ts
  {
    id: 'math-vectors',
    path: '/math-vectors',
    label: 'Vector Toolkit',
    shortLabel: 'Vectors',
    icon: ArrowUpRight,
    description: 'Dot and cross products — projection, rotation, and the right-hand rule',
    track: 'electrostatics',
  },
```

- [ ] **Step 4: Run to verify PASS** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx src/__tests__/routeIntegrity.test.ts src/__tests__/app.test.tsx` → ALL PASS.
- [ ] **Step 5: Extend the e2e tables** (deliberate opt-ins; the per-route walk itself derives from `ALL_SECTIONS` — zero further edits). In `e2e/sim-paint.spec.ts`: add `'math-vectors'` to `DPR_MIGRATED` (the sim uses `useSelfMeasuringCanvas` from day one) and to `EXPECT_CANVAS`; add `'math-vectors': 238` to `MIN_CANVAS_H` and `'math-vectors': 180, // same leadWithBench bench geometry as gauss (mobile 299 / desktop 482)` to `MIN_CANVAS_W`. The 238/180 floors ride the gauss/lorentz bench-geometry parity; if the Task-11 e2e run shows a different healthy geometry, recalibrate to 0.6 × the smallest healthy observed value — never below.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(math-vectors): wire Vector Toolkit into the spine as 2.1 (26 sections)"`

---

### Task 4: `math-integrals` pure physics module (TDD)

**Files:**
- Create: `src/em/sections/math-integrals/physics.ts`
- Test: `src/em/sections/math-integrals/__tests__/integralsPhysics.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `type Field2 = (p: { x: number; y: number }) => { x: number; y: number }`; `fluxTilted(E: number, area: number, tiltDeg: number): number`; `pathIntegralUniform(E: number, length: number, pathAngleDeg: number): number`; `divergenceAt(field: Field2, p: {x,y}, h?: number): number`; `curlZAt(field: Field2, p: {x,y}, h?: number): number`; `netFluxBox(field: Field2, half: number, samplesPerSide?: number): number` (outward flux through a closed box centered on the origin, per unit depth); `circulationBox(field: Field2, half: number, samplesPerSide?: number): number` (CCW circulation around the same box); and the three canonical bench fields `fieldUniform`, `fieldPointSource` (`(x,y)/r²` — the 2-D point source: divergence 0 away from the origin, box flux 2π whenever the origin is enclosed, any box size), `fieldVortex` (`(−y,x)`: curl 2 everywhere, divergence 0). Task 5's Local-view bench mode consumes ALL of these live — nothing here is test-only dead code; the div/curl tests are the numeric guard pinning the section's interpretive claims (formulaMirrors philosophy).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  fluxTilted, pathIntegralUniform, divergenceAt, curlZAt, netFluxBox, circulationBox,
  fieldUniform, fieldPointSource, fieldVortex,
} from '@em/sections/math-integrals/physics';

// Local fixture with EXACT finite-difference behavior (linear field): F = (x, y)
// is a uniformly EXPANDING field — divergence 2 at EVERY point, not a point
// source. (Named to prevent the exact confusion a point-source label caused.)
const expanding = (p: { x: number; y: number }) => ({ x: p.x, y: p.y });

describe('math-integrals physics (hand-derived + local-view guards)', () => {
  it('fluxTilted: Φ = E·A·cosθ — face-on max, 60° exactly halves, edge-on exactly 0', () => {
    expect(fluxTilted(200, 0.5, 0)).toBeCloseTo(100, 9);
    expect(fluxTilted(200, 0.5, 60)).toBeCloseTo(50, 9);
    expect(fluxTilted(200, 0.5, 90)).toBeCloseTo(0, 9);
  });
  it('pathIntegralUniform: E·L·cosθ — along +20, perpendicular 0, opposed −20', () => {
    expect(pathIntegralUniform(10, 2, 0)).toBeCloseTo(20, 9);
    expect(pathIntegralUniform(10, 2, 90)).toBeCloseTo(0, 9);
    expect(pathIntegralUniform(10, 2, 180)).toBeCloseTo(-20, 9);
  });
  it('divergenceAt: 0 uniform; exactly 2 EVERYWHERE for the expanding field F = (x, y); 0 for the vortex', () => {
    expect(divergenceAt(fieldUniform, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
    expect(divergenceAt(expanding, { x: 0.4, y: -0.2 })).toBeCloseTo(2, 9); // central differences are exact on linear fields
    expect(divergenceAt(fieldVortex, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
  });
  it('point source (x,y)/r²: divergence is ZERO away from the origin — all source-ness at one point', () => {
    expect(divergenceAt(fieldPointSource, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 5);
    expect(divergenceAt(fieldPointSource, { x: -1.1, y: 0.7 })).toBeCloseTo(0, 5);
  });
  it('curlZAt: 0 uniform; exactly 2 for the vortex F = (−y, x); 0 for the expanding field', () => {
    expect(curlZAt(fieldUniform, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
    expect(curlZAt(fieldVortex, { x: 0.4, y: -0.2 })).toBeCloseTo(2, 9);
    expect(curlZAt(expanding, { x: 0.4, y: -0.2 })).toBeCloseTo(0, 9);
  });
  it('netFluxBox: 0 uniform (in = out); div × area = 2 × 4 = 8 for the expanding field (divergence theorem)', () => {
    expect(netFluxBox(fieldUniform, 1)).toBeCloseTo(0, 9);
    expect(netFluxBox(expanding, 1)).toBeCloseTo(8, 9); // midpoint rule exact on linear fields
  });
  it('point-source box flux is 2π whatever the box size — the shrink-invariance CC #3 keys on', () => {
    expect(netFluxBox(fieldPointSource, 1, 512)).toBeCloseTo(2 * Math.PI, 4);
    expect(netFluxBox(fieldPointSource, 0.5, 512)).toBeCloseTo(2 * Math.PI, 4);
  });
  it('circulationBox: 0 uniform; curl × area = 2 × 4 = 8 for the vortex (Stokes); 0 for the point source', () => {
    expect(circulationBox(fieldUniform, 1)).toBeCloseTo(0, 9);
    expect(circulationBox(fieldVortex, 1)).toBeCloseTo(8, 9); // per-face integrand constant — exact
    expect(circulationBox(fieldPointSource, 1)).toBeCloseTo(0, 9); // odd integrand, symmetric samples cancel
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/math-integrals/__tests__/integralsPhysics.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement the module**

```ts
// Pure integral/local-view math for the math-integrals section (2.3). No React.
// The div/curl helpers are central-difference samplers so the section's
// interpretive prose ("flux per unit volume", "circulation per unit area")
// is pinned by numbers, not vibes.

export type Field2 = (p: { x: number; y: number }) => { x: number; y: number };

/** Flux of a uniform field |E| through a flat area tilted tiltDeg from face-on. */
export function fluxTilted(E: number, area: number, tiltDeg: number): number {
  return E * area * Math.cos((tiltDeg * Math.PI) / 180);
}

/** ∫E·dl along a straight path of given length at pathAngleDeg to a uniform E. */
export function pathIntegralUniform(E: number, length: number, pathAngleDeg: number): number {
  return E * length * Math.cos((pathAngleDeg * Math.PI) / 180);
}

export function divergenceAt(field: Field2, p: { x: number; y: number }, h = 1e-4): number {
  const dFx = (field({ x: p.x + h, y: p.y }).x - field({ x: p.x - h, y: p.y }).x) / (2 * h);
  const dFy = (field({ x: p.x, y: p.y + h }).y - field({ x: p.x, y: p.y - h }).y) / (2 * h);
  return dFx + dFy;
}

export function curlZAt(field: Field2, p: { x: number; y: number }, h = 1e-4): number {
  const dFyDx = (field({ x: p.x + h, y: p.y }).y - field({ x: p.x - h, y: p.y }).y) / (2 * h);
  const dFxDy = (field({ x: p.x, y: p.y + h }).x - field({ x: p.x, y: p.y - h }).x) / (2 * h);
  return dFyDx - dFxDy;
}

/** Outward flux (per unit depth) through the closed box [−half, half]², midpoint rule. */
export function netFluxBox(field: Field2, half: number, samplesPerSide = 64): number {
  const dl = (2 * half) / samplesPerSide;
  let flux = 0;
  for (let i = 0; i < samplesPerSide; i++) {
    const t = -half + (i + 0.5) * dl;
    flux += field({ x: half, y: t }).x * dl;   // right face, n̂ = +x̂
    flux -= field({ x: -half, y: t }).x * dl;  // left face, n̂ = −x̂
    flux += field({ x: t, y: half }).y * dl;   // top face, n̂ = +ŷ
    flux -= field({ x: t, y: -half }).y * dl;  // bottom face, n̂ = −ŷ
  }
  return flux;
}

/** CCW circulation (per unit depth) around the same closed box, midpoint rule. */
export function circulationBox(field: Field2, half: number, samplesPerSide = 64): number {
  const dl = (2 * half) / samplesPerSide;
  let circ = 0;
  for (let i = 0; i < samplesPerSide; i++) {
    const t = -half + (i + 0.5) * dl;
    circ += field({ x: half, y: t }).y * dl;   // right face, t̂ = +ŷ (CCW)
    circ -= field({ x: -half, y: t }).y * dl;  // left face, t̂ = −ŷ
    circ -= field({ x: t, y: half }).x * dl;   // top face, t̂ = −x̂
    circ += field({ x: t, y: -half }).x * dl;  // bottom face, t̂ = +x̂
  }
  return circ;
}

// ── Canonical Local-view bench fields ────────────────────────────────────────
export const fieldUniform: Field2 = () => ({ x: 1, y: 0 });

/** 2-D point source r̂/r = (x,y)/r²: divergence 0 away from the origin; box
 *  flux 2π whenever the origin is enclosed (any box size). r² clamped so the
 *  canvas can sample arrows near the origin without blowing up. */
export const fieldPointSource: Field2 = (p) => {
  const r2 = Math.max(p.x * p.x + p.y * p.y, 1e-6);
  return { x: p.x / r2, y: p.y / r2 };
};

/** Rigid rotation F = (−y, x): curl 2 everywhere, divergence 0. */
export const fieldVortex: Field2 = (p) => ({ x: -p.y, y: p.x });
```

- [ ] **Step 4: Run to verify PASS** — same command, ALL PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-integrals): pure flux/path/div/curl physics module"`

---

### Task 5: `math-integrals` section component — predict-first flux meter

**Files:**
- Create: `src/em/sections/math-integrals/index.tsx` (named export `MathIntegralsSection`)
- Test: `src/em/sections/__tests__/sections.test.tsx` (extend — two `it`s), `src/em/sections/__tests__/sectionAnchors.test.tsx` (extend — one `CASES` entry)

**Interfaces:**
- Consumes: Task 4's module; the same em/shared component set as Task 2 (identical import block, minus `YourTurnPanel` — this section has none, like gauss — and plus `CollapsibleSection` from `@shared/components/common/CollapsibleSection` for the default-collapsed local-view card).
- Produces: `export function MathIntegralsSection()` for Task 6's registry entry. No directional ConceptCheck (nothing keys a direction) → deliberately NO `concept-check-directions` CASES entry. Bench readout test-ids `flux-readout` / `path-readout` / `box-flux-readout` / `box-circulation-readout`.

- [ ] **Step 1: Write the failing tests** — same shape and same caveats as Task 2 Step 1 (dynamic import inside the `it`, curriculum-independent markers — the h1 title only exists after Task 6's wiring):

```tsx
  it('MathIntegralsSection renders', async () => {
    const { MathIntegralsSection } = await import('@em/sections/math-integrals/index');
    renderSection(MathIntegralsSection);
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
  });

  it('MathIntegralsSection gates the sim behind a Predict First prediction', async () => {
    const { MathIntegralsSection } = await import('@em/sections/math-integrals/index');
    const { container } = renderSection(MathIntegralsSection);
    expect(screen.getByText('Predict First')).toBeInTheDocument(); // exact string — the regex form multi-matches (see Task 2)
    expect(screen.getByText(/what happens to the flux through it/i)).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull(); // bench stays gated
  });
```

`sectionAnchors.test.tsx` CASES entry:

```tsx
  { name: 'math-integrals', Section: MathIntegralsSection, anchors: ['math-integrals-flux-sim', 'math-integrals-concept-checks', 'math-integrals-theory', 'math-integrals-challenge'] },
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/__tests__` → the two new `sections.test.tsx` its fail individually (dynamic import unresolved); `sectionAnchors.test.tsx` fails wholesale at collection (new static import) — expected RED, green in Step 4.
- [ ] **Step 3: Implement the section.** Same skeleton as Task 2 (SectionLayout → LabLayout `leadWithBench`; ONE gate; rAF loop with the `prepareFrame()` null early-return; 4 anchors). Section-specific content contract (normative):

**Bench — "Flux Meter"** (anchor `math-integrals-flux-sim`): THREE modes — `Flux Φ` / `Path ∫E·dl` / `Local view` — via the same styled aria-pressed button group as Task 2 (active `bg-indigo-600 text-white border-indigo-600`, inactive light/dark classes); controls in `<ControlPanel title="Flux Meter Controls">` (the `title` prop is required); canvas theme-aware (same `useThemeStore` conditional colors and deps as Task 2) with `role="img"` and `aria-label="Flux meter: field arrows with a tiltable surface, a directional path, or a closed box with flux and circulation readouts, depending on mode"`.
  - Flux mode: uniform field drawn as a column of upward arrows; a flat surface segment with tilt slider 0–90°, pierced field lines highlighted; readout `<p className="font-mono text-sm" data-testid="flux-readout">Φ = E·A·cosθ = 200 × 0.50 × cos({tilt}°) = {fluxTilted(200, 0.5, tilt).toFixed(1)}</p>`.
  - Path mode: a straight 2-unit path arrow with direction slider 0–360°; readout `<p className="font-mono text-sm" data-testid="path-readout">∫E·dl = E·L·cosθ = 10 × 2 × cos({pathAngle}°) = {pathIntegralUniform(10, 2, pathAngle).toFixed(1)}</p>`.
  - Local view mode (the div/curl lab — makes every Task-4 export a live bench quantity): field-preset button group `Uniform` / `Point source` / `Vortex` (selecting `fieldUniform` / `fieldPointSource` / `fieldVortex`), field drawn as a grid of sampled arrows (~9×7, length-capped), a square box outline centered on the origin with a `Box half-size` slider (0.4–1.5), and two readouts —
    `<p className="font-mono text-sm" data-testid="box-flux-readout">∮F·n̂ dl (out of the box) = {netFluxBox(field, half, 128).toFixed(2)} per unit depth</p>`
    `<p className="font-mono text-sm" data-testid="box-circulation-readout">∮F·t̂ dl (around the box, CCW) = {circulationBox(field, half, 128).toFixed(2)} per unit depth</p>`
    The three presets tell the whole story: Uniform → 0 and 0; Point source → flux ≈ 6.28 at EVERY box size (2π — shrink-invariant) and circulation 0; Vortex → flux 0 and circulation = 2 × box area.
  - PredictionGate (the one gate, wrapping the whole bench):

```tsx
      <PredictionGate
        question="A flat loop sits face-on in a uniform field. You tilt it all the way to edge-on (90°). What happens to the flux through it?"
        options={[
          { id: 'zero', label: 'It drops to exactly zero' },
          { id: 'same', label: 'It stays the same — same loop, same field' },
          { id: 'half', label: 'It halves' },
          { id: 'flip', label: 'It reverses sign' },
        ]}
        getCorrectAnswer={() => 'zero'}
        explanation={<span>Flux counts field lines <em>through</em> the surface: Φ = E·A·cosθ. Edge-on, every line skims past and none pierce — cos90° = 0. This is the "E ⊥ dA contributes nothing" move Gauss's law leans on next section.</span>}
        onPredict={(correct) => markPredictionGate('math-integrals', correct)}
      >
```

**ConceptChecks** (anchor `math-integrals-concept-checks`, three, identity-keyed to `'math-integrals'`):
  1. predict-reveal: "Close the surface: a sealed box sits in a *uniform* field. What is the NET flux through the whole closed box, and why?" — answer: "Zero. Every line that enters one face exits another; with outward normals, ∮E·dA counts out-minus-in — net outflow. Only enclosed *sources* make the closed-surface total nonzero — which is exactly Gauss's law's punchline. Check it on the bench: Local view, Uniform preset — the flux readout sits at 0.00 at every box size." hints: ["Track one field line through the box.", "The closed-integral sign ∮ means the whole skin, outward normals everywhere: exits count positive, entries negative."]
  2. multiple-choice: "Along a path that is everywhere perpendicular to E, what is ∫E·dl?" options: "Exactly zero — the dot product kills every step" (correct) / "E times the path length" / "It depends on how long the path is" / "Negative". explanation ties to the symmetry-factoring move in gauss/ampere hint tiers.
  3. predict-reveal: "Switch the bench to Local view and pick the Point source field. Predict: as you shrink the box around the source, what happens to the outward-flux readout — and what is the divergence at a point AWAY from the source?" — answer: "The flux readout stays put at ≈6.28 (2π per unit depth): every box that encloses the source catches everything it emits, however small the box. Away from the source the divergence is ZERO — whatever flows into a small box there flows back out (the field spreads and weakens at exactly the compensating rate). All the source-ness lives at one point: that is precisely how Gauss's law reads charge. Contrast the Vortex preset: flux 0 everywhere, but circulation 2 × box area — that is curl." hints: ["Just try it: sweep the box slider and watch the flux readout.", "Divergence is net outflow per unit volume of a tiny box — away from the source, is any field being created inside the box?"]
**Theory** (anchor `math-integrals-theory`, secondary derivation default-collapsed):

```tsx
          <EquationBox
            title="Adding up a field"
            equations={[
              { label: 'Line integral (work per unit charge along C)', math: '\\int_C \\vec{E} \\cdot d\\vec{l}', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Flux through a surface', math: '\\Phi_E = \\int \\vec{E} \\cdot d\\vec{A}', color: 'text-red-600 dark:text-red-400' },
              { label: 'Closed surface (outward normals)', math: '\\oint \\vec{E} \\cdot d\\vec{A}' },
              { label: 'Uniform field, flat surface (θ from face-on: between E and the surface NORMAL; 0° face-on, 90° edge-on)', math: '\\Phi = E\\,A\\cos\\theta' },
            ]}
          />
```

  WorkedSteps "Factor the symmetry" (`tryFirstPrompt`: "A point charge sits at the center of a sphere of radius R. Try writing ∮E·dA as E × (something) before revealing."): Step 1 — chop the sphere into patches; on every patch E is parallel to dA (radial) so E·dA = E dA; Step 2 — by symmetry E is the same number on every patch, so it factors: `\oint \vec{E} \cdot d\vec{A} = E \oint dA = E\,(4\pi R^2)`; Step 3 — "this ONE move is the entire computational content of Gauss's and Ampère's laws; the sections ahead only ever choose surfaces that let you make it."
  Then the local-view card (a `CollapsibleSection` `defaultOpen={false}` titled "The local view: divergence and curl"):

```tsx
            <EquationBox
              title="Shrink the box, shrink the loop"
              equations={[
                { label: 'Divergence (flux per volume)', math: '\\nabla \\cdot \\vec{E} = \\lim_{V \\to 0} \\frac{1}{V} \\oint \\vec{E} \\cdot d\\vec{A}', color: 'text-red-600 dark:text-red-400' },
                { label: 'Curl (circulation per area; loop ⊥ n̂, traversed right-handedly about n̂ — curl your right hand along C, thumb = n̂)', math: '(\\nabla \\times \\vec{B}) \\cdot \\hat{n} = \\lim_{A \\to 0} \\frac{1}{A} \\oint \\vec{B} \\cdot d\\vec{l}', color: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Divergence theorem', math: '\\oint_S \\vec{E} \\cdot d\\vec{A} = \\int_V (\\nabla \\cdot \\vec{E})\\,dV' },
                { label: "Stokes' theorem", math: '\\oint_C \\vec{B} \\cdot d\\vec{l} = \\int_S (\\nabla \\times \\vec{B}) \\cdot d\\vec{A}' },
              ]}
            />
```

  with two student-visible paragraphs: (1) the 2-D/3-D bridge — "One honesty note about the bench: it is a 2-D slice. Its closed 'surface' is the box OUTLINE and its flux is counted per unit depth into the screen, so its flux readout is the raw ∮F·n̂ dl — divide it by the box area yourself and you have the 2-D stand-in for (1/V)∮E·dA. Same idea, one dimension down; the 3-D forms on this card are the ones Maxwell's equations use." (2) the zoom-out — "The two theorems say the same thing at two zoom levels: total outflow through a skin = summed sources inside; total circulation around a rim = summed swirl across the sheet (with C and S oriented by the same right-hand pairing as the curl card). Section {getSectionNumber('maxwell')} writes all four field laws in this local language."
**GuidedChallenge** (anchor `math-integrals-challenge`): title "Half-flux hunt", instructions: sweep the tilt slider to find where Φ is exactly half its face-on value (60°, NOT 45° — cosine, not linear); then switch to Path mode and find the two angles where ∫E·dl = 0 (90° and 270°). hint: "cosθ = ½ at 60° — the readout falls slowly at first, then fast."
**Hook** (SectionLayout prop): "Gauss's law next section opens with ∮E·dA and never says what ∮, ·, or dA mean. Thirty minutes here buys every field law in the course: they are all one sentence about flux or circulation."

- [ ] **Step 4: Run to verify PASS** — `npx vitest run --no-file-parallelism src/em/sections/math-integrals src/em/sections/__tests__ src/__tests__/no-katex-double-backslash.test.ts` → ALL PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-integrals): Line & Flux Integrals section — predict-first flux meter"`

---

### Task 6: Wire `math-integrals` into the spine as 2.3 (26 → 27 sections)

**Files:** (content anchors from here on — Task 3's insertions shift the Task-3-era line numbers)
- Modify: `src/shared/constants/curriculum.ts` (SECTION_LIST entry between coulomb and gauss; `PARTS[1].sectionIds`)
- Modify: `src/sectionRegistry.tsx` (loader between coulomb and gauss)
- Modify: `src/em/constants/physics.ts` (MODULES entry after coulomb's; extend lucide import with `Sigma`)
- Modify: `src/shared/constants/__tests__/curriculum.test.ts` (26→27 ×2 + it-name; simHeavy 17→18 + list; expectedChecks pin), `getSectionNumber.test.ts` (add `math-integrals` → `'2.3'` — coulomb stays `'2.2'`, gauss/ampere/lorentz have no pins), `sectionSubtitles.test.ts` (`EM_SECTION_IDS` + `'math-integrals'`), `CourseLanding.test.tsx:45` (`'5 sections'`→`'6 sections'`)
- Modify: `e2e/sim-paint.spec.ts` (all four tables, same values as Task 3)

**Interfaces:**
- Consumes: `MathIntegralsSection` (Task 5).
- Produces: section id `'math-integrals'` at route `/math-integrals` as 2.3; Part 2 order `['math-vectors', 'coulomb', 'math-integrals', 'gauss', 'ampere', 'lorentz']`.

- [ ] **Step 1: Re-pin the guards FIRST** (mirror Task 3 Step 1 with these literals):

```ts
    expect(getExpectedChecks('math-integrals')).toBe(3);
    expect(getSectionNumber('math-integrals')).toBe('2.3');
```

counts 26→27 (both sites + it-name), simHeavy 17→18 (insert `'math-integrals',` at its sorted position — immediately before `'math-vectors'`; both sit between `'magnetic-circuits'` and `'maxwell'` alphabetically), `EM_SECTION_IDS` + `'math-integrals'`, CourseLanding `'6 sections'`.

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx` → edited pins RED.
- [ ] **Step 3: Wire it.** `curriculum.ts` (between coulomb and gauss):

```ts
  { id: 'math-integrals', title: 'Line & Flux Integrals', subtitle: 'Adding up fields along paths and through surfaces', route: '/math-integrals', domain: 'em', expectedChecks: 3, simHeavy: true },
```

```ts
    sectionIds: ['math-vectors', 'coulomb', 'math-integrals', 'gauss', 'ampere', 'lorentz'],
```

`sectionRegistry.tsx`:

```ts
  'math-integrals': lazyRetry(() => import('@em/sections/math-integrals').then((m) => ({ default: m.MathIntegralsSection }))),
```

`physics.ts` MODULES (label/description byte-equal to title/subtitle):

```ts
  {
    id: 'math-integrals',
    path: '/math-integrals',
    label: 'Line & Flux Integrals',
    shortLabel: 'Integrals',
    icon: Sigma,
    description: 'Adding up fields along paths and through surfaces',
    track: 'electrostatics',
  },
```

- [ ] **Step 4: Run to verify PASS** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx src/__tests__/routeIntegrity.test.ts` → ALL PASS.
- [ ] **Step 5: e2e tables** — add `'math-integrals'` to `DPR_MIGRATED` + `EXPECT_CANVAS`; `'math-integrals': 238` in `MIN_CANVAS_H`; `'math-integrals': 180, // same leadWithBench bench geometry as gauss` in `MIN_CANVAS_W` (same calibration caveat as Task 3).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(math-integrals): wire Line & Flux Integrals in as 2.3 (27 sections)"`

---

### Task 7: `complexMath` pure module (TDD)

**Files:**
- Create: `src/transmission/utils/complexMath.ts`
- Test: `src/transmission/utils/__tests__/complexMath.test.ts`

**Interfaces:**
- Consumes: nothing new — but the pair shape `{ real: number; imag: number }` is deliberately a subset of the `{ real, imag, magnitude, phaseDeg }` shape `calculateComplexReflectionCoefficient` returns (`transmissionMath.ts:353-368`), so its values are structurally assignable here. Do NOT duplicate any Γ computation; this module is generic arithmetic only. Known twin: `src/circuits/types/circuit.ts:35` declares a data-only `Complex { real; imag }` — cross-domain imports are forbidden (`shared/` never imports a domain; circuits↔transmission likewise), so this duplication is deliberate; note it in the module header comment.
- Produces: `interface Complex { real: number; imag: number }`; `cadd(a, b)`, `cmul(a, b)`, `cdiv(a, b)` (division — the operation Γ = (Z_L−Z_0)/(Z_L+Z_0) and Z = V/I run on; a phasor bridge without it strands its consumers), `fromPolarDeg(mag, angleDeg): Complex`, `toPolarDeg(z): { mag: number; angleDeg: number }` (angle NORMALIZED to (−180, 180] — raw `atan2(−0, −1)` returns −π, so the implementation folds ≤ −180 up by 360), `expJ(thetaRad): Complex` (Euler: `e^{jθ}`). Task 8's phasor lab consumes all of these.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { cadd, cmul, cdiv, fromPolarDeg, toPolarDeg, expJ } from '@transmission/utils/complexMath';

describe('complexMath (Euler anchors, hand-derived)', () => {
  it('j·j = −1: the 90°-rotation-twice identity', () => {
    const j = { real: 0, imag: 1 };
    const jj = cmul(j, j);
    expect(jj.real).toBeCloseTo(-1, 12);
    expect(jj.imag).toBeCloseTo(0, 12);
  });
  it('Euler: e^{jπ} = −1 and e^{jπ/2} = j', () => {
    expect(expJ(Math.PI).real).toBeCloseTo(-1, 12);
    expect(expJ(Math.PI).imag).toBeCloseTo(0, 12);
    expect(expJ(Math.PI / 2).real).toBeCloseTo(0, 12);
    expect(expJ(Math.PI / 2).imag).toBeCloseTo(1, 12);
  });
  it('multiplication multiplies magnitudes and adds angles: (2∠30°)(3∠45°) = 6∠75°', () => {
    const p = toPolarDeg(cmul(fromPolarDeg(2, 30), fromPolarDeg(3, 45)));
    expect(p.mag).toBeCloseTo(6, 12);
    expect(p.angleDeg).toBeCloseTo(75, 12);
  });
  it('phasor addition beats trig identities: 3∠0° + 4∠90° = 5∠53.13°', () => {
    const s = toPolarDeg(cadd(fromPolarDeg(3, 0), fromPolarDeg(4, 90)));
    expect(s.mag).toBeCloseTo(5, 12);
    expect(s.angleDeg).toBeCloseTo(53.130102, 5);
  });
  it('the quarter-wave flip: Γ_L·e^{−j2βl} at βl = 90° is −Γ_L', () => {
    const gammaL = { real: 0.5, imag: 0 };
    const g = cmul(gammaL, expJ(-Math.PI)); // e^{−j2βl}, 2βl = 180°
    expect(g.real).toBeCloseTo(-0.5, 12);
    expect(g.imag).toBeCloseTo(0, 12);
  });
  it('division divides magnitudes and subtracts angles: (6∠75°)/(3∠45°) = 2∠30°; 1/j = −j', () => {
    const q = toPolarDeg(cdiv(fromPolarDeg(6, 75), fromPolarDeg(3, 45)));
    expect(q.mag).toBeCloseTo(2, 12);
    expect(q.angleDeg).toBeCloseTo(30, 12);
    const invJ = cdiv({ real: 1, imag: 0 }, { real: 0, imag: 1 });
    expect(invJ.real).toBeCloseTo(0, 12);
    expect(invJ.imag).toBeCloseTo(-1, 12);
  });
  it('toPolarDeg normalizes the atan2(−0, −1) = −π corner into (−180, 180]', () => {
    expect(toPolarDeg({ real: -1, imag: -0 }).angleDeg).toBeCloseTo(180, 12);
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/transmission/utils/__tests__/complexMath.test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement**

```ts
// Generic complex arithmetic for the math-phasors section (5.1). Shape matches
// the { real, imag } pair transmissionMath's reflection-coefficient helpers
// already use. j is the imaginary unit throughout (course hard rule: never i).

export interface Complex {
  real: number;
  imag: number;
}

export function cadd(a: Complex, b: Complex): Complex {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}

export function cmul(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function cdiv(a: Complex, b: Complex): Complex {
  const d = b.real * b.real + b.imag * b.imag;
  return {
    real: (a.real * b.real + a.imag * b.imag) / d,
    imag: (a.imag * b.real - a.real * b.imag) / d,
  };
}

export function fromPolarDeg(mag: number, angleDeg: number): Complex {
  const rad = (angleDeg * Math.PI) / 180;
  return { real: mag * Math.cos(rad), imag: mag * Math.sin(rad) };
}

export function toPolarDeg(z: Complex): { mag: number; angleDeg: number } {
  let angleDeg = (Math.atan2(z.imag, z.real) * 180) / Math.PI;
  // atan2(−0, −1) returns −π; fold onto (−180, 180] so ±180 is unambiguous.
  if (angleDeg <= -180) angleDeg += 360;
  return { mag: Math.hypot(z.real, z.imag), angleDeg };
}

/** Euler: e^{jθ} = cosθ + j sinθ. */
export function expJ(thetaRad: number): Complex {
  return { real: Math.cos(thetaRad), imag: Math.sin(thetaRad) };
}
```

- [ ] **Step 4: Run to verify PASS** — same command, ALL PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-phasors): complex arithmetic module with Euler anchors"`

---

### Task 8: `math-phasors` section component — PartialFractions-template page with a phasor-multiplier lab

**Files:**
- Create: `src/transmission/components/modules/PhasorAlgebra/index.tsx` (named export `PhasorAlgebra`)
- Create: `src/transmission/components/modules/PhasorAlgebra/PhasorMultiplierSim.tsx` (SVG — no canvas, so NO sim-paint table entries, the 2A/2B pattern)
- Test: new `src/transmission/components/modules/__tests__/phasorAlgebra.test.tsx`; plus a smoke entry appended to `src/transmission/components/modules/__tests__/pages.test.tsx` (follow that file's existing entry shape exactly)

**Interfaces:**
- Consumes: Task 7's `complexMath` exports; the PartialFractions template blocks — `SectionHook`, numbered `h1` via `getSectionNumber('math-phasors')`, `TableOfContents`, `WorkedSteps`, `LabStation`, `PredictionGate`, `ConceptCheck`, `YourTurnPanel`, `GuidedChallenge`, `CourseNavigation`, `MathWrapper`, `CollapsibleSection` (all `@shared/components/common/`); `useProgressStore` (`markVisited` in a mount effect — circuits/transmission sections self-assemble, no SectionLayout, exactly `PartialFractions/index.tsx:53-61`).
- Produces: `export function PhasorAlgebra()` for Task 9's registry entry; `PhasorMultiplierSim` props `{ z1AngleDeg: number; z2AngleDeg: number; z1Mag: number; z2Mag: number }`-free (it owns its slider state) with the deterministic readout `data-testid="phasor-product-readout"` formatted `{mag.toFixed(2)}∠{angleDeg.toFixed(1)}°`.

- [ ] **Step 1: Write the failing page test** (`phasorAlgebra.test.tsx`; katex mock + MemoryRouter scaffold as shown — the in-domain sibling shape from `transformers.test.tsx` / `transmissionLabels.test.tsx`, whose `render` writes raw latex into the element so block formulas are greppable as text; amended post-review — the original `render: vi.fn()` never throws, so MathWrapper's raw-LaTeX fallback never fires and block formulas render empty):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PhasorAlgebra } from '../PhasorAlgebra';

/* ─── Mock katex (used by MathWrapper) ─────────────────────────── */
/* Sibling shape (transformers.test.tsx / transmissionLabels.test.tsx):
   `render` writes the raw latex into the target element so block
   formulas can be asserted as text. */
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
    render: (latex: string, el: HTMLElement) => {
      el.textContent = latex;
    },
  },
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/math-phasors']}>
      <PhasorAlgebra />
    </MemoryRouter>,
  );
}

describe('math-phasors page (2A page-test contract)', () => {
  it('renders the numbered title and states Euler as the bridge, not a known fact', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /complex numbers & phasors/i })).toBeInTheDocument();
    // katex is mocked to pass raw LaTeX through, so the identity is string-greppable:
    expect(document.body.textContent).toContain('e^{j\\theta} = \\cos\\theta + j\\sin\\theta');
  });
  it('gates the multiplier behind a prediction with no skip control', () => {
    renderPage();
    expect(document.querySelector('[data-gate]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull();
    expect(screen.queryByTestId('phasor-product-readout')).toBeNull();
  });
  it('unlocks on a committed prediction and shows the deterministic 6∠75° readout', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /6∠75°/ }));
    await user.click(screen.getByRole('button', { name: /commit prediction|continue/i }));
    expect(await screen.findByTestId('phasor-product-readout')).toHaveTextContent('6.00∠75.0°');
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/transmission/components/modules/__tests__/phasorAlgebra.test.tsx` → FAIL (module not found).
- [ ] **Step 3: Implement.** `PhasorMultiplierSim.tsx`: an SVG complex plane (Re/Im axes, unit circle); sliders `|z₁|` (0.5–3, default 2), `∠z₁` (0–360°, default 30°), `|z₂|` (0.5–3, default 3), `∠z₂` (0–360°, default 45°); three arrows — z₁ (blue), z₂ (amber), z₁z₂ = `cmul(fromPolarDeg(...), fromPolarDeg(...))` (emerald, thicker); readout `<p className="font-mono text-sm" data-testid="phasor-product-readout">z₁z₂ = {p.mag.toFixed(2)}∠{shownAngle.toFixed(1)}° — lengths multiply, angles add</p>` where `p = toPolarDeg(cmul(...))` and the display angle normalizes AFTER rounding so it can never show the excluded endpoint (slider pairs summing to ≈360° would otherwise render "∠360.0°"): `const shownAngle = (Math.round(((p.angleDeg + 360) % 360) * 10) / 10) % 360;`. `index.tsx` block order (PartialFractions anatomy, all progress calls keyed `'math-phasors'`):
  1. `SectionHook text="Add v₁ = 3cos(ωt) and v₂ = 4cos(ωt + 90°) with trig identities: a page of algebra. As arrows tip-to-tail: one right triangle, 5∠53°. That arrow-algebra is a two-line theorem about e^{jθ} — and Part 5 runs on it."`
  2. Numbered `h1` — `<span className="font-mono ...">{getSectionNumber('math-phasors')}</span> Complex Numbers &amp; Phasors` + subtitle `<p>` "The algebra of rotating arrows — from the em-wave phasor view to Γ_L e^{−j2βl}".
  3. `TableOfContents items={tocEntries}` with anchors `motivation` / `euler` / `multiplier` / `phasors` / `challenge`.
  4. Motivation card (`SectionAnchor id="motivation"`): recalls the em-wave rotating arrow — "In Section {getSectionNumber('em-wave')} you watched a phasor spin and drop its shadow on the Re axis; in Section {getSectionNumber('s-domain')} you placed poles at s = σ + jω. Both are this section's object: a complex number is a 2-D arrow, j is the 90° rotation, and j² = −1 is 'two quarter-turns is a U-turn'."
  5. `SectionAnchor id="euler"` → `WorkedSteps tryFirstPrompt="Differentiate cosθ + j sinθ once and compare with the original before revealing."` steps: (1) `d/dθ(cosθ + j sinθ) = −sinθ + j cosθ = j(cosθ + j sinθ)` — the derivative is j times itself; (2) functions satisfying `f′ = jf` form the family `f = C·e^{jθ}` — the constant is pinned by the starting value: at θ = 0 ours is `cos0 + j sin0 = 1`, so `C = 1` (without this step the answer could just as well be `7e^{jθ}`); (3) therefore `cosθ + j sinθ = e^{jθ}` exactly; (4) so multiplying by `e^{jθ}` rotates an arrow by θ without changing its length — check: `e^{jπ} = −1` (a half-turn), matching the `e^{\pm j\beta l}` line LineImpedance already cites. **Directly BELOW the WorkedSteps, always visible (NOT inside it — WorkedSteps hides steps 2+ behind reveal clicks and the section's headline identity must never be hidden; the Task-8 test greps body text for it):** a highlight card with `<MathWrapper formula="e^{j\theta} = \cos\theta + j\sin\theta" block />`.
  6. `SectionAnchor id="multiplier"` → `LabStation number={getSectionNumber('math-phasors')} title="The Phasor Multiplier" objective="Predict where a product arrow lands, then sweep the angle sliders and watch lengths multiply while angles add."` wrapping the ONE `PredictionGate`:

```tsx
          <PredictionGate
            question="z₁ = 2∠30° and z₂ = 3∠45°. Where does the product z₁z₂ land?"
            options={[
              { id: 'mul-add', label: '6∠75° — lengths multiply, angles add' },
              { id: 'add-add', label: '5∠75° — lengths add, angles add' },
              { id: 'mul-mul', label: '6∠1350° — everything multiplies' },
            ]}
            getCorrectAnswer={() => 'mul-add'}
            explanation={<span>Write both in Euler form: z₁z₂ = 2e^(j30°) · 3e^(j45°) = (2·3)e^(j(30°+45°)). Exponents add — so angles add, and the magnitudes out front multiply.</span>}
            onPredict={(correct) => markPredictionGate('math-phasors', correct)}
          >
            <PhasorMultiplierSim />
          </PredictionGate>
```

  7. `SectionAnchor id="phasors"` → phasor-dictionary card: cosine reference stated FIRST (hard rule 2), `formula="v(t) = V_m\cos(\omega t + \phi)"`, then `formula="v(t) = \mathrm{Re}\{V_m e^{j\phi} e^{j\omega t}\}"`, then the phasor `formula="\mathbf{V} = V_m e^{j\phi} = V_m\angle\phi"` — "freeze the spinning arrow at t = 0 and carry only the frozen part" (Nilsson bold circuit-phasor typography) — and a division row, because the section's first consumers compute Γ = (Z_L−Z_0)/(Z_L+Z_0) and Z = V/I on contact: `formula="\frac{z_1}{z_2}"` … "division divides lengths and subtracts angles: `formula="\frac{e^{j\alpha}}{e^{j\beta}} = e^{j(\alpha-\beta)}"`" (backed by `cdiv` from Task 7). Then the three ConceptChecks (at the END of the derivation, identity-keyed):
     1. predict-reveal: "Multiply any z by j twice. Where does the arrow end up, and what famous equation did you just re-derive?" — answer: "Two 90° CCW turns = one 180° turn: −z. That is j² = −1, read as geometry."
     2. multiple-choice: "On a line with Γ_L = 0.5, the round-trip factor is Γ_L e^{−j2βl}. At βl = 90° (a quarter wavelength), what is it?" options: "−0.5 — the arrow rotated a half turn clockwise" (correct) / "+0.5 — nothing changed" / "0.5e^{−j90°} = −j0.5" / "Zero — the reflection dies". explanation: "2βl = 180°, and e^{−j180°} = −1. One quarter wave down the line, the reflected arrow points the opposite way — the quarter-wave transformer in Section {getSectionNumber('line-impedance')} is exactly this sign flip."
     3. predict-reveal: "What is the phasor of v(t) = 5cos(ωt − 90°)?" — answer: "V = 5e^{−j90°} = −j5: length 5 pointing straight down the −Im axis. A −90° phase is a quarter-turn clockwise — 'lags by 90°' and '×(−j)' are the same sentence."
  8. `YourTurnPanel scenario="Two bench signals add at a node: 3∠0° and 4∠90° (same ω)." question="What is the phasor sum?"` options: `5∠53.1°` (correct — "3-4-5 triangle: tip-to-tail"), `7∠45°` ("lengths don't simply add unless the arrows are parallel"), `5∠90°`, `1∠−90°`; correctReveal with `formula="3 + j4 = 5e^{j53.1^{\circ}}"` block.
  9. Bridge paragraph — "Part 5 will write every wave on a line as one of these arrows: Section {getSectionNumber('transmission-lines')} launches them, Section {getSectionNumber('line-impedance')} rotates them with e^{−j2βl}." — then `SectionAnchor id="challenge"` → `GuidedChallenge challenge={CHALLENGE}` with CHALLENGE = { title: 'Walk the unit circle', description: 'Use the multiplier to verify Euler’s identity by construction.', instructions: ['Set z₁ = 1∠90° (that is j) and z₂ = 1∠90°.', 'Read the product: 1∠180° — you built j² = −1.', 'Now set z₂ = 1∠270° (that is ∠−90°: a clockwise quarter turn — the sliders count 0–360°) and explain why the product is 1∠0°.', 'Finish: what z₂ turns 2∠30° into a pure real number?'], hint: 'Angles add. To land on the real axis, the angles must sum to 0° or 360° (or 180°) — z₂ = 1∠330° (that is ∠−30°) or 1∠150°.' }
  10. `CourseNavigation`.
Store wiring identical to PartialFractions (`markVisited('math-phasors')` in a `useEffect`; every check `onComplete={() => incrementConceptChecks('math-phasors')}` and `onHint={() => incrementHints('math-phasors')}`). No directional check → no `concept-check-directions` CASES entry (nothing keys a spatial direction; "−Im axis" appears only in one predict-reveal ANSWER, and the guard only scans multiple-choice option lists).
- [ ] **Step 4: Add the smoke entry** to `src/transmission/components/modules/__tests__/pages.test.tsx` following its existing per-page entry shape (same render scaffold, heading assertion `/complex numbers & phasors/i`).
- [ ] **Step 5: Run to verify PASS** — `npx vitest run --no-file-parallelism src/transmission/components/modules/__tests__ src/__tests__/no-katex-double-backslash.test.ts` → ALL PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(math-phasors): Complex Numbers & Phasors section — phasor multiplier lab"`

---

### Task 9: Wire `math-phasors` into the spine as 5.1 (27 → 28 sections)

**Files:** (content anchors — the Part-2 insertions shifted the original line numbers)
- Modify: `src/shared/constants/curriculum.ts` (SECTION_LIST entry directly above lumped-distributed; `PARTS[4].sectionIds`)
- Modify: `src/sectionRegistry.tsx` (loader above lumped-distributed's)
- Modify: `src/shared/constants/__tests__/curriculum.test.ts` (27→28 ×2 + it-name; non-sim list 9→10 + it-name; expectedChecks pin), `getSectionNumber.test.ts` (add `'math-phasors'` → `'5.1'`; re-pin `'transmission-lines'` `'5.2'`→`'5.3'`, `'line-impedance'` `'5.3'`→`'5.4'`, `'transients'` `'5.4'`→`'5.5'`), `CourseLanding.test.tsx:46` (`section-count-5` `'4 sections'`→`'5 sections'`) and `:66` (`start-part-5` href `'/lumped-distributed'`→`'/math-phasors'`)
- Modify: `src/transmission/components/modules/__tests__/lineImpedance.test.tsx:44-49` — the page test pins the RENDERED h1 number: `expect(h1).toHaveTextContent('5.3')` → `'5.4'`, and the describe string `'LineImpedance — section 5.3 page'` → `'… 5.4 page'`. (Same pinned-derived-number class as getSectionNumber.test.ts — component page tests can pin it too; transformers' `'3.4'` pin is unaffected by this plan.)
- NO sim-paint edits (SVG lab, no canvas — 2A/2B precedent), NO `sectionSubtitles`/MODULES edits (not em-domain), NO subtitle field (non-em convention).

**Interfaces:**
- Consumes: `PhasorAlgebra` (Task 8).
- Produces: section id `'math-phasors'` at route `/math-phasors` as 5.1; Part 5 order `['math-phasors', 'lumped-distributed', 'transmission-lines', 'line-impedance', 'transients']`.

- [ ] **Step 1: Re-pin the guards FIRST.** `curriculum.test.ts`: counts 27→28 (both sites + it-name); the non-sim it (rename `'the 9 non-sim sections'` → `'the 10 non-sim sections'`) gains `'math-phasors',` in its id array; expectedChecks it gains `expect(getExpectedChecks('math-phasors')).toBe(3);`. `getSectionNumber.test.ts`:

```ts
    expect(getSectionNumber('math-phasors')).toBe('5.1');
    expect(getSectionNumber('transmission-lines')).toBe('5.3');
    expect(getSectionNumber('line-impedance')).toBe('5.4');
    expect(getSectionNumber('transients')).toBe('5.5');
```

`CourseLanding.test.tsx`: `:46` `'5 sections'`, `:66` `expect(getByTestId('start-part-5')).toHaveAttribute('href', '/math-phasors');`. `lineImpedance.test.tsx`: h1 pin `'5.3'` → `'5.4'` + describe string → `'section 5.4 page'`.

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx src/transmission/components/modules/__tests__/lineImpedance.test.tsx` → RED.
- [ ] **Step 3: Wire it.** `curriculum.ts` (above lumped-distributed):

```ts
  { id: 'math-phasors', title: 'Complex Numbers & Phasors', route: '/math-phasors', domain: 'transmission', expectedChecks: 3 },
```

```ts
    sectionIds: ['math-phasors', 'lumped-distributed', 'transmission-lines', 'line-impedance', 'transients'],
```

`sectionRegistry.tsx` (transmission modules-import pattern):

```ts
  'math-phasors': lazyRetry(() => import('@transmission/components/modules/PhasorAlgebra').then((m) => ({ default: m.PhasorAlgebra }))),
```

- [ ] **Step 4: Run to verify PASS** — `npx vitest run --no-file-parallelism src/shared/constants/__tests__ src/shared/components/__tests__/CourseLanding.test.tsx src/transmission/components/modules/__tests__/lineImpedance.test.tsx src/__tests__/routeIntegrity.test.ts src/__tests__/app.test.tsx` → ALL PASS. Note: `line-impedance`'s ten in-prose `{getSectionNumber(...)}` interpolations (`LineImpedance.tsx:97-601`) renumber themselves — derived, zero edits; the 2A/2B "no hardcoded section number" rule pays off here.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(math-phasors): wire Complex Numbers & Phasors in as 5.1 (28 sections)"`

---

### Task 10: Point-of-need seams — four additive back-links (links-only, the reduced (c))

**Files:**
- Modify: `src/em/sections/gauss/index.tsx` (theory pane, one sentence in the prose immediately BEFORE the EquationBox render at `:430` — the `:318` equations array stays byte-identical; ALSO add `import { getSectionNumber } from '@shared/constants/curriculum';` — like maxwell, gauss does not import it today)
- Modify: `src/em/sections/maxwell/index.tsx:548-551` (extend the Differential-Form intro paragraph; add the missing `import { getSectionNumber } from '@shared/constants/curriculum';` — maxwell does not import it today)
- Modify: `src/transmission/components/modules/LineImpedance.tsx:321-325` (extend the Euler sentence; `getSectionNumber` already imported at `:12`)
- Modify: `src/circuits/components/modules/PartialFractions/index.tsx` (one sentence at the end of the Complex Poles collapsible intro, `:303-348` region — `getSectionNumber` already imported there)
- Test: `src/em/sections/__tests__/sections.test.tsx` (two seam its), `src/transmission/components/modules/__tests__/lineImpedance.test.tsx` (one seam it, reusing that file's existing render helper), `src/circuits/components/__tests__/PartialFractions.page.test.tsx` (one seam it, reusing its render-at-route scaffold)

**Interfaces:**
- Consumes: the wired ids `'math-integrals'` / `'math-phasors'` (Tasks 6, 9).
- Produces: nothing consumed downstream — discoverability prose only. Plain text + `{getSectionNumber('…')}` interpolation; NO new `formula=` attributes, NO math glyphs (keeps the KaTeX and glyph guards trivially satisfied).

- [ ] **Step 1: Write the failing seam tests.** In `sections.test.tsx` (file idiom: dynamic imports; each `<p>` holds only text nodes, so `getByText` regexes match across the interpolation):

```tsx
  it('GaussSection back-links its integral toolkit to math-integrals (2.3)', async () => {
    const { GaussSection } = await import('@em/sections/gauss/index');
    renderSection(GaussSection);
    expect(screen.getByText(/closed-surface ring and the area element in Section 2\.3/)).toBeInTheDocument();
  });

  it('MaxwellSection back-links divergence and curl to math-integrals (2.3)', async () => {
    const { MaxwellSection } = await import('@em/sections/maxwell/index');
    renderSection(MaxwellSection);
    expect(screen.getByText(/built from scratch in Section 2\.3/)).toBeInTheDocument();
  });
```

In `lineImpedance.test.tsx`, reusing its existing render helper (same body, that file's setup):

```tsx
  it('back-links Euler and the rotating-arrow algebra to math-phasors (5.1)', () => {
    renderLineImpedance(); // whatever the file's existing helper is named — reuse it
    expect(screen.getByText(/Section 5\.1/)).toBeInTheDocument();
  });
```

In `PartialFractions.page.test.tsx`, reusing its render-at-route scaffold:

```tsx
  it('Complex Poles forward-links the arrow picture to math-phasors (5.1)', () => {
    renderPartialFractions(); // the file's existing scaffold — reuse it
    expect(screen.getByText(/arrow picture of complex numbers/i)).toBeInTheDocument();
  });
```

(The `2.3`/`5.1` literals are deliberate pins in the getSectionNumber style — if the spine renumbers later, these re-pin with it.)

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/__tests__/sections.test.tsx src/transmission/components/modules/__tests__/lineImpedance.test.tsx src/circuits/components/__tests__/PartialFractions.page.test.tsx` → the four new its FAIL (seam text absent); everything else PASS.
- [ ] **Step 3: gauss** — add `import { getSectionNumber } from '@shared/constants/curriculum';` to the imports (gauss, like maxwell, does not import it today — without this the seam is a ReferenceError at render and TS2304 at build), then add one sentence to the theory prose directly above the EquationBox (the dot product is credited to the section that builds it, 2.1 — not 2.3):

```tsx
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Every symbol below was built hands-on before this: the closed-surface ring and the area
                element in Section {getSectionNumber('math-integrals')}, the dot product in
                Section {getSectionNumber('math-vectors')} — here they start doing physics.
              </p>
```

- [ ] **Step 4: maxwell** — extend the intro paragraph of the Differential Form block (after "…connected by the divergence and Stokes' theorems." at `:550`):

```tsx
            {' '}Both theorems — and what divergence and curl actually measure — are built from
            scratch in Section {getSectionNumber('math-integrals')}.
```

- [ ] **Step 5: LineImpedance** — extend the derivation paragraph (after "…trade the exponentials for a tangent." at `:324`). ONE JSX line — a newline between the interpolation and the following text would be swallowed by JSX (rendering "5.1if"); keep the sentence on a single line or use an explicit `{' '}` after the interpolation:

```tsx
            {' '}(Euler and the rotating-arrow algebra are Section {getSectionNumber('math-phasors')} if the identity does not feel obvious.)
```

- [ ] **Step 5b: PartialFractions** — add one sentence at the end of the Complex Poles collapsible's intro prose (import already present):

```tsx
            {' '}The arrow picture of complex numbers behind this cos/sin split — magnitudes, angles,
            and Euler's identity — is built hands-on in Section {getSectionNumber('math-phasors')}.
```

- [ ] **Step 6: Run the seam tests + the owning guard suites** — `npx vitest run --no-file-parallelism src/em/sections/__tests__ src/transmission/components/modules/__tests__ src/circuits/components/__tests__/PartialFractions.page.test.tsx src/__tests__` → ALL PASS, including the four new seam its (anchors compare ids only; the pinned equations arrays and phaseUnits strings are untouched).
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(math-prereqs): point-of-need cross-links from gauss, maxwell, line-impedance, partial-fractions"`

---

### Task 11: Full gates + PR

- [ ] **Step 1:** `npm run build` → exit 0 (tsc -b is the typecheck — watch for TS6133 on any unused destructure).
- [ ] **Step 2:** `npm run lint` → exit 0 (the exported consts in `math-vectors/index.tsx` carry their `react-refresh/only-export-components` disables).
- [ ] **Step 3:** `npx vitest run --no-file-parallelism` → 111+ files / 815+ tests, ALL green. Derivation: baseline 782/107 grows by 4 new files (vectorPhysics, integralsPhysics, complexMath, phasorAlgebra) and ≈42 new `it`s — T1: 7, T2: 5 (2 sections + 1 anchors row + 2 directions rows), T3: 2 (generated sectionSubtitles pair), T4: 8, T5: 3, T6: 2, T7: 7, T8: 4 (3 page + 1 pages smoke), T10: 4 — landing ≈824. Treat any total below 815 as a real regression, not a baseline shift.
- [ ] **Step 4:** `npm run e2e` → 3 projects green. The 28 routes are auto-walked from `ALL_SECTIONS` (sim-paint + screenshots derive; shot count rises by 2 per new section). The two new canvas benches must clear their new `EXPECT_CANVAS`/`MIN_CANVAS_H`/`MIN_CANVAS_W`/`DPR_MIGRATED` entries — if a floor fails, fix the LAYOUT or recalibrate to 0.6× the smallest healthy observed value with the measurement shown; never delete the entry.
- [ ] **Step 5: Owner visual walk** — `npm run e2e:quick` build reuse or `npx vite preview --port 4273 --strictPort`; open `/math-vectors` (predict SIGN, flip through all three modes — ⊙/⊗ marker matches the RH rule, resultant lands tip-to-tail; check the marker is legible in DARK mode too), `/math-integrals` (tilt to 90° → flux readout hits 0.0; Local view: point-source flux ≈6.28 at two box sizes, vortex circulation = 2×area; local-view card collapsed by default), `/math-phasors` (6∠75° readout; Euler card visible without any reveal clicks), and the four back-links resolving to "2.1"/"2.3"/"5.1" in gauss/maxwell/line-impedance/partial-fractions. Stop the server after.
- [ ] **Step 5b: Screenshot + stale-number hygiene** — delete the old index-numbered PNGs under `e2e/__screenshots__/` before the e2e run (the capture spec names shots `${index+1}-${id}` over ALL_SECTIONS, so the three insertions rename every downstream file and leave stale frames — the directory already carries scar tissue from a previous reorder); sweep the two stale doc comments `'Section 5.1 page'` (`LumpedDistributed.tsx:18`) and `'Section 5.2 page'` (`TransmissionLines.tsx:23`) to their new numbers (comment-only, no test effect; the lineImpedance describe was re-pinned in Task 9).
- [ ] **Step 6:** Push + open the PR to `main` via the REST API recipe (UTF-8 JSON payload file in the session scratchpad; token via `git credential fill`, never printed). PR body: the presupposition gap (`docs/BL30A0350-learning-outcomes.md:14`) + LO mapping (LO2 cross products/line integrals; LO7 flux integrals; LO4/LO9 complex/phasors; LO11–12 transients), Decision #1/#2 summary, the four deliberate `getSectionNumber` re-pins, and the SW `autoUpdate` note (returning students see the old 25-section shell until next-visit SW activation).
- [ ] **Step 7:** Close with the repo convention: `Tested: build, lint, full unit suite serial (111+ files / ≈817 tests), e2e ×3 projects, owner visual walk on /math-vectors /math-integrals /math-phasors + the three seam links. Not tested: WebKit/Firefox (Chromium-only e2e); SW update propagation (autoUpdate lag noted in PR body); real-device touch drag on the sliders (mouse + Playwright touch emulation only).`

---

## Coverage map (self-review)

| IN topic (charter) | Task(s) | Where it lands |
|---|---|---|
| Dot product (a·b = \|a\|\|b\|cosθ, projection meaning) | 1, 2, 3 | 2.1 bench dot mode + gate (predict the SIGN), EquationBox, WorkedSteps, YourTurn |
| Cross product (\|a×b\|, RH rule generalized, component form) | 1, 2, 3 | 2.1 bench cross mode (⊙/⊗ predict), Q_CROSS_DIR (directions-guarded), triad + component-form `(A×B)_z = A_xB_y − A_yB_x` cards, pinned numerically by the cross2z tests |
| Scalar × vector (F = qE) | 2 | 2.1 Q_QE_DIR (electron flip, directions-guarded) + theory card |
| Vector addition / superposition (coulomb's first real need) | 1, 2 | 2.1 bench Add mode (tip-to-tail resultant + component readout), anatomy + addition cards, Q_ADD (√2-not-2 check), `vadd` tests — Phase-1 addition |
| Line integral — what it IS | 4, 5, 6 | 2.3 path mode (predict ⊥ ⇒ 0), EquationBox, CC #2 |
| Flux / closed-surface integral — what it IS | 4, 5, 6 | 2.3 flux gate (tilted surface → 0), closed-box CC #1, "factor the symmetry" WorkedSteps |
| div/curl/∇ at interpretive depth (+ the theorems maxwell name-drops) | 4, 5 | 2.3 Local-view bench mode (uniform/point-source/vortex presets, box flux + circulation readouts — every claim OBSERVABLE, not asserted), local-view collapsible (shrink-limit definitions, orientation clause, 2-D/3-D bridge, both theorem statements), all pinned numerically by divergenceAt/curlZAt/netFluxBox/circulationBox guards |
| Complex algebra + Euler e^{jθ} (arrow → algebra bridge) | 7, 8, 9 | 5.1 Euler WorkedSteps (with the f(0)=1 normalization) + always-visible identity card, phasor multiplier gate (6∠75°), quarter-wave-flip CC, phasor dictionary (cosine reference, **V** = V_m e^{jφ}, division row backed by `cdiv`) |
| Point-of-need discoverability (consumers → new sections) | 10 | gauss / maxwell / LineImpedance / PartialFractions one-liners, interpolated numbering, each pinned by a seam test |
| Gates + PR | 11 | full four-gate run, counts, visual walk |

Every new section: `expectedChecks: 3` with exactly 3 identity-keyed wired checks — no `expectedChecks: 0` to justify against the audit's complete-on-first-visit ceiling (systemic ceiling #3): this plan ships none.

## Deliberately out of scope

| Item | Why out |
|---|---|
| First/second-order ODE solving | Already taught — `LaplaceMotivation.tsx` (6-step separation of variables) and `TimeDomain/index.tsx` (KVL→ODE→damping cases). Cross-linked by existing spine order, not duplicated. |
| Partial fractions, Laplace integral definition, s-plane reading | Already full sections/modules (1.7, `LaplaceTheory.tsx`, `SDomainAnalysis.tsx`). 5.1's motivation back-links to 1.8 instead. |
| Gradient / E = −∇V, volume integrals | No section in the app uses them (charter default: exclude absent a concrete course need; grep confirms zero consumers). The local-view card stops at div/curl. |
| Formal proofs of the divergence/Stokes theorems | Stated and used interpretively in 2.3; proofs have no course consumer and violate the ≤3-goals cap. |
| em-wave forward-link to 5.1 / any em-wave edit | em-wave is pin-dense (`phaseUnits.test.tsx`) and in the audit's too-long cohort; 5.1 back-links to 4.2 instead — same seam, zero risk. |
| Raising `expectedChecks` on EXISTING sections (transformers etc.) | Audit roadmap #3's deliberate, phased job with its own guard — not this plan's. |
| Jones-vector formalism in polarization | Natural consumer of 5.1, but a content upgrade to an existing pinned section — separate plan if wanted. |
| Part-0/"Math Toolkit" Part, nav/tint work, gamification dead-tracking | Decision #1 rejected (a); the retint and dead-tracking items are separate known open items. |

## Phase-1 adversarial revision record (2026-07-04)

Three independent attackers (devil's advocate, physics red team, engineering red team) ran against the previous revision; 24 of 35 attacks survived steelmanning and are folded in above. What changed and why:

**Physics corrections (would have shipped wrong physics):**
1. math-integrals CC #3 keyed "divergence zero away from the source" for F = (x, y) — false (∇·F = 2 everywhere; the plan's own test pinned it) and cited a bench readout that didn't exist. Fixed by introducing the true 2-D point source `(x,y)/r²` (div 0 away from origin, box flux 2π shrink-invariant) AND building the bench Local-view mode so the claim is observed, not asserted.
2. CC #1 said ∮E·dA "counts in-minus-out" — inverted outward-normal convention; now "out-minus-in", the convention Gauss's law consumes next section.
3. math-vectors challenge claimed dot = cross-MAGNITUDE at 225° (−2.12 ≠ +2.12); rephrased in terms of the signed (A×B)·ẑ the bench actually displays.
4. Euler derivation lacked the f(0)=1 normalization ("unique function" was false as stated — could be 7e^{jθ}); step inserted.
5. 2-D bench vs 3-D "flux per volume" card reconciled with a student-visible per-unit-depth bridge sentence (was only a code comment).
6. Smaller: solar-panel hook disambiguated (60° from *facing* the sun); Φ = EAcosθ card defines its θ; curl card states the right-hand C–n̂ orientation; line-integral card no longer equates volts to W; YourTurn distractor diagnoses corrected (+10 is a dropped sign, not "|A||B| rounded"); "two sections from now" off-by-one removed; ∠−90° rewritten slider-reachable (∠270°); toPolarDeg normalizes the atan2(−0,−1) corner.

**Coverage gaps (the bridge omitted what the far bank needs):**
7. Vector ADDITION added (bench Add mode, anatomy + addition cards, Q_ADD, `vadd`) — the 2.1 slot's own rationale is "coulomb needs superposition", and the section didn't teach it. Goals folded to stay at 3 (linear combination / dot / cross).
8. Complex DIVISION added (`cdiv` + dictionary row) — consumers compute Γ = (Z_L−Z_0)/(Z_L+Z_0) and Z = V/I on contact.
9. Fourth seam added (PartialFractions' Complex Poles → 5.1) and the "every consumer is in Part 5" rationale corrected to "every consumer of the phasor *algebra*".

**Execution breaks (tasks could not have gone green as written):**
10. Two missed positional pins re-pinned: `CourseLanding.test.tsx:64/:66` start-Part CTA hrefs (Tasks 3/9) and `lineImpedance.test.tsx` h1 `'5.3'`→`'5.4'` + describe (Task 9).
11. Task 8's test asserted the Euler LaTeX in body text while the formula lived in WorkedSteps step 2 (hidden behind reveals) — the identity now also gets an always-visible card.
12. Task 2/5 gate tests used `getByText(/predict first/i)`, which multi-matches three PredictionGate elements and throws — switched to the exact-string coulomb idiom.
13. gauss seam needed the `getSectionNumber` import (only maxwell's was specified).
14. Quality: both canvases now theme-aware (`useThemeStore` conditional colors — the ⊙/⊗ marker was slate-600 on the dark background, the audit-C-02 defect class) with `role="img"`/aria-labels; mode-toggle buttons got the house active-state styling; readout and canvas share one parallel-epsilon so 180°/360° can't display "−0.00 — into the screen"; phasor readout normalizes after rounding (no "∠360.0°"); LineImpedance seam kept on one JSX line (newline would render "5.1if"); Task 11 gains screenshot/stale-comment hygiene; Task-4 test fixture renamed `expanding` to kill the source/point-source confusion at the root.

**Attacks that did NOT survive steelmanning (no change, reasons recorded):** "wrong problem — students have the math" (gap is grep-verified real, cohort heterogeneous, sections skippable and point-of-need; Part 0/appendix rejected on the plan's own costing); "2.3/5.1 flow-break" (structurally the proven 1.7→1.8 partial-fractions move; renumber machinery is derived); "expectedChecks:3 convention break" (shipping a new section at 0 would manufacture the audit's own ceiling-#3 defect; the guard test re-documents the rule); "seam scope creep" (bounded to four verified-need links; literal pins are deliberate re-pin-on-renumber guards); screenshot churn (capture-only spec, handled as hygiene).
