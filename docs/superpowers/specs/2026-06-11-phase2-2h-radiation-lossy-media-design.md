# Unit 2H design — `radiation-lossy-media` · "Radiation Mechanism & Waves in Real Media" (extends 4.1 maxwell + 4.2 em-wave)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` unit 2H (ILO 1)
**Provenance:** recon of `src/em/sections/maxwell/index.tsx` (457 lines), `src/em/sections/em-wave/index.tsx` (1244 lines) + `chartData.ts`, `src/em/sections/__tests__/{sections.test.tsx,chart-builders.test.ts}`, `curriculum.ts` (23 sections on this branch, maxwell/em-wave `expectedChecks: 3`), shared primitives (PredictionGate `initialPassed/onPassed/allowSkip`, ConceptCheck + `toConceptCheck` adapter, YourTurnPanel, unified Tabs, CollapsibleSection, EquationBox, em Slider/ControlPanel/PlayControls/useAnimationFrame), and `e2e/sim-paint.spec.ts` (walks ALL_SECTIONS, unlocks gates, asserts every revealed canvas paints — maxwell + em-wave already in `EXPECT_CANVAS`). Every number in this doc is hand-derived below and double-checked by an independent second computation path where one exists.

## The ILO gap closed (roadmap, quoted verbatim)

> **2H — Radiation mechanism & real media (ILO 1)**
> "Accelerating charges radiate" is asserted, never taught. Build: a "why accelerating charges radiate" theory block + field-line-kink animation (oscillating charge, field lines detach into closed loops) in maxwell or antennas; a "waves in real media" subsection in em-wave (attenuation slider visibly damping the envelope; intrinsic impedance; conductor-vs-dielectric) + a two-media interface panel (normal-incidence reflection/transmission worked example — wave reflection currently only exists for lines). Effort: medium (one new animation).

ILO 1 scorecard line: *"EM radiation mechanisms & wave behavior in media — **partial**"*. Evidence in tree: the only radiation-mechanism content is the maxwell figure caption ("changing currents launch self-propagating electric-field loops — the radiation Maxwell's equations predict") and Antennas' radiation-resistance treatment, both of which *assume* radiation; em-wave's only medium physics is the lossless `v = c/n` dropdown — zero attenuation, zero intrinsic impedance, zero interface reflection (grep `intrinsic|377|attenuat` over `src/em`: no pedagogical hits).

## Placement ruling: EXTEND maxwell + em-wave, NO new section

The roadmap itself homes the two halves ("in maxwell or antennas"; "a subsection in em-wave"). Within that:

- **Radiation mechanism → `maxwell` (4.1), not Antennas.** Maxwell is the *shortest* Part-4 page (457 lines vs Antennas' 568) and the only place where the E↔B feedback machinery is on screen — the kink animation is the visual payoff of the 4-card overview the page already builds. Antennas (4.4) *engineers* radiation (R_rad, patterns, near/far field) and already opens by assuming it; teaching the mechanism there would be after three sections have already used it. Bonus adjacency: the existing `dipole-antenna-radiation.gif` FigureImage sits directly below the insertion point, so the asserted caption becomes the *second* look at a phenomenon just explained.
- **Real media → `em-wave` (4.2).** It already owns the medium dropdown (vacuum/water/glass), the propagation canvas the attenuation slider must damp, and the Poynting/energy framing the interface power-split needs.
- **New section rejected.** A "4.x Radiation & Real Media" section would (a) strand the mechanism away from the pages that assert it, (b) renumber polarization/antennas (4.3→4.4 etc.) while unit 2A is already inserting 5.3 — two concurrent renumberings in flight is avoidable churn, (c) contradict the roadmap's own "subsection" framing. Page-length pressure is handled instead by putting all new em-wave content in a **separate file** (`RealMedia.tsx`, composed by index) and all new maxwell sim code in `RadiatingChargeSim.tsx` — index diffs stay small.

**Zero curriculum renumbering.** The only `curriculum.ts` edit is two `expectedChecks` integers (§1). No SECTION_LIST/PARTS/registry/route changes; the screenshot harness route count (24 = landing + 23 sections on this branch — it derives from `ALL_SECTIONS`) is unchanged.

**Conventions (binding, house rules):** KaTeX in JSX *attribute* literals (`formula="…"`) uses **single backslash**; KaTeX inside TS *string* literals (EquationBox `math: '…'` entries, hints arrays) uses **double backslash** — both pages already follow this split, copy the neighbouring lines' style. New ConceptChecks use the page-local `QuizQuestion` + `toConceptCheck` adapter pattern (4 options, `correctIndex`, 3 tiered hints), NOT raw `ConceptCheckData` — consistency with every other check on these two pages. Blocking PredictionGate on every NEW interactive (entry-gate rule); post-PR-#7 the default is blocking, so write **no `allowSkip` prop**. Neither page uses Tabs, so no `initialPassed` lifting is needed — plain gates. All new physics arithmetic lives in exported pure functions (`radiationMath.ts`, `mediaMath.ts`), zero inline math in components (2A discipline). **Do NOT import WorkedSteps** — its hoist to shared is a 2A commit that may not have landed; this unit must not depend on any 2A artifact.

---

## 1. Wiring deltas

1. **`src/shared/constants/curriculum.ts`** — `expectedChecks` for `maxwell`: `3 → 4`; for `em-wave`: `3 → 5` (this unit adds 1 CC to maxwell, 2 CCs to em-wave). Update the `CourseSection.expectedChecks` doc comment ("authored with a fixed target (3)") to "(3–5)".
2. **`src/shared/constants/__tests__/curriculum.test.ts`** — the test at ~line 101 `'expectedChecks: EM fundamentals target 3, everything else 0'`: rename to `'expectedChecks: EM fundamentals carry per-section targets, everything else 0'`; change `expect(getExpectedChecks('maxwell')).toBe(3)` → `toBe(4)`; add `expect(getExpectedChecks('em-wave')).toBe(5);` (keep `gauss → 3`).
3. **Consequence flagged for owner:** a returning student whose persisted `conceptChecksCompleted` for maxwell/em-wave is 3 loses the "complete" badge until they do the new checks. This is *intended* (the new checks ARE the ILO-1 closure), and progress is per-browser localStorage. Fallback if owner objects: leave both at 3 (one-line revert; checks become bonus depth). **⚠ Cross-unit policy conflict the owner must settle ONE way (review finding):** the sibling 2d forces/motional-EMF design (and 2g plausibility, inheriting it) ruled the *opposite* for the identical situation — "keep 3, no curriculum edit: expectedChecks is a completion threshold, not a census; bumping retroactively un-completes persisted progress" — while 2f magnetic-circuits-by-hand bumps 3→4 like this unit. The PR body must cite both rulings so the owner picks a single course-wide policy; this unit's design works under either (bump = §1.1 as written; keep = the one-line fallback above).
4. Nothing else: sidebar/landing/nav/AiTutor all derive from curriculum; `routeIntegrity.test` untouched (no registry change); `e2e/sim-paint.spec.ts` auto-covers the new canvas (it walks every gate on every route and maxwell is in `EXPECT_CANVAS`).

---

## 2. Part A — maxwell: "Why accelerating charges radiate"

**Insertion point:** `src/em/sections/maxwell/index.tsx`, immediately after the `Q_DISPLACEMENT` ConceptCheck (line ~368) and before the `{/* ── Theory ── */}` div — so the flow reads: 4 cards → displacement-current check → *mechanism block* → figures (the dipole GIF lands right under the sim that explains it).

### 2.1 Theory block (white card, h3 **"Why accelerating charges radiate"**)

Prose spine (the Thomson/Purcell kink construction, ~5 short paragraphs):

1. *A charge at rest* wears its Coulomb field like spokes — radial lines, strength falling as `1/r^2` (JSX: `<MathWrapper formula="1/r^2" />`). Nothing leaves.
2. *A charge in uniform motion* carries those spokes along. No radiation either — hop into the charge's frame and it is just a charge at rest. Radiation cannot depend on who is watching.
3. *Accelerate the charge* and something irreversible happens: the field far away cannot know yet. News of the new position travels outward at `c`. Inside the sphere of radius `ct`, field lines point at the charge's **new** position; outside, they still point where the charge **would have been**. Field lines cannot break (Gauss's law: they end only on charge) — so a transverse **kink** stitches the two zones together.
4. That kink is a transverse E (and by Ampère–Maxwell a transverse B) propagating at `c`: **the kink IS the radiation**. Its field falls as `1/r` — not `1/r^2` — which is the whole secret of why it reaches the other side of the universe (CC-K below makes this quantitative).
5. *Oscillate the charge* and kinks launch every half-cycle, chain into the closed loops of the dipole animation below, and detach: a self-sustaining wave, Faraday and Ampère–Maxwell handing the energy back and forth — exactly the feedback loop the four cards above predicted.

Close with the bridge line: "Every antenna in Section 4.4 is a machine for accelerating charges on schedule." (Plain prose — em pages do not interpolate section numbers; keep the existing house phrasing "the Antennas section".)

### 2.2 PredictionGate (blocking, wraps the new sim)

```jsx
<PredictionGate
  question="Three charges: one sits at rest, one cruises at constant velocity, one oscillates back and forth. Which of them radiates electromagnetic energy away to large distances?"
  options={[
    { id: 'all', label: 'All three — every charge has a field' },
    { id: 'moving', label: 'The two moving ones' },
    { id: 'oscillating', label: 'Only the oscillating one' },
    { id: 'none', label: 'None — fields stay attached to their charge' },
  ]}
  getCorrectAnswer={() => 'oscillating'}
  explanation={<span>Radiation requires <em>acceleration</em>. A charge at rest has a static Coulomb field; a charge in uniform motion is "at rest" in its own frame, so it cannot radiate either. Only the oscillating charge accelerates — and the simulation shows exactly what its field lines do about it.</span>}
  onPredict={(correct) => markPredictionGate('maxwell', correct)}
>
  <RadiatingChargeSim />
</PredictionGate>
```

### 2.3 `RadiatingChargeSim` spec (`src/em/sections/maxwell/RadiatingChargeSim.tsx`, NEW — the unit's ONE new animation)

Canvas + `useAnimationFrame` (`@em/hooks/useAnimationFrame`), `useThemeStore` → `COLORS/COLORS_DARK`, em `ControlPanel`/`Slider`/`PlayControls`. Canvas `role="img" aria-label="Radiating charge field-line simulation showing kinks propagating outward"`; ctx null-guard (jsdom). Card layout clones the em-wave sim grid (canvas left 2/3, ControlPanel right 1/3, `min-h-[350px]`).

**State:** `mode: 'rest' | 'kick' | 'oscillate'` (default `'oscillate'`, three `aria-pressed` buttons in the canvas's top-left corner, same chip style as em-wave's view buttons); `freq` slider 0.5–3 step 0.1 default 1; `amp` slider 10–40 step 1 default 25 (px); `isPlaying` via PlayControls (Reset → `reset()` from the hook, which restarts the kick).

**Renderer — the retarded-position construction** (all in `radiationMath.ts`, §4): the charge oscillates along the vertical axis at canvas centre `(cx, cy)`. Each of 16 field lines (every 22.5°) is a polyline: the point at radius `r` along launch angle `θ` is

`P(r) = ( cx + r·cosθ , cy − y_q(t − r/c_sim) − r·sinθ )`  — radial spoke anchored to the charge's **retarded** position.

This is the standard first-order-in-v/c field-line visualization: where the charge has moved since the news left, the line acquires a transverse offset — the kink — and the kinks march outward at exactly `c_sim`. Constants: `c_sim = 2` px/frame (crosses a ~700 px canvas in ~6 s); oscillate angular rate `ω = freq · 2π·c_sim/150` rad/frame so the rendered wavelength is `λ_sim = 150/freq` px (300 px at slider min, 50 px at max — visibly compressing, mirroring the em-wave canvas behaviour). Sample `r` from 14 to `max(w,h)` step 4 px; stroke `c.E_FIELD`, width 2; charge = filled circle radius 8 at `(cx, cy − y_q(t))` with "+" glyph (copy `drawGaussE`'s charge dot).

**Mode behaviours** (`chargeY` in §4): `rest` → 0 forever (straight spokes — the control case); `kick` → smoothstep hop of `D = 40` px over `τ = 15` frames starting at `t = 0`, then still. Draw two faint guide circles at `r = c_sim·t` and `r = c_sim·(t − τ)` (clamped ≥ 0) labelled `news of the kick — speed c`, with caption text under the canvas: "inside the inner circle the field points at the NEW position; outside the outer it still points at the OLD one; the kink shell in between is the radiated pulse." `oscillate` → `amp·sin(ω·t)`; no guide circles (the kinks themselves are the show).

### 2.4 ConceptCheck CC-K (new `QuizQuestion` const `Q_KINK`, wired `onCheckComplete`/`onCheckHint` like the existing three)

- **question:** `'The static Coulomb field falls off as 1/r², while the radiation (kink) field falls off as 1/r. Why does only the radiation field carry energy all the way to infinity?'`
- options: `['Because 1/r fields travel faster than 1/r² fields', 'Energy flux ∝ E², so radiated power through a sphere ∝ (1/r)²·r² = constant, while the Coulomb term ∝ (1/r²)²·r² → 0', 'Because the Coulomb field is imaginary at large r', 'It does not — both fields carry equal energy outward']` — **correctIndex: 1**
- explanation: `'The Poynting flux scales as E². A sphere of radius r has area 4πr². Radiation: E ∝ 1/r ⇒ S ∝ 1/r² ⇒ P = S·4πr² = constant — the same total power crosses every sphere, however large. Coulomb: E ∝ 1/r² ⇒ S ∝ 1/r⁴ ⇒ P ∝ 1/r² → 0 — the static field stores energy locally but ships none of it away.'`
- hints (tiers): `'Compare how E² × (surface area of a sphere) behaves as r grows for each field.'` / `'Sphere area grows as r². Multiply: (1/r)²·r² vs (1/r²)²·r².'` / `'(1/r)²·r² = 1 (constant power escapes); (1/r²)²·r² = 1/r² → 0. Only the 1/r kink field survives — option B.'`

**Verification of the claim:** radiation `S ∝ E² ∝ r⁻²`, `P = S·4πr² ∝ r⁰` ✓ constant; Coulomb `S ∝ r⁻⁴`, `P ∝ r⁻⁴·r² = r⁻²` → 0 ✓.

### 2.5 CollapsibleSection "How much power? Larmor's scaling" (`variant="inline"`, closed — the entire quantitative cap, deliberately formula-statement only)

> Larmor's formula (stated, not derived): `P = \dfrac{q^2 a^2}{6\pi\varepsilon_0 c^3}` *(JSX attribute → single backslash)*. For an oscillating charge `x = x_0\sin\omega t` the acceleration amplitude is `a_0 = \omega^2 x_0`, and time-averaging `a^2` gives `\langle a^2\rangle = \tfrac{1}{2}\omega^4 x_0^2`, so **average radiated power scales as ω⁴** at fixed amplitude. Double the frequency → 2⁴ = **16×** the power. That fourth power is why the sky is blue: air molecules re-radiate the high-frequency (blue) end of sunlight far more strongly than the red end (Rayleigh scattering), and it is why antennas shrink as frequency rises — fast wiggles radiate ferociously.

**Verification:** `a = d²x/dt² = −ω²x₀ sin ωt` ⇒ `a² = ω⁴x₀² sin²ωt`, `⟨sin²⟩ = 1/2` ⇒ `⟨a²⟩ = ω⁴x₀²/2` ✓; `2⁴ = 16` ✓.

### 2.6 GuidedChallenge edit (maxwell `CHALLENGE`)

Insert ONE instruction between current #4 (remove-displacement-term thought experiment) and #5 (differential panel):
`'Answer the radiation Predict-First prompt, then press "Single kick": watch one transverse kink shell expand outward at c between the two guide circles, with straight Coulomb spokes inside and outside it. Switch to "Oscillate" and watch the kinks chain into the detaching closed loops — then compare with the dipole-antenna animation in the figure below: they are the same picture.'`

---

## 3. Part B — em-wave: "Waves in Real Media"

Two deliverables: (i) an attenuation slider damping the EXISTING gated canvas (no new gate — same additive-default-preserving pattern as 2A's Smith upgrade), and (ii) a new `RealMedia` block (theory + interface panel + 2 CCs + YourTurn) rendered after the existing `TheoryGuide`, before `GuidedChallenge`.

### 3.1 Attenuation slider on the existing sim (`src/em/sections/em-wave/index.tsx`)

- `EMWaveState` (in `@em/types`) gains `attenuation: number` (slider units, arb.), initial `0` → **today's render is pixel-identical at default**.
- New `Slider` in `ControlPanel`, only when `viewMode !== VIEW_VI`: label `"Attenuation α (arb.)"`, min 0, max 2, step 0.1, `color="bg-rose-600"`.
- Internal pixel attenuation `αpx = state.attenuation / 300` px⁻¹ (single named const `ATTEN_PX_SCALE = 1/300`). Damping check: at slider = 1, envelope after 700 px = `e^{−700/300} = e^{−2.333}`; `e^{−2.333} = 10^{−2.333/2.3026} = 10^{−1.0133} ≈ 0.097` → wave visibly dies to ~10%; at slider = 2 → `e^{−4.667} ≈ 0.0094` → gone. Visible across the whole control range ✓.
- Drawing changes (2D and 3D wave loops only; VIEW_VI/Phasor-Sync untouched): every `val = … Math.sin(ph)` for E and B becomes `val = … * Math.exp(-αpx * xOffsetPx) * Math.sin(ph)` where `xOffsetPx` is the pixel distance from `startX`. In the 2D **E panel only**, when `state.attenuation > 0`, overdraw the dashed envelope `±amplitude·e^{−αpx·x}` in `c.TEXT_MUTED`, lineWidth 1, `setLineDash([4,4])` (B panel stays clean — the damped wave is enough).
- `EquationBox` (wave branch): add one row `{ label: 'Lossy medium', math: 'E(x,t) = E_0 e^{-\\alpha x}\\sin(kx-\\omega t),\\quad \\alpha = ' + state.attenuation.toFixed(1) + '\\ \\text{(arb.)}', color: 'text-rose-600 dark:text-rose-400' }` *(TS string literal → double backslash, exactly like the neighbouring rows)*.
- Physics note rendered as small text under the medium dropdown: "n bends and slows the wave; α eats it. A real material can do both."

### 3.2 `RealMedia` block (`src/em/sections/em-wave/RealMedia.tsx`, NEW; props `{ onCheckComplete, onCheckHint, onGatePredict }` wired from index — keeps all progress wiring in one place)

White card, h3 **"Waves in Real Media"**, four subsections:

**(a) Intrinsic impedance — what the medium charges per field.**
In any travelling EM wave the E and H amplitudes are locked in a fixed ratio set by the medium alone: `\eta = \sqrt{\mu/\varepsilon}` — the **intrinsic impedance** (units: V/m ÷ A/m = Ω). Free space, hand-derived in the text:

```
η₀ = √(μ₀/ε₀) = √(1.2566×10⁻⁶ / 8.8542×10⁻¹²)
   = √(1.4193×10⁵) = 376.7 Ω  ≈ 120π ≈ 377 Ω
```

*Derivation audit:* `1.2566/8.8542 = 0.14193` ⇒ ratio `= 1.4193×10⁵`; `√1.4193 = 1.1913`, `√10⁵ = 316.23`, product `= 376.7` ✓ (canonical value 376.730 Ω; `120π = 376.99` is the legacy c=3×10⁸ approximation). For a non-magnetic dielectric `\eta = \eta_0/\sqrt{\varepsilon_r} = \eta_0/n`: glass (n = 1.5, ε_r = 2.25) → `376.73/1.5 = 251.2\ \Omega` — tying the dropdown the student has been using to a brand-new meaning. Forward bridge (one sentence): "Part 5 will hand you the circuit twin of this number: a cable's `Z_0 = \sqrt{L'/C'}` — same idea, volts-per-amp of a travelling wave, and the same reflection formula below."

**CC-A** (`Q_INTRINSIC`, QuizQuestion):
- question: `'In free space E₀/H₀ = 377 Ω for any travelling EM wave. What does this "impedance of free space" physically represent?'`
- options: `['A resistance of vacuum that converts wave energy into heat', 'The fixed ratio of E to H amplitudes in a travelling wave — no dissipation involved', 'The resistance an ohmmeter would read between two points in empty space', 'The input impedance of every antenna']` — **correctIndex: 1**
- explanation: `'η = √(μ/ε) is a wave impedance: it fixes the E/H ratio the medium permits a travelling wave to have, exactly as a transmission line\'s Z₀ fixes V/I. Nothing dissipates — vacuum is lossless; 377 Ω describes energy in transit, not energy converted to heat. (Antenna input impedance is a different, geometry-dependent quantity — the half-wave dipole\'s ~73 Ω from the Antennas section.)'`
- hints: `'Compare with a cable\'s characteristic impedance Z₀ = V/I for a travelling wave.'` / `'Does a wave crossing vacuum lose energy? Then what kind of "ohms" can 377 Ω be?'` / `'It is the ratio η = E/H enforced by μ₀ and ε₀ — a property of propagation, not dissipation. Option B.'`

**(b) Conductor or dielectric? One ratio decides.**
The **loss tangent** `\tan\delta = \dfrac{\sigma}{\omega\varepsilon}` compares conduction current to displacement current. `≫ 1`: conductor (the wave is mostly eaten); `≪ 1`: low-loss dielectric (the wave mostly propagates). The same material switches class with frequency.

Worked example card — **"Seawater swallows radio"** (σ = 4 S/m, ε_r = 81), plain numbered list (NOT WorkedSteps — see Conventions), every line hand-derived:

1. *Classify at f = 1 MHz:* `ωε = 2π·10⁶ · 81 · 8.854×10⁻¹² = 4.506×10⁻³` S/m, so `tan δ = 4 / 4.506×10⁻³ ≈ 888 ≫ 1` — seawater is a **good conductor** at 1 MHz.
   *(Audit: 81 × 8.854×10⁻¹² = 7.172×10⁻¹⁰; × 6.2832×10⁶ = 4.506×10⁻³ ✓; 4/4.506×10⁻³ = 887.7 ✓.)*
2. *Attenuation (good-conductor limit):* `\alpha = \sqrt{\pi f \mu_0 \sigma} = \sqrt{\pi·10^6 · 1.2566×10^{-6} · 4} = \sqrt{15.79} = 3.97` Np/m.
   *(Audit: π×10⁶ = 3.1416×10⁶; ×1.2566×10⁻⁶ = 3.9478; ×4 = 15.791; √ = 3.9738 ✓.)*
3. *Skin depth:* `\delta_s = 1/\alpha = 0.252` m — the field falls to 1/e in **25 cm** of seawater.
4. *In engineering units:* 1 Np = 8.686 dB, so `3.97 × 8.686 = 34.5` **dB per metre**. A 25 m-deep submarine sits `25/0.252 ≈ 99` skin depths down → ~**863 dB** of path loss. No transmitter on Earth covers that.
   *(Audit: 20·log₁₀e = 20×0.43429 = 8.6859 ✓; 3.9738×8.6859 = 34.51 ✓; 25/0.25165 = 99.3; 99.3 Np × 8.686 = 863 dB ✓.)*
5. *The fix is frequency:* `\delta_s \propto 1/\sqrt{f}`. Drop to 10 kHz (f ÷ 100 → δ_s × 10): `δ_s = 2.52` m, so 10 m of depth costs `10/2.52 = 3.97` Np = **34.5 dB** — the same loss one metre cost at 1 MHz, now survivable with a megawatt shore station. That is why submarine broadcast lives at VLF.
   *(Audit: √(π·10⁴·1.2566×10⁻⁶·4) = √0.15791 = 0.39738 Np/m ⇒ δ = 2.5165 m ✓; the "same 34.5 dB" identity is exact: α scales ×1/10, distance ×10.)*

"Does this make sense?" callout (2E plausibility style, riding along per roadmap): "Copper (σ = 5.8×10⁷ S/m) at 1 GHz: `δ_s = 1/\sqrt{\pi f \mu_0 \sigma} = 2.1\ \mu m`. RF current lives in the outer couple of microns of a conductor — which is why good coax only needs a whisper of plating, and why the braid can be hollow. *(Audit: π×10⁹·1.2566×10⁻⁶ = 3947.8; ×5.8×10⁷ = 2.2897×10¹¹; √ = 4.785×10⁵ Np/m; 1/α = 2.090×10⁻⁶ m ✓ — textbook value 2.1 μm.)*"

**YourTurnPanel** (after the worked example):
- scenario: `'Same seawater (σ = 4 S/m), but now an ELF-curious engineer proposes f = 10 kHz for a sensor floating just below the surface. You computed δ_s = 25 cm at 1 MHz.'`
- question: `'What is the skin depth at 10 kHz?'`
- options: `['≈ 2.5 m — δ_s ∝ 1/√f, and f fell by 100, so δ_s grows ×10', '≈ 25 m — δ_s ∝ 1/f, so ×100', '≈ 25 cm — skin depth does not depend on frequency', '≈ 79 cm — δ_s grows by √10']` — correct = option 0; explanations: (0) `'Correct: δ_s = 1/√(πfμσ); f ÷ 100 ⇒ δ_s × √100 = ×10 ⇒ 2.52 m.'`, (1) `'That is linear 1/f scaling — but f sits under a square root: ÷100 in f buys only ×10 in depth.'`, (2) `'f is inside δ_s = 1/√(πfμσ) — frequency is the ONLY lever a designer has here.'`, (3) `'×√10 would follow from f ÷ 10. Here f fell by a factor 100: √100 = 10.'`
- correctReveal: block math `\delta_s = \dfrac{1}{\sqrt{\pi f \mu_0 \sigma}} = \dfrac{1}{\sqrt{\pi \cdot 10^4 \cdot 1.2566\times10^{-6} \cdot 4}} = \dfrac{1}{0.397} = 2.52\ \text{m}` + kicker: "Ten metres down now costs 34.5 dB instead of 863 dB. Frequency is the dial that opens the ocean."
- hints: `['Write δ_s with f under the square root before scaling.']`

**CC-B** (`Q_LOSSTAN`, QuizQuestion):
- question: `'Which single dimensionless ratio decides whether a material behaves as a conductor or as a dielectric at a given frequency?'`
- options: `['σ/(ωε) — the loss tangent', 'μ/ε', 'E/H', 'The refractive index n']` — **correctIndex: 0**
- explanation: `'tan δ = σ/(ωε) compares conduction current (σE) to displacement current (ωεE). ≫1 ⇒ conductor, ≪1 ⇒ dielectric — and because ω sits in the denominator, the SAME material flips class with frequency: seawater is a solid conductor at 1 MHz (tan δ ≈ 888) but, on the ideal constant-σ model, drops to tan δ ≈ 0.009 at 100 GHz, dielectric territory (real water adds relaxation losses up there, but the classification logic stands).'`
  *(Audit: tan δ ∝ 1/f ⇒ 887.7 × 10⁶/10¹¹ = 8.877×10⁻³ ✓.)*
- hints: `'Compare the two current densities in Ampère–Maxwell: σE versus ωεE.'` / `'Their ratio is σ/(ωε). What happens to it as ω grows?'` / `'σ/(ωε) ≫ 1 conductor, ≪ 1 dielectric — option A.'`

**(c) The two-media interface — `MediaInterfacePanel` (local component inside RealMedia.tsx; SVG + readouts, no canvas, no rAF) behind a NEW blocking PredictionGate.**

Gate:
```jsx
<PredictionGate
  question="A radio wave in air hits a thick glass wall (ε_r = 2.25) head-on. What fraction of the incident POWER reflects back?"
  options={[
    { id: 'four', label: '4%' },
    { id: 'twenty', label: '20%' },
    { id: 'zero', label: '0% — glass is transparent' },
    { id: 'thirtythree', label: '33%' },
  ]}
  getCorrectAnswer={() => 'four'}
  explanation={<span>The impedance step does the reflecting: <MathWrapper formula="\Gamma = \frac{\eta_2-\eta_1}{\eta_2+\eta_1} = \frac{251-377}{251+377} = -0.20" />, and power goes as the square: <MathWrapper formula="|\Gamma|^2 = 0.04" /> — 4%. (20% is the <em>amplitude</em> ratio; transparent only means the other 96% gets through.)</span>}
  onPredict={onGatePredict}
>
  <MediaInterfacePanel />
</PredictionGate>
```

Theory above the gate (so the formula exists before the panel): at a normal-incidence boundary the wave obeys the SAME reflection law a transmission-line junction does:

`\Gamma = \dfrac{\eta_2 - \eta_1}{\eta_2 + \eta_1} \qquad \tau = \dfrac{2\eta_2}{\eta_1 + \eta_2} = 1 + \Gamma` *(boxed)*

with power split `|\Gamma|^2` reflected and `1 - |\Gamma|^2` transmitted. **Worked example, air → glass, every number hand-derived:**

```
η₁ = 376.73 Ω (air)        η₂ = 376.73/1.5 = 251.15 Ω (glass, n = 1.5)
Γ  = (251.15 − 376.73)/(251.15 + 376.73) = −125.58/627.88 = −0.200
τ  = 1 + Γ = 0.800
reflected power  = Γ² = 0.040  (4%)
transmitted power = 1 − Γ² = 0.960  (96%)
cross-check: τ²·(η₁/η₂) = 0.64 × 1.5 = 0.96 ✓  (power balances exactly)
independent check via n: Γ = (1−n)/(1+n) = −0.5/2.5 = −0.200 ✓
```

Two plausibility kickers: (i) the minus sign = the reflected E flips phase, exactly like a line hitting a LOWER Z₀ load; (ii) a window pane has two surfaces: `0.96² = 0.9216` → ~8% of light never makes it through — you have seen this number every time you noticed your reflection in a shop window.

**Panel spec:** Lab-card (`bg-white dark:bg-slate-800 rounded-xl shadow-md`):
1. **SVG diagram** (~140 px, `role="img"`, dynamic `aria-label` = `"Interface: Γ = {…}, {…}% reflected, {…}% transmitted"`): left half plain ("Medium 1 — air, η₁ = 376.7 Ω"), right half tinted slate ("Medium 2 — ε_r = {εr}, η₂ = {…} Ω"), vertical boundary line; three horizontal arrows with width-proportional labels: incident (→, length 100 px, solid, `#dc2626`), reflected (←, length `100·|Γ|` px, dashed), transmitted (→, length `100·τ` px, solid, into region 2). Arrow lengths are AMPLITUDE-proportional with a one-line caption saying so ("arrow lengths show field amplitude; the percentages below are power").
2. **em `Slider`:** `ε_r of medium 2`, min 1, max 81, step 0.05, default 2.25.
3. **Preset chips** (native buttons, `aria-pressed`): `Air (1)` / `Glass (2.25)` / `Seawater-RF (81)`.
4. **Readout grid** (4 stat chips, mono): `η₂` → `251.2 Ω`; `Γ` → `−0.200`; `Reflected power` → `4.0%`; `Transmitted power` → `96.0%`. All via `mediaMath` exports; `toFixed(1)`/`toFixed(3)`.

Deterministic spot values for the presets (all hand-derived): ε_r = 1 → η₂ = 376.7, Γ = 0.000, 0.0% / 100.0% ("no step, no echo"); ε_r = 2.25 → −0.200, 4.0% / 96.0% (audited above); ε_r = 81 → `η₂ = 376.73/9 = 41.86 Ω`, `Γ = (41.86 − 376.73)/(41.86 + 376.73) = −334.87/418.59 = −0.800` *(independent check: (1−9)/(1+9) = −0.8 exact ✓)*, reflected `0.64` → **64.0%** / 36.0% — caption: "which is why radar pings bounce off the sea and fish-finders must live IN the water."

**(d) Closing bridge paragraph:** "Both halves of this section meet in Part 5: a transmission line is a wave in a really well-organized medium — `Z_0` plays η, the load plays medium 2, and Γ is the very same formula. When you get there, you will already know it."

### 3.3 GuidedChallenge edit (em-wave `CHALLENGE`)

Append ONE instruction: `'Back in the EM Wave 2D view, drag the new "Attenuation α (arb.)" slider from 0 to 1 and watch the dashed envelope eat the wave from left to right while the wavelength stays fixed; contrast with the Medium (n) dropdown, which slows and compresses the wave without shrinking it — loss and refraction are independent knobs a real material can turn at the same time.'`

---

## 4. Pure-math exports + hand-verified test vectors

### 4.1 `src/em/sections/maxwell/radiationMath.ts` (NEW; .ts → unicode JSDoc, no LaTeX)

```ts
export type ChargeMode = 'rest' | 'kick' | 'oscillate';
export interface ChargeParams { amp: number; omega: number; kickDist: number; kickTau: number }

/** Charge displacement along the oscillation axis at time t (frames).
 *  rest → 0; kick → smoothstep(0→kickDist over [0, kickTau]); oscillate → amp·sin(omega·t). */
export function chargeY(mode: ChargeMode, t: number, p: ChargeParams): number

/** A field-line point: radial spoke of length r at angle thetaRad, anchored to the
 *  charge's RETARDED position chargeY(mode, t − r/cSim, p). Returns {dx, dy} offsets
 *  from the charge's rest position (canvas applies dy with its own y-flip). */
export function fieldLinePoint(mode: ChargeMode, t: number, r: number,
  thetaRad: number, cSim: number, p: ChargeParams): { dx: number; dy: number }
```

Vectors (`src/em/sections/__tests__/radiationMath.test.ts`; P = `{amp: 30, omega: 2π, kickDist: 40, kickTau: 0.2}`, time unit chosen so the math is clean — the component just scales):
- `chargeY('rest', 123, P)` → 0
- `chargeY('oscillate', 0.25, P)` → 30 *(30·sin(π/2) = 30)*; `('oscillate', 0.5, P)` → ≈0 *(sin π)*
- `chargeY('kick', -1, P)` → 0; `('kick', 0.1, P)` → 20 *(smoothstep s(0.5) = 3·0.25 − 2·0.125 = 0.5 ⇒ 40·0.5)*; `('kick', 5, P)` → 40
- `fieldLinePoint('oscillate', 1, 100, 0, 100, P)` → `{dx: 100, dy: 0}` *(retarded t = 1 − 100/100 = 0; sin 0 = 0 — line is purely radial)*
- `fieldLinePoint('oscillate', 1, 75, 0, 100, P)` → `{dx: 75, dy: 30}` *(retarded t = 0.25 ⇒ chargeY = 30 — THE kink: transverse offset on an equatorial spoke)*
- `fieldLinePoint('oscillate', 1, 50, Math.PI/2, 100, P)` → `{dx: ≈0, dy: 50}` *(retarded t = 0.5 ⇒ chargeY ≈ 0; pole spoke ⇒ dy = r)*
- `fieldLinePoint('rest', anyT, r, θ, c, P)` → `{r·cosθ, r·sinθ}` for two (r, θ) pairs — straight spokes, the no-radiation control.

### 4.2 `src/em/sections/em-wave/mediaMath.ts` (NEW)

```ts
export const ETA0 = Math.sqrt(1.25663706e-6 / 8.8541878e-12); // 376.730 Ω

/** η = η₀·√(μr/εr); NaN for εr ≤ 0. */
export function intrinsicImpedance(epsR: number, muR?: number): number
/** tan δ = σ/(2πf·εr·ε₀); NaN for f ≤ 0. */
export function lossTangent(sigma: number, f: number, epsR: number): number
/** Good-conductor attenuation √(π f μ₀ μr σ) in Np/m; NaN for f ≤ 0 or σ ≤ 0. */
export function attenuationGoodConductor(f: number, sigma: number, muR?: number): number
/** Skin depth 1/attenuationGoodConductor — same guards. */
export function skinDepth(f: number, sigma: number, muR?: number): number
/** Np → dB: ×8.685889. */
export function nepersToDb(np: number): number
/** Normal-incidence Γ = (η₂−η₁)/(η₂+η₁). */
export function normalIncidenceGamma(eta1: number, eta2: number): number
/** τ = 2η₂/(η₁+η₂). */
export function normalIncidenceTau(eta1: number, eta2: number): number
/** Reflected power fraction Γ². */
export function reflectedPowerFraction(gamma: number): number
```

Vectors (`src/em/sections/__tests__/mediaMath.test.ts`; every value is the §3 hand derivation, repeated in a test comment):
- `ETA0` / `intrinsicImpedance(1)` → 376.730 ± 0.01 *(√(1.2566e−6/8.8542e−12) = √1.4193e5)*
- `intrinsicImpedance(2.25)` → 251.15 ± 0.01; `intrinsicImpedance(81)` → 41.859 ± 0.005 *(376.73/9)*; `intrinsicImpedance(-1)` → NaN
- `lossTangent(4, 1e6, 81)` → 887.7 ± 0.5 *(4 / 4.506e−3)*; `lossTangent(4, 1e11, 81)` → 8.88e−3 ± 1e−4
- `attenuationGoodConductor(1e6, 4)` → 3.9738 ± 0.001 *(√15.791)*; `(1e4, 4)` → 0.39738 ± 0.0005
- `skinDepth(1e6, 4)` → 0.25165 ± 0.0005; `skinDepth(1e4, 4)` → 2.5165 ± 0.005; `skinDepth(1e9, 5.8e7)` → 2.090e−6 ± 0.005e−6 *(copper)*; `skinDepth(0, 4)` → NaN
- `nepersToDb(3.9738)` → 34.51 ± 0.02; `nepersToDb(1)` → 8.6859 ± 0.001
- `normalIncidenceGamma(376.730, 251.153)` → −0.2000 ± 0.0005; `(376.730, 41.859)` → −0.8000 ± 0.0005; `(377, 377)` → 0
- `normalIncidenceTau(376.730, 251.153)` → 0.8000 ± 0.0005; identity `tau === 1 + gamma` ± 1e−12 for 3 (η₁, η₂) pairs
- **power-conservation property test:** for (η₁, η₂) ∈ {(377, 251.15), (377, 41.86), (251.15, 377)}: `gamma² + tau²·(eta1/eta2)` → 1 ± 1e−9 *(hand check at glass: 0.04 + 0.64·1.5 = 1.00 ✓; at seawater: 0.64 + (0.2)²·(377/41.86) = 0.64 + 0.04·9.005 = 0.640 + 0.360 = 1.000 ✓ — τ = 1 + Γ = 0.2 there)*

---

## 5. Per-file plan

| File | Action |
|---|---|
| `src/em/sections/maxwell/radiationMath.ts` | NEW pure helpers (§4.1) — commit 1 (TDD: tests first) |
| `src/em/sections/__tests__/radiationMath.test.ts` | NEW vectors (§4.1) — commit 1 |
| `src/em/sections/em-wave/mediaMath.ts` | NEW pure helpers (§4.2) — commit 1 |
| `src/em/sections/__tests__/mediaMath.test.ts` | NEW vectors incl. power-conservation property (§4.2) — commit 1 |
| `src/em/sections/maxwell/RadiatingChargeSim.tsx` | NEW canvas sim (§2.3) — commit 2 |
| `src/em/sections/maxwell/index.tsx` | Insert theory block + gate + sim + CC-K + Larmor collapsible + 1 challenge instruction (§2) — commit 2 |
| `src/em/sections/em-wave/RealMedia.tsx` | NEW block: η theory + CC-A, loss-tangent/seawater + YourTurn + CC-B, gated MediaInterfacePanel (§3.2) — commit 3 |
| `src/em/sections/em-wave/index.tsx` | attenuation state/slider/envelope/EquationBox row + render `<RealMedia …/>` + 1 challenge instruction (§3.1, §3.3) — commit 3 |
| `src/em/types/index.ts` | `EMWaveState` + `attenuation: number` — commit 3 |
| `src/shared/constants/curriculum.ts` | expectedChecks maxwell 4, em-wave 5 + comment (§1) — commit 4 |
| `src/shared/constants/__tests__/curriculum.test.ts` | maxwell 3→4, add em-wave 5, rename test (§1) — commit 4 |
| `src/em/sections/__tests__/sections.test.tsx` | Behavioral additions (test plan) **+ fix the 2 existing singular `getByText('Predict First')` assertions → `getAllByText(…).toHaveLength(2)` (§6 item 3)** — commits 2/3 alongside their pages |

## 6. Test plan

**Unit (vitest, TDD order):** the §4 vector files, with each hand derivation repeated in a `// comment` next to its `toBeCloseTo` (house style from `transmissionMath.test.ts` / `chart-builders.test.ts`).

**Page tests (extend `src/em/sections/__tests__/sections.test.tsx`, same katex-mock + MemoryRouter harness):**
1. Maxwell: renders `/why accelerating charges radiate/i`; new gate question `/which of them radiates/i` present; `screen.queryByRole('img', { name: /radiating charge/i })` **null** before the gate (pins blocking, no-Skip default); click option "Only the oscillating one" → Continue → canvas `role="img"` present; CC-K question text `/why does only the radiation field carry energy/i` rendered.
2. EM-wave: renders `/waves in real media/i` and `/intrinsic impedance/i`; interface gate question `/fraction of the incident power/i` present; ε_r slider absent pre-gate; answer `4%` + Continue → slider present and default readouts show `251.2 Ω`, `−0.200`, `4.0%`, `96.0%` (deterministic DOM, jsdom-safe — readouts are text, not canvas); `fireEvent.change` slider to 81 → `−0.800` / `64.0%`; attenuation slider label `/attenuation α/i` present inside the existing (separately unlocked) sim panel.
3. **Two existing gate tests MUST be updated** (review correction — the original claim "existing smoke tests untouched" was wrong): `sections.test.tsx` `'MaxwellSection gates the cards behind a Predict First prediction'` (~line 105) and `'EMWaveSection gates the sim behind a Predict First prediction'` (~line 112) both call `screen.getByText('Predict First')` — exact, **singular**. Each page gains a SECOND locked gate on first render, so `getByText` throws "Found multiple elements". Change both to `expect(screen.getAllByText('Predict First')).toHaveLength(2)` (which also pins the new gate's presence); their old-gate question-text assertions stay as-is. The pure render smoke tests (`'… renders'` → "Why This Matters") are genuinely untouched.

**Wiring tests:** curriculum.test edits of §1 (the ONLY count-bearing assertions touched; `routeIntegrity`/`app.test` carry no expectedChecks).

**e2e:** `e2e/sim-paint.spec.ts` requires no edit — it walks every gate on `/maxwell` and `/em-wave` and asserts all revealed canvases paint >2 colors; the new RadiatingChargeSim is automatically inside the net (this is the regression class fixed in `2fbce66`: a gate-revealed canvas must start its rAF loop on mount). Screenshot harness: route × viewport matrix unchanged (24 × 2 = 48 shots on this branch; this unit adds zero routes); the owner walk picks up the two changed pages.

**Suite invocation (owner's 4-core box):** `npm test -- --no-file-parallelism` (vitest OOMs at default forks), plus `tsc -b && vite build` and lint (jsx-a11y hard-enforced: mode buttons are native `<button aria-pressed>`, sliders are the existing lint-clean em `Slider`).

**Manual/visual (owner walk via the harness):** kinks visibly propagate outward and compress as Frequency rises; "Single kick" shows ONE shell between the two guide circles; Rest mode = straight spokes; attenuation slider at 0 is pixel-identical to today, at 1 the dashed envelope visibly kills the wave across the canvas; interface arrows resize with the slider; dark mode on the new SVG + canvas; keyboard: gate options, mode buttons, sliders all reachable/operable.

## 7. NON-goals (binding scope caps)

- **No new course section**, no SECTION_LIST/registry/route edits, no renumbering.
- **No oblique incidence** — no Snell, no Brewster, no Fresnel coefficients beyond normal incidence (a future polarization-section unit if ever).
- **No complex η / complex γ for general lossy media** — the good-conductor limit (`α = √(πfμσ)`) and loss tangent are the entire quantitative treatment; the full `γ = √(jωμ(σ+jωε))` machinery belongs to a line/EM cross-over unit, not here.
- **No standing-wave treatment for waves** (SWR stays a Part-5 concept; the interface panel shows amplitudes, not interference patterns).
- **No Larmor derivation** — statement + ω⁴ scaling only (§2.5).
- **No real-SI retrofit of the em-wave canvas** (arb. units stay; real units live in the worked examples — the broader retrofit is roadmap item 2E).
- **No antenna-page edits** (R_rad/patterns untouched; 2J's territory).
- **No dependence on 2A artifacts**: WorkedSteps is NOT imported (worked examples are plain numbered cards); no transmissionMath imports into em (cross-domain leak — forbidden invariant).
- **No new images/figures** (the existing dipole GIF is reused by adjacency).

## 8. Verification gates (implementer MUST run, in order)

1. Commit 1 red→green: `npm test -- --no-file-parallelism src/em/sections/__tests__/radiationMath.test.ts src/em/sections/__tests__/mediaMath.test.ts`
2. After each page commit: `npm test -- --no-file-parallelism` full suite (0 skips), `tsc -b && vite build`, `npm run lint` — all clean before the next commit.
3. `npx playwright test e2e/sim-paint.spec.ts` — maxwell + em-wave must pass the paint net with the new gate in the walk.
4. Screenshot harness run + owner visual walk of `/maxwell` and `/em-wave` (both viewports, light+dark) — the Phase-2 entry gate.
5. Grep gates: no `@/` imports; no `transmission`/`circuits` imports under `src/em`; no `allowSkip` on the two new gates; EquationBox additions use `\\` doubles, `formula="…"` attributes use singles.
6. Ship via branch + PR (GitHub REST API; classifier blocks direct-main pushes); note the §1.3 expectedChecks badge-revoke consequence in the PR body for owner sign-off.

## 9. Sequencing & collision notes

- **Touches no file any open PR touches** except `curriculum.ts`/`curriculum.test.ts` (two integers + one assertion) — trivially mergeable with 2A's SECTION_LIST insertion in either order.
- Sibling Phase-2 units in design (2B/2C/2D/2F) home in circuits/lorentz/ampere/faraday/transformers/magnetic-circuits — zero overlap with maxwell/em-wave **section files**. 2E's future plausibility-callout pass lists coulomb/gauss/ampere/faraday/magnetic-circuits — also disjoint; this unit pre-delivers an em-wave callout in the same style (§3.2b; em-wave is not on 2E's own list).
- **⚠ `curriculum.ts`/`curriculum.test.ts` ARE shared with siblings (review correction — not maxwell/em-wave-free):** the 2f magnetic-circuits-by-hand design edits `curriculum.ts` (magnetic-circuits `expectedChecks 3→4`) and renames the SAME line-101 test with *different* wording (`'EM sections carry authored targets, everything else 0'` vs this doc's §1.2 wording), and the 2b switched-circuits design bumps that file's two 23-counts to 24. All semantically compatible, but textual conflicts are real: whichever unit lands second must adopt the already-landed test-name wording and keep the union of assertions.
- Internal commit order (each leaves the tree green): math+tests → maxwell page+sim → em-wave page+RealMedia → curriculum wiring.
