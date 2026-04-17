/**
 * GET /api/search?q=query&type=herb&limit=20
 * Server-side search proxy to MeiliSearch.
 * Used for SEO-friendly search results and server-rendered pages.
 * The client-side InstantSearch UI talks to MeiliSearch directly.
 */
import type { APIRoute } from "astro";
import { MeiliSearch } from "meilisearch";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

const MEILI_URL = import.meta.env.PUBLIC_MEILI_URL || "http://localhost:7700";
const MEILI_KEY = import.meta.env.PUBLIC_MEILI_SEARCH_KEY || import.meta.env.MEILI_MASTER_KEY;

export const GET: APIRoute = async ({ request, url }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`search:${identifier}`, RATE_LIMITS.search);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const query = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type");
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10));
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ hits: [], totalHits: 0, query }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const client = new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_KEY });
    const index = client.index("verscienta_all");

    const filters = type ? `type = "${type}"` : undefined;

    const results = await index.search(query, {
      limit,
      offset,
      filter: filters,
      attributesToHighlight: ["title", "description", "scientific_name"],
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
    });

    return new Response(
      JSON.stringify({
        hits: results.hits,
        totalHits: results.estimatedTotalHits,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          ...rlHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: "Search failed", hits: [], totalHits: 0 }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
