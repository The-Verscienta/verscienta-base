import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  onSessionExpired: () => void;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function EmailVerificationSection({ user, onSessionExpired }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (user.email_verified) {
    return (
      <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Email verification</h2>
        <p className="text-sm text-green-700 dark:text-green-300 inline-flex items-center gap-1">
          <span>✓</span>
          <span>Verified</span>
        </p>
      </section>
    );
  }

  const resend = async () => {
    setStatus("sending");
    setMessage("");
    try {
      const res = await apiFetch("/api/auth/resend-verification", { method: "POST" });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to send.");
        return;
      }
      setStatus("sent");
      setMessage("If your email isn't verified, we sent a new link.");
      setCooldown(60);
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
      <h2 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Email verification</h2>
      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
        Please verify your email address to unlock all features.
      </p>
      <button
        onClick={resend}
        disabled={status === "sending" || cooldown > 0}
        className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition"
      >
        {cooldown > 0 ? `Sent — wait ${cooldown}s` : status === "sending" ? "Sending…" : "Resend verification email"}
      </button>
      {message && (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-200"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
