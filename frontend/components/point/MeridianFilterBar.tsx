'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const MERIDIANS = [
  'Lung', 'Large Intestine', 'Stomach', 'Spleen',
  'Heart', 'Small Intestine', 'Bladder', 'Kidney',
  'Pericardium', 'Triple Burner', 'Gallbladder', 'Liver',
  'Governing Vessel', 'Conception Vessel', 'Extra Points',
];

interface Props {
  activeMeridian?: string;
  counts?: Record<string, number>;
}

export function MeridianFilterBar({ activeMeridian, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setMeridian = useCallback(
    (meridian: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (meridian) {
        params.set('meridian', meridian);
      } else {
        params.delete('meridian');
      }
      params.delete('page'); // reset to page 1 when filter changes
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const btnBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sage-400';
  const activeClass =
    'bg-sage-700 dark:bg-sage-600 text-white border-sage-700 dark:border-sage-600 shadow-sm';
  const inactiveClass =
    'bg-white dark:bg-earth-800 text-earth-700 dark:text-earth-300 border-earth-200 dark:border-earth-700 hover:bg-sage-50 dark:hover:bg-earth-700';

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-earth-200 dark:scrollbar-thumb-earth-700"
      role="toolbar"
      aria-label="Filter by meridian"
    >
      {/* All button */}
      <button
        type="button"
        aria-pressed={!activeMeridian}
        className={`${btnBase} ${!activeMeridian ? activeClass : inactiveClass}`}
        onClick={() => setMeridian(null)}
      >
        All
        {counts && (
          <span className="opacity-70 text-xs">
            {Object.values(counts).reduce((s, n) => s + n, 0)}
          </span>
        )}
      </button>

      {MERIDIANS.map(meridian => {
        const isActive = activeMeridian === meridian;
        return (
          <button
            key={meridian}
            type="button"
            aria-pressed={isActive}
            className={`${btnBase} ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setMeridian(isActive ? null : meridian)}
          >
            {meridian}
            {counts?.[meridian] !== undefined && (
              <span className="opacity-70 text-xs">{counts[meridian]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
