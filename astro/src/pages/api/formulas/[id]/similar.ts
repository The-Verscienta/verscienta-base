/**
 * GET /api/formulas/[id]/similar
 * Find formulas with similar herb compositions via Directus.
 */
import type { APIRoute } from "astro";
import { directus, readItems } from "@/lib/directus";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";
import { cachedFetch, CACHE_TTL } from "@/lib/cache";

interface FormulaWithIngredients {
  id: number;
  title: string;
  slug: string;
  ingredients: Array<{
    id: number;
    herb_id: { id: number; title: string } | number;
    quantity: number;
    unit: string;
    percentage?: number;
    role?: string;
  }>;
}

/**
 * Fetch all formulas with ingredients (cached)
 */
async function fetchAllFormulas(): Promise<FormulaWithIngredients[]> {
  return cachedFetch("directus:all-formulas-ingredients", async () => {
    const formulas = await directus.request(
      readItems("formulas", {
        fields: [
          "id", "title", "slug",
          "ingredients.id", "ingredients.herb_id.id", "ingredients.herb_id.title",
          "ingredients.quantity", "ingredients.unit", "ingredients.percentage", "ingredients.role",
        ],
        limit: -1,
      })
    );
    return formulas as unknown as FormulaWithIngredients[];
  }, CACHE_TTL.FORMULAS_LIST);
}

/**
 * Compute Jaccard-like similarity between two formulas based on shared herbs
 */
function computeSimilarity(a: FormulaWithIngredients, b: FormulaWithIngredients): number {
  const herbsA = new Set(a.ingredients.map((i) => typeof i.herb_id === "object" ? i.herb_id.id : i.herb_id));
  const herbsB = new Set(b.ingredients.map((i) => typeof i.herb_id === "object" ? i.herb_id.id : i.herb_id));

  const intersection = [...herbsA].filter((h) => herbsB.has(h)).length;
  const union = new Set([...herbsA, ...herbsB]).size;

  return union > 0 ? Math.round((intersection / union) * 100) : 0;
}

export const GET: APIRoute = async ({ params, request, url }) => {
  const formulaId = params.id;
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`formula:similar:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const minSimilarity = parseInt(url.searchParams.get("minSimilarity") || "10", 10);
    const maxResults = Math.min(20, parseInt(url.searchParams.get("maxResults") || "8", 10));

    const allFormulas = await fetchAllFormulas();
    const source = allFormulas.find((f) => String(f.id) === formulaId);

    if (!source) {
      return new Response(JSON.stringify({ error: "Formula not found" }), { status: 404, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    if (!source.ingredients?.length) {
      return new Response(JSON.stringify({ similarFormulas: [], message: "Source formula has no ingredients." }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const similarities = allFormulas
      .filter((f) => f.id !== source.id && f.ingredients?.length > 0)
      .map((f) => ({
        id: f.id,
        title: f.title,
        slug: f.slug,
        similarity: computeSimilarity(source, f),
        sharedHerbs: source.ingredients
          .filter((si) => {
            const siHerbId = typeof si.herb_id === "object" ? si.herb_id.id : si.herb_id;
            return f.ingredients.some((fi) => {
              const fiHerbId = typeof fi.herb_id === "object" ? fi.herb_id.id : fi.herb_id;
              return siHerbId === fiHerbId;
            });
          })
          .map((si) => typeof si.herb_id === "object" ? si.herb_id.title : `Herb #${si.herb_id}`),
        herbCount: f.ingredients.length,
      }))
      .filter((f) => f.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    return new Response(
      JSON.stringify({
        similarFormulas: similarities,
        sourceFormulaId: formulaId,
        sourceHerbCount: source.ingredients.length,
        totalFormulasCompared: allFormulas.length - 1,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          ...rlHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error finding similar formulas:", error);
    return new Response(JSON.stringify({ error: "Failed to find similar formulas", similarFormulas: [] }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
