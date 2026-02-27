'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const quickSearches = [
    { label: 'Stress Relief', query: 'stress anxiety' },
    { label: 'Digestive Health', query: 'digestion stomach' },
    { label: 'Sleep Support', query: 'sleep insomnia' },
    { label: 'Immune Boost', query: 'immune cold flu' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search herbs, modalities, conditions..."
            className="w-full px-6 py-4 pl-14 text-lg bg-white/95 backdrop-blur-sm border-2 border-earth-200 rounded-2xl shadow-lg focus:border-earth-500 focus:ring-4 focus:ring-earth-500/20 transition-all outline-none text-gray-800 placeholder-gray-400 dark:bg-earth-800 dark:border-earth-600 dark:text-earth-100 dark:placeholder-earth-500"
          />
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-earth-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-earth-600 hover:bg-earth-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Quick Search Tags */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="text-sm text-gray-500 dark:text-earth-400">Popular:</span>
        {quickSearches.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
            className="text-sm px-3 py-1 bg-white/60 hover:bg-white/80 text-earth-700 rounded-full transition-colors border border-earth-200 dark:bg-earth-800/60 dark:hover:bg-earth-800 dark:border-earth-700 dark:text-earth-300"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
