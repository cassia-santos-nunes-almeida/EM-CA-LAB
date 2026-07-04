import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { ALL_SECTIONS, getAdjacentSections } from '@shared/constants/curriculum';

function renderAt(path: string, props?: { currentSectionId?: string }) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CourseNavigation {...props} />
    </MemoryRouter>,
  );
}

describe('CourseNavigation', () => {
  it('shows both prev and next for a middle section', () => {
    renderAt('/gauss');
    const { prev, next } = getAdjacentSections('gauss');
    expect(screen.getByText(prev!.title)).toBeInTheDocument();
    expect(screen.getByText(next!.title)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('omits Previous on the first section of the spine', () => {
    renderAt(ALL_SECTIONS[0].route);
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('omits Next on the last section of the spine', () => {
    renderAt(ALL_SECTIONS[ALL_SECTIONS.length - 1].route);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('crosses Part boundaries (last of Part 1 links to first of Part 2)', () => {
    renderAt('/interactive-lab');
    expect(screen.getByText('Vector Toolkit')).toBeInTheDocument();
  });

  it('honours an explicit currentSectionId over the route', () => {
    renderAt('/anything', { currentSectionId: 'gauss' });
    const { next } = getAdjacentSections('gauss');
    expect(screen.getByText(next!.title)).toBeInTheDocument();
  });

  it('renders nothing for an unknown section', () => {
    const { container } = renderAt('/does-not-exist');
    expect(container).toBeEmptyDOMElement();
  });
});
