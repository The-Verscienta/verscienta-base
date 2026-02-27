import Link from 'next/link';
import type { FormulaEntity } from '@/types/drupal';
import { getTextValue } from '@/lib/drupal-helpers';
import { formulaCategoryMap, getFieldConfig } from '@/lib/decision-field-maps';

interface FormulaCardProps {
  formula: FormulaEntity;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function FormulaCard({
  formula,
  variant = 'default',
  className = '',
}: FormulaCardProps) {
  const ingredientCount = formula.field_herb_ingredients?.length || 0;
  const description = getTextValue(formula.field_formula_description) || formula.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 150);

  if (variant === 'compact') {
    return (
      <Link
        href={`/formulas/${formula.id}`}
        className={`flex items-center gap-3 p-3 bg-white dark:bg-earth-900 rounded-lg border border-gray-200 dark:border-earth-700 hover:border-sage-300 hover:shadow-sm transition ${className}`}
      >
        <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 dark:text-earth-100 truncate">{formula.title}</h3>
          <p className="text-xs text-gray-500 dark:text-earth-400">
            {ingredientCount} herb{ingredientCount !== 1 ? 's' : ''}
            {formula.field_total_weight && ` | ${formula.field_total_weight}${formula.field_total_weight_unit || 'g'}`}
          </p>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    );
  }

  if (variant === 'detailed') {
    return (
      <Link
        href={`/formulas/${formula.id}`}
        className={`block bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-earth-700 hover:border-sage-200 transition-all ${className}`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sage-100 to-earth-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            {formula.field_total_weight && (
              <span className="text-xs bg-sage-100 text-sage-700 px-3 py-1 rounded-full font-medium">
                {formula.field_total_weight}{formula.field_total_weight_unit || 'g'} total
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-earth-100 mb-2">{formula.title}</h2>

          {description && (
            <p className="text-sm text-gray-600 dark:text-earth-300 mb-4 line-clamp-2">{description}...</p>
          )}

          {formula.field_herb_ingredients && formula.field_herb_ingredients.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-earth-400 mb-2">
                Ingredients ({ingredientCount})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {formula.field_herb_ingredients.slice(0, 5).map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-earth-50 dark:bg-earth-950 text-earth-700 dark:text-earth-300 px-2.5 py-1 rounded-full border border-earth-100 dark:border-earth-700"
                  >
                    {ingredient.title}
                    {ingredient.field_quantity && (
                      <span className="text-earth-500 ml-1">
                        {ingredient.field_quantity}{ingredient.field_unit || 'g'}
                      </span>
                    )}
                  </span>
                ))}
                {formula.field_herb_ingredients.length > 5 && (
                  <span className="text-xs text-gray-500 dark:text-earth-400 px-2 py-1">
                    +{formula.field_herb_ingredients.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {formula.field_use_cases && formula.field_use_cases.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-earth-400 mb-1">Use Cases</p>
              <p className="text-sm text-gray-600 dark:text-earth-300">
                {formula.field_use_cases.slice(0, 2).join(', ')}
                {formula.field_use_cases.length > 2 && `, +${formula.field_use_cases.length - 2} more`}
              </p>
            </div>
          )}

          {/* Decision indicators */}
          {(formula.field_editors_pick || formula.field_formula_category || formula.field_available_premade) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {formula.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
              {formula.field_formula_category && (() => { const c = getFieldConfig(formulaCategoryMap, formula.field_formula_category); return c ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
              ) : null; })()}
              {formula.field_available_premade && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Pre-made</span>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-earth-950 border-t border-gray-100 dark:border-earth-700 rounded-b-xl">
          <span className="text-sage-600 font-medium text-sm flex items-center gap-1">
            View Full Formula
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/formulas/${formula.id}`}
      className={`block bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-earth-700 hover:border-sage-200 transition-all p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <span className="text-xs bg-sage-100 text-sage-700 px-2.5 py-1 rounded-full font-medium">
          {ingredientCount} herb{ingredientCount !== 1 ? 's' : ''}
        </span>
      </div>

      <h2 className="text-lg font-bold text-gray-800 dark:text-earth-100 mb-2">{formula.title}</h2>

      {description && (
        <p className="text-sm text-gray-600 dark:text-earth-300 mb-4 line-clamp-2">{description}...</p>
      )}

      {formula.field_herb_ingredients && formula.field_herb_ingredients.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {formula.field_herb_ingredients.slice(0, 4).map((ingredient, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 dark:bg-earth-800 text-gray-700 dark:text-earth-200 px-2 py-1 rounded"
              >
                {ingredient.title}
              </span>
            ))}
            {formula.field_herb_ingredients.length > 4 && (
              <span className="text-xs text-gray-400 dark:text-earth-500 px-2 py-1">
                +{formula.field_herb_ingredients.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-earth-700">
        <span className="text-sage-600 font-medium text-sm flex items-center gap-1">
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// Formula ingredient list component for detail pages
interface FormulaIngredientListProps {
  ingredients: FormulaEntity['field_herb_ingredients'];
  className?: string;
}

export function FormulaIngredientList({ ingredients, className = '' }: FormulaIngredientListProps) {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  const totalWeight = ingredients.reduce((sum, ing) => sum + (ing.field_quantity || 0), 0);

  return (
    <div className={`bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 overflow-hidden ${className}`}>
      <div className="p-4 bg-gray-50 dark:bg-earth-950 border-b border-gray-100 dark:border-earth-700">
        <h3 className="font-semibold text-gray-800 dark:text-earth-100">Formula Ingredients</h3>
        <p className="text-sm text-gray-500 dark:text-earth-400">
          {ingredients.length} herbs | {totalWeight}g total
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-earth-700">
        {ingredients.map((ingredient, idx) => {
          const percentage = ingredient.field_percentage || (totalWeight > 0 ? (ingredient.field_quantity / totalWeight) * 100 : 0);

          return (
            <div key={idx} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-earth-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🌿</span>
              </div>
              <div className="flex-1">
                <Link
                  href={`/herbs/${ingredient.id}`}
                  className="font-medium text-gray-800 dark:text-earth-100 hover:text-earth-600 transition"
                >
                  {ingredient.title}
                </Link>
                <p className="text-sm text-gray-500 dark:text-earth-400">
                  {ingredient.field_quantity}{ingredient.field_unit || 'g'}
                  {percentage > 0 && ` (${percentage.toFixed(1)}%)`}
                </p>
              </div>
              <div className="w-24">
                <div className="h-2 bg-gray-200 dark:bg-earth-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage-500 rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
