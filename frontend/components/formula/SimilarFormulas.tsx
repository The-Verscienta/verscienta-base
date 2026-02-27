'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { FormulaSimilarityResult } from '@/lib/formula-similarity';
import { getSimilarityLabel } from '@/lib/formula-similarity';

interface SimilarFormulasProps {
  formulaId: string;
  minSimilarity?: number;
  maxResults?: number;
}

function SimilarityBadge({ score }: { score: number }) {
  const { label, color } = getSimilarityLabel(score);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {score.toFixed(0)}% {label}
    </span>
  );
}

function SimilarFormulaCard({ result }: { result: FormulaSimilarityResult }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-sage-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/formulas/${result.formulaId}`}
          className="text-lg font-semibold text-earth-700 hover:text-gray-900 hover:underline"
        >
          {result.formulaTitle}
        </Link>
        <SimilarityBadge score={result.similarityScore} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span>
          <strong>{result.sharedHerbCount}</strong> shared herbs
        </span>
        <span>
          of <strong>{result.totalHerbsInComparison}</strong> total unique herbs
        </span>
      </div>

      {/* Similarity Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-sage-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(result.similarityScore, 100)}%` }}
        />
      </div>

      {/* Shared Herbs Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-sage-600 hover:text-sage-800 font-medium flex items-center gap-1"
      >
        {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} shared herbs
      </button>

      {/* Shared Herbs Details */}
      {showDetails && result.sharedHerbs.length > 0 && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1 font-medium text-gray-600">Herb</th>
                <th className="text-right py-1 font-medium text-gray-600">This Formula</th>
                <th className="text-right py-1 font-medium text-gray-600">Similar Formula</th>
              </tr>
            </thead>
            <tbody>
              {result.sharedHerbs.map((herb) => (
                <tr key={herb.herbId} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5">
                    <Link
                      href={`/herbs/${herb.herbId}`}
                      className="text-earth-700 hover:text-gray-900 hover:underline"
                    >
                      {herb.herbTitle}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right text-gray-600">
                    {herb.percentageInSource}%
                  </td>
                  <td className="py-1.5 text-right text-gray-600">
                    {herb.percentageInTarget}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SimilarFormulas({
  formulaId,
  minSimilarity = 10,
  maxResults = 5,
}: SimilarFormulasProps) {
  const [similarFormulas, setSimilarFormulas] = useState<FormulaSimilarityResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCompared, setTotalCompared] = useState(0);

  // Memoize the fetch function
  const fetchSimilarFormulas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        minSimilarity: minSimilarity.toString(),
        maxResults: maxResults.toString(),
      });

      const response = await fetch(`/api/formulas/${formulaId}/similar?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch similar formulas');
      }

      const data = await response.json();
      setSimilarFormulas(data.similarFormulas || []);
      setTotalCompared(data.totalFormulasCompared || 0);
    } catch (err) {
      console.error('Error fetching similar formulas:', err);
      setError('Unable to load similar formulas');
    } finally {
      setIsLoading(false);
    }
  }, [formulaId, minSimilarity, maxResults]);

  useEffect(() => {
    fetchSimilarFormulas();
  }, [fetchSimilarFormulas]);

  // Memoize the legend items
  const legendItems = useMemo(() =>
    [80, 60, 40, 20, 10].map((score) => ({
      score,
      ...getSimilarityLabel(score),
    })),
    []
  );

  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-earth-100">
          Similar Formulas
        </h2>
        {!isLoading && totalCompared > 0 && (
          <span className="text-sm text-gray-500 dark:text-earth-400">
            Compared with {totalCompared} formulas
          </span>
        )}
      </div>

      <p className="text-gray-600 dark:text-earth-300 mb-6">
        Formulas that share similar herbs and proportions. Similarity is calculated based on
        shared ingredients and their relative quantities.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600" />
        </div>
      ) : error ? (
        <p className="text-red-600 text-center py-6">{error}</p>
      ) : similarFormulas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600">
            No similar formulas found with at least {minSimilarity}% similarity.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This formula may have a unique combination of herbs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {similarFormulas.map((result) => (
            <SimilarFormulaCard key={result.formulaId} result={result} />
          ))}
        </div>
      )}

      {/* Legend */}
      {!isLoading && similarFormulas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Similarity Scale:</p>
          <div className="flex flex-wrap gap-2">
            {legendItems.map(({ score, label, color }) => (
              <span
                key={score}
                className={`inline-flex items-center px-2 py-1 rounded text-xs ${color}`}
              >
                {score}%+ = {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
