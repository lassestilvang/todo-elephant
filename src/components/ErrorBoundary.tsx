"use client";

import React from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional friendly section name shown in the fallback (e.g. "Kanban Board"). */
  label?: string;
  /** Optional callback when the user clicks "Back to Dashboard". */
  onGoHome?: () => void;
  /**
   * Optional custom fallback renderer. Defaults to the branded inline panel.
   * Receives `error`, `reset`, and `goHome` helpers.
   */
  renderFallback?: (helpers: {
    error: Error;
    reset: () => void;
    goHome: () => void;
  }) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-phase errors thrown by children and shows a recoverable inline
 * panel instead of letting the error propagate up and blank the whole React tree.
 *
 * Usage:
 *   <ErrorBoundary label="Kanban Board" onGoHome={() => transitionView("dashboard")}>
 *     <KanbanView ... />
 *   </ErrorBoundary>
 *
 * Notes:
 *  - Only catches errors during render / lifecycle / constructors of descendants.
 *    Async errors (fetch, setTimeout) and event-handler throws are NOT caught here.
 *  - We DO persist the original error in state so the user can read/report it.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Best-effort logging; falls back gracefully in SSR.
    if (typeof console !== "undefined") {
      console.error(`[ErrorBoundary:${this.props.label ?? "view"}]`, error, info.componentStack);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  goHome = (): void => {
    this.props.onGoHome?.();
  };

  render(): React.ReactNode {
    const { children, label, renderFallback } = this.props;
    const { hasError, error } = this.state;

    if (!hasError || !error) return children;

    const helpers = { error, reset: this.reset, goHome: this.goHome };
    if (renderFallback) return renderFallback(helpers);

    const sectionLabel = label ?? "this view";

    return (
      <div
        role="alert"
        className="flex-1 flex items-center justify-center p-8 animate-fade-in"
        data-error-boundary={sectionLabel}
      >
        <div className="max-w-md w-full bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl glass-panel">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/15 text-red-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">
                {sectionLabel} crashed
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                The app caught an unexpected error and stopped rendering {sectionLabel} to
                protect the rest of your workspace. Your data is safe — you can retry the
                view or switch back to the dashboard.
              </p>
              <details className="mt-3 text-[11px] text-muted">
                <summary className="cursor-pointer font-semibold hover:text-foreground transition-colors">
                  Show error details
                </summary>
                <pre className="mt-2 p-2 bg-background/60 border border-border/40 rounded-lg overflow-x-auto whitespace-pre-wrap break-words text-[10px] font-mono">
                  {error.message}
                </pre>
              </details>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={this.reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-md hover-lift transition-all"
                >
                  <RotateCcw size={12} />
                  <span>Retry</span>
                </button>
                {this.props.onGoHome && (
                  <button
                    type="button"
                    onClick={this.goHome}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/15 text-foreground text-xs font-bold hover:bg-muted/30 transition-all border border-border/60"
                  >
                    <ArrowLeft size={12} />
                    <span>Back to Dashboard</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
