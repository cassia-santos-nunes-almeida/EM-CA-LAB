# Track B · #14 — Self-Measuring Canvas Migration (EM sims) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the canvas-mis-size / no-DPR risk class across the EM domain by migrating every legacy EM simulation off its inline `canvas.width = parentElement.clientWidth` sizing onto one canonical, DPR-correct, self-measuring hook — with no change to any sim's physics, readouts, or predict-first gates.

**Architecture:** A proven self-measuring pattern already ships in the transmission domain (`src/transmission/hooks/useCanvasSetup.ts`: `getBoundingClientRect` + `devicePixelRatio` + `ctx.scale`, draws in CSS px). Per the owner decision (2026-06-25), we **add** a generalized copy at `src/shared/hooks/useSelfMeasuringCanvas.ts`, migrate the ~10 legacy EM sims onto it, delete the dead legacy `src/em/hooks/useCanvasSetup.ts`, and **leave the 7 already-DPR-correct transmission sims and their hook untouched** (minimal blast radius). The e2e paint net is extended to assert DPR is actually applied (a dpr=2 Playwright project) so a silently un-scaled migration fails CI.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + @testing-library/react (unit), Playwright (e2e), Tailwind. Path aliases: `@shared/*`→`src/shared/*`, `@em/*`→`src/em/*`, `@transmission/*`→`src/transmission/*`.

## Global Constraints

- **Owner-only-merge.** Each task is its own commit on a `track-b/14-*` branch; PRs are opened for the owner to merge (push classifier blocks `main`). One sim per PR (small, reviewable, independently revertable).
- **No physics / readout / gate changes.** This is a sizing/coordinate-space refactor only. `solveToroid`, `chartData`, `physics.ts`, every `PredictionGate`, ConceptCheck, and worked example stay byte-identical. The blocking predict-first gate stays blocking on every section that has a sim.
- **The migration draws in CSS pixels.** `prepareFrame()` applies `ctx.scale(dpr, dpr)`; therefore every draw routine uses the **CSS-px** `width`/`height` it returns — never `canvas.width`/`canvas.height` (now the backing-store size = CSS×dpr). All hardcoded px constants (grid 40px, coil radius, `SCALE_M_PER_PX`, `1px=1mm`) stay unchanged because the draw space stays CSS px.
- **Pointer math uses `rect.width`/`rect.height`** (CSS px from `getBoundingClientRect()`) for any client↔canvas conversion — never `canvas.width`/`canvas.height`. This is the #1 regression hazard.
- **Verification gate per task (the GREEN bar used across the program):** `npx tsc -b` → 0 errors · `npm run lint` → 0 · `npm run build` → 0 · full unit suite green · e2e green at **dpr=1 AND dpr=2**.
  - Unit suite: `npx vitest run -- --no-file-parallelism` (the box OOM-crashes under the 4-fork default).
  - e2e: `npm run build` first, then `npx playwright test` (config runs `vite preview`); memory-bound via `NODE_OPTIONS=--max-old-space-size=1536` if needed. `tsc -b` type-checks test files (vitest does not) — guard optional fields with `?? []`.

---

## Migration recipe (the two templates the per-sim tasks reuse)

Every EM sim follows **one** of two fully-worked tasks below — do not invent a third pattern:

- **Template A — no on-canvas interaction** → follow **Task 3 (magnetic-circuits)**. Swap inline sizing for `prepareFrame()`; use the returned CSS-px `w`/`h`. Nothing else changes.
- **Template B — has mouse/drag handlers and/or px→unit readouts** → follow **Task 4 (coulomb)**. Template A's swap **plus** repoint every pointer handler from `canvas.width`/`canvas.height` to `rect.width`/`rect.height`.

The hook contract (Task 1):

```ts
const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
// in the rAF loop:
const frame = prepareFrame();
if (frame) {
  const { ctx, width: w, height: h } = frame; // w,h are CSS px
  // ...draw in CSS px exactly as before...
}
animationRef.current = requestAnimationFrame(render);
```

`canvasRef` composes with the existing `useCanvasTouch(canvasRef)` callback ref unchanged: `useCanvasTouch` owns DOM attachment and keeps `canvasRef.current` synced on every (re)mount; `prepareFrame()` reads `canvasRef.current`. The canvas keeps `ref={canvasTouchRef}` and `className="w-full h-full"` so `getBoundingClientRect()` returns the CSS display size.

---

## Task 1: Canonical self-measuring hook + unit test; delete the dead legacy hook

**Files:**
- Create: `src/shared/hooks/useSelfMeasuringCanvas.ts`
- Create: `src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts`
- Delete: `src/em/hooks/useCanvasSetup.ts` (dead — `grep -rn "@em/hooks/useCanvasSetup" src` returns no importers)

**Interfaces:**
- Produces: `useSelfMeasuringCanvas(options?: { scaled?: boolean }): { canvasRef: React.RefObject<HTMLCanvasElement | null>; prepareFrame: () => CanvasFrame | null }` where `interface CanvasFrame { ctx: CanvasRenderingContext2D; width: number; height: number; dpr: number }`. `width`/`height` are CSS px. `scaled` defaults to `true` (applies `ctx.scale(dpr,dpr)`); `scaled: false` sizes the backing store to CSS×dpr but skips the transform (for sims whose geometry already lives in backing-store px — polarization, Task 10).

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';

function fakeCanvas(scale: () => void, w = 100, h = 50) {
  return {
    width: 0,
    height: 0,
    getContext: () => ({ scale }) as unknown as CanvasRenderingContext2D,
    getBoundingClientRect: () => ({ width: w, height: h }),
  } as unknown as HTMLCanvasElement;
}

describe('useSelfMeasuringCanvas', () => {
  beforeEach(() => vi.stubGlobal('devicePixelRatio', 2));
  afterEach(() => vi.unstubAllGlobals());

  it('returns null when no canvas is attached', () => {
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('returns null when the 2D context is unavailable', () => {
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    result.current.canvasRef.current = {
      getContext: () => null,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    } as unknown as HTMLCanvasElement;
    expect(result.current.prepareFrame()).toBeNull();
  });

  it('scales the backing store by dpr, scales the context, returns CSS size + dpr', () => {
    const scale = vi.fn();
    const canvas = fakeCanvas(scale);
    const { result } = renderHook(() => useSelfMeasuringCanvas());
    result.current.canvasRef.current = canvas;

    const frame = result.current.prepareFrame();
    expect(frame).not.toBeNull();
    expect(frame!.width).toBe(100);     // CSS px
    expect(frame!.height).toBe(50);     // CSS px
    expect(frame!.dpr).toBe(2);
    expect(canvas.width).toBe(200);     // backing store = CSS * dpr
    expect(canvas.height).toBe(100);
    expect(scale).toHaveBeenCalledWith(2, 2);
  });

  it('scaled:false sizes the backing store but does NOT scale the context', () => {
    const scale = vi.fn();
    const canvas = fakeCanvas(scale);
    const { result } = renderHook(() => useSelfMeasuringCanvas({ scaled: false }));
    result.current.canvasRef.current = canvas;

    const frame = result.current.prepareFrame();
    expect(canvas.width).toBe(200);     // still DPR-sized backing store
    expect(canvas.height).toBe(100);
    expect(scale).not.toHaveBeenCalled();
    expect(frame!.dpr).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts`
Expected: FAIL — `Failed to resolve import "@shared/hooks/useSelfMeasuringCanvas"`.

- [ ] **Step 3: Write the hook**

```ts
// src/shared/hooks/useSelfMeasuringCanvas.ts
import { useCallback, useRef } from 'react';

/** Result of preparing a canvas for a frame: the 2D context, CSS-pixel size, and dpr. */
export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** Canvas width in CSS pixels (not backing-store pixels). */
  width: number;
  /** Canvas height in CSS pixels. */
  height: number;
  /** The devicePixelRatio applied to the backing store this frame. */
  dpr: number;
}

export interface SelfMeasuringCanvasOptions {
  /**
   * Apply `ctx.scale(dpr, dpr)` so draw code works in CSS pixels (default true).
   * Pass `false` for sims whose geometry and pointer math already operate in
   * backing-store pixels (e.g. polarization's bitmap-space drag).
   */
  scaled?: boolean;
}

/**
 * Canvas ref + a per-frame setup helper that self-measures via
 * `getBoundingClientRect()` and handles devicePixelRatio scaling.
 *
 * Call `prepareFrame()` at the top of each render: it sizes the backing store to
 * the canvas's CSS size × DPR, (optionally) scales the 2D context so drawing code
 * works in CSS pixels, and returns `{ ctx, width, height, dpr }` — or `null` if the
 * canvas or context is unavailable (caller should early-return but keep the rAF loop
 * scheduled, since EM canvases mount late behind a PredictionGate).
 *
 * This is the canonical Track-B #14 hook. It generalizes the proven
 * `src/transmission/hooks/useCanvasSetup.ts` and replaces the legacy
 * inline `canvas.width = parentElement.clientWidth` (no DPR) pattern.
 */
export function useSelfMeasuringCanvas(options: SelfMeasuringCanvasOptions = {}) {
  const { scaled = true } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const prepareFrame = useCallback((): CanvasFrame | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    if (scaled) ctx.scale(dpr, dpr);

    return { ctx, width: rect.width, height: rect.height, dpr };
  }, [scaled]);

  return { canvasRef, prepareFrame };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Delete the dead legacy hook and confirm nothing breaks**

Run: `grep -rn "@em/hooks/useCanvasSetup" src` → expect **no matches**. Then delete `src/em/hooks/useCanvasSetup.ts`.
Run: `npx tsc -b` → 0 errors (confirms no importer).

- [ ] **Step 6: Commit**

```bash
git add src/shared/hooks/useSelfMeasuringCanvas.ts src/shared/hooks/__tests__/useSelfMeasuringCanvas.test.ts
git rm src/em/hooks/useCanvasSetup.ts
git commit -m "feat(canvas): add canonical useSelfMeasuringCanvas hook; drop dead em useCanvasSetup"
```

---

## Task 2: Extend the e2e paint net to prove DPR is applied (dpr=2 project)

**Files:**
- Modify: `e2e/sim-paint.spec.ts` (add `dpr` capture + a DPR-applied relation assertion gated to a migrated-routes set)
- Modify: `playwright.config.ts` (add a `desktop-hidpi` project with `deviceScaleFactor: 2`)

**Interfaces:**
- Produces: a `DPR_MIGRATED: Set<string>` in `sim-paint.spec.ts` that each later task appends its section id to. While a route is **not** in the set, only the existing floor assertions apply to it (so trunk stays green); once migrated, the dpr=2 project also asserts the backing store grew by `dpr`.

- [ ] **Step 1: Add the dpr=2 project to Playwright config**

In `playwright.config.ts`, add to the `projects` array (after `mobile`):

```ts
    { name: 'desktop-hidpi', use: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 } },
```

- [ ] **Step 2: Capture dpr in the canvas measurement**

In `e2e/sim-paint.spec.ts`, add `dpr` to the `CanvasPaint` interface and to the object `measureCanvases` returns:

```ts
interface CanvasPaint {
  cssW: number; cssH: number;
  bitmapW: number; bitmapH: number;
  type: string;
  distinctColors: number;
  dpr: number;
}
```

Inside `measureCanvases`' `page.evaluate`, capture it once and spread into every result's `base`:

```ts
    const dpr = window.devicePixelRatio || 1;
    // ...in .map: const base = { cssW: ..., cssH: ..., bitmapW: el.width, bitmapH: el.height, dpr };
```

- [ ] **Step 3: Add the migrated-routes set and the DPR-applied assertion**

Near the top of `sim-paint.spec.ts`, add the (initially empty) set:

```ts
// Routes whose sims have been migrated to useSelfMeasuringCanvas (Track-B #14).
// For these, the dpr=2 project additionally asserts the backing store actually
// grew by devicePixelRatio — catching a migration that silently dropped ctx.scale.
// Each #14 sim-migration PR adds its section id here.
const DPR_MIGRATED = new Set<string>([]);
```

Extend `expectHeights` — keep the existing two floor assertions, then append:

```ts
    // DPR-applied relation: a migrated sim at dpr>1 must have a backing store of
    // ~cssH*dpr. An un-migrated sim (canvas.height = parent.clientHeight) shows
    // bitmapH == cssH and FAILS this at dpr=2 — which is why it is gated to
    // DPR_MIGRATED so trunk stays green until each sim lands.
    if (c.dpr > 1 && DPR_MIGRATED.has(sectionId)) {
      const expected = Math.round(c.cssH * c.dpr);
      expect(
        Math.abs(c.bitmapH - expected),
        `${where}: bitmap height ${c.bitmapH}px is not ~cssH*dpr (${expected}px) — ` +
        `migration dropped DPR scaling? (${dims})`,
      ).toBeLessThanOrEqual(c.dpr + 1); // ±rounding tolerance
    }
```

- [ ] **Step 4: Verify the net is green at both dpr (no sims migrated yet)**

Run: `npm run build && npx playwright test e2e/sim-paint.spec.ts`
Expected: PASS on all three projects (`desktop`, `mobile`, `desktop-hidpi`). Because `DPR_MIGRATED` is empty, `desktop-hidpi` only re-checks the floors (which are CSS-height based and unaffected by dpr), so it passes for the still-un-migrated EM sims.

- [ ] **Step 5: Commit**

```bash
git add e2e/sim-paint.spec.ts playwright.config.ts
git commit -m "test(e2e): add dpr=2 project + gated DPR-applied assertion for #14 migration"
```

---

## Task 3: Migrate magnetic-circuits (Template A — no interaction)

**Files:**
- Modify: `src/em/sections/magnetic-circuits/index.tsx` (imports; ref/hook setup `:120`; render loop `:148-160`)
- Test: `e2e/sim-paint.spec.ts` (add `'magnetic-circuits'` to `DPR_MIGRATED`)

**Interfaces:**
- Consumes: `useSelfMeasuringCanvas` from Task 1.

Why this sim leads: it has **no** mouse/drag handlers (pure `solveToroid` readouts, px-independent) and its canvas already has `className="w-full h-full"` in a sized wrapper (`min-h-[400px]`), so it proves the hook end-to-end with zero interaction surface.

- [ ] **Step 1: Add the migrated route to the e2e net first (red-before-green)**

In `e2e/sim-paint.spec.ts`, change `const DPR_MIGRATED = new Set<string>([]);` to:

```ts
const DPR_MIGRATED = new Set<string>(['magnetic-circuits']);
```

- [ ] **Step 2: Run the dpr=2 e2e for this route — verify it FAILS**

Run: `npm run build && npx playwright test e2e/sim-paint.spec.ts -g "magnetic-circuits" --project=desktop-hidpi`
Expected: FAIL — `bitmap height ... is not ~cssH*dpr` (the sim still sets `canvas.height = parent.clientHeight`, no DPR).

- [ ] **Step 3: Swap the import**

In `src/em/sections/magnetic-circuits/index.tsx`, add after the existing `useCanvasTouch` import (line 2):

```tsx
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
```

- [ ] **Step 4: Replace the ref with the hook**

Change line 120 from:

```tsx
  const canvasRef = useRef<HTMLCanvasElement>(null);
```

to:

```tsx
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
```

(`const animationRef = useRef(0);` on the next line stays — `useRef` is still imported.)

- [ ] **Step 5: Replace the inline sizing in the render loop**

Change lines 149-162 from:

```tsx
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (canvas && ctx) {
        if (canvas.parentElement) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
        const w = canvas.width, h = canvas.height;
        const d = derivedRef.current;
        ctx.clearRect(0, 0, w, h);
```

to:

```tsx
    const render = () => {
      const frame = prepareFrame();
      if (frame) {
        const { ctx, width: w, height: h } = frame;
        const d = derivedRef.current;
        ctx.clearRect(0, 0, w, h);
```

The matching `}` that closed `if (canvas && ctx) {` (line 295, just before `animationRef.current = requestAnimationFrame(render);`) now closes `if (frame) {` — unchanged.

- [ ] **Step 6: Add `prepareFrame` to the effect dependency array**

Change the render `useEffect` deps (line 301) from `[current, turns, gapPercent, materialIndex, isDarkMode]` to:

```tsx
  }, [current, turns, gapPercent, materialIndex, isDarkMode, prepareFrame]);
```

- [ ] **Step 7: Run the full gate**

Run: `npx tsc -b && npm run lint && npm run build && npx vitest run -- --no-file-parallelism`
Then: `npx playwright test e2e/sim-paint.spec.ts -g "magnetic-circuits"`
Expected: tsc 0 / lint 0 / build 0 / unit green; e2e green on `desktop`, `mobile`, **and `desktop-hidpi`** (the dpr=2 relation now passes — DPR is applied).

- [ ] **Step 8: Commit**

```bash
git add src/em/sections/magnetic-circuits/index.tsx e2e/sim-paint.spec.ts
git commit -m "feat(magnetic-circuits): self-measuring DPR-correct canvas (#14 template A)"
```

---

## Task 4: Migrate coulomb (Template B — interaction + px→unit readouts)

**Files:**
- Modify: `src/em/sections/coulomb/index.tsx` (imports; ref/hook setup; render loop `:238-251`; `handleMouseDown` `:405-414`; `handleMouseMove` `:416-433`)
- Test: `e2e/sim-paint.spec.ts` (add `'coulomb'` to `DPR_MIGRATED`)

**Interfaces:**
- Consumes: `useSelfMeasuringCanvas` from Task 1.

This is the canonical interaction template. The render loop and **all three** pointer paths read `canvas.width`/`canvas.height` today (equal to CSS px only because no DPR). After migration `canvas.width = rect.width*dpr`, so each must switch to `rect.width`/`rect.height`. The `SCALE_M_PER_PX = 0.1/40` grid stays correct because the 40px grid is drawn in CSS px (ctx is dpr-scaled), so the `1 square = 0.1 m` readouts are unchanged.

- [ ] **Step 1: Add to DPR_MIGRATED and verify the dpr=2 e2e FAILS first**

Add `'coulomb'` to `DPR_MIGRATED` in `e2e/sim-paint.spec.ts`. Run:
`npm run build && npx playwright test e2e/sim-paint.spec.ts -g "coulomb" --project=desktop-hidpi` → Expected: FAIL (DPR not yet applied).

- [ ] **Step 2: Swap import + ref to the hook**

Add after line 2 (`useCanvasTouch` import):

```tsx
import { useSelfMeasuringCanvas } from '@shared/hooks/useSelfMeasuringCanvas';
```

Find the `const canvasRef = useRef<HTMLCanvasElement>(null);` line and replace it with:

```tsx
  const { canvasRef, prepareFrame } = useSelfMeasuringCanvas();
```

- [ ] **Step 3: Replace the inline sizing in the render loop**

Change lines 240-250 from:

```tsx
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;
      if (!canvas || !ctx) {
        // Canvas not mounted yet ...
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
```

to:

```tsx
      const frame = prepareFrame();
      if (!frame) {
        // Canvas not mounted yet (it appears only once the PredictionGate is
        // passed): keep the loop alive so drawing starts the moment it mounts.
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const { ctx, width, height } = frame;
      ctx.clearRect(0, 0, width, height);
```

The rest of the loop already uses the local `width`/`height` (now CSS px) — no further draw changes.

- [ ] **Step 4: Fix `handleMouseDown` — normalized→pixel via `rect`, not `canvas`**

Change lines 409-412 from:

```tsx
    const clicked = charges.find(
      (c) =>
        Math.hypot(e.clientX - rect.left - c.x * canvas.width, e.clientY - rect.top - c.y * canvas.height) < 30
    );
```

to:

```tsx
    const clicked = charges.find(
      (c) =>
        Math.hypot(e.clientX - rect.left - c.x * rect.width, e.clientY - rect.top - c.y * rect.height) < 30
    );
```

- [ ] **Step 5: Fix `handleMouseMove` — hover + drag math in CSS px**

Change lines 420-425 from:

```tsx
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    hoverPos.current = { x: px, y: py };
    if (draggingId === null) return;
    const newX = (e.clientX - rect.left) / canvas.width;
    const newY = (e.clientY - rect.top) / canvas.height;
```

to:

```tsx
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    hoverPos.current = { x: px, y: py };
    if (draggingId === null) return;
    const newX = (e.clientX - rect.left) / rect.width;
    const newY = (e.clientY - rect.top) / rect.height;
```

(`hoverPos` is consumed by the draw loop, which now works in CSS px, so the hover crosshair/tooltip stays aligned. `canvas` is still referenced for the null-guard at the top of each handler — leave that.)

- [ ] **Step 6: Add `prepareFrame` to the render effect deps**

Append `prepareFrame` to the render `useEffect` dependency array (currently ends `..., drawArrow]`).

- [ ] **Step 7: Run the full gate + a manual drag check**

Run: `npx tsc -b && npm run lint && npm run build && npx vitest run -- --no-file-parallelism`
Then: `npx playwright test e2e/sim-paint.spec.ts -g "coulomb"` → green on all three projects.
**Manual:** `npm run preview`, open coulomb, pass the gate, and drag a charge at a HiDPI zoom — the charge must track the cursor 1:1 (this is what the pointer-math fix protects; the e2e net does not drive drags).

- [ ] **Step 8: Commit**

```bash
git add src/em/sections/coulomb/index.tsx e2e/sim-paint.spec.ts
git commit -m "feat(coulomb): self-measuring DPR-correct canvas + rect-based pointer math (#14 template B)"
```

---

## Tasks 5–12: remaining EM sims

Each task = its own branch/PR. For each: **(1)** add the section id to `DPR_MIGRATED` and confirm the dpr=2 e2e fails first; **(2)** apply the named template; **(3)** apply the sim-specific deltas below; **(4)** run the full per-task gate (tsc/lint/build/unit + e2e dpr=1&2); **(5)** commit `feat(<sim>): self-measuring DPR-correct canvas (#14)`. The sizing line refs below are from the 2026-06-25 scope (`docs/audits/2026-06-25-...`); re-confirm against the file before editing.

### Task 5: gauss — Template B
- **File:** `src/em/sections/gauss/index.tsx`. Inline sizing at `:158-159` (inside the rAF loop).
- **Pointer:** one radius drag hit-test (`getCanvasPoint` via `getBoundingClientRect`); switch any `canvas.width`/`canvas.height` normalization to `rect.width`/`rect.height`.
- **Readout guard:** the `rM = distPx * 0.01` and radius readouts must stay CSS-px — unchanged by the CSS-px draw space; spot-check the `|E|` readout before/after.

### Task 6: ampere — Template B (light)
- **File:** `src/em/sections/ampere/index.tsx`. Inline sizing at `:138-139`.
- **Pointer:** single drag marker; its `getCanvasPos` is already ratio-based (dpr-robust) — verify it divides client coords by `rect.width`, not `canvas.width`.
- **Readout guard:** `SCALE_M_PER_PX = 0.01/40` and the 30–250px marker radius stay CSS-px; golden-check the headline `B` readout.

### Task 7: lorentz — Template B
- **File:** `src/em/sections/lorentz/index.tsx`. Inline sizing at `:245-246`.
- **Note:** the Boris integrator is size-independent. The `1px = 1mm` mapping is preserved by drawing in CSS px (ctx is dpr-scaled). Confirm the `r_c == r_mm` readout (pinned by the sim's unit test) is unchanged.

### Task 8: faraday — Template B
- **File:** `src/em/sections/faraday/index.tsx`. Inline sizing at `:147-152`.
- **Pointer (central task):** an **on-canvas draggable frequency bar** with hit-test `y > canvas.height - 50` and `cx = canvas.width/2`. Repoint to `rect.height`/`rect.width` so the drag handle and its hit-zone align in CSS px. Manual: drag the freq bar at dpr=2 and confirm the handle tracks the cursor.

### Task 9: lenz — Template B
- **File:** `src/em/sections/lenz/index.tsx`. Inline sizing at `:238-242`.
- **Note:** physics radius `a = 60` equals the drawn coil radius `60` — both stay CSS px, so the coupling is preserved. Co-migrate the full pointer pipeline (`getCanvasPoint`/`handleMouseDown`/`handleMouseMove`) to `rect`-based. Both the auto-oscillate and rAF paths feed the same draw space.

### Task 10: polarization — Template B, **`scaled: false`** variant
- **File:** `src/em/sections/polarization/index.tsx`. Inline sizing at `:129-133`.
- **Hook call:** `const { canvasRef, prepareFrame } = useSelfMeasuringCanvas({ scaled: false });` — its `getCanvasPos` (`canvas.width / rect.width`) + `lissajousCenter` already operate correctly in **backing-store px**. Keep the draw code reading `canvas.width`/`canvas.height` (NOT `frame.width`); `prepareFrame` just supplies the DPR-sized backing store without a transform. This protects the headline drag-the-E-vector-tip interaction (lowest-risk path per scope). Manual: drag the vector tip at dpr=2.
- **Why not Template B uniform:** mixing `ctx.scale` with `canvas.width`-based geometry would double-apply dpr. Keep this sim entirely in bitmap space.

### Task 11: maxwell (MaxwellCard + RadiatingChargeSim) — Template A, **+ explicit clearRect**
- **Files:** `src/em/sections/maxwell/index.tsx` (the inline `MaxwellCard`, sizing at `:37-38` via `canvas.clientWidth/clientHeight`) and `src/em/sections/maxwell/RadiatingChargeSim.tsx` (sizing at `:59-62` via `parent.clientWidth/clientHeight`).
- **Critical delta:** `MaxwellCard` has **no `ctx.clearRect`** — it relied on the per-frame `canvas.width =` assignment to wipe the bitmap. After migration the backing-store reset still clears, but make the wipe explicit and CSS-px-correct: add `ctx.clearRect(0, 0, frame.width, frame.height)` at the top of each of the 4 card draw paths + the expanded-modal canvas. Ensure each card canvas has `className="w-full h-full"` (add if missing) so `measure:'self'` returns the display box.
- **Scope:** 6 canvas mounts (4 cards + modal + RadiatingChargeSim). Migrate all; RadiatingChargeSim has its physics in `radiationMath` (no readout change). No on-canvas drag in either → Template A.

### Task 12: em-wave — Template B, **LAST, highest risk**
- **File:** `src/em/sections/em-wave/index.tsx`. THREE canvases across TWO rAF loops: main wave (`:692-696`), `phasorSyncTime` + `phasorSyncPhasor` (`:720-727`). Each needs its own `useSelfMeasuringCanvas` instance (one hook per canvas) and the same `prepareFrame` swap in **both** loops.
- **Calibration guards (do NOT change values):** `ATTEN_PX_SCALE` (~1/300, tuned to ~700px), `lambdaPx = 300/(f·n)`, `periodPx = 1000/f` — all stay because the draw space stays CSS px.
- **Pointer:** the phasor drag (`getCanvasPos` at `:915`, threshold 20, amplitude clamp 100) → `rect`-based.
- **Cross-canvas coupling:** the phasor-sync now-dot phase must equal the rotating-phasor phase across the two canvases — apply identical dpr treatment to both loops. **Manual before/after visual diff of the phasor-sync alignment is mandatory** (the e2e net cannot see phase desync). Do this sim only after 5–11 are green.

---

## Task 13: Final consolidation gate

**Files:** none changed — this is the whole-suite green gate that closes #14.

- [ ] **Step 1: Confirm the legacy hook is gone and the new one is the only EM canvas-sizing path**

Run: `grep -rn "parentElement.clientWidth\|parentElement!.clientHeight\|parent.clientWidth" src/em/sections` → expect **no matches** (every inline sizer migrated).
Run: `grep -rn "@em/hooks/useCanvasSetup" src` → no matches; confirm `src/em/hooks/useCanvasSetup.ts` does not exist.

- [ ] **Step 2: Full green bar**

Run: `npx tsc -b && npm run lint && npm run build && npx vitest run -- --no-file-parallelism`
Then: `npm run build && npx playwright test` (all projects: `desktop`, `mobile`, `desktop-hidpi`).
Expected: tsc 0 / lint 0 / build 0 / full unit suite green / e2e green at dpr=1 AND dpr=2 — and `DPR_MIGRATED` now contains all 10 EM sim ids.

- [ ] **Step 3: Confirm the exempt set is untouched**

Run: `git diff --name-only main -- src/transmission` → expect **empty** (the 7 transmission sims + `src/transmission/hooks/useCanvasSetup.ts` were never touched, per the owner decision).

- [ ] **Step 4: Open the final PR / close out**

Confirm each sim shipped as its own merged PR; #14 is complete when all 10 EM routes are in `DPR_MIGRATED` and the full suite is green at both dpr.

---

## Self-review notes

- **Spec coverage:** every legacy EM sim from the 2026-06-25 scope (coulomb, gauss, ampere, lorentz, faraday, lenz, magnetic-circuits, maxwell+RadiatingChargeSim, polarization, em-wave) has a task; the 7 transmission sims are explicitly exempt (Task 13 Step 3 guards them). The hook, its test, the dead-hook deletion, and the e2e DPR net are all covered.
- **Type consistency:** the hook returns `{ canvasRef, prepareFrame }`; `prepareFrame()` returns `CanvasFrame | null` with `{ ctx, width, height, dpr }`. Every sim task destructures `{ ctx, width: w, height: h } = frame` (Template A) or `{ ctx, width, height } = frame` (coulomb) — consistent. `scaled: false` is used only by polarization (Task 10) and is tested in Task 1.
- **Open micro-decisions deferred to #11 (not this plan):** spec §9 (hero, trace color, mobile primary, simHeavy borderlines). The `simHeavy` flag and LabLayout placement are #12/#13, not #14.
