# Phase 1 — Batch 3 Rollout (A · F · G) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Phase 1 by rolling the locked "Lab Instrument" foundation through the three remaining themes — widen + mobile-ify the lab bench (A), add a blocking predict-first gate to the 9 ungated sections (F), and fix the EM chart-quality bugs (G) — leaving the course consistent, engaging, and always-green.

**Architecture:** Three **independently-shippable work-streams**, each its own branch + PR (matching the Batch 1/2 push→visual-walk→merge workflow). Sequence A → F → G per the design spec §3 (the shared `LabStation`/`PredictionGate`/`PhysicsChart` were styled in Batch 2, so this rollout is "born styled"). No new pedagogy/sims — this is consistency & refresh only.

**Tech Stack:** Vite + React 19 + TypeScript, Tailwind v4 (`@theme static` token layer in `src/index.css`), recharts **3.8.1** (verified installed — supports `XAxis type="number"`, `YAxis scale="log"`, dual `yAxisId`), Zustand store (`@shared/store/progressStore`), Vitest + Testing Library. Build = `npm run build` (`tsc -b && vite build`); lint = `npm run lint`; tests = `npm test` (run heavy/full suite with `-- --no-file-parallelism` — this box OOMs at the 4-fork default under low free RAM).

**Source of truth:** design spec `docs/superpowers/specs/2026-06-06-phase-1-consistency-and-refresh-design.md` (§4 themes, §5 locked decisions) + line-level appendix `2026-06-06-phase-1-scoping.json`. This plan supersedes the appendix where they conflict (see Locked Decisions).

---

## Locked decisions (do NOT re-litigate — owner-approved 2026-06-06)

| ID | Decision | Applied as |
|----|----------|-----------|
| **A1** | Bench ratio **48%**; jump-link **opt-in via props**; leave Smith `max-h` cap (revisit in visual QA only) | `lg:grid-cols-[1fr_minmax(420px,48%)]`; new `benchId`/`jumpLabel` props; no Smith change |
| **F1** | `allowSkip={false}` **on every gate** | **All 9 new gates get `allowSkip={false}`** — this OVERRIDES the EM snippets in the scoping appendix, which omitted it (they were drafted off the skippable Faraday model) |
| **F2** | Maxwell has no slider sim → gate its **4 animated equation cards** | Gate wraps the 4-card overview grid |
| **G1** | Gauss → **dual-axis** with unit-labelled axes (not two charts) | E on log left axis, Flux on linear right axis |
| **G2** | em-wave E&B snapshot → **true-scale second axis** (drop the `×c` fudge) | B on a right axis at true magnitude |
| (F) | Predict-first store key = **section id**; never touches `isModuleComplete` | `markPredictionGate('<section-id>', correct)` |

**Still open → carried as visual-QA / pedagogy-review items, NOT blockers:** Smith-chart letterboxing at the wider column; final jump-link copy; whether to retro-fit `allowSkip={false}` onto the *existing* skippable gates (out of scope here — note as fast-follow); the exact prediction wording (drafts below are physically correct and owner-reviewed, but the course author may refine phrasing).

---

## ⚠️ Cross-cutting hazard: blocking gates hide content the existing tests assert

A **blocking** `PredictionGate` renders *only the prompt* until the user predicts + clicks Continue (`PredictionGate.tsx:122` `if (passed && !nonBlocking) return <>{children}</>`). So wrapping a sim in a gate **removes its content from the initial DOM**, breaking any test that asserts that content is immediately visible.

**Verified impact (grounded in the current test files):**
- `src/circuits/components/__tests__/pages.test.tsx` — **WILL BREAK**: `ComponentPhysics` tests assert the Resistor tab + "Ohm's Law" (now gated); `TimeDomain` "table of contents and circuit tabs" asserts RC/RL/RLC tab buttons (now gated); `SDomainAnalysis` "Theory tab by default" / "switches to Damping tab" assert Tabs content (now gated). These tests **must be updated** to pass the gate first.
- `src/em/sections/__tests__/sections.test.tsx` — **SAFE**: only asserts `"Why This Matters"` (section intro, *outside* the gate) and Gauss's `"Flux Through Any Surface"` capstone (the `GuidedChallenge`, which sits *after* the gated sim grid, outside the gate). No change needed beyond the new gate-smoke test.
- `src/__tests__/app.test.tsx` — **SAFE**: renders only `/` (CourseLanding), never mounts the 9 sections.

Every F task that gates a circuits section includes an explicit "update existing tests" step using this shared helper (add once to `pages.test.tsx`):

```tsx
import type { UserEvent } from '@testing-library/user-event';

/** Click any prediction option, then Continue, to reveal a blocking gate's children. */
async function passPredictionGate(user: UserEvent, optionLabel: string) {
  await user.click(screen.getByRole('button', { name: optionLabel }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}
```

---

# STREAM A — Lab-bench width + mobile (branch `phase-1-batch-3-a-bench`, → PR)

**Files:**
- Modify: `src/shared/components/common/LabLayout.tsx` (widen grid; add `benchId`/`jumpLabel` props + sub-`lg` jump anchor)
- Modify: `src/transmission/components/modules/TransmissionLines.tsx` (opt the 3 lab chapters in)
- Create: `src/shared/components/common/__tests__/LabLayout.test.tsx` (new — no LabLayout test exists)

**Scope note:** `LabLayout` has exactly ONE runtime consumer (`TransmissionLines.tsx`, 3 lab tabs). All 3 bench sims are width-responsive (canvas re-measures per frame; `StandingWaveQuiz` uses a `ResizeObserver`), so widening is visually safe. The circuits `InteractiveLab` 320px split and `RadiationPatternSim` 500px canvas cap are **separate, parallel** layouts — explicitly OUT of Stream A scope (note for a later reconciliation, do not touch here).

### Task A1: LabLayout responsive contract — write the failing test

- [ ] **Step 1: Write the failing test** — `src/shared/components/common/__tests__/LabLayout.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LabLayout } from '@shared/components/common/LabLayout';

describe('LabLayout', () => {
  it('renders theory before bench in DOM order (mobile stack order)', () => {
    const { container } = render(
      <LabLayout theory={<p>THEORY_CONTENT</p>} bench={<p>BENCH_CONTENT</p>} />,
    );
    const html = container.innerHTML;
    expect(html.indexOf('THEORY_CONTENT')).toBeLessThan(html.indexOf('BENCH_CONTENT'));
  });

  it('renders a sub-lg "Jump to lab" anchor targeting benchId when jumpLabel is set', () => {
    render(
      <LabLayout
        benchId="lab-test"
        jumpLabel="Jump to lab"
        theory={<p>theory</p>}
        bench={<p>bench</p>}
      />,
    );
    const anchor = screen.getByRole('link', { name: /Jump to lab/i });
    expect(anchor).toHaveAttribute('href', '#lab-test');
  });

  it('applies benchId as the id of the bench wrapper', () => {
    const { container } = render(
      <LabLayout benchId="lab-test" jumpLabel="Jump to lab" theory={<p>t</p>} bench={<span data-testid="b">b</span>} />,
    );
    expect(container.querySelector('#lab-test')).toBeTruthy();
    expect(container.querySelector('#lab-test')?.querySelector('[data-testid="b"]')).toBeTruthy();
  });

  it('renders no jump anchor when jumpLabel/benchId are omitted', () => {
    render(<LabLayout theory={<p>t</p>} bench={<p>b</p>} />);
    expect(screen.queryByRole('link', { name: /Jump to lab/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/shared/components/common/__tests__/LabLayout.test.tsx --no-file-parallelism`
Expected: FAIL — the jump-anchor / `benchId` props do not exist yet (anchor not found).

### Task A2: Implement the widened, jump-aware LabLayout

- [ ] **Step 3: Edit `src/shared/components/common/LabLayout.tsx`** to this exact content

```tsx
import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/**
 * Props for {@link LabLayout} — the split-pane "lab bench" chapter layout.
 */
interface LabLayoutProps {
  /** The reading content (theory, concept checks, callouts). Scrolls normally. */
  theory: ReactNode;
  /** The interactive lab bench (a LabStation framing a gated simulation). */
  bench: ReactNode;
  /** Additional CSS class names for the grid wrapper. */
  className?: string;
  /** Stable id applied to the bench wrapper so an in-page "Jump to lab" anchor can target it. */
  benchId?: string;
  /** When set (with benchId), renders a sub-lg "Jump to lab" anchor at the top of the theory column. */
  jumpLabel?: string;
}

/**
 * Two-column chapter layout for an interactive lab: theory reads down the left
 * column while the lab bench is pinned in a sticky right column, so the
 * simulation never scrolls out of view. Below `lg` the two panes stack into a
 * single column (theory first, then bench); when `benchId`+`jumpLabel` are
 * provided, a sub-lg "Jump to lab" anchor lets phone users skip the theory
 * column straight to the live bench.
 */
export function LabLayout({ theory, bench, className, benchId, jumpLabel }: LabLayoutProps) {
  return (
    <div
      className={cn(
        'grid items-start gap-6 lg:gap-8',
        'lg:grid-cols-[1fr_minmax(420px,48%)]',
        className,
      )}
    >
      <div className="min-w-0">
        {jumpLabel && benchId && (
          <a
            href={`#${benchId}`}
            className="lg:hidden inline-flex items-center gap-1.5 mb-4 rounded-md px-3 py-1.5 text-sm font-medium text-engineering-blue-700 dark:text-engineering-blue-400 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 hover:bg-engineering-blue-100 dark:hover:bg-engineering-blue-900/30 transition-colors"
          >
            {jumpLabel}
            <ArrowDown aria-hidden="true" className="w-4 h-4" />
          </a>
        )}
        {theory}
      </div>
      <div
        id={benchId}
        tabIndex={benchId ? -1 : undefined}
        className="scroll-mt-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1"
      >
        {bench}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/shared/components/common/__tests__/LabLayout.test.tsx --no-file-parallelism`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/common/LabLayout.tsx src/shared/components/common/__tests__/LabLayout.test.tsx
git commit -m "feat(lab): widen bench to 48% + add opt-in mobile jump-to-lab anchor"
```

### Task A3: Opt the 3 transmission-line lab chapters into the jump affordance

- [ ] **Step 6: Edit `src/transmission/components/modules/TransmissionLines.tsx`** — the three `<LabLayout .../>` TabSet contents (anchors: `theory={reflectionsTheory}`, `theory={smithTheory}`, `theory={inverseTheory}`)

```tsx
// Reflections lab:
content: <LabLayout benchId="lab-reflections" jumpLabel="Jump to lab" theory={reflectionsTheory} bench={reflectionsBench} />,
// Smith Chart lab (benchId distinct from the LabStation's existing id="smith-chart"):
content: <LabLayout benchId="lab-smith" jumpLabel="Jump to lab" theory={smithTheory} bench={smithBench} />,
// Inverse-problem lab:
content: <LabLayout benchId="lab-inverse" jumpLabel="Jump to lab" theory={inverseTheory} bench={inverseBench} />,
```

- [ ] **Step 7: Verify build + transmission tests + full type-check**

Run: `npx tsc -b && npx vitest run src/transmission --no-file-parallelism`
Expected: tsc exit 0; transmission tests PASS. (The `benchId="lab-smith"` must NOT equal the LabStation's internal `id="smith-chart"` — verified distinct, no duplicate-id clash.)

- [ ] **Step 8: Commit**

```bash
git add src/transmission/components/modules/TransmissionLines.tsx
git commit -m "feat(transmission): opt 3 lab chapters into mobile jump-to-lab"
```

### Task A4: Stream A verification + PR

- [ ] **Step 9: Full build + lint**

Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 10: Push + open PR (visual-walk gate).** Body must flag the known visual-QA item: the Smith chart `aspect-square` grows taller at 48% and reaches its `max-h-[560px]` cap (letterboxing) — owner decides during the walk whether to raise the cap. Do NOT merge before the owner's visual confirmation (Batch 1/2 precedent).

```bash
git push -u origin phase-1-batch-3-a-bench
# PR via REST API (no gh CLI): git credential fill -> POST /repos/cassia-santos-nunes-almeida/EM-CA-LAB/pulls
```

---

# STREAM F — Blocking predict-first on the 9 ungated sections (branch `phase-1-batch-3-f-predict-first`, → PR)

**The 9 sections (verified ungated; the other 11 already have a gate):**
Part 1: `component-physics`, `circuit-analysis` (`TimeDomain`), `s-domain` (`SDomainAnalysis`).
Part 2: `coulomb`, `gauss`, `ampere`.
Part 4: `maxwell`, `em-wave`, `polarization`.

**Two patterns:**
- **EM sections** (coulomb, gauss, ampere, maxwell, em-wave, polarization): copy the Faraday model — gate is the first child wrapping only the interactive-sim grid, inside `<SectionLayout>`. State key = section id.
- **Circuits sections** (component-physics, circuit-analysis, s-domain): the sim panels are toggled by local state, not a remounting TabSet — EXCEPT `s-domain`'s `<Tabs>` **remount on switch**, so it needs the lifted-state pattern (`initialPassed`/`onPassed` + a `useState` unlock flag) so the gate doesn't re-lock.

**Universal rules (per locked decisions):** every gate is **blocking** with **`allowSkip={false}`**; `onPredict={(correct) => markPredictionGate('<section-id>', correct)}`; the store hook `const markPredictionGate = useProgressStore((s) => s.markPredictionGate);` is added to each component body; import `import { PredictionGate } from '@shared/components/common/PredictionGate';`.

**Common per-section step shape (TDD):** (1) add a gate-smoke test (RED — no gate yet); (2) add the gate; (3) run smoke test (GREEN); (4) run the section's *existing* test file and fix any test that assumed immediate sim visibility; (5) commit. Each task below gives the exact gate code (questions are owner-reviewed and physically correct — verify each `getCorrectAnswer` against the explanation, do not alter the physics).

> Add the `passPredictionGate` helper (top of this plan) to `pages.test.tsx` before Task F7.

### Task F1: coulomb (EM)

**Files:** Modify `src/em/sections/coulomb/index.tsx`; Modify `src/em/sections/__tests__/sections.test.tsx` (add smoke test).

- [ ] **Step 1: Add the gate-smoke test** to `sections.test.tsx`:

```tsx
it('CoulombSection gates the sim behind a Predict First prediction', async () => {
  const { CoulombSection } = await import('@em/sections/coulomb/index');
  renderSection(CoulombSection);
  expect(screen.getByText('Predict First')).toBeInTheDocument();
  expect(screen.getByText(/net electric field/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/em/sections/__tests__/sections.test.tsx -t "CoulombSection gates" --no-file-parallelism` (no "Predict First" yet).

- [ ] **Step 3: Edit `coulomb/index.tsx`** — add import + store hook; wrap the interactive-sim grid (anchor `{/* ── Interactive simulation ── */}`, the `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> … </ControlPanel></div>`) as the FIRST child of `<SectionLayout>`:

```tsx
import { PredictionGate } from '@shared/components/common/PredictionGate';
// in component body:
const markPredictionGate = useProgressStore((s) => s.markPredictionGate);

<PredictionGate
  allowSkip={false}
  question="Two equal positive charges sit side by side. At the exact midpoint between them, what is the net electric field?"
  options={[
    { id: 'zero', label: 'Zero' },
    { id: 'toward', label: 'Points toward one charge' },
    { id: 'max', label: 'Maximum (largest on the line)' },
    { id: 'up', label: 'Points straight up' },
  ]}
  getCorrectAnswer={() => 'zero'}
  explanation={<span>The two equal charges push a test charge in opposite directions along the line joining them, so the horizontal contributions cancel and |E| = 0 at the midpoint — vector superposition.</span>}
  onPredict={(correct) => markPredictionGate('coulomb', correct)}
>
  {/* existing interactive-simulation grid moves here unchanged */}
</PredictionGate>
```

- [ ] **Step 4: Run → PASS** the smoke test, then run the whole EM file: `npx vitest run src/em/sections/__tests__/sections.test.tsx --no-file-parallelism`. Expected: all PASS (the existing `"Why This Matters"` assertion is outside the gate → unaffected).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(em): blocking predict-first gate on Coulomb sim"`

### Task F2: gauss (EM)

Same shape. Gate the interactive-sim grid (anchor `{/* ── Interactive simulation ── */}`).

- [ ] **Smoke test** (add to `sections.test.tsx`): assert `getByText('Predict First')` + `getByText(/double the sphere's radius/i)`. Run → FAIL.
- [ ] **Gate code:**

```tsx
<PredictionGate
  allowSkip={false}
  question="You enclose a fixed charge +Q in a Gaussian sphere, then double the sphere's radius. What happens to the total electric flux through it?"
  options={[
    { id: 'quadruples', label: 'It quadruples' },
    { id: 'doubles', label: 'It doubles' },
    { id: 'same', label: 'It stays the same' },
    { id: 'quarter', label: 'It drops to one quarter' },
  ]}
  getCorrectAnswer={() => 'same'}
  explanation={<span>Gauss's law gives Φ_E = Q_enc/ε₀ — flux depends only on the enclosed charge, not on the surface radius, so it is unchanged.</span>}
  onPredict={(correct) => markPredictionGate('gauss', correct)}
>
  {/* existing interactive-simulation grid */}
</PredictionGate>
```

- [ ] **Run** the EM file → all PASS (Gauss's `"Flux Through Any Surface"` capstone is the `GuidedChallenge` *after* the gated grid → still visible). **Commit** `feat(em): blocking predict-first gate on Gauss flux sim`.

### Task F3: ampere (EM)

- [ ] **Smoke test:** `getByText('Predict First')` + `getByText(/distance r from a long straight wire/i)`. Run → FAIL.
- [ ] **Gate code** (wrap the interactive-sim grid):

```tsx
<PredictionGate
  allowSkip={false}
  question="You measure B at distance r from a long straight wire, then move the probe to 2r. How does the field magnitude change?"
  options={[
    { id: 'half', label: 'It halves' },
    { id: 'quarter', label: 'It drops to one quarter' },
    { id: 'same', label: 'It stays the same' },
    { id: 'double', label: 'It doubles' },
  ]}
  getCorrectAnswer={() => 'half'}
  explanation={<span>For a straight wire B = μ₀I/(2πr) ∝ 1/r, so doubling r halves the field (a 1/r law, not 1/r²).</span>}
  onPredict={(correct) => markPredictionGate('ampere', correct)}
>
  {/* existing interactive-simulation grid */}
</PredictionGate>
```

- [ ] **Run** → PASS. **Commit** `feat(em): blocking predict-first gate on Ampère B-field sim`.

### Task F4: maxwell (EM — gate the 4 animated cards, per F2)

- [ ] **Smoke test:** `getByText('Predict First')` + `getByText(/let Maxwell predict self-propagating/i)`. Run → FAIL.
- [ ] **Gate code** — wrap the 4-card overview (anchor `{/* ── Animated 4-equation overview ── */}`, the `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">` … 4 `MaxwellCard`s):

```tsx
<PredictionGate
  allowSkip={false}
  question="Which single addition to Ampère's law let Maxwell predict self-propagating electromagnetic waves?"
  options={[
    { id: 'monopole', label: 'A magnetic monopole term' },
    { id: 'displacement', label: 'The displacement current ε₀ dΦ_E/dt' },
    { id: 'gravity', label: 'A gravitational coupling term' },
    { id: 'charge', label: 'A new electric-charge source term' },
  ]}
  getCorrectAnswer={() => 'displacement'}
  explanation={<span>Maxwell added the displacement current ε₀ dΦ_E/dt, which closes the E↔B feedback loop and yields the wave equation with c = 1/√(μ₀ε₀).</span>}
  onPredict={(correct) => markPredictionGate('maxwell', correct)}
>
  {/* existing 4-card animated overview grid */}
</PredictionGate>
```

- [ ] **Run** → PASS (`"Why This Matters"` is before the cards). **Commit** `feat(em): blocking predict-first gate on Maxwell equation cards`.

### Task F5: em-wave (EM)

- [ ] **Smoke test:** `getByText('Predict First')` + `getByText(/Along which axis does the B field oscillate/i)`. Run → FAIL.
- [ ] **Gate code** — wrap ONLY the interactive-sim grid (anchor `{/* ── Interactive simulation with internal view selector … ── */}`); NOT the inline ConceptCheck list that follows:

```tsx
<PredictionGate
  allowSkip={false}
  question="A plane EM wave travels in +z with its E field along x. Along which axis does the B field oscillate?"
  options={[
    { id: 'x', label: 'Along x (parallel to E)' },
    { id: 'y', label: 'Along y' },
    { id: 'z', label: 'Along z (direction of travel)' },
    { id: 'none', label: 'B does not oscillate' },
  ]}
  getCorrectAnswer={() => 'y'}
  explanation={<span>E, B and k form a right-handed triad with E×B ∝ k. With E along x̂ and k along ẑ, B must lie along ŷ (x̂×ŷ=ẑ).</span>}
  onPredict={(correct) => markPredictionGate('em-wave', correct)}
>
  {/* existing interactive-simulation grid */}
</PredictionGate>
```

- [ ] **Run** → PASS. **Commit** `feat(em): blocking predict-first gate on EM-wave sim`.

### Task F6: polarization (EM)

- [ ] **Smoke test:** `getByText('Predict First')` + `getByText(/90° phase difference/i)`. Run → FAIL.
- [ ] **Gate code** (wrap the interactive-sim grid):

```tsx
<PredictionGate
  allowSkip={false}
  question="Two orthogonal E-field components of EQUAL amplitude are combined with a 90° phase difference. What polarization state results?"
  options={[
    { id: 'linear', label: 'Linear' },
    { id: 'circular', label: 'Circular' },
    { id: 'elliptical', label: 'Elliptical (axial ratio ≠ 1)' },
    { id: 'unpolarized', label: 'Unpolarized' },
  ]}
  getCorrectAnswer={() => 'circular'}
  explanation={<span>Equal amplitudes with δ = ±90° make the E-vector tip trace a circle (Ex²+Ey² = const) — circular polarization. δ = 0°/180° gives linear; unequal amplitudes give elliptical.</span>}
  onPredict={(correct) => markPredictionGate('polarization', correct)}
>
  {/* existing interactive-simulation grid */}
</PredictionGate>
```

- [ ] **Run** → PASS. **Commit** `feat(em): blocking predict-first gate on polarization sim`.

### Task F7: component-physics (CIRCUITS — breaks existing tests)

**Files:** Modify `src/circuits/components/modules/ComponentPhysics/index.tsx`; Modify `src/circuits/components/__tests__/pages.test.tsx`.

- [ ] **Step 1: Add the `passPredictionGate` helper** (above) to `pages.test.tsx` if not already present.
- [ ] **Step 2: Add a gate-smoke test** to the `ComponentPhysics page` describe block:

```tsx
it('gates the R/L/C explorer behind a Predict First prediction', () => {
  renderWithRouter(<ComponentPhysics />);
  expect(screen.getByText('Predict First')).toBeInTheDocument();
  // The gated tab strip must NOT be visible before predicting:
  expect(screen.queryByRole('button', { name: 'Resistor' })).toBeNull();
});
```

- [ ] **Step 3: Update the 3 existing ComponentPhysics tests** to pass the gate first. They currently assert the Resistor tab / "Ohm's Law" / tab switching immediately — wrap each with a gate traversal. Example for the default-tab test:

```tsx
it('renders with resistor tab active by default', async () => {
  const user = userEvent.setup();
  renderWithRouter(<ComponentPhysics />);
  await passPredictionGate(user, 'Quadruples (×4)'); // reveal the gated content
  expect(screen.getByRole('heading', { level: 1, name: /Component Physics/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resistor' })).toBeInTheDocument();
  expect(screen.getByText(/Ohm's Law/i)).toBeInTheDocument();
});
```
Apply the same `await passPredictionGate(user, 'Quadruples (×4)')` first line to the capacitor- and inductor-switch tests. (The H1 "Component Physics" heading lives outside the gate, but the tabs/panels are inside it.)

- [ ] **Step 4: Run → FAIL** (gate not implemented; smoke test fails). Then implement.
- [ ] **Step 5: Edit `ComponentPhysics/index.tsx`** — import + store hook; wrap the tab strip + the 3 panels (anchor: the `<div className="flex border-b-2 …">` tab strip plus the three `{activeComponent === '…' && <…Section />}` panels):

```tsx
import { PredictionGate } from '@shared/components/common/PredictionGate';
const markPredictionGate = useProgressStore((s) => s.markPredictionGate);

<PredictionGate
  allowSkip={false}
  question="A solenoid's inductance is L = μN²A/l. If you double the number of turns N (keeping geometry fixed), how does L change?"
  options={[
    { id: '2x', label: 'Doubles (×2)' },
    { id: '4x', label: 'Quadruples (×4)' },
    { id: 'same', label: 'Unchanged' },
    { id: 'half', label: 'Halves' },
  ]}
  getCorrectAnswer={() => '4x'}
  explanation={<span>L depends on N², so doubling N multiplies L by 2² = 4. (R and C scale linearly with their geometry; only the inductor has a squared dependence.)</span>}
  onPredict={(correct) => markPredictionGate('component-physics', correct)}
>
  {/* tab strip + active component panel */}
</PredictionGate>
```
(The 3 `FigureImage`s above the explorer stay OUTSIDE the gate as static context — confirmed by spec open-question resolution.)

- [ ] **Step 6: Run → all green** — `npx vitest run src/circuits/components/__tests__/pages.test.tsx --no-file-parallelism`.
- [ ] **Step 7: Commit** `feat(circuits): blocking predict-first gate on Component Physics explorer`.

### Task F8: circuit-analysis / TimeDomain (CIRCUITS — breaks existing tests)

- [ ] **Smoke test** (in the `TimeDomain page` describe): assert `getByText('Predict First')` and `queryByRole('button', { name: 'RC Circuit' })` is **null** before predicting.
- [ ] **Update existing tests:** "renders with table of contents and circuit tabs" asserts the RC/RL/RLC tab buttons (gated) — prepend `await passPredictionGate(user, 'τ doubles; pole moves toward the origin (slower)')`. NOTE: "shows RC concept check by default" / "switches between circuit tabs" assert the *concept checks* (`/double R in an RC circuit/i`), which sit **after** the gated block (gate wraps only the tab strip + comparison panels) — verify whether they survive; if the concept-check text is outside the gate it needs no change, if inside, prepend the gate traversal. Run the file to see which fail, fix only those.
- [ ] **Gate code** — wrap the circuit-type tab strip + 3 comparison panels (anchor `<div id="circuit-analysis" … flex border-b-2 …>` + the `{selectedCircuit === '…' && <…CircuitComparison />}` lines):

```tsx
<PredictionGate
  allowSkip={false}
  question="You double R in a series RC circuit (C fixed). What happens to the time constant τ and the s-domain pole at s = −1/τ?"
  options={[
    { id: 'slower', label: 'τ doubles; pole moves toward the origin (slower)' },
    { id: 'faster', label: 'τ halves; pole moves away from origin (faster)' },
    { id: 'same', label: 'τ unchanged; pole fixed' },
    { id: 'gain', label: 'Only the DC gain changes' },
  ]}
  getCorrectAnswer={() => 'slower'}
  explanation={<span>τ = RC, so doubling R doubles τ; the pole at s = −1/τ slides toward the origin and the circuit responds more slowly. (RL is the opposite — there τ = L/R.)</span>}
  onPredict={(correct) => markPredictionGate('circuit-analysis', correct)}
>
  {/* circuit-type tab strip + selected comparison panel */}
</PredictionGate>
```
(Store key is the **section id** `'circuit-analysis'`, NOT the component name `TimeDomain`.)

- [ ] **Run → all green.** **Commit** `feat(circuits): blocking predict-first gate on Circuit Analysis selector`.

### Task F9: s-domain / SDomainAnalysis (CIRCUITS — needs lifted-state pattern + breaks existing tests)

`SDomainAnalysis`'s `<Tabs>` (from `@circuits/components/common/Tabs`) **remount panels on switch**, so a plain gate would re-lock. Use the lifted-state pattern.

- [ ] **Smoke test** (in `SDomainAnalysis page` describe): assert `getByText('Predict First')` + that `queryByText('Transfer Function Fundamentals')` is **null** before predicting.
- [ ] **Update existing tests:** "renders with Theory tab by default" (asserts `'Transfer Function Fundamentals'`, gated) and "switches to Damping tab via tablist" (the `tablist` is gated) — prepend `await passPredictionGate(user, 'Unstable — the response grows without bound')`. The concept-check tests ("poles at s = -3", "Stable, underdamped") reference `ConceptCheck`s that sit **before** the gated `<Tabs>` (lines ~102/347 < 376) → should survive; confirm by running the file and only fix reds.
- [ ] **Edit `SDomainAnalysis.tsx`:** add `useState` to the React import (currently only `useEffect`); add the store hook + unlock flag; wrap the `<Tabs … />`:

```tsx
import { useEffect, useState } from 'react';   // add useState
import { PredictionGate } from '@shared/components/common/PredictionGate';
// in SDomainAnalysis body:
const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
const [unlocked, setUnlocked] = useState(false);

<PredictionGate
  allowSkip={false}
  initialPassed={unlocked}
  onPassed={() => setUnlocked(true)}
  question="A second-order system has poles at s = +1 ± 2j (right half-plane). Is it stable?"
  options={[
    { id: 'unstable', label: 'Unstable — the response grows without bound' },
    { id: 'stable', label: 'Stable — it decays' },
    { id: 'marginal', label: 'Marginally stable — sustained oscillation' },
    { id: 'cant', label: "Can't tell from pole location" },
  ]}
  getCorrectAnswer={() => 'unstable'}
  explanation={<span>Any pole with a positive real part (right half-plane) makes the response grow as e^(+σt). The ±2j gives oscillation, but the +1 real part means it blows up — unstable.</span>}
  onPredict={(correct) => markPredictionGate('s-domain', correct)}
>
  <Tabs tabs={[ /* …existing Theory / Damping / Read-the-Plot tabs… */ ]} />
</PredictionGate>
```

- [ ] **Run → all green.** **Commit** `feat(circuits): blocking predict-first gate on S-Domain tabs (lifted unlock state)`.

### Task F10: Stream F verification + PR

- [ ] **Step 1: Full build + lint** — `npm run build && npm run lint` → both exit 0.
- [ ] **Step 2: Full test suite** — `npm test -- --no-file-parallelism` → all green (expect the existing count + ~9 new gate-smoke tests; no regressions). Read the final tally and confirm 0 failures before claiming success.
- [ ] **Step 3: Push + open PR.** Body: "9 sections now blocking predict-first (allowSkip=false); store keys = section ids; completion badges unaffected (markPredictionGate never feeds isModuleComplete)." Flag for the owner's pedagogy walk: confirm each prediction question's framing reads well in context, and that every gated EM canvas starts drawing correctly *when revealed* (rAF-on-reveal — the Faraday reference handles this; spot-check each). Do NOT merge before the visual/pedagogy walk.

---

# STREAM G — EM chart-quality fixes (branch `phase-1-batch-3-g-charts`, → PR)

**Files:**
- Modify: `src/em/components/common/PhysicsChart.tsx` (add `xType`, `xDomain`, `yScale`, `yDomain`, `y2Label`, `y2Scale` props + `axis?: 'left'|'right'` per line)
- Modify: `src/em/sections/coulomb/index.tsx`, `src/em/sections/gauss/index.tsx`, `src/em/sections/em-wave/index.tsx` (de-stringify x; route series; opt into log/dual-axis)
- Create: `src/em/components/common/__tests__/PhysicsChart.test.tsx` (render smoke for the new props)
- Create/extend tiny **exported pure data-builders** in the 3 call sites so the numeric-x contract is unit-testable

**Why builders are extracted:** the chart data is currently built inline in each section's render, so the "x stays numeric" fix is untestable headlessly. Extracting each generator into a small exported pure function (e.g. `buildForceData`) gives a real red→green unit test and is otherwise behavior-preserving.

### Task G1: Extend PhysicsChart — failing test first

- [ ] **Step 1: Write `src/em/components/common/__tests__/PhysicsChart.test.tsx`** (render smoke — recharts in jsdom renders into a 0-size `ResponsiveContainer`, so assert the component *mounts and titles* without throwing under each new prop combo; readability itself is a manual-walk item per spec §7):

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PhysicsChart } from '@em/components/common/PhysicsChart';

const data = [ { r: 0.1, F: 100, Flux: 5 }, { r: 0.2, F: 25, Flux: 5 }, { r: 0.4, F: 6.25, Flux: 5 } ];

describe('PhysicsChart new axis options', () => {
  it('renders with numeric x + log y without throwing', () => {
    render(<PhysicsChart title="Force" data={data} xKey="r" xType="number" xLabel="r" yLabel="F" yScale="log"
      lines={[{ dataKey: 'F', color: '#dc2626', name: 'F' }]} />);
    expect(screen.getByText('Force')).toBeInTheDocument();
  });
  it('renders a dual-axis chart (y2Label + per-line axis) without throwing', () => {
    render(<PhysicsChart title="Flux & Field" data={data} xKey="r" xType="number" xLabel="r"
      yLabel="E" yScale="log" y2Label="Flux"
      lines={[{ dataKey: 'F', color: '#dc2626', name: 'E', axis: 'left' }, { dataKey: 'Flux', color: '#9333ea', name: 'Flux', axis: 'right' }]} />);
    expect(screen.getByText('Flux & Field')).toBeInTheDocument();
  });
  it('still renders the default (category x, single linear y) chart', () => {
    render(<PhysicsChart title="Default" data={data} xKey="r" xLabel="r" yLabel="F"
      lines={[{ dataKey: 'F', color: '#000', name: 'F' }]} />);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run → FAIL** (TS error: unknown props `xType`/`yScale`/`y2Label`/`axis`). This is the type-level red.

- [ ] **Step 3: Edit `PhysicsChart.tsx`** — extend the interfaces and the JSX:

```tsx
interface ChartLine {
  dataKey: string;
  color: string;
  name: string;
  axis?: 'left' | 'right';   // default 'left'
}

interface PhysicsChartProps {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  xLabel: string;
  yLabel: string;
  lines: ChartLine[];
  xType?: 'number' | 'category';                       // default 'category' (preserve current behavior)
  xDomain?: [number | string, number | string];
  yScale?: 'linear' | 'log';                           // default 'linear'
  yDomain?: [number | string, number | string];        // log needs an explicit positive domain
  y2Label?: string;                                     // presence enables a right axis
  y2Scale?: 'linear' | 'log';
}
```
In the function signature destructure the new props with defaults: `xType = 'category'`, `yScale = 'linear'`, `y2Scale = 'linear'`. Then:
- `<XAxis dataKey={xKey} type={xType} {...(xType === 'number' ? { domain: xDomain ?? ['dataMin', 'dataMax'], allowDecimals: true } : {})} … />`
- Left axis: add `yAxisId="left" scale={yScale} domain={yDomain ?? ['auto', 'auto']} allowDataOverflow` to the existing `<YAxis>`.
- When `y2Label` is set, render a second axis after it: `<YAxis yAxisId="right" orientation="right" scale={y2Scale} tick={{ fontSize: 10, fill: textColor }} label={{ value: y2Label, angle: 90, position: 'insideRight', offset: 5, fontSize: 11, fill: textColor }} />`
- Each `<Line>` gets `yAxisId={line.axis === 'right' ? 'right' : 'left'}`.

- [ ] **Step 4: Run → PASS** (3/3) and `npx tsc -b` → exit 0. **Commit** `feat(chart): PhysicsChart numeric-x / log-y / dual-axis options (defaults unchanged)`.

### Task G2: coulomb — numeric x + log y (with extracted builder)

- [ ] **Step 1: Extract + test the builder.** In `coulomb/index.tsx`, replace the inline `forceData` IIFE/map with an exported pure function and call it:

```tsx
export function buildForceData(q1: number, q2: number, K: number) {
  return Array.from({ length: 40 }, (_, i) => {
    const r = 0.02 + i * 0.012;
    return { r: +r.toFixed(3), F: K * q1 * q2 / (r * r) };  // r NUMERIC; F full-precision number
  });
}
```
Add to `pages`/section tests (or a new `coulomb` test) — assert `typeof buildForceData(1,1,K)[0].r === 'number'` and that F is a positive number (log-safe).

- [ ] **Step 2: Run → FAIL** if currently stringified. Implement, run → PASS.
- [ ] **Step 3: Update the `<PhysicsChart>` call** for "Coulomb Force vs Distance":

```tsx
<PhysicsChart
  title="Coulomb Force vs Distance" data={forceData}
  xKey="r" xType="number" xLabel="Distance r (m)"
  yLabel="Force F (N, log scale)" yScale="log"
  lines={[{ dataKey: 'F', color: '#dc2626', name: 'F (N)' }]}
/>
```

- [ ] **Step 4: tsc + the coulomb test** → green. **Commit** `fix(em): Coulomb chart numeric x + log-y (readable 1/r² decay)`.

### Task G3: gauss — numeric x + dual-axis (E log-left, Flux linear-right) + zero guard

- [ ] **Step 1: Extract + test the builder.** Keep `r` numeric and values raw:

```tsx
export function buildGaussData(mode: 'ELECTRIC' | 'MAGNETIC', Q: number, flux: number, EPSILON_0: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const r = 0.2 + i * 0.06;
    const E = mode === 'ELECTRIC' && Q !== 0 ? Math.abs(Q) / (4 * Math.PI * EPSILON_0 * r * r) : 0;
    return { r: +r.toFixed(2), Flux: flux, E };
  });
}
```
Test: `typeof buildGaussData('ELECTRIC',1,5,EPS)[0].r === 'number'`.

- [ ] **Step 2: Update the `<PhysicsChart>` call.** ELECTRIC mode → numeric x, E on log left axis, Flux on linear right axis; replace the ambiguous `yLabel="Value"`:

```tsx
<PhysicsChart
  title={mode === 'ELECTRIC' ? 'Flux & Field vs Radius' : 'Magnetic Flux (always zero)'}
  data={data} xKey="r" xType="number" xLabel="Radius r (m)"
  yLabel={mode === 'ELECTRIC' ? 'E-field (N/C, log)' : 'Flux (Wb)'}
  yScale={mode === 'ELECTRIC' ? 'log' : 'linear'}
  y2Label={mode === 'ELECTRIC' ? 'Flux (N·m²/C)' : undefined}
  lines={
    mode === 'ELECTRIC'
      ? [
          { dataKey: 'E', color: '#dc2626', name: 'E-field (N/C)', axis: 'left' },
          { dataKey: 'Flux', color: '#9333ea', name: 'Flux (N·m²/C)', axis: 'right' },
        ]
      : [{ dataKey: 'Flux', color: '#2563eb', name: 'Magnetic Flux' }]
  }
/>
```

- [ ] **Step 3: Log-zero guard (spec risk).** A log axis cannot plot 0. In ELECTRIC mode the builder yields `E=0` when `charge === 0`. Guard: when the chart is in ELECTRIC mode AND `charge === 0`, either render the chart with `yScale="linear"` or suppress the E line. Add a unit assertion that `buildGaussData('ELECTRIC', 0, …)` is handled (no log applied / E line dropped).
- [ ] **Step 4: tsc + gauss test + the existing `sections.test.tsx`** (`"Flux Through Any Surface"` capstone still present) → green. **Commit** `fix(em): Gauss dual-axis (E log-left, Flux linear-right) + numeric x + zero guard`.

### Task G4: em-wave — numeric x on both charts + true-scale B on a 2nd axis (per G2)

- [ ] **Step 1: De-stringify both builders.** Snapshot: `return { x, E: +E.toFixed(2), B: +Braw.toFixed(4) };` (drop `x.toFixed(0)` and the `Bscaled = Braw*300` hand-scaling). Power: `return { t: +t.toFixed(2), P: +(v*iVal/1000).toFixed(3) };` (drop `t.toFixed(2)` string). Extract both to exported builders + assert numeric x/t.
- [ ] **Step 2: Update both `<PhysicsChart>` calls.** Snapshot → numeric x, B on a true-scale right axis:

```tsx
<PhysicsChart
  title="E & B Field Snapshot (t = 0)" data={data}
  xKey="x" xType="number" xLabel="Position (arb.)"
  yLabel="E (V/m, arb.)" y2Label="B (T, arb.)"
  lines={[
    { dataKey: 'E', color: '#dc2626', name: 'E-field', axis: 'left' },
    { dataKey: 'B', color: '#2563eb', name: 'B-field', axis: 'right' },
  ]}
/>
```
Power chart → just add `xType="number"` (single linear axis, no log):

```tsx
<PhysicsChart title="Instantaneous Power p(t) = v·i" data={data}
  xKey="t" xType="number" xLabel="Time t (s)" yLabel="Power p (kW)"
  lines={[{ dataKey: 'P', color: '#9333ea', name: 'p(t)' }]} />
```

- [ ] **Step 3: tsc + em-wave tests** → green. **Commit** `fix(em): EM-wave charts numeric x + true-scale B on 2nd axis (drop ×c fudge)`.

### Task G5: Stream G verification + PR

- [ ] **Step 1: Full build + lint** → both exit 0. (Watch for recharts v3 typing friction — if a `YAxis`/`Line` `yAxisId` cast is needed, mirror the existing `as unknown as` pattern in `InteractiveLab`/`SDomainPanel`, but prefer no cast — the 3.8.1 `.d.ts` supports these natively.)
- [ ] **Step 2: Full test suite** `npm test -- --no-file-parallelism` → all green; read the tally, confirm 0 failures.
- [ ] **Step 3: Push + open PR.** Body must flag the **manual-walk** items (not headless-verifiable): every EM chart now reads correctly (numeric x spacing; coulomb F + gauss E decay as straight-ish log curves; gauss dual-axis legible; em-wave E/B both visible at true scale). Flag G2 as a deliberate pedagogy change (B no longer ×c) for author sign-off. Do NOT merge before the visual walk.

---

## Self-Review (run against the spec)

**Spec coverage:** A (widen 48% ✓, mobile jump ✓, opt-in 3 consumers ✓), F (all 9 sections ✓ with the EM/circuits/s-domain-lifted patterns ✓ and `allowSkip={false}` ✓), G (PhysicsChart 3 fixes ✓, 4 call sites ✓ — coulomb log, gauss dual-axis, em-wave ×2, zero guard ✓). Section numbering (C), images (B), landing (D), visual language (E) are Batches 1–2 — out of scope here.

**Type consistency:** gate prop names match `PredictionGate.tsx` exactly (`allowSkip`, `getCorrectAnswer`, `onPredict`, `initialPassed`, `onPassed`, `options[].id/label`). PhysicsChart new props (`xType`/`xDomain`/`yScale`/`yDomain`/`y2Label`/`y2Scale`, `ChartLine.axis`) are used identically in component and call sites. Store key is the **section id** everywhere (not component name).

**No placeholders:** every gate has full question/options/answer/explanation; every chart call shows final props; tests show real assertions.

**Known traps encoded:** (1) blocking gate breaks `pages.test.tsx` — explicit update steps + `passPredictionGate` helper; (2) `sections.test.tsx` is safe (asserts only out-of-gate text); (3) s-domain Tabs remount → lifted `initialPassed`/`onPassed`; (4) `circuit-analysis` store key ≠ `TimeDomain`; (5) gauss log-axis zero guard; (6) Smith chart letterboxing at 48% → visual-QA flag, not a code change; (7) duplicate-id avoidance (`lab-smith` ≠ `smith-chart`).

---

## Execution Handoff

Each stream is an independent branch + PR, sequenced **A → F → G**, each gated on the owner's visual/pedagogy walk before merge (Batch 1/2 precedent). Recommended: **subagent-driven** — one fresh subagent per task with a two-stage review between tasks, since the F stream has 9 near-identical-but-distinct content tasks that benefit from isolated context.
