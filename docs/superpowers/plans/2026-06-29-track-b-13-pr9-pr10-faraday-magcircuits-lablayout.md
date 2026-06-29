# Track B #13 — PR9/PR10: faraday + magnetic-circuits → LabLayout (`leadWithBench`)

**Date:** 2026-06-29
**Status:** SCOPED, ready to implement (1 owner re-gate sign-off required before merge — see Open Decisions).
**Source:** 7-agent understand→synthesize→critique workflow (`wf_9cdeeae0-655`), verified against the live tree on `main` `4c53458` (post-#51, all 5 `leadWithBench` cohort sections shipped). Critique verdict: **READY-WITH-FIXES** (fixes folded in below).

These are the **only two EM sections still on the flat `SectionLayout`** instead of `SectionLayout > LabLayout(leadWithBench)`. They were deferred under **decision #4** — not because they were hard to migrate mechanically, but because each carries a **second mid-theory blocking `PredictionGate`** that the clean one-bench recipe never confronted. That second gate is the entire reason for a human re-gate review.

---

## The proven recipe (from the gauss spike, commit `3c82c39`, reused across 5 shipped sections)

Both target sections share the identical current shape — three `SectionAnchor` children under `SectionLayout`:

- `*-sim` anchor: `PredictionGate` (gate 1) wrapping the legacy `grid grid-cols-1 lg:grid-cols-3 gap-6` with the canvas in `lg:col-span-2` at `flex-grow min-h-[400px]`, then a post-sim `ConceptCheck`.
- `*-theory` anchor: the theory body **plus a SECOND blocking `PredictionGate`**.
- `*-challenge` anchor: the `GuidedChallenge`.

The migration, per section:

1. **Hoist all sim state** (refs, `useState`, handlers, the unconditional RAF draw-loop effect) in the Section component — the theory readouts consume live sim values, so state must stay above the bench/theory split.
2. Extract `const bench =`
   `<SectionAnchor id="*-sim"> > <LabStation> > <PredictionGate gate1> > <div className="space-y-4">{fixed h-[400px] canvas card}{ControlPanel}</div>`
   — **reflow the canvas from `flex-grow min-h-[400px]` to a fixed `h-[400px]` card** so the self-measuring canvas reads a real height in the narrow stacked column.
3. Extract `const theory =` `<div className="space-y-6">` holding the `*-theory` anchor **verbatim** (second gate and its gated children untouched) + the `*-challenge` anchor.
4. Return `<LabLayout leadWithBench theory={theory} bench={bench} />`; keep `SectionLayout` `sectionId`/hook/toc unchanged.
5. Add one line to the e2e `MIN_CANVAS_W` map (see calibration fix below).

**Why `leadWithBench` is mandatory:** `LabLayout` renders theory DOM-first by default; the flag flips the bench DOM-first so (a) scroll-spy registers the sim anchor first and (b) the sub-`lg` mobile stack leads with the sim (predict-first order). Without it, the `*-sim` anchor lands DOM-last.

**Canvas-sizing risk is RETIRED for both** — both sims are already on the `#14 useSelfMeasuringCanvas` hook and already in `DPR_MIGRATED` / `EXPECT_CANVAS` / `MIN_CANVAS_H`(238). The gauss spike proved this exact hook survives the sticky `minmax(420px,48%)` bench (mobile 299 / desktop 482 / bitmap 964×796 @dpr2). **No new spike** — only the one-line width-floor entry each.

---

## Sequencing decision: **SERIES** (PR9 → merge → rebase PR10)

Critic-confirmed correct. The section bodies are fully independent (different directories, zero shared lines — ~95% parallelizable), but there is exactly **one shared mutable file**: `e2e/sim-paint.spec.ts`, where both PRs append an adjacent line to the same `MIN_CANVAS_W` object literal (lines 54–65) — a guaranteed merge conflict for parallel worktrees. The other "shared" files are read-only: `sectionAnchors.test.tsx` is preserved untouched by both (ids/order kept by `leadWithBench`), and `LabLayout.tsx` already shipped `leadWithBench` in #46.

Three reasons tip it to series at near-zero cost:
1. **faraday is BOTH e2e harnesses' control** — the `sectionAnchors` in-file live control AND the `breadcrumb-scrollspy` non-sticky control — so its harness changes should land and be verified before stacking the riskier PR.
2. **PR10 (magnetic-circuits) is the highest-risk** (second gate + instrument-coupled `YourTurnPanel` + bench-overflow risk) and benefits from faraday as a second proven reference.
3. Series eliminates the `MIN_CANVAS_W` conflict entirely.

---

## PR9 — faraday → LabLayout via `leadWithBench`

**Depends on:** `main` (current — `4c53458`).

### Files
- **`src/em/sections/faraday/index.tsx`** — primary migration. Add `LabLayout` + `LabStation` imports. Keep hoisted: `useSelfMeasuringCanvas` (`canvasRef`/`prepareFrame` ~:135), `useCanvasTouch`, `useState` (rate/loops/isPlaying), refs (`timeRef`/`dragStartX`), the rate-drag handlers (~:267–296), and the unconditional RAF draw-loop effect (~:142–254) that sets `liveB`/`liveEmf` consumed by the theory `EquationBox` B(t)/EMF(t) rows (~:398–399).
  - `bench` = `<SectionAnchor id="faraday-induction-sim" label="Induction Simulation"> > <LabStation title=… objective=…> > <PredictionGate gate1 (:312–359 verbatim)> > {reflowed sim}`. Replace the `grid … lg:grid-cols-3` + `lg:col-span-2 flex-grow min-h-[400px]` (:328–343) with a flat `<div className="space-y-4">` holding the canvas card at **fixed `h-[400px]`** (keep `canvasTouchRef`, `role=img`, aria-label, the mouse rate-drag handlers, `cursor crosshair`) then `ControlPanel` directly beneath.
  - `theory` = `<div className="space-y-6">` with the entire `faraday-theory` anchor (:366–591) **UNCHANGED** — figures, live `EquationBox`, `PlausibilityCallout`, `RodOnRailsFigure`, the **SECOND `PredictionGate` (:472–575)** with its gated EquationBox/worked-example/reveal-card, `Q_MOTIONAL`, `TheoryGuide` — plus the `faraday-challenge` anchor.
  - Replace `SectionLayout` children (:310–595) with `<LabLayout leadWithBench theory={theory} bench={bench} />`.
  - Relocate the post-sim `Q_NO_EMF` ConceptCheck (:362) into `theory` as a loose sibling (lorentz `Q_CIRCULAR` precedent; check carries no id → doc-order test unaffected). **[FOLDED CRITIC FIX — default it, don't leave open.]**
- **`e2e/sim-paint.spec.ts`** — add a faraday entry to `MIN_CANVAS_W`. **[CRITIC CALIBRATION FIX]** Use **`faraday: 210`** (not the gauss `180`) — faraday draws a 200px-wide rate-drag bar (`barW=200`, :220); a 180px floor would let a regression clip it while passing. 210 keeps the floor above the largest fixed in-canvas element. faraday is already in `DPR_MIGRATED`/`EXPECT_CANVAS`/`MIN_CANVAS_H`(238), so this one line also activates the symmetric `bitmapW≈cssW*dpr` check.
- **`e2e/breadcrumb-scrollspy.spec.ts`** — faraday is the explicit `// normal section (control)` (:28, header :1–6). After migration its sim anchor lives in a `lg:sticky` bench like gauss, so **repoint the non-sticky control to `ampere`** (a second-gate section permanently outside the LabLayout rollout). **[CRITIC FIX]** Do not assume it passes — *run* the spec against ampere first and confirm it advances the meter to k≥2 on scroll-down and resets to ≤1 on scroll-up; if ampere's body is too short for ≥2 distinct active anchors, fall back to maxwell/em-wave. Update the `SECTIONS` array + the file-header comment. Optionally keep faraday as a *second* `leadWithBench` case alongside gauss to strengthen the test.
- **`src/em/sections/__tests__/sectionAnchors.test.tsx`** — **NO edit.** The faraday case (:56) already expects `['faraday-induction-sim','faraday-theory','faraday-challenge']`. This is the RED/GREEN regression guard. Re-run only.

### TDD steps
1. Confirm the oracle is sound: `npx vitest run src/em/sections/__tests__/sectionAnchors.test.tsx --no-file-parallelism` → faraday case GREEN pre-migration.
2. **RED:** wrap with `<LabLayout theory bench />` **without** `leadWithBench` → `present` = `[theory, challenge, sim]` ≠ expected → RED. Proves the doc-order `toEqual` discriminates the theory-DOM-first bug.
3. **GREEN:** add `leadWithBench` → bench DOM-first → `faraday-induction-sim` leads → GREEN, no test edit.
4. Implement the rest against behavior oracles: reflow canvas to fixed `h-[400px]`, add `LabStation`, keep all state hoisted, keep the second motional-EMF gate verbatim. Run `npx vitest run src/shared/components/common/__tests__/LabLayout.test.tsx src/em/sections/__tests__/forcesMotionalEmf.test.tsx src/em/sections/__tests__/sections.test.tsx src/em/sections/__tests__/unitMapping.test.ts --no-file-parallelism` — all GREEN. (`forcesMotionalEmf.test.tsx:131–142` absence-pins both faraday gates as blocking — the real guard against silently de-gating.)
5. Width net (**defensive opt-in, not red-before-green** — the height collapse is already caught by `MIN_CANVAS_H`=238; **[CRITIC FIX: relabelled]**): build, capture healthy widths via `npx playwright test e2e/sim-paint.spec.ts --project=desktop-hidpi` (+ desktop/mobile) → expect mobile 299 / desktop 482; then add `faraday: 210` and re-run so the floor + symmetric DPR-width relation assert GREEN.
6. Repoint + verify the breadcrumb control (step in Files above): `npx playwright test e2e/breadcrumb-scrollspy.spec.ts`.

### Per-PR gate
`npx tsc -b` (0) → `npm run lint` (0/0) → `npx vitest run -- --no-file-parallelism` (~764·102, 0 skips) → `npm run build` (0) → `npm run e2e` (153 across desktop/mobile/desktop-hidpi) → dpr2 spot-run `npx playwright test e2e/sim-paint.spec.ts --project=desktop-hidpi`. **Manual:** confirm BOTH faraday gates still block and each reveal moves focus.

---

## PR10 — magnetic-circuits → LabLayout via `leadWithBench` (highest-risk; re-gate at review)

**Depends on:** PR9 (rebase on the branch/main carrying it — inherits the merged `MIN_CANVAS_W` edit and a second proven reference).

### Files
- **`src/em/sections/magnetic-circuits/index.tsx`** — same recipe. Add `LabLayout` + `LabStation` imports. Keep hoisted: `useSelfMeasuringCanvas` (:122), `useCanvasTouch` (:124), all `useState` (`materialIndex`/`turns`/`current`/`gapPercent`), derived `solveToroid` values, the draw-loop effect. **Defaults stay UNCHANGED** (`materialIndex=1` Iron / `turns=200` / `current=1` / `gap=0`) so the WE-1/2/3 + YourTurn prose-vs-instrument numbers — pinned digit-for-digit by `magneticCircuits.test.ts solveToroid` — remain valid.
  - `bench` = `<SectionAnchor id="magnetic-circuits-toroid-sim" label="Toroid Simulation"> > <LabStation title="The Toroid / Magnetic Circuit" objective=…> > <PredictionGate gate1 (:314–373 verbatim)> > {reflowed sim}`. Replace `grid … lg:grid-cols-3` + `lg:col-span-2 … flex-grow min-h-[400px]` (:331–340) with a flat `space-y-4` stack holding the canvas card at fixed `h-[400px]` (keep `canvasTouchRef`, `role=img`, aria-label) over the `ControlPanel` "Toroid Parameters".
  - **[CRITIC FIX — bench overflow]** Relocate the long μ_r-disclaimer paragraph (:368–370) **out of the bench `ControlPanel` into the theory column.** The bench stack (LabStation header + gate + `h-[400px]` canvas + 3 sliders + 3 material buttons + disclaimer) otherwise exceeds `lg:max-h-[calc(100vh-6rem)]` on an ~800px laptop, forcing internal scroll that pushes the canvas readouts out of view — which breaks the WE-2/`YourTurnPanel` "set gap 1% / N=50 and read the canvas" instrument coupling that is this section's whole point.
  - `theory` = `<div className="space-y-6">` with the entire `magnetic-circuits-theory` anchor (:380–761) **UNCHANGED** — EquationBoxes, WE-1, the two callouts, the **SECOND `PredictionGate` "Worked Example 2 — now cut the gap" (:498–622)**, the instrument-coupled `YourTurnPanel` (:625), WE-3, all ConceptChecks, the Mutual-Inductance EquationBox, the router `<Link>` bridge card — plus the challenge anchor. (Add the relocated μ_r disclaimer here.)
  - Replace `SectionLayout` children with `<LabLayout leadWithBench theory={theory} bench={bench} />`.
  - Relocate the post-sim `Q_RELUCTANCE` ConceptCheck (:376) into `theory` (same default as PR9).
- **`e2e/sim-paint.spec.ts`** — add `'magnetic-circuits': 210` to `MIN_CANVAS_W`. **[CRITIC CALIBRATION FIX]** magnetic-circuits paints a 200px-wide readout box (`ctx.fillRect(… 200 …)`, :284–287) → floor must exceed 200. Already in `DPR_MIGRATED`/`EXPECT_CANVAS`/`MIN_CANVAS_H`(238).
- **`src/em/sections/__tests__/sectionAnchors.test.tsx`** — **NO edit.** The case (:67) already expects `['magnetic-circuits-toroid-sim','magnetic-circuits-theory','magnetic-circuits-challenge']`. Regression guard only.

### TDD steps
1. Oracle sound: `npx vitest run src/em/sections/__tests__/sectionAnchors.test.tsx --no-file-parallelism` → magnetic-circuits case GREEN pre-migration.
2. **RED:** `<LabLayout theory bench />` without `leadWithBench` → `toroid-sim` lands DOM-last → RED.
3. **GREEN:** add `leadWithBench` → GREEN, no test edit.
4. Implement against oracles: reflow to fixed `h-[400px]` stacked bench, `LabStation`, state hoisted, second WE-2 gate + `YourTurnPanel` verbatim, μ_r disclaimer relocated. Run `npx vitest run src/shared/components/common/__tests__/LabLayout.test.tsx src/em/sections/__tests__/magneticCircuits.test.tsx src/em/sections/__tests__/sections.test.tsx src/em/sections/magnetic-circuits/__tests__/magneticCircuits.test.ts --no-file-parallelism` — LabLayout contract, dual-gate page behavior (WE-1 ungated / WE-2 gated, inverse-design YourTurn, 4 concept checks, challenge), smoke render, and `solveToroid` digit-for-digit all GREEN. (`magneticCircuits.test.tsx:56–65` absence-pins WE-2 as a blocking gate.)
5. Width net (defensive): build, capture healthy widths (`--project=desktop-hidpi` + desktop/mobile), then add `'magnetic-circuits': 210` and re-run.
6. **Bench-overflow check (mandatory, not optional):** on a ~800px-tall viewport confirm the sticky bench does not overflow so badly the canvas readouts scroll out of view while the gap/turns sliders stay reachable.

### Per-PR gate
Same command chain as PR9. **Manual re-gate (decision #4's explicit ask):** confirm BOTH gates block and reveal-focus works, AND that the `YourTurnPanel`/WE prose still reconciles against the now-always-visible sticky instrument.

---

## Risks (shared) + mitigations

| Risk | Mitigation |
|---|---|
| `MIN_CANVAS_W` object-literal collision (both edit lines 54–65) | Series ordering avoids it outright. |
| Doc-order anchor breakage if `leadWithBench` omitted → sim anchor DOM-last → `sectionAnchors` fail + #11 breadcrumb mislabel | Always pass `leadWithBench`; use the existing case as the RED/GREEN discriminator. |
| Second mid-theory blocking gate silently de-gated during extraction (the deferral reason) | Move the whole `*-theory` anchor verbatim, zero edits to the nested gate. `forcesMotionalEmf.test.tsx` / `magneticCircuits.test.tsx` absence-pin both gates as automated guards; plus the manual re-gate. |
| Canvas collapse/squish in the 48% sticky bench | Fixed `h-[400px]` card in a flat `space-y-4` stack; `MIN_CANVAS_W` floor (≥210) + symmetric `bitmapW≈cssW*dpr` catch horizontal collapse. |
| Width floor (180) below the 200px fixed in-canvas elements | **Calibrated to 210** for both sections (faraday rate bar / magnetic-circuits readout box). |
| magnetic-circuits bench self-overflow on laptop heights | Relocate the μ_r disclaimer out of the bench; verify on ~800px viewport at re-gate. |
| getImageData-in-sticky-column assumed to need a fresh spike | RETIRED — both already on the `#14` hook + in `DPR_MIGRATED`; gauss spike proved it across 5 sections. |

---

## Open decisions (owner-only — not resolvable from code)

1. **Re-gate UX sign-off (THE deferral reason).** Is it acceptable for a SECOND blocking `PredictionGate` to remain mid-theory in the scrolling left column rather than in the single sticky bench — faraday's motional-EMF gate (energy-audit reveal) and magnetic-circuits' Worked-Example-2 gate plus the instrument-coupled `YourTurnPanel`? The code keeps them blocking automatically when moved verbatim; the question is whether the two-gate scrolling layout is approved as-is or wants restructuring (e.g. a second bench / different framing). **This human review is the entire reason these two were deferred.**
2. **`LabStation` title + objective copy** for each bench — new user-facing strings (gauss/lorentz authored bespoke "Predict X first, then Y" objectives). Owner-approved wording needed; I can draft and you tweak.
3. **(magnetic-circuits, optional)** With LabLayout the instrument is now always-visible (a pedagogical upside). Lightly update the WE/YourTurn prose ("scroll to the sim…" → "the persistent bench…") or leave verbatim? Defaults and `solveToroid` stay untouched either way.

> Resolved-by-default (critic recommendation, no longer "open"): post-sim ConceptCheck placement → **relocate `Q_NO_EMF` and `Q_RELUCTANCE` into the theory column** (lorentz precedent; keeps the sticky bench purely the instrument); `MIN_CANVAS_W` → **210** for both.

---

## Canonical gate command

```
npx tsc -b && npm run lint && npx vitest run -- --no-file-parallelism && npm run build && npm run e2e
# dpr2 spot-check:
npx playwright test e2e/sim-paint.spec.ts --project=desktop-hidpi
# PR9 only:
npx playwright test e2e/breadcrumb-scrollspy.spec.ts
```
Expected GREEN baseline: tsc 0 / eslint 0/0 / vitest ~764·102 / build 0 / e2e 153 across 3 projects (desktop, mobile, desktop-hidpi).
