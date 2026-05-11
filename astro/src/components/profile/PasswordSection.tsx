import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

export default function PasswordSection({ onSessionExpired }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setStatus("error");
      setMessage("New passwords don't match.");
      return;
    }

    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword, current_password: currentPassword }),
      });
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
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
        setMessage(data.error || "Failed to update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setStatus("success");
      setMessage("Password updated.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Current password</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">New password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 dark:text-earth-400 mb-1">Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500" />
        </label>
        {message && (
          <p className={`text-sm rounded-lg p-2 ${
              status === "error"
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
            }`}>
            {message}
          </p>
        )}
        <button type="submit" disabled={status === "saving"}
          className="px-4 py-2 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition">
          {status === "saving" ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
