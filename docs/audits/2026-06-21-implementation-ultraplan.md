# EM-CA-LAB — Implementation Ultraplan (Gate-2 deliverable)

**Date:** 2026-06-21 · **Baseline:** `8c9397a` · Companion: [`2026-06-21-full-audit.md`](./2026-06-21-full-audit.md)

> **This plan is the Gate-2 decision artifact.** Nothing here is built until the owner approves it. The
> safe-wins need no decision and can start immediately on approval; the owner-decision track needs explicit
> sign-off (and is sequenced so its dependencies are correct).

**Executive summary.** All 12 ILOs grade **solid** at baseline, so the next front is a quality/consistency/
UX-integrity push, not a coverage rescue. Highest-value content gap: ILO-8 plausibility coverage in the EM
domain (maxwell/polarization/lenz = zero). Biggest structural risks are infrastructural: the e2e paint net
can't detect a mis-sized canvas, the section chrome is triplicated with the shared-shell hoist blocked by an
`@em` import, and no test asserts physics/coefficient correctness. Sequence: all safe-wins first (test net +
correctness), then the owner-gated retint/migration track ordered **retint-decision → canvas spike →
per-section LabLayout rollout**. Bench-everywhere is killed; GuidedChallenge stays a persistent ungated
sibling; **tabs-unify is already done at baseline and is struck from scope.**

---

## Standing principles (owner directive, 2026-06-22)

These apply to **every** item below, including the safe-wins.

1. **Strict correctness is non-negotiable.** Every formula, numeric worked example, unit / dimensional
   consistency, ConceptCheck answer *and* distractor, prediction-gate correct-answer rule, simulation math,
   and conceptual/prose claim must be rigorously correct — verified against Ulaby/Ida/Nilsson and first
   principles, not assumed. Nothing is "probably fine."
2. **Simplify wherever possible — safely.** Remove duplication and dead code, consolidate divergent patterns,
   cut incidental complexity — but **only** when the change preserves every existing behavior *and* the
   physics/maths rigor, **proven by tests, not assumed**. Do **not** add functionality.
3. **Hold the bar.** No lazy or "safest-quick" fixes, no symptom-patching, no leaving a known-questionable
   thing because it's faster. Root-cause everything; verify before claiming done.

> **Net before refactor (hard sequencing).** The audit proved the suite asserts structure but **no** test
> asserts physics correctness — so any simplification done *before* a correctness/units test net exists is
> precisely the unreliable shortcut principle 3 forbids. Therefore #9 (correctness pass + permanent net) is a
> prerequisite for **all** of Track C (simplification).

A comprehensive correctness audit — every formula / unit / ConceptCheck / gate / sim-math / prose claim across
all 25 sections vs Ulaby/Ida/Nilsson, each reported defect independently recomputed — is **COMPLETE** (2026-06-22,
run `wf_b5656d27-cc1`, 39 agents). **Result: 30 raw → 29 confirmed (0 critical · 12 major · 17 minor), 1 refuted.**
The full verified list (location → problem → recomputed correct value, each adversarially re-derived) is in
[`2026-06-21-full-audit.md` Appendix A](./2026-06-21-full-audit.md#appendix-a--strict-correctness-audit-2026-06-22--verified-defect-list).
The 12 majors are the must-fix core of #9 below; the deduped simplification opportunities (A.5) populate Track C.
All pinned core solvers re-confirmed clean — every confirmed defect is in a call-site, displayed formula,
ConceptCheck keying, default control state, sim sign/label, or prose claim.

## Panel-review reshaping (Gate-2 decision board, 2026-06-22) — folded in

A 5-lens decision board (run `wf_cbf7b4be-bdf`, 22 agents: devil's-advocate / SWOT / premortem / steelman /
red-team, each grounded in `src/`; 15 decision-critical claims independently verified — **0 of the 12 majors and
0 of the 15 claims refuted**) stress-tested this plan. Verdict: **GO, with a re-shaped Track A and a tightened
Track B.** Full record: [`2026-06-21-full-audit.md` Appendix B](./2026-06-21-full-audit.md#appendix-b--gate-2-decision-panel-review-2026-06-22). The changes below are **adopted**:

1. **Split #9 → #9a then #9b.** #9a authors the correctness net asserting the CORRECT values (lands **RED**
   against today's code); #9b applies the 29 fixes to turn it green. **Never fix-then-assert** — the output
   layer is entirely untested, so a typo in a "correction" ships green exactly like the original bug.
   Red-before-green is a **merge requirement**, and the net asserts the **call-site binding** (rendered string /
   chart input == solver output), not just the solver.
2. **#2 (bitmap-height e2e net) is the FIRST merge and a HARD gate** on #12/#13/#14 — baseline the *correct*
   height before any canvas change (deriving it afterward would baseline the bug).
3. **Appendix A is NOT exhaustive.** The panel found an audit-missed defect (capacitor plate-SVG normalization,
   Appendix B.1), so #9 runs a **fresh uniform sweep** of displayed/sim math — especially the 12 resume-cached
   sections — not a closed checklist.
4. **Severity re-bucket** (Appendix B.3): tier 1 = wrong physics/math a student ingests (#1,#2,#3, #4-arrow,
   #5-doublekey, #6,#7, #8-wave) fixed first; tier 2 = wrong label/default/prose (#10,#11,#12). **Promote A.2 #1
   (RLC decay double-count) into tier 1** — same class as #1/#2, mis-filed as minor.
5. **Fix-scope corrections** (audit fixes the panel caught as wrong/incomplete — full table in Appendix B.2):
   #8 = fix the EXISTING laplace gate's remount re-lock, NOT add a gate; #9-bounce = fix the function the
   COMPONENT renders (`BounceDiagram.tsx:160-165` local γ-space copy), not the test-only util; #10 = relabel-only
   (existing test pins pattern values, not ring labels = false-green); #11 = the one-line default fix is
   INCOMPLETE (also fix the `:32` SVG normalization); #5 = focus a `tabIndex=-1` reveal wrapper + aria-live
   gated to the Continue/Skip transition; lenz Track-C "reuse `:315`" won't compile (block-scoped).
6. **Track B reshaped:** **#14 leads** — it is a **10-sim re-architecture, not a hook swap** (EM sims hardcode
   `parentElement.clientHeight` inline, e.g. `coulomb:247-248`, and the self-measuring hook adds devicePixelRatio,
   changing the coordinate space every draw routine assumes); it retires the canvas-mis-size risk class. **#13
   bench-rollout → optional follow-on.** Re-estimate #10 and #14 **above** their current tags.

**Owner decisions taken this session (2026-06-22):**
- **Retint → FULL "engaging, not AI-generic" redesign** (owner overrode the panel's minimal-accent option). A
  real design workstream — **visual mockups FIRST** (owner's durable preference), touching gate/body/sim chrome,
  not a 1-file accent. Interacts with #10 (both touch `SectionLayout`); supersedes the "full retint rejected"
  line in §"NOT in scope".
- **#13 split-pane bench → kept in the plan, decided at Gate-2** (not cut). The panel's "optional once #14 lands"
  view is noted; the owner decides scope when reviewing Track B.
- Still open for Gate-2: Track B approval + scope, #14/#12 re-estimate sign-off, ILO9/badge check.

## Track A — Safe wins (no owner decision; start on approval)

| # | Item | Effort | Why |
|---|---|---|---|
| 1 | **Strike tabs-unify; mark DONE-at-baseline.** One shared `Tabs.tsx` (useId-scoped ids, full keyboard, controlled+uncontrolled superset, regression-tested); no surviving `TabSet`. Note the panel-remount caveat (`Tabs.tsx:86`) for stateful children. | S ~0.25d | Re-doing it is a no-op/regression risk; surfaces the remount caveat that #8 depends on. |
| 2 | **Add a bitmap-HEIGHT (+aspect/min-size) assertion to `e2e/sim-paint.spec.ts`.** Today `expectPainted()` asserts only `distinctColors>2` (`:86`) — a collapsed-height canvas passes green. Capture per-route baseline `bitmapH`/`cssH` (baseline the **correct** height, before any canvas change), assert above a floor. | S-M ~1d | The regression net that makes the canvas migration (#12-14) safe. **FIRST merge; a HARD gate on #12/#13/#14, not a recommendation.** |
| 3 | **Fix the InteractiveLab damping stale-verdict bug.** Bucket `predictionResetKey` on `classifyDamping(ζ)` (the decision boundary) instead of raw R/L/C on a log(1.2) scale (`index.tsx:416-419` vs `:716`); add a test pinning verdict↔resetKey. | S ~0.5d | A predict-first gate grading against a verdict it never froze — a correctness bug shipping green. |
| 4 | **Remove the dead unwinnable "At the origin" pole distractor** (`SDomainPanel.tsx:120`; `getCorrectPoleAnswer` `:38-42` never returns it). | XS ~0.25d | A permanently-wrong option teaches a false lesson and erodes gate trust. |
| 5 | **Add focus management + aria-live to the `PredictionGate` reveal.** On pass it swaps prompt for children (`:125-126`) with no focus move; the result block (`:181-198`) has no `role="alert"`/aria-live. Add the live region + focus the revealed heading. | S ~0.75d | a11y regression on the most-used primitive; one fix propagates to ~30 call sites. |
| 6 | **Add a `PlausibilityCallout` to lenz, polarization, maxwell** (the ILO-8 EM hole; grep count 0 each). ~6-line callout anchoring one computed quantity to a real magnitude + `getAllByText('Does this make sense?')` smoke assertion, mirroring ampere/gauss/magnetic-circuits. | M ~1.5d | **#1 content gap.** Highest-value pedagogical add; zero physics/curriculum change. |
| 7 | **Resolve GuidedChallenge completion tracking** — wire `onComplete` (`:20,27,32-35`) to the store, or document it non-tracked, consistently across call sites. | S ~0.5d | Removes ambiguity; either resolution is internally consistent and reversible. |
| 8 | **Fix the EXISTING laplace-theory gate's remount re-lock** (panel correction — laplace-theory ALREADY ships a blocking `PredictionGate` at `LaplaceMotivation.tsx:24-123`; the original "zero gates / add a gate" premise was factually wrong). Real work: wire `initialPassed`/`onPassed` and lift unlock state above the Tabs at that call site so a tab switch doesn't re-lock it (the #1 remount caveat). | S ~0.5d (dep: #1) | Honors "blocking predict-first everywhere" by fixing the gate that exists, not manufacturing a second contrived one. |
| 9 | **Comprehensive correctness pass + permanent net (UPGRADED per directive; audit now COMPLETE).** (a) Fix every confirmed defect in [Appendix A](./2026-06-21-full-audit.md#appendix-a--strict-correctness-audit-2026-06-22--verified-defect-list) — **12 major (A.1) + 17 minor (A.2)**. The 12 majors are the must-fix core: 3 s-domain transfer-function transcription errors (RC `I(s)` spurious-s, RLC `V_C(s)` missing-s, RL impulse off-by-R), the lenz force-arrow wrong-direction + Q_RING_DIR double-key, the polarization axial-ratio reciprocal + ψ 90° sign bug, the transmission-line reversed wave animation, the bounce-diagram marginal-stability guard, the antennas inverted polar ring, the capacitor default-area-outside-slider, and the transformers stale "next section" bridge. (b) Lock it in: golden-number assertions on every worked example, ConceptCheck answer+distractor-independence assertions (esp. directional CCs — A.4), sim sign/direction assertions for canvas sims (lenz/antennas), a dimensional/unit check, and a KaTeX literal-backslash lint over all `formula=` props. **SPLIT per panel:** #9a authors the net asserting CORRECT values (lands **RED** vs today's code) → #9b applies the fixes to green; **red-before-green is a merge gate**, and the net asserts **call-site binding** (rendered string == solver output), not just solvers. Run #9 as a **fresh uniform sweep** — Appendix A is not exhaustive (panel found an audit-missed capacitor SVG-normalization defect, Appendix B.1). **Do NOT re-derive the clean solvers.** | #9a ~3-4d → #9b ~2-3d (the **schedule-critical spine**, not a 3-5d "safe-win") | The directive's backbone and the **prerequisite for all of Track C**. Closes premortem #1 (no test pins displayed output). |

**Track A total ≈ 7.5 days.** All independent except #8 (depends on #1).

---

## Track B — Owner-decision track (needs sign-off; sequenced by dependency)

```
 #10 chrome-hoist prework ─┐
 (break @em import)        │
                           ├─► #13 per-section LabLayout rollout
 #11 RETINT decision ──────┤        (gated on 10, 11, 12)
 (styling gate)            │
                           │
 #2 bitmap-height net ──► #12 canvas spike ──► (verdict feeds #13)
 (Track A)                 │
                           └─► #14 migrate EM sims to self-measuring hook (gated on 2, 12)
```

| # | Item | Effort | Depends | Decision needed |
|---|---|---|---|---|
| 10 | **Chrome-hoist prework** — break the `@em/constants/physics` import at `SectionLayout.tsx:6` (used only for default title/subtitle). Thread title/subtitle as props (or move metadata to `@shared/constants/curriculum`) so chrome can be hoisted to a shared `SectionShell` without a domain import. Pure refactor, no visual change. | M ~2d | #1 | Approve touching all 22+ section call signatures. |
| 11 | **RETINT — owner chose the FULL "engaging, not AI-generic" redesign** (2026-06-22, overriding the panel's minimal-accent recommendation). A real design workstream: **visual mockups FIRST** (owner's durable preference — show visuals, not prose), then apply across gate/body/sim chrome (~30 gate sites / ~58-file occ). Interacts with #10 (both touch `SectionLayout`). | L (full) | **DECIDED: full redesign** | Owner decision taken. Next sub-gate: approve the visual mockups before any implementation. |
| 12 | **Canvas spike (time-boxed)** — prove whether an EM sim can live in `LabLayout`'s sticky/overflow column without mis-sizing. Spike on gauss + lorentz, pixel-verify (`getImageData`) desktop+mobile. maxwell = safest (self-measuring); em-wave phasor-sync = most fragile (exempt). | M ~2d | #2 | Approve the spike; its verdict gates #13. |
| 13 | **Per-section `LabLayout`-inside-`SectionShell` rollout** — NOT blanket, NOT Tabs-rechapter. Keep 10 EM sections linear; exempt em-wave/maxwell/ampere. GuidedChallenge stays a persistent ungated sibling co-located with its bench. | L ~4-6d incremental | #10, #11, #12 | Approve scope + per-section candidate list. |
| 14 | **Migrate EM sims to the self-measuring `getBoundingClientRect` hook** — retires the entire canvas-mis-size risk class by decoupling sizing from layout (SWOT's recommended sequencing: do this *before* committing to any bench). | L ~3-5d | #2, #12 | Approve the 10-sim port. |

---

## Track C — Safe simplification (gated behind the correctness net, per directive)

Simplify wherever possible **without losing any functionality or physics rigor — proven by tests**. Every item
here ships only after #9's correctness/units net covers the touched code, and must be green on the full unit
suite **and** e2e before merge. **Rule:** if a simplification's behavior and rigor can't be pinned by a test,
it does not ship — that is the "no quick, unreliable fix" line.

| Item | Notes |
|---|---|
| Consolidate the 3 canvas-sizing strategies onto the one self-measuring hook | overlaps Track-B #14; retires a whole bug class |
| De-duplicate the triplicated section chrome into the shared `SectionShell` | overlaps Track-B #10/#13 |
| Remove dead code — the at-origin distractor (#4) and any unreachable branches the correctness audit flags | each test-guarded |
| **~15 per-section simplifications from the correctness audit** ([Appendix A.5](./2026-06-21-full-audit.md#a5--simplification-opportunities-deduped-each-net-first-per-the-directive)) | each carries its own **net-first** tag (the specific test that must exist first); zero behavior change. Highlights: collapse the now-redundant 3-form s-domain chains; delete the polarization `ex===ey` special case + `Linear ? Infinity` branch (the fixes *are* the simplifications); consolidate the duplicated `BounceDiagram` math into `transmissionMath.ts` — **⚠ panel trap: fix the guard in the function the COMPONENT renders (`BounceDiagram.tsx:160-165` local γ-space copy) and assert via the RENDERED readout; the exported util is test-only and itself mis-handles the marginal case**; hoist the byte-identical `ReadoutCard` and `verticalZigzag`/`horizontalZigzag` SVG helpers; source the Iron-Core preset from the shared `materials` array; de-dup the coulomb µC→C conversion. |

Effort: incremental, per item; sizes are in Appendix A.5. **Several Track-C items and #9 fixes coincide** (e.g. polarization, transients) — fixing the defect and removing its special-case/duplication is one change, gated by the same new test. **⚠ panel caveats:** lenz is NOT a one-edit coincidence — the A.5 "reuse the `(v·dNorm)<0` value at `:315`" is block-scoped and won't compile; fix `fLen:354` alone first. The two polarization fixes ARE one-edit, but their pinning test must cover boundary states (ex==ey with cos δ<0 ⇒ ψ=−45/135; near-linear χ→0 AR limit), not just the 3 clean archetypes.

## The 5 owner decisions (recap from the devil's-advocate panel)

1. **Bench-everywhere?** → **KILL**; keep two body shells, unify only the chrome (#10/#13). ⚠ chrome-hoist
   has the `@em` blocker.
2. **Spike before any EM migration?** → **Yes** (#12) — EM's `parentElement.clientHeight` contract is
   incompatible with `LabLayout`'s content-sized column.
3. **GuidedChallenge placement?** → **Persistent ungated sibling** beside a visible bench; bare tab is a trap;
   never a 2nd gate.
4. **Retint?** → **DECIDED 2026-06-22: FULL "engaging, not AI-generic" redesign** (owner override of the
   panel's minimal-accent recommendation) — visual mockups first; see #11.
5. **Migration shape?** → **(a)** `LabLayout`-inside-`SectionShell`, per-section, single-gate sections first;
   exempt em-wave/maxwell/ampere (#13).

---

## What is explicitly NOT in scope
- **Re-deriving physics solvers** — verified clean (solveToroid, partial-fractions residues, em-wave media
  math, dipole 73 Ω, Lorentz Boris).
- **tabs-unify** — already shipped at baseline.
- ~~**Full per-Part retint of the gate/body** — rejected as high-effort/low-value.~~ **SUPERSEDED 2026-06-22:
  the owner chose the full "engaging, not AI-generic" redesign (#11); it is now IN scope as a mockups-first
  design workstream.**
- **em-wave SI retrofit** — real but medium-cost and separate; not required to hold any ILO grade. Track it for
  a later content pass.
