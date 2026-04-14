'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { FormulaSimilarityResult } from '@/lib/formula-similarity';
import { getSimilarityLabel, SIMILARITY_STRONG_THRESHOLD } from '@/lib/formula-similarity';

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
    <div className="border border-gray-200 dark:border-earth-700 rounded-lg p-4 hover:border-sage-300 dark:hover:border-sage-600 hover:shadow-sm transition bg-white dark:bg-earth-900/50">
      <div className="flex items-start justify-between mb-2 gap-2">
        <Link
          href={`/formulas/${result.formulaId}`}
          className="text-lg font-semibold text-earth-700 dark:text-earth-200 hover:text-gray-900 dark:hover:text-earth-50 hover:underline"
        >
          {result.formulaTitle}
        </Link>
        <SimilarityBadge score={result.similarityScore} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-earth-400 mb-3">
        <span>
          <strong>{result.sharedHerbCount}</strong> shared herbs
        </span>
        <span>
          of <strong>{result.totalHerbsInComparison}</strong> unique herbs in pair
        </span>
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-earth-500">
          {result.matchTier === 'strong' ? 'Strong match' : 'Moderate match'}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-earth-800 rounded-full h-2 mb-3">
        <div
          className="bg-sage-600 dark:bg-sage-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(result.similarityScore, 100)}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-sage-600 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 font-medium flex items-center gap-1"
      >
        {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} shared herbs
      </button>

      {showDetails && result.sharedHerbs.length > 0 && (
        <div className="mt-3 bg-gray-50 dark:bg-earth-950/80 rounded-lg p-3 border border-gray-100 dark:border-earth-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-earth-700">
                <th className="text-left py-1 font-medium text-gray-600 dark:text-earth-400">Herb</th>
                <th className="text-right py-1 font-medium text-gray-600 dark:text-earth-400">This formula</th>
                <th className="text-right py-1 font-medium text-gray-600 dark:text-earth-400">Other</th>
              </tr>
            </thead>
            <tbody>
              {result.sharedHerbs.map((herb) => (
                <tr key={herb.herbId} className="border-b border-gray-100 dark:border-earth-800 last:border-0">
                  <td className="py-1.5">
                    <Link
                      href={`/herbs/${herb.herbId}`}
                      className="text-earth-700 dark:text-earth-300 hover:text-gray-900 dark:hover:text-earth-100 hover:underline"
                    >
                      {herb.herbTitle}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right text-gray-600 dark:text-earth-400">
                    {herb.percentageInSource}%
                  </td>
                  <td className="py-1.5 text-right text-gray-600 dark:text-earth-400">
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
  maxResults = 10,
}: SimilarFormulasProps) {
  const [similarFormulas, setSimilarFormulas] = useState<FormulaSimilarityResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCompared, setTotalCompared] = useState(0);
  const [showModerate, setShowModerate] = useState(true);

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

  const { strong, moderate } = useMemo(() => {
    const s = similarFormulas.filter((r) => r.matchTier === 'strong');
    const m = similarFormulas.filter((r) => r.matchTier === 'moderate');
    return { strong: s, moderate: m };
  }, [similarFormulas]);

  const legendItems = useMemo(
    () =>
      [80, 60, 40, 20, 10].map((score) => ({
        score,
        ...getSimilarityLabel(score),
      })),
    []
  );

  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6 border border-transparent dark:border-earth-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-earth-100">
          Similar herb profiles
        </h2>
        {!isLoading && totalCompared > 0 && (
          <span className="text-sm text-gray-500 dark:text-earth-400">
            vs {totalCompared} formulas
          </span>
        )}
      </div>

      <p className="text-gray-600 dark:text-earth-300 mb-2">
        <strong className="text-gray-800 dark:text-earth-200">Algorithmic similarity</strong> from shared
        ingredients and proportions (Jun/Chen roles weighted more than envoy herbs). This is not a clinical
        equivalence score — use curated links and condition overlap above when available.
      </p>
      <p className="text-sm text-gray-500 dark:text-earth-500 mb-6">
        Strong ≈ {SIMILARITY_STRONG_THRESHOLD}%+ combined score; moderate matches sit between {minSimilarity}%
        and that threshold (at least two shared herbs when both formulas are large enough).
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600" />
        </div>
      ) : error ? (
        <p className="text-red-600 text-center py-6">{error}</p>
      ) : similarFormulas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-earth-950/50 rounded-lg border border-gray-100 dark:border-earth-800">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 dark:text-earth-300">
            No similar formulas at ≥{minSimilarity}% with enough overlapping herbs.
          </p>
          <p className="text-sm text-gray-500 dark:text-earth-500 mt-2 max-w-md mx-auto">
            If this seems wrong, check that each ingredient paragraph references a herb node and that
            quantities or percentages are filled in — empty data reduces match quality across the site.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {strong.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sage-700 dark:text-sage-400 mb-3">
                Strong matches
              </h3>
              <div className="space-y-4">
                {strong.map((result) => (
                  <SimilarFormulaCard key={result.formulaId} result={result} />
                ))}
              </div>
            </div>
          )}

          {moderate.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowModerate((v) => !v)}
                className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 hover:underline"
              >
                {showModerate ? '▼' : '▶'} Moderate matches ({moderate.length})
              </button>
              {showModerate && (
                <div className="space-y-4">
                  {moderate.map((result) => (
                    <SimilarFormulaCard key={result.formulaId} result={result} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isLoading && similarFormulas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-earth-700">
          <p className="text-sm text-gray-500 dark:text-earth-500 mb-2">Similarity scale (combined score):</p>
          <div className="flex flex-wrap gap-2">
            {legendItems.map(({ score, label, color }) => (
              <span key={score} className={`inline-flex items-center px-2 py-1 rounded text-xs ${color}`}>
                {score}%+ = {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
