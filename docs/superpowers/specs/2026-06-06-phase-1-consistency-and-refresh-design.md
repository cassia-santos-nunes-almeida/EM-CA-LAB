# Phase 1 — Consistency & Visual Refresh — Design Spec

- **Date:** 2026-06-06
- **Repo:** `EM-CA-LAB` (branch `main` @ `c665ebd`)
- **Status:** Draft for owner review (brainstorming → `writing-plans`)
- **Basis:** Owner's 2026-06-05 manual visual walk + a 7-agent read-only scoping workflow (run `wf_6bb1919f-0fa`). Full line-level evidence (every file, line number, current code, proposed change) is preserved in the companion file [`2026-06-06-phase-1-scoping.json`](./2026-06-06-phase-1-scoping.json).

---

## 1. Goal

Phase 0 consolidated the three separate apps (M1/M2/M3) into one course. **Phase 1 makes it consistent and engaging without adding new pedagogy or simulations:** a unified visual language, predict-first on every sim, images that actually load and stay loaded, charts that read correctly, a polished landing page, and a refined lab-bench layout. Foundation discipline carries over — always green, always shippable.

This phase is *consistency & refresh*, not new content. New sims (RC/RL/RLC explorer, pole-zero), ILO-gap content (ILO9 Heaviside), etc. remain Phases 2–3.

---

## 2. Locked decisions (settled during brainstorming)

### 2.1 Visual language — "Lab Instrument" on a light cool-grey chassis
Chosen from three mockup directions (Engineering Notebook / Lab Instrument / Quiet Academic). The owner picked **Lab Instrument** and moved it to a **light** background with deepened accents.

| Token | Value | Use |
|---|---|---|
| chassis (page bg) | `#f1f5f9` | behind all content |
| card | `#ffffff` | cards, sidebar, lab stations |
| card border | `#e2e8f0` | card/sidebar borders |
| title | `#0f172a` | headings |
| muted | `#64748b` | body/muted text, mono labels |
| LED | `#10b981` | green "live"/complete indicator |
| CTA | `#2563eb` | primary links/buttons |

**Per-Part accent (4px left border + mono quantity tag), deepened one step for light:**

| Part | Quantity | Accent | Label tint |
|---|---|---|---|
| 1 | CURRENT | `#d97706` | `#b45309` |
| 2 | E-FIELD | `#dc2626` | `#b91c1c` |
| 3 | B-FIELD | `#2563eb` | `#1d4ed8` |
| 4 | WAVES | `#7c3aed` | `#6d28d9` |
| 5 | POWER | `#059669` | `#047857` |

Signatures kept: mono Part labels with a quantity tag (e.g. `PART 01 · CURRENT`), green "live" LED. Mockups: `.superpowers/design-directions.html`, `.superpowers/design-B-light.html` (gitignored).

### 2.2 Pedagogy — keep blocking predict-first
Every section that has a simulation gets a **blocking** PredictionGate: the student commits a prediction before the sim is revealed. (This is a durable owner preference, not new to this phase.)

### 2.3 Build order — cleanups → visual language → rollout
So the rollout inherits the new look through shared components rather than being restyled twice.

---

## 3. Build sequence

1. **Batch 1 — Cleanups (B, C, D):** independent, low-risk, individually shippable.
2. **Batch 2 — Visual language (E):** `index.css` tokens → `CourseLanding` → `Sidebar` → `LabStation` → `PhysicsChart` container.
3. **Batch 3 — Rollout (A → F → G):** bench widen/mobile, then predict-first on 9 sections, then chart-quality.

**Why this order:** themes A/F/G flow through the shared `LabStation` / `PredictionGate` / `PhysicsChart` components. Styling those once in Batch 2 means the Batch 3 rollout is "born styled" — no double-touch.

---

## 4. Theme specifications

> Each theme below gives the verified scope and approach. The exhaustive per-line change list lives in the scoping appendix; here we capture the design and the decisions.

### A — Lab-bench width + mobile responsiveness
- **Scope:** `src/shared/components/common/LabLayout.tsx` (the primitive) + its **only** runtime consumer, `TransmissionLines.tsx` (3 lab chapters). All three bench sims are width-responsive (canvas re-measures per frame; StandingWaveQuiz uses a ResizeObserver), so widening is visually safe.
- **Changes:** grid `lg:grid-cols-[1fr_minmax(360px,42%)]` → `[1fr_minmax(420px,48%)]`; add optional `benchId` + `jumpLabel` props that render a sub-`lg` "Jump to lab ↓" anchor (theory-first stays the mobile order); opt the 3 TL labs in.
- **Watch:** `SmithChartSim` is `aspect-square` with `max-h-[560px]` — at the wider column it hits the cap and letterboxes (visual-QA item).

### B — Vendor images locally
- **Scope:** **27** `<FigureImage>` across 20 files; all hotlink Wikimedia. A live HTTP audit found **11 dead (404)** and 16 alive-but-fragile (Wikimedia rate-limits hotlinks with 429s).
- **The 11 dead (need substitute image + new attribution/sourceUrl):** VNA (TransmissionLines), ringing-on-unterminated-line + eye-diagram (Transients), substation transformer (Transformers), polarizing filter (polarization), J.C. Maxwell portrait (maxwell), aurora/Polarlicht (lorentz), electromagnet (ampere), RC charge/discharge (TimeDomain), Fluke multimeter (InteractiveLab), inductor RF-choke (ComponentPhysics).
- **Changes:** download all into `public/figures/` (kebab-case), repoint `src` to `` `${import.meta.env.BASE_URL}figures/<file>` ``; add `jpg,jpeg` to the VitePWA `globPatterns` in `vite.config.ts`. `FigureImage` already renders `attribution`/`sourceUrl`, so attribution is preserved (the 16 alive keep theirs; the 11 dead get fresh attribution for their replacements).

### C — Section numbering standardization
- **Scope:** add a derived `getSectionNumber(id)` helper to `curriculum.ts`; remove stale per-module numbers from the 5 transmission modules. **Real bug found:** Antennas renders "Section 5.x" but is curriculum **4.4** (Part 4) — actively mislabels which Part Antennas lives in.
- **Stale numbers:** Transformers `1.x`→3.4, LumpedDistributed `2.x`→5.1, TransmissionLines `3.x`→5.2, Transients `4.x`→5.3, Antennas `5.x`→4.4. ~20 user-facing sites + banner comments + 1 LabStation unit-test literal.
- **Approach:** `getSectionNumber` derives `Part.Section` from `PARTS` order (single source of truth; re-ordering auto-renumbers). Add a curriculum test for the mapping.

### D — Clickable landing section names
- **Scope:** `src/shared/components/CourseLanding.tsx`, one render block. Section names are currently plain text in `<li>`s; only "Start Part N" links.
- **Change:** wrap each section name in `<Link to={SECTIONS[id].route}>` (Link already imported) with a focus ring. ~1 localized edit.

### E — Apply the locked visual language *(the largest theme)*
- **Scope (chrome surfaces):** `index.css` token layer (+ `.dark` overrides) → `CourseLanding` → shared `Sidebar` → `LabStation` → `PhysicsChart` container.
- **Token layer:** add chassis/card/title/muted/led/cta + `--color-part-1..5` (and `-label`) + deepened physics scale; add a `.dark` block re-pointing the light tokens so dark mode coexists.
- **Application:** white cards with a 4px Part-keyed left border (set via inline `style={{borderLeftColor: var(--color-part-N)}}` because Tailwind v4 `@theme` can't generate dynamic `border-part-${n}` classes); mono `PART NN · QUANTITY` tags; neutralize the engineering-blue Sidebar gradient masthead and Part badge; completion = green LED.
- **Part→quantity word map** (`{1:'CURRENT',…,5:'POWER'}`) shared by CourseLanding + Sidebar.

### F — Predict-first on the 9 ungated sections
- **Scope:** component-physics, circuit-analysis (`TimeDomain`), s-domain (`SDomainAnalysis`), coulomb, gauss, ampere, maxwell, em-wave, polarization. Wrap each section's primary interactive element in a **blocking** `PredictionGate`; store key = section id.
- **Patterns:** EM sections follow the Faraday model (gate as first child of `SectionLayout`); circuits follow the TransmissionLines model; **s-domain** needs the `initialPassed`/`onPassed` lifted-state pattern because its `Tabs` remount on switch.
- **No store/curriculum change:** `markPredictionGate` only touches `predictionGates*`, never `isModuleComplete` (which keys off concept checks). Completion badges unaffected.
- Draft, physically-correct prediction questions are provided per section in the appendix (need author pedagogy review).

### G — EM chart-quality fixes
- **Scope:** `PhysicsChart.tsx` (used in exactly 4 places: coulomb, gauss, em-wave ×2). recharts **3.8.1** natively supports the needed `type="number"`, `scale="log"`, and a second `YAxis` (verified in its `.d.ts`).
- **Component API:** add `xType`, `yScale`, optional `y2Label`/`y2Scale`, and `axis?: 'left'|'right'` per line — all with defaults that leave current behavior unchanged.
- **Call-site fixes:** stop stringifying x via `toFixed` (keep numeric → true continuous axis); log-y for the inverse-square curves (coulomb F, gauss E); split Gauss's two different-unit series onto separate axes (replace the meaningless shared "Value" axis).
- **Guard:** log axis needs strictly-positive values — guard Gauss when `charge === 0`.

---

## 5. Open decisions for your review

Each has my recommendation; override any during review.

| # | Decision | Recommendation |
|---|---|---|
| **E1** | Phase-1 E scope: retint only the 5 chrome surfaces, or also the ~174 engineering-blue usages in section bodies/Tabs/AiTutor/gates? Chrome-only leaves a **mixed** blue+instrument look until a later sweep. | **Chrome-only now**, add a "content retint sweep" as a fast-follow. Keeps E shippable; the token layer makes the sweep mechanical later. |
| **E2** | `--color-power` becomes green `#059669`, but the canvas palette `em/constants/physics.ts` `COLORS.POWER` is purple `#9333ea` (separate constant). | Leave canvas constants alone in Phase 1 (chrome vs canvas are different layers); revisit canvas alignment in the content sweep. |
| **E3** | Where does the Part→quantity word map live? | Export from `curriculum.ts` (it's metadata, reused by 2 components). |
| **E4** | Dark-mode Part accents: keep light values or lighten one step? | Lighten one step on dark cards for contrast. |
| **C1** | Numbering depth: `5.2` only (drop in-section sub-numbers), `5.2.3` three-level, or drop all numbers? | **`Part.Section` (5.2) on the section; in-section sub-headings become title-only** (avoids clunky 5.2.3). |
| **B1** | The 11 dead images: source substitutes (with new attribution) or drop the figure? | **Substitute all 11** (all standard topics); I'll propose each replacement for your sign-off during implementation. |
| **B2** | Vendor the 500px thumbnail (parity, smaller) or full-res original? | 500px thumbnail (matches current rendering + click-to-zoom). |
| **F1** | `allowSkip` house rule: the Faraday model is skippable, TransmissionLines is hard-block. | **`allowSkip={false}` everywhere** — matches your "blocking, must commit" preference (and consider making the existing Faraday-style gates consistent). |
| **F2** | Maxwell has no slider sim — gate its 4 animated equation cards? | Yes, gate the 4 cards (the primary interactive element). |
| **A1** | Bench ratio 48% vs 50%; jump-link opt-in vs always-on; Smith `max-h` cap. | 48%, opt-in via props, leave the Smith cap (revisit in visual QA). |
| **G1** | Gauss: dual-axis one chart, or two separate charts (flux constant + E vs r)? | Dual-axis with unit-labelled axes; reconsider if it reads poorly in QA. |
| **G2** | em-wave E&B snapshot: keep the deliberate `×c` single-axis, or true-scale second axis? | True-scale second axis (drops the `×c` fudge) — pedagogy sign-off welcome. |

---

## 6. Risks

- **Mixed palette during E** if E1 = chrome-only — the app will show blue brand + instrument accents until the content sweep. Acceptable but visible; flagged for QA.
- **Canvas/CSS power-color divergence** (E2) — purple canvas vs green Part accent.
- **Smith chart letterboxing** at the wider bench (A).
- **Log-axis zeros** (G) — must guard Gauss `charge === 0`.
- **Animation-on-reveal** (F) — each gated EM canvas runs an rAF loop; verify it starts drawing/sizes correctly when the gate reveals it (the Faraday reference handles this; confirm per section).
- **Image licensing** (B) — CC BY-SA requires the rendered attribution to remain (it does, via `FigureImage`); confirm the substitutes' attributions.
- **No headless coverage of visuals** — chassis/cards/sim sizing/chart readability/dark mode all require a manual walk (consistent with Phase 0).

---

## 7. Verification (definition of done)

- `npm run build` (`tsc -b && vite build`) exits 0; `npm run lint` exits 0.
- `npm test` green, including **new** tests: `LabLayout` (mobile order + jump anchor), `getSectionNumber` mapping, and at least smoke coverage that each of the 9 gated sections renders its gate.
- Manual visual walk: chassis/cards render in the new palette; every sim still sized; every chart readable (numeric x, log where applied); every gate blocks until prediction; all images load (0 "Image unavailable"); section numbers correct (esp. Antennas = 4.x); dark mode holds.
- No remaining external image hotlinks (optional CI/lint guard — decision B3).

---

## 8. Out of scope (Phase 1)

- New sims/content (RC/RL/RLC explorer, live pole-zero, ILO9 Heaviside) → Phases 2–3.
- Full content-body engineering-blue retint, unless E1 says otherwise → fast-follow sweep.
- Canvas `physics.ts` palette overhaul (E2).
- `Tabs`/`TabSet` unification (separate cleanup, tracked elsewhere).
