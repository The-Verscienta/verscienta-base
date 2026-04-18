/**
 * API Route: Geocode via Geoapify
 *
 * Calls Geoapify server-side so the API key stays hidden
 * and the browser only talks to the same origin (no CORS/CSP issues).
 *
 * GET /api/geocode?text=53216
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }) => {
  const text = url.searchParams.get("text");

  if (!text || text.trim().length < 2) {
    return new Response(JSON.stringify({ result: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Cloudflare Pages: runtime env is on locals.runtime.env
  // Node/standalone: import.meta.env or process.env
  const cfEnv = (locals as any)?.runtime?.env;
  const apiKey = cfEnv?.GEOAPIFY_API_KEY || import.meta.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.error("GEOAPIFY_API_KEY not set");
    return new Response(JSON.stringify({ result: null, error: "Geocoding not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const params = new URLSearchParams({
      text: text.trim(),
      apiKey,
      format: "json",
      limit: "1",
    });

    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);

    if (!res.ok) {
      console.error(`Geoapify returned ${res.status}`);
      return new Response(JSON.stringify({ result: null }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const r = data.results?.[0];

    if (!r) {
      return new Response(JSON.stringify({ result: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        result: {
          formatted: r.formatted,
          lat: r.lat,
          lon: r.lon,
          city: r.city,
          state: r.state,
          country: r.country,
          postcode: r.postcode,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Geocode error:", e);
    return new Response(JSON.stringify({ result: null }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
