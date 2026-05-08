import { useEffect, useState, useCallback } from "react";

export interface ProfileUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  email_verified?: boolean;
  avatar?: string | null;
  role?: { id: string; name?: string };
}

type LoadState = "loading" | "unauth" | "authed" | "session-expired";

export default function ProfilePanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [user, setUser] = useState<ProfileUser | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.user) {
        setState("unauth");
        setUser(null);
        return;
      }
      setUser(data.user);
      setState("authed");
    } catch {
      setState("unauth");
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Global handler that subsections call when they get a 401.
  const onSessionExpired = useCallback(() => {
    setState("session-expired");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  }, []);

  if (state === "loading") {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "unauth") {
    return (
      <div className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 text-center">
        <p className="text-gray-600 dark:text-earth-300">Please sign in to manage your profile.</p>
        <a href="/login" className="inline-block mt-4 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition">
          Sign In
        </a>
      </div>
    );
  }

  if (state === "session-expired") {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
        <p className="text-amber-800 dark:text-amber-200">Session expired — redirecting to sign in…</p>
      </div>
    );
  }

  // Suppress unused-var warning for refreshUser/onSessionExpired (used by subsections in Tasks 12-16).
  void refreshUser;
  void onSessionExpired;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-earth-400">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>
      {user && (
        <>
          <SectionPlaceholder name="Identity" />
          <SectionPlaceholder name="Password" />
          <SectionPlaceholder name="Avatar" />
          <SectionPlaceholder name="Preferred practitioner" />
          <SectionPlaceholder name="Email verification" />
        </>
      )}
    </div>
  );
}

function SectionPlaceholder({ name }: { name: string }) {
  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100">{name}</h2>
      <p className="text-xs text-gray-400 mt-1">(placeholder)</p>
    </section>
  );
}
