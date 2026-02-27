'use client';

import type { FormulaContribution, HerbModification } from '@/types/drupal';
import { HerbRoleBadge } from './HerbRoleBadge';

interface ContributionCardProps {
  contribution: FormulaContribution;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ModificationDisplay({ modification }: { modification: HerbModification }) {
  const actionConfig = {
    add: { icon: '+', color: 'text-green-700', bgColor: 'bg-green-50' },
    remove: { icon: '-', color: 'text-red-700', bgColor: 'bg-red-50' },
    modify: { icon: '~', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  };

  const config = actionConfig[modification.action];

  return (
    <div className={`p-3 rounded-lg ${config.bgColor} mb-2`}>
      <div className="flex items-start gap-2">
        <span className={`font-bold text-lg ${config.color}`}>{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${config.color}`}>
              {modification.action === 'add' && 'Add'}
              {modification.action === 'remove' && 'Remove'}
              {modification.action === 'modify' && 'Modify'}
            </span>
            <span className="font-semibold text-gray-800 dark:text-earth-100">{modification.herb_title}</span>
            {modification.quantity && modification.unit && (
              <span className="text-gray-600 dark:text-earth-300">{modification.quantity}{modification.unit}</span>
            )}
            {modification.role && (
              <HerbRoleBadge role={modification.role} size="sm" />
            )}
          </div>
          {modification.function && (
            <p className="text-sm text-gray-600 mt-1 italic dark:text-earth-300">
              "{modification.function}"
            </p>
          )}
          <p className="text-sm text-gray-700 mt-2 dark:text-earth-200">
            <span className="font-medium">Rationale:</span> {modification.rationale}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContributionCard({ contribution }: ContributionCardProps) {
  const isClinicalNote = contribution.field_contribution_type === 'clinical_note';
  const isModification = contribution.field_contribution_type === 'modification' || contribution.field_contribution_type === 'addition';

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition dark:bg-earth-900 dark:border-earth-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isClinicalNote ? '📝' : '✏️'}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-earth-300">
            {isClinicalNote ? 'Clinical Note' : 'Modification'}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-earth-400">
          by <span className="font-medium text-earth-700">@{contribution.uid?.name || 'Anonymous'}</span>
          {contribution.created && (
            <> · {formatDate(contribution.created)}</>
          )}
        </span>
      </div>

      {/* Context (for modifications) */}
      {isModification && contribution.field_context && (
        <div className="mb-3 text-sm text-gray-700">
          <span className="font-medium">For:</span> {contribution.field_context}
        </div>
      )}

      {/* Clinical Note Content */}
      {isClinicalNote && contribution.field_clinical_note && (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap dark:text-earth-200">
            "{contribution.field_clinical_note}"
          </p>
        </div>
      )}

      {/* Modifications List */}
      {isModification && contribution.field_modifications && contribution.field_modifications.length > 0 && (
        <div className="mt-3">
          {contribution.field_modifications.map((mod, idx) => (
            <ModificationDisplay key={idx} modification={mod} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContributionsListProps {
  contributions: FormulaContribution[];
  emptyMessage?: string;
}

export function ContributionsList({ contributions, emptyMessage = 'No contributions yet.' }: ContributionsListProps) {
  if (contributions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-6 dark:text-earth-400">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-4">
      {contributions.map((contribution) => (
        <ContributionCard key={contribution.id} contribution={contribution} />
      ))}
    </div>
  );
}
