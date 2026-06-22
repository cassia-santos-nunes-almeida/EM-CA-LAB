# EM-CA-LAB — Navigation & Shell Redesign Spec

**Date:** 2026-06-23 · **Status:** DECIDED (owner-approved through visual iteration) · **Branch:** `audit/2026-06-21-full-audit` · **Companion:** [implementation ultraplan](../audits/2026-06-21-implementation-ultraplan.md) item **#11** (full "engaging, not AI-generic" redesign).

> **Scope — applies to the WHOLE app.** This spec governs navigation and the page-shell for **every surface**: the
> course landing, the persistent sidebar, the in-page chrome of **all 25 sections across all 5 Parts**, and mobile.
> It is the design half of ultraplan **#11**. **No `src/` changes are made here** — this is the Gate-2 design
> artifact that a later implementation session executes (net-first, per the standing principles).

## 0 · Provenance & references

- Folded from the owner's iterative visual review (2026-06-23): direction **A** (dark instrument hero + a
  through-line signal + per-Part characteristic traces) combined with direction **C** (warm notebook ground +
  per-Part summaries), then the 3-level sidebar, the scroll-spy/auto-collapse behaviours, and mobile.
- **Visual references (open in a browser):**
  - [`landing-and-section-shell.html`](./landing-and-section-shell.html) — the combined landing + a section shell.
  - [`nav-behaviors-prototype.html`](./nav-behaviors-prototype.html) — **interactive**: scroll-spy subnav, manual
    collapse + persistence, auto-collapse on a sim-heavy section, and both mobile patterns.
- Honors the owner's durable preferences (engaging-not-AI-generic; *show* visuals; **blocking predict-first on every
  section that has a sim**) and supersedes the "minimal accent" the Gate-2 panel had recommended.

---

## 1 · Visual language — "warm Lab Instrument"

Keeps the locked Lab-Instrument vocabulary (per-Part physics-quantity accents, mono `PART 0N · QUANTITY` tags, the
green "live" LED) but moves the ground from cold slate to **warm paper**, and lets a single **dark instrument hero +
dark trace-screens** supply the contrast. The dark elements are *calibrated against the warm ground* — they are
what stop the page reading either too clinical or too soft.

### 1.1 Token changes (light mode)

| Token | Current (`index.css`) | New (warm) | Note |
|---|---|---|---|
| `--color-chassis` | `#f1f5f9` (cool slate-100) | **`#f4f1ea`** (warm paper) | page-wide ground; the load-bearing change |
| `--color-card` | `#ffffff` | `#ffffff` | unchanged |
| `--color-card-border` | `#e2e8f0` | **`#e7e2d6`** | warmer hairline |
| `--color-title` | `#0f172a` | **`#1c1814`** | warm near-black |
| `--color-muted` | `#64748b` | **`#7a7263`** | warm grey |
| *(new)* `--color-ink` | — | `#33302a` | warm body text |
| *(new)* `--color-rail` | — | `#fbf9f4` | sidebar surface |
| *(new)* `--color-screen` | — | `#0f172a` | instrument hero + trace screens (stays cool — it's the "instrument") |
| `--color-led` / `--color-cta` | `#10b981` / `#2563eb` | unchanged | identical in both modes |
| `--color-part-1..5` (+ `-label`) | unchanged | unchanged | per-Part physics accents stay |
| *(new)* `--color-part-N-bg` | — | warm tints (P1 `#fdf6ec`, P2 `#fdeeee`, P3 `#eef3fd`, P4 `#f4eefe`, P5 `#eafaf3`) | per-Part card wash |

**Dark mode:** re-point the warm chrome tokens to a warm-dark equivalent (chassis → warm slate, card → warm 800, etc.)
mirroring the existing `.dark` block; the Part accents lighten one step as today; `--color-screen`, `--led`, `--cta`
stay. The dark-mode warm equivalents are a small follow-up to pin during implementation (a swatch pass).

### 1.2 Type

| Role | Face | Use |
|---|---|---|
| Display | **Space Grotesk** *(new; load 500/600/700)* | page/section titles, hero — characterful, not the Inter default |
| Mono | **JetBrains Mono** *(existing)* | every Part tag, section number, readout, breadcrumb, status, LED labels |
| Body | **Inter** *(existing)* | prose only |

### 1.3 The instrument signature (the "engaging" payload)

1. **Through-line hero** — a dark hero whose signal morphs across the five Parts: RLC step-and-ring (P1) → radial
   field burst (P2) → concentric flux loops (P3) → travelling sinusoid (P4) → incident+reflected pulse (P5). It is
   the literal thesis of the course (circuits → fields → waves → lines) drawn as one trace, with a slow sweep dot.
2. **Per-Part characteristic trace** — each Part everywhere it appears (landing card, sidebar spark, section header)
   carries a small dark "scope screen" showing *its* waveform, in the Part accent. The trace **is** the physics that
   Part teaches; it doubles as a preview.
3. **The green "live" LED** — the existing instrument signature; marks "live/armed" and "you are here".

---

## 2 · Surfaces (all app-wide)

### 2.1 Course landing (`/`, replaces today's `CourseLanding`)

- **Vertical Part accordion** — the five Parts stack full-width; **one open at a time (exclusive)**. Replaces the
  current 2-column card grid.
- Each Part row (collapsed): a small **trace spark** + mono `PART 0N · QUANTITY` + Part title + section count + a
  chevron. Warm-tinted by Part; accent left border.
- Open state reveals, **on the left**, the Part's **clickable section list** (numbered `N.M`, accent dot, a filled
  dot for visited); **on the right**, the bigger trace screen + a one-line **summary** + a **Start Part** CTA + a
  per-Part progress bar.
- A slimmed **through-line hero** sits above the accordion (owner may drop it; default: keep, compact).

### 2.2 Persistent sidebar (every in-course page)

- **Same accordion language as the landing**, recast as navigation. Three levels:
  1. **Part** — five `<details>` groups; the **current Part auto-expanded**. **Non-exclusive** (opening another Part
     to look ahead does **not** collapse the current one — the deliberate difference from the landing).
  2. **Section** — the Part's sections; the **active section is lit** (tinted pill, bold, the live LED replacing its
     dot). Per-Part `n/total` completion badge; visited sections show a filled dot.
  3. **Subsection** — see §2.3 below: an in-page TOC that appears **only for the section currently in view**.
- Top: brand + LED + theme toggle. Course-wide progress bar (`done/25`). Bottom: "‹ Course home" → the landing.
- Everything is a real link/anchor; full keyboard + screen-reader support via native `<details>`.

### 2.3 Subsection TOC — scroll-spy (level 3, app-wide)

- The active section expands a nested **subsection list** = that section's own in-page anchors (its major headings).
- **Revealed only while the section is in view** (scroll-driven): scroll to a different section and the TOC moves
  with you; at any moment exactly one section shows its subnav.
- The active subsection tracks scroll position (live LED dot); subsections you've scrolled past get a filled dot.
- **Every subsection is clickable** → smooth-scrolls to that block of the page.
- **This applies to all 25 sections** — each section exposes its subsections (see §3.2).

### 2.4 Collapse & icon-rail (every in-course page)

- A **manual toggle** collapses the 264 px sidebar to a **58 px icon-rail** (Part chips, current Part filled + LED;
  **hover a chip flies its section list out**). The bench/canvas reclaims ~206 px.
- The collapse choice is **remembered per user** (persisted — see §3.3).
- **Auto-collapse on sim-heavy sections** (§3.4): scrolling into a section whose primary element is a wide canvas
  sim auto-collapses the rail to give the bench room; a badge says why. **Manual override wins** — expanding while on
  a sim-heavy section *pins* it open for that section; leaving a sim-heavy section restores the user's setting.

### 2.5 Section shell (every section)

- Mono **breadcrumb**: `PART 0N · QUANTITY / N.M Title / <current subsection>` (the last segment updates via
  scroll-spy). A subsection progress meter (`subsection k/total`).
- A `PREDICT → OBSERVE` tag with the live LED. Section title in the display face.
- **The blocking predict-first gate is styled as an instrument panel** ("BENCH · NAME · ARMED", `▮ locked · predict
  first`, the options, `COMMIT PREDICTION ▸`) that keeps the simulation dark until the student commits. This is the
  locked pedagogy, made to *look* deliberate — and it stays **blocking** on every section that has a sim.
- Body uses the warm card surfaces; equations render in the dark instrument screen treatment.

### 2.6 Mobile (every page)

- The sidebar rail becomes a **bottom tab-bar** of the five Part chips (thumb-reach, keeps the instrument-chip
  identity; current Part raised + LED). **Recommended.** Tapping a Part opens a bottom sheet with its sections (and
  the current section's subsections).
- A **hamburger drawer** with the full accordion is the secondary/full-index fallback.
- Landing accordion stacks 1-column; section body stacks (gate below prose).

---

## 3 · Data model (one source of truth → all surfaces)

Everything renders from the curriculum spine, exactly as the prototype renders sidebar + content from one array.

### 3.1 Existing — `src/shared/constants/curriculum.ts`
`PARTS` (5), `SECTIONS` (25), `PART_QUANTITIES`, `getSectionNumber`, `getAdjacentSections`. **No structural change.**

### 3.2 New — per-section **subsections** (the in-page TOC)
Each section declares its subsections as `{ id, label }[]` (the page anchors). Two viable sources, to decide at
implementation:
- **(a)** add a `subsections` field per section to the curriculum (explicit, testable), or
- **(b)** derive at runtime from the section's rendered headings (a `<SectionAnchor id label>` wrapper each section
  already could use), so the TOC can't drift from the page.
Recommendation: **(b)** a small `SectionAnchor` primitive that registers `{id,label}` into a context the shell reads —
the TOC is then *generated from the page*, never hand-maintained, and **automatically covers all 25 sections** as
they adopt the wrapper. (Faraday's real anchors, used in the prototype: *Flux & the EMF rule · Changing-flux bench ·
Concept checks · Motional-EMF bench · Your-turn challenge*.)

### 3.3 New — sidebar collapse preference (persisted per user)
Add `sidebarCollapsed: boolean` (the user's **manual** choice) to the existing `progressStore` (same single
`emac-progress` key). The store already owns `sidebarOpen` as local UI state; this is its persisted sibling.

### 3.4 New — per-section **`simHeavy`** flag (drives auto-collapse)
A boolean per section: *"the primary interactive element is a wide canvas simulation that benefits from the extra
width."* **Proposed default classification for all 25** (owner-tunable; verify the primary element at implementation):

| Part | `simHeavy: true` (auto-collapse) | `simHeavy: false` |
|---|---|---|
| 1 · Circuits | interactive-lab | component-physics, circuit-analysis, nodal-mesh-analysis, circuit-theorems, switched-circuits, laplace-theory, partial-fractions, s-domain |
| 2 · E-field | coulomb, gauss, ampere, lorentz | — |
| 3 · B-field | faraday, lenz, magnetic-circuits | transformers |
| 4 · Waves | maxwell, em-wave, polarization, antennas | — |
| 5 · Lines | lumped-distributed, transmission-lines, line-impedance, transients | — |

(16 sim-heavy / 9 not. `s-domain` and `transformers` are the borderline calls — start `false`, flip if their
pole-zero / transformer diagrams want the width.)

---

## 4 · Scroll-spy architecture (single source of truth)

**One** "which subsection is currently in the viewport" signal drives **all** scroll-dependent UI — the active
section highlight, the subnav reveal, the breadcrumb's last segment, **and** the auto-collapse decision. Do **not**
wire these as three independent listeners that can disagree.

- Implement with **one `IntersectionObserver`** over the section anchors (root = the scroll container; a top-biased
  `rootMargin`), emitting the active anchor → a single piece of state the shell, sidebar, and breadcrumb subscribe to.
- The prototype models this with one `spy()` function; the React port replaces it with the observer + store state.

## 5 · Auto-collapse precedence (decided)

```
pref            = persisted manual choice ('expanded' | 'collapsed')   // §3.3
simActive       = current in-view section.simHeavy                     // §3.4 + §4
pinnedSection   = a section the user manually expanded while it was sim-heavy

collapsed =  pref === 'collapsed'                ? true
          :  simActive && pinnedSection !== cur  ? true   // auto, for the bench
          :                                         false
```
- Manual toggle sets & persists `pref`; if done on a sim-heavy section while collapsed, it **pins** that section open.
- Leaving a sim-heavy section clears the pin and restores `pref`.
- A badge ("auto-collapsed for the bench") shows whenever the collapse is automatic, so it never feels like a glitch.

## 6 · Accessibility & motion (quality floor, app-wide)

- Native `<details>/<summary>` for every accordion (landing, sidebar Parts) → keyboard + AT for free; the landing
  uses `name=` for exclusive behavior, the sidebar omits it for non-exclusive.
- Visible keyboard focus on all nav items, chips, gate options. The icon-rail flyout reachable by keyboard, not
  hover-only, in the real build.
- `prefers-reduced-motion` disables the sweep, LED blink, and smooth-scroll.
- The predict-first reveal must honor the audit's a11y fix (Track-A **#5**, re-scoped): focus a `tabIndex=-1` reveal
  wrapper + aria-live on commit, gated to the Continue/Skip transition — applies to the instrument-styled gate here too.

---

## 7 · "Apply to ALL app" — coverage checklist

This redesign is **not** a landing-only or Faraday-only change. Implementation is complete only when:

- [ ] **Tokens** — the warm `--color-chassis`/`title`/`muted`/`border` (+ new `ink`/`rail`/`screen`/`part-N-bg`)
      land in `index.css`, light **and** dark, so **every page** sits on the warm ground.
- [ ] **Landing** — the Part accordion replaces the card grid (all 5 Parts, all 25 sections listed + clickable).
- [ ] **Sidebar** — the 3-level accordion ships for **every in-course route**, with the active-section + scroll-spy
      subnav + completion badges working on all 25 sections.
- [ ] **Subsection TOC** — **all 25 sections** expose anchors (via §3.2's `SectionAnchor`), so none falls back to a
      missing level-3.
- [ ] **`simHeavy`** flag set for **all 25** (the §3.4 table) so auto-collapse behaves everywhere.
- [ ] **Section shell** — the warm chrome + instrument-styled predict-first gate applies to **every** section
      (interacts with ultraplan **#10** chrome-hoist — the shared shell is where this lives).
- [ ] **Collapse pref** persisted in `progressStore`; **mobile** bottom-tab-bar + drawer on every page.
- [ ] **Type** — Space Grotesk display loaded and applied to all titles/headers app-wide.

## 8 · Implementation mapping (deferred to Gate-2 execution — net-first)

Indicative targets (verify against current code at implementation; do not treat as asserted line numbers):
`index.css` (tokens) · `src/shared/components/CourseLanding.tsx` (landing accordion) · `Sidebar.tsx` (3-level nav +
collapse + scroll-spy subscription) · the section shell / `SectionLayout` (breadcrumb, instrument gate, `SectionAnchor`
host) · `curriculum.ts` (subsections source and/or `simHeavy`) · `progressStore` (`sidebarCollapsed`).

**Sequencing (honors the audit):** this is ultraplan **#11** and is entangled with **#10** (chrome-hoist — the shared
shell that the section chrome and the breadcrumb need) and the **#9** correctness net (net-before-refactor). The
shell/nav redesign should land **after** #10 breaks the `@em` import and **on top of** #9's net, with its own
component tests (route-integrity, active-section, scroll-spy active state, auto-collapse precedence, persistence). No
section's existing simulation or predict-first gate may regress — characterize before refactor.

## 9 · Open micro-decisions (small; owner can tune anytime, non-blocking)

- Keep the compact through-line hero on the landing, or drop it so the accordion leads immediately?
- Trace screens **dark** (current) or **light accent-plots** on the warm cards?
- Long Parts (P1 = 9 sections): sidebar shows all, or trims with "+N more"?
- Mobile primary: **bottom tab-bar** (recommended) vs hamburger drawer.
- `s-domain` / `transformers` `simHeavy`: start `false` (current proposal) or `true`?
