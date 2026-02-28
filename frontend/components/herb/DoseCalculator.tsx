'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { DosageComputeResponse } from '@/lib/sympy-compute';

interface DoseCalculatorProps {
  herbName: string;
}

const AGE_GROUPS = [
  { label: 'Adult', value: 30 },
  { label: 'Child (2–12)', value: 7 },
  { label: 'Adolescent (12–18)', value: 15 },
  { label: 'Elderly (65+)', value: 70 },
] as const;

const DOSAGE_FORMS = ['powder', 'tea', 'tincture', 'capsule', 'extract'] as const;

export function DoseCalculator({ herbName }: DoseCalculatorProps) {
  const [weightKg, setWeightKg] = useState('');
  const [useLbs, setUseLbs] = useState(false);
  const [ageGroup, setAgeGroup] = useState(0); // index into AGE_GROUPS
  const [form, setForm] = useState<(typeof DOSAGE_FORMS)[number]>('powder');
  const [result, setResult] = useState<DosageComputeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE !== 'true') return null;

  const weightLabel = useLbs ? 'lbs' : 'kg';

  function toKg(val: string): number {
    const n = parseFloat(val);
    return useLbs ? n * 0.453592 : n;
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const kg = toKg(weightKg);
    if (!kg || kg <= 0 || kg > 500) {
      setError('Please enter a valid weight.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await apiFetch('/api/symbolic-compute', {
        method: 'POST',
        body: JSON.stringify({
          herb_name: herbName,
          body_weight_kg: kg,
          dose_per_kg_mg: 5,
          age_years: AGE_GROUPS[ageGroup].value,
          form,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Calculation failed. Please try again.');
      } else {
        setResult(data as DosageComputeResponse);
      }
    } catch {
      setError('Unable to reach calculation service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-sage-950 dark:to-earth-950 rounded-xl border border-sage-200 dark:border-sage-800 p-5 mt-4">
      <h3 className="text-base font-bold text-earth-800 dark:text-earth-100 mb-4 flex items-center gap-2">
        <span>⚖️</span> Weight-Based Dose Calculator
      </h3>

      <form onSubmit={handleCalculate} className="space-y-3">
        {/* Weight */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={useLbs ? 1000 : 500}
            step="0.1"
            value={weightKg}
            onChange={e => setWeightKg(e.target.value)}
            placeholder={`Weight (${weightLabel})`}
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-earth-200 dark:border-earth-700 rounded-lg bg-white dark:bg-earth-900 text-gray-900 dark:text-earth-100 focus:outline-none focus:ring-2 focus:ring-sage-400"
            required
          />
          <button
            type="button"
            onClick={() => setUseLbs(v => !v)}
            className="px-3 py-2 text-sm font-medium text-earth-600 dark:text-earth-300 bg-earth-100 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg hover:bg-earth-200 dark:hover:bg-earth-700 transition-colors whitespace-nowrap"
          >
            {useLbs ? 'lbs → kg' : 'kg → lbs'}
          </button>
        </div>

        {/* Age Group + Dosage Form */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={ageGroup}
            onChange={e => setAgeGroup(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-earth-200 dark:border-earth-700 rounded-lg bg-white dark:bg-earth-900 text-gray-900 dark:text-earth-100 focus:outline-none focus:ring-2 focus:ring-sage-400"
          >
            {AGE_GROUPS.map((g, i) => (
              <option key={g.label} value={i}>{g.label}</option>
            ))}
          </select>

          <select
            value={form}
            onChange={e => setForm(e.target.value as typeof form)}
            className="px-3 py-2 text-sm border border-earth-200 dark:border-earth-700 rounded-lg bg-white dark:bg-earth-900 text-gray-900 dark:text-earth-100 focus:outline-none focus:ring-2 focus:ring-sage-400"
          >
            {DOSAGE_FORMS.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !weightKg}
          className="w-full py-2 text-sm font-medium bg-sage-600 hover:bg-sage-700 disabled:bg-sage-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating…
            </>
          ) : 'Calculate Dose'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="mt-4 bg-white dark:bg-earth-900 rounded-lg border border-sage-200 dark:border-sage-800 p-4 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-earth-500 dark:text-earth-400 uppercase tracking-wide mb-1">Daily Dose</p>
              <p className="text-lg font-bold text-gray-900 dark:text-earth-100">
                {result.daily_dose_mg.toFixed(0)} <span className="text-sm font-normal">mg</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-earth-500 dark:text-earth-400 uppercase tracking-wide mb-1">Per Dose</p>
              <p className="text-lg font-bold text-gray-900 dark:text-earth-100">
                {result.per_dose_mg.toFixed(0)} <span className="text-sm font-normal">mg</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-earth-500 dark:text-earth-400 uppercase tracking-wide mb-1">Doses/Day</p>
              <p className="text-lg font-bold text-gray-900 dark:text-earth-100">{result.doses_per_day}×</p>
            </div>
          </div>

          <div className={`text-center text-xs font-semibold px-3 py-1.5 rounded-full mt-2 ${
            result.within_safety_limits
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }`}>
            {result.within_safety_limits ? 'Within standard safety limits' : 'Exceeds standard safety limits — consult practitioner'}
          </div>

          <p className="text-xs text-earth-400 dark:text-earth-500 text-center pt-1">
            Estimate only. Always consult a qualified practitioner.
          </p>
        </div>
      )}
    </div>
  );
}
