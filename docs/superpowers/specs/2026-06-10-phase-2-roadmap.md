# Phase 2 Roadmap — content depth, UX surface, platform debt

**Date:** 2026-06-10 · **Status:** proposed (owner review)
**Provenance:** 4-agent read-only audit of the post-ILO9 tree (main + PRs #7/#8/#9 state): three agents graded all 12 syllabus ILOs against the actual section code (every claim file-cited, grep-verified); one swept for content/code/tooling debt. Raw findings: session artifacts `gap-audit/{ilos,debt}.md`. Predecessor: `2026-06-06-phase-1-consistency-and-refresh-design.md` (Phase 1 shipped 2026-06-09; ILO9 unit + allowSkip flip + screenshot harness shipped as PRs #7/#8/#9 on 2026-06-10).

## ILO scorecard (post-ILO9)

| ILO | Outcome | Grade |
|----:|---|---|
| 1 | EM radiation mechanisms & wave behavior in media | **partial** |
| 2 | Ampère/Faraday/Lenz/Lorentz with practical examples | solid |
| 3 | Antenna functions & applications | solid |
| 4 | Transmission lines via distributed parameters | **partial** |
| 5 | Inductance in DC circuits; define mutual inductance | **partial** |
| 6 | EMF induction & forces on conductors | **partial** |
| 7 | Formulate & solve magnetic-circuit equations | **partial** |
| 8 | Apply theory, evaluating plausibility of results | **partial** |
| 9 | Systematic circuit analysis (Heaviside & identification) | solid *(new unit)* |
| 10 | Methods for transmission networks | **partial** |
| 11 | Transient phenomena | solid |
| 12 | Voltage/current changes after step inputs | solid |

Nothing is "missing" outright; the seven partials cluster into the content units below.

---

## Track 1 · Content units (priority order)

### 2A — AC line theory: input impedance & electrical length (ILO 4 + 10) — **largest gap**
Phasor/sinusoidal-steady-state line analysis is entirely absent (repo grep for β/γ/tan/attenuation in `src/transmission`: zero pedagogical hits). Students can compute Γ at the load but not what a line *transforms* an impedance into — the standard exam task, and what makes the Smith chart's rotation meaningful.
Build: theory for β = 2π/λ and electrical length βl; the phasor line solution; **Z_in(l) = Z₀(Z_L + jZ₀tan βl)/(Z₀ + jZ_L tan βl)**; λ/4 and λ/2 special cases as ConceptChecks (this finally *derives* the asserted quarter-wave Z_T = √(Z₀Z_L)); shorted/open stub reactance (gives the existing "stub matching" mention its machinery); γ = α + jβ paragraph in the existing lossy collapsible. Lab: "walk toward the generator" — slide an observation point along a mismatched line with live Z_in/βl readout, wired into the existing Smith chart sim. One worked matching design (λ/4 or stub) + YourTurn.
Home: `TransmissionLines.tsx` (5.2). Effort: ~one ILO9-section-sized unit.

### 2B — Two-port parameters (ILO 10)
ABCD/Z/Y/S parameters don't exist anywhere ("transmission *networks*" plural + Nilsson Ch18 expect at least ABCD). Build: ABCD definition, ABCD of a line section, cascade = matrix product, one worked cascade example. Could be a new short section in Part 5 or a chapter inside 5.2/5.1. Effort: medium.

### 2C — Forces on conductors & motional EMF (ILO 6, + ILO 2 polish)
The quantitative half of ILO 6 is absent: **F = IL×B** appears only as a quiz distractor; no parallel-wires force (the classical ampere definition); no motional EMF (Blv rod-on-rails — the canonical example that unifies the whole ILO: moving conductor → EMF → current → opposing force, closing the Lenz energy loop). Also: Lorentz force only ever stated in magnetic form — add **F = q(E + v×B)** + a velocity-selector ConceptCheck.
Homes: lorentz (F=q(E+v×B), F=BIl derivation + motor/loudspeaker example), ampere (parallel wires), faraday (rod-on-rails, interactive or worked). Effort: medium.

### 2D — Mutual inductance, actually defined (ILO 5)
M is *used* but never defined: no **M = N₂Φ₂₁/i₁**, no coupled-coil equations (v₁ = L₁di₁/dt + M di₂/dt …) — the dot-convention prose sets a sign for an equation that's never written; `CoupledCoilsSim` computes M from k circularly (its own caption admits it). Build: "What is M?" theory block in Transformers (flux-linkage definition + coaxial-solenoids numeric example), the coupled equations EquationBox + a v₂ = M di₁/dt ConceptCheck, one flyback/interrupted-current predict-reveal. Effort: small-medium.

### 2E — Plausibility framework (ILO 8) — cheap, cross-cutting
Plausibility checking is practiced incidentally but never *taught*, and the em domain has **zero** "does this make sense?" callouts. Build: (1) one short "How engineers sanity-check answers" block (units, limiting cases, order-of-magnitude) — natural home circuit-theorems or circuit-analysis; (2) a reusable callout pattern ported into coulomb/gauss/ampere/faraday/magnetic-circuits; (3) real SI units for the lorentz + faraday sims (currently "arb. units", which blocks magnitude judgment — ampere/magnetic-circuits already show real readouts); (4) a few "a classmate computed 500 V — what did they miss?" critique exercises. Effort: small per section, rides along with any other unit.

### 2F — Magnetic circuits by hand (ILO 7)
The "solve" verb is delegated entirely to the sim. Build: a pencil-and-paper worked example matching the sim's own toroid (compute ℛ, Φ, B, H; repeat with the 1 mm gap) so students can hand-verify the readouts; an inverse design YourTurn ("what I or N gives B = 1 T?"); a two-material series magnetic circuit (Ida's standard next step). ~~Fix the TheoryGuide line calling H "analogous to voltage (EMF)" — MMF is the EMF analog~~ *(fixed in the quick-wins batch)*. Effort: small-medium.

### 2G — Switched circuits & initial conditions (ILO 11/12 polish)
Every transient in the app starts from zero state. Build: the general first-order recipe **x(t) = x(∞) + [x(0⁺) − x(∞)]e^(−t/τ)** with a switch-at-t=0 worked example (find ICs from the DC pre-state); a continuity-rules callout (i_L, v_C can't jump; 0⁻/0⁺ notation — currently never stated); one hand-worked second-order step where A₁/A₂ are determined from ICs (the solver computes them invisibly today); transmission bonus: plot the source-end V(t) staircase in the bounce chart (data already exists in `transmissionMath.ts calculateBounceVoltages`). Effort: small-medium.

### 2H — Radiation mechanism & real media (ILO 1)
"Accelerating charges radiate" is asserted, never taught. Build: a "why accelerating charges radiate" theory block + field-line-kink animation (oscillating charge, field lines detach into closed loops) in maxwell or antennas; a "waves in real media" subsection in em-wave (attenuation slider visibly damping the envelope; intrinsic impedance; conductor-vs-dielectric) + a two-media interface panel (normal-incidence reflection/transmission worked example — wave reflection currently only exists for lines). Effort: medium (one new animation).

### 2I — ILO 9 stretch (already solid; deepen later)
Dependent sources (absent app-wide; Nilsson treats as core — one worked CCVS nodal example + "when you can't kill the source" test-source escape in circuit-theorems); a third "cold" practice network without precomputed click paths; a supermesh WorkedSteps to match the supernode one; deliver the promised "nodal analysis IS s-domain analysis" payoff (worked s-domain nodal solve with Z_L = sL, Z_C = 1/sC + initial-condition equivalent sources).

### 2J — Antenna depth polish (ILO 3, optional)
G = e_r·D as a proper theory block (today it lives in a distractor explanation); effective aperture + **Friis transmission equation** with a link-budget YourTurn (Ulaby's canonical antenna application).

---

## Track 2 · UX & platform

| Item | Detail | Effort |
|---|---|---|
| **Gamification: surface or stop tracking** | `predictionGatesAnswered/Correct` + `hintsUsed` are written by ~15 sections and read by **nothing**; GuidedChallenge "Mark Complete" doesn't persist; CourseLanding reads no progress at all. Owner decision first; then either a progress surface (landing per-Part completion, prediction accuracy) or delete the dead tracking. | medium |
| **LabLayout docked-bench rollout** | Used by exactly 1 of 23 sections (5.2). Cheapest next: the three ILO9 sections (already LabStation-wrapped). Then per-section opt-ins, owner-walked via the screenshot harness. | small/section |
| **Tabs/TabSet unification** | Dead em `Tabs` deleted in quick wins. Remaining: circuits `Tabs` + transmission `TabSet` are near-clones with duplicate-DOM-id defect and inconsistent keyboard support (TabSet has Home/End; Tabs doesn't) → one shared component with instance-scoped ids. | small |
| **engineering-blue content retint** | ~427 occurrences / 47 files (circuits 190, transmission 149, shared 75, em 9). Mechanical but needs per-Part accent decisions + owner walk. The harness makes the walk cheap — do per-Part batches, screenshot-diff each. | large |
| **e2e harness v1.1** | When pixel-diffing is wanted: `E2E_UNLOCK` skip-click capture pass + a `window.__EMAC_FREEZE__` flag honored by the canvas rAF hooks (prereq for `toHaveScreenshot` baselines). Design already in the harness spec. | medium |

## Track 3 · Tooling & ops

- `vitest css:true` — **deferred deliberately**: collides with PR #9's vite.config hunk; apply right after #9 merges (one line).
- Decommission/redirect the 3 legacy `em-ac-lab-moduleN` Vercel projects (ops, not code).
- AiTutor next step beyond the quick-wins broadening: inject the *current section* id/title into the system instruction (it renders inside Layout; route is available).
- Remove the ILO9 worktree after PR #8 merges (junction first, then `git worktree remove`).

## Sequencing recommendation

1. ~~Quick wins~~ *(this PR: stale Antennas/Module-N prose, AiTutor course-wide broadening, dead code, doc hygiene)*
2. **2A AC line theory** (biggest gap; completes ILO 4 and half of 10) — with **2E plausibility callouts** riding along in every section it touches.
3. **2C forces/motional EMF** + **2D mutual inductance** (completes ILOs 5/6, the Part-2/3 physics debt).
4. **2F magnetic circuits by hand** + **2G switched circuits** (small, finish ILOs 7/11/12).
5. **2B two-ports**, **2H radiation/media**, then the stretch/polish units (2I/2J).
6. UX track in parallel where independent: gamification decision early (it shapes the landing); retint last, per-Part, harness-gated.

**Entry gate per content batch** (unchanged from Phase 1 discipline): build + lint + full suite green, blocking PredictionGate on every new sim, numbers independently re-derived, owner visual walk via the screenshot harness.
