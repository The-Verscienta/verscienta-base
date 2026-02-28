'use client';

import { useEffect, useState } from 'react';
import type { MolecularTarget, MolecularTargetsResponse } from '@/app/api/herbs/[id]/targets/route';

interface MolecularTargetsProps {
  herbId: string;
}

export function MolecularTargets({ herbId }: MolecularTargetsProps) {
  const [data, setData] = useState<MolecularTargetsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/herbs/${herbId}/targets`)
      .then(r => r.json())
      .then((d: MolecularTargetsResponse) => setData(d))
      .catch(() => setData({ targets: [], count: 0 }))
      .finally(() => setLoading(false));
  }, [herbId]);

  if (loading || !data || data.count === 0) return null;

  const top3 = data.targets.slice(0, 3).map(t => t.gene_name || t.target_name).join(', ');

  return (
    <section className="bg-white dark:bg-earth-900 rounded-2xl shadow-lg border border-earth-200 dark:border-earth-700 overflow-hidden">
      <div className="p-6 border-b border-earth-100 dark:border-earth-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔬</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-earth-100">Molecular Targets</h2>
        </div>
        <p className="text-sm text-earth-600 dark:text-earth-300">
          This herb has <strong>{data.count}</strong> known molecular target{data.count !== 1 ? 's' : ''}
          {top3 && <>, including <span className="font-medium">{top3}</span></>}. Data from BATMAN-TCM.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-earth-50 dark:bg-earth-800 text-left">
              <th className="px-4 py-3 font-semibold text-earth-600 dark:text-earth-300">Target</th>
              <th className="px-4 py-3 font-semibold text-earth-600 dark:text-earth-300">Gene</th>
              <th className="px-4 py-3 font-semibold text-earth-600 dark:text-earth-300">Score</th>
              <th className="px-4 py-3 font-semibold text-earth-600 dark:text-earth-300">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100 dark:divide-earth-800">
            {data.targets.slice(0, 20).map((target: MolecularTarget) => (
              <tr key={target.id} className="hover:bg-earth-50/50 dark:hover:bg-earth-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-earth-100">
                  {target.target_name}
                </td>
                <td className="px-4 py-3 text-earth-600 dark:text-earth-300">
                  {target.gene_name ? (
                    target.uniprot_id ? (
                      <a
                        href={`https://www.uniprot.org/uniprot/${target.uniprot_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sage-600 dark:text-sage-400 hover:underline font-mono"
                      >
                        {target.gene_name}
                      </a>
                    ) : (
                      <span className="font-mono">{target.gene_name}</span>
                    )
                  ) : (
                    <span className="text-earth-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {target.score !== undefined ? (
                    <ScoreBadge score={target.score} />
                  ) : (
                    <span className="text-earth-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {target.evidence_type?.map((ev, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 text-xs rounded-full bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300"
                      >
                        {ev}
                      </span>
                    )) ?? <span className="text-earth-400">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.count > 20 && (
        <p className="px-4 py-3 text-xs text-earth-500 dark:text-earth-400 border-t border-earth-100 dark:border-earth-800">
          Showing top 20 of {data.count} targets by prediction score.
        </p>
      )}
    </section>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score * 100));
  const color = pct >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : pct >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-earth-100 text-earth-600 dark:bg-earth-800 dark:text-earth-300';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
      {score < 1 ? `${pct}%` : score.toFixed(1)}
    </span>
  );
}

export function MolecularTargetsSkeleton() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-lg border border-earth-200 dark:border-earth-700 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-earth-200 dark:bg-earth-700 rounded" />
        <div className="h-6 bg-earth-200 dark:bg-earth-700 rounded w-48" />
      </div>
      <div className="h-4 bg-earth-100 dark:bg-earth-800 rounded w-80 mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 bg-earth-100 dark:bg-earth-800 rounded" />
        ))}
      </div>
    </div>
  );
}
