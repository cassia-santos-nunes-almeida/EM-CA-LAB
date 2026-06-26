# Track B · #11 — "Warm Lab Instrument" Nav-Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Each task references a per-surface scope map in `.superpowers/sdd/navscope-*.md` and a section of the locked spec `docs/design/2026-06-23-navigation-shell-spec.md` — the implementer reads those for full detail.

**Goal:** Implement the locked "warm Lab Instrument" navigation & shell redesign across the whole app — warm token palette + Space Grotesk, a vertical Part-accordion landing, a 3-level scroll-spy sidebar with a collapsible icon-rail + auto-collapse, an instrument-styled (still-blocking) predict-first gate, warm section chrome with a scroll-spy breadcrumb, and a mobile bottom-tab-bar + drawer — with **no regression** to physics, predict-first gating, the a11y reveal, route integrity, or the e2e paint/dpr net.

**Architecture:** A single persistent shell (`Layout.tsx`) hosts the sidebar, the `<main>` scroll container, and (new) a `ScrollSpyProvider` whose **one** `IntersectionObserver` (root = the `<main>` element) is the single source of truth for the active section/subsection — consumed by the sidebar highlight, the subsection TOC, the section breadcrumb, and the auto-collapse decision (spec §4). Sections register their in-page anchors through a `SectionAnchor` primitive into a context the shell reads. The redesign renders from the existing curriculum spine (`PARTS`/`SECTIONS`), extended with `simHeavy` (data) and a persisted `sidebarCollapsed` flag.

**Tech Stack:** React 18 + TS, Vite, Tailwind **v4** (`@theme static` token layer + unlayered `.dark`), Zustand (`progressStore`, persisted `emac-progress`), react-router, Vitest + @testing-library/react, Playwright. Aliases `@shared`/`@em`/`@circuits`/`@transmission`.

## Global Constraints

- **Branch:** `track-b/11-nav-shell` (off merged `main` `fb8b818`). Commit per task; do NOT push/PR until the whole shell is built + green (owner chose "build whole, then review"). Owner-only-merge.
- **Locked pedagogy — must NOT regress:** the **blocking** predict-first gate stays blocking on every section with a sim; the gate reskin (§2.5) is **purely presentational** — same props/logic/correctness, and the shipped a11y reveal (`tabIndex=-1` focus + `aria-live`, Track-A #5) is preserved.
- **No physics changes.** This is shell/nav/chrome only. Sim math, readouts, ConceptChecks, worked examples untouched.
- **e2e gate-walk must keep working:** `e2e/sim-paint.spec.ts` `unlockGates()` finds gates via `div.border-dashed` + the literal "Continue"/"Predict First" text. The gate reskin changes those → the gate must expose a stable `data-gate="true"` (and keep a reachable predict/commit/continue control), and `unlockGates()` is updated in lockstep (see Task 7). The dpr=2 paint net (153 e2e) and the 661 unit tests stay green throughout.
- **Tailwind v4 gotchas (from navscope-tokens):** new tokens go in `@theme static` (plain `@theme`, NOT `@theme inline`) or inline-`var()`-only Part tokens get tree-shaken; the unlayered `.dark{}` block must mirror every changed/new chrome token.
- **Backward-compatible persistence:** adding `sidebarCollapsed` to `progressStore` `partialize` must default safely so existing `emac-progress` state loads unchanged (no key/version change).
- **§9 micro-decisions — adopt these defaults (owner tunes at review):** keep the compact through-line hero; trace screens **dark**; show **all** sections (no "+N more"); mobile primary = **bottom tab-bar**; `s-domain` & `transformers` `simHeavy: false`.
- **Verification gate per task:** `npm run build` 0 · `npm run lint` 0/0 · unit green (`npx vitest run -- --no-file-parallelism`) · relevant e2e green (`npm run build && npx playwright test ...`, memory `NODE_OPTIONS=--max-old-space-size=1536`). a11y: every accordion is native `<details>/<summary>`; the icon-rail flyout is keyboard-reachable (not hover-only); `prefers-reduced-motion` disables the sweep/LED-blink/smooth-scroll.

## Scope boundary (#11 vs #13)

**In #11:** the token/font layer; the landing accordion; the 3-level sidebar (Part+Section levels fully; the level-3 subsection TOC wired to the scroll-spy infra and live wherever a section exposes `SectionAnchor`s); the icon-rail collapse + auto-collapse (`simHeavy`); the gate reskin; the section-shell warm chrome + breadcrumb + `SectionAnchor` host on the **shared/em** shell; mobile tab-bar + drawer; data (`simHeavy` on all 25, `sidebarCollapsed`); the `ScrollSpyProvider`/`SectionAnchor`/`useScrollSpy` primitives. **Deferred to #13:** rolling `SectionAnchor` adoption into all 25 section bodies (so the level-3 TOC is populated everywhere), and the `LabLayout`-inside-shared-`SectionShell` per-section rollout. #11 proves the machinery on the em shell + a representative section or two.

---

## Task 1: Warm token layer + Space Grotesk (the foundation)

**Files:** Modify `src/index.css`, `index.html` (if fonts move) · Test: `src/__tests__/theme-tokens.test.ts` (new, light DOM assertion) — and a screenshot baseline.
**Read first:** `.superpowers/sdd/navscope-tokens.md` + spec §1.1, §1.2.

- [ ] Add the warm chrome tokens to the `@theme static` block (light): `--color-chassis: #f4f1ea`, `--color-card-border: #e7e2d6`, `--color-title: #1c1814`, `--color-muted: #7a7263`, new `--color-ink: #33302a`, `--color-rail: #fbf9f4`, `--color-screen: #0f172a`, and per-Part washes `--color-part-1-bg:#fdf6ec; -2-bg:#fdeeee; -3-bg:#eef3fd; -4-bg:#f4eefe; -5-bg:#eafaf3`. Keep `--color-card #fff`, `--color-led`, `--color-cta` unchanged.
- [ ] Mirror every changed/new chrome token in the unlayered `.dark{}` block with warm-dark equivalents (chassis→warm slate, card→warm-800, border→warm hairline, ink/title/muted→warm light, rail→warm-dark; `--color-screen`/`led`/`cta` stay; Part accents lighten one step as today). Pin the dark swatches per the spec's "swatch pass."
- [ ] Load **Space Grotesk** (500/600/700) by adding it to the existing font `@import url()` in `index.css`; add `--font-display: 'Space Grotesk', ...` to `@theme`. Keep JetBrains Mono (`--font-mono`) + Inter (`--font-sans`/body).
- [ ] Fix the navscope-flagged hazard: the inline `code` rule's hardcoded `rgb(241 245 249)` (≈ old cool chassis, ~`index.css:133-137`) → `var(--color-chassis)` so it tracks the warm ground.
- [ ] **TDD/verify:** a unit test asserting the computed `--color-chassis` resolves to the warm value in light and that `--font-display` is defined; `npm run build`/`lint` 0; then a Playwright screenshot of `/` confirming the warm ground app-wide (baseline for the review pack).
- [ ] Commit: `feat(theme): warm Lab-Instrument tokens (light+dark) + Space Grotesk display (#11)`

## Task 2: Data model — `simHeavy` (all 25) + persisted `sidebarCollapsed`

**Files:** Modify `src/shared/constants/curriculum.ts`, `src/shared/store/progressStore.ts` · Tests: extend `curriculum` test + a store test.
**Read first:** `.superpowers/sdd/navscope-curriculum.md`, `.superpowers/sdd/navscope-store.md` + spec §3.3, §3.4.

- [ ] Add optional `simHeavy?: boolean` to `CourseSection`; set `true` for the 16 sim-heavy sections per the §3.4 table (interactive-lab; coulomb/gauss/ampere/lorentz; faraday/lenz/magnetic-circuits; maxwell/em-wave/polarization/antennas; lumped-distributed/transmission-lines/line-impedance/transients). Omit (implicit false) for the other 9 (incl. `s-domain` & `transformers` per the §9 default). Additive — no existing test changes.
- [ ] Add `sidebarCollapsed: boolean` (default `false`) + a `setSidebarCollapsed`/`toggleSidebarCollapsed` action to `progressStore`, and add `sidebarCollapsed` to the persist `partialize` set (the runtime `simActive`/`pinnedSection` stay OUT of the store — they live in Sidebar local state per navscope-store).
- [ ] **TDD:** a test pinning the 16 simHeavy ids; a store test asserting `sidebarCollapsed` persists + defaults false for legacy state. Verify build/lint/unit.
- [ ] Commit: `feat(curriculum,store): add simHeavy classification + persisted sidebarCollapsed (#11)`

## Task 3: Scroll-spy infrastructure — `ScrollSpyProvider` + `SectionAnchor` + `useScrollSpy`

**Files:** Create `src/shared/components/scrollspy/ScrollSpyProvider.tsx`, `SectionAnchor.tsx`, `useScrollSpy.ts`, `SectionAnchorContext.ts` · Tests: a provider/hook test (mock IntersectionObserver).
**Read first:** spec §4 (single source), §2.3; `.superpowers/sdd/navscope-sidebar.md` (consumer contract).

- [ ] `SectionAnchorContext` holds: the registered anchors `{id,label}[]` (in document order) + a register/unregister callback + the current active anchor id. `SectionAnchor({id,label,children})` renders a wrapper with that `id` and registers `{id,label}` on mount / unregisters on unmount.
- [ ] `ScrollSpyProvider` owns **one** `IntersectionObserver` (root = the `<main id="main-content">` scroll element passed in via ref/prop; top-biased `rootMargin`) over the registered anchor elements; emits the single active-anchor id to context. `useScrollSpy()` exposes `{ anchors, activeId }`. Honor `prefers-reduced-motion` for any smooth-scroll helper.
- [ ] Mount `ScrollSpyProvider` in `Layout.tsx` wrapping `children`, with the observer root = `mainRef`. (This is the seam App.tsx guarantees is persistent.)
- [ ] **TDD:** a test with a stubbed IntersectionObserver asserting registration order + that exactly one `activeId` is emitted as entries change. Verify build/lint/unit.
- [ ] Commit: `feat(scrollspy): single-source IntersectionObserver + SectionAnchor primitive (#11)`

## Task 4: Layout shell warm-ization + mount points

**Files:** Modify `src/shared/components/layout/Layout.tsx`.
**Read first:** the Layout source (read in the plan author's notes) + spec §2.6.

- [ ] Replace the hardcoded `bg-slate-50 dark:bg-slate-900` outer shell with the warm chassis token (`bg-chassis`); confirm the skip-link, offline banner, AiTutor tab/FAB still work on the warm ground.
- [ ] Prepare the mobile seam: the existing `md:hidden` header stays for now; Task 9 adds the bottom-tab-bar + drawer here. Ensure `ScrollSpyProvider` (Task 3) wraps `children` with root=`mainRef`.
- [ ] **Verify:** build/lint/unit + a screenshot of a section route on the warm ground.
- [ ] Commit: `feat(shell): warm chassis + scroll-spy provider mount in Layout (#11)`

## Task 5: Landing — vertical Part accordion

**Files:** Rewrite `src/shared/components/CourseLanding.tsx`; create `src/shared/components/landing/PartAccordion.tsx`, `src/shared/components/common/TraceScreen.tsx`, and a Part-keyed `{summary,traceKind}` lookup (additive const beside `PART_QUANTITIES`) · Update `src/shared/components/__tests__/CourseLanding.test.tsx`.
**Read first:** `.superpowers/sdd/navscope-landing.md` + spec §2.1, §1.3.

- [ ] Replace the 2-col card grid with a vertical stack of native `<details name="landing-parts">` (exclusive). Collapsed `<summary>` = small `TraceScreen` spark + mono `PART 0N · QUANTITY` + Part title + `${n} sections` + chevron; warm `--color-part-N-bg` tint + accent left border.
- [ ] Open body (2-col): LEFT a `<ul>` of `part.sectionIds` → `<Link to={SECTIONS[id].route}>` with `getSectionNumber(id)`, accent dot, **filled dot when `progress.sections[id].visited`**; RIGHT a bigger `TraceScreen` + the Part summary + a "Start Part" CTA (`first.route`) + a per-Part progress bar (visited/total). Subscribe read-only to `useProgressStore(s=>s.sections)`.
- [ ] Add the slimmed through-line hero (separable subcomponent, default-on) above the accordion; keep an accessible `<h1>`. Apply `font-display` to titles/hero.
- [ ] **CRITICAL test fix:** native `<details>` keeps collapsed children mounted (display-hidden), so every section `<Link>` stays in the DOM and the existing "Coulomb's Law → /coulomb" deep-link test passes — verify this; add assertions for chevron/summary per Part, section count, a visited filled-dot, and the Start-Part CTA href. `TraceScreen` honors `prefers-reduced-motion`.
- [ ] Verify build/lint/unit + a `/` screenshot (collapsed + one open Part).
- [ ] Commit: `feat(landing): vertical Part accordion + trace screens + progress (#11)`

## Task 6: Sidebar — 3-level accordion + icon-rail collapse + auto-collapse

**Files:** Rewrite `src/shared/components/layout/Sidebar.tsx`; create `src/shared/components/layout/SidebarIconRail.tsx` and a `useSidebarCollapse.ts` hook (the §5 precedence) · Update the sidebar tests.
**Read first:** `.superpowers/sdd/navscope-sidebar.md` + spec §2.2, §2.3, §2.4, §5.

- [ ] **Level 1 (Part):** native `<details>` per Part (NO `name=` → non-exclusive), current Part auto-`open`. **Level 2 (Section):** the Part's sections; active section = tinted pill + bold + live-LED dot (from `useScrollSpy().activeId` / route); per-Part `n/total` completion badge; visited filled dots. **Level 3 (Subsection):** under the active section only, render `useScrollSpy().anchors` as smooth-scroll links, active tracked by `activeId`, passed ones filled. Top: brand + LED + theme toggle + course `done/25` bar. Bottom: "‹ Course home".
- [ ] **Collapse/icon-rail:** a manual toggle switches the 264px sidebar to the 58px `SidebarIconRail` (Part chips, current filled + LED, **keyboard-reachable** flyout of the section list — not hover-only). The toggle reads/writes `progressStore.sidebarCollapsed`.
- [ ] **Auto-collapse (`useSidebarCollapse`):** compute `collapsed` per §5 — `pref==='collapsed' ? true : (simActive && pinnedSection!==cur) ? true : false`, where `pref`=persisted `sidebarCollapsed`, `simActive`=current in-view `section.simHeavy`, `pinnedSection`=a section manually expanded while sim-heavy (ephemeral local state). Manual-expand on a sim-heavy section **pins** it; leaving clears the pin (the navscope "stale pin" risk — clear on active-section change). Show a "auto-collapsed for the bench" badge when collapse is automatic.
- [ ] **TDD:** tests for active-section highlight, the §5 precedence truth-table (incl. pin set/clear), persistence of the manual toggle, and keyboard-reachability of the flyout. Route integrity (every section reachable) preserved.
- [ ] Verify build/lint/unit + e2e (route nav still works) + screenshots (expanded, collapsed rail + flyout, a sim-heavy auto-collapse).
- [ ] Commit: `feat(sidebar): 3-level scroll-spy accordion + icon-rail + auto-collapse (#11)`

## Task 7: PredictionGate — instrument reskin (presentational) + e2e lockstep

**Files:** Modify `src/shared/components/common/PredictionGate.tsx`; modify `e2e/sim-paint.spec.ts` (`unlockGates`).
**Read first:** `.superpowers/sdd/navscope-gate.md` + spec §2.5, §6.

- [ ] Reskin to the instrument panel: header `BENCH · {label ?? NAME} · ARMED` (add an **additive optional** `label?: string` prop — zero call-site changes), a `▮ locked · predict first` indicator, options as instrument controls, a `COMMIT PREDICTION ▸` commit button, the sim kept dark until commit. Use the warm + `--color-screen` tokens + mono. **Zero change** to: the predict→reveal logic, `getCorrectAnswer` keying, `allowSkip`/`initialPassed`/`onPassed`, and the `tabIndex=-1` focus + `aria-live` reveal.
- [ ] Add a stable `data-gate="true"` to the gate's outer container so the e2e net has a class-independent hook. In `e2e/sim-paint.spec.ts` `unlockGates()`, update the selectors to use `[data-gate]` and a commit/continue control matched by `/commit prediction|continue/i` (keep both the option-pick and the advance click). Re-run the full paint+dpr net to confirm gates still unlock everywhere.
- [ ] **TDD:** the existing gate tests stay green (logic unchanged); add a test asserting `data-gate` present + the instrument header renders; the a11y reveal test unchanged.
- [ ] Verify build/lint/unit + **full** e2e (all 3 projects) — the gate reskin touches every gated route, so this is a full-suite gate. Screenshot a gate (locked + revealed).
- [ ] Commit: `feat(gate): instrument-panel reskin (blocking preserved) + e2e selector lockstep (#11)`

## Task 8: Section-shell warm chrome + breadcrumb + SectionAnchor host

**Files:** Modify `src/em/components/common/section/SectionLayout.tsx`; create a shared `Breadcrumb`/`SectionChrome` piece if warranted. Adopt `SectionAnchor` on the em shell's known blocks + 1 representative section as the demo.
**Read first:** spec §2.5; the em `SectionLayout` (now `@em`-import-free post-#10); `.superpowers/sdd/navscope-gate.md` for the screen treatment.

- [ ] Apply warm card surfaces; add a mono breadcrumb `PART 0N · QUANTITY / N.M Title / {active subsection}` whose last segment tracks `useScrollSpy().activeId`; a subsection progress meter (`k/total`). Title in `font-display`. Equations/screens use the `--color-screen` dark treatment where the spec calls for it.
- [ ] Host `SectionAnchor` registration for the section's major headings (wrap the existing `toc`/headings or expose a helper) so the level-3 sidebar TOC + breadcrumb populate for em sections; wire one representative section end-to-end as the proof. (Full 25-section adoption = #13.)
- [ ] **TDD/verify:** a render test that the breadcrumb + anchors register; no regression to the section body, gate, or ConceptChecks. build/lint/unit + e2e on a couple em sections. Screenshot a section header + the live breadcrumb/TOC.
- [ ] Commit: `feat(section-shell): warm chrome + scroll-spy breadcrumb + SectionAnchor host (#11)`

## Task 9: Mobile — bottom tab-bar + drawer

**Files:** Modify `src/shared/components/layout/Layout.tsx`; create `src/shared/components/layout/MobileTabBar.tsx` (+ a bottom-sheet for a Part's sections) and keep the hamburger drawer as the full-index fallback.
**Read first:** spec §2.6; the Layout source.

- [ ] Below the `lg`/`md` breakpoint, render a bottom **tab-bar** of the 5 Part chips (thumb-reach, instrument-chip identity, current Part raised + LED); tapping a Part opens a bottom sheet with its sections (+ the current section's subsections). Keep the hamburger drawer (the existing mobile sidebar overlay) as the secondary full-index. Landing accordion stacks 1-col; section body stacks (gate below prose) — verify the existing responsive stacking still holds.
- [ ] **TDD/verify:** a test for the tab-bar rendering the 5 Parts + active state; build/lint/unit + e2e mobile project green. Mobile-viewport screenshots (tab-bar, bottom sheet, drawer).
- [ ] Commit: `feat(mobile): bottom tab-bar + Part bottom-sheet, drawer fallback (#11)`

## Task 10: Whole-shell verification + screenshot review pack

**Files:** none changed — the final gate + the deliverable for the owner's one-pass review.

- [ ] Full green bar: `npm run build` 0 · `npm run lint` 0/0 · unit green (all new + existing) · **full e2e all 3 projects** (desktop/mobile/desktop-hidpi) green — confirm the paint+dpr net + the updated `unlockGates` pass on every route.
- [ ] Capture the **screenshot review pack** via the Playwright harness: landing (collapsed + an open Part), sidebar (expanded, collapsed icon-rail + flyout, an auto-collapsed sim-heavy section), an instrument gate (locked + revealed), a section header with live breadcrumb/TOC, and mobile (tab-bar, bottom-sheet, drawer) — light **and** dark.
- [ ] Final whole-branch review (opus) over `main..HEAD`; triage minors.
- [ ] Present the pack to the owner for sign-off; on approval, push + open the PR.

---

## Self-review notes
- **Spec §7 coverage:** tokens (T1), landing accordion (T5), 3-level sidebar + scroll-spy (T3+T6), subsection TOC (T3 infra + T6 level-3 + T8 host; full 25-section adoption = #13), `simHeavy` all-25 (T2), section-shell chrome + instrument gate (T7+T8), collapse persisted + mobile (T2+T6+T9), Space Grotesk (T1). All 8 mapped.
- **Cross-surface contract:** the scroll-spy context shape (T3) is consumed by the sidebar (T6), breadcrumb (T8) — built first so consumers compile against it. The new tokens (T1) and data (`simHeavy`/`sidebarCollapsed`, T2) precede every consumer.
- **Must-not-regress checklist** is in Global Constraints; the highest-risk item (the e2e gate-walk vs the gate reskin) is handled in lockstep in T7.
