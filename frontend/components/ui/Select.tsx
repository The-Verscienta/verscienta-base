import { SelectProps } from '@/types/components';
import { forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder,
      multiple = false,
      disabled = false,
      error,
      label,
      className = '',
    },
    ref
  ) => {
    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

    const baseSelectStyles = 'w-full px-4 py-2 border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none dark:bg-earth-800 dark:text-earth-100';
    const normalStyles = 'border-gray-300 focus:border-earth-600 focus:ring-earth-500 dark:border-earth-600';
    const errorStyles = 'border-red-500 focus:border-red-600 focus:ring-red-500';
    const disabledStyles = 'bg-gray-100 cursor-not-allowed dark:bg-earth-900';

    const selectStyles = `${baseSelectStyles} ${error ? errorStyles : normalStyles} ${disabled ? disabledStyles : ''} ${className}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (multiple) {
        const selectedValues = Array.from(e.target.selectedOptions).map(
          (option) => option.value
        );
        onChange?.(selectedValues);
      } else {
        onChange?.(e.target.value);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={handleChange}
            multiple={multiple}
            disabled={disabled}
            className={selectStyles}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : undefined}
          >
            {placeholder && !multiple && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {!multiple && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-earth-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
