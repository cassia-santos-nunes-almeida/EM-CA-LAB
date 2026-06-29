/**
 * Scroll-spy infrastructure tests
 *
 * Covers:
 *  1. SectionAnchor registers {id,label} on mount, unregisters on unmount,
 *     and multiple anchors stay in document order.
 *  2. The active id = the LAST anchor in document order whose top has scrolled
 *     above the activation line (root top + 15%), recomputed from geometry on
 *     every observer callback — robust to a pinned sticky anchor.
 *  3. useScrollSpy() used outside a provider returns inert defaults without
 *     crashing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SectionAnchor } from '../SectionAnchor';
import { ScrollSpyProvider } from '../ScrollSpyProvider';
import { useScrollSpy } from '@shared/hooks/useScrollSpy';

// ---------------------------------------------------------------------------
// IntersectionObserver stub
// ---------------------------------------------------------------------------

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

let ioCallback: IOCallback | null = null;
let ioInstances: MockIO[] = [];

class MockIO {
  observed: Element[] = [];
  private cb: IOCallback;

  constructor(cb: IOCallback) {
    this.cb = cb;
    ioCallback = cb;
    ioInstances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter(e => e !== el);
  }

  disconnect() {
    this.observed = [];
    ioInstances = ioInstances.filter(i => i !== this);
    if (ioCallback === this.cb) ioCallback = null;
  }
}

/**
 * Fire the current observer callback with synthetic entries.
 * Each `{ id, isIntersecting, top }` maps to a real DOM element.
 */
function fireEntries(
  entries: { id: string; isIntersecting: boolean; top?: number }[],
) {
  if (!ioCallback) throw new Error('No IntersectionObserver callback registered');
  const synth = entries.map(({ id, isIntersecting, top = 0 }) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`No element with id="${id}" in document`);
    // Stub getBoundingClientRect on the element for topmost-selection logic
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top,
      bottom: top + 100,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect);
    return {
      target: el,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: el.getBoundingClientRect(),
      intersectionRect: el.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;
  });
  act(() => {
    ioCallback!(synth);
  });
}

beforeEach(() => {
  ioCallback = null;
  ioInstances = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: a provider wrapper with a real (jsdom) root element
// ---------------------------------------------------------------------------

function TestWrapper({ children }: { children: ReactNode }) {
  // We create a div as the scroll container and pass it via ref.
  // ScrollSpyProvider accepts RefObject<HTMLElement | null>.
  const rootEl = document.createElement('div');
  document.body.appendChild(rootEl);
  // Deterministic root geometry so the activation line is computable:
  // top=0, height=1000 → activationLine = 0 + 0.15 * 1000 = 150.
  vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue({
    top: 0, bottom: 1000, left: 0, right: 1000, width: 1000, height: 1000, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  // Use a stable ref-like object:
  const rootRef = { current: rootEl };
  return (
    <ScrollSpyProvider rootRef={rootRef as React.RefObject<HTMLElement | null>}>
      {children}
    </ScrollSpyProvider>
  );
}

// ---------------------------------------------------------------------------
// 1. SectionAnchor registration + document order
// ---------------------------------------------------------------------------

describe('SectionAnchor', () => {
  it('registers {id,label} on mount and unregisters on unmount', () => {
    const Spy = () => {
      const { anchors } = useScrollSpy();
      return (
        <div data-testid="anchors">
          {anchors.map(a => a.id).join(',')}
        </div>
      );
    };

    const { unmount, rerender } = render(
      <TestWrapper>
        <SectionAnchor id="sec-a" label="Section A">
          <h2>Section A</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    expect(screen.getByTestId('anchors').textContent).toBe('sec-a');

    // Unmount the anchor — it should unregister
    rerender(
      <TestWrapper>
        <Spy />
      </TestWrapper>,
    );

    expect(screen.getByTestId('anchors').textContent).toBe('');
    unmount();
  });

  it('applies an optional className to the rendered anchor div (scroll-margin migration)', () => {
    const { container, unmount } = render(
      <TestWrapper>
        <SectionAnchor id="with-margin" label="With margin" className="scroll-mt-4">
          <h2>Body</h2>
        </SectionAnchor>
      </TestWrapper>,
    );

    const anchorEl = container.querySelector('#with-margin');
    expect(anchorEl).not.toBeNull();
    expect(anchorEl).toHaveClass('scroll-mt-4');
    unmount();
  });

  it('keeps multiple anchors in document order', () => {
    const Spy = () => {
      const { anchors } = useScrollSpy();
      return (
        <div data-testid="anchors">
          {anchors.map(a => a.id).join(',')}
        </div>
      );
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="first" label="First">
          <h2>First</h2>
        </SectionAnchor>
        <SectionAnchor id="second" label="Second">
          <h2>Second</h2>
        </SectionAnchor>
        <SectionAnchor id="third" label="Third">
          <h2>Third</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    // All three anchors registered; order must match DOM order
    const text = screen.getByTestId('anchors').textContent ?? '';
    const ids = text.split(',');
    expect(ids).toEqual(['first', 'second', 'third']);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// 2. activeId = the last anchor (document order) scrolled above the activation
//    line (root top + 15% = 150 here). Robust to a pinned sticky anchor.
//    isIntersecting on the synthetic entries is now irrelevant — the provider
//    recomputes active from each anchor's geometry on every callback.
// ---------------------------------------------------------------------------

describe('ScrollSpyProvider / activeId', () => {
  it('activates the last anchor scrolled above the line and updates as you scroll', () => {
    const Spy = () => {
      const { activeId } = useScrollSpy();
      return <div data-testid="active">{activeId ?? 'none'}</div>;
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="alpha" label="Alpha">
          <h2>Alpha</h2>
        </SectionAnchor>
        <SectionAnchor id="beta" label="Beta">
          <h2>Beta</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    // Initially no anchor above the line → null
    expect(screen.getByTestId('active').textContent).toBe('none');

    // alpha scrolled above the line (50 ≤ 150), beta still below (300) → alpha
    fireEntries([
      { id: 'alpha', isIntersecting: true, top: 50 },
      { id: 'beta', isIntersecting: false, top: 300 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('alpha');

    // Scroll down: both above the line → the LATER one in doc order (beta) wins
    fireEntries([
      { id: 'alpha', isIntersecting: false, top: -50 },
      { id: 'beta', isIntersecting: true, top: 100 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('beta');

    unmount();
  });

  it('when two anchors are above the line, the later one in doc order wins', () => {
    const Spy = () => {
      const { activeId } = useScrollSpy();
      return <div data-testid="active">{activeId ?? 'none'}</div>;
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="top-sec" label="Top">
          <h2>Top</h2>
        </SectionAnchor>
        <SectionAnchor id="bot-sec" label="Bottom">
          <h2>Bottom</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    // Both above the line (10 and 120 ≤ 150) → doc-later bot-sec (scrolled into) wins
    fireEntries([
      { id: 'top-sec', isIntersecting: true, top: 10 },
      { id: 'bot-sec', isIntersecting: true, top: 120 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('bot-sec');

    unmount();
  });

  it('recomputes from geometry — clears active when the only anchor scrolls below the line', () => {
    const Spy = () => {
      const { activeId } = useScrollSpy();
      return <div data-testid="active">{activeId ?? 'none'}</div>;
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="solo-sec" label="Solo">
          <h2>Solo</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    fireEntries([{ id: 'solo-sec', isIntersecting: true, top: 20 }]);
    expect(screen.getByTestId('active').textContent).toBe('solo-sec');

    // Scrolled back so the anchor is below the line again → active clears (no stale keep)
    fireEntries([{ id: 'solo-sec', isIntersecting: false, top: 300 }]);
    expect(screen.getByTestId('active').textContent).toBe('none');

    unmount();
  });

  it('resets to a pinned doc-first anchor on scroll-up (sticky-bench fix)', () => {
    const Spy = () => {
      const { activeId } = useScrollSpy();
      return <div data-testid="active">{activeId ?? 'none'}</div>;
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="sim" label="Sim">
          <h2>Sim</h2>
        </SectionAnchor>
        <SectionAnchor id="theory" label="Theory">
          <h2>Theory</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    // Scrolled down: sim pinned at top=24 (always above the line) and theory above it too
    fireEntries([
      { id: 'sim', isIntersecting: true, top: 24 },
      { id: 'theory', isIntersecting: true, top: 100 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('theory');

    // Scrolled back to top: sim still pinned at 24, theory now below the line (300).
    // Active RESETS to the pinned sim — the old batch-topmost left it stale on theory.
    fireEntries([
      { id: 'sim', isIntersecting: true, top: 24 },
      { id: 'theory', isIntersecting: false, top: 300 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('sim');

    unmount();
  });
});

// ---------------------------------------------------------------------------
// 3. Outside-provider graceful degradation
// ---------------------------------------------------------------------------

describe('useScrollSpy outside provider', () => {
  it('returns inert defaults without throwing', () => {
    const { result } = renderHook(() => useScrollSpy());
    expect(result.current.anchors).toEqual([]);
    expect(result.current.activeId).toBeNull();
    expect(typeof result.current.scrollToAnchor).toBe('function');
    // Calling scrollToAnchor must not throw
    expect(() => result.current.scrollToAnchor('any-id')).not.toThrow();
  });
});
