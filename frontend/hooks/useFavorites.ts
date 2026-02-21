'use client';

import { useState, useEffect, useCallback } from 'react';

export type FavoriteEntityType = 'herb' | 'formula' | 'condition' | 'modality' | 'practitioner';

export interface FavoriteItem {
  id: string;
  type: FavoriteEntityType;
  title: string;
  savedAt: string;
}

const STORAGE_KEY = 'verscienta_favorites';

function loadFavorites(): Record<string, FavoriteItem> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveFavorites(favorites: Record<string, FavoriteItem>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Hook for managing user favorites/bookmarks.
 * Persists to localStorage and syncs across tabs via storage event.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, FavoriteItem>>({});
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setFavorites(loadFavorites());
    setLoaded(true);
  }, []);

  // Sync across tabs
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFavorites(loadFavorites());
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addFavorite = useCallback((id: string, type: FavoriteEntityType, title: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [id]: { id, type, title, savedAt: new Date().toISOString() } };
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      delete next[id];
      saveFavorites(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string, type: FavoriteEntityType, title: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { id, type, title, savedAt: new Date().toISOString() };
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => {
    return !!favorites[id];
  }, [favorites]);

  const getFavoritesByType = useCallback((type: FavoriteEntityType) => {
    return Object.values(favorites)
      .filter((f) => f.type === type)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [favorites]);

  const allFavorites = Object.values(favorites).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return {
    favorites: allFavorites,
    loaded,
    count: allFavorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
  };
}
