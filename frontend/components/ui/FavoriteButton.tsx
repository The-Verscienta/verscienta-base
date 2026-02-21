'use client';

import { useFavorites, type FavoriteEntityType } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  entityId: string;
  entityType: FavoriteEntityType;
  entityTitle: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function FavoriteButton({
  entityId,
  entityType,
  entityTitle,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, loaded } = useFavorites();
  const favorited = isFavorite(entityId);

  if (!loaded) {
    return (
      <button
        className={`${sizeClasses[size]} rounded-full bg-white/80 border border-gray-200 flex items-center justify-center ${className}`}
        disabled
        aria-label="Loading favorites"
      >
        <svg className={`${iconSizes[size]} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(entityId, entityType, entityTitle);
      }}
      className={`${sizeClasses[size]} rounded-full border flex items-center justify-center transition-all ${
        favorited
          ? 'bg-red-50 border-red-200 hover:bg-red-100'
          : 'bg-white/80 border-gray-200 hover:bg-gray-100'
      } ${className}`}
      aria-label={favorited ? `Remove ${entityTitle} from favorites` : `Add ${entityTitle} to favorites`}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`${iconSizes[size]} transition-colors ${favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
