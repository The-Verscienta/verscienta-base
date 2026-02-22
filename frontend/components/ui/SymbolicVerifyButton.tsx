'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LatexEquation } from '@/components/ui/LatexEquation';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api-client';
import { useSymbolicVerification } from '@/hooks/useSymbolicVerification';
import type { VerificationPayload } from '@/hooks/useSymbolicVerification';
import { track } from '@/lib/analytics';

interface SymbolicVerifyButtonProps {
  herbId: string;
  formulaId?: string;
  userWeightKg?: number;
  userAge?: number;
  selectedConstraints?: string[];
  className?: string;
}

export function SymbolicVerifyButton({
  herbId,
  formulaId,
  userWeightKg,
  userAge,
  selectedConstraints,
  className = '',
}: SymbolicVerifyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [formError, setFormError] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const { success: toastSuccess } = useToast();
  const { verify, result, error, loading, reset } = useSymbolicVerification();

  if (process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE !== 'true') return null;

  const needsInput = userWeightKg === undefined;

  function buildPayload(weight: number, age?: number): VerificationPayload {
    const payload: VerificationPayload = {
      herb_name: herbId,
      body_weight_kg: weight,
      dose_per_kg_mg: 5,
    };
    if (age !== undefined) payload.age_years = age;
    if (formulaId) payload.formula_id = formulaId;
    if (selectedConstraints && selectedConstraints.length > 0) {
      payload.constraints = { max_daily_mg: 2000, interaction_factor: 1 };
    }
    return payload;
  }

  function handleOpen() {
    setIsOpen(true);
    setFeedbackGiven(false);
    setFormError('');
    reset();
    track({ event: 'symbolic_verify_click', herbId });
    if (!needsInput) {
      verify(buildPayload(userWeightKg!, userAge));
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      setFormError('Please enter a valid weight in kg');
      return;
    }
    const age = ageInput ? parseInt(ageInput, 10) : undefined;
    if (age !== undefined && (isNaN(age) || age <= 0)) {
      setFormError('Please enter a valid age');
      return;
    }
    verify(buildPayload(weight, age));
  }

  function handleFeedback(positive: boolean) {
    setFeedbackGiven(true);
    toastSuccess('Thanks for your feedback!', positive ? 'Glad this was helpful.' : "We'll work to improve.");

    track({ event: 'symbolic_verify_feedback', herbId, rating: positive ? 'up' : 'down' });

    // Log feedback to backend (fire-and-forget)
    apiFetch('/api/symbolic-feedback', {
      method: 'POST',
      body: JSON.stringify({
        query: { herbId, formulaId },
        result: result ? {
          daily_dose_mg: result.daily_dose_mg,
          within_safety_limits: result.within_safety_limits,
        } : null,
        rating: positive ? 'up' : 'down',
      }),
    }).catch(() => {/* best-effort */});
  }

  function handleClose() {
    setIsOpen(false);
    setWeightInput('');
    setAgeInput('');
    setFormError('');
    reset();
  }

  return (
    <>
      <span title="Get precise dosage &amp; safety math">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={className}
      >
        <svg
          className="w-4 h-4 mr-1.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" />
          <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" />
          <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
          <line x1="9" y1="19" x2="15" y2="19" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Verify Dosage
      </Button>
      </span>

      <Modal isOpen={isOpen} onClose={handleClose} title="Dosage Verification" size="md">
        {/* Disclaimer banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-800">
          Computational estimate only &mdash; consult a licensed practitioner. Not medical advice.
        </div>

        {/* Input phase */}
        {needsInput && !loading && !result && !error && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="sv-weight" className="block text-sm font-medium text-earth-700 mb-1">
                Body weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                id="sv-weight"
                type="number"
                step="0.1"
                min="1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-earth-500 focus:ring-1 focus:ring-earth-500"
                placeholder="e.g. 70"
                required
              />
            </div>
            <div>
              <label htmlFor="sv-age" className="block text-sm font-medium text-earth-700 mb-1">
                Age (years) <span className="text-gray-400 text-xs">optional</span>
              </label>
              <input
                id="sv-age"
                type="number"
                min="1"
                max="150"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-earth-500 focus:ring-1 focus:ring-earth-500"
                placeholder="e.g. 35"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="submit" variant="primary" size="sm">
              Compute Dosage
            </Button>
          </form>
        )}

        {/* Loading phase */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-earth-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-earth-700">Computing precise dosage...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="py-6 text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!needsInput) {
                  verify(buildPayload(userWeightKg!, userAge));
                } else {
                  reset();
                }
              }}
            >
              {needsInput ? 'Try Again' : 'Retry'}
            </Button>
          </div>
        )}

        {/* Result phase */}
        {result && (
          <div className="space-y-5">
            {/* Stat cards grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-earth-50 p-3 text-center">
                <p className="text-xs text-earth-600 mb-1">Daily Dose</p>
                <p className="text-lg font-semibold text-earth-800">
                  {result.daily_dose_mg.toFixed(1)}<span className="text-xs font-normal ml-0.5">mg</span>
                </p>
              </div>
              <div className="rounded-lg bg-earth-50 p-3 text-center">
                <p className="text-xs text-earth-600 mb-1">Per Dose</p>
                <p className="text-lg font-semibold text-earth-800">
                  {result.per_dose_mg.toFixed(1)}<span className="text-xs font-normal ml-0.5">mg</span>
                </p>
              </div>
              <div className="rounded-lg bg-earth-50 p-3 text-center">
                <p className="text-xs text-earth-600 mb-1">Doses/Day</p>
                <p className="text-lg font-semibold text-earth-800">{result.doses_per_day}</p>
              </div>
            </div>

            {/* Safety badge */}
            <div className="flex items-center gap-2">
              {result.within_safety_limits ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-earth-100 text-earth-700 px-3 py-1 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Within safety limits
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Safety limits exceeded
                </span>
              )}
            </div>

            {/* Constraint details table */}
            {result.constraint_details.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-earth-600">
                      <th className="pb-2 pr-4">Constraint</th>
                      <th className="pb-2 pr-4">Limit</th>
                      <th className="pb-2 pr-4">Actual</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.constraint_details.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-earth-800">{c.constraint}</td>
                        <td className="py-2 pr-4">{c.limit}</td>
                        <td className="py-2 pr-4">{c.actual}</td>
                        <td className="py-2">
                          {c.status === 'ok' ? (
                            <span className="text-earth-600 font-medium">OK</span>
                          ) : (
                            <span className="text-red-600 font-medium">Exceeded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* LaTeX formula rendered with KaTeX */}
            {result.latex && (
              <div className="bg-earth-50 rounded-lg p-3 overflow-x-auto">
                <LatexEquation latex={result.latex} displayMode className="text-earth-800" />
              </div>
            )}

            {/* Cached badge */}
            {result.cached && (
              <p className="text-xs text-gray-400">Cached result</p>
            )}

            {/* Feedback row */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-earth-600">Was this helpful?</span>
              <button
                onClick={() => handleFeedback(true)}
                disabled={feedbackGiven}
                className="p-1.5 rounded-md hover:bg-earth-50 text-earth-500 hover:text-earth-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Yes, this was helpful"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                </svg>
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={feedbackGiven}
                className="p-1.5 rounded-md hover:bg-earth-50 text-earth-500 hover:text-earth-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="No, this was not helpful"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
