import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  practitionerId: string;
}

type Status = "loading" | "logged-out" | "idle" | "saving" | "set" | "error";

export default function SetAsMyPractitionerButton({ practitionerId }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user) { setStatus("logged-out"); return; }
        // Check if already preferred
        const prefRes = await fetch("/api/auth/preferences");
        const prefData = await prefRes.json();
        if (prefData.preferred_practitioner?.id === practitionerId) {
          setStatus("set");
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("logged-out");
      }
    })();
  }, [practitionerId]);

  const handleClick = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const res = await apiFetch("/api/auth/preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferred_practitioner: practitionerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to save.");
        return;
      }
      setStatus("set");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  if (status === "loading" || status === "logged-out") return null;

  if (status === "set") {
    return (
      <div className="inline-flex items-center gap-1 text-sm text-sage-700 dark:text-sage-300">
        <span>✓</span>
        <span>Set as your practitioner</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={status === "saving"}
        className="px-3 py-1.5 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
      >
        {status === "saving" ? "Saving…" : "Set as my practitioner"}
      </button>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
