'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse dark:bg-earth-700"></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-white hover:text-earth-200 transition font-medium"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-white text-earth-700 px-4 py-2 rounded-lg hover:bg-earth-50 transition font-medium dark:bg-earth-800 dark:text-earth-200 dark:hover:bg-earth-700"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:text-earth-200 transition"
      >
        <div className="w-8 h-8 rounded-full bg-earth-500 flex items-center justify-center text-white font-semibold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="hidden md:inline">{user?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 dark:bg-earth-900 dark:border dark:border-earth-700">
            <Link
              href="/profile"
              className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition dark:text-earth-100 dark:hover:bg-earth-800"
              onClick={() => setIsOpen(false)}
            >
              My Profile
            </Link>
            <Link
              href="/profile/favorites"
              className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition dark:text-earth-100 dark:hover:bg-earth-800"
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </Link>
            {user?.roles?.includes('admin') && (
              <a
                href="https://backend.ddev.site/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition dark:text-earth-100 dark:hover:bg-earth-800"
              >
                Admin Panel
              </a>
            )}
            <hr className="my-2" />
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
