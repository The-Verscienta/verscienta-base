'use client';

export function SimilarFormulasSkeleton() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-earth-700 rounded w-48 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-earth-700 rounded w-96 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-100 dark:border-earth-700 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <div className="h-5 bg-gray-200 dark:bg-earth-700 rounded w-40" />
              <div className="h-5 bg-gray-200 dark:bg-earth-700 rounded w-24" />
            </div>
            <div className="h-2 bg-gray-200 dark:bg-earth-700 rounded w-full mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContributionsSkeleton() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-earth-700 rounded w-56 mb-6" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-100 dark:border-earth-700 rounded-lg p-5">
            <div className="flex justify-between mb-3">
              <div className="h-4 bg-gray-200 dark:bg-earth-700 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-earth-700 rounded w-40" />
            </div>
            <div className="h-16 bg-gray-200 dark:bg-earth-700 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-earth-700 flex justify-center gap-3">
        <div className="h-10 bg-gray-200 dark:bg-earth-700 rounded w-40" />
        <div className="h-10 bg-gray-200 dark:bg-earth-700 rounded w-44" />
      </div>
    </div>
  );
}
