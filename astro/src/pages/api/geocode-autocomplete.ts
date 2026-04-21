/**
 * API Route: Address Autocomplete via Geoapify
 *
 * Proxies to Geoapify's autocomplete endpoint so the API key
 * stays server-side (no CORS/CSP issues for the browser).
 *
 * GET /api/geocode-autocomplete?text=milwau&limit=5
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }) => {
  const text = url.searchParams.get("text");
  const limit = url.searchParams.get("limit") || "5";

  if (!text || text.trim().length < 3) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const cfEnv = (locals as any)?.runtime?.env;
  const apiKey =
    cfEnv?.GEOAPIFY_API_KEY ||
    import.meta.env.GEOAPIFY_API_KEY ||
    (typeof process !== "undefined" ? process.env.GEOAPIFY_API_KEY : undefined);

  if (!apiKey) {
    console.error("GEOAPIFY_API_KEY not set");
    return new Response(JSON.stringify({ results: [] }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const params = new URLSearchParams({
      text: text.trim(),
      apiKey,
      format: "json",
      limit,
      filter: "countrycode:us",
    });

    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
    );

    if (!res.ok) {
      console.error(`Geoapify autocomplete returned ${res.status}`);
      return new Response(JSON.stringify({ results: [] }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const results = (data.results || []).map((r: any) => ({
      formatted: r.formatted,
      lat: r.lat,
      lon: r.lon,
      city: r.city,
      state: r.state,
      postcode: r.postcode,
      country: r.country,
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Autocomplete error:", e);
    return new Response(JSON.stringify({ results: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
