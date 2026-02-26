import type { ReviewEntity } from '@/types/drupal';

interface ReviewCardProps {
  review: ReviewEntity;
  variant?: 'default' | 'compact' | 'detailed';
  showEntity?: boolean;
  className?: string;
}

// Star rating component
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, idx) => {
        const filled = idx < Math.floor(rating);
        const half = idx === Math.floor(rating) && rating % 1 >= 0.5;

        return (
          <svg
            key={idx}
            className={`w-4 h-4 ${filled || half ? 'text-yellow-400' : 'text-gray-300'}`}
            fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        );
      })}
    </div>
  );
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ReviewCard({
  review,
  variant = 'default',
  showEntity = false,
  className = '',
}: ReviewCardProps) {
  const rating = review.field_rating ?? 0;
  const comment = review.field_comment || '';
  const createdDate = review.created ? formatRelativeTime(review.created) : '';

  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${className}`}>
        <div className="w-8 h-8 bg-earth-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={rating} />
            <span className="text-xs text-gray-400">{createdDate}</span>
          </div>
          {comment && (
            <p className="text-sm text-gray-700 line-clamp-2">{comment}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-earth-100 to-sage-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{review.title || 'Anonymous User'}</p>
              <p className="text-sm text-gray-500">{createdDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={rating} />
            <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
          </div>
        </div>

        {showEntity && review.field_reviewed_entity && (
          <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Reviewing:</p>
            <p className="text-sm font-medium text-earth-700">
              {review.field_reviewed_entity.type.replace('node--', '').replace(/-/g, ' ')}
            </p>
          </div>
        )}

        {comment && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed">{comment}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-500 hover:text-earth-600 flex items-center gap-1 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Helpful
            </button>
            <button className="text-sm text-gray-500 hover:text-earth-600 flex items-center gap-1 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-earth-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{review.title || 'Anonymous'}</p>
            <p className="text-xs text-gray-400">{createdDate}</p>
          </div>
        </div>
        <StarRating rating={rating} />
      </div>

      {comment && (
        <p className="text-sm text-gray-700 line-clamp-3">{comment}</p>
      )}
    </div>
  );
}

// Summary component for showing aggregate ratings
interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: Record<number, number>;
  className?: string;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  className = '',
}: ReviewSummaryProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} />
          <p className="text-sm text-gray-500 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>

        {ratingDistribution && (
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-8">{star}</span>
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
