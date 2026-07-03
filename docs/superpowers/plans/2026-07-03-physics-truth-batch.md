# Physics-Truth Batch Implementation Plan (audit roadmap #1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 1 critical + 8 major correctness defects (P-01…P-09) and the dark-mode pole charts (C-02) from `docs/audits/2026-07-03-post-redesign-lo-ux-audit.md`, and add regression guards so the next wrong formula card cannot ship.

**Architecture:** Display-truth fixes only — the numeric solver (`circuitSolver.ts`) is already correct and serves as the oracle; every displayed closed form is brought to match it (or the physics), then pinned by (a) render-level `hasFormula` string pins and (b) a JS-mirror-vs-solver numeric guard. Transmission math gets two real behavior fixes (bounce arrival term, R_rad feed-point referral) with unit tests. The em-wave phasor view is converted to the course's cosine-reference convention in one coherent edit (rotation sign + sin→cos + projection axis + equations + golden re-pins).

**Tech Stack:** React 19 + TypeScript, KaTeX via MathWrapper, Recharts, Zustand (`useThemeStore`), Vitest (+ Testing Library, katex mocked in render-pin tests).

## Global Constraints

- **Precondition:** PR #57 (audit docs) is merged. Start: `git checkout main && git pull && git checkout -b fix/physics-truth-batch`.
- **Machine (home-desktop):** unit tests ALWAYS `npx vitest run --no-file-parallelism [path]` from inside the repo (fork pool OOMs this box). Full serial suite ≈ 6.5 min.
- **Gates before PR (all green, executed output shown):** `npm run build` · `npm run lint` · `npx vitest run --no-file-parallelism` · `npm run e2e` (source changes ⇒ e2e required; ×3 projects, port 4273).
- **KaTeX backslash contract** (guard test scans all source): in a JSX *attribute*, single backslash (`formula="\tau"`); in a JS string/template literal, double (`'\\tau'`). Never violate.
- **Notation authority:** the resolved conventions in `.claude/skills/em-ca-textbook-conventions/` — cosine reference for phasors (hard rule 2); wave phase written ωt − kx (Ulaby ordering).
- **DO NOT TOUCH:** `circuitSolver.ts` math (correct; oracle); the H(s) impulse cards at `InteractiveLab/index.tsx:86,121` (pinned by `rlImpulseTransfer.test.tsx`: `\frac{1/L}{s + R/L}` must stay, `\frac{R/L}{s + R/L}` must stay absent); the natural-response card `formula="v(t) = A_1 e^{s_1 t} + A_2 e^{s_2 t}"` in `TimeDomain/ResponseComparisons.tsx:32` (pinned by `sDomainFormulas.test.tsx:52-64` — it is a NATURAL-response context and is correct); every string pinned by `phaseUnits.test.tsx` ('AC Phasors' button, 'V Phase' slider, '45°', '(arb.)' counts — none reference sin/cos, so P-09 must not rename them).
- **Conventional commits** with scope, one per task. Line numbers below were verified 2026-07-03 (HEAD `bc77566` + PR #57 docs); re-locate by CONTENT if drifted.
- **Release note (SW/PWA):** vite-plugin-pwa `autoUpdate` means students can see the OLD formulas until their next visit's SW activation — mention in the PR body.

---

### Task 1: componentMath RLC step forms carry the forced term (P-04)

**Files:**
- Modify: `src/circuits/utils/componentMath.ts:36-38` (the `rlc.overdamped/criticallyDamped/underdamped` strings)
- Test: `src/circuits/components/modules/TimeDomain/__tests__/sDomainFormulas.test.tsx` (extend — append the new `it` INSIDE the existing describe: `passGate` is scoped to it; `renderTimeDomain`/`hasFormula` are module-scope)

**Interfaces:**
- Consumes: existing `circuitAnalysisFormulas.rlc.*` strings (JS strings — double backslashes correct), sole consumer `TimeDomain/index.tsx:491-510` "Step 4: Solutions by Damping Type" (formula bindings at :496/:501/:506) under the DRIVEN ODE of Step 3 (RHS `V_s/LC`, :482).
- Produces: corrected strings other tasks do not consume; the render pins added here stay permanent.

- [ ] **Step 1: Write the failing test** — append to the existing `describe` in `sDomainFormulas.test.tsx` (it already mocks katex and provides `hasFormula` + `passGate`; the Step-4 formulas live under the same 'RLC Circuit' tab used by the test at :66 — follow that test's tab-click):

```tsx
  it('Step 4 damping solutions carry the forced term V_s (audit P-04)', async () => {
    const user = userEvent.setup();
    renderTimeDomain();
    await passGate(user);
    await user.click(screen.getByRole('button', { name: 'RLC Circuit' })); // circuit tabs render as buttons — same query as the test at :70

    // Driven step equation (Step 3 RHS = V_s/LC) ⇒ complete response = V_s + natural modes.
    expect(hasFormula(String.raw`v(t) = V_s + A_1e^{s_1t} + A_2e^{s_2t}`)).toBe(true);
    expect(hasFormula(String.raw`v(t) = V_s + (A_1 + A_2t)e^{-\alpha t}`)).toBe(true);
    expect(hasFormula(String.raw`v(t) = V_s + e^{-\alpha t}(A_1\cos(\omega_d t) + A_2\sin(\omega_d t))`)).toBe(true);
    // The old source-free forms must be gone from Step 4 (unspaced variants —
    // the SPACED natural-response card in ResponseComparisons stays and is
    // asserted true elsewhere in this file).
    expect(hasFormula(String.raw`v(t) = A_1e^{s_1t} + A_2e^{s_2t}`)).toBe(false);
  });
```


- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --no-file-parallelism src/circuits/components/modules/TimeDomain/__tests__/sDomainFormulas.test.tsx`
Expected: new `it` FAILS (first `hasFormula` false); all pre-existing `it`s PASS.

- [ ] **Step 3: Fix the three strings** in `componentMath.ts` (JS strings ⇒ `\\`):

```ts
    overdamped: 'v(t) = V_s + A_1e^{s_1t} + A_2e^{s_2t}',
    criticallyDamped: 'v(t) = V_s + (A_1 + A_2t)e^{-\\alpha t}',
    underdamped: 'v(t) = V_s + e^{-\\alpha t}(A_1\\cos(\\omega_d t) + A_2\\sin(\\omega_d t))',
```

- [ ] **Step 4: Run the test file again** — Expected: ALL PASS (including the pre-existing A.2#1 pin, which targets the spaced ResponseComparisons string and cannot collide).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "fix(circuit-analysis): Step-4 damping solutions carry the forced term V_s (audit P-04)"`

---

### Task 2: InteractiveLab impulse cards carry V_s (P-02)

**Files:**
- Modify: `src/circuits/components/modules/InteractiveLab/index.tsx:82` and `:117` (time-domain impulse formulas ONLY — the H(s) cards at :86/:121 stay)
- Test: `src/circuits/components/modules/InteractiveLab/__tests__/rlImpulseTransfer.test.tsx` (extend — NOTE: the file has NO named render helper; the render is inline in its single `it` at :26-30. First extract it to module scope and reuse it in both `it`s:)

```tsx
function renderRLImpulse() {
  return render(
    <MemoryRouter initialEntries={['/interactive-lab?circuit=RL&input=impulse']}>
      <InteractiveLab />
    </MemoryRouter>,
  );
}
```

**Interfaces:**
- Consumes: chart ground truth `calculateRCImpulseResponse` (`vScale = Vs/(RC)`, :90) and `calculateRLImpulseResponse` (`iScale = Vs/L`, :104) in `src/circuits/utils/circuitSolver.ts:86-112` — the plotted response is to `V_s·δ(t)`.
- Produces: card strings `v_C(t) = \frac{V_s}{RC}e^{-t/\tau}` and `i(t) = \frac{V_s}{L}e^{-Rt/L}` (pinned in Task 5's mirror table).

- [ ] **Step 1: Write the failing assertions** — add to `rlImpulseTransfer.test.tsx`'s describe:

```tsx
  it('RL time-domain impulse card carries the source factor V_s (audit P-02)', () => {
    renderRLImpulse(); // module-scope helper extracted above (render is synchronous)
    expect(hasFormula(String.raw`i(t) = \frac{V_s}{L}e^{-Rt/L}`)).toBe(true);
    expect(hasFormula(String.raw`i(t) = \frac{1}{L}e^{-Rt/L}`)).toBe(false);
    // H(s) is the UNIT-impulse transfer function and must stay V_s-free:
    expect(hasFormula(String.raw`H(s) = \frac{1/L}{s + R/L}`)).toBe(true);
  });
```

Add a sibling RC test in the same file using a second helper with `initialEntries={['/interactive-lab?circuit=RC&input=impulse']}`: pin `v_C(t) = \frac{V_s}{RC}e^{-t/\tau}` true / `v_C(t) = \frac{1}{RC}e^{-t/\tau}` false / `H(s) = \frac{1/RC}{s + 1/RC}` true.

- [ ] **Step 2: Run to verify the new its fail** — `npx vitest run --no-file-parallelism src/circuits/components/modules/InteractiveLab/__tests__/rlImpulseTransfer.test.tsx` → new its FAIL, old PASS.
- [ ] **Step 3: Edit the two JSX attributes** (single backslashes — JSX attribute):

Line 82: `<MathWrapper formula="v_C(t) = \frac{V_s}{RC}e^{-t/\tau}" block />`
Line 117: `<MathWrapper formula="i(t) = \frac{V_s}{L}e^{-Rt/L}" block />`

- [ ] **Step 4: Run the test file** → ALL PASS.
- [ ] **Step 5: Commit** — `fix(interactive-lab): impulse response cards carry V_s — 10x amplitude mismatch vs chart (audit P-02)`

---

### Task 3: Overdamped step card gets its forced term (P-01 — the critical)

**Files:**
- Modify: `src/circuits/components/modules/InteractiveLab/index.tsx:191-192` (the overdamped step branch)
- Test: new `src/circuits/components/modules/InteractiveLab/__tests__/overdampedStepCard.test.tsx`

**Interfaces:**
- Consumes: solver ground truth `calculateRLCUnified` overdamped step: `v = V_s(1 + (s₂e^{s₁t} − s₁e^{s₂t})/(s₁−s₂))` ≡ `V_s + A₁e^{s₁t} + A₂e^{s₂t}` with `A₁ = V_s·s₂/(s₁−s₂)`, `A₂ = −V_s·s₁/(s₁−s₂)` (from `v(0)=0`, `dv/dt(0)=0`). Default InteractiveLab params (R=100 Ω, L=0.1 H, C=100 µF) are overdamped (ζ≈1.58), so the default view shows this card.
- Produces: the corrected card string, pinned here and mirrored in Task 5.

- [ ] **Step 1: Write the failing test** (new file; copy the katex mock + `hasFormula` helper verbatim from `sDomainFormulas.test.tsx:1-30`; render via `MemoryRouter initialEntries={['/interactive-lab']}` — circuit/input seed from searchParams with defaults RLC/step at `index.tsx:331-334`, so the plain route already shows the overdamped step card; name the local helper `renderInteractiveLabRLCStep`):

```tsx
/**
 * Audit P-01 (CRITICAL): the displayed overdamped STEP response was
 * v_C(t) = V_s(A_1 e^{s_1 t} + A_2 e^{s_2 t}) — no forced term, so it decays
 * to 0 for ANY constants, while the chart (and circuitSolver, RK4-verified)
 * pins v(0)=0, v(∞)=V_s. The card must show the complete response.
 */
describe('overdamped step card shows the complete response (P-01)', () => {
  it('carries the forced term and drops the old decaying form', async () => {
    renderInteractiveLabRLCStep();
    expect(hasFormula(String.raw`v_C(t) = V_s + A_1 e^{s_1 t} + A_2 e^{s_2 t}`)).toBe(true);
    expect(hasFormula(String.raw`v_C(t) = V_s(A_1 e^{s_1 t} + A_2 e^{s_2 t})`)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/circuits/components/modules/InteractiveLab/__tests__/overdampedStepCard.test.tsx`
- [ ] **Step 3: Fix the card** at :191 (JSX attribute, single backslashes) and extend the explainer line:

```tsx
                  <MathWrapper formula="v_C(t) = V_s + A_1 e^{s_1 t} + A_2 e^{s_2 t}" block />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">where s&#8321;, s&#8322; are the two distinct real roots; the initial conditions fix the constants (v(0)=0 &rArr; V_s + A&#8321; + A&#8322; = 0), so v(&infin;) = V_s</p>
```

- [ ] **Step 4: Run the test file** → PASS. Also re-run Task 2's file (same source file touched) → PASS.
- [ ] **Step 5: Commit** — `fix(interactive-lab): overdamped step card shows complete response with forced term V_s (audit P-01, critical)`

---

### Task 4: Envelope-τ panel is damping-aware (P-03)

**Files:**
- Modify: `src/circuits/components/modules/InteractiveLab/index.tsx:205-253` (`RLCAnalysisPanel` — add `export` and the damping-aware τ card)
- Test: new `src/circuits/components/modules/InteractiveLab/__tests__/rlcEnvelopeLabels.test.tsx` (pattern: `firstOrderImpulseLabels.test.tsx`, which renders the exported panel directly with fixture props)

**Interfaces:**
- Consumes: `response.dampingType / alpha / omega0` (all present on `CircuitResponse`, already used at :212/:255).
- Produces: `export function RLCAnalysisPanel(...)` (adds the `export` keyword so the test can render it directly — same approach as the exported `FirstOrderAnalysisPanel`).

- [ ] **Step 1: Write the failing test**:

```tsx
/**
 * Audit P-03: 'Envelope τ = 1/α … 99% in ~5τ' was shown for ALL damping types,
 * but 1/α is the envelope constant ONLY when underdamped; for the DEFAULT
 * overdamped circuit (R=100Ω, L=0.1H, C=100µF: α=500, ω₀≈3162… no: ω₀=316.2,
 * s₁=−112.7 s⁻¹) the true 99% settle is ~5/|s₁| ≈ 44 ms, not 5·(1/α)=10 ms.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RLCAnalysisPanel } from '../index'; // same relative import form firstOrderImpulseLabels.test.tsx uses for FirstOrderAnalysisPanel (exported at index.tsx:269)

const base = { data: [], timeConstant: undefined };

describe('RLCAnalysisPanel τ card is damping-aware (P-03)', () => {
  it('overdamped: labels the slowest mode 1/|s₁| and drops the universal 99%-in-5τ hint', () => {
    render(<RLCAnalysisPanel response={{ ...base, dampingType: 'overdamped', alpha: 500, omega0: 316.2278, zeta: 1.5811 }} timeConstantMs={2} />);
    expect(screen.getByText(/Slowest mode/i)).toBeInTheDocument();
    // 1/|−500+√(500²−316.2278²)| = 1/112.702 s = 8.873 ms
    expect(screen.getByText('8.873')).toBeInTheDocument();
  });
  it('underdamped: keeps the envelope label and the ~5τ question', () => {
    render(<RLCAnalysisPanel response={{ ...base, dampingType: 'underdamped', alpha: 500, omega0: 1000, zeta: 0.5 }} timeConstantMs={2} />);
    expect(screen.getByText(/Envelope/i)).toBeInTheDocument();
    expect(screen.getByText('2.000')).toBeInTheDocument(); // 1/α = 2 ms
  });
});
```


- [ ] **Step 2: Run to verify FAIL** (export missing + labels missing).
- [ ] **Step 3: Implement** — add `export` before `function RLCAnalysisPanel` and replace the Envelope card at :247-253 with:

```tsx
  const { alpha = 0, omega0 = 0, dampingType } = response;
  const slowestTauMs = dampingType === 'overdamped'
    ? 1000 / Math.abs(-alpha + Math.sqrt(alpha * alpha - omega0 * omega0))
    : 1000 / alpha;
  const tauLabel = dampingType === 'overdamped' ? 'Slowest mode τ = 1/|s₁|'
    : dampingType === 'critically-damped' ? 'Decay τ = 1/α'
    : 'Envelope τ = 1/α';
  const tauHint = dampingType === 'overdamped'
    ? 'The slow pole s₁ governs settling: about five of these time constants reaches ~99% of the final value — check it against the chart.'
    : dampingType === 'critically-damped'
      ? '(1 + αt)e^{−αt} settles slower than a pure exponential — expect roughly seven time constants to reach 99%.'
      : 'How many envelope time constants until the response reaches ~99% of its final value? Does the simulation confirm about five?';
```

…and in the card JSX use `{tauLabel}` / `{slowestTauMs.toFixed(3)}` / `{tauHint}` in place of the hardcoded label, `{timeConstantMs.toFixed(3)}`, and the old italic question. (Keep the `timeConstantMs` prop — other readouts may use it; only this card switches.)

- [ ] **Step 4: Run the new test file + Task 2/3 files** → ALL PASS.
- [ ] **Step 5: Commit** — `fix(interactive-lab): tau card damping-aware — slowest-mode constant for overdamped (audit P-03)`

---

### Task 5: Formula-mirror guard — displayed closed forms pinned to the solver

**Files:**
- Create: `src/circuits/utils/__tests__/formulaMirrors.test.ts`

**Interfaces:**
- Consumes: `calculateCircuitResponse(type, {R,L,C,voltage}, timeStep, duration, inputType)` → `{data: {time, voltage, current}[]}` with exact samples `t_i = i·timeStep`; the card forms fixed in Tasks 1–3.
- Produces: the guard the premortem demanded — "pin displayed closed-form solution strings to the numeric solver" so the next P-01 cannot ship.

- [ ] **Step 1: Write the guard** (magneticCircuits.test.ts style: hand-derivation comments, `toBeCloseTo(…, 6)`; each mirror is the JS twin of a DISPLAYED card, ×V_s for the unit-impulse cards):

```ts
import { describe, it, expect } from 'vitest';
import { calculateCircuitResponse } from '@circuits/utils/circuitSolver';

/**
 * Audit P-01/P-02 regression class-guard: every closed-form card displayed in
 * InteractiveLab/TimeDomain has a JS mirror here, evaluated against the solver
 * at indexed samples (t_i = i·timeStep exactly — no interpolation). If a card
 * and the solver ever disagree again, this suite fails instead of a student.
 * Post-Task-2 the time-domain impulse cards carry V_s, so their mirrors are
 * direct twins (×1); only the H(s) cards remain unit-impulse-referenced (and
 * are not mirrored here — they are transfer functions, not time signals).
 */
const TS = 1e-4, DUR = 0.01;

describe('displayed formulas match circuitSolver (P-01/P-02 guard)', () => {
  it('RC step: v=Vs(1−e^{−t/τ}), i=(Vs/R)e^{−t/τ} — R=1kΩ, C=1µF, τ=1ms=10·TS', () => {
    const r = calculateCircuitResponse('RC', { R: 1000, L: 0, C: 1e-6, voltage: 10 }, TS, DUR);
    for (const i of [0, 10, 50]) { // t = 0, τ, 5τ
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-t / 1e-3)), 6);
      expect(r.data[i].current).toBeCloseTo((10 / 1000) * Math.exp(-t / 1e-3), 6);
    }
  });
  it('RC impulse: card v=(Vs/RC)e^{−t/τ} (P-02 form ×1, already Vs-carrying)', () => {
    const r = calculateCircuitResponse('RC', { R: 1000, L: 0, C: 1e-6, voltage: 10 }, TS, DUR, 'impulse');
    for (const i of [0, 10, 50]) {
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo((10 / (1000 * 1e-6)) * Math.exp(-t / 1e-3), 6);
    }
  });
  it('RL step + impulse: τ=L/R=1ms — R=100Ω, L=0.1H', () => {
    const step = calculateCircuitResponse('RL', { R: 100, L: 0.1, C: 0, voltage: 10 }, TS, DUR);
    const imp = calculateCircuitResponse('RL', { R: 100, L: 0.1, C: 0, voltage: 10 }, TS, DUR, 'impulse');
    for (const i of [0, 10, 50]) {
      const t = step.data[i].time;
      expect(step.data[i].current).toBeCloseTo((10 / 100) * (1 - Math.exp(-100 * t / 0.1)), 6);
      expect(step.data[i].voltage).toBeCloseTo(10 * Math.exp(-100 * t / 0.1), 6);
      expect(imp.data[i].current).toBeCloseTo((10 / 0.1) * Math.exp(-100 * t / 0.1), 4); // i(t)=(Vs/L)e^{−Rt/L}
    }
  });
  it('RLC overdamped step: v = Vs + A₁e^{s₁t} + A₂e^{s₂t}, A₁=Vs·s₂/(s₁−s₂), A₂=−Vs·s₁/(s₁−s₂) — the P-01 card', () => {
    // R=100Ω, L=0.1H, C=100µF (InteractiveLab defaults): α=500, ω₀=316.2278, ζ=1.581
    const r = calculateCircuitResponse('RLC', { R: 100, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    const alpha = 500, w0 = 1 / Math.sqrt(0.1 * 1e-4);
    const sq = Math.sqrt(alpha * alpha - w0 * w0), s1 = -alpha + sq, s2 = -alpha - sq;
    const A1 = 10 * s2 / (s1 - s2), A2 = -10 * s1 / (s1 - s2);
    for (const i of [0, 20, 88]) { // t = 0, 2ms, 8.8ms (~1/|s₁|)
      const t = r.data[i].time;
      expect(r.data[i].voltage).toBeCloseTo(10 + A1 * Math.exp(s1 * t) + A2 * Math.exp(s2 * t), 6);
    }
    expect(r.data[r.data.length - 1].voltage).toBeGreaterThan(5); // charges toward Vs, never decays to 0
  });
  it('RLC underdamped step + critically-damped step match their cards', () => {
    // Underdamped: R=20Ω, L=0.1H, C=100µF → α=100, ω₀=316.2278, ζ=0.316
    const u = calculateCircuitResponse('RLC', { R: 20, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    const a = 100, w0 = 1 / Math.sqrt(0.1 * 1e-4), wd = Math.sqrt(w0 * w0 - a * a);
    for (const i of [0, 10, 30]) {
      const t = u.data[i].time;
      expect(u.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t))), 6);
    }
    // Critically damped: L=0.1H, C=100µF → ω₀=316.2278, R=2Lω₀=63.2456Ω → α=ω₀
    const R = 2 * 0.1 * w0;
    const c = calculateCircuitResponse('RLC', { R, L: 0.1, C: 1e-4, voltage: 10 }, TS, DUR);
    for (const i of [0, 10, 30]) {
      const t = c.data[i].time;
      expect(c.data[i].voltage).toBeCloseTo(10 * (1 - Math.exp(-w0 * t) * (1 + w0 * t)), 6);
    }
  });
});
```

- [ ] **Step 2: Run it** — `npx vitest run --no-file-parallelism src/circuits/utils/__tests__/formulaMirrors.test.ts`
Expected: ALL PASS immediately (solver is already correct — this task pins the identity; it fails only if a future edit breaks either side). The critically-damped params are safe: R = 2Lω₀ = 63.2456 Ω gives ζ = 1.0 bit-for-bit, and `classifyDamping`'s 0.01 ζ-tolerance corresponds to R ∈ [62.61, 63.88] Ω — no boundary flip possible.
- [ ] **Step 3: Commit** — `test(circuits): formula-mirror guard pins displayed closed forms to circuitSolver (audit P-01 class-guard)`

---

### Task 6: BounceDiagram terminal voltages include the (1+Γ) arrival term (P-05)

**Files:**
- Modify: `src/transmission/components/simulations/BounceDiagram.tsx:116-152` (`computeVoltageData` — new signature + arrival-jump semantics; export it, `computeBounces` (:61-108), and the local `initialVoltage` helper (:53-56) for tests; KEEP the `steadyStateVoltage` wrapper at :161-165 — the V_ss readout uses it) and `:218-221` (call site adds `gammaLoad, gammaSource` args + deps)
- Test: new `src/transmission/components/simulations/__tests__/bounceVoltagePlateaus.test.ts`

**Interfaces:**
- Consumes: `computeBounces(gammaLoad, gammaSource, numBounces)` (UNTOUCHED — its `seg.amplitude` is the raw traveling-wave amplitude the canvas labels need); `steadyStateVoltageFromGamma(v0, ΓL, ΓS)` and `initialVoltage(ΓS)` as oracles.
- Produces: `export function computeVoltageData(segments: BounceSegment[], gammaLoad: number, gammaSource: number): { sourceData: {time:number;voltage:number}[]; loadData: …; maxTime: number }`.

- [ ] **Step 1: Write the failing test**:

```ts
import { describe, it, expect } from 'vitest';
import { computeBounces, computeVoltageData, initialVoltage } from '@transmission/components/simulations/BounceDiagram';
import { steadyStateVoltageFromGamma } from '@transmission/utils/transmissionMath';
// initialVoltage is a local helper at BounceDiagram.tsx:53-56 (VS=10, Z0=50
// module constants + zsFromGamma divider) — add `export` to it in Step 3.
// Verified values: initialVoltage(0) = 5.0 V exactly; initialVoltage(0.5) = 2.5 V exactly.

/**
 * Audit P-05: a wave of amplitude a arriving at an end with reflection Γ jumps
 * the terminal voltage by a·(1+Γ) AT THE ARRIVAL — incident plus the reflection
 * launched that instant. The old code added only +a at arrival and parked the
 * Γ·a on the NEXT segment's departure, so the LAST visible segment's plateau
 * was short by Γ·a (ΓL=0.5, ΓS=0, 1 bounce: plotted 5 V, physical 7.5 V).
 */
describe('bounce chart plateaus carry the (1+Γ) arrival term (P-05)', () => {
  it('single bounce, matched source: load plateau = V0·(1+ΓL) = V_ss', () => {
    const v0 = initialVoltage(0); // Γs=0
    const segs = computeBounces(0.5, 0, 1);
    const { loadData } = computeVoltageData(segs, 0.5, 0);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(v0 * 1.5, 6);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(steadyStateVoltageFromGamma(v0, 0.5, 0), 6);
  });
  it('ΓL=ΓS=0.5: both terminal series converge to V_ss as bounces grow', () => {
    const v0 = initialVoltage(0.5);
    const segs = computeBounces(0.5, 0.5, 30);
    const { sourceData, loadData } = computeVoltageData(segs, 0.5, 0.5);
    const vss = steadyStateVoltageFromGamma(v0, 0.5, 0.5);
    expect(loadData[loadData.length - 1].voltage).toBeCloseTo(vss, 3);
    expect(sourceData[sourceData.length - 1].voltage).toBeCloseTo(vss, 3);
  });
  it('source terminal at t=0 shows only the launch V0', () => {
    const segs = computeBounces(0.5, 0.5, 4);
    const { sourceData } = computeVoltageData(segs, 0.5, 0.5);
    expect(sourceData[1]).toEqual({ time: 0, voltage: initialVoltage(0.5) });
  });
});
```

- [ ] **Step 2: Run to verify FAIL** (functions not exported; then values wrong) — `npx vitest run --no-file-parallelism src/transmission/components/simulations/__tests__/bounceVoltagePlateaus.test.ts`
- [ ] **Step 3: Implement** — export both functions and replace the body:

```ts
export function computeVoltageData(
  segments: BounceSegment[],
  gammaLoad: number,
  gammaSource: number,
) {
  const sourceData: { time: number; voltage: number }[] = [{ time: 0, voltage: 0 }];
  const loadData: { time: number; voltage: number }[] = [{ time: 0, voltage: 0 }];

  let sourceVoltage = 0;
  let loadVoltage = 0;

  for (const seg of segments) {
    if (seg.direction === 'forward') {
      // Only the FIRST forward wave is a launch that appears at the source on
      // departure; Γ_S re-reflections are already inside the (1+Γ_S) arrival
      // jump of the backward wave that spawned them.
      if (seg.index === 0) {
        sourceVoltage += seg.amplitude;
        sourceData.push({ time: seg.timeStart, voltage: sourceVoltage });
      }
      // Arrival at the load: incident + simultaneously launched reflection.
      loadVoltage += seg.amplitude * (1 + gammaLoad);
      loadData.push({ time: seg.timeEnd, voltage: loadVoltage });
    } else {
      // Backward wave: its departure is already inside the load's (1+Γ_L) jump.
      sourceVoltage += seg.amplitude * (1 + gammaSource);
      sourceData.push({ time: seg.timeEnd, voltage: sourceVoltage });
    }
  }

  const maxTime = segments.length > 0 ? segments[segments.length - 1].timeEnd + 1 : 2;
  sourceData.push({ time: maxTime, voltage: sourceVoltage });
  loadData.push({ time: maxTime, voltage: loadVoltage });

  return { sourceData, loadData, maxTime };
}
```

…and at the call site (:218-221): `computeVoltageData(visibleSegments, gammaLoad, gammaSource)` with `[visibleSegments, gammaLoad, gammaSource]` deps. (The step-function builders at :496-517 and both `VoltageChart`s need no change.)

- [ ] **Step 4: Run** the new test + `bounceSteadyState.test.tsx` (must stay green — the ∞/unstable readout path is untouched) → ALL PASS.
- [ ] **Step 5: Commit** — `fix(transients): bounce charts add the (1+Γ) terminal arrival term — final plateau was 50% low (audit P-05)`

---

### Task 7: Radiation resistance referred to the feed point (P-06)

**Files:**
- Modify: `src/transmission/utils/transmissionMath.ts:197-216` (`calculateRadiationResistance` at :201-216 + docstring from :197)
- Modify: `src/transmission/components/simulations/RadiationPatternSim.tsx:230-234` (readout gains a sublabel — `ReadoutCard` already has an optional `sublabel` prop)
- Test: `src/transmission/utils/__tests__/transmissionMath.test.ts:313-320` (extend the existing describe)

**Interfaces:**
- Consumes: `calculateRadiationPattern(dipoleLengthFraction, theta)` (untouched); slider range 0.1–1.5λ step 0.05 (L=1.0λ reachable ⇒ clamp mandatory).
- Produces: same signature, now feed-point referred: `R_in = 60·∫F²sinθdθ / max(sin²(π·L_λ), 1e-3)`.

- [ ] **Step 1: Extend the existing describe with failing tests**:

```ts
  it('half-wave dipole: R_rad ≈ 73 ohms', () => {   // existing — stays green (sin²(π/2)=1)
    const Rrad = calculateRadiationResistance(0.5);
    expect(Rrad).toBeCloseTo(73, 0);
  });
  it('short dipole 0.1λ is FEED-POINT referred: ≈ 2 Ω ≈ 20π²(L/λ)², not the 0.19 Ω I_max value (P-06)', () => {
    const Rin = calculateRadiationResistance(0.1);
    expect(Rin).toBeGreaterThan(1.5);          // old I_max-referred value was ≈0.195
    expect(Rin).toBeCloseTo(20 * Math.PI ** 2 * 0.01, 0); // ≈1.97; repo's 360-step integral gives ≈2.00 (raw I_max value ≈0.191)
  });
  it('full-wave dipole (feed at a current null) stays finite via the clamp', () => {
    const Rin = calculateRadiationResistance(1.0);
    expect(Number.isFinite(Rin)).toBe(true);
    expect(Rin).toBeGreaterThan(1000); // physically huge at the null — clamped, not Infinity
  });
```

- [ ] **Step 2: Run to verify the two new its FAIL** — `npx vitest run --no-file-parallelism src/transmission/utils/__tests__/transmissionMath.test.ts`
- [ ] **Step 3: Implement** — replace the return + comment block (keep the integration loop):

```ts
  // 60·∫F²sinθ dθ is the radiation resistance referred to the CURRENT MAXIMUM
  // I_max. A center-fed dipole is driven at I_in = I_max·sin(βL/2), so the
  // feed-point value is R_in = R(I_max)/sin²(βL/2), βL/2 = π·(L/λ).
  // Anchors: L=0.5λ → sin²=1 → ≈73 Ω (unchanged); L=0.1λ → ≈2.0 Ω ≈ 20π²(L/λ)²,
  // matching the Antennas section prose. Near L=nλ the feed sits at a current
  // null and R_in genuinely blows up — clamp so the readout stays finite. (P-06)
  const sinHalf = Math.sin(Math.PI * dipoleLengthFraction);
  return (60 * integral) / Math.max(sinHalf * sinHalf, 1e-3);
```

…update the function docstring ("referred to the feed point of a center-fed dipole") and add the readout sublabel in `RadiationPatternSim.tsx`:

```tsx
          <ReadoutCard
            label="Radiation Resistance"
            value={`${radiationResistance.toFixed(1)}`}
            unit={'Ω'}
            sublabel="at feed point (center-fed)"
          />
```

- [ ] **Step 4: Run the test file** → ALL PASS (73-anchor unchanged).
- [ ] **Step 5: Commit** — `fix(antennas): radiation resistance referred to the feed point, clamped at current nulls (audit P-06)`

---

### Task 8: Polarization equation panel matches the sim's phase convention (P-07)

**Files:**
- Modify: `src/em/sections/polarization/index.tsx:372-373` (the x-Comp / y-Comp `math` template strings; the EquationBox renders at :550, OUTSIDE the gate — no gate-passing needed in the test)
- Test: new `src/em/sections/polarization/__tests__/polarizationEquations.test.tsx`

**Interfaces:**
- Consumes: sim ground truth at :172-174 — `valX = ex·cos(t)`, `valY = ey·cos(t + rad)`, i.e. the cos(ωt − kz + δ) convention at z=0; handedness label keys off `phaseDelta > 0 ⇒ 'Right'` (:365-367).
- Produces: displayed `E_x = ex·cos(ωt − kz)`, `E_y = ey·cos(ωt − kz + δ°)` — same convention Task 10 uses for em-wave (ωt leading).

- [ ] **Step 1: Write the failing test** (katex mock + `hasFormula` helper copied from `sDomainFormulas.test.tsx`; render the polarization section route; the equation panel renders without passing the gate — if the render needs providers, copy the render scaffold from the existing polarization/em section test in `src/em/sections/__tests__/sections.test.tsx`):

```tsx
/**
 * Audit P-07: panel displayed E_y = e_y·cos(kz − ωt + δ) while the sim animates
 * cos(ωt − kz + δ). cos is even ⇒ the displayed δ has the OPPOSITE sign, so a
 * student expanding the printed equation derives the opposite rotation sense
 * from the labeled handedness state.
 */
it('equation panel uses the sim convention cos(ωt − kz + δ) (P-07)', () => {
  renderPolarizationSection();
  expect(hasFormula(String.raw`\cos(\omega t - kz`)).toBe(true);
  expect(hasFormula(String.raw`\cos(kz - \omega t`)).toBe(false);
});
```

- [ ] **Step 2: Run to verify FAIL** — `npx vitest run --no-file-parallelism src/em/sections/polarization/__tests__/polarizationEquations.test.tsx`
- [ ] **Step 3: Fix the two template strings** (JS template literals ⇒ `\\`):

```ts
    { label: 'x-Comp', math: `E_x = ${ex} \\cos(\\omega t - kz)` },
    { label: 'y-Comp', math: `E_y = ${ey} \\cos(\\omega t - kz + ${phaseDelta}^\\circ)` },
```

- [ ] **Step 4: Run the test file + the polarization entries in `src/em/sections/__tests__/sections.test.tsx`** → PASS.
- [ ] **Step 5: Commit** — `fix(polarization): equation panel matches the sim phase convention cos(ωt−kz+δ) (audit P-07)`

---

### Task 9: em-wave phasor view — CCW rotation, cosine reference, Re-axis projection (P-08 + P-09)

These land as ONE task: the rotation sign, the sin→cos trace, and the projection axis are one lock-step mechanism (`nowPh` feeds the trace, the now-dot, and the phasor).

**Files:**
- Modify: `src/em/sections/em-wave/chartData.ts:9-31` (4× `Math.sin` → `Math.cos`)
- Modify: `src/em/sections/__tests__/chart-builders.test.ts:60-75` and `:137-151` (deliberate golden re-pins)
- Modify: `src/em/sections/em-wave/index.tsx` — `:761` and `:770` (sign: `- angle` → `+ angle`), `:762` and `:771` (`Math.sin` → `Math.cos`), `:292`/`:304`/`:343-344`/`:361-362` (V-I + power loops `Math.sin` → `Math.cos`), `:866-867` (projection line → vertical drop onto the Re axis), `:67` (Q_PHASOR tier-2 hint text), `:1207-1225` (EquationBox: both branches to cosine, ωt − kx ordering)
- Test (unchanged, sanity-run): `src/em/sections/em-wave/__tests__/phaseUnits.test.tsx` — pins no sin/cos strings; must stay green with NO edits.

**Interfaces:**
- Consumes: the V-I view's correct CCW convention (`vAngle = timeAngle + radV`, `:251-254`) as the model; `formatPhase` (:126-129, convention-neutral, untouched).
- Produces: app-wide cosine-reference phasors (course hard rule 2, Nilsson); `nowPh = frac·cycles·2π + angle` increasing with t (e^{jωt}, matches the '↺ CCW' canvas label at :887-891, which stays).

- [ ] **Step 1: Re-pin the golden tests FIRST (failing against current code).** In `chart-builders.test.ts`:

At :137-143 (power):
```ts
  it('EM-wave instantaneous power P = v·i/1000 (V₀=80, I₀=60, in phase, f=1 Hz)', () => {
    const omega = 2 * Math.PI * 1.0;
    const d = buildPowerData(80, 60, omega, 0, 0);
    expect(d[0].P).toBeCloseTo(4.8, 2);   // t = 0 — cosine reference: crest at the origin
    expect(d[1].P).toBeCloseTo(4.34, 2);  // t = 0.05 s — cos²(0.31416)·4.8
    expect(d[5].P).toBeCloseTo(0, 2);     // t = 0.25 s — both cosines ≈ 0
    expect(d[10].P).toBeCloseTo(4.8, 2);  // t = 0.50 s — both at trough: product peaks
  });
```
At :145-151 (snapshot):
```ts
  it('EM-wave snapshot E and true-scale B at an independent point (x = 6)', () => {
    const k = (2 * Math.PI * 1.0 * 1.0) / 300;
    const d = buildSnapshotData(40, k, 1.0);
    // cos(k·6) = cos(0.125664) = 0.992115 → E = 40·0.992115, B = (40/300)·0.992115
    expect(d[0].E).toBeCloseTo(40, 2);       // crest at x = 0 — cosine signature
    expect(d[1].E).toBeCloseTo(39.68, 2);
    expect(d[1].B).toBeCloseTo(0.1323, 4);
  });
```
At :60-75 (true-scale B): change `const sinVal = Math.sin(k * x);` (:70) → `const cosVal = Math.cos(k * x);`, its single usage at :71, and the comments at :65-67 (at x=0, cos(0)=1 ⇒ E=40, B≈0.1333); the `< 1` bound still passes (0.1323 < 1).

- [ ] **Step 2: Run to verify the three edited tests FAIL** (builders still sin) — `npx vitest run --no-file-parallelism src/em/sections/__tests__/chart-builders.test.ts`
- [ ] **Step 3: Flip `chartData.ts`** — all four `Math.sin(` → `Math.cos(` in `buildSnapshotData` and `buildPowerData`.
- [ ] **Step 4: Run chart-builders again** → ALL PASS.
- [ ] **Step 5: Canvas + equations edits in `index.tsx`** (each site verbatim):

(a) Phasor-sync trace + now-dot (P-08 sign, P-09 cos):
```ts
        const ph = frac * cycles * 2 * Math.PI + angle;     // :761 — was "- angle"
        const y = midY - amp * Math.cos(ph);                 // :762 — was Math.sin
```
```ts
      const nowPh = nowFrac * cycles * 2 * Math.PI + angle;  // :770 — was "- angle"
      const nowY = midY - amp * Math.cos(nowPh);             // :771 — was Math.sin
```
(b) Projection line (:861-867): signal = horizontal (Re) projection — replace the horizontal dashed line with a vertical drop:
```ts
      phasorCtx.moveTo(tipX, tipY);
      phasorCtx.lineTo(tipX, pcy);
```
(`tipX − pcx = pAmp·cos(phasorAngle)` (:832) now equals the trace value at the now-line by construction.)
(c) V-I + power loops: `Math.sin(omega * 0.02 * ct + radV)` → `Math.cos(...)` and same for `radI` — four pairs at :292, :304, :343-344, :358-363. (The drag-handle `Math.sin` at :925-928 is circle GEOMETRY — leave it.)
(d) Q_PHASOR tier-2 hint (:67):
```ts
    { tier: 2, label: 'Procedural hint', content: 'For an inductor: v = L di/dt. If i = I₀cos(ωt), then v = −LωI₀ sin(ωt) = LωI₀ cos(ωt + 90°). Voltage leads current by 90°, i.e., current lags voltage by 90°.' },
```
(e) EquationBox (:1207-1225), both branches (template strings ⇒ `\\`):
```ts
                  { label: 'E(x,t)', math: `E_0 \\cos(\\omega t - kx),\\quad k=${kVal},\\; \\omega=${omega}`, color: 'text-red-600' },
                  { label: 'B(x,t)', math: `\\frac{E_0}{v} \\cos(\\omega t - kx) = \\frac{n E_0}{c} \\cos(\\omega t - kx)`, color: 'text-blue-600' },
                  ...
                  { label: 'Lossy medium', math: `E(x,t) = E_0 e^{-\\alpha x}\\cos(\\omega t - kx),\\quad \\alpha = ${state.attenuation.toFixed(1)}\\ \\text{(arb.)}`, color: 'text-rose-600 dark:text-rose-400' },
```
```ts
                  { label: 'v(t)', math: `${state.vAmplitude}\\cos(\\omega t ${formatPhase(state.vPhase)})`, color: 'text-red-600' },
                  { label: 'i(t)', math: `${state.iAmplitude}\\cos(\\omega t ${formatPhase(state.iPhase)})`, color: 'text-amber-600' },
```
(Velocity/Wavelength/Energy/Poynting/p(t)/Power/Phase-Diff rows unchanged.)

- [ ] **Step 6: Run the em-wave test set** — `npx vitest run --no-file-parallelism src/em/sections/em-wave src/em/sections/__tests__` → ALL PASS, `phaseUnits.test.tsx` untouched and green.
- [ ] **Step 7: Visual verification (behavioural, not just tests)** — `npm run build && npx vite preview --port 4273 --strictPort`, open `/em-wave`: (1) Phasor Sync arrow rotates COUNTER-clockwise matching its '↺ CCW' label; (2) dashed projection drops vertically from the tip to the horizontal axis and tracks the trace value at the now-line; (3) AC Phasors view: V/I waveforms start at their crests when phase = 0 (cosine signature); (4) main-view snapshot chart starts at E=40 crest. Stop the server after.
- [ ] **Step 8: Commit** — `fix(em-wave): cosine-reference phasors, CCW rotation, Re-axis projection (audit P-08, P-09; course hard rule 2)`

---

### Task 10: Dark-mode pole-zero charts (C-02)

**Files:**
- Modify: `src/circuits/components/modules/SDomainAnalysis.tsx:290` (module-scope `poleChartColors` → theme-aware, inside `ReadThePlotTab`) and `:15` (extend the existing `@shared/store/progressStore` import with `useThemeStore`)

**Interfaces:**
- Consumes: house pattern from `src/circuits/components/modules/CircuitTheorems/MaxPowerChart.tsx:18-22` — `const isDark = useThemeStore((s) => s.theme) === 'dark';` + canonical pairs grid `#334155/#e2e8f0`, text `#cbd5e1/#475569`. (`useThemeStore` IS exported from `@shared/store/progressStore` — `InteractiveLab/index.tsx:19` already does the combined import.)
- Produces: nothing consumed elsewhere; the five Recharts `fill/stroke` bindings (:320-335) pick the colors up unchanged.

- [ ] **Step 1: Implement** — delete the module-scope line 290 and add inside `ReadThePlotTab` (the only consumer, before its `return`):

```tsx
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const poleChartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
  };
```

…and extend the import at :15: `import { useProgressStore, useThemeStore } from '@shared/store/progressStore';`. Optionally (uniformity with SwitchedRCSim's annotation precedent) make the two axis `ReferenceLine`s dark-aware: `stroke={isDark ? '#94a3b8' : '#64748b'}`.

- [ ] **Step 2: Verify** — `npx vitest run --no-file-parallelism src/circuits` (no chart-color tests exist; this confirms no regression), then in the preview build open `/s-domain` → Read the Plot in dark mode: grid and axis labels clearly legible (slate-300 text on the dark card).
- [ ] **Step 3: Commit** — `fix(s-domain): pole-zero charts theme-aware — dark mode was near-illegible (audit C-02)`

---

### Task 11: Full gates + wrap-up

- [ ] **Step 1:** `npm run build` → exit 0.
- [ ] **Step 2:** `npm run lint` → exit 0.
- [ ] **Step 3:** `npx vitest run --no-file-parallelism` → 102+ files, 764+ tests, ALL green (count grows by the new files: overdampedStepCard, rlcEnvelopeLabels, formulaMirrors, bounceVoltagePlateaus, polarizationEquations).
- [ ] **Step 4:** `npm run e2e` → 3 projects green (canvas edits in Task 9 keep sim-paint satisfied — paint changes phase, not paint coverage; no MIN_CANVAS/DPR_MIGRATED changes needed since no section gained/lost a canvas).
- [ ] **Step 5:** Close with the repo convention: `Tested: build, lint, full unit suite serial, e2e ×3 projects, visual pass on /em-wave, /s-domain (dark), /transients bounce plateau vs V_ss line, /antennas R_rad readouts at 0.1λ/0.5λ/1.0λ. Not tested: WebKit/Firefox (Chromium-only e2e), SW update propagation (autoUpdate lag noted in PR body).`
- [ ] **Step 6:** Push branch + open PR to `main` via the REST API recipe (payload file in scratchpad; body lists P-01…P-09 + C-02 with the audit report link and the SW-propagation note).

---

## Coverage map (self-review)

| Audit id | Task | | Audit id | Task |
|---|---|---|---|---|
| P-01 critical | 3 (+5 guard) | | P-06 | 7 |
| P-02 | 2 (+5 guard) | | P-07 | 8 |
| P-03 | 4 | | P-08 | 9 |
| P-04 | 1 | | P-09 | 9 |
| P-05 | 6 | | C-02 | 10 |
| Formula-vs-solver guard class | 5 | | Gates | 11 |

Out of scope (deliberately, per roadmap): B-36 (φ undefined in ResponseComparisons — minor), pole marker `shape="cross"` → ×-glyph (B-41, rides with roadmap #6 Tier-2), R_rad label copy in section prose (already consistent with the 20π² form after Task 7).
