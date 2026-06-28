/**
 * Scroll-spy infrastructure tests
 *
 * Covers:
 *  1. SectionAnchor registers {id,label} on mount, unregisters on unmount,
 *     and multiple anchors stay in document order.
 *  2. Given a sequence of IntersectionObserver entries the active id reflects
 *     exactly ONE entry (the topmost intersecting), and updates as entries
 *     change.
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
// 2. activeId reflects the topmost intersecting anchor
// ---------------------------------------------------------------------------

describe('ScrollSpyProvider / activeId', () => {
  it('emits exactly one activeId — the topmost intersecting anchor', () => {
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

    // Initially no intersecting entry → null
    expect(screen.getByTestId('active').textContent).toBe('none');

    // Fire: alpha intersecting at top=50
    fireEntries([
      { id: 'alpha', isIntersecting: true, top: 50 },
      { id: 'beta', isIntersecting: false },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('alpha');

    // Scroll down: beta is now intersecting higher up than alpha
    fireEntries([
      { id: 'alpha', isIntersecting: false },
      { id: 'beta', isIntersecting: true, top: 30 },
    ]);
    // beta is now the only intersecting → activeId = 'beta'
    expect(screen.getByTestId('active').textContent).toBe('beta');

    unmount();
  });

  it('picks the topmost when two anchors intersect simultaneously', () => {
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

    // Both intersecting simultaneously — top-sec has smaller top → wins
    fireEntries([
      { id: 'top-sec', isIntersecting: true, top: 10 },
      { id: 'bot-sec', isIntersecting: true, top: 200 },
    ]);
    expect(screen.getByTestId('active').textContent).toBe('top-sec');

    unmount();
  });

  it('keeps activeId stable when a no-intersecting batch arrives', () => {
    const Spy = () => {
      const { activeId } = useScrollSpy();
      return <div data-testid="active">{activeId ?? 'none'}</div>;
    };

    const { unmount } = render(
      <TestWrapper>
        <SectionAnchor id="stable-sec" label="Stable">
          <h2>Stable</h2>
        </SectionAnchor>
        <Spy />
      </TestWrapper>,
    );

    // Establish an active id
    fireEntries([{ id: 'stable-sec', isIntersecting: true, top: 20 }]);
    expect(screen.getByTestId('active').textContent).toBe('stable-sec');

    // Empty-intersecting batch (threshold gap) — should NOT reset
    fireEntries([{ id: 'stable-sec', isIntersecting: false }]);
    expect(screen.getByTestId('active').textContent).toBe('stable-sec');

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
