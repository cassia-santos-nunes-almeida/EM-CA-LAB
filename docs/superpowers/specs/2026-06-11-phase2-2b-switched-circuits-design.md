# Unit 2B design — `switched-circuits` · "Switched Circuits & Initial Conditions" (new section 1.5)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` — roadmap unit **2G** (ILO 11/12 polish)
**Label note (binding for the doc trail):** the Phase-2 *design batch* sequence labels this unit **2B** (second design after 2A line-impedance). The roadmap's own "2B" is two-port parameters — a DIFFERENT unit, untouched here. Everywhere below, "this unit" = roadmap **2G — Switched circuits & initial conditions**.
**Provenance:** read-recon of TimeDomain (1.2), SDomainAnalysis (1.7), circuitSolver.ts, transmission Transients (5.3) + BounceDiagram, curriculum spine, all shared teaching primitives, both shared/circuits test suites; every number below hand-derived in this doc and cross-checked by a second method where one exists.

## Pedagogical goal + the exact ILO gap closed

Roadmap 2G, quoted in full:

> **2G — Switched circuits & initial conditions (ILO 11/12 polish)**
> Every transient in the app starts from zero state. Build: the general first-order recipe **x(t) = x(∞) + [x(0⁺) − x(∞)]e^(−t/τ)** with a switch-at-t=0 worked example (find ICs from the DC pre-state); a continuity-rules callout (i_L, v_C can't jump; 0⁻/0⁺ notation — currently never stated); one hand-worked second-order step where A₁/A₂ are determined from ICs (the solver computes them invisibly today); transmission bonus: plot the source-end V(t) staircase in the bounce chart (data already exists in `transmissionMath.ts calculateBounceVoltages`). Effort: small-medium.

Priority rationale (roadmap sequencing step 4): *"2F magnetic circuits by hand + 2G switched circuits (small, finish ILOs 7/11/12)"* — ILOs 11 ("Transient phenomena") and 12 ("Voltage/current changes after step inputs") are graded **solid** but every solved transient assumes zero stored energy; the syllabus verbs ("changes after step inputs") include the switched, energy-already-stored case that exams actually set. Verified in the tree: `TimeDomain/index.tsx` line 217 "Solution (assuming `v_C(0) = 0`)", line 345 "assuming `i(0) = 0`"; `circuitSolver.ts` lines 131–135 bake zero-IC constants into every RLC branch; grep for `0^-`/`0⁺`/"initial condition" across `src/circuits` shows the symbols appear ONLY as unexplained Laplace fine print (componentMath.ts's `sF(s) − f(0^-)` differentiation property and `0^+` initial-value theorem; 1.6's "f(0⁺) = 0" IVT spot-check) and "initial conditions" only as the thing Laplace "naturally incorporates" (LaplaceTheory, SDomainAnalysis "assuming zero initial conditions") — the continuity rules and the *switching* meaning of the 0⁻/0⁺ boundary are stated nowhere. The 2E plausibility theme ("rides along with any other unit") is honored with three "Does this make sense?" audits below.

**Bonus item is ALREADY SHIPPED — verified, not re-built:** `BounceDiagram.tsx` lines 614–632 already render **both** "Voltage at Source End" and "Voltage at Load End" `VoltageChart`s, fed by `sourceStepData`/`loadStepData` (lines 496–518) built from the `vSource`/`vLoad` accumulators of `calculateBounceVoltages`. Roadmap item 4 is a no-op for this unit; no transmission file is touched.

## Placement ruling (judged, evidence-cited)

**NEW Part-1 section** between `circuit-theorems` and `laplace-theory` (renders **1.5**; laplace-theory auto-renumbers 1.5→1.6, partial-fractions 1.6→1.7, s-domain 1.7→1.8, interactive-lab 1.8→1.9 via derived `getSectionNumber` — grep-verified: NO hardcoded "Section 1.x" exists anywhere in prose/JSX; the only literal section number in circuits-adjacent code is the JSDoc "Section 5.2"/"5.3" comments in transmission, untouched).

Why not extend `TimeDomain` (1.2), the losing design: (a) it is already 545 lines with three full circuit comparisons, a drill exercise, and a GuidedChallenge — the Phase-1 over-long-pages theme says stop; (b) the switched-circuit skill set (DC pre-state → continuity → recipe) is a *different verb* from 1.2's method-comparison story, and burying it in a fourth tab would orphan the second-order IC material (1.2's RLC tab is about damping taxonomy, not coefficient fitting); (c) 1.2's PredictionGate/CC wiring is keyed to a circuit-type selector — grafting a switch-topology sim under that selector would entangle two unrelated state machines. Why slot 1.5 and not 1.8 (post-s-domain): the unit needs only DC analysis (1.2–1.4) and the RC/RL/RLC solutions of 1.2 — no Laplace; and it *strengthens* the spine narrative: 1.5 ends on "tracking 0⁻/0⁺ and fitting A₁/A₂ by hand is exactly the bookkeeping the Laplace transform automates — next section," which is the cleanest motivation handoff Laplace Theory (1.6) could ask for. Textbook concordance: Nilsson Ch 7–8 (switched first/second order) precede the Laplace chapters in the same order.

**Conventions (binding, inherited from 2A):** formulas inside JSX `formula="…"` attributes use **single backslash** exactly as written below; any formula stored in a `.ts` string literal uses **double backslash** (none are planned — all math lives in JSX or unicode). No section number hardcoded in prose — always `{getSectionNumber('…')}`. The CHALLENGE const is a `.tsx`-local object using unicode τ/Ω/µ (no LaTeX). `expectedChecks: 0` (non-EM convention). Post-PR-#7 blocking default: write **no `allowSkip` prop** on the new gate (verified in tree: `PredictionGate.tsx` line 62 `allowSkip = false`).

---

## 1. Wiring deltas (all verified against the current tree, 23 sections)

1. **`src/shared/constants/curriculum.ts`**
   - Insert into `SECTION_LIST` immediately after the `circuit-theorems` entry (currently line 58):
     `{ id: 'switched-circuits', title: 'Switched Circuits & Initial Conditions', route: '/switched-circuits', domain: 'circuits', expectedChecks: 0 },`
   - `PARTS[0].sectionIds` (currently line 95): insert `'switched-circuits'` between `'circuit-theorems'` and `'laplace-theory'`.
   - Dup-id throw, unknown-id throw, and `routeIntegrity.test` enforce the rest automatically.
2. **`src/sectionRegistry.tsx`** — between the `'circuit-theorems'` and `'laplace-theory'` entries:
   `'switched-circuits': lazyRetry(() => import('@circuits/components/modules/SwitchedCircuits').then((m) => ({ default: m.SwitchedCircuits }))),`
3. **`src/shared/constants/__tests__/curriculum.test.ts`** — line 18 test name `'covers all 23 sections'` → `'covers all 24 sections'`; line 19 `toHaveLength(23)` → `24`; line 49 `toHaveLength(23)` → `24`. (The "Part 1 is entirely circuits-domain" test at line 22 passes unchanged — the new section is circuits-domain.)
4. **`src/shared/constants/__tests__/getSectionNumber.test.ts`** — line 9 `partial-fractions` `'1.6'` → `'1.7'`; line 10 `interactive-lab` `'1.8'` → `'1.9'`; ADD `expect(getSectionNumber('switched-circuits')).toBe('1.5');` after the `circuit-theorems` line. Lines 6–8 (1.1/1.3/1.4) and all Part 2–5 expectations unchanged (`transients` stays `'5.3'` until 2A lands — see §9 collisions).
5. **`src/circuits/components/__tests__/pages.test.tsx`** — add smoke test:
   `it('SwitchedCircuits renders without crashing', async () => { const { SwitchedCircuits } = await import('@circuits/components/modules/SwitchedCircuits'); renderWithRouter(<SwitchedCircuits />, '/switched-circuits'); expect(screen.getByRole('heading', { level: 1, name: /Switched Circuits & Initial Conditions/i })).toBeInTheDocument(); });`
6. **Sidebar / CourseLanding / CourseNavigation / AiTutor / e2e harness** — all derive from PARTS/curriculum (`e2e/screenshots.spec.ts` line 9 and `sim-paint.spec.ts` line 11 import `ALL_SECTIONS` directly): **zero edits**, the new route is auto-screenshotted (shot count rises by 2: 48 → 50, i.e. 25 routes × 2 viewports — landing + 24 sections).

## 2. The 1.2 seam (exactly ONE edit to `TimeDomain/index.tsx`)

Insert ONE callout between the "Circuit Response Types" `CollapsibleSection` (closes line 151) and the `<section id="systematic-analysis">` block (line 153) — engineering-blue `border-l-4` house style, mono uppercase kicker:

> **UP NEXT** — Every solution on this page assumed `v_C(0) = 0` or `i(0) = 0`. That is an assumption, not a law: real circuits get switched with charge and current already stored. Finding the true starting values from the pre-switch DC state — and solving from there with a three-number recipe — is Section `{getSectionNumber('switched-circuits')}`: Switched Circuits &amp; Initial Conditions.

Verified safe: `pages.test.tsx` TimeDomain assertions cover the gate, tab strip, CCs, the h1/ToC, and the Method Comparison collapsible's `aria-expanded` — nothing in the insertion region between lines 151 and 153. No other file edits prose this unit must change.

## 3. Page architecture — `src/circuits/components/modules/SwitchedCircuits/index.tsx` (NEW)

Clone the TimeDomain progress-wiring block with id `'switched-circuits'` (`markVisited` on mount; `incrementConceptChecks`/`incrementHints`/`markPredictionGate` helpers). Lifted unlock state `const [unlocked, setUnlocked] = useState(false)` (one gate; the Tabs panel remounts on switch, so the gate uses `initialPassed={unlocked}` + `onPassed`). `WorkedSteps` imported from `@circuits/components/common/WorkedSteps` — **no hoist needed** (circuits→circuits is legal; see §9 for the 2A-hoist interaction).

```
<div className="space-y-8">
  <SectionHook text="Flip a switch and the circuit does not start from nothing — its capacitors are charged, its inductors are carrying current. Every transient you have solved so far began at zero. Real ones almost never do. Two continuity rules and one three-number recipe solve any switched first-order circuit in four lines — no differential equation required." />
  <h1> <span mono engineering-blue>{getSectionNumber('switched-circuits')}</span> Switched Circuits &amp; Initial Conditions </h1>
  <Tabs tabs={[
    { label: 'The 0⁻/0⁺ Boundary', icon: <BookOpen/>, content: boundaryTheory },
    { label: 'The First-Order Recipe', icon: <FlaskConical/>,
      content: <LabLayout benchId="lab-switched" jumpLabel="Jump to lab" theory={recipeTheory} bench={recipeBench} /> },
    { label: 'Second Order: A₁ & A₂', icon: <Activity/>, content: secondOrderTheory },
  ]} />
  <GuidedChallenge challenge={CHALLENGE} />
  <CourseNavigation currentSectionId="switched-circuits" />
</div>
```

---

## 4. Tab 1 — "The 0⁻/0⁺ Boundary"

### 4.1 Opening puzzle box (the "exposed debt" pattern; white card, h2 **"The assumption every solution smuggled in"**)
> Section `{getSectionNumber('circuit-analysis')}` solved RC, RL and RLC step responses — beautifully. Look again at the fine print:

| Where | The fine print |
|---|---|
| RC solution | "assuming `v_C(0) = 0`" |
| RL solution | "assuming `i(0) = 0`" |
| RLC (all three damping cases) | constants chosen so `v(0) = 0`, `i(0) = 0` |

Amber mono stamp (house style): **"REAL CIRCUITS GET SWITCHED WITH ENERGY ALREADY STORED."** Closing line: "A relay drops out while its coil carries 4 A. A logic rail powers up while its decoupling caps still hold half a volt. This page is the missing first move of every transient problem: *what are the true values at the instant after the switch acts* — and the notation for that instant is `t = 0^+`, one tick after `t = 0^-`."

### 4.2 The two continuity rules (block, boxed — the first place the app *defines* 0⁻/0⁺; until now the symbols only flash by as Laplace fine print in 1.6/componentMath)
> Two quantities in a circuit are *state variables* — they store energy, and energy cannot teleport:

`v_C(0^+) = v_C(0^-) \qquad\qquad i_L(0^+) = i_L(0^-)`

> Why: `i_C = C\,\frac{dv_C}{dt}` — a jump in `v_C` would need infinite current; `v_L = L\,\frac{di_L}{dt}` — a jump in `i_L` would need infinite voltage. **Everything else may jump**: resistor voltages and currents, capacitor *current*, inductor *voltage* — these are slaved to the state variables through whatever circuit is connected *right now*, and at `t = 0` the circuit itself changes.

Key Insight callout: **"Continuity is a property of the element, not the circuit.** The switch can rip the topology apart; `v_C` and `i_L` walk across the boundary unchanged, and you re-solve the *new* circuit with those two numbers as starting capital."

### 4.3 Reading the DC pre-state (the "find x(0⁻)" skill)
> Before the switch acts, the circuit has usually sat still for a long time — DC steady state. Then nothing changes in time, so:

`\frac{dv_C}{dt} = 0 \;\Rightarrow\; i_C = 0 \quad \text{(capacitor = open circuit)} \qquad \frac{di_L}{dt} = 0 \;\Rightarrow\; v_L = 0 \quad \text{(inductor = short circuit)}`

Two-line micro-examples (inline card, exact arithmetic):
- **Capacitor:** 12 V source — 4 kΩ — node — (8 kΩ ∥ C) to ground. C open ⇒ voltage divider: `v_C(0^-) = 12\,\frac{8}{4+8} = 8\ \text{V}`. *(This exact circuit returns as the bench default.)*
- **Inductor:** 24 V source — 6 Ω — node — (10 Ω ∥ L) to ground. L is a DC short ⇒ it shorts out the 10 Ω entirely (`v_{node} = 0`, so the 10 Ω carries nothing): `i_L(0^-) = 24/6 = 4\ \text{A}`. *(Returns in the Your Turn.)*

"Does this make sense?" callout (2E pattern): "In the inductor example, check the bypassed resistor: `v_{node} = 0` ⇒ `i_{10\Omega} = 0/10 = 0` — all 4 A really does flow through the wire-like inductor. If you had treated L as an *open* you'd get `24/(6+10) = 1.5` A — keep that wrong number in mind; it reappears below as a trap."

### 4.4 ConceptCheck CC-1 (multiple-choice, wired `onComplete`/`onHint`)
- **Q:** "A switch opens at t = 0, interrupting the only current path of an inductor carrying 2 A. What happens at t = 0⁺?"
- ✅ **"The inductor forces 2 A to keep flowing for an instant — v_L = L di/dt spikes as high as needed (this is why switch contacts arc)"** — *Correct. i_L cannot jump, so the current momentarily punches through the opening contacts as an arc; the voltage spike is whatever it takes. Flyback diodes exist precisely to give that 2 A somewhere lawful to go.*
- ❌ "i_L steps cleanly to 0 — inductors oppose voltage changes, not current changes" — *Rule swap: it is the CAPACITOR's voltage that cannot jump. The inductor's protected quantity is its current.*
- ❌ "v_L holds its 0⁻ value (0 V) — voltages are always continuous" — *There is no continuity law for v_L. Only v_C and i_L are state variables; an inductor's voltage jumps whenever the circuit demands it.*
- ❌ "Nothing dramatic — the stored energy simply vanishes when the loop opens" — *Energy ½Li² = ½·L·(2 A)² cannot vanish. It must be dissipated — in the arc, a snubber, or a flyback diode.*
- hints: `['Only two circuit quantities are guaranteed continuous: i_L and v_C.', 'If i_L tried to jump, what would v_L = L di/dt have to be?']`

---

## 5. Tab 2 — "The First-Order Recipe" 🧪 (LabLayout: theory left, gated bench right)

### 5.1 Theory column

**h2 "Three numbers, one curve".** Any first-order circuit, however gnarly, reduces (Thévenin, Section `{getSectionNumber('circuit-theorems')}`) to one source, one resistance, one storage element. Its ODE is `\frac{dx}{dt} = -\frac{x - x(\infty)}{\tau}`, and the solution every formula sheet prints:

`x(t) = x(\infty) + \bigl[x(0^+) - x(\infty)\bigr]e^{-t/\tau}` *(block, boxed, labelled "THE first-order recipe — x is v_C or i_L")*

**"How to read this formula" mini-list:** (i) at `t = 0`: `x = x(0^+)` ✓; (ii) as `t \to \infty`: `x = x(\infty)` ✓; (iii) the exponential only carries the *gap* between start and finish — after one τ, 63.2 % of the gap is closed; (iv) the three inputs come from three different circuits: `x(0^+)` from the OLD circuit's DC state (+ continuity), `x(\infty)` from the NEW circuit's DC state, `\tau` from the NEW circuit's resistance as seen by the storage element (`\tau = R_{eq}C` or `L/R_{eq}`). **Using the old circuit's resistors for τ is the classic exam error.**

**WorkedSteps — "The exam task, by hand"** (`tryFirstPrompt="Find v_C(0⁻) from the position-a circuit yourself before revealing step 1."`). Two-position switch, C = 25 µF: position **a** (t < 0, a long time): 12 V — 4 kΩ — node — (8 kΩ ∥ C). At t = 0 the switch moves to position **b**: C connects in series with 2 kΩ to a 20 V source (the 12 V/4 kΩ/8 kΩ branch is disconnected).
- **Step 1 — Pre-state (capacitor = open):** divider: `v_C(0^-) = 12 \times \frac{8\,\text{k}}{4\,\text{k} + 8\,\text{k}} = 12 \times \tfrac{2}{3} = 8\ \text{V}`. Also `i_C(0^-) = 0` (steady state).
- **Step 2 — Cross the boundary:** continuity: `v_C(0^+) = 8\ \text{V}`. But the capacitor *current* jumps: `i_C(0^+) = \frac{20 - 8}{2\,\text{k}} = 6\ \text{mA}` (was 0). *Voltage continuous, current discontinuous — the bench plots both.*
- **Step 3 — Final value (new circuit, capacitor = open):** no current ⇒ no drop on the 2 kΩ ⇒ `v_C(\infty) = 20\ \text{V}`.
- **Step 4 — Time constant (NEW circuit only):** `\tau = R C = 2000 \times 25\times10^{-6} = 0.05\ \text{s} = 50\ \text{ms}`. *(The 4 kΩ and 8 kΩ left with the old circuit — they are gone.)*
- **Step 5 — Assemble:** `v_C(t) = 20 + (8 - 20)e^{-t/0.05} = 20 - 12e^{-20t}\ \text{V}, \quad t \ge 0`.
- **Step 6 — Audit (does this make sense?):** `v_C(0^+) = 20 - 12 = 8` ✓ matches Step 2; `v_C(\infty) = 20` ✓ matches Step 3. Current two ways: Ohm: `i = \frac{20 - v_C}{2\,\text{k}} = \frac{12e^{-20t}}{2000} = 6e^{-20t}\ \text{mA}`; constitutive: `i = C\frac{dv_C}{dt} = 25\times10^{-6} \times 240e^{-20t} = 6e^{-20t}\ \text{mA}` — identical ✓ (and `i(0^+) = 6` mA matches Step 2). One τ later (t = 50 ms): `v = 20 - 12e^{-1} = 20 - 4.41 = 15.59\ \text{V}` — exactly 63.2 % of the 12 V gap closed: `8 + 0.6321 \times 12 = 15.59` ✓ (1 − e⁻¹ = 0.6321). After 5τ (250 ms): `20 - 12e^{-5} = 19.92\ \text{V}` — settled.

### 5.2 ConceptCheck CC-2 (multiple-choice)
- **Q:** "A first-order circuit has v(0⁺) = 2 V, v(∞) = 10 V, τ = 1 ms. What is v one time constant later, at t = 1 ms?"
- ✅ **"7.06 V"** — *Correct. v = 10 + (2 − 10)e⁻¹ = 10 − 8(0.368) = 7.06 V — equivalently, start + 63.2 % of the 8 V gap: 2 + 5.06 = 7.06 V.*
- ❌ "2.94 V" — *2.94 V = 8e⁻¹ is the size of the gap still REMAINING, not the voltage. Add it back under the final value: 10 − 2.94 = 7.06 V. (Treating the answer as a bare decay to zero is the zero-state habit this section is curing.)*
- ❌ "6.32 V" — *That is 0.632 × 10 — the 63 % rule applied to the final VALUE. It applies to the GAP: the circuit covers 63.2 % of (10 − 2) in one τ.*
- ❌ "6 V" — *6 V is halfway. One τ takes you 63.2 % of the way; the halfway point comes earlier, at t = τ·ln 2 ≈ 0.69 τ.*
- hints: `['Write the recipe with the three numbers in place, then set t = τ so e^(−t/τ) = e^(−1) ≈ 0.368.', 'The 63.2% rule applies to the gap x(∞) − x(0⁺), not to x(∞) itself.']`

### 5.3 YourTurnPanel — the inductive kick (all numbers verified; reuses the §4.3 warm-up circuit)
- **scenario:** "The inductor circuit from the 0⁻/0⁺ tab: 24 V source — 6 Ω — node — (10 Ω ∥ L), L = 0.5 H, sitting at DC steady state with i_L(0⁻) = 4 A. At t = 0 the switch OPENS the source branch (24 V and 6 Ω disconnect), leaving the inductor and the 10 Ω alone in a loop."
- **question:** "What is i_L(t) for t ≥ 0 — and what happens to the voltage across the 10 Ω resistor at t = 0⁺?"
- ✅ **"i_L(t) = 4e^(−20t) A, and the resistor voltage jumps to 40 V — larger than the source ever supplied"** — *Correct. Continuity: i_L(0⁺) = 4 A; final value 0; τ = L/R = 0.5/10 = 50 ms ⇒ 1/τ = 20 s⁻¹. The 4 A is forced through the 10 Ω: |v| = 4 × 10 = 40 V, polarity flipped — the inductive kick that erodes relay contacts.*
- ❌ "i_L drops to 0 instantly — its source is gone" — *i_L cannot jump, source or no source. The stored ½Li² = ½(0.5)(4²) = 4 J must be dissipated through the resistor over the decay.*
- ❌ "i_L(t) = 1.5e^(−20t) A" — *1.5 A = 24/(6+10) treats the inductor as a DC OPEN — that is the capacitor's rule. At DC an inductor is a short: i_L(0⁻) = 24/6 = 4 A.*
- ❌ "i_L(t) = 4e^(−32t) A" — *You used τ = L/(R₁+R₂) = 0.5/16 = 31.25 ms, i.e. a rate of 32 s⁻¹. The 6 Ω left with the source; for t > 0 the inductor sees only the 10 Ω: τ = 0.5/10 = 50 ms, rate 20 s⁻¹.*
- **correctReveal:** block math `i_L(0^-) = \frac{24}{6} = 4\ \text{A}` (L shorts the 10 Ω); `\tau = \frac{L}{R} = \frac{0.5}{10} = 0.05\ \text{s}`; `i_L(t) = 4e^{-20t}\ \text{A}`; `|v_R(0^+)| = 4 \times 10 = 40\ \text{V}`. Energy audit (2E): `\int_0^\infty i^2R\,dt = \int_0^\infty 16e^{-40t}\cdot 10\,dt = \frac{160}{40} = 4\ \text{J} = \tfrac{1}{2}Li_L(0)^2 = \tfrac{1}{2}(0.5)(16)` ✓ — every joule the field stored comes out through the resistor. Kicker: "40 V from a 24 V circuit — inductors are voltage multipliers when interrupted. That is both a hazard (arcing) and a product (boost converters, ignition coils)."
- **hints:** `['At DC an inductor is a short — which resistor does it bypass before the switch opens?', 'τ uses only the resistance the inductor actually sees AFTER the switch acts.']`

### 5.4 Bench — LabStation + blocking gate + SwitchedRCSim

```jsx
<LabStation id="switched-rc" number={getSectionNumber('switched-circuits')} title="Throw the Switch"
  objective="Drive the two-position RC switch circuit from the worked example: watch v_C cross t = 0 without a kink while i_C jumps, and read x(0⁺), x(∞) and τ straight off the instrument.">
  <p>Predict first, then run the lab. Commit your prediction to reveal the bench.</p>
  <PredictionGate
    initialPassed={unlocked}
    onPassed={() => setUnlocked(true)}
    onPredict={(correct) => markPredictionGate('switched-circuits', correct)}
    question="This capacitor has sat at 8 V for a long time. At t = 0 a switch connects it through a 2 kΩ resistor to a 20 V source. What does a voltmeter across the capacitor read at t = 0⁺ — the instant after the switch closes?"
    options={[
      { id: 'hold', label: '8 V — exactly what it held at 0⁻' },
      { id: 'snap', label: '20 V — it snaps to the new source' },
      { id: 'mid',  label: '14 V — halfway between' },
      { id: 'reset', label: '0 V — switching resets it' },
    ]}
    getCorrectAnswer={() => 'hold'}
    explanation={<span>Capacitor voltage is a continuity-protected state variable: changing it means moving charge, and moving charge in zero time means infinite current. So <MathWrapper formula="v_C(0^+) = v_C(0^-) = 8\ \text{V}" /> — what jumps is the <em>current</em>, from 0 to <MathWrapper formula="(20-8)/2\,\text{k} = 6\ \text{mA}" />. The bench plots both traces so you can see one bend and the other break.</span>}
  >
    <SwitchedRCSim />
  </PredictionGate>
</LabStation>
```

### 5.5 `SwitchedRCSim` complete spec (`src/circuits/components/modules/SwitchedCircuits/SwitchedRCSim.tsx`, NEW — SVG + recharts, no canvas)

**Props:** `{ className?: string }`. **State:** `V1` (pre-switch source, 0–20 V, step 0.5, default **12**); `V2` (post-switch source, 0–20 V, step 0.5, default **20**); `R3` (post-switch resistance, 0.5–10 kΩ, step 0.5, default **2**); `Cuf` (5–100 µF, step 5, default **25**). Fixed and printed: "Pre-switch divider: R₁ = 4 kΩ, R₂ = 8 kΩ (fixed)". Defaults reproduce the WorkedSteps example **digit for digit** (8 V / 20 V / 50 ms / 6 mA) — pencil and bench must agree.

Derived each render (ALL physics via imported `@circuits/utils/circuitSolver` exports, zero inline arithmetic): `v0 = calculateDCDivider(V1, 4000, 8000)`; `vInf = V2`; `tau = (R3 * 1000) * (Cuf * 1e-6)`… **no** — τ also goes through a util: `tau = switchedRCTau(R3 * 1000, Cuf * 1e-6)`; `iJumpmA = switchedRCCurrentJump(V2, v0, R3 * 1000) * 1000`.

**Layout (top → bottom, Lab Instrument card `bg-white dark:bg-slate-800 rounded-xl shadow-md`):**
1. **SVG schematic** (~120 px, `role="img"` `aria-label="Two-position switch moving a capacitor from a charging divider to a new source"`): position-a branch (V₁, R₁, R₂) greyed for t ≥ 0, position-b branch (V₂, R₃) highlighted, capacitor with live `v_C` tag, switch arm drawn at position b.
2. **Strip chart** (recharts `LineChart` in `ResponsiveContainer`, ~220 px; `PhysicsChart` is em-domain and MUST NOT be imported — recharts directly, slate/engineering-blue tokens): `v_C(t)` solid (left axis, V) and `i_C(t)` dashed (right axis, mA) over `t ∈ [−τ, 5τ]` ms, 181 points precomputed in a `useMemo` keyed `[V1, V2, R3, Cuf]` via `switchedFirstOrder` (voltage) and the decaying-jump expression composed from the same exports; **two samples at t = 0** (`t = −1e−9` with i = 0, `t = 0` with i = iJump) so the current trace renders a clean vertical break instead of a slope; `ReferenceLine x={0}` labelled "SWITCH"; dashed `ReferenceLine y={vInf}`; dot marker at `(τ, v(τ))` captioned "1 τ — 63.2 % of the gap". Wrapper `role="img"` `aria-label="Capacitor voltage continuous across the switch; capacitor current jumping at t equals zero"` (data redundant with readouts).
3. **Controls** — native `<input type="range">`, SmithChartSim's visible-label + `aria-labelledby` pattern (jsx-a11y clean, keyboard free): `V₁ (pre-switch source) = {V1.toFixed(1)} V`, `V₂ (post-switch source) = {V2.toFixed(1)} V`, `R₃ = {R3.toFixed(1)} kΩ`, `C = {Cuf} µF`. **Preset chips** (native buttons, `aria-pressed`): `Worked example` → (12, 20, 2, 25); `Discharge (V₂ = 0)` → V2 = 0; `No precharge (V₁ = 0)` → V1 = 0 *(recovers Section 1.2's zero-state curve — the special case the rest of the app uses)*.
4. **ReadoutCards** (local `ReadoutCard` helper — per-sim duplication is the house convention):
   - `v_C(0⁻) = v_C(0⁺)` → `"8.00 V"`
   - `v_C(∞)` → `"20.0 V"`
   - `τ = R₃C` → `"50.0 ms"`
   - `i_C across the switch` → `"0 → 6.00 mA"` (negative rendered with the proper sign, e.g. `"0 → −4.00 mA"` on the Discharge preset: (0 − 8)/2 kΩ = −4 mA ✓).

## 6. Tab 3 — "Second Order: A₁ & A₂"

### 6.1 Framing
> Section `{getSectionNumber('circuit-analysis')}` gave you the underdamped *shape*: `v_C(t) = V_f + e^{-\alpha t}(A_1\cos\omega_d t + A_2\sin\omega_d t)`. It never showed where `A_1, A_2` come from — the app's solver computes them silently, always for a zero start. They come from the SAME two continuity rules: two state variables (`v_C`, `i_L`) ⇒ two initial facts ⇒ two coefficients. Second order is first order's bookkeeping, done twice.

### 6.2 WorkedSteps — "A step that doesn't start at zero" (`tryFirstPrompt="Compute α, ω₀ and ω_d from R = 6 Ω, L = 1 mH, C = 40 µF before revealing step 1."`)
Series RLC: `R = 6\ \Omega`, `L = 1\ \text{mH}`, `C = 40\ \mu\text{F}`. The source has been 5 V forever; at `t = 0` it steps to 10 V.
- **Step 1 — Pre-state:** DC steady state with 5 V: capacitor open ⇒ `i_L(0^-) = 0`; no current ⇒ no drops ⇒ `v_C(0^-) = 5\ \text{V}`.
- **Step 2 — Cross the boundary, translate to calculus:** `v_C(0^+) = 5\ \text{V}`; `i_L(0^+) = 0`. In a series loop `i_C = i_L`, so `\frac{dv_C}{dt}(0^+) = \frac{i_C(0^+)}{C} = 0`. *Two facts: a value and a slope.*
- **Step 3 — Parameters:** `\alpha = \frac{R}{2L} = \frac{6}{2\times10^{-3}} = 3000\ \text{s}^{-1}`; `\omega_0 = \frac{1}{\sqrt{LC}} = \frac{1}{\sqrt{10^{-3}\times 40\times10^{-6}}} = \frac{1}{2\times10^{-4}} = 5000\ \text{rad/s}`; `\zeta = 3000/5000 = 0.6 < 1` ⇒ underdamped; `\omega_d = \omega_0\sqrt{1-\zeta^2} = 5000 \times 0.8 = 4000\ \text{rad/s}`. *(A 3-4-5 triangle: α = 3000, ω_d = 4000, ω₀ = 5000.)*
- **Step 4 — Fit A₁ from the value:** `v_C(0^+) = 10 + A_1 = 5 \Rightarrow A_1 = -5`.
- **Step 5 — Fit A₂ from the slope:** `\frac{dv_C}{dt}(0^+) = -\alpha A_1 + \omega_d A_2 = 0 \Rightarrow A_2 = \frac{\alpha A_1}{\omega_d} = \frac{3000(-5)}{4000} = -3.75`.
  `v_C(t) = 10 - e^{-3000t}\left(5\cos 4000t + 3.75\sin 4000t\right)\ \text{V}`
- **Step 6 — Audit (does this make sense?):** `v_C(0) = 10 - 5 = 5` ✓; `t\to\infty \Rightarrow 10` ✓. Slope check: derivative cosine coefficient `-\alpha A_1 + \omega_d A_2 = 15000 - 15000 = 0` ✓. Compact form: amplitude `\sqrt{5^2 + 3.75^2} = \sqrt{39.0625} = 6.25` (the 3-4-5 again: 6.25 = 5 × 1.25), so `v_C = 10 - 6.25\,e^{-3000t}\cos(4000t - 36.87^\circ)`. Loop current `i = C\frac{dv_C}{dt} = 1.25\,e^{-3000t}\sin 4000t\ \text{A}` ⇒ `i(0) = 0` ✓ (sine coefficient of the derivative: `-\alpha A_2 - \omega_d A_1 = 11250 + 20000 = 31250`; `\times C = 40\times10^{-6} \times 31250 = 1.25`). First voltage peak where the current crosses zero: `\omega_d t = \pi \Rightarrow t = 0.785\ \text{ms}`, `v_{peak} = 10 + 5e^{-3\pi/4} = 10 + 5(0.0948) = 10.47\ \text{V}` — a 9.5 % overshoot of the 5 V swing, exactly the textbook `e^{-\zeta\pi/\sqrt{1-\zeta^2}} = e^{-0.75\pi} = 9.5\,\%` for ζ = 0.6 ✓. Magnitude plausibility (2E): the circuit's natural impedance is `\sqrt{L/C} = \sqrt{10^{-3}/(4\times10^{-5})} = 5\ \Omega`, so a 5 V step should drive a ~1 A-scale ring; the damped peak is ≈ 0.50 A — plausible ✓.

The printed `A₁`/`A₂` values in steps 4–5 are interpolated from the new tested export `secondOrderStepICs(3000, 4000, 5, 10, 0)` (§7) rather than hardcoded — the rendered numbers are oracle-backed by the unit suite.

### 6.3 ConceptCheck CC-3 (multiple-choice)
- **Q:** "In the worked example, the source snaps from 5 V to 10 V at t = 0 — yet we set dv_C/dt(0⁺) = 0. Why is the capacitor-voltage slope zero at the very moment of the step?"
- ✅ **"Because in a series loop i_C = i_L, and i_L(0⁻) = 0 cannot jump — so dv_C/dt(0⁺) = i_C(0⁺)/C = 0"** — *Correct. The inductor stands between the step and the capacitor: until current builds, no charge flows, so v_C leaves t = 0 flat (value AND slope continuous here).*
- ❌ "Because v_C cannot jump" — *That rule pins the VALUE v_C(0⁺) = 5 V. The slope is a separate fact, and it comes from the OTHER state variable, i_L.*
- ❌ "Because every quantity has zero derivative at DC steady state" — *True at 0⁻ — but 0⁺ is after the step, in a circuit that is no longer at steady state. The slope is zero only because the series inductor pins the current.*
- ❌ "It isn't zero — the step forces dv_C/dt(0⁺) = (10 − 5)/RC immediately" — *That is the FIRST-order RC result, where the resistor connects source to capacitor directly. Here an inductor is in the way, and its current (zero) sets the capacitor's initial slope.*
- hints: `['What is i_C in a series RLC loop?', 'Translate i_L(0⁺) = 0 into a statement about dv_C/dt(0⁺).']`

### 6.4 UP NEXT box (closes the page; engineering-blue border-l-4)
> **UP NEXT** — You just did the bookkeeping by hand: carry `v_C(0^-)`, `i_L(0^-)` across the switch, fit constants, check limits. The Laplace transform does ALL of it automatically — initial conditions enter the algebra as built-in source terms, and the constants fall out of a partial-fraction expansion. That machine is Section `{getSectionNumber('laplace-theory')}`, and the IC-source trick itself returns in Section `{getSectionNumber('s-domain')}`'s toolkit later in the course.

*(One sentence of foreshadowing only — s-domain IC equivalent sources are roadmap 2I, NOT built here.)*

---

## 7. `circuitSolver.ts` additions (exported, pure; JSDoc in unicode — no LaTeX in .ts)

```ts
/** DC voltage divider: Vs·Rshunt/(Rseries+Rshunt). NaN when Rseries+Rshunt ≤ 0. */
export function calculateDCDivider(Vs: number, Rseries: number, Rshunt: number): number

/** First-order time constant τ = R·C (or pass L, R as (L/R) by the caller — RC form here). NaN for R ≤ 0 or C ≤ 0. */
export function switchedRCTau(R: number, C: number): number

/** Capacitor-current jump at t = 0⁺ for the series source-R-C loop: (Vsrc − v0)/R amps. NaN for R ≤ 0. */
export function switchedRCCurrentJump(Vsrc: number, v0: number, R: number): number

/** THE recipe: x(t) = xInf + (x0 − xInf)·e^(−t/τ) for t ≥ 0; returns x0 unchanged for t < 0
 *  (pre-switch flat segment, so charts can plot across the boundary). NaN for tau ≤ 0. */
export function switchedFirstOrder(x0: number, xInf: number, tau: number, t: number): number

/** Underdamped step coefficients from ICs — makes the solver's invisible constants visible:
 *  x(t) = xInf + e^(−αt)(A1·cos ω_d t + A2·sin ω_d t);
 *  A1 = x0 − xInf;  A2 = (dxdt0 + α·A1)/ω_d.  NaN pair for omegaD ≤ 0. */
export function secondOrderStepICs(alpha: number, omegaD: number, x0: number, xInf: number, dxdt0: number):
  { A1: number; A2: number }
```

**Unit tests** (append to `src/circuits/utils/__tests__/circuitSolver.test.ts`; one describe per function, `toBeCloseTo`, full hand derivation in comments — ALL values re-derived in this doc):
- `calculateDCDivider(12, 4000, 8000)` → 8 *(12·8/12)*; `(20, 0, 8000)` → 20; `(12, 4000, 0)` → 0; `(12, -4000, 4000)` → NaN
- `switchedRCTau(2000, 25e-6)` → 0.05; `(8000, 25e-6)` → 0.2; `(0, 1e-6)` → NaN
- `switchedRCCurrentJump(20, 8, 2000)` → 0.006 *(the worked example's 6 mA)*; `(0, 8, 2000)` → −0.004 *(Discharge preset)*; `(20, 8, 0)` → NaN
- `switchedFirstOrder(8, 20, 0.05, 0)` → 8; `(8, 20, 0.05, 0.05)` → 15.585 ±0.001 *(20 − 12e⁻¹ = 20 − 4.4145)*; `(8, 20, 0.05, 0.25)` → 19.919 ±0.001 *(12e⁻⁵ = 0.0808)*; `(8, 20, 0.05, -0.1)` → 8 *(pre-switch flat)*; `(8, 0, 0.2, 0.2)` → 2.943 ±0.001 *(8e⁻¹ — Tab-1 discharge sanity)*; `(5, 5, 0.1, 7)` → 5 *(no gap, no transient)*; `(8, 20, 0, 0.1)` → NaN
- `secondOrderStepICs(3000, 4000, 5, 10, 0)` → `{ A1: −5, A2: −3.75 }` — **the worked example oracle** *(A2 = (0 + 3000·(−5))/4000)*
- `secondOrderStepICs(3000, 4000, 0, 10, 0)` → `{ A1: −10, A2: −7.5 }` — **the zero-state cross-tie**: must equal the constants the existing solver bakes in. Companion assertion: reconstruct `10 + e^(−3000t)(A1 cos 4000t + A2 sin 4000t)` at t = {0.2, 0.5, 1.0} ms and `toBeCloseTo` the `voltage` samples of `calculateCircuitResponse('RLC', { R: 6, L: 0.001, C: 0.00004, voltage: 10 }, 1e-4, 0.002)` at the same indices — the new export and the legacy solver must be the *same physics* (this is the test that proves "the solver computes them invisibly" is now visible and identical).
- `secondOrderStepICs(3000, 0, 5, 10, 0)` → `{ NaN, NaN }`

## 8. GuidedChallenge (verbatim; `.tsx`-local const, unicode τ/Ω/µ — no LaTeX)

- **title:** `Throw the Switch: From Pre-State to Steady State`
- **description:** `A guided run of the Throw the Switch bench (First-Order Recipe tab): start on the worked example's two-position circuit, verify the bench against your pencil digit for digit, then bend each of the three recipe numbers in turn.`
- **instructions:**
  1. `Open the First-Order Recipe tab and commit the Predict-First prediction to reveal the bench. Confirm the four readouts against the worked example: v_C(0⁻) = v_C(0⁺) = 8.00 V, v_C(∞) = 20.0 V, τ = 50.0 ms, i_C jump 0 → 6.00 mA.`
  2. `Look at the chart around t = 0: the voltage trace crosses the SWITCH line without a kink, while the dashed current trace breaks vertically from 0 to 6 mA. State the two continuity rules this picture is drawing.`
  3. `Find the dot at t = τ = 50 ms and read v ≈ 15.6 V. Check the 63.2% rule by hand: 8 + 0.632 × (20 − 8) ≈ 15.6 V.`
  4. `Press 'Discharge (V₂ = 0)'. The final value drops to 0, the current jump flips to 0 → −4.00 mA, and the curve becomes a pure decay v = 8e^(−t/τ). The recipe handles charging and discharging with the same line.`
  5. `Press 'No precharge (V₁ = 0)'. Now v_C(0⁺) = 0 and the curve is exactly the zero-state response from the Circuit Analysis section — that whole page was this bench with one slider parked at zero.`
  6. `Restore 'Worked example', then drag R₃ from 2 kΩ to 4 kΩ. Confirm τ doubles to 100 ms and the current jump halves to 3.00 mA — then say in one sentence which of the three recipe numbers R₃ touched (τ and the jump) and which it could not (v_C(0⁺) and v_C(∞)).`
- **hint:** `Every run is the same three questions: where does x start (old circuit + continuity), where does it end (new circuit at DC), how fast does it travel (τ from the new circuit's resistance). The sliders only ever move those three numbers.`

## 9. Sequencing & collision avoidance (binding)

1. **Branch from current `main`** (the tree already contains ILO9's 23 sections and PR #7's blocking-default gate — both verified directly in source). Ship via branch + PR through the GitHub REST API (no gh CLI; classifier blocks direct-main pushes).
2. **Interaction with unit 2A (`line-impedance`, approved, NOT yet implemented):** both units insert one section and edit the same two shared test files. Whichever lands **second** must rebase: counts `24 → 25` in `curriculum.test.ts`, and merge the `getSectionNumber.test.ts` line-edits (2A touches the `transients` expectation `'5.3'→'5.4'` and adds `line-impedance`; this unit touches `partial-fractions`/`interactive-lab` and adds `switched-circuits` — different lines, textual merge is trivial). `curriculum.ts` insertions are in different Parts (no hunk overlap).
3. **WorkedSteps hoist (2A §11):** NOT needed here — this unit lives in circuits and imports `@circuits/components/common/WorkedSteps` directly. If 2A lands first (WorkedSteps moves to `@shared`), this unit imports from `@shared/components/common/WorkedSteps` instead; if this unit lands first, 2A's hoist repoints **three** consumers (NodalMesh, PartialFractions, SwitchedCircuits) instead of two — flag it in whichever PR is second.
4. Commit order, each leaving the tree green: (1) `circuitSolver.ts` exports + tests (TDD: tests first); (2) `SwitchedRCSim.tsx`; (3) section page + curriculum/registry wiring + test-count edits + page test + smoke; (4) the single TimeDomain seam callout.
5. Full suite on the owner's box: `npm test -- --no-file-parallelism` (vitest OOMs at default forks on the 4-core machine).

## 10. Per-file plan

| File | Action |
|---|---|
| `src/circuits/utils/circuitSolver.ts` | ADD 5 exports (§7), commit 1 (TDD) |
| `src/circuits/utils/__tests__/circuitSolver.test.ts` | ADD vectors incl. the −5/−3.75 oracle and the solver cross-tie (§7), commit 1 |
| `src/circuits/components/modules/SwitchedCircuits/SwitchedRCSim.tsx` | NEW sim (§5.5), commit 2 |
| `src/circuits/components/modules/SwitchedCircuits/index.tsx` | NEW page (§3–§6, §8), commit 3 |
| `src/shared/constants/curriculum.ts` | 2 insertions (§1.1), commit 3 |
| `src/sectionRegistry.tsx` | 1 loader (§1.2), commit 3 |
| `src/shared/constants/__tests__/curriculum.test.ts` | 23→24 ×2 + test name (§1.3), commit 3 |
| `src/shared/constants/__tests__/getSectionNumber.test.ts` | 1.6→1.7, 1.8→1.9, add 1.5 (§1.4), commit 3 |
| `src/circuits/components/__tests__/SwitchedCircuits.page.test.tsx` | NEW page test (§11), commit 3 |
| `src/circuits/components/__tests__/pages.test.tsx` | smoke entry (§1.5), commit 3 |
| `src/circuits/components/modules/TimeDomain/index.tsx` | 1 seam callout between lines 151 and 153 (§2), commit 4 |

## 11. Test plan

**Unit (vitest, TDD order):** all §7 vectors with hand derivations in comments. Key oracles: divider 8 V; τ 50 ms; jump 6 mA / −4 mA; recipe 15.585 / 19.919 / 2.943; ICs {−5, −3.75}; zero-state {−10, −7.5} **plus** the numeric cross-tie against `calculateCircuitResponse` (same-physics proof).

**Page test — NEW `SwitchedCircuits.page.test.tsx`** (NodalMesh.page.test convention: local `renderWithRouter` + `passPredictionGate` helpers, MemoryRouter):
1. Gate blocks the bench: `Predict First` visible; `queryByRole('slider', { name: /pre-switch source/i })` null; **no /skip/i control** (pins blocking under the #7 default).
2. Pass gate (`'8 V — exactly what it held at 0⁻'` → Continue) → all four sliders present.
3. Deterministic readouts at defaults: `"8.00 V"`, `"20.0 V"`, `"50.0 ms"`, `"0 → 6.00 mA"` rendered (DOM readouts, jsdom-safe).
4. `fireEvent.change` R₃ slider to 4 → τ readout `"100.0 ms"`, jump `"0 → 3.00 mA"`.
5. Switch to "The 0⁻/0⁺ Boundary" tab and back → bench still unlocked (lifted state via `initialPassed`).
6. WorkedSteps present: `Reveal step 2 of 6` button; click through → `All steps revealed`.
7. h1 = /Switched Circuits & Initial Conditions/i with the derived-number span; the three CC questions render across their tabs.

**Wiring (mostly self-enforcing):** curriculum.test 24-counts; getSectionNumber 1.5/1.7/1.9; routeIntegrity (registry === ALL_SECTIONS) + curriculum load-time throws; app.test unaffected (PART-tag regexes, no counts); e2e route lists derive from ALL_SECTIONS (zero edits, +2 screenshots).

**Estimated additions:** ~16 unit assertions + ~7 page tests + 1 smoke; suite grows from its current count by ~24 with zero skips.

## 12. Explicit NON-goals (scope fence)

- **No s-domain initial-condition equivalent sources** (`sL·i(0⁻)`, `v(0⁻)/s`) — that is roadmap **2I** stretch; this unit spends exactly one foreshadowing sentence on it (§6.4).
- **No changes to `calculateCircuitResponse`** — the zero-state solver stays byte-identical; the new `secondOrderStepICs` only *mirrors* its constants (and a test proves it).
- **No second-order sim, no overdamped/critically-damped IC examples** — the roadmap asks for "one hand-worked second-order step"; one underdamped WorkedSteps is it.
- **No transmission edits** — the bounce-chart source-end staircase is verified already shipped (`BounceDiagram.tsx` 614–632); do not "improve" it here.
- **No sequential-switching / multi-switch / pulse-input problems** (Nilsson's next tier — out).
- **No WorkedSteps hoist, no Tabs work, no gamification persistence changes** — handled by 2A §11, already-unified Tabs, and the open owner decision respectively.
- **No renumber-driven prose edits beyond the specced files** — grep confirmed none exist.

## 13. Verification gates (implementer must run, in order)

1. Per-commit: `npx tsc -b && npx vite build` clean; `npm run lint` zero errors (native ranges + `aria-labelledby` keep jsx-a11y clean).
2. Full suite: `npm test -- --no-file-parallelism` — all green, **0 skips**, counts match §11.
3. Grep invariants: no `@/` imports; no cross-domain leaks (the page imports only `@shared` + `@circuits`); `shared/` imports no domain; no hardcoded `1.5`–`1.9` section numbers in new prose (`getSectionNumber` only).
4. KaTeX rule audit: every `formula="…"` literal single-backslash; no LaTeX in `.ts` strings (all new `.ts` JSDoc is unicode).
5. Playwright harness (`e2e/screenshots.spec.ts`): run, confirm `/switched-circuits` auto-appears (50 shots total: 25 routes × 2 viewports) — owner visual walk via the harness before merge: voltage trace kink-free across t = 0 while the current trace breaks vertically; flat pre-switch segment visible; dark mode on the SVG + chart; keyboard-only traversal of the full GuidedChallenge (slider arrows, tab roving-tabindex); mobile LabLayout stack with the "Jump to lab" anchor.
6. Behavioral pin: page test asserts no Skip control (gate blocking regardless of future default changes).
