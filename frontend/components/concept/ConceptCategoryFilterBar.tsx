'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const CONCEPT_CATEGORIES = [
  'Fundamental Substances',
  'Pathogenic Factors',
  'Diagnostic Frameworks',
  'Five Element Theory',
  'Treatment Methods',
  'Constitutional Theory',
];

interface Props {
  activeCategory?: string;
  counts?: Record<string, number>;
}

export function ConceptCategoryFilterBar({ activeCategory, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCategory = useCallback(
    (category: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const btnBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-violet-400';
  const activeClass =
    'bg-violet-700 dark:bg-violet-600 text-white border-violet-700 dark:border-violet-600 shadow-sm';
  const inactiveClass =
    'bg-white dark:bg-earth-800 text-earth-700 dark:text-earth-300 border-earth-200 dark:border-earth-700 hover:bg-violet-50 dark:hover:bg-earth-700';

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-earth-200 dark:scrollbar-thumb-earth-700"
      role="toolbar"
      aria-label="Filter by concept category"
    >
      {/* All button */}
      <button
        type="button"
        aria-pressed={!activeCategory}
        className={`${btnBase} ${!activeCategory ? activeClass : inactiveClass}`}
        onClick={() => setCategory(null)}
      >
        All
        {counts && (
          <span className="opacity-70 text-xs">
            {Object.values(counts).reduce((s, n) => s + n, 0)}
          </span>
        )}
      </button>

      {CONCEPT_CATEGORIES.map(cat => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={isActive}
            className={`${btnBase} ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setCategory(isActive ? null : cat)}
          >
            {cat}
            {counts?.[cat] !== undefined && (
              <span className="opacity-70 text-xs">{counts[cat]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
