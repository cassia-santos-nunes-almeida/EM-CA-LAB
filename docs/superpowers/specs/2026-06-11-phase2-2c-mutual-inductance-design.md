# Unit "2C" design — Mutual Inductance, actually defined · extends `transformers` (3.4)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` — **roadmap unit 2D** (ILO 5)
**Provenance:** recon of `Transformers.tsx` (522 lines, 3 tabs, 2 CCs, 1 gate, 1 YourTurn, GuidedChallenge), `CoupledCoilsSim.tsx`, `transmissionMath.ts` transformer exports, shared primitives (`PredictionGate`/`ConceptCheck`/`YourTurnPanel`/`CollapsibleSection`/unified `Tabs`), `pages.test.tsx`, `e2e/sim-paint.spec.ts`, curriculum spine. Every number below hand-derived twice (symbolic route + decimal route) in this doc. House style matched to the approved 2A design (`2026-06-10-phase-2a-line-impedance-design.md`).

> **⚠ Label note (binding for traceability):** the work order called this "unit 2C (mutual-inductance)". In the roadmap, **2C is "Forces on conductors & motional EMF" (ILO 6)** and **2D is "Mutual inductance, actually defined (ILO 5)"**. The parenthetical content is the scope, so this document designs the roadmap's **2D**. Cross-reference both labels in the PR description.

---

## 1. Pedagogical goal & the exact ILO gap closed

**Goal:** make M a *defined, measurable, terminal-level quantity* — flux linkage per ampere — before the course ever uses it, and write the coupled-coil equations the dot convention has been silently signing. Every example is a DC ramp or a switch interruption (no phasors), matching ILO 5's framing "Inductance in **DC circuits**; define mutual inductance".

**Roadmap quote (unit 2D, verbatim):**

> M is *used* but never defined: no **M = N₂Φ₂₁/i₁**, no coupled-coil equations (v₁ = L₁di₁/dt + M di₂/dt …) — the dot-convention prose sets a sign for an equation that's never written; `CoupledCoilsSim` computes M from k circularly (its own caption admits it). Build: "What is M?" theory block in Transformers (flux-linkage definition + coaxial-solenoids numeric example), the coupled equations EquationBox + a v₂ = M di₁/dt ConceptCheck, one flyback/interrupted-current predict-reveal. Effort: small-medium.

**Priority rationale (roadmap sequencing §, verbatim):** step 3 of the recommended order — "**2C forces/motional EMF** + **2D mutual inductance** (completes ILOs 5/6, the Part-2/3 physics debt)" — after 2A line theory, before 2F/2G. ILO 5 is graded **partial** on the scorecard; this unit is the whole remedy (the self-inductance half of ILO 5 already exists in `component-physics` and `faraday`).

**The circularity, named precisely (so the implementer fixes the right thing):** today `k = M/√(L₁L₂)` is the *first* equation in 3.4 — k is defined in terms of an undefined M, and the sim then computes `M = k·√(L₁L₂)`, i.e. the same equation read backwards. The cure is pedagogical, not code: once M is *defined* from flux linkage and the bound `M ≤ √(L₁L₂)` is *proved*, k = M/√(L₁L₂) becomes an honest definition of k and the sim's readout `M = k√(L₁L₂)` becomes that definition rearranged — correct as-is. The sim therefore stays untouched except a one-sentence caption pointer (§7).

---

## 2. Decision: extend `transformers` (3.4) — NO new section

**Ruling: extend.** Evidence:

1. The roadmap names the home explicitly: "'What is M?' theory block **in Transformers**". Effort class "small-medium" ≈ three theory blocks + one CC + one gate — nowhere near a section.
2. `Transformers.tsx` is 522 lines with a 3-tab structure and visible seams: the Theory tab currently *opens* with k = M/√(L₁L₂) — the missing M definition slots exactly above it; the dot-convention prose ends exactly where the coupled equations belong. This is filling holes in an existing narrative, not a new narrative.
3. Contrast with 2A's new-section ruling: 2A was a full Ulaby chapter (4 tabs, new sim, new bench) grafted onto the already-longest Part-5 page. Here the additions are ~40% of one tab on a mid-sized page.
4. Zero wiring cost: **no `curriculum.ts` edit, no `sectionRegistry.tsx` edit, no renumbering, no count-test churn** (`curriculum.test.ts` 23-counts, `getSectionNumber.test.ts` `transformers → '3.4'`, `routeIntegrity` all untouched). If 2A lands first (adds `line-impedance` as 5.3), there is still no interaction — different Part.

**Conventions (binding, same as 2A):** all formulas below are JSX attribute literals → **single backslash exactly as written**; plain-string props (`question`, YourTurn `scenario`, CHALLENGE fields) use **literal unicode subscript characters** (₁₂ typed directly), never LaTeX — and **never `\uXXXX` escapes in JSX *attribute* positions**: JSX attribute string literals do NOT process JS escape sequences (JSX spec; reviewer-verified against the project's own esbuild — `question="N\u2082"` reaches the DOM as the six literal characters `\u2082`, not as `₂`). `\uXXXX` escapes are fine only inside real JS string contexts (expression containers, the CHALLENGE const, `options` arrays). ⚠ The existing file already has this bug: the sim gate `question=` (line 412) and the YourTurn `scenario=` (line 449) render their `\u2081`/`\u2082`/`\u00B2`/`\u03A9` escapes literally on screen — fixed as a ride-along in §5.6 (and required for test §9.8 to pass). No hardcoded section numbers in prose — `{getSectionNumber('transformers')}` only (already the pattern in the h1). New PredictionGate: **write no `allowSkip` prop** — verified in the working tree that blocking is already the default (`allowSkip = false` in `PredictionGate.tsx` line 62).

---

## 3. Content outline — Theory tab insertions

Theory-tab order after this unit: figures → **[NEW §3A "What is mutual inductance?"]** → existing "Coupling Coefficient & Dot Convention" (+ **[NEW §3B collapsible]**) → **[NEW §3C "The coupled-coil equations" + flyback gate]** → existing "Ideal Transformer" (+ one bridge sentence).

### 3A. NEW section "What is mutual inductance?" (placed BEFORE the k section)

**h2:** `What is mutual inductance?`

**Opening paragraph (exposed-debt pattern, house style):**
> So far the course has *used* M — the sim below reads it out in millihenries, and the coupling coefficient is about to be defined as a ratio involving it. Time to pay the debt: M is not an abstract knob. It is a number you can compute from geometry and measure at the terminals with nothing but a ramp generator and a voltmeter.

**Definition block.** Recall (one sentence, cross-ref Faraday's Law section by `{getSectionNumber('faraday')}`) that a coil's self-inductance is flux linkage per ampere, `L = N\Phi/i`. Then:

> Send current `i_1` through coil 1. Some of its flux, `\Phi_{21}`, threads each of coil 2's `N_2` turns. The **mutual inductance** is coil 2's flux linkage per ampere of coil 1's current:

`M = \frac{N_2\,\Phi_{21}}{i_1} \qquad [\text{H} = \text{Wb/A}]` *(block, boxed — first definition of M in the app)*

> Remarkably, the linkage is reciprocal: the flux coil 2's current links into coil 1 gives exactly the same number, `M_{12} = M_{21} = M` — one M per coil *pair* (we state this; the proof is a Neumann double integral beyond this course). Combine the definition with Faraday's law `v_2 = N_2\,d\Phi_{21}/dt` and, with coil 2 open (no secondary current, no secondary flux):

`v_2 = M\,\frac{di_1}{dt}` *(block, boxed, labelled "the transformer's whole job in one line")*

> Read it twice: a *steady* primary current — however large — induces **nothing**. Only change couples. That is why transformers are AC machines, and why interrupting a DC current is so violent (the gate below).

**Worked example — coaxial solenoids (inline card, the existing 3.4 `border-l-2` step pattern; NOT WorkedSteps — see §8):**

*Setup:* a long solenoid, `N_1 = 500` turns wound over `l = 10\,\text{cm}`, cross-section `A = 2\,\text{cm}^2`; a second winding of `N_2 = 100` turns wound tightly over its **full length** (same core, same cross-section, spread over the same 10 cm — §3B's `L_2 = \mu_0 N_2^2 A/l` tie-back assumes this; a concentrated bunch of turns would have a different L₂). Drive `i_1 = 2\,\text{A}`.

- **Step 1 — field of coil 1:** `B_1 = \mu_0 \frac{N_1}{l} i_1 = 4\pi\times10^{-7} \times \frac{500}{0.10} \times 2 = 1.257\times10^{-2}\,\text{T}` ≈ 12.6 mT.
  *Hand check:* μ₀N₁/l = 1.25664×10⁻⁶ × 5000 = 6.28319×10⁻³ T/A; × 2 A = 1.25664×10⁻² T ✓.
- **Step 2 — flux through one turn of coil 2:** `\Phi_{21} = B_1 A = 1.257\times10^{-2} \times 2\times10^{-4} = 2.51\,\mu\text{Wb}`.
  *Check:* 1.25664e−2 × 2e−4 = 2.51327e−6 Wb ✓.
- **Step 3 — linkage and M:** `\lambda_2 = N_2\Phi_{21} = 100 \times 2.51\,\mu\text{Wb} = 251\,\mu\text{Wb-turns}`, so `M = \lambda_2 / i_1 = 251\,\mu\text{Wb}/2\,\text{A} \approx 126\,\mu\text{H}`.
  *Check:* 2.51327e−4 / 2 = 1.25664e−4 H = **125.7 μH** ✓.
- **Step 4 — the current cancels (audit):** redo it symbolically: `M = \frac{N_2 B_1 A}{i_1} = \frac{\mu_0 N_1 N_2 A}{l}` — pure geometry, no `i_1`. Direct evaluation: (4π×10⁻⁷ × 500 × 100 × 2×10⁻⁴)/0.10: numerator 1.25664e−6 × 5×10⁴ = 6.28319e−2; × 2e−4 = 1.25664e−5; ÷ 0.10 = **1.25664×10⁻⁴ H = 125.7 μH** — identical ✓. *If your M depends on the drive current, you computed flux, not flux per ampere.*
- **Step 5 — use it:** ramp the primary at 500 A/s → `v_2 = M\,di_1/dt = 1.257\times10^{-4} \times 500 = 62.8\,\text{mV}` on the open secondary. *Check:* 1.25664e−4 × 500 = 6.2832e−2 V ✓.

**"Does this make sense?" callout (2E plausibility pattern riding along, per roadmap):** order of magnitude — air-core, centimetre-scale, hundreds of turns → tens-to-hundreds of μH is the right ballpark for M (the sim's iron-core-flavoured mH values are 10–100× larger because μᵣ ≫ 1). A henry of mutual inductance in air would need a coil the size of a room.

### 3B. Seam edits to the existing "Coupling Coefficient & Dot Convention" section

1. **One connective sentence** inserted before the `k = M/√(L₁L₂)` MathWrapper (the formula itself is untouched): "Now that M is defined, we can ask how good a given pair is: compare its M to the largest value the two self-inductances allow."
2. **NEW `CollapsibleSection title="Why M can never exceed √(L₁L₂)" variant="inline"` (closed by default, placed right after the `0 ≤ k ≤ 1` paragraph)** — the 3-line energy argument that turns "0 ≤ k ≤ 1" from an assertion into a theorem:
   > The energy stored in a coupled pair is `w = \tfrac{1}{2}L_1 i_1^2 + M i_1 i_2 + \tfrac{1}{2}L_2 i_2^2`, and stored energy can never be negative for *any* pair of currents. Pick the most adversarial secondary current, `i_2 = -(M/L_2)\,i_1`:
   > `w = \tfrac{1}{2}L_1 i_1^2 - \frac{M^2}{L_2}i_1^2 + \tfrac{1}{2}\frac{M^2}{L_2}i_1^2 = \tfrac{1}{2}i_1^2\!\left(L_1 - \frac{M^2}{L_2}\right) \ge 0 \;\Longrightarrow\; M^2 \le L_1 L_2`
   > *Algebra audit:* middle term Mi₁i₂ = M·i₁·(−M/L₂)i₁ = −(M²/L₂)i₁²; last term ½L₂(M²/L₂²)i₁² = ½(M²/L₂)i₁²; sum = −½(M²/L₂)i₁² ✓. So `k = M/\sqrt{L_1 L_2}` is *forced* into [0, 1] — a coil pair with k > 1 would be a free-energy machine.
   > Closing tie-back to §3A's example: there, `L_1 = \mu_0 N_1^2 A/l` and `L_2 = \mu_0 N_2^2 A/l`, so `\sqrt{L_1 L_2} = \mu_0 N_1 N_2 A/l = M` exactly — the idealized shared-core geometry is the k = 1 limit. *Numeric audit:* L₁ = 1.25664e−6 × 500² × 2e−4/0.1 = **628.3 μH** (1.25664e−6 × 2.5e5 = 0.314159; × 2e−4 = 6.28319e−5; ÷ 0.1 ✓); L₂ = 1.25664e−6 × 100² × 2e−4/0.1 = **25.13 μH**; √(628.3 × 25.13 μH²) = √(15 791 μH²) = **125.7 μH** = M from Step 4 ✓ → k = 1.000. Real windings leak (end effects, imperfect overlap), which is exactly what k < 1 measures.

### 3C. NEW section "The coupled-coil equations" (placed AFTER the dot-convention diagrams + CC, BEFORE "Ideal Transformer")

**h2:** `The coupled-coil equations`

**Lead-in (pays off the dot prose):** "The dot convention just gave you a *sign rule* — but a sign rule for what equation? This one. Each coil sees its own self-induced voltage plus a mutual term from the other coil's changing current:"

`v_1 = L_1\frac{di_1}{dt} + M\frac{di_2}{dt}` *(block, boxed pair —)*
`v_2 = M\frac{di_1}{dt} + L_2\frac{di_2}{dt}` *(— "the coupled-coil equations: KVL's new vocabulary")*

**"How to read this" mini-list (2A house pattern):**
(i) signs as written hold when **both** currents enter dotted terminals (passive sign convention on both ports); a current entering an undotted terminal flips the sign of *both* M terms — that is the entire content of the dot rule above;
(ii) open the secondary (`i_2 = 0`) and the second line collapses to §3A's `v_2 = M\,di_1/dt` — the definition and the circuit equation are the same physics;
(iii) these are simultaneous: the secondary's current talks *back* to the primary through the same M. Solving the pair with Kirchhoff is how every transformer problem in Part 5's distributed world starts.

**ConceptCheck CC-M1** (wired `onComplete={() => incrementConceptChecks('transformers')}` `onHint={() => incrementHints('transformers')}`, the section's third CC):
- **Q:** "Two coils have M = 50 mH. The primary current ramps steadily from 0 to 2 A in 4 ms while the secondary is open-circuited. What voltage magnitude appears at the secondary terminals during the ramp?"
- ✅ **"25 V"** — *Correct. di₁/dt = 2 A / 0.004 s = 500 A/s, so |v₂| = M·di₁/dt = 0.05 × 500 = 25 V. An open coil with zero current can still show a healthy terminal voltage — it reports the other coil's rate of change.* [audit: 2/0.004 = 500 ✓; 0.05 × 500 = 25 ✓]
- ❌ "25 mV" — *You divided by 4 instead of 0.004 — the ramp lasts 4 milliseconds. A 1000× unit slip is the classic error here.* [2/4 = 0.5 A/s; 0.05 × 0.5 = 0.025 V ✓ consistent distractor]
- ❌ "0.1 V" — *That is M × i₁ = 0.05 × 2. Mutual voltage couples to the rate of change di₁/dt, never to the current itself — a steady 2 A would induce exactly nothing.*
- ❌ "0 V — the secondary is open, so no current means no voltage" — *No current means no I·R drop, but v₂ = M di₁/dt is an EMF: it exists at open terminals, like a battery nobody has connected yet. (Measuring it is precisely how the Practice tab's new exercise determines M.)*
- hints: `['v₂ = M di₁/dt — you need the rate of change of the PRIMARY current.', 'di₁/dt = 2 A ÷ 4 ms. Watch the milli.']`

**Flyback predict-reveal (PredictionGate, blocking, no sim — children are a static reveal card).** Placed at the end of §3C as its payoff. Gate state lifted to the page (§5).

```jsx
<PredictionGate
  question="The same pair (M = 50 mH) carries a steady primary current of 2 A. You snap a mechanical switch open, collapsing i₁ from 2 A to zero in about 10 µs. What appears across the open secondary at that instant?"
  options={[
    { id: 'zero',  label: '≈0 V — the current is gone, so the voltage is gone' },
    { id: 'ramp',  label: '25 V — same as the slow ramp' },
    { id: 'spark', label: '≈10 000 V — a high-voltage spike' },
    { id: 'vs',    label: '2 V — whatever drove the primary' },
  ]}
  getCorrectAnswer={() => 'spark'}
  initialPassed={flybackUnlocked}
  onPassed={() => setFlybackUnlocked(true)}
  onPredict={(correct) => markPredictionGate('transformers', correct)}
  explanation={<p>Same formula, savage rate: <MathWrapper formula="|v_2| = M\,\frac{|\Delta i_1|}{\Delta t} = 0.05 \times \frac{2}{10^{-5}} = 10\,000\,\text{V}" />. The faster the interruption, the bigger the spike — di&#8321;/dt is the whole game.</p>}
>
  {/* Reveal card: "THE FLYBACK SPIKE" */}
</PredictionGate>
```

[audit: 2 A / 10⁻⁵ s = 2×10⁵ A/s ✓; 0.05 H × 2×10⁵ A/s = 1×10⁴ V = 10 kV ✓]

**Reveal card content** (amber-accent card, mono kicker `THE FLYBACK SPIKE`):
> This is not a malfunction — it is a product. A car's **ignition coil** is exactly this circuit: charge the primary to a few amps, snap it open with a transistor, and the mutual spike (helped by a deliberately large turns ratio) fires 10–40 kV across the spark-plug gap. The same physics, uninvited, is why switching any inductive load arcs across the opening contacts: the primary's own `L_1\,di_1/dt` spikes too, so relay datasheets demand a **flyback diode** to give the current somewhere to go. One equation, two industries: ignition systems exploit `M\,di_1/dt`; every relay driver in existence defends against it.
> *Plausibility check (2E):* the slow ramp (§CC-M1) changed the same 2 A over 4 ms → 25 V; the switch does it 400× faster (10 μs) → 400 × 25 V = 10 kV. Same charge of flux, shorter time, scaled voltage ✓. [audit: 4 ms/10 μs = 400 ✓; 25 × 400 = 10 000 ✓]

### 3D. One bridge sentence into "Ideal Transformer" (existing section, prepended to its intro paragraph)

> "The three ratios below are what the coupled-coil equations collapse to in the limit of perfect coupling (k = 1) and large inductance — the everyday working model."

(No derivation — scope cap, see NON-goals.)

---

## 4. Content outline — Practice tab insertion

**NEW YourTurnPanel "Measure M at the terminals"** placed ABOVE the existing reflected-impedance YourTurn (definition-level skill before design-level skill). Plain-string props → unicode, no LaTeX:

- **scenario:** `"You have two coils in a sealed module — no geometry visible, no datasheet. You drive the primary with a current ramp of 200 A/s and measure a steady 30 mV on the open-circuited secondary."`
- **question:** `"What is the mutual inductance M of the pair?"`
- ✅ **"0.15 mH (150 μH)"** — *Correct. M = v₂ ÷ (di₁/dt) = 0.030 V ÷ 200 A/s = 1.5×10⁻⁴ H. The definition runs backwards: M is measurable at the terminals with a ramp and a voltmeter — no geometry needed.* [audit: 3×10⁻² / 2×10² = 1.5×10⁻⁴ ✓]
- ❌ "6 H" — *That is 0.030 × 200 — multiplied instead of divided. A 6 H mutual inductance from a sealed module you can hold in one hand should fail your plausibility check instantly (compare: the air-core solenoid pair in Theory managed 126 μH).*
- ❌ "1.5 mH" — *Decade slip: 0.030/200 = 1.5×10⁻⁴ H = 0.15 mH, not 1.5 mH. Carry the exponents explicitly.*
- ❌ "Cannot be determined without N₂ and the flux" — *N₂Φ₂₁ is exactly what the secondary voltage already reports: v₂ = d(N₂Φ₂₁)/dt = M di₁/dt. M is a terminal quantity — that is the entire point of defining it.*
- **correctReveal:** block math `M = \frac{v_2}{di_1/dt} = \frac{0.030}{200} = 1.5\times10^{-4}\,\text{H} = 150\,\mu\text{H}` *(JSX attr → single backslash)* + one line: "Flip it for the forward use: at 500 A/s this pair would show 75 mV ✓ [audit: 1.5e−4 × 500 = 7.5e−2 V]."
- **hints: OMIT** — reviewer-verified: `YourTurnPanelProps` *declares* `hints?: string[]` but the component never destructures or renders it (dead prop) — passing one would silently no-op. (If a future change wires it up, `['Rearrange v₂ = M di₁/dt for M.']` is the hint to add.)

---

## 5. Page state & structure changes (`Transformers.tsx`)

1. **Imports:** add `CollapsibleSection` from `@shared/components/common/CollapsibleSection`. (`PredictionGate`, `MathWrapper`, `ConceptCheck`, `YourTurnPanel` already imported.)
2. **Lifted gate state:** alongside the existing `simUnlocked`, add `const [flybackUnlocked, setFlybackUnlocked] = useState(false);` — required because the unified `Tabs` remounts panels on switch (verified comment in `Tabs.tsx`: "anything stateful inside must lift its state to the parent"). Two booleans, matching the file's existing minimal pattern (do NOT refactor to 2A's `Record<string, boolean>` — needless churn).
3. **Theory tab:** insert §3A after the FigureImage grid; §3B edits in place; §3C between the dot-convention section and "Ideal Transformer"; §3D sentence.
4. **Practice tab:** §4 YourTurn above the existing one.
5. **Intro paragraph under the h1** (currently "That relationship — mutual inductance — is the foundation…"): append one clause so the page promises the definition: "…mutual inductance — *defined and measured below* — is the foundation…". Cosmetic, keeps the hook honest.
6. **Ride-along bug fix (same file, REQUIRED by §9.8):** the existing sim-gate `question=` (line 412) and reflected-impedance YourTurn `scenario=` (line 449) embed `\uXXXX` escape sequences inside JSX *attribute* literals; JSX does not process them, so the live page currently shows the raw escape text instead of ₁ / ₂ / ² / × / Ω in those two strings (§2 conventions, reviewer-verified against the project's esbuild). Replace the escapes with the literal unicode characters in both attributes — content-identical fix, no behavior change. PR note: the same bug class exists OUTSIDE this unit — `Transients.tsx:342`, `Antennas.tsx:401,470`, `LumpedDistributed.tsx:331–332`, `SmithChartSim.tsx:398–410`, `TransmissionLineSim.tsx:480–492` — flag for a separate sweep, do NOT fix those here (scope fence).

---

## 6. GuidedChallenge delta (CHALLENGE const, plain strings, unicode)

Insert ONE new instruction between current steps 1 and 2 (becomes step 2 of 7), connecting the new theory to the sim's M readout:

> `With N1 = N2 = 50, set k = 0.50 and read the 'Mutual inductance M' card: confirm M = k × √(L1L2) = 0.50 × √(10 mH × 10 mH) = 5.00 mH — the coupling definition from the Theory tab rearranged. Slide k to 1.00 and watch M rise to its energy-allowed ceiling √(L1L2) = 10 mH, the k = 1 limit the Theory tab proves can never be exceeded.`

[audit: √(10 mH × 10 mH) = 10 mH ✓ (sim fixes L₁ = L₂ = 10 mH, line 19–20); 0.5 × 10 = 5.00 mH ✓ — matches sim's `calculateMutualInductance(k, L1, L2) = k√(L1L2)` readout exactly.]

No other CHALLENGE edits (later steps don't reference step numbers — verified).

---

## 7. Sim/figure changes — deliberately minimal

**`CoupledCoilsSim.tsx`:** ONE sentence appended to the existing "Fixed parameter note" paragraph (lines 360–366): "M here is k × √(L₁L₂) — the coupling definition rearranged; the Theory tab's 'What is mutual inductance?' shows where M itself comes from (flux linkage per ampere)." Nothing else: no slider, readout, or physics changes (see NON-goals — the circularity is cured in theory, §1). No new figures: the existing three FigureImages already carry the section; the flyback reveal card is text-only by design (an ignition-coil image hunt is optional polish, NOT in scope).

**e2e impact (verified against `e2e/sim-paint.spec.ts`):** the generic `unlockGates` walker answers any "Predict First" box by clicking the first enabled option then Continue — the new flyback gate (Theory tab, no canvas inside) is handled automatically; `EXPECT_CANVAS` still satisfied by the Simulations-tab sim. No e2e edits needed.

---

## 8. Implementation map

| File | Action |
|---|---|
| `src/transmission/components/modules/Transformers.tsx` | EDIT: §3A/§3B/§3C/§3D theory blocks, CC-M1, flyback gate + lifted `flybackUnlocked`, §4 YourTurn, §6 CHALLENGE instruction, §5 imports/intro, §5.6 attribute-escape ride-along — single commit (TDD: page test first) |
| `src/transmission/components/simulations/CoupledCoilsSim.tsx` | EDIT: one caption sentence (§7), same commit |
| `src/transmission/components/modules/__tests__/transformers.test.tsx` | **NEW** page test (§9) |
| `src/transmission/components/modules/__tests__/pages.test.tsx` | UNCHANGED (smoke asserts only the h1 — verified) |
| `src/shared/constants/curriculum.ts`, `sectionRegistry.tsx`, count tests, `getSectionNumber.test.ts`, `routeIntegrity` | **ZERO changes** (extend-not-add ruling, §2) |
| `src/transmission/utils/transmissionMath.ts` (+ its test) | **ZERO changes** — all new numbers are static prose verified in this doc; no sim computes them (2A's "physics via utils" rule binds *sims*, and the sim is untouched) |

**Components reused:** `MathWrapper` (all equations), `ConceptCheck` (CC-M1), `PredictionGate` (flyback, blocking default), `YourTurnPanel` (§4), `CollapsibleSection variant="inline"` (§3B bound proof), existing inline worked-example card pattern (`border-l-2 border-engineering-blue-*` steps — **not** `WorkedSteps`: it still lives in `src/circuits/components/common/` (verified), and `transmission` must never import `circuits`; do NOT take a dependency on 2A's §11 hoist — if the hoist has landed by implementation time, switching the §3A example to shared `WorkedSteps` is an optional 5-minute upgrade, not a requirement).

**Estimated test additions:** 1 new file, ~8 `it()` blocks (~20 assertions, §9 lists 8) — suite grows from its current count by ~8 tests, 0 skips.

## 9. Test plan — NEW `transformers.test.tsx`

Clone the verified `pages.test.tsx` boilerplate (katex mock returning the raw latex string, canvas `getContext` mock, rAF shim, `MemoryRouter` helper). Assertions:

1. **h1 + derived number:** heading `/Transformers & Coupled Coils/i` renders with sibling span text `3.4` (pins `getSectionNumber` wiring, not a hardcoded literal in prose).
2. **Definition block present (default Theory tab):** `/What is mutual inductance/i` heading; the katex-mocked text contains `M = \frac{N_2\,\Phi_{21}}{i_1}` (raw-latex assertion works under the mock — match a stable substring like `N_2\,\Phi_{21}`).
3. **CC-M1 renders** with question `/ramps steadily from 0 to 2 A in 4 ms/i`; clicking the "25 V" option marks correct (explanation text `/500 A\/s/` appears).
4. **Flyback gate blocks:** question `/snap a mechanical switch open/i` visible; reveal kicker `/FLYBACK SPIKE/i` **absent**; **no `/skip/i` control** rendered (pins blocking default).
5. **Gate passes & reveals:** choose "≈10 000 V" + Continue → `/FLYBACK SPIKE/i` and `/ignition coil/i` present.
6. **Unlock survives tab remount (lifted state):** after step 5, click the Simulations tab, then Theory tab → `/FLYBACK SPIKE/i` still present without re-answering.
7. **Practice tab:** click Practice → new YourTurn scenario `/sealed module/i` present AND the pre-existing reflected-impedance YourTurn `/Z_reflected/i` still present (regression pin on ordering edit).
8. **Sim gate regression:** Simulations tab still shows the existing k/N₂ gate question (`/double N₂ while keeping/i`) — pins that adding a second gate didn't disturb the first, AND pins the §5.6 ride-along (today this regex would NOT match: the attribute's escape sequences render literally, so the subscript ₂ never reaches the DOM until §5.6 lands).

(`progressStore` interactions are already covered by `progressStore.test.ts`; do not duplicate.)

## 10. Explicit NON-goals (scope fence)

- **No new course section** — no curriculum/registry/numbering churn (§2).
- **No CoupledCoilsSim physics rebuild**: no L ∝ N² consistency fix, no geometry-derived M readout, no new sliders/readouts. Caption sentence only. (A consistent-geometry sim is a Phase-3-class rewrite; the roadmap asked for *definitions*, not a new instrument.)
- **No Neumann-formula reciprocity proof** — reciprocity is stated with an honesty note (§3A).
- **No phasor/AC mutual coupling** (jωM impedance form, coupled mesh equations in the s- or ω-domain) — that machinery belongs with unit **2B two-ports**; this unit stays DC-ramp/interrupt per ILO 5's wording.
- **No T-equivalent / decoupled equivalent circuits**, no leakage/magnetizing-inductance transformer model.
- **No energy-in-coupled-coils treatment beyond the 3-line bound proof** (§3B) — the full w(i₁,i₂) story is Nilsson Ch. 6 depth, not the gap.
- **No edits to `faraday`/`lenz`/`lorentz`/`ampere`** — motional EMF and forces are roadmap **2C proper** (the other unit under this confused label); do not let the two bleed together in one PR.
- **No `transmissionMath.ts` additions** and **no WorkedSteps hoist dependency** (§8).
- **No new figures/images** — text-only flyback card.

## 11. Verification gates (implementer MUST run, in order)

1. `npx tsc -b` clean and `npx vite build` clean.
2. `npx eslint .` — 0 errors (jsx-a11y hard-enforced; the new gate/CC/collapsible are all existing accessible primitives, so no new surface).
3. **Full suite: `npm test -- --no-file-parallelism`** (binding on the owner's 4-core box — default forks OOM). Expect: all existing tests green *unchanged* (this unit edits no existing test), plus the new `transformers.test.tsx` green, 0 skips.
4. **Number audit by a second pair of eyes (per-batch entry gate):** independently re-derive 125.7 μH / 628.3 μH / 25.13 μH / k = 1 / 62.8 mV / 25 V / 25 mV / 0.1 V / 10 kV / 400× / 150 μH / 5.00 mH against §3–§6 before review approval.
5. **e2e paint net:** `sim-paint.spec.ts` for route `transformers` still green (the generic gate-walker must clear the new Theory-tab gate; if it loops, the gate markup diverged from the `div.border-dashed` + "Predict First" contract — fix the page, not the spec).
6. **Playwright screenshot harness** (PR #9 harness, the Phase-2 entry gate): re-shoot `/transformers` at both viewports; owner visual walk checks — dark mode on the two new boxed equation blocks + amber flyback card; the §3B collapsible opens/closes by keyboard; flyback gate keyboard-only pass; mobile stacking of the coupled-equations pair.
7. Ship via branch + PR (GitHub REST API; classifier blocks direct-main pushes). **Sequencing:** branch from `main` AFTER the in-flight `wave0/debt-and-tabs` branch merges — it touches `Transformers.tsx` (the Tabs-unification import swap, verified 3-line diff vs origin/main) and would collide. No interaction with 2A (different Part, different files) — either may land first.
