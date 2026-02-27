export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-earth-100 dark:border-earth-800"></div>
        {/* Spinning ring */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-earth-600 animate-spin"></div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl animate-pulse">🌿</span>
        </div>
      </div>
      <p className="mt-4 text-sage-600 font-medium animate-pulse">{message}</p>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative mb-6">
        {/* Decorative circles */}
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-earth-100 dark:bg-earth-800 animate-ping opacity-20"></div>
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-earth-50 to-sage-50 dark:from-earth-900 dark:to-sage-950 flex items-center justify-center shadow-lg">
          <div className="w-16 h-16 rounded-full border-4 border-earth-200 dark:border-earth-700 border-t-earth-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🌿</span>
          </div>
        </div>
      </div>
      <h2 className="text-xl font-serif font-semibold text-gray-800 dark:text-earth-100 mb-2">Loading</h2>
      <p className="text-sage-600">Preparing your wellness journey...</p>

      {/* Animated dots */}
      <div className="flex gap-1.5 mt-4">
        <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-earth-700 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-earth-100 dark:bg-earth-800 rounded-lg"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-3/4"></div>
          <div className="h-3 bg-gray-100 dark:bg-earth-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-earth-700 rounded"></div>
        <div className="h-3 bg-gray-100 dark:bg-earth-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-100 dark:bg-earth-700 rounded w-4/6"></div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 bg-earth-50 dark:bg-earth-800 rounded-full"></div>
        <div className="h-6 w-20 bg-earth-50 dark:bg-earth-800 rounded-full"></div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-earth-200 border-t-earth-600 rounded-full animate-spin ${className}`}
    />
  );
}

export function LoadingInline({ text = 'Loading' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sage-600">
      <Spinner size="sm" />
      <span>{text}</span>
    </span>
  );
}
