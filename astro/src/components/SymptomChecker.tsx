/**
 * Symptom Checker — React island component.
 * Ported from frontend/app/symptom-checker/page.tsx.
 *
 * Changes from Next.js version:
 *   - Removed Next.js Link imports → plain <a> tags
 *   - Removed DesignSystem wrapper components → inline Tailwind
 *   - Uses apiFetch from @/lib/api-client
 */
import { useState } from "react";
import { apiFetch } from "../lib/api-client";
import type { TcmPatternMatch } from "../lib/grok";

interface FormulaLookupItem {
  id: string | number;
  title: string;
  chineseName?: string;
  pinyinName?: string;
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const [patternLookup, setPatternLookup] = useState<Record<string, string>>({});
  const [formulaLookup, setFormulaLookup] = useState<Map<string, string>>(new Map());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const response = await apiFetch("/api/grok/symptom-analysis", {
        method: "POST",
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setResults(data);

      // Build deep link lookups for patterns and formulas
      if (data.tcmPatterns?.length > 0) {
        Promise.all([
          fetch("/api/formulas").then((r) => r.json()),
        ])
          .then(([formulasData]) => {
            const fLookup = new Map<string, string>();
            for (const f of formulasData.formulas || []) {
              fLookup.set(f.title.toLowerCase(), String(f.id));
              if (f.chineseName) fLookup.set(f.chineseName.toLowerCase(), String(f.id));
              if (f.pinyinName) fLookup.set(f.pinyinName.toLowerCase(), String(f.id));
            }
            setFormulaLookup(fLookup);
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resolveFormulaId = (name: string): string | undefined => {
    return formulaLookup.get(name.toLowerCase());
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-2">
            Describe your symptoms
          </label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-3 border-2 border-earth-200 dark:border-earth-600 rounded-xl focus:ring-2 focus:ring-earth-500/20 focus:border-earth-500 transition bg-white dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500 shadow-sm"
            placeholder="Example: I've been experiencing headaches, fatigue, and trouble sleeping for the past week..."
          />
          <p className="text-xs text-gray-500 dark:text-earth-400 mt-1">
            Minimum 10 characters. Include duration, severity, and any patterns.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || symptoms.trim().length < 10}
          className="w-full bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Symptoms"
          )}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-8 pt-8 border-t border-gray-200 dark:border-earth-700">
          {/* General Analysis */}
          <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-sage-200 dark:border-earth-700 rounded-2xl p-6">
            <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-4">
              AI Recommendations
            </h3>
            <p className="text-gray-700 dark:text-earth-200 whitespace-pre-wrap leading-relaxed">
              {results.analysis || "No analysis available"}
            </p>
          </div>

          {/* TCM Pattern Cards */}
          {results.tcmPatterns?.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-2 flex items-center gap-2">
                ☯ TCM Pattern Differentiation
              </h3>
              <p className="text-sm text-gray-600 dark:text-earth-400 mb-4">
                These TCM patterns may underlie your symptoms:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {results.tcmPatterns.map((pattern: TcmPatternMatch, idx: number) => (
                  <div key={idx} className="border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 bg-amber-50/50 dark:bg-amber-950/20 hover:shadow-md transition">
                    <h4 className="font-bold text-gray-800 dark:text-earth-100 text-base mb-1">
                      {pattern.patternName}
                    </h4>
                    {(pattern.chineseName || pattern.pinyinName) && (
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-serif mb-2">
                        {pattern.chineseName}
                        {pattern.chineseName && pattern.pinyinName && " · "}
                        {pattern.pinyinName && <span className="italic">{pattern.pinyinName}</span>}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-earth-300 mb-3 leading-relaxed">
                      {pattern.matchReason}
                    </p>
                    {pattern.keySymptoms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {pattern.keySymptoms.map((sym, i) => (
                          <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            {sym}
                          </span>
                        ))}
                      </div>
                    )}
                    {pattern.suggestedFormulas?.length > 0 && (
                      <div className="text-xs mb-2">
                        <span className="font-semibold text-gray-500 dark:text-earth-400 uppercase tracking-wide">
                          Formulas:{" "}
                        </span>
                        {pattern.suggestedFormulas.map((name, fi) => {
                          const fId = resolveFormulaId(name);
                          return (
                            <span key={fi}>
                              {fId ? (
                                <a href={`/formulas/${fId}`} className="text-sage-700 dark:text-sage-400 hover:underline font-medium">
                                  {name}
                                </a>
                              ) : (
                                name
                              )}
                              {fi < pattern.suggestedFormulas!.length - 1 ? ", " : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {pattern.suggestedPoints?.length > 0 && (
                      <div className="text-xs mb-2">
                        <span className="font-semibold text-gray-500 dark:text-earth-400 uppercase tracking-wide">
                          Points:{" "}
                        </span>
                        <span className="font-mono text-gray-600 dark:text-earth-300">
                          {pattern.suggestedPoints.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.recommendations && (
            <div>
              <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-4">
                Suggested Modalities & Herbs
              </h3>
              <div className="flex flex-wrap gap-3">
                {results.recommendations.modalities?.map((modality: string, idx: number) => (
                  <span key={`mod-${idx}`} className="px-3 py-1.5 rounded-full bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 text-sm font-medium">
                    🧘 {modality}
                  </span>
                ))}
                {results.recommendations.herbs?.map((herb: string, idx: number) => (
                  <span key={`herb-${idx}`} className="px-3 py-1.5 rounded-full bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 text-sm font-medium">
                    🌿 {herb}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {results.disclaimer && (
            <div className="bg-amber-50 dark:bg-earth-900 border border-amber-200 dark:border-earth-700 rounded-xl p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">{results.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
