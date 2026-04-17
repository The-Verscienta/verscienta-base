/**
 * Auth state hook for React islands.
 * Ported from frontend/hooks/useAuth.ts.
 * Uses Directus user shape instead of Drupal.
 */
import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setUser(null);
    window.location.href = "/";
  }, []);

  const refreshAuth = useCallback(() => checkAuth(), [checkAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshAuth,
  };
}
