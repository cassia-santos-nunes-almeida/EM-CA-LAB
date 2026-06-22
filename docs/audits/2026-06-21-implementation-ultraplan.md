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

## Track A — Safe wins (no owner decision; start on approval)

| # | Item | Effort | Why |
|---|---|---|---|
| 1 | **Strike tabs-unify; mark DONE-at-baseline.** One shared `Tabs.tsx` (useId-scoped ids, full keyboard, controlled+uncontrolled superset, regression-tested); no surviving `TabSet`. Note the panel-remount caveat (`Tabs.tsx:86`) for stateful children. | S ~0.25d | Re-doing it is a no-op/regression risk; surfaces the remount caveat that #8 depends on. |
| 2 | **Add a bitmap-HEIGHT (+aspect/min-size) assertion to `e2e/sim-paint.spec.ts`.** Today `expectPainted()` asserts only `distinctColors>2` (`:86`) — a collapsed-height canvas passes green. Capture per-route baseline `bitmapH`/`cssH`, assert above a floor. | S-M ~1d | The regression net that makes the canvas migration (#12-14) safe. **Must land before any spike.** |
| 3 | **Fix the InteractiveLab damping stale-verdict bug.** Bucket `predictionResetKey` on `classifyDamping(ζ)` (the decision boundary) instead of raw R/L/C on a log(1.2) scale (`index.tsx:416-419` vs `:716`); add a test pinning verdict↔resetKey. | S ~0.5d | A predict-first gate grading against a verdict it never froze — a correctness bug shipping green. |
| 4 | **Remove the dead unwinnable "At the origin" pole distractor** (`SDomainPanel.tsx:120`; `getCorrectPoleAnswer` `:38-42` never returns it). | XS ~0.25d | A permanently-wrong option teaches a false lesson and erodes gate trust. |
| 5 | **Add focus management + aria-live to the `PredictionGate` reveal.** On pass it swaps prompt for children (`:125-126`) with no focus move; the result block (`:181-198`) has no `role="alert"`/aria-live. Add the live region + focus the revealed heading. | S ~0.75d | a11y regression on the most-used primitive; one fix propagates to ~30 call sites. |
| 6 | **Add a `PlausibilityCallout` to lenz, polarization, maxwell** (the ILO-8 EM hole; grep count 0 each). ~6-line callout anchoring one computed quantity to a real magnitude + `getAllByText('Does this make sense?')` smoke assertion, mirroring ampere/gauss/magnetic-circuits. | M ~1.5d | **#1 content gap.** Highest-value pedagogical add; zero physics/curriculum change. |
| 7 | **Resolve GuidedChallenge completion tracking** — wire `onComplete` (`:20,27,32-35`) to the store, or document it non-tracked, consistently across call sites. | S ~0.5d | Removes ambiguity; either resolution is internally consistent and reversible. |
| 8 | **Audit + add a `PredictionGate` to laplace-theory** (zero gates today; the one circuits theory section missing the locked predict-first pattern). Confirm it isn't intentionally a pure-derivation chapter first. | S-M ~1d (dep: #1) | Honors "blocking predict-first everywhere." Any gate inside its Tabs must lift state above the tab (the #1 remount caveat). |
| 9 | **Comprehensive correctness pass + permanent net (UPGRADED per directive; audit now COMPLETE).** (a) Fix every confirmed defect in [Appendix A](./2026-06-21-full-audit.md#appendix-a--strict-correctness-audit-2026-06-22--verified-defect-list) — **12 major (A.1) + 17 minor (A.2)**. The 12 majors are the must-fix core: 3 s-domain transfer-function transcription errors (RC `I(s)` spurious-s, RLC `V_C(s)` missing-s, RL impulse off-by-R), the lenz force-arrow wrong-direction + Q_RING_DIR double-key, the polarization axial-ratio reciprocal + ψ 90° sign bug, the transmission-line reversed wave animation, the bounce-diagram marginal-stability guard, the antennas inverted polar ring, the capacitor default-area-outside-slider, and the transformers stale "next section" bridge. (b) Lock it in: golden-number assertions on every worked example, ConceptCheck answer+distractor-independence assertions (esp. directional CCs — A.4), sim sign/direction assertions for canvas sims (lenz/antennas), a dimensional/unit check, and a KaTeX literal-backslash lint over all `formula=` props. **Do NOT re-derive the clean solvers** — guard rendered output + everything else. | L ~3-5d | The directive's backbone safe-win and the **prerequisite for all of Track C**. Closes premortem #1 (no test asserts physics correctness). |

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
| 11 | **RETINT decision** — recommend the minimal per-Part chrome accent: apply existing `--color-part-N` tokens to the header rule only (`SectionLayout.tsx:63`), ~1 file, zero gate/body churn. Full retint (Part prop through ~30 gate sites + 265-occ audit) rejected. | S (minimal) / L (full) | none | **Pick:** minimal chrome accent / defer / full retint. **Never ship shell-unify without differentiation.** |
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
| **~15 per-section simplifications from the correctness audit** ([Appendix A.5](./2026-06-21-full-audit.md#a5--simplification-opportunities-deduped-each-net-first-per-the-directive)) | each carries its own **net-first** tag (the specific test that must exist first); zero behavior change. Highlights: collapse the now-redundant 3-form s-domain chains; delete the polarization `ex===ey` special case + `Linear ? Infinity` branch (the fixes *are* the simplifications); consolidate the duplicated `BounceDiagram` math into `transmissionMath.ts` (single source + one guard fix); hoist the byte-identical `ReadoutCard` and `verticalZigzag`/`horizontalZigzag` SVG helpers; source the Iron-Core preset from the shared `materials` array; de-dup the coulomb µC→C conversion. |

Effort: incremental, per item; sizes are in Appendix A.5. **Several Track-C items and #9 fixes coincide** (e.g. polarization, lenz, transients) — fixing the defect and removing its special-case/duplication is one change, gated by the same new test.

## The 5 owner decisions (recap from the devil's-advocate panel)

1. **Bench-everywhere?** → **KILL**; keep two body shells, unify only the chrome (#10/#13). ⚠ chrome-hoist
   has the `@em` blocker.
2. **Spike before any EM migration?** → **Yes** (#12) — EM's `parentElement.clientHeight` contract is
   incompatible with `LabLayout`'s content-sized column.
3. **GuidedChallenge placement?** → **Persistent ungated sibling** beside a visible bench; bare tab is a trap;
   never a 2nd gate.
4. **Retint timing?** → minimal chrome accent now **or** defer — but **never unify the shell without
   differentiation** (#11).
5. **Migration shape?** → **(a)** `LabLayout`-inside-`SectionShell`, per-section, single-gate sections first;
   exempt em-wave/maxwell/ampere (#13).

---

## What is explicitly NOT in scope
- **Re-deriving physics solvers** — verified clean (solveToroid, partial-fractions residues, em-wave media
  math, dipole 73 Ω, Lorentz Boris).
- **tabs-unify** — already shipped at baseline.
- **Full per-Part retint of the gate/body** — rejected as high-effort/low-value.
- **em-wave SI retrofit** — real but medium-cost and separate; not required to hold any ILO grade. Track it for
  a later content pass.
