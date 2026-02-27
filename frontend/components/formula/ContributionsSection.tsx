'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { FormulaContribution } from '@/types/drupal';
import { ContributionsList } from './ContributionCard';
import { ContributionForm } from './ContributionForm';

interface ContributionsSectionProps {
  formulaId: string;
  formulaTitle: string;
}

export function ContributionsSection({ formulaId, formulaTitle }: ContributionsSectionProps) {
  const { isAuthenticated } = useAuth();
  const [contributions, setContributions] = useState<FormulaContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchContributions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/formulas/${formulaId}/contributions`);

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      setContributions(data.contributions || []);
    } catch (err) {
      console.error('Error fetching contributions:', err);
      setError('Failed to load contributions');
    } finally {
      setIsLoading(false);
    }
  }, [formulaId]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handleContributionSuccess = () => {
    // Optionally refresh contributions (though new ones will be pending)
    fetchContributions();
  };

  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100">
          Community Contributions
          {!isLoading && contributions.length > 0 && (
            <span className="ml-2 text-lg font-normal text-gray-500 dark:text-earth-400">
              ({contributions.length} approved)
            </span>
          )}
        </h2>
      </div>

      {/* Contributions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600" />
        </div>
      ) : error ? (
        <p className="text-red-600 text-center py-6">{error}</p>
      ) : (
        <ContributionsList
          contributions={contributions}
          emptyMessage="No community contributions yet. Be the first to share your clinical experience!"
        />
      )}

      {/* Contribution Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition flex items-center gap-2"
          >
            <span>📝</span>
            Add Clinical Note
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 border border-sage-600 text-sage-700 rounded-lg hover:bg-sage-50 transition flex items-center gap-2"
          >
            <span>✏️</span>
            Suggest Modification
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
          {isAuthenticated ? (
            'Your contributions will be reviewed by our team before appearing.'
          ) : (
            <>
              <a href="/login" className="text-sage-600 hover:underline">Log in</a>
              {' '}to contribute (pending admin approval)
            </>
          )}
        </p>
      </div>

      {/* Contribution Form Modal */}
      {showForm && (
        <ContributionForm
          formulaId={formulaId}
          formulaTitle={formulaTitle}
          onClose={() => setShowForm(false)}
          onSuccess={handleContributionSuccess}
        />
      )}
    </div>
  );
}
