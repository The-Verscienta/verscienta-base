'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="block text-earth-600 hover:text-gray-800 font-medium"
              >
                Go to Home Page
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error fallback component for customization
interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description = "We're sorry, but something unexpected happened.",
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="space-y-3">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            className="block text-earth-600 hover:text-gray-800 font-medium"
          >
            Go to Home Page
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-48">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Compact inline error for smaller components
interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function InlineError({
  message = 'Failed to load content',
  onRetry,
}: InlineErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-red-700">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Not Found error component
export function NotFoundError({
  title = 'Page Not Found',
  description = "The page you're looking for doesn't exist or has been moved.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-serif font-bold text-earth-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-earth-600 hover:bg-earth-700 text-white font-semibold py-3 rounded-xl transition text-center"
          >
            Go Home
          </Link>
          <Link
            href="/search"
            className="block text-earth-600 hover:text-gray-800 font-medium"
          >
            Search for content
          </Link>
        </div>
      </div>
    </div>
  );
}

// API Error component for failed data fetches
export function APIError({
  statusCode,
  message,
  onRetry,
}: {
  statusCode?: number;
  message?: string;
  onRetry?: () => void;
}) {
  const errorMessages: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'You need to be logged in to access this.',
    403: "You don't have permission to access this.",
    404: 'The requested content was not found.',
    500: 'Server error. Please try again later.',
    503: 'Service temporarily unavailable.',
  };

  const displayMessage = message || (statusCode && errorMessages[statusCode]) || 'An unexpected error occurred.';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {statusCode && (
        <div className="text-sm text-gray-500 mb-1">Error {statusCode}</div>
      )}
      <p className="text-gray-700 mb-4">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-earth-600 hover:bg-earth-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
