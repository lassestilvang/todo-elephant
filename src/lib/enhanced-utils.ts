/*
 * Feature Flags Provider Component
 * Wraps the application to provide feature flag context
 */

import React, { ReactNode } from 'react';
import { FeatureFlagsProvider } from './feature-flags';

interface FeatureFlagsWrapperProps {
  children: ReactNode;
  initialFlags?: Partial<import('./feature-flags').FeatureFlags>;
}

export function FeatureFlagsWrapper({
  children,
  initialFlags,
}: FeatureFlagsWrapperProps) {
  return (
    <FeatureFlagsProvider initialFlags={initialFlags}>
      {children}
    </FeatureFlagsProvider>
  );
}

/*
 * Conditional rendering components
 */

import { useFeatureFlag } from './feature-flags';

interface IfFeatureProps {
  feature: keyof import('./feature-flags').FeatureFlags;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function IfFeature({ feature, fallback, children }: IfFeatureProps) {
  const enabled = useFeatureFlag(feature);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

interface UnlessFeatureProps {
  feature: keyof import('./feature-flags').FeatureFlags;
  children: React.ReactNode;
}

export function UnlessFeature({ feature, children }: UnlessFeatureProps) {
  const enabled = useFeatureFlag(feature);
  return !enabled ? <>{children}</> : null;
}

/*
 * Admin panel for feature flags
 */

import { useState } from 'react';
import { featureFlagManager } from './feature-flags';
import { useFeatureFlags } from './feature-flags';

export function FeatureFlagsAdmin() {
  const { flags, setFlag } = useFeatureFlags();
  const [search, setSearch] = useState('');
  const [editedFlag, setEditedFlag] = useState<keyof import('./feature-flags').FeatureFlags | null>(null);
  const [editValue, setEditValue] = useState<boolean>(false);

  const filteredFlags = Object.entries(flags).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  ) as [keyof import('./feature-flags').FeatureFlags, boolean][];

  const handleToggle = (flag: keyof typeof flags) => {
    setFlag(flag, !flags[flag]);
  };

  const handleSaveEdit = () => {
    if (editedFlag) {
      setFlag(editedFlag, editValue);
      setEditedFlag(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Feature Flags Control Panel</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search flags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </div>

      <div className="space-y-2">
        {filteredFlags.map(([flag, value]) => (
          <div key={flag} className="p-4 border rounded hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold">{String(flag)}</h3>
                <p className="text-sm text-gray-600">{featureFlagManager.getFlagDescription(flag)}</p>
              </div>
              <div className="flex items-center space-x-3">
                {editedFlag === flag ? (
                  <>
                    <input
                      type="checkbox"
                      checked={editValue}
                      onChange={(e) => setEditValue(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditedFlag(null)}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 ml-2"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleToggle(flag)}
                      className="h-4 w-4"
                    />
                    <span className="cursor-pointer hover:underline" onClick={() => setEditedFlag(flag)}>
                      Edit
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredFlags.length === 0 && (
          <p className="text-gray-500">No flags match your search</p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Experimental Features</h3>
        <ul className="list-disc pl-5 space-y-1">
          {featureFlagManager.getExperimentalFlags().map(flag => (
            <li key={flag}>
              <span className="font-medium">{String(flag)}</span>:
              {featureFlagManager.getFlagDescription(flag)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Requires API Keys</h3>
        <ul className="list-disc pl-5 space-y-1">
          {featureFlagManager.getRequiresAPIKeys().map(flag => (
            <li key={flag}>
              <span className="font-medium">{String(flag)}</span>:
              {featureFlagManager.getFlagDescription(flag)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/*
 * Performance monitoring wrapper
 */

import { useEffect } from 'react';
import { useRenderCount } from './performance';

export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P) {
    const renderCount = useRenderCount(componentName);

    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${componentName} rendered ${renderCount} times`);
      }
    }, [componentName, renderCount]);

    return <Component {...props} />;
  };
}

/*
 * Error boundary with retry capability
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; resetError: () => void }>;
  retryComponent?: React.ComponentType<{ onRetry: () => void }>;
  resetKeys?: string[] | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, resetKey: this.state.resetKey + 1 });
  };

  render() {
    if (this.state.hasError) {
      const RetryComponent = this.props.retryComponent;

      return (
        <div>
          {this.props.fallback ? (
            <this.props.fallback
              error={this.state.error!}
              resetError={this.handleReset}
            />
          ) : (
            <div className="p-6 bg-red-50 border border-red-200 rounded">
              <h3 className="text-red-600 font-bold">Something went wrong.</h3>
              <p className="text-red-500">{this.state.error?.message}</p>
              {RetryComponent && (
                <div className="mt-4">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}