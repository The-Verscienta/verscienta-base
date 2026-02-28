'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const ORGAN_SYSTEMS = [
  'Spleen', 'Liver', 'Heart', 'Kidney', 'Lung', 'Pericardium',
  'Triple Burner', 'Gallbladder', 'Large Intestine', 'Small Intestine',
  'Bladder', 'Stomach', 'Governing Vessel', 'Conception Vessel',
];

interface Props {
  activeOrganSystem?: string;
  counts?: Record<string, number>;
}

export function OrganSystemFilterBar({ activeOrganSystem, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setOrganSystem = useCallback(
    (organSystem: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (organSystem) {
        params.set('organSystem', organSystem);
      } else {
        params.delete('organSystem');
      }
      params.delete('page'); // reset to page 1 when filter changes
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const btnBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400';
  const activeClass =
    'bg-amber-700 dark:bg-amber-600 text-white border-amber-700 dark:border-amber-600 shadow-sm';
  const inactiveClass =
    'bg-white dark:bg-earth-800 text-earth-700 dark:text-earth-300 border-earth-200 dark:border-earth-700 hover:bg-amber-50 dark:hover:bg-earth-700';

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-earth-200 dark:scrollbar-thumb-earth-700"
      role="toolbar"
      aria-label="Filter by organ system"
    >
      {/* All button */}
      <button
        type="button"
        aria-pressed={!activeOrganSystem}
        className={`${btnBase} ${!activeOrganSystem ? activeClass : inactiveClass}`}
        onClick={() => setOrganSystem(null)}
      >
        All
        {counts && (
          <span className="opacity-70 text-xs">
            {Object.values(counts).reduce((s, n) => s + n, 0)}
          </span>
        )}
      </button>

      {ORGAN_SYSTEMS.map(organ => {
        const isActive = activeOrganSystem === organ;
        return (
          <button
            key={organ}
            type="button"
            aria-pressed={isActive}
            className={`${btnBase} ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setOrganSystem(isActive ? null : organ)}
          >
            {organ}
            {counts?.[organ] !== undefined && (
              <span className="opacity-70 text-xs">{counts[organ]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
