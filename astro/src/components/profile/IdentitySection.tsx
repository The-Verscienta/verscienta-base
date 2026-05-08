import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  refreshUser: () => Promise<void>;
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

export default function IdentitySection({ user, refreshUser, onSessionExpired }: Props) {
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const emailChanged = email !== user.email;

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const payload: Record<string, string> = {};
    if (firstName !== (user.first_name ?? "")) payload.first_name = firstName;
    if (lastName !== (user.last_name ?? "")) payload.last_name = lastName;
    if (emailChanged) {
      payload.email = email;
      payload.current_password = currentPassword;
    }
    if (Object.keys(payload).length === 0) {
      setStatus("idle");
      return;
    }

    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        // 401 with "incorrect" message = wrong current_password (not session expired)
        if (data.error?.match(/incorrect/i)) {
          setStatus("error");
          setMessage("Current password is incorrect.");
          return;
        }
        onSessionExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to save.");
        return;
      }
      await refreshUser();
      setCurrentPassword("");
      setStatus("success");
      setMessage("Saved.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Identity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
          />
          <p className="text-xs text-gray-500 dark:text-earth-400 mt-1">
            You'll need to use this email to sign in.
          </p>
        </label>
        {emailChanged && (
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">
              Current password (required to change email)
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
          </label>
        )}
        {message && (
          <p
            className={`text-sm rounded-lg p-2 ${
              status === "error"
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-4 py-2 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
        >
          {status === "saving" ? "Saving…" : "Save name"}
        </button>
      </form>
    </section>
  );
}
