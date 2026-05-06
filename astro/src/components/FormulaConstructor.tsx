/**
 * FormulaConstructor — Pro tool. Generates a custom herbal formula from a
 * patient case description. Calls /api/grok/formula-constructor.
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api-client";

const TRADITIONS = ["TCM", "Western", "Ayurvedic", "Integrative"] as const;
const FORMS = ["decoction", "tincture", "powder", "tea", "capsule"] as const;

type Tradition = (typeof TRADITIONS)[number];
type FormChoice = (typeof FORMS)[number];

interface Ingredient {
  name: string;
  scientific_name?: string;
  pinyin?: string;
  role: string;
  amount: string;
  rationale: string;
}

interface ConstructedFormula {
  formulaName: string;
  tradition: string;
  pattern?: string;
  presentation: string;
  ingredients: Ingredient[];
  preparation: string;
  dosage: string;
  duration: string;
  modifications?: Array<{ for: string; change: string }>;
  contraindications: string[];
  cautions: string[];
  rationale: string;
  disclaimer: string;
}

const ROLE_COLORS: Record<string, string> = {
  chief: "bg-amber-100 text-amber-700 border-amber-200",
  deputy: "bg-blue-100 text-blue-700 border-blue-200",
  assistant: "bg-green-100 text-green-700 border-green-200",
  envoy: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function FormulaConstructor() {
  const [presentation, setPresentation] = useState("");
  const [tradition, setTradition] = useState<Tradition>("TCM");
  const [pattern, setPattern] = useState("");
  const [preferredForm, setPreferredForm] = useState<FormChoice | "">("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [pregnant, setPregnant] = useState(false);
  const [breastfeeding, setBreastfeeding] = useState(false);
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [excludedHerbs, setExcludedHerbs] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formula, setFormula] = useState<ConstructedFormula | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setSaveState("idle");
  }, [formula]);

  function splitList(s: string): string[] {
    return s
      .split(/[,\n]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFormula(null);
    setLoading(true);
    try {
      const ageNum = age ? Number(age) : undefined;
      const payload: any = {
        presentation: presentation.trim(),
        tradition,
      };
      if (pattern.trim()) payload.pattern = pattern.trim();
      if (preferredForm) payload.preferredForm = preferredForm;
      const patient: any = {};
      if (ageNum && Number.isFinite(ageNum)) patient.age = ageNum;
      if (sex) patient.sex = sex;
      if (pregnant) patient.pregnant = true;
      if (breastfeeding) patient.breastfeeding = true;
      const cList = splitList(conditions);
      const mList = splitList(medications);
      const aList = splitList(allergies);
      if (cList.length) patient.conditions = cList;
      if (mList.length) patient.medications = mList;
      if (aList.length) patient.allergies = aList;
      if (Object.keys(patient).length > 0) payload.patient = patient;
      const eList = splitList(excludedHerbs);
      if (eList.length) payload.excludedHerbs = eList;

      const res = await apiFetch("/api/grok/formula-constructor", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to construct formula");
      setFormula(data.formula);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function saveReport() {
    if (!formula || saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "other",
          title: `Constructed: ${formula.formulaName}`,
          summary: formula.presentation || formula.rationale.slice(0, 240),
          data: { kind: "formula_construction", input: { presentation, tradition, pattern }, formula },
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

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6">
        <div>
          <label htmlFor="presentation" className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
            Case presentation <span className="text-red-500">*</span>
          </label>
          <textarea
            id="presentation"
            required
            rows={4}
            value={presentation}
            onChange={(e) => setPresentation(e.target.value)}
            placeholder="e.g., 42yo female, 6 months of cyclical fatigue, cold extremities, scant pale menses, vivid dreams. Tongue: pale with thin white coat. Pulse: thin and slightly slow."
            className="w-full px-4 py-3 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Tradition</label>
            <select
              value={tradition}
              onChange={(e) => setTradition(e.target.value as Tradition)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            >
              {TRADITIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Preferred form</label>
            <select
              value={preferredForm}
              onChange={(e) => setPreferredForm(e.target.value as FormChoice | "")}
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            >
              <option value="">No preference</option>
              {FORMS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">Pattern / Diagnosis (optional)</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g., Spleen Qi Deficiency"
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            />
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer font-semibold text-sm text-gray-700 dark:text-earth-300 select-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▸</span> Patient context (optional but improves safety)
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="0"
                  max="130"
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
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-earth-300">
                <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} />
                Pregnant
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-earth-300">
                <input type="checkbox" checked={breastfeeding} onChange={(e) => setBreastfeeding(e.target.checked)} />
                Breastfeeding
              </label>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Conditions</label>
                <textarea
                  rows={2}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="One per line or comma-separated"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Medications</label>
                <textarea
                  rows={2}
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="One per line or comma-separated"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Allergies</label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="One per line or comma-separated"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Exclude these herbs</label>
              <textarea
                rows={2}
                value={excludedHerbs}
                onChange={(e) => setExcludedHerbs(e.target.value)}
                placeholder="One per line or comma-separated"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
          </div>
        </details>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || presentation.trim().length < 10}
          className="w-full bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Constructing formula…
            </>
          ) : (
            "Construct Formula"
          )}
        </button>
      </form>

      {formula && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 border border-sage-200 dark:border-earth-700 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-earth-100">{formula.formulaName}</h2>
                <p className="text-sm text-sage-700 dark:text-sage-400 mt-0.5">
                  {formula.tradition}
                  {formula.pattern && ` · ${formula.pattern}`}
                </p>
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
            <p className="text-gray-700 dark:text-earth-200 mt-3 leading-relaxed">{formula.presentation}</p>
          </div>

          <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sage-50 dark:bg-earth-800 border-b border-gray-200 dark:border-earth-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-earth-400">Herb</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-earth-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-earth-400">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-earth-400">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {formula.ingredients.map((ing, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-earth-800 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-earth-100">{ing.name}</div>
                      <div className="text-xs text-gray-500 dark:text-earth-400 italic">
                        {[ing.scientific_name, ing.pinyin].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-earth-300 whitespace-nowrap font-mono text-xs">{ing.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[ing.role.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
                        {ing.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-earth-300 text-xs">{ing.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Preparation</h3>
              <p className="text-sm text-gray-700 dark:text-earth-200 leading-relaxed">{formula.preparation}</p>
            </div>
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-2">Dosage & Duration</h3>
              <p className="text-sm text-gray-700 dark:text-earth-200">{formula.dosage}</p>
              <p className="text-sm text-gray-500 dark:text-earth-400 mt-2 italic">{formula.duration}</p>
            </div>
          </div>

          {formula.modifications && formula.modifications.length > 0 && (
            <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-3">加减 Modifications</h3>
              <ul className="space-y-2">
                {formula.modifications.map((mod, idx) => (
                  <li key={idx} className="text-sm">
                    <strong className="text-sage-700 dark:text-sage-300">If {mod.for}:</strong>{" "}
                    <span className="text-gray-700 dark:text-earth-200">{mod.change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formula.contraindications.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">⛔ Contraindications</h3>
              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                {formula.contraindications.map((c, idx) => <li key={idx}>{c}</li>)}
              </ul>
            </div>
          )}

          {formula.cautions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">⚠ Cautions & Monitoring</h3>
              <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                {formula.cautions.map((c, idx) => <li key={idx}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-sage-50 dark:bg-earth-900 border border-sage-200 dark:border-earth-700 rounded-xl p-5">
            <h3 className="font-semibold text-sage-800 dark:text-sage-300 mb-2">Clinical Rationale</h3>
            <p className="text-sm text-gray-700 dark:text-earth-200 leading-relaxed whitespace-pre-wrap">{formula.rationale}</p>
          </div>

          <p className="text-xs text-gray-500 dark:text-earth-400 italic">{formula.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
