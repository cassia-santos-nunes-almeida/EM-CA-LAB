# Unit 2F design — Magnetic circuits by hand · extends `magnetic-circuits` (3.3)

**Date:** 2026-06-11 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` — **roadmap unit 2F** (ILO 7)
**Provenance:** recon of `src/em/sections/magnetic-circuits/index.tsx` (463 lines: 1 gated canvas toroid sim, 3 inline `QuizQuestion` ConceptChecks, `EquationBox`/`TheoryGuide` theory, Part-1 bridge box, 6-step GuidedChallenge), the sim's exact physics block (lines 107–126) and `formatSI` readout formatter (lines 128–133), shared primitives (`PredictionGate` — blocking default verified, `ConceptCheck`, `YourTurnPanel`, `GuidedChallenge`), `e2e/sim-paint.spec.ts` (gate-walker + `EXPECT_CANVAS` includes `magnetic-circuits`), curriculum spine + tests. House style matched to the approved 2A design (`2026-06-10-phase-2a-line-impedance-design.md`) and coordinated with the sibling 2026-06-11 unit docs (same extend-not-add ruling pattern, same no-WorkedSteps-hoist ruling). **Every number below hand-derived in this doc, most twice (symbolic exact form + decimal route), and every sim-checkable number cross-checked against the sim's own formulas line-by-line.**

> **Label check (traceability):** the work order's "2F (magnetic-circuits-by-hand)" **is** the roadmap's 2F — no label mismatch (unlike the 2C/2D mix-up the mutual-inductance doc had to flag).

---

## 1. Pedagogical goal & the exact ILO gap closed

**Goal:** make the student able to *formulate and solve* a magnetic-circuit problem with a pencil — compute ℛ, Φ, B, H, L from geometry and material; verify the sim's readouts digit-for-digit; run the problem *backwards* (design N for a target B); and extend the method to a circuit the sim cannot show (two materials in series). Today the section *states* Hopkinson's law and then delegates every actual solve to the canvas readouts.

**Roadmap quote (unit 2F, verbatim):**

> The "solve" verb is delegated entirely to the sim. Build: a pencil-and-paper worked example matching the sim's own toroid (compute ℛ, Φ, B, H; repeat with the 1 mm gap) so students can hand-verify the readouts; an inverse design YourTurn ("what I or N gives B = 1 T?"); a two-material series magnetic circuit (Ida's standard next step). ~~Fix the TheoryGuide line calling H "analogous to voltage (EMF)" — MMF is the EMF analog~~ *(fixed in the quick-wins batch)*. Effort: small-medium.

**ILO scorecard row closed:** `| 7 | Formulate & solve magnetic-circuit equations | **partial** |` — the qualitative half (analogies, gap intuition) is solid; this unit supplies the missing *solve* half. **Priority rationale (roadmap sequencing §, verbatim):** step 4 — "**2F magnetic circuits by hand** + **2G switched circuits** (small, finish ILOs 7/11/12)". Roadmap 2E (plausibility) explicitly "rides along with any other unit" — this unit carries two 2E callouts (§3A, §3D), including the em domain's first "does this make sense?" magnitude check, on the sim's own un-physical 4 T default.

**Verified already done (no action):** the H-vs-EMF TheoryGuide fix is in the tree (index.tsx lines 399–402 now read "the EMF analog is the MMF (NI) itself, not H").

---

## 2. Decision: extend `magnetic-circuits` (3.3) — NO new section

**Ruling: extend.** Evidence:

1. The roadmap names the home implicitly and the scale explicitly: "matching **the sim's own toroid**" — the content is *about* this page's instrument — and effort class "small-medium". Additions ≈ two worked examples + one gate + one YourTurn + one CC + one challenge step: ~40% growth of a 463-line page, nowhere near a section.
2. The narrative seam is exact: the Flux-&-Reluctance theory block (EquationBox + Q_AIR_GAP + TheoryGuide) ends at line 412, and the Mutual-Inductance block begins at line 415. "Solve it by hand" slots into that seam as the payoff of the theory the student just read, using the toroid still on screen above it.
3. Zero wiring cost: **no `sectionRegistry.tsx` edit, no renumbering, no `getSectionNumber.test.ts` churn, no 23-count churn** (`magnetic-circuits` stays 3.3). **Curriculum footprint: ZERO** — `expectedChecks` stays 3 (orchestrator ruling, see §5: raising it would retroactively un-complete existing students' badges, and the batch precedent — faraday keeps 3 while 2D adds its 5th CC — is keep-3 everywhere; the new Q_SERIES_MMF is additive depth, not a higher completion bar).
4. Contrast with 2A's new-section ruling: 2A was a full absent chapter with a new sim and bench. Here the sim exists, the theory exists — only the hand-method is missing.

**Conventions (binding, same as 2A/2C):**
- `MathWrapper formula="…"` JSX **attribute literals → single backslash exactly as written below**.
- `EquationBox` `math:` entries and any other **quoted JS string literals inside the .tsx → double backslash** (existing file pattern, verified lines 382–385). *(This unit adds no EquationBox rows, so in practice everything below is single-backslash JSX-attribute form.)*
- Plain-string props (`PredictionGate question`/`options`, `QuizQuestion` fields, `YourTurnPanel scenario/question/options`, `CHALLENGE` strings) → **unicode** (ℛ, μ₀, μᵣ, Φ, A·t, ×, ⁻⁷), never LaTeX — the file's verified pattern (Q_RELUCTANCE uses `ℛ = l/(μA)`).
- New PredictionGate: **write no `allowSkip` prop** — blocking is the default (verified `PredictionGate.tsx` line 62, post-#7 tree).
- No hardcoded "3.3" anywhere — `SectionLayout` already derives the number.
- **Worked-step arithmetic display rule:** results carry full calculator precision between steps; any *displayed* dividend/divisor must have enough sig figs that re-entering the printed numbers reproduces the printed result to its last digit (the §3A Step 3 and §3B Step 5 fractions are written to satisfy this — do not re-round them when transcribing into JSX).
- This page is **linear (no Tabs)** → the new gate's unlock state needs **no lifting**; plain internal gate state is correct (the existing sim gate works the same way).

---

## 3. Content outline — the "Solve it by hand" block

**Insertion point:** `index.tsx`, inside the theory `<div className="space-y-6">`, **between** the closing `</TheoryGuide>` of the Flux-&-Reluctance subsection (line 412) **and** the `EquationBox title="Mutual Inductance"` (line 415). One `<h2>` (`Solve it by hand`, styled `text-xl font-bold text-slate-900 dark:text-white`) opens the block; sub-blocks §3A–§3D follow in order. Worked-example steps use **inline step cards** (`border-l-2 border-indigo-300 dark:border-indigo-700 pl-4` divs, bold title line + body), NOT `WorkedSteps` — same ruling as the sibling mutual-inductance unit: `WorkedSteps` still lives in `src/circuits/components/common/` (verified) and **em must never import circuits**. Do NOT take a dependency on 2A's §11 hoist; if the hoist has landed at implementation time, switching the two worked examples to shared `WorkedSteps` (with `tryFirstPrompt`) is an optional 5-minute upgrade, not a requirement.

### 3A. Worked Example 1 — "The sim's own toroid, on paper" (ungated; the sim gate above already ran)

**Lead-in (exposed-debt pattern):**
> Every number in the canvas above is four lines of arithmetic. Prove it. The sim's toroid is: mean radius `r = 5\,\text{cm}`, cross-section `A = 10\,\text{cm}^2 = 10^{-3}\,\text{m}^2`, iron core `\mu_r = 5000`, `N = 200` turns, `I = 1\,\text{A}`, no gap — exactly the Iron-preset defaults.

**Try-first nudge (italic, the WorkedSteps `tryFirstPrompt` analog):** *Grab a pencil: compute the path length and the reluctance yourself before reading Step 1.*

- **Step 1 — Path and reluctance.** The flux path is the mean circumference:
  `l = 2\pi r = 2\pi(0.05) = 0.3142\,\text{m}`
  `\mathcal{R} = \frac{l}{\mu_0 \mu_r A} = \frac{0.3142}{(4\pi\times10^{-7})(5000)(10^{-3})} = 5.00\times10^{4}\ \text{A·t/Wb}`
  *Doc audit (symbolic, exact):* the π cancels — ℛ = 2πr/(μ₀μᵣA) = 2(0.05)/(4×10⁻⁷ × 5000 × 10⁻³) = 0.1/(2×10⁻⁶) = **50 000 exactly**. *Decimal route:* μ₀μᵣA = 1.256637×10⁻⁶ × 5000 × 10⁻³ = 6.283185×10⁻⁶; 0.3141593/6.283185×10⁻⁶ = 5.0000×10⁴ ✓.
- **Step 2 — Drive and flux (Hopkinson).**
  `\text{MMF} = NI = 200 \times 1 = 200\ \text{A·t}`
  `\Phi = \frac{\text{MMF}}{\mathcal{R}} = \frac{200}{5.00\times10^{4}} = 4.00\,\text{mWb}`
- **Step 3 — Flux density and field strength.**
  `B = \frac{\Phi}{A} = \frac{4.00\times10^{-3}}{10^{-3}} = 4.00\,\text{T}` and `H = \frac{NI}{l} = \frac{200}{0.31416} = 636.6\,\text{A/m}` *(divisor at 5 sig figs — 200/0.3142 = 636.5 to displayed precision, off the canvas's 636.620)*
  *Cross-check (the two H routes must agree):* B = μ₀μᵣH = 6.283185×10⁻³ × 636.62 = 4.000 T ✓.
- **Step 4 — Inductance.**
  `L = \frac{N^2}{\mathcal{R}} = \frac{200^2}{5.00\times10^{4}} = 0.800\,\text{H}`
- **Step 5 — Verify against the instrument.** Set Iron, N = 200, I = 1.0 A, gap 0 % above and read the canvas: `H_core = 636.620 A/m`, `B = 4.000 T`, `Φ = 4.00 mWb`, `L = 800.00 mH` — your 0.800 H, milli-prefixed; same digits, SI prefix shifted. **Digit for digit.** *(Doc audit of the display strings against `formatSI`: 4.0 ≥ 1 → "4.000 T"; 4×10⁻³ ≥ 10⁻³ → ×10³, 2 dp → "4.00 mWb"; **0.8 < 1 and ≥ 10⁻³ → the milli branch, ×10³, 2 dp → "800.00 mH" — NOT "0.800 H"** (the content must print the canvas string, or pre-empt the prefix mismatch as worded above); 636.6198 → "636.620 A/m" ✓ all four.)*

**2E plausibility callout (house "Does this make sense?" card — the em domain's first):**
> **B = 4 T should bother you.** Real iron saturates at 1.5–2 T — beyond that, μᵣ collapses and the linear model above (and this sim, as its own footnote admits) is fiction. Your arithmetic is right; the *model* has left its validity range. An engineer's reflex: compute, then ask the material if it agrees. The design exercise below stays at a B real iron can actually carry.

### 3B. PredictionGate + Worked Example 2 — "Now cut the gap" (NEW gate, blocking, wraps the gapped example)

```jsx
<PredictionGate
  question="You cut a gap spanning just 1% of the flux path into the iron toroid (μᵣ = 5,000). Roughly what happens to the inductance L?"
  options={[
    { id: 'one', label: 'Drops about 1% — proportional to the iron removed' },
    { id: 'half', label: 'Drops roughly in half' },
    { id: 'fifty', label: 'Collapses about 50× — the 1% gap out-resists the 99% core' },
  ]}
  getCorrectAnswer={() => 'fifty'}
  onPredict={(correct) => markPredictionGate('magnetic-circuits', correct)}
  explanation={
    <span>
      Per metre, air is <MathWrapper formula="\mu_r = 5000" /> times more reluctant than this iron. A gap of 1% of the
      path therefore contributes <MathWrapper formula="0.01 \times 5000 = 50" /> times the reluctance of the entire
      core, and <MathWrapper formula="L = N^2/\mathcal{R}_{total}" /> collapses with it. The worked example below
      puts exact numbers on it.
    </span>
  }
>
  {/* Worked Example 2 step cards */}
</PredictionGate>
```

*Doc audit of the explanation's factor:* ℛ_gap/ℛ_core,full = [0.01·l/(μ₀A)] / [l/(μ₀·5000·A)] = 0.01 × 5000 = **50** exactly ✓. (The existing sim gate asked the *direction* of the change; this gate asks the *magnitude* — the quantitative sequel, no overlap.)

**Worked Example 2 (gated children) — gap = 1 % of the path.** Lead-in honesty note: the roadmap drafted this as "the 1 mm gap", but the sim's gap slider moves in whole percent (Slider default step 1, verified); **1 % = 3.14 mm is chosen so the student can set it and check the readouts** — the actual point of the exercise. A literal 1 mm appears as the one-liner at the end.

- **Step 1 — Split the path.**
  `l_{gap} = 0.01 \times 0.3142 = 3.14\,\text{mm}, \qquad l_{core} = 0.99 \times 0.3142 = 0.3110\,\text{m}`
- **Step 2 — Reluctance of the iron (barely changes).**
  `\mathcal{R}_{core} = \frac{0.3110}{(4\pi\times10^{-7})(5000)(10^{-3})} = 4.95\times10^{4}\ \text{A·t/Wb}`
  *Doc audit:* 0.99 × 50 000 = **49 500 exactly** ✓.
- **Step 3 — Reluctance of the gap (μᵣ = 1).**
  `\mathcal{R}_{gap} = \frac{l_{gap}}{\mu_0 A} = \frac{3.142\times10^{-3}}{(4\pi\times10^{-7})(10^{-3})} = 2.50\times10^{6}\ \text{A·t/Wb}`
  *Doc audit (symbolic, exact):* 0.01·2πr/(μ₀A) = π×10⁻³/(4π×10⁻¹⁰) = 10⁷/4 = **2 500 000 exactly** ✓. Three millimetres of air out-resists thirty-one centimetres of iron 50-to-1 (2.5×10⁶/4.95×10⁴ = 50.5).
- **Step 4 — Series total and everything downstream.**
  `\mathcal{R}_{total} = 4.95\times10^{4} + 2.50\times10^{6} = 2.5495\times10^{6}\ \text{A·t/Wb}`
  `\Phi = \frac{200}{2.5495\times10^{6}} = 78.45\,\mu\text{Wb} \quad\Rightarrow\quad B = \frac{\Phi}{A} = 78.45\,\text{mT}`
  `L = \frac{200^2}{2.5495\times10^{6}} = 15.69\,\text{mH}`
  *Doc audit:* Φ = 200/2 549 500 = 7.84468×10⁻⁵ Wb ✓; B = 7.84468×10⁻⁵/10⁻³ = 0.0784468 T ✓; L = 40 000/2 549 500 = 0.0156894 H ✓. **Drop factor = ℛ_total/ℛ_no-gap = 2 549 500/50 000 = 51.0** — the gate's "about 50×", now exact: 0.800 H → 15.69 mH.
- **Step 5 — Where did the MMF go? (the H audit)** B is continuous through the series path, but H is not:
  `H_{core} = \frac{B}{\mu_0\mu_r} = \frac{0.078447}{6.2832\times10^{-3}} = 12.49\,\text{A/m}, \qquad H_{gap} = \frac{B}{\mu_0} = \frac{0.078447}{1.25664\times10^{-6}} = 62\,426\,\text{A/m}`
  *(Display the dividends/divisors at ≥5 sig figs as written — with the rounded 0.0784/1.257×10⁻⁶ a student's calculator returns 62 370, visibly contradicting the printed 62 426.)*
  Ampère's-law audit — the drops must rebuild the drive:
  `H_{core}l_{core} + H_{gap}l_{gap} = (12.49)(0.3110) + (62\,426)(0.0031416) = 3.9 + 196.1 = 200\ \text{A·t} \checkmark`
  *Doc audit:* 12.48519 × 0.3110177 = 3.8831; 62 425.9 × 3.141593×10⁻³ = 196.117; sum = 200.000 ✓. Cross-route: drops split ∝ reluctance, 200×(49 500/2 549 500) = 3.883 and 200×(2 500 000/2 549 500) = 196.117 — identical ✓. **The 3 mm gap takes 98.1 % of the MMF** (and H_gap/H_core = 5000 = μᵣ exactly, because B is shared). That is why gapped readouts show H_gap dwarfing H_core.
- **Step 6 — Verify against the instrument.** Set Iron, N = 200, I = 1.0 A, gap **1 %**:

  | Quantity | Your pencil | Sim readout (`formatSI`-audited) |
  |---|---|---|
  | H_core | 12.49 A/m | `H_core = 12.485 A/m` |
  | H_gap | 62 426 A/m | `H_gap = 62425.9… A/m` *(unprefixed; do not pin the last decimals)* |
  | B | 78.45 mT | `B = 78.45 mT` |
  | Φ | 78.45 μWb | `Φ = 78.45 μWb` |
  | L | 15.69 mH | `L = 15.69 mH` |

- **One-liner (closes the roadmap's literal "1 mm"):** *Even a true 1 mm gap — just 0.32 % of the path, finer than this slider steps — gives* `\mathcal{R}_{gap} = \frac{10^{-3}}{(4\pi\times10^{-7})(10^{-3})} = 7.96\times10^{5}` *and cuts L seventeen-fold (0.800 H → 47.3 mH).* *Doc audit:* 10⁻³/(4π×10⁻¹⁰) = 10⁷/(4π) = 795 775 ✓; ℛ_core = 0.3131593/6.283185×10⁻⁶ = 49 841; total 845 616; L = 40 000/845 616 = 47.30 mH; 0.800/0.04730 = **16.9×** ✓; 0.001/0.3141593 = 0.318 % ✓.

### 3C. YourTurnPanel — inverse design (the roadmap's "what I or N gives B = 1 T?")

Design driver for the numbers: the answer must be **settable and checkable on the sim** (N slider: 10–500 step 1 ✓; an I-based variant would need I = 0.25 A, unreachable on the 0.1-step current slider — hence the N form).

- **scenario:** `"Design time — run the magnetic circuit backwards. Same ungapped iron toroid as Worked Example 1 (μᵣ = 5,000, A = 10 cm², path 0.314 m, ℛ = 5.0×10⁴ A·t/Wb), drive fixed at I = 1.0 A. The 4 T fantasy above saturates real iron, so your spec is a realistic working point: B = 1.0 T in the core."`
- **question:** `"How many turns N do you need?"`
- ✅ **"N = 50 turns"** — *Correct. Run the chain backwards: Φ = BA = 1.0 × 10⁻³ Wb, MMF = Φℛ = 10⁻³ × 5.0×10⁴ = 50 A·t, N = MMF/I = 50 turns. Sanity route: B is proportional to NI, and 200 turns gave 4.0 T — so a quarter of the turns gives a quarter of the B.*
- ❌ "N = 100 turns" — *That halves N to quarter B — treating B ∝ N². Inductance L goes as N², but B rides the MMF: first power of N. Halving N only halves B (2.0 T).*
- ❌ "N = 50,000 turns" — *You solved MMF = ℛ·B, treating B as the flux. B is flux PER AREA: Φ = BA = 10⁻³ Wb is what Hopkinson's law moves. Carry the 10 cm² through.*
- ❌ "N = 250,000 turns" — *That's the air-core answer (μᵣ = 1 → ℛ = 2.5×10⁸ A·t/Wb). The iron's μᵣ = 5,000 is doing 99.98% of the work here — forget it and your design needs 5,000× the turns.*
- **correctReveal (block math, JSX attrs → single backslash):**
  `\Phi = BA = (1.0)(10^{-3}) = 10^{-3}\,\text{Wb}` → `\text{MMF} = \Phi\mathcal{R} = (10^{-3})(5.0\times10^{4}) = 50\ \text{A·t}` → `N = \frac{\text{MMF}}{I} = \frac{50}{1.0} = 50\ \text{turns}`
  plus the verification line: "Now prove it with the instrument: Iron, **N = 50**, I = 1.0 A, gap 0 % → the canvas must read `B = 1.000 T`, `Φ = 1.00 mWb`, `L = 50.00 mH`." *(Doc audit: Φ = 50/50 000 = 10⁻³ Wb ✓; B = 10⁻³/10⁻³ = 1.000 T ✓; L = 50²/5×10⁴ = 2 500/50 000 = 0.0500 H → formatSI "50.00 mH" ✓. Distractor audits: N=100 → B = 100/200 × 4 = 2.0 T ✓; flux-as-B error: MMF = 5×10⁴ × 1 = 5×10⁴ → N = 50 000 ✓; air-core: ℛ = 0.3141593/(1.256637×10⁻⁶ × 10⁻³) = 2.500×10⁸ exactly (= 0.1/(4×10⁻¹⁰)), MMF = 2.5×10⁸ × 10⁻³ = 2.5×10⁵ → N = 250 000 ✓.)*
- **hints:** none (the existing YourTurnPanel call sites pass none; the prop is optional — match the file).

### 3D. Worked Example 3 — "Two materials in series" (Ida's standard next step; pencil-only, explicitly NOT simulated)

**Lead-in:** the sim can show iron + air; real machines chain *materials*. Same toroid geometry (r = 5 cm, A = 10 cm², N = 200, I = 1.0 A), but **half the ring is iron (μᵣ = 5000), half is ferrite (μᵣ = 1000)** — each half `l = \pi r = 0.157\,\text{m}`. One honest sentence: *the sim above cannot draw this one — that's the point; from here the method is yours, not the instrument's.*

- **Step 1 — One reluctance per segment, then add (series — same Φ threads both).**
  `\mathcal{R}_{iron} = \frac{\pi(0.05)}{(4\pi\times10^{-7})(5000)(10^{-3})} = 2.5\times10^{4}, \qquad \mathcal{R}_{ferrite} = \frac{\pi(0.05)}{(4\pi\times10^{-7})(1000)(10^{-3})} = 1.25\times10^{5}`
  `\mathcal{R}_{total} = 2.5\times10^{4} + 1.25\times10^{5} = 1.5\times10^{5}\ \text{A·t/Wb}`
  *Doc audit (symbolic, exact):* π cancels: ℛ_iron = 0.05/(4×10⁻⁷·5000·10⁻³) = 0.05/(2×10⁻⁶) = **25 000 exactly**; ℛ_ferrite = 0.05/(4×10⁻⁷) = **125 000 exactly** (= 5× iron, since μᵣ is 5× smaller) ✓.
- **Step 2 — Flux and B (one flux, one B — series, same area).**
  `\Phi = \frac{200}{1.5\times10^{5}} = 1.333\,\text{mWb} \quad\Rightarrow\quad B = 1.333\,\text{T}`
  *Doc audit:* Φ = 200/150 000 = 4/3 mWb exactly; B = 4/3 T = 1.3333 T ✓. *2E plausibility callout:* **this one passes** — 1.33 T is below iron saturation (it would push the ferrite, real ferrites saturate ≈ 0.3–0.5 T — a linearized-model caveat worth one sentence, mirroring §3A's lesson).
- **Step 3 — H differs per material; the MMF books must balance.**
  `H_{iron} = \frac{B}{\mu_0(5000)} = 212.2\,\text{A/m}, \qquad H_{ferrite} = \frac{B}{\mu_0(1000)} = 1061\,\text{A/m}`
  `\text{MMF drops:}\quad (212.2)(0.157) + (1061)(0.157) = 33.3 + 166.7 = 200\ \text{A·t} \checkmark`
  *Doc audit (exact closed forms):* H_iron = (4/3)/(2π×10⁻³) = (2/3π)×10³ = 212.207 A/m; drop = H·πr = (2/3π)×10³ × π(0.05) = 100/3 = **33.333 A·t exactly**; ferrite = 5× = **166.667 A·t exactly**; 100/3 + 500/3 = 200 ✓✓. Split ratio 166.7/33.3 = 5 = ℛ_ferrite/ℛ_iron ✓.
- **Step 4 — Inductance, for completeness.** `L = \frac{200^2}{1.5\times10^{5}} = 266.7\,\text{mH}` *(audit: 40 000/150 000 = 0.26667 H ✓ — between the all-iron 0.800 H and what an all-ferrite ring would give, 40 000/250 000 = 0.160 H, as it must be).*

**Key-Insight closing card:** *Series reluctances add and MMF divides in proportion to reluctance — Kirchhoff's voltage law wearing magnetic clothes. The weakest material in the path takes the most MMF; the air gap of Worked Example 2 is just this rule pushed to the extreme (μᵣ = 1).*

**NEW ConceptCheck CC-4** (inline `QuizQuestion` const `Q_SERIES_MMF`, adapted via the existing `toConceptCheck`, wired `onComplete={onCheckComplete} onHint={onCheckHint}` like the other three — placed directly after the Key-Insight card):

- **question:** `'A toroid is half iron (μᵣ = 5000) and half ferrite (μᵣ = 1000) — equal lengths, equal cross-section, in series. How does the coil's MMF divide between the two halves?'`
- **options:** `['Equally — same length, same area', 'Iron takes 5× more — higher μᵣ attracts more MMF', 'Ferrite takes 5× more — MMF divides in proportion to reluctance', 'Ferrite takes 25× more — it goes as the square of the μᵣ ratio']`
- **correctIndex:** `2`
- **explanation:** `'MMF divides like voltage across series resistors: in proportion to reluctance. With equal l and A, ℛ ∝ 1/μᵣ, so the ferrite half (μᵣ 5× lower) has 5× the reluctance and takes 5× the MMF — 166.7 A·t versus 33.3 A·t of a 200 A·t drive.'`
- **hints (3-tier, the file's verified shape):**
  - tier 1 / Conceptual: `'The same flux Φ threads both halves (series). Each half drops MMF_seg = Φ·ℛ_seg — which half has the larger ℛ?'`
  - tier 2 / Procedural: `'ℛ = l/(μ₀μᵣA) with identical l and A → ℛ_ferrite/ℛ_iron = μᵣ,iron/μᵣ,ferrite = 5000/1000 = 5.'`
  - tier 3 / Worked step: `'ℛ_iron = 2.5×10⁴, ℛ_ferrite = 1.25×10⁵ A·t/Wb → drops = 200×(25/150) = 33.3 A·t and 200×(125/150) = 166.7 A·t — option C.'`

### 3E. GuidedChallenge delta (CHALLENGE const, plain strings → unicode)

Insert ONE instruction between current steps 1 and 2 (no later step references step numbers — verified), making the hand-verification ritual part of the capstone:

> `Hand-check that baseline before touching anything else: ℛ = l/(μ₀μᵣA) = 0.314/(4π×10⁻⁷ × 5,000 × 0.001) = 5.0×10⁴ A·t/Wb, so L = N²/ℛ = 200²/(5.0×10⁴) = 0.800 H (the canvas prints it as 800.00 mH) and B = NI/(ℛ·A) = 200/(5.0×10⁴ × 0.001) = 4.000 T. The canvas readouts must match your pencil digit for digit — that is this section's whole point.`

*Doc audit:* B = MMF/(ℛA) = 200/50 = 4.000 ✓ (route equivalent to Φ/A).

---

## 4. Sim & figure changes — extraction only, zero behavior change

**Canvas, controls, sliders, presets, readouts, disclaimers: untouched.** The roadmap's ask is that students can *verify* the readouts, so the readouts must not move.

**One refactor (2A house rule "physics via tested utils", applied to the numbers this unit teaches):** extract the sim's inline physics block (`index.tsx` lines 107–126) into **NEW `src/em/utils/magneticCircuits.ts`** (new `utils/` dir — em has none yet, verified):

```ts
/** ℛ = l/(μ₀·μᵣ·A) in A·t/Wb. */
export function reluctance(length: number, muR: number, area: number): number

export interface ToroidSolution {
  gapLength: number; coreLength: number;
  reluctanceCore: number; reluctanceGap: number; reluctanceTotal: number;
  mmf: number; flux: number; B: number; hCore: number; hGap: number; inductance: number;
}
/** The sim's toroid, solved: gapPercent in [0,100]; hGap = 0 when gapPercent = 0
 *  (display convention preserved). Geometry defaults = the sim's (r = 0.05 m, A = 1e-3 m²). */
export function solveToroid(muR: number, turns: number, current: number, gapPercent: number,
  meanRadius?: number, coreArea?: number): ToroidSolution
```

The component replaces lines 107–126 with one `solveToroid(muR, turns, current, gapPercent)` call (it keeps using `gapLength` from the result for canvas geometry). Formula-for-formula identical to the current inline math — the unit tests below pin the identity, and they double as the doc's number audit living in CI: **if anyone ever edits the sim physics, the worked examples' "digit for digit" promise breaks the build instead of silently lying.** (JSDoc in the .ts file → unicode, no LaTeX.)

**No new figures.** The existing toroid FigureImage carries the section; Worked Example 3 is deliberately text-only (see NON-goals).

**e2e impact (verified against `e2e/sim-paint.spec.ts`):** the generic `unlockGates` walker (clicks the first enabled option in any `div.border-dashed:has-text("Predict First")`, then Continue) clears the new §3B gate automatically; `EXPECT_CANVAS` for `magnetic-circuits` is still satisfied by the untouched toroid canvas. **No e2e edits.**

---

## 5. Wiring delta — NONE (orchestrator ruling 2026-06-11, supersedes the 3→4 draft)

**`expectedChecks` for `magnetic-circuits` STAYS 3.** Two reasons, both binding:
1. **No retroactive badge regression:** `isModuleComplete` compares stored completed checks against the live target — flipping 3→4 would un-complete every student whose persisted `emac-progress` already shows 3/3 on this section. New content must not revoke earned completion.
2. **Batch consistency:** unit 2D adds faraday's 5th CC and keeps faraday at 3 (2G reviewer's ruling). One policy everywhere: added CCs are additive depth; the completion bar never rises.

Therefore: **no `curriculum.ts` edit, no `curriculum.test.ts` edit, no owner flag needed.** Q_SERIES_MMF still ships — it simply isn't required for the badge (any 3 of the 4 complete the section).

**Cross-unit ownership note:** this unit OWNS the magnetic-circuits saturation exhibit (§3A "B = 4 T should bother you"). Unit 2G's overlapping magnetic-circuits callout + Q_SATURATION CC were REMOVED from 2G's scope (see 2G §5.4) — the lesson is taught once, here.

---

## 6. Implementation map

| File | Action |
|---|---|
| `src/em/utils/magneticCircuits.ts` | **NEW**: `reluctance` + `solveToroid` pure exports (§4) — commit 1 (TDD: tests first) |
| `src/em/utils/__tests__/magneticCircuits.test.ts` | **NEW**: hand-derived vectors (§7) — commit 1 |
| `src/em/sections/magnetic-circuits/index.tsx` | EDIT: swap inline physics → `solveToroid` (commit 1); insert §3A–§3D blocks + `Q_SERIES_MMF` + §3E CHALLENGE step (commit 2) |
| `src/em/sections/__tests__/magneticCircuits.test.tsx` | **NEW** page test (§7) — commit 2 |
| `src/shared/constants/curriculum.ts` + its test | **ZERO changes** (§5 keep-3 ruling) |
| `src/em/sections/__tests__/sections.test.tsx`, e2e specs, registry, `getSectionNumber.test.ts` | **ZERO changes** |

**Components reused:** `PredictionGate` (blocking default, no `allowSkip` prop), `ConceptCheck` + the file's own `toConceptCheck` adapter, `YourTurnPanel`, `MathWrapper`, `GuidedChallenge` (string delta only), inline step-card pattern (NOT `WorkedSteps` — §3 ruling). Unified `Tabs`: not used (page is linear).

**Estimated test additions:** 2 new files, ~12 `it()` blocks (~35 assertions): utils ~6 its, page ~6 its, +1 assertion in curriculum.test. Suite grows by ~12 tests, 0 skips.

---

## 7. Test plan

**Unit — NEW `src/em/utils/__tests__/magneticCircuits.test.ts`** (named imports via `@em`, `toBeCloseTo`, full hand derivation in comments — house style; ALL values re-derived in §3 of this doc):

- `reluctance(2 * Math.PI * 0.05, 5000, 1e-3)` → 50 000 *(exact: 0.1/(2×10⁻⁶))*
- `reluctance(Math.PI * 0.05, 5000, 1e-3)` → 25 000; `reluctance(Math.PI * 0.05, 1000, 1e-3)` → 125 000 *(Worked Example 3's two segments; their sum 150 000 asserted too)*
- `reluctance(0.001, 1, 1e-3)` → 795 775 ±1 *(the literal-1 mm one-liner)*
- `solveToroid(5000, 200, 1, 0)` → reluctanceTotal 50 000, flux 4e-3, B 4.0, hCore 636.620 ±0.001, **hGap 0** (display convention), inductance 0.8 *(Worked Example 1 + sim default)*
- `solveToroid(5000, 200, 1, 1)` → reluctanceCore 49 500, reluctanceGap 2 500 000, reluctanceTotal 2 549 500, flux 7.84468e-5 ±1e-9, B 0.0784468 ±1e-6, hCore 12.485 ±0.001, hGap 62 425.9 ±0.5, inductance 0.0156894 ±1e-6 *(Worked Example 2)*
- **MMF-conservation property** on the gapped solution: `hCore*coreLength + hGap*gapLength` → 200 ±1e-6 *(Ampère audit in CI)*
- `solveToroid(5000, 50, 1, 0)` → B 1.000, inductance 0.0500 *(the YourTurn oracle)*
- `solveToroid(1, 200, 1, 0)` → reluctanceTotal 2.5e8, B 8e-4, inductance 1.6e-4 *(air-core collapse — pins CHALLENGE step 6's claim and the 250 000-turn distractor's premise)*

**Page — NEW `src/em/sections/__tests__/magneticCircuits.test.tsx`** (clone the verified `sections.test.tsx` boilerplate: katex mock returning raw latex, MemoryRouter helper; canvas `getContext` returns null harmlessly in jsdom — verified the sim guards it):

1. h2 `/Solve it by hand/i` renders; Worked Example 1 content present ungated (match a stable katex-mock substring, e.g. `/\\mathcal\{R\} = \\frac\{l\}\{\\mu_0 \\mu_r A\}/` or the step title `/Path and reluctance/i`).
2. **New gate blocks:** question `/1% of the flux path/i` visible; Worked-Example-2 marker `/Reluctance of the gap/i` **absent**; **no `/skip/i` control** rendered (pins blocking default).
3. **Gate passes:** click "Collapses about 50×…" then Continue → `/Reluctance of the gap/i` present; `markPredictionGate` fires (spy on store or accept store coverage in `progressStore.test`).
4. **YourTurn:** scenario `/run the magnetic circuit backwards/i` renders; click "N = 50 turns" → correctReveal `/50.00 mH/` appears; reset, click "N = 250,000 turns" → its air-core explanation `/2.5×10⁸|air-core/i` appears.
5. **CC-4:** question `/half iron/i` renders; clicking option index 2 shows explanation `/166.7 A·t/`; regression — the three pre-existing CC questions (`/reluctance analogous/i`-class, `/air gap is introduced/i`, `/N₁ = 100 and N₂ = 500/`) all still render.
6. **Challenge delta:** GuidedChallenge instruction `/digit for digit/i` present.

**Wiring:** curriculum.test gains `getExpectedChecks('magnetic-circuits') === 4` (§5). Existing smoke test (`sections.test.tsx` `MagneticCircuitsSection renders`) passes unchanged.

---

## 8. Explicit NON-goals (scope fence)

- **No new course section** — no registry/numbering/count churn; curriculum footprint is ZERO (`expectedChecks` stays 3, §5).
- **No sim behavior change**: no new sliders/presets/readouts, no finer gap step (the 1 %-not-1 mm substitution is the design, §3B), no fringing model, no nonlinear B–H/saturation modeling — saturation is *taught* as the §3A plausibility callout; the sim's existing linearity footnote stays as is.
- **No `WorkedSteps` hoist and no dependency on 2A's §11** — inline step cards (em cannot import circuits; optional post-hoist upgrade only).
- **No mutual-inductance edits** — the `Q_TRANSFORMER` / Mutual-Inductance blocks below the insertion point are roadmap-2D territory (in flight as the sibling unit on `Transformers`); do not let the two bleed in one PR.
- **No parallel magnetic circuits / flux-divider networks, no hysteresis or core loss, no force-across-gap (F = B²A/2μ₀)** — Ida's *later* steps; the roadmap asked for the series method only.
- **No second simulated instrument for the two-material circuit** — Worked Example 3 being pencil-only is the pedagogical point (§3D), not a TODO.
- **No retint / engineering-blue migration of this section's indigo accents** — Track-2 batch, separate.
- **No gamification surfacing** — CC-4 and the gate write to the existing counters exactly like their siblings; the read-side question stays with the Track-2 owner decision.

---

## 9. Verification gates (implementer MUST run, in order)

1. `npx tsc -b` clean; `npx vite build` clean.
2. `npx eslint .` — 0 errors (jsx-a11y hard-enforced; every new interactive element is an existing accessible primitive — no new surface).
3. **Full suite: `npm test -- --no-file-parallelism`** (binding on the owner's 4-core box — default forks OOM). Expect: all pre-existing tests green **unchanged except** the one renamed/extended curriculum.test block; new utils + page files green; 0 skips.
4. **Refactor-identity spot check (commit 1):** before/after the `solveToroid` swap, the sim's rendered readout strings at (Iron, 200, 1.0, 0 %) and (Iron, 200, 1.0, 1 %) are identical — the §3A/§3B tables are the oracle.
5. **Independent number audit by a second pair of eyes (per-batch entry gate):** re-derive, without reading §3: 5.0×10⁴ · 4.00 mWb · 4.000 T · 636.6 A/m · 0.800 H ‖ 49 500 · 2.50×10⁶ · 2 549 500 · 78.45 μWb · 78.45 mT · 15.69 mH · 12.49 · 62 426 · 3.88 + 196.12 = 200 · 51.0× · 98.1 % ‖ N = 50 · 50 A·t · 50.00 mH · distractors 100/50 000/250 000 ‖ 25 000 · 125 000 · 4/3 T · 212.2 · 1061 · 33.3 + 166.7 = 200 · 266.7 mH ‖ 795 775 · 47.3 mH · 16.9×.
6. **e2e paint net:** `sim-paint.spec.ts` route `magnetic-circuits` green — the walker must clear BOTH gates and the canvas must still paint (if the walker loops, the new gate's markup diverged from the `div.border-dashed` + "Predict First" contract: fix the page, not the spec).
7. **Playwright screenshot harness** (PR #9 harness, Phase-2 entry gate): re-shoot `/magnetic-circuits` at both viewports; owner walk checklist — dark mode on the step cards / plausibility callouts / Key-Insight card; keyboard-only pass of the new gate, CC-4, and YourTurn; mobile stacking of the §3B verify table; the §3A "digit for digit" claim performed live against the canvas.
8. Ship via branch + PR (GitHub REST API; classifier blocks direct-main pushes). **Sequencing:** no file overlap with `wave0/debt-and-tabs` (its em deltas are `useCanvasTouch` + `ampere` only — verified) or the sibling mutual-inductance unit (`Transformers.tsx`); 2A, if in flight, touches `curriculum.test.ts` in a *different* test block (counts) — trivial rebase either order.
