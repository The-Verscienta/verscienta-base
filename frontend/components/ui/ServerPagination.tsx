'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  paramName?: string;
  className?: string;
  showFirstLast?: boolean;
  siblingCount?: number;
}

export function ServerPagination({
  currentPage,
  totalPages,
  paramName = 'page',
  className = '',
  showFirstLast = true,
  siblingCount = 1,
}: ServerPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigateToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page === 1) {
      params.delete(paramName);
    } else {
      params.set(paramName, String(page));
    }

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }, [router, pathname, searchParams, paramName]);

  if (totalPages <= 1) return null;

  const pages = generatePagination(currentPage, totalPages, siblingCount);

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      {/* First Page */}
      {showFirstLast && (
        <button
          onClick={() => navigateToPage(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-600 dark:text-earth-400 hover:bg-sage-100 dark:hover:bg-earth-800 hover:text-earth-700 dark:hover:text-earth-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to first page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Previous Page */}
      <button
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-600 dark:text-earth-400 hover:bg-sage-100 dark:hover:bg-earth-800 hover:text-earth-700 dark:hover:text-earth-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400 dark:text-earth-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => navigateToPage(pageNum)}
              className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-earth-600 text-white'
                  : 'text-gray-700 dark:text-earth-300 hover:bg-sage-100 dark:hover:bg-earth-800 hover:text-earth-700 dark:hover:text-earth-100'
              }`}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Page */}
      <button
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-600 dark:text-earth-400 hover:bg-sage-100 dark:hover:bg-earth-800 hover:text-earth-700 dark:hover:text-earth-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Last Page */}
      {showFirstLast && (
        <button
          onClick={() => navigateToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-600 dark:text-earth-400 hover:bg-sage-100 dark:hover:bg-earth-800 hover:text-earth-700 dark:hover:text-earth-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to last page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  );
}

function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, 'ellipsis', ...rightRange];
  }

  if (showLeftEllipsis && showRightEllipsis) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// Simple pagination info component
interface PaginationInfoProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className = '',
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <p className={`text-sm text-gray-600 dark:text-earth-300 ${className}`}>
      Showing <span className="font-medium">{start}</span> to{' '}
      <span className="font-medium">{end}</span> of{' '}
      <span className="font-medium">{totalItems}</span> results
    </p>
  );
}
