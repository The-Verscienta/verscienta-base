/**
 * Helper functions for working with Drupal data
 */

import type { DrupalTextField } from '@/types/drupal';

/**
 * Extract plain text value from a Drupal text field
 * Handles both string values and {value, format, processed} objects
 */
export function getTextValue(field: DrupalTextField): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.value || '';
}

/**
 * Extract processed HTML from a Drupal text field
 * Falls back to plain value if processed is not available
 */
export function getProcessedValue(field: DrupalTextField): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.processed || field.value || '';
}

/**
 * Format herb display name with optional pinyin in parentheses
 * e.g. herbDisplayName('Asian Ginseng', 'Ren Shen') → 'Asian Ginseng (Ren Shen)'
 */
export function herbDisplayName(title: string, pinyinName?: string | null): string {
  if (pinyinName) return `${title} (${pinyinName})`;
  return title;
}

/**
 * Check if a Drupal text field has content
 */
export function hasTextContent(field: DrupalTextField): boolean {
  if (!field) return false;
  if (typeof field === 'string') return field.length > 0;
  return Boolean(field.value);
}
