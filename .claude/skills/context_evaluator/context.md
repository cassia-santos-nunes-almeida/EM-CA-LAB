# Context — EM-AC-Lab-Module1

## What This Is

Interactive web application for Module 1 (Electromagnetic Fundamentals) of the EM&AC Lab course (BL30A0350) at LUT University. Students explore Maxwell's equations, Coulomb's law, Ampere's law, Faraday's law, Lorentz force, EM waves, polarization, and magnetic circuits through 10 interactive canvas-based simulations.

Part of a three-module series: **M1 (EM Fundamentals)** → M2 (Circuit Analysis) → M3 (Transmission Lines & Antennas).

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS v4 (PostCSS) + clsx/tailwind-merge
- **State:** Zustand 5 (persisted stores for theme + progress)
- **Math rendering:** KaTeX via MathWrapper component
- **Charts:** Recharts (available, not yet used)
- **AI Tutor:** Google Gemini API (client-side, "Think it Through" Socratic mode)
- **Icons:** Lucide React
- **Routing:** React Router DOM v7 (lazy-loaded pages)
- **PWA:** vite-plugin-pwa (skipWaiting + lazyRetry)
- **Analytics:** Vercel Analytics
- **Testing:** Vitest + Testing Library (71 tests)
- **Linting:** ESLint with jsx-a11y accessibility plugin
- **Deployment:** Vercel

## Architecture

```
src/
├── components/
│   ├── common/     — Slider, ControlPanel, MathWrapper, ConceptCheck, PredictionGate,
│   │                 ChallengeCard, AiTutor, CollapsibleSection, RealWorldHook, etc.
│   └── layout/     — Layout shell (responsive sidebar + main), Sidebar, ErrorBoundary
├── pages/          — 10 physics pages + OverviewPage (lazy-loaded)
├── constants/      — Physics colors, module definitions, quiz content, cross-module URLs
├── canvas/         — Canvas drawing helpers (arrows, fieldLines, grid)
├── hooks/          — useAnimationFrame, useCanvasSetup, useCanvasTouch, useOnlineStatus
├── store/          — progressStore (Zustand: progress + theme)
├── types/          — Shared TypeScript interfaces
└── utils/          — cn() (clsx + tailwind-merge)
```

## Physics Modules (10 pages)

| Route | Simulation | Key Features |
|---|---|---|
| /maxwell | 4 animated Maxwell cards | Integral + differential forms |
| /gauss | Electric/Magnetic mode toggle | Gauss's law visualization |
| /coulomb | Drag charges | Field lines, force vectors |
| /ampere | Right-hand rule animation | Current + magnetic field |
| /lorentz | Boris integrator | Cyclotron simulation |
| /faraday | Induction animation | Moving loops |
| /lenz | Axial dipole flux model | Magnet + coil |
| /em-wave | 2D, 3D, V-I Phasor, Phasor Sync | EM wave propagation |
| /polarization | Lissajous + 3D | Stokes parameters |
| /magnetic-circuits | Toroid simulation | Reluctance, mutual inductance, bridge to M2 |

## Pedagogical Patterns

Recommended flow per content section:
1. SectionHook (real-world motivating example)
2. Theory (equations, derivations)
3. CollapsibleSection (advanced derivations, collapsed by default)
4. PredictionGate (student predicts before seeing simulation)
5. Simulation (interactive canvas)
6. ConceptCheck (2-3 per section, multiple-choice with 3-tier hints)
7. YourTurnPanel (modified scenario)
8. ModuleNavigation (prev/next links)

## Canvas Simulation Patterns

- requestAnimationFrame in useEffect with cleanup via cancelAnimationFrame
- Read state from refs (not closures) for React 19 compatibility
- Handle device pixel ratio (DPR) for high-DPI displays
- Pointer events (not mouse events) for touch support
- Theme-aware colors via COLORS/COLORS_DARK from constants/physics

## Content Bridges

- Magnetic Circuits page → M2 (transformers, mutual inductance)
- Phasor concepts → M3 (transmission line phasors)
- EM waves → M3 (wave propagation on lines)

## Key Constraints

- Canvas simulations are the core value — changes require careful testing
- Boris integrator for Lorentz (symplectic, energy-conserving)
- Axial dipole flux model for Lenz's law (physics-based, not empirical)
- 3-level ErrorBoundary (page, section, inline)
- lazyRetry() for all dynamic imports (PWA stale cache mitigation)

## Never Suggest

- Rewriting canvas physics simulations without careful review
- Replacing Boris integrator with forward Euler (non-symplectic)
- Removing PredictionGates (pedagogically critical)
- Hardcoding module URLs — must use VITE_MODULE*_URL env vars
- Changing the `emac-theme` localStorage key — shared across M1/M2/M3

## Last Updated

2026-04-09
