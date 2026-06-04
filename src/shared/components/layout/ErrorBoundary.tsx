import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Reusable error boundary with three display levels:
 *
 *  - "page"    — full-screen centered card (use for route-level boundaries)
 *  - "section" — inline card that replaces the crashed section
 *  - "inline"  — minimal single-line fallback (use inside repeated items)
 *
 * Raw error details are never shown to students — they are only logged to
 * the console.  The retry button resets the boundary in-place so the user
 * does not need to reload the whole page.
 */

type ErrorLevel = 'page' | 'section' | 'inline';

interface Props {
  children: ReactNode;
  /** Controls the size/style of the fallback UI. Default: "page" */
  level?: ErrorLevel;
  /** Friendly heading shown in the fallback. */
  title?: string;
  /** Friendly description shown in the fallback. */
  message?: string;
  /** Called after the boundary resets (e.g. to clear stale state). */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const level = this.props.level ?? 'page';

    if (level === 'inline') {
      return <InlineFallback onRetry={this.handleRetry} />;
    }

    if (level === 'section') {
      return (
        <SectionFallback
          title={this.props.title}
          message={this.props.message}
          onRetry={this.handleRetry}
        />
      );
    }

    // level === 'page'
    return (
      <PageFallback
        title={this.props.title}
        message={this.props.message}
        onRetry={this.handleRetry}
      />
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Fallback UIs                                                      */
/* ------------------------------------------------------------------ */

function PageFallback({
  title = 'Something went wrong',
  message = "This page ran into a problem. Your work on other pages isn't affected.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
          <AlertTriangle className="h-7 w-7 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-engineering-blue-600 text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-engineering-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

function SectionFallback({
  title = 'Unable to load this section',
  message = 'Something unexpected happened. You can retry or continue with the rest of the page.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-red-100 dark:border-red-900/50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{message}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-engineering-blue-600 hover:text-engineering-blue-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>Display error</span>
      <button
        onClick={onRetry}
        className="underline hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium"
      >
        retry
      </button>
    </span>
  );
}
