"use client";

import React from "react";

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

function DefaultFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] items-center justify-center bg-surface p-8"
    >
      <div className="w-full max-w-[36rem] border border-outline-variant bg-surface-container-lowest p-12">
        {/* Technical header line */}
        <div className="technical-line mb-8" />

        {/* Archive label */}
        <p className="font-label-caps text-label-caps tracking-label-caps mb-2 text-on-surface-variant">
          Archive Error
        </p>

        {/* Main title — serif italic for archival feel */}
        <h1 className="font-headline-sm italic text-primary">
          System Disruption
        </h1>

        <p className="font-body-md mt-6 text-on-surface-variant">
          An unexpected condition has interrupted the archive retrieval process.
          The system state has been preserved for diagnostic review.
        </p>

        {/* Error details — mono-style for technical data */}
        {error && (
          <div className="mt-8 border border-outline-variant bg-surface-container p-4">
            <p className="font-label-caps text-label-caps mb-2 text-on-surface-variant">
              Diagnostic Code
            </p>
            <p className="font-data-mono text-data-mono break-all text-error">
              {error.message || "Unknown error condition"}
            </p>
          </div>
        )}

        <div className="mt-10 flex gap-4">
          <button
            onClick={onReset}
            className="font-label-caps text-label-caps tracking-label-caps border border-primary px-8 py-4 uppercase text-primary transition-colors duration-300 hover:bg-primary hover:text-on-primary"
          >
            Restore Session
          </button>
          <button
            onClick={() => window.location.reload()}
            className="font-label-caps text-label-caps tracking-label-caps border border-outline-variant px-8 py-4 uppercase text-on-surface-variant transition-colors duration-300 hover:border-primary hover:text-primary"
          >
            Full Reload
          </button>
        </div>

        <div className="mt-12 technical-line" />
      </div>
    </div>
  );
}

export default ErrorBoundary;
