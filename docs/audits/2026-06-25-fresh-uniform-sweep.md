# Fresh uniform correctness sweep — 2026-06-25 (#9 batch 2)

**Why this exists.** Appendix B.1 of `2026-06-21-full-audit.md` mandated that #9 run a *fresh
uniform sweep* of displayed/sim math across all 25 sections rather than treat Appendix A as a
closed checklist (B.1 proved A is non-exhaustive — it missed the capacitor `:32` normalization).
This is that sweep.

**Method.** Run `wf_8d2bb970-dca`, **41 agents / ~2.06M tokens**, read-only against a pristine
worktree at `324579a`: one strict-correctness auditor per section (re-derive every displayed
formula / worked number / unit / ConceptCheck key+distractors / default state / canvas sign
convention / prose claim vs Ulaby·Ida·Nilsson, SI) → an adversarial *refute-by-default* verifier
re-derives each finding from first principles → a completeness critic. **25/25 audited, 0 audit
failures, 29 confirmed.**

**Reconciliation with the live tree.** The sweep ran against pristine `324579a`, which predates the
tier-1 fixes on `track-a/09b-tier1-physics`. It independently **re-confirmed all 19 known
Appendix-A defects as real** (good — validates the fix targets), and flagged 10 "new"; 5 of those
are the polarization (`index.tsx:350/357/377`, Q_CIRCULAR hint) and antenna-ring defects already
being fixed/known (the sweep read the pre-extraction inline copy). That leaves **5 genuinely new
defects** below.

---

## New defects (beyond Appendix A) — feed the next batches

### N1 · [minor/physics] component-physics — `src/circuits/utils/componentMath.ts:82`
Teflon and Paper absolute permittivities are ~13% too high: the author used `εr × 1e-11` instead
of `εr × ε₀` (ε₀ = 8.854e-12). Teflon `2.1e-11` implies εr≈2.37 (should be 2.1·ε₀ = **1.86e-11**);
Paper `3.7e-11` implies εr≈4.18 (should be 3.7·ε₀ = **3.28e-11**). Drives the "Calculated
Capacitance" readout 13% high when those presets are clicked. (Glass `4.0e-11` ≈ εr 4.5·ε₀ is
internally consistent — leave it.) **Test:** assert `materials.find(m=>m.name==='Teflon').permittivity`
`toBeCloseTo(1.86e-11)`; same for Paper.

### N2 · [minor/concept] circuit-theorems — `src/circuits/components/modules/CircuitTheorems/index.tsx:474`
Closing bridge says "the next section builds the transform," but the curriculum order puts
**Switched Circuits** next (which explicitly avoids the transform); Laplace is built two sections
later. Same next-section-bridge class as the known Transformers `:848` defect (A.1#12). **Test:**
assert the prose's "next section" claim against `getNextSection('circuit-theorems')` (= `switched-circuits`).

### N3 · [minor/physics] coulomb — `src/em/sections/coulomb/index.tsx:150`
Field-line arrowheads on **negative-charge-seeded** lines point outward (away from the charge),
opposite the true E direction (E points *into* a negative charge). **Test:** extract
`fieldLineArrowAngle(Ex,Ey,startQ)`; for a `q<0` seed at `(+r,0)` assert the arrowhead unit vector
has negative x (points back toward the origin).

### N4 · [minor/physics] maxwell — `src/em/sections/maxwell/index.tsx:296`
`drawFaraday` induced-E orbit rotates the wrong way for the shown `dΦ_B/dt`
(`angle = t*0.1*(dFlux>0?-1:1)` → should be `?1:-1` with the y-down canvas convention). Lenz/Faraday
handedness reversed. **Test:** extract `faradayOrbitSign(dFlux)` and assert the screen-rotation sign
for `dFlux>0`.

### N5 · [minor/physics] em-wave — `src/em/sections/em-wave/RealMedia.tsx:100`
"Seawater-RF (εr=81)" preset models seawater as a **lossless dielectric** (η₂=η₀/√81 ⇒ Γ=−0.80 ⇒
64% reflected), contradicting the page's own loss-tangent analysis that classifies seawater as a
**good conductor** at RF (≈99.99% reflection). Either relabel to a genuinely lossless high-εr
dielectric, or caption it as the lossless idealization. **Test:** render `MediaInterfacePanel`,
click the preset, assert the reflected-power decision (the readout currently reads "64.0%").

---

## Completeness-critic re-look list (cheap insurance, not "bad audits")

- **polarization — DEEPEST re-look.** The sweep audited the *pre-extraction* inline copy. Now that
  the math is in `polarization/physics.ts`, independently re-derive the **whole** ellipse block
  (ψ, χ, AR, Stokes S0–S3, **handedness**) end-to-end — a section with 3 adjacent confirmed sign/
  reciprocal/hard-code errors is where a 4th hides. Specifically re-verify the handedness sign
  (Lissajous screen-y-flip → δ=+90° → RCP) since a convention hedge sat next to a confirmed `:377`
  sign bug.
- **transmission-lines — second look.** All 4 findings were known-list matches, 0 new on a 3-sim
  section. Independently re-derive the **Smith-chart rotation sign** (`rotateGamma` → −4π·l/λ) for a
  non-special `l` (not just `l=0.25λ`), and verify **StandingWaveQuiz** node/antinode *positions*
  (`|V|=√(1+Γ²+2Γcos2kz)`) for a complex Γ (only real ±1/0.5 magnitudes were checked).
- **circuit-analysis (0 findings, very dense):** spot-check the RLC impulse `h(t)` units and its
  consistency with the step response by actual differentiation (impulse-response normalization is
  where capacitor-style bugs recur).
- **interactive-lab:** the `Tᵈ` modifier-letter glyph (`:540/:778`) is the same defect family as the
  known BounceDiagram `T_D` glyph (A.2#14) — classify consistently in the net, not as cosmetic.

---

*Full machine output (per-defect derivations, all 29 verdicts, full critic): workflow run
`wf_8d2bb970-dca`. Pristine sweep worktree removed after extraction.*
