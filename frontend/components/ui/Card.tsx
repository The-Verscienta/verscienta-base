import { CardProps } from '@/types/components';

export function Card({
  children,
  title,
  subtitle,
  footer,
  onClick,
  className = '',
  variant = 'default',
}: CardProps) {
  const baseStyles = 'rounded-lg transition';

  const variantStyles = {
    default: 'bg-white dark:bg-earth-900 shadow-md border border-gray-100 dark:border-earth-700',
    outlined: 'bg-white dark:bg-earth-900 border-2 border-gray-300 dark:border-earth-700',
    elevated: 'bg-white dark:bg-earth-900 shadow-lg',
  };

  const interactiveStyles = onClick
    ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]'
    : '';

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`;

  const CardContent = (
    <>
      {(title || subtitle) && (
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-earth-700">
          {title && (
            <h3 className="text-xl font-bold text-gray-800 dark:text-earth-100 mb-1">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-earth-300">{subtitle}</p>
          )}
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-earth-700">
          {footer}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        className={combinedStyles}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {CardContent}
      </div>
    );
  }

  return <div className={combinedStyles}>{CardContent}</div>;
}
