# EM-CA-LAB — Post-Redesign Audit: LO coverage · correctness · design uniformity · scroll-vs-tabs (2026-07-03)

Charter: `docs/audits/2026-07-03-post-redesign-audit-prompt.md` (report-only run; no source
changes; the only repo writes are this file and `docs/BL30A0350-learning-outcomes.md`).
Executed as a multi-agent run: 5 finder/council workflows (19 agents), 8 independent
verifier agents, 2 Playwright measurement passes, python numeric re-derivations against
RK4/closed-form oracles, git archaeology, and web/benchmark research.

## Executive verdict

1. **LO coverage:** 10 of 12 LOs SOLID at the new taught + practiced + assessed bar;
   **LO5 and LO6 are PARTIAL** (missing the *practiced* leg). Both are effects of the
   stricter bar, not regressions. All 10 syllabus-content bullets MAPPED.
2. **Correctness:** the 2026-06-25 baseline is **TRUSTED** (5/5 canaries pass, whole
   punch-list dispositioned FIXED). The delta re-audit found **1 critical + 7 correctness
   majors** that are live today — the app-wide "strictly correct" requirement is **not yet
   met** until roadmap item #1 lands. All physics verdicts numeric-checked.
3. **Design:** three tiers — EM uniform-but-unretinted, circuits split into two visual
   generations, transmission untouched by the redesign above the gate/check layer.
4. **Scroll-vs-tabs:** measured, benchmarked, and council-reviewed: **keep long-scroll;
   NO wholesale tabs conversion.** Fix unit size + interaction density instead; de-tab the
   four legacy transmission sections (tabs are hiding their assessments); split
   magnetic-circuits; defer the transformers split until after its de-tab re-measure.
5. **Register:** 130 defect claims filed, every one independently re-verified:
   **107 CONFIRMED · 20 DUPLICATE · 3 ADJUSTED · 0 REFUTED** → **110 unique confirmed
   defects (1 critical / 31 major / 78 minor)**, plus 5 council-sourced findings
   (verified in-session).
6. Gates executed during this audit: `npm run build` green; `npx vitest run
   --no-file-parallelism` **764/764 green** (102 files, 389 s). E2E not run (no source
   changed; production build + preview exercised via the measurement passes).

---

## 0 · Pinned inventory, baseline & method

- **25 sections** in 5 Parts (9+4+4+4+4) per `src/shared/constants/curriculum.ts`
  (SECTION_LIST verified; duplicate-id and Part-reference guards present).
- **Correctness baseline** = commit `91d782a`, the parent of `f861dc8` (which added the
  2026-06-25 sweep). Delta to HEAD (`bc77566`): 84 commits; 125 changed files under
  `src/` + `e2e/`; classified into 38 in-scope content/physics/math files, 30
  SKIPPED-layout (each with reason), 57 test/e2e files (categorically excluded).
- **Verification protocol:** every ledger defect was re-verified by an independent agent
  that re-located the cited code by content and reproduced the evidence. Claims from the
  council's red team were verified in-session by direct reads (cited below).
- **Dimension D honesty note:** the first measurement pass was invalidated twice and
  re-run — (a) v1 measured `window` scroll but the app scrolls inside `#main-content`
  (`Layout.tsx:70`); (b) v1 saw only each section's **default tab**, undercounting tabbed
  sections and reporting "0 transmission gates" — false (9 exist, all in non-default
  tabs; caught by the council red team, confirmed by the tab-aware v2 pass).

---

## A · 12-LO coverage re-grade (taught + practiced + assessed)

Bar: an LO is covered only if it is (1) taught, (2) actively practiced, (3) assessed by a
ConceptCheck or PredictionGate. ICAP/Bloom graded twice: what the app OFFERS vs what a
typical student is REQUIRED to do (blocking gates only).

| LO | Verdict | Missing leg | ICAP off/req | Bloom off/req | vs D1 (2026-06-21) |
|---|---|---|---|---|---|
| 1 waves/radiation | **SOLID** | — | Constructive / Active | Analyze–Evaluate / Understand–Apply | solid ↑, agrees; no regression |
| 2 Ampère+Faraday+Lenz+Lorentz | **SOLID** | — | Constructive / Active | Apply–Analyze / Understand | solid =, agrees |
| 3 antennas | **SOLID** | — | Constructive / Active | Apply / Understand | solid =, agrees |
| 4 transmission lines | **SOLID** | — | Constructive / Active | Analyze–Evaluate / Understand | solid ↑, agrees |
| 5 DC inductance + mutual | **PARTIAL** | practiced | Constructive / Active | Analyze / Understand | stricter bar (D1 "solid (thinnest)"); gap unchanged |
| 6 EMF induction + forces | **PARTIAL** | practiced (forces clause) | Constructive (induction) / Active | Apply / Understand | stricter bar; D1 residual unchanged |
| 7 magnetic circuits | **SOLID** | — | Constructive / Active | Apply–Analyze / Understand | solid, agrees |
| 8 apply + plausibility | **SOLID** | — | Constructive / Passive–Active | Evaluate / Understand | solid (weakest) ↑; D1 punch-list verified implemented |
| 9 systematic analysis | **SOLID** | — | Constructive / Active | Analyze / Understand | solid =, agrees |
| 10 transmission networks | **SOLID** | — | Constructive / Active | Analyze / Understand | solid ↑, agrees |
| 11 transients | **SOLID** | — | Constructive / Active | Analyze / Understand–low-Apply | solid =, agrees |
| 12 step responses | **SOLID** | — | Constructive / Active | Apply / Understand | solid =, agrees |

**LO5 gap (major):** the headline phenomenon — current change in a DC circuit with
inductance — has no gated or assessed interactive anywhere: `SwitchedRCSim.tsx` is
RC-only (zero inductor references); interactive-lab's RL mode is ungated, unassessed, and
its RL challenge card has no `check()` (`challenges.ts:48-62`).
**LO6 gap (major):** forces-on-conductors has no interactive practice; `RodOnRailsFigure.tsx`
is a static SVG by design; busbar/loudspeaker are prose examples.

**Syllabus mapping: 10/10 MAPPED**, including the easy-to-miss sub-clauses — "identification
methods" is present by name (`PartialFractions`: "The course-named identification method"),
"radiation mechanisms" has a dedicated Thomson/Purcell kink treatment (maxwell), and
"transmission networks" is covered as source–line–load systems with lattice/bounce methods.

**Four systemic ceilings (apply to every LO):**
1. **Gates unlock on any committed answer** (`PredictionGate.tsx:134-160`) — required ICAP
   is Active everywhere; all Constructive work is optional.
2. **GuidedChallenge completion is self-reported and deliberately untracked**
   (`GuidedChallenge.tsx:29-48`) — the highest-ICAP activities leave no verified trace.
3. **expectedChecks: 0** for all 9 circuits sections and all 6 transmission sections
   (`curriculum.ts:68-76,88-100`) — those sections report "complete" on visit alone;
   `isModuleComplete` never consults gates (`progressStore.ts:73-76`).
4. **Assessed legs are skippable/unreachable** where they live in optional Practice tabs
   (antennas, transients, and — premortem catch — transformers).

---

## B · Correctness — app-wide verdict via baseline + delta + canary

**Punch-list disposition (2026-06-25 sweep):** N1–N5 **FIXED** (each re-located by content
and verified, e.g. N1 permittivities now exactly 3.7·ε₀/2.1·ε₀; N4 `faradayOrbitSign`
re-derived correct); Units #1–#5 **FIXED**; A.2#13 **OBSOLETE** (documented
keep-0-for-non-EM design rule); one cosmetic refactor note STILL-OPEN (harmless
indirection, `LineImpedance.tsx:59`). The 2026-06-21 A-list items encountered in the delta
were also spot-dispositioned FIXED (RL impulse H(s), core presets, ζ hint, axes labels…).

**Canaries — 5/5 PASS:** switched-circuits and laplace-theory (least-changed; 51 python
checks vs RK4/defining-integral oracles, zero defects), plus line-impedance,
transmission-lines, transformers (least-touched; full re-derivation of every displayed
formula). The baseline's *stability* is verified; see Methodology for the recall caveat.

**New confirmed defects (all numeric-checked where applicable):**

### P-01 · [critical/math] interactive-lab — `src/circuits/components/modules/InteractiveLab/index.tsx:191`
Displayed "Overdamped Step Response" `v_C(t) = V_s(A₁e^{s₁t} + A₂e^{s₂t})` is missing the
forced term — it decays to 0 for ANY constants; no choice makes it a step response.
RK4 vs solver: true response → V_s = 10 V. The app's most memorization-shaped artifact
(amber formula card) teaches a wrong closed form. *(B-14)*

### P-02 · [major/physics] interactive-lab — `InteractiveLab/index.tsx:82,117`
RC/RL impulse formulas labeled `v_C(t)`/`i(t)` omit the source factor V_s that the plotted
curves carry — 10× amplitude mismatch at defaults. *(B-15)*

### P-03 · [major/concept] interactive-lab — `InteractiveLab/index.tsx:248-252`
"Envelope τ = 1/α … 99% in ~5τ" shown for ALL damping types; for the DEFAULT overdamped
circuit the true 99% time is ≈21 of those "τ"s — the app's own plausibility heuristic is
wrong for its default state. *(B-16)*

### P-04 · [major/physics] circuit-analysis (shared strings) — `src/circuits/utils/componentMath.ts:36-38`
Homogeneous (natural-response) solutions presented by `TimeDomain` as "Step 4: Solutions by
Damping Type" for the DRIVEN step equation derived in Step 3. Same family as P-01. *(B-17)*

### P-05 · [major/physics] transients — `src/transmission/components/simulations/BounceDiagram.tsx:129-149`
Voltage-vs-time charts drop the (1+Γ) terminal-arrival term on the final visible segment:
with Γ_L=Γ_S=0.5, V0=2.5 V the load plateau plots 2.500 V where physics says 3.750 V (50%
low), then extends the wrong plateau. *(B-25)*

### P-06 · [major/physics] antennas — `src/transmission/utils/transmissionMath.ts:214` (readout at `RadiationPatternSim.tsx:230-233`)
`calculateRadiationResistance` returns R_rad referred to the current MAXIMUM but is
labeled plain "Radiation Resistance" (docstring claims feed-point): agrees with Ulaby's
73 Ω only at λ/2; at L=0.1λ displays 0.19 Ω vs the input-referred value. *(B-24)*

### P-07 · [major/math] polarization — `src/em/sections/polarization/index.tsx:372-373`
Equation panel displays `E_y = e_y·cos(kz − ωt + δ)` while the sim animates
`cos(ωt − kz + δ)` — the δ sign is inverted between displayed math and drawn wave, so
deriving from the panel yields the OPPOSITE rotation sense from the labeled state. *(B-01)*

### P-08 · [major/physics] em-wave — `src/em/sections/em-wave/index.tsx:891`
"Phasor Sync" phasor rotates CLOCKWISE on screen while the canvas label reads "↺ CCW",
contradicting the label and the e^{jωt} convention (cross-product check: −1.257e-3). *(B-02)*

### P-09 · [major/notation] em-wave — `index.tsx:1219-1220` (+ :67, :292, :304, :862-868, chartData.ts)
The entire AC-phasor view teaches **sine-reference phasors** (v = V₀sin(ωt+φ), signal =
Im-projection) against the course's SKILL-PINNED hard rule (cosine reference, Nilsson).
Systematic 90° exam error risk. *(B-03; also C-17)*

**App-wide closing verdict:** baseline TRUSTED + delta audited + canaries PASS, but the
app is **not yet strictly correct**: P-01…P-09 are live. After roadmap #1 lands (and its
fixes gain regression tests), the app is correct to this audit's depth (see Methodology
for what that depth excludes).

---

## C · Design-uniformity sweep (25 sections × 6 axes)

Axes: theme tokens · LabLayout · leadWithBench · scroll-spy · KaTeX/notation sameness ·
gate/ConceptCheck. Verdicts: U(niform) / Di (deviates-intentional) / DD (drift) / – (N-A).

| section | tokens | lablay | leadWB | spy | katex | gate |
|---|---|---|---|---|---|---|
| component-physics | DD | Di | – | DD | DD | U |
| circuit-analysis | DD | – | – | U | DD | U |
| nodal-mesh-analysis | U | Di | – | U | U | U |
| circuit-theorems | U | Di | – | U | U | U |
| switched-circuits | U | U | DD | Di | U | U |
| laplace-theory | DD | – | – | Di | DD | U |
| partial-fractions | U | Di | – | U | U | U |
| s-domain | DD | – | – | Di | U | U |
| interactive-lab | DD | Di | – | DD | DD | Di |
| coulomb | DD | U | U | U | U | U |
| gauss | DD | U | U | U | DD | U |
| ampere | DD | Di | Di | U | U | U |
| lorentz | DD | U | U | U | U | U |
| faraday | DD | U | U | U | DD | U |
| lenz | DD | U | U | U | DD | U |
| magnetic-circuits | DD | U | U | U | U | U |
| maxwell | DD | Di | Di | U | DD | U |
| em-wave | DD | Di | Di | U | DD | U |
| polarization | DD | U | U | U | Di | U |
| transformers | U | DD | DD | DD | DD | U |
| antennas | U | DD | DD | DD | DD | U |
| lumped-distributed | U | DD | DD | DD | DD | U |
| transmission-lines | U | U | DD | DD | U | U |
| line-impedance | U | U | DD | DD | DD | U |
| transients | DD | DD | DD | DD | DD | U |

Three tiers:
- **EM (10):** structurally the most uniform (shared shell, scroll-spy guard-tested,
  gates/checks/PlausibilityCallouts habitual); tokens uniformly pre-retint (known open
  item); notation wobbles concentrated here (ε glyphs, EMF glyphs, dA-for-dS).
- **Circuits (9):** two visual generations — redesigned core (nodal-mesh, circuit-theorems,
  switched-circuits, partial-fractions) vs four legacy skins (component-physics,
  laplace-theory, s-domain, interactive-lab). One real accessibility bug: s-domain
  pole-zero charts hardcode light-only colors — barely legible in dark mode
  (`SDomainAnalysis.tsx:290`, confirmed no isDark path). Two PHANTOM gate progress keys
  (`laplace-motivation`, `interactive-lab-sdomain`) match no curriculum id.
- **Transmission (6):** the redesign stopped at the domain boundary: zero shared
  scroll-spy (antennas keeps a legacy local hook), zero leadWithBench, four different
  header treatments, two competing tab idioms inside Part 5, sims rendered bare in legacy
  Theory/Simulations/Practice tabs, domain-local canvas hook (no DPR_MIGRATED entries).
  Gates/checks are the one uniform layer.
- **Cross-domain majors:** section-header divergence circuits↔EM a student sees at every
  Part 1→2 transition; EM shared-chrome vs body two-generation styling; indigo vs
  engineering-blue worked-example borders (magnetic-circuits vs ampere/lorentz/faraday).

Intentional deviations respected as decisions (not drift): LabStation-instead-of-bench for
circuits labs (ultraplan owner decision #1), tabbed-trio scroll-spy exclusion
(decision #3), ampere/maxwell/em-wave full-width exemptions (ultraplan #13),
polarization's declared optics-convention note.

---

## D · Scroll measurement + navigation restructure decision

**Method (v2, tab-aware):** production build, `vite preview :4273`, Playwright from the
session scratchpad; `#main-content.scrollHeight` per section at desktop 1280×800 and
mobile 375×667; every ARIA tab visited; gates unlocked via the `unlockGates` contract
before measuring. Metrics: default-pane height (single-scroll burden) and sum of tab-pane
heights (total content volume). Selector rules: gates = `[data-gate]`; sims = canvas +
`.recharts-wrapper`; blocks = h2/h3 in `#main-content`.

| section | tabs | gates | desk default× | desk total× | mobile total× |
|---|---|---|---|---|---|
| magnetic-circuits | 0 | 2 | **11.3** | 11.3 | 19.7 |
| transformers | 3 | 2 | **10.3** | 16.2 | 27.3 |
| circuit-theorems | 0 | 3 | **9.3** | 9.3 | 14.1 |
| faraday | 0 | 2 | **8.9** | 8.9 | 16.3 |
| em-wave | 0 | 2 | **8.9** | 8.9 | 17.3 |
| circuit-analysis | 0 | 1 | **7.5** | 7.5 | 14.5 |
| lorentz | 0 | 1 | **7.3** | 7.3 | 14.6 |
| nodal-mesh-analysis | 0 | 2 | **7.3** | 7.3 | 10.3 |
| partial-fractions | 0 | 1 | **6.7** | 6.7 | 10.2 |
| maxwell | 0 | 2 | **6.4** | 6.4 | 15.3 |
| line-impedance | 4 | 1 | 3.9 | 14.2 | 26.5 |
| antennas | 3 | 1 | 4.9 | 10.9 | 20.5 |
| transmission-lines | 4 | 3 | 2.5 | 10.8 | 24.8 |
| transients | 3 | 1 | 3.7 | 10.0 | 21.4 |
| switched-circuits | 3 | 1 | 3.7 | 10.0 | 16.9 |
| s-domain | 3 | 1 | 3.4 | 9.2 | 14.2 |
| laplace-theory | 3 | 1 | 4.5 | 8.6 | 13.1 |
| lumped-distributed | 3 | 1 | 4.0 | 8.2 | 16.2 |
| ampere | 0 | 2 | 5.4 | 5.4 | 10.3 |
| coulomb | 0 | 1 | 5.3 | 5.3 | 10.8 |
| polarization | 0 | 1 | 4.7 | 4.7 | 10.7 |
| lenz | 0 | 1 | 4.3 | 4.3 | 8.9 |
| gauss | 0 | 1 | 4.1 | 4.1 | 8.5 |
| interactive-lab | 0 | 1 | 4.0 | 4.0 | 7.3 |
| component-physics | 0 | 1 | 3.5 | 3.5 | 8.6 |

App-wide: **36 blocking gates** (9 in transmission, all inside non-default tabs — the
default tab of every legacy-tabbed transmission section is pure theory with the bench
hidden behind a tab click).

**Two distinct diseases, one symptom:**
1. **Single-scroll burden** — the ">6× default-pane" cohort (threshold at the natural
   break 5.4→6.4, ≈2× the benchmarks' 10–15-min unit): the 10 bolded sections.
2. **Tab-buried volume** — the 7 legacy-tabbed sections measure "fine" per pane but hide
   35–75% of their content (including gates and their entire assessed leg) behind
   non-default tabs.

**Decision (council-reviewed, per cohort):**

| Cohort | Go / no-go |
|---|---|
| All 25 — wholesale tabs conversion | **NO-GO.** Benchmark convergence (zyBooks 84-87% completion with activity-punctuated scroll; Pearson steppers only wrap graded items; PhET tabs only at bench level; Brilliant's stepper serves standalone self-study, not course revision), plus in-app evidence: the only places tabs exist today produced the reachability majors, and `Tabs.tsx` remounts panels (`key={activeIndex}`) so gated content inside tabs loses state without lifting. |
| All 25 — named-chunk scrolling | **GO (constrained):** 3–5 labeled chunks/section with completion ticks derived ONLY from in-chunk interactions (gates + identity-keyed checks — never scroll position); expectation-card counts computed, never hand-written; transmission phased after scroll-spy lands there. |
| >6× cohort (10) — density pass | **GO (triaged):** attack stretches >2.5 viewport-heights first; every added interaction substantive; derivations get their check at the END, never mid-proof; secondary derivations default-collapsed (anchor on the collapsible header; `hidden=until-found` where supported). |
| magnetic-circuits — split | **GO:** split at its own subtitle's seam ("flux, reluctance" / "inductance, mutual"); keep the existing id/route for part I; content-parity ledger mandatory; new section id → registry + e2e tables. |
| transformers — split | **DEFER:** de-tab first (below), re-measure, split only if still >~8× desktop — one surgery on the file, not two. |
| transmission legacy tabs (transformers, antennas, lumped-distributed, transients) — de-tab | **GO:** retire Theory/Simulations/Practice tabs; Practice content inlines after the relevant sim (fixes the unreachable-assessment majors); adopt the chaptered idiom of 5.2/5.3 or the EM shell. Must land BEFORE completion-wiring phase 2 and BEFORE the transformers split decision. |
| circuits tabbed trio (switched-circuits, laplace-theory, s-domain) | **NO-GO** (owner decision #3 stands; their tab-lift `initialPassed` pattern is the model for D-R6). |
| Bench-level tabs (multi-mode sims) | **ALLOWED** (PhET screen model) + add a static guard test flagging any PredictionGate inside a Tabs panel without `initialPassed` wiring. |

---

## E · Benchmark research (PhET · CircuitJS · Brilliant · Khan/Perseus · zyBooks · Pearson)

| Product | Unit size | Navigation | Predict-first analogue | Assessment placement |
|---|---|---|---|---|
| PhET | 1–5 no-scroll sim screens; ≤3 goals/activity | Tabs at BENCH level only; free order; URL-curated | Worksheet/clicker predictions (social, never enforced) | Outside/after the sim; optional Game screens |
| Falstad CircuitJS | 1 circuit = 1 unit (366 presets) | Single canvas + menu; deep links (?ctz=) | None (explore-first; host page can gate) | Entirely external |
| Brilliant | 5–15 min lesson, question per screen | Full-screen stepper | Official pretest-first philosophy | Assessment IS the content |
| Khan / Perseus | ~5-min nodes; 4–7-question exercises | Short pages + TOC; one question/screen | Weak (unit-test-first path; hint forfeits credit) | Interleaved + unit tests; multi-hint ladders |
| zyBooks | 10–15-min section (measured ~587 s) | **Scroll**, activity-punctuated | Answer-before-reveal (90% attempt earnestly) | Two-tier: participation (earnest) vs challenge (correct) |
| Pearson Mastering | multi-part item; hint ladders | eText scrolls; stepper wraps graded items only | **Pause-and-predict videos** (direct PredictionGate cousin) | Assessment is the product; DSM confidence cycles |

Distilled verdicts for EM-CA-LAB (full argument per pattern in the council record):
- **ADOPT:** implicit scaffolding audits of slider ranges (PhET); ~3-learning-goals/unit cap;
  URL/state deep-link curation for lecturer use; keep sim viewport instruction-free;
  `model.md` per physics module; immediate-visual-feedback polish over gamification
  (CircuitJS); interaction-density authoring rule ("less text, more action", zyBooks 118%);
  per-activity completion iconography + TOC progress; pre-activity expectation cards;
  earnestness-budget authoring rules; keep scroll — fix unit size (zyBooks+Pearson).
- **ADAPT:** open-play beat AFTER the gate ("try to break your own prediction");
  one-gate-per-sim ceiling (anti-overlock); bench preset libraries (named single-concept
  states); chunked 5–15-min sub-units with visible completion; Perseus-style multi-hint
  ladders (component support only — no authoring campaign); spaced per-Part checkpoint
  quizzes (formative only); course-map progress view; wrong-answer-specific feedback per
  option; post-outcome reflection step (Pearson pause-and-predict's missing half);
  LO-tagging of activities now that `docs/BL30A0350-learning-outcomes.md` exists.
- **REJECT:** full-screen steppers for exposition; sandbox-first; removing gates (PhET's
  free navigation assumes a physically present teacher — the gate IS the worksheet);
  mastery ladders that demote; streaks/leagues/leaderboards; punitive wrong-answer point
  deductions (documented collusion driver); adaptive engines; Perseus-style content
  schema migration (wrong altitude for 25 bespoke TSX sections).

**Gamification open item — decision: SURFACE, don't delete** (course map + per-chunk
ticks + optional per-Part challenge station later), per zyBooks two-tier evidence and
PhET's autonomy findings.

---

## Council record

**Devil's advocate over 18 draft recommendations: 6 SURVIVES · 12 DOWNGRADE · 0 KILL.**
Notable finals (all folded into §D and the roadmap): chunk ticks must be
interaction-derived (scroll ticks = the same lie as completion-on-visit); density rule
triaged not absolute (interaction-spam devalues the gate ritual); magnetic-circuits split
now / transformers deferred behind de-tab; universal post-sim re-ask KILLED in favor of a
**wrong-answer-only, non-blocking follow-up** (the POE "explain" step the design drops)
plus surfacing recorded prediction accuracy; completion wiring phased (circuits + 5.2/5.3
now, tabbed transmission after de-tab) with a guard that expectedChecks never exceeds
wired checks; notation sweep tiered by exam consequence (one symbol-family per commit);
s-domain promises fixed cheaply now, shared answer-entry component later; hint ladders
component-support-only; bench-state persistence gated behind a design note (resetKey
interaction).

**Red team (3 personas) — 5 NEW findings, all verified in-session:**

### RT-1 · [major/pedagogy] all EM sections — `ConceptCheck.tsx:101-104,129-136` + `progressStore.ts:73-76`
One ConceptCheck can satisfy an entire section badge: `onComplete` fires on every correct
click, "Try Again" re-arms the same question, and the store counter is identity-less —
three clicks on one known answer = expectedChecks:3. *(verified: onClick fires
onComplete?.() whenever option.correct; Try Again resets selectedIndex)*

### RT-2 · [major/ux] app-wide — `PredictionGate.tsx:111`
Gate unlock state is never persisted: `passed` is component `useState`; no EM section
passes `initialPassed`. Every reload re-locks every gate — gated content is invisible to
Ctrl+F/print and re-gated on every revision visit (undercutting scroll's own revision
advantage), while gate counters inflate on each revisit.

### RT-3 · [major/measurement+ux] transmission — all six sections
Nine blocking gates exist but every one sits inside a NON-default tab; the default tab is
pure theory. A skimming student never meets a gate; the v1 audit itself was fooled
(measured "0 gates"). *(independently confirmed by the v2 tab-aware measurement)*

### RT-4 · [minor/pedagogy] AiTutor — `AiTutor.tsx:200,261`
The in-app tutor receives no section context on send (`sendMessage(userMessage)` only)
and its system instruction carries no course-notation rules — an unaudited channel that
can teach conventions the exam marks wrong, and a soft bypass of the gate ritual.

### RT-5 · [minor/pedagogy] circuits Part 1 — `ConceptCheck.tsx:152-158`
predict-reveal checks fire `onComplete` on the "Reveal Answer" click itself — completion
credit for zero cognitive work. Harmless today (consumers have expectedChecks:0); a
landmine under roadmap #2. Fix check-identity + reveal semantics together with #2.

**Premortem (3 stories → 19 checks: 15 COVERED by the register, 4 NEW gaps):**
Story 1: LO5/LO12 exam underperformance traced to the RC-only bench + recognition-only
assessment + the P-01 wrong formula card. Story 2: week-10 abandonment — no return loop
(completion-on-visit, untracked challenges, orphaned quiz scores), then the Part 4→5
quality cliff arriving exactly in exam-critical weeks. Story 3: "the screenshot that cost
four points" — P-01's card, memorized. NEW gaps worth acting on: **(a)** calibrate against
2–3 past BL30A0350 exam papers (no exam-alignment dimension existed); **(b)** transformers'
Practice-tab reachability was never itemized (same class as antennas/transients — fixed
incidentally by de-tab, tracked explicitly here); **(c)** no lecture-week↔section mapping
exists in the app (zero "week" references in src/) — verify spine order against the real
teaching schedule; **(d)** observability: progress is localStorage-only; decide
deliberately between privacy-safe analytics vs documented blindness (note: `useAnalytics.ts`
already integrates Vercel Analytics — its dashboard data was never consulted by this audit).
Plus a guard-test class fix: pin displayed closed-form formula strings to the numeric
solver so the NEXT P-01 cannot ship.

**Completeness critic — 13 audit blind spots** (all logged as Not-tested in Methodology):
tab-pane blindness (fixed in v2), unconsulted Vercel Analytics data, unaudited AiTutor,
baseline recall-vs-stability, exam alignment, a11y beyond lint, low-end/throttled
performance with many live canvases, Chromium-only evidence (real students run WebKit),
mobile interaction quality (touch targets, hover-only tooltips), edge-case sim configs,
PWA/service-worker update propagation (autoUpdate means students can see OLD formulas
after fixes land — remediation caveat for roadmap #1), L2-English reading level, and the
repo gates (closed in-session: build + 764/764 vitest green; e2e not run).

---

## Defect register

**110 unique confirmed defects** (107 CONFIRMED + 3 ADJUSTED; 20 duplicates folded into
their primaries) **+ 5 council-sourced (RT-1…RT-5)**. Zero claims failed reproduction —
the PLAUSIBLE appendix is empty. Every item carries file:line evidence re-verified against
the current tree (2026-07-03, HEAD `bc77566`).

**Critical (1):** P-01 above.

**Majors (31 confirmed + 3 council RT majors):** correctness P-02…P-09 (§B); LO majors —
RL practiced-leg gap (A-28 family), forces-on-conductors gap (A-22), antenna gain/efficiency
taught only inside a distractor (A-06), antennas/transients assessed legs unrouted
(A-07/A-14), gates-under-demand family (A-17/A-31 root: unlock-on-any-answer), challenge
non-verification (A-19 family), expectedChecks:0 completion-on-visit (A-34 root),
MC-only "Solve" verbs (A-35/A-44), unfulfilled s-domain promises (A-36/A-39),
plausibility never practiced with feedback (A-42); design majors — cross-domain header
divergence (C-01), s-domain dark-mode charts (C-02), circuits two-generation split (C-03,
adjusted: legacy = component-physics/laplace-theory/s-domain/interactive-lab), circuits↔EM
shell divergence (C-13), EM two-generation body styling (C-14), magnetic-circuits indigo
borders (C-15), gauss/maxwell dA-for-dS (C-16→B-35), em-wave sine phasors (C-17→B-03),
transmission no-scroll-spy (C-28), no-leadWithBench (C-29), header chaos (C-30), two tab
idioms (C-31); plus RT-1, RT-2, RT-3.

**Minors (78 confirmed), by family** (ids in the verified ledger; primaries only):
- *Notation vs course conventions (SKILL-PINNED):* dA→dS app-wide (B-35 + B-34 bare-italic);
  spherical r→R (B-08 coulomb, B-09 gauss); ρ_l vs λ line charge (B-07); ε glyph mixing
  (B-10); EMF glyph mixing ℰ/ε/varepsilon (B-11); flux-linkage λ₂ vs Λ (B-28); Laplace 0⁻
  lower limit (B-37) + f(0)/f(0⁻) mixing (B-38); linearity-property tautology (B-39) +
  missing a>0 (B-40); x/z coordinate seam 5.1↔5.3 (B-30); pole markers '+' vs 'x' (B-41);
  θ-ring >180° labels (B-27); energy symbol tension W vs w (C-06, adjusted: skill §9
  allows W for total stored energy — clarify the skill rather than mass-edit); unit-space
  typography and Γ-subscript case in transients (C-37); Unicode-subscript vs math notation
  in sim labels (C-38); Greek-as-HTML-entities beside KaTeX (C-33); "S-Domain" heading
  capitalization (C-08); Z_total italic subscripts (C-05 family); option-label math styled
  three ways (C-12).
- *Physics/labels (minor):* ampere ring-arrow bunching (B-04); lenz derivative comment
  typo −3ad²→−3a²d (B-13, code correct); Q_JONES lag/lead wording (B-33); Zs slider inert
  in TransmissionLineSim (B-42 + B-29); transformer photo misidentified (B-31); silver/gold
  permeability copy-paste (B-22); capacitor/inductor drawing labels A on a length (B-21);
  τ readout missing Ω (B-20); gauss N/C vs V/m mixed (B-12); em-wave α (arb.) decoupled
  from physical α (A-01); normal-incidence-only media coverage (A-02); polarization
  optics-vs-IEEE handedness disclosed but exam-risky (A-03); maxwell cards watch-only
  (A-04); Q_PHASOR badge-counted but off-LO (A-05); marginal-stability overstatement
  (B-23); s-domain Case C wording; stale `_gammaToZL` docstring (B-26).
- *Pedagogy/UX (minor):* antennas challenge references a Skip control that doesn't exist
  (A-09); GuidedChallenge placed outside `</Tabs>` (A-10 adjusted: co-visible only at tab
  bottom; A-13/LineImpedance same); Lenz assessment direction-only (A-21); faraday
  gate/sim scenario mismatch (A-20); motional-EMF numeric assessment optional (A-23);
  strongest faraday teaching behind mid-column gate (A-24); magnetic-circuits 4 T default
  with footnote-only caveat (A-33); forward-referenced M before definition (A-30);
  single-loop-only magnetic circuits (A-32); nodal/mesh labs are single-topology FSMs
  (A-37); laplace-theory gate asks a rhetorical count (A-43); interactive-lab allowSkip
  gates (A-46); zero-state-only lab vs switched-circuits warning (A-47); StandingWaveQuiz
  score feeds nothing (A-15); gauss mode-conditional checks vanish (C-20) + E-unit split
  (C-21); phantom gate keys (C-09); hand-rolled PlausibilityCallout twins (C-19-family,
  C-32); per-sim affordance color inventions (C-26); dead expectedChecks tracking
  domain-wide (C-40); transmission local canvas hook / no DPR_MIGRATED ids (C-41);
  legacy-skin token drift items (C-04, C-07, C-10, C-11, C-24, C-25, C-27, C-35, C-39);
  single-stub recipe deliberately deferred (A-13, recorded, not a defect to fix);
  S-parameters named-not-taught (A-11); vec-vs-bold vectors app-uniform deviation (C-24,
  logged once); RT-4, RT-5.

*(Primary-id map for every duplicate and the full verification notes are in the session
verification record; all 130 raw claims trace to Dimensions A/B/C workflows.)*

---

## Top-10 roadmap (impact ÷ (effort × risk), each 1–5; higher score = do sooner)

| # | Item | I | E | R | Score | Notes / sequencing |
|---|---|---|---|---|---|---|
| 1 | **Physics-truth batch**: P-01…P-09 + dark-mode pole charts (C-02); load `em-ca-textbook-conventions` first; fix em-wave sine-phasors ONCE with #6's cosine family; add formula-vs-solver guard tests so the next P-01 can't ship; note SW autoUpdate propagation when announcing fixes | 5 | 2 | 1 | 2.50 | The one indefensible category. |
| 2 | **Cheap wins**: fix 2 phantom gate keys (C-09); `model.md` per physics module; stateless named bench presets | 2 | 1 | 1 | 2.00 | Zero-risk warm-up batch. |
| 3 | **Completion & tracking integrity, phase 1**: derived completion rule (gates committed + N identity-keyed checks) for 9 circuits + 5.2/5.3; fix RT-1 (check identity), RT-5 (reveal ≠ complete), RT-2 (persist gate unlock via `initialPassed` from store); guard: expectedChecks ≤ wired checks; surface course-map + per-chunk ticks (= gamification decision: SURFACE) | 5 | 3 | 1 | 1.67 | Phase 2 (tabbed transmission) blocked on #7. |
| 4 | **Gate follow-up (downgraded R1)**: wrong-answer-only, non-blocking micro-question after unlock + show recorded prediction accuracy | 3 | 2 | 1 | 1.50 | Never a second blocking gate; skip resetKey gates. |
| 5 | **s-domain promise repair**: fulfill both forward promises minimally (Z_R/Z_L/Z_C assembly passage + IC-source worked example); defer any bespoke builder to a shared answer-entry component | 3 | 2 | 1 | 1.50 | Fixes A-36/A-39 + the "assuming zero ICs" contradiction. |
| 6 | **Notation sweep, Tier 1 (exam-consequence)**: cosine phasors (with #1), dA→dS, ρ_l, spherical R, Λ flux linkage, 0⁻ limits + f(0⁻), x/z seam — one symbol-family per commit, each app-wide | 4 | 2 | 2 | 1.00 | Tier 2 glyph cosmetics ride with #11/retint. |
| 7 | **RL bench + rod-on-rails-lite (LO5/LO6 practiced legs)**: extend SwitchedRCSim to RL (τ=L/R, same machinery); add gate + check; rod-on-rails gets a velocity slider + live EMF/force readouts on the existing SVG (not a new canvas sim); give the RL challenge card a `check()` | 4 | 3 | 2 | 0.67 | Closes both PARTIAL LOs. |
| 8 | **Chunked scroll + triaged density (10-section cohort)**: 3–5 named chunks + interaction-derived ticks + computed expectation cards; density pass on >2.5-viewport stretches; secondary-derivation collapses | 4 | 3 | 2 | 0.67 | EM + circuits now; transmission after #9. |
| 9 | **Transmission campaign (one coordinated Part-5 effort)**: de-tab the four legacy sections (Practice inlines after sims) → SectionAnchor rollout → shared header shell → LabLayout + leadWithBench benches (authoring the new gate predictions budgeted as content work) → canvas-hook migration + DPR_MIGRATED/MIN_CANVAS entries → then completion phase 2 → then re-measure transformers | 5 | 4 | 2 | 0.63 | Section-by-section PRs; fixes RT-3, C-28…C-31, A-07/A-14 + transformers reachability. |
| 10 | **Split magnetic-circuits** at the flux-reluctance / inductance-mutual seam; keep existing id/route for part I; content-parity ledger; registry + e2e table entries | 3 | 3 | 2 | 0.50 | Transformers split: decided after #9's re-measure (>~8× ⇒ split). |

**#11+ (explicitly parked):** full retint completion + Tier-2 glyphs (batch, one
screenshot churn); Perseus-style hint-ladder UI where multiple hints already exist;
bench-state persistence (needs a design note re: resetKey semantics); per-Part challenge
station; past-exam-paper calibration + lecture-week mapping + observability decision
(premortem NEW gaps — need course-owner input).

---

## Methodology & verification appendix

**Tested:** all 25 sections' source (3 domain uniformity agents, 188 tool calls); 12 LOs ×
3 legs with file:line evidence (5 agents, 149 calls); 38 in-scope delta files re-derived +
punch-list re-located by content + 5 canary sections at full rigor (7 agents, 271 calls,
26 python numeric checks vs RK4/closed-form/defining-integral oracles); 25 sections × 2
viewports × every ARIA tab measured on the production build (2 Playwright passes; v1
discarded — see §0); 6 benchmark products researched incl. 3 open-source repo inspections
(phetsims, circuitjs1, Khan/perseus); 130 defect claims independently re-verified (8
agents, 347 calls): 107 CONFIRMED / 20 DUPLICATE / 3 ADJUSTED / 0 REFUTED; council pass
(4 agents: 18 recommendations adjudicated, 5 new red-team findings — each verified
in-session by direct file reads); `npm run build` green; `npx vitest run
--no-file-parallelism` 764/764 green in 389 s.

**Not tested (and why):** e2e suite (no source changed; build+preview exercised instead);
baseline *recall* — files unchanged since 91d782a outside the 5 canaries were not
re-derived (canaries verify baseline stability; a defect the 06-25 sweep itself missed in
an untouched file would be invisible to both — accepted per charter's delta design);
exam-paper alignment (no papers available — premortem NEW gap, needs course owner);
AiTutor response quality (unaudited channel — RT-4 records the structural risk);
accessibility beyond the jsx-a11y lint baseline (no axe/keyboard/SR pass); low-end-device
performance (no CPU-throttled runs; many concurrent rAF canvases on the 11× pages
unprofiled); WebKit/Firefox (all dynamic evidence is Chromium); mobile interaction quality
(height measured, touch targets/hover-tooltips/gesture conflicts not); edge-case sim
configs (numeric checks swept nominal ±× multipliers, not boundary states); PWA/SW update
propagation; L2-English reading level; Vercel Analytics dashboard data (exists via
`useAnalytics.ts`, not consulted — reachability claims rest on code-structure inference).

**Judgment calls (selection; full trails in the workflow records):**
- v1 scroll measurements discarded twice rather than caveated — wrong scroll container,
  then tab blindness; v2 is the only measurement this report cites.
- "Too long" threshold N=6× desktop viewport: natural break in the data (5.4→6.4) ≈ 2× the
  benchmark unit; applied uniformly; sum-of-panes reported separately (different disease).
- PredictionGates counted as assessment-leg instances despite unlock-on-any-answer (they
  force a recorded commitment); GuidedChallenges counted as practice, never assessment
  (self-reported); required-vs-offered graded on what blocks progression.
- LO5/LO6 PARTIAL are bar-changes: every D1-cited artifact verified unchanged.
- Canary FAIL bar = critical/major physics defect predating the baseline; all findings in
  canary sections were minor or post-baseline → PASS.
- Notation judged against the em-ca-textbook-conventions RESOLVED course standard, not any
  single book; app-wide-consistent deviations (·vec vectors, dA) logged once as families;
  C-06 (energy W) kept minor-with-caveat — the skill itself allows W for total stored
  energy; recommend clarifying the skill.
- A.2#13 (transformers expectedChecks:0) honored as OBSOLETE per the prior audit's
  documented design rule — while this audit's roadmap #3/#9 recommends revisiting that
  rule deliberately, not treating it as drift.
- Red-team findings entered the register only after in-session direct-read verification;
  the premortem's four NEW gaps are recorded as audit gaps, not app defects.
- Report filed with sweep-form defect headers for new correctness items (P-xx) and
  family-grouped one-liners for minors — 110 individually-itemized entries would triple
  the report without adding action; every id remains traceable.
