/**
 * GET /api/formulas/[id]/similar
 * Find formulas similar to the given one based on shared herb composition
 * weighted by dosage proportions. See lib/formula-similarity.ts for algorithm.
 */
import type { APIRoute } from "astro";
import {
  fetchAllFormulasForSimilarity,
  computeSimilarFormulas,
} from "@/lib/formula-similarity";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";

export const GET: APIRoute = async ({ params, request, url }) => {
  const formulaId = params.id;
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`formula:similar:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }),
      { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }

  try {
    const minSimilarity = parseInt(url.searchParams.get("minSimilarity") || "30", 10);
    const maxResults = Math.min(20, parseInt(url.searchParams.get("maxResults") || "8", 10));

    const allFormulas = await fetchAllFormulasForSimilarity();
    const source = allFormulas.find((f) => String(f.id) === formulaId);

    if (!source) {
      return new Response(JSON.stringify({ error: "Formula not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    if (!source.ingredients?.length) {
      return new Response(
        JSON.stringify({ similarFormulas: [], message: "Source formula has no ingredients." }),
        { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    const similarFormulas = computeSimilarFormulas(source, allFormulas, { minSimilarity, maxResults });

    return new Response(
      JSON.stringify({
        similarFormulas,
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
    return new Response(
      JSON.stringify({ error: "Failed to find similar formulas", similarFormulas: [] }),
      { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
