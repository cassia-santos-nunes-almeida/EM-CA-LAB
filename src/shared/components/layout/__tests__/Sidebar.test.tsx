import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, renderHook, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { Sidebar } from '@shared/components/layout/Sidebar';
import { SidebarIconRail } from '@shared/components/layout/SidebarIconRail';
import { useSidebarCollapse } from '@shared/components/layout/useSidebarCollapse';
import { useProgressStore } from '@shared/store/progressStore';

function renderSidebar(initialEntries: string[] = ['/']) {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar />
    </MemoryRouter>,
  );
}

// Reset the persisted store to a clean baseline before each test so the
// collapse preference + progress don't leak across cases.
beforeEach(() => {
  useProgressStore.setState({ sections: {}, sidebarCollapsed: false });
});

// ───────────────────────────────────────────────────────────────────────────
// Existing 3 tests (must keep passing).
// ───────────────────────────────────────────────────────────────────────────

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

// ───────────────────────────────────────────────────────────────────────────
// (a) Active-section highlight + LED.
// ───────────────────────────────────────────────────────────────────────────

describe('Sidebar — active section', () => {
  // Use a NON-sim-heavy section so the full accordion renders (a sim-heavy
  // section like /coulomb auto-collapses to the icon-rail per §5 — covered
  // separately in the icon-rail active-Part test below).
  it('marks the active route section with aria-current and a live LED dot', () => {
    renderSidebar(['/circuit-analysis']);

    // The active NavLink carries aria-current="page".
    const link = screen.getByRole('link', { name: /Circuit Analysis/ });
    expect(link).toHaveAttribute('aria-current', 'page');

    // The live LED dot replaces the bullet only for the active section.
    expect(document.querySelector('[data-testid="section-led-circuit-analysis"]')).not.toBeNull();
    // A non-active section must NOT have an LED dot.
    expect(document.querySelector('[data-testid="section-led-component-physics"]')).toBeNull();
  });

  it('auto-collapses to the icon-rail on a sim-heavy section, marking the active Part', () => {
    // /coulomb is sim-heavy → §5 auto-collapse → icon-rail. The active Part (2)
    // chip carries the live LED and is aria-labelled.
    renderSidebar(['/coulomb']);
    const part2 = screen.getByLabelText(/Part 2:/);
    expect(part2).toBeInTheDocument();
    // The full accordion is NOT rendered (no course-progress heading text).
    expect(screen.queryByText('Course progress')).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// (b) §5 precedence — test the hook directly.
// ───────────────────────────────────────────────────────────────────────────

function hookWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useSidebarCollapse — §5 precedence truth table', () => {
  it('pref=collapsed → collapsed=true, isAutoCollapsed=false (even on a sim-heavy section)', () => {
    useProgressStore.setState({ sidebarCollapsed: true });
    // coulomb is sim-heavy; the manual pref still wins and it is NOT "auto".
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/coulomb']),
    });
    expect(result.current.collapsed).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('pref=expanded, simActive=false → collapsed=false', () => {
    useProgressStore.setState({ sidebarCollapsed: false });
    // component-physics is NOT sim-heavy.
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/component-physics']),
    });
    expect(result.current.collapsed).toBe(false);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('pref=expanded, simActive=true, pinned≠cur → collapsed=true, isAutoCollapsed=true', () => {
    useProgressStore.setState({ sidebarCollapsed: false });
    // coulomb is sim-heavy, nothing pinned → auto-collapse.
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/coulomb']),
    });
    expect(result.current.collapsed).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(true);
    expect(result.current.autoCollapseBadgeVisible).toBe(true);
  });

  it('pref=expanded, simActive=true, pinned===cur → collapsed=false', () => {
    useProgressStore.setState({ sidebarCollapsed: false });
    // coulomb is sim-heavy + auto-collapsed; expanding pins it → collapsed=false.
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/coulomb']),
    });
    expect(result.current.collapsed).toBe(true); // auto

    act(() => result.current.toggleCollapse()); // manual expand pins coulomb

    expect(result.current.collapsed).toBe(false);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('sets the pin when the user manually expands on a sim-heavy section', () => {
    useProgressStore.setState({ sidebarCollapsed: false });
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/coulomb']),
    });
    // Starts auto-collapsed.
    expect(result.current.collapsed).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(true);

    act(() => result.current.toggleCollapse());

    // Pin took hold: still sim-heavy + pref expanded, but no longer collapsed.
    expect(result.current.collapsed).toBe(false);
    // Pref persisted as expanded.
    expect(useProgressStore.getState().sidebarCollapsed).toBe(false);
  });

  it('clears the pin when the active section changes (stale-pin guard)', () => {
    useProgressStore.setState({ sidebarCollapsed: false });

    // A harness that renders the hook output and can navigate between sections.
    function Harness() {
      const { collapsed, isAutoCollapsed, toggleCollapse } = useSidebarCollapse();
      const navigate = useNavigate();
      return (
        <div>
          <span data-testid="collapsed">{String(collapsed)}</span>
          <span data-testid="auto">{String(isAutoCollapsed)}</span>
          <button onClick={toggleCollapse}>toggle</button>
          <button onClick={() => navigate('/gauss')}>go-gauss</button>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={['/coulomb']}>
        <Routes>
          <Route path="*" element={<Harness />} />
        </Routes>
      </MemoryRouter>,
    );

    // coulomb sim-heavy → auto-collapsed.
    expect(screen.getByTestId('collapsed').textContent).toBe('true');

    // Pin coulomb open.
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('collapsed').textContent).toBe('false');

    // Navigate to gauss (also sim-heavy). The pin on coulomb must clear, so the
    // auto-collapse rule re-applies on gauss → collapsed again.
    fireEvent.click(screen.getByText('go-gauss'));
    expect(screen.getByTestId('collapsed').textContent).toBe('true');
    expect(screen.getByTestId('auto').textContent).toBe('true');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Fix 1 regression: icon-rail Expand pins sim-heavy section.
// ───────────────────────────────────────────────────────────────────────────

describe('SidebarIconRail — Expand button pins sim-heavy section', () => {
  it('clicking Expand on a sim-heavy route shows the full accordion (not the rail)', () => {
    // On /coulomb (sim-heavy, pref=false) the sidebar auto-collapses to the rail.
    // Clicking Expand MUST produce the full accordion — not a no-op re-collapse.
    render(
      <MemoryRouter initialEntries={['/coulomb']}>
        <Sidebar />
      </MemoryRouter>,
    );

    // Starts as the icon-rail (no "Course progress" text).
    expect(screen.queryByText('Course progress')).toBeNull();

    // Click the Expand button in the icon-rail.
    const expandBtn = screen.getByRole('button', { name: /Expand sidebar/ });
    act(() => {
      fireEvent.click(expandBtn);
    });

    // Full accordion must now be visible — "Course progress" is in the top band.
    expect(screen.getByText('Course progress')).toBeInTheDocument();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Fix 3 regression: non-active Part stays open after re-render.
// ───────────────────────────────────────────────────────────────────────────

describe('Sidebar — non-active Part stays open after re-render (look-ahead)', () => {
  it('a non-active Part opened by the user remains open after a sidebar re-render', () => {
    // Start on /circuit-analysis (Part 1 active). Open Part 5 for look-ahead.
    const { rerender } = render(
      <MemoryRouter initialEntries={['/circuit-analysis']}>
        <Sidebar />
      </MemoryRouter>,
    );

    // Find a Part-5 <details> (the last one) — it should be closed initially.
    const allDetails = document.querySelectorAll('details');
    // Part 5 is the last Part details element in the accordion nav.
    const part5Details = allDetails[allDetails.length - 1] as HTMLDetailsElement;
    expect(part5Details.open).toBe(false);

    // Simulate the user clicking to open Part 5 (fire toggle natively).
    fireEvent.click(part5Details.querySelector('summary') as Element);
    expect(part5Details.open).toBe(true);

    // Re-render (simulate a state change that causes a Sidebar re-render).
    rerender(
      <MemoryRouter initialEntries={['/circuit-analysis']}>
        <Sidebar />
      </MemoryRouter>,
    );

    // Part 5 must still be open — uncontrolled details are not forcibly reclosed.
    expect(part5Details.open).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// (c) Manual-toggle persistence.
// ───────────────────────────────────────────────────────────────────────────

describe('useSidebarCollapse — persistence', () => {
  it('persists the collapse choice through the store', () => {
    useProgressStore.setState({ sidebarCollapsed: false });
    const setSpy = vi.spyOn(useProgressStore.getState(), 'setSidebarCollapsed');

    // On a non-sim section so collapsed starts false; toggling collapses it.
    const { result } = renderHook(() => useSidebarCollapse(), {
      wrapper: hookWrapper(['/component-physics']),
    });
    expect(result.current.collapsed).toBe(false);

    act(() => result.current.toggleCollapse());

    expect(setSpy).toHaveBeenCalledWith(true);
    expect(useProgressStore.getState().sidebarCollapsed).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// (d) Icon-rail flyout keyboard-reachability.
// ───────────────────────────────────────────────────────────────────────────

describe('SidebarIconRail — keyboard-reachable flyout', () => {
  it('renders five Part chips and opens a Part\'s flyout on focus (no mouse)', () => {
    render(
      <MemoryRouter initialEntries={['/coulomb']}>
        <SidebarIconRail />
      </MemoryRouter>,
    );

    // Five Part chips — each Part is a native <details> (role "group" in jsdom).
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBe(5);

    // The Part-1 chip is a focusable <summary>; flyout starts closed.
    const part1 = screen.getByLabelText(/Part 1:/);
    const part1Details = part1.closest('details') as HTMLDetailsElement;
    expect(part1Details.open).toBe(false);

    // Focusing the chip (keyboard, no mouse) opens its flyout.
    act(() => {
      part1.focus();
      fireEvent.focus(part1);
    });
    expect(part1Details.open).toBe(true);

    // Part 1's section links are reachable inside the opened flyout.
    expect(screen.getByRole('link', { name: /Component Physics/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Interactive Lab/ })).toBeInTheDocument();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  useProgressStore.setState({ sections: {}, sidebarCollapsed: false });
});
