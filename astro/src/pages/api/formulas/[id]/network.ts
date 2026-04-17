/**
 * GET /api/formulas/[id]/network
 * Build a formula network graph via shared herbs from Directus.
 */
import type { APIRoute } from "astro";
import { directus, readItems, readItem } from "@/lib/directus";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from "@/lib/rate-limit";

interface NetworkNode {
  id: string;
  label: string;
  type: "current" | "related";
}

interface NetworkLink {
  source: string;
  target: string;
  label: string;
}

export const GET: APIRoute = async ({ params, request }) => {
  const formulaId = params.id!;
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`formula:network:${identifier}`, RATE_LIMITS.api);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }

  try {
    // 1. Fetch the current formula with its herb ingredients
    const formula = await directus.request(
      readItem("formulas", formulaId, {
        fields: [
          "id", "title",
          "ingredients.herb_id.id", "ingredients.herb_id.title",
        ],
      })
    ) as any;

    if (!formula) {
      return new Response(JSON.stringify({ nodes: [], links: [] }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    const herbIds = (formula.ingredients || [])
      .map((i: any) => i.herb_id?.id)
      .filter(Boolean);

    const herbNames = new Map<number, string>();
    for (const ing of formula.ingredients || []) {
      if (ing.herb_id?.id && ing.herb_id?.title) {
        herbNames.set(ing.herb_id.id, ing.herb_id.title);
      }
    }

    if (herbIds.length === 0) {
      return new Response(JSON.stringify({ nodes: [], links: [] }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    // 2. Find other formulas containing these herbs
    const relatedFormulas = new Map<number, { title: string; herbs: string[] }>();

    // Fetch all formula_ingredients that reference any of our herbs
    const relatedIngredients = await directus.request(
      readItems("formula_ingredients", {
        fields: ["formula_id.id", "formula_id.title", "herb_id.id", "herb_id.title"],
        filter: {
          herb_id: { _in: herbIds },
          formula_id: { _neq: parseInt(formulaId) },
        },
        limit: 200,
      })
    ) as any[];

    for (const ing of relatedIngredients) {
      const fId = ing.formula_id?.id;
      const fTitle = ing.formula_id?.title;
      const herbName = ing.herb_id?.title || `Herb #${ing.herb_id?.id}`;

      if (!fId) continue;
      if (!relatedFormulas.has(fId)) {
        relatedFormulas.set(fId, { title: fTitle || "Formula", herbs: [] });
      }
      relatedFormulas.get(fId)!.herbs.push(herbName);
    }

    // Sort by most shared herbs, limit to top 20
    const sortedRelated = [...relatedFormulas.entries()]
      .sort((a, b) => b[1].herbs.length - a[1].herbs.length)
      .slice(0, 20);

    if (sortedRelated.length < 2) {
      return new Response(JSON.stringify({ nodes: [], links: [] }), { status: 200, headers: { "Content-Type": "application/json", ...rlHeaders } });
    }

    // 3. Build graph
    const nodes: NetworkNode[] = [
      { id: formulaId, label: formula.title || "This Formula", type: "current" },
      ...sortedRelated.map(([id, { title }]) => ({ id: String(id), label: title, type: "related" as const })),
    ];

    const links: NetworkLink[] = sortedRelated.map(([id, { herbs }]) => ({
      source: formulaId,
      target: String(id),
      label: herbs.slice(0, 2).join(", "),
    }));

    return new Response(
      JSON.stringify({ nodes, links }),
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
    console.error("Error fetching formula network:", error);
    return new Response(JSON.stringify({ nodes: [], links: [], error: "Failed to fetch formula network" }), { status: 500, headers: { "Content-Type": "application/json", ...rlHeaders } });
  }
};
