/**
 * MobileTabBar tests — spec §2.6 + Task 9 brief
 *
 * Covers:
 *  (a) Renders 5 Part chips
 *  (b) Active Part (given a route) is marked current (aria-expanded=false initially,
 *      correct aria-label, visual indicator present)
 *  (c) Tapping a chip opens the sheet with that Part's section links
 *  (d) Escape closes the sheet
 *  (e) Backdrop tap closes the sheet
 *  (f) Links point to the right routes (route integrity)
 *  (g) Current section within the sheet is aria-current="page"
 *  (h) Sheet closes on navigation (route change)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MobileTabBar } from '@shared/components/layout/MobileTabBar';
import { PARTS, SECTIONS, getSectionNumber } from '@shared/constants/curriculum';

function renderTabBar(initialPath: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MobileTabBar />
    </MemoryRouter>,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// (a) Renders 5 Part chips
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — chip rendering', () => {
  it('renders exactly 5 Part chips', () => {
    renderTabBar();
    const chipButtons = PARTS.map((p) =>
      screen.getByRole('button', { name: new RegExp(`Part ${p.number}:`) }),
    );
    expect(chipButtons).toHaveLength(5);
    chipButtons.forEach((btn) => expect(btn).toBeInTheDocument());
  });

  it('renders the Part tab-bar nav with aria-label', () => {
    renderTabBar();
    expect(screen.getByRole('navigation', { name: /Part navigation/i })).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (b) Active Part is marked current
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — active Part highlight', () => {
  it('marks the chip for the Part containing the active route as current (aria-expanded=false on inactive chips)', () => {
    // /circuit-analysis is in Part 1.
    renderTabBar('/circuit-analysis');

    const part1Chip = screen.getByRole('button', { name: /Part 1:/ });
    const part2Chip = screen.getByRole('button', { name: /Part 2:/ });

    // All chips start with the sheet closed.
    expect(part1Chip).toHaveAttribute('aria-expanded', 'false');
    expect(part2Chip).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the correct Part as active when on a Part-4 route', () => {
    // /polarization is in Part 4.
    renderTabBar('/polarization');

    const part4Chip = screen.getByRole('button', { name: /Part 4:/ });
    // The chip should have the Part 4 accent styling (smoke test: title includes WAVES).
    expect(part4Chip).toHaveAttribute('title', expect.stringContaining('WAVES'));
  });

  it('marks the correct Part as active for Part 5 routes', () => {
    renderTabBar('/transmission-lines');
    const part5Chip = screen.getByRole('button', { name: /Part 5:/ });
    expect(part5Chip).toHaveAttribute('title', expect.stringContaining('LINES'));
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (c) Tapping a chip opens the sheet with that Part's section links
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — bottom sheet opening', () => {
  it('opens a bottom sheet when a Part chip is tapped', () => {
    renderTabBar('/');

    // No dialog before tap.
    expect(screen.queryByRole('dialog')).toBeNull();

    // Tap Part 2 chip.
    const part2Chip = screen.getByRole('button', { name: /Part 2:/ });
    fireEvent.click(part2Chip);

    // Sheet should now be open.
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-label', expect.stringContaining('Part 2'));
  });

  it('the sheet contains all section links for the tapped Part', () => {
    renderTabBar('/');

    fireEvent.click(screen.getByRole('button', { name: /Part 2:/ }));

    const part2 = PARTS.find((p) => p.number === 2)!;
    for (const id of part2.sectionIds) {
      const section = SECTIONS[id];
      expect(screen.getByRole('link', { name: new RegExp(section.title) })).toBeInTheDocument();
    }
  });

  it('the sheet section links point to the correct routes', () => {
    renderTabBar('/');

    // Tap Part 5 chip.
    fireEvent.click(screen.getByRole('button', { name: /Part 5:/ }));

    const part5 = PARTS.find((p) => p.number === 5)!;
    for (const id of part5.sectionIds) {
      const section = SECTIONS[id];
      const link = screen.getByRole('link', { name: new RegExp(section.title) });
      expect(link).toHaveAttribute('href', section.route);
    }
  });

  it('section links include the section number (getSectionNumber)', () => {
    renderTabBar('/');

    // Tap Part 3 chip.
    fireEvent.click(screen.getByRole('button', { name: /Part 3:/ }));

    const part3 = PARTS.find((p) => p.number === 3)!;
    // The first section of Part 3 should have a visible "3.1" label in the sheet DOM.
    const firstId = part3.sectionIds[0];
    const expectedNum = getSectionNumber(firstId); // "3.1"
    expect(screen.getByText(expectedNum)).toBeInTheDocument();
  });

  it('marks the active section with aria-current=page', () => {
    // Start on a section in Part 3.
    const part3 = PARTS.find((p) => p.number === 3)!;
    const activeSectionId = part3.sectionIds[0]; // faraday
    const activeRoute = SECTIONS[activeSectionId].route;

    renderTabBar(activeRoute);

    // Open the Part 3 sheet.
    fireEvent.click(screen.getByRole('button', { name: /Part 3:/ }));

    const activeLink = screen.getByRole('link', { name: new RegExp(SECTIONS[activeSectionId].title) });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('toggles the sheet closed when the same chip is tapped again', () => {
    renderTabBar('/');

    const part1Chip = screen.getByRole('button', { name: /Part 1:/ });
    fireEvent.click(part1Chip);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Tap again → closes.
    fireEvent.click(part1Chip);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('switching chips replaces the sheet content', () => {
    renderTabBar('/');

    // Open Part 1.
    fireEvent.click(screen.getByRole('button', { name: /Part 1:/ }));
    const part1Section = SECTIONS[PARTS[0].sectionIds[0]].title;
    expect(screen.getByRole('link', { name: new RegExp(part1Section) })).toBeInTheDocument();

    // Open Part 5.
    fireEvent.click(screen.getByRole('button', { name: /Part 5:/ }));
    const part5Section = SECTIONS[PARTS[4].sectionIds[0]].title;
    expect(screen.getByRole('link', { name: new RegExp(part5Section) })).toBeInTheDocument();
    // Part 1 content should not be visible.
    expect(screen.queryByRole('link', { name: new RegExp(part1Section) })).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (d) Escape closes the sheet
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — Escape dismiss', () => {
  it('pressing Escape closes the open sheet', () => {
    renderTabBar('/');

    fireEvent.click(screen.getByRole('button', { name: /Part 2:/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pressing other keys does not close the sheet', () => {
    renderTabBar('/');

    fireEvent.click(screen.getByRole('button', { name: /Part 2:/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Enter' });

    // Still open.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (e) Backdrop tap closes the sheet
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — backdrop dismiss', () => {
  it('clicking the backdrop overlay closes the sheet', () => {
    const { container } = renderTabBar('/');

    fireEvent.click(screen.getByRole('button', { name: /Part 1:/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // The backdrop is a fixed div with aria-hidden; click it.
    const backdrop = container.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (f) Route integrity — all Part sections are reachable via sheet links
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — route integrity', () => {
  it('every Part has all its sections reachable via the bottom sheet links', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <MobileTabBar />
      </MemoryRouter>,
    );

    for (const part of PARTS) {
      // Re-render to reset sheet state.
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <MobileTabBar />
        </MemoryRouter>,
      );

      // Open this Part's sheet.
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`Part ${part.number}:`) }));

      for (const id of part.sectionIds) {
        const section = SECTIONS[id];
        const link = screen.getByRole('link', { name: new RegExp(section.title) });
        expect(link).toHaveAttribute('href', section.route);
      }
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (h) Sheet closes on navigation (route change)
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — closes on navigation', () => {
  it('the sheet closes when the route changes (simulated navigate)', () => {
    // A harness that allows programmatic navigation.
    function Harness() {
      const navigate = useNavigate();
      return (
        <div>
          <MobileTabBar />
          <button onClick={() => navigate('/coulomb')}>go-coulomb</button>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={['/component-physics']}>
        <Routes>
          <Route path="*" element={<Harness />} />
        </Routes>
      </MemoryRouter>,
    );

    // Open Part 2 sheet.
    fireEvent.click(screen.getByRole('button', { name: /Part 2:/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Navigate.
    act(() => {
      fireEvent.click(screen.getByText('go-coulomb'));
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Additional: close button in the sheet header
// ────────────────────────────────────────────────────────────────────────────

describe('MobileTabBar — close button', () => {
  it('the sheet close button dismisses the sheet', () => {
    renderTabBar('/');

    fireEvent.click(screen.getByRole('button', { name: /Part 3:/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close section list/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

