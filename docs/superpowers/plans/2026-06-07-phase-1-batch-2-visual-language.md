# Phase 1 — Batch 2 — Visual Language ("Lab Instrument" light) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the locked "Lab Instrument on a light cool-grey chassis" visual language to the five shared chrome surfaces (token layer → CourseLanding → Sidebar → LabStation → PhysicsChart container), so the rest of the course inherits the look through shared components.

**Architecture:** Add a semantic CSS-variable **token layer** in `src/index.css` via Tailwind v4 `@theme static` (chassis/card/card-border/title/muted/led/cta + `part-1..5` accents and `-label` tints), plus an *unlayered* `.dark { … }` block that re-points those variables for dark mode. Components then style with token utilities (`bg-card`, `text-title`, `text-muted`, `border-card-border`, `text-cta`, `bg-led`) and per-Part accents via inline `style={{ … 'var(--color-part-N)' }}` (Tailwind v4 cannot generate dynamic `border-part-${n}` classes). **`static` is mandatory:** v4 tree-shakes unused theme variables by default, and the Part accents are consumed *only* through inline `var()` (never as a utility class), so without `static` they would be omitted from `:root` and render colorless. **Plain `@theme` (never `@theme inline`):** utilities must keep referencing `var(--color-*)` so the `.dark` override re-points them. The Part→quantity word map (`PART_QUANTITIES`) is exported from `curriculum.ts` and shared by CourseLanding + Sidebar.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS v4 (`@theme`, `@variant dark`), Vite, Vitest + Testing Library, zustand (theme/progress stores), recharts 3.8.

---

## Scope & locked decisions

This batch is **Theme E** from `docs/superpowers/specs/2026-06-06-phase-1-consistency-and-refresh-design.md` §4.E.

**Decisions taken** (spec §5 recommendations, confirmed by build order):
- **E1 — chrome-only.** Retint only the 5 shared chrome surfaces. The ~174 engineering-blue usages in section bodies/Tabs/AiTutor/gates stay until a later content sweep. (Verified footprint: 188 `engineering-blue` occurrences across 39 files; this batch touches 5.)
- **E2 — leave canvas constants.** `em/constants/physics.ts` `COLORS.POWER` (purple) is a different layer; not touched here.
- **E3 — `PART_QUANTITIES` lives in `curriculum.ts`** (metadata, reused by 2 components).
- **E4 — dark Part accents lightened one step** (the brighter pre-deepened values).

**Owner decisions — LOCKED 2026-06-08** (after a 12-agent devil's-advocate panel; this plan reflects them):
- **Q1 — quantity tag: KEEP it.** It is a load-bearing element: the only non-colour text fallback for the Part code (the accent hues are red-green / blue-violet colour-blind confusion pairs → WCAG 1.4.1), a real advance-organizer, and the instrument identity. BUT two words were inaccurate and are **corrected**: Part 1 `CURRENT → CIRCUITS`, Part 5 `POWER → LINES` (Parts 2/3/4 = E-FIELD/B-FIELD/WAVES unchanged). Final map: `{1:'CIRCUITS', 2:'E-FIELD', 3:'B-FIELD', 4:'WAVES', 5:'LINES'}`.
- **Q2 — sidebar Part label: VARIANT B (compact eyebrow only).** No resting descriptive-title line (preserves vertical budget; avoids 256px title wrap pushing the Part 5 capstone below the fold; matches the owner's anti-clutter instrument taste). The full Part title is **not lost** — it stays visible on the landing cards, and in the sidebar it is recoverable via an `sr-only` span (screen readers) + a `title` attribute (desktop hover) on the eyebrow.

Both keep the uppercase eyebrow, so the `app.test.tsx` `/Part 1 ·/` fix in Task 4 is required.

**Token note for the executor:** the **new** `--color-part-1..5` set (Task 1) is the source of truth for chrome. The pre-existing physics tokens in `index.css` (`--color-e-field/b-field/current/power`; `--color-power` is violet `#9333ea`; there is intentionally no `--color-waves`) are a **different layer** used by canvas/content — leave them untouched (E2 / content-sweep). Do not "reconcile" them in this batch.

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/index.css` | Token layer + dark override + body base | Add tokens, retarget `body`, add `.dark` override |
| `src/shared/constants/curriculum.ts` | Curriculum metadata | Add `PART_QUANTITIES` export |
| `src/shared/constants/__tests__/curriculum.test.ts` | Curriculum unit tests | Add `PART_QUANTITIES` cases |
| `src/shared/components/CourseLanding.tsx` | Landing page | Retint + Part accent border + mono tag |
| `src/shared/components/__tests__/CourseLanding.test.tsx` | Landing smoke test | **Create** |
| `src/shared/components/layout/Sidebar.tsx` | Course sidebar | Neutralize masthead, mono Part labels, LED, active accent |
| `src/shared/components/layout/__tests__/Sidebar.test.tsx` | Sidebar smoke test | **Create** |
| `src/__tests__/app.test.tsx` | App integration | Update sidebar-label assertion to new eyebrow |
| `src/shared/components/common/LabStation.tsx` | Docked lab frame | Neutralize engineering-blue → tokens + LED |
| `src/em/components/common/PhysicsChart.tsx` | Chart container | Retint container/title to tokens |

---

## Task 0: Branch

- [ ] **Step 1: Create the batch branch**

Run:
```bash
cd "C:/Users/cassi/Documents/GitHub/EM-CA-LAB"
git checkout main && git pull --ff-only
git checkout -b phase-1-batch-2-visual-language
```
Expected: switched to a new branch off the up-to-date `main` (`154f529` or later).

---

## Task 1: Token layer in `index.css`

**Files:**
- Modify: `src/index.css` (the `@theme` block; the `body` rule; add a `.dark` override block)

This is pure CSS; verification is `npm run build` + the manual visual walk (Task 7). Two rules: (a) **never `@theme inline`** — utilities must keep referencing `var(--color-*)` so the `.dark` override re-points them; (b) **use `@theme static`** for this block — the Part accents are consumed only via inline `var()` and would otherwise be tree-shaken out of `:root`.

- [ ] **Step 1: Add the token block as a new `@theme static` block**

In `src/index.css`, add a NEW block immediately **after** the existing `@theme { … }` block closes (i.e. after its closing `}` on the line following `--color-power: #9333ea;`). Do NOT put these inside the existing `@theme` block — give them their own `static` block so all tokens are guaranteed emitted to `:root`:

```css
/* ── Lab Instrument chrome tokens (Phase 1 Batch 2) ────────────────────────
 * `static` forces emission of every token to :root even when consumed only via
 * inline var() (the Part accents). Plain @theme (NOT inline) so utilities like
 * bg-card keep referencing var(--color-*); the unlayered `.dark` block re-points them. */
@theme static {
  --color-chassis: #f1f5f9;
  --color-card: #ffffff;
  --color-card-border: #e2e8f0;
  --color-title: #0f172a;
  --color-muted: #64748b;
  --color-led: #10b981;
  --color-cta: #2563eb;

  /* Per-Part physics-quantity accents (deepened for light surfaces) */
  --color-part-1: #d97706;
  --color-part-2: #dc2626;
  --color-part-3: #2563eb;
  --color-part-4: #7c3aed;
  --color-part-5: #059669;
  --color-part-1-label: #b45309;
  --color-part-2-label: #b91c1c;
  --color-part-3-label: #1d4ed8;
  --color-part-4-label: #6d28d9;
  --color-part-5-label: #047857;
}
```

- [ ] **Step 2: Point `body` at the chassis/title tokens and drop the now-redundant `.dark body`**

Replace the existing `body { … }` rule AND the `.dark body { … }` rule:

```css
body {
  @apply bg-slate-50 text-slate-900 antialiased;
  margin: 0;
}

.dark body {
  @apply bg-slate-900 text-slate-100;
}
```

with (the dark colors now come from the token override, so `.dark body` is deleted):

```css
body {
  @apply bg-chassis text-title antialiased;
  margin: 0;
}
```

- [ ] **Step 3: Add the unlayered `.dark` token override**

Add this block right after the `body { … }` rule (placement after `@theme` and being *unlayered* guarantees it wins over Tailwind's theme-layer `:root` vars):

```css
/* Dark mode re-points the chrome tokens (chassis→slate-900, card→slate-800, …)
 * and lightens the Part accents one step (E4). `.dark` lives on <html>
 * (progressStore.applyTheme), so these custom properties inherit everywhere. */
.dark {
  --color-chassis: #0f172a;
  --color-card: #1e293b;
  --color-card-border: #334155;
  --color-title: #f1f5f9;
  --color-muted: #94a3b8;

  --color-part-1: #f59e0b;
  --color-part-2: #ef4444;
  --color-part-3: #3b82f6;
  --color-part-4: #a855f7;
  --color-part-5: #10b981;
  --color-part-1-label: #fbbf24;
  --color-part-2-label: #f87171;
  --color-part-3-label: #60a5fa;
  --color-part-4-label: #c084fc;
  --color-part-5-label: #34d399;
}
```

- [ ] **Step 4: Verify the build compiles the new utilities**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" run build
```
Expected: `tsc -b && vite build` exits 0. (Confirms `bg-chassis`/`text-title`/`border-card-border`/`text-cta`/`bg-led` etc. are generated and `@apply bg-chassis` resolves.)

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(theme): add Lab Instrument token layer + dark override"
```

---

## Task 2: `PART_QUANTITIES` in curriculum (TDD)

**Files:**
- Modify: `src/shared/constants/curriculum.ts`
- Test: `src/shared/constants/__tests__/curriculum.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `curriculum.test.ts` (and add `PART_QUANTITIES` to the import on line 2–9):

```ts
  it('PART_QUANTITIES maps each Part number to its physics-quantity word', () => {
    expect(PART_QUANTITIES[1]).toBe('CIRCUITS');
    expect(PART_QUANTITIES[2]).toBe('E-FIELD');
    expect(PART_QUANTITIES[3]).toBe('B-FIELD');
    expect(PART_QUANTITIES[4]).toBe('WAVES');
    expect(PART_QUANTITIES[5]).toBe('LINES');
  });

  it('PART_QUANTITIES covers every Part in the spine', () => {
    for (const part of PARTS) {
      expect(PART_QUANTITIES[part.number], `Part ${part.number}`).toBeTruthy();
    }
  });
```

Add the symbol to the existing import:
```ts
import {
  PARTS,
  SECTIONS,
  ALL_SECTIONS,
  getAdjacentSections,
  getPartForSection,
  getExpectedChecks,
  PART_QUANTITIES,
} from '@shared/constants/curriculum';
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/constants/__tests__/curriculum.test.ts
```
Expected: FAIL — `PART_QUANTITIES` is `undefined` (not exported yet).

- [ ] **Step 3: Implement the export**

Append to `src/shared/constants/curriculum.ts` (after `getSectionNumber`):

```ts
/** The physics quantity each Part foregrounds, used as the mono `PART 0N · QUANTITY`
 *  instrument tag on the landing cards and in the sidebar. Keyed by Part number. */
export const PART_QUANTITIES: Record<number, string> = {
  1: 'CIRCUITS',
  2: 'E-FIELD',
  3: 'B-FIELD',
  4: 'WAVES',
  5: 'LINES',
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/constants/__tests__/curriculum.test.ts
```
Expected: PASS (all curriculum cases green).

- [ ] **Step 5: Commit**

```bash
git add src/shared/constants/curriculum.ts src/shared/constants/__tests__/curriculum.test.ts
git commit -m "feat(curriculum): export PART_QUANTITIES word map"
```

---

## Task 3: Restyle `CourseLanding` (TDD)

**Files:**
- Test: `src/shared/components/__tests__/CourseLanding.test.tsx` (create)
- Modify: `src/shared/components/CourseLanding.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/shared/components/__tests__/CourseLanding.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseLanding } from '@shared/components/CourseLanding';

function renderLanding() {
  render(
    <MemoryRouter>
      <CourseLanding />
    </MemoryRouter>,
  );
}

describe('CourseLanding', () => {
  it('shows a mono PART · QUANTITY tag for the first and last Part', () => {
    renderLanding();
    expect(screen.getByText(/PART 01/)).toHaveTextContent('CIRCUITS');
    expect(screen.getByText(/PART 05/)).toHaveTextContent('LINES');
  });

  it('deep-links each section name to its route', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: "Coulomb's Law" });
    expect(link).toHaveAttribute('href', '/coulomb');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/components/__tests__/CourseLanding.test.tsx
```
Expected: FAIL — no element matches `/PART 01/` (the current card shows a blue number badge, not the mono tag).

- [ ] **Step 3: Replace `CourseLanding.tsx` with the retinted version**

Full replacement of `src/shared/components/CourseLanding.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PARTS, SECTIONS, PART_QUANTITIES } from '@shared/constants/curriculum';

/**
 * Course landing page (route `/`). One entry point onto the 5-Part spine, styled
 * in the "Lab Instrument" light palette: cool-grey chassis, white cards, a 4px
 * per-Part accent border and a mono `PART 0N · QUANTITY` tag. Section names
 * deep-link into each section.
 */
export function CourseLanding() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl mx-auto text-center">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-2">
          Five instruments · one bench
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-title">
          Electromagnetism &amp; Circuit Analysis
        </h1>
        <p className="mt-3 text-muted">
          Predict, then observe. Work through the five parts in order, or jump straight to any
          section from the sidebar.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PARTS.map((part) => {
          const first = SECTIONS[part.sectionIds[0]];
          const accent = `var(--color-part-${part.number})`;
          const labelColor = `var(--color-part-${part.number}-label)`;
          return (
            <div
              key={part.id}
              className="flex flex-col rounded-xl border border-l-4 border-card-border bg-card p-6 shadow-sm"
              style={{ borderLeftColor: accent }}
            >
              <p
                className="font-mono text-[10px] font-bold tracking-widest mb-1"
                style={{ color: labelColor }}
              >
                PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
              </p>
              <h2 className="text-lg font-bold text-title mb-3">{part.title}</h2>
              <ul className="text-sm text-muted space-y-1 mb-4 flex-1">
                {part.sectionIds.map((id) => (
                  <li key={id} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />
                    <Link
                      to={SECTIONS[id].route}
                      className="rounded-sm transition-colors hover:text-cta hover:underline focus:outline-none focus:ring-2 focus:ring-cta"
                    >
                      {SECTIONS[id].title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={first.route}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-cta transition-all hover:gap-2.5"
              >
                Start Part {part.number}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

> The tag is **kept** (locked). `PART_QUANTITIES[1]` is now `CIRCUITS` and `[5]` is `LINES`, so the cards render `PART 01 · CIRCUITS` … `PART 05 · LINES` automatically — no per-word code here.

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/components/__tests__/CourseLanding.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/CourseLanding.tsx src/shared/components/__tests__/CourseLanding.test.tsx
git commit -m "feat(landing): apply Lab Instrument palette + Part accents"
```

---

## Task 4: Restyle `Sidebar` + fix `app.test.tsx` (TDD)

**Files:**
- Test: `src/shared/components/layout/__tests__/Sidebar.test.tsx` (create)
- Modify: `src/shared/components/layout/Sidebar.tsx`
- Modify: `src/__tests__/app.test.tsx` (the sidebar-label assertion)

- [ ] **Step 1: Write the failing Sidebar smoke test**

Create `src/shared/components/layout/__tests__/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@shared/components/layout/Sidebar';

function renderSidebar() {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders the masthead heading and Course Home', () => {
    renderSidebar();
    expect(screen.getByRole('heading', { name: /EM&AC Lab/ })).toBeInTheDocument();
    expect(screen.getByText('Course Home')).toBeInTheDocument();
  });

  it('labels each Part with a mono PART · QUANTITY eyebrow', () => {
    renderSidebar();
    expect(screen.getByText(/PART 01/)).toHaveTextContent('CIRCUITS');
    expect(screen.getByText(/PART 03/)).toHaveTextContent('B-FIELD');
  });

  it('keeps the full Part title available to assistive tech (Variant B sr-only)', () => {
    renderSidebar();
    expect(screen.getByText(/Circuit Analysis, Laplace/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/components/layout/__tests__/Sidebar.test.tsx
```
Expected: FAIL — no `/PART 01/` element (current label is `Part 1 · Circuit Analysis…`).

- [ ] **Step 3: Replace `Sidebar.tsx` with the retinted version**

Full replacement of `src/shared/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom';
import { Home, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { PARTS, SECTIONS, PART_QUANTITIES } from '@shared/constants/curriculum';
import { useThemeStore, useProgressStore, isModuleComplete } from '@shared/store/progressStore';

/**
 * Course sidebar. Renders the 5-Part spine from the curriculum config in the
 * "Lab Instrument" palette: a neutral white masthead with a green "live" LED,
 * each Part labelled by a mono `PART 0N · QUANTITY` eyebrow, completion shown by
 * a green LED check, and the active section marked with its Part-accent edge.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, toggleTheme } = useThemeStore();
  const sections = useProgressStore((s) => s.sections);

  return (
    <aside className="w-64 bg-card border-r border-card-border flex flex-col h-full">
      <div className="p-6 border-b border-card-border">
        <h1 className="flex items-center gap-2 text-xl font-bold text-title">
          <span
            className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)]"
            aria-hidden="true"
          />
          EM&amp;AC Lab
        </h1>
        <p className="text-sm text-muted mt-1">Electromagnetism &amp; Circuit Analysis</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto" aria-label="Course navigation">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm mb-4',
              isActive
                ? 'bg-chassis text-title font-semibold'
                : 'text-muted hover:bg-chassis hover:text-title',
            )
          }
        >
          <Home className="w-4 h-4" />
          <span>Course Home</span>
        </NavLink>

        {PARTS.map((part) => {
          const accent = `var(--color-part-${part.number})`;
          const labelColor = `var(--color-part-${part.number}-label)`;
          return (
            <div key={part.id} className="mb-4">
              <p
                className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-2"
                style={{ color: labelColor }}
                title={part.title}
              >
                PART {String(part.number).padStart(2, '0')} · {PART_QUANTITIES[part.number]}
                <span className="sr-only"> — {part.title}</span>
              </p>
              <ul className="space-y-1">
                {part.sectionIds.map((id) => {
                  const section = SECTIONS[id];
                  const done = isModuleComplete(sections[id], id);
                  return (
                    <li key={id}>
                      <NavLink
                        to={section.route}
                        onClick={onNavigate}
                        style={({ isActive }) =>
                          isActive ? { borderLeftWidth: '3px', borderLeftColor: accent } : undefined
                        }
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm',
                            isActive
                              ? 'bg-chassis text-title font-semibold'
                              : 'text-muted hover:bg-chassis hover:text-title',
                          )
                        }
                      >
                        <CheckCircle2
                          className={cn(
                            'w-4 h-4 shrink-0',
                            done ? 'text-led' : 'text-slate-300 dark:text-slate-600',
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{section.title}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-card-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm font-medium bg-chassis text-muted hover:text-title transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <p className="text-[10px] text-muted text-center font-medium tracking-wide">
          EM &amp; Circuit Analysis · 6 ECTS
        </p>
        <p className="text-[10px] text-muted text-center mt-0.5">&copy; 2026 LUT University</p>
      </div>
    </aside>
  );
}
```

> **Variant B is locked.** There is no resting descriptive-title line; the `sr-only` span + `title` attribute on the eyebrow are the accessibility/hover recovery for the full Part name (the landing cards still show it in full). Do not add a visible title line.

- [ ] **Step 4: Fix the `app.test.tsx` sidebar-label assertion**

In `src/__tests__/app.test.tsx`, replace lines 23–24:

```tsx
    expect(screen.getByText(/Part 1 ·/)).toBeInTheDocument();
    expect(screen.getByText(/Part 5 ·/)).toBeInTheDocument();
```

with:

```tsx
    expect(screen.getByText(/PART 01/)).toBeInTheDocument();
    expect(screen.getByText(/PART 05/)).toBeInTheDocument();
```

- [ ] **Step 5: Run the Sidebar + app tests to verify they pass**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/components/layout/__tests__/Sidebar.test.tsx src/__tests__/app.test.tsx
```
Expected: PASS (both files green; the `/PART 01/` masthead/eyebrow now matches).

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/layout/Sidebar.tsx src/shared/components/layout/__tests__/Sidebar.test.tsx src/__tests__/app.test.tsx
git commit -m "feat(sidebar): neutralize masthead, mono Part labels, LED completion"
```

---

## Task 5: Restyle `LabStation`

**Files:**
- Modify: `src/shared/components/common/LabStation.tsx`
- Test: `src/shared/components/common/__tests__/LabStation.test.tsx` (existing — should stay green unchanged)

LabStation is a generic frame that does not know its Part, so it gets the **neutral** instrument treatment (tokens + a green "live" LED), not a Part accent. The existing test asserts the `Interactive Lab` eyebrow text and the numbered heading by text content only — these are preserved, so no test edit is required.

- [ ] **Step 1: Replace the styling in `LabStation.tsx`**

Full replacement of `src/shared/components/common/LabStation.tsx`:

```tsx
import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/**
 * Props for {@link LabStation} — the docked "virtual laboratory" frame.
 */
interface LabStationProps {
  /** Optional section number shown before the title (e.g. "3.3"). */
  number?: string;
  /** Lab-station title (e.g. "Reflections & Standing Waves"). */
  title: string;
  /** One-line statement of what the learner will explore at this station. */
  objective?: string;
  /** Station contents — typically a prediction prompt followed by the docked simulation. */
  children: ReactNode;
  /** Optional id for deep-linking / scroll targets. */
  id?: string;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * A consistent, discoverable frame that docks an interactive simulation inline
 * with the surrounding theory — the core building block of the "virtual lab"
 * template. Styled in the neutral "Lab Instrument" palette with a green "live"
 * LED in the header; the simulation (passed as children) is always visible.
 */
export function LabStation({
  number,
  title,
  objective,
  children,
  id,
  className,
}: LabStationProps) {
  return (
    <section
      id={id}
      className={cn(
        'rounded-xl border border-card-border bg-card shadow-md overflow-hidden',
        className,
      )}
    >
      <div className="flex items-start gap-3 px-5 py-3 border-b border-card-border bg-chassis">
        <FlaskConical className="w-5 h-5 text-cta shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-semibold text-cta uppercase tracking-widest mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-led shadow-[0_0_6px_var(--color-led)]"
              aria-hidden="true"
            />
            Interactive Lab
          </p>
          <h2 className="text-lg font-bold text-title">
            {number && <span className="font-mono text-sm text-muted mr-2">{number}</span>}
            {title}
          </h2>
          {objective && (
            <p className="text-sm text-muted leading-relaxed mt-1">{objective}</p>
          )}
        </div>
      </div>
      <div className="p-5 space-y-6">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Run the existing LabStation test to confirm it stays green**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test -- src/shared/components/common/__tests__/LabStation.test.tsx
```
Expected: PASS (eyebrow text `Interactive Lab`, numbered heading, objective, children all still present).

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/common/LabStation.tsx
git commit -m "feat(labstation): neutral instrument palette + live LED"
```

---

## Task 6: Restyle `PhysicsChart` container

**Files:**
- Modify: `src/em/components/common/PhysicsChart.tsx` (the wrapper `<div>` + `<h3>` only)

The recharts internals (`textColor`/`gridColor`/tooltip) already use slate values that equal the tokens and are out of scope here (axis/log fixes are Theme G / Batch 3). Only the container chrome changes.

- [ ] **Step 1: Retint the container div and title**

In `src/em/components/common/PhysicsChart.tsx`, replace:

```tsx
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
```

with:

```tsx
    <div className="bg-card rounded-xl border border-card-border p-4 shadow-sm">
      <h3 className="text-sm font-bold text-title mb-3">{title}</h3>
```

- [ ] **Step 2: Build to confirm it compiles**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" run build
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/em/components/common/PhysicsChart.tsx
git commit -m "feat(chart): retint PhysicsChart container to card tokens"
```

---

## Task 7: Whole-batch verification & finish

**Files:** none (verification + integration)

- [ ] **Step 1: Lint**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" run lint
```
Expected: 0 errors. (Watch for `react-refresh/only-export-components` — `curriculum.ts` is a non-component module so adding `PART_QUANTITIES` is fine; if lint flags it, it is a false positive to investigate, not silence.)

- [ ] **Step 2: Build**

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" run build
```
Expected: `tsc -b && vite build` exits 0.

- [ ] **Step 3: Full test suite** (≥300 s timeout, in background or with long timeout — DO NOT pipe through `tail`; read the "Tests N passed" summary line)

Run:
```bash
npm --prefix "C:/Users/cassi/Documents/GitHub/EM-CA-LAB" test
```
Expected: all files pass. Baseline was 268 tests / 40 files; this batch adds 2 curriculum cases + the new `CourseLanding` file (2 tests) + the new `Sidebar` file (3 tests) → **275 tests / 42 files**, 0 skips. Confirm the summary line reads all passed.

- [ ] **Step 4: Manual visual walk** (`npm run dev`) — not headless-verifiable; the real definition of done for a visual batch:
  - Landing: cool-grey chassis, white cards, **4px left accent border per Part** in the right colour, mono `PART 0N · QUANTITY` tag, section deep-links work, hover → CTA blue.
  - Sidebar: white masthead (no blue gradient), green LED by the title, mono Part eyebrows, completion check turns green when a section is complete, active section shows its Part-accent left edge.
  - LabStation (e.g. `/transmission-lines`): neutral white frame, green LED in the header, no engineering-blue.
  - PhysicsChart (e.g. `/coulomb`, `/gauss`): white card container in the new palette.
  - **Dark mode** (toggle): chassis→slate-900, cards→slate-800, Part accents lightened one step, text legible. Toggle back to light.
  - Note the expected **mixed palette** (E1): section *bodies* still show engineering-blue — that is the deferred content sweep, not a bug.

- [ ] **Step 5: Finish the branch**

REQUIRED SUB-SKILL: Use `superpowers:finishing-a-development-branch` to merge `phase-1-batch-2-visual-language` into `main` (fast-forward), push to `origin/main`, and delete the feature branch — mirroring the Batch 1 flow. Commit/PR trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## Verification (definition of done)

- `npm run lint` → 0 errors; `npm run build` → exits 0.
- `npm test` → all green incl. new `PART_QUANTITIES`, `CourseLanding`, and `Sidebar` tests; `app.test.tsx` updated to the new eyebrow label.
- Manual visual walk passes (chassis/cards/Part accents/LED/active edge/dark mode), per Task 7 Step 4.
- No new engineering-blue introduced in the 5 chrome surfaces; section bodies' blue is the intentional deferred sweep.

## Out of scope (this batch)

- Section-body engineering-blue retint (content sweep, fast-follow).
- Theme A (bench width/mobile), F (predict-first ×9), G (chart axis/log fixes) → Batch 3.
- Canvas `physics.ts` palette (E2); `Tabs`/`TabSet` unification.
