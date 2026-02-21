'use client';

import Link from 'next/link';
import { useFavorites, type FavoriteEntityType } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useState } from 'react';

const typeConfig: Record<FavoriteEntityType, { label: string; plural: string; href: (id: string) => string; icon: string; color: string }> = {
  herb: {
    label: 'Herb',
    plural: 'Herbs',
    href: (id) => `/herbs/${id}`,
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: 'text-sage-600 bg-sage-100',
  },
  formula: {
    label: 'Formula',
    plural: 'Formulas',
    href: (id) => `/formulas/${id}`,
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: 'text-sage-600 bg-sage-100',
  },
  condition: {
    label: 'Condition',
    plural: 'Conditions',
    href: (id) => `/conditions/${id}`,
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: 'text-coral-600 bg-coral-100',
  },
  modality: {
    label: 'Modality',
    plural: 'Modalities',
    href: (id) => `/modalities/${id}`,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'text-amber-600 bg-amber-100',
  },
  practitioner: {
    label: 'Practitioner',
    plural: 'Practitioners',
    href: (id) => `/practitioners/${id}`,
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: 'text-earth-600 bg-earth-100',
  },
};

const allTypes: FavoriteEntityType[] = ['herb', 'formula', 'condition', 'modality', 'practitioner'];

export default function FavoritesPage() {
  const { favorites, loaded, count, getFavoritesByType } = useFavorites();
  const [activeFilter, setActiveFilter] = useState<FavoriteEntityType | 'all'>('all');

  const displayedFavorites = activeFilter === 'all'
    ? favorites
    : getFavoritesByType(activeFilter);

  const typeCounts = allTypes.reduce((acc, type) => {
    acc[type] = getFavoritesByType(type).length;
    return acc;
  }, {} as Record<FavoriteEntityType, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-earth-800 to-earth-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-sage-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-coral-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <nav className="mb-6">
            <Link href="/" className="text-earth-300 hover:text-white transition text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-earth-200 text-lg">
            {loaded ? `${count} saved item${count !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeFilter === 'all'
                ? 'bg-earth-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-earth-300'
            }`}
          >
            All ({count})
          </button>
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeFilter === type
                  ? 'bg-earth-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-earth-300'
              }`}
            >
              {typeConfig[type].plural} ({typeCounts[type]})
            </button>
          ))}
        </div>

        {/* Favorites grid */}
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6">
              {activeFilter === 'all'
                ? 'Browse herbs, formulas, and more to start building your collection.'
                : `You haven't saved any ${typeConfig[activeFilter as FavoriteEntityType].plural.toLowerCase()} yet.`}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/herbs" className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition text-sm">Browse Herbs</Link>
              <Link href="/formulas" className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition text-sm">Browse Formulas</Link>
              <Link href="/conditions" className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition text-sm">Browse Conditions</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedFavorites.map((fav) => {
              const config = typeConfig[fav.type];
              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-earth-200 hover:shadow-md transition-all p-4 flex items-center gap-4"
                >
                  <Link href={config.href(fav.id)} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-earth-800 truncate">{fav.title}</h3>
                      <p className="text-xs text-gray-500">
                        {config.label} &middot; Saved {new Date(fav.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <FavoriteButton
                    entityId={fav.id}
                    entityType={fav.type}
                    entityTitle={fav.title}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
