import { LoadingProps } from '@/types/components';

export function Loading({
  size = 'md',
  text,
  fullScreen = false,
  variant = 'spinner',
}: LoadingProps) {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const Spinner = () => (
    <svg
      className={`animate-spin ${sizeStyles[size]} text-earth-600`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const Dots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-earth-600 rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );

  const Bars = () => (
    <div className="flex space-x-1 items-end">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-1' : size === 'md' ? 'w-2' : 'w-3'} bg-earth-600 rounded-sm animate-pulse`}
          style={{
            height: `${size === 'sm' ? 12 : size === 'md' ? 20 : 32}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  const variants = {
    spinner: <Spinner />,
    dots: <Dots />,
    bars: <Bars />,
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {variants[variant]}
      {text && (
        <p className={`${textSizeStyles[size]} text-gray-700 dark:text-earth-300 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 dark:bg-earth-900 dark:bg-opacity-90">
        {content}
      </div>
    );
  }

  return content;
}
