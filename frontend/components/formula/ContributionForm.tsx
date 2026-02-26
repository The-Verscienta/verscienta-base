'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { ContributionType, HerbModification } from '@/types/drupal';
import { HerbModificationListEditor } from './HerbModificationEditor';
import { formulaContributionSchema, formatZodErrors } from '@/lib/validation';

interface ContributionFormProps {
  formulaId: string;
  formulaTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type FormMode = 'select' | 'clinical_note' | 'modification';

export function ContributionForm({
  formulaId,
  formulaTitle,
  onClose,
  onSuccess,
}: ContributionFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<FormMode>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clinical note state
  const [clinicalNote, setClinicalNote] = useState('');

  // Modification state
  const [context, setContext] = useState('');
  const [modifications, setModifications] = useState<Partial<HerbModification>[]>([
    { action: 'add', rationale: '' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!isAuthenticated) {
      setError('You must be logged in to submit contributions.');
      return;
    }

    // Build the contribution data
    const contributionType: ContributionType = mode === 'clinical_note' ? 'clinical_note' : 'modification';
    const data = {
      contribution_type: contributionType,
      formula_id: formulaId,
      clinical_note: mode === 'clinical_note' ? clinicalNote : undefined,
      context: mode === 'modification' ? context : undefined,
      modifications: mode === 'modification' ? modifications as HerbModification[] : undefined,
    };

    // Validate
    const result = formulaContributionSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setError('Please fix the errors below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/formulas/${formulaId}/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit contribution');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to submit contributions to formulas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <a
              href="/login"
              className="flex-1 px-4 py-2 bg-sage-600 text-white rounded-lg text-center hover:bg-sage-700"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add Formula Contribution</h2>
            <p className="text-sm text-gray-600 mt-1">{formulaTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Mode Selection */}
            {mode === 'select' && (
              <div className="space-y-4">
                <p className="text-gray-600">What type of contribution would you like to make?</p>

                <button
                  type="button"
                  onClick={() => setMode('clinical_note')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-sage-400 hover:bg-sage-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">Clinical Note</h3>
                      <p className="text-sm text-gray-600">
                        Share your clinical experience with this formula
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('modification')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-sage-400 hover:bg-sage-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">Suggest Modification</h3>
                      <p className="text-sm text-gray-600">
                        Propose herb changes for specific cases or conditions
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Clinical Note Form */}
            {mode === 'clinical_note' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="text-sm text-sage-600 hover:text-sage-800 flex items-center gap-1"
                >
                  ← Back to selection
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Clinical Note *
                  </label>
                  <textarea
                    value={clinicalNote}
                    onChange={(e) => setClinicalNote(e.target.value)}
                    placeholder="Share your experience using this formula in clinical practice. What conditions did you use it for? What results did you observe? Any tips for other practitioners?"
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 resize-none ${
                      fieldErrors['clinical_note'] ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors['clinical_note'] && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors['clinical_note']}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 20 characters. {clinicalNote.length}/2000
                  </p>
                </div>
              </div>
            )}

            {/* Modification Form */}
            {mode === 'modification' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="text-sm text-sage-600 hover:text-sage-800 flex items-center gap-1"
                >
                  ← Back to selection
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context / Indication
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., For patients with cold constitution, For qi stagnation cases"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Herb Modifications *
                  </label>
                  <HerbModificationListEditor
                    modifications={modifications}
                    onChange={setModifications}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <span>⚠️</span>
                Contributions require admin approval before appearing
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                {mode !== 'select' && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
