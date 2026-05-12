/**
 * POST /api/grok/formula-constructor
 *
 * GATED: Professional Access + Administrator only.
 * Constructs a custom herbal formula for a patient case.
 */
import type { APIRoute } from "astro";
import { constructFormula } from "@/lib/grok";
import { getAiEnv, hasAiKey } from "@/lib/env";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { validateCsrfToken } from "@/lib/csrf";
import { constructFormulaSchema, formatZodErrors } from "@/lib/validation";
import { getAuthedUser, userHasAccess, gatedResponse } from "@/lib/auth-server";
import { directus, readItems } from "@/lib/directus";

interface HerbRow {
  title?: string;
  scientific_name?: string;
  pinyin_name?: string;
  traditions?: string[] | null;
}

type Tradition = "TCM" | "Western" | "Ayurvedic" | "Integrative";

/** Map the prompt-facing tradition name to the herbs.traditions tag value. */
const TRADITION_TAG: Record<Tradition, string | null> = {
  TCM: "tcm",
  Western: "western",
  Ayurvedic: "ayurvedic",
  // Integrative is a deliberate cross-tradition mix — no narrowing.
  Integrative: null,
};

/**
 * True if the herb is tagged for the requested tradition. A herb without
 * any `traditions` tag is excluded — tagging is the single source of truth.
 *
 * Filtering happens in-process because Directus 11 rejects `_contains` on
 * `json` columns (INVALID_QUERY).
 */
function herbMatchesTradition(h: HerbRow, tradition: Tradition): boolean {
  if (tradition === "Integrative") return true;
  const tag = TRADITION_TAG[tradition];
  if (!tag) return false;
  const tags = Array.isArray(h.traditions) ? h.traditions : [];
  return tags.includes(tag);
}

/**
 * Fetch the catalog of herbs the AI is allowed to choose from. Returns a
 * deduplicated list of canonical names; the AI is told to pick only from
 * this list. Falls back to an empty array on error so the endpoint stays up.
 *
 * For TCM the pinyin name is included in the display string so the model can
 * reference herbs by their standard TCM nomenclature.
 */
async function fetchAvailableHerbs(tradition: Tradition): Promise<string[]> {
  try {
    const items = (await directus.request(
      readItems("herbs", {
        fields: ["title", "scientific_name", "pinyin_name", "traditions"],
        filter: { status: { _eq: "published" } },
        sort: ["title"],
        limit: -1,
      })
    )) as HerbRow[];

    const names = new Set<string>();
    for (const h of items) {
      if (!herbMatchesTradition(h, tradition)) continue;
      const base = h.title || h.scientific_name;
      if (!base) continue;
      const parts: string[] = [base];
      if (h.scientific_name && h.scientific_name !== base) parts.push(`(${h.scientific_name})`);
      if (tradition === "TCM" && h.pinyin_name) parts.push(`[${h.pinyin_name}]`);
      names.add(parts.join(" ").trim());
    }
    return Array.from(names).slice(0, 2000);
  } catch (err) {
    console.error("fetchAvailableHerbs failed:", err);
    return [];
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const csrf = validateCsrfToken(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`grok:formula:${identifier}`, RATE_LIMITS.ai);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const user = await getAuthedUser(request, locals);
  if (!user) return gatedResponse("auth", rlHeaders);
  if (!userHasAccess(user, "professional")) return gatedResponse("upgrade", rlHeaders);

  try {
    const body = await request.json();
    const parsed = constructFormulaSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", errors: formatZodErrors(parsed.error) }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    const env = getAiEnv(locals);
    if (!hasAiKey(env)) {
      return new Response(JSON.stringify({ error: "AI service is not configured.", isConfigError: true }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...rlHeaders },
      });
    }

    // Constrain the AI to our published herb catalog, pre-filtered by tradition.
    // Client-supplied availableHerbs (e.g. dispensary subset) is intersected
    // with the catalog so it can narrow further but never escape it.
    const catalog = await fetchAvailableHerbs(parsed.data.tradition);
    let availableHerbs = catalog;
    if (parsed.data.availableHerbs?.length && catalog.length) {
      const norm = (s: string) => s.toLowerCase();
      const catalogSet = new Set(catalog.map(norm));
      availableHerbs = parsed.data.availableHerbs.filter((h) => catalogSet.has(norm(h)));
    }

    if (!availableHerbs.length) {
      return new Response(
        JSON.stringify({
          error: `No published herbs found for the ${parsed.data.tradition} tradition.`,
        }),
        { status: 503, headers: { "Content-Type": "application/json", ...rlHeaders } }
      );
    }

    const formula = await constructFormula({ ...parsed.data, availableHerbs }, env);
    return new Response(JSON.stringify({ formula }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  } catch (error) {
    console.error("Formula constructor error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    const isAPIError = message.includes("Grok API error");
    return new Response(
      JSON.stringify({ error: isAPIError ? "AI service is temporarily unavailable." : "Failed to construct formula." }),
      { status: isAPIError ? 503 : 500, headers: { "Content-Type": "application/json", ...rlHeaders } }
    );
  }
};
