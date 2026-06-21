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
