# Unit 2G design — Plausibility Callouts · "Does this make sense?" framework (cross-cutting, NO new section)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` — roadmap unit **2E** (ILO 8)
**Label note (binding for the doc trail):** the Phase-2 *design batch* sequence labels this unit **2G** (after 2B switched-circuits / 2C mutual-inductance / 2D forces-motional-EMF). The roadmap's own "2G" is switched circuits — already designed as batch-2B. Everywhere below, "this unit" = roadmap **2E — Plausibility framework (ILO 8)**.
**Provenance:** read-recon of CircuitTheorems (1.4, 382 lines), the five em homes (`src/em/sections/{coulomb,gauss,ampere,faraday,magnetic-circuits}/index.tsx`) + lorentz, the em CC pipeline (`QuizQuestion` → `toConceptCheck`), `sections.test.tsx`, the lorentz Boris-integrator internals and faraday render-loop internals (for the SI mapping), the existing inline "Does this make sense?" markup (TransmissionLines.tsx L203–221 — the house pattern this unit canonizes), `PredictionGate` (blocking default `allowSkip = false` verified at L62), all four sibling design docs (2A/2B/2C/2D) for collision mapping. **Every number below is hand-derived in this doc; the four headline numbers are derived by two independent routes each.**

## Pedagogical goal + the exact ILO gap closed

Roadmap unit 2E, quoted in full:

> **2E — Plausibility framework (ILO 8) — cheap, cross-cutting**
> Plausibility checking is practiced incidentally but never *taught*, and the em domain has **zero** "does this make sense?" callouts. Build: (1) one short "How engineers sanity-check answers" block (units, limiting cases, order-of-magnitude) — natural home circuit-theorems or circuit-analysis; (2) a reusable callout pattern ported into coulomb/gauss/ampere/faraday/magnetic-circuits; (3) real SI units for the lorentz + faraday sims (currently "arb. units", which blocks magnitude judgment — ampere/magnetic-circuits already show real readouts); (4) a few "a classmate computed 500 V — what did they miss?" critique exercises. Effort: small per section, rides along with any other unit.

ILO 8 (scorecard: **partial**): *"Apply theory, evaluating plausibility of results."* The "apply theory" verb is everywhere; the "evaluating plausibility" verb is taught nowhere — it is exercised only incidentally (the 2 ad-hoc callouts in TransmissionLines, 1 in SDomainAnalysis, 1 in Antennas; zero in em, zero as an explicit method). Priority rationale: the roadmap sequencing note says 2E "rides along" with content units — but units 2B/2C/2D have now all shipped *their own* riders ("three 'Does this make sense?' audits" in 2B; 2D explicitly defers SI units here: *"No SI-unit retrofit of the lorentz/faraday sims ('arb. units' readouts) — that is roadmap 2E item 3, a separate rider; do not let it hitchhike here"*). The remaining 2E backbone — the named framework, the em callout port, the SI retrofit, the critique exercises — has no other vehicle. This unit is that vehicle.

**After this unit a student can:** (a) name and run the three-test sanity triad (units / limiting cases / magnitude-and-bounds) on any computed answer; (b) judge magnitudes in every Part-2/3 sim because every readout is in real SI units with anchor comparisons; (c) diagnose a *wrong* answer (three critique exercises where a "classmate" made the standard blunder — including one where the **sim itself** is the classmate).

## Placement ruling: EXTEND existing sections — no new section, zero curriculum edits

**Ruling: extend `circuit-theorems` (1.4) + six em-domain sections. No new section.** Evidence:

1. The roadmap itself prescribes it: "cheap, cross-cutting", "rides along", "natural home circuit-theorems or circuit-analysis", "ported into coulomb/gauss/ampere/faraday/magnetic-circuits". A "Plausibility" standalone section would teach a 10-minute method in a 40-minute slot and orphan it from the numbers it judges.
2. Anchor home = **circuit-theorems (1.4), not circuit-analysis (1.2/TimeDomain)**: TimeDomain is 591 lines, already the Part-1 heavyweight, *and* is unit-2B's seam file (collision). CircuitTheorems is 382 lines, collision-free across all sibling units, and is the page where bounds-reasoning is already latent: V_th/R_th *is* a bound (I ≤ I_sc), the max-power curve endpoints *are* limiting cases, and the existing "never superpose power" CC is already a critique exercise in spirit. The triad lands where its three examples are page-native.
3. Consequences: **zero edits** to `curriculum.ts`, `sectionRegistry.tsx`, count tests, or `getSectionNumber` expectations. No renumbering. Robust against 2B's insertion of section 1.5 (nothing here hardcodes a section number; the one cross-reference uses prose, not numbers).
4. **expectedChecks ruling — keep 3, no curriculum edit** (inherited verbatim from the 2D ruling, §"expectedChecks ruling"): faraday gains a **5th** ConceptCheck (its 4th, Q_MOTIONAL, lands with unit 2D, which this unit binds itself behind — §7.1) and magnetic-circuits a 4th, but `expectedChecks` is a completion *threshold*, not a census; bumping would retroactively un-complete persisted progress. Record in the PR description for owner overrule. **⚠ Reviewer-flagged collision: the (now-designed) 2F doc rules the OPPOSITE for magnetic-circuits — it bumps `expectedChecks 3 → 4` in curriculum.ts when it adds its own Q_SERIES_MMF CC. The two units' rulings cannot both stand as written if both land — see §7.3 (owner decision required).**

**Conventions (binding, inherited from 2A/2D):** formulas in JSX `formula="…"` attributes → **single backslash**; formulas in `.ts`/`.tsx` **string literals** (EquationBox `math:` rows, template literals) → **double backslash**. No hardcoded section numbers in prose. em sections must not import from `@circuits` (so `WorkedSteps` is unavailable there — and unneeded). New CCs in em use the `QuizQuestion` + `toConceptCheck` pipeline (single shared explanation + 3-tier hints); the circuits CC uses the direct `ConceptCheckData` shape (per-option explanations). No new PredictionGates (nothing newly interactive is added); no changes to any existing gate markup (e2e `sim-paint.spec.ts` walker contract preserved).

---

## 1. New shared primitive — `PlausibilityCallout` (item 2's "reusable pattern")

`src/shared/components/common/PlausibilityCallout.tsx` (NEW). It canonizes the exact existing house markup (verified at TransmissionLines.tsx L203–211 — engineering-blue tinted card, `border-l-4`, mono-feel uppercase kicker):

```tsx
interface PlausibilityCalloutProps {
  /** Kicker line. Default matches the existing inline instances exactly. */
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function PlausibilityCallout({ title = 'Does this make sense?', children, className }: PlausibilityCalloutProps) {
  return (
    <div className={cn(
      'bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4',
      className,
    )}>
      <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1">
        {title}
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
```

Byte-level intent: rendering `<PlausibilityCallout>` must be visually indistinguishable from the existing inline instances (the only deliberate divergence: inner `<p>` → `<div>` so callouts can hold `MathWrapper` + multiple paragraphs). Shared → importable by all three domains (invariant-safe).

**Migration of the 4 existing inline instances** (TransmissionLines ×2 at L203–221, SDomainAnalysis ×1 near L357, Antennas ×1 near L503–507) is **commit 7, optional**: verify markup parity per instance first; skip any that diverges. The TransmissionLines hunks (L203–221) do not overlap 2A's planned seam edits (L119–133, L285–300) — separable.

---

## 2. Item 1 — the anchor block: "The Sanity-Check Triad" in CircuitTheorems (1.4)

**Insertion point (verified):** after the `YourTurnPanel` (closes L366), before the "Everything here assumed resistors…" bridge paragraph (L368). New `<section id="sanity" className="scroll-mt-4 space-y-4">`. **TOC:** insert `{ id: 'sanity', label: 'The Sanity-Check Triad' }` into `tocEntries` between `'max-power'` and `'challenge'`. (Recon note for implementer: `CircuitTheorems.page.test.tsx` — confirm no TOC-length pin before editing; extend, don't rewrite.)

### 2.1 Opening (h2 "The Sanity-Check Triad")

> Every answer on this page came with a free, instant audit — you just ran it without naming it. When the partial voltages added to 12 V you checked a *bound*; when the max-power curve died at both ends you checked *limiting cases*. Engineers run three tests on every computed number, in about ten seconds, before trusting it. From here to the end of the course, this triad is part of the job.

### 2.2 The three test cards (white card, `sm:grid-cols-3`, mono uppercase kickers)

**Card 1 — UNITS.** "Does the formula even produce the right kind of quantity?"
Worked line: is the RC time constant `\tau = RC` or `R/C`? Check the units, not your memory: `\Omega \cdot \text{F} = \frac{\text{V}}{\text{A}} \cdot \frac{\text{A·s}}{\text{V}} = \text{s}` ✓, while `\Omega/\text{F}` gives `\text{V}^2/(\text{A}^2\text{s})` — a rate-like mongrel, not a time. One line, no algebra redone. *(Derivation check: F = C/V = A·s/V ✓; Ω·F = (V/A)(A·s/V) = s ✓.)*

**Card 2 — LIMITING CASES.** "Push one variable to 0 or ∞ — the answer must do something you can predict for free."
Worked line: voltage divider `V_{out} = V\frac{R_2}{R_1+R_2}`: `R_2 \to 0` (shorted output) → 0 ✓; `R_2 \to \infty` (open) → V ✓. Page-native: the Max-Power Bench curve hits zero at *both* ends — `R_L \to 0` kills the voltage, `R_L \to \infty` kills the current — so the peak had to live in between. If a formula survives its limits, it has earned some trust.

**Card 3 — MAGNITUDE & BOUNDS.** "Is the number the right *size* — and inside the hard ceilings?"
Worked line: a Thevenin port can never beat its own extremes: into **any** load, `i_L \le I_{sc} = V_{th}/R_{th}` and `v_L \le V_{oc} = V_{th}`. *(Proof for resistive loads: `i = V_{th}/(R_{th}+R_L) \le V_{th}/R_{th}`; `v = V_{th}R_L/(R_{th}+R_L) < V_{th}`.)* These bounds cost nothing and catch dropped resistors, sign slips, and series/parallel mix-ups before any re-derivation.

### 2.3 The triad applied to this page's own table (short white card)

> Run all three on the catalog row `R_L = 4\ \Omega`: units — `12\,\text{V}/6\,\Omega = 2\,\text{A}` ✓; bounds — 2 A ≤ I_sc = 6 A ✓ and v = 8 V ≤ 12 V ✓; limiting cases — the table brackets it monotonically (1 Ω → 4 A down to 10 Ω → 1 A) ✓. Ten seconds, three passes — *now* it goes in the report.
> *(All four numbers verified against the page's LOAD_TABLE: i = 12/(2+4) = 2 A; v = 2 × 4 = 8 V; 1 Ω row i = 12/3 = 4 A; 10 Ω row i = 12/12 = 1 A.)*

### 2.4 Critique exercise #1 — ConceptCheck (circuits direct-data shape, wired `onComplete`/`onHint` to SECTION_ID)

- **question:** `A classmate connects a 6 Ω load to this page's port (V_th = 12 V, R_th = 2 Ω) and reports i_L = 6 A. Which sanity test rejects the answer fastest?`
- ✅ `Bounds: 6 A is the port's short-circuit current 12/2 — the ceiling for ANY load. They dropped R_L; the real answer is 12/(2+6) = 1.5 A` — *Correct! i_L can only reach I_sc with a dead short across the port. Any nonzero load must draw less — you can smell the error without redoing any arithmetic.*
- ❌ `Units: the result should be in volts` — *A current in amps is dimensionally fine — the units test passes; it is the magnitude that is impossible.*
- ❌ `Limiting cases: at large R_L the current should approach V_th/R_th` — *Backwards — as R_L → ∞ the current → 0; V_th/R_th is the R_L → 0 limit. (And 6 Ω is at neither extreme.)*
- ❌ `No test fails — 6 A is plausible for a 12 V source` — *The hardest this port can ever push is I_sc = 6 A, into a dead short. With 6 Ω attached: 12/(2+6) = 1.5 A — the report quadruples it.*
- **hints:** `['What is the largest current this port can deliver into ANY load?', 'Compare the report against I_sc = V_th/R_th.']`
- *(Numbers verified: I_sc = 12/2 = 6 A; i_L = 12/8 = 1.5 A; v_L = 1.5 × 6 = 9 V ≤ 12 V ✓. Reviewer fix: 6 Ω is deliberately NOT called "the catalog's" — the page's catalog is R_L ∈ {1, 2, 4, 10} Ω (LOAD_TABLE + opening puzzle, verified); the classmate's 6 Ω is an off-catalog load, which is also why the 6 A ≡ I_sc coincidence is available.)*

### 2.5 Closing forward hook (plain paragraph, no section numbers)

> Part 2 turns fields into numbers — volts per metre, teslas, newtons on invisible charges — where intuition is weakest and the triad matters most. Watch for the blue **"Does this make sense?"** callouts beside every simulation from here on: they are this section riding along with you.

---

## 3. Item 3 — real SI units for the Lorentz sim (`src/em/sections/lorentz/`)

### 3.1 The mapping (derived, not asserted): the particle is an **ion**

The sim's dynamics (Boris integrator) give an on-screen orbit radius `r_px = m_sim·v_px/(q_sim·B_sim)` where `B_sim = bField/20` ∈ [−5, +5] and `v_px` is in px per second. **Declare:** 1 px = 1 mm; `q_sim` in elementary charges **e**; `m_sim` in unified atomic mass units **u**; `B_sim` in **mT**. The velocity conversion is then *forced* by consistency — require the on-screen radius in px to equal the physical radius in mm:

```
r_m = (m_sim·u)(v_px·V_UNIT) / ((q_sim·e)(B_sim·1e-3))  ≟  r_px·1e-3
⇒ V_UNIT = 1e-3 · (e/u) · 1e-3 = 1e-6 · 9.64853×10⁷ = 96.4853 m/s per (px/s)
```

with `e/u = 1.602176634e-19 / 1.66053907e-27 = 9.64853×10⁷ C/kg` *(cross-check: the Faraday constant 96 485.33 C/mol ÷ 10⁻³ kg/mol = 9.6485×10⁷ C/kg ✓ — two routes agree).* So **zero physics changes**: the mapping is a pure relabel, exact by construction, and the orbit you see in px IS the physical orbit in mm.

**Defaults sanity (two independent routes):** q = 1 e, m = 2 u (a deuteron), slider v = 50 → `v_px = 50·2.5 = 125 px/s` → v = 125 × 96.4853 = **12 060.7 m/s ≈ 12.1 km/s** (ion-beam / mass-spectrometer speed ✓), B = 50/20 = **2.5 mT** (Helmholtz-coil scale ✓).
- Route 1 (sim): r_px = 2·125/(1·2.5) = **100 px**.
- Route 2 (SI): r = mv/(qB) = (3.32107814×10⁻²⁷ × 1.20607×10⁴)/(1.602176634×10⁻¹⁹ × 2.5×10⁻³) = 4.00544×10⁻²³/4.00544×10⁻²² = **0.1000 m = 100 mm = 100 px** ✓ identical (reviewer fix: numerator is 4.00544×10⁻²³, exactly a tenth of the denominator — an earlier draft wrote 4.00546).
- Force: F = qvB = 1.602176634×10⁻¹⁹ × 12 060.7 × 2.5×10⁻³ = **4.831×10⁻¹⁸ N = 4.83 aN**. *(Second route via the display constant in §3.2: 1 × 12.0607 × 2.5 × 0.1602177 = 4.831 aN ✓.)*
- Acceleration: a = F/m = 4.831×10⁻¹⁸/3.32108×10⁻²⁷ = **1.455×10⁹ m/s² ≈ 1.5×10⁸ g**.
- Slow-motion factor: real 12 060.7 m/s rendered at 125 px/s = 0.125 m/s of screen space → 12 060.7/0.125 = **96 485× ≈ 10⁵× slow motion** (= V_UNIT/PX_TO_M, exactly).
- Gravity check (used in the callout): mg = 3.32108×10⁻²⁷ × 9.81 = 3.26×10⁻²⁶ N — **8 orders of magnitude below** the 4.83×10⁻¹⁸ N magnetic force; ignoring it is honest.

### 3.2 `src/em/sections/lorentz/unitMapping.ts` (NEW — exported, pure; follows the `coulomb/chartData.ts` per-section-pure-file house pattern)

```ts
export const E_CHARGE = 1.602176634e-19;      // C (exact, SI 2019)
export const ATOMIC_MASS_U = 1.66053907e-27;  // kg
export const PX_TO_M = 1e-3;                  // declared scale: 1 px = 1 mm
export const B_UNIT_T = 1e-3;                 // B slider unit (bField/20) = 1 mT
/** Derived from r_px ≡ r_mm consistency (see design doc §3.1): 96.4853 m/s per px/s. */
export const V_UNIT_M_PER_S = PX_TO_M * (E_CHARGE / ATOMIC_MASS_U) * B_UNIT_T;
export const SLIDER_V_TO_PX = 2.5;            // handleReset: vx = velocity·2.5

export function pxPerSecToKms(vPx: number): number          // vPx·V_UNIT/1000
export function sliderToSpeedKms(vSlider: number): number   // |vSlider|·2.5·V_UNIT/1000
/** ∞-guard mirrors the sim: qE = 0 or bMt = 0 → Infinity. */
export function cyclotronRadiusMm(mU: number, qE: number, bMt: number, vKms: number): number
export function forceAttoN(qE: number, vKms: number, bMt: number): number  // qE·vKms·bMt·0.1602177
```

*(Display-constant derivations: r_mm = 10.36427·(m_u·v_km/s)/(q_e·B_mT) since u·10³/(e·10⁻³) = 1.66053907×10⁻²⁴/1.602176634×10⁻²² = 1.0364269×10⁻² m (reviewer fix: = 1/(e/u) = 1/9.6485332×10⁷ — an earlier draft transposed the digits as 1.036489×10⁻²; sanity: 10.36427 × 9.648533 = 100.000, the default orbit, exactly). F_aN = q·v·B = (q_e e)(v·10³)(B·10⁻³)·10¹⁸ aN = q_e·v_km/s·B_mT·0.1602177 aN.)*

### 3.3 `index.tsx` edits (strings/readouts ONLY — Boris loop, drag handlers, gate all untouched)

1. **Sliders** (inside the gate, JSX template literals): `Charge q = ${charge} e` · `Mass m = ${mass} u` · `Launch speed = ${velocity >= 0 ? '+' : '−'}${sliderToSpeedKms(velocity).toFixed(1)} km/s` · `B-field = ${(bField / 20).toFixed(1)} mT`.
2. **Hover readout** (canvas, L339–343): `|v| = ${pxPerSecToKms(speed).toFixed(1)} km/s`, `|F| = ${forceAttoN(Math.abs(charge), pxPerSecToKms(speed), Beff).toFixed(1)} aN`, `r_c = ${…} mm` (∞ case unchanged). Widen the tooltip box `tw` 110 → 130 for the unit suffixes.
3. **Canvas legend** (below the existing L328 drag hint, second `fillText` line): `Scale: 1 px = 1 mm · ion (q in e, m in u) · ~100,000× slow motion`.
4. **EquationBox 'Computed r' row** (L462–464, template literal → DOUBLE backslash):
   `` `r = \\frac{${mass}\\,\\text{u} \\times ${sliderToSpeedKms(velocity).toFixed(1)}\\,\\text{km/s}}{${Math.abs(charge)}\\,e \\times ${Math.abs(bField / 20).toFixed(1)}\\,\\text{mT}} = ${cyclotronRadiusMm(mass, Math.abs(charge), Math.abs(bField / 20), sliderToSpeedKms(velocity)).toFixed(0)}\\ \\text{mm}` `` (zero-guard branch `'\\text{—}'` unchanged).
5. **CHALLENGE text** (unicode, no LaTeX): description gains "— now in real ion units (u, e, mT, km/s, mm)"; instruction 1 `'Velocity v' slider to a clear positive value (e.g. 50)` → `'Launch speed' slider to a clear positive value (the default ≈ +12 km/s)`; other instructions' slider names updated to match the new labels verbatim; physics content unchanged.
6. **PlausibilityCallout** (NEW, placed *after* `</PredictionGate>`, before the Q_CIRCULAR CC — ungated, jsdom-visible):
   > Hover the orbit at the default settings: `|F| ≈ 4.8 aN` — five billionths of a billionth of a newton. How can a force that feeble bend the beam into a tight 100 mm circle? Judge a force against the inertia it acts on: `a = F/m \approx \frac{4.8\times10^{-18}}{3.3\times10^{-27}} \approx 1.5\times10^{9}\ \text{m/s}^2` — about 150 million g. (And gravity on this ion is ~3×10⁻²⁶ N, eight orders below the magnetic force — which is why the sim honestly ignores it.)

*(Lorentz is not in the roadmap's five-section callout list; this single callout is the deliberate payoff of item 3 — the SI units exist precisely to enable this magnitude judgment. Flagged as the unit's one scope extension.)*

---

## 4. Item 3 — real SI units for the Faraday sim (`src/em/sections/faraday/`)

### 4.1 The mapping: a declared physical demo coil

Internals (verified): `liveB = sin(t)` (amplitude 1), `liveEmf = −N·rate·cos(t)` (|max| = N·rate), rate ∈ [0.1, 3.0]. **Declare:** B(t) = B₀ sin(ωt) with **B₀ = 50 mT** (demo electromagnet); loop radius **a = 5 cm** → A = πa² = **7.853982×10⁻³ m²**; **f = rate × 10 Hz** (range 1–30 Hz, signal-generator scale). Then the physical EMF is the internal value times one constant:

```
ℰ(t) = −N·B₀·A·ω·cos(ωt) = liveEmf · (B₀·A·2π·10)
EMF_SCALE = 0.05 × 7.853982e-3 × 62.831853 = 0.0246740 V = 24.674 mV per internal unit
```

**Three independent cross-checks:** (a) per-turn peak at f = 10 Hz: B₀Aω = 3.926991×10⁻⁴ × 62.8319 = 0.024674 V ✓; (b) maxed-out sim N = 10, rate = 3 (f = 30 Hz): internal peak 30 → 30 × 24.674 = **740.2 mV**; direct: 10 × 0.05 × 7.853982×10⁻³ × 2π×30 = 0.075π² = 0.740220 V ✓ (reviewer fix: last digit; earlier draft said 0.740222); (c) N = 10, rate = 1: internal peak 10 → **246.7 mV**, which equals the §4.4 critique exercise's correct answer 0.2467 V computed from scratch ✓. Internal `rate`/state/render-loop timing are untouched — labels and readouts only.

### 4.2 `src/em/sections/faraday/unitMapping.ts` (NEW — exported, pure)

```ts
export const B0_T = 0.05;                       // 50 mT peak field
export const LOOP_RADIUS_M = 0.05;              // 5 cm
export const LOOP_AREA_M2 = Math.PI * LOOP_RADIUS_M ** 2;  // 7.853982e-3
export const HZ_PER_RATE = 10;                  // slider rate 0.1–3.0 → f = 1–30 Hz
export const EMF_SCALE_V = B0_T * LOOP_AREA_M2 * 2 * Math.PI * HZ_PER_RATE;  // 0.0246740
export function rateToHz(rate: number): number
export function emfArbToMillivolts(emfArb: number): number  // sign-preserving
```

### 4.3 `index.tsx` edits

1. **Slider:** `label="Rate (ω)"` → `` label={`Frequency f = ${rateToHz(rate).toFixed(0)} Hz`} `` (min/max/step/state untouched). Canvas drag-bar label (L209): `Drag to set ω = ${rate.toFixed(1)}` → `Drag to set f = ${rateToHz(rate).toFixed(0)} Hz`.
2. **EquationBox rows** (template literals → DOUBLE backslash):
   - NEW row after 'General': `{ label: 'Model coil', math: 'a = 5\\ \\text{cm},\\ A = \\pi a^2 = 7.85\\times 10^{-3}\\ \\text{m}^2,\\ B_0 = 50\\ \\text{mT}' }`
   - 'Parameters': `` `N = ${loops},\\quad f = ${rateToHz(rate).toFixed(0)}\\ \\text{Hz}` ``
   - 'B(t)': `` `B = B_0\\sin(2\\pi f t) \\approx ${(liveB * 50).toFixed(1)}\\ \\text{mT}` ``
   - 'EMF(t)': `` `\\mathcal{E} \\approx ${emfArbToMillivolts(liveEmf).toFixed(1)}\\ \\text{mV}` `` — drops `(arb.)`; amber-bold condition `Math.abs(liveEmf) > 0.5` unchanged (now ≙ 12.3 mV).
3. **CHALLENGE text:** description `…read the results in arbitrary units.` → `…read the results on a real model coil: radius 5 cm, peak field 50 mT, frequency set by you from 1 to 30 Hz.`; instr 1 `(e.g. 0.5)` → `(e.g. f = 5 Hz)`; instr 2 `up to about 2.0` → `up to about 20 Hz`; hint `the Rate (ω) slider IS your "magnet speed"` → `the Frequency slider IS your "magnet speed"`. Slider name mentions updated to `Frequency f`.
4. **PlausibilityCallout** (after the EquationBox, before the Q_EMF_MAGNITUDE CC):
   > Max out the sim — N = 10 turns, f = 30 Hz, 50 mT through a 5 cm loop — and the peak EMF is still only ≈ 0.74 V. Volts are *hard* to make with palm-sized hardware. A grid generator gets to kilovolts by scaling every factor of `\mathcal{E} = N B A \omega` at once: hundreds of turns, B near 1 T, square metres of coil, a 3000 rpm rotor. *(Check: N = 100, B = 1 T, A = 1 m², ω = 314 rad/s → 31 kV — stator scale.)* When homework hands you hundreds of volts from a desk-toy coil, run the magnitude ladder before believing it.

### 4.4 Critique exercise #2 — `Q_MISSING_AREA` (em `QuizQuestion`, placed directly after the existing Q_EMF_MAGNITUDE CC, before Q_LENZ_SIGN; faraday's 5th CC once 2D's Q_MOTIONAL is in — §7.1 binding; expectedChecks stays 3)

- **question:** `A classmate models this sim's coil at N = 10, f = 10 Hz (B₀ = 50 mT, loop radius 5 cm) and reports a peak EMF of 31.4 V. The equation-box readout peaks near 247 mV. What did the classmate miss?`
- **options:** [`The loop area A — they computed N·B₀·ω, whose units (T/s) are not even volts`, `The number of turns N`, `A factor of 2π — they used f where ω belongs`, `Nothing — the sim readout must be wrong`] · **correctIndex: 0**
- **explanation:** `ℰ_peak = N·B₀·A·ω. Dropping A = πr² = 7.85×10⁻³ m² leaves N·B₀·ω = 10 × 0.05 × 62.8 = 31.4 — with units T/s, not volts: a weber needs the m² (Wb = T·m²). Restore the area: 31.4 × 7.85×10⁻³ = 0.247 V, matching the readout. The units test catches the slip without redoing any arithmetic.`
- **hints:** tier 1 `Check the units of their formula before checking any numbers.` · tier 2 `ℰ = −N dΦ/dt and Φ = B·A. Which ingredient of Φ never appears in 31.4 = 10 × 0.05 × 62.8?` · tier 3 `ℰ_peak = N·B₀·A·ω = 10 × 0.05 × (π × 0.05²) × (2π × 10) ≈ 0.247 V — option A.`
- *(Derivations: ω = 2π·10 = 62.832 rad/s; N·B₀·ω = 10 × 0.05 × 62.832 = 31.416; × A = 31.416 × 7.853982×10⁻³ = 0.246740 V ✓ = the sim's own 246.7 mV readout at N = 10, rate = 1 — three routes agree.)*

---

## 5. Item 2 — the callout port: coulomb / gauss / ampere / magnetic-circuits

All placed OUTSIDE PredictionGates (ungated, jsdom-visible). All numbers below are anchored in each sim's actual readouts and were verified against the section code.

### 5.1 `coulomb` — after `</PredictionGate>` (L570), before the Q_FIELD_LINES CC

> Set both charges to **+4 μC** one grid square (0.1 m) apart and read the arrow label: `F = k\frac{q_1 q_2}{r^2} \approx 14.4\ \text{N}` — the weight of a 1.5-litre water bottle, between two specks. Plausible? It is the *charge* that is generous: holding 4 μC on a centimetre sphere needs a surface field near `4\times10^{8}\ \text{V/m}` — a hundred times air's 3×10⁶ V/m breakdown. Real rubbed objects carry nanocoulombs. The formula is right; always ask whether the *inputs* are achievable before trusting the output.
> *(Derivations: F = 8.988×10⁹ × (4×10⁻⁶)²/0.01 = 8.988×10⁹ × 1.6×10⁻¹¹/10⁻² = 14.38 N ✓ — matches the sim's K_COULOMB readout; 14.38/9.81 = 1.47 kg ✓; surface field kq/r² = 8.988×10⁹ × 4×10⁻⁶/10⁻⁴ = 3.60×10⁸ V/m ✓; breakdown-limited charge on a 1 cm sphere: q = E_max r²/k = 3×10⁶ × 10⁻⁴/8.988×10⁹ ≈ 33 nC ✓.)*

### 5.2 `gauss` — after the EquationBox (L414)

> The Result line reports ≈ **5.6×10⁵ N·m²/C** of flux from just 5 μC. Three quick passes: **units** — N·m²/C = V·m, so flux is "volts times metres", not a field strength; **magnitude** — at r = 1 m this charge's own field is `E = kQ/r^2 \approx 45\ \text{kV/m}`, just 1.5 % of air's 3 MV/m breakdown, so the setup is buildable; **limiting case** — double r and E falls 4× exactly as the area grows 4×. That last one is the gate question you already answered: r-independence is the sanity test *built into* Gauss's law.
> *(Derivations: 5×10⁻⁶/8.854×10⁻¹² = 564 716.51 = 5.647×10⁵ ✓ — the sim's `toFixed(0)` output is therefore "564717" (reviewer fix: rounds UP; an earlier draft said 564716); E = 8.988×10⁹ × 5×10⁻⁶/1² = 44 940 V/m ✓; 44.9 kV/3 MV = 1.5 % ✓.)*

### 5.3 `ampere` — after the EquationBox (L416)

> Anchor the marker-tooltip numbers: 100 A — a welding current — at 1 cm gives `B = \frac{\mu_0 I}{2\pi r} = 2\ \text{mT}`: forty times Earth's ~50 μT, yet ~750× weaker than a 1.5 T MRI bore. A 10 A appliance cord at 5 cm makes ~40 μT — it *rivals Earth's field*, which is why a compass misbehaves near wiring. If a hand calculation around household wiring returns whole teslas, go hunting for the missing `2\pi r`.
> *(Derivations: B = 2×10⁻⁷·I/r: (100, 0.01 m) → 2×10⁻³ T ✓; 2 mT/50 μT = 40 ✓; 1.5 T/2 mT = 750 ✓; (10, 0.05 m) → 4×10⁻⁵ T = 40 μT ✓, inside Earth's 25–65 μT range ✓.)*

### 5.4 `magnetic-circuits` — REMOVED FROM SCOPE (orchestrator ruling 2026-06-11: unit 2F owns the saturation exhibit)

**Ruling — option (a) of the collision flag below:** this unit makes **NO magnetic-circuits edits** — no callout, no Q_SATURATION, no 5th CC. Unit 2F's §3A callout + worked examples teach the saturation lesson once, on the page that owns the by-hand method, and `expectedChecks` stays 3 everywhere (2F §5). This unit therefore covers SIX sections (coulomb, gauss, ampere, faraday, lorentz + the 1.4 critique triad). Everything below in this subsection is **ARCHIVED for a possible future depth pass — do not implement.**

#### ARCHIVED — original §5.4 design (superseded)

**Callout (spoiler-free teaser, placed immediately after the gated sim block):**
> Iron core, N = 200, I = 1 A, no gap — and the readout says **B = 4.000 T**. The arithmetic is flawless: `\Phi = \frac{NI}{\mathcal{R}} = \frac{200}{5\times10^{4}} = 4\ \text{mWb}` through 10 cm². So: is the *number* physical? Hold that question — the concept check further down settles it, and the answer is the most important sanity lesson in this Part.

**Critique exercise #3 — `Q_SATURATION` (em `QuizQuestion`, placed after the existing Q_TRANSFORMER CC — which already sits between the last EquationBox and the closing TheoryGuide (verified L415–426) — and before that TheoryGuide; the section's 4th CC if 2F has not landed, 5th if it has; expectedChecks stays 3 per §"Placement ruling" item 4, but see the 2F collision flagged there):**
- **question:** `Using the sim's iron toroid (l = 31.4 cm, A = 10 cm², μᵣ = 5000) with N = 200 turns and I = 1 A, a classmate computes B = 4.0 T — and the sim readout agrees exactly. A reviewing engineer rejects the result anyway. Why?`
- **options:** [`The arithmetic is wrong — B should be 0.4 T`, `Real iron saturates near 1.5–2 T, so the constant-μᵣ model has left its validity window — the physical core cannot carry 4 T`, `B can never exceed μ₀NI/l = 0.8 mT in any core`, `The tesla is the wrong unit for flux density`] · **correctIndex: 1**
- **explanation:** `Classmate and sim share the same LINEAR model: ℛ = l/(μ₀μᵣA) = 5.0×10⁴ A·t/Wb, Φ = NI/ℛ = 4 mWb, B = Φ/A = 4.0 T. The algebra is right; the model is not — real B–H curves flatten near 1.5–2 T and μᵣ collapses long before 4 T. (0.8 mT is the AIR-core field μ₀NI/l — a ceiling only when μᵣ = 1.) Plausibility checking includes checking the model's validity window, not just the arithmetic — agreeing with a simulation proves nothing if the simulation shares your assumption.`
- **hints:** tier 1 `The sim agrees with the hand calculation — so the issue is not arithmetic. What assumption do they share?` · tier 2 `Look at a real B–H curve for iron. Around what B does it stop being a straight line?` · tier 3 `Constant μᵣ = 5000 only holds below saturation (≈ 1.5–2 T). At a computed 4 T the real material would be deep in saturation with μᵣ collapsing toward 1 — the linear answer is fiction. Option B.`
- *(Derivations, all exact against the sim's own constants at L108–122: l = 2π×0.05 = 0.31416 m; μ₀μᵣA = 4π×10⁻⁷ × 5000 × 10⁻³ = 2π×10⁻⁶ → ℛ = π×0.1/(2π×10⁻⁶) = **5.0×10⁴ exactly**; Φ = 200/5×10⁴ = 4×10⁻³ Wb; B = 4×10⁻³/10⁻³ = **4.00 T** — `formatSI` renders "4.000 T" ✓. Air-core distractor: μ₀NI/l = 1.2566×10⁻⁶ × 200/0.31416 = 8.0×10⁻⁴ T = 0.8 mT ✓.)*

**Deliberate ruling:** the magnetic-circuits sim is **NOT modified** — no saturation model, no warning chip. The non-physical 4 T readout becomes the unit's strongest exhibit (the "classmate" is the sim); the callout text promises nothing about a fix.

**⚠ Reviewer correction — 2F is no longer "future":** `2026-06-11-phase2-2f-magnetic-circuits-by-hand-design.md` exists (same design batch, same date) and **independently claims this same exhibit**: its §3A callout opens "B = 4 T should bother you", its YourTurn references "The 4 T fantasy above", it adds its own 4th CC (`Q_SERIES_MMF`), bumps `expectedChecks 3 → 4` in curriculum.ts, adds a new PredictionGate, and rewrites the section's inline physics into a `solveToroid` module — i.e. heavy overlap on the very file and the very lesson this section targets. If both units land as designed, the saturation lesson is taught twice on one page (2G teaser + Q_SATURATION AND 2F §3A + worked examples), the section carries 5 CCs, and the expectedChecks rulings contradict. **Owner decision required before implementation** (options, no ruling made here: (a) drop this unit's §5.4 entirely and let 2F own the exhibit — this unit keeps coulomb/gauss/ampere/faraday/lorentz + the 1.4 triad; (b) keep §5.4 and have 2F's implementer dedupe its §3A against the landed Q_SATURATION; (c) merge order decides, second unit rebases content). Whichever lands second must reconcile the expectedChecks digit. **→ RESOLVED 2026-06-11 (orchestrator): option (a) — see the ruling at the top of §5.4; expectedChecks digit moot (keep-3 everywhere, 2F §5).**

---

## 6. Implementation map

| File | Action | Commit |
|---|---|---|
| `src/shared/components/common/PlausibilityCallout.tsx` | NEW (§1) | 1 (TDD) |
| `src/shared/components/common/__tests__/PlausibilityCallout.test.tsx` | NEW: default kicker text renders; children render (incl. element children); custom `title` overrides | 1 |
| `src/em/sections/lorentz/unitMapping.ts` | NEW pure module (§3.2) | 2 (TDD) |
| `src/em/sections/faraday/unitMapping.ts` | NEW pure module (§4.2) | 2 (TDD) |
| `src/em/sections/__tests__/unitMapping.test.ts` | NEW: all §8 vectors with hand derivations in comments | 2 |
| `src/em/sections/lorentz/index.tsx` | EDIT: §3.3 sliders/hover/legend/EquationBox row/CHALLENGE text + 1 callout | 3 |
| `src/em/sections/faraday/index.tsx` | EDIT: §4.3 slider/drag-bar/EquationBox rows/CHALLENGE text + 1 callout + Q_MISSING_AREA CC | 4 |
| `src/em/sections/coulomb/index.tsx` | EDIT: +1 callout (§5.1) | 5 |
| `src/em/sections/gauss/index.tsx` | EDIT: +1 callout (§5.2) | 5 |
| `src/em/sections/ampere/index.tsx` | EDIT: +1 callout (§5.3) | 5 |
| `src/em/sections/__tests__/sections.test.tsx` | EXTEND (§8) | 3–5 (alongside) |
| `src/circuits/components/modules/CircuitTheorems/index.tsx` | EDIT: triad section + TOC entry + critique CC (§2) | 6 |
| `src/circuits/components/__tests__/CircuitTheorems.page.test.tsx` | EXTEND (§8) | 6 |
| `TransmissionLines.tsx` ×2 / `SDomainAnalysis.tsx` ×1 / `Antennas.tsx` ×1 | OPTIONAL migrate inline callouts → component (markup-parity-verified per instance) | 7 (skippable) |

**Components reused:** `PlausibilityCallout` (new, ×6–10 call sites), `ConceptCheck` (×3 new — 1 circuits direct-data, 2 em via `QuizQuestion`/`toConceptCheck`), `MathWrapper`, `EquationBox` (rows edited, not the component), existing `Slider`/`HintBox` untouched apart from label strings. **Not used:** `PredictionGate` (no new interactives), `WorkedSteps` (em cannot import circuits; the triad needs no step-reveal), `Tabs`/`LabLayout`/`LabStation`/`GuidedChallenge`-new (existing CHALLENGE consts get text edits only), `YourTurnPanel` (em uses the CC pipeline — 2D ruling).

## 7. Sequencing & collision avoidance (binding)

1. **Land AFTER unit 2D (forces/motional EMF) merges, or rebase onto its branch.** 2D and this unit edit the same three files (`lorentz/index.tsx`, `ampere/index.tsx`, `faraday/index.tsx`) and the *same EquationBox array literals* in lorentz/faraday — parallel implementation guarantees textual conflicts. 2D explicitly hands this unit the SI retrofit (its NON-goals: "that is roadmap 2E item 3 … do not let it hitchhike here"). After 2D, my insertions are unambiguous: callouts/CCs anchor to *existing* landmarks (gate close, EquationBox, named CCs), not line numbers.
2. **No file overlap with 2B (switched circuits) or 2C (mutual inductance).** 2B's section-1.5 insertion renumbers Part 1 — harmless here (no hardcoded numbers; circuit-theorems keeps id-based wiring).
3. **2F (magnetic circuits by hand) is DESIGNED, not future** — its doc claims the same B = 4 T exhibit, edits the same `magnetic-circuits/index.tsx`, and bumps `expectedChecks` to 4 (contradicting this unit's keep-3 ruling). §5.4 carries the full collision statement; the magnetic-circuits half of this unit is **blocked on an owner ruling** (the other six sections are unaffected). The optional commit-7 migration touches `TransmissionLines.tsx` at L203–221 — disjoint from 2A's planned seams (L119–133, L285–300; both re-verified against the 2A doc).
4. Commit order as §6; each commit leaves the tree green. Ship via branch + PR (GitHub REST API; classifier blocks direct-main pushes).

## 8. Test plan (est. ≈ +20 assertions across 4 files. Reviewer-verified count pins: `CircuitTheorems.page.test.tsx` L25 pins `getAllByText('Predict First')).toHaveLength(3)` — a gate-count pin, UNAFFECTED because this unit adds no gates; no TOC-length pin exists in that file (verified); no other touched test file pins counts this unit changes — but note 2D's own plan flips the sections.test ampere gate assertion to `toHaveLength(2)`, which will already be in place since this unit lands after 2D)

**Unit (TDD, commits 1–2):**
- `PlausibilityCallout.test.tsx` (~3): default kicker `Does this make sense?` renders; children (text + `<em>` element) render; `title="Reality check"` replaces the default.
- `unitMapping.test.ts` (~12, every vector hand-derived above):
  - `V_UNIT_M_PER_S` ≈ 96.485 (±0.001) — pins the e/u derivation
  - `sliderToSpeedKms(50)` → 12.061 (±0.001); `sliderToSpeedKms(-50)` → 12.061 (abs); `pxPerSecToKms(125)` → 12.061
  - `cyclotronRadiusMm(2, 1, 2.5, 12.0607)` → 100.0 (±0.05) — the default-orbit oracle
  - **mapping-honesty invariant** (the load-bearing test): for tuples (m, q, B_sim, v_px) ∈ {(1,1,1,100), (2,1,2.5,125), (4,2,3.5,210)}: `cyclotronRadiusMm(m, q, B_sim, pxPerSecToKms(v_px))` ≈ `m·v_px/(q·B_sim)` (±0.05) — the screen-px radius IS the mm radius
  - `cyclotronRadiusMm(2, 0, 2.5, 12)` → Infinity; `(2, 1, 0, 12)` → Infinity; `forceAttoN(1, 12.0607, 2.5)` → 4.831 (±0.005); `forceAttoN(0, 12, 2.5)` → 0
  - `rateToHz(0.5)` → 5; `rateToHz(3)` → 30; `emfArbToMillivolts(1)` → 24.674 (±0.005); `(30)` → 740.22 (±0.1); `(-10)` → −246.74 (sign preserved); `EMF_SCALE_V` ≈ 0.024674
- **Page tests (`sections.test.tsx`, ~7):** extend the six existing smoke tests (coulomb/gauss/ampere/lorentz/faraday/magnetic-circuits) with `expect(screen.getAllByText('Does this make sense?').length).toBeGreaterThanOrEqual(1)` (callouts are ungated by design); faraday: critique question `/reports a peak EMF of 31\.4 V/` renders; magnetic-circuits: `/rejects the result anyway/` renders; lorentz + faraday SI readouts via the katex-mock raw-latex technique (2D precedent): function matcher for substrings `\text{ mm}` (lorentz 'Computed r' row) and `\text{ mV}` + `\text{ Hz}` (faraday rows). Slider-label assertions are deliberately NOT jsdom-tested (they live behind the gate) — covered by the owner walk.
- **Page tests (`CircuitTheorems.page.test.tsx`, ~3):** heading `/The Sanity-Check Triad/i` renders; TOC entry present; critique CC: question `/reports i_L = 6 A/` renders, clicking the bounds option reveals `/short-circuit current/i`.

## 9. NON-goals (scope fence)

- **No physics/dynamics changes to ANY canvas sim** — lorentz Boris loop, faraday render-loop timing, magnetic-circuits solver, coulomb/gauss/ampere field code all byte-identical except label/readout strings and the two legend lines. The SI mappings are pure relabels (proved exact in §3.1/§4.1).
- **No magnetic-circuits edits at all** — the 4 T saturation exhibit belongs to unit 2F (§5.4 ruling, RESOLVED: option (a)).
- **No SI retrofit of em-wave** (or polarization) — the roadmap names lorentz + faraday only; em-wave's "(arb.)" axes remain (future polish).
- **No new sections / curriculum.ts / sectionRegistry / renumbering**; **no expectedChecks bump** (2D ruling inherited); **no new PredictionGates** and zero edits to existing gate markup (e2e walker contract).
- **No triad duplication** into nodal-mesh/s-domain/etc. — one anchor home + the callouts as distributed practice; no central "CC bank" refactor.
- **No gamification surfacing** (predictionGate counters stay write-only — Track 2 owner decision pending); **no retint** (callout uses existing engineering-blue tokens only).
- 2D's content blocks (full Lorentz force, parallel wires, rod-on-rails) are NOT touched, referenced, or duplicated.

## 10. Verification gates (implementer MUST run, in order)

1. `npx tsc -b && npx vite build` — clean.
2. `npm test -- --no-file-parallelism` — full suite green (4-core box OOMs at default forks; house rule).
3. `npm run lint` — 0 errors (jsx-a11y hard-enforced; all additions are static markup + existing-pattern CCs — no new interactive surfaces).
4. `npx playwright test e2e/sim-paint.spec.ts` — gate-walker + `EXPECT_CANVAS` still green for all em routes (gate markup untouched; sims must still paint after the label edits).
5. Screenshot harness (PR #9): re-shoot `/circuit-theorems`, `/coulomb`, `/gauss`, `/ampere`, `/lorentz`, `/faraday` at both viewports (magnetic-circuits dropped from this unit — §5.4). Owner walk checklist: dark-mode rendering of every PlausibilityCallout; lorentz defaults read `q = 1 e / m = 2 u / +12.1 km/s / 2.5 mT` and hover shows `|v| ≈ 12.1 km/s · |F| ≈ 4.8 aN · r_c ≈ 100 mm`; faraday equation box shows `f = 10 Hz` / mV-scale EMF and the drag bar says Hz; canvas legend lines legible at mobile width; triad cards stack on mobile.
6. Reviewer numeric audit: independently re-derive the three headline numbers — **100 mm** (lorentz default orbit), **4.83 aN** (lorentz default force), **24.674 mV** (faraday EMF scale) — against §3.1 and §4.1 before approving.
