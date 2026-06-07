import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import { SECTIONS } from '@shared/constants/curriculum';

/**
 * End-to-end integration: render the whole app at the default route ('/') and
 * confirm the unified shell and the course landing wire together — sidebar Part
 * grouping (from curriculum), Course Home link, and the landing hero. This is
 * the check that the three former apps now present as ONE course.
 */
describe('App integration', () => {
  it('renders the shared shell + course landing at /', () => {
    render(<App />);

    // Course landing hero (route '/')
    expect(
      screen.getByRole('heading', { name: /Electromagnetism & Circuit Analysis/i }),
    ).toBeInTheDocument();

    // Sidebar: Course Home + Part grouping straight from the curriculum spine
    expect(screen.getByText('Course Home')).toBeInTheDocument();
    expect(screen.getAllByText(/PART 01/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PART 05/).length).toBeGreaterThan(0);

    // A section from the spine appears (sidebar link + landing card)
    expect(screen.getAllByText('Component Physics').length).toBeGreaterThan(0);
  });

  it('landing section names are deep links to their routes', () => {
    render(<App />);

    // The sidebar already has one NavLink per section; the landing card must add
    // a second link with the same name so that there are ≥ 2 total (one per surface).
    const links = screen.getAllByRole('link', { name: SECTIONS['coulomb'].title });
    expect(links.length).toBeGreaterThanOrEqual(2);
    // At least one of those links points to the correct route
    expect(links.some((l) => l.getAttribute('href') === SECTIONS['coulomb'].route)).toBe(true);
  });
});
