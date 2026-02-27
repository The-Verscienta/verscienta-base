import { BadgeProps } from '@/types/components';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    default: 'bg-gray-100 dark:bg-earth-800 text-gray-800 dark:text-earth-100',
    primary: 'bg-earth-100 dark:bg-earth-800 text-gray-800 dark:text-earth-100',
    secondary: 'bg-sage-100 text-sage-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-earth-600',
    secondary: 'bg-sage-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <span className={combinedStyles}>
      {dot && (
        <span
          className={`${dotSize[size]} ${dotColors[variant]} rounded-full mr-1.5`}
        />
      )}
      {children}
    </span>
  );
}
