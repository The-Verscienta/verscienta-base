interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-earth-800 dark:via-earth-700 dark:to-earth-800 bg-[length:200%_100%] rounded ${className}`}
    />
  );
}

// Text skeleton - mimics a line of text
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

// Card skeleton - for entity cards
export function SkeletonCard({ variant = 'default' }: { variant?: 'default' | 'horizontal' }) {
  if (variant === 'horizontal') {
    return (
      <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-4 flex gap-4">
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="pt-4 border-t border-gray-100 dark:border-earth-700">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Herb card skeleton
export function SkeletonHerbCard() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Practitioner card skeleton
export function SkeletonPractitionerCard() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="pt-4 border-t border-gray-100 dark:border-earth-700">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-earth-950 px-4 py-3 border-b border-gray-100 dark:border-earth-700 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="px-4 py-3 border-b border-gray-100 dark:border-earth-700 last:border-0 flex gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Detail page skeleton
export function SkeletonDetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-earth-900 rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Skeleton className="w-16 h-16 rounded-lg mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-earth-900 rounded-xl shadow-lg p-8 mb-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Grid skeleton for listing pages
export function SkeletonGrid({
  count = 6,
  columns = 3,
  CardComponent = SkeletonCard,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  CardComponent?: React.ComponentType;
}) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

// Button skeleton
export function SkeletonButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-28',
    lg: 'h-12 w-36',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-lg`} />;
}

// Image skeleton
export function SkeletonImage({ aspectRatio = '16/9' }: { aspectRatio?: string }) {
  return (
    <div style={{ aspectRatio }} className="w-full">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

// Form skeleton
export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
