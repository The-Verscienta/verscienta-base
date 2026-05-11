import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { imageUrl } from "@/lib/image-url";
import type { ProfileUser } from "./ProfilePanel";

interface Props {
  user: ProfileUser;
  refreshUser: () => Promise<void>;
  onSessionExpired: () => void;
}

type Status = "idle" | "saving" | "success" | "error";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export default function AvatarSection({ user, refreshUser, onSessionExpired }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(t);
  }, [status]);

  const upload = async (file: File) => {
    setMessage("");
    if (!ALLOWED.includes(file.type)) {
      setStatus("error");
      setMessage("Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMessage("File too large (max 2MB).");
      return;
    }
    setStatus("saving");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiFetch("/api/auth/avatar", { method: "POST", body: fd });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Upload failed.");
        return;
      }
      await refreshUser();
      setStatus("success");
      setMessage("Avatar updated.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const remove = async () => {
    setMessage("");
    setStatus("saving");
    try {
      const res = await apiFetch("/api/auth/avatar", { method: "DELETE" });
      if (res.status === 401) { onSessionExpired(); return; }
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to remove.");
        return;
      }
      await refreshUser();
      setStatus("success");
      setMessage("Avatar removed.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-earth-100 mb-4">Avatar</h2>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-earth-100 dark:bg-earth-800 flex items-center justify-center">
          {user.avatar ? (
            <img src={imageUrl(user.avatar, { width: 160, height: 160 })} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-earth-400">{(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept={ALLOWED.join(",")} onChange={handleFile} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "saving"}
            className="px-3 py-1.5 text-sm bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            {user.avatar ? "Change photo" : "Upload photo"}
          </button>
          {user.avatar && (
            <button
              type="button"
              onClick={remove}
              disabled={status === "saving"}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-lg transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {message && (
        <p className={`mt-3 text-sm rounded-lg p-2 ${
            status === "error"
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          }`}>
          {message}
        </p>
      )}
    </section>
  );
}
