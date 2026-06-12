import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlausibilityCallout } from '@shared/components/common/PlausibilityCallout';

describe('PlausibilityCallout', () => {
  it('renders the default kicker with the canonical inline-callout markup (parity pins)', () => {
    render(<PlausibilityCallout>Check the limits.</PlausibilityCallout>);

    const kicker = screen.getByText('Does this make sense?');
    expect(kicker.tagName).toBe('P');
    // Markup-parity pins: the wrapper and kicker classes must stay byte-identical
    // to the pre-existing inline instances (TransmissionLines / LineImpedance /
    // SwitchedCircuits) so the inline-to-component migration is a pure refactor.
    expect(kicker.className).toBe(
      'text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-1',
    );
    const card = kicker.parentElement as HTMLElement;
    expect(card.className).toBe(
      'bg-engineering-blue-50 dark:bg-engineering-blue-900/10 border-l-4 border-engineering-blue-400 dark:border-engineering-blue-600 rounded-r-lg p-4',
    );

    const body = screen.getByText('Check the limits.');
    // Deliberate divergence from the inline instances: the body is a <div>
    // (not a <p>) so callouts can hold MathWrapper spans and multiple paragraphs.
    expect(body.tagName).toBe('DIV');
    expect(body.className).toBe('text-sm text-slate-700 dark:text-slate-300 leading-relaxed');
  });

  it('renders element children (text plus an <em> element)', () => {
    render(
      <PlausibilityCallout>
        If you had treated L as an <em>open</em> you would get 1.5 A.
      </PlausibilityCallout>,
    );

    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText(/you would get 1\.5 A/)).toBeInTheDocument();
  });

  it('replaces the default kicker when a custom title is given', () => {
    render(<PlausibilityCallout title="Reality check">Body text</PlausibilityCallout>);

    expect(screen.getByText('Reality check')).toBeInTheDocument();
    expect(screen.queryByText('Does this make sense?')).not.toBeInTheDocument();
  });
});
