/**
 * Favorites hook using localStorage.
 * Ported from frontend/hooks/useFavorites.ts — identical logic.
 */
import { useState, useEffect, useCallback } from "react";

export type FavoriteEntityType = "herb" | "formula" | "condition" | "modality" | "practitioner";

export interface FavoriteItem {
  id: string | number;
  type: FavoriteEntityType;
  title: string;
  savedAt: string;
}

const STORAGE_KEY = "verscienta_favorites";

function loadFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setLoaded(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(loadFavorites());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "savedAt">) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      if (exists) return prev;
      const next = [...prev, { ...item, savedAt: new Date().toISOString() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string | number, type: FavoriteEntityType) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => !(f.id === id && f.type === type));
      saveFavorites(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, "savedAt">) => {
      const exists = favorites.some((f) => f.id === item.id && f.type === item.type);
      if (exists) removeFavorite(item.id, item.type);
      else addFavorite(item);
    },
    [favorites, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback(
    (id: string | number, type: FavoriteEntityType) => favorites.some((f) => f.id === id && f.type === type),
    [favorites]
  );

  const getFavoritesByType = useCallback(
    (type: FavoriteEntityType) => favorites.filter((f) => f.type === type),
    [favorites]
  );

  return {
    favorites,
    loaded,
    count: favorites.length,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
  };
}
