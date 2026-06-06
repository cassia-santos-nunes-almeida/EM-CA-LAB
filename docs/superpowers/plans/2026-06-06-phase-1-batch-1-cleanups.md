# Phase 1 — Batch 1 (Cleanups) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the three low-risk cleanups of Phase 1 — clickable landing links (D), standardized section numbering (C), and locally-vendored images (B) — each shippable and green.

**Architecture:** Pure consistency work on the consolidated Vite/React/TS app. A new derived `getSectionNumber()` helper in the curriculum config is the single source of truth for "Part.Section" numbers; section headings consume it. Images move from fragile Wikimedia hotlinks to `public/figures/` served via `import.meta.env.BASE_URL`. No new runtime behavior, no new dependencies.

**Tech Stack:** React 19 + react-router, Tailwind v4, Vitest, Vite + vite-plugin-pwa. Run commands with `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' <script>`; the full suite is slow (~90–175s) so run it in the background.

**Source of truth:** the approved spec `docs/superpowers/specs/2026-06-06-phase-1-consistency-and-refresh-design.md` and the verified per-line evidence `docs/superpowers/specs/2026-06-06-phase-1-scoping.json` (referred to below as *the appendix*). Work happens on branch `phase-1-consistency-refresh`.

**Locked decisions used here:** C1 = section shows `Part.Section` (e.g. `5.2`), in-section sub-numbers dropped (title-only). B1 = vendor all images; source substitutes for the 11 dead (404) ones with **owner sign-off per image**. B2 = vendor the 500px thumbnails.

---

## Theme D — Clickable landing section names

### Task 1: Make each landing section name a deep link

**Files:**
- Modify: `src/shared/components/CourseLanding.tsx:38-43`
- Test: `src/__tests__/app.test.tsx`

- [ ] **Step 1: Add a failing test that a landing section name links to its route**

In `src/__tests__/app.test.tsx`, add (inside the existing top-level `describe`):

```tsx
import { SECTIONS } from '@shared/constants/curriculum';

it('links each landing section name to its section route', () => {
  render(<App />); // App already wraps MemoryRouter/BrowserRouter per the existing tests — match the existing render helper in this file
  const link = screen.getByRole('link', { name: SECTIONS['coulomb'].title });
  expect(link).toHaveAttribute('href', SECTIONS['coulomb'].route); // '/coulomb'
});
```

> If the file’s existing tests use a custom `renderApp()` helper or a specific initial route, reuse that helper and ensure the initial route is `/` (the landing) so the Part cards render.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' test -- src/__tests__/app.test.tsx -t "links each landing section name"`
Expected: FAIL — no `link` with that accessible name (the name is currently plain text).

- [ ] **Step 3: Wrap the section title in a `<Link>`**

In `src/shared/components/CourseLanding.tsx`, replace the bare title node (around lines 38–43):

```tsx
{part.sectionIds.map((id) => (
  <li key={id} className="flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-engineering-blue-400 shrink-0" aria-hidden="true" />
    <Link
      to={SECTIONS[id].route}
      className="rounded-sm hover:text-engineering-blue-600 dark:hover:text-engineering-blue-400 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-engineering-blue-500"
    >
      {SECTIONS[id].title}
    </Link>
  </li>
))}
```

`Link` is already imported in this file; `SECTIONS` is already imported. The decorative bullet keeps `aria-hidden`, so the link is the only focusable/announced element.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' test -- src/__tests__/app.test.tsx -t "links each landing section name"`
Expected: PASS. Also confirm the existing `getAllByText('Component Physics')` assertion still passes (text content is preserved inside the Link).

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/CourseLanding.tsx src/__tests__/app.test.tsx
git commit -m "feat(landing): deep-link each section name on the course home" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Theme C — Section numbering standardization

### Task 2: Add the `getSectionNumber` helper (TDD)

**Files:**
- Modify: `src/shared/constants/curriculum.ts` (append after `getExpectedChecks`, end of file)
- Test: `src/shared/constants/__tests__/getSectionNumber.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/shared/constants/__tests__/getSectionNumber.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getSectionNumber } from '@shared/constants/curriculum';

describe('getSectionNumber', () => {
  it('derives Part.Section from spine order', () => {
    expect(getSectionNumber('component-physics')).toBe('1.1');
    expect(getSectionNumber('interactive-lab')).toBe('1.5');
    expect(getSectionNumber('coulomb')).toBe('2.1');
    expect(getSectionNumber('magnetic-circuits')).toBe('3.3');
    expect(getSectionNumber('transformers')).toBe('3.4'); // code lives in transmission, teaches in Part 3
    expect(getSectionNumber('antennas')).toBe('4.4');      // NOT Part 5
    expect(getSectionNumber('transmission-lines')).toBe('5.2');
    expect(getSectionNumber('transients')).toBe('5.3');
  });

  it('returns empty string for an unknown id', () => {
    expect(getSectionNumber('does-not-exist')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' test -- getSectionNumber`
Expected: FAIL — `getSectionNumber` is not exported.

- [ ] **Step 3: Implement the helper**

Append to `src/shared/constants/curriculum.ts`:

```ts
/** The course-wide "Part.Section" number for a section, derived from PARTS
 *  order (e.g. transmission-lines → "5.2"). Empty string if not wired in.
 *  Derived (not stored) so re-ordering the spine auto-renumbers everything. */
export function getSectionNumber(sectionId: string): string {
  const part = PARTS.find((p) => p.sectionIds.includes(sectionId));
  if (!part) return '';
  return `${part.number}.${part.sectionIds.indexOf(sectionId) + 1}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' test -- getSectionNumber`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/constants/curriculum.ts src/shared/constants/__tests__/getSectionNumber.test.ts
git commit -m "feat(curriculum): derive Part.Section numbers from the spine" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 3: Show `Part.Section` on every EM section heading (via SectionLayout)

**Files:**
- Modify: `src/em/components/common/section/SectionLayout.tsx:1-6, 50-63`

This single edit numbers all 10 EM sections (coulomb…polarization), which currently render their H1 from `SectionLayout`.

- [ ] **Step 1: Import the helper**

Add to the imports (top of `SectionLayout.tsx`):

```ts
import { getSectionNumber } from '@shared/constants/curriculum';
```

- [ ] **Step 2: Render the number before the heading**

Replace the `header` block (lines ~58–63):

```tsx
{heading && (
  <header>
    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
      {getSectionNumber(sectionId) && (
        <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
          {getSectionNumber(sectionId)}
        </span>
      )}
      {heading}
    </h1>
    {sub && <p className="mt-1 text-slate-600 dark:text-slate-400">{sub}</p>}
  </header>
)}
```

> Style note: `engineering-blue` here is intentional for Batch 1; Theme E (Batch 2) re-tints these tokens later. Don’t hand-tune colors now.

- [ ] **Step 3: Verify build + a spot check**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' run build`
Expected: exits 0. Then `npm run dev` and confirm `/coulomb` shows “2.1 Coulomb's Law”, `/magnetic-circuits` shows “3.3 …”.

- [ ] **Step 4: Commit**

```bash
git add src/em/components/common/section/SectionLayout.tsx
git commit -m "feat(em): show Part.Section number on EM section headings" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: Show `Part.Section` on the circuits module headings

**Files (each renders its own `<h1>`):**
- `src/circuits/components/modules/ComponentPhysics/index.tsx:62` — id `component-physics` → `1.1`
- `src/circuits/components/modules/TimeDomain/index.tsx:54` — id `circuit-analysis` → `1.2`
- `src/circuits/components/modules/LaplaceTheory.tsx:373` — id `laplace-theory` → `1.3`
- `src/circuits/components/modules/SDomainAnalysis.tsx:370` — id `s-domain` → `1.4`
- `src/circuits/components/modules/InteractiveLab/index.tsx:569` — id `interactive-lab` → `1.5`

- [ ] **Step 1: For each file above, import the helper and prepend the number.** Pattern (using ComponentPhysics as the worked example):

```tsx
// add to imports:
import { getSectionNumber } from '@shared/constants/curriculum';

// change the h1 (line 62):
<h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
  <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
    {getSectionNumber('component-physics')}
  </span>
  Component Physics
</h1>
```

Apply the identical pattern to the other four, substituting the file’s id and existing title text (Circuit Analysis / Laplace Transform Theory / S-Domain Theory / Interactive Lab). Keep each file’s existing `<h1>` class string; only inject the `<span>` and the import.

- [ ] **Step 2: Build + spot check**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' run build`
Expected: exits 0. `npm run dev`: `/component-physics` → “1.1 Component Physics”, `/s-domain` → “1.4 S-Domain Theory”.

- [ ] **Step 3: Commit**

```bash
git add src/circuits/components/modules
git commit -m "feat(circuits): show Part.Section number on circuit module headings" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 5: Fix transmission module headings — add `Part.Section`, remove stale "Section N" eyebrows

**Files:**
- `src/transmission/components/modules/LumpedDistributed.tsx:50` — `lumped-distributed` → `5.1`
- `src/transmission/components/modules/TransmissionLines.tsx:455` — `transmission-lines` → `5.2`
- `src/transmission/components/modules/Transients.tsx:48-49` — `transients` → `5.3` (and delete stale `<p ...>Section 4</p>` on line 48)
- `src/transmission/components/modules/Transformers.tsx:48-49` — `transformers` → `3.4` (delete any stale `Section N` eyebrow immediately above the H1)
- `src/transmission/components/modules/Antennas.tsx` — `antennas` → `4.4` (locate its main title heading)

- [ ] **Step 1: Add the helper import to each of the five files**

```ts
import { getSectionNumber } from '@shared/constants/curriculum';
```

- [ ] **Step 2: Prepend the number to each module H1.** Pattern (TransmissionLines, line 455):

```tsx
<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
  <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
    {getSectionNumber('transmission-lines')}
  </span>
  Transmission Lines
</h1>
```

Apply per file with its id (5.1/5.3/3.4) and existing title text.

- [ ] **Step 3: Delete the stale "Section N" eyebrows.** In `Transients.tsx` remove line 48 `<p ...>Section 4</p>`. Open `Transformers.tsx` lines 44–49 and remove the analogous `Section N` `<p>` eyebrow above its H1 if present. (Grep to confirm: `grep -n "Section [0-9]" src/transmission/components/modules/*.tsx`.)

- [ ] **Step 4: Locate and number the Antennas heading.** Run `grep -n "<h1\|className=\"text-3xl\|className=\"text-2xl" src/transmission/components/modules/Antennas.tsx`, find the main section title, and prepend `{getSectionNumber('antennas')}` (= `4.4`) using the same `<span>` pattern.

- [ ] **Step 5: Build**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/transmission/components/modules
git commit -m "fix(transmission): correct module headings to Part.Section, drop stale Section labels" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 6: Remove the stale in-section sub-numbers (title-only) + Antennas mislabel

The five transmission modules carry old per-module sub-numbers in `<h2>` headings, `LabStation number=` props, eyebrow `<p>`s, and banner comments. **The authoritative, line-by-line list is in the appendix (`…-scoping.json`) under "Section numbering standardization" → `changes`.** Per decision C1, **drop the number** (title-only) at every one of those sites rather than renumbering.

**Files:** `TransmissionLines.tsx`, `LumpedDistributed.tsx`, `Transients.tsx`, `Transformers.tsx`, `Antennas.tsx` (sites enumerated in the appendix).

- [ ] **Step 1: Drop the `<h2>` heading numbers.** For each appendix site (e.g. `TransmissionLines.tsx:69/142/258/374`, `LumpedDistributed.tsx:69/163/262`, `Transients.tsx:94/179/212`, `Transformers.tsx:90/248/398`), change e.g. `3.2 &mdash; Reflections &amp; Standing Waves` → `Reflections &amp; Standing Waves` (delete the `N.N &mdash; ` prefix).

- [ ] **Step 2: Remove `LabStation number=` props.** Delete the `number="3.2"` / `"3.3"` / `"3.4"` props on the three `LabStation`s in `TransmissionLines.tsx` (lines ~218/335/416). (`LabStation`’s `number` prop is optional and already renders nothing when absent — no component change needed.)

- [ ] **Step 3: Fix the Antennas eyebrow mislabel.** Remove the numeric `Section 5.1/5.2/5.3/5.4` eyebrows in `Antennas.tsx` (appendix lines 102/216/303/379) — delete the `Section N.N` text (keep any non-numeric eyebrow label, or remove the `<p>` if it only held the number). This kills the bug where Antennas read as Part 5.

- [ ] **Step 4: Update banner comments** to drop/avoid the stale numbers (appendix lists them per file) so code navigation doesn’t contradict the UI.

- [ ] **Step 5: Verify no stale numbers remain**

Run: `grep -rn "[0-9]\.[0-9][^0-9]*&mdash;\|Section [0-9]" src/transmission/components/modules/`
Expected: no user-facing `N.N —` headings or `Section N` eyebrows remain (image-attribution dashes are unrelated). Then `npm run build` exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/transmission/components/modules
git commit -m "fix(transmission): drop stale per-module sub-numbers (title-only headings)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Theme B — Vendor images locally

> The authoritative per-image inventory (file:line, current URL, **alive/dead status**, proposed local filename, attribution) is in the appendix under "Theme B" → `changes`. Re-grep at execution time to guarantee nothing is missed; do not rely on a transcribed count.

### Task 7: Scaffold `public/figures/`, vendor the live images, repoint them

**Files:**
- Create: `public/figures/` (+ downloaded image files)
- Modify: `vite.config.ts` (VitePWA `globPatterns`)
- Modify: every section/module file holding a **live** `FigureImage` (per appendix)

- [ ] **Step 1: Enumerate the current image set (authoritative)**

Run: `grep -rn "src=\"https://upload.wikimedia.org" src --include=*.tsx`
This is the live list; cross-reference each against the appendix’s alive/dead status.

- [ ] **Step 2: Add jpg/jpeg to the PWA precache glob**

In `vite.config.ts`, change the VitePWA `workbox.globPatterns` to include jpg/jpeg:

```ts
globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
```

Save all vendored files with **lowercase** extensions (Workbox globs are case-sensitive; several Wikimedia originals are `.JPG`).

- [ ] **Step 3: Download each LIVE image to `public/figures/<kebab-name>`**

Use a browser User-Agent (Wikimedia 429-rate-limits bare clients). Example for one file (repeat per appendix filename):

```bash
mkdir -p public/figures
curl -L -A "Mozilla/5.0" -o public/figures/sma-connector.jpg \
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/SMA_connector.jpg/500px-SMA_connector.jpg"
```

Download all live images (the appendix lists each URL → target filename). Vendor the **500px thumbnail** URL (parity with current rendering).

- [ ] **Step 4: Repoint each live `FigureImage` src to the local path**

Per appendix site, change e.g.:

```tsx
// before
src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/SMA_connector.jpg/500px-SMA_connector.jpg"
// after
src={`${import.meta.env.BASE_URL}figures/sma-connector.jpg`}
```

Leave `alt`/`caption`/`attribution`/`sourceUrl`/`className` untouched for the live images.

- [ ] **Step 5: Verify build + that the live images resolve**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' run build` (exits 0), then `npm run dev` and confirm a couple of repointed figures load from `/figures/...` (Network tab shows local, not wikimedia).

- [ ] **Step 6: Commit**

```bash
git add public/figures vite.config.ts src
git commit -m "fix(images): vendor live Wikimedia figures into public/figures and precache them" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 8: Replace the 11 dead (404) images — OWNER SIGN-OFF GATE

The 11 dead figures (per appendix, e.g. VNA, eye-diagram, ringing, substation transformer, polarizing filter, Maxwell portrait, aurora, electromagnet, RC charge/discharge, Fluke multimeter, RF-choke inductor) need a **new** substitute image each — they cannot be re-downloaded.

- [ ] **Step 1: For each dead figure, propose a substitute** — find a current, license-compatible Wikimedia Commons image of the same subject; record its File: page (new `sourceUrl`) and license (new `attribution`).

- [ ] **Step 2: Present all 11 proposed substitutes to the owner for sign-off** (thumbnail + subject + license) **before** downloading. Do not proceed past unapproved items.

- [ ] **Step 3: For each approved substitute** — download to `public/figures/<name>` (Task 7 pattern), repoint `src`, and update **both** `attribution` and `sourceUrl` to the new file. Keep `alt`/`caption` (they describe the subject, not the specific photo) unless the owner edits them.

- [ ] **Step 4: Verify** — `npm run build` exits 0; `npm run dev` shows zero "Image unavailable" placeholders across the 11 sites.

- [ ] **Step 5: Commit**

```bash
git add public/figures src
git commit -m "fix(images): replace 11 dead figures with vendored, attributed substitutes" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 9: Add a regression guard against re-introducing hotlinks (TDD)

**Files:**
- Test: `src/__tests__/no-image-hotlinks.test.ts` (create)

- [ ] **Step 1: Write the guard test**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

// Use fast-glob if globSync isn't available; the repo already uses vite/node APIs in tests.
import fg from 'fast-glob';

describe('no external image hotlinks', () => {
  it('no FigureImage src points at an http(s) URL', () => {
    const files = fg.sync('src/**/*.tsx');
    const offenders: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (/src=\{?["'`]https?:\/\//.test(text) && text.includes('FigureImage')) {
        offenders.push(f);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

> If `fast-glob` is not already a dependency, use `node:fs`’s `readdirSync` recursion instead — do not add a dependency just for this test. Check `package.json` first.

- [ ] **Step 2: Run it**

Run: `npm --prefix 'C:\Users\cassi\Documents\GitHub\EM-CA-LAB' test -- no-image-hotlinks`
Expected: PASS (after Tasks 7–8 all hotlinks are gone). If it FAILS, it lists the files still hotlinking — fix them.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/no-image-hotlinks.test.ts
git commit -m "test(images): guard against re-introducing external image hotlinks" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Batch 1 — Final verification

- [ ] `npm --prefix '…EM-CA-LAB' run build` exits 0 (`tsc -b && vite build`).
- [ ] `npm --prefix '…EM-CA-LAB' run lint` exits 0.
- [ ] `npm --prefix '…EM-CA-LAB' test` green (run in background; ~90–175s). New tests pass: `getSectionNumber`, `app.test` landing-link, `no-image-hotlinks`.
- [ ] Manual: `/` section names click through; section headings show correct `Part.Section` (Antennas = `4.4`, Transformers = `3.4`, Transmission Lines = `5.2`); no stale `3.x`/`Section 4/5` labels remain; every figure loads (0 "Image unavailable").

---

## Self-review (against the spec)

- **Spec coverage:** B (Tasks 7–9), C (Tasks 2–6), D (Task 1) — all of Batch 1’s spec themes have tasks. Batch 2 (E) and Batch 3 (A, F, G) are intentionally separate plans.
- **Decisions honored:** C1 = section shows Part.Section + sub-numbers dropped (Tasks 3–6); B1 = substitutes gated on owner sign-off (Task 8); B2 = 500px thumbnails (Task 7 Step 3).
- **Placeholders:** none — patterns carry full code; bulk enumerations point at the committed appendix plus a re-grep so nothing is silently dropped (the appendix is evidence, not a TODO).
- **Type/name consistency:** `getSectionNumber` is defined once (Task 2) and consumed with the same signature in Tasks 3–5.
