# Audit charter prompt — post-redesign LO / correctness / design / scroll-vs-tabs audit

Paste-ready prompt for a fresh EM-CA-LAB Claude Code session. Improved via
prompt-improver on 2026-07-03 (two adversarial critique rounds: repo-reality,
execution-feasibility, fidelity-to-original). Decisions locked with Cássia:
report + roadmap only; taught+practiced+assessed LO rubric; delta re-audit with
re-derivation; benchmarks = PhET, Falstad/CircuitJS, Brilliant/Khan, zyBooks/Pearson.

---

ultracode

# EM-CA-LAB post-redesign audit — LO coverage, correctness, design uniformity, and the scroll-vs-tabs decision

This is a REPORT-ONLY run: produce an audit report plus a ranked roadmap. Do NOT change any source code, test, or config. Repo writes allowed: ONLY the report file (see Report) and `docs/BL30A0350-learning-outcomes.md` (Step 0). Writes outside the repo are fine and expected: measurement/derivation scripts in the session scratchpad (Dimensions B and D) and the auto-memory update in Step 0. If the audit reveals something urgent (broken build, live wrong physics), put it at the top of the report — do not fix it. Work autonomously: do not ask me questions mid-run; make reasonable calls and log every judgment call in the methodology appendix. When done, leave the two new files uncommitted in the working tree — I will review and commit.

## Why this audit
We recently finished a long refactor unifying the app and its design (redesign Tracks A/B/C, all on `main`). I need to know, post-refactor:
1. whether all 12 official learning outcomes are covered at a HIGH bar (taught + practiced + assessed — defined below), so the app drives higher-level learning and engagement, not just content presence;
2. whether the app is strictly correct against the course textbooks — this requirement is app-WIDE; Dimension B's baseline + delta + canary procedure is the mechanism, not the goal;
3. whether the design is now uniform across the entire app;
4. whether long-scroll sections should be restructured (tabs or alternatives) — with ZERO loss of content, simulations, functions, materials, or images.

## Course context (authoritative background — do not fetch LUT/syllabus pages to re-verify it; Dimension E's web research is separate and expected)
BL30A0350 Electromagnetism and Circuit Analysis, 6 ECTS, LUT University. Second-year international students in the Bachelor's Programme in Technology and Engineering Science (3+2 Bachelor + Master European system); prior knowledge: calculus, linear algebra, basic physics. The programme is multidisciplinary and oriented toward sustainable hybrid technology solutions for modern industry — judge audience fit of examples and difficulty against that profile. 14 weeks; week 1 is course introduction; weekly structure: 1×2h theory-focused lecture + 1×2h tutorial (problem solving and applications); all core content is introduced in lectures, tutorials reinforce. The app is the course's interactive virtual lab.

Syllabus content (each bullet must map to at least one app section — verify in Dimension A):
- Electric and magnetic fields
- Electromagnetic waves and radiation mechanisms
- Lorentz force
- Ampère's, Faraday's, and Lenz's laws
- Antennas and basic radiation principles
- Transmission lines and distributed parameter models
- Magnetic circuits, inductance, and mutual inductance
- Systematic circuit analysis methods (including Heaviside and identification methods)
- Laplace transforms applied to circuits
- Transient behavior of RLC circuits and transmission networks

Textbooks — the authority for academic level and content depth:
- Ulaby, Fundamentals of Applied Electromagnetics (EM primary)
- Ida, Engineering Electromagnetics (EM secondary)
- Nilsson & Riedel, Electric Circuits (circuits + Laplace)

**Notation authority:** the three books CONFLICT on several symbols (area A vs S; flux linkage λ vs Λ vs NΦ; φ as phase angle vs azimuthal angle; energy w vs W vs E; circuit vs field phasor typography). The `em-ca-textbook-conventions` skill is the course's conflict-resolution authority — load it FIRST, before judging any notation or equation form. Its resolved conventions ARE the course standard and outrank any single book's usage.

## The 12 official learning outcomes (quote them exactly this way in the report)
1. Describe the mechanisms of electromagnetic radiation and the behavior of waves in various media.
2. Explain and apply Ampère's, Faraday's, and Lenz's laws, and the Lorentz force, using practical examples relevant to electrical engineering.
3. Discuss antenna functions and their applications.
4. Model and analyze transmission lines using distributed parameters and core theoretical concepts.
5. Explain current changes in DC circuits with inductance and define mutual inductance.
6. Describe the induction of electromotive force and forces on conductors in magnetic fields.
7. Formulate and solve equations relating to magnetic flux, field strength, and flux density in magnetic circuits.
8. Apply theoretical knowledge to resolve basic electromagnetic problems, evaluating the plausibility of results.
9. Solve electrical circuits using systematic analysis methods.
10. Identify essential methods for analyzing and describing transmission networks.
11. Explain and compute transient phenomena in electrical circuits.
12. Determine voltage or current changes, such as after step-voltage inputs to circuits.

## Step 0 — persist the LO list
Write the 12 LOs above verbatim (with the course-context header) to `docs/BL30A0350-learning-outcomes.md` — this becomes the canonical LO source for future audits; the repo currently has none. Then update the auto-memory file `em-ca-lab-no-lo-document.md` to record that the document now exists.

## Step 1 — read the baselines BEFORE judging anything
- `docs/audits/2026-06-21-full-audit.md` — the prior audit: D1 re-graded all 12 ILOs SOLID (at a presence-at-depth bar), D2 design verdicts, D4 ranked backlog. Follow its overall report structure.
- `docs/audits/2026-06-25-fresh-uniform-sweep.md` — the correctness baseline; its open punch-list (defects N1–N5 + the units-on-labels list) must be dispositioned in Dimension B. Its per-defect header form (`### Nx · [severity/category] section-id — file:line`) is the house defect format to emit.
- `src/shared/constants/curriculum.ts` — single source of truth for Parts → sections → domains: exactly 25 sections in 5 Parts (9+4+4+4+4).
- `CLAUDE.md` — architecture spine; known open items to treat as known (not discoveries): full-body engineering-blue retint; transmission domain has NO scroll-spy (zero SectionAnchor usage) and NO leadWithBench predict-first benches (transmission-lines and line-impedance do use plain LabLayout — the gap is uniformity, not total absence); gamification dead-tracking surface-or-delete decision.
- **Baseline pin:** baseline = the tree the 2026-06-25 sweep audited. Find it as the parent of the commit that added `docs/audits/2026-06-25-fresh-uniform-sweep.md` (`git log --follow --oneline -- <that file>`); state the SHA you chose in the report. Delta = `git diff --name-only <SHA>..HEAD`. Expect a substantial delta (~84 commits, ~52 touching src/: LabLayout/leadWithBench migrations of coulomb, lenz, polarization, faraday, magnetic-circuits, lorentz, gauss; SectionAnchor rollout across EM sections; nav shell; mobile tab bar; gate reskin).

## Dimension A — LO coverage at the taught + practiced + assessed bar
Build an LO × section matrix from `curriculum.ts`. An LO counts as COVERED only if all three legs exist somewhere in the app:
1. **Taught** — theory / worked derivation present;
2. **Practiced** — the student actively manipulates something tied to the LO (simulation parameters, GuidedChallenge, LabStation task);
3. **Assessed** — a ConceptCheck or PredictionGate prediction actually tests it.
Grade each LO on ICAP (Passive/Active/Constructive/Interactive) and Bloom's level, and separately state the level a student is REQUIRED to reach (blocking gates) versus what is merely offered. Where a verdict differs from the 2026-06-21 D1 grade, say explicitly whether that's the stricter bar or a real regression.
Also verify every syllabus-content bullet (list above) maps to at least one section.
Output: the matrix + per-LO verdict (SOLID / PARTIAL — which leg missing / GAP). Evidence is required per LO per leg — the strongest instance, as file:line or section id; matrix cells may be bare marks.

## Dimension B — correctness: app-wide verdict via baseline + delta + canary
Scope rule — an in-scope "content/physics/math file" = `physics.ts` / `*Math.ts` / `*challenge*.ts` / `chartData.ts` / sim components / any changed file containing formulas or physical constants. Exclude `__tests__/` and files whose diff is layout/styling only — list every excluded file as SKIPPED-layout in the methodology appendix so the scoping is auditable.
For each in-scope file changed since the baseline SHA:
- **Physics/math:** re-derive independently; for any formula that drives a simulation, run a numeric spot-check (`py` scripts in the session scratchpad, Windows-style paths) against the textbook form;
- **Notation:** judge against the resolved course conventions in `em-ca-textbook-conventions`, NOT against any single book — where the books disagree, matching the skill's resolution is CORRECT even if it deviates from one textbook's symbol; a notation defect is a deviation from the course standard or an inconsistency between app sections. Cite book + topic (or the skill's resolution) for every verdict; give chapter/section numbers only where the skill's reference files pin them, otherwise mark the citation MEMORY-DERIVED — verifiers reproduce the physics, not the chapter number.
- **Punch-list:** mark each open 2026-06-25 item (N1–N5 + units-on-labels) FIXED (with evidence) or STILL OPEN. Re-locate each item by CONTENT, not by the cited line number — the migrations after the sweep make its line numbers stale.
**Canary (the baseline-trust check):** audit at full rigor the sections LEAST touched since baseline — at minimum `switched-circuits` and `laplace-theory` (only test files changed), plus the 3 sections with the smallest non-test diff (list them with diff stats in the appendix). Changes confined to `__tests__/` or to shared components a section merely imports do not disqualify it. If any canary fails, the 2026-06-25 baseline is no longer trustworthy: widen to a full fresh sweep and say so in the report.
Close the chapter with an explicit whole-app correctness verdict (baseline + delta + canary combined).

## Dimension C — design-uniformity sweep
Per section × axis, verdict vocabulary: UNIFORM / DEVIATES-intentional / DEVIATES-drift / N-A (tag intentional vs drift via git history when unsure).
Axes and method: engineering-blue/theme-token adoption, LabLayout presence AND leadWithBench predict-first ordering, SectionAnchor/scroll-spy presence — all by grep; KaTeX/typography consistency by inspecting shared-primitive usage, including cross-section symbol uniformity against the `em-ca-textbook-conventions` course standard (correctness of notation is Dimension B's job; SAMENESS of notation across sections is this axis); ConceptCheck + PredictionGate presence and uniform styling by grep + spot render; mobile layout sanity from the Dimension D mobile-viewport page loads (reuse them — do not reload sections separately).
Output: section × axis verdict table.

## Dimension D — scroll-length measurement + navigation restructure decision
"Scrolling is too long in many parts" is the SYMPTOM. Measure before recommending:
- Mechanism: build once (`npm run build`), serve with `npx vite preview --port 4273 --strictPort`, and run a one-off Playwright measurement script kept in the session scratchpad. Run it as `npx playwright test -c <scratchpad-config>` from the repo cwd so Playwright resolves from the repo's node_modules (only `@playwright/test` is installed), or use `createRequire` against the repo's `package.json` in a plain node script. Do not add or modify any repo file. Gated content renders only after gates unlock — unlock them the way `unlockGates` in `e2e/sim-paint.spec.ts` does (`[data-gate]` + button /commit prediction|continue/i) before measuring full height.
- Metrics per section, ONE uniform rule for all 25 (record it in the appendix): rendered page height at desktop 1280×800 and mobile 375×667; gate count = `[data-gate]` elements; sim count = `canvas` elements + `.recharts-wrapper` instances after all gates unlocked; content-block count = h2/h3-delimited blocks in the section's main column. If you substitute better selectors, apply the same rule to every section and record it.
- "Too long" cohort = rendered desktop height > N× the desktop viewport height; pick N, justify it in the appendix, apply it uniformly.
For the worst cohort, recommend per section: keep long-scroll / split into tabs / stepper progression / collapsible grouping — trade-offs argued for THIS app. An accessible in-repo tab primitive already exists (`src/shared/components/common/Tabs.tsx`: ARIA tablist, arrow-key navigation, controlled + uncontrolled modes) — assess its fitness, and note that its active panel renders with `key={activeIndex}`, so switching tabs REMOUNTS panel content: any recommendation placing stateful or gated content inside tabs must state how prediction/progress state survives (lifted state, store persistence), or it fails the zero-loss constraint.
Hard constraints on every recommendation:
- **Predict-first is inviolable.** The PredictionGate blocking flow stays; the `[data-gate]` DOM contract and the gate-unlock e2e helpers (`unlockGates` in `e2e/sim-paint.spec.ts`; `unlockOneGate`/`unlockAllGates` in `e2e/regate-walk.spec.ts`) depend on it; a tab layout must not let students bypass a gate or bury gated content ambiguously.
- **Scroll-spy / SectionAnchor and deep links** must keep working, or the recommendation must state what replaces them.
- **Zero content loss:** every restructure recommendation includes a content-parity ledger — every heading, derivation, simulation, image, ConceptCheck, interactive element, and any other function or material (deep links, downloadable/reference material, PWA/offline behavior) in the current layout mapped to its new home.
- **E2E implications named:** effects on `e2e/sim-paint.spec.ts` (MIN_CANVAS_W/H, DPR_MIGRATED) and the gate helpers listed; baselines are updated deliberately, never relaxed.

## Dimension E — benchmark research (subagents)
Where a benchmark is open source, subagents MAY inspect the public repos for implementation patterns (lesson/sim structure, gating, state persistence) in addition to public UX/pedagogy research: PhET (github.com/phetsims), Falstad CircuitJS (circuitjs1), Khan Academy's Perseus exercise framework. For closed products (Brilliant, zyBooks, Pearson Mastering) use official docs, published papers, reviews, and public demos.
Benchmarks:
- **PhET Interactive Simulations** — the physics-sim gold standard;
- **Falstad CircuitJS** — EE-sim interaction patterns;
- **Brilliant** and **Khan Academy** — lesson segmentation (short steps vs long scroll), progression and engagement mechanics;
- **zyBooks** and **Pearson Mastering (Physics/Engineering)** — LO-driven structure and assessment integration in university courses.
For each: how large is one "unit" of content; navigation idiom (scroll / tabs / steps); how sims are gated or scaffolded; any predict-first analogue; where assessment sits; engagement mechanics.
Output: a comparison table + a transferable-patterns list, each pattern marked ADOPT / ADAPT / REJECT for EM-CA-LAB with a reason grounded in the predict-first design and the course structure.

## Council — recommend, then adversarially verify (applies to every dimension)
1. **Red team** — attack the app as a weak or disengaged student: where do misconceptions survive the section, where does engagement die, which gates get gamed.
2. **Devil's advocate** — argue AGAINST the restructure recommendations (tabs fragment a derivation narrative, hide content from search/print, add navigation overhead, hurt flow-state). Recommendations that don't survive get downgraded.
3. **Premortem** — "It is exam week; students underperformed on LO-X and stopped using the app around week N. Write the story of why." Feed each plausible cause back into the audit as a concrete check.
The council does not only critique — it convenes ON the decisions: for each Dimension D per-cohort go/no-go and each Top-10 roadmap item, record the council's final RECOMMENDATION with the winning argument, not just the objections that survived.
Every defect or gap claim must be independently verified (a second agent reproduces the evidence: file:line, measurement, or citation) before it enters the main report; claims that fail reproduction go to an appendix marked PLAUSIBLE.
Close with a completeness critic: which LO, section, design axis, or benchmark did the audit NOT examine, and why.

## Report
Write `docs/audits/<today's date, YYYY-MM-DD>-post-redesign-lo-ux-audit.md` following the overall structure of `2026-06-21-full-audit.md`:
- pinned inventory (exact section count from `curriculum.ts`);
- one chapter per dimension (A–E) with verdict tables;
- defect entries in the 2026-06-25 sweep form (`### Nx · [severity/category] section-id — file:line`, severities critical|major|minor, categories physics|concept|design|ux);
- a Council chapter: red-team findings, devil's-advocate downgrades with reasons, premortem causes and the checks they generated, completeness-critic gaps — plus the PLAUSIBLE appendix for claims that failed reproduction;
- ranked Top-10 roadmap: score impact-on-learning, effort, and risk each 1–5 (impact: higher = better; effort and risk: higher = worse); rank by impact / (effort × risk); show all three scores per item; separate quick fixes from structural work; the scroll/tabs decision must appear as an explicit go / no-go per section cohort;
- methodology + verification appendix in the house convention: `Tested: [...]. Not tested: [...] because [...]` — including every autonomous judgment call and every SKIPPED-layout exclusion.
