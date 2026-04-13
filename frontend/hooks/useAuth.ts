'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  uid?: string;
  name: string;
  mail?: string;
  email?: string;
  roles: string[];
  field_first_name?: string;
  field_last_name?: string;
  created?: string;
  access?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshAuth: checkAuth,
  };
}
