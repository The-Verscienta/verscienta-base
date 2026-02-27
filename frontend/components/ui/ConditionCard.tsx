import Link from 'next/link';
import type { ConditionEntity } from '@/types/drupal';
import { selfTreatableMap, getFieldConfig } from '@/lib/decision-field-maps';

interface ConditionCardProps {
  condition: ConditionEntity;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

// Map severity to visual styles
const severityStyles: Record<string, { bg: string; text: string; label: string }> = {
  mild: { bg: 'bg-green-100', text: 'text-green-700', label: 'Mild' },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Moderate' },
  severe: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Severe' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
};

export function ConditionCard({
  condition,
  variant = 'default',
  className = '',
}: ConditionCardProps) {
  const severity = condition.field_severity
    ? severityStyles[condition.field_severity.toLowerCase()] || null
    : null;

  const summary = condition.field_quick_summary
    || (condition.body?.processed
      ? condition.body.processed.replace(/<[^>]*>/g, '').slice(0, 150)
      : null);

  if (variant === 'compact') {
    return (
      <Link
        href={`/conditions/${condition.id}`}
        className={`flex items-center gap-3 p-3 bg-white dark:bg-earth-900 rounded-lg border border-gray-200 dark:border-earth-700 hover:border-earth-300 hover:shadow-sm transition ${className}`}
      >
        <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 dark:text-earth-100 truncate">{condition.title}</h3>
          {condition.field_symptoms && condition.field_symptoms.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-earth-400 truncate">
              {condition.field_symptoms.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/conditions/${condition.id}`}
        className={`block bg-gradient-to-br from-coral-50 to-earth-50 rounded-xl shadow-sm hover:shadow-lg border border-coral-100 hover:border-coral-200 transition-all p-8 ${className}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 bg-white dark:bg-earth-800 rounded-xl shadow-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {severity && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${severity.bg} ${severity.text}`}>
                {severity.label}
              </span>
            )}
            {condition.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
            {condition.field_self_treatable && (() => { const c = getFieldConfig(selfTreatableMap, condition.field_self_treatable); return c ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
            ) : null; })()}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2">{condition.title}</h2>

        {summary && (
          <p className="text-gray-600 dark:text-earth-300 mb-4 line-clamp-2">{summary}{!condition.field_quick_summary ? '...' : ''}</p>
        )}

        {condition.field_symptoms && condition.field_symptoms.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-earth-200 mb-2">Common Symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {condition.field_symptoms.slice(0, 4).map((symptom, idx) => (
                <span key={idx} className="text-sm bg-white/70 dark:bg-earth-800/70 text-gray-700 dark:text-earth-200 px-3 py-1 rounded-full">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        <span className="text-coral-600 font-medium flex items-center gap-1">
          Learn about treatments
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/conditions/${condition.id}`}
      className={`block bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-earth-700 hover:border-coral-200 transition-all p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {severity && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${severity.bg} ${severity.text}`}>
              {severity.label}
            </span>
          )}
          {condition.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
          {condition.field_self_treatable && (() => { const c = getFieldConfig(selfTreatableMap, condition.field_self_treatable); return c ? (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
          ) : null; })()}
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-earth-100 mb-2">{condition.title}</h2>

      {summary && (
        <p className="text-sm text-gray-600 dark:text-earth-300 mb-4 line-clamp-2">{summary}{!condition.field_quick_summary ? '...' : ''}</p>
      )}

      {condition.field_symptoms && condition.field_symptoms.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-earth-400 mb-1.5">Symptoms:</p>
          <div className="flex flex-wrap gap-1">
            {condition.field_symptoms.slice(0, 3).map((symptom, idx) => (
              <span key={idx} className="text-xs bg-gray-100 dark:bg-earth-800 text-gray-700 dark:text-earth-200 px-2 py-1 rounded">
                {symptom}
              </span>
            ))}
            {condition.field_symptoms.length > 3 && (
              <span className="text-xs text-gray-400 dark:text-earth-500">
                +{condition.field_symptoms.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {(condition.field_modalities || condition.field_related_herbs) && (
        <div className="text-sm text-sage-600 mb-3">
          {condition.field_modalities && condition.field_modalities.length > 0 && (
            <span>{condition.field_modalities.length} treatment{condition.field_modalities.length !== 1 ? 's' : ''}</span>
          )}
          {condition.field_modalities && condition.field_related_herbs && ' | '}
          {condition.field_related_herbs && condition.field_related_herbs.length > 0 && (
            <span>{condition.field_related_herbs.length} herb{condition.field_related_herbs.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-earth-700">
        <span className="text-coral-600 font-medium text-sm flex items-center gap-1">
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
