/**
 * GET /api/rxnorm/autocomplete?q=warfa&limit=8
 *
 * Server-side proxy to RxNorm's `getApproximateMatch` endpoint
 * (https://rxnav.nlm.nih.gov/REST/approximateTerm.json). Returns deduplicated
 * canonical drug names suitable for an autocomplete dropdown.
 *
 * RxNorm is free and CORS-friendly, but proxying lets us:
 *   - Apply our rate limiting / abuse protection
 *   - Add per-server caching (RxNorm vocabulary changes monthly at most)
 *   - Filter the response to a clean list of names
 */
import type { APIRoute } from "astro";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { cachedFetch, CACHE_TTL } from "@/lib/cache";

interface RxNormCandidate {
  rxcui: string;
  rxaui: string;
  score: string;
  rank: string;
  name?: string;
  source?: string;
}

interface ApproximateGroup {
  approximateGroup?: {
    candidate?: RxNormCandidate[];
  };
}

interface RxConceptProperties {
  propConceptGroup?: {
    propConcept?: Array<{ propName?: string; propValue?: string }>;
  };
}

async function fetchCanonicalName(rxcui: string): Promise<string | null> {
  // NB: rxnav has a `/rxcui/{rxcui}/property.json?propName=RxNorm Name` endpoint
  return cachedFetch(
    `rxnorm:name:${rxcui}`,
    async () => {
      try {
        const r = await fetch(
          `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/property.json?propName=RxNorm%20Name`
        );
        if (!r.ok) return null;
        const data = (await r.json()) as RxConceptProperties;
        const props = data.propConceptGroup?.propConcept || [];
        const name = props.find((p) => p.propName === "RxNorm Name")?.propValue;
        return name || null;
      } catch {
        return null;
      }
    },
    CACHE_TTL.FORMULAS_LIST // long-ish — vocabulary is stable
  );
}

export const GET: APIRoute = async ({ request, url }) => {
  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`rxnorm:${identifier}`, RATE_LIMITS.search);
  const rlHeaders = createRateLimitHeaders(rl);

  if (!rl.success) {
    return new Response(JSON.stringify({ error: "Too many requests", retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  const query = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(15, Math.max(1, parseInt(url.searchParams.get("limit") || "8", 10)));

  if (query.length < 2) {
    return new Response(JSON.stringify({ query, results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }

  try {
    const data = await cachedFetch(
      `rxnorm:approx:${query.toLowerCase()}:${limit}`,
      async () => {
        const r = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=${limit}`
        );
        if (!r.ok) throw new Error(`RxNorm returned ${r.status}`);
        return (await r.json()) as ApproximateGroup;
      },
      300 // 5 min — autocompletes are hot
    );

    const candidates = data.approximateGroup?.candidate || [];
    // Best candidate per RxCUI (lowest rank wins)
    const byRxcui = new Map<string, RxNormCandidate>();
    for (const c of candidates) {
      const existing = byRxcui.get(c.rxcui);
      if (!existing || Number(c.rank) < Number(existing.rank)) byRxcui.set(c.rxcui, c);
    }

    // Resolve canonical names in parallel (cached, so cheap on repeat queries)
    const results = await Promise.all(
      Array.from(byRxcui.values())
        .sort((a, b) => Number(a.rank) - Number(b.rank))
        .slice(0, limit)
        .map(async (c) => {
          const name = (await fetchCanonicalName(c.rxcui)) || c.name || null;
          return name ? { rxcui: c.rxcui, name, score: Number(c.score) } : null;
        })
    );

    // Dedupe by case-insensitive name, preserve order
    const seen = new Set<string>();
    const unique = results
      .filter((r): r is { rxcui: string; name: string; score: number } => r !== null)
      .filter((r) => {
        const k = r.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    return new Response(JSON.stringify({ query, results: unique }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ...rlHeaders,
      },
    });
  } catch (error) {
    console.error("RxNorm autocomplete error:", error);
    return new Response(JSON.stringify({ query, results: [], error: "Drug lookup unavailable" }), {
      status: 200, // soft-fail — autocomplete should never break the form
      headers: { "Content-Type": "application/json", ...rlHeaders },
    });
  }
};
