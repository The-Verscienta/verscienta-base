/**
 * Herb-Drug Interaction Checker — React island.
 *
 * Two-panel input:
 *   • Medications (free text, comma/newline separated)
 *   • Herbs (autocomplete-from-Meilisearch, multi-select chips)
 *
 * Posts to /api/grok/herb-drug-check, renders severity-coded results.
 */
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api-client";

interface HerbHit {
  id?: number;
  title: string;
  scientific_name?: string;
  slug?: string;
  url?: string;
}

interface InteractionResult {
  herb: string;
  medication: string;
  severity: "none" | "mild" | "moderate" | "severe";
  description: string;
  mechanism?: string;
  recommendation: string;
}

interface CheckResponse {
  interactions: InteractionResult[];
  generalAdvice: string;
  disclaimer: string;
}

const SEVERITY_ORDER: Record<InteractionResult["severity"], number> = {
  severe: 0,
  moderate: 1,
  mild: 2,
  none: 3,
};

const SEVERITY_STYLE: Record<InteractionResult["severity"], { card: string; badge: string; label: string; icon: string }> = {
  severe: {
    card: "border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30",
    badge: "bg-red-600 text-white",
    label: "Severe — Avoid",
    icon: "⛔",
  },
  moderate: {
    card: "border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30",
    badge: "bg-amber-600 text-white",
    label: "Moderate — Monitor",
    icon: "⚠",
  },
  mild: {
    card: "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20",
    badge: "bg-blue-600 text-white",
    label: "Mild",
    icon: "ℹ",
  },
  none: {
    card: "border-gray-200 dark:border-earth-700 bg-white dark:bg-earth-900",
    badge: "bg-gray-500 text-white",
    label: "No significant interaction",
    icon: "✓",
  },
};

interface AutocompleteHit {
  id?: string | number;
  primary: string;
  secondary?: string;
}

interface AutocompleteProps {
  onAdd: (name: string) => void;
  exclude: Set<string>;
  placeholder: string;
  fetcher: (query: string) => Promise<AutocompleteHit[]>;
  helperText?: string;
}

function GenericAutocomplete({ onAdd, exclude, placeholder, fetcher, helperText }: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AutocompleteHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetcher(query);
        setHits(results.filter((h) => !exclude.has(h.primary.toLowerCase())));
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setHits([]);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, exclude, fetcher]);

  function pick(hit: AutocompleteHit) {
    onAdd(hit.primary);
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        e.preventDefault();
        onAdd(query.trim());
        setQuery("");
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) pick(hits[activeIdx]);
      else if (query.trim().length >= 2) {
        onAdd(query.trim());
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-500"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-earth-800 border border-gray-200 dark:border-earth-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {hits.map((h, i) => (
            <li
              key={String(h.id ?? h.primary)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(h);
              }}
              className={`px-3 py-2 cursor-pointer text-sm border-b last:border-b-0 border-gray-100 dark:border-earth-700 ${
                i === activeIdx ? "bg-sage-50 dark:bg-earth-700" : "hover:bg-gray-50 dark:hover:bg-earth-700"
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-earth-100">{h.primary}</div>
              {h.secondary && <div className="text-xs italic text-gray-500 dark:text-earth-400">{h.secondary}</div>}
            </li>
          ))}
        </ul>
      )}
      {helperText && <p className="mt-1 text-xs text-gray-500 dark:text-earth-400">{helperText}</p>}
    </div>
  );
}

async function fetchHerbHits(query: string): Promise<AutocompleteHit[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=herb&limit=8`);
  const data = await res.json();
  return (data.hits || []).map((h: any) => ({
    id: h.id,
    primary: h.title,
    secondary: h.scientific_name,
  }));
}

async function fetchDrugHits(query: string): Promise<AutocompleteHit[]> {
  const res = await fetch(`/api/rxnorm/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
  const data = await res.json();
  return (data.results || []).map((d: any) => ({
    id: d.rxcui,
    primary: d.name,
  }));
}

export default function HerbDrugChecker() {
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [selectedHerbs, setSelectedHerbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "auth" | "error">("idle");

  // Detect auth status (best-effort) — we use it to hide the Save button for guests
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAuthed(!!d.user?.id))
      .catch(() => setIsAuthed(false));
  }, []);

  const excludeMeds = new Set(selectedMeds.map((m) => m.toLowerCase()));
  const excludeHerbs = new Set(selectedHerbs.map((h) => h.toLowerCase()));

  function addMed(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedMeds.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return;
    if (selectedMeds.length >= 20) return;
    setSelectedMeds([...selectedMeds, trimmed]);
  }

  function removeMed(name: string) {
    setSelectedMeds(selectedMeds.filter((m) => m !== name));
  }

  function addHerb(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedHerbs.some((h) => h.toLowerCase() === trimmed.toLowerCase())) return;
    if (selectedHerbs.length >= 20) return;
    setSelectedHerbs([...selectedHerbs, trimmed]);
  }

  function removeHerb(name: string) {
    setSelectedHerbs(selectedHerbs.filter((h) => h !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/grok/herb-drug-check", {
        method: "POST",
        body: JSON.stringify({
          medications: selectedMeds.join(", "),
          herbs: selectedHerbs.length > 0 ? selectedHerbs : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function saveReport() {
    if (!result || saveState === "saving") return;
    setSaveState("saving");
    try {
      const sortedInteractions = [...result.interactions].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      );
      const sevSummary = (["severe", "moderate", "mild"] as const)
        .map((s) => {
          const n = sortedInteractions.filter((i) => i.severity === s).length;
          return n > 0 ? `${n} ${s}` : null;
        })
        .filter(Boolean)
        .join(", ");
      const summary = sortedInteractions.length === 0
        ? `No interactions identified across ${selectedMeds.length} medication${selectedMeds.length === 1 ? "" : "s"}`
        : `${sortedInteractions.length} interaction${sortedInteractions.length === 1 ? "" : "s"}: ${sevSummary}`;
      const title = `Drug check — ${selectedMeds.slice(0, 3).join(", ")}${selectedMeds.length > 3 ? ` +${selectedMeds.length - 3}` : ""}`;
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "interaction_check",
          title,
          summary,
          data: {
            medications: selectedMeds,
            herbs: selectedHerbs,
            result,
          },
        }),
      });
      if (res.status === 401) {
        setSaveState("auth");
        return;
      }
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function copyReport() {
    if (!result) return;
    const lines: string[] = ["Herb–Drug Interaction Report", "=".repeat(40), ""];
    if (selectedMeds.length > 0) lines.push(`Medications: ${selectedMeds.join(", ")}`);
    if (selectedHerbs.length > 0) lines.push(`Herbs: ${selectedHerbs.join(", ")}`);
    lines.push("");
    if (result.interactions.length === 0) {
      lines.push("No clinically significant interactions identified.");
    } else {
      const sorted = [...result.interactions].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
      for (const i of sorted) {
        lines.push(`[${i.severity.toUpperCase()}] ${i.herb} × ${i.medication}`);
        lines.push(`  ${i.description}`);
        if (i.mechanism) lines.push(`  Mechanism: ${i.mechanism}`);
        lines.push(`  Recommendation: ${i.recommendation}`);
        lines.push("");
      }
    }
    if (result.generalAdvice) {
      lines.push("General advice:", result.generalAdvice, "");
    }
    if (result.disclaimer) {
      lines.push(result.disclaimer);
    }
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
  }

  const sortedInteractions = result
    ? [...result.interactions].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    : [];

  const severityCounts = sortedInteractions.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-2">
            Medications
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-earth-400">(prescription, OTC, supplements — RxNorm-powered search)</span>
          </label>
          {selectedMeds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedMeds.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                  {m}
                  <button
                    type="button"
                    onClick={() => removeMed(m)}
                    aria-label={`Remove ${m}`}
                    className="text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <GenericAutocomplete
            onAdd={addMed}
            exclude={excludeMeds}
            placeholder="Type a medication name (e.g., warfarin, metformin, lisinopril)…"
            fetcher={fetchDrugHits}
            helperText={
              "Press Enter to add a custom name not in RxNorm (e.g., a brand-only product)."
            }
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-2">
            Herbs you're taking or considering
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-earth-400">(optional — leave empty to scan common herbs)</span>
          </label>
          {selectedHerbs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedHerbs.map((h) => (
                <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 text-sm">
                  {h}
                  <button
                    type="button"
                    onClick={() => removeHerb(h)}
                    aria-label={`Remove ${h}`}
                    className="text-sage-600 hover:text-red-600 dark:text-sage-400 dark:hover:text-red-400 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <GenericAutocomplete
            onAdd={addHerb}
            exclude={excludeHerbs}
            placeholder="Type to search herbs (e.g., ginger, ginseng, gan cao)…"
            fetcher={fetchHerbHits}
            helperText="Press Enter to add a custom name not in the database."
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || selectedMeds.length === 0}
          className="w-full bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing interactions…
            </>
          ) : (
            "Check Interactions"
          )}
        </button>
      </form>

      {result && (
        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-earth-700">
          {/* Summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["severe", "moderate", "mild", "none"] as const).map((sev) =>
                severityCounts[sev] ? (
                  <span key={sev} className={`text-xs px-2.5 py-1 rounded-full font-medium ${SEVERITY_STYLE[sev].badge}`}>
                    {severityCounts[sev]} {SEVERITY_STYLE[sev].label.split(" — ")[0]}
                  </span>
                ) : null
              )}
              {sortedInteractions.length === 0 && (
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  ✓ No clinically significant interactions identified
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {sortedInteractions.length > 0 && (
                <button
                  type="button"
                  onClick={copyReport}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-earth-600 text-gray-700 dark:text-earth-200 hover:bg-gray-50 dark:hover:bg-earth-800 transition"
                >
                  Copy report
                </button>
              )}
              {isAuthed && (
                <button
                  type="button"
                  onClick={saveReport}
                  disabled={saveState === "saving" || saveState === "saved"}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${
                    saveState === "saved"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-sage-600 hover:bg-sage-700 text-white disabled:opacity-60"
                  }`}
                >
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved to dashboard" : "Save to dashboard"}
                </button>
              )}
              {isAuthed === false && sortedInteractions.length > 0 && (
                <a
                  href="/login?redirect=/tools/herb-drug-interactions"
                  className="text-sm px-3 py-1.5 rounded-lg border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-earth-800 transition"
                >
                  Sign in to save
                </a>
              )}
            </div>
            {saveState === "error" && (
              <p className="text-xs text-red-600 dark:text-red-400 ml-2">Couldn't save. Try again.</p>
            )}
          </div>

          {/* Interaction cards */}
          {sortedInteractions.length > 0 && (
            <div className="space-y-3">
              {sortedInteractions.map((i, idx) => {
                const style = SEVERITY_STYLE[i.severity];
                return (
                  <div key={idx} className={`rounded-xl border-2 p-5 ${style.card}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-earth-100">
                          {i.herb} <span className="text-gray-400 mx-1">×</span> {i.medication}
                        </h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${style.badge} flex items-center gap-1`}>
                        <span aria-hidden="true">{style.icon}</span> {style.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-earth-200 leading-relaxed mb-3">{i.description}</p>
                    {i.mechanism && (
                      <div className="text-xs text-gray-600 dark:text-earth-300 mb-2 bg-white/60 dark:bg-earth-900/60 rounded-lg p-2.5 border border-gray-100 dark:border-earth-700">
                        <span className="font-semibold uppercase tracking-wide text-gray-500 dark:text-earth-400">Mechanism:</span>{" "}
                        {i.mechanism}
                      </div>
                    )}
                    <div className="text-sm text-gray-700 dark:text-earth-200">
                      <span className="font-semibold">Recommendation:</span> {i.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {result.generalAdvice && (
            <div className="bg-sage-50 dark:bg-earth-900 border border-sage-200 dark:border-earth-700 rounded-xl p-4">
              <h4 className="font-semibold text-sage-800 dark:text-sage-300 mb-1 text-sm uppercase tracking-wide">General advice</h4>
              <p className="text-sm text-gray-700 dark:text-earth-200 leading-relaxed">{result.generalAdvice}</p>
            </div>
          )}

          {result.disclaimer && (
            <p className="text-xs text-gray-500 dark:text-earth-400 italic leading-relaxed">{result.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  );
}
