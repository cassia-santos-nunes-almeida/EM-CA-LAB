import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '@shared/components/layout/ErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>Working fine</div>;
}

describe('ErrorBoundary', () => {
  // React logs caught errors to console.error — silence it for clean output.
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Working fine')).toBeInTheDocument();
  });

  it('shows the page-level fallback (default) without leaking the raw error', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    // Raw error details must never be shown to students.
    expect(screen.queryByText('Test explosion')).not.toBeInTheDocument();
  });

  it('honours a custom title and message', () => {
    render(
      <ErrorBoundary title="Custom heading" message="Custom body">
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom heading')).toBeInTheDocument();
    expect(screen.getByText('Custom body')).toBeInTheDocument();
  });

  it('renders the section-level fallback with a Retry action', () => {
    render(
      <ErrorBoundary level="section">
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders the minimal inline fallback', () => {
    render(
      <ErrorBoundary level="inline">
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Display error')).toBeInTheDocument();
  });

  it('calls onReset and recovers when retry is clicked', () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop throwing, then click retry — the boundary should reset in-place.
    rerender(
      <ErrorBoundary onReset={onReset}>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Working fine')).toBeInTheDocument();
  });
});
