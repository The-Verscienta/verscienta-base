'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">
          <span role="img" aria-label="warning">&#9888;&#65039;</span>
        </div>

        <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-earth-100 mb-4">
          Something went wrong
        </h1>

        <p className="text-lg text-gray-600 dark:text-earth-300 mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-earth-600 text-white rounded-lg hover:bg-earth-700 transition font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-sage-600 text-sage-700 dark:text-sage-400 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800 transition font-medium"
          >
            Return home
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-gray-400 dark:text-earth-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
