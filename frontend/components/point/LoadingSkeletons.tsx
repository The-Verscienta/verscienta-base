export function AcupointCardSkeleton() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-100 dark:border-earth-700 overflow-hidden animate-pulse">
      <div className="h-24 bg-earth-100 dark:bg-earth-800" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-earth-100 dark:bg-earth-800 rounded w-3/4" />
        <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-1/2" />
        <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-1/3" />
        <div className="flex gap-2 mt-4">
          <div className="h-5 bg-earth-100 dark:bg-earth-800 rounded-full w-20" />
          <div className="h-5 bg-earth-100 dark:bg-earth-800 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

export function AcupointDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-40 bg-earth-100 dark:bg-earth-800 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-6 bg-earth-100 dark:bg-earth-800 rounded w-1/4" />
        <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-full" />
        <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-5/6" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-earth-100 dark:bg-earth-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
