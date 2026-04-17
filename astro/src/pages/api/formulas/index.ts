/**
 * GET /api/formulas
 * Lightweight formula list for client-side matching (e.g., symptom checker deep links).
 * Fetches from Directus instead of Drupal JSON:API.
 */
import type { APIRoute } from "astro";
import { directus, readItems } from "@/lib/directus";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

export const GET: APIRoute = async ({ request }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`formulas:list:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    const formulas = await directus.request(
      readItems("formulas", {
        fields: ["id", "title", "slug", "chinese_name", "pinyin_name"],
        sort: ["title"],
        limit: -1, // All formulas
      })
    );

    return new Response(
      JSON.stringify({ formulas, total: formulas.length }),
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
    console.error("Error fetching formulas:", error);
    return new Response(JSON.stringify({ formulas: [], total: 0, error: "Failed to fetch formulas" }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
