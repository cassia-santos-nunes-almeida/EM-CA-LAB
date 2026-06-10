# Unit 2A design — `line-impedance` · "Line Impedance & Matching" (new section 5.3)

**Date:** 2026-06-10 · **Status:** design complete, implementation NOT started
**Parent:** `2026-06-10-phase-2-roadmap.md` unit 2A (ILOs 4 + 10)
**Provenance:** recon (5.2 anatomy / transmissionMath API / SmithChartSim internals / size evidence) + two competing designs (extend-5.2 vs new-section) + adversarial judge; every number re-derived by hand during judging and independently spot-checked.

## Placement ruling (judged, evidence-cited)

New Part-5 section between `transmission-lines` and `transients` (renders 5.3; `transients` auto-renumbers to 5.4 via derived `getSectionNumber` — grep-verified no hardcoded "5.3" in prose/JSX). Why not extend 5.2: it is already the longest Part-5 page (497 lines, 4 tabs, 3 gated benches) and 2A is a full section of content — extending would ~double the file, contradict the Phase-1 over-long-pages theme, and rewrite the exact hunks PR #7 touches. The pedagogical seam is real (5.2 = load-local Γ/VSWR; 2A = position question Z_in(l)) and matches Ulaby's own chapter cut. Grafted from the losing design: the λ/8 clean-numbers warm-up, electrical-length mini-table, the SmithChartSim observation-distance slider upgrade (additive; l = 0 default preserves today's behavior exactly), `calculatePhaseConstant` as a tested export, readout clamps + tan-sign-error warning + Np→dB notes, chart null-breaks at singularities.

## Implementation sequencing (IMPORTANT)

Branch from `phase-2/roadmap-and-quick-wins` (or rebase after PRs #8/#10 merge) — the 23-section count tests this unit updates to 24 exist only on that stack; origin/main still has 20 until the open PRs land. PR #7 does not collide (it touches `TransmissionLines.tsx` gate props; this unit touches that file in two surgical hunks elsewhere + `SmithChartSim.tsx`, which #7 ignores).

---

# Unit 2A — `line-impedance` · "Line Impedance & Matching" (Part 5, slot 5.3)

Closes every audit gap: β = 2π/λ, electrical length βl, phasor line solution, Γ(l) rotation, Z_in tan-transformation (0.3λ/100 Ω exam task hand-worked twice), λ/2 + λ/4 special cases, quarter-wave Z_T = √(Z₀Z_L) DERIVED, worked matching design, stub reactance, γ = α + jβ paragraph. ILO4 + ILO10. Canonical text: Ulaby Ch. 2.

**Conventions (binding):** All formulas below are JSX attribute literals → single backslash exactly as written. No section number is ever hardcoded in prose — always `{getSectionNumber('…')}` interpolation; the only literal ids are progress-store keys and routes. The CHALLENGE const stays a `.tsx`-local object using unicode Γ/λ/Ω (no LaTeX), per the verified 5.2 pattern. `expectedChecks: 0` (every non-EM section completes on first visit — verified convention).

---

## 1. Wiring deltas (all verified against the worktree; ILO9 precedent)

1. **`src/shared/constants/curriculum.ts`**
   - Insert into `SECTION_LIST` immediately after the `transmission-lines` entry (currently line 84):
     `{ id: 'line-impedance', title: 'Line Impedance & Matching', route: '/line-impedance', domain: 'transmission', expectedChecks: 0 },`
   - `PARTS[4].sectionIds` (currently line 119): `['lumped-distributed', 'transmission-lines', 'line-impedance', 'transients']`.
   - Load-time guards (dup-id throw, unknown-id throw) and `routeIntegrity.test.ts` (registry keys === ALL_SECTIONS, set-based) enforce consistency automatically.
2. **`src/sectionRegistry.tsx`** — between the `'transmission-lines'` and `transients` entries:
   `'line-impedance': lazyRetry(() => import('@transmission/components/modules/LineImpedance').then((m) => ({ default: m.LineImpedance }))),`
3. **`src/shared/constants/__tests__/curriculum.test.ts`** — line 18 test name `'covers all 23 sections'` → `'covers all 24 sections'`; line 19 `toHaveLength(23)` → `24`; line 49 `toHaveLength(23)` → `24`.
4. **`src/shared/constants/__tests__/getSectionNumber.test.ts`** — line 16 `expect(getSectionNumber('transients')).toBe('5.3')` → `'5.4'`; ADD `expect(getSectionNumber('line-impedance')).toBe('5.3')` after the `transmission-lines` line. (Line 15 `transmission-lines → '5.2'` unchanged.)
5. **`src/transmission/components/modules/__tests__/pages.test.tsx`** — add smoke test:
   `it('LineImpedance renders without crashing', async () => { const { LineImpedance } = await import('@transmission/components/modules/LineImpedance'); renderInRouter(<LineImpedance />); expect(screen.getByRole('heading', { level: 1, name: /Line Impedance & Matching/i })).toBeInTheDocument(); });`
6. **`src/transmission/components/modules/Transients.tsx`** — JSDoc line 18: drop the number → `Transients on Transmission Lines page.` (cosmetic; prevents comment drift).
7. **Sidebar / CourseLanding / CourseNavigation / AiTutor** — all derive from PARTS/curriculum: zero edits. `app.test.tsx` uses PART-tag regexes, no counts: unaffected.

## 2. The 5.2 seam (exactly two edits to `TransmissionLines.tsx`)

**Edit A — replace the "Matching Network Design" collapsible** (verified at lines 285–300 inside `smithTheory`) with an "UP NEXT" callout (engineering-blue `border-l-4` house style, mono uppercase kicker):
> **UP NEXT** — When `Z_L \neq Z_0`, a matching network can transform the load to the centre of this chart (`\Gamma = 0`). The two classic builds — the quarter-wave transformer and the stub — are made of *nothing but line segments*. Designing them takes exactly one more idea: how impedance transforms as you move along a line, which on this chart is a clockwise rotation at constant |Γ|. That idea is Section `{getSectionNumber('line-impedance')}`: Line Impedance &amp; Matching.

The asserted-never-derived `Z_T = \sqrt{Z_0 Z_L}` moves to where it is finally derived (Tab 3). Everything else in 5.2 — all 3 labs, 3 gates, 3 CCs, the VSWR YourTurn, the GuidedChallenge, the SmithChartSim "Quarter-Wave Matching" collapsible calculator — stays. Verified: `transmissionLines.test.tsx` asserts nothing about the removed text.

**Edit B — append one sentence** to the "General case: lossy line" collapsible (verified at lines 119–133), after the high-frequency-reduction paragraph:
> How a lossy line *propagates* — the complex constant `\gamma = \alpha + j\beta` — appears in Section `{getSectionNumber('line-impedance')}`.

## 3. Page architecture — `src/transmission/components/modules/LineImpedance.tsx` (NEW)

Mirrors the verified 5.2 skeleton exactly: progress wiring block (clone of TransmissionLines.tsx lines 48–62 with id `'line-impedance'`: `markVisited('line-impedance')` on mount; `onConcept`/`onHint`/`onPredict` helpers), lifted unlock state `const [unlocked, setUnlocked] = useState<Record<string, boolean>>({})` + `unlock(key)` (one key: `walk`), `flaskIcon = <FlaskConical className="w-4 h-4" aria-hidden="true" />`.

```
<div className="space-y-8">
  <h1> <span mono engineering-blue>{getSectionNumber('line-impedance')}</span> Line Impedance &amp; Matching </h1>
  <SectionHook text="A 50 Ω cable 0.3 wavelengths long, a 100 Ω load on the far end — what impedance does the source actually see? Not 100 Ω, not 50 Ω, and Γ alone cannot tell you. This number decides whether your amplifier delivers power or burns it, and computing it is the most-asked exam task in transmission lines. By the end of this section you will read it off a slider — and design the cable section that fixes it." />
  <TabSet tabs={[
    { label: 'Electrical Length', content: electricalLengthTheory },                       // full width
    { label: 'The Z_in Lab', icon: flaskIcon,
      content: <LabLayout benchId="lab-walk" jumpLabel="Jump to lab" theory={zinTheory} bench={zinBench} /> },
    { label: 'Matching', content: matchingTheory },                                        // full width
    { label: 'Stubs', content: stubsTheory },                                              // full width
  ]} />
  <GuidedChallenge challenge={CHALLENGE} />
  <CourseNavigation currentSectionId="line-impedance" />
</div>
```

---

## 4. Tab 1 — "Electrical Length"

### 4.1 Opening puzzle box (PartialFractions "exposed debt" pattern; white card, h2 **"The question Γ can't answer"**)
> Section `{getSectionNumber('transmission-lines')}` gave you the load-end toolkit. Apply it to the setup from the hook — `Z_0 = 50\,\Omega`, `Z_L = 100\,\Omega`, line length `l = 0.3\lambda`:

| Tool | Result | Z_in? |
|---|---|---|
| `\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}` | `\Gamma = \frac{100-50}{100+50} = \frac{1}{3}` | ✗ |
| `\text{VSWR} = \frac{1+|\Gamma|}{1-|\Gamma|}` | `\text{VSWR} = 2` | ✗ |
| Smith chart (one point) | locates `z_L = 2` | ✗ |

Amber mono stamp (house "NO MATCH" style): **"Γ DESCRIBES THE LOAD. THE SOURCE IS 0.3λ AWAY."** Closing line: "Notice what all three tools ignore: the length. The missing quantity is how far along the line you stand — measured not in metres, but in *wavelengths*. This page builds that quantity, then uses it twice: to compute `Z_{in}`, and to design matching networks out of bare cable. (|Γ|² = 1/9 ≈ 11 % of the power reflects at the load — you know that already. What the *generator* sees is a different question.)"

### 4.2 The phase constant β
> A wavelength of line is 360° of phase. The conversion rate between metres and radians is the **phase constant**:

`\beta = \frac{2\pi}{\lambda} = \frac{\omega}{v_p} \qquad [\text{rad/m}]` *(block, boxed — first appearance of β in the app)*

> A length `l` of line "winds" the wave's phase by `\beta l` radians — the **electrical length**. Two physically different cables are electrically identical if their `\beta l` agree. (You have already *seen* it: the `Line = N\lambda_0` readout in the Section `{getSectionNumber('transmission-lines')}` reflections lab is `\beta l / 2\pi`.)

Mini-table (grafted from Design A): `l/λ` = 0, 1/8, 1/4, 3/8, 1/2 → `βl` = 0°, 45°, 90°, 135°, 180°.

Worked micro-example (inline, 2 lines): at f = 1 GHz on the Section `{getSectionNumber('lumped-distributed')}` coax (`v_p = 2\times10^8` m/s): `\lambda = v_p/f = 0.2` m, so a 6 cm jumper is `0.3\lambda` → `\beta l = 0.6\pi = 108^\circ`. *Same cable at 100 MHz: λ = 2 m → 0.03λ ≈ 11° — electrically invisible. Length means nothing; length-per-wavelength means everything.*

### 4.3 The phasor line solution (light, anchored to 5.1 — closes the audit gap in its cited form)
> In Section `{getSectionNumber('lumped-distributed')}` you derived the wave equation from KVL/KCL and saw its travelling-wave solution `V(x,t) = V^{+}f(t-x/v) + V^{-}g(t+x/v)`. Drive the line sinusoidally and wait for steady state: each travelling wave becomes a phasor whose phase depends on position:

`\widetilde{V}(z) = V_0^{+}e^{-j\beta z} + V_0^{-}e^{+j\beta z}` *(block, boxed)*
`\widetilde{I}(z) = \frac{V_0^{+}}{Z_0}e^{-j\beta z} - \frac{V_0^{-}}{Z_0}e^{+j\beta z}` *(block; note the minus — the backward wave carries current the other way)*

> Nothing new is assumed: this is the two-wave solution written for one frequency. The ratio `V_0^{-}/V_0^{+}` at the load is exactly the Γ of Section `{getSectionNumber('transmission-lines')}`.

### 4.4 Γ along the line — the rotation
> Now stand at distance `l` from the load, looking toward it. The forward wave is `\beta l` radians earlier in phase here; the returning wave `\beta l` later. Their ratio — the local reflection coefficient — therefore rotates by the round trip:

`\Gamma(l) = \Gamma_L\, e^{-j2\beta l}` *(block, boxed)*

Key Insight callout (house style): **"The factor 2 is a round trip.** Walking `l` toward the generator delays the forward wave by βl *and* the returning wave by βl. On a lossless line |Γ| never changes — only its phase, clockwise on the Γ-plane. One full lap = `2\beta l = 2\pi` = **half a wavelength**. This single fact is the engine of everything below — and it is why the Smith chart's rim carries a `WAVELENGTHS TOWARD GENERATOR` scale running 0 to 0.5."

### 4.5 ConceptCheck CC-1 (wired `onComplete={onConcept}` `onHint={onHint}`)
- **Q:** "You move λ/4 along a lossless line toward the generator. What happens to the reflection coefficient Γ?"
- ✅ **"Its phase rotates by −180° (half a lap of the Γ-plane); |Γ| is unchanged"** — *Correct. Γ(l) = Γ_L e^(−j2βl) and 2β(λ/4) = 2·(2π/λ)·(λ/4) = π. The factor 2 is the round trip: the reflected wave travels there and back. A full 360° lap needs λ/2, not λ.*
- ❌ "Its phase rotates by −90°; |Γ| is unchanged" — *You dropped the round-trip factor 2: the phase shift is 2βl, not βl.*
- ❌ "Its phase rotates by −360° — back where it started" — *That would need 2βl = 2π, i.e. l = λ/2. A quarter wavelength is half a lap.*
- ❌ "|Γ| shrinks because the wave has travelled farther" — *Only loss (α) shrinks |Γ|. This line is lossless — the magnitude is pinned; position only spins the phase.*
- hints: `['Write Γ(l) = Γ_L e^(−j2βl) and substitute l = λ/4.', 'Why 2βl and not βl? Think about the path the reflected wave takes.']`

### 4.6 CollapsibleSection "Lossy lines: γ = α + jβ" (`variant="inline"`, closed by default) — the ENTIRE lossy treatment (scope cap honored)
> On a real cable the exponent generalizes. With series loss `R'` and shunt loss `G'` per metre, the propagation constant becomes complex:

`\gamma = \sqrt{(R' + j\omega L')(G' + j\omega C')} = \alpha + j\beta` *(block)*
`\widetilde{V}(z) = V_0^{+}e^{-\alpha z}e^{-j\beta z} + V_0^{-}e^{+\alpha z}e^{+j\beta z}` *(block)*

> The **attenuation constant** `\alpha` (nepers per metre; 1 Np = 8.686 dB) shrinks each wave's amplitude as it travels; `\beta` still winds the phase exactly as above. In the lossless limit `R' = G' = 0`: `\gamma = j\omega\sqrt{L'C'} = j\beta`, and everything on this page survives unchanged. One practical consequence: on a lossy line `|\Gamma(l)| = |\Gamma_L|\,e^{-2\alpha l}` *does* shrink toward the generator — a long lossy cable looks better-matched than its load. Real coax at 1 GHz loses a few dB per 100 m — utterly negligible across a 5 cm matching section, which is why the lossless formulas are the everyday working tool. The companion result — lossy `Z_0` — is the collapsible you met in Section `{getSectionNumber('transmission-lines')}`.

---

## 5. Tab 2 — "The Z_in Lab" 🧪 (LabLayout: theory left, gated bench right)

### 5.1 Theory column

**h2 "Input impedance: what the source sees".** Take the ratio of the two phasors at `l` (full algebra in `CollapsibleSection title="The three-line derivation" variant="inline"`, closed: divide through by `V_0^{+}e^{j\beta l}`, substitute `\Gamma_L = \frac{Z_L - Z_0}{Z_L + Z_0}`, apply Euler):

`Z_{in}(l) = \frac{\widetilde{V}(l)}{\widetilde{I}(l)} = Z_0\,\frac{1 + \Gamma_L e^{-j2\beta l}}{1 - \Gamma_L e^{-j2\beta l}}` *(block)*

and in the form every formula sheet prints:

`Z_{in}(l) = Z_0\,\frac{Z_L + jZ_0\tan\beta l}{Z_0 + jZ_L\tan\beta l}` *(block, boxed, labelled "THE transmission-line formula")*

**"How to read this formula" mini-list:** (i) at `l = 0`, `\tan 0 = 0` → `Z_{in} = Z_L` ✓; (ii) length enters ONLY through `\tan\beta l` → everything repeats with period λ/2; (iii) a purely resistive load still produces a complex `Z_{in}` — lines manufacture reactance from geometry alone (the Stubs tab weaponizes this).

**Warm-up worked box (grafted from Design A — exact arithmetic, inline card, no step-reveal):** *λ/8 of the same line: Z₀ = 50 Ω, Z_L = 100 Ω.* `\beta l = 45^\circ`, `\tan\beta l = 1`:
`Z_{in} = 50\,\frac{100 + j50}{50 + j100} = 50\,\frac{(100+j50)(50-j100)}{50^2+100^2} = 50\,\frac{10000 - j7500}{12500} = 40 - j30\ \Omega`
*The 3-4-5 triangle appears — and the input looks capacitive even though the load is a pure resistor.*

**WorkedSteps — "The exam task, by hand"** (`tryFirstPrompt="Compute βl in degrees yourself before revealing step 1."`). Given `Z_0 = 50\,\Omega`, `Z_L = 100\,\Omega`, `l = 0.3\lambda`:
- **Step 1 — Electrical length:** `\beta l = \frac{2\pi}{\lambda}(0.3\lambda) = 0.6\pi = 108^\circ`, `\tan 108^\circ = -3.078`. *Negative — past 90° the tangent flips sign. Missing this sign flip is the single most common exam mistake.*
- **Step 2 — Substitute:** `Z_{in} = 50\,\frac{100 + j50(-3.078)}{50 + j100(-3.078)} = 50\,\frac{100 - j153.9}{50 - j307.8}`
- **Step 3 — Polar division:** `\frac{183.5\angle -57.0^\circ}{311.8\angle -80.8^\circ} = 0.589\angle 23.8^\circ \;\Rightarrow\; Z_{in} = 29.4\angle 23.8^\circ = 26.9 + j11.9\ \Omega`
- **Step 4 — Audit (does this make sense?):** |Γ| = 1/3 everywhere on a lossless line, so the resistive part must stay inside `[Z_0/\text{VSWR},\ Z_0\cdot\text{VSWR}] = [25, 100]\ \Omega`. 26.9 Ω ✓ — just past the λ/4 minimum of exactly 25 Ω; the small *positive* reactance confirms we rotated just beyond the purely-real point (∠Γ(0.3λ) = −216° ≡ +144°). **If your hand calculation lands outside that band, hunt for a tan-sign error.**

**Box "The same answer by rotation":** `\Gamma(0.3\lambda) = \tfrac{1}{3}e^{-j216^\circ} = \tfrac{1}{3}\angle 144^\circ`, then `Z_{in} = Z_0\,\frac{1+\Gamma}{1-\Gamma} = 26.9 + j11.9\ \Omega` — identical. "The bench below computes it this way, and the Smith chart in Section `{getSectionNumber('transmission-lines')}` is this same calculation done graphically: rotate clockwise at constant |Γ|, read off z."

**Two "Does this make sense?" callouts** (house style): (a) "`Z_{in}` of a *lossless* line came out complex. Where is the reactive energy stored, if the load is a resistor? — In the line's own L′ and C′: the standing wave IS stored energy sloshing back and forth." (b) "VSWR = 2 at every point on this line, yet `Z_{in}` varies from 25 Ω to 100 Ω. Reconcile: VSWR encodes |Γ|, which is frozen; `Z_{in}` encodes ∠Γ too, which rotates."

### 5.2 ConceptCheck CC-2
- **Q:** "A 50 Ω line exactly λ/2 long is terminated in Z_L = 80 − j20 Ω. What is Z_in?"
- ✅ **"80 − j20 Ω — identical to the load"** — *Correct. At βl = 180°, tan βl = 0 and the formula collapses to Z_in = Z_L for ANY load. A half-wave line is electrically invisible — but only at the frequency that makes it half-wave.*
- ❌ "50 Ω — the line matches it" — *A line never matches a load by itself: Z_in = Z₀ only if Z_L = Z₀. Length can only transform a mismatch, not erase it.*
- ❌ "29.4 + j7.35 Ω" — *That is Z₀²/Z_L — the QUARTER-wave result. A half-wave line rotates Γ a full 360°, back to where it started.*
- ❌ "80 + j20 Ω — conjugated" — *Nothing conjugates here; the rotation 2βl = 360° is an identity.*
- hints: `['What is tan(βl) at βl = 180°?', 'Full lap of the Γ-plane = λ/2 — where does Γ end up?']`

### 5.3 Bench — LabStation + blocking gate + WalkTheLineSim

```jsx
<LabStation id="walk-the-line" title="Walk the Line"
  objective="Drag a probe along a mismatched 50 Ω line and watch Z_in, the electrical length, and the rotating Γ phasor respond — the quarter-wave sweet spots reveal themselves.">
  <p>Predict first, then run the lab. Commit your prediction to reveal the bench.</p>
  <PredictionGate
    initialPassed={!!unlocked.walk}
    onPassed={() => unlock('walk')}
    onPredict={onPredict}
    question="This 50 Ω line is terminated in Z_L = 100 Ω (purely resistive). You probe the input impedance a quarter-wavelength (l = λ/4) from the load. What do you measure?"
    options={[
      { id: 'same',     label: "100 Ω — length doesn't matter" },
      { id: 'matched',  label: '50 Ω — the line matched it' },
      { id: 'inverted', label: '25 Ω — less than Z₀' },
      { id: 'reactive', label: 'j50 Ω — purely reactive' },
    ]}
    getCorrectAnswer={() => 'inverted'}
    explanation={<span>A quarter-wave of line <em>inverts</em> the normalized impedance: <MathWrapper formula="z_{in} = 1/z_L" />, i.e. <MathWrapper formula="Z_{in} = Z_0^2/Z_L = 2500/100 = 25\,\Omega" />. A load above Z₀ reappears below it — and the bench lets you watch the whole journey between those two extremes.</span>}
  >
    <WalkTheLineSim />
  </PredictionGate>
</LabStation>
```
**allowSkip note:** after PR #7 merges, blocking is the default → write NO `allowSkip` prop (as shown). If implementation starts before #7 lands, write `allowSkip={false}` explicitly and expect the #7-style cleanup. Either way the page test pins the behavior (no Skip control rendered).

### 5.4 `WalkTheLineSim` complete spec (`src/transmission/components/simulations/WalkTheLineSim.tsx`, NEW — SVG + recharts, no canvas)

**Props:** `{ className?: string }`. **State:** `lOverLambda` (0–1.0, step 0.005, default 0); `RL` (0–500 Ω, step 1, default 100); `XL` (−500–+500 Ω, step 1, default 0); `isOpen` boolean (default false). Derived each render (ALL physics via imported utils, zero inline arithmetic): `betaL = 2 * Math.PI * lOverLambda`; `gammaL = isOpen ? { real: 1, imag: 0, magnitude: 1, phaseDeg: 0 } : calculateComplexReflectionCoefficient(RL, XL, 50)`; `gammaIn = rotateGamma(gammaL.real, gammaL.imag, betaL)`; `zin = gammaToImpedance(gammaIn.real, gammaIn.imag, 50)`; `vswr = calculateVSWR(gammaL.magnitude)`. Z₀ fixed at 50 Ω, printed "Z₀ = 50 Ω (fixed)" — matches the exam task, keeps the control surface tight.

**Layout (top → bottom, Lab Instrument card `bg-white dark:bg-slate-800 rounded-xl shadow-md`):**
1. **SVG schematic** (~120 px, `role="img"` `aria-label="Transmission line with movable observation probe"`): `GEN ~` box left, load box right printing the live termination (`Z_L = 100 + j0 Ω` / `SHORT` / `OPEN` / `MATCHED`), two-conductor line between, dashed vertical probe cursor whose x interpolates from the load (l = 0, right) toward the generator (l = 1λ, left), tagged `l = 0.300 λ`.
2. **Γ-dial** (SVG, ~220 px square — deliberately NOT a Smith chart: no R/X grid): unit circle; real axis labelled `Short (Γ=−1) · Matched · Open (Γ=+1)` (mirrors SmithChartSim's canvas labels); dashed constant-|Γ| circle; small filled dot at Γ_L labelled `Γ_L`; solid arrow centre → Γ(l); swept arc Γ_L → Γ(l) clockwise with arrowhead, labelled `−2βl`; tick marks where the circle crosses the real axis captioned "Z purely real here — voltage max / min". Dynamic `role="img"` `aria-label` = "Gamma phasor: magnitude {m}, phase {p} degrees at the probe". Caption beneath: "Rotation at constant |Γ| — exactly what the Smith chart in Section `{getSectionNumber('transmission-lines')}` does. <Link to="/transmission-lines#smith-chart">See it on the full chart →</Link>" (anchor id `smith-chart` verified on the smithBench LabStation).
3. **Strip chart** (recharts `LineChart` inside `ResponsiveContainer`, ~180 px; PhysicsChart is em-domain and may NOT be imported — use recharts directly with the app's slate/engineering-blue tokens): `R_in(l)` solid and `X_in(l)` dashed vs `l/λ` over [0, 1], 201 points precomputed in a `useMemo` keyed on `[RL, XL, isOpen]` via `calculateInputImpedance`; any |value| > 400 Ω mapped to `null` so traces visibly break at short/open singularities (grafted from Design A); `ReferenceLine x={lOverLambda}`; `ReferenceLine y={0}`. Wrapper `role="img"` `aria-label="Input resistance and reactance versus distance from the load"` (data fully redundant with the readouts). For the default load the student sees R oscillate 100 → 25 (λ/4) → 100 (λ/2) twice, X swing 0 → −30 (λ/8) → 0 → +30 (3λ/8) → 0.
4. **Controls** — native `<input type="range">` throughout (SmithChartSim's exact `aria-labelledby` + visible live-label pattern, verified lines 344–392; keyboard arrows/Home/End free, jsx-a11y clean):
   - **Distance slider (the star):** min 0, max 1, step 0.005; visible label `<span id="walkline-dist-label">Distance from load l = {lOverLambda.toFixed(3)} λ (βl = {(360*lOverLambda).toFixed(1)}°)</span>`; `aria-labelledby="walkline-dist-label"`; `aria-valuetext={`${lOverLambda.toFixed(3)} wavelengths from the load, electrical length ${(360*lOverLambda).toFixed(0)} degrees`}`.
   - **R_L slider** 0–500 step 1 and **X_L slider** −500–+500 step 1, same pattern; when `isOpen` their labels read `R_L = ∞ (open)` / `X_L = — (open)`; moving either slider clears `isOpen` and resumes from the slider value.
   - **Preset chips** (native `<button>`s, `aria-pressed` derived from current state): `Match (50 Ω)` → (50, 0, false); `Exam load (100 Ω)` → (100, 0, false); `Short (0 Ω)` → (0, 0, false); `Open (∞)` → `isOpen = true`.
5. **ReadoutCards** (local `ReadoutCard` helper — copy the verified per-sim pattern from SmithChartSim lines 467–487; per-sim duplication is the house convention):
   - `Electrical length βl` → `"108.0° · 0.300 λ"`
   - `Z_in` → `"26.9 + j11.9 Ω"` via local `formatComplexOhms(re, im)` = `${re.toFixed(1)} ${im >= 0 ? '+' : '−'} j${Math.abs(im).toFixed(1)} Ω`; when `!isFinite(zin.real)` render `"→ ∞ (open)"` — the gate's payoff moment must render cleanly, never NaN.
   - `Γ(l)` → `"0.333 ∠ 144.0°"` (from `gammaIn.magnitude` / `gammaIn.phaseDeg`)
   - `VSWR (constant along line)` → `"2.00"`, `"∞"` when not finite.

---

## 6. Tab 3 — "Matching"

### 6.1 The two magic lengths (compact two-column card)
- **Half-wave, `l = \lambda/2`:** `\tan\beta l = \tan 180^\circ = 0 \Rightarrow Z_{in} = Z_L`. *The line vanishes (at this one frequency). Corollary: every property of `Z_{in}` repeats with period λ/2 — you saw it on the bench's strip chart.*
- **Quarter-wave, `l = \lambda/4`:** `\beta l = 90^\circ`, `\tan\beta l \to \infty`. Divide numerator and denominator by `\tan\beta l`:

`Z_{in} = Z_0\,\frac{Z_L/\tan\beta l + jZ_0}{Z_0/\tan\beta l + jZ_L} \;\xrightarrow{\beta l \to 90^\circ}\; Z_0\,\frac{jZ_0}{jZ_L} = \frac{Z_0^2}{Z_L}` *(block)*

> **The quarter-wave inverter:** normalized, `z_{in} = 1/z_L`. Big becomes small, inductive becomes capacitive, short becomes open. (On the Γ-dial: half a lap, `\Gamma \to -\Gamma`.)

### 6.2 The quarter-wave transformer — derived at last
> Section `{getSectionNumber('transmission-lines')}` *asserted* `Z_T = \sqrt{Z_0 Z_L}`. You can now derive it in two lines. Insert a λ/4 section of unknown impedance `Z_T` between a `Z_0` feed and a resistive load `R_L`. The feed sees:

`Z_{in} = \frac{Z_T^2}{R_L} \overset{!}{=} Z_0 \quad\Longrightarrow\quad Z_T = \sqrt{Z_0 R_L}` *(block, boxed — "the formula the Smith chapter used to assert; now it's yours")*

> The geometric mean — the transformer climbs exactly halfway up the impedance ladder in log space.

### 6.3 WorkedSteps — "Design one: 100 Ω → 50 Ω at 1 GHz" (`tryFirstPrompt="Sketch the feed–transformer–load chain and compute Z_T before revealing."`)
On the Section `{getSectionNumber('lumped-distributed')}` coax family (`v_p = 2\times10^8` m/s):
- **Step 1 — Impedance:** `Z_T = \sqrt{50\times100} = \sqrt{5000} \approx 70.7\ \Omega` *(commercial 70–75 Ω stock exists — part of why 75 Ω cable is everywhere).*
- **Step 2 — Physical length:** `\lambda = v_p/f = \frac{2\times10^8}{10^9} = 0.20\ \text{m} \;\Rightarrow\; l = \lambda/4 = 5.0\ \text{cm}`. *Use the LINE wavelength, never the free-space one.*
- **Step 3 — Verify:** `Z_{in} = Z_T^2/Z_L = 70.7^2/100 = 50.0\ \Omega` ✓ → Γ = 0 at the feed, VSWR = 1.
- **Step 4 — The catch (bandwidth):** the section is λ/4 *only at 1 GHz*. At 1.2 GHz it is 0.3λ — and you now own the exact skill (the Z_in Lab's worked example) to compute the residual mismatch. A quarter-wave transformer is a one-frequency promise; that trade-off is the start of RF filter design.

### 6.4 YourTurnPanel (verbatim — Design B's, all numbers verified)
- **scenario:** "Your half-wave dipole from the Antennas section presents ≈ 73 Ω — call it 75 Ω — at 100 MHz. The feed is 50 Ω coax. Match it with a quarter-wave transformer cut from cable with velocity factor 0.66 (v_p ≈ 2×10⁸ m/s)."
- **question:** "What characteristic impedance Z_T do you need, and how long do you cut the section?"
- ✅ **"Z_T ≈ 61.2 Ω, l = 0.50 m"** — *Correct! √(50·75) = √3750 ≈ 61.2 Ω, and λ_line = 2×10⁸/10⁸ = 2.0 m, so λ/4 = 0.50 m.*
- ❌ "Z_T = 62.5 Ω, l = 0.50 m" — *62.5 is the ARITHMETIC mean (125/2). Matching needs the geometric mean √(Z₀Z_L) — close here, but the error grows with the impedance ratio.*
- ❌ "Z_T ≈ 61.2 Ω, l = 0.75 m" — *You used the free-space wavelength (3 m). Waves crawl at 0.66c inside the cable: λ_line = 2.0 m, so the section is 0.50 m.*
- ❌ "Z_T ≈ 33.3 Ω, l = 0.50 m" — *33.3 Ω = Z₀²/Z_L is what a λ/4 of the FEED cable would produce — that is the transformation, not the transformer. Solve Z_T²/Z_L = Z₀ for Z_T.*
- **correctReveal:** block math `Z_T = \sqrt{50\times75} = \sqrt{3750} \approx 61.2\ \Omega`; `\lambda_{line} = \frac{2\times10^8}{10^8} = 2.0\ \text{m} \;\Rightarrow\; l = \frac{\lambda}{4} = 0.50\ \text{m}`; check `Z_{in} = 3750/75 = 50\ \Omega` ✓. Practical kicker: "61.2 Ω is not a stock cable. Real options: microstrip (set the trace width), or accept 60 Ω stock: `Z_{in} = 3600/75 = 48\ \Omega`, `\Gamma = -2/98 = -0.020`, VSWR ≈ 1.04 — an excellent match. Engineering is knowing when 'close' is closed."
- **hints:** `['Geometric mean for Z_T; LINE wavelength for l.']`

---

## 7. Tab 4 — "Stubs"

### 7.1 Short and open stubs
> Terminate a line in the two free loads — a short, or nothing at all — and `Z_{in}` collapses to something with no resistive part. Set `Z_L = 0` (numerator `jZ_0\tan\beta l`, denominator `Z_0`), or `Z_L \to \infty`:

`Z_{in}^{\text{short}} = jZ_0\tan\beta l \qquad\qquad Z_{in}^{\text{open}} = -jZ_0\cot\beta l` *(block, boxed)*

> **Pure reactance from bare cable.** A shorted stub below λ/4 looks like an inductor; between λ/4 and λ/2, a capacitor; the open stub is its mirror. By choosing a *length* you dial any reactance from −∞ to +∞ — no component, no tolerance, no solder joint. At GHz frequencies, where a 5 nH inductor is a manufacturing problem, a stub is just trace geometry. *(You already verified the short-stub curve on the bench: the Short preset swept exactly `jZ_0\tan\beta l`.)*

Sweep table (Z₀ = 50 Ω, shorted): l = λ/16 → +j20.7 Ω; λ/8 → +j50 Ω; λ/4 → ∞ (the inverter: short looks open!); 3λ/8 → −j50 Ω (capacitive); λ/2 → 0 (short again). Inline worked line: "λ/8 shorted: `\beta l = 45^\circ \Rightarrow Z_{in} = j50\tan 45^\circ = +j50\ \Omega` — a perfect +50 Ω 'inductor'. The open λ/8 stub gives `-j50\ \Omega`."

### 7.2 Static reactance chart (presentational figure — gate-exempt)
Recharts `LineChart`, **zero controls**: `X/Z_0` vs `l/\lambda` over [0, 0.5]; two series — `\tan\beta l` (short, solid) and `-\cot\beta l` (open, dashed) — values clipped to `null` beyond ±5; dashed `ReferenceLine` at l = 0.25 annotated "short → ∞ / open → 0"; end annotations "short looks like L" / "open looks like C". Data: 101 points precomputed from exported `calculateStubReactance` (no inline math). Wrapper `role="img"` + `aria-label`. **Gate-exemption rationale (record in a code comment):** the house rule gates sims/interactives; this has no inputs and nothing to manipulate — same class as `FigureImage`; the *interactive* version of this exact curve already lives behind the Z_in Lab's gate (Short preset + distance slider).

### 7.3 ConceptCheck CC-3
- **Q:** "A shorted 50 Ω stub is exactly λ/8 long. What does it present at its input?"
- ✅ **"+j50 Ω — purely inductive"** — *Correct. Z_in = jZ₀ tan βl = j·50·tan 45° = +j50 Ω. Zero resistance — a reactance manufactured from line geometry alone.*
- ❌ "−j50 Ω — purely capacitive" — *That is the OPEN λ/8 stub: −jZ₀ cot 45° = −j50 Ω. Short and open stubs are reactive mirrors.*
- ❌ "0 Ω — it's a short, after all" — *Only at l = 0. An eighth-wave of line transforms the short: the energy bouncing inside looks inductive from the input.*
- ❌ "∞ — open circuit" — *That happens at exactly l = λ/4, where the quarter-wave inverter turns the short into an open.*
- hints: `['What is βl for l = λ/8?', 'tan 45° = 1.']`

### 7.4 The matching payoff + honest deferral (scope ruling honored)
> **How stubs finish the matching story:** move along the main line to the point where the load's admittance has real part `1/Z_0` (such a point always exists within λ/2 — the bench showed R sweeping through every value between Z₀/S and Z₀·S); hang a stub there, with its length chosen so its susceptance cancels what remains. Two lengths to pick — *where* and *how long* — and both come from the formulas on this page. The systematic recipe (and doing it in seconds on the Smith chart) is single-stub design, the standard next step in any RF course — left on the shelf here **deliberately**: you now own every formula it is built from.

---

## 8. SmithChartSim upgrade (grafted from Design A; `src/transmission/components/simulations/SmithChartSim.tsx`)

Behind the EXISTING smith gate — no new gate. Zero visual change at the default `l = 0`.
1. New state `lOverLambda` (0–0.5, step 0.005, default 0) + a **fourth range slider** in the controls grid (change `sm:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-4`), pattern-identical to the verified three: visible label `Observation distance l = {lOverLambda.toFixed(3)} λ (toward the generator)`, id `smith-walk-label`, `aria-labelledby`.
2. Derived: `gammaIn = rotateGamma(gamma.real, gamma.imag, 2 * Math.PI * lOverLambda)`; `zin = gammaToImpedance(gammaIn.real, gammaIn.imag, Z0)` — imported utils only.
3. `stateRef` gains `gammaIn` and `lOverLambda`. Draw additions inside the existing rAF function, only when `lOverLambda > 0`: hollow circle marker at `_gammaToPixel(gammaIn.real, gammaIn.imag, …)`; arc along the existing dashed VSWR circle from ∠Γ_L sweeping **clockwise on the chart** by `2βl` (mind the canvas y-flip when computing start/end angles), ending in `_drawArrowhead`.
4. Readout grid (currently `lg:grid-cols-4`, 4 cards) → `sm:grid-cols-2 lg:grid-cols-3` with 2 new `ReadoutCard`s: `Z_in at l` (formatComplexOhms; `→ ∞` when non-finite) and `Rotation 2βl` (`{(720*lOverLambda).toFixed(0)}°`).
5. Caption under the slider: "Walking toward the generator rotates Γ clockwise at constant |Γ| — Section `{getSectionNumber('line-impedance')}` turns this rotation into `Z_{in}(l)`."
6. **Do NOT touch:** `_gammaToZL` (its 500-clamp is load-bearing for the click-to-place slider path — verified), the pointer handlers, the drag gesture, the gate, or the Quarter-Wave collapsible.

## 9. `transmissionMath.ts` additions (exported, pure; .ts file → JSDoc uses unicode, no LaTeX)

```ts
/** Phase constant β = 2π/λ in rad/m. Returns NaN for wavelength ≤ 0. */
export function calculatePhaseConstant(wavelength: number): number

/** Electrical length in degrees from l/λ: 360·lOverLambda. */
export function electricalLengthDegrees(lOverLambda: number): number

/** Rotate Γ toward the generator: Γ(l) = Γ_L·e^(−j·2·betaL). betaL in RADIANS
 *  (= 2π·l/λ); the round-trip factor 2 is applied INSIDE. Returns the same
 *  shape as calculateComplexReflectionCoefficient. */
export function rotateGamma(gammaReal: number, gammaImag: number, betaL: number):
  { real: number; imag: number; magnitude: number; phaseDeg: number }

/** Invert Γ → impedance: Z = Z0·(1+Γ)/(1−Γ). Returns { real: Infinity, imag: 0 }
 *  when |1−Γ|² < 1e-12 (e.g. a short seen through λ/4). NOTE: deliberately NOT
 *  wired into SmithChartSim's private _gammaToZL, whose 500-clamp is load-bearing
 *  for click-to-place. */
export function gammaToImpedance(gammaReal: number, gammaImag: number, Z0: number):
  { real: number; imag: number }

/** Z_in of a lossless line: Γ_L → rotate by −2·betaL → invert. betaL in RADIANS.
 *  ZLr = Infinity (open load) handled explicitly (Γ_L = 1+j0), since
 *  calculateComplexReflectionCoefficient NaNs on Infinity. Named to avoid the
 *  transformer's calculateReflectedImpedance. */
export function calculateInputImpedance(ZLr: number, ZLi: number, Z0: number, betaL: number):
  { real: number; imag: number }

/** Stub input reactance in ohms: 'short' → Z0·tan(betaL), 'open' → −Z0·cot(betaL).
 *  Pole guards: short with |cos βl| < 1e-9 → Infinity; open with |sin βl| < 1e-9 →
 *  (cos βl > 0 ? -Infinity : Infinity). */
export function calculateStubReactance(Z0: number, betaL: number, kind: 'short' | 'open'): number

/** Quarter-wave transformer impedance √(Z0·RL); NaN for RL ≤ 0 or Z0 ≤ 0. */
export function quarterWaveTransformerImpedance(Z0: number, RL: number): number
```

**Unit tests** (append to `src/transmission/utils/__tests__/transmissionMath.test.ts`; one describe per function, named imports via `@transmission`, `toBeCloseTo` with the full hand derivation in comments — house style. ALL values re-derived by hand during judging):
- `calculatePhaseConstant(2)` → π; `(0.2)` → 31.4159; `(0)` → NaN
- `electricalLengthDegrees(0.3)` → 108; `(0.125)` → 45; `(0)` → 0
- `rotateGamma(1/3, 0, 0.6*Math.PI)` → real −0.2697, imag +0.1959, magnitude 0.3333, phaseDeg 144.0 *(comment: ⅓·e^(−j216°) = ⅓∠144°)*; `(1/3, 0, Math.PI)` → {0.3333, ≈0} (full lap); `(0.5, 0, Math.PI/2)` → real −0.5 (λ/4: Γ → −Γ)
- `gammaToImpedance(1/3, 0, 50)` → {100, 0}; `(−1/3, 0, 50)` → {25, 0}; `(0, 0, 50)` → {50, 0}; `(1, 0, 50)` → real Infinity; `(−1, 0, 50)` → {0, 0}; `(−0.2697, 0.1959, 50)` → {26.93, 11.87} (±0.05)
- `calculateInputImpedance(100, 0, 50, 0.6*Math.PI)` → {26.93, 11.87} (±0.05) — **the exam task**, full derivation in comment (tan 108° = −3.078; 50·(100−j153.9)/(50−j307.8))
- `(100, 0, 50, Math.PI/4)` → {40, −30} exactly — λ/8 warm-up, 3-4-5 triangle
- `(100, 0, 50, Math.PI/2)` → {25, 0} — λ/4 inversion (the gate); `(100, 0, 50, Math.PI)` → {100, 0} — λ/2 identity; `(100, 0, 50, 0)` → {100, 0}
- `(80, −20, 50, Math.PI)` → {80, −20} — CC-2 oracle (complex load through λ/2)
- `(50, 0, 50, 1.234)` → {50, 0} — matched load: length irrelevant
- `(0, 0, 50, Math.PI/2)` → real Infinity — short → open; `(Infinity, 0, 50, Math.PI/2)` → {≈0, ≈0} — open → short
- `calculateStubReactance(50, Math.PI/4, 'short')` → 50; `(50, Math.PI/4, 'open')` → −50; `(50, Math.PI/8, 'short')` → 20.71; `(50, 3*Math.PI/4, 'short')` → −50; `(50, Math.PI/2, 'short')` → Infinity; `(50, Math.PI/2, 'open')` → ≈0
- `quarterWaveTransformerImpedance(50, 100)` → 70.711; `(50, 75)` → 61.237; `(50, 0)` → NaN; `(50, −10)` → NaN

## 10. GuidedChallenge (verbatim; `.tsx`-local const, unicode Γ/λ/Ω — no LaTeX)

- **title:** `Walk the Line: From the Load to the Quarter-Wave Sweet Spot`
- **description:** `A guided traverse of the Walk the Line bench (in the Z_in Lab): start on the exam load, drag the probe from the load outward, and watch Z_in, the Γ phasor, and the strip chart act out every special case this section derived.`
- **instructions:**
  1. `Open the 🧪 Z_in Lab tab and commit the Predict-First prediction to reveal the bench. Press the 'Exam load (100 Ω)' preset and set the distance slider to l = 0. Confirm the readouts: Z_in = 100.0 + j0.0 Ω, βl = 0°, Γ = 0.333 ∠ 0.0° (the phasor sits on the positive real axis), VSWR = 2.00.`
  2. `Drag slowly to l = 0.125 λ (βl = 45°). Watch the Γ phasor sweep 90° clockwise and read Z_in = 40.0 − j30.0 Ω — the purely resistive load now looks capacitive, and the strip chart's X trace has dipped below zero.`
  3. `Continue to l = 0.250 λ. The phasor reaches ∠180°, and Z_in = 25.0 + j0.0 Ω — exactly Z₀²/Z_L, the quarter-wave inversion and the minimum of the R trace. Compare with the prediction you committed at the gate.`
  4. `Nudge to l = 0.300 λ (βl = 108°) and read Z_in ≈ 26.9 + j11.9 Ω. Check it digit-for-digit against the hand-worked example in the theory column — the bench and your pencil must agree.`
  5. `Carry on to l = 0.500 λ: the phasor completes its lap and Z_in returns to 100.0 + j0.0 Ω. Conclude from the strip chart that EVERYTHING repeats with period λ/2, and that the two purely-real crossings per period are the voltage-max (100 Ω) and voltage-min (25 Ω) points.`
  6. `Press the 'Short (0 Ω)' preset and sweep l from 0 to 0.250 λ. Watch Z_in stay purely reactive (+jX) and climb from 0 toward ∞, passing +j50 Ω at exactly l = 0.125 λ — then state in one sentence why this makes a piece of shorted cable a designable inductor (and, past λ/4, a capacitor): the stub idea behind the Stubs tab.`
- **hint:** `Keep one eye on the Γ-dial: |Γ| never moves on a lossless line — distance only rotates the phase, two degrees of dial per degree of electrical length.`

## 11. WorkedSteps hoist (prerequisite, separate commit)

Move `src/circuits/components/common/WorkedSteps.tsx` → `src/shared/components/common/WorkedSteps.tsx` (verified: imports only `react` + `@shared/utils/cn` — no circuits deps) and `src/circuits/components/__tests__/WorkedSteps.test.tsx` → `src/shared/components/common/__tests__/WorkedSteps.test.tsx` (target dir verified to exist). Repoint exactly 2 consumers: `src/circuits/components/modules/NodalMesh/index.tsx` and `src/circuits/components/modules/PartialFractions/index.tsx` (`@circuits/components/common/WorkedSteps` → `@shared/components/common/WorkedSteps`) + the test's import. Preserves both invariants (shared imports no domain; transmission never imports circuits). Follows the phase-0 TableOfContents/ErrorBoundary hoist precedent.

## 12. Per-file plan

| File | Action |
|---|---|
| `src/shared/components/common/WorkedSteps.tsx` (+ test) | MOVE from circuits (§11), commit 1 |
| `src/transmission/utils/transmissionMath.ts` | ADD 7 exports (§9), commit 2 (TDD: tests first) |
| `src/transmission/utils/__tests__/transmissionMath.test.ts` | ADD vectors (§9), commit 2 |
| `src/transmission/components/simulations/WalkTheLineSim.tsx` | NEW (§5.4), commit 3 |
| `src/transmission/components/modules/LineImpedance.tsx` | NEW page (§3–§7, §10), commit 4 |
| `src/shared/constants/curriculum.ts` | 2 insertions (§1.1), commit 4 |
| `src/sectionRegistry.tsx` | 1 loader (§1.2), commit 4 |
| `src/shared/constants/__tests__/curriculum.test.ts` | 23→24 ×2 + name (§1.3), commit 4 |
| `src/shared/constants/__tests__/getSectionNumber.test.ts` | transients 5.4 + line-impedance 5.3 (§1.4), commit 4 |
| `src/transmission/components/modules/__tests__/pages.test.tsx` | smoke (§1.5), commit 4 |
| `src/transmission/components/modules/__tests__/lineImpedance.test.tsx` | NEW page test (test plan), commit 4 |
| `src/transmission/components/modules/Transients.tsx` | JSDoc number drop (§1.6), commit 4 |
| `src/transmission/components/modules/TransmissionLines.tsx` | 2 seam edits (§2), commit 5 |
| `src/transmission/components/simulations/SmithChartSim.tsx` | walk slider + 2 readouts + arc (§8), commit 5 |
| `src/transmission/components/modules/__tests__/transmissionLines.test.tsx` | extend: Z_in-at-l readout after smith gate, commit 5 |

## 13. Sequencing & collision avoidance (binding)

1. **Branch AFTER PR #7 (allowSkip default-flip) and PR #8 (ILO9) merge, from updated `main`.** The 23→24 count edits and the `'5.3'`→`'5.4'` expectation exist only post-#8 (verified: this worktree IS the #8+#10 stack); the seam edits to `TransmissionLines.tsx` would textually collide with #7's three hunks if run concurrently. PR #10 has no overlap with any 2A file. If #7 is still open at implementation time: write `allowSkip={false}` explicitly on the new gate and expect cleanup; post-#7: omit the prop (as specced). The page test pins no-Skip behaviorally either way.
2. PR #9 (Playwright screenshot harness) is the roadmap's per-batch entry gate — run the owner visual walk on this unit through it before merge.
3. Commit order = §12 (hoist → math → sim → section+wiring → 5.2 seam + Smith upgrade); each commit leaves the tree green.
4. Full suite on the owner's box: `npm test -- --no-file-parallelism` (vitest OOMs at default forks). Ship via branch + PR through the GitHub REST API (no gh CLI; classifier blocks direct-main pushes).
5. Out-of-scope guardrails honored: no ABCD/two-port (unit 2B), single-stub design recipe deferred with an explicit in-page deferral note (§7.4), lossy = one collapsible paragraph (§4.6), no Smith rebuild — extension of the existing sim only (§8).


---

## Test plan

**Unit (vitest, TDD order):** (1) `transmissionMath.test.ts` — all §9 vectors with hand derivations in comments; oracles: exam task (100, 0, 50, 0.6π) → {26.93, 11.87} ±0.05; λ/8 → {40, −30} exact; λ/4 inversion {25, 0}; λ/2 identity {100, 0} and (80, −20, 50, π) → {80, −20}; short→open Infinity; open→short {0, 0}; stub poles via guards; quarterWave 70.711/61.237; rotateGamma ⅓∠144° = {−0.2697, +0.1959}. (2) Moved `WorkedSteps.test.tsx` passes unchanged from its new shared path.

**Page tests:** (3) NEW `lineImpedance.test.tsx` (clone the verified transmissionLines.test mock boilerplate: katex mock, canvas getContext, rAF, MemoryRouter): open the Z_in Lab tab → gate question (/quarter-wavelength/i) visible, `queryByRole('slider', { name: /distance from load/i })` absent, AND no /skip/i control rendered (pins blocking regardless of the allowSkip default); select "25 Ω — less than Z₀" + Continue → slider present; switch to Electrical Length tab and back → still unlocked (lifted state); set the distance slider to 0.25 via fireEvent.change → Z_in readout shows "25.0 + j0.0 Ω" (default exam load — deterministic, jsdom-renderable since readouts are DOM not canvas); press Short preset, slider 0.25 → readout "→ ∞ (open)"; assert the three CC question texts render across tabs and h1 matches /Line Impedance & Matching/i with the derived number span. (4) `pages.test.tsx` smoke entry. (5) Extend `transmissionLines.test.tsx`: pass the smith gate (existing flow), fireEvent.change the new walk slider to 0.25 → "Z_in at l" readout shows "25.0 + j0.0 Ω" (sim defaults ZLr=100, Z0=50, verified); assert the UP NEXT hook text renders in the Smith tab.

**Wiring tests (mostly self-enforcing):** curriculum.test 24-counts; getSectionNumber transients '5.4' + line-impedance '5.3'; routeIntegrity (registry === ALL_SECTIONS) and the curriculum load-time throws catch any drift; app.test unaffected (no counts).

**Suite invocation:** full run on the owner's 4-core box MUST use `npm test -- --no-file-parallelism` (vitest OOMs otherwise; suite 301+ tests, ILO9 page tests are long-running). Also run `tsc -b && vite build` + lint (jsx-a11y hard-enforced — native range inputs + aria-labelledby keep it clean).

**Manual/visual (owner walk, via the PR #9 Playwright harness as the Phase-2 entry gate):** Γ-dial arrow rotates clockwise as the slider increases; strip-chart traces break (not spike) at short/open; SmithChartSim renders pixel-identically at l = 0 and the arc/marker appear only when l > 0; dark mode on both new SVG/recharts surfaces; keyboard-only traversal of the full GuidedChallenge (slider arrows = 0.005λ steps, Home/End); mobile stacking of LabLayout with the jump anchor.


## File plan
```json
[
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/LineImpedance.tsx",
    "purpose": "NEW section page (id line-impedance, renders 5.3): 4 TabSet tabs (Electrical Length / Z_in Lab 🧪 / Matching / Stubs), lifted gate-unlock state, 3 ConceptChecks, YourTurn, GuidedChallenge, CourseNavigation"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/simulations/WalkTheLineSim.tsx",
    "purpose": "NEW gated bench sim: distance slider (l/λ 0–1), R_L/X_L sliders + presets, SVG schematic + Γ-dial, recharts R/X-vs-l strip chart, 4 ReadoutCards; all physics via transmissionMath exports"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/utils/transmissionMath.ts",
    "purpose": "ADD 7 exported pure functions: calculatePhaseConstant, electricalLengthDegrees, rotateGamma, gammaToImpedance, calculateInputImpedance, calculateStubReactance, quarterWaveTransformerImpedance"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/utils/__tests__/transmissionMath.test.ts",
    "purpose": "ADD hand-verified test vectors incl. the 0.3λ exam task {26.93, 11.87}, λ/8 {40, −30}, λ/4 inversion, λ/2 identity, open/short limits, stub poles"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/shared/constants/curriculum.ts",
    "purpose": "Insert line-impedance into SECTION_LIST (after L84) and PARTS[4].sectionIds (L119)"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/sectionRegistry.tsx",
    "purpose": "Add lazyRetry loader for line-impedance between transmission-lines and transients"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/shared/constants/__tests__/curriculum.test.ts",
    "purpose": "Counts 23→24 at L19/L49 + test name at L18"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/shared/constants/__tests__/getSectionNumber.test.ts",
    "purpose": "L16 transients '5.3'→'5.4'; add line-impedance → '5.3'"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/TransmissionLines.tsx",
    "purpose": "Seam edit A: replace Matching Network Design collapsible (L285–300) with UP NEXT forward hook; seam edit B: one γ cross-ref sentence in lossy collapsible (L119–133)"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/simulations/SmithChartSim.tsx",
    "purpose": "Grafted upgrade: lOverLambda slider (default 0 = today's render), Γ(l) hollow marker + clockwise arc on VSWR circle, Z_in-at-l and 2βl ReadoutCards; _gammaToZL untouched"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/__tests__/lineImpedance.test.tsx",
    "purpose": "NEW page test: gate blocks sim / no Skip control / unlock survives tab switch / slider accessible name / deterministic readout checks / 3 CCs present"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/__tests__/pages.test.tsx",
    "purpose": "Add LineImpedance smoke test (h1 /Line Impedance & Matching/i)"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/__tests__/transmissionLines.test.tsx",
    "purpose": "Extend: after passing the smith gate, 'Z_in at l' readout renders; existing assertions unchanged (verified no dependency on removed collapsible)"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/shared/components/common/WorkedSteps.tsx",
    "purpose": "HOISTED from src/circuits/components/common/ (imports only react + @shared/utils/cn); test moves to src/shared/components/common/__tests__/; repoint NodalMesh + PartialFractions imports"
  },
  {
    "path": "C:/Users/cassi/Documents/GitHub/EM-CA-LAB-wt-ilo9/src/transmission/components/modules/Transients.tsx",
    "purpose": "Cosmetic: drop the hardcoded 'Section 5.3' from the L18 JSDoc"
  }
]

```
