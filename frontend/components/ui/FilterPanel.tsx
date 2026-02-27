'use client';

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

interface FilterPanelProps {
  groups: FilterGroup[];
  values: Record<string, string | string[] | [number, number]>;
  onChange: (groupId: string, value: string | string[] | [number, number]) => void;
  onClear?: () => void;
  className?: string;
  collapsible?: boolean;
}

export function FilterPanel({
  groups,
  values,
  onChange,
  onClear,
  className = '',
  collapsible = true,
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );

  const toggleGroup = (groupId: string) => {
    if (!collapsible) return;
    const next = new Set(expandedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setExpandedGroups(next);
  };

  const handleCheckboxChange = (groupId: string, optionValue: string) => {
    const current = (values[groupId] as string[]) || [];
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    onChange(groupId, next);
  };

  const handleRadioChange = (groupId: string, optionValue: string) => {
    onChange(groupId, optionValue);
  };

  const activeFilterCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v);
  }).length;

  return (
    <div className={`bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-200 dark:border-earth-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-earth-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-earth-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-earth-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {onClear && activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-sage-600 hover:text-sage-800 transition"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-earth-700">
        {groups.map((group) => (
          <div key={group.id} className="p-4">
            <button
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center justify-between text-left ${
                collapsible ? 'cursor-pointer' : 'cursor-default'
              }`}
              disabled={!collapsible}
            >
              <span className="font-medium text-gray-900 dark:text-earth-100">{group.label}</span>
              {collapsible && (
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-earth-400 transition-transform ${
                    expandedGroups.has(group.id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {expandedGroups.has(group.id) && (
              <div className="mt-3 space-y-2">
                {group.type === 'checkbox' && group.options?.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={((values[group.id] as string[]) || []).includes(option.value)}
                      onChange={() => handleCheckboxChange(group.id, option.value)}
                      className="w-4 h-4 rounded border-gray-300 text-earth-600 focus:ring-earth-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-earth-300 group-hover:text-gray-900 dark:group-hover:text-earth-100 flex-1">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400 dark:text-earth-500">{option.count}</span>
                    )}
                  </label>
                ))}

                {group.type === 'radio' && group.options?.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name={group.id}
                      checked={values[group.id] === option.value}
                      onChange={() => handleRadioChange(group.id, option.value)}
                      className="w-4 h-4 border-gray-300 text-earth-600 focus:ring-earth-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-earth-300 group-hover:text-gray-900 dark:group-hover:text-earth-100 flex-1">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400 dark:text-earth-500">{option.count}</span>
                    )}
                  </label>
                ))}

                {group.type === 'range' && (
                  <RangeFilter
                    min={group.min || 0}
                    max={group.max || 100}
                    value={(values[group.id] as [number, number]) || [group.min || 0, group.max || 100]}
                    onChange={(value) => onChange(group.id, value)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface RangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function RangeFilter({ min, max, value, onChange }: RangeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <input
          type="number"
          min={min}
          max={value[1]}
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-earth-500 focus:border-earth-500"
        />
        <span className="text-gray-400">to</span>
        <input
          type="number"
          min={value[0]}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-earth-500 focus:border-earth-500"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value[0]}
        onChange={(e) => onChange([Number(e.target.value), value[1]])}
        className="w-full accent-earth-600"
      />
    </div>
  );
}

// Mobile-friendly filter drawer component
interface MobileFilterDrawerProps extends FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  ...filterProps
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-earth-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-earth-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-earth-100">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-earth-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          <FilterPanel {...filterProps} collapsible={true} className="border-0 shadow-none rounded-none" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-earth-900 border-t border-gray-200 dark:border-earth-700">
          <button
            onClick={onClose}
            className="w-full bg-earth-600 hover:bg-earth-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
