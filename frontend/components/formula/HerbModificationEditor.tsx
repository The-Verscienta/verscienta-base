'use client';

import { useState } from 'react';
import type { HerbModification, HerbRole, ModificationAction } from '@/types/drupal';

interface HerbModificationEditorProps {
  modification: Partial<HerbModification>;
  onChange: (modification: Partial<HerbModification>) => void;
  onRemove: () => void;
  index: number;
}

const actionOptions: { value: ModificationAction; label: string }[] = [
  { value: 'add', label: 'Add' },
  { value: 'remove', label: 'Remove' },
  { value: 'modify', label: 'Modify' },
];

const roleOptions: { value: HerbRole; label: string }[] = [
  { value: 'chief', label: 'Chief' },
  { value: 'deputy', label: 'Deputy' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'envoy', label: 'Envoy' },
];

const unitOptions = ['g', 'mg', 'oz', 'ml', 'tsp', 'tbsp', 'drops', 'parts'];

export function HerbModificationEditor({
  modification,
  onChange,
  onRemove,
  index,
}: HerbModificationEditorProps) {
  const handleChange = (field: keyof HerbModification, value: string | number | undefined) => {
    onChange({ ...modification, [field]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">Modification #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Remove
        </button>
      </div>

      <div className="space-y-4">
        {/* Action & Herb Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action *
            </label>
            <select
              value={modification.action || ''}
              onChange={(e) => handleChange('action', e.target.value as ModificationAction)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="">Select action...</option>
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Herb Name *
            </label>
            <input
              type="text"
              value={modification.herb_title || ''}
              onChange={(e) => {
                handleChange('herb_title', e.target.value);
                // For simplicity, use the herb_title as a temporary ID
                // In production, this would be an autocomplete that sets the actual herb_id
                handleChange('herb_id', e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              placeholder="e.g., Gan Jiang (Dried Ginger)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
            />
          </div>
        </div>

        {/* Quantity, Unit, Role (only for add/modify) */}
        {modification.action !== 'remove' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={modification.quantity || ''}
                onChange={(e) => handleChange('quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 3"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={modification.unit || ''}
                onChange={(e) => handleChange('unit', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              >
                <option value="">Select unit...</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={modification.role || ''}
                onChange={(e) => handleChange('role', e.target.value as HerbRole || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              >
                <option value="">Select role...</option>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Function (only for add/modify) */}
        {modification.action !== 'remove' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function in Formula
            </label>
            <input
              type="text"
              value={modification.function || ''}
              onChange={(e) => handleChange('function', e.target.value || undefined)}
              placeholder="e.g., Warms middle jiao, enhances spleen yang"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
            />
          </div>
        )}

        {/* Rationale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rationale *
          </label>
          <textarea
            value={modification.rationale || ''}
            onChange={(e) => handleChange('rationale', e.target.value)}
            placeholder="Explain why this modification is beneficial..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

interface HerbModificationListEditorProps {
  modifications: Partial<HerbModification>[];
  onChange: (modifications: Partial<HerbModification>[]) => void;
}

export function HerbModificationListEditor({
  modifications,
  onChange,
}: HerbModificationListEditorProps) {
  const handleModificationChange = (index: number, updated: Partial<HerbModification>) => {
    const newMods = [...modifications];
    newMods[index] = updated;
    onChange(newMods);
  };

  const handleRemove = (index: number) => {
    const newMods = modifications.filter((_, i) => i !== index);
    onChange(newMods);
  };

  const handleAdd = () => {
    onChange([...modifications, { action: 'add' as const, rationale: '' }]);
  };

  return (
    <div className="space-y-4">
      {modifications.map((mod, index) => (
        <HerbModificationEditor
          key={`mod-${index}-${mod.action || ''}-${mod.herb_id || ''}`}
          modification={mod}
          onChange={(updated) => handleModificationChange(index, updated)}
          onRemove={() => handleRemove(index)}
          index={index}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-sage-400 hover:text-sage-700 transition"
      >
        + Add Another Herb Modification
      </button>
    </div>
  );
}
