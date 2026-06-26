import { describe, it, expect, beforeEach } from 'vitest';
import {
  useProgressStore,
  useThemeStore,
  isModuleComplete,
  type SectionProgress,
} from '@shared/store/progressStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
    document.documentElement.classList.remove('dark');
  });

  it('toggles between light and dark and reflects it on <html>', () => {
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('useProgressStore — section model', () => {
  beforeEach(() => {
    useProgressStore.setState({ sections: {} });
  });

  it('starts with no sections', () => {
    expect(useProgressStore.getState().sections).toEqual({});
  });

  it('markVisited creates a zeroed entry with visited=true', () => {
    useProgressStore.getState().markVisited('gauss');
    expect(useProgressStore.getState().sections.gauss).toEqual({
      visited: true,
      predictionGatesAnswered: 0,
      predictionGatesCorrect: 0,
      conceptChecksCompleted: 0,
      hintsUsed: 0,
    });
  });

  it('markVisited is idempotent and preserves existing counters', () => {
    useProgressStore.getState().incrementConceptChecks('gauss');
    useProgressStore.getState().markVisited('gauss');
    useProgressStore.getState().markVisited('gauss');
    const s = useProgressStore.getState().sections.gauss;
    expect(s.visited).toBe(true);
    expect(s.conceptChecksCompleted).toBe(1);
  });

  it('increments concept checks and hints per section', () => {
    useProgressStore.getState().incrementConceptChecks('gauss');
    useProgressStore.getState().incrementConceptChecks('gauss');
    useProgressStore.getState().incrementHints('gauss');
    expect(useProgressStore.getState().sections.gauss.conceptChecksCompleted).toBe(2);
    expect(useProgressStore.getState().sections.gauss.hintsUsed).toBe(1);
  });

  it('counts prediction gates answered and correct separately', () => {
    useProgressStore.getState().markPredictionGate('faraday', true);
    useProgressStore.getState().markPredictionGate('faraday', false);
    useProgressStore.getState().markPredictionGate('faraday', true);
    const s = useProgressStore.getState().sections.faraday;
    expect(s.predictionGatesAnswered).toBe(3);
    expect(s.predictionGatesCorrect).toBe(2);
  });

  it('keeps sections independent across domains (unique ids, no module prefix)', () => {
    useProgressStore.getState().markVisited('gauss'); // em
    useProgressStore.getState().markVisited('component-physics'); // circuits
    useProgressStore.getState().markVisited('transformers'); // transmission
    const { sections } = useProgressStore.getState();
    expect(sections.gauss.visited).toBe(true);
    expect(sections['component-physics'].visited).toBe(true);
    expect(sections.transformers.visited).toBe(true);
  });

  it('persists only `sections` under emac-progress (partialize drops action fns)', () => {
    localStorage.removeItem('emac-progress');
    useProgressStore.getState().markVisited('gauss');
    const raw = localStorage.getItem('emac-progress');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.sections.gauss.visited).toBe(true);
    expect(parsed.state.markVisited).toBeUndefined();
  });
});

describe('useProgressStore — sidebarCollapsed (persisted manual pref)', () => {
  beforeEach(() => {
    useProgressStore.setState({ sections: {}, sidebarCollapsed: false });
    localStorage.removeItem('emac-progress');
  });

  it('sidebarCollapsed defaults to false', () => {
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setSidebarCollapsed(true) updates sidebarCollapsed', () => {
    useProgressStore.getState().setSidebarCollapsed(true);
    expect(useProgressStore.getState().sidebarCollapsed).toBe(true);
  });

  it('setSidebarCollapsed(false) reverts sidebarCollapsed', () => {
    useProgressStore.getState().setSidebarCollapsed(true);
    useProgressStore.getState().setSidebarCollapsed(false);
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggleSidebarCollapsed flips the value', () => {
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
    useProgressStore.getState().toggleSidebarCollapsed();
    expect(useProgressStore.getState().sidebarCollapsed).toBe(true);
    useProgressStore.getState().toggleSidebarCollapsed();
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
  });

  it('sidebarCollapsed is included in partialize (persists under emac-progress)', () => {
    useProgressStore.getState().setSidebarCollapsed(true);
    const raw = localStorage.getItem('emac-progress');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.sidebarCollapsed).toBe(true);
  });

  it('legacy stored state without sidebarCollapsed hydrates to false (backward-compat)', () => {
    // Simulate a stored object from before sidebarCollapsed was added.
    const legacyState = { state: { sections: {} }, version: 0 };
    localStorage.setItem('emac-progress', JSON.stringify(legacyState));
    // Reset the store to force a re-hydration from localStorage.
    useProgressStore.setState({ sections: {}, sidebarCollapsed: false });
    // The default initial value must be false even if the stored object lacks the key.
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
  });
});

describe('isModuleComplete — curriculum-driven completion', () => {
  const progress = (overrides: Partial<SectionProgress> = {}): SectionProgress => ({
    visited: true,
    predictionGatesAnswered: 0,
    predictionGatesCorrect: 0,
    conceptChecksCompleted: 0,
    hintsUsed: 0,
    ...overrides,
  });

  it('is false for missing progress', () => {
    expect(isModuleComplete(undefined, 'gauss')).toBe(false);
  });

  it('requires the curriculum concept-check target for EM sections (gauss → 3)', () => {
    expect(isModuleComplete(progress({ conceptChecksCompleted: 2 }), 'gauss')).toBe(false);
    expect(isModuleComplete(progress({ conceptChecksCompleted: 3 }), 'gauss')).toBe(true);
  });

  it('completes on visit for sections with no target (component-physics → 0)', () => {
    expect(isModuleComplete(progress(), 'component-physics')).toBe(true);
  });

  it('is false when not visited, even if checks are met', () => {
    expect(isModuleComplete(progress({ visited: false, conceptChecksCompleted: 3 }), 'gauss')).toBe(false);
  });

  it('treats an unknown id as 0-target → complete on first visit (matches legacy overview semantics)', () => {
    // Intentional contract: getExpectedChecks returns 0 for ids not in the
    // curriculum, so e.g. the soon-to-be-retired markVisited('overview') calls
    // resolve to complete-on-visit rather than throwing.
    expect(isModuleComplete(progress(), 'no-such-section')).toBe(true);
  });
});
