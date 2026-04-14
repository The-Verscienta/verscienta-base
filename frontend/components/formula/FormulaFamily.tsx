'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { FormulaFamilyResponse, FormulaFamilyMember } from '@/app/api/formulas/[id]/family/route';

interface FormulaFamilyProps {
  formulaId: string;
}

function ParentCard({ parent, modificationNotes }: { parent: FormulaFamilyMember; modificationNotes?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-earth-400 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Derived From
      </p>
      <Link
        href={`/formulas/${parent.id}`}
        className="group flex items-start gap-4 p-4 rounded-xl border-2 border-sage-200 dark:border-sage-800 bg-sage-50/50 dark:bg-sage-900/20 hover:border-sage-400 dark:hover:border-sage-600 hover:bg-sage-50 dark:hover:bg-sage-900/30 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <span className="text-xl">📜</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-earth-100 group-hover:text-sage-700 dark:group-hover:text-sage-300 transition-colors">
            {parent.title}
          </p>
          <p className="text-xs text-sage-600 dark:text-sage-400 mt-0.5">Base / Classical Formula</p>
        </div>
        <svg className="w-5 h-5 text-gray-400 dark:text-earth-500 flex-shrink-0 mt-0.5 group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      {modificationNotes && (
        <div className="mt-3 pl-4 border-l-2 border-sage-300 dark:border-sage-700">
          <p className="text-sm text-gray-600 dark:text-earth-300 italic">
            <span className="font-medium not-italic text-gray-700 dark:text-earth-200">Modification: </span>
            {modificationNotes}
          </p>
        </div>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: FormulaFamilyMember }) {
  return (
    <Link
      href={`/formulas/${child.id}`}
      className="group flex flex-col gap-2 p-4 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-900 hover:border-earth-400 dark:hover:border-earth-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-earth-100 dark:bg-earth-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="text-base">⚗️</span>
          </div>
          <p className="font-semibold text-gray-800 dark:text-earth-100 group-hover:text-earth-600 dark:group-hover:text-earth-300 transition-colors line-clamp-2 text-sm leading-snug">
            {child.title}
          </p>
        </div>
        <svg className="w-4 h-4 text-gray-400 dark:text-earth-500 flex-shrink-0 mt-0.5 group-hover:text-earth-500 dark:group-hover:text-earth-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {child.modification_notes && (
        <p className="text-xs text-gray-500 dark:text-earth-400 italic line-clamp-2 pl-10">
          {child.modification_notes}
        </p>
      )}
    </Link>
  );
}

export function FormulaFamily({ formulaId }: FormulaFamilyProps) {
  const [data, setData] = useState<FormulaFamilyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/formulas/${formulaId}/family`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ parent: null, children: [] }))
      .finally(() => setLoading(false));
  }, [formulaId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6 animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-earth-700 rounded w-44 mb-6" />
        <div className="h-16 bg-gray-100 dark:bg-earth-800 rounded-xl mb-4" />
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-earth-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || (!data.parent && data.children.length === 0)) return null;

  return (
    <div className="bg-white dark:bg-earth-900 rounded-lg shadow-lg p-8 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-earth-100 dark:bg-earth-800 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-earth-600 dark:text-earth-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-earth-100">Formula variants &amp; lineage</h2>
          <p className="text-sm text-gray-500 dark:text-earth-400">
            {data.parent && data.children.length > 0
              ? 'Structured in Drupal as parent/child formulas (classical base plus documented modifications).'
              : data.parent
              ? 'This entry is recorded as a modification or derivative of a parent formula.'
              : `${data.children.length} recorded variation${data.children.length !== 1 ? 's' : ''} built on this formula`}
          </p>
        </div>
      </div>

      {/* Visual tree connector when both parent and children exist */}
      {data.parent && data.children.length > 0 && (
        <>
          <ParentCard parent={data.parent} modificationNotes={data.modification_notes} />
          <div className="flex items-center gap-3 mb-4 py-1">
            <div className="w-0.5 h-6 bg-earth-200 dark:bg-earth-700 ml-4" />
            <span className="text-xs text-gray-400 dark:text-earth-500 font-medium uppercase tracking-wide">Current Formula</span>
          </div>
        </>
      )}

      {/* Parent only (no children) */}
      {data.parent && data.children.length === 0 && (
        <ParentCard parent={data.parent} modificationNotes={data.modification_notes} />
      )}

      {/* Children section */}
      {data.children.length > 0 && (
        <div>
          {!data.parent && (
            /* parent-only modification notes banner (edge case: no parent but has notes) */
            data.modification_notes && (
              <div className="mb-4 pl-4 border-l-2 border-sage-300 dark:border-sage-700">
                <p className="text-sm text-gray-600 dark:text-earth-300 italic">{data.modification_notes}</p>
              </div>
            )
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-earth-400 mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Variations &amp; Modifications ({data.children.length})
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.children.map(child => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
