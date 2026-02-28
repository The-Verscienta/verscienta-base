/**
 * Centralized display configuration for decision-making fields.
 * Maps enum values to labels, colors, and optional icons for consistent UI rendering.
 */

export interface FieldConfig {
  label: string;
  bg: string;
  text: string;
  icon?: string;
}

// ---------------------------------------------------------------------------
// HERB MAPS
// ---------------------------------------------------------------------------

export const popularityMap: Record<string, FieldConfig> = {
  staple: { label: 'Staple Herb', bg: 'bg-amber-100', text: 'text-amber-800', icon: '\u2605' },
  common: { label: 'Common', bg: 'bg-sage-100', text: 'text-sage-700' },
  specialty: { label: 'Specialty', bg: 'bg-purple-100', text: 'text-purple-700' },
  rare: { label: 'Rare', bg: 'bg-blue-100', text: 'text-blue-700' },
  obscure: { label: 'Obscure', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const onsetSpeedMap: Record<string, FieldConfig> = {
  fast_acting: { label: 'Fast Acting', bg: 'bg-green-100', text: 'text-green-700', icon: '\u26A1' },
  moderate: { label: 'Moderate Onset', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  cumulative: { label: 'Cumulative', bg: 'bg-blue-100', text: 'text-blue-700' },
};

export const costTierMap: Record<string, FieldConfig> = {
  budget: { label: 'Budget-Friendly', bg: 'bg-green-100', text: 'text-green-700' },
  moderate: { label: 'Moderate Cost', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  premium: { label: 'Premium', bg: 'bg-orange-100', text: 'text-orange-700' },
  expensive: { label: 'Expensive', bg: 'bg-red-100', text: 'text-red-700' },
};

export const palatabilityMap: Record<string, FieldConfig> = {
  pleasant: { label: 'Pleasant', bg: 'bg-green-100', text: 'text-green-700' },
  neutral: { label: 'Neutral', bg: 'bg-gray-100', text: 'text-gray-600' },
  bitter: { label: 'Bitter', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  very_bitter: { label: 'Very Bitter', bg: 'bg-orange-100', text: 'text-orange-700' },
  pungent: { label: 'Pungent', bg: 'bg-red-100', text: 'text-red-700' },
};

export const pregnancySafetyMap: Record<string, FieldConfig> = {
  generally_safe: { label: 'Generally Safe', bg: 'bg-green-100', text: 'text-green-700' },
  use_caution: { label: 'Use Caution', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  avoid: { label: 'Avoid', bg: 'bg-orange-100', text: 'text-orange-700' },
  contraindicated: { label: 'Contraindicated', bg: 'bg-red-100', text: 'text-red-700' },
};

export const lactationSafetyMap: Record<string, FieldConfig> = {
  generally_safe: { label: 'Generally Safe', bg: 'bg-green-100', text: 'text-green-700' },
  use_caution: { label: 'Use Caution', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  avoid: { label: 'Avoid', bg: 'bg-orange-100', text: 'text-orange-700' },
  contraindicated: { label: 'Contraindicated', bg: 'bg-red-100', text: 'text-red-700' },
  insufficient_data: { label: 'Insufficient Data', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const availabilityMap: Record<string, FieldConfig> = {
  widely_available: { label: 'Widely Available', bg: 'bg-green-100', text: 'text-green-700' },
  specialty_stores: { label: 'Specialty Stores', bg: 'bg-blue-100', text: 'text-blue-700' },
  online_only: { label: 'Online Only', bg: 'bg-purple-100', text: 'text-purple-700' },
  hard_to_source: { label: 'Hard to Source', bg: 'bg-orange-100', text: 'text-orange-700' },
  practitioner_only: { label: 'Practitioner Only', bg: 'bg-red-100', text: 'text-red-700' },
};

export const bestSeasonMap: Record<string, FieldConfig> = {
  spring: { label: 'Spring', bg: 'bg-green-100', text: 'text-green-700' },
  summer: { label: 'Summer', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  autumn: { label: 'Autumn', bg: 'bg-orange-100', text: 'text-orange-700' },
  winter: { label: 'Winter', bg: 'bg-blue-100', text: 'text-blue-700' },
  year_round: { label: 'Year-Round', bg: 'bg-sage-100', text: 'text-sage-700' },
};

export const evidenceStrengthMap: Record<string, FieldConfig> = {
  strong: { label: 'Strong Evidence', bg: 'bg-green-100', text: 'text-green-700' },
  moderate: { label: 'Moderate Evidence', bg: 'bg-blue-100', text: 'text-blue-700' },
  preliminary: { label: 'Preliminary', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  traditional_only: { label: 'Traditional Only', bg: 'bg-amber-100', text: 'text-amber-700' },
};

// ---------------------------------------------------------------------------
// FORMULA MAPS
// ---------------------------------------------------------------------------

export const formulaPopularityMap: Record<string, FieldConfig> = {
  classic_staple: { label: 'Classic Staple', bg: 'bg-amber-100', text: 'text-amber-800', icon: '\u2605' },
  commonly_prescribed: { label: 'Commonly Prescribed', bg: 'bg-sage-100', text: 'text-sage-700' },
  specialty: { label: 'Specialty', bg: 'bg-purple-100', text: 'text-purple-700' },
  historical_rare: { label: 'Historical/Rare', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const preparationDifficultyMap: Record<string, FieldConfig> = {
  easy: { label: 'Easy', bg: 'bg-green-100', text: 'text-green-700' },
  moderate: { label: 'Moderate', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { label: 'Advanced', bg: 'bg-orange-100', text: 'text-orange-700' },
  practitioner_only: { label: 'Practitioner Only', bg: 'bg-red-100', text: 'text-red-700' },
};

export const treatmentDurationMap: Record<string, FieldConfig> = {
  acute_short: { label: 'Short-term (Acute)', bg: 'bg-green-100', text: 'text-green-700' },
  weeks: { label: 'Weeks', bg: 'bg-blue-100', text: 'text-blue-700' },
  months: { label: 'Months', bg: 'bg-purple-100', text: 'text-purple-700' },
  seasonal: { label: 'Seasonal', bg: 'bg-orange-100', text: 'text-orange-700' },
  constitutional_long: { label: 'Long-term', bg: 'bg-earth-100', text: 'text-earth-700' },
};

export const formulaCategoryMap: Record<string, FieldConfig> = {
  tonifying: { label: 'Tonifying', bg: 'bg-amber-100', text: 'text-amber-700' },
  clearing_heat: { label: 'Clearing Heat', bg: 'bg-blue-100', text: 'text-blue-700' },
  releasing_exterior: { label: 'Releasing Exterior', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  regulating_qi: { label: 'Regulating Qi', bg: 'bg-sage-100', text: 'text-sage-700' },
  blood_invigorating: { label: 'Blood Invigorating', bg: 'bg-red-100', text: 'text-red-700' },
  phlegm_resolving: { label: 'Phlegm Resolving', bg: 'bg-teal-100', text: 'text-teal-700' },
  digestive: { label: 'Digestive', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  calming: { label: 'Calming', bg: 'bg-purple-100', text: 'text-purple-700' },
  warming_interior: { label: 'Warming Interior', bg: 'bg-orange-100', text: 'text-orange-700' },
  other: { label: 'Other', bg: 'bg-gray-100', text: 'text-gray-600' },
};

// ---------------------------------------------------------------------------
// CONDITION MAPS
// ---------------------------------------------------------------------------

export const selfTreatableMap: Record<string, FieldConfig> = {
  yes: { label: 'Self-Treatable', bg: 'bg-green-100', text: 'text-green-700' },
  with_guidance: { label: 'With Guidance', bg: 'bg-blue-100', text: 'text-blue-700' },
  professional_recommended: { label: 'Professional Recommended', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  professional_required: { label: 'Professional Required', bg: 'bg-red-100', text: 'text-red-700' },
};

export const holisticResponseTimeMap: Record<string, FieldConfig> = {
  days: { label: 'Days', bg: 'bg-green-100', text: 'text-green-700' },
  weeks: { label: 'Weeks', bg: 'bg-blue-100', text: 'text-blue-700' },
  months: { label: 'Months', bg: 'bg-purple-100', text: 'text-purple-700' },
  varies_widely: { label: 'Varies Widely', bg: 'bg-gray-100', text: 'text-gray-600' },
};

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Get display config for a field value from any map.
 * Returns undefined if the value is not found.
 */
export function getFieldConfig(
  map: Record<string, FieldConfig>,
  value: string | undefined | null
): FieldConfig | undefined {
  if (!value) return undefined;
  return map[value];
}

/**
 * Get the display label for a field value from any map.
 * Returns the raw value with underscores replaced if not found in map.
 */
export function getFieldLabel(
  map: Record<string, FieldConfig>,
  value: string | undefined | null
): string {
  if (!value) return '';
  const config = map[value];
  if (config) return config.label;
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
