'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  defaultValue?: string;
  paramName?: string;
  className?: string;
}

export function SortDropdown({
  options,
  defaultValue = 'title',
  paramName = 'sort',
  className = '',
}: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue = searchParams.get(paramName) || defaultValue;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === defaultValue) {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }, [router, pathname, searchParams, paramName, defaultValue]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="sort-select" className="text-sm text-gray-600 dark:text-earth-300 whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentValue}
        onChange={handleChange}
        className="text-sm border border-gray-200 dark:border-earth-700 rounded-lg px-3 py-1.5 bg-white dark:bg-earth-900 text-gray-700 dark:text-earth-200 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 cursor-pointer hover:border-gray-300 dark:hover:border-earth-600 transition"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
