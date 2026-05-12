/**
 * Client-side access gate.
 *
 * Wraps a tool that should only be available to authenticated users — and
 * optionally only to professional/admin roles. Shows appropriate fallback UI
 * (sign-in prompt or upgrade prompt) instead of just hiding the tool.
 *
 * Note: this is UX scaffolding. The real enforcement happens in the API route
 * via lib/auth-server.ts; this component just gives a polished visual.
 */
import { useEffect, useState, type ReactNode } from "react";

const PROFESSIONAL_ROLES = new Set(["Administrator", "Professional Access"]);
const PATIENT_ROLES = new Set(["Patient Access"]);

interface Props {
  /** "professional" — Pro + Admin only. "authenticated" — any signed-in user. */
  level: "professional" | "authenticated";
  /** Title for the upgrade/sign-in card. */
  title?: string;
  /** What this tool is for, shown on the upgrade/sign-in card. */
  toolDescription: string;
  /** Path to redirect to after sign-in. */
  redirectPath: string;
  children: ReactNode;
}

interface PolicyLink {
  policy?: { admin_access?: boolean } | null;
}

interface User {
  id: string;
  role?: { name?: string; policies?: PolicyLink[] };
  policies?: PolicyLink[];
}

function isAdmin(user: User): boolean {
  const fromRole = user.role?.policies?.some((p) => p?.policy?.admin_access === true) ?? false;
  const direct = user.policies?.some((p) => p?.policy?.admin_access === true) ?? false;
  return fromRole || direct;
}

export default function AccessGate({ level, title, toolDescription, redirectPath, children }: Props) {
  const [state, setState] = useState<"loading" | "ok" | "auth-required" | "upgrade-required">("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const user = d?.user as User | null;
        if (!user?.id) {
          setState("auth-required");
          return;
        }
        const roleName = user.role?.name || "";
        const admin = isAdmin(user);
        const isPro = admin || PROFESSIONAL_ROLES.has(roleName);
        const isPatient = PATIENT_ROLES.has(roleName);
        if (level === "professional") {
          setState(isPro ? "ok" : "upgrade-required");
        } else {
          setState(isPro || isPatient ? "ok" : "auth-required");
        }
      })
      .catch(() => setState("auth-required"));
  }, [level]);

  if (state === "loading") {
    return (
      <div className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "ok") return <>{children}</>;

  if (state === "auth-required") {
    return (
      <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-sage-200 dark:border-earth-700 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center text-sage-700 dark:text-sage-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-earth-100 mb-2">{title || "Sign in required"}</h3>
        <p className="text-gray-600 dark:text-earth-300 mb-5 max-w-md mx-auto">{toolDescription}</p>
        <div className="flex gap-2 justify-center">
          <a
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition"
          >
            Sign in
          </a>
          <a
            href={`/register?redirect=${encodeURIComponent(redirectPath)}`}
            className="px-5 py-2.5 bg-white dark:bg-earth-800 border border-gray-200 dark:border-earth-600 text-gray-700 dark:text-earth-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-earth-700 transition"
          >
            Create account
          </a>
        </div>
      </div>
    );
  }

  // upgrade-required
  return (
    <div className="bg-gradient-to-br from-amber-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-amber-200 dark:border-earth-700 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold mb-3">
        Practitioner Tool
      </div>
      <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-earth-100 mb-2">{title || "For verified practitioners"}</h3>
      <p className="text-gray-600 dark:text-earth-300 mb-5 max-w-md mx-auto">{toolDescription}</p>
      <p className="text-sm text-gray-500 dark:text-earth-400">
        Already a practitioner?{" "}
        <a href="/contact" className="text-sage-600 hover:underline">
          Contact us
        </a>{" "}
        to upgrade your account.
      </p>
    </div>
  );
}
