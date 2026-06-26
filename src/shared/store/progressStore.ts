import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getExpectedChecks } from '@shared/constants/curriculum';

/* ── Theme store ─────────────────────────────────────────────────────────
 * Persisted under `emac-theme`. The three source apps already shared this key;
 * the consolidated app keeps it and DROPS M1's one-time `em-lab-progress`
 * legacy migration (clean import — no localStorage migration in Phase 0).
 */

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light' as Theme,
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(next);
          return { theme: next };
        }),
    }),
    {
      name: 'emac-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

/* ── Progress store (section-based) ──────────────────────────────────────
 * Section ids are globally unique across all domains (one course landing
 * replaces the three module overviews), so progress is keyed by the raw
 * `sectionId` with no module prefix. Single persist key `emac-progress`.
 * `sidebarOpen` is intentionally NOT here — it's local component state.
 */

/** Progress tracking for a single section. */
export interface SectionProgress {
  visited: boolean;
  predictionGatesAnswered: number;
  predictionGatesCorrect: number;
  conceptChecksCompleted: number;
  hintsUsed: number;
}

function defaultSectionProgress(): SectionProgress {
  return {
    visited: false,
    predictionGatesAnswered: 0,
    predictionGatesCorrect: 0,
    conceptChecksCompleted: 0,
    hintsUsed: 0,
  };
}

/**
 * A section is "complete" once it has been visited and its concept-check target
 * (from the curriculum config) has been met. Sections with no target (0)
 * complete on first visit. Drives the sidebar completion badge.
 */
export function isModuleComplete(progress: SectionProgress | undefined, id: string): boolean {
  if (!progress) return false;
  return progress.visited && progress.conceptChecksCompleted >= getExpectedChecks(id);
}

interface ProgressState {
  sections: Record<string, SectionProgress>;
  /** Persisted manual collapse preference (true = user chose to collapse). */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  markVisited: (sectionId: string) => void;
  markPredictionGate: (sectionId: string, correct: boolean) => void;
  incrementConceptChecks: (sectionId: string) => void;
  incrementHints: (sectionId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      sections: {},
      sidebarCollapsed: false,

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      markVisited: (sectionId) =>
        set((s) => ({
          sections: {
            ...s.sections,
            [sectionId]: { ...(s.sections[sectionId] ?? defaultSectionProgress()), visited: true },
          },
        })),

      markPredictionGate: (sectionId, correct) =>
        set((s) => {
          const prev = s.sections[sectionId] ?? defaultSectionProgress();
          return {
            sections: {
              ...s.sections,
              [sectionId]: {
                ...prev,
                predictionGatesAnswered: prev.predictionGatesAnswered + 1,
                predictionGatesCorrect: prev.predictionGatesCorrect + (correct ? 1 : 0),
              },
            },
          };
        }),

      incrementConceptChecks: (sectionId) =>
        set((s) => {
          const prev = s.sections[sectionId] ?? defaultSectionProgress();
          return {
            sections: {
              ...s.sections,
              [sectionId]: { ...prev, conceptChecksCompleted: prev.conceptChecksCompleted + 1 },
            },
          };
        }),

      incrementHints: (sectionId) =>
        set((s) => {
          const prev = s.sections[sectionId] ?? defaultSectionProgress();
          return {
            sections: {
              ...s.sections,
              [sectionId]: { ...prev, hintsUsed: prev.hintsUsed + 1 },
            },
          };
        }),
    }),
    {
      name: 'emac-progress',
      partialize: (state) => ({ sections: state.sections, sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
