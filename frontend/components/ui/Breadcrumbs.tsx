'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Map of path segments to display labels
const pathLabels: Record<string, string> = {
  herbs: 'Herbs',
  modalities: 'Modalities',
  conditions: 'Conditions',
  practitioners: 'Practitioners',
  formulas: 'Formulas',
  search: 'Search',
  'symptom-checker': 'Symptom Checker',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  login: 'Login',
  register: 'Register',
};

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast || !item.href ? (
                <span className="text-gray-800 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-sage-600 hover:text-sage-800 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check if this is a UUID (detail page)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    if (isUUID) {
      // For detail pages, we'll just show "Details" or the item name if available
      breadcrumbs.push({
        label: 'Details',
        href: isLast ? undefined : currentPath,
      });
    } else {
      const label = pathLabels[segment] || capitalizeFirst(segment);
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }
  });

  return breadcrumbs;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// Exportable hook for getting current breadcrumb label
export function useBreadcrumbLabel(segment: string): string {
  return pathLabels[segment] || capitalizeFirst(segment);
}
