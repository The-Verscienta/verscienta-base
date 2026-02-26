'use client';

import Link from 'next/link';
import type { HerbIngredient } from '@/types/drupal';
import { HerbRoleLabel } from './HerbRoleBadge';
import { getTextValue, hasTextContent } from '@/lib/drupal-helpers';

interface FormulaIngredientCardProps {
  ingredient: HerbIngredient;
  totalWeight?: number;
}

export function FormulaIngredientCard({ ingredient, totalWeight = 0 }: FormulaIngredientCardProps) {
  const percentage = ingredient.field_percentage ||
    (totalWeight > 0 ? (ingredient.field_quantity / totalWeight * 100) : 0);

  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:border-sage-300 hover:shadow-sm transition">
      {/* Role Header */}
      {ingredient.field_role && (
        <div className="mb-3">
          <HerbRoleLabel role={ingredient.field_role} />
        </div>
      )}

      {/* Herb Name and Quantity */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/herbs/${ingredient.id}`}
          className="text-lg font-semibold text-earth-700 hover:text-gray-900 hover:underline"
        >
          {ingredient.title || 'Herb'}
        </Link>
        <div className="text-right">
          <p className="text-xl font-bold text-sage-700">
            {ingredient.field_quantity} {ingredient.field_unit}
          </p>
          {percentage > 0 && (
            <p className="text-sm text-gray-600">
              {percentage.toFixed(1)}% of formula
            </p>
          )}
        </div>
      </div>

      {/* Function Description */}
      {hasTextContent(ingredient.field_function) && (
        <div className="mb-3">
          <p className="text-gray-700 italic">
            <span className="font-medium text-earth-600">Function:</span> {getTextValue(ingredient.field_function)}
          </p>
        </div>
      )}

      {/* Notes */}
      {hasTextContent(ingredient.field_notes) && (
        <div className="mb-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
          {getTextValue(ingredient.field_notes)}
        </div>
      )}

      {/* Progress Bar */}
      {percentage > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className="bg-sage-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface GroupedIngredientsProps {
  ingredients: HerbIngredient[];
  totalWeight?: number;
}

export function GroupedIngredientsList({ ingredients, totalWeight = 0 }: GroupedIngredientsProps) {
  // Group by role
  const roleOrder = ['chief', 'deputy', 'assistant', 'envoy'] as const;
  const grouped = {
    chief: ingredients.filter(i => i.field_role === 'chief'),
    deputy: ingredients.filter(i => i.field_role === 'deputy'),
    assistant: ingredients.filter(i => i.field_role === 'assistant'),
    envoy: ingredients.filter(i => i.field_role === 'envoy'),
    unassigned: ingredients.filter(i => !i.field_role),
  };

  const hasRoles = roleOrder.some(role => grouped[role].length > 0);

  // If no roles assigned, render flat list
  if (!hasRoles) {
    return (
      <div className="space-y-4">
        {ingredients.map((ingredient, idx) => (
          <FormulaIngredientCard
            key={ingredient.id || idx}
            ingredient={ingredient}
            totalWeight={totalWeight}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {roleOrder.map(role => {
        if (grouped[role].length === 0) return null;
        return (
          <div key={role} className="space-y-3">
            {grouped[role].map((ingredient, idx) => (
              <FormulaIngredientCard
                key={ingredient.id || `${role}-${idx}`}
                ingredient={ingredient}
                totalWeight={totalWeight}
              />
            ))}
          </div>
        );
      })}

      {/* Unassigned herbs */}
      {grouped.unassigned.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Additional Herbs
          </h4>
          {grouped.unassigned.map((ingredient, idx) => (
            <FormulaIngredientCard
              key={ingredient.id || `unassigned-${idx}`}
              ingredient={ingredient}
              totalWeight={totalWeight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
