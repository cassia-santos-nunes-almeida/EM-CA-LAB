# Decisions Log — EM-AC-Lab-Module1

Chronological log of key decisions. Newest at top.
Full historical record (24 ADRs) in `context/decisions.md`.

---

### 2026-04-09 — Onboarded to my-claude-skills system
**Decision:** Adopted centralized skill system with context-evaluator v2.0.0 + handover. Migrated from global/ folder approach to self-contained `.claude/skill/` structure.
**Reason:** Enables session lifecycle management, cross-project pattern sync, and Notion handovers. Eliminates dependency on parent directory references.

### 2026-03-20 — Consolidated session management system
**Decision:** Created global CLAUDE.md, PATTERNS.md, SESSION.md in global/ directory. Migrated 15 lessons from COURSE_GUIDELINES.md to P-CODE entries.
**Reason:** Eliminated duplication across repos. Single source for cross-module rules.

### 2026-03-15 — Cross-module audit decisions
**Decision:** Unified emac-theme localStorage key (ADR-022), cross-module URL env vars (ADR-023), derivedRef useEffect fix (ADR-024).
**Reason:** Cross-module consistency and React 19 compliance.

### 2026-03-05 — Pedagogy sprint
**Decision:** Added PredictionGate (ADR-015), 3-tier ConceptCheck hints (ADR-016), RealWorldHook cards (ADR-017), Phasor Sync dual-canvas (ADR-018), Magnetic Circuits capstone (ADR-019), Socratic AI tutor (ADR-014).
**Reason:** Active learning research: predictions, scaffolded hints, and real-world connections improve conceptual understanding.

### 2026-03-04 — Core simulation improvements
**Decision:** Boris integrator for Lorentz (ADR-009), axial dipole flux for Lenz (ADR-010), tabbed ModuleLayout (ADR-011), PWA stale cache fix (ADR-013).
**Reason:** Physics accuracy (Boris conserves energy, dipole flux has physical basis) and UX (tabs reduce overwhelm, PWA fix prevents chunk load errors).

### Initial — Foundation decisions
**Decision:** React 19 + Vite (ADR-001), KaTeX (ADR-002), lucide-react (ADR-003), Zustand (ADR-004), react-router-dom (ADR-005), Tailwind v4 (ADR-006), client-side Gemini (ADR-007), preserved canvas code (ADR-008).
**Reason:** Fast dev, client-side only, no SSR needed. Canvas physics simulations preserved as-is from original app.
