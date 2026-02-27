import { InputProps } from '@/types/components';
import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value,
      onChange,
      placeholder,
      disabled = false,
      required = false,
      error,
      label,
      helperText,
      className = '',
      name,
      id,
    },
    ref
  ) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseInputStyles = 'w-full px-4 py-2 border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-1 dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500';
    const normalStyles = 'border-gray-300 focus:border-earth-600 focus:ring-earth-500 dark:border-earth-600';
    const errorStyles = 'border-red-500 focus:border-red-600 focus:ring-red-500';
    const disabledStyles = 'bg-gray-100 cursor-not-allowed dark:bg-earth-900';

    const inputStyles = `${baseInputStyles} ${error ? errorStyles : normalStyles} ${disabled ? disabledStyles : ''} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
        />

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-earth-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
