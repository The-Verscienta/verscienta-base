/**
 * Formula similarity — dosage-weighted cosine similarity on ingredient
 * compositions, plus optional Jaccard tiebreaker on shared herbs.
 *
 * Used by both the formula detail page (SSR) and `/api/formulas/[id]/similar`.
 */

import { directus, readItems } from "./directus";
import { cachedFetch, CACHE_TTL } from "./cache";

export interface FormulaIngredient {
  herb_id: { id: number; title?: string; slug?: string } | number | null;
  quantity?: number | string | null;
  unit?: string | null;
  percentage?: number | string | null;
  role?: string | null;
}

export interface FormulaWithIngredients {
  id: number;
  title: string;
  slug?: string;
  chinese_name?: string;
  pinyin_name?: string;
  classic_source?: string;
  ingredients: FormulaIngredient[];
}

export interface SimilarFormula {
  id: number;
  title: string;
  slug?: string;
  chinese_name?: string;
  pinyin_name?: string;
  classic_source?: string;
  /** Combined similarity (0–100). */
  similarity: number;
  /** Cosine similarity on dosage proportions (0–100). */
  cosine: number;
  /** Jaccard similarity on shared herbs (0–100). */
  jaccard: number;
  /** Number of herbs shared with the source formula. */
  sharedCount: number;
  /** Total ingredients in this formula. */
  herbCount: number;
  /** Names of herbs shared with the source formula (truncated). */
  sharedHerbs: string[];
}

/**
 * Cached fetch of every formula plus its ingredients. The full list is needed
 * because similarity is pairwise — we score the source against all candidates.
 */
export async function fetchAllFormulasForSimilarity(): Promise<FormulaWithIngredients[]> {
  return cachedFetch(
    "directus:all-formulas-similarity",
    async () => {
      const formulas = await directus.request(
        readItems("formulas", {
          fields: [
            "id",
            "title",
            "slug",
            "chinese_name",
            "pinyin_name",
            "classic_source",
            "ingredients.herb_id.id",
            "ingredients.herb_id.title",
            "ingredients.herb_id.slug",
            "ingredients.quantity",
            "ingredients.unit",
            "ingredients.percentage",
            "ingredients.role",
          ],
          limit: -1,
        })
      );
      return formulas as unknown as FormulaWithIngredients[];
    },
    CACHE_TTL.FORMULAS_LIST
  );
}

/** Resolve an ingredient row to its herb id regardless of expansion shape. */
function herbIdOf(ing: FormulaIngredient): number | null {
  if (ing == null || ing.herb_id == null) return null;
  return typeof ing.herb_id === "object" ? Number(ing.herb_id.id) : Number(ing.herb_id);
}

/**
 * Composition vector: each herb gets its proportional weight in the formula.
 * Falls back to a uniform 1/n weighting when no quantities are present, so
 * formulas with unfilled dosages still get a sensible signal.
 */
function compositionVector(f: FormulaWithIngredients): Map<number, number> {
  const v = new Map<number, number>();
  if (!Array.isArray(f.ingredients) || f.ingredients.length === 0) return v;

  // Sum quantities, deduping rows that point at the same herb (just in case)
  const quantities = new Map<number, number>();
  let totalQ = 0;
  let anyQuantity = false;
  for (const ing of f.ingredients) {
    const hid = herbIdOf(ing);
    if (hid == null) continue;
    const q = Number(ing.quantity);
    if (Number.isFinite(q) && q > 0) {
      anyQuantity = true;
      quantities.set(hid, (quantities.get(hid) || 0) + q);
      totalQ += q;
    } else {
      // Mark presence so uniform fallback still includes this herb
      if (!quantities.has(hid)) quantities.set(hid, 0);
    }
  }

  if (anyQuantity && totalQ > 0) {
    for (const [hid, q] of quantities) {
      v.set(hid, q / totalQ);
    }
  } else {
    // No quantities at all: uniform weighting
    const n = quantities.size;
    if (n > 0) for (const hid of quantities.keys()) v.set(hid, 1 / n);
  }
  return v;
}

/** Cosine similarity of two non-negative composition vectors. Returns 0–1. */
function cosineSimilarity(a: Map<number, number>, b: Map<number, number>): number {
  let dot = 0;
  let normASq = 0;
  let normBSq = 0;
  for (const va of a.values()) normASq += va * va;
  for (const vb of b.values()) normBSq += vb * vb;
  if (normASq === 0 || normBSq === 0) return 0;
  // Iterate the smaller map for the dot product
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, vs] of smaller) {
    const vl = larger.get(k);
    if (vl !== undefined) dot += vs * vl;
  }
  return dot / Math.sqrt(normASq * normBSq);
}

/** Jaccard similarity of two herb sets. Returns 0–1. */
function jaccardSimilarity(a: Set<number>, b: Set<number>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const k of smaller) if (larger.has(k)) intersection++;
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export interface SimilarOpts {
  /** Minimum combined similarity (0–100) to include. Default 30. */
  minSimilarity?: number;
  /** Max number of results. Default 8. */
  maxResults?: number;
}

/**
 * Score every other formula against the source by combining cosine similarity
 * on dosage proportions (weight 0.7) with Jaccard similarity on herb overlap
 * (weight 0.3). Cosine drives the ranking; Jaccard prevents formulas that
 * happen to share one disproportionately heavy herb from dominating.
 */
export function computeSimilarFormulas(
  source: FormulaWithIngredients,
  candidates: FormulaWithIngredients[],
  opts: SimilarOpts = {}
): SimilarFormula[] {
  const minSimilarity = opts.minSimilarity ?? 30;
  const maxResults = opts.maxResults ?? 8;

  const sourceVec = compositionVector(source);
  const sourceHerbs = new Set(sourceVec.keys());
  if (sourceHerbs.size === 0) return [];

  const sourceTitles = new Map<number, string>();
  for (const ing of source.ingredients || []) {
    const hid = herbIdOf(ing);
    if (hid != null && typeof ing.herb_id === "object" && ing.herb_id?.title) {
      sourceTitles.set(hid, ing.herb_id.title);
    }
  }

  const scored: SimilarFormula[] = [];
  for (const f of candidates) {
    if (!f || f.id === source.id) continue;
    if (!Array.isArray(f.ingredients) || f.ingredients.length === 0) continue;

    const vec = compositionVector(f);
    const herbs = new Set(vec.keys());
    if (herbs.size === 0) continue;

    const cos = cosineSimilarity(sourceVec, vec);
    const jac = jaccardSimilarity(sourceHerbs, herbs);
    const combined = 0.7 * cos + 0.3 * jac;

    const shared: string[] = [];
    for (const hid of sourceHerbs) {
      if (herbs.has(hid)) {
        const title = sourceTitles.get(hid) || `Herb #${hid}`;
        shared.push(title);
      }
    }

    const similarity = Math.round(combined * 100);
    if (similarity < minSimilarity) continue;

    scored.push({
      id: f.id,
      title: f.title,
      slug: f.slug,
      chinese_name: f.chinese_name,
      pinyin_name: f.pinyin_name,
      classic_source: f.classic_source,
      similarity,
      cosine: Math.round(cos * 100),
      jaccard: Math.round(jac * 100),
      sharedCount: shared.length,
      herbCount: herbs.size,
      sharedHerbs: shared,
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, maxResults);
}
