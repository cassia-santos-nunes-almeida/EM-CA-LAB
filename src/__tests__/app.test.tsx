import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

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
    expect(screen.getByText(/Part 1 ·/)).toBeInTheDocument();
    expect(screen.getByText(/Part 5 ·/)).toBeInTheDocument();

    // A section from the spine appears (sidebar link + landing card)
    expect(screen.getAllByText('Component Physics').length).toBeGreaterThan(0);
  });
});
