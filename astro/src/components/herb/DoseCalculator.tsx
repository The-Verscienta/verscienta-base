/**
 * Dose Calculator — React island for herb detail pages.
 * Calls /api/symbolic-compute for weight-based dosage math.
 * Ported from frontend/components/herb/DoseCalculator.tsx.
 */
import { useState } from "react";
import { apiFetch } from "../../lib/api-client";

interface DoseCalculatorProps {
  herbName: string;
}

const AGE_GROUPS = [
  { label: "Adult (18-64)", weight: 70 },
  { label: "Child (2-12)", weight: 25 },
  { label: "Adolescent (12-18)", weight: 50 },
  { label: "Elderly (65+)", weight: 60 },
];

const FORMS = ["powder", "tea", "tincture", "capsule", "extract", "decoction"] as const;

export default function DoseCalculator({ herbName }: DoseCalculatorProps) {
  const [weight, setWeight] = useState(70);
  const [useKg, setUseKg] = useState(true);
  const [dosePerKg, setDosePerKg] = useState(5);
  const [form, setForm] = useState<string>("powder");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const weightKg = useKg ? weight : weight * 0.453592;

    try {
      const res = await apiFetch("/api/symbolic-compute", {
        method: "POST",
        body: JSON.stringify({
          herb_name: herbName,
          body_weight_kg: weightKg,
          dose_per_kg_mg: dosePerKg,
          form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calculation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6">
      <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-earth-100 mb-4 flex items-center gap-2">
        ⚖️ Dosage Calculator
      </h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-1">
            Body Weight ({useKg ? "kg" : "lbs"})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              min={1}
              max={500}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
            />
            <button
              onClick={() => {
                setUseKg(!useKg);
                setWeight(Math.round(useKg ? weight * 2.20462 : weight * 0.453592));
              }}
              className="px-3 py-2 text-xs border border-gray-200 dark:border-earth-600 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800 transition"
            >
              {useKg ? "→ lbs" : "→ kg"}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-1">Form</label>
          <select
            value={form}
            onChange={(e) => setForm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500"
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {AGE_GROUPS.map((g) => (
          <button key={g.label} onClick={() => setWeight(g.weight)} className="text-xs px-3 py-1.5 rounded-full bg-sage-100 dark:bg-earth-800 text-sage-700 dark:text-sage-300 hover:bg-sage-200 transition">
            {g.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition disabled:opacity-50"
      >
        {loading ? "Calculating..." : "Calculate Dosage"}
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {result && (
        <div className="mt-4 bg-sage-50 dark:bg-earth-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500 dark:text-earth-400">Daily dose:</span> <span className="font-bold text-gray-900 dark:text-earth-100">{result.daily_dose_mg} mg</span></div>
            {result.per_dose_mg && <div><span className="text-gray-500 dark:text-earth-400">Per dose:</span> <span className="font-bold">{result.per_dose_mg} mg</span></div>}
            {result.doses_per_day && <div><span className="text-gray-500 dark:text-earth-400">Doses/day:</span> <span className="font-bold">{result.doses_per_day}</span></div>}
          </div>
          <p className="text-xs text-gray-500 dark:text-earth-400 mt-3">
            This is a mathematical estimate. Always consult a practitioner for personalized dosing.
          </p>
        </div>
      )}
    </div>
  );
}
