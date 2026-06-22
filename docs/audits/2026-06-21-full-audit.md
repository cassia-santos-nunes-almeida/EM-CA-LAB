# EM-CA-LAB — Full Post-Restructure Audit (Gate-1 deliverable)

**Date:** 2026-06-21 · **Baseline:** `8c9397a` (working tree byte-identical) · **Branch:** `audit/2026-06-21-full-audit`
**Scope:** read-only audit; **no `src/` changes**. Companion: [`2026-06-21-implementation-ultraplan.md`](./2026-06-21-implementation-ultraplan.md) (the Gate-2 plan).

> **Gate structure.** Gate 1 = approval of the audit approach (granted). Gate 2 = owner approves the
> implementation ultraplan before any `src/` work happens in a separate session.

Evidence base: a 14-agent devil's-advocate panel (design + strategic lenses, each verdict adversarially
re-verified) + an 18-agent audit core (12-ILO re-grade with baseline reconciliation, 4 design mockups,
synthesis). Every material claim was checked against current code and is `file:line`-cited.

---

## 0 · Pinned inventory (resolves the plan's "23 vs 24")

Authoritative count from `src/shared/constants/curriculum.ts`: **25 sections** in a 5-Part circuits-first spine.

| Part | Title | Sections | Domain notes |
|---|---|---|---|
| 1 | Circuit Analysis, Laplace & Transients | 9 (component-physics, circuit-analysis, nodal-mesh-analysis, circuit-theorems, switched-circuits, laplace-theory, partial-fractions, s-domain, interactive-lab) | circuits |
| 2 | Electric & Magnetic Fields | 4 (coulomb, gauss, ampere, lorentz) | em, `expectedChecks:3` |
| 3 | Induction, Magnetics & Inductance | 4 (faraday, lenz, magnetic-circuits, transformers) | em ×3 + transformers code in `transmission` |
| 4 | Maxwell, Waves, Radiation & Antennas | 4 (maxwell, em-wave, polarization, antennas) | em ×3 + antennas code in `transmission` |
| 5 | Transmission Lines & Distributed Systems | 4 (lumped-distributed, transmission-lines, line-impedance, transients) | transmission |

10 EM sections carry `expectedChecks:3` (badge needs 3 ConceptChecks); all others complete on first visit.
`engineering-blue` (recounted, authoritative): **265 occurrences / 58 files** in `src/`.

---

## D1 · 12-ILO coverage re-grade → **clean sweep: all 12 SOLID**

Baseline (2026-06-10): solid {2,3,9,11,12} / partial {1,4,5,6,7,8,10}. **New: solid {1–12} / partial {} / missing {}.**
All 7 promotions verified against shipped Wave-2 code; the reconciler ran `magneticCircuits.test.ts` (14),
`forcesMotionalEmf.test.tsx` + `unitMapping.test.ts` (24) green. No grade is over-generous — every residual
gap is either a concept that *is* taught/worked/assessed but lacks an interactive sim, or enrichment beyond
the ILO's verb.

| ILO | Topic | Grade | Δ | Residual gap (none = grade-safe) |
|---|---|---|---|---|
| 1 | EM radiation & wave behavior in media | **solid** | ↑ | Unit 2H `RealMedia.tsx` shipped the "various media" half (η, loss tangent, skin depth, seawater/copper). Gap: canvas α decoupled from physical α; no oblique/Brewster/dispersion — below-bar for "describe". |
| 2 | Ampère/Faraday/Lenz/Lorentz + EE examples | **solid** | = | None material. Lenz is qualitative-only; its quantitative payoff lives in faraday's rod-on-rails. |
| 3 | Antenna functions & applications | **solid** | = | Gain `G=e·D`/efficiency never *taught* (only a CC distractor `Antennas.tsx:459-460`); verb is "discuss", met. |
| 4 | Transmission lines via distributed params | **solid** | ↑ | Unit 2A `LineImpedance.tsx:339` adds the `Z_in` tan-transform + λ/4 + quarter-wave. Gap: single-stub *design* recipe deferred (`:820`). |
| 5 | DC current change w/ inductance; mutual inductance | **solid** (thinnest) | ↑ | Both clauses taught; `Transformers` `CoupledCoilsSim` live. Gap: `SwitchedRCSim` is RC-only (0 `i_L` refs) → no interactive RL transient. |
| 6 | EMF induction & forces on conductors | **solid** | ↑ | Unit 2D shipped (rod-on-rails, parallel-wire force, F=BIl loudspeaker). Gap: `RodOnRailsFigure.tsx` is a static SVG, not a sim; spec header stale. |
| 7 | Magnetic-circuit equations (flux/H/B) | **solid** | ↑ | Worked Example 1 closes the by-hand gap digit-for-digit (B=4.00 T, H=636.6, L=0.8 H) + sim cross-check. Single-loop-only = enrichment beyond verb. |
| 8 | Apply theory + **evaluate plausibility** | **solid** (weakest) | ↑ | **Top content gap:** maxwell/polarization/lenz carry **zero** plausibility content; em-wave readouts stay arbitrary-unit. Method named once (circuit-theorems), not reinforced at the EM far end. |
| 9 | Systematic circuit analysis | **solid** | = | Oracle-backed (nodal/mesh/theorems/partial-fractions). Strongest evidence tier. |
| 10 | Methods for transmission networks | **solid** | ↑ | Full Ulaby/Pozar set across 4 sections. Single-stub-design deliberately "left on the shelf" (`:820`), formulas taught. |
| 11 | Transient phenomena in circuits | **solid** | = | switched-circuits / s-domain / interactive-lab / transients / partial-fractions. |
| 12 | Voltage/current after step inputs | **solid** | = | Oracle-backed + page tests. Strongest evidence tier. |

**Biggest content gap:** ILO-8 plausibility-evaluation in the EM domain (maxwell, polarization, lenz = grep
count 0; absent from the EM `PlausibilityCallout` import set). Cheapest high-value add in the whole audit:
one ~6-line `PlausibilityCallout` per section + the matching `getAllByText('Does this make sense?')` smoke
assertion, mirroring the ampere/gauss/magnetic-circuits pattern.

Weakest-but-defensible solids (where any future re-audit pressure lands first): **ILO 8** (EM coverage-limited)
and **ILO 5** (no RL interactive bench).

---

## D2 · Design & UX consistency (verdicts + visual mockups)

The devil's-advocate panel's verdicts (all adversarially verified, all held):

| Question | Verdict |
|---|---|
| Bench split-pane everywhere | **KILL** — keep two body shells; unify only the *chrome* |
| Canvas sim inside `LabLayout` | **needs-decision** — spike first (EM uses an incompatible sizing contract) |
| GuidedChallenge → own tab | **No** — keep a persistent ungated sibling; a bare tab is a trap |
| engineering-blue retint | **Defer**; never ship shell-unify without differentiation |
| Migration shape (a vs b) | **(a)** `LabLayout`-inside-`SectionLayout`, per-section; not blanket, not Tabs |
| **Tabs/TabSet unify** | **ALREADY DONE at baseline** (`8873de3`/PR #14) — strike from backlog |

### Mockup 1 · Section-shell strategy (one shared `SectionShell`, two body modes)

**Recommendation:** hoist only the chrome (markVisited + numbered header + `SectionHook` + `CourseNavigation`)
into a shared `SectionShell` that composes **either** a linear body (10 EM sections) **or** a split-pane body
(3 self-contained-sim sections). The two body contracts are **incompatible and must not be merged**:
transmission sims self-measure via `canvas.getBoundingClientRect()` (`useCanvasSetup.ts:33`, portable); the
10 EM sims size via `canvas.parentElement!.clientHeight` inside a `flex-grow min-h-[400px]` column
(`coulomb/index.tsx:247-248,484`) — that **mis-sizes (collapses)** inside `LabLayout`'s content-sized sticky
column, and the e2e net (`distinctColors>2`) passes it **green**. **Pre-work blocker:** `SectionLayout.tsx:6`
imports `MODULES` from `@em/constants/physics` for its default title/subtitle — a shared shell cannot import a
domain; move title/subtitle to props (or `@shared/constants/curriculum`) first.

```
BEFORE — three divergent shells (chrome duplicated 3 ways)
 (a) 10× EM: SectionLayout.tsx  (chrome imports @em domain!  <-- BLOCKER)
     header -> linear body stream { Gate{canvas|controls}, callout, checks, chart, challenge }
 (b) 3× transmission: hand-built <h1> + Tabs[..]; a tab panel = LabLayout split-pane (sticky bench)
 (c) raw-div + LabStation (e.g. SwitchedCircuits): yet another hand-assembled wrapper
 => 3 shells, 3 copies of the same chrome

AFTER — one shared SectionShell (no @em import) + 2 pluggable body modes
 @shared SectionShell: markVisited(id) · <h1> getSectionNumber(id)+title · {body} · CourseNavigation
        |                                    |
   body="linear" (10 EM)               body="split" (3 sim)
   interleaved stream;                 LabLayout: theory(scroll) | bench(sticky)
   EM canvas KEEPS parentElement/      transmission canvas KEEPS getBoundingClientRect
   flex-grow contract (not moved)      contract -> safe in sticky overflow column
 Result: chrome written ONCE; each section keeps the body its canvas contract supports.

REJECTED — bench-everywhere: force EM's interleaved stream + grid-cols-3 sim into a
 minmax(420px,48%) sticky column -> 3 cols become ~140px each (crush) AND parentElement
 height collapses -> sim MIS-SIZES while e2e distinctColors>2 stays GREEN (silent regression).
```

### Mockup 2 · GuidedChallenge placement (persistent sibling, never a bare tab)

In `LineImpedance.tsx` today the challenge is a block after `</Tabs>` (`:864`) while the controls its steps
name (WalkTheLineSim slider/presets) live behind the gate **inside a different tab** (`:502→:524`). Tabs
remounts panels on switch (the reason `unlocked` is lifted above Tabs, `:77-80`) — so a Challenge *tab* would
unmount the very bench its steps drive.

```
BEFORE — challenge as a block after </Tabs> (steps say "open the Z_in Lab tab")
  [Electrical Length][🧪 Z_in Lab][Matching][Stubs]   <- controls one tab-switch away
  ...
  🏆 CHALLENGE: "1. Open the Z_in Lab tab... set the distance slider to l=0..."   (after </Tabs>)

REJECTED — challenge-as-TAB (the trap)
  [..][🧪 Z_in Lab][..][🏆 Challenge]
  🏆 "Drag the distance slider to l=0"  ⌖ ...there is NO slider on this tab (bench unmounted on switch)

AFTER — persistent side panel beside a visible bench (LabLayout split-pane)
  THEORY (scrolls)                 |  BENCH (sticky)  🧪 Walk the Line ●live
   Z_in derivation, worked example  |   Γ-dial · Z_in readout · [==slider l/λ==] · (Exam)(Short)(Open)
   ┌ 🏆 CHALLENGE (ungated) ──────┐ |
   │ 1. set l=0 → 100+j0 Ω        │←─ step text sits BESIDE the exact slider it names
   │ 2. l=0.125λ → 40−j30 Ω [▸]   │ |
   └──────────────────────────────┘ |
  (below lg the panes stack theory→bench; challenge stays directly above the bench)
  One gate (predict-first) reveals the bench; challenge is never re-gated.
```

### Mockup 3 · engineering-blue retint (minimal per-Part chrome accent)

`index.css:44-54` (+`.dark` `:78-87`) **already ships** `--color-part-1..5` tokens, already consumed by
`Sidebar.tsx:50-51` and `CourseLanding.tsx:30-31`. The one chrome surface still hardcoding blue is the
section header (`SectionLayout.tsx:63`, `text-engineering-blue-600`).

```
BEFORE — keep-blue-everywhere (the "AI-generic" risk)
  Sidebar: PART 01..05 all ▎blue   Header (Part 2 · coulomb): [2.1] Coulomb's Law  <- BLUE
  5 physics domains, ONE flat blue = the templated shell the owner rejected.

AFTER — per-Part accent on CHROME ONLY (reuse existing tokens; ~1 file)
  Sidebar (already tinted): P1🟠 P2🔴 P3🔵 P4🟣 P5🟢
  Header: [2.1] Coulomb's Law  <- RED via getPartForSection(id) → var(--color-part-2)
  Gate/body STAY blue (deferred). Blast radius: SectionLayout.tsx:63 only.
  0 PredictionGate edits · 0 new props · 0 literal-blue-class test breaks.

REJECTED — full per-Part retint: thread a Part prop through ~30 PredictionGate sites + audit
  265 occ/58 files + break PlausibilityCallout.test.tsx:15,19 literal-class asserts. 30× surface for body polish.
```

### Mockup 4 · Tabs/TabSet unify → **already shipped, strike from backlog**

Verified: only one `role="tablist"` in the tree (`Tabs.tsx:62`); `grep TabSet` finds only comments (zero
defs/imports); all 9 call sites import the unified `src/shared/components/common/Tabs.tsx`. Both plan defects
were real of the former twins and are **confirmed fixed**: duplicate DOM ids → `useId`-scoped
(`Tabs.tsx:40,69-70,88-89`, regression-tested `Tabs.test.tsx:71-82`); keyboard → arrow/Home/End + roving
tabindex unified (`Tabs.tsx:48-58,71`, tested `:44-69`); controlled-vs-uncontrolled twins resolved by a
superset API (`:11-16,37-46`). **Residual caveat (not a task):** panels remount on switch (`key={activeIndex}`,
`Tabs.tsx:86`) — stateful children (e.g. a `PredictionGate`) must lift state above the Tabs.

---

## D3 · Strategic lenses (devil's-advocate panel)

**SWOT** — strong predict-first spine (leave the gate layer alone, theme around it); 3 canvas-sizing
strategies coexist; **best sequencing = migrate EM sims onto the safe self-measuring hook FIRST, decoupled
from any layout change.**

**Steelman** — the 3-system split is fit-for-purpose, not debt; the blank-canvas bug is already defeated on
both stacks; the app is green at `8c9397a` (~547 tests + paint net) — don't destabilize for speculative
consistency. *(Caveat: "canvas proven in LabLayout" covers only the self-measuring contract.)*

**Premortem (12 mo → failed)** — #1 **content scale outran the test net's ability to catch pedagogical /
physics-correctness regressions** (63 test files assert structure, none assert physics correctness → a wrong
coefficient or KaTeX double-backslash ships green); #2 three+ presentation systems → cargo-cult
unmaintainability; #3 ephemeral gate unlocks → friction-without-memory on refresh/remount.

**Red team (HARM)** — **HIGH: InteractiveLab damping stale-verdict bug** (`resetKey` buckets raw R/L/C on a
coarse log scale while `getCorrectAnswer` recomputes `classifyDamping(ζ)` live vs a frozen selection —
`index.tsx:416-419` vs `:716`); forced re-prediction on slider use = frustration; dead unwinnable
"At the origin" distractor (`SDomainPanel.tsx:38-42`). **Verified CLEAN — do not re-derive:** solveToroid,
partial-fractions residues, em-wave media math, dipole 73 Ω, Lorentz Boris integrator. **The harm is in gate
logic + structure, not the math.**

**Completeness critic** — the e2e net gives a false green on a squished canvas; the chrome-hoist has an
unpriced `@em` blocker; bench rollout can strand the completion badge if a mandatory ConceptCheck moves into a
remounting Tabs panel; no focus-management/aria-live on the gate reveal.

---

## D4 · Synthesis → ranked backlog

See [`2026-06-21-implementation-ultraplan.md`](./2026-06-21-implementation-ultraplan.md). In brief: **9
decision-free safe-wins** (test-net + correctness + the ILO-8 plausibility add) come first, then a
**5-item owner-gated track** sequenced retint-decision → chrome-hoist prework → canvas spike → per-section
`LabLayout` rollout → migrate EM sims to the self-measuring hook. Bench-everywhere stays killed;
GuidedChallenge stays a persistent ungated sibling; tabs-unify is struck as already-done.

### Five biggest gaps for the next build front
1. **Pedagogy** — ILO-8 plausibility coverage in maxwell/polarization/lenz (zero today).
2. **Code/test-integrity** — the safety net can't see the two failure modes the migration will create
   (no bitmap-height assertion; no physics-correctness assertions).
3. **UX/architecture** — chrome triplicated and structurally un-hoistable until the `@em` import is broken.
4. **UX** — predict-first integrity defects shipping green (damping stale-verdict, no a11y on reveal, dead
   distractor, gateless laplace-theory).
5. **UX/content** — em-wave SI retrofit + GuidedChallenge co-location (medium-cost virtual-lab polish).

---

## Methodology & verification
- 32 agents total across two workflows; every decision verdict adversarially re-verified (skeptics caught
  citation/count errors — wrong line numbers, off-by-one, one "all 10 → 9/10" — but **zero verdicts flipped**).
- ILO grades reconciled against the 2026-06-10 baseline; 3 cited test files run green.
- Baseline `git diff --quiet 8c9397a` empty; audit authored on `audit/2026-06-21-full-audit`; **no `src/` changes.**
- Two doc-only discrepancies surfaced (not code gaps): the 2D spec header still reads "implementation NOT
  started" though the code shipped; the em-wave SI retrofit is an explicit deferred NON-goal.

---

## Appendix A · Strict-correctness audit (2026-06-22) — verified defect list

**Why this appendix exists.** Owner directive (2026-06-22): be *strictly correct* on physics / maths / units /
numbers / concepts, and simplify the code without losing functionality or rigor. This appendix is the evidence
layer for the first half — an exhaustive, adversarially-verified defect inventory that feeds safe-win **#9**
(correctness pass + permanent test net) and Track C (safe simplification) in the companion ultraplan.

**Method.** A 4-phase workflow (run `wf_b5656d27-cc1`, **39 agents**, ~2.1M tokens): one rigorous auditor per
section enumerates and recomputes *every* formula / worked example / unit / ConceptCheck answer **and** distractor
/ PredictionGate rule / simulation-math / prose claim against Ulaby, Ida, Nilsson & Riedel, SI throughout; **every
reported defect is then independently re-derived from first principles (with units; sympy where algebraic) by an
adversarial verifier** that confirms or refutes it; a completeness critic flags shallow checks; synthesis dedups.
Read-only — **no `src/` changes**. (The first attempt, `wf_ad494dba-25b`/`wf_b5656d27-cc1` initial pass, lost 13
audits + 4 verifies to a sustained Anthropic 529 overload; resumed from journal — 12 good audits cached, the
17 failures + critic + synthesis re-run on the complete 25-section set.)

**Result.** 25/25 sections audited. **30 raw defects → 29 confirmed, 1 refuted.** Verifier-adjudicated severity:
**0 critical · 12 major · 17 minor.** All pinned core solvers (solveToroid, cover-up residues, media math,
dipole 73 Ω, Boris) re-confirmed clean — every confirmed defect sits in a **call-site, displayed formula,
ConceptCheck keying, default control state, sim sign/label, or prose claim**, never in the verified algorithms.

> **Count reconciliation (strict correctness applied to our own reporting).** The synthesis agent self-reported
> "30 confirmed (10 major / 20 minor)" while also stating the 1 antennas claim was *excluded* — internally
> inconsistent (30 raw − 1 refuted = 29; and its own `topPriorities` lists 12 major-class items). Mapping each of
> the 30 raw defects to its verifier's `correctedSeverity` is authoritative: **29 confirmed (12 major + 17 minor),
> 1 refuted.** The lone auditor-major the verifier *downgraded* (RLC natural-response card, A.2 #1) is in the minors.

### A.1 · Confirmed MAJOR defects (12) — the must-fix core of #9

1. **[math]** `circuits/.../TimeDomain/index.tsx:275` (circuit-analysis) — RC step-response current `I(s)` middle
   form is printed `V_sC / [s(RCs+1)]`, carrying a **spurious factor of s** (units A·s², and it inverse-transforms
   to an extra non-decaying DC term that contradicts the section's own next step). **Correct:**
   `I(s)=V_sC/(RCs+1)=(V_s/R)·1/(s+1/RC)`. *(sympy-verified; the s cancels.)*
2. **[math]** `circuits/.../TimeDomain/index.tsx:537` (circuit-analysis) — RLC step-response `V_C(s)` is printed
   `V_s/(s²LC+sRC+1)`, **missing the factor of s**. Final-value theorem on the printed form gives `V_C(∞)=0`, but a
   capacitor under a step charges to `V_s`. **Correct:** `V_C(s)=V_s/[s(s²LC+sRC+1)]`. *(sympy + FVT verified; line
   538 already prints the correct form.)*
3. **[math]** `circuits/.../InteractiveLab/index.tsx:108` (interactive-lab) — RL impulse S-domain transfer printed
   `H(s)=(R/L)/(s+R/L)` is **off by a factor of R** from the displayed `i(t)=(1/L)e^{-Rt/L}` (it is actually the
   dimensionless v_R/v_in transfer — wrong quantity *and* units under a "Current" heading). **Correct:**
   `H(s)=(1/L)/(s+R/L)`. (The parallel RC block is internally consistent, confirming RL is the outlier.)
4. **[physics]** `em/sections/lenz/index.tsx:354` (lenz) — the F_mag braking-force arrow points the **wrong way over
   the left half** of the canvas (the default/primary interaction region; magnet starts at pos 20, GuidedChallenge
   drags from the left). `sign(fLen)` depends on the magnet's side via `intensity`, so it only opposes velocity when
   the magnet is right of the coil. **Fix:** `fLen = -Math.sign(v)*Math.min(Math.abs(intensity)*10,150)` (depend on
   v only). Currently contradicts the on-canvas velocity arrow and the REPULSION/ATTRACTION label.
5. **[conceptcheck]** `em/sections/lenz/index.tsx:42-47` (lenz) — `Q_RING_DIR` is **double-keyed**: option 2
   ("Clockwise, to oppose the decrease in flux", correct) and distractor option 0 ("Clockwise, to maintain the flux")
   specify the **same correct direction with physically-equivalent Lenz reasoning**, yet option 0 is graded wrong.
   Make option 0 unambiguously incorrect (wrong direction or a wrong cause).
6. **[physics]** `em/sections/polarization/index.tsx:355-356,381` (polarization) — the displayed axial ratio is
   `AR=|tan χ|`, the **reciprocal of the standard** `AR=|cot χ|` (Ulaby/IEEE 145); shows `0.375` where the true AR
   is `2.667`, with a **false ~0→∞ discontinuity** (linear hard-coded to Infinity while near-linear tends to 0).
   **Correct:** `AR=|cot χ| ∈ [1,∞)`.
7. **[math]** `em/sections/polarization/index.tsx:349-351` (polarization) — orientation-angle special case forces
   `ψ=45°` when `ex==ey`, which is **off by 90°** when `cos δ<0` (ψ should be −45°/135°; reachable via Circular
   quick-set → drag δ to 135°). **Fix:** drop the special case; the general `ψ=0.5·atan2(2·Ex·Ey·cos δ, Ex²−Ey²)`
   branch is already correct (degenerate only at the exact circle).
8. **[physics]** `transmission/.../TransmissionLineSim.tsx:166-169` (transmission-lines) — in **sinusoidal mode** the
   labeled "Incident" wave animates **toward the source** and "Reflected" **toward the load** (both reversed),
   because the incident wave is coded `sin(k·pos + ωt)` (a −x wave). Inconsistent with the same component's STEP
   mode, which propagates source→load correctly. **Fix:** `sin(k·pos − ωt)` and `γ·sin(k·(2L−pos) − ωt)` (preserves
   `ref=γ·inc` at the load). Standing-wave envelope, nodes/antinodes, Γ/VSWR readouts are unaffected.
9. **[physics]** `transmission/.../BounceDiagram.tsx:160-165` (transients) — the steady-state guard only fires for
   `Γ_L·Γ_S→+1`; it reports a **finite Vss for the non-converging `Γ_L·Γ_S=−1` case** (e.g. `Γ_L=+1, Γ_S=−1` →
   sustained 10/20/10/0 V oscillation, but displays `Vss=10.00 V`). Sliders reach exactly ±1.00. **Fix:** guard on
   `|Γ_L·Γ_S| ≥ 1`, returning the "∞ (unstable)" indication.
10. **[label]** `transmission/.../RadiationPatternSim.tsx:97-101` (antennas) — the numeric polar-angle ring is
    **inverted vs the antenna θ convention** (broadside max sits at the 0° tick, axis null at 90°), contradicting the
    section's own "θ=0 is along the axis" teaching and ConceptCheck. The qualitative lobe shape and the text labels
    ("Antenna axis"/"Broadside") are correct; only the numeric scale is wrong. Relabel (θ=90° broadside, 0°/180°
    nulls) or remove the ring.
11. **[units]** `circuits/.../ComponentPhysics/index.tsx:47` (component-physics) — default `capacitorArea=0.01 m²`
    (100 cm²) is **outside the Plate-Area slider range** (0.5–10 cm²): the opening "88.54 pF" reading is unreachable
    and capacitance drops **~10×** the instant the slider is touched. **Fix:** set default to `1e-4 m²` (1 cm²,
    → 0.885 pF, consistent) or widen the slider max to 100 cm².
12. **[concept]** `transmission/.../Transformers.tsx:848-853` (transformers) — bridge callout promises the
    transmission line as the **immediate next section**, but the live spine puts **Maxwell's Equations (4.1)** next
    (transformers is 3.4, last of Part 3) and the transmission-line sections four later in Part 5; the page's own
    "Next" button goes to Maxwell. **Fix:** reword to "Later, in Part 5, …" (also review the stale "Part 5's
    distributed world" phrase at line 482) or re-sequence the section.

### A.2 · Confirmed MINOR defects (17)

1. **[physics, downgraded major→minor]** `circuits/.../TimeDomain/ResponseComparisons.tsx:32` — RLC natural-response
   card `v(t)=e^{-αt}(A₁e^{s₁t}+A₂e^{s₂t})` **double-counts the decay** when `s₁,s₂` are the full poles (as defined
   at `index.tsx:551` and used in `componentMath.rlc.overdamped`). Use `A₁e^{s₁t}+A₂e^{s₂t}` **or**
   `e^{-αt}(A₁e^{βt}+A₂e^{-βt})`, β=√(α²−ω₀²) — one consistent convention.
2. **[concept]** `circuits/.../ComponentPhysics/InductorSection.tsx:80` — "Core Materials" presets resolve to
   Copper/Aluminum/Silver (μ_r≈1, two diamagnetic); misleading as magnetic cores. Restrict to Air + Iron/ferrite.
3. **[units]** `circuits/.../ComponentPhysics/InductorSection.tsx:93` — Iron-core preset μ=6.3e-3 H/m pegs the
   permeability slider at max (range μ·1e6∈[1.257,10], ~630× over); readout and L stay correct. Widen/log-scale.
4. **[physics]** `circuits/.../InteractiveLab/challenges.ts:42` — "Make it Ring" requires ζ<0.3 (R<~19 Ω) but the
   hint says "below 30 Ω" (ζ=0.474 there) — following the hint never wins. Change the hint to "~19 Ω".
5. **[units]** `circuits/.../InteractiveLab/index.tsx:516` — impulse-mode Y-axis stays "Voltage (V) / Current (mA)",
   but impulse responses carry an extra 1/time (V/s, A/s). Relabel when Input=Impulse.
6. **[concept]** `circuits/.../InteractiveLab/index.tsx:283-295` — FirstOrderAnalysisPanel shows "reaches 63.2% of
   final value" even in impulse mode (a decay to 0 with no final value; t=τ is 36.8% of the *peak*). Gate to step
   mode or reword.
7. **[physics]** `transmission/.../LineImpedance.tsx:292-293` — RG-58 loss aside "~20 dB/100 m" at 1 GHz is ~4× low
   (real ~70–100 dB/100 m; theoretical floor ~35). Prose-only, point holds; fix the figure to ~80 dB/100 m.
8. **[physics]** `transmission/.../LadderAnimation.tsx:129-131` (lumped-distributed) — default props give wave speed
   **exactly c** (3.00e8 m/s), contradicting the same section's YourTurn ("a real coax is below c due to the
   dielectric", v/c=2/3). Pick defaults with v<c (e.g. totalC=2.25e-12 → v≈2e8). Formula `v=1/√(L'C')` is correct.
9. **[conceptcheck]** `transmission/.../LumpedDistributed.tsx:345-347` — distractor explanation ("used L'/C' not √")
   implies 2500 Ω, not the offered 25 Ω; the item is still winnable (answer 50 Ω uniquely correct). Change distractor
   to 2500 Ω or reword.
10. **[math]** `em/sections/polarization/index.tsx:376` — Linear-state "Slope = ey/ex" is always positive; at δ=180°
    the true slope is −ey/ex. Carry the sign via `sign(cos δ)·ey/ex`.
11. **[concept]** `em/sections/polarization/index.tsx:49` — Q_CIRCULAR tier-2 hint uses `Ey=E0cos(ωt−δ)` vs the
    panel's +δ convention; harmless (answer 90° unaffected) internal-convention inconsistency. *(Verifier corrected
    the auditor's tier-3 characterization; the real mismatch is hints vs the equation panel at line 370.)*
12. **[label]** `circuits/.../SDomainAnalysis.tsx:386` (s-domain) — H1 reads "S-Domain Theory" vs
    curriculum/sidebar/nav "s-Domain Analysis" (`pages.test.tsx:123` pins the divergence). Unify the title (and the test).
13. **[conceptcheck]** transformers / `shared/constants/curriculum.ts:75` — transformers `expectedChecks:0` but 3
    ConceptChecks render. **Verifier note: this is the documented keep-0-for-non-EM design rule, not drift** — every
    non-EM section uses 0, only EM-domain uses 3; all 3 checks are physically correct. Owner-decision metadata only,
    not a physics defect.
14. **[label]** `transmission/.../BounceDiagram.tsx:367` — canvas time-tick uses `U+1D30` (MODIFIER LETTER CAPITAL
    D) → renders "Tᴰ" (raised) vs the subscript "T_D" used in prose/formulas/axis label everywhere else. Use a
    subscript glyph.
15. **[label]** `transmission/.../TransmissionLineSim.tsx:456-460` — frequency-slider centre tick labeled "1 GHz",
    but the true log-midpoint of exp 6..10 is **100 MHz** (exp 8). Fix the centre label.
16. **[concept]** `transmission/.../TransmissionLines.tsx:99` — "100 Ω — differential pair (Ethernet, USB)": USB
    differential is **90 Ω**, not 100. Drop USB from the 100 Ω entry or note 90 Ω.
17. **[label]** `transmission/.../TransmissionLineSim.tsx:466-469,492` — the same value (free-space λ, VF=1 assumed)
    is labeled "Free-space wavelength λ₀" in one readout and "Wavelength λ" in another. Use one consistent label.

### A.3 · Refuted (1) — kept for transparency

- **antennas `Antennas.tsx:73`** — claim: GuidedChallenge step 5's single-lobe boundary is wrong. **REFUTED.** The
  verifier numerically scanned `F(θ)=|cos(kL·cosθ)−cos(kL)|/sinθ`: the pattern is single-lobe up to and including
  **1.00 λ**; side lobes **first appear at 1.05 λ** (interior null at θ≈25.2°). So step 5's "single-lobe to ~1.00 λ,
  directivity largest there" is **correct on both counts**, and the auditor's proposed "fix" would itself introduce
  an error. Excluded from the defect list. (Directivity/R_rad cross-checks: D(0.5λ)=1.641=2.15 dBi, R_rad=73.1 Ω — match.)

### A.4 · Completeness-critic follow-ups (recorded; mostly resolved in-pass)

- The critic caught that the lenz auditor **misattributed which ConceptCheck it checked** → the deeper look found the
  Q_RING_DIR double-key (now A.1 #5). The antennas deeper look produced the refuted A.3 item (pattern re-verified clean).
- **interactive-lab gate**: resetKey-vs-live-`classifyDamping` mismatch = the known **damping stale-verdict bug**
  (already Track-A safe-win **#3**; the audit independently re-confirms it).
- **Cross-cutting — ConceptCheck distractor independence** is the single highest-yield under-covered item type (the
  lenz double-key proves one slipped through). Directional/sign CCs deserve a dedicated per-distractor pass:
  **faraday** (5 CCs, motional-EMF sign), **ampere** (RHR/parallel-current — spot-confirmed unique), **lorentz**
  (4 force-direction), **polarization** (handedness). → folds into #9's ConceptCheck-keying assertions.
- **Cross-cutting — canvas-sim sign/direction conventions** for low-formula "qualitative" sections (lenz, antennas)
  need from-scratch RHR re-derivation, not self-consistency arguments. → #9 should assert sim sign conventions.
- **Methodology** — weight coverage by worked-example / ConceptCheck depth, not raw formula count (TimeDomain
  reports 126 formulas but only 3 worked examples carry recomputable numbers).

### A.5 · Simplification opportunities (deduped; each **net-first** per the directive)

Each ships only after #9's correctness/units net covers the touched code (per the ultraplan "net before refactor"
rule) and must stay green on the full unit suite + e2e. Tag = the test that must exist first.

- **TimeDomain `index.tsx:275/:537`** — once the s-domain transcription errors are fixed, the 3-form chain is
  redundant; keep `(V_s/s)/(R+1/sC)` + the final cover-up form. *(NET: pin the displayed `I(s)`/`V_C(s)` strings.)*
- **`ResponseComparisons.tsx:32`** — align the RLC natural-response card with `componentMath.rlc.overdamped/
  underdamped` (already imported) instead of a third hand-written form. *(NET: assert card matches componentMath.)*
- **polarization `index.tsx:349-351` & `:356`** — deleting the `ex===ey` ψ special case fixes the orientation bug
  **and** removes special-case code; fixing AR to `|cot χ|` lets Linear become a natural χ→0 limit, removing the
  hard-coded `Linear ? Infinity` branch. *(NET: ψ tests for ex==ey/cos δ<0, AR tests for linear/elliptical/circular.)*
- **lenz `index.tsx:354`** — the force-arrow fix is also simpler; reuse the existing `(v·dNorm)<0` value (computed at
  `:315`) instead of recomputing `isRepulsion` at `:353`. *(NET: directional assertion F_mag opposes v on both halves.)*
- **component-physics `InductorSection.tsx:92-98`** — the hardcoded Iron-Core preset duplicates the Iron entry in the
  shared `materials` array (`componentMath.ts:79`); source it from `materials`. *(NET: assert every preset value lies
  within / is explicitly handled by its slider range.)*
- **s-domain `SDomainAnalysis.tsx:343`** — extract a `formatPole(p)` helper + a shared stability-label constant.
  *(NET: fix the H1 title, keep the pole-label test green.)*
- **coulomb** — the µC→C conversion (`Math.abs(q*1e-6)`) is duplicated across chart prep, the 2-charge label math,
  and `getNetField`; one tiny helper removes it. Add a comment that the on-screen arrow length is display-only.
- **transients `BounceDiagram.tsx`** — it reimplements `zsFromGamma`/`initialVoltage`/`steadyStateVoltage`/bounce
  recursion locally, duplicating `calculateBounceVoltages`/`calculateSteadyStateVoltage` (currently test-only) in
  `transmissionMath.ts`; consolidate and fix the `|Γ_L·Γ_S|≥1` guard once there. *(NET: marginal-stability test
  Γ_L=+1/Γ_S=−1 ⇒ ∞ in transmissionMath.)*
- **transmission `ReadoutCard`** — `TransmissionLineSim.tsx:504-524` and `SmithChartSim.tsx:548-568` are
  byte-identical → hoist to one shared component; `SmithChartSim._gammaToZL` duplicates exported `gammaToImpedance`
  (share a core, apply the 500-Ω click clamp at the call site). *(NET: keep transmissionMath tests + wave-dir fix.)*
- **NodalMesh** — 3 copies of `verticalZigzag` / 2 of `horizontalZigzag` across Bridge/Mesh/Supernode diagrams →
  one shared circuit-SVG util (page tests cover rendered values).
- **em-wave `index.tsx:980-981`** — `kVal` is derived from the already-rounded λ string (double rounding); compute
  from `(2πf·n)/300` directly (already at `:1219`); fold the duplicated sinusoid loops into one pass. *(Cosmetic;
  30+ mediaMath tests cover it.)*
- **lorentz** — harmonize the two cyclotron-radius ∞ guards (`Beff>0.01` vs `bMt===0`) to one threshold; standardize
  on `r=mv/(|q|B)` throughout. *(Cosmetic; both safe today.)*
- **interactive-lab** — overdamped auto-duration uses τ=2L/R (the envelope constant), which frames the response
  before the slower real pole settles; consider the dominant pole for overdamped. Format L in mH / C in µF in the
  displayed √(L/C). *(Informational; the envelope constant is genuinely 2L/R — not a defect.)*
- **antennas `RadiationPatternSim.tsx:104-152`** — drop the stale contradictory angle-mapping comments and the unused
  `const theta = phi`. *(NET: fix the inverted ring + add a label/orientation assertion first.)*
- **line-impedance `LineImpedance.tsx`** — `STUB_BETA_PER_LAMBDA=calculatePhaseConstant(1)=2π` then ×l could call
  `calculateStubReactance(1, 2πl, kind)` directly. *(Harmless indirection; no correctness impact.)*

> **Out-of-scope metadata notes surfaced (not physics defects, owner-decision only):** several non-EM sections
> render more ConceptChecks than their `expectedChecks` count (transformers 3 vs 0, nodal-mesh 3 vs 0, maxwell fires
> 6 events vs 3, gauss/faraday gating) — this is the documented "EM sections target 3, everything else completes on
> first visit (0)" rule, intentional, and physics-clean. Listed for owner awareness, not for #9.

---

## Appendix B · Gate-2 decision-panel review (2026-06-22)

**Why this appendix exists.** Before acting on Appendix A + the ultraplan, the owner asked for the whole Gate-2
package to be stress-tested as a multi-agent panel. Run `wf_cbf7b4be-bdf`, **22 agents**: five independent
lenses (devil's-advocate, SWOT, premortem, steelman, red-team — each grounded in `src/`, not the plan alone) →
a disagreement-mapper → **15 decision-critical claims, each independently verified against the code** → a
synthesis. **0 of the 12 majors and 0 of the 15 claims were refuted** (5 confirmed, 10 "partly" — the nuance
generally strengthened the finding or added a correction). Verdict: **GO, with a re-shaped Track A and a
tightened Track B.** Analysis only; no `src/` changes. The net-before-refactor spine and the killed
bench-everywhere call were both **confirmed correct**.

### B.1 · Audit-missed defect (proves Appendix A is not exhaustive)

- **[major/units] component-physics · `CapacitorSection.tsx:32`** — the plate-SVG normalization
  `areaNorm = (area - 0.005) / (0.10 - 0.005)` uses a divisor range `[0.005, 0.10] m²` that is **~100× the real
  Plate-Area slider range** (`[5e-5, 1e-3] m²`); the `:31` comment itself mislabels the units. Result:
  `areaNorm` is **negative across the entire slider**, so the plate drawing is frozen at its ~35 px floor and
  never responds to the control. This is a **distinct, second defect** in the same file as A.1 #11 — so #11's
  one-line default-area fix is **incomplete**: also fix the `:32` normalization to the real slider range, and add
  a test that plate height varies monotonically across the slider (not merely that the default reads 0.885 pF).
  **Implication:** #9 must run a *fresh uniform sweep* of displayed/sim math, not treat Appendix A as a closed
  checklist — especially the 12 sections whose audits were resume-cached.

### B.2 · Fix-scope corrections (audit-recommended fixes the panel caught as wrong or incomplete)

| Item | Audit said | Panel correction (verified vs code) |
|---|---|---|
| **#8 laplace gate** | "zero gates today; add a `PredictionGate`" | laplace-theory **already ships a blocking gate** (`LaplaceMotivation.tsx:24-123`). Real work = fix its **Tabs-remount re-lock** (`initialPassed`/`onPassed`, lift state above the tab). Do NOT add a second gate. |
| **#9-item-9 bounce guard** | "consolidate onto `transmissionMath.ts` + fix the guard there" | **Fix-the-wrong-file trap.** The component renders its **own local γ-space `steadyStateVoltage`** (`BounceDiagram.tsx:160-165`, called `:223`) — it does **not** import the util, which is test-only *and* mis-handles the marginal case. Fix the guard (`|Γ_L·Γ_S|≥1`) in the rendered function; assert via the **rendered readout**. |
| **#10 antennas ring** | major; relabel | Correct that it's **relabel-only** — but the existing test (`transmissionMath.test.ts:280-293`) pins pattern **values, not ring labels** = **false-green**. New test must assert the **rendered tick placement**. Never touch `plotX/plotY`/`calculateRadiationPattern` (would rotate a correct lobe). |
| **#11 capacitor default** | one-line default change | **Incomplete** — see B.1; also fix the `:32` SVG normalization. |
| **#5 PredictionGate a11y** | "focus the revealed heading" | No-ops on ~30 canvas call sites (no heading) and would **steal focus on every Tabs switch**. Focus a `tabIndex=-1` reveal wrapper + aria-live, **gated to the Continue/Skip transition only**, not the `initialPassed` remount path. |
| **lenz Track-C dedup** | "reuse the `(v·dNorm)<0` value at `:315`" | **Won't compile** — `:315` is block-scoped to the live-equation block. Fix `fLen:354` alone first; hoist the shared boolean later as a separate net-guarded edit. |

### B.3 · Severity re-bucketing

The "12 major" label mixes incommensurate harm. Triage in two tiers — **(1) wrong physics/math a student
ingests:** A.1 #1,#2,#3 (s-domain transfers), #4 (lenz force direction), #5 (lenz double-key), #6,#7
(polarization AR/ψ), #8 (reversed wave) — fix first, highest bar; **(2) wrong label / default / prose:** #10
(antenna ring), #11 (capacitor default), #12 (transformers prose) — fix, lower urgency. **Promote A.2 #1** (RLC
natural-response `e^{-αt}(A₁e^{s₁t}+A₂e^{s₂t})` double-counts decay when s₁,s₂ are the full poles) **into tier 1**
— it is the same class as #1/#2 (a printed closed-form that's wrong), mis-filed as minor.

### B.4 · Adopted reshaping

The structural changes (split #9→#9a/#9b with red-before-green; #2 as first-merge hard gate; fresh uniform
sweep; Track B led by the #14 re-architecture with #13 optional; re-estimate #10/#14 upward) are folded into the
ultraplan's "Panel-review reshaping (2026-06-22)" section.

### B.5 · Owner decisions taken (2026-06-22)

- **Retint → FULL "engaging, not AI-generic" redesign** (owner override of the panel's minimal-accent
  recommendation; a mockups-first design workstream). See ultraplan #11.
- **#13 split-pane bench → kept in the plan, decided at Gate-2** (not cut).
- Open for Gate-2: Track B approval + scope, #14/#12 re-estimate sign-off, ILO9/badge check, and the panel's
  open questions (a curriculum `description` field for the subtitle migration; relabel-vs-remove the antenna
  ring; #4 distractor delete-vs-replace).
