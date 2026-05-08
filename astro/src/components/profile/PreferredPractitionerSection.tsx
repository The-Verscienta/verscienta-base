import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  onSessionExpired: () => void;
}

interface Practitioner {
  id: string;
  first_name?: string;
  last_name?: string;
}

type Status = "loading" | "idle" | "saving" | "error";

export default function PreferredPractitionerSection({ onSessionExpired }: Props) {
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/preferences");
        if (res.status === 401) { onSessionExpired(); return; }
        const data = await res.json();
        setPractitioner(data.preferred_practitioner ?? null);
        setStatus("idle");
      } catch {
        setStatus("error");
        setMessage("Couldn't load preferences.");
      }
    })();
  }, [onSessionExpired]);

  const remove = async () => {
    setMessage("");
    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferred_practitioner: null }),
      });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to remove.");
        return;
      }
      setPractitioner(null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const fullName = practitioner
    ? [practitioner.first_name, practitioner.last_name].filter(Boolean).join(" ") || "Practitioner"
    : null;

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">My practitioner</h2>
      {status === "loading" ? (
        <p className="text-sm text-gray-500 dark:text-earth-400">Loading…</p>
      ) : practitioner ? (
        <div className="flex items-center justify-between p-3 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
          <span className="text-sm font-medium text-sage-800 dark:text-sage-200">{fullName}</span>
          <button
            onClick={remove}
            disabled={status === "saving"}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-earth-400">
          No preferred practitioner set.{" "}
          <a href="/practitioners" className="text-sage-600 hover:underline">Browse practitioners →</a>
        </p>
      )}
      {message && (
        <p className="mt-3 text-sm rounded-lg p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {message}
        </p>
      )}
    </section>
  );
}
