/**
 * SafetyCheck — Pro tool. Evaluates whether a specific herb or formula is
 * safe for a specific patient context.
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api-client";

interface Triggered {
  issue: string;
  severity: "mild" | "moderate" | "severe";
  mechanism?: string;
  recommendation: string;
}

interface SafetyResult {
  verdict: "safe" | "caution" | "avoid";
  headline: string;
  triggered: Triggered[];
  doseAdjustments?: string[];
  alternatives?: Array<{ name: string; rationale: string }>;
  monitoring?: string[];
  notes: string;
  disclaimer: string;
}

const VERDICT_STYLE: Record<SafetyResult["verdict"], { bg: string; pill: string; icon: string; label: string }> = {
  safe: {
    bg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    pill: "bg-green-600 text-white",
    icon: "✓",
    label: "Safe",
  },
  caution: {
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    pill: "bg-amber-600 text-white",
    icon: "⚠",
    label: "Caution",
  },
  avoid: {
    bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    pill: "bg-red-600 text-white",
    icon: "⛔",
    label: "Avoid",
  },
};

const SEV_PILL: Record<Triggered["severity"], string> = {
  severe: "bg-red-600 text-white",
  moderate: "bg-amber-600 text-white",
  mild: "bg-blue-600 text-white",
};

export default function SafetyCheck() {
  const [kind, setKind] = useState<"herb" | "formula">("herb");
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [pregnant, setPregnant] = useState(false);
  const [breastfeeding, setBreastfeeding] = useState(false);
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [concerns, setConcerns] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setSaveState("idle");
  }, [result]);

  function splitList(s: string): string[] {
    return s.split(/[,\n]+/).map((x) => x.trim()).filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const subject: any = { kind, name: name.trim() };
      if (kind === "formula") {
        const ing = splitList(ingredients);
        if (ing.length) subject.ingredients = ing;
      }
      const patient: any = {};
      const ageNum = age ? Number(age) : undefined;
      if (ageNum && Number.isFinite(ageNum)) {
        patient.age = ageNum;
        if (ageNum < 18) patient.pediatric = true;
        if (ageNum >= 65) patient.geriatric = true;
      }
      if (sex) patient.sex = sex;
      if (pregnant) patient.pregnant = true;
      if (breastfeeding) patient.breastfeeding = true;
      const c = splitList(conditions);
      const m = splitList(medications);
      const a = splitList(allergies);
      if (c.length) patient.conditions = c;
      if (m.length) patient.medications = m;
      if (a.length) patient.allergies = a;

      const payload: any = { subject, patient };
      const cn = splitList(concerns);
      if (cn.length) payload.concerns = cn;

      const res = await apiFetch("/api/grok/safety-check", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate safety");
      setResult(data.result);
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
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "other",
          title: `Safety: ${name} → ${VERDICT_STYLE[result.verdict].label}`,
          summary: result.headline,
          data: { kind: "safety_check", subject: { kind, name }, result },
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

  const style = result ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Subject type</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "herb" | "formula")}
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            >
              <option value="herb">Herb</option>
              <option value="formula">Formula</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
              {kind === "herb" ? "Herb name" : "Formula name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
              placeholder={kind === "herb" ? "e.g., Glycyrrhiza uralensis" : "e.g., Liu Wei Di Huang Wan"}
            />
          </div>
        </div>

        {kind === "formula" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Ingredients (optional)</label>
            <textarea
              rows={2}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="One per line or comma-separated"
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
            />
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-earth-700 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-earth-300 mb-3">Patient context</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="130"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Sex</label>
              <input
                type="text"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-earth-300">
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} />
              Pregnant
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-earth-300">
              <input type="checkbox" checked={breastfeeding} onChange={(e) => setBreastfeeding(e.target.checked)} />
              Breastfeeding
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Conditions</label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g., HTN, type 2 DM"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Medications</label>
              <textarea
                rows={2}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="e.g., warfarin, lisinopril"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Allergies</label>
              <textarea
                rows={2}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g., ragweed, sulfa"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Specific concerns (optional)</label>
          <textarea
            rows={2}
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="One per line. e.g., Hepatotoxicity risk; Interaction with apixaban"
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || name.trim().length < 1}
          className="w-full bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Evaluating safety…
            </>
          ) : (
            "Run Safety Check"
          )}
        </button>
      </form>

      {result && style && (
        <div className="space-y-5">
          <div className={`rounded-2xl border-2 p-6 ${style.bg}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-bold ${style.pill}`}>
                  {style.icon} {style.label}
                </span>
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-earth-100">{result.headline}</h2>
              </div>
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
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save to dashboard"}
              </button>
            </div>
          </div>

          {result.triggered.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100">Triggered concerns</h3>
              {result.triggered.map((t, idx) => (
                <div key={idx} className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-earth-100">{t.issue}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV_PILL[t.severity]}`}>
                      {t.severity}
                    </span>
                  </div>
                  {t.mechanism && (
                    <p className="text-xs text-gray-600 dark:text-earth-400 mb-2 bg-gray-50 dark:bg-earth-950/40 rounded-lg p-2">
                      <span className="font-semibold uppercase tracking-wide">Mechanism:</span> {t.mechanism}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-earth-200">
                    <span className="font-semibold">Recommendation:</span> {t.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.doseAdjustments && result.doseAdjustments.length > 0 && (
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Dose adjustments</h3>
              <ul className="text-sm text-gray-700 dark:text-earth-200 list-disc list-inside space-y-1">
                {result.doseAdjustments.map((d, idx) => <li key={idx}>{d}</li>)}
              </ul>
            </div>
          )}

          {result.monitoring && result.monitoring.length > 0 && (
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Monitoring</h3>
              <ul className="text-sm text-gray-700 dark:text-earth-200 list-disc list-inside space-y-1">
                {result.monitoring.map((m, idx) => <li key={idx}>{m}</li>)}
              </ul>
            </div>
          )}

          {result.alternatives && result.alternatives.length > 0 && (
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-3">Alternatives</h3>
              <ul className="space-y-2">
                {result.alternatives.map((a, idx) => (
                  <li key={idx} className="text-sm">
                    <strong className="text-sage-700 dark:text-sage-300">{a.name}</strong> — {a.rationale}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-sage-50 dark:bg-earth-900 border border-sage-200 dark:border-earth-700 rounded-xl p-5">
            <h3 className="font-semibold text-sage-800 dark:text-sage-300 mb-2">Notes</h3>
            <p className="text-sm text-gray-700 dark:text-earth-200 leading-relaxed whitespace-pre-wrap">{result.notes}</p>
          </div>

          <p className="text-xs text-gray-500 dark:text-earth-400 italic">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
