/**
 * Formula similarity: shared herbs + proportions, with optional TCM role weighting.
 */

import type { HerbIngredient, HerbRole } from '@/types/drupal';

export interface FormulaSimilarityResult {
  formulaId: string;
  formulaTitle: string;
  similarityScore: number;
  sharedHerbCount: number;
  totalHerbsInComparison: number;
  sharedHerbs: SharedHerb[];
  /** Strong = high confidence overlap; moderate = weaker algorithmic match */
  matchTier: 'strong' | 'moderate';
}

export interface SharedHerb {
  herbId: string;
  herbTitle: string;
  percentageInSource: number;
  percentageInTarget: number;
}

export const SIMILARITY_STRONG_THRESHOLD = 42;

interface NormalizedIngredient {
  id: string;
  title: string;
  percentage: number;
}

/** Emphasize Jun/Chen overlap vs assistant/envoy when comparing proportions. */
export function getRoleMultiplier(role?: HerbRole): number {
  switch (role) {
    case 'chief':
      return 1.45;
    case 'deputy':
      return 1.25;
    case 'assistant':
      return 1.05;
    case 'envoy':
      return 0.95;
    default:
      return 1;
  }
}

/**
 * Normalize ingredients to percentages for display / Jaccard herb sets.
 */
function normalizeIngredients(
  ingredients: HerbIngredient[],
  totalWeight?: number
): NormalizedIngredient[] {
  const total = totalWeight || ingredients.reduce((sum, i) => sum + (i.field_quantity || 0), 0);

  if (total === 0) {
    const equalPercentage = 100 / ingredients.length;
    return ingredients.map((i) => ({
      id: i.id,
      title: i.title,
      percentage: equalPercentage,
    }));
  }

  return ingredients.map((i) => ({
    id: i.id,
    title: i.title,
    percentage: i.field_percentage || ((i.field_quantity || 0) / total) * 100,
  }));
}

/**
 * Role-weighted percentages, renormalized to sum 100 for cosine similarity.
 */
function normalizeIngredientsForCosine(
  ingredients: HerbIngredient[],
  totalWeight?: number | undefined
): NormalizedIngredient[] {
  const base = normalizeIngredients(ingredients, totalWeight);
  const idToRole = new Map(ingredients.map((i) => [i.id, i.field_role]));

  let weighted = base.map((row) => {
    const mult = getRoleMultiplier(idToRole.get(row.id));
    return { ...row, percentage: row.percentage * mult };
  });

  const sum = weighted.reduce((s, i) => s + i.percentage, 0);
  if (sum <= 0) {
    const eq = 100 / weighted.length;
    weighted = weighted.map((w) => ({ ...w, percentage: eq }));
  } else {
    weighted = weighted.map((w) => ({ ...w, percentage: (w.percentage / sum) * 100 }));
  }

  return weighted;
}

function calculateJaccardSimilarity(herbsA: Set<string>, herbsB: Set<string>): number {
  const intersection = new Set([...herbsA].filter((x) => herbsB.has(x)));
  const union = new Set([...herbsA, ...herbsB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function calculateWeightedSimilarity(
  normalizedA: NormalizedIngredient[],
  normalizedB: NormalizedIngredient[]
): number {
  const mapA = new Map(normalizedA.map((i) => [i.id, i.percentage]));
  const mapB = new Map(normalizedB.map((i) => [i.id, i.percentage]));

  const sharedIds = [...mapA.keys()].filter((id) => mapB.has(id));

  if (sharedIds.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const id of sharedIds) {
    const pctA = mapA.get(id) || 0;
    const pctB = mapB.get(id) || 0;
    dotProduct += pctA * pctB;
  }

  for (const pctA of mapA.values()) {
    magnitudeA += pctA * pctA;
  }

  for (const pctB of mapB.values()) {
    magnitudeB += pctB * pctB;
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

export interface SimilarityCalculationOptions {
  /** When true (default), Jun/Chen herbs count more in the proportion similarity term */
  useRoleWeights?: boolean;
}

/**
 * Calculate overall similarity between two formulas
 * Combines Jaccard (set overlap) and weighted (proportion) similarity
 */
export function calculateFormulaSimilarity(
  sourceIngredients: HerbIngredient[],
  sourceTotalWeight: number | undefined,
  targetIngredients: HerbIngredient[],
  targetTotalWeight: number | undefined,
  options: SimilarityCalculationOptions = {}
): { score: number; sharedHerbs: SharedHerb[] } {
  const { useRoleWeights = true } = options;

  if (!sourceIngredients.length || !targetIngredients.length) {
    return { score: 0, sharedHerbs: [] };
  }

  const normalizedSourcePlain = normalizeIngredients(sourceIngredients, sourceTotalWeight);
  const normalizedTargetPlain = normalizeIngredients(targetIngredients, targetTotalWeight);

  const sourceHerbIds = new Set(normalizedSourcePlain.map((i) => i.id));
  const targetHerbIds = new Set(normalizedTargetPlain.map((i) => i.id));

  const jaccardScore = calculateJaccardSimilarity(sourceHerbIds, targetHerbIds);

  const srcCos = useRoleWeights
    ? normalizeIngredientsForCosine(sourceIngredients, sourceTotalWeight)
    : normalizedSourcePlain;
  const tgtCos = useRoleWeights
    ? normalizeIngredientsForCosine(targetIngredients, targetTotalWeight)
    : normalizedTargetPlain;

  const weightedScore = calculateWeightedSimilarity(srcCos, tgtCos);

  const combinedScore = (jaccardScore * 0.5 + weightedScore * 0.5) * 100;

  const sourceMap = new Map(normalizedSourcePlain.map((i) => [i.id, i]));
  const targetMap = new Map(normalizedTargetPlain.map((i) => [i.id, i]));

  const sharedHerbs: SharedHerb[] = [];
  for (const [id, sourceHerb] of sourceMap) {
    const targetHerb = targetMap.get(id);
    if (targetHerb) {
      sharedHerbs.push({
        herbId: id,
        herbTitle: sourceHerb.title,
        percentageInSource: Math.round(sourceHerb.percentage * 10) / 10,
        percentageInTarget: Math.round(targetHerb.percentage * 10) / 10,
      });
    }
  }

  sharedHerbs.sort((a, b) => b.percentageInSource - a.percentageInSource);

  return {
    score: Math.round(combinedScore * 10) / 10,
    sharedHerbs,
  };
}

function effectiveMinSharedHerbs(
  configured: number,
  sourceCount: number,
  targetCount: number
): number {
  const cap = Math.min(sourceCount, targetCount);
  return Math.max(1, Math.min(configured, cap));
}

/**
 * Find similar formulas from a list
 * Returns formulas sorted by similarity score (highest first)
 */
export function findSimilarFormulas(
  sourceFormula: {
    id: string;
    ingredients: HerbIngredient[];
    totalWeight?: number;
  },
  allFormulas: Array<{
    id: string;
    title: string;
    ingredients: HerbIngredient[];
    totalWeight?: number;
  }>,
  options: {
    minSimilarity?: number;
    maxResults?: number;
    /** Require at least this many shared herbs when formula sizes allow (default 2) */
    minSharedHerbs?: number;
    useRoleWeights?: boolean;
  } = {}
): FormulaSimilarityResult[] {
  const {
    minSimilarity = 10,
    maxResults = 10,
    minSharedHerbs = 2,
    useRoleWeights = true,
  } = options;

  const results: FormulaSimilarityResult[] = [];

  for (const formula of allFormulas) {
    if (formula.id === sourceFormula.id) continue;

    const { score, sharedHerbs } = calculateFormulaSimilarity(
      sourceFormula.ingredients,
      sourceFormula.totalWeight,
      formula.ingredients,
      formula.totalWeight,
      { useRoleWeights }
    );

    const needShared = effectiveMinSharedHerbs(
      minSharedHerbs,
      sourceFormula.ingredients.length,
      formula.ingredients.length
    );

    if (score >= minSimilarity && sharedHerbs.length >= needShared) {
      const uniqueHerbCount = new Set([
        ...sourceFormula.ingredients.map((i) => i.id),
        ...formula.ingredients.map((i) => i.id),
      ]).size;

      results.push({
        formulaId: formula.id,
        formulaTitle: formula.title,
        similarityScore: score,
        sharedHerbCount: sharedHerbs.length,
        totalHerbsInComparison: uniqueHerbCount,
        sharedHerbs,
        matchTier: score >= SIMILARITY_STRONG_THRESHOLD ? 'strong' : 'moderate',
      });
    }
  }

  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results.slice(0, maxResults);
}

/**
 * Get a human-readable similarity description
 */
export function getSimilarityLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: 'Very Similar', color: 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/40' };
  }
  if (score >= 60) {
    return { label: 'Similar', color: 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/40' };
  }
  if (score >= 40) {
    return { label: 'Moderately Similar', color: 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40' };
  }
  if (score >= 20) {
    return { label: 'Somewhat Similar', color: 'text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-900/40' };
  }
  return { label: 'Low Similarity', color: 'text-gray-700 bg-gray-100 dark:text-earth-200 dark:bg-earth-800' };
}
