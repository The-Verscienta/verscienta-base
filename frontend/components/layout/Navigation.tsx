'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  items?: NavItem[];
  variant?: 'horizontal' | 'vertical' | 'sidebar';
  className?: string;
}

const defaultItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/herbs', label: 'Herbs' },
  { href: '/formulas', label: 'Formulas' },
  { href: '/modalities', label: 'Modalities' },
  { href: '/conditions', label: 'Conditions' },
  { href: '/practitioners', label: 'Practitioners' },
  { href: '/symptom-checker', label: 'Symptom Checker' },
  { href: '/search', label: 'Search' },
];

export function Navigation({ items = defaultItems, variant = 'horizontal', className = '' }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (variant === 'vertical' || variant === 'sidebar') {
    return (
      <nav aria-label="Site navigation" className={`flex flex-col gap-1 ${className}`}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-earth-100 text-gray-800 font-semibold'
                : 'text-earth-600 hover:bg-earth-50 hover:text-gray-800'
            }`}
          >
            {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
            {item.label}
            {isActive(item.href) && (
              <span className="ml-auto w-1.5 h-1.5 bg-sage-500 rounded-full" />
            )}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Site navigation" className={`flex items-center gap-1 flex-wrap ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? 'page' : undefined}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'bg-earth-100 text-gray-800'
              : 'text-earth-600 hover:bg-earth-50 hover:text-gray-800'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
