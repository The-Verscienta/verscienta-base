/**
 * Explain Formula button + modal — React island.
 *
 * Sits on the formula detail page. Sends the formula's composition to
 * /api/grok/explain-formula along with a chosen audience (patient / student /
 * practitioner) and renders the AI-generated explanation in a modal.
 */
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api-client";

type Audience = "patient" | "student" | "practitioner";

interface FormulaHerb {
  name: string;
  role?: string;
  amount?: string;
}

interface Props {
  formulaName: string;
  description?: string;
  herbs: FormulaHerb[];
}

const AUDIENCES: { value: Audience; label: string; tagline: string }[] = [
  { value: "patient", label: "Patient", tagline: "Plain language, no jargon" },
  { value: "student", label: "Student", tagline: "Educational, with TCM theory" },
  { value: "practitioner", label: "Practitioner", tagline: "Clinical, mechanism-rich" },
];

export default function ExplainFormulaButton({ formulaName, description, herbs }: Props) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>("patient");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAuthed(!!d.user?.id))
      .catch(() => setIsAuthed(false));
  }, []);

  // Cache results per audience so toggling doesn't re-call the API
  const cacheRef = useRef<Partial<Record<Audience, string>>>({});

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function load(forAudience: Audience) {
    setError("");
    if (cacheRef.current[forAudience]) {
      setExplanation(cacheRef.current[forAudience]!);
      return;
    }
    setLoading(true);
    setStreaming(true);
    setExplanation("");
    try {
      const res = await apiFetch("/api/grok/explain-formula-stream", {
        method: "POST",
        body: JSON.stringify({ formulaName, description, herbs, audience: forAudience }),
      });

      // If the server returned an error JSON instead of a stream, surface it.
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to generate explanation");
      }
      if (!res.body) {
        throw new Error("Streaming not supported in this browser");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // Loading spinner stops as soon as first chunk arrives — streaming UI takes over
      setLoading(false);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          acc += chunk;
          setExplanation(acc);
        }
      }
      cacheRef.current[forAudience] = acc;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  function openModal() {
    setOpen(true);
    if (!cacheRef.current[audience]) load(audience);
    else setExplanation(cacheRef.current[audience]!);
  }

  function pickAudience(a: Audience) {
    setAudience(a);
    if (cacheRef.current[a]) setExplanation(cacheRef.current[a]!);
    else load(a);
  }

  function copyExplanation() {
    if (!explanation) return;
    navigator.clipboard?.writeText(explanation).catch(() => {});
  }

  async function saveExplanation() {
    if (!explanation || saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "formula_explanation",
          title: `${formulaName} (${audience})`,
          summary: explanation.slice(0, 240),
          data: { formulaName, audience, herbs, description, explanation },
        }),
      });
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  // Reset save state when audience changes (each audience is a different report)
  useEffect(() => {
    setSaveState("idle");
  }, [audience]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Explain this formula
        <span className="text-xs px-1.5 py-0.5 rounded bg-white/20 font-semibold">AI</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explain-title"
            className="relative bg-white dark:bg-earth-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-earth-700">
              <div>
                <h2 id="explain-title" className="font-serif text-xl font-bold text-gray-900 dark:text-earth-100">
                  {formulaName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-earth-400 mt-0.5">AI-generated explanation</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-700 dark:hover:text-earth-200 text-2xl leading-none p-1 -m-1"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 dark:border-earth-700">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Audience">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    role="tab"
                    aria-selected={audience === a.value}
                    onClick={() => pickAudience(a.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      audience === a.value
                        ? "bg-sage-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-earth-800 text-gray-700 dark:text-earth-300 hover:bg-gray-200 dark:hover:bg-earth-700"
                    }`}
                    title={a.tagline}
                  >
                    {a.label}
                  </button>
                ))}
                <span className="text-xs text-gray-500 dark:text-earth-400 self-center ml-1">
                  {AUDIENCES.find((a) => a.value === audience)?.tagline}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading && !explanation && (
                <div className="flex items-center gap-3 text-gray-500 dark:text-earth-400">
                  <span className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
                  Generating explanation…
                </div>
              )}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {!error && explanation && (
                <div className="prose prose-earth dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-earth-200 leading-relaxed">
                  {explanation}
                  {streaming && (
                    <span className="inline-block w-1.5 h-[1.1em] align-text-bottom ml-0.5 bg-sage-500 animate-pulse" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 dark:border-earth-700">
              <p className="text-xs text-gray-500 dark:text-earth-400 italic">
                Educational only. Always consult a qualified practitioner before using herbal formulas.
              </p>
              <div className="flex gap-2 flex-wrap">
                {explanation && !streaming && (
                  <button
                    type="button"
                    onClick={copyExplanation}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-earth-600 text-gray-700 dark:text-earth-200 hover:bg-gray-50 dark:hover:bg-earth-800 transition"
                  >
                    Copy
                  </button>
                )}
                {explanation && !streaming && isAuthed && (
                  <button
                    type="button"
                    onClick={saveExplanation}
                    disabled={saveState === "saving" || saveState === "saved"}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      saveState === "saved"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-sage-600 hover:bg-sage-700 text-white disabled:opacity-60"
                    }`}
                  >
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-sage-600 hover:bg-sage-700 text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
